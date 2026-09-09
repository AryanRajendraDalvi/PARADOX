import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the verification failed div
fail_regex = r"<div className=\"text-\[10px\] text-crimson animate-pulse uppercase\">Verification Failed: MAC Mismatch!</div>"
fail_replacement = """<div className="text-[10px] text-crimson animate-pulse uppercase">Verification Failed: {msg.failure_reason || 'MAC MISMATCH'}!</div>"""

text = re.sub(fail_regex, fail_replacement, text)

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)