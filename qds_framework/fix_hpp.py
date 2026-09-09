import re

with open('src/simulation/simulation.hpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('const std::string& mac_tag) const;', 'const std::string& mac_tag, double latency_us, double throughput_hz) const;')

with open('src/simulation/simulation.hpp', 'w', encoding='utf-8') as f:
    f.write(text)