/* ============================================================
   WallView (?role=all) — additive demo route.

   Not part of the 4-panel contract; it exists so a single projector
   can show cause → effect across all parties at once. The four
   panels are the same components used by the individual routes, so
   there is no second implementation to keep in sync.

   The Alice → Bob/Charlie distribution beams are drawn here, at the
   layout level, because that is the only place where the panels
   share a coordinate space.
   ============================================================ */

import { motion } from 'framer-motion'
import { ArcGauge } from '../components/ArcGauge.jsx'
import { BellSource } from '../components/BellSource.jsx'
import { CorrelationBeam } from '../components/CorrelationBeam.jsx'
import { EventLog } from '../components/EventLog.jsx'
import { LedgerStrip } from '../components/LedgerStrip.jsx'
import { MerminGauge } from '../components/MerminGauge.jsx'
import { AttackDeck } from '../components/AttackDeck.jsx'
import {
  Field,
  Panel,
  PhaseBadge,
  StatusBadge,
  VerdictChip,
} from '../components/primitives.jsx'
import { correlationVerdict, thresholdState } from '../lib/protocol.js'

/* Distribution beam drawn between the Alice panel and the B/C column.
   Pure decoration keyed to round_id so it fires once per round. */
function DistributionBeam({ roundId, active }) {
  return (
    <svg
      width="100%"
      height="34"
      viewBox="0 0 1000 34"
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="dist" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(244,114,182,0.5)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0.5)" />
        </linearGradient>
      </defs>
      <path d="M 40 2 C 300 2, 400 30, 700 30" fill="none" stroke="url(#dist)" strokeWidth="1.4" strokeDasharray="4 4" />
      <path d="M 40 2 C 300 2, 500 30, 960 30" fill="none" stroke="url(#dist)" strokeWidth="1.4" strokeDasharray="4 4" />
      {active &&
        ['M 40 2 C 300 2, 400 30, 700 30', 'M 40 2 C 300 2, 500 30, 960 30'].map((d, i) => (
          <motion.circle
            key={`${roundId}-${i}`}
            r={3.6}
            cx={0}
            cy={0}
            fill="#fff"
            style={{ offsetPath: `path("${d}")`, filter: 'drop-shadow(0 0 5px var(--cyan))' }}
            initial={{ offsetDistance: '0%', opacity: 0 }}
            animate={{ offsetDistance: '100%', opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.9, ease: 'easeInOut', times: [0, 0.15, 0.85, 1] }}
          />
        ))}
    </svg>
  )
}

export function WallView({ update, log, attack, sendCommand }) {
  const a = update?.parties?.alice
  const b = update?.parties?.bob
  const ch = update?.parties?.charlie
  const c = update?.checks
  const corr = correlationVerdict(update)
  const qberSt = thresholdState(c?.decoy_qber, c?.tau_hoeffding)

  return (
    <>
      {/* row 1: Alice + attack deck */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr)', gap: 18 }} className="wall-row">
        <Panel
          accent="var(--alice)"
          id="A"
          title="Alice · Signer"
          desc="bell measurement + broadcast"
          right={update ? <PhaseBadge phase={update.phase} size="sm" /> : null}
        >
          <div className="pbody">
            <BellSource
              roundId={update?.round_id}
              measured={Boolean(a?.measured)}
              bits={a?.outcome_bits}
              basis={a?.basis}
            />
          </div>
        </Panel>

        <Panel
          accent="var(--attacker)"
          id="⚡"
          title="Attack Controls"
          desc="single vector per START"
          right={<VerdictChip verdict={update?.verdict} size="sm" />}
        >
          <div className="pbody">
            <AttackDeck active={attack} onFire={sendCommand} />
          </div>
        </Panel>
      </div>

      <DistributionBeam roundId={update?.round_id} active={Boolean(a?.measured)} />

      {/* row 2: Bob + Charlie */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 18 }} className="wall-row">
        <Panel
          accent="var(--bob)"
          id="B"
          title="Bob · Verifier"
          desc="correction + local checks"
          right={
            <span className="verdict" style={{ '--vc': qberSt.color }}>
              {qberSt.text}
            </span>
          }
        >
          <div className="pbody">
            <div className="grid2">
              <Field label="Outcome" path="parties.bob.outcome" value={b?.outcome ?? null} color="var(--bob)" />
              <Field
                label="Correction"
                path="parties.bob.correction_applied"
                value={b?.correction_applied ?? null}
                color="var(--bob)"
              />
            </div>
            <div className="grid2">
              <ArcGauge
                name="Decoy QBER"
                path="checks.decoy_qber"
                value={c?.decoy_qber ?? null}
                tau={c?.tau_hoeffding}
                tauLabel="τ hoeffding"
              />
              <ArcGauge
                name="Mismatch Rate"
                path="checks.mismatch_rate"
                value={c?.mismatch_rate ?? null}
                tau={c?.tau_cefb}
                tauLabel="τ cefb"
              />
            </div>
          </div>
        </Panel>

        <Panel
          accent="var(--charlie)"
          id="C"
          title="Charlie · Verifier"
          desc="correlation + hardware checks"
          right={<StatusBadge status={update?.status} />}
        >
          <div className="pbody">
            <div className="grid2">
              <Field label="Outcome" path="parties.charlie.outcome" value={ch?.outcome ?? null} color="var(--charlie)" />
              <Field label="Basis" path="parties.charlie.basis" value={ch?.basis ?? null} />
            </div>
            <CorrelationBeam
              verdict={corr}
              roundId={update?.round_id}
              bobOutcome={b?.outcome}
              charlieOutcome={ch?.outcome}
            />
            <MerminGauge value={c?.mermin_value ?? null} phase={update?.phase} />
          </div>
        </Panel>
      </div>

      {/* row 3: ledger + log */}
      <Panel accent="var(--cyan)" id="§" title="Security Ledger" desc="per-round MAC · per-batch Merkle root">
        <div className="pbody">
          <LedgerStrip update={update} />
        </div>
      </Panel>

      <Panel accent="var(--attacker)" id="≡" title="Event Log" desc="newest first">
        <EventLog log={log} maxHeight={300} />
      </Panel>
    </>
  )
}
