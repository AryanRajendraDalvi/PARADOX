import re
with open('src/views/AdminView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("<EventLogStream logs={roundUpdates} />", "<EventLogStream history={roundUpdates} />")

with open('src/views/AdminView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)