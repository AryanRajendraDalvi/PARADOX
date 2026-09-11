import re

with open('src/auth/AuthContext.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('`${window.location.protocol}//${window.location.hostname}:4000`', "'http://localhost:4000'")

with open('src/auth/AuthContext.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/hooks/useSocket.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('`${proto}://${window.location.hostname}:4000`', "'ws://localhost:4000'")

with open('src/hooks/useSocket.js', 'w', encoding='utf-8') as f:
    f.write(text)