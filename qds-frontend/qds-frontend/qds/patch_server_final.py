import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Patch MESSAGE_SEND for replay
msg_send_regex = r"          locked: true,\n          hash,"
msg_send_replacement = """          locked: currentAttack !== 'replay',
          verification_failed: currentAttack === 'replay',
          failure_type: currentAttack === 'replay' ? 'instant' : null,
          failure_reason: currentAttack === 'replay' ? 'DUPLICATE — ALREADY UNLOCKED AS ROUND ' + Math.floor(Math.random() * 50 + 10) : null,
          hash,"""
text = re.sub(msg_send_regex, msg_send_replacement, text)

# Patch UNLOCK_MESSAGE
unlock_regex = r"    if \(msg\.command === 'UNLOCK_MESSAGE'\) \{.*?return;\n    \}"
unlock_replacement = """    if (msg.command === 'UNLOCK_MESSAGE') {
      const targetMsg = messageHistory.find(m => m.id === msg.message_id);
      if (targetMsg) {
        if (currentAttack === 'blind' && targetMsg.valid_mac === targetMsg.charlie_mac) {
           targetMsg.locked = false;
        } else if (currentAttack === 'batchNoise') {
           targetMsg.verification_failed = true;
           targetMsg.failure_type = 'gradual';
           targetMsg.failure_reason = 'CEFB BOUND EXCEEDED';
        } else if (currentAttack === 'intercept' || currentAttack === 'entangle') {
           targetMsg.verification_failed = true;
           targetMsg.failure_type = 'stalled';
           targetMsg.failure_reason = 'CHANNEL DISTURBANCE DETECTED';
        } else if (targetMsg.valid_mac !== targetMsg.charlie_mac) {
           targetMsg.verification_failed = true;
           targetMsg.failure_type = 'broken-seal';
           targetMsg.failure_reason = 'MAC VERIFICATION FAILURE';
           targetMsg.locked = false;
        } else {
           targetMsg.locked = false;
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