import re

with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add theme state
match_state = re.search(r'const \[showLogout, setShowLogout\] = useState\(false\);', text)
text = text[:match_state.end()] + "\n  const [theme, setTheme] = useState('dark');" + text[match_state.end():]

# 2. Add theme prop to ChatPanel
text = text.replace('<ChatPanel\n                  messages={conversationMessages}', '<ChatPanel\n                  theme={theme}\n                  messages={conversationMessages}')

# 3. Replace static dark classes with dynamic
text = text.replace('className="min-h-screen bg-black p-4', 'className={`min-h-screen p-4 flex justify-center items-center font-sans ${theme === \'dark\' ? \'bg-black\' : \'bg-slate-100\'}`}')
text = text.replace('w-[220px] flex flex-col shrink-0 rounded-[2rem] border border-white/20 p-6 relative overflow-hidden', 'w-[220px] flex flex-col shrink-0 rounded-[2rem] border p-6 relative overflow-hidden ${theme === \'dark\' ? \'border-white/20 bg-black\' : \'border-slate-300 bg-white shadow-sm\'}')

text = text.replace('className={`cursor-pointer border-b pb-4 transition-colors ${active ? \'border-white/50\' : \'border-white/20 hover:border-white/40\'}`}', 'className={`cursor-pointer border-b pb-4 transition-colors ${theme === \'dark\' ? (active ? \'border-white/50\' : \'border-white/20 hover:border-white/40\') : (active ? \'border-slate-400\' : \'border-slate-200 hover:border-slate-300\')}`}')
text = text.replace('className={`text-xl flex items-center justify-between ${active ? \'text-white\' : \'text-blue-400\'}`}', 'className={`text-xl flex items-center justify-between ${theme === \'dark\' ? (active ? \'text-white\' : \'text-blue-400\') : (active ? \'text-black\' : \'text-slate-600\')}`}')

# Inject toggle button above recipients
match_recipients = re.search(r'<div className="flex-1 overflow-y-auto space-y-4">', text)
toggle_btn = """<div className="absolute top-6 right-6 z-10">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`text-xl ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-black'}`}>
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 mt-6">"""
text = text[:match_recipients.start()] + toggle_btn + text[match_recipients.end():]

# Main panel classes
text = text.replace('className="flex-1 rounded-[2rem] border border-white/20 flex flex-col relative overflow-hidden bg-black"', 'className={`flex-1 rounded-[2rem] border flex flex-col relative overflow-hidden ${theme === \'dark\' ? \'border-white/20 bg-black\' : \'border-slate-300 bg-white shadow-sm\'}`}')
text = text.replace('className="text-white text-6xl font-serif italic tracking-wider opacity-90"', 'className={`text-6xl font-serif italic tracking-wider opacity-90 ${theme === \'dark\' ? \'text-white\' : \'text-black\'}`}')

text = text.replace('className="h-16 border-b border-white/20 flex items-center justify-between px-6 shrink-0"', 'className={`h-16 border-b flex items-center justify-between px-6 shrink-0 ${theme === \'dark\' ? \'border-white/20\' : \'border-slate-200\'}`}')
text = text.replace('className="text-white/60 hover:text-white transition-colors text-2xl pb-1"', 'className={`transition-colors text-2xl pb-1 ${theme === \'dark\' ? \'text-white/60 hover:text-white\' : \'text-slate-400 hover:text-black\'}`}')
text = text.replace('className="text-blue-400 text-sm"', 'className={`text-sm ${theme === \'dark\' ? \'text-blue-400\' : \'text-slate-600\'}`}')
text = text.replace('className="text-white/60 hover:text-white transition-colors text-2xl flex flex-col gap-1.5 p-2"', 'className={`transition-colors text-2xl flex flex-col gap-1.5 p-2 ${theme === \'dark\' ? \'text-white/60 hover:text-white\' : \'text-slate-400 hover:text-black\'}`}')

text = text.replace('className="shrink-0 flex flex-col rounded-[2rem] border border-white/20 p-6 overflow-hidden bg-black"', 'className={`shrink-0 flex flex-col rounded-[2rem] border p-6 overflow-hidden ${theme === \'dark\' ? \'border-white/20 bg-black\' : \'border-slate-300 bg-slate-50 shadow-inner\'}`}')
text = text.replace('className="text-white text-2xl mb-8 font-serif italic"', 'className={`text-2xl mb-8 font-serif italic ${theme === \'dark\' ? \'text-white\' : \'text-black\'}`}')
text = text.replace('className="text-blue-400 text-xs self-start uppercase"', 'className={`text-xs self-start uppercase ${theme === \'dark\' ? \'text-blue-400\' : \'text-slate-500\'}`}')
text = text.replace('className="text-blue-400 text-xs text-center"', 'className={`text-xs text-center ${theme === \'dark\' ? \'text-blue-400\' : \'text-slate-500\'}`}')

# Also fix the connection display area (session.displayName)
text = text.replace('className="flex items-center gap-3 text-blue-400 cursor-pointer"', 'className={`flex items-center gap-3 cursor-pointer ${theme === \'dark\' ? \'text-blue-400\' : \'text-slate-600\'}`}')
text = text.replace('className="text-xl hover:text-white transition-colors"', 'className={`text-xl transition-colors ${theme === \'dark\' ? \'hover:text-white\' : \'hover:text-black\'}`}')

# NOTE: The "min-h-screen bg-black" replacement above might have had `min-h-screen bg-black p-4 flex justify-center items-center font-sans`
# But it was `min-h-screen bg-black p-4 flex justify-center items-center font-sans`. I already replaced it with template literal.

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)