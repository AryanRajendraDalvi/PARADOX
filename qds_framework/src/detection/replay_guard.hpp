#pragma once
#include "../protocol/signer.hpp"
#include <unordered_set>
#include <unordered_map>
#include <string>
#include <vector>
#include <cstdint>

// ─────────────────────────────────────────────────────────────────────────────
// §3.2  Replay guard and phase-matching defense
//
// Each round consumes a freshly generated GHZ resource; transcript hashes are
// recorded. A replayed transcript hash hard-fails immediately (deterministic,
// not statistical). Phase matching provides an additional deterministic check.
// ─────────────────────────────────────────────────────────────────────────────

enum class ReplayResult { OK, REPLAY_DETECTED, PHASE_MISMATCH };

class ReplayGuard {
public:
    // Check and consume a transcript.
    // Computes a deterministic phase_token from the batch and round IDs,
    // then checks:
    //   1. Hash not already consumed → REPLAY_DETECTED if duplicate
    //   2. Provided phase_token matches expected → PHASE_MISMATCH if not
    // On OK: records the transcript hash.
    ReplayResult check_and_consume(const Transcript& t, uint32_t phase_token);

    // Compute the expected phase token for a (batch_id, round_id) pair.
    // Used by the simulation layer to compute the token before calling check_and_consume.
    static uint32_t expected_phase(uint32_t batch_id, uint32_t round_id);

    // Canonical string hash of a transcript (used as Merkle leaf data in §9.2)
    static std::string transcript_hash(const Transcript& t);

    // All consumed hashes since last reset (for Merkle leaf insertion)
    std::vector<std::string> consumed_hashes() const;

    void reset();
    int  consumed_count() const { return (int)consumed_.size(); }

private:
    std::unordered_set<std::string> consumed_;
};
