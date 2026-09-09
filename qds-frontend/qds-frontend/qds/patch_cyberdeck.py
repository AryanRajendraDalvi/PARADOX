import re
with open('src/components/CyberDeckControls.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Force 2 columns
text = text.replace('className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"', 'className="grid grid-cols-2 gap-4"')
# Hide its own title border
text = text.replace('className="rounded-lg border border-white/5 bg-surface/60 p-4"', 'className="w-full h-full flex flex-col justify-center"')
text = text.replace('<div className="text-xs tracking-wide text-slate-500 mb-3">ATTACK CONSOLE</div>', '')

# Make buttons bigger
text = text.replace('className={`relative rounded-md border p-3 flex flex-col items-center justify-center transition-all duration-300 hover:bg-white/5`}', 'className={`relative rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all duration-300 hover:bg-white/5`}')

with open('src/components/CyberDeckControls.jsx', 'w', encoding='utf-8') as f:
    f.write(text)