import re

with open('src/components/MerminGauge.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

val_regex = r"value = attack === 'entangle' \? 2\.05 : lastValue;"
val_replacement = "value = (attack === 'entangle' || attack === 'blind') ? 2.05 : lastValue;"
text = re.sub(val_regex, val_replacement, text)

with open('src/components/MerminGauge.jsx', 'w', encoding='utf-8') as f:
    f.write(text)