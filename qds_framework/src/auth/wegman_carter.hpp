#pragma once
#include <vector>
#include <string>
#include <cstdint>

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Â§2.4  Wegman-Carter information-theoretically secure MAC.
//
// Implements polynomial hashing over GF(p61) where p61 = 2^61 - 1 (Mersenne).
// Security is information-theoretic â€” not dependent on computational hardness.
// Key = (a, b): two 64-bit values in [0, p61).
// MAC(msg, key) = (a * poly_hash(msg) + b) mod p61
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
namespace WegmanCarter {

using Bytes = std::vector<uint8_t>;
using Tag   = uint64_t;

struct Key {
    uint64_t a, b;   // polynomial hash coefficients in GF(p61)
};

// Generate a fresh random key from a 64-bit seed
Bytes to_bytes(const std::string& s);

// Generate a fresh random key from a 64-bit seed
Key generate_key(uint64_t seed);

// Compute MAC tag over message bytes with given key
Tag mac(const Bytes& message, const Key& key);

// Verify a MAC tag
bool verify(const Bytes& msg, Tag expected_tag, const Key& key);

// Build standard authenticated message byte string
inline Bytes build_mac_message(uint32_t round_id, int m1, int m2, const std::string& correction_label) {
    std::string s = std::to_string(round_id) + "," + std::to_string(m1) + "," + std::to_string(m2) + "," + correction_label;
    return to_bytes(s);
}

// Derive next-round key from raw quantum key material bytes.
// Takes first 16 bytes of qkm: bytes [0..7] -> a, bytes [8..15] -> b.
// Reduces both mod p61.  Implements Â§2.4 key bootstrap.
Key refresh_key(const Bytes& quantum_key_material);

// Convenience: convert a std::string to Bytes


} // namespace WegmanCarter
