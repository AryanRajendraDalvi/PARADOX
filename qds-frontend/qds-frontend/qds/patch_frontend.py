import re

with open('src/views/OverviewMasterView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("bottlenecking throughput to ~1-10 sigs/sec in physical fiber.", "which severely bottlenecks throughput in physical fiber.")

with open('src/views/OverviewMasterView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)