import re

with open('src/simulation/simulation.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the broken emit_event definition
broken = r'void Simulation::auto current_time = std::chrono::high_resolution_clock::now\(\);\s*double latency_us = std::chrono::duration<double, std::micro>\(current_time - sim_start_time\)\.count\(\) / round_id_;\s*double throughput_hz = 1000000\.0 / latency_us;\s*emit_event'
text = re.sub(broken, 'void Simulation::emit_event', text)

# Now for the calls to emit_event, they were replaced as:
# auto current_time = ...
# emit_event(..., mac_tag, latency_us, throughput_hz
#         );
# Wait, let's see how they look now.

with open('src/simulation/simulation.cpp', 'w', encoding='utf-8') as f:
    f.write(text)