import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function truncateHex(hex, lead = 8, tail = 6) {
  if (!hex) return '—';
  if (hex.length <= lead + tail + 1) return hex;
  return `${hex.slice(0, lead)}…${hex.slice(-tail)}`;
}

/**
 * Classical bookkeeping strip: MAC tag/verification for the current round,
 * plus the Merkle batch-commit indicator. The commit indicator only pulses
 * on rounds where audit.batch_committed is true (every 10th round); the
 * displayed root holds its last known value in between rather than
 * blanking out, since audit.merkle_root is only sent on commit rounds.
 */
export default function SecurityLedger({ frame }) {
  const macTag = frame?.auth?.mac_tag ?? null;
  const isRogueVerifier = frame?.event_flags?.includes('unauthorized_verifier_detected') ?? false;
  const macVerified = (frame?.auth?.mac_verified ?? true) && !isRogueVerifier;
  const batchCommitted = frame?.audit?.batch_committed ?? false;
  const batchId = frame?.batch_id ?? null;

  const lastRootRef = useRef(null);
  if (frame?.audit?.merkle_root) lastRootRef.current = frame.audit.merkle_root;
  const displayedRoot = lastRootRef.current;

  const [pulse, setPulse] = useState(false);
  const prevCommittedRoundRef = useRef(null);
  useEffect(() => {
    if (batchCommitted && frame?.round_id !== prevCommittedRoundRef.current) {
      prevCommittedRoundRef.current = frame?.round_id;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(t);
    }
  }, [batchCommitted, frame?.round_id]);

  return (
    <div className="rounded-lg border border-white/5 bg-surface/60 p-4">
      <div className="text-xs tracking-wide text-slate-500 mb-3">SECURITY LEDGER</div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* MAC seal */}
        <div className="flex-1 flex items-center gap-3">
          <div className="relative w-12 h-12 shrink-0">
            <AnimatePresence mode="wait">
              {macVerified ? (
                <motion.div
                  key="verified"
                  initial={{ scale: 1.6, opacity: 0, rotate: -12 }}
                  animate={{ scale: 1, opacity: 1, rotate: -8 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                  className="w-12 h-12 rounded-full border-2 border-green-500 flex items-center justify-center shadow-sm shadow-green-500/20"
                >
                  <span className="text-green-500 text-lg leading-none">✓</span>
                </motion.div>
              ) : (
                <motion.div
                  key="broken"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 10 }}
                  className="w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center shadow-sm shadow-red-500/20"
                >
                  <span className="text-red-500 text-lg leading-none">✕</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="min-w-0">
            <div className={`text-xs  ${macVerified ? 'text-green-500' : 'text-red-500'}`}>
              MAC {macVerified ? 'VERIFIED' : 'FORGED / REJECTED'}
            </div>
            <div className="text-[11px]  text-slate-500 truncate">{truncateHex(macTag)}</div>
          </div>
        </div>

        <div className="w-px bg-white/5 hidden sm:block" />

        {/* Merkle commit */}
        <div className="flex-1 flex items-center gap-3">
          <motion.div
            className="w-12 h-12 shrink-0 rounded-md border border-blue-500/40 flex items-center justify-center bg-blue-500/5"
            animate={pulse ? { scale: [1, 1.18, 1], boxShadow: ['0 0 0px #3B82F6', '0 0 22px #3B82F6', '0 0 0px #3B82F6'] } : {}}
            transition={{ duration: 0.9 }}
          >
            <span className="text-blue-500 text-[10px] ">B{batchId ?? '—'}</span>
          </motion.div>
          <div className="min-w-0">
            <div className="text-xs  text-blue-500">MERKLE ROOT</div>
            <div className="text-[11px]  text-slate-500 truncate">{truncateHex(displayedRoot)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
