import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace UNLOCK_MESSAGE logic
unlock_regex = r"    if \(msg\.command === 'UNLOCK_MESSAGE'\) \{.*?return;\n    \}"
unlock_replacement = """    if (msg.command === 'UNLOCK_MESSAGE') {
      const targetMsg = messageHistory.find(m => m.id === msg.message_id);
      if (targetMsg) {
        const network_rejected = ['intercept', 'entangle', 'blind', 'replay'].includes(currentAttack);
        if (targetMsg.valid_mac === targetMsg.charlie_mac && !network_rejected) {
          targetMsg.locked = false;
        } else {
          targetMsg.verification_failed = true;
          targetMsg.failure_reason = network_rejected ? 'QDS ALARM: NETWORK REJECT' : 'MAC MISMATCH';
        }
        for (const conn of connections.values()) {
          send(conn.ws, 'MESSAGE_UPDATE', { message: targetMsg });
        }
      }
      return;
    }"""

text = re.sub(unlock_regex, unlock_replacement, text, flags=re.DOTALL)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)