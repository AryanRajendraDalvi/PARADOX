#include "verification_record.hpp"
#include <cstring>

static void push_u32_le(std::vector<uint8_t>& out, uint32_t v) {
    for (int i = 0; i < 4; ++i) { out.push_back(v & 0xFF); v >>= 8; }
}
static void push_u64_le(std::vector<uint8_t>& out, uint64_t v) {
    for (int i = 0; i < 8; ++i) { out.push_back(v & 0xFF); v >>= 8; }
}
static void push_double_le(std::vector<uint8_t>& out, double d) {
    uint64_t bits; std::memcpy(&bits, &d, 8);
    push_u64_le(out, bits);
}

std::vector<uint8_t> VerificationRecord::serialize() const {
    std::vector<uint8_t> out;
    out.reserve(64);
    push_u32_le(out, round_id);
    push_u32_le(out, batch_id);
    push_u64_le(out, (uint64_t)timestamp);
    push_double_le(out, mismatch_rate);
    push_double_le(out, threshold_used);
    push_double_le(out, mermin_value);
    out.push_back((uint8_t)verdict);
    out.push_back((uint8_t)status);
    for (const auto& flag : event_flags) {
        out.push_back((uint8_t)std::min((int)flag.size(), 255));
        for (char c : flag) out.push_back((uint8_t)c);
    }
    return out;
}

std::string VerificationRecord::to_json(
    const std::string& batch_type,
    const std::string& phase,
    bool attack_active,
    const std::string& attack_type,
    int alice_m1, int alice_m2,
    int bob_outcome,
    const std::string& bob_correction_label,
    int charlie_outcome,
    double decoy_qber,
    double tau_hoeffding,
    double tau_cefb,
    double composable_epsilon,
    double fp_rate,
    double fn_rate,
    const std::string& merkle_root,
    bool batch_committed,
    bool mac_verified,
    const std::string& mac_tag,
    double latency_us, double throughput_hz) const
{
    std::ostringstream o;
    o << std::fixed << std::setprecision(4);

    std::ostringstream flags;
    flags << "[";
    for (size_t i = 0; i < event_flags.size(); ++i) {
        if (i) flags << ",";
        flags << "\"" << event_flags[i] << "\"";
    }
    flags << "]";

    std::string mermin_str = (mermin_value > -998.0 && phase == "mermin_test") 
                                ? std::to_string(mermin_value) 
                                : "null";

    std::string bob_correction_str = (bob_correction_label.empty() || bob_correction_label == "decoy" || bob_correction_label == "mermin") 
                                        ? "null" 
                                        : "\"" + bob_correction_label + "\"";

    std::string charlie_measured = (charlie_outcome == -1) ? "false" : "true";
    std::string charlie_basis    = (charlie_outcome == -1) ? "null" : "\"Z\"";
    std::string charlie_out_str  = (charlie_outcome == -1) ? "null" : std::to_string(charlie_outcome);

    std::string batch_id_str = (batch_id == 0) ? "null" : std::to_string(batch_id);

    std::string root_str = merkle_root.empty() ? "null" : "\"" + merkle_root + "\"";

    o << "{\"type\":\"ROUND_UPDATE\","
      << "\"round_id\":"   << round_id  << ","
      << "\"batch_id\":"   << batch_id_str << ","
      << "\"batch_type\":\"" << batch_type << "\","
      << "\"phase\":\""    << phase     << "\","
      << "\"parties\":{"
          << "\"alice\":{\"measured\":true,\"basis\":\"bell\","
                        "\"outcome_bits\":[" << alice_m1 << "," << alice_m2 << "]},"
          << "\"bob\":{\"measured\":true,\"basis\":\"Z\","
                      "\"correction_applied\":" << bob_correction_str << ","
                      "\"outcome\":" << bob_outcome << "},"
          << "\"charlie\":{\"measured\":" << charlie_measured << ",\"basis\":" << charlie_basis << ","
                          "\"outcome\":" << charlie_out_str << "}"
      << "},"
      << "\"checks\":{"
          << "\"decoy_qber\":"     << decoy_qber     << ","
          << "\"mismatch_rate\":"  << mismatch_rate  << ","
          << "\"tau_hoeffding\":"  << tau_hoeffding  << ","
          << "\"tau_cefb\":"       << tau_cefb       << ","
          << "\"mermin_value\":"   << mermin_str    << ","
          << "\"composable_epsilon\":" << composable_epsilon << ","
          << "\"fp_rate\":" << fp_rate << ","
          << "\"fn_rate\":" << fn_rate
      << "},"
      << "\"attack\":{\"active\":" << (attack_active ? "true" : "false")
                    << ",\"type\":\"" << attack_type << "\"},"
      << "\"audit\":{\"merkle_root\":" << root_str << ",\"batch_committed\":" << (batch_committed ? "true" : "false") << "},"
      << "\"auth\":{\"mac_verified\":" << (mac_verified ? "true" : "false") << ",\"mac_tag\":\"" << mac_tag << "\"},"
      << "\"performance\":{\"latency_us\":" << latency_us << ",\"throughput_hz\":" << throughput_hz << "},"
      << "\"verdict\":\""  << verdict_str(verdict) << "\","
      << "\"status\":\""   << status_str(status)   << "\","
      << "\"event_flags\":" << flags.str()
      << "}";

    return o.str();
}