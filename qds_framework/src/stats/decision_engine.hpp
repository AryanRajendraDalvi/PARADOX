#pragma once
#include "../audit/verification_record.hpp"
#include <vector>
#include <string>

// ─────────────────────────────────────────────────────────────────────────────
// §4.3  Decision Engine — applies all four decision rules and dispatches verdict.
// ─────────────────────────────────────────────────────────────────────────────

struct RoundAccumulators {
    // ─── Decoy QBER (§3.1 / §4.1) ────────────────────────────────────────────────
    double decoy_qber        = 0.0;
    double tau_hoeffding     = 0.0;
    bool   decoy_check_valid = false;  // true once enough decoy rounds accumulated
    bool   decoy_tested      = false;  // true only on phase == "decoy_test"

    // ─── Signature mismatch rate (§2.3 / §4.2 CEFB) ─────────────────────────────
    double mismatch_rate  = 0.0;
    double tau_cefb       = 0.0;
    bool   cefb_tested    = false;     // true only on phase == "verification"

    // ── Mermin hardware self-test (§3.3) ─────────────────────────────────────
    double mermin_m_hat     = 4.0;   // optimistic start
    double mermin_threshold = 0.0;
    bool   mermin_tested    = false;

    // ── Replay guard (§3.2) ───────────────────────────────────────────────────
    bool replay_detected = false;
    bool phase_mismatch  = false;
    
    // ── MAC Authentication (§2.4) ─────────────────────────────────────────────
    bool mac_verified    = true;
    bool verifier_mac_verified = true;
};

struct VerificationResult {
    Verdict                  verdict;
    std::vector<std::string> event_flags;
};

class DecisionEngine {
public:
    // Apply all four decision rules (§4.3) and return the verdict + fired flags.
    //
    // Rule 1 (channel):  decoy_qber > tau_hoeffding         → "decoy_qber_exceeded"
    // Rule 2 (forgery):  mismatch_rate > tau_cefb           → "cefb_threshold_exceeded"
    // Rule 3 (hardware): mermin_m_hat <= mermin_threshold   → "hardware_integrity_failure"
    // Rule 4 (replay):   replay_detected or phase_mismatch  → "replay_detected" / "phase_mismatch"
    static VerificationResult dispatch(const RoundAccumulators& acc);
};
