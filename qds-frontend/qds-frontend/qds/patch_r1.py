import re

with open('src/components/CyberDeckControls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacement = "{ id: 'macForge', label: 'MAC FORGE', sub: 'auth breach', color: '#ff003c' },\n  { id: 'impersonate', label: 'IMPERSONATE', sub: 'identity fraud', color: '#ff003c' },\n  { id: 'rogue_verifier', label: 'ROGUE VERIFIER', sub: 'hijack verification', color: '#ffb800' }"
text = text.replace("{ id: 'macForge', label: 'MAC FORGE', sub: 'auth breach', color: '#ff003c' }", replacement)

with open('src/components/CyberDeckControls.jsx', 'w', encoding='utf-8') as f:
    f.write(text)