import re
with open('src/components/CyberDeckControls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Move reset to the end
text = text.replace("  { id: 'none', label: 'RESET', sub: 'clean channel', color: '#00ff66' },\n", "")
text = text.replace("];", "  { id: 'none', label: 'RESET', sub: 'clean channel', color: '#00ff66' }\n];")

# Make reset span 2 columns
text = text.replace('className={`relative rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all duration-300 hover:bg-white/5`}', 'className={`relative rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all duration-300 hover:bg-white/5 ${btn.id === \'none\' ? \'col-span-2 mt-4\' : \'\'}`}')

with open('src/components/CyberDeckControls.jsx', 'w', encoding='utf-8') as f:
    f.write(text)