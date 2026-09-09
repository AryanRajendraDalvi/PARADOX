#pragma once
#include "merkle_tree.hpp"
#include <map>
#include <string>
#include <sstream>

// ─────────────────────────────────────────────────────────────────────────────
// §9.3  In-memory stub ledger client.
// Stores Merkle roots keyed by batch_id.
// In production: swap for a real Hyperledger Fabric client.
// ─────────────────────────────────────────────────────────────────────────────
class LedgerClient {
public:
    // Commit a Merkle root for a batch.
    // Returns false if batch_id already exists (no overwrites allowed).
    bool commit_root(uint32_t batch_id, const Hash256& root);

    // Verify a claimed root matches what was committed.
    // Returns false if batch_id not found or root mismatch.
    bool verify_root(uint32_t batch_id, const Hash256& claimed_root) const;

    // Number of committed batches
    int committed_count() const { return (int)ledger_.size(); }

    // Dump ledger to a human-readable string for audit export
    std::string dump() const;

private:
    std::map<uint32_t, Hash256> ledger_;
};
