import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import PanelHeader from '../components/PanelHeader.jsx';
import MerminGauge from '../components/MerminGauge.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';

function CorrelationWavefront({ isVerificationRound, isMatch }) {
  const points = useMemo(() => {
    const pts = [];
    for (let x = 0; x <= 300; x += 6) {
      pts.push(x);
    }
    return pts;
  }, []);

  const color = !isVerificationRound ? '#3a4766' : isMatch ? '#22C55E' : '#DC2626';

  return (
    <div className="rounded-lg border border-white/5 bg-surface/60 p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs tracking-wide text-slate-500">RECEIVER ↔ VERIFIER CORRELATION</span>
        <span
          className="text-[10px]  px-2 py-0.5 rounded-sm"
          style={{ color, background: `${color}1a` }}
        >
          {!isVerificationRound ? 'NON-VERIFICATION ROUND' : isMatch ? 'HARMONIC LOCK' : 'DECOHERENCE'}
        </span>
      </div>
      <svg viewBox="0 0 300 80" className="w-full h-20">
        <motion.path
          d={
            isVerificationRound && isMatch
              ? `M ${points.map((x) => `${x},${40 + Math.sin(x / 12) * 22}`).join(' L ')}`
              : `M ${points
                  .map((x) => `${x},${40 + Math.sin(x / 12) * 22 + (Math.random() - 0.5) * (isVerificationRound ? 30 : 6)}`)
                  .join(' L ')}`
          }
          stroke={color}
          strokeWidth={2}
          fill="none"
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
          animate={{ pathLength: [0, 1] }}
          transition={{ duration: 0.8 }}
        />
      </svg>
    </div>
  );
}

/**
 * Verifier-role QDS visual panel. See AliceView.jsx for the `embedded` mode
 * used inside ParticipantView.
 */
export default function CharlieView({ frame, connection, embedded = false }) {
  const charlie = frame?.parties?.charlie;
  const bob = frame?.parties?.bob;
  const isVerification = frame?.phase === 'verification';
  const isMatch = isVerification && bob?.outcome === charlie?.outcome;

  return (
    <div className={embedded ? '' : 'max-w-3xl mx-auto px-6 py-8'}>
      {!embedded && (
        <PanelHeader title="Verifier" subtitle="Correlation checks & Mermin hardware verification" frame={frame} connection={connection} />
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-white/5 bg-surface/60 p-6 flex flex-col justify-between">
          <div className="text-xs tracking-wide text-slate-500 mb-1">MEASURED OUTCOME</div>
          <div className=" text-3xl text-cyan mono-nums">{charlie?.outcome ?? '—'}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-surface/60 p-6 flex flex-col justify-between">
          <div className="text-xs tracking-wide text-slate-500 mb-1">BASIS</div>
          <div className=" text-lg text-slate-300">
            {charlie?.basis ?? <span className="text-slate-600">— non-participating round —</span>}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <CorrelationWavefront isVerificationRound={isVerification} isMatch={isMatch} />
      </div>

      <div className="rounded-lg border border-white/5 bg-surface/60 p-6 mb-6 flex flex-col items-center">
        <div className="text-xs tracking-wide text-slate-500 mb-2 self-start">MERMIN NON-LOCALITY GAUGE</div>
        <MerminGauge value={frame?.checks?.mermin_value ?? null} />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface/60 px-6 py-4 mb-6">
        <span className="text-xs tracking-wide text-slate-500">RUN STATUS</span>
        <span className="text-xs  px-3 py-1 rounded-full border border-amber/40 text-amber bg-amber/5">
          {frame?.status ?? 'PROVISIONAL'}
        </span>
      </div>

      <NetworkTopology frame={frame} compact />
    </div>
  );
}
