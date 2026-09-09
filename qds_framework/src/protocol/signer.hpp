#pragma once
#include "../core/statevector.hpp"
#include "../core/pauli_ops.hpp"
#include <cstdint>
#include <string>

// ─────────────────────────────────────────────────────────────────────────────
// Transcript — classical correction bits Alice broadcasts after Bell measurement.
// Used by Bob and Charlie for correction, and by the replay guard.
// ─────────────────────────────────────────────────────────────────────────────
struct Transcript {
    uint32_t    round_id;
    uint32_t    batch_id;
    int         m1;                   // Alice's Bell measurement outcome (M qubit)
    int         m2;                   // Alice's Bell measurement outcome (A qubit)
    std::string correction_label;     // "I","X","Z","iY" — what Bob should apply
};

// ─────────────────────────────────────────────────────────────────────────────
// Signer — Alice's role in the QDS protocol (§2.2)
// ─────────────────────────────────────────────────────────────────────────────
class Signer {
public:
    // Prepare the message qubit |ψ> = α|0> + β|1>
    // α and β must satisfy |α|² + |β|² ≈ 1 (asserted at debug level)
    static Statevector prepare_message(cx alpha, cx beta);

    // Perform Alice's Bell measurement on the 4-qubit joint state.
    //
    // Input: joint_4q = tensor(message_1q, ghz_3q)
    //        q0=message(M), q1=Alice's GHZ share(A), q2=Bob's(B), q3=Charlie's(C)
    //
    // Circuit applied:
    //   1. CNOT(ctrl=0, tgt=1)   [entangles M and A]
    //   2. H on qubit 0          [rotates M to Bell basis]
    //   3. Measure qubit 0 → m1
    //   4. Measure qubit 1 → m2
    //
    // Returns: (Transcript, collapsed 2-qubit BC state)
    //   BC state: qubit 0 = Bob's share (B), qubit 1 = Charlie's share (C)
    static std::pair<Transcript, Statevector>
        bell_measurement(Statevector joint_4q,
                         uint32_t round_id,
                         uint32_t batch_id,
                         std::mt19937& rng);
};
