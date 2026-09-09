import React, { useState, useMemo } from 'react';
import ChatPanel from '../components/ChatPanel.jsx';
import ArcGauge from '../components/ArcGauge.jsx';
import MerminGauge from '../components/MerminGauge.jsx';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <div className="min-h-screen bg-black p-4 flex justify-center items-center font-sans">
      <div className="w-full max-w-[1400px] h-[80vh] flex gap-4">
        
        {/* LEFT SIDEBAR */}
        <div className="w-[200px] flex flex-col shrink-0 rounded-2xl border border-white/20 p-4 relative overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4">
            {recipients.map((u, i) => {
              const active = selectedRecipient === u.user_id;
              const unread = unreadCounts[u.user_id] ?? 0;
              return (
                <div 
                  key={u.user_id}
                  onClick={() => setSelectedRecipient(u.user_id)}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${active ? 'border-white/50 bg-white/5' : 'border-white/10 hover:border-white/30'}`}
                >
                  <div className="text-blue-400 text-lg flex items-center justify-between">
                    {u.displayName}
                    {unread > 0 && <span className="text-[10px] bg-blue-500 text-black px-2 py-0.5 rounded-full">{unread}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 shrink-0">
            <div className="text-green-500 text-xs mb-2">Connected to Server</div>
            <div className="flex items-center gap-2 text-blue-400">
              <div className="w-4 h-4 rounded-full border-2 border-green-500"></div>
              <span className="text-lg">{session.displayName}</span>
            </div>
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="flex-1 rounded-2xl border border-white/20 flex flex-col relative overflow-hidden">
          {!selectedRecipient ? (
            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-white text-6xl font-bold tracking-widest">Service</h1>
            </div>
          ) : (
            <>
              {/* TOP BAR */}
              <div className="h-16 border-b border-white/20 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedRecipient(null)} className="text-blue-400 text-2xl hover:text-white transition-colors">
                    &larr;
                  </button>
                  <div className="text-blue-400 text-sm">
                    {recipientInfo?.displayName}; Roll: {recipientInfo?.user_id}; online
                  </div>
                </div>
                <button onClick={() => setLogsOpen(!logsOpen)} className="text-blue-400 text-2xl hover:text-white transition-colors">
                  &#9776;
                </button>
              </div>

              {/* CHAT AREA */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <ChatPanel
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
              animate={{ width: 320, opacity: 1, marginLeft: 16 }}
              exit={{ width: 0, opacity: 0, marginLeft: 0 }}
              className="shrink-0 flex flex-col rounded-2xl border border-white/20 p-6 overflow-hidden"
            >
              <h2 className="text-white text-2xl mb-8">Logs</h2>
              
              <div className="flex-1 flex flex-col items-center gap-8 overflow-y-auto">
                 {isReceiver && (
                   <>
                      <div className="text-blue-400 text-xs self-start uppercase">Live Channel Metrics</div>
                      <ArcGauge
                        label="Hoeffding Threshold"
                        value={latestRound?.checks?.decoy_qber ?? 0}
                        threshold={latestRound?.checks?.tau_hoeffding ?? 0.061}
                        domainMax={0.18}
                      />
                      <ArcGauge
                        label="CEFB Bound"
                        value={latestRound?.checks?.mismatch_rate ?? 0}
                        threshold={latestRound?.checks?.tau_cefb ?? 0.089}
                        domainMax={0.18}
                      />
                   </>
                 )}

                 {isVerifier && (
                   <>
                      <div className="text-blue-400 text-xs self-start uppercase">Hardware Integrity (Mermin)</div>
                      <MerminGauge value={latestRound?.checks?.mermin_value ?? null} />
                   </>
                 )}

                 {(!isReceiver && !isVerifier) && (
                   <div className="opacity-50 flex items-center justify-center h-32 w-full">
                     <div className="text-blue-400 text-xs text-center">
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