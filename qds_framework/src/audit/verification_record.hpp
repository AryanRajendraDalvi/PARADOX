#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include <ctime>
#include <sstream>
#include <iomanip>

// ─────────────────────────────────────────────────────────────────────────────
// §9.1  VerificationRecord — one record per simulation round.
// Serialised canonically for Merkle leaf hashing.
// ─────────────────────────────────────────────────────────────────────────────

enum class Verdict { ACCEPT, REJECT };
enum class Status  { PROVISIONAL, CONFIRMED, DISPUTED };

inline std::string verdict_str(Verdict v) {
    return v == Verdict::ACCEPT ? "ACCEPT" : "REJECT";
}
inline std::string status_str(Status s) {
    switch (s) {
        case Status::PROVISIONAL: return "PROVISIONAL";
        case Status::CONFIRMED:   return "CONFIRMED";
        case Status::DISPUTED:    return "DISPUTED";
    }
    return "PROVISIONAL";
}

struct VerificationRecord {
    uint32_t    round_id        = 0;
    uint32_t    batch_id        = 0;
    std::time_t timestamp       = 0;
    double      mismatch_rate   = 0.0;
    double      threshold_used  = 0.0;   // τ_CEFB
    double      mermin_value    = -999.0; // -999 = not tested this round
    Verdict     verdict         = Verdict::REJECT;
    Status      status          = Status::PROVISIONAL;
    std::vector<std::string> event_flags;

    // Canonical deterministic byte serialisation for Merkle hashing.
    // Layout: round_id(4LE) | batch_id(4LE) | timestamp(8LE) |
    //         mismatch_rate(8LE,bits) | threshold_used(8LE,bits) |
    //         mermin_value(8LE,bits) | verdict(1) | status(1) |
    //         for each flag: len(1) + bytes
    std::vector<uint8_t> serialize() const;

    // JSON string matching the §1 event contract.
    std::string to_json(const std::string& batch_type,
                        const std::string& phase,
                        bool attack_active,
                        const std::string& attack_type,
                        int alice_m1, int alice_m2,
                        int bob_outcome,
                        const std::string& bob_correction_label,
                        int charlie_outcome,
                        double decoy_qber,
                        double tau_hoeffding,
                        double tau_cefb,
                        const std::string& merkle_root,
                        bool batch_committed,
                        bool mac_verified,
                        const std::string& mac_tag,
                        double latency_us, double throughput_hz) const;
};
