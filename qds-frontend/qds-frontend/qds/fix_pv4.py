import re
with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'bg-slate-100\'\}`">', r'bg-slate-100\'}`}>', text)

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)