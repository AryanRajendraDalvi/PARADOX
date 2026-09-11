import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Sliders, Activity, Users, FileText, Settings, HelpCircle, Sun, Moon } from 'lucide-react';


const IllustrationBackground = ({ theme }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div 
      className="absolute bottom-0 left-0 w-full h-[60vh] bg-bottom bg-cover"
      style={{
        backgroundImage: 'url("/background.png")',
        opacity: theme === 'dark' ? 0.2 : 0.6,
        filter: theme === 'dark' ? 'brightness(0.8) saturate(0.8)' : 'none',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)'
      }}
    />
  </div>
);

const SidebarBackground = ({ theme }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div 
      className="absolute bottom-0 left-0 w-full h-[60vh] bg-bottom bg-cover"
      style={{
        backgroundImage: 'url("/sidebar-bg.png")',
        opacity: theme === 'dark' ? 0.2 : 0.6,
        filter: theme === 'dark' ? 'brightness(0.8) saturate(0.8)' : 'none',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%)'
      }}
    />
  </div>
);

export default function DashboardLayout({ children, role, user, activeTab, onTabChange, theme, setTheme }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminTabs = [
    { id: 'Dashboard', icon: <Home size={20} /> },
    { id: 'Control Panel', icon: <Sliders size={20} /> },
    { id: 'Live Monitoring', icon: <Activity size={20} /> },
    { id: 'Network Participants', icon: <Users size={20} /> },
    { id: 'Event Logs', icon: <FileText size={20} /> },
    { id: 'System Settings', icon: <Settings size={20} /> },
  ];

  const userTabs = [
    { id: 'Home', icon: <Home size={20} /> },
    { id: 'People', icon: <Users size={20} /> },
    { id: 'Channel Status', icon: <Activity size={20} /> },
    { id: 'Help', icon: <HelpCircle size={20} /> },
  ];

  const tabs = role === 'admin' ? adminTabs : userTabs;

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${theme === 'dark' ? 'bg-gradient-to-b from-[#0f172a] to-[#040814] text-slate-200' : 'bg-gradient-to-b from-[#f0f4f8] to-[#e2e8f0] text-slate-800'}`}>
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 transform transition-transform duration-300 ease-in-out
        flex flex-col border-r
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${theme === 'dark' ? 'bg-[#0B1121]/80 backdrop-blur-xl border-[#1F2937]' : 'bg-white/80 backdrop-blur-xl border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'}
      `}>
        <SidebarBackground theme={theme} />
        {/* Logo Area */}
        <div className="relative z-10 h-16 flex items-center px-6 border-b border-transparent">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border-2 ${theme === 'dark' ? 'border-blue-400' : 'border-blue-600'} flex items-center justify-center`}>
              <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-600'}`}></div>
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-lg leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>PARADOX</span>
              <span className={`text-[9px] uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Quantum Digital<br/>Signature System</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.4)]' : 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)] font-semibold')
                    : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50')
                  }
                `}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-sm tracking-wide">{tab.id}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Vector Art Placeholder */}
        <div className="p-6 relative overflow-hidden mt-auto">
          
          <div className={`text-xs mt-12 relative z-10 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Secure Communication<br/>for a Safer Tomorrow
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <IllustrationBackground theme={theme} />
        
        {/* Top Header */}
        <header className={`
          relative z-10 h-16 px-4 sm:px-8 flex items-center justify-between shrink-0
          ${theme === 'dark' ? 'bg-transparent' : 'bg-transparent'}
        `}>
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-slate-200 text-slate-600'}`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${role === 'admin' ? 'bg-blue-600' : 'bg-emerald-500'}`}>
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (role === 'admin' ? 'A' : 'U')}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className={`text-sm font-semibold leading-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{user?.displayName || (role === 'admin' ? 'Admin' : 'User')}</span>
                <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10">
          {children}
        </div>

      </main>

    </div>
  );
}
