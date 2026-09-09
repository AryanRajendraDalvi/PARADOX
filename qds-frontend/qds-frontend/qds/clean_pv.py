import re
with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("`bg-slate-100'}`} flex justify-center items-center font-sans\">", "`bg-slate-100'}\">")

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)