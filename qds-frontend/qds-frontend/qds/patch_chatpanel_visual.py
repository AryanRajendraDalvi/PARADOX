import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace MessageBubble definition
bubble_regex = r"function MessageBubble\(\{ msg, isOwn, sendCommand \}\) \{.*?export default function ChatPanel"

bubble_replacement = """function MessageBubble({ msg, isOwn, sendCommand, latestRound }) {
  const meta = STATUS_META[msg.status] ?? null;
  const [verifyPhase, setVerifyPhase] = useState(0);

  const startVerification = () => {
    setVerifyPhase(1);
    setTimeout(() => setVerifyPhase(2), 1500);
    setTimeout(() => setVerifyPhase(3), 3000);
    setTimeout(() => setVerifyPhase(4), 4500);
    setTimeout(() => {
      setVerifyPhase(5);
      sendCommand({ command: 'UNLOCK_MESSAGE', message_id: msg.id });
    }, 6000);
  };

  const aBits = latestRound?.parties?.alice?.outcome_bits?.join('') ?? '00';
  const bPauli = latestRound?.parties?.bob?.correction_applied ?? 'I';
  const cPauli = latestRound?.parties?.charlie?.correction_applied ?? 'I';
  const cOut = latestRound?.parties?.charlie?.outcome ?? 0;

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
                 <div className="text-xs text-violet font-mono truncate mb-3">MAC Tag: {msg.charlie_mac}</div>
                 
                 {msg.verification_failed ? (
                    <div className="text-[10px] text-crimson animate-pulse uppercase">Verification Failed: MAC Mismatch!</div>
                 ) : verifyPhase === 0 ? (
                    <button 
                      onClick={startVerification}
                      className="w-full text-xs font-mono bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded py-1 transition-colors"
                    >
                      EXECUTE QUANTUM VERIFICATION
                    </button>
                 ) : (
                    <div className="text-[10px] font-mono text-cyan space-y-1">
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <span className="text-slate-400">1. Correlating GHZ State...</span> [OK]
                      </motion.div>
                      {verifyPhase >= 2 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">2. Alice's classical broadcast:</span> |{aBits}⟩
                        </motion.div>
                      )}
                      {verifyPhase >= 3 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">3. Applying Paulis:</span> Bob({bPauli}), Charlie({cPauli})
                        </motion.div>
                      )}
                      {verifyPhase >= 4 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">4. Charlie's measurement:</span> {cOut} ➔ Merging pattern...
                        </motion.div>
                      )}
                      {verifyPhase >= 5 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 mt-2 font-bold uppercase animate-pulse">
                          QDS SIGNATURE VALID!
                        </motion.div>
                      )}
                    </div>
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