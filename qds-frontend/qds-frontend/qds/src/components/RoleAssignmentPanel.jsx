import React, { useState, useEffect } from 'react';

const SLOTS = [
  { key: 'sender_id', label: 'Sender', color: '#00f3ff' },
  { key: 'receiver_id', label: 'Receiver', color: '#ffb800' },
  { key: 'verifier_id', label: 'Verifier', color: '#9d00ff' }
];

/**
 * Lets admin explicitly (re)assign which connected participant currently
 * holds each protocol role. This is what makes "swap the roles and verify
 * messaging still works with no code changes" testable on demand, rather
 * than only relying on connection-order auto-assignment.
 */
export default function RoleAssignmentPanel({ participants, sessionRoles, sendCommand }) {
  const [draft, setDraft] = useState({
    sender_id: sessionRoles.sender_id,
    receiver_id: sessionRoles.receiver_id,
    verifier_id: sessionRoles.verifier_id
  });

  useEffect(() => {
    setDraft({
      sender_id: sessionRoles.sender_id,
      receiver_id: sessionRoles.receiver_id,
      verifier_id: sessionRoles.verifier_id
    });
  }, [sessionRoles.sender_id, sessionRoles.receiver_id, sessionRoles.verifier_id]);

  const apply = () => {
    sendCommand({ command: 'ASSIGN_ROLES', ...draft });
  };

  const isDirty =
    draft.sender_id !== sessionRoles.sender_id ||
    draft.receiver_id !== sessionRoles.receiver_id ||
    draft.verifier_id !== sessionRoles.verifier_id;

  return (
    <div className="rounded-lg border border-white/5 bg-surface/60 p-4">
      <div className="text-xs tracking-wide text-slate-500 mb-3">DYNAMIC ROLE ASSIGNMENT</div>
      <div className="grid sm:grid-cols-3 gap-3">
        {SLOTS.map((slot) => (
          <div key={slot.key}>
            <label className="text-[10px] font-mono tracking-wide" style={{ color: slot.color }}>
              {slot.label.toUpperCase()}
            </label>
            <select
              value={draft[slot.key] ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, [slot.key]: e.target.value || null }))}
              className="mt-1 w-full rounded-md border border-white/10 bg-bg px-2 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-cyan/60"
            >
              <option value="">— none —</option>
              {participants.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.displayName ?? p.username}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-slate-600">
          {participants.length === 0
            ? 'No participants connected yet.'
            : `${participants.length} participant${participants.length === 1 ? '' : 's'} connected.`}
        </p>
        <button
          onClick={apply}
          disabled={!isDirty}
          className="text-[11px] font-mono px-3 py-1.5 rounded-md border border-cyan/40 text-cyan bg-cyan/10 hover:bg-cyan/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          APPLY
        </button>
      </div>
    </div>
  );
}
