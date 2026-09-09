import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace ChatPanel function signature
chat_regex = r"export default function ChatPanel\(\{ messages, connection, selectedRecipient, recipientInfo, sendMessage, sendCommand, myUserId \}\) \{"
chat_replacement = "export default function ChatPanel({ messages, connection, selectedRecipient, recipientInfo, sendMessage, sendCommand, myUserId, latestRound }) {"
text = re.sub(chat_regex, chat_replacement, text)

# Replace the MessageBubble call inside ChatPanel
call_regex = r"<MessageBubble\n\s*key=\{msg\.client_id \?\? msg\.id\}\n\s*msg=\{msg\}\n\s*isOwn=\{msg\.direction === 'outgoing' \|\| msg\.from_user_id === myUserId\}\n\s*sendCommand=\{sendCommand\}\n\s*\/>"
call_replacement = """<MessageBubble
                key={msg.client_id ?? msg.id}
                msg={msg}
                isOwn={msg.direction === 'outgoing' || msg.from_user_id === myUserId}
                sendCommand={sendCommand}
                latestRound={latestRound}
              />"""
text = re.sub(call_regex, call_replacement, text)

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)