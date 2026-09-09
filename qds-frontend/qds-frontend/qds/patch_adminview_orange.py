import re
with open('src/views/AdminView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace all white borders with orange borders
text = text.replace('border-white/20', 'border-orange-500')
text = text.replace('bg-black/50', 'bg-black')

with open('src/views/AdminView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)