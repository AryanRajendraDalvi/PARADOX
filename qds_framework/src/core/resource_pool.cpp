#include "resource_pool.hpp"
#include <stdexcept>

// ─── Constructor ──────────────────────────────────────────────────────────────

ResourcePool::ResourcePool(const PoolConfig& cfg)
    : cfg_(cfg),
      hook_([](Statevector sv, int) { return sv; })   // default no-op hook
{
    replenish_signing(cfg_.replenish_by);
    replenish_test(cfg_.replenish_by / 2);
}

// ─── Draw operations ──────────────────────────────────────────────────────────

SigningBatch ResourcePool::draw_signing() {
    if ((int)signing_.size() < cfg_.min_signing_reserve)
        replenish_signing(cfg_.replenish_by);
    if (signing_.empty())
        throw std::runtime_error("ResourcePool: signing queue exhausted");
    SigningBatch b = std::move(signing_.front());
    signing_.pop_front();
    return b;
}

TestBatch ResourcePool::draw_test() {
    if ((int)test_.size() < cfg_.min_test_reserve)
        replenish_test(cfg_.replenish_by / 2);
    if (test_.empty())
        throw std::runtime_error("ResourcePool: test queue exhausted");
    TestBatch b = std::move(test_.front());
    test_.pop_front();
    return b;
}

// ─── Hook registration ────────────────────────────────────────────────────────

void ResourcePool::set_transit_hook(const QubitTransitHook& hook) {
    hook_ = hook;
    // Update existing batches in the queues
    for (auto& b : signing_) b.transit_hook = hook;
    for (auto& b : test_)    b.transit_hook = hook;
}

// ─── Replenishment ────────────────────────────────────────────────────────────

void ResourcePool::replenish_signing(int count) {
    for (int i = 0; i < count; ++i) {
        SigningBatch b(next_id(), cfg_.batch_depth);
        b.transit_hook = hook_;
        signing_.push_back(std::move(b));
    }
}

void ResourcePool::replenish_test(int count) {
    for (int i = 0; i < count; ++i) {
        TestBatch b(next_id(), cfg_.batch_depth);
        b.transit_hook = hook_;
        test_.push_back(std::move(b));
    }
}
