import re
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("{session.account_type === 'admin' && <IdentityBar session={session} />}", "")
text = text.replace("className={`min-h-screen ${session.account_type === 'admin' ? 'pt-14' : ''}`}", 'className="min-h-screen"')

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)