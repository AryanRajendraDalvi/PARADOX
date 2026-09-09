#pragma once
#include "../core/statevector.hpp"
#include "../core/ghz_resource.hpp"
#include "../audit/verification_record.hpp"
#include <random>
#include <cassert>

// ─────────────────────────────────────────────────────────────────────────────
// Verifier — Charlie's role in the QDS protocol (§2.3, §2.6)
//
// Key design:
// - apply_correction_share() is called alongside Receiver::apply_correction()
//   immediately after Alice's broadcast.
// - z_basis_measure() and check_correlation() perform the Z-basis verification.
// - run_mermin_round() ONLY accepts TestBatch& (compile-time type enforcement
//   for the X-basis isolation constraint derived in Flag 2 resolution).
// ─────────────────────────────────────────────────────────────────────────────
class Verifier {
public:
    // Apply Charlie's correction to qubit 1 (his share C) of the 2-qubit BC state.
    // Charlie applies X if m2==1, I if m2==0.  (Flag 1 resolved: Charlie's gate
    // depends on m2, not m1.)
    static void apply_correction_share(Statevector& bc_state, int m2);

    // Measure Bob's qubit (qubit 0 of the corrected BC state) in the Z-basis.
    // Returns 0 or 1; collapses bc_state in-place.
    static int z_basis_measure_bob(Statevector& bc_state, std::mt19937& rng);

    // Measure Charlie's qubit (qubit 1 of the corrected BC state) in the Z-basis.
    // ONLY valid on signing-batch data.
    // Runtime assertion: called only after apply_correction_share().
    static int z_basis_measure_charlie(Statevector& bc_state, std::mt19937& rng);

    // Check Z-basis correlation: returns true iff bob_z == charlie_z.
    // Under honest execution the match probability is 1 (derived in Flag 2).
    static bool check_correlation(int bob_z, int charlie_z);

    // Async confirmation: flip a PROVISIONAL record to CONFIRMED or DISPUTED.
    static void async_confirm(VerificationRecord& record, bool charlie_check_passed);

    // ─── Mermin self-test (§3.3) ──────────────────────────────────────────────
    // COMPILE-TIME ENFORCEMENT: only accepts TestBatch& — NOT SigningBatch&.
    // This is the §2.5/§2.6 X-basis isolation constraint enforced at the type level.
    //
    // joint_3q  — full 3-qubit GHZ state (q0=Alice, q1=Bob, q2=Charlie)
    // setting   — 0=XYY, 1=YXY, 2=YYX, 3=XXX
    // Returns the raw ±1 product of all three measurement outcomes.
    static int run_mermin_round(Statevector joint_3q,
                                 int setting,
                                 const TestBatch& batch,   // enforces type — won't compile with SigningBatch
                                 std::mt19937& rng);
};
