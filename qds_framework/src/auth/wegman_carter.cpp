#include "wegman_carter.hpp"
#include <random>
#include <stdexcept>
#include <cstring>

namespace WegmanCarter {

// p61 = 2^61 - 1 (Mersenne prime)
static constexpr uint64_t P61 = (1ULL << 61) - 1;

// ─── Arithmetic in GF(p61) ───────────────────────────────────────────────────

// Reduce a 128-bit product mod p61 using Mersenne reduction.
// Uses the identity: x * 2^61 ≡ x (mod p61)  →  x mod p61 = (x_hi * 2 + x_lo_upper) ... simplified:
// For a 64-bit value: reduce simply with one conditional subtraction.
static uint64_t reduce61(uint64_t x) {
    // x is already < 2^62, so one step suffices
    uint64_t q = (x >> 61);
    x = (x & P61) + q;
    if (x >= P61) x -= P61;
    return x;
}

// Multiply two values in GF(p61) using __uint128_t for the product
static uint64_t mul61(uint64_t a, uint64_t b) {
    __uint128_t product = (__uint128_t)a * b;
    uint64_t lo = (uint64_t)(product & P61);
    uint64_t hi = (uint64_t)(product >> 61);
    return reduce61(lo + hi);
}

static uint64_t add61(uint64_t a, uint64_t b) {
    return reduce61(a + b);
}

// ─── Polynomial hash ──────────────────────────────────────────────────────────

// Treat message as big-endian uint64_t chunks; evaluate polynomial at point `a` mod p61.
// poly_hash(msg, a) = msg[0]*a^k + msg[1]*a^{k-1} + ... + msg[k] (Horner's scheme)
static uint64_t poly_hash(const WegmanCarter::Bytes& msg, uint64_t a) {
    uint64_t h = 0;
    // Process 8 bytes at a time; pad last block with zeros
    const size_t n = msg.size();
    size_t i = 0;
    while (i < n) {
        uint64_t chunk = 0;
        for (int k = 0; k < 8 && i < n; ++k, ++i)
            chunk = (chunk << 8) | msg[i];
        if (i < n || (n % 8 != 0)) {
            // shift remaining bytes left if partial block
            // (already correct: bytes were placed at top of chunk)
        }
        h = add61(mul61(h, a), chunk % P61);
    }
    return h;
}

// ─── Public API ───────────────────────────────────────────────────────────────

Key generate_key(uint64_t seed) {
    std::mt19937_64 rng(seed);
    Key k;
    k.a = rng() % P61;
    k.b = rng() % P61;
    return k;
}

Tag mac(const Bytes& message, const Key& key) {
    uint64_t h = poly_hash(message, key.a);
    return add61(h, key.b);
}

bool verify(const Bytes& message, Tag tag, const Key& key) {
    // Compute expected tag and compare (note: timing side-channel is
    // acceptable for a simulation; production would use constant-time compare)
    Tag expected = mac(message, key);
    return expected == tag;
}

Key refresh_key(const Bytes& quantum_key_material) {
    if (quantum_key_material.size() < 16)
        throw std::invalid_argument("refresh_key: need at least 16 bytes of quantum key material");
    uint64_t a = 0, b = 0;
    for (int i = 0; i < 8; ++i) a = (a << 8) | quantum_key_material[i];
    for (int i = 8; i < 16; ++i) b = (b << 8) | quantum_key_material[i];
    return Key{ a % P61, b % P61 };
}

Bytes to_bytes(const std::string& s) {
    return Bytes(s.begin(), s.end());
}

} // namespace WegmanCarter
