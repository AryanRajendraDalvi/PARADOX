import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

log_regex = r"    if \(msg\.command === 'TRANSMIT_SHARE'\) \{\n      const targetMsg = messageHistory\.find\(m => m\.id === msg\.message_id\);\n      if \(targetMsg\) \{"
log_replacement = """    if (msg.command === 'TRANSMIT_SHARE') {
      console.log('Received TRANSMIT_SHARE for', msg.message_id);
      const targetMsg = messageHistory.find(m => m.id === msg.message_id);
      if (targetMsg) {
        console.log('Found targetMsg, broadcasting MESSAGE_UPDATE');"""
text = re.sub(log_regex, log_replacement, text)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)