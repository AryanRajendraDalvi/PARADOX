import re

with open('src/simulation/simulation.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('std::string(mac_hex));', 'std::string(mac_hex), latency_us, throughput_hz);')

with open('src/simulation/simulation.cpp', 'w', encoding='utf-8') as f:
    f.write(text)