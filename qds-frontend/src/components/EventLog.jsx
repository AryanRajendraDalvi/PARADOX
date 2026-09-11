/* ============================================================
   EventLog — one row per round, newest on top (plan §5.2).

   React key is `${session_id}-${round_id}` exactly as specified:
   round_id resets to 1 on every attack switch, so round_id alone
   would collide across sessions and cause the flicker/re-render
   churn the plan calls out. session_id disambiguates restarts.

   Rows enter with a scanline sweep. `layout` is deliberately NOT
   used on the rows — with newest-on-top insertion it would animate
   the entire list downward on every round, which reads as jitter on
   a fast stream. The single-row entrance is the right cue.
   ============================================================ */

import { AnimatePresence, motion } from 'framer-motion'
import { roundKey } from '../lib/protocol.js'
import { FlagBadges, PhaseBadge, VerdictChip } from './primitives.jsx'

export function EventLog({ log, maxHeight = 460 }) {
  return (
    <div className="log">
      <div className="log__head">
        <span className="label">Round</span>
        <span className="label">Phase</span>
        <span className="label">Verdict</span>
        <span className="label">Event Flags</span>
        <span className="label" style={{ textAlign: 'right' }}>
          MAC
        </span>
      </div>

      <div className="log__scroll" style={{ maxHeight }}>
        {log.length === 0 && (
          <div className="log__empty">awaiting first round on the stream…</div>
        )}

        <AnimatePresence initial={false}>
          {log.map((u, i) => {
            const bad = u.verdict === 'REJECT'
            return (
              <motion.div
                className="log__row"
                key={roundKey(u)}
                data-bad={bad}
                data-commit={Boolean(u.audit?.batch_committed)}
                initial={{ opacity: 0, y: -12, backgroundColor: 'rgba(34,211,238,0.09)' }}
                animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* scanline rides across only on the newest row */}
                {i === 0 && (
                  <motion.span
                    className="log__scanline"
                    initial={{ x: '-100%', opacity: 1 }}
                    animate={{ x: '100%', opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                )}

                <span className="log__rid">#{u.round_id}</span>
                <span>
                  <PhaseBadge phase={u.phase} size="sm" />
                </span>
                <span>
                  <VerdictChip verdict={u.verdict} size="sm" />
                </span>
                <span className="log__flags">
                  {u.event_flags?.length ? (
                    <FlagBadges flags={u.event_flags} max={3} />
                  ) : (
                    <span className="log__none">—</span>
                  )}
                </span>
                <span className="log__mac" title={u.auth?.mac_tag}>
                  {u.auth?.mac_verified === false ? (
                    <b style={{ color: 'var(--red)' }}>FORGED</b>
                  ) : (
                    (u.auth?.mac_tag || '').slice(0, 8)
                  )}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
