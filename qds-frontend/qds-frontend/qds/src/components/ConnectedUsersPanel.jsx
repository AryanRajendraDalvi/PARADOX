import React from 'react';

/**
 * Read-only live roster of connected participant accounts, shown in the
 * Admin view. Roles are NOT assignable here — they are derived automatically
 * per-message (sender = whoever sends, receiver = the chosen recipient,
 * verifiers = all remaining online participants). This panel just lets the
 * admin see who is online.
 */
export default function ConnectedUsersPanel({ onlineUsers }) {
  return (
    <div className="rounded-lg border border-white/5 bg-surface/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs tracking-wide text-slate-500">CONNECTED PARTICIPANTS</span>
        <span className="text-[10px]  px-2 py-0.5 rounded-full border border-white/10 text-slate-500">
          {onlineUsers.length} online
        </span>
      </div>

      {onlineUsers.length === 0 ? (
        <p className="text-[11px] text-slate-600 ">No participants connected yet.</p>
      ) : (
        <div className="space-y-2">
          {onlineUsers.map((u) => (
            <div
              key={u.user_id}
              className="flex items-center gap-3 px-3 py-2 rounded-md border border-white/5 bg-white/[0.02]"
            >
              <span
                className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                style={{ boxShadow: 'none' }}
              />
              <span className="text-sm text-slate-200 ">{u.displayName}</span>
              <span className="text-[10px] text-slate-600  ml-auto">{u.user_id}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-700 mt-3 leading-relaxed">
        Sender/Receiver/Verifier roles are derived automatically per message.
        No manual assignment required.
      </p>
    </div>
  );
}
