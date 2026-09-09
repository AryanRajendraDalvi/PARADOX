import re
with open('src/components/CyberDeckControls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("{ id: 'rogue_verifier', label: 'ROGUE VERIFIER', sub: 'hijack verification', color: '#ffb800' }\n  { id: 'none'", "{ id: 'rogue_verifier', label: 'ROGUE VERIFIER', sub: 'hijack verification', color: '#ffb800' },\n  { id: 'none'")

with open('src/components/CyberDeckControls.jsx', 'w', encoding='utf-8') as f:
    f.write(text)