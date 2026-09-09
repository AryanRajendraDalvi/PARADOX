import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will find the start of the `ChatPanel` return statement and replace up to `<div ref={listRef}`
match = re.search(r'  return \(\s*<div className="flex flex-col flex-1 h-full bg-transparent">.*?<div ref=\{listRef\}', text, re.DOTALL)
if match:
    replacement = """  return (
    <div className="flex flex-col flex-1 h-full bg-transparent">
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <span className="text-xs tracking-wide text-slate-500">
            {recipientInfo
              ? <span>CONVERSATION WITH <span className="text-slate-300">{recipientInfo.displayName.toUpperCase()}</span></span>
              : 'CONVERSATION'}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${connection === 'live' ? 'bg-phosphor' : 'bg-crimson'}`}
              style={{ boxShadow: connection === 'live' ? '0 0 6px #00ff66' : '0 0 6px #ff003c' }}
            />
            <span className={`text-[10px] font-mono ${connection === 'live' ? 'text-phosphor' : 'text-crimson'}`}>
              {connection === 'live' ? 'CONNECTED TO SERVER' : connection === 'mock' ? 'NO SERVER - QDS DEMO ONLY' : 'CONNECTING...'}
            </span>
          </div>
        </div>
      )}

      <div ref={listRef}"""
    text = text[:match.start()] + replacement + text[match.end():]

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)