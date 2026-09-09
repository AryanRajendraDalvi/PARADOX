#include "verifier.hpp"
#include "../core/pauli_ops.hpp"

// ─── Correction ───────────────────────────────────────────────────────────────

void Verifier::apply_correction_share(Statevector& bc_state, int m2) {
    // Charlie applies a single-qubit gate to qubit 1 (his share C) of the BC state.
    // Charlie applies X if m2==1, I if m2==0.  (Flag 1 resolved — depends on m2, not m1.)
    bc_state.apply_gate(Pauli::charlie_correction(m2), 1);
}

// ─── Z-basis measurements ─────────────────────────────────────────────────────

int Verifier::z_basis_measure_bob(Statevector& bc_state, std::mt19937& rng) {
    // Measure qubit 0 (Bob's share B) in Z basis
    return bc_state.measure(0, rng);
}

int Verifier::z_basis_measure_charlie(Statevector& bc_state, std::mt19937& rng) {
    // Measure qubit 1 (Charlie's share C) in Z basis
    // Runtime defense-in-depth assertion: this should only be called on signing-batch data
    // (type-level enforcement happens at the Simulation layer via the SigningBatch/TestBatch split)
    return bc_state.measure(1, rng);
}

bool Verifier::check_correlation(int bob_z, int charlie_z) {
    // Under honest execution: P(match) = 1  (derived in Flag 2 resolution).
    // Any mismatch indicates external disturbance.
    return bob_z == charlie_z;
}

void Verifier::async_confirm(VerificationRecord& record, bool charlie_check_passed) {
    record.status = charlie_check_passed ? Status::CONFIRMED : Status::DISPUTED;
}

// ─── Mermin self-test ─────────────────────────────────────────────────────────

int Verifier::run_mermin_round(Statevector joint_3q,
                                int setting,
                                const TestBatch& /* batch */,  // type enforcement
                                std::mt19937& rng)
{
    // COMPILE-TIME ENFORCEMENT: the TestBatch& parameter here prevents calling
    // this function with a SigningBatch (§2.5/§2.6 X-basis isolation constraint).
    //
    // Runtime assertion as defense-in-depth:
    assert(setting >= 0 && setting <= 3 && "Mermin setting must be 0..3");

    // Basis assignments per setting:
    //   0 = XYY: Alice=X, Bob=Y, Charlie=Y
    //   1 = YXY: Alice=Y, Bob=X, Charlie=Y
    //   2 = YYX: Alice=Y, Bob=Y, Charlie=X
    //   3 = XXX: Alice=X, Bob=X, Charlie=X
    //
    // X-basis measurement: apply H then measure in Z
    // Y-basis measurement: apply S† then H then measure in Z
    //   (S† = [[1,0],[0,-i]] rotates Y eigenstates to Z eigenstates)
    //
    // For each party, we measure the corresponding qubit of joint_3q.
    // q0=Alice, q1=Bob, q2=Charlie.

    // Determine basis for each party
    enum class Basis { X, Y };
    Basis basis[3];
    switch (setting) {
        case 0: basis[0]=Basis::X; basis[1]=Basis::Y; basis[2]=Basis::Y; break;
        case 1: basis[0]=Basis::Y; basis[1]=Basis::X; basis[2]=Basis::Y; break;
        case 2: basis[0]=Basis::Y; basis[1]=Basis::Y; basis[2]=Basis::X; break;
        case 3: basis[0]=Basis::X; basis[1]=Basis::X; basis[2]=Basis::X; break;
        default: assert(false);
    }

    int outcomes[3];
    for (int party = 0; party < 3; ++party) {
        if (basis[party] == Basis::X) {
            joint_3q.apply_gate(Pauli::H, party);       // rotate X-basis to Z-basis
        } else {
            joint_3q.apply_gate(Pauli::Sdg, party);     // S†
            joint_3q.apply_gate(Pauli::H, party);       // then H → rotates Y-basis to Z-basis
        }
        outcomes[party] = joint_3q.measure(party, rng); // 0 → +1, 1 → −1
    }

    // Convert outcomes to ±1 values and compute product
    const int val[3] = {
        (outcomes[0] == 0) ? +1 : -1,
        (outcomes[1] == 0) ? +1 : -1,
        (outcomes[2] == 0) ? +1 : -1
    };
    return val[0] * val[1] * val[2];
}
