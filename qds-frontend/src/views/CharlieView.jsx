/* ============================================================
   CharlieView (?role=charlie) — plan §4.
   Correlation verdict (derived) + Mermin hardware gauge + the
   PROVISIONAL status badge.
   ============================================================ */

import { motion } from 'framer-motion'
import { CorrelationBeam } from '../components/CorrelationBeam.jsx'
import { MerminGauge } from '../components/MerminGauge.jsx'
import { Field, Panel, PhaseBadge, StatusBadge, SectionLabel, VerdictChip } from '../components/primitives.jsx'
import { correlationVerdict } from '../lib/protocol.js'

export function CharlieView({ update }) {
  const ch = update?.parties?.charlie
  const bob = update?.parties?.bob
  const corr = correlationVerdict(update)

  return (
    <>
      <Panel
        accent="var(--charlie)"
        id="C"
        title="Charlie · Verifier"
        desc="correlation + hardware non-locality checks"
        right={
          <div className="row">
            {update && <PhaseBadge phase={update.phase} />}
            <VerdictChip verdict={update?.verdict} />
          </div>
        }
      >
        <div className="pbody">
          <div className="grid2">
            <Field
              label="Measurement outcome"
              path="parties.charlie.outcome"
              value={ch?.outcome ?? null}
              color="var(--charlie)"
            />
            {/* basis is legitimately null on non-participating rounds */}
            <Field label="Basis" path="parties.charlie.basis" value={ch?.basis ?? null} />
          </div>

          <SectionLabel>bob ↔ charlie correlation (derived)</SectionLabel>

          <CorrelationBeam
            verdict={corr}
            roundId={update?.round_id}
            bobOutcome={bob?.outcome}
            charlieOutcome={ch?.outcome}
          />

          <motion.div
            className="field"
            style={{
              borderColor:
                corr.key === 'match'
                  ? 'rgba(52,211,153,0.4)'
                  : corr.key === 'mismatch'
                    ? 'rgba(244,69,60,0.45)'
                    : undefined,
              background:
                corr.key === 'mismatch' ? 'rgba(244,69,60,0.06)' : undefined,
            }}
          >
            <div>
              <div className="label">Correlation verdict</div>
              <div className="jsonpath">
                derived: parties.bob.outcome == parties.charlie.outcome (verification rounds)
              </div>
            </div>
            <motion.div
              className="field__v"
              style={{ color: corr.color, fontSize: 11, letterSpacing: '0.1em' }}
              key={corr.text}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {corr.text}
            </motion.div>
          </motion.div>

          <SectionLabel>hardware non-locality</SectionLabel>

          <MerminGauge value={update?.checks?.mermin_value ?? null} phase={update?.phase} />

          <SectionLabel>signature status</SectionLabel>

          <div className="field">
            <div>
              <div className="label">Status</div>
              <div className="jsonpath">status — backend-hardcoded this build</div>
            </div>
            <StatusBadge status={update?.status} />
          </div>

          <div className="hint">
            <span className="hint__k">contract note</span>
            <span style={{ fontSize: 12, color: 'var(--tx-dim)' }}>
              <code>status</code> is pinned to <code>PROVISIONAL</code> upstream and is not
              yet wired to a confirmation sweep. No UI logic here branches on it, so when
              the backend starts emitting real transitions this badge reflects them with
              no changes.
            </span>
          </div>
        </div>
      </Panel>
    </>
  )
}
