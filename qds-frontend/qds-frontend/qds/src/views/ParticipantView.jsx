import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import { TimeSeriesChart } from '../components/LiveCharts.jsx';
import ArcGauge from '../components/ArcGauge.jsx';

export default function ParticipantView({ session, connection, messages, onlineUsers, sendMessage, sendCommand, latestRound, roundUpdates }) {
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedUser, setSelectedUser] = useState(null);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  React.useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);
  const decoyQBER = latestRound?.checks?.decoy_qber ?? 0;
  const tauHoeffding = latestRound?.checks?.tau_hoeffding ?? 0.061;
  const isSimulating = (latestRound?.metrics?.total_rounds ?? 0) > 0;
  const activeAttack = latestRound?.attack?.type ?? 'none';
  const isQuantumAttack = ['intercept', 'entangle', 'blind', 'batchNoise'].includes(activeAttack);
  const isClassicalAttack = ['replay', 'macForge', 'impersonate', 'rogue_verifier'].includes(activeAttack);
  
  const quantumStatusColor = isQuantumAttack ? 'text-red-500' : 'text-emerald-500';
  const quantumBgColor = isQuantumAttack ? 'bg-red-500' : 'bg-emerald-500';
  const quantumText = isQuantumAttack ? 'Compromised' : 'Nominal';
  const quantumShadow = isQuantumAttack ? 'rgba(239,68,68,0.8)' : 'rgba(16,185,129,0.8)';
  
  const classicalStatusColor = isClassicalAttack ? 'text-red-500' : 'text-emerald-500';
  const classicalBgColor = isClassicalAttack ? 'bg-red-500' : 'bg-emerald-500';
  const classicalText = isClassicalAttack ? 'Compromised' : 'Authenticated';
  const classicalShadow = isClassicalAttack ? 'rgba(239,68,68,0.8)' : 'rgba(16,185,129,0.8)';
  
  const channelHealthColor = (isQuantumAttack || isClassicalAttack) ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
  const channelHealthIconBg = (isQuantumAttack || isClassicalAttack) ? 'bg-red-500' : 'bg-emerald-500';
  const channelHealthIconText = (isQuantumAttack || isClassicalAttack) ? '!' : '✓';
  const channelHealthText = (isQuantumAttack || isClassicalAttack) ? 'Channel under attack. Metrics exceed secure bounds.' : 'Channel is healthy. All metrics within secure bounds.';


  const getConversationMessages = (userId) => {
    return messages.filter(
      (m) =>
        (m.from_user_id === session.user_id && m.to_user_id === userId) ||
        (m.from_user_id === userId && m.to_user_id === session.user_id) ||
        (m.verification && session.user_id === 'charlie' && m.from_user_id === userId)
    ).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  };

  const conversationMessages = selectedUser ? getConversationMessages(selectedUser.user_id) : [];

  const unreadCounts = {};
  onlineUsers.forEach(u => {
    if (u.user_id === session.user_id) return;
    let count = 0;
    const convo = getConversationMessages(u.user_id);
    convo.forEach(m => {
      // If we are charlie and there is a pending verification
      if (m.verification && !m.charlie_shared && session.user_id === 'charlie') {
        count++;
      }
    });
    unreadCounts[u.user_id] = count;
  });


  // Empty State Component
  const EmptyState = ({ message, action }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
      <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-300'}`}>
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
      </div>
      <h3 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Select a user</h3>
      <p className={`text-sm max-w-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{message}</p>
    </div>
  );

  return (
    <DashboardLayout theme={theme} setTheme={setTheme} role="user" user={{ displayName: session.displayName || session.user_id }} activeTab={activeTab} onTabChange={setActiveTab}>
      
      {/* =========================================
          TAB 1: HOME
         ========================================= */}
      {activeTab === 'Home' && (
        <div className="w-full h-full rounded-xl overflow-hidden relative flex items-center justify-center bg-transparent">
          
          <div className="z-10 w-full px-12 md:px-24">
            <h2 className={`text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'} drop-shadow-sm leading-tight`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Trusted<br/>Quantum Signatures
            </h2>
            <p className={`mt-6 text-2xl md:text-3xl font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
              for a Secure Future
            </p>
            <div className={`mt-8 w-16 h-1 rounded ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'}`}></div>
          </div>
        </div>
      )}

      {/* =========================================
          TAB 2: PEOPLE (CHAT)
         ========================================= */}
      {activeTab === 'People' && (
        <div className={`h-full rounded-xl border flex overflow-hidden ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'border-white/60 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
          
          {/* Left Column: User List */}
          <div className={`w-1/3 border-r flex flex-col ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
              <input type="text" placeholder="Search users..." className={`w-full px-3 py-2 rounded text-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`} />
            </div>
            <div className="flex-1 overflow-y-auto">
              {onlineUsers.filter(u => u.user_id !== session.user_id).map(u => (
                <div 
                  key={u.user_id} 
                  onClick={() => setSelectedUser(u)}
                  className={`p-4 flex items-center justify-between cursor-pointer border-b last:border-0 transition-colors
                    ${selectedUser?.user_id === u.user_id ? (theme === 'dark' ? 'bg-slate-800' : 'bg-blue-50') : (theme === 'dark' ? 'border-slate-700 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50')}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.account_type === 'admin' ? 'bg-blue-600' : 'bg-emerald-500'}`}>
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{u.displayName}</div>
                      
                      <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {unreadCounts[u.user_id] > 0 && (
                      <div className="bg-violet text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {unreadCounts[u.user_id]} Pending Share
                      </div>
                    )}
                    <div className={`text-xl opacity-30 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>›</div>
                  </div>

                </div>
              ))}
              {onlineUsers.length <= 1 && (
                <div className={`p-8 text-center text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  No other nodes are currently connected.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chat Panel */}
          <div className="flex-1 flex flex-col bg-transparent">
            {!selectedUser ? (
              <EmptyState message="Your secure messages will appear here." />
            ) : (
              <ChatPanel 
                myUserId={session.user_id}
                messages={conversationMessages} 
                sendMessage={sendMessage} 
                sendCommand={sendCommand} 
                latestRound={latestRound}
                selectedRecipient={selectedUser.user_id}
                recipientInfo={selectedUser}
                theme={theme}
                connection={connection}
              />
            )}
          </div>
        </div>
      )}

      {/* =========================================
          TAB 3: CHANNEL STATUS
         ========================================= */}
      {activeTab === 'Channel Status' && (
        <div className="h-full flex flex-col gap-6">
          {false ? (
            <div className={`flex-1 rounded-xl border flex items-center justify-center ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
               <EmptyState message="No verification activity detected. Waiting for protocol execution..." />
            </div>
          ) : (
            <>
              {/* Top Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <h4 className="text-sm font-semibold text-slate-500 mb-6">Quantum Channel</h4>
                  <div className={`flex items-center gap-3 font-bold text-2xl mb-2 ${quantumStatusColor}`}>
                      <span className={`w-4 h-4 rounded-full ${quantumBgColor}`} style={{ boxShadow: `0 0 12px ${quantumShadow}` }}></span> {quantumText}
                    </div>
                  <div className="text-xs text-slate-500">QBER: {(decoyQBER * 100).toFixed(2)}% | Threshold: {(tauHoeffding * 100).toFixed(2)}%</div>
                </div>

                <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <h4 className="text-sm font-semibold text-slate-500 mb-6">Classical Channel</h4>
                  <div className={`flex items-center gap-3 font-bold text-2xl mb-2 ${classicalStatusColor}`}>
                      <span className={`w-4 h-4 rounded-full ${classicalBgColor}`} style={{ boxShadow: `0 0 12px ${classicalShadow}` }}></span> {classicalText}
                    </div>
                  <div className="text-xs text-slate-500">Latency: 12 ms | Status: Stable</div>
                </div>
              </div>

              {/* Chart Area */}
              <div className={`flex-1 rounded-xl border p-6 flex flex-col ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                <h4 className="text-sm font-semibold text-slate-500 mb-6">Channel Metrics (Live)</h4>
                <div className="flex-1 w-full min-h-0 mb-6">
                    <TimeSeriesChart 
                       data={roundUpdates || []} 
                       dataKey="qber" 
                       color={theme === 'dark' ? '#38bdf8' : '#0284c7'} 
                       label="Decoy QBER" 
                       thresholdKey="hoeffding" 
                       thresholdColor={theme === 'dark' ? '#fbbf24' : '#d97706'} 
                       domain={[0, 15]} 
                       formatPercent={true} 
                       theme={theme} 
                    />
                  </div>
                <div className={`p-4 rounded-lg border text-sm font-medium flex items-center gap-3 ${channelHealthColor}`}>
                    <span className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-xs ${channelHealthIconBg}`}>{channelHealthIconText}</span>
                    {channelHealthText}
                  </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================
          TAB 4: HELP
         ========================================= */}
      {activeTab === 'Help' && (
        <div className={`h-full rounded-xl border p-8 ${theme === 'dark' ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}>
          <h2 className="text-2xl font-semibold mb-6">Help & Documentation</h2>
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-lg font-medium text-blue-500">How to send a secure message?</h3>
            <p className="opacity-80">Navigate to the "People" tab, select a connected node from the list, and type your message. The message will be classically authenticated and its signature verified using the quantum state distributed during the latest batch.</p>
            
            <h3 className="text-lg font-medium text-blue-500 mt-8">What does "Channel Status" mean?</h3>
            <p className="opacity-80">The Channel Status tab monitors the physical integrity of the quantum link. If Eve attempts to eavesdrop or tamper with the quantum channel, the QBER (Quantum Bit Error Rate) will spike above the theoretical threshold, and the system will instantly abort the protocol to guarantee your security.</p>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
