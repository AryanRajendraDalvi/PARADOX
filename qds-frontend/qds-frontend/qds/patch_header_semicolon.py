import re
with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("{recipientInfo?.displayName}; Role: {recipientRole}; {connection === 'live' ? 'online' : 'offline'}", "{recipientInfo?.displayName} Role: {recipientRole} {connection === 'live' ? 'online' : 'offline'}")

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)