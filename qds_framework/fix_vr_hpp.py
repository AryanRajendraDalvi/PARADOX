import re

with open('src/audit/verification_record.hpp', 'r', encoding='utf-8') as f:
    text = f.read()

sig_old = """    std::string to_json(
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
        const std::string& merkle_root,
        bool batch_committed,
        bool mac_verified,
        const std::string& mac_tag,
        double latency_us, double throughput_hz
    ) const;"""

sig_new = """    std::string to_json(
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
        double latency_us, double throughput_hz
    ) const;"""

text = text.replace(sig_old, sig_new)

with open('src/audit/verification_record.hpp', 'w', encoding='utf-8') as f:
    f.write(text)