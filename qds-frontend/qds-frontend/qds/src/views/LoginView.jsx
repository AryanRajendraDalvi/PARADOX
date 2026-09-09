import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext.jsx';

// This only distinguishes admin vs. participant accounts. There are no
// fixed Sender/Receiver/Verifier slots — those are derived automatically
// per message based on who sends to whom. See ParticipantView.jsx.
const ACCOUNT_TYPE_HINT = {
  admin: 'Administrator account',
  alice: 'Participant account',
  bob: 'Participant account',
  charlie: 'Participant account'
};

export default function LoginView() {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const accountHint = ACCOUNT_TYPE_HINT[username.toLowerCase()] ?? null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-lg border border-white/10 bg-surface/80 p-8"
      >
        <div className="mb-6 text-center">
          <h1 className="font-display text-xl text-slate-100 tracking-tight">QDS Threat Detection</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to your participant session</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-[11px] tracking-wide text-slate-500 mb-1.5">
              USERNAME
            </label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-bg px-3 py-2 text-sm text-slate-200 font-mono outline-none focus:border-cyan/60"
              placeholder="alice"
            />
            {accountHint && (
              <p className="text-[10px] text-cyan mt-1 font-mono">{accountHint}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-[11px] tracking-wide text-slate-500 mb-1.5">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-bg px-3 py-2 text-sm text-slate-200 font-mono outline-none focus:border-cyan/60"
              placeholder="••••••••"
            />
          </div>

          {(error || localError) && (
            <div className="text-xs text-crimson font-mono bg-crimson/5 border border-crimson/20 rounded-md px-3 py-2">
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full rounded-md bg-cyan/15 border border-cyan/40 text-cyan text-sm font-mono py-2.5 hover:bg-cyan/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'AUTHENTICATING…' : 'SIGN IN'}
          </button>
        </form>

        <p className="text-[10px] text-slate-600 mt-6 text-center leading-relaxed">
          Each browser session authenticates independently — admin, alice, bob,
          and charlie can all be signed in at once, on this machine or across
          separate ones. Message any other online participant directly.
        </p>
      </motion.div>
    </div>
  );
}
