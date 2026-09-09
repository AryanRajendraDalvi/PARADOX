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

function MessageBubble({ msg, isOwn, sendCommand, latestRound, theme }) {
  const meta = STATUS_META[msg.status] ?? null;
  const [verifyPhase, setVerifyPhase] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const startVerification = () => {
    setHasStarted(true);
    // Send command instantly so the server evaluates the attack
    sendCommand({ command: 'UNLOCK_MESSAGE', message_id: msg.id });
  };
  
  const timers = useRef([]);
  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // Wait for the server response (msg.failure_type, msg.locked updated) before animating
  useEffect(() => {
    if (hasStarted && verifyPhase === 0 && (msg.failure_type !== undefined || !msg.locked || msg.verification_failed)) {
       setVerifyPhase(1);
       timers.current.push(setTimeout(() => setVerifyPhase(2), 1500));
       
       if (msg.failure_type === 'stalled') {
          timers.current.push(setTimeout(() => setVerifyPhase(3), 3000));
       } else if (msg.failure_type === 'gradual') {
          timers.current.push(setTimeout(() => setVerifyPhase(3), 3000));
          timers.current.push(setTimeout(() => setVerifyPhase(4), 4500));
       } else {
          timers.current.push(setTimeout(() => setVerifyPhase(3), 3000));
          timers.current.push(setTimeout(() => setVerifyPhase(4), 4500));
          timers.current.push(setTimeout(() => setVerifyPhase(5), 6000));
       }
    }
  }, [hasStarted, verifyPhase, msg.failure_type, msg.locked, msg.verification_failed]);

  const aBits = latestRound?.parties?.alice?.outcome_bits?.join('') ?? '00';
  const bPauli = latestRound?.parties?.bob?.correction_applied ?? 'I';
  const cPauli = latestRound?.parties?.charlie?.correction_applied ?? 'I';
  const cOut = latestRound?.parties?.charlie?.outcome ?? 0;

  // Determine if the message text and padlock should appear locked
  const isVisuallyLocked = msg.locked || (hasStarted && verifyPhase < 5 && msg.failure_type !== 'broken-seal' && msg.failure_type !== 'instant');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 border ${theme === 'dark' ? (isOwn ? 'border-white/40 bg-transparent' : 'border-white/20 bg-transparent') : (isOwn ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white')}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-mono uppercase tracking-wide ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {msg.from_display_name ?? (isOwn ? 'You' : 'Unknown')}
            {msg.to_display_name && !isOwn && (
              <span className="text-slate-600"> -> {msg.to_display_name}</span>
            )}
            {msg.verification && <span className="text-violet ml-1">- verification copy</span>}
            {msg.monitored && <span className="text-amber ml-1">- monitored</span>}
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
          } else if (msg.failure_type === 'rogue-verifier') {
             icon = (<svg className="w-4 h-4 text-[#ffb800]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>);
             color = "bg-[#ffb800]/10 border-[#ffb800]/30";
             status = "Quantum Correlation: VALID ✓ — Verifier MAC: FAILED ✗";
             title = "UNAUTHORIZED VERIFICATION";
          } else if (msg.failure_type === 'broken-seal') {
             icon = (<svg className="w-4 h-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5L21 3m-4.5 9v1.5a7.5 7.5 0 11-15 0v-6a7.5 7.5 0 0113-5" /></svg>);
             color = "bg-crimson/10 border-crimson/30";
             status = "Quantum Correlation: MATCHED \u2713 \u2014 Classical MAC: FAILED \u2717";
             title = "AUTHENTICATION FAILED";
          } else if (!isVisuallyLocked) {
             icon = (<svg className="w-4 h-4 text-phosphor" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>);
             color = "bg-phosphor/10 border-phosphor/30";
             status = "Quantum Signature Verified";
             title = "PAYLOAD DECRYPTED";
          }

          if (isVisuallyLocked || msg.failure_type === 'broken-seal' || msg.failure_type === 'rogue-verifier' || !isVisuallyLocked) {
            return (
              <div className="flex items-center gap-3 mb-3 bg-black/20 p-2 rounded border border-white/5">
                 <div className={`w-8 h-8 rounded flex items-center justify-center border ${color}`}>
                   {icon}
                 </div>
                 <div className="overflow-hidden">
                   <div className="text-[10px] font-mono text-slate-400 truncate">{title}</div>
                   <div className={`text-[9px] font-mono truncate ${msg.failure_type === 'broken-seal' || msg.failure_type === 'instant' ? 'text-crimson' : msg.failure_type ? 'text-amber' : 'text-slate-500'}`}>{status}</div>
                 </div>
              </div>
            );
          }
          return null;
        })()}
        
        <div className={`text-sm whitespace-pre-wrap break-words mt-1 mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-800'}`}>
          {isVisuallyLocked ? <span className="text-slate-500 italic blur-[4px] select-none">{msg.text.replace(/./g, "*")}</span> : msg.text}
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
                 
                 {!hasStarted && !msg.verification_failed ? (
                    <button 
                      onClick={startVerification}
                      className="w-full text-xs font-mono bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded py-1 transition-colors"
                    >
                      EXECUTE QUANTUM VERIFICATION
                    </button>
                 ) : hasStarted && verifyPhase > 0 ? (
                    <div className="text-[10px] font-mono text-cyan space-y-1">
                      {verifyPhase >= 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">1. Correlating GHZ State...</span> [OK]
                        </motion.div>
                      )}
                      {verifyPhase >= 2 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">2. Alice's classical broadcast:</span> |{aBits}>
                        </motion.div>
                      )}
                      {verifyPhase >= 3 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">3. Applying Paulis:</span> Bob({bPauli}), Charlie({cPauli})
                        </motion.div>
                      )}
                      {verifyPhase >= 4 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">4. Charlie's measurement:</span> {cOut} -> Merging pattern...
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
                 ) : msg.verification_failed && msg.failure_type === 'instant' ? (
                    <div className="text-[10px] text-crimson animate-pulse uppercase">Verification Failed: {msg.failure_reason || 'MAC MISMATCH'}!</div>
                 ) : null}
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

export default function ChatPanel({
  theme = 'dark', hideHeader, messages, connection, selectedRecipient, recipientInfo, sendMessage, sendCommand, myUserId, latestRound }) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const canSend = !!selectedRecipient && connection === 'live';

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const [isDrawingGHZ, setIsDrawingGHZ] = useState(false);
  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canSend || isDrawingGHZ) return;
    
    setIsDrawingGHZ(true);
    setDraft('');
    
    setTimeout(() => {
       setIsDrawingGHZ(false);
       sendMessage(text, selectedRecipient);
    }, 3000);
  };

  const placeholder = !selectedRecipient
    ? 'Select a recipient above to start messaging...'
    : connection !== 'live'
    ? 'Not connected to server...'
    : `Message ${recipientInfo?.displayName ?? selectedRecipient}...`;

  return (
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

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble
                key={msg.client_id ?? msg.id}
                msg={msg}
                isOwn={msg.direction === 'outgoing' || msg.from_user_id === myUserId}
                sendCommand={sendCommand}
                latestRound={latestRound}
                  theme={theme}
              />
          ))}
        
            {isDrawingGHZ && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-end pl-8 mb-2 mt-2">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 border border-violet/30 bg-violet/5">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-mono uppercase tracking-wide text-violet animate-pulse">
                       Allocating GHZ Resource Batch...
                     </span>
                   </div>
                   <div className="text-[10px] font-mono text-slate-400">
                     Requesting fresh quantum correlation from hardware...
                   </div>
                </div>
              </motion.div>
            )}
</AnimatePresence>
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">
            No messages yet
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className={`p-2 flex gap-4 shrink-0 mb-4 mx-6 border rounded-full items-center ${theme === 'dark' ? 'bg-transparent border-white/20' : 'bg-slate-100 border-slate-300'}`}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!canSend}
          placeholder={placeholder}
          className={`flex-1 bg-transparent border-none outline-none font-mono text-sm px-4 ${theme === 'dark' ? 'text-blue-400 placeholder:text-blue-400/50' : 'text-slate-800 placeholder:text-slate-400'}`}
        />
        <button
          type="submit"
          disabled={!canSend || !draft.trim()}
          className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center transition-colors disabled:opacity-50 ${theme === 'dark' ? 'border-white/20 text-white/50 hover:text-white hover:border-white/50' : 'border-slate-300 text-slate-500 hover:text-black hover:border-slate-400 bg-white'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      </form>
    </div>
  );
}
