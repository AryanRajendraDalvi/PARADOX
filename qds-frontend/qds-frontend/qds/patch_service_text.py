import re
with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(">Service</h1>", ">QDS Threat Detection</h1>")

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)