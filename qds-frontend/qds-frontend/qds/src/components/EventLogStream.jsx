import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VISIBLE_COUNT = 60;

const PHASE_LABEL = {
  signing: 'SIGNING',
  verification: 'VERIFY',
  mermin_test: 'MERMIN'
};

function FlagBadge({ flag }) {
  return (
    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-amber/10 text-amber border border-amber/20 whitespace-nowrap">
      {flag}
    </span>
  );
}

function LogRow({ entry }) {
  const isAccept = entry.verdict === 'ACCEPT';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-[52px_78px_78px_1fr] items-center gap-2 px-3 py-1.5 border-b border-white/[0.03] text-[11px] font-mono"
    >
      <span className="text-slate-400 mono-nums">{String(entry.round_id).padStart(4, '0')}</span>
      <span className="text-slate-500">{PHASE_LABEL[entry.phase] ?? entry.phase}</span>
      <span
        className={`px-1.5 py-0.5 rounded-sm text-center w-fit ${
          isAccept ? 'bg-phosphor/10 text-phosphor' : 'bg-crimson/10 text-crimson'
        }`}
      >
        {entry.verdict}
      </span>
      <div className="flex flex-wrap gap-1 justify-end">
        {entry.claimed_by_message && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-violet/10 text-violet border border-violet/20 whitespace-nowrap">
            CLAIMED
          </span>
        )}
        {entry.event_flags.length > 0 ? (
          entry.event_flags.map((f, i) => <FlagBadge key={i} flag={f} />)
        ) : (
          <span className="text-slate-700">·</span>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Chronological descending event feed, one row per round. Keyed by
 * `${session_id}-${round_id}` rather than round_id alone, since round_id
 * resets to 1 on every attack switch — the compound key is what keeps the
 * DOM stable (no flicker/remount) across those resets.
 */
export default function EventLogStream({ history }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return history;
    if (filter === 'reject') return history.filter((h) => h.verdict === 'REJECT');
    if (filter === 'flagged') return history.filter((h) => h.event_flags.length > 0);
    return history;
  }, [filter, history]);

  const visible = filtered.slice(0, VISIBLE_COUNT);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="hidden">
        <span className="text-xs tracking-wide text-slate-500">EVENT LOG</span>
        <div className="flex gap-1">
          {['all', 'reject', 'flagged'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-sm transition-colors ${
                filter === f ? 'bg-cyan/15 text-cyan' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[52px_78px_78px_1fr] gap-2 px-3 py-1.5 text-[9px] tracking-wide text-slate-600 border-b border-white/5">
        <span>ROUND</span>
        <span>PHASE</span>
        <span>VERDICT</span>
        <span className="text-right">FLAGS</span>
      </div>

      <div className="crt-texture overflow-y-auto flex-1" style={{ maxHeight: 420 }}>
        <AnimatePresence initial={false}>
          {visible.map((entry) => (
            <LogRow key={`${entry.session_id}-${entry.round_id}`} entry={entry} />
          ))}
        </AnimatePresence>
        {visible.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-slate-600 font-mono">NO ROUNDS YET</div>
        )}
      </div>
    </div>
  );
}
