/* ============================================================
   App shell — role-switched by URL (?role=), one codebase per the
   unchanged v1 architecture §2–§8. Every view consumes the same
   stream from useSocket and filters it locally.
   ============================================================ */

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { QdsMark } from './components/primitives.jsx'
import { ThreatVectorHUD } from './components/ThreatVectorHUD.jsx'
import { useSocket } from './hooks/useSocket.js'
import { ATTACK_BY_ID, ROLES, ROLE_META, PHASE_META } from './lib/protocol.js'
import { AliceView } from './views/AliceView.jsx'
import { AttackerLogsView } from './views/AttackerLogsView.jsx'
import { BobView } from './views/BobView.jsx'
import { CharlieView } from './views/CharlieView.jsx'
import { WallView } from './views/WallView.jsx'
import './styles/shell.css'
import './styles/instruments.css'

function readRole() {
  const q = new URLSearchParams(window.location.search)
  const r = (q.get('role') || 'attacker').toLowerCase()
  return ROLES.includes(r) ? r : 'attacker'
}

const CONN_META = {
  live: { color: 'var(--emerald)', text: 'live · bridge', live: true },
  sim: { color: 'var(--cyan)', text: 'simulated stream', live: true },
  connecting: { color: 'var(--amber)', text: 'connecting…', live: true },
  reconnecting: { color: 'var(--amber)', text: 'reconnecting…', live: true },
  error: { color: 'var(--red)', text: 'socket error', live: false },
}

export default function App() {
  const [role, setRole] = useState(readRole)
  const { update, log, status, attack, sendCommand, transport, url } = useSocket()

  /* Threat Vector HUD: shown briefly on each attack press */
  const [hudAttack, setHudAttack] = useState(null)
  const hudTimer = useRef(null)

  const handleFire = useCallback(
    (id) => {
      sendCommand(id)
      setHudAttack(id)
      clearTimeout(hudTimer.current)
      hudTimer.current = setTimeout(() => setHudAttack(null), id === 'none' ? 1900 : 3400)
    },
    [sendCommand],
  )

  useEffect(() => () => clearTimeout(hudTimer.current), [])

  /* keep ?role= in the URL so a machine can be bookmarked / reloaded
     into the same panel — that's how the LAN test is driven. */
  const changeRole = useCallback((r) => {
    const q = new URLSearchParams(window.location.search)
    q.set('role', r)
    window.history.replaceState({}, '', `${window.location.pathname}?${q}`)
    setRole(r)
  }, [])

  useEffect(() => {
    const onPop = () => setRole(readRole())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const attackActive = Boolean(update?.attack?.active)
  const meta = ROLE_META[role]
  const conn = CONN_META[status] || CONN_META.connecting
  const phaseHue = PHASE_META[update?.phase]?.hue

  return (
    <div className="shell">
      {/* ambient threat aura — only mounted while an attack is live */}
      <AnimatePresence>
        {attackActive && (
          <motion.div
            className="aura"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="aura__vignette" />
            <div className="aura__scan" />
            <div className="aura__edge" />
          </motion.div>
        )}
      </AnimatePresence>

      <ThreatVectorHUD attackId={hudAttack} />

      {/* ---- top rail ---- */}
      <header className="rail">
        <div className="rail__brand">
          <span className="rail__mark">
            <QdsMark size={26} />
          </span>
          <div>
            <div className="rail__title">QDS Threat Detection</div>
            <div className="rail__sub">{meta.title}</div>
          </div>
        </div>

        <div className="rail__spacer" />

        {update && (
          <div className="ticker">
            <span className="label">round</span>
            <motion.span
              className="ticker__n"
              key={update.round_id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {String(update.round_id).padStart(3, '0')}
            </motion.span>
            <span className="label" style={{ color: 'var(--tx-dim)' }}>
              / batch {update.batch_id}
            </span>
          </div>
        )}

        {update && (
          <motion.div
            className="conn"
            style={{ borderColor: `color-mix(in srgb, ${phaseHue} 40%, transparent)` }}
          >
            <span className="conn__dot" style={{ '--c': phaseHue }} data-live="true" />
            <span className="conn__tx" style={{ color: phaseHue }}>
              {update.phase}
            </span>
          </motion.div>
        )}

        {/* role switcher */}
        <nav className="roles" aria-label="Panel role">
          {ROLES.map((r) => {
            const on = r === role
            return (
              <button
                className="roles__btn"
                key={r}
                data-on={on}
                onClick={() => changeRole(r)}
              >
                {on && (
                  <motion.span
                    className="roles__pill"
                    layoutId="rolepill"
                    style={{ '--role': ROLE_META[r].accent }}
                    transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                  />
                )}
                <span className="roles__tx">{ROLE_META[r].label}</span>
              </button>
            )
          })}
        </nav>

        <div className="conn" title={url || 'in-browser simulator'}>
          <span className="conn__dot" style={{ '--c': conn.color }} data-live={conn.live} />
          <span className="conn__tx">{conn.text}</span>
        </div>

        {attackActive && (
          <motion.div
            className="conn"
            style={{
              borderColor: 'rgba(244,69,60,0.5)',
              background: 'rgba(244,69,60,0.09)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.span
              className="conn__dot"
              style={{ '--c': 'var(--red)' }}
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 0.85, repeat: Infinity }}
            />
            <span className="conn__tx" style={{ color: '#ff9d96' }}>
              {ATTACK_BY_ID[attack]?.short || attack} active
            </span>
          </motion.div>
        )}
      </header>

      {/* ---- panel body ---- */}
      <main className={`page ${role === 'all' ? 'page--wall' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            {role === 'alice' && <AliceView update={update} />}
            {role === 'bob' && <BobView update={update} />}
            {role === 'charlie' && <CharlieView update={update} />}
            {role === 'attacker' && (
              <AttackerLogsView
                update={update}
                log={log}
                attack={attack}
                sendCommand={handleFire}
              />
            )}
            {role === 'all' && (
              <WallView update={update} log={log} attack={attack} sendCommand={handleFire} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="hint">
          <span className="hint__k">transport</span>
          <span style={{ fontSize: 12, color: 'var(--tx-dim)' }}>
            {transport === 'ws' ? (
              <>
                reading live frames from <code>{url}</code>
              </>
            ) : (
              <>
                in-browser simulator emitting the finalized contract shape. Point at a real
                stream with <code>?ws=ws://HOST:8765</code> — that is the only change needed
                to swap the mock for <code>bridge.py</code>.
              </>
            )}
          </span>
          <span className="hint__k">roles</span>
          <span style={{ fontSize: 12, color: 'var(--tx-dim)' }}>
            <code>?role=alice</code> <code>bob</code> <code>charlie</code>{' '}
            <code>attacker</code> <code>all</code>
          </span>
        </div>
      </main>
    </div>
  )
}
