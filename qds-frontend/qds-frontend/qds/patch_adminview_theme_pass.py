import re
with open('src/views/AdminView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("<CyberDeckControls activeAttack={activeAttack} onTrigger={(id) => sendCommand({ command: 'START', attack: id })} />", "<CyberDeckControls theme={theme} activeAttack={activeAttack} onTrigger={(id) => sendCommand({ command: 'START', attack: id })} />")
# Also pass theme to EventLogStream if needed, but EventLogStream has hardcoded classes. Let's see EventLogStream.

with open('src/views/AdminView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)