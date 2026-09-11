/* ============================================================
   AttackDeck — the six attack triggers plus reset (plan §5.1).

   Rendered as tactile armed/safe switches. Only one can be active at
   a time because the backend contract is a single START command with
   one attack id — modelling them as independent toggles would imply
   a combination the engine cannot receive. Pressing the active attack
   again is a no-op rather than a toggle-off; NONE is the documented
   way back to a clean channel.
   ============================================================ */

import { motion } from 'framer-motion'
import { ATTACKS } from '../lib/protocol.js'
import { BoltIcon, CheckIcon } from './primitives.jsx'

export function AttackDeck({ active, onFire, disabled }) {
  return (
    <div className="deck">
      {ATTACKS.map((a) => {
        const on = active === a.id
        const isReset = a.id === 'none'
        return (
          <motion.button
            className="sw"
            key={a.id}
            data-on={on}
            style={{ '--sc': a.color }}
            onClick={() => onFire(a.id)}
            disabled={disabled}
            whileTap={{ scale: 0.975 }}
            aria-pressed={on}
            title={`${a.name} — sends {"command":"START","attack":"${a.id}"}`}
          >
            {on && !isReset && (
              <motion.span
                className="sw__hazard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.14, backgroundPositionX: [0, 26] }}
                transition={{
                  backgroundPositionX: { duration: 1.1, repeat: Infinity, ease: 'linear' },
                }}
              />
            )}

            <div className="sw__top">
              <span className="sw__name">{a.name}</span>
              <span className="sw__track">
                <motion.span
                  className="sw__knob"
                  animate={{ x: on ? 15 : 0 }}
                  transition={{ type: 'spring', stiffness: 620, damping: 30 }}
                />
              </span>
            </div>

            <div className="sw__desc">{a.desc}</div>

            <div className="sw__cmd">
              {on ? (
                <span style={{ color: a.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {isReset ? <CheckIcon size={9} /> : <BoltIcon size={9} />}
                  {isReset ? 'CHANNEL CLEAN' : 'ARMED · STREAMING'}
                </span>
              ) : (
                `attack: "${a.id}"`
              )}
            </div>

            {on && (
              <motion.span
                className="sw__led"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0.5, 1, 0.5] }}
                transition={{
                  scaleX: { duration: 0.3 },
                  opacity: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
