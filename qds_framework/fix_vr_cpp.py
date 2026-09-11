import re

with open('src/audit/verification_record.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

sig_old = """    double tau_cefb,
    const std::string& merkle_root,
    bool batch_committed,
    bool mac_verified,
    const std::string& mac_tag,
      double latency_us, double throughput_hz) const"""

sig_new = """    double tau_cefb,
    double composable_epsilon,
    double fp_rate,
    double fn_rate,
    const std::string& merkle_root,
    bool batch_committed,
    bool mac_verified,
    const std::string& mac_tag,
      double latency_us, double throughput_hz) const"""

text = text.replace(sig_old, sig_new)

json_old = """      << "\"checks\":{"
          << "\"decoy_qber\":"     << decoy_qber     << ","
          << "\"mismatch_rate\":"  << mismatch_rate  << ","
          << "\"tau_hoeffding\":"  << tau_hoeffding  << ","
          << "\"tau_cefb\":"       << tau_cefb       << ","
          << "\"mermin_value\":"   << mermin_str
      << "},"
      << "\"attack\":{\"active\":" << (attack_active ? "true" : "false")"""

json_new = """      << "\"checks\":{"
          << "\"decoy_qber\":"     << decoy_qber     << ","
          << "\"mismatch_rate\":"  << mismatch_rate  << ","
          << "\"tau_hoeffding\":"  << tau_hoeffding  << ","
          << "\"tau_cefb\":"       << tau_cefb       << ","
          << "\"mermin_value\":"   << mermin_str    << ","
          << "\"composable_epsilon\":" << composable_epsilon << ","
          << "\"fp_rate\":" << fp_rate << ","
          << "\"fn_rate\":" << fn_rate
      << "},"
      << "\"attack\":{\"active\":" << (attack_active ? "true" : "false")"""

text = text.replace(json_old, json_new)

with open('src/audit/verification_record.cpp', 'w', encoding='utf-8') as f:
    f.write(text)