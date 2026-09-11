/* ============================================================
   AttackerLogsView (?role=attacker) — plan §5.
   Attack controls + full event log + security ledger strip.
   Built first because it exercises every field in the contract.
   ============================================================ */

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { AttackDeck } from '../components/AttackDeck.jsx'
import { EventLog } from '../components/EventLog.jsx'
import { LedgerStrip } from '../components/LedgerStrip.jsx'
import { Panel, PhaseBadge, SectionLabel, VerdictChip } from '../components/primitives.jsx'
import { ATTACK_BY_ID } from '../lib/protocol.js'

function Counter({ label, value, color }) {
  return (
    <div className="counter">
      <div className="label">{label}</div>
      <motion.div
        className="counter__v"
        style={{ '--cc': color }}
        key={value}
        initial={{ opacity: 0.4, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {value}
      </motion.div>
    </div>
  )
}

/* Rolling REJECT-density sparkline. Reads left-to-right = oldest to
   newest, which is the opposite of the log order on purpose: a trend
   should read like a chart, not like a feed. */
function RejectSpark({ log }) {
  const bars = useMemo(() => {
    const recent = log.slice(0, 40).reverse()
    return recent.map((u) => ({
      bad: u.verdict === 'REJECT',
      h: 22 + (u.event_flags?.length || 0) * 12,
    }))
  }, [log])

  if (bars.length === 0) return null

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="label">Verdict density · last {bars.length} rounds</span>
        <span className="label">oldest → newest</span>
      </div>
      <div className="spark">
        {bars.map((b, i) => (
          <motion.span
            className="spark__b"
            key={i}
            style={{ '--sb': b.bad ? 'var(--red)' : 'var(--emerald)' }}
            initial={{ height: 3 }}
            animate={{ height: `${Math.min(b.h, 100)}%` }}
            transition={{ duration: 0.3, delay: i * 0.004 }}
          />
        ))}
      </div>
    </div>
  )
}

export function AttackerLogsView({ update, log, attack, sendCommand }) {
  const stats = useMemo(() => {
    const total = log.length
    const rejects = log.filter((u) => u.verdict === 'REJECT').length
    const macFails = log.filter((u) => u.auth?.mac_verified === false).length
    const commits = log.filter((u) => u.audit?.batch_committed).length
    const rate = total ? Math.round((rejects / total) * 100) : 0
    return { total, rejects, macFails, commits, rate }
  }, [log])

  const meta = ATTACK_BY_ID[attack] || ATTACK_BY_ID.none

  return (
    <>
      <Panel
        accent="var(--attacker)"
        id="⚡"
        title="Attack Controls"
        desc='sends {"command":"START","attack":"…"}'
        right={
          <div className="row">
            <span className="label">active vector</span>
            <motion.span
              className="verdict"
              style={{ '--vc': meta.color }}
              key={meta.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {meta.short.toUpperCase()}
            </motion.span>
          </div>
        }
      >
        <div className="pbody">
          <AttackDeck active={attack} onFire={sendCommand} />
          <div className="hint">
            <span className="hint__k">note</span>
            <span style={{ fontSize: 12, color: 'var(--tx-dim)' }}>
              One vector at a time — the contract carries a single{' '}
              <code>attack</code> id per START. Switching resets{' '}
              <code>round_id</code> to 1 and issues a new <code>session_id</code>.
            </span>
          </div>
        </div>
      </Panel>

      <Panel
        accent="var(--cyan)"
        id="§"
        title="Security Ledger"
        desc="per-round MAC · per-batch Merkle root"
      >
        <div className="pbody">
          <LedgerStrip update={update} />
        </div>
      </Panel>

      <Panel
        accent="var(--attacker)"
        id="≡"
        title="Event Log"
        desc={`newest first · key = \${session_id}-\${round_id}`}
        right={
          update ? (
            <div className="row">
              <PhaseBadge phase={update.phase} size="sm" />
              <VerdictChip verdict={update.verdict} size="sm" />
            </div>
          ) : null
        }
      >
        <div className="pbody" style={{ paddingBottom: 12 }}>
          <div className="counters">
            <Counter label="rounds" value={stats.total} />
            <Counter label="rejects" value={stats.rejects} color="var(--red)" />
            <Counter label="reject rate" value={`${stats.rate}%`} color={stats.rate > 0 ? 'var(--amber)' : 'var(--emerald)'} />
            <Counter label="mac fails" value={stats.macFails} color="var(--red)" />
            <Counter label="batches" value={stats.commits} color="var(--cyan)" />
          </div>
          <RejectSpark log={log} />
          <SectionLabel>round stream</SectionLabel>
        </div>
        <EventLog log={log} maxHeight={430} />
      </Panel>
    </>
  )
}
