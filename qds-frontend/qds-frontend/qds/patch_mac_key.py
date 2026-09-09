import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

mac_regex = r"const valid_mac = crypto\.createHmac\('sha256', 'qds-key-123'\)\.update\(text\)\.digest\('hex'\)\.slice\(0, 16\);"
mac_replacement = """const dynamic_qkd_key = crypto.randomBytes(16).toString('hex');
        const valid_mac = crypto.createHmac('sha256', dynamic_qkd_key).update(text).digest('hex').slice(0, 16);"""
text = re.sub(mac_regex, mac_replacement, text)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)