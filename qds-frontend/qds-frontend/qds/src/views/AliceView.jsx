import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PanelHeader from '../components/PanelHeader.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';

function BitCell({ bit, index }) {
  return (
    <motion.div
      key={`${index}-${bit}`}
      initial={{ rotateX: -90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.45, delay: index * 0.12, ease: 'easeOut' }}
      className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg border border-cyan/40 bg-cyan/5 flex items-center justify-center shadow-glow-cyan"
      style={{ perspective: 600 }}
    >
      <span className="font-display text-5xl text-cyan">{bit}</span>
    </motion.div>
  );
}

/**
 * Sender-role QDS visual panel. `embedded` is set by ParticipantView, which
 * already shows identity/role/connection state in its own header — in that
 * mode this renders just the QDS body, sized for a half-width column next
 * to the chat panel.
 */
export default function AliceView({ frame, connection, embedded = false }) {
  const alice = frame?.parties?.alice;
  const measured = alice?.measured ?? false;

  return (
    <div className={embedded ? '' : 'max-w-3xl mx-auto px-6 py-8'}>
      {!embedded && (
        <PanelHeader title="Sender" subtitle="Bell-state measurement & broadcast" frame={frame} connection={connection} />
      )}

      <div className="rounded-lg border border-white/5 bg-surface/60 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs tracking-wide text-slate-500 mb-1">BASIS</div>
            <div className="font-mono text-sm text-cyan">{alice?.basis ?? '—'}</div>
          </div>
          <AnimatePresence mode="wait">
            {measured ? (
              <motion.div
                key="signed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-phosphor text-xs font-mono px-3 py-1.5 rounded-full border border-phosphor/30 bg-phosphor/5"
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-phosphor"
                  animate={{ scale: [1, 1.6, 1] }}
                  transition={{ duration: 0.6, repeat: 2 }}
                />
                MESSAGE SIGNED
              </motion.div>
            ) : (
              <span className="text-xs font-mono text-slate-600">AWAITING MEASUREMENT</span>
            )}
          </AnimatePresence>
        </div>

        <div className="text-xs tracking-wide text-slate-500 mb-3">OUTCOME TRANSCRIPT (2-BIT)</div>
        <div className="flex items-center justify-center gap-4 py-4">
          <AnimatePresence mode="wait">
            {alice?.outcome_bits ? (
              <React.Fragment key={`bits-${frame.round_id}`}>
                {alice.outcome_bits.map((b, i) => (
                  <BitCell key={i} bit={b} index={i} />
                ))}
              </React.Fragment>
            ) : (
              <span className="text-slate-700 font-mono text-sm">no data</span>
            )}
          </AnimatePresence>
        </div>
        <p className="text-[11px] text-slate-600 text-center mt-2">
          The literal transcript broadcast to the Receiver and Verifier this round.
        </p>
      </div>

      <NetworkTopology frame={frame} compact />
    </div>
  );
}
