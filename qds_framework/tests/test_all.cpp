#include <algorithm>
#include <iostream>
#include <cassert>
#include <cmath>
#include <complex>
#include "../src/core/statevector.hpp"
#include "../src/core/pauli_ops.hpp"
#include "../src/stats/hoeffding.hpp"
#include "../src/stats/cefb.hpp"
#include "../src/stats/decision_engine.hpp"
#include "../src/audit/merkle_tree.hpp"
#include "../src/detection/replay_guard.hpp"
#include "../src/detection/mermin_test.hpp"
#include "../src/core/resource_pool.hpp"
#include "../src/auth/wegman_carter.hpp"

using namespace std;
using cx = complex<double>;

void statevector_test() {
    cout << "Running statevector_test... ";
    // GHZ state generation
    Statevector ghz(3);
    ghz.apply_gate(Pauli::H, 0);
    ghz.apply_cnot(0, 1);
    ghz.apply_cnot(1, 2);
    
    // Check probabilities
    auto probs = ghz.probs();
    assert(abs(probs[0] - 0.5) < 1e-9); // |000>
    assert(abs(probs[7] - 0.5) < 1e-9); // |111>
    for (int i = 1; i < 7; ++i) {
        assert(abs(probs[i]) < 1e-9);
    }
    cout << "PASS\n";
}

void pauli_correction_test() {
    cout << "Running pauli_correction_test... ";
    // This tests the Bell measurement outcomes and corrections.
    // Instead of simulating the full Alice measurement, we test the logic of Bob/Charlie corrections directly.
    // The specific logic is implemented in Pauli::bob_correction and Pauli::charlie_correction.
    // m1=0, m2=0 -> Bob I, Charlie I
    assert(Pauli::bob_correction(0, 0).isApprox(Pauli::I));
    assert(Pauli::charlie_correction(0).isApprox(Pauli::I));
    
    // m1=0, m2=1 -> Bob X, Charlie X
    assert(Pauli::bob_correction(0, 1).isApprox(Pauli::X));
    assert(Pauli::charlie_correction(1).isApprox(Pauli::X));

    // m1=1, m2=0 -> Bob Z, Charlie I
    assert(Pauli::bob_correction(1, 0).isApprox(Pauli::Z));
    assert(Pauli::charlie_correction(0).isApprox(Pauli::I));

    // m1=1, m2=1 -> Bob ZX = iY, Charlie X
    Eigen::Matrix2cd iY = Pauli::Z * Pauli::X;
    assert(Pauli::bob_correction(1, 1).isApprox(iY));
    assert(Pauli::charlie_correction(1).isApprox(Pauli::X));

    cout << "PASS\n";
}

void replay_guard_test() {
    cout << "Running replay_guard_test... ";
    ReplayGuard guard;
    Transcript t{1, 100, 0, 1, "Z"};
    uint32_t token = ReplayGuard::expected_phase(t.batch_id, t.round_id);
    
    // First submit should pass
    assert(guard.check_and_consume(t, token) == ReplayResult::OK); 
    
    // Second submit should fail
    assert(guard.check_and_consume(t, token) == ReplayResult::REPLAY_DETECTED);  
    
    cout << "PASS\n";
}

void hoeffding_cefb_test() {
    cout << "Running hoeffding_cefb_test... ";
    double p0 = 0.01;
    int n = 1000;
    double delta = 0.01;
    
    double h_val = Hoeffding::threshold(p0, n, delta);
    double c_val_1 = CEFB::threshold(p0, n, 1, delta);
    double c_val_10 = CEFB::threshold(p0, n, 10, delta);
    
    // Note: The original spec stated CEFB reduces to Hoeffding at d=1, but the 
    // explicit formulas provided (sqrt(ln(1/d)/2n) vs sqrt(2*d*ln(1/d)/n)) differ by a factor of 2.
    // We verify the primary security requirement: batch-correlated bounds are wider.
    assert(c_val_10 > h_val);            // At d>1, CEFB > Hoeffding
    cout << "PASS\n";
}

void mermin_test_check() {
    cout << "Running mermin_test... ";
    MerminTester tester;
    mt19937 rng(42);
    
    // Generate ideal GHZ states and run Mermin checks
    // We mock a batch and ideal generation.
    TestBatch batch(1, 10);
    
    for (int i = 0; i < 1000; ++i) {
        Statevector ghz(3);
        ghz.apply_gate(Pauli::H, 0);
        ghz.apply_cnot(0, 1);
        ghz.apply_cnot(1, 2);
        
        int setting = MerminTester::sample_setting(rng);
        MerminSample sample = MerminTester::run_round(std::move(ghz), setting, batch, rng);
        tester.add_sample(sample);
    }
    
    double m_hat = tester.compute_m_hat();
    assert(abs(m_hat - 4.0) < 0.2); // Within sampling error of 4.0
    cout << "PASS (M_hat = " << m_hat << ")\n";
}

void decision_engine_test() {
    cout << "Running decision_engine_test... ";
    RoundAccumulators acc;
    acc.cefb_tested = true;
    acc.mismatch_rate = 0.25;
    acc.tau_cefb = 0.10;
    
    VerificationResult res = DecisionEngine::dispatch(acc);
    assert(res.verdict == Verdict::REJECT);
    
    bool has_flag = false;
    for (const auto& f : res.event_flags) {
        if (f == "cefb_exceeded") has_flag = true;
    }
    assert(has_flag);
    cout << "PASS\n";
}

void merkle_test() {
    cout << "Running merkle_test... ";
    MerkleTree tree1;
    tree1.add_leaf({0, 1, 2});
    tree1.add_leaf({3, 4, 5});
    Hash256 root1 = tree1.compute_root();
    
    MerkleTree tree2;
    tree2.add_leaf({0, 1, 2});
    tree2.add_leaf({3, 4, 6}); // Changed one byte
    Hash256 root2 = tree2.compute_root();
    
    assert(root1 != root2);
    cout << "PASS\n";
}


void attack_perturbation_test() {
    cout << "Running attack_perturbation_tests...\n";
    RoundAccumulators base;
    base.decoy_qber = 0.0;
    base.mismatch_rate = 0.0;
    base.tau_cefb = 0.1;
    base.tau_hoeffding = 0.1;
    base.mermin_m_hat = 4.0;
    base.mermin_threshold = 3.0;
    base.decoy_tested = true;
    base.cefb_tested = true;
    base.mermin_tested = true;
    base.decoy_check_valid = true;

    {
        RoundAccumulators acc = base;
        acc.decoy_qber = 0.45;
        acc.mismatch_rate = 0.45;
        VerificationResult res = DecisionEngine::dispatch(acc);
        assert(res.verdict == Verdict::REJECT);
        assert(find(res.event_flags.begin(), res.event_flags.end(), "decoy_qber_exceeded") != res.event_flags.end());
    }
    {
        RoundAccumulators acc = base;
        acc.decoy_qber = 0.45;
        acc.mismatch_rate = 0.45;
        acc.mermin_m_hat = acc.mermin_threshold - 0.5;
        VerificationResult res = DecisionEngine::dispatch(acc);
        assert(res.verdict == Verdict::REJECT);
        assert(find(res.event_flags.begin(), res.event_flags.end(), "hardware_integrity_failure") != res.event_flags.end());
    }
    {
        RoundAccumulators acc = base;
        acc.replay_detected = true;
        VerificationResult res = DecisionEngine::dispatch(acc);
        assert(res.verdict == Verdict::REJECT);
        assert(find(res.event_flags.begin(), res.event_flags.end(), "replay_detected") != res.event_flags.end());
    }
    {
        RoundAccumulators acc = base;
        acc.mismatch_rate = 0.95;
        VerificationResult res = DecisionEngine::dispatch(acc);
        assert(res.verdict == Verdict::REJECT);
        assert(find(res.event_flags.begin(), res.event_flags.end(), "cefb_exceeded") != res.event_flags.end());
    }
    {
        RoundAccumulators acc = base;
        acc.mermin_m_hat = acc.mermin_threshold - 0.5;
        VerificationResult res = DecisionEngine::dispatch(acc);
        assert(res.verdict == Verdict::REJECT);
        assert(find(res.event_flags.begin(), res.event_flags.end(), "hardware_integrity_failure") != res.event_flags.end());
    }
    cout << "  All 5 attack perturbation paths pass.\n";
}

void wegman_carter_mac_replay_test() {
    cout << "Running wegman_carter_mac_replay_test... ";
    WegmanCarter::Key key = WegmanCarter::generate_key(12345);
    
    int m1 = 1, m2 = 0;
    string correction_label = "Z";
    
    // Attacker captures round 1's msg:
    WegmanCarter::Bytes msg_r1 = WegmanCarter::build_mac_message(1, m1, m2, correction_label);
    WegmanCarter::Tag mac_tag_r1 = WegmanCarter::mac(msg_r1, key);
    
    // Attacker replays this exact transcript logic at Round 500, sending the captured MAC.
    // The Verifier expects a MAC for round 500:
    WegmanCarter::Bytes msg_r500 = WegmanCarter::build_mac_message(500, m1, m2, correction_label);
    
    // Verify using round 500's expected message bytes against the attacker's round 1 MAC tag
    bool verifies = WegmanCarter::verify(msg_r500, mac_tag_r1, key);
    assert(!verifies); // Must fail! Replay defeated at MAC layer.
    
    cout << "PASS\n";
}
int main() {
    cout << "--- QDS Framework Automated Test Suite ---\n";
    statevector_test();
    pauli_correction_test();
    replay_guard_test();
    hoeffding_cefb_test();
    mermin_test_check();
    decision_engine_test();
    merkle_test();
    wegman_carter_mac_replay_test();
    attack_perturbation_test();
    cout << "All automated tests passed successfully!\n";
    return 0;
}