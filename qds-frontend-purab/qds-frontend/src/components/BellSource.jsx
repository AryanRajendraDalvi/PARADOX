/* ============================================================
   BellSource — Alice's entangled-photon broadcast visualizer.

   Left: the Bell-state source, breathing. A light pulse fires from
   it along the fiber toward Alice's detector on each new round where
   parties.alice.measured is true. On arrival the 2-bit transcript
   flips open with a particle burst.

   Everything is keyed off round_id so the animation replays exactly
   once per round and never re-triggers on unrelated re-renders.
   ============================================================ */

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useState } from 'react'

const BURST_N = 12

export function BellSource({ roundId, measured, bits, basis }) {
  const [flash, setFlash] = useState(0)
  /* instance-scoped fragment ids — this renders on both the Alice route
     and the Wall route, and duplicate ids collapse to the first match. */
  const sid = useId().replace(/:/g, '')
  const fiberId = `fiber-${sid}`
  const glowId = `aglow-${sid}`

  /* fire the pulse once per (round, measured) transition */
  useEffect(() => {
    if (measured && roundId) setFlash((n) => n + 1)
  }, [roundId, measured])

  const hasBits = Array.isArray(bits) && bits.length === 2

  return (
    <div className="circuit">
      <div className="gauge__head">
        <div>
          <div className="gauge__name">Entangled Photon Broadcast</div>
          <div className="jsonpath">parties.alice.measured · outcome_bits · basis</div>
        </div>
        <div
          className="mermin__violation"
          style={{ '--mc': measured ? 'var(--alice)' : 'var(--tx-dim)' }}
        >
          {measured ? 'MEASURED' : 'IDLE'}
        </div>
      </div>

      {/* ---- circuit path ---- */}
      <svg width="100%" height="88" viewBox="0 0 420 88" preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={fiberId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(244,114,182,0.05)" />
            <stop offset="50%" stopColor="rgba(244,114,182,0.35)" />
            <stop offset="100%" stopColor="rgba(244,114,182,0.05)" />
          </linearGradient>
          <filter id={glowId} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="3.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* two fiber rails: the |Φ+⟩ pair splitting toward the parties */}
        <path d="M 62 44 C 150 44, 200 22, 350 22" fill="none" stroke={`url(#${fiberId})`} strokeWidth="2" />
        <path d="M 62 44 C 150 44, 200 66, 350 66" fill="none" stroke={`url(#${fiberId})`} strokeWidth="2" />

        {/* source housing */}
        <circle cx="40" cy="44" r="21" fill="rgba(244,114,182,0.07)" stroke="rgba(244,114,182,0.4)" strokeWidth="1.2" />
        <motion.circle
          cx={40}
          cy={44}
          r={9}
          fill="var(--alice)"
          filter={`url(#${glowId})`}
          initial={{ opacity: 0.55, r: 8 }}
          animate={{ opacity: [0.55, 1, 0.55], r: [8, 10.5, 8] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <text x="40" y="80" textAnchor="middle" fill="var(--tx-faint)" fontSize="8" fontFamily="var(--mono)" letterSpacing="0.1em">
          |Φ+⟩
        </text>

        {/* detector plates */}
        {[22, 66].map((y, i) => (
          <g key={y}>
            <rect
              x="350"
              y={y - 11}
              width="7"
              height="22"
              rx="2"
              fill="rgba(244,114,182,0.12)"
              stroke="rgba(244,114,182,0.45)"
              strokeWidth="1"
            />
            <text x="368" y={y + 3.5} fill="var(--tx-faint)" fontSize="8" fontFamily="var(--mono)">
              q{i}
            </text>
          </g>
        ))}

        {/* the firing pulses, one per rail */}
        <AnimatePresence>
          {flash > 0 &&
            [
              'M 62 44 C 150 44, 200 22, 350 22',
              'M 62 44 C 150 44, 200 66, 350 66',
            ].map((d, i) => (
              <motion.circle
                key={`${flash}-${i}`}
                r={4.5}
                cx={0}
                cy={0}
                fill="#fff"
                filter={`url(#${glowId})`}
                initial={{ opacity: 0, offsetDistance: '0%' }}
                animate={{ opacity: [0, 1, 1, 0], offsetDistance: '100%' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.72, ease: 'easeIn', times: [0, 0.15, 0.8, 1] }}
                style={{ offsetPath: `path("${d}")`, offsetRotate: '0deg' }}
              />
            ))}
        </AnimatePresence>
      </svg>

      {/* ---- 2-bit transcript ---- */}
      <div className="label" style={{ margin: '4px 0 8px' }}>
        Bell measurement outcome — 2-bit transcript being broadcast
      </div>

      <div className="bits">
        {(hasBits ? bits : [null, null]).map((b, i) => (
          <div className="bit" key={i}>
            <span className="bit__ring" style={{ animationDirection: i ? 'reverse' : 'normal' }} />

            {/* burst particles on each new round */}
            <AnimatePresence>
              {flash > 0 &&
                hasBits &&
                Array.from({ length: BURST_N }).map((_, k) => {
                  const ang = (k / BURST_N) * Math.PI * 2
                  return (
                    <motion.span
                      className="burst"
                      key={`${flash}-${k}`}
                      initial={{ opacity: 0.95, x: 0, y: 0, scale: 1 }}
                      animate={{
                        opacity: 0,
                        x: Math.cos(ang) * 44,
                        y: Math.sin(ang) * 34,
                        scale: 0.3,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.62, ease: 'easeOut', delay: 0.42 }}
                    />
                  )
                })}
            </AnimatePresence>

            {/* the bit itself flips open on arrival */}
            <AnimatePresence mode="wait">
              <motion.div
                className="bit__v"
                key={`${roundId}-${i}-${b}`}
                initial={{ rotateX: -88, opacity: 0, y: -6 }}
                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                exit={{ rotateX: 88, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24, delay: 0.4 }}
              >
                {b === null || b === undefined ? '·' : b}
              </motion.div>
            </AnimatePresence>
            <div className="bit__i">bit {i}</div>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
        <span className="label">basis</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--alice)', fontWeight: 700, letterSpacing: '0.14em' }}>
          {basis ? String(basis).toUpperCase() : '—'}
        </span>
      </div>
    </div>
  )
}
