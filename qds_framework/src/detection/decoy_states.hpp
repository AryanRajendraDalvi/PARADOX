#pragma once
#include "../core/statevector.hpp"
#include <vector>
#include <random>
#include <cstdint>

// ─────────────────────────────────────────────────────────────────────────────
// §3.1  Decoy-state QBER detector
//
// A random fraction of rounds substitutes a BB84 decoy qubit for the real
// signature qubit. Any interception disturbs decoys (no-cloning theorem),
// raising the decoy-subset QBER above the honest-channel baseline p0.
// ─────────────────────────────────────────────────────────────────────────────

// BB84 decoy state indices:
//   0 = |0>  (Z basis, bit 0)
//   1 = |1>  (Z basis, bit 1)
//   2 = |+>  = (|0>+|1>)/√2  (X basis, bit 0)
//   3 = |->  = (|0>-|1>)/√2  (X basis, bit 1)
enum class DecoyState { Z0 = 0, Z1 = 1, X0 = 2, X1 = 3 };

struct DecoyOutcome {
    DecoyState sent;
    int        measured_basis;   // 0=Z, 1=X
    int        measured_outcome; // 0 or 1
};

class DecoyInjector {
public:
    // inject_prob: fraction of rounds that become decoy rounds
    explicit DecoyInjector(double inject_prob = 0.1);

    // True if this round should be a decoy round
    bool should_inject(std::mt19937& rng) const;

    // Return a random BB84 decoy qubit (state chosen uniformly from the 4)
    // and record which state was sent.
    std::pair<Statevector, DecoyState> random_decoy(std::mt19937& rng) const;

    // Record the measurement outcome of a decoy round
    void record_outcome(const DecoyOutcome& o);

    // Compute QBER over all matched-basis decoy rounds (fraction of errors).
    // Returns 0.0 if no matched-basis rounds have been accumulated.
    double compute_qber() const;

    int decoy_count()          const { return (int)outcomes_.size(); }
    int matched_basis_count()  const;
    void reset();

private:
    double inject_prob_;
    std::vector<DecoyOutcome> outcomes_;
};
