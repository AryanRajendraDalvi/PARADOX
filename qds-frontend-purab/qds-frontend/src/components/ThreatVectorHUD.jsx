/* ============================================================
   ThreatVectorHUD — momentary full-screen overlay fired when an
   attack button is pressed.

   Purpose is narrative, not diagnostic: a non-technical observer
   should be able to see *where* on the apparatus the adversary is
   operating. Each attack gets a distinct staged diagram:
     intercept   → Eve node spliced into the A→B fiber
     entangle    → ancilla qubit hooked into the 3-party state
     replay      → captured transcript re-injected from a buffer
     batchNoise  → noise sprinkled across all 10 rounds of a batch
     blind       → bright-light source saturating a detector
     macForge    → the classical channel forged, quantum path clean
   Auto-dismisses; pointer-events are off so it never blocks the deck.
   ============================================================ */

import { AnimatePresence, motion } from 'framer-motion'
import { ATTACK_BY_ID } from '../lib/protocol.js'

const W = 600
const H = 150

const NODE = { a: 80, b: 300, c: 520 }
const RAIL = 74

function Party({ x, label, color }) {
  return (
    <g>
      <circle cx={x} cy={RAIL} r="19" fill="rgba(255,255,255,0.03)" stroke={color} strokeWidth="1.3" />
      <circle cx={x} cy={RAIL} r="6.5" fill={color} opacity="0.9" />
      <text
        x={x}
        y={RAIL + 36}
        textAnchor="middle"
        fill={color}
        fontSize="9.5"
        fontFamily="var(--mono)"
        fontWeight="700"
        letterSpacing="0.12em"
      >
        {label}
      </text>
    </g>
  )
}

function Fiber({ x1, x2, color = 'rgba(120,165,220,0.3)', dash }) {
  return (
    <line
      x1={x1}
      y1={RAIL}
      x2={x2}
      y2={RAIL}
      stroke={color}
      strokeWidth="1.8"
      strokeDasharray={dash}
    />
  )
}

/* NOTE: framer-motion needs an explicit `initial` for SVG geometry
   attributes — it cannot read cx/cy/r off the presentation attribute,
   so animating them without one yields `undefined` on the first frame. */
function Photon({ from, to, color, delay = 0, dur = 1.5 }) {
  return (
    <motion.circle
      r={3.4}
      cy={RAIL}
      fill="#fff"
      style={{ filter: `drop-shadow(0 0 5px ${color})` }}
      initial={{ cx: from, opacity: 0 }}
      animate={{ cx: [from, to], opacity: [0, 1, 1, 0] }}
      transition={{ duration: dur, repeat: Infinity, delay, ease: 'linear', times: [0, 0.12, 0.88, 1] }}
    />
  )
}

/* eavesdropper box, used by several vectors */
function EveNode({ x, label, color = 'var(--red)' }) {
  return (
    <motion.g
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 20 }}
    >
      <line x1={x} y1={RAIL} x2={x} y2={RAIL + 44} stroke={color} strokeWidth="1.3" strokeDasharray="3 3" />
      <rect x={x - 30} y={RAIL + 44} width="60" height="26" rx="4" fill="rgba(244,69,60,0.14)" stroke={color} strokeWidth="1.3" />
      <text x={x} y={RAIL + 61} textAnchor="middle" fill={color} fontSize="8.5" fontFamily="var(--mono)" fontWeight="700">
        {label}
      </text>
      <motion.circle
        cx={x}
        cy={RAIL}
        r={6}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        initial={{ r: 5, opacity: 0.9 }}
        animate={{ r: [5, 15], opacity: [0.9, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
      />
    </motion.g>
  )
}

function Stage({ id, color }) {
  const common = (
    <>
      <Party x={NODE.a} label="ALICE" color="var(--alice)" />
      <Party x={NODE.b} label="BOB" color="var(--bob)" />
      <Party x={NODE.c} label="CHARLIE" color="var(--charlie)" />
    </>
  )

  if (id === 'none') {
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Fiber x1={NODE.a + 19} x2={NODE.b - 19} color="rgba(52,211,153,0.5)" />
        <Fiber x1={NODE.b + 19} x2={NODE.c - 19} color="rgba(52,211,153,0.5)" />
        <Photon from={NODE.a + 19} to={NODE.b - 19} color="var(--emerald)" />
        <Photon from={NODE.b + 19} to={NODE.c - 19} color="var(--emerald)" delay={0.4} />
        {common}
        <text x={W / 2} y={26} textAnchor="middle" fill="var(--emerald)" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.16em">
          NO ADVERSARY ON THE LINE
        </text>
      </svg>
    )
  }

  if (id === 'intercept') {
    const mid = (NODE.a + NODE.b) / 2
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Fiber x1={NODE.a + 19} x2={mid - 8} color="rgba(249,115,22,0.6)" />
        <Fiber x1={mid + 8} x2={NODE.b - 19} color="rgba(249,115,22,0.6)" dash="5 4" />
        <Fiber x1={NODE.b + 19} x2={NODE.c - 19} />
        <Photon from={NODE.a + 19} to={mid - 8} color="#f97316" dur={0.9} />
        <Photon from={mid + 8} to={NODE.b - 19} color="#f97316" dur={0.9} delay={0.45} />
        <EveNode x={mid} label="EVE · TAP" color="#f97316" />
        {common}
        <text x={mid} y={26} textAnchor="middle" fill="#f97316" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.14em">
          MEASURE → RESEND
        </text>
      </svg>
    )
  }

  if (id === 'entangle') {
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Fiber x1={NODE.a + 19} x2={NODE.b - 19} color="rgba(139,92,246,0.55)" />
        <Fiber x1={NODE.b + 19} x2={NODE.c - 19} color="rgba(139,92,246,0.55)" />
        {common}
        {/* ancilla hooked into the middle of the shared state */}
        <motion.g
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 240, damping: 18 }}
        >
          <path
            d={`M ${NODE.b} ${RAIL} Q ${NODE.b} ${RAIL + 48}, ${NODE.b - 70} ${RAIL + 52}`}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
          <circle cx={NODE.b - 70} cy={RAIL + 52} r="15" fill="rgba(139,92,246,0.16)" stroke="#8b5cf6" strokeWidth="1.3" />
          <text x={NODE.b - 70} y={RAIL + 56} textAnchor="middle" fill="#c4b5fd" fontSize="9" fontFamily="var(--mono)" fontWeight="700">
            |e⟩
          </text>
          <text x={NODE.b - 70} y={RAIL + 80} textAnchor="middle" fill="#8b5cf6" fontSize="8" fontFamily="var(--mono)" letterSpacing="0.1em">
            EVE ANCILLA
          </text>
        </motion.g>
        {/* correlation between B and C degrading */}
        <motion.path
          d={`M ${NODE.b} ${RAIL - 22} Q ${(NODE.b + NODE.c) / 2} ${RAIL - 52}, ${NODE.c} ${RAIL - 22}`}
          fill="none"
          stroke="var(--red)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          animate={{ opacity: [0.25, 1, 0.25], strokeDashoffset: [0, -24] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        />
        <text x={(NODE.b + NODE.c) / 2} y={RAIL - 46} textAnchor="middle" fill="var(--red)" fontSize="8.5" fontFamily="var(--mono)" letterSpacing="0.1em">
          CORRELATION DECAYS
        </text>
      </svg>
    )
  }

  if (id === 'replay') {
    const mid = (NODE.a + NODE.b) / 2
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Fiber x1={NODE.a + 19} x2={NODE.b - 19} color="rgba(234,179,8,0.5)" />
        <Fiber x1={NODE.b + 19} x2={NODE.c - 19} />
        {common}
        {/* buffer holding an old transcript, re-injecting it */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <rect x={mid - 44} y={RAIL + 38} width="88" height="30" rx="4" fill="rgba(234,179,8,0.13)" stroke="#eab308" strokeWidth="1.3" />
          <text x={mid} y={RAIL + 57} textAnchor="middle" fill="#eab308" fontSize="8.5" fontFamily="var(--mono)" fontWeight="700">
            STORED ROUND
          </text>
          <motion.path
            d={`M ${mid} ${RAIL + 38} L ${mid} ${RAIL + 8}`}
            stroke="#eab308"
            strokeWidth="1.6"
            markerEnd=""
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.3, repeat: Infinity }}
          />
        </motion.g>
        <Photon from={mid} to={NODE.b - 19} color="#eab308" dur={1} />
        <text x={mid} y={26} textAnchor="middle" fill="#eab308" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.14em">
          RE-INJECT OLD TRANSCRIPT
        </text>
      </svg>
    )
  }

  if (id === 'batchNoise') {
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Fiber x1={NODE.a + 19} x2={NODE.b - 19} color="rgba(6,182,212,0.5)" />
        <Fiber x1={NODE.b + 19} x2={NODE.c - 19} color="rgba(6,182,212,0.5)" />
        {common}
        {/* ten small noise injections across the batch */}
        {Array.from({ length: 10 }).map((_, i) => {
          const x = NODE.a + 30 + i * 46
          return (
            <motion.g key={i}>
              <motion.line
                x1={x}
                y1={RAIL + 12}
                x2={x}
                y2={RAIL + 34}
                stroke="#06b6d4"
                strokeWidth="1.4"
                animate={{ opacity: [0.15, 1, 0.15] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
              />
              <motion.circle
                cx={x}
                cy={RAIL + 40}
                r={2.6}
                fill="#06b6d4"
                initial={{ opacity: 0.2, r: 2 }}
                animate={{ opacity: [0.2, 1, 0.2], r: [2, 3.4, 2] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
              />
            </motion.g>
          )
        })}
        <text x={W / 2} y={RAIL + 62} textAnchor="middle" fill="#06b6d4" fontSize="8.5" fontFamily="var(--mono)" letterSpacing="0.12em">
          10 ROUNDS · EACH BELOW THE PER-ROUND LIMIT
        </text>
        <text x={W / 2} y={26} textAnchor="middle" fill="#06b6d4" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.14em">
          SUB-THRESHOLD SMEAR
        </text>
      </svg>
    )
  }

  if (id === 'blind') {
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Fiber x1={NODE.a + 19} x2={NODE.b - 19} />
        <Fiber x1={NODE.b + 19} x2={NODE.c - 19} />
        {common}
        {/* bright light saturating Bob's detector */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {[0, 1, 2, 3].map((i) => (
            <motion.path
              key={i}
              d={`M ${NODE.b + 96} ${RAIL + 46} L ${NODE.b + 22} ${RAIL + 4}`}
              stroke="#ec4899"
              strokeWidth={2.2 - i * 0.4}
              opacity={0.5}
              animate={{ opacity: [0.15, 0.85, 0.15] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.14 }}
              transform={`rotate(${i * 4 - 6} ${NODE.b + 96} ${RAIL + 46})`}
            />
          ))}
          <circle cx={NODE.b + 104} cy={RAIL + 50} r="14" fill="rgba(236,72,153,0.2)" stroke="#ec4899" strokeWidth="1.3" />
          <text x={NODE.b + 104} y={RAIL + 76} textAnchor="middle" fill="#ec4899" fontSize="8" fontFamily="var(--mono)" letterSpacing="0.1em">
            BRIGHT LIGHT
          </text>
          <motion.circle
            cx={NODE.b}
            cy={RAIL}
            r="19"
            fill="none"
            stroke="#ec4899"
            strokeWidth="1.6"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.g>
        <text x={NODE.b} y={26} textAnchor="middle" fill="#ec4899" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.14em">
          DETECTOR FORCED INTO LINEAR MODE
        </text>
      </svg>
    )
  }

  /* macForge — quantum path clean, classical channel forged */
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Fiber x1={NODE.a + 19} x2={NODE.b - 19} color="rgba(52,211,153,0.4)" />
      <Fiber x1={NODE.b + 19} x2={NODE.c - 19} color="rgba(52,211,153,0.4)" />
      <Photon from={NODE.a + 19} to={NODE.b - 19} color="var(--emerald)" />
      {common}
      <text x={NODE.a + 120} y={RAIL - 26} fill="var(--emerald)" fontSize="8" fontFamily="var(--mono)" letterSpacing="0.1em">
        QUANTUM CHANNEL · CLEAN
      </text>
      {/* the classical authenticated channel, being forged */}
      <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <line x1={NODE.a} y1={RAIL + 52} x2={NODE.c} y2={RAIL + 52} stroke="var(--red)" strokeWidth="1.6" strokeDasharray="6 4" />
        <text x={NODE.a + 4} y={RAIL + 44} fill="var(--red)" fontSize="8" fontFamily="var(--mono)" letterSpacing="0.1em">
          CLASSICAL AUTH CHANNEL
        </text>
        <rect x={W / 2 - 40} y={RAIL + 40} width="80" height="24" rx="4" fill="rgba(244,69,60,0.16)" stroke="var(--red)" strokeWidth="1.3" />
        <motion.text
          x={W / 2}
          y={RAIL + 56}
          textAnchor="middle"
          fill="#ff9d96"
          fontSize="8.5"
          fontFamily="var(--mono)"
          fontWeight="700"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          FORGED MAC
        </motion.text>
      </motion.g>
    </svg>
  )
}

export function ThreatVectorHUD({ attackId }) {
  const a = attackId ? ATTACK_BY_ID[attackId] : null

  return (
    <AnimatePresence>
      {a && (
        <motion.div
          className="hud"
          style={{ '--hc': a.color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className="hud__card"
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: -8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <div className="hud__kicker">
              <motion.span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: a.color,
                  display: 'inline-block',
                }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              THREAT VECTOR · {a.vector.kicker}
            </div>
            <div className="hud__title">{a.vector.title}</div>
            <div className="hud__desc">{a.vector.blurb}</div>
            <div className="hud__stage">
              <Stage id={a.id} color={a.color} />
            </div>
            <div className="hud__foot">
              <span className="hud__meta">
                EXPLOITS · <b>{a.vector.exploits}</b>
              </span>
              <span className="hud__meta">
                CAUGHT BY · <b>{a.vector.detector}</b>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
