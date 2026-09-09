import React, { useState, useMemo } from 'react';
import ChatPanel from '../components/ChatPanel.jsx';
import ArcGauge from '../components/ArcGauge.jsx';
import MerminGauge from '../components/MerminGauge.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext.jsx';

function filterConversation(messages, myUserId, peerId) {
  return messages.filter((m) => {
    if (m.direction === 'outgoing' && !m.from_user_id) return m.to_user_id === peerId;
    if (m.from_user_id === myUserId && m.to_user_id === peerId) return true;
    if (m.from_user_id === peerId && m.to_user_id === myUserId) return true;
    if (m.verification && m.from_user_id === peerId) return true;
    return false;
  });
}

function countUnread(messages, myUserId, openPeerId) {
  const counts = {};
  for (const m of messages) {
    if (m.direction !== 'incoming') continue;
    if (m.from_user_id === openPeerId) continue;
    
    if (m.verification) {
       const sender = m.from_user_id;
       counts[sender] = (counts[sender] || 0) + 1;
       continue;
    }
    
    if (m.to_user_id !== myUserId && m.to_user_id) continue;
    
    const sender = m.from_user_id;
    if (!sender || sender === myUserId) continue;
    counts[sender] = (counts[sender] || 0) + 1;
  }
  return counts;
}

export default function ParticipantView({ session, connection, messages, onlineUsers, sendMessage, sendCommand, latestRound }) {
  const { logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const myUserId = session.user_id;

  const recipients = useMemo(
    () => onlineUsers.filter((u) => u.user_id !== myUserId),
    [onlineUsers, myUserId]
  );

  React.useEffect(() => {
    if (selectedRecipient && !recipients.some((u) => u.user_id === selectedRecipient)) {
      setSelectedRecipient(null);
    }
  }, [recipients, selectedRecipient]);

  const recipientInfo = recipients.find((u) => u.user_id === selectedRecipient) ?? null;

  const conversationMessages = useMemo(
    () => (selectedRecipient ? filterConversation(messages, myUserId, selectedRecipient) : []),
    [messages, myUserId, selectedRecipient]
  );

  const unreadCounts = useMemo(
    () => countUnread(messages, myUserId, selectedRecipient),
    [messages, myUserId, selectedRecipient]
  );

  const currentRoles = latestRound?.current_roles ?? { sender: 'alice', receiver: 'bob', verifier: 'charlie' };
  const isReceiver = currentRoles.receiver === myUserId;
  const isVerifier = currentRoles.verifier === myUserId;
  const isSender = currentRoles.sender === myUserId;

  let recipientRole = 'Unknown';
  if (recipientInfo) {
    if (currentRoles.sender === recipientInfo.user_id) recipientRole = 'Sender';
    else if (currentRoles.receiver === recipientInfo.user_id) recipientRole = 'Receiver';
    else if (currentRoles.verifier === recipientInfo.user_id) recipientRole = 'Verifier';
  }

  return (
    <div className={`min-h-screen p-4 flex justify-center items-center font-sans ${theme === 'dark' ? 'bg-black' : 'bg-slate-100'}`}>
      <div className="w-full max-w-[1400px] h-[85vh] flex gap-4">
        
        {/* LEFT SIDEBAR */}
        <div className={`w-[220px] flex flex-col shrink-0 rounded-[2rem] border p-6 relative overflow-hidden ${theme === 'dark' ? 'border-white/20 bg-black' : 'border-slate-300 bg-white shadow-sm'}`}>
          <div className="absolute top-6 right-6 z-10">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`text-xl ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-black'}`}>
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 mt-6">
            {recipients.map((u, i) => {
              const active = selectedRecipient === u.user_id;
              const unread = unreadCounts[u.user_id] ?? 0;
              return (
                <div 
                  key={u.user_id}
                  onClick={() => setSelectedRecipient(u.user_id)}
                  className={`cursor-pointer border-b pb-4 transition-colors ${theme === 'dark' ? (active ? 'border-white/50' : 'border-white/20 hover:border-white/40') : (active ? 'border-slate-400' : 'border-slate-200 hover:border-slate-300')}`}
                >
                  <div className={`text-xl flex items-center justify-between ${theme === 'dark' ? (active ? 'text-white' : 'text-blue-400') : (active ? 'text-black' : 'text-slate-600')}`}>
                    {u.displayName}
                    {unread > 0 && <span className="text-[10px] bg-blue-500 text-black px-2 py-0.5 rounded-full">{unread}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 shrink-0">
            <div className="text-green-500 text-xs mb-2">Connected to Server</div>
            <div className="relative">
              <div 
                className={`flex items-center gap-3 cursor-pointer ${theme === 'dark' ? 'text-blue-400' : 'text-slate-600'}`}
                onClick={() => setShowLogout(!showLogout)}
              >
                <div className="w-5 h-5 rounded-full border-[3px] border-green-500"></div>
                <span className={`text-xl transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'}`}>{session.displayName}</span>
              </div>
              <AnimatePresence>
                {showLogout && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={logout}
                    className="absolute bottom-10 left-0 bg-red-900/80 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg border border-red-500/50 shadow-lg"
                  >
                    Sign Out
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className={`flex-1 rounded-[2rem] border flex flex-col relative overflow-hidden ${theme === 'dark' ? 'border-white/20 bg-black' : 'border-slate-300 bg-white shadow-sm'}`}>
          {!selectedRecipient ? (
            <div className="flex-1 flex items-center justify-center">
              <h1 className={`text-6xl font-serif italic tracking-wider opacity-90 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>QDS Threat Detection</h1>
            </div>
          ) : (
            <>
              {/* TOP BAR */}
              <div className={`h-16 border-b flex items-center justify-between px-6 shrink-0 ${theme === 'dark' ? 'border-white/20' : 'border-slate-200'}`}>
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedRecipient(null)} className={`transition-colors text-2xl pb-1 ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-black'}`}>
                    &larr;
                  </button>
                  <div className={`text-sm flex items-center gap-6 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-600'}`}>
                    <span>{recipientInfo?.displayName}</span>
                    <span>Role: {recipientRole}</span>
                    <span>{connection === 'live' ? 'online' : 'offline'}</span>
                  </div>
                </div>
                <button onClick={() => setLogsOpen(!logsOpen)} className={`transition-colors text-2xl flex flex-col gap-1.5 p-2 ${theme === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-black'}`}>
                  <div className="w-6 h-[2px] bg-current"></div>
                  <div className="w-6 h-[2px] bg-current"></div>
                  <div className="w-6 h-[2px] bg-current"></div>
                </button>
              </div>

              {/* CHAT AREA */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                <ChatPanel
                  theme={theme}
                  messages={conversationMessages}
                  connection={connection}
                  selectedRecipient={selectedRecipient}
                  recipientInfo={recipientInfo}
                  sendMessage={sendMessage}
                  sendCommand={sendCommand}
                  myUserId={myUserId}
                  latestRound={latestRound}
                  hideHeader={true}
                />
              </div>
            </>
          )}
        </div>

        {/* LOGS PANEL */}
        <AnimatePresence>
          {logsOpen && selectedRecipient && (
            <motion.div
              initial={{ width: 0, opacity: 0, marginLeft: 0 }}
              animate={{ width: 340, opacity: 1, marginLeft: 16 }}
              exit={{ width: 0, opacity: 0, marginLeft: 0 }}
              className={`shrink-0 flex flex-col rounded-[2rem] border p-6 overflow-hidden ${theme === 'dark' ? 'border-white/20 bg-black' : 'border-slate-300 bg-slate-50 shadow-inner'}`}
            >
              <h2 className={`text-2xl mb-8 font-serif italic ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Logs</h2>
              
              <div className="flex-1 flex flex-col items-center gap-8 overflow-y-auto">
                 {isReceiver && (
                   <>
                      <div className={`text-xs self-start uppercase ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>Live Channel Metrics</div>
                      <ArcGauge
                        label="Hoeffding Threshold"
                        value={latestRound?.checks?.decoy_qber ?? 0}
                        threshold={latestRound?.checks?.tau_hoeffding ?? 0.061}
                        domainMax={0.18}
                      />
                      <div className={`mt-2 text-center max-w-[200px] text-[10px] font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <strong>If &gt; {((latestRound?.checks?.tau_hoeffding ?? 0.061)*100).toFixed(1)}%:</strong> Eavesdropper detected in quantum channel (Hoeffding bound). Protocol aborts.
                      </div>
                      <ArcGauge
                        label="CEFB Bound"
                        value={latestRound?.checks?.mismatch_rate ?? 0}
                        threshold={latestRound?.checks?.tau_cefb ?? 0.089}
                        domainMax={0.18}
                      />
                      <div className={`mt-2 text-center max-w-[200px] text-[10px] font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <strong>If &gt; {((latestRound?.checks?.tau_cefb ?? 0.089)*100).toFixed(1)}%:</strong> Information-theoretic MAC forgery becomes mathematically possible. Protocol aborts.
                      </div>
                   </>
                 )}

                 {isVerifier && (
                   <>
                      <div className={`text-xs self-start uppercase ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>Hardware Integrity (Mermin)</div>
                      <MerminGauge value={latestRound?.checks?.mermin_value ?? null} />
                      <div className={`mt-2 text-center max-w-[200px] text-[10px] font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <strong>If &lt; 2.0:</strong> Local realism holds. Quantum entanglement is broken. Hardware compromised.
                      </div>
                   </>
                 )}

                 {(!isReceiver && !isVerifier) && (
                   <div className="opacity-50 flex items-center justify-center h-32 w-full">
                     <div className={`text-xs text-center ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>
                       {isSender ? 'AWAITING RESPONSE...' : 'NO ACTIVE VERIFICATION ROLE'}
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </div>
  );
}