import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# I will replace the corrupted MessageBubble completely
# The corrupted string ends with `export default function ChatPanel`
bubble_regex = r"function MessageBubble\(\{ msg, isOwn, sendCommand \}\) \{.*?export default function ChatPanel"

bubble_replacement = """function MessageBubble({ msg, isOwn, sendCommand }) {
  const meta = STATUS_META[msg.status] ?? null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 border ${
          isOwn ? 'bg-cyan/10 border-cyan/30' : 'bg-surface-raised border-white/10'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wide text-slate-500">
            {msg.from_display_name ?? (isOwn ? 'You' : 'Unknown')}
            {msg.to_display_name && !isOwn && (
              <span className="text-slate-600"> ➔ {msg.to_display_name}</span>
            )}
            {msg.verification && <span className="text-violet ml-1">✦ verification copy</span>}
            {msg.monitored && <span className="text-amber ml-1">✦ monitored</span>}
          </span>
          <span className="text-[9px] text-slate-600 font-mono">{formatTime(msg.ts)}</span>
        </div>
        
        <div className="text-sm text-slate-200 whitespace-pre-wrap break-words">
          {msg.locked ? <span className="text-slate-500 italic blur-[4px] select-none">{msg.text.replace(/./g, "*")}</span> : msg.text}
        </div>

        {/* VERIFICATION WIDGETS */}
        {msg.locked && !isOwn && !msg.verification && !msg.monitored && (
          <div className="mt-3 p-2 rounded bg-surface/50 border border-cyan/20">
            <div className="text-[10px] text-slate-400 font-mono mb-1">QDS SIGNATURE STATE:</div>
            <div className="text-xs text-cyan font-mono truncate">My Hash: {msg.hash}</div>
            <div className="text-xs text-cyan font-mono truncate mb-2">My MAC Tag: {msg.valid_mac}</div>
            
            {msg.charlie_shared ? (
               <>
                 <div className="text-[10px] text-violet font-mono mt-2 mb-1">VERIFIER SHARE RECEIVED:</div>
                 <div className="text-xs text-violet font-mono truncate mb-2">MAC Tag: {msg.charlie_mac}</div>
                 {msg.verification_failed ? (
                    <div className="text-[10px] text-crimson animate-pulse uppercase">Verification Failed: MAC Mismatch!</div>
                 ) : (
                    <button 
                      onClick={() => sendCommand({ command: 'UNLOCK_MESSAGE', message_id: msg.id })}
                      className="w-full text-xs font-mono bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded py-1 transition-colors"
                    >
                      EXECUTE QUANTUM VERIFICATION
                    </button>
                 )}
               </>
            ) : (
               <div className="text-[10px] text-slate-500 mt-2 animate-pulse uppercase">Waiting for Verifier to share signature...</div>
            )}
          </div>
        )}

        {msg.locked && msg.verification && !msg.monitored && (
          <div className="mt-3 p-2 rounded bg-surface/50 border border-violet/20">
            <div className="text-[10px] text-slate-400 font-mono mb-1">QDS VERIFIER SHARE:</div>
            <div className="text-xs text-violet font-mono truncate">Message Hash: {msg.hash}</div>
            <div className="text-xs text-violet font-mono truncate mb-2">My MAC Tag: {msg.charlie_mac}</div>
            
            {msg.charlie_shared ? (
               <div className="text-[10px] text-slate-500 uppercase">Share transmitted to Receiver.</div>
            ) : (
               <button 
                 onClick={() => sendCommand({ command: 'TRANSMIT_SHARE', message_id: msg.id })}
                 className="w-full text-xs font-mono bg-violet/10 hover:bg-violet/20 text-violet border border-violet/30 rounded py-1 transition-colors"
               >
                 TRANSMIT SHARE TO RECEIVER
               </button>
            )}
          </div>
        )}

        {isOwn && meta && (
          <div className="flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
            <span className="text-[10px] font-mono" style={{ color: meta.color }}>
              {meta.label}
            </span>
            {msg.status === 'failed' && msg.reason && (
              <span className="text-[10px] text-slate-500">— {msg.reason}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPanel"""

new_text = re.sub(bubble_regex, bubble_replacement, text, flags=re.DOTALL)
with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(new_text)