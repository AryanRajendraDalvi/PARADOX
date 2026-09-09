import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PanelHeader from '../components/PanelHeader.jsx';
import ArcGauge from '../components/ArcGauge.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';

const PAULI_COLOR = { I: '#0891a8', X: '#ff003c', Y: '#9d00ff', Z: '#ffb800' };
const PAULI_DESC = {
  I: 'Identity — no correction applied',
  X: 'Bit-flip correction',
  Y: 'Combined bit + phase-flip correction',
  Z: 'Phase-flip correction'
};

function PauliUnit({ correction }) {
  const c = correction ?? 'I';
  const color = PAULI_COLOR[c] ?? '#3a4766';
  return (
    <div className="flex items-center gap-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={c}
          initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          className="w-20 h-20 rounded-xl border-2 flex items-center justify-center shrink-0"
          style={{ borderColor: color, background: `${color}14`, boxShadow: `0 0 18px ${color}44` }}
        >
          <span className="font-display text-4xl" style={{ color }}>
            {c}
          </span>
        </motion.div>
      </AnimatePresence>
      <div>
        <div className="text-xs tracking-wide text-slate-500 mb-1">CORRECTION APPLIED</div>
        <div className="text-sm text-slate-300">{PAULI_DESC[c]}</div>
      </div>
    </div>
  );
}

/**
 * Receiver-role QDS visual panel. See AliceView.jsx for the `embedded` mode
 * used inside ParticipantView.
 */
export default function BobView({ frame, connection, embedded = false }) {
  const bob = frame?.parties?.bob;
  const checks = frame?.checks;

  return (
    <div className={embedded ? '' : 'max-w-3xl mx-auto px-6 py-8'}>
      {!embedded && (
        <PanelHeader title="Receiver" subtitle="Reconstructive correction & local channel checks" frame={frame} connection={connection} />
      )}

      <div className="rounded-lg border border-white/5 bg-surface/60 p-6 mb-6 flex items-center justify-between flex-wrap gap-4">
        <PauliUnit correction={bob?.correction_applied} />
        <div className="text-right">
          <div className="text-xs tracking-wide text-slate-500 mb-1">MEASURED OUTCOME</div>
          <div className="font-mono text-3xl text-cyan mono-nums">{bob?.outcome ?? '—'}</div>
        </div>
      </div>

      <div className="rounded-lg border border-white/5 bg-surface/60 p-6 mb-6">
        <div className="text-xs tracking-wide text-slate-500 mb-4">CHANNEL / SIGNATURE STATISTICAL GAUGES</div>
        <div className="flex flex-wrap justify-around gap-6">
          <ArcGauge
            label="Decoy QBER vs τ Hoeffding"
            value={checks?.decoy_qber ?? 0}
            threshold={checks?.tau_hoeffding ?? 0.061}
            domainMax={0.18}
          />
          <ArcGauge
            label="Mismatch Rate vs τ CEFB"
            value={checks?.mismatch_rate ?? 0}
            threshold={checks?.tau_cefb ?? 0.089}
            domainMax={0.18}
          />
        </div>
      </div>

      <NetworkTopology frame={frame} compact />
    </div>
  );
}
