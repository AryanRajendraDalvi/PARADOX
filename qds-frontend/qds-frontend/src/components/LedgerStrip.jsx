/* ============================================================
   LedgerStrip — classical bookkeeping about the run as a whole
   (plan §5.3). Deliberately visually distinct from the per-round
   log because it updates on two different cadences:
     • mac_tag / mac_verified → every round
     • merkle_root            → only on batch_committed rounds,
                                and the last known root is HELD
                                between commits, never blanked.
   ============================================================ */

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
/* AnimatePresence is still used by the Merkle compression pulse below. */
import { BATCH_DEPTH } from '../lib/protocol.js'
import { CheckIcon, LockIcon, XIcon } from './primitives.jsx'

const SHARDS = 9

/* ---- MAC seal: stamps green on valid, shatters red on forged ---- */
function MacSeal({ tag, verified, roundId }) {
  const ok = verified === true
  const unknown = verified === null || verified === undefined
  const color = unknown ? 'var(--tx-dim)' : ok ? 'var(--emerald)' : 'var(--red)'

  return (
    <div className="ledger__cell">
      <div className="gauge__head">
        <div>
          <div className="gauge__name">Message Authentication</div>
          <div className="jsonpath">auth.mac_tag · auth.mac_verified</div>
        </div>
      </div>

      <div className="seal" style={{ '--sk': color }}>
        {/* Keyed remount rather than AnimatePresence: the stamp/shatter is
            an entrance animation on every round, and an exit phase would
            leave the disc blank for a frame on a fast stream. */}
        <motion.div
          className="seal__disc"
          key={`${roundId}-${String(verified)}`}
          initial={ok ? { scale: 1.9, opacity: 0, rotate: -18 } : { scale: 1, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={
            ok ? { type: 'spring', stiffness: 700, damping: 18 } : { duration: 0.16 }
          }
        >
          {unknown ? <LockIcon size={16} /> : ok ? <CheckIcon size={18} /> : <XIcon size={17} />}

          {/* glass-shard break on a failed tag */}
          {!ok &&
            !unknown &&
            Array.from({ length: SHARDS }).map((_, i) => {
              const ang = (i / SHARDS) * Math.PI * 2
              return (
                <motion.span
                  className="shard"
                  key={i}
                  initial={{ opacity: 1, x: 0, y: 0, rotate: (ang * 180) / Math.PI, scaleX: 0.4 }}
                  animate={{
                    opacity: 0,
                    x: Math.cos(ang) * 30,
                    y: Math.sin(ang) * 30,
                    scaleX: 1.3,
                  }}
                  transition={{ duration: 0.62, ease: 'easeOut' }}
                />
              )
            })}
        </motion.div>

        <div style={{ minWidth: 0 }}>
          <div className="seal__tx">
            {unknown ? 'AWAITING TAG' : ok ? 'VERIFIED' : 'FORGERY DETECTED'}
          </div>
          <div className="seal__sub" style={{ wordBreak: 'break-all' }}>
            {tag || '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Merkle: batch fill bar + compression pulse on commit ---- */
function MerkleCommit({ roundId, committed, root }) {
  /* hold the last known root between commits (plan §5.3) */
  const heldRoot = useRef(null)
  const [pulse, setPulse] = useState(0)

  if (committed && root) heldRoot.current = root

  useEffect(() => {
    if (committed) setPulse((n) => n + 1)
  }, [committed, roundId])

  const filled = roundId ? ((roundId - 1) % BATCH_DEPTH) + 1 : 0
  const shown = heldRoot.current

  return (
    <div className="ledger__cell">
      <div className="gauge__head">
        <div>
          <div className="gauge__name">Merkle Batch Commitment</div>
          <div className="jsonpath">audit.batch_committed · audit.merkle_root</div>
        </div>
        <motion.div
          className="gauge__state"
          style={{ '--gc': committed ? 'var(--cyan)' : 'var(--tx-dim)' }}
          animate={committed ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {committed ? 'COMMITTED' : `${filled}/${BATCH_DEPTH} ROUNDS`}
        </motion.div>
      </div>

      {/* 10-segment batch fill */}
      <div className="batchbar">
        {Array.from({ length: BATCH_DEPTH }).map((_, i) => (
          <motion.span
            className="batchbar__seg"
            key={i}
            data-on={i < filled}
            animate={
              committed
                ? { scaleY: [1, 2.4, 1], opacity: [1, 0.6, 1] }
                : { scaleY: 1 }
            }
            transition={{ duration: 0.45, delay: committed ? i * 0.028 : 0 }}
          />
        ))}
      </div>

      <div className="merkle__root" data-empty={!shown}>
        {shown
          ? `${shown.slice(0, 32)}\n${shown.slice(32)}`
          : 'no batch committed yet — root is null until round 10'}
      </div>

      {/* vertical compression pulse: the batch being locked into a block */}
      <AnimatePresence>
        {pulse > 0 && committed && (
          <motion.span
            className="compress"
            key={pulse}
            initial={{ opacity: 0.85, scaleY: 0 }}
            animate={{ opacity: 0, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            style={{ transformOrigin: 'bottom' }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export function LedgerStrip({ update }) {
  return (
    <div className="ledger">
      <MacSeal
        tag={update?.auth?.mac_tag}
        verified={update?.auth?.mac_verified ?? null}
        roundId={update?.round_id}
      />
      <MerkleCommit
        roundId={update?.round_id}
        committed={Boolean(update?.audit?.batch_committed)}
        root={update?.audit?.merkle_root}
      />
    </div>
  )
}
