import re

with open('src/hooks/useSocket.js', 'r', encoding='utf-8') as f:
    text = f.read()

unlock_regex = r"case 'MESSAGE_UNLOCK':.*?return;"
unlock_replacement = """case 'MESSAGE_UPDATE':
          if (!payload.message) return;
          setMessages((prev) => prev.map(m => m.id === payload.message.id ? { ...m, ...payload.message } : m));
          return;"""

new_text = re.sub(unlock_regex, unlock_replacement, text, flags=re.DOTALL)
with open('src/hooks/useSocket.js', 'w', encoding='utf-8') as f:
    f.write(new_text)