import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Only render IdentityBar for admin
match = re.search(r'<IdentityBar session=\{session\} />', text)
if match:
    text = text[:match.start()] + "{session.account_type === 'admin' && <IdentityBar session={session} />}" + text[match.end():]

# Remove pt-14 for participants
text = text.replace('<div className="min-h-screen pt-14">', '<div className={`min-h-screen ${session.account_type === \'admin\' ? \'pt-14\' : \'\'}`}>')

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)