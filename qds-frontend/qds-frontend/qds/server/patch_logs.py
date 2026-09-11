import re

with open('index.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_old = """    if (!identity) {
        threat_model_active = true;
        activeClassicalFlags.add('premature_command');
        return;
    }"""

start_new = """    if (!identity) {
        threat_model_active = true;
        activeClassicalFlags.add('premature_command');
        return;
    }
    console.log("Past identity check");"""
text = text.replace(start_old, start_new)

start_old2 = """    // B2: Replay detection"""
start_new2 = """    console.log("Past B1");\n    // B2: Replay detection"""
text = text.replace(start_old2, start_new2)

start_old3 = """    if (msg.command === 'PING') {"""
start_new3 = """    console.log("Past B2");\n    if (msg.command === 'PING') {"""
text = text.replace(start_old3, start_new3)

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(text)