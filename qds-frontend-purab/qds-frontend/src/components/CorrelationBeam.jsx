/* ============================================================
   CorrelationBeam — live Bob ↔ Charlie correlation wavefront.

   match    → smooth green harmonic sine, packets flowing steadily
   mismatch → beam breaks into an erratic red decoherence glitch
   n/a      → dim flat rail (signing round, or Charlie not measuring)

   The waveform is generated as an SVG polyline and re-phased with a
   rAF-free CSS/framer loop, so there is no per-frame React state.
   ============================================================ */

import { AnimatePresence, motion } from 'framer-motion'
import { useId, useMemo } from 'react'

const W = 420
const H = 46
const MID = H / 2

/* smooth harmonic for the matched state */
function sinePoints(phase, amp = 8, freq = 3.4) {
  const pts = []
  for (let i = 0; i <= 84; i++) {
    const t = i / 84
    const x = t * W
    const y = MID + Math.sin(t * Math.PI * 2 * freq + phase) * amp * Math.sin(t * Math.PI)
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

/* deterministic jagged break for the mismatched state — seeded by
   round so it looks different each round but is stable within it */
function glitchPoints(seed) {
  let s = seed * 9301 + 49297
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const pts = []
  for (let i = 0; i <= 46; i++) {
    const t = i / 46
    const x = t * W
    const env = Math.sin(t * Math.PI)
    const y = MID + (rnd() - 0.5) * 30 * env
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

export function CorrelationBeam({ verdict, roundId, bobOutcome, charlieOutcome }) {
  /* instance-scoped: rendered on both the Charlie route and the Wall. */
  const glowId = `bglow-${useId().replace(/:/g, '')}`
  const match = verdict.match
  const color =
    match === true ? 'var(--emerald)' : match === false ? 'var(--red)' : 'var(--tx-dim)'

  const glitch = useMemo(() => glitchPoints(roundId || 1), [roundId])

  return (
    <div className="beam" style={{ '--bc': color }}>
      <svg
        className="beam__wave"
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id={glowId} x="-30%" y="-120%" width="160%" height="340%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* base rail */}
        <line
          x1="0"
          y1={MID}
          x2={W}
          y2={MID}
          stroke={color}
          strokeWidth="1"
          opacity={match === null ? 0.35 : 0.18}
          strokeDasharray={match === null ? '3 5' : undefined}
        />

        {match === true && (
          /* travelling harmonic: two offset sine copies cross-fading */
          <motion.g filter={`url(#${glowId})`}>
            {[0, 1].map((k) => (
              <motion.polyline
                key={k}
                fill="none"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
                points={sinePoints(k * Math.PI)}
                initial={{ points: sinePoints(k * Math.PI), opacity: 0.9 }}
                animate={{
                  points: [
                    sinePoints(k * Math.PI),
                    sinePoints(k * Math.PI + Math.PI),
                    sinePoints(k * Math.PI + Math.PI * 2),
                  ],
                  opacity: [0.9, 0.55, 0.9],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              />
            ))}
          </motion.g>
        )}

        {match === false && (
          <AnimatePresence mode="wait">
            <motion.g key={roundId} filter={`url(#${glowId})`}>
              <motion.polyline
                points={glitch}
                fill="none"
                stroke={color}
                strokeWidth="1.6"
                animate={{ opacity: [1, 0.25, 1, 0.5, 1], x: [0, -3, 2, -1, 0] }}
                transition={{ duration: 0.42, repeat: Infinity, ease: 'linear' }}
              />
              {/* the visual "break": a gap punched mid-beam */}
              <rect x={W / 2 - 26} y={0} width="52" height={H} fill="var(--bg-inset)" opacity="0.92" />
              <motion.g
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              >
                <line x1={W / 2 - 8} y1={MID - 9} x2={W / 2 + 8} y2={MID + 9} stroke={color} strokeWidth="2" />
                <line x1={W / 2 + 8} y1={MID - 9} x2={W / 2 - 8} y2={MID + 9} stroke={color} strokeWidth="2" />
              </motion.g>
            </motion.g>
          </AnimatePresence>
        )}

        {/* flowing packets, matched rounds only */}
        {match === true &&
          [0, 0.33, 0.66].map((d) => (
            <motion.circle
              key={d}
              r={2.6}
              cy={MID}
              fill="#fff"
              filter={`url(#${glowId})`}
              initial={{ cx: 0, opacity: 0 }}
              animate={{ cx: [0, W], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 2.1,
                repeat: Infinity,
                ease: 'linear',
                delay: d * 2.1,
                times: [0, 0.1, 0.9, 1],
              }}
            />
          ))}
      </svg>

      <span className="beam__label">
        {match === true
          ? `CORRELATED · B=${bobOutcome} ≡ C=${charlieOutcome}`
          : match === false
            ? `DECOHERENCE · B=${bobOutcome} ≠ C=${charlieOutcome}`
            : verdict.text}
      </span>
    </div>
  )
}
