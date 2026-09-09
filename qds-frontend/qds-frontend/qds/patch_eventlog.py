import re
with open('src/components/EventLogStream.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('className="rounded-lg border border-white/5 bg-surface/80 overflow-hidden flex flex-col h-[280px]"', 'className="w-full h-full overflow-hidden flex flex-col"')
text = text.replace('className="rounded-lg border border-white/5 bg-surface/80 overflow-hidden flex flex-col h-full"', 'className="w-full h-full overflow-hidden flex flex-col"')
text = text.replace('className="rounded-lg border border-white/5 bg-surface/80 overflow-hidden flex flex-col"', 'className="w-full h-full overflow-hidden flex flex-col"')
text = text.replace('<div className="flex items-center justify-between px-3 py-2 border-b border-white/5">', '<div className="hidden">')

with open('src/components/EventLogStream.jsx', 'w', encoding='utf-8') as f:
    f.write(text)