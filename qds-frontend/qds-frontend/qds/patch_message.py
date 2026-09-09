import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

message_send_block = r"""      const message = {
        id: crypto.randomUUID\(\),
        session_id: qdsSession.session_id,
        from_user_id: identity.user_id,
        from_display_name: identity.displayName,
        to_user_id,
        to_display_name: receiverConn.displayName,
        text,
        ts: Date.now\(\)
      };
      messageHistory.push\(message\);
      if \(messageHistory.length > 500\) messageHistory.shift\(\);

      // Deliver to the intended receiver only.*?send\(ws, 'MESSAGE_ACK'.*?return;"""

replacement = """      const message = {
        id: crypto.randomUUID(),
        session_id: qdsSession.session_id,
        from_user_id: identity.user_id,
        from_display_name: identity.displayName,
        to_user_id,
        to_display_name: receiverConn.displayName,
        text,
        ts: Date.now(),
        locked: true
      };
      messageHistory.push(message);
      if (messageHistory.length > 500) messageHistory.shift();

      // Deliver to receiver (locked)
      send(receiverConn.ws, 'MESSAGE', { message });

      // Deliver verification copies to all other participants (Charlie)
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
      
      // Simulate QDS verification delay
      setTimeout(() => {
        message.locked = false;
        if (connections.has(to_user_id)) {
           send(connections.get(to_user_id).ws, 'MESSAGE_UNLOCK', { message_id: message.id });
        }
        if (connections.has(identity.user_id)) {
           send(connections.get(identity.user_id).ws, 'MESSAGE_UNLOCK', { message_id: message.id });
        }
        // Also update verifiers and admins just in case they render it
        for (const conn of connections.values()) {
          if ((conn.account_type === 'participant' && conn.user_id !== identity.user_id && conn.user_id !== to_user_id) || conn.account_type === 'admin') {
            send(conn.ws, 'MESSAGE_UNLOCK', { message_id: message.id });
          }
        }
      }, 4000);
      return;"""

new_text = re.sub(message_send_block, replacement, text, flags=re.DOTALL)
with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(new_text)