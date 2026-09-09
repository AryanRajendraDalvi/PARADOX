import re
with open('src/components/CyberDeckControls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("style={{ color: isActive ? btn.color : '#c3cfe8' }}", "style={{ color: isActive ? btn.color : (theme === 'dark' ? '#c3cfe8' : '#475569') }}")

with open('src/components/CyberDeckControls.jsx', 'w', encoding='utf-8') as f:
    f.write(text)