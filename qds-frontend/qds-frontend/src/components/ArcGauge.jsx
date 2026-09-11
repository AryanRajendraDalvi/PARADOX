/* ============================================================
   ArcGauge — value-vs-threshold arc for Bob's two local checks.

   Design decision (plan §3): the scale is NOT 0..1. It is 0..(tau × 2),
   so the threshold guard line always sits at the visual midpoint of
   the arc. That makes "how close are we to breaching" readable at a
   glance and comparable between the two gauges even though
   tau_hoeffding (0.061) and tau_cefb (0.089) differ. A raw 0..1 scale
   would squash every honest run into the first 6% of the arc and the
   crossing — the whole point of the live demo — would be invisible.
   ============================================================ */

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useId } from 'react'
import { pct, thresholdState } from '../lib/protocol.js'

const SIZE = 168
const CX = SIZE / 2
const CY = SIZE / 2 + 14
const R = 62
const STROKE = 9
/* 240° sweep, symmetric about vertical */
const START = -210
const SWEEP = 240

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, r, from, to) {
  const a = polar(cx, cy, r, from)
  const b = polar(cx, cy, r, to)
  const large = Math.abs(to - from) > 180 ? 1 : 0
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`
}

const ARC_LEN = (SWEEP / 360) * 2 * Math.PI * R

export function ArcGauge({ name, path, value, tau, tauLabel }) {
  const st = thresholdState(value, tau)
  const breach = st.key === 'breach'

  /* SVG fragment ids must be reference-safe AND unique per instance:
     `name` contains spaces (url(#g-Decoy QBER) never resolves), and the
     same two gauges render again on the Wall route. */
  const uid = `${name.replace(/[^a-zA-Z0-9]/g, '')}${useId().replace(/:/g, '')}`

  /* full-scale = 2×tau puts the guard line dead centre */
  const full = tau ? tau * 2 : 1
  const frac = value === null || value === undefined ? 0 : Math.min(value / full, 1)

  const spring = useSpring(0, { stiffness: 110, damping: 20, mass: 0.6 })
  useEffect(() => {
    spring.set(frac)
  }, [frac, spring])

  const dashOffset = useTransform(spring, (v) => ARC_LEN * (1 - v))
  /* Needle tip is computed in user units rather than applied as a
     transform: SVG's rotate(deg cx cy) is not valid CSS transform
     syntax, so driving it through style would never rotate. */
  const needleDeg = useTransform(spring, (v) => START + SWEEP * v)
  const tipX = useTransform(needleDeg, (d) => CX + (R - 15) * Math.cos((d * Math.PI) / 180))
  const tipY = useTransform(needleDeg, (d) => CY + (R - 15) * Math.sin((d * Math.PI) / 180))

  const guardDeg = START + SWEEP * 0.5
  const guardOuter = polar(CX, CY, R + STROKE / 2 + 7, guardDeg)
  const guardInner = polar(CX, CY, R - STROKE / 2 - 7, guardDeg)

  const displayValue = value === null || value === undefined ? '—' : (value * 100).toFixed(2)

  return (
    <div className="gauge" data-breach={breach} style={{ '--gc': st.color }}>
      {breach && <span className="gauge__ping" />}

      <div className="gauge__head">
        <div>
          <div className="gauge__name">{name}</div>
          <div className="jsonpath">{path}</div>
        </div>
        <motion.div
          className="gauge__state"
          key={st.key}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {st.text}
        </motion.div>
      </div>

      <div className="gauge__svgwrap">
        <svg width={SIZE} height={SIZE - 18} viewBox={`0 0 ${SIZE} ${SIZE - 18}`}>
          <defs>
            <linearGradient id={`g-${uid}`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--cyan)" />
              <stop offset="52%" stopColor="var(--amber)" />
              <stop offset="100%" stopColor="var(--red)" />
            </linearGradient>
            <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* track */}
          <path
            d={arcPath(CX, CY, R, START, START + SWEEP)}
            fill="none"
            stroke="rgba(120,165,220,0.13)"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* minor ticks */}
          {Array.from({ length: 25 }).map((_, i) => {
            const d = START + (SWEEP * i) / 24
            const inner = polar(CX, CY, R - STROKE / 2 - 3, d)
            const outer = polar(CX, CY, R - STROKE / 2 - (i % 6 === 0 ? 9 : 6), d)
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(120,165,220,0.28)"
                strokeWidth={i % 6 === 0 ? 1.4 : 0.8}
              />
            )
          })}

          {/* value arc */}
          <motion.path
            d={arcPath(CX, CY, R, START, START + SWEEP)}
            fill="none"
            stroke={`url(#g-${uid})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            style={{ strokeDashoffset: dashOffset }}
            filter={`url(#glow-${uid})`}
          />

          {/* threshold guard line — pulses so the eye tracks the limit */}
          <motion.line
            x1={guardInner.x}
            y1={guardInner.y}
            x2={guardOuter.x}
            y2={guardOuter.y}
            stroke="var(--amber)"
            strokeWidth="2.2"
            strokeLinecap="round"
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <text
            x={guardOuter.x}
            y={guardOuter.y - 6}
            textAnchor="middle"
            fill="var(--amber)"
            fontSize="8"
            fontFamily="var(--mono)"
            letterSpacing="0.1em"
          >
            τ
          </text>

          {/* needle — endpoint driven directly, see note above */}
          <motion.line
            x1={CX}
            y1={CY}
            x2={tipX}
            y2={tipY}
            stroke={st.color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={CX} cy={CY} r="4.5" fill="var(--bg-void)" stroke={st.color} strokeWidth="1.6" />
        </svg>

        <div className="gauge__readout">
          <div className="gauge__val tnum">{displayValue}</div>
          <div className="gauge__unit">% ERROR RATE</div>
        </div>
      </div>

      <div className="gauge__foot">
        <span className="gauge__tau">
          {tauLabel} <b>{pct(tau)}</b>
        </span>
        <span className="gauge__margin">
          {value === null || value === undefined
            ? '—'
            : breach
              ? `+${((value / tau - 1) * 100).toFixed(0)}% OVER`
              : `${((1 - value / tau) * 100).toFixed(0)}% MARGIN`}
        </span>
      </div>
    </div>
  )
}
