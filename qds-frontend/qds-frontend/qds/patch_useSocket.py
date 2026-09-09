import re

with open('src/hooks/useSocket.js', 'r', encoding='utf-8') as f:
    text = f.read()

unlock_regex = r"case 'ONLINE_USERS':"
unlock_replacement = """case 'MESSAGE_UNLOCK':
          setMessages((prev) => prev.map(m => m.id === payload.message_id ? { ...m, locked: false } : m));
          return;

        case 'ONLINE_USERS':"""

new_text = re.sub(unlock_regex, unlock_replacement, text)
with open('src/hooks/useSocket.js', 'w', encoding='utf-8') as f:
    f.write(new_text)