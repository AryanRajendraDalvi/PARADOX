#include "ghz_resource.hpp"
#include <cmath>

static constexpr double SQRT1_2 = 0.7071067811865476;

// ─────────────────────────────────────────────────────────────────────────────
// generate_joint: constructs |GHZ> = (|000> + |111>) / sqrt(2)
//   3 qubits: q0=Alice's share, q1=Bob's share, q2=Charlie's share
//   Basis state |000> = index 0, |111> = index 7  (big-endian qubit ordering)
// ─────────────────────────────────────────────────────────────────────────────
Statevector GHZBatch::generate_joint() const {
    Statevector sv(3);        // initialises to |000>
    sv.amp(0) = cx(SQRT1_2, 0.0);   // |000> amplitude
    sv.amp(7) = cx(SQRT1_2, 0.0);   // |111> amplitude
    return sv;
}

// ─────────────────────────────────────────────────────────────────────────────
// generate_shares:
//   Returns the full 3-qubit joint GHZ state plus 1-qubit marginal views
//   for each party.  The transit_hook is applied to each party's 1-qubit view
//   to allow attack injection to perturb individual shares (Person 2's hook).
//
//   The 1-qubit marginal for GHZ is maximally mixed (|0><0|+|1><1|)/2,
//   represented as (|0>+|1>)/sqrt(2) for hook application purposes.
//   The protocol uses the joint 3-qubit state for simulation correctness.
// ─────────────────────────────────────────────────────────────────────────────
GHZShares GHZBatch::generate_shares() const {
    Statevector joint = generate_joint();

    // 1-qubit marginal view for hook application (amplitude placeholder)
    auto make_marginal = [&]() -> Statevector {
        Statevector sv(1);
        sv.amp(0) = cx(SQRT1_2, 0.0);
        sv.amp(1) = cx(SQRT1_2, 0.0);
        return sv;
    };

    Statevector alice_view   = transit_hook(make_marginal(), 0);
    Statevector bob_view     = transit_hook(make_marginal(), 1);
    Statevector charlie_view = transit_hook(make_marginal(), 2);

    return GHZShares{
        std::move(joint),
        std::move(alice_view),
        std::move(bob_view),
        std::move(charlie_view)
    };
}
