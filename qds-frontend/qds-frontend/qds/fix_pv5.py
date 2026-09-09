import re
with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will replace the exact line 76
lines = text.split('\n')
for i in range(len(lines)):
    if 'min-h-screen p-4 flex justify-center items-center font-sans' in lines[i]:
        lines[i] = "    <div className={`min-h-screen p-4 flex justify-center items-center font-sans ${theme === 'dark' ? 'bg-black' : 'bg-slate-100'}`}>"
        break

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))