import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_META = {
  sending:   { label: 'Sending...',   color: '#8ea0c9' },
  sent:      { label: 'Sent',        color: '#ffb800' },
  delivered: { label: 'Delivered',   color: '#00ff66' },
  failed:    { label: 'Failed',      color: '#ff003c' }
};

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function MessageBubble({ msg, isOwn, sendCommand, latestRound }) {
  const meta = STATUS_META[msg.status] ?? null;
  const [verifyPhase, setVerifyPhase] = useState(0);

  const startVerification = () => {
    setVerifyPhase(1);
    sendCommand({ command: 'UNLOCK_MESSAGE', message_id: msg.id });
  };
  
  useEffect(() => {
    if (verifyPhase === 1) {
       if (msg.failure_type === 'stalled') {
          setTimeout(() => setVerifyPhase(2), 1500);
          setTimeout(() => setVerifyPhase(3), 3000);
       } else if (msg.failure_type === 'gradual') {
          setTimeout(() => setVerifyPhase(2), 1500);
          setTimeout(() => setVerifyPhase(3), 3000);
          setTimeout(() => setVerifyPhase(4), 4500);
       } else {
          setTimeout(() => setVerifyPhase(2), 1500);
          setTimeout(() => setVerifyPhase(3), 3000);
          setTimeout(() => setVerifyPhase(4), 4500);
          setTimeout(() => setVerifyPhase(5), 6000);
       }
    }
  }, [verifyPhase, msg.failure_type]);

  const aBits = latestRound?.parties?.alice?.outcome_bits?.join('') ?? '00';
  const bPauli = latestRound?.parties?.bob?.correction_applied ?? 'I';
  const cPauli = latestRound?.parties?.charlie?.correction_applied ?? 'I';
  const cOut = latestRound?.parties?.charlie?.outcome ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={lex }
    >
      <div
        className={max-w-[80%] rounded-lg px-3 py-2 border }
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wide text-slate-500">
            {msg.from_display_name ?? (isOwn ? 'You' : 'Unknown')}
            {msg.to_display_name && !isOwn && (
              <span className="text-slate-600"> → {msg.to_display_name}</span>
            )}
            {msg.verification && <span className="text-violet ml-1">— verification copy</span>}
            {msg.monitored && <span className="text-amber ml-1">— monitored</span>}
          </span>
          <span className="text-[9px] text-slate-600 font-mono">{formatTime(msg.ts)}</span>
        </div>
        
        {(() => {
          let icon = (
             <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          );
          let color = "bg-surface border-white/10";
          let status = "Awaiting QDS correlation check...";
          let title = "ENCRYPTED QUANTUM PAYLOAD";

          if (msg.failure_type === 'instant') {
             icon = (<svg className="w-4 h-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
             color = "bg-crimson/10 border-crimson/30";
             status = msg.failure_reason;
             title = "REJECTED";
          } else if (msg.failure_type === 'stalled') {
             icon = (<svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
             color = "bg-amber/10 border-amber/30 animate-pulse";
             status = msg.failure_reason;
          } else if (msg.failure_type === 'gradual') {
             icon = (<svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
             color = "bg-amber/10 border-amber/30 animate-pulse";
             status = msg.failure_reason;
          } else if (msg.failure_type === 'broken-seal') {
             icon = (<svg className="w-4 h-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5L21 3m-4.5 9v1.5a7.5 7.5 0 11-15 0v-6a7.5 7.5 0 0113-5" /></svg>);
             color = "bg-crimson/10 border-crimson/30";
             status = msg.failure_reason;
             title = "MAC VERIFICATION FAILED";
          } else if (!msg.locked) {
             icon = (<svg className="w-4 h-4 text-phosphor" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>);
             color = "bg-phosphor/10 border-phosphor/30";
             status = "Quantum Signature Verified";
             title = "PAYLOAD DECRYPTED";
          }

          if (msg.locked || msg.failure_type === 'broken-seal' || !msg.locked) {
            return (
              <div className="flex items-center gap-3 mb-3 bg-black/20 p-2 rounded border border-white/5">
                 <div className={w-8 h-8 rounded flex items-center justify-center border }>
                   {icon}
                 </div>
                 <div className="overflow-hidden">
                   <div className="text-[10px] font-mono text-slate-400 truncate">{title}</div>
                   <div className={	ext-[9px] font-mono truncate }>{status}</div>
                 </div>
              </div>
            );
          }
          return null;
        })()}
        
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
                 
                 {verifyPhase === 0 && !msg.verification_failed ? (
                    <button 
                      onClick={startVerification}
                      className="w-full text-xs font-mono bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded py-1 transition-colors"
                    >
                      EXECUTE QUANTUM VERIFICATION
                    </button>
                 ) : (
                    <div className="text-[10px] font-mono text-cyan space-y-1">
                      {verifyPhase >= 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">1. Correlating GHZ State...</span> [OK]
                        </motion.div>
                      )}
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
                          <span className="text-slate-400">4. Charlie's measurement:</span> {cOut} → Merging pattern...
                        </motion.div>
                      )}
                      
                      {msg.verification_failed && (msg.failure_type === 'instant' || msg.failure_type === 'broken-seal' || (msg.failure_type === 'stalled' && verifyPhase >= 3) || (msg.failure_type === 'gradual' && verifyPhase >= 4)) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-crimson mt-2 font-bold uppercase animate-pulse">
                          Verification Failed: {msg.failure_reason || 'MAC MISMATCH'}!
                        </motion.div>
                      )}
                      
                      {verifyPhase >= 5 && !msg.verification_failed && (
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
              <span className="text-[10px] text-slate-500">- {msg.reason}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatPanel({ messages, connection, selectedRecipient, recipientInfo, sendMessage, sendCommand, myUserId, latestRound }) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const canSend = !!selectedRecipient && connection === 'live';

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canSend) return;
    sendMessage(text, selectedRecipient);
    setDraft('');
  };

  const placeholder = !selectedRecipient
    ? 'Select a recipient above to start messaging...'
    : connection !== 'live'
    ? 'Not connected to server...'
    : Message ...;

  return (
    <div className="rounded-lg border border-white/5 bg-surface/60 flex flex-col" style={{ height: 440 }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <span className="text-xs tracking-wide text-slate-500">
          {recipientInfo
            ? <span>CONVERSATION WITH <span className="text-slate-300">{recipientInfo.displayName.toUpperCase()}</span></span>
            : 'CONVERSATION'}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={w-1.5 h-1.5 rounded-full }
            style={{ boxShadow: connection === 'live' ? '0 0 6px #00ff66' : '0 0 6px #ff003c' }}
          />
          <span className={	ext-[10px] font-mono }>
            {connection === 'live' ? 'CONNECTED TO SERVER' : connection === 'mock' ? 'NO SERVER — QDS DEMO ONLY' : 'CONNECTING...'}
          </span>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble
                key={msg.client_id ?? msg.id}
                msg={msg}
                isOwn={msg.direction === 'outgoing' || msg.from_user_id === myUserId}
                sendCommand={sendCommand}
                latestRound={latestRound}
              />
          ))}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">
            No messages yet
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t border-white/5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!canSend}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-white/10 bg-bg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan/60 disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!canSend || !draft.trim()}
          className="rounded-md bg-cyan/15 border border-cyan/40 text-cyan text-xs font-mono px-4 py-2 hover:bg-cyan/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          SEND
        </button>
      </form>
    </div>
  );
}