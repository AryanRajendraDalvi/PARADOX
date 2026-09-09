#!/usr/bin/env python3
"""
validate_events.py — checks simulation_events.json (NDJSON) against the
schema in simulation_events_schema.md.

Usage:
    python3 validate_events.py path/to/simulation_events.json
"""
import json
import sys
from collections import Counter

VALID_PAULI = {"I", "X", "Y", "Z", None}
VALID_PHASES = {"ghz_distribution", "signing", "verification", "decoy_test", "mermin_test"}
VALID_FLAGS = {"decoy_qber_exceeded", "cefb_exceeded", "hardware_integrity_failure", "replay_detected", "mac_verification_failure"}
VALID_VERDICTS = {"ACCEPT", "REJECT"}
VALID_STATUS = {"PROVISIONAL", "CONFIRMED", "DISPUTED"}


def validate(path):
    errors = []
    warnings = []
    rows = []

    with open(path, "r", newline="") as f:
        for i, raw_line in enumerate(f, 1):
            if "\r\n" in raw_line or raw_line.endswith("\r"):
                warnings.append(f"line {i}: CRLF line ending found (expected LF)")
            line = raw_line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                errors.append(f"line {i}: invalid JSON ({e})")
                continue
            rows.append((i, obj))

    if not rows:
        errors.append("no valid rows found")
        return errors, warnings

    for i, r in rows:
        if r.get("type") != "ROUND_UPDATE":
            errors.append(f"line {i}: missing or wrong 'type' field (expected 'ROUND_UPDATE')")

        phase = r.get("phase")
        if phase not in VALID_PHASES:
            errors.append(f"line {i}: invalid phase '{phase}'")

        batch_id = r.get("batch_id")
        if batch_id == 0:
            errors.append(f"line {i}: batch_id is 0 (sentinel) — should be null")

        bob = r.get("parties", {}).get("bob", {})
        corr = bob.get("correction_applied")
        if corr not in VALID_PAULI:
            errors.append(f"line {i}: invalid correction_applied '{corr}' (must be I/X/Y/Z/null)")

        charlie = r.get("parties", {}).get("charlie", {})
        if charlie.get("outcome") == -1:
            errors.append(f"line {i}: charlie.outcome is -1 (sentinel) — should be null with measured=false")
        if charlie.get("outcome") is None and charlie.get("measured") is not False:
            warnings.append(f"line {i}: charlie.outcome is null but measured != false")

        checks = r.get("checks", {})
        mermin = checks.get("mermin_value")
        if phase == "mermin_test":
            if mermin is None:
                errors.append(f"line {i}: phase is mermin_test but mermin_value is null")
        else:
            if mermin is not None:
                errors.append(f"line {i}: mermin_value set ({mermin}) on non-mermin_test round (phase={phase})")

        flags = r.get("event_flags", [])
        for fl in flags:
            if fl not in VALID_FLAGS:
                errors.append(f"line {i}: unrecognized event_flag '{fl}'")
            if fl == "hardware_integrity_failure" and phase != "mermin_test":
                errors.append(f"line {i}: hardware_integrity_failure flagged on non-mermin_test round")
            if fl == "decoy_qber_exceeded" and phase != "decoy_test":
                errors.append(f"line {i}: decoy_qber_exceeded flagged on non-decoy_test round (phase={phase})")
            if fl == "cefb_exceeded" and phase != "verification":
                errors.append(f"line {i}: cefb_exceeded flagged on non-verification round (phase={phase})")

        # Rate/probability bounds - decoy_qber and mismatch_rate must be valid probabilities
        decoy_qber = checks.get("decoy_qber")
        if decoy_qber is not None and not (0.0 <= decoy_qber <= 1.0):
            errors.append(f"line {i}: decoy_qber out of [0,1] range: {decoy_qber}")
        mismatch_rate = checks.get("mismatch_rate")
        if mismatch_rate is not None and not (0.0 <= mismatch_rate <= 1.0):
            errors.append(f"line {i}: mismatch_rate out of [0,1] range: {mismatch_rate}")

        if mermin is not None and not (-4.0 <= mermin <= 4.0):
            errors.append(f"line {i}: mermin_value out of [-4.0, 4.0] bounds: {mermin}")

        audit = r.get("audit", {})
        merkle_root = audit.get("merkle_root")
        if merkle_root is not None and (not isinstance(merkle_root, str) or len(merkle_root) != 64):
            errors.append(f"line {i}: merkle_root must be null or a 64-char hex string")
        
        batch_committed = audit.get("batch_committed")
        if not isinstance(batch_committed, bool):
            errors.append(f"line {i}: batch_committed must be boolean")

        auth = r.get("auth", {})
        mac_verified = auth.get("mac_verified")
        if not isinstance(mac_verified, bool):
            errors.append(f"line {i}: mac_verified must be boolean")
        
        mac_tag = auth.get("mac_tag")
        if not isinstance(mac_tag, str):
            errors.append(f"line {i}: mac_tag must be a string")

        verdict = r.get("verdict")
        if verdict not in VALID_VERDICTS:
            errors.append(f"line {i}: invalid verdict '{verdict}'")

        status = r.get("status")
        if status not in VALID_STATUS:
            errors.append(f"line {i}: invalid status '{status}'")

    # Aggregate sanity checks
    n = len(rows)
    
    # Check mac_tag uniqueness
    mac_tags = [r.get("auth", {}).get("mac_tag") for _, r in rows]
    if len(mac_tags) != len(set(mac_tags)):
        errors.append(f"AGGREGATE: mac_tag values are not unique! {len(mac_tags)} rows but {len(set(mac_tags))} unique tags.")

    # Check batch_committed timing
    batch_committed_rounds = [r.get("round_id") for _, r in rows if r.get("audit", {}).get("batch_committed")]
    if batch_committed_rounds:
        diffs = [batch_committed_rounds[i] - batch_committed_rounds[i-1] for i in range(1, len(batch_committed_rounds))]
        if diffs and len(set(diffs)) > 1:
            errors.append(f"AGGREGATE: batch_committed is not consistently periodic. Intervals found: {set(diffs)}")

    honest_rows = [r for _, r in rows if not r.get("attack", {}).get("active", False)]
    if honest_rows:
        honest_rejects = sum(1 for r in honest_rows if r.get("verdict") == "REJECT")
        reject_rate = honest_rejects / len(honest_rows)
        if reject_rate > 0.10:
            errors.append(
                f"AGGREGATE: HONEST REJECT rate is {reject_rate:.1%} ({honest_rejects}/{len(honest_rows)}) "
                f"- expected near the configured delta for a zero-noise, no-attack run."
            )

    mermin_test_count = sum(1 for _, r in rows if r.get("phase") == "mermin_test")
    mermin_nonnull_count = sum(1 for _, r in rows if r.get("checks", {}).get("mermin_value") is not None)
    if mermin_test_count != mermin_nonnull_count:
        errors.append(
            f"AGGREGATE: {mermin_nonnull_count} rows have non-null mermin_value but only "
            f"{mermin_test_count} rows are phase=mermin_test — these must match exactly."
        )

    status_counts = Counter(r.get("status") for _, r in rows)
    if len(status_counts) == 1:
        warnings.append(
            f"AGGREGATE: status field never varies (all '{next(iter(status_counts))}') — "
            f"confirm this is documented as intentional (see schema §4.7)"
        )

    return errors, warnings


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 validate_events.py path/to/simulation_events.json")
        sys.exit(1)

    path = sys.argv[1]
    errors, warnings = validate(path)

    print(f"Validated: {path}\n")

    if warnings:
        print(f"WARNINGS ({len(warnings)}):")
        for w in warnings[:30]:
            print(f"  - {w}")
        if len(warnings) > 30:
            print(f"  ... and {len(warnings) - 30} more")
        print()

    if errors:
        print(f"ERRORS ({len(errors)}) — file is NOT ready to hand off:")
        for e in errors[:50]:
            print(f"  - {e}")
        if len(errors) > 50:
            print(f"  ... and {len(errors) - 50} more")
        sys.exit(1)
    else:
        print("PASS — no schema violations found.")
        sys.exit(0)


if __name__ == "__main__":
    main()
