#include "signer.hpp"
#include <cassert>
#include <cmath>

// ─── Message preparation ──────────────────────────────────────────────────────

Statevector Signer::prepare_message(cx alpha, cx beta) {
    // Verify normalisation (loose check for floating-point tolerances)
    const double norm_sq = std::norm(alpha) + std::norm(beta);
    assert(std::abs(norm_sq - 1.0) < 1e-9 && "Message qubit amplitudes must be normalised");

    Statevector sv(1);
    sv.amp(0) = alpha;   // |0> component
    sv.amp(1) = beta;    // |1> component
    return sv;
}

// ─── Bell measurement ─────────────────────────────────────────────────────────

std::pair<Transcript, Statevector>
Signer::bell_measurement(Statevector joint_4q,
                          uint32_t round_id,
                          uint32_t batch_id,
                          std::mt19937& rng)
{
    // joint_4q is a 4-qubit state:
    //   qubit 0 = M (message)
    //   qubit 1 = A (Alice's GHZ share)
    //   qubit 2 = B (Bob's GHZ share)
    //   qubit 3 = C (Charlie's GHZ share)
    assert(joint_4q.n_qubits() == 4);

    // Step 1: CNOT(ctrl=qubit0=M, tgt=qubit1=A)
    joint_4q.apply_cnot(0, 1);

    // Step 2: H on qubit 0 (M)
    joint_4q.apply_gate(Pauli::H, 0);

    // Step 3: Measure qubit 0 (M) → m1, then qubit 1 (A) → m2
    const int m1 = joint_4q.measure(0, rng);
    const int m2 = joint_4q.measure(1, rng);

    // Step 4: Extract the collapsed 2-qubit BC state (qubits 2 and 3).
    // After measuring qubits 0 and 1, the remaining state is a 2-qubit
    // Statevector over B (new qubit 0) and C (new qubit 1).
    //
    // Iterate all 16 basis states of joint_4q; select those consistent
    // with the measured outcomes (bit0==m1, bit1==m2), then map to the
    // 2-qubit BC index.
    //
    // In joint_4q basis notation (big-endian, 4 qubits):
    //   bit 0 of index = qubit 3 (C)
    //   bit 1 of index = qubit 2 (B)
    //   bit 2 of index = qubit 1 (A) — already measured m2
    //   bit 3 of index = qubit 0 (M) — already measured m1
    //
    // We want BC index: bit 0 = C, bit 1 = B  →  bc_index in {0,1,2,3}

    Statevector bc_state(2);  // initialised to zero
    for (int i = 0; i < 16; ++i) {
        // Extract each qubit's value from basis state index i
        // (big-endian: bit (n-1-k) of i = qubit k)
        int q0_val = (i >> 3) & 1;  // qubit 0 (M)
        int q1_val = (i >> 2) & 1;  // qubit 1 (A)
        int q2_val = (i >> 1) & 1;  // qubit 2 (B)
        int q3_val = (i >> 0) & 1;  // qubit 3 (C)

        if (q0_val != m1 || q1_val != m2) continue;  // inconsistent with measurement

        // Map to 2-qubit BC state: qubit 0=B, qubit 1=C (big-endian 2-qubit)
        // bc_index = B * 2 + C = q2_val * 2 + q3_val
        const int bc_index = (q2_val << 1) | q3_val;
        bc_state.amp(bc_index) = joint_4q.amp(i);
    }
    bc_state.normalize();

    // Build correction label string for Bob
    std::string label;
    if      (m1 == 0 && m2 == 0) label = "I";
    else if (m1 == 0 && m2 == 1) label = "X";
    else if (m1 == 1 && m2 == 0) label = "Z";
    else                          label = "Y";

    Transcript t{ round_id, batch_id, m1, m2, std::move(label) };
    return { std::move(t), std::move(bc_state) };
}
