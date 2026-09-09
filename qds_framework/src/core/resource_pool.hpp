#pragma once
#include "ghz_resource.hpp"
#include <deque>
#include <cstdint>
#include <random>

// ─────────────────────────────────────────────────────────────────────────────
// ResourcePool — pre-distributed GHZ batch pool (§2.7)
// Batches are generated ahead of time and drawn per round.
// ─────────────────────────────────────────────────────────────────────────────
struct PoolConfig {
    int min_signing_reserve = 50;    // replenish when below this
    int min_test_reserve    = 20;
    int batch_depth         = 10;    // correlation depth d for CEFB
    int replenish_by        = 100;   // batches added per replenish call
    int max_staleness_sec   = 300;   // seconds before PROVISIONAL backlog warning
};

class ResourcePool {
public:
    explicit ResourcePool(const PoolConfig& cfg = {});

    // Draw a SigningBatch (replenishes if below reserve)
    SigningBatch draw_signing();

    // Draw a TestBatch
    TestBatch draw_test();

    // Register an attack hook — applied to all newly created batch transit hooks
    void set_transit_hook(const QubitTransitHook& hook);

    int signing_available() const { return (int)signing_.size(); }
    int test_available()    const { return (int)test_.size();    }

    int batch_depth() const { return cfg_.batch_depth; }

    // Returns true if oldest_provisional_age_sec exceeds max_staleness threshold
    bool backlog_warning(int oldest_provisional_age_sec) const {
        return oldest_provisional_age_sec > cfg_.max_staleness_sec;
    }

private:
    PoolConfig               cfg_;
    std::deque<SigningBatch> signing_;
    std::deque<TestBatch>    test_;
    uint32_t                 next_batch_id_ = 1;
    QubitTransitHook         hook_;   // stored for replenishment

    void replenish_signing(int count);
    void replenish_test(int count);
    uint32_t next_id() { return next_batch_id_++; }
};
