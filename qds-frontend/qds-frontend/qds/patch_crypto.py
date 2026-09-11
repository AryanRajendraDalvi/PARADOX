import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("require('crypto').createHash", "crypto.createHash")

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)