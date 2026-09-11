import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldAlert, RefreshCw, Activity, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import CyberDeckControls from '../components/CyberDeckControls.jsx';
import EventLogStream from '../components/EventLogStream.jsx';
import LiveCharts from '../components/LiveCharts.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';
import ArcGauge from '../components/ArcGauge.jsx';
import MerminGauge from '../components/MerminGauge.jsx';

export default function AdminView({ frame, roundUpdates, connection, sendCommand, messages, onlineUsers }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedUser, setSelectedUser] = useState(null);

  // Derived metrics
  const activeAttack = frame?.attack?.type ?? 'none';
  const totalRounds = frame?.metrics?.total_rounds ?? 0;
  const isSimulating = totalRounds > 0 || activeAttack !== 'none';
  const decoyQBER = frame?.checks?.decoy_qber ?? 0;
  const tauHoeffding = frame?.checks?.tau_hoeffding ?? 0.061;
  const mismatchRate = frame?.checks?.mismatch_rate ?? 0;
  const tauCefb = frame?.checks?.tau_cefb ?? 0.089;
  const merminValue = frame?.checks?.mermin_value ?? null;
  const isQuantumAttack = ['intercept', 'entangle', 'blind', 'batchNoise'].includes(activeAttack);
  const isClassicalAttack = ['replay', 'macForge', 'impersonate', 'rogue_verifier'].includes(activeAttack);
  
  const quantumStatusColor = isQuantumAttack ? 'text-red-500' : 'text-emerald-500';
  const quantumBgColor = isQuantumAttack ? 'bg-red-500' : 'bg-emerald-500';
  const quantumText = isQuantumAttack ? 'Compromised' : 'Nominal';
  
  const classicalStatusColor = isClassicalAttack ? 'text-red-500' : 'text-emerald-500';
  const classicalBgColor = isClassicalAttack ? 'bg-red-500' : 'bg-emerald-500';
  const classicalText = isClassicalAttack ? 'Compromised' : 'Authenticated';
  
  const lastVerificationStatus = frame?.verdict === 'REJECT' ? 'FAILED' : 'VERIFIED';
  const lastVerificationColor = frame?.verdict === 'REJECT' ? 'text-red-500' : 'text-emerald-500';

  const verificationSuccess = (100 - (mismatchRate * 100)).toFixed(2);

  // Determine theme from localStorage/document for internal components that need it
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  React.useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Empty State Component
  const EmptyState = ({ message, action }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
      <div className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-300'}`}>
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
      </div>
      <h3 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>No Data Yet</h3>
      <p className={`text-sm max-w-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{message}</p>
      {action && (
        <button onClick={action} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          Start Simulation
        </button>
      )}
    </div>
  );

  return (
    <DashboardLayout theme={theme} setTheme={setTheme} role="admin" user={{ displayName: 'Admin' }} activeTab={activeTab} onTabChange={setActiveTab}>
      
      {/* =========================================
          TAB 1: DASHBOARD
         ========================================= */}
      {activeTab === 'Dashboard' && (
        <div className="flex flex-col gap-6 h-full">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 shrink-0">
            {[
              { label: 'Connected Nodes', value: onlineUsers.length, icon: <Users size={24} />, color: 'text-blue-500' },
              { label: 'Active Attacks', value: activeAttack === 'none' ? 0 : 1, icon: <ShieldAlert size={24} />, color: activeAttack === 'none' ? 'text-emerald-500' : 'text-red-500' },
              { label: 'Total Rounds', value: totalRounds, icon: <RefreshCw size={24} />, color: 'text-violet-500' },
              { label: 'Channel Status', value: activeAttack === 'none' ? 'Nominal' : 'Compromised', icon: <Activity size={24} />, color: activeAttack === 'none' ? 'text-emerald-500' : 'text-amber-500' },
              { label: 'Verification Success', value: `${isSimulating ? verificationSuccess : '--'}%`, icon: <CheckCircle size={24} />, color: 'text-emerald-500' }
            ].map((stat, i) => (
              <div key={i} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'} flex items-center gap-4`}>
                <div className={`text-2xl ${stat.color}`}>{stat.icon}</div>
                <div>
                  <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                  <div className={`text-[10px] uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {false ? (
            <EmptyState message="No simulation data available yet. Run a simulation from the Control Panel to begin monitoring the quantum network." action={() => setActiveTab('Control Panel')} />
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
              {/* Left Column: Topology & Events */}
              <div className="flex-1 flex flex-col gap-6 min-h-0">
                <div className={`flex-1 rounded-xl border p-4 flex flex-col ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Quantum Network Topology</h3>
                  <div className="flex-1 min-h-[200px]">
                    <NetworkTopology frame={frame} theme={theme} attack={activeAttack} macVerified={true} />
                  </div>
                </div>
                <div className={`flex-1 rounded-xl border p-4 flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Recent Events</h3>
                    <button onClick={() => setActiveTab('Event Logs')} className="text-xs text-blue-500 hover:underline">View All →</button>
                  </div>
                  <div className="flex-1 overflow-auto text-sm">
                    {/* Minimal Event Table */}
                    <table className="w-full text-left">
                      <thead>
                        <tr className={`border-b ${theme === 'dark' ? 'border-[#1F2937] text-slate-400' : 'border-slate-200/50 text-slate-500'}`}>
                          <th className="pb-2 font-medium">Time</th>
                          <th className="pb-2 font-medium">Event</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roundUpdates.slice(-5).reverse().map((r, i) => (
                          <tr key={i} className={`border-b ${theme === 'dark' ? 'border-slate-700/30 text-slate-300' : 'border-slate-100/50 text-slate-700'}`}>
                            <td className="py-2 text-xs opacity-70">14:32:16</td>
                            <td className="py-2 text-xs">Round #{r.round_id}</td>
                            <td className={`py-2 text-xs font-medium ${r.verdict === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {r.verdict === 0 ? 'SUCCESS' : 'REJECT'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Metrics Gauges */}
              <div className={`w-full lg:w-80 rounded-xl border p-6 flex flex-col gap-8 overflow-y-auto ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Live Metrics</h3>
                
                <div className="flex flex-col items-center">
                  <span className={`text-xs mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Decoy QBER</span>
                  <ArcGauge label="QBER" value={decoyQBER} threshold={tauHoeffding} domainMax={0.18} baseColor="#2563EB" />
                </div>
                
                <div className="flex flex-col items-center">
                  <span className={`text-xs mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>CEFB Bound</span>
                  <ArcGauge label="Mismatch" value={mismatchRate} threshold={tauCefb} domainMax={0.18} baseColor="#0F766E" />
                </div>

                <div className="flex flex-col items-center">
                  <span className={`text-xs mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Mermin Value</span>
                  <MerminGauge value={merminValue} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TAB 2: CONTROL PANEL
         ========================================= */}
      {activeTab === 'Control Panel' && (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className={`text-xl font-medium mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Simulated Attacks</h2>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Trigger real-world attack vectors against the quantum network.</p>
            <div className={`flex-1 rounded-xl border p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
              <CyberDeckControls theme={theme} activeAttack={activeAttack} onTrigger={(id) => sendCommand({ command: 'START', attack: id })} />
            </div>
          </div>
          </div>
        )}

        {/* =========================================
          TAB 3: LIVE MONITORING
         ========================================= */}
      {activeTab === 'Live Monitoring' && (
        <div className="h-full flex flex-col">
          {false ? (
            <EmptyState message="Waiting for protocol execution... No live telemetry to display." action={() => setActiveTab('Control Panel')} />
          ) : (
            <>
              {/* Real-time Charts */}
                <LiveCharts history={roundUpdates} theme={theme} />

              {/* Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Quantum Channel</h4>
                  <div className={`flex items-center gap-2 font-bold text-lg ${quantumStatusColor}`}>
                      <span className={`w-3 h-3 rounded-full ${quantumBgColor}`}></span> {quantumText}
                    </div>
                </div>
                <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Classical Channel</h4>
                  <div className={`flex items-center gap-2 font-bold text-lg ${classicalStatusColor}`}>
                      <span className={`w-3 h-3 rounded-full ${classicalBgColor}`}></span> {classicalText}
                    </div>
                </div>
                <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Last Verification</h4>
                  <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} space-y-1`}>
                    <div><span className="opacity-50">ID:</span> SIG-{Math.floor(Math.random() * 9000) + 1000}</div>
                    <div><span className="opacity-50">Status:</span> <span className={lastVerificationColor}>{lastVerificationStatus}</span></div>
                  </div>
                </div>
                <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Recent Activity</h4>
                  <div className="text-xs space-y-2 opacity-80">
                    <div>User A joined</div>
                    <div>Batch #42 signed</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================================
          TAB 4: NETWORK PARTICIPANTS
         ========================================= */}
      {activeTab === 'Network Participants' && (
        <div className={`h-full rounded-xl border p-6 flex flex-col ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
          <h2 className={`text-xl font-medium mb-6 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Node Registry</h2>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-sm ${theme === 'dark' ? 'border-[#1F2937] text-slate-400' : 'border-slate-200/50 text-slate-500'}`}>
                <th className="pb-3 font-medium">Node Name</th>
                <th className="pb-3 font-medium">Node ID</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {onlineUsers.map(u => (
                <tr key={u.user_id} className={`border-b text-sm ${theme === 'dark' ? 'border-slate-800 text-slate-200' : 'border-slate-100 text-slate-700'}`}>
                  <td className="py-4 font-medium">{u.displayName}</td>
                  <td className="py-4 opacity-60">{u.user_id}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected
                    </span>
                  </td>
                  <td className="py-4 opacity-60">Participant</td>
                  <td className="py-4 text-right">
                    <button className="text-slate-400 hover:text-blue-500 px-2"><Edit2 size={16} /></button>
                    <button className="text-slate-400 hover:text-red-500 px-2"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================
          TAB 5: EVENT LOGS
         ========================================= */}
      {activeTab === 'Event Logs' && (
        <div className={`h-full rounded-xl border p-6 flex flex-col ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>System Events</h2>
            <div className="flex gap-2">
              <input type="text" placeholder="Search logs..." className={`px-3 py-1.5 rounded text-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-300'}`} />
              <button className={`px-3 py-1.5 rounded text-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-300'}`}>Filter</button>
            </div>
          </div>
          
          {false ? (
            <EmptyState message="No events recorded yet." />
          ) : (
            <div className={`flex-1 overflow-hidden border rounded-lg ${theme === 'dark' ? 'border-slate-700 bg-black/50' : 'border-slate-300 bg-slate-50'}`}>
              <EventLogStream history={roundUpdates} />
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TAB 6: SYSTEM SETTINGS
         ========================================= */}
      {activeTab === 'System Settings' && (
        <div className={`h-full rounded-xl border p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
          <h2 className={`text-xl font-medium mb-6 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>System Settings</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-2">
              <button className={`w-full text-left px-4 py-2 rounded bg-blue-600/10 text-blue-500 font-medium`}>General</button>
              <button className={`w-full text-left px-4 py-2 rounded ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Simulation</button>
              <button className={`w-full text-left px-4 py-2 rounded ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Security</button>
              <button className={`w-full text-left px-4 py-2 rounded ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Appearance</button>
            </div>
            
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>System Name</label>
                <input type="text" defaultValue="Quantum Digital Signature System" className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`} />
              </div>
              
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Advanced Parameters (Read-only)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">CEFB Threshold Baseline</label>
                    <input type="text" disabled value="0.089" className="w-full px-3 py-2 rounded border bg-transparent opacity-50 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Hoeffding Bounds</label>
                    <input type="text" disabled value="0.061" className="w-full px-3 py-2 rounded border bg-transparent opacity-50 cursor-not-allowed" />
                  </div>
                </div>
              </div>
              
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium mt-4">Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
