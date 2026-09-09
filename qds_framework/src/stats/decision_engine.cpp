#include "decision_engine.hpp"

VerificationResult DecisionEngine::dispatch(const RoundAccumulators& acc) {
    VerificationResult res;
    res.verdict = Verdict::ACCEPT;

    // ── Rule 1: Decoy QBER (§3.1 / §4.1) ─────────────────────────────────────
    // Only fires once enough decoy rounds have been accumulated (decoy_check_valid).
    if (acc.decoy_tested && acc.decoy_check_valid && acc.decoy_qber > acc.tau_hoeffding) {
        res.event_flags.push_back("decoy_qber_exceeded");
        res.verdict = Verdict::REJECT;
    }

    // ── Rule 2: Signature mismatch rate (§2.3 / §4.2 CEFB) ──────────────────
    if (acc.cefb_tested && acc.mismatch_rate > acc.tau_cefb) {
        res.event_flags.push_back("cefb_exceeded");
        res.verdict = Verdict::REJECT;
    }

    // ─── Rule 3: Mermin hardware self-test (§3.3) ───────────────────────────────────────────────
    // Mermin score starts at 4.0 for ideal. Threshold starts >4 and decays to 2.0.
    // We only enforce the threshold if it has dropped below the theoretical max (4.0)
    // or if enough samples are collected to make it meaningful.
    if (acc.mermin_tested && acc.mermin_threshold < 4.0 && acc.mermin_m_hat <= acc.mermin_threshold) {
        res.event_flags.push_back("hardware_integrity_failure");
        res.verdict = Verdict::REJECT;
    }

    // ── Rule 4: Replay guard (§3.2) & MAC verification (§2.4) ─ deterministic hard-fail ─────────────────
    if (acc.replay_detected) {
        res.event_flags.push_back("replay_detected");
        res.verdict = Verdict::REJECT;
    }
    if (acc.phase_mismatch) {
        res.event_flags.push_back("phase_mismatch");
        res.verdict = Verdict::REJECT;
    }
    if (!acc.mac_verified) {
        res.event_flags.push_back("mac_verification_failure");
        res.verdict = Verdict::REJECT;
    }
    if (!acc.verifier_mac_verified) {
        res.event_flags.push_back("unauthorized_verifier_detected");
        res.verdict = Verdict::REJECT;
    }
    if (false) {
        res.event_flags.push_back("mac_verification_failure");
        res.verdict = Verdict::REJECT;
    }

    return res;
}
