import re
import os

filepath = r'C:\Users\ARYAN\.gemini\antigravity\brain\77847984-bfb8-47d6-bff1-826501666a73\qds_architecture_report.md'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("This bottlenecks the theoretical throughput to the physical limits of the fiber optic channel and single-photon detector dead-time (often yielding < 1 to 10 signatures per second in physical lab environments).", "This severely bottlenecks the theoretical throughput to the physical limits of the fiber optic channel and single-photon detector dead-time.")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)