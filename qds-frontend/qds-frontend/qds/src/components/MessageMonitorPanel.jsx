import React from 'react';

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Read-only monitoring of the participant message channel.
 * Deliberately fed by `messages[]`, never `roundUpdates[]`/`logs[]` — QDS
 * protocol events and user messages are kept in separate state end to end,
 * from the server's own event types down to this component's props.
 */
export default function MessageMonitorPanel({ messages }) {
  const items = messages.slice(-40).reverse();
  return (
    <div className="rounded-lg border border-white/5 bg-surface/60 p-4">
      <div className="text-xs tracking-wide text-slate-500 mb-3">MESSAGE MONITOR</div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {items.length === 0 && (
          <p className="text-[11px] text-slate-600 font-mono">No messages sent yet this session.</p>
        )}
        {items.map((m) => (
          <div
            key={m.client_id ?? m.id}
            className="flex items-start gap-2 text-[11px] font-mono px-2 py-1.5 rounded-sm bg-white/[0.02] border border-white/5"
          >
            <span className="text-slate-600 shrink-0">{formatTime(m.ts)}</span>
            <span className="text-cyan shrink-0">{m.from_display_name ?? m.from_user_id ?? 'sender'}</span>
            <span className="text-slate-600 shrink-0">→</span>
            <span className="text-amber shrink-0">{m.to_display_name ?? m.to_user_id ?? '?'}</span>
            <span className="text-slate-300 truncate flex-1">{m.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
