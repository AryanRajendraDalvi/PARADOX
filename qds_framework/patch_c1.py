import re

with open('src/audit/verification_record.hpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('const std::string& mac_tag) const;', 'const std::string& mac_tag,\n                        double latency_us, double throughput_hz) const;')

with open('src/audit/verification_record.hpp', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/audit/verification_record.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('const std::string& mac_tag) const', 'const std::string& mac_tag,\n      double latency_us, double throughput_hz) const')

auth_line = '      << "\\"auth\\":{\\"mac_verified\\":" << (mac_verified ? "true" : "false") << ",\\"mac_tag\\":\\"" << mac_tag << "\\"},"\n'
new_auth_line = auth_line + '      << "\\"performance\\":{\\"latency_us\\":" << latency_us << ",\\"throughput_hz\\":" << throughput_hz << "},"\n'

text = text.replace(auth_line, new_auth_line)

with open('src/audit/verification_record.cpp', 'w', encoding='utf-8') as f:
    f.write(text)