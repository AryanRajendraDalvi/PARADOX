import re
with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("`bg-slate-100'}`\">", "`bg-slate-100'}`}")
text = text.replace("\"w-[220px] flex flex-col shrink-0 rounded-[2rem] border p-6 relative overflow-hidden ${theme === 'dark' ? 'border-white/20 bg-black' : 'border-slate-300 bg-white shadow-sm'}\"", "`w-[220px] flex flex-col shrink-0 rounded-[2rem] border p-6 relative overflow-hidden ${theme === 'dark' ? 'border-white/20 bg-black' : 'border-slate-300 bg-white shadow-sm'}`")

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)