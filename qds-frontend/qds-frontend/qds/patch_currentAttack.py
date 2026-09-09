import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Declare currentAttack
declare_regex = r"const ATTACKS = \['none', 'intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge'\];"
declare_replacement = "const ATTACKS = ['none', 'intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge'];\nlet currentAttack = 'none';"
text = re.sub(declare_regex, declare_replacement, text)

# Update currentAttack on START
start_regex = r"const nextAttack = ATTACKS\.includes\(msg\.attack\) \? msg\.attack : 'none';\n\s*qdsSession\.session_id = 'run-' \+ crypto\.randomUUID\(\);"
start_replacement = "const nextAttack = ATTACKS.includes(msg.attack) ? msg.attack : 'none';\n      currentAttack = nextAttack;\n      qdsSession.session_id = 'run-' + crypto.randomUUID();"
text = re.sub(start_regex, start_replacement, text)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)