import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

bad_condition = r"if \(simProcess && currentAttack === 'macForge'\) \{"
fixed_condition = "if (currentAttack === 'macForge') {"

text = re.sub(bad_condition, fixed_condition, text)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)