import re

with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

banner_regex = r"\{/\* Conversation panel \*/\}\n\s*\{latestRound\?\.verdict === 'REJECT' && \(\n\s*<div className=\"bg-crimson/20 border border-crimson text-crimson text-xs font-mono p-2 text-center uppercase tracking-wider animate-pulse mb-2 rounded\">\n\s*⚠ CRITICAL ALARM: QDS NETWORK COMPROMISED ⚠<br/>Secure communications locked out\.\n\s*</div>\n\s*\)\}"
banner_replacement = "{/* Conversation panel */}"
text = re.sub(banner_regex, banner_replacement, text, flags=re.DOTALL)

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)