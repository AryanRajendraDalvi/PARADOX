import re
with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add theme prop to MessageBubble
text = text.replace("function MessageBubble({ msg, isOwn, sendCommand, latestRound }) {", "function MessageBubble({ msg, isOwn, sendCommand, latestRound, theme }) {")

# Update ChatPanel props
text = text.replace("export default function ChatPanel({\n  hideHeader, messages, connection, selectedRecipient, recipientInfo, sendMessage, sendCommand, myUserId, latestRound }) {", "export default function ChatPanel({\n  theme = 'dark', hideHeader, messages, connection, selectedRecipient, recipientInfo, sendMessage, sendCommand, myUserId, latestRound }) {")

# Pass theme to MessageBubble
text = text.replace("latestRound={latestRound}\n              />", "latestRound={latestRound}\n                  theme={theme}\n              />")

# Update MessageBubble styles
text = text.replace("className={`max-w-[80%] rounded-2xl px-4 py-3 border ${isOwn ? 'border-white/40' : 'border-white/20'}`}", "className={`max-w-[80%] rounded-2xl px-4 py-3 border ${theme === 'dark' ? (isOwn ? 'border-white/40 bg-transparent' : 'border-white/20 bg-transparent') : (isOwn ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white')}`}")
text = text.replace("className=\"text-[10px] font-mono uppercase tracking-wide text-slate-500\"", "className={`text-[10px] font-mono uppercase tracking-wide ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}")
text = text.replace("className=\"text-sm text-blue-400 whitespace-pre-wrap break-words mt-1 mb-2\"", "className={`text-sm whitespace-pre-wrap break-words mt-1 mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-800'}`}")

# Update ChatPanel form styles
text = text.replace('className="p-2 flex gap-4 shrink-0 bg-transparent mb-4 mx-6 border border-white/20 rounded-full items-center"', 'className={`p-2 flex gap-4 shrink-0 mb-4 mx-6 border rounded-full items-center ${theme === \'dark\' ? \'bg-transparent border-white/20\' : \'bg-slate-100 border-slate-300\'}`}')
text = text.replace('className="flex-1 bg-transparent border-none outline-none text-blue-400 placeholder:text-blue-400/50 font-mono text-sm px-4"', 'className={`flex-1 bg-transparent border-none outline-none font-mono text-sm px-4 ${theme === \'dark\' ? \'text-blue-400 placeholder:text-blue-400/50\' : \'text-slate-800 placeholder:text-slate-400\'}`}')
text = text.replace('className="w-10 h-10 shrink-0 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-colors disabled:opacity-50"', 'className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center transition-colors disabled:opacity-50 ${theme === \'dark\' ? \'border-white/20 text-white/50 hover:text-white hover:border-white/50\' : \'border-slate-300 text-slate-500 hover:text-black hover:border-slate-400 bg-white\'}`}')

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)