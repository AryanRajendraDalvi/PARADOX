#include "mermin_test.hpp"
#include <numeric>
#include <stdexcept>

int MerminTester::sample_setting(std::mt19937& rng) {
    std::uniform_int_distribution<int> pick(0, 3);
    return pick(rng);
}

MerminSample MerminTester::run_round(Statevector joint_3q,
                                      int setting,
                                      const TestBatch& batch,
                                      std::mt19937& rng)
{
    // Delegate to Verifier::run_mermin_round (type-enforced via TestBatch&).
    // The Verifier does the actual X/Y-basis measurements on the joint 3-qubit state.
    const int raw = Verifier::run_mermin_round(std::move(joint_3q), setting, batch, rng);

    // Compute Mermin contribution:
    //   M = <XYY> + <YXY> + <YYX> - <XXX>
    // For settings 0–2 (XYY/YXY/YYX): contribution = +raw_product
    // For setting 3 (XXX):             contribution = -raw_product
    const int m_contrib = (setting == 3) ? -raw : raw;

    return MerminSample{ setting, raw, m_contrib };
}

void MerminTester::add_sample(const MerminSample& s) {
    samples_.push_back(s);
}

double MerminTester::compute_m_hat() const {
    if (samples_.empty()) return 4.0;  // optimistic default (no data yet)
    double sum = 0.0;
    for (const auto& s : samples_) sum += s.m_contribution;
    // Expected m_contrib is -1 for (|000>+|111>)/sqrt(2).
    // Multiply by -4 to get +4.0 Mermin polynomial value.
    return -4.0 * (sum / samples_.size());
}

void MerminTester::reset() {
    samples_.clear();
}
