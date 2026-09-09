#pragma once
#include "../core/ghz_resource.hpp"
#include "../protocol/verifier.hpp"
#include <vector>
#include <random>

// ─────────────────────────────────────────────────────────────────────────────
// §3.3  Mermin-GHZ hardware self-test
//
// On a sampled subset of rounds, runs a Mermin correlation test to detect
// detector blinding / device-substitution attacks.
//
// For an ideal untampered GHZ state:
//   <XYY> = <YXY> = <YYX> = +1,  <XXX> = -1
//   M = <XYY>+<YXY>+<YYX>-<XXX> = 4  (quantum maximum)
//
// Any local-hidden-variable model is bounded by |M| ≤ 2.
//
// TYPE ENFORCEMENT: run_round only accepts TestBatch& (not SigningBatch&).
// ─────────────────────────────────────────────────────────────────────────────

struct MerminSample {
    int setting;           // 0=XYY, 1=YXY, 2=YYX, 3=XXX
    int raw_product;       // ±1 raw product of the three outcomes
    int m_contribution;    // +raw_product for XYY/YXY/YYX; -raw_product for XXX
};

class MerminTester {
public:
    // Randomly choose one of the 4 settings with equal probability
    static int sample_setting(std::mt19937& rng);

    // Run one Mermin round and return the sample.
    // TYPE ENFORCEMENT: only accepts TestBatch& — compile error if passed SigningBatch&.
    static MerminSample run_round(Statevector joint_3q,
                                   int setting,
                                   const TestBatch& batch,
                                   std::mt19937& rng);

    // Accumulate a sample
    void add_sample(const MerminSample& s);

    // M̂ = sample mean of m_contributions
    // For an honest device: M̂ → 4 as n → ∞
    // For a classically-controlled device: M̂ ≤ 2
    double compute_m_hat() const;

    int  sample_count() const { return (int)samples_.size(); }
    void reset();

private:
    std::vector<MerminSample> samples_;
};
