import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

globals_str = """
const commandTimestamps = new Map();
const recentHashes = new Set();
const authFailures = new Map();
let threat_model_active = false;
let activeClassicalFlags = new Set();
"""
text = text.replace('const tokens = new Map();', 'const tokens = new Map();' + globals_str)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)