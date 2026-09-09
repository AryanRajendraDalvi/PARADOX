import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const ATTACKS = ['none', 'intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge'];", "const ATTACKS = ['none', 'intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge', 'impersonate', 'rogue_verifier'];")

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)