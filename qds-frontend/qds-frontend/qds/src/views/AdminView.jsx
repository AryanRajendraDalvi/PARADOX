import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import CyberDeckControls from '../components/CyberDeckControls.jsx';
import EventLogStream from '../components/EventLogStream.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';
import ArcGauge from '../components/ArcGauge.jsx';
import MerminGauge from '../components/MerminGauge.jsx';

export default function AdminView({ frame, roundUpdates, connection, sendCommand, messages, onlineUsers }) {
  const [activeTab, setActiveTab] = useState('Control Panel');
  const [selectedUser, setSelectedUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const { logout } = useAuth();


  const handleUserAction = (action) => {
    if (action === 'Download Chats History') {
      const userMessages = messages.filter(m => m.from_user_id === selectedUser || m.to_user_id === selectedUser);
      const blob = new Blob([JSON.stringify(userMessages, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedUser}_chats.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (action === 'Delete Account') {
      if (window.confirm(`Are you sure you want to delete ${selectedUser}'s account?`)) {
        alert("Account deleted.");
      }
    } else if (action === 'Change Access') {
      alert(`Access level updated for ${selectedUser}.`);
    } else if (action === 'Credentials') {
      alert(`Password reset link generated for ${selectedUser}.`);
    }
  };

  const activeAttack = frame?.checks?.attack_type ?? 'none';

  return (
    <div className={`min-h-screen p-6 font-sans flex flex-col items-center ${theme === 'dark' ? 'bg-black' : 'bg-slate-100'}`}>
      
      {/* Admin Navbar */}
      <div className={`w-full max-w-[1400px] border-2 rounded-[1.5rem] p-4 flex items-center gap-8 mb-4 relative ${theme === 'dark' ? 'border-white/20 bg-black' : 'border-slate-300 bg-white shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-green-500"></div>
          <span className={`text-xl font-medium tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Admin</span>
        </div>
        
        <div className="flex gap-8 items-center flex-1">
          {['Control Panel', 'Dashboard', 'User Management'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-lg font-medium transition-colors ${activeTab === tab 
                ? (theme === 'dark' ? 'text-white' : 'text-slate-900') 
                : (theme === 'dark' ? 'text-blue-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-6">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`text-xl ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-black'}`}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button onClick={logout} className={`text-sm font-mono tracking-wide ${theme === 'dark' ? 'text-red-500 hover:text-red-400' : 'text-red-600 hover:text-red-500'}`}>
            SIGN OUT
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`w-full max-w-[1400px] flex-1 border-2 rounded-[2rem] p-6 flex gap-6 overflow-hidden h-[80vh] ${theme === 'dark' ? 'border-white/20 bg-black' : 'border-slate-300 bg-white shadow-sm'}`}>
        
        {/* =========================================
            TAB 1: CONTROL PANEL
           ========================================= */}
        {activeTab === 'Control Panel' && (
          <>
            {/* Left Panel: Attacks */}
            <div className={`flex-1 flex flex-col border-r-2 pr-6 ${theme === 'dark' ? 'border-white/20' : 'border-slate-200'}`}>
              <h1 className={`text-5xl font-serif italic mb-10 tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Control Panel</h1>
              <div className="flex-1">
                <CyberDeckControls theme={theme} activeAttack={activeAttack} onTrigger={(id) => sendCommand({ command: 'START', attack: id })} />
              </div>
            </div>

            {/* Right Panel: Event Logs */}
            <div className="flex-1 flex flex-col pl-6">
              <div className={`border rounded-xl p-2 mb-4 text-center ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}>
                <span className={`text-lg ${theme === 'dark' ? 'text-blue-400' : 'text-slate-700'}`}>Event Logs</span>
              </div>
              <div className={`flex-1 border rounded-2xl p-4 overflow-hidden ${theme === 'dark' ? 'border-white/20 bg-black' : 'border-slate-300 bg-slate-50 shadow-inner'}`}>
                <EventLogStream history={roundUpdates} />
              </div>
            </div>
          </>
        )}

        {/* =========================================
            TAB 2: DASHBOARD
           ========================================= */}
        {activeTab === 'Dashboard' && (
          <>
            <div className={`flex-1 flex flex-col border-r-2 pr-6 overflow-y-auto ${theme === 'dark' ? 'border-white/20' : 'border-slate-200'}`}>
              <h1 className={`text-5xl font-serif italic mb-8 tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Dashboard</h1>
              
              <div className="flex flex-col items-center gap-8">
                <div className="flex flex-col items-center">
                  <span className={`mb-2 font-mono uppercase text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>Decoy QBER</span>
                  <div className={`border rounded-full p-4 ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}>
                    <ArcGauge
                      label="Decoy"
                      value={frame?.checks?.decoy_qber ?? 0}
                      threshold={frame?.checks?.tau_hoeffding ?? 0.061}
                      domainMax={0.18}
                    />
                  </div>
                  <div className={`mt-4 text-center max-w-[280px] text-xs font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>If &gt; {((frame?.checks?.tau_hoeffding ?? 0.061)*100).toFixed(1)}%:</strong> Eavesdropper detected in quantum channel (Hoeffding bound). Protocol aborts.
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className={`mb-2 font-mono uppercase text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>Mismatch Bound (CEFB)</span>
                  <div className={`border rounded-full p-4 ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}>
                    <ArcGauge
                      label="CEFB Bound"
                      value={frame?.checks?.mismatch_rate ?? 0}
                      threshold={frame?.checks?.tau_cefb ?? 0.089}
                      domainMax={0.18}
                    />
                  </div>
                  <div className={`mt-4 text-center max-w-[280px] text-xs font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>If &gt; {((frame?.checks?.tau_cefb ?? 0.089)*100).toFixed(1)}%:</strong> Information-theoretic MAC forgery becomes mathematically possible. Protocol aborts.
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className={`mb-2 font-mono uppercase text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>Hardware (Mermin)</span>
                  <div className={`border rounded-full p-4 ${theme === 'dark' ? 'border-white/20' : 'border-slate-300'}`}>
                    <MerminGauge value={frame?.checks?.mermin_value ?? null} />
                  </div>
                  <div className={`mt-4 text-center max-w-[280px] text-xs font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>If &lt; 2.0:</strong> Local realism holds. Quantum entanglement is broken. Hardware compromised.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 pl-6 flex items-center justify-center">
              <NetworkTopology frame={frame} />
            </div>
          </>
        )}

        {/* =========================================
            TAB 3: USER MANAGEMENT
           ========================================= */}
        {activeTab === 'User Management' && (
          <>
            <div className={`flex-1 flex flex-col border-r-2 pr-6 ${theme === 'dark' ? 'border-white/20' : 'border-slate-200'}`}>
              <h1 className={`text-5xl font-serif italic mb-10 tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>User Management</h1>
              
              <div className="space-y-4 pl-4">
                {onlineUsers.map(u => (
                  <div 
                    key={u.user_id}
                    onClick={() => setSelectedUser(u.user_id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full border-2 ${selectedUser === u.user_id ? 'border-green-500 bg-green-500' : 'border-green-500/50 group-hover:border-green-500'}`}></div>
                    <span className={`text-xl ${selectedUser === u.user_id ? (theme === 'dark' ? 'text-white' : 'text-slate-900') : (theme === 'dark' ? 'text-blue-400 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900')}`}>{u.displayName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 pl-6 flex items-stretch">
              <div className={`flex-1 border-2 rounded-[2rem] p-8 flex flex-col relative overflow-hidden ${theme === 'dark' ? 'border-white/20' : 'border-slate-300 bg-slate-50'}`}>
                {selectedUser ? (
                  <>
                    <h2 className={`text-3xl font-serif italic mb-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{onlineUsers.find(u => u.user_id === selectedUser)?.displayName}</h2>
                    <div className="space-y-6 pl-2">
                      {['Change Access', 'Credentials', 'Delete Account', 'Download Chats History'].map(opt => (
                        <div key={opt} onClick={() => handleUserAction(opt)} className={`cursor-pointer text-lg transition-colors ${theme === 'dark' ? 'text-blue-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={`flex-1 flex items-center justify-center text-xl font-serif italic ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                    Select a user to manage
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}