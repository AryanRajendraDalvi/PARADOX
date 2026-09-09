import re
with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will replace the exact block
match = re.search(r'<div className=\{`text-sm \$\{theme === \'dark\' \? \'text-blue-400\' : \'text-slate-600\'\}`\}>\s*\{recipientInfo\?\.displayName\} Role: \{recipientRole\} \{connection === \'live\' \? \'online\' : \'offline\'\}\s*</div>', text, re.DOTALL)
if match:
    replacement = """<div className={`text-sm flex items-center gap-6 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-600'}`}>
                    <span>{recipientInfo?.displayName}</span>
                    <span>Role: {recipientRole}</span>
                    <span>{connection === 'live' ? 'online' : 'offline'}</span>
                  </div>"""
    text = text[:match.start()] + replacement + text[match.end():]

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)