#pragma once
#include "../core/statevector.hpp"
#include "signer.hpp"

// ─────────────────────────────────────────────────────────────────────────────
// Receiver — Bob's role in the QDS protocol (§2.2, Flag 1 resolved)
//
// Bob receives (m1, m2) from Alice's broadcast and applies a local
// single-qubit Pauli gate to his qubit (qubit 0 of the 2-qubit BC state).
//
// Correction table (derived from first principles):
//   (m1=0, m2=0) → I
//   (m1=0, m2=1) → X
//   (m1=1, m2=0) → Z
//   (m1=1, m2=1) → ZX = iY (up to global phase)
// ─────────────────────────────────────────────────────────────────────────────
class Receiver {
public:
    // Apply Bob's correction gate to qubit 0 of the 2-qubit BC state (in-place).
    // bc_state: qubit 0 = Bob's share (B), qubit 1 = Charlie's share (C).
    static void apply_correction(Statevector& bc_state, int m1, int m2);
};
