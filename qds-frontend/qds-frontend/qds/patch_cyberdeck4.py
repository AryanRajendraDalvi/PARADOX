import re
with open('src/components/CyberDeckControls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("export default function CyberDeckControls({ activeAttack, onTrigger }) {", "export default function CyberDeckControls({ theme = 'dark', activeAttack, onTrigger }) {")
text = text.replace("borderColor: isActive ? btn.color : 'rgba(255,255,255,0.08)',", "borderColor: isActive ? btn.color : (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),")
text = text.replace("background: isActive ? `${btn.color}1a` : 'rgba(255,255,255,0.02)',", "background: isActive ? `${btn.color}1a` : 'transparent',")

with open('src/components/CyberDeckControls.jsx', 'w', encoding='utf-8') as f:
    f.write(text)