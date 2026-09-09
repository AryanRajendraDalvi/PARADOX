import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

arr_regex = r"const network_rejected = \['intercept', 'entangle', 'blind', 'replay'\]\.includes\(currentAttack\);"
arr_replacement = "const network_rejected = ['intercept', 'entangle', 'blind', 'replay', 'batchNoise'].includes(currentAttack);"
text = re.sub(arr_regex, arr_replacement, text)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)