import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("${isOwn ? 'bg-cyan/10 border-cyan/30' : 'bg-surface-raised border-white/10'}", "${isOwn ? 'border-white/40' : 'border-white/20'}")
text = text.replace('className="text-sm text-slate-200 whitespace-pre-wrap break-words"', 'className="text-sm text-blue-400 whitespace-pre-wrap break-words mt-1 mb-2"')
text = text.replace('rounded-lg px-3 py-2', 'rounded-2xl px-4 py-3')

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)