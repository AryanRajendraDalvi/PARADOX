import re
with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Calculate recipientRole right after isSender, etc.
match_roles = re.search(r'const isSender = currentRoles.sender === myUserId;\n', text)
if match_roles:
    role_logic = """
  let recipientRole = 'Unknown';
  if (recipientInfo) {
    if (currentRoles.sender === recipientInfo.user_id) recipientRole = 'Sender';
    else if (currentRoles.receiver === recipientInfo.user_id) recipientRole = 'Receiver';
    else if (currentRoles.verifier === recipientInfo.user_id) recipientRole = 'Verifier';
  }
"""
    text = text[:match_roles.end()] + role_logic + text[match_roles.end():]

# 2. Update the header string
text = text.replace("{recipientInfo?.displayName}; Roll: {recipientInfo?.user_id}; online", "{recipientInfo?.displayName}; Role: {recipientRole}; {connection === 'live' ? 'online' : 'offline'}")

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)