import re

with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

filter_regex = r"function filterConversation\(messages, myUserId, peerId\) \{.*?\}\);"
filter_replacement = """function filterConversation(messages, myUserId, peerId) {
  return messages.filter((m) => {
    // Optimistic outgoing (not yet server-confirmed)
    if (m.direction === 'outgoing' && !m.from_user_id) {
      return m.to_user_id === peerId;
    }
    // Confirmed messages in either direction
    if (m.from_user_id === myUserId && m.to_user_id === peerId) return true;
    if (m.from_user_id === peerId && m.to_user_id === myUserId) return true;
    
    // Verification copies: show them in the thread of the person who sent them
    if (m.verification && m.from_user_id === peerId) return true;
    
    return false;
  });"""

new_text = re.sub(filter_regex, filter_replacement, text, flags=re.DOTALL)

count_regex = r"function countUnread\(messages, myUserId, openPeerId\) \{.*?return counts;\n\}"
count_replacement = """function countUnread(messages, myUserId, openPeerId) {
  const counts = {};
  for (const m of messages) {
    if (m.direction !== 'incoming') continue;          // only incoming
    if (m.from_user_id === openPeerId) continue;       // skip the open conversation
    
    if (m.verification) {
       const sender = m.from_user_id;
       counts[sender] = (counts[sender] || 0) + 1;
       continue;
    }
    
    if (m.to_user_id !== myUserId && m.to_user_id) continue; // not addressed to me
    
    const sender = m.from_user_id;
    if (!sender || sender === myUserId) continue;
    counts[sender] = (counts[sender] || 0) + 1;
  }
  return counts;
}"""

new_text = re.sub(count_regex, count_replacement, new_text, flags=re.DOTALL)

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(new_text)