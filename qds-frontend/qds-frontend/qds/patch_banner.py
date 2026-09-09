import re

with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

banner_regex = r"\{/\* Conversation panel.*?<ChatPanel"
banner_replacement = """{/* Conversation panel */}
        {latestRound?.verdict === 'REJECT' && (
          <div className="bg-crimson/20 border border-crimson text-crimson text-xs font-mono p-2 text-center uppercase tracking-wider animate-pulse mb-2 rounded">
            ⚠ CRITICAL ALARM: QDS NETWORK COMPROMISED ⚠<br/>Secure communications locked out.
          </div>
        )}
        <ChatPanel"""
text = re.sub(banner_regex, banner_replacement, text, flags=re.DOTALL)

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)