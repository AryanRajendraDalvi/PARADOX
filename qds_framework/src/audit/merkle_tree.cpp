#include "merkle_tree.hpp"
#include <cstring>
#include <sstream>
#include <iomanip>
#include <stdexcept>

// ─────────────────────────────────────────────────────────────────────────────
// Complete SHA-256 implementation (no external dependencies)
// Reference: FIPS PUB 180-4
// ─────────────────────────────────────────────────────────────────────────────

static inline uint32_t rotr32(uint32_t x, int n) {
    return (x >> n) | (x << (32 - n));
}

Hash256 MerkleTree::sha256(const std::vector<uint8_t>& data) {
    // Round constants K (first 32 bits of fractional parts of cube roots of first 64 primes)
    static const uint32_t K[64] = {
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    };

    // Initial hash values (first 32 bits of fractional parts of sqrt of first 8 primes)
    uint32_t H[8] = {
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    };

    // Pre-processing: padding
    std::vector<uint8_t> msg(data);
    const uint64_t bit_len = (uint64_t)data.size() * 8;
    msg.push_back(0x80);
    while (msg.size() % 64 != 56) msg.push_back(0x00);
    // Append bit length as 64-bit big-endian
    for (int i = 7; i >= 0; --i)
        msg.push_back((uint8_t)((bit_len >> (i * 8)) & 0xFF));

    // Process each 512-bit (64-byte) block
    for (size_t blk = 0; blk < msg.size(); blk += 64) {
        uint32_t W[64];
        // Prepare message schedule
        for (int i = 0; i < 16; ++i) {
            W[i] = ((uint32_t)msg[blk + 4*i + 0] << 24) |
                   ((uint32_t)msg[blk + 4*i + 1] << 16) |
                   ((uint32_t)msg[blk + 4*i + 2] <<  8) |
                   ((uint32_t)msg[blk + 4*i + 3]);
        }
        for (int i = 16; i < 64; ++i) {
            uint32_t s0 = rotr32(W[i-15], 7) ^ rotr32(W[i-15], 18) ^ (W[i-15] >> 3);
            uint32_t s1 = rotr32(W[i-2], 17) ^ rotr32(W[i-2], 19)  ^ (W[i-2]  >> 10);
            W[i] = W[i-16] + s0 + W[i-7] + s1;
        }

        // Compression function
        uint32_t a=H[0], b=H[1], c=H[2], d=H[3],
                 e=H[4], f=H[5], g=H[6], h=H[7];
        for (int i = 0; i < 64; ++i) {
            uint32_t S1   = rotr32(e,6) ^ rotr32(e,11) ^ rotr32(e,25);
            uint32_t ch   = (e & f) ^ (~e & g);
            uint32_t tmp1 = h + S1 + ch + K[i] + W[i];
            uint32_t S0   = rotr32(a,2) ^ rotr32(a,13) ^ rotr32(a,22);
            uint32_t maj  = (a & b) ^ (a & c) ^ (b & c);
            uint32_t tmp2 = S0 + maj;
            h=g; g=f; f=e; e=d+tmp1;
            d=c; c=b; b=a; a=tmp1+tmp2;
        }
        H[0]+=a; H[1]+=b; H[2]+=c; H[3]+=d;
        H[4]+=e; H[5]+=f; H[6]+=g; H[7]+=h;
    }

    Hash256 result;
    for (int i = 0; i < 8; ++i) {
        result[4*i+0] = (H[i] >> 24) & 0xFF;
        result[4*i+1] = (H[i] >> 16) & 0xFF;
        result[4*i+2] = (H[i] >>  8) & 0xFF;
        result[4*i+3] = (H[i]      ) & 0xFF;
    }
    return result;
}

Hash256 MerkleTree::sha256_str(const std::string& s) {
    return sha256(std::vector<uint8_t>(s.begin(), s.end()));
}

// ─── Merkle tree operations ───────────────────────────────────────────────────

void MerkleTree::add_leaf(const std::vector<uint8_t>& data) {
    leaves_.push_back(sha256(data));
}

Hash256 MerkleTree::combine(const Hash256& left, const Hash256& right) {
    std::vector<uint8_t> concat;
    concat.insert(concat.end(), left.begin(),  left.end());
    concat.insert(concat.end(), right.begin(), right.end());
    return sha256(concat);
}

Hash256 MerkleTree::compute_root() const {
    if (leaves_.empty()) {
        Hash256 zero{}; return zero;
    }
    std::vector<Hash256> level = leaves_;
    while (level.size() > 1) {
        std::vector<Hash256> next;
        for (size_t i = 0; i < level.size(); i += 2) {
            if (i + 1 < level.size()) {
                next.push_back(combine(level[i], level[i+1]));
            } else {
                next.push_back(combine(level[i], level[i])); // duplicate last node
            }
        }
        level = std::move(next);
    }
    return level[0];
}

void MerkleTree::clear() {
    leaves_.clear();
}

std::string hash_to_hex(const Hash256& h) {
    std::ostringstream oss;
    oss << std::hex << std::setfill('0');
    for (uint8_t b : h) oss << std::setw(2) << (int)b;
    return oss.str();
}
