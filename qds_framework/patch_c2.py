import re

# Update simulation.hpp emit_event
with open('src/simulation/simulation.hpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('bool mac_verified,\n                             const std::string& mac_tag) const;', 'bool mac_verified,\n                             const std::string& mac_tag,\n                             double latency_us, double throughput_hz) const;')

with open('src/simulation/simulation.hpp', 'w', encoding='utf-8') as f:
    f.write(text)

# Update simulation.cpp emit_event
with open('src/simulation/simulation.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('bool mac_verified,\n                             const std::string& mac_tag) const\n{', 'bool mac_verified,\n                             const std::string& mac_tag,\n                             double latency_us, double throughput_hz) const\n{')

text = text.replace('merkle_root, batch_committed, mac_verified, mac_tag\n    ) << "\\n";', 'merkle_root, batch_committed, mac_verified, mac_tag,\n        latency_us, throughput_hz\n    ) << "\\n";')

# Update simulation.cpp run()
match_run = re.search(r'void Simulation::run\(\) \{\n    std::uniform_real_distribution<double> roll\(0\.0, 1\.0\);\n', text)
if match_run:
    replacement = """#include <chrono>
void Simulation::run() {
    std::uniform_real_distribution<double> roll(0.0, 1.0);
    auto sim_start_time = std::chrono::high_resolution_clock::now();
"""
    text = text[:match_run.start()] + replacement + text[match_run.end():]

# Add chronos to emit_event calls inside run()
# There are 3 emit_event calls in run() - decoy, verification, and mermin.
text = re.sub(r'(emit_event\([^;]+;)', r'auto current_time = std::chrono::high_resolution_clock::now();\n        double latency_us = std::chrono::duration<double, std::micro>(current_time - sim_start_time).count() / round_id_;\n        double throughput_hz = 1000000.0 / latency_us;\n        \1', text)

# We need to replace the emit_event calls to include the new parameters
text = re.sub(r'mac_tag\n\s*\);', r'mac_tag, latency_us, throughput_hz\n        );', text)

with open('src/simulation/simulation.cpp', 'w', encoding='utf-8') as f:
    f.write(text)