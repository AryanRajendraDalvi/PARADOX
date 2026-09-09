# `simulation_events.json` — Schema & Validation Checklist
### For Person 1 to hand off to Person 2 (attacks) and Person 3 (frontend)

---

## 1. File format

- **NDJSON** — one JSON object per line, not a single JSON array. This matches the WebSocket contract directly: each line is exactly what gets broadcast as one `ROUND_UPDATE` message, so the mock/real server can replay the file line-by-line with no transformation.
- **Line endings: LF only** (`\n`), not CRLF (`\r\n`) — avoids noisy cross-platform diffs.
- Every line must be independently valid JSON (no trailing commas, no comments).

---

## 2. Required envelope

Every line must include the message-type wrapper, since the same socket carries other message types (attack triggers) in the other direction and clients need to discriminate:

```json
{ "type": "ROUND_UPDATE", ... rest of the object ... }
```

---

## 3. Field-by-field schema

```
type              string   — always "ROUND_UPDATE" for this file
round_id          integer  — unique, sequential, starts at 1
batch_id          integer | null
                            — null for rounds that don't belong to a GHZ batch
                              (do not use 0 as a "no batch" sentinel — use null)
batch_type        string   — "SIGNING" | "TEST"
phase             string   — "ghz_distribution" | "signing" | "verification"
                              | "decoy_test" | "mermin_test"
                              (note: "decoy_test" is a required addition —
                               see §4.3)

parties.alice.measured        bool
parties.alice.basis           string  — "bell"
parties.alice.outcome_bits    [int, int]

parties.bob.measured          bool
parties.bob.basis             string  — "Z" | "X" | "Y"
parties.bob.correction_applied  string | null
                              — ONLY "I" | "X" | "Y" | "Z" on phase == "signing"
                                or "verification" rounds; null on
                                "decoy_test" / "mermin_test" rounds.
                                Never "decoy", "mermin", or any label
                                with a stray factor like "iY".
parties.bob.outcome           int (0 | 1)

parties.charlie.measured      bool  — false on decoy/non-participating rounds
parties.charlie.basis         string | null
parties.charlie.outcome       int (0 | 1) | null
                              — null when measured == false.
                                Never use -1 as a sentinel.

checks.decoy_qber         float, 0.0–1.0
checks.mismatch_rate      float, 0.0–1.0
checks.tau_hoeffding      float — must be present only where meaningful
                            for that round's check type
checks.tau_cefb           float — must be monotonically non-increasing
                            as n (round count within the relevant series)
                            grows, per §4.2's formula. A value that jumps
                            up after already having a larger n is a bug.
checks.mermin_value       float | null
                            — MUST be null on any round where
                              phase != "mermin_test". Never a stale/
                              sentinel value like -1.0 carried over from
                              a previous test round.

attack.active              bool
attack.type                string — "none" | "intercept" | "entangle"
                             | "replay" | "batchNoise" | "blind"

verdict            string   — "ACCEPT" | "REJECT"
status             string   — "PROVISIONAL" | "CONFIRMED" | "DISPUTED"
event_flags        array of strings — see §4.2 for the closed set
```

---

## 4. Validation rules (hard fail — regenerate if any of these trigger)

### 4.1 Mermin isolation (critical — security-relevant, not just a data bug)
- `checks.mermin_value` must be **non-null on `mermin_test` rounds only**, and **null on every other round**.
- `event_flags` may only contain `"hardware_integrity_failure"` on rounds where `phase == "mermin_test"`.
- **Rule of thumb**: the count of rows with non-null `mermin_value` must exactly equal the count of rows with `phase == "mermin_test"` — not more, not fewer.

### 4.2 Closed set of event flags
`event_flags` values must only ever be one of:
`"decoy_qber_exceeded"`, `"cefb_exceeded"`, `"hardware_integrity_failure"`, `"replay_detected"`
— each tied to its corresponding check (§4.3 of the implementation plan). Any other string is a bug.

### 4.3 Round-type consistency
- Rows tagged as decoy substitutions must have their own `phase: "decoy_test"`, not be folded into `"signing"`.
- `correction_applied` must never encode round-type ("decoy", "mermin") — that information belongs in `phase` and `batch_type` only.

### 4.4 No invalid Pauli labels
`correction_applied` must be exactly one of `"I"`, `"X"`, `"Y"`, `"Z"`, or `null`. Reject any value with extra characters (e.g. `"iY"`).

### 4.5 No magic-number sentinels
- `batch_id`: use `null`, never `0`, to mean "not part of a batch."
- `parties.charlie.outcome`: use `null`, never `-1`, when Charlie didn't measure. `measured` must be `false` in that case, not `true`.

### 4.6 Sanity check on verdict distribution
For a run generated with `--noise 0.0 --attack none`, the **expected REJECT rate should be at or below `delta` (the configured false-accept probability, e.g. 1%)** — not the dominant outcome. If REJECT is anywhere near or above 10–20% on a zero-noise, no-attack run, treat that as a bug to find before shipping the file, not as expected behavior.

### 4.7 `status` field must be meaningful
If the simulator doesn't run an async confirmation pass, document that explicitly in the handoff notes rather than leaving every row `"PROVISIONAL"` with no explanation — Person 3's Charlie panel (§2.7 of the plan) has nothing to render otherwise. Either implement the confirmation pass, or state clearly: "this dataset is signing-only; confirmation sweep not simulated."

---

## 5. Handoff checklist (Person 1, before sending the file)

- [ ] File is NDJSON, LF line endings
- [ ] Every line has `"type": "ROUND_UPDATE"`
- [ ] Run the validator script (§6) — zero hard-fail violations
- [ ] Verdict distribution matches expectations for the run's configured noise/attack parameters (§4.6)
- [ ] Handoff notes state: rounds, noise, attack, batch depth, delta, seed, decoy %, Mermin test %, and whether `status` transitions are simulated
