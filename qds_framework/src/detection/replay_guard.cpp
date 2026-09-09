#include "replay_guard.hpp"
#include <sstream>

// ─── Transcript hash ──────────────────────────────────────────────────────────

std::string ReplayGuard::transcript_hash(const Transcript& t) {
    // Canonical string: "R<round_id>:B<batch_id>:<m1>:<m2>"
    std::ostringstream oss;
    oss << "R" << t.round_id << ":B" << t.batch_id << ":" << t.m1 << ":" << t.m2;
    return oss.str();
}

// ─── Phase computation ────────────────────────────────────────────────────────

uint32_t ReplayGuard::expected_phase(uint32_t batch_id, uint32_t round_id) {
    // Deterministic hash of (batch_id, round_id) using two Knuth multiplicative primes.
    // A replayed transcript from a different round will have a different round_id,
    // giving a different expected phase and failing deterministically.
    return (batch_id * 2654435761u) ^ (round_id * 2246822519u);
}

// ─── Check and consume ────────────────────────────────────────────────────────

ReplayResult ReplayGuard::check_and_consume(const Transcript& t, uint32_t phase_token) {
    const std::string h = transcript_hash(t);

    // Rule 1: duplicate transcript → hard-fail REPLAY
    if (consumed_.count(h)) return ReplayResult::REPLAY_DETECTED;

    // Rule 2: phase mismatch → hard-fail PHASE_MISMATCH
    const uint32_t expected = expected_phase(t.batch_id, t.round_id);
    if (phase_token != expected) return ReplayResult::PHASE_MISMATCH;

    // All checks passed — consume
    consumed_.insert(h);
    return ReplayResult::OK;
}

std::vector<std::string> ReplayGuard::consumed_hashes() const {
    return std::vector<std::string>(consumed_.begin(), consumed_.end());
}

void ReplayGuard::reset() {
    consumed_.clear();
}
