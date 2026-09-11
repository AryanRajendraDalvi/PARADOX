import re

with open('src/simulation/simulation.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("decoy_injector_.total_decoy()", "decoy_injector_.matched_basis_count()")

with open('src/simulation/simulation.cpp', 'w', encoding='utf-8') as f:
    f.write(text)