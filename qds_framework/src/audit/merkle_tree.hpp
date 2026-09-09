#pragma once
#include <vector>
#include <array>
#include <cstdint>
#include <string>

using Hash256 = std::array<uint8_t, 32>;

// ─────────────────────────────────────────────────────────────────────────────
// §9.2  Merkle tree for batch-level audit anchoring.
// One tree per resource batch of depth d.
// Leaves = VerificationRecord bytes + consumed transcript hashes.
// Root committed to ledger per batch.
// ─────────────────────────────────────────────────────────────────────────────
class MerkleTree {
public:
    // Add a leaf: the raw bytes are SHA-256 hashed internally
    void add_leaf(const std::vector<uint8_t>& data);

    // Compute and return the Merkle root of all leaves added so far.
    // Returns a zero hash if no leaves have been added.
    Hash256 compute_root() const;

    // Clear all leaves (for the next batch)
    void clear();

    int leaf_count() const { return (int)leaves_.size(); }

    // SHA-256 of arbitrary bytes (also used externally, e.g., for transcript hashing)
    static Hash256 sha256(const std::vector<uint8_t>& data);

    // SHA-256 of a string
    static Hash256 sha256_str(const std::string& s);

private:
    std::vector<Hash256> leaves_;

    // Combine two child hashes into a parent: SHA-256(left || right)
    static Hash256 combine(const Hash256& left, const Hash256& right);
};

// Convert a Hash256 to a 64-char lowercase hex string
std::string hash_to_hex(const Hash256& h);
