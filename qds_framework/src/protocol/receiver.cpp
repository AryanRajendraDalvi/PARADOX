#include "receiver.hpp"
#include "../core/pauli_ops.hpp"

void Receiver::apply_correction(Statevector& bc_state, int m1, int m2) {
    // Bob applies a single-qubit gate to qubit 0 (his share B) of the 2-qubit BC state.
    // Charlie's correction (qubit 1) is applied separately by Verifier::apply_correction_share().
    bc_state.apply_gate(Pauli::bob_correction(m1, m2), 0);
}
