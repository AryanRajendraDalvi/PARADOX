#pragma once
#include "../core/statevector.hpp"
#include <random>

// ─────────────────────────────────────────────────────────────────────────────
// Noise model for honest-channel baseline (§6.1 noise_model).
// Does NOT inject attacks — that is Person 2's job.
// ─────────────────────────────────────────────────────────────────────────────

struct NoiseConfig {
    double depolarizing_prob = 0.0;  // per-qubit depolarizing noise probability p
    double detector_eta      = 1.0;  // detector efficiency η ∈ (0,1]
    double dark_count_prob   = 0.0;  // dark count probability per measurement
};

class NoiseModel {
public:
    explicit NoiseModel(const NoiseConfig& cfg = {});

    // Apply depolarizing noise to qubit k of sv (in-place).
    // With prob p/4 each: apply X, Y, or Z; with prob 1−3p/4: identity.
    void apply_depolarizing(Statevector& sv, int qubit, std::mt19937& rng) const;

    // Model finite detector efficiency η:
    // With prob (1−η): flip the measurement outcome to a random value.
    int apply_detector_efficiency(int outcome, std::mt19937& rng) const;

    // Model dark counts: with prob p_dark: flip the outcome.
    int apply_dark_count(int outcome, std::mt19937& rng) const;

    bool is_noisy() const {
        return cfg_.depolarizing_prob > 0.0 ||
               cfg_.detector_eta < 1.0      ||
               cfg_.dark_count_prob > 0.0;
    }

    const NoiseConfig& config() const { return cfg_; }

private:
    NoiseConfig cfg_;
};
