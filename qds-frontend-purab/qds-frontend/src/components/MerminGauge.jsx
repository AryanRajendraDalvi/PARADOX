/* ============================================================
   MerminGauge — non-locality needle for checks.mermin_value.

   Scale 0..4 with two marked bounds:
     • 2      classical limit
     • 2√2    quantum (non-classical) violation target
   The zone between 2 and 2√2 is a real region — a weak violation is
   still a violation but not a healthy one, so it gets its own amber
   band rather than being lumped in with either extreme.

   On non-Mermin rounds mermin_value is null. Per plan §4 we never
   show a stale value: the needle parks and a ghosted OFFLINE overlay
   covers the dial. Parking (rather than unmounting) keeps the panel
   height stable so the layout doesn't jump every few rounds.
   ============================================================ */

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useId } from 'react'
import { MERMIN_CLASSICAL, MERMIN_MAX, MERMIN_QUANTUM, merminState } from '../lib/protocol.js'

const W = 250
const H = 150
const CX = W / 2
const CY = H - 22
const R = 96
const START = 180
const SWEEP = 180

function polar(r, deg) {
  const rad = (deg * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function arc(r, from, to) {
  const a = polar(r, from)
  const b = polar(r, to)
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${Math.abs(to - from) > 180 ? 1 : 0} 1 ${b.x} ${b.y}`
}

const degFor = (v) => START + SWEEP * (Math.min(Math.max(v, 0), MERMIN_MAX) / MERMIN_MAX)

export function MerminGauge({ value, phase }) {
  const live = value !== null && value !== undefined
  const st = merminState(value)
  /* unique fragment id: this gauge renders twice on the Wall route, and
     duplicate filter ids would make both resolve to the first one. */
  const glowId = `m-glow-${useId().replace(/:/g, '')}`

  const spring = useSpring(degFor(0), { stiffness: 90, damping: 13, mass: 0.9 })
  useEffect(() => {
    if (live) spring.set(degFor(value))
  }, [value, live, spring])

  /* Needle drawn as a rotating polygon via an SVG transform attribute
     (not CSS): rotate(deg cx cy) is only valid as an attribute value. */
  const needleRotate = useTransform(spring, (d) => `rotate(${d}, ${CX}, ${CY})`)

  return (
    <div className="mermin" data-live={live} style={{ '--mc': st.color }}>
      <div className="gauge__head">
        <div>
          <div className="gauge__name">Mermin Non-Locality</div>
          <div className="jsonpath">checks.mermin_value</div>
        </div>
        <div className="mermin__violation">{st.text}</div>
      </div>

      <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* classical band 0..2 (red-ish: no violation) */}
          <path
            d={arc(R, START, degFor(MERMIN_CLASSICAL))}
            fill="none"
            stroke="rgba(244,69,60,0.3)"
            strokeWidth="10"
          />
          {/* weak-violation band 2..2√2 */}
          <path
            d={arc(R, degFor(MERMIN_CLASSICAL), degFor(MERMIN_QUANTUM))}
            fill="none"
            stroke="rgba(251,191,36,0.32)"
            strokeWidth="10"
          />
          {/* non-classical band 2√2..4 */}
          <path
            d={arc(R, degFor(MERMIN_QUANTUM), START + SWEEP)}
            fill="none"
            stroke="rgba(167,139,250,0.45)"
            strokeWidth="10"
          />

          {/* bound markers */}
          {[
            { v: MERMIN_CLASSICAL, c: 'var(--red)', t: '2' },
            { v: MERMIN_QUANTUM, c: 'var(--violet)', t: '2√2' },
          ].map((m) => {
            const d = degFor(m.v)
            const i = polar(R - 9, d)
            const o = polar(R + 12, d)
            const l = polar(R + 24, d)
            return (
              <g key={m.t}>
                <line x1={i.x} y1={i.y} x2={o.x} y2={o.y} stroke={m.c} strokeWidth="2" />
                <text
                  x={l.x}
                  y={l.y + 3}
                  textAnchor="middle"
                  fill={m.c}
                  fontSize="9"
                  fontFamily="var(--mono)"
                  fontWeight="700"
                >
                  {m.t}
                </text>
              </g>
            )
          })}

          {/* scale ticks */}
          {Array.from({ length: 17 }).map((_, i) => {
            const d = START + (SWEEP * i) / 16
            const a = polar(R - 8, d)
            const b = polar(R - (i % 4 === 0 ? 16 : 12), d)
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="rgba(120,165,220,0.3)"
                strokeWidth={i % 4 === 0 ? 1.3 : 0.7}
              />
            )
          })}

          {/* needle */}
          <motion.g transform={needleRotate} filter={`url(#${glowId})`}>
            <polygon
              points={`${CX},${CY - 3.4} ${CX + R - 20},${CY - 0.9} ${CX + R - 20},${CY + 0.9} ${CX},${CY + 3.4}`}
              fill={live ? st.color : 'var(--tx-faint)'}
            />
          </motion.g>
          <circle cx={CX} cy={CY} r="7" fill="var(--bg-inset)" stroke={live ? st.color : 'var(--tx-faint)'} strokeWidth="1.8" />
          <circle cx={CX} cy={CY} r="2.4" fill={live ? st.color : 'var(--tx-faint)'} />
        </svg>

        <div style={{ position: 'absolute', bottom: 2, textAlign: 'center' }}>
          <div
            className="tnum"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1,
              color: live ? st.color : 'var(--tx-faint)',
              textShadow: live ? `0 0 20px ${st.color}` : 'none',
            }}
          >
            {live ? value.toFixed(3) : '—'}
          </div>
          <div className="gauge__unit">MERMIN VALUE · MAX 4.000</div>
        </div>

        {/* ghosted OFFLINE overlay for non-Mermin rounds */}
        {!live && (
          <motion.div
            className="mermin__off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mermin__offtx">
              OFFLINE · NON-MERMIN ROUND
              <span>
                {phase ? `current phase: ${phase}` : 'awaiting stream'} — value is null, nothing held over
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
