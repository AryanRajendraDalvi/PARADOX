#include "src/simulation/simulation.hpp"
#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>
#include <stdexcept>

// ─────────────────────────────────────────────────────────────────────────────
// QDS Framework CLI
// Usage:
//   qds_sim [options]
//
// Options:
//   --rounds N        Number of simulation rounds      (default: 1000)
//   --batch-depth D   GHZ batch correlation depth d    (default: 10)
//   --delta DELTA     False-accept probability target   (default: 0.01)
//   --p0 P0           Honest-channel baseline mismatch  (default: 0.0)
//   --decoy-prob P    Fraction of decoy rounds          (default: 0.10)
//   --mermin-prob P   Fraction of Mermin test rounds    (default: 0.05)
//   --noise P         Depolarizing noise probability    (default: 0.0)
//   --eta ETA         Detector efficiency               (default: 1.0)
//   --dark-count P    Dark count probability            (default: 0.0)
//   --attack TYPE     Attack type: none|intercept|entangle|replay|batchNoise|blind
//                                                       (default: none)
//   --seed N          RNG seed                          (default: 42)
//   --output FILE     Output file for NDJSON events     (default: stdout)
//   --dump-ledger     Print ledger after simulation     (default: false)
// ─────────────────────────────────────────────────────────────────────────────

static void print_usage(const char* prog) {
    std::cerr
        << "Usage: " << prog << " [options]\n"
        << "  --rounds N         Simulation rounds       (default: 1000)\n"
        << "  --batch-depth D    GHZ batch depth         (default: 10)\n"
        << "  --delta DELTA      False-accept prob        (default: 0.01)\n"
        << "  --p0 P0            Baseline mismatch rate   (default: 0.0)\n"
        << "  --decoy-prob P     Decoy round fraction     (default: 0.10)\n"
        << "  --mermin-prob P    Mermin round fraction    (default: 0.05)\n"
        << "  --noise P          Depolarizing noise       (default: 0.0)\n"
        << "  --eta ETA          Detector efficiency      (default: 1.0)\n"
        << "  --dark-count P     Dark count prob          (default: 0.0)\n"
        << "  --attack TYPE      none|intercept|entangle|replay|batchNoise|blind\n"
        << "  --seed N           RNG seed                 (default: 42)\n"
        << "  --output FILE      NDJSON output file       (default: stdout)\n"
        << "  --dump-ledger      Print ledger summary     (default: false)\n";
}

int main(int argc, char* argv[]) {
    SimConfig cfg;
    bool dump_ledger = false;
    std::string output_path;

    // ── Parse arguments ───────────────────────────────────────────────────────
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        try {
            if      (arg == "--rounds"      && i+1 < argc) { cfg.n_rounds      = std::stoi(argv[++i]); }
            else if (arg == "--batch-depth" && i+1 < argc) { cfg.batch_depth   = std::stoi(argv[++i]); }
            else if (arg == "--delta"       && i+1 < argc) { cfg.delta         = std::stod(argv[++i]); }
            else if (arg == "--p0"          && i+1 < argc) { cfg.baseline_p0   = std::stod(argv[++i]); }
            else if (arg == "--decoy-prob"  && i+1 < argc) { cfg.decoy_prob    = std::stod(argv[++i]); }
            else if (arg == "--mermin-prob" && i+1 < argc) { cfg.mermin_prob   = std::stod(argv[++i]); }
            else if (arg == "--noise"       && i+1 < argc) { cfg.noise.depolarizing_prob = std::stod(argv[++i]); }
            else if (arg == "--eta"         && i+1 < argc) { cfg.noise.detector_eta      = std::stod(argv[++i]); }
            else if (arg == "--dark-count"  && i+1 < argc) { cfg.noise.dark_count_prob   = std::stod(argv[++i]); }
            else if (arg == "--attack"      && i+1 < argc) {
                cfg.attack_type   = argv[++i];
                cfg.attack_active = (cfg.attack_type != "none");
            }
            else if (arg == "--seed"        && i+1 < argc) { cfg.rng_seed      = (uint32_t)std::stoul(argv[++i]); }
            else if (arg == "--output"      && i+1 < argc) { output_path       = argv[++i]; }
            else if (arg == "--dump-ledger")               { dump_ledger       = true; }
            else if (arg == "--help" || arg == "-h")       { print_usage(argv[0]); return 0; }
            else {
                std::cerr << "Unknown argument: " << arg << "\n";
                print_usage(argv[0]);
                return 1;
            }
        } catch (const std::exception& e) {
            std::cerr << "Error parsing argument " << arg << ": " << e.what() << "\n";
            return 1;
        }
    }

    // ── Validate config ───────────────────────────────────────────────────────
    if (cfg.n_rounds <= 0)    { std::cerr << "Error: --rounds must be > 0\n"; return 1; }
    if (cfg.batch_depth <= 0) { std::cerr << "Error: --batch-depth must be > 0\n"; return 1; }
    if (cfg.delta <= 0.0 || cfg.delta >= 1.0) {
        std::cerr << "Error: --delta must be in (0,1)\n"; return 1; }

    // ── Print run header to stderr ────────────────────────────────────────────
    std::cerr << "QDS Framework — Teleportation-based Quantum Digital Signature\n"
              << "  rounds=" << cfg.n_rounds
              << " batch_depth=" << cfg.batch_depth
              << " delta=" << cfg.delta
              << " noise=" << cfg.noise.depolarizing_prob
              << " attack=" << cfg.attack_type
              << " seed=" << cfg.rng_seed << "\n";

    // ── Open output file if specified ─────────────────────────────────────────
    std::ofstream out_file;
    if (!output_path.empty()) {
        out_file.open(output_path, std::ios_base::out | std::ios_base::binary);
        if (!out_file) {
            std::cerr << "Error: cannot open output file: " << output_path << "\n";
            return 1;
        }
        cfg.event_out = &out_file;
    }

    // ── Run simulation ────────────────────────────────────────────────────────
    try {
        Simulation sim(cfg);

        // TODO (Person 2 integration): register attack hook here based on cfg.attack_type
        // Example:
        //   if (cfg.attack_type == "intercept") {
        //       sim.register_attack_hook(intercept_resend_hook);
        //   }

        sim.run();

        if (dump_ledger) sim.dump_ledger();

    } catch (const std::exception& e) {
        std::cerr << "Fatal error: " << e.what() << "\n";
        return 1;
    }

    std::cerr << "Done.\n";
    return 0;
}
