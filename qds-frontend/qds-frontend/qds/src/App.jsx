import React from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { useSocket } from './hooks/useSocket.js';
import LoginView from './views/LoginView.jsx';
import ParticipantView from './views/ParticipantView.jsx';
import AdminView from './views/AdminView.jsx';

function IdentityBar({ session }) {
  const { logout } = useAuth();
  return (
    <div className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 py-2.5 border-b border-white/5 bg-surface/90 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-slate-200">{session.displayName}</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan/30 text-cyan">
          {session.account_type === 'admin' ? 'Administrator' : 'Participant'}
        </span>
        {session.mock && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber/30 text-amber">
            DEV MOCK AUTH â€” no session server connected
          </span>
        )}
      </div>
      <button onClick={logout} className="text-[11px] font-mono text-slate-500 hover:text-crimson transition-colors">
        SIGN OUT
      </button>
    </div>
  );
}

function AuthenticatedApp({ session }) {
  const { latestRound, roundUpdates, messages, onlineUsers, connection, sendCommand, sendMessage } =
    useSocket(undefined, session.token);

  return (
    <div className="min-h-screen">
      
      {session.account_type === 'admin' ? (
        <AdminView
          frame={latestRound}
          roundUpdates={roundUpdates}
          connection={connection}
          sendCommand={sendCommand}
          messages={messages}
          onlineUsers={onlineUsers}
        />
      ) : (
        <ParticipantView
          session={session}
          connection={connection}
          messages={messages}
          onlineUsers={onlineUsers}
          sendMessage={sendMessage}
          sendCommand={sendCommand}
          latestRound={latestRound}
        />
      )}
    </div>
  );
}

function Gate() {
  const { session } = useAuth();
  if (!session) return <LoginView />;
  return <AuthenticatedApp session={session} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
