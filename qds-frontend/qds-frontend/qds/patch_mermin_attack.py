import re

with open('src/components/MerminGauge.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

sig_regex = r"export default function MerminGauge\(\{ value \}\) \{"
sig_replacement = "export default function MerminGauge({ value, attack }) {"
text = re.sub(sig_regex, sig_replacement, text)

val_regex = r"value = lastValue;"
val_replacement = "value = attack === 'entangle' ? 2.05 : lastValue;"
text = re.sub(val_regex, val_replacement, text)

with open('src/components/MerminGauge.jsx', 'w', encoding='utf-8') as f:
    f.write(text)