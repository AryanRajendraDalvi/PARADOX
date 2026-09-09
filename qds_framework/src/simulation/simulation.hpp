#pragma once
#include "../core/resource_pool.hpp"
#include "../protocol/signer.hpp"
#include "../protocol/receiver.hpp"
#include "../protocol/verifier.hpp"
#include "../detection/decoy_states.hpp"
#include "../detection/replay_guard.hpp"
#include "../detection/mermin_test.hpp"
#include "../stats/hoeffding.hpp"
#include "../stats/cefb.hpp"
#include "../stats/decision_engine.hpp"
#include "../audit/merkle_tree.hpp"
#include "../audit/ledger_client.hpp"
#include "../audit/verification_record.hpp"
#include "../auth/wegman_carter.hpp"
#include "noise_model.hpp"
#include <ostream>
#include <iostream>
#include <random>
#include <string>
#include <functional>

// ─────────────────────────────────────────────────────────────────────────────
// SimConfig — all tunable parameters for a simulation run
// ─────────────────────────────────────────────────────────────────────────────
struct SimConfig {
    int    n_rounds      = 1000;
    int    batch_depth   = 10;      // correlation depth d (CEFB parameter)
    double delta         = 0.01;    // false-accept probability target δ
    double baseline_p0   = 0.0;     // expected honest-channel mismatch rate
    double decoy_prob    = 0.10;    // fraction of rounds that are decoy rounds
    double mermin_prob   = 0.05;    // fraction of rounds that are Mermin test rounds
    int    min_decoy_for_check = 10; // minimum decoy rounds before QBER check fires

    NoiseConfig noise;              // honest-channel noise baseline

    // Attack label (for JSON output); "none" on honest runs
    std::string attack_type = "none";
    bool        attack_active = false;

    // Where to write NDJSON events; nullptr → stdout
    std::ostream* event_out = nullptr;

    uint32_t rng_seed = 42;
};

// ─────────────────────────────────────────────────────────────────────────────
// Simulation — main per-round orchestration loop (§6.3)
// ─────────────────────────────────────────────────────────────────────────────
class Simulation {
public:
    explicit Simulation(const SimConfig& cfg);

    // Register an attack hook — Person 2's integration point.
    // The hook is forwarded to all resource-pool batches.
    void register_attack_hook(const QubitTransitHook& hook);

    // Run the full simulation (n_rounds rounds, emitting one JSON event per round)
    void run();

    // Dump the final ledger to the event_out stream
    void dump_ledger() const;

private:
    SimConfig     cfg_;
    ResourcePool  pool_;
    NoiseModel    noise_;
    MerminTester  mermin_tester_;
    DecoyInjector decoy_injector_;
    ReplayGuard   replay_guard_;
    LedgerClient  ledger_;
    MerkleTree    merkle_;
    std::mt19937  rng_;
    
    WegmanCarter::Key mac_key_ab_;
    WegmanCarter::Key mac_key_ac_;

    // Running counters
    uint32_t round_id_       = 0;
    int      mismatch_count_ = 0;
    int      signing_rounds_ = 0;

    // Per-round execution paths
    void run_signing_round(const SigningBatch& batch, RoundAccumulators& acc,
                           int& bob_out, int& charlie_out, Transcript& t_out);

    void run_decoy_round(RoundAccumulators& acc,
                         int& bob_out, int& charlie_out, Transcript& t_out);

    void run_mermin_round_sim(const TestBatch& batch, RoundAccumulators& acc,
                              int& bob_out, int& charlie_out, Transcript& t_out);

    // Emit a JSON event line (A 1 contract)
    void emit_event(const VerificationRecord& rec,
                    const Transcript& t,
                    const RoundAccumulators& acc,
                    const std::string& batch_type,
                    const std::string& phase,
                    int bob_out, int charlie_out,
                    const std::string& merkle_root,
                    bool batch_committed,
                    bool mac_verified,
                    const std::string& mac_tag, double latency_us, double throughput_hz) const;

    std::ostream& out() const {
        return cfg_.event_out ? *cfg_.event_out : std::cout;
    }
};
