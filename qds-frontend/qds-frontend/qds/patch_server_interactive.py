import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the MESSAGE_SEND logic and add TRANSMIT_SHARE and UNLOCK_MESSAGE
message_send_block = r"      const message = \{.*?setTimeout\(\(\) => \{.*?\}, 4000\);\s*return;"

replacement = """      const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
      const valid_mac = crypto.createHmac('sha256', 'qds-key-123').update(text).digest('hex').slice(0, 16);
      let charlie_mac = valid_mac;
      // If we are currently running a macForge attack, simulate Charlie holding a forged/corrupt MAC
      // OR simulate the message MAC being corrupted in transit to Charlie.
      if (simProcess && currentAttack === 'macForge') {
          charlie_mac = crypto.createHmac('sha256', 'bad-key-999').update(text).digest('hex').slice(0, 16);
      }

      const message = {
        id: crypto.randomUUID(),
        session_id: qdsSession.session_id,
        from_user_id: identity.user_id,
        from_display_name: identity.displayName,
        to_user_id,
        to_display_name: receiverConn.displayName,
        text,
        ts: Date.now(),
        locked: true,
        hash,
        valid_mac,
        charlie_mac,
        charlie_shared: false,
        verification_failed: false
      };
      messageHistory.push(message);
      if (messageHistory.length > 500) messageHistory.shift();

      send(receiverConn.ws, 'MESSAGE', { message });

      for (const conn of connections.values()) {
        if (conn.account_type === 'participant' && conn.user_id !== identity.user_id && conn.user_id !== to_user_id) {
          send(conn.ws, 'MESSAGE', { message, verification: true });
        }
        if (conn.account_type === 'admin') {
          send(conn.ws, 'MESSAGE', { message, monitored: true });
        }
      }

      send(ws, 'MESSAGE_ACK', {
        client_id: msg.client_id,
        status: 'delivered',
        message
      });
      return;
    }

    if (msg.command === 'TRANSMIT_SHARE') {
      const targetMsg = messageHistory.find(m => m.id === msg.message_id);
      if (targetMsg) {
        targetMsg.charlie_shared = true;
        for (const conn of connections.values()) {
          send(conn.ws, 'MESSAGE_UPDATE', { message: targetMsg });
        }
      }
      return;
    }

    if (msg.command === 'UNLOCK_MESSAGE') {
      const targetMsg = messageHistory.find(m => m.id === msg.message_id);
      if (targetMsg) {
        if (targetMsg.valid_mac === targetMsg.charlie_mac) {
          targetMsg.locked = false;
        } else {
          targetMsg.verification_failed = true;
        }
        for (const conn of connections.values()) {
          send(conn.ws, 'MESSAGE_UPDATE', { message: targetMsg });
        }
      }
      return;"""

new_text = re.sub(message_send_block, replacement, text, flags=re.DOTALL)
with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(new_text)