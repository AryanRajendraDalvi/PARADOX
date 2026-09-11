/* ============================================================
   AliceView (?role=alice) — plan §2.
   Read-only: Alice has no local decision logic, she measures and
   broadcasts. So the panel spends its space on the one concrete
   moment worth watching — the 2-bit transcript leaving the source.
   ============================================================ */

import { motion } from 'framer-motion'
import { BellSource } from '../components/BellSource.jsx'
import { Field, Panel, PhaseBadge, SectionLabel, VerdictChip } from '../components/primitives.jsx'

export function AliceView({ update }) {
  const a = update?.parties?.alice
  const bits = a?.outcome_bits

  return (
    <>
      <Panel
        accent="var(--alice)"
        id="A"
        title="Alice · Signer"
        desc="bell measurement + broadcast"
        right={
          <div className="row">
            {update && <PhaseBadge phase={update.phase} />}
            <VerdictChip verdict={update?.verdict} />
          </div>
        }
      >
        <div className="pbody">
          <div className="grid2">
            <Field label="Round" path="round_id" value={update ? `#${update.round_id}` : null} />
            <Field
              label="Batch"
              path="batch_id · batch_type"
              value={update ? `#${update.batch_id} · ${update.batch_type}` : null}
            />
          </div>

          <SectionLabel>broadcast event</SectionLabel>

          {/* "Message signed" event — measured true means the round's
              transcript has been produced and sent. */}
          <motion.div
            className="field"
            style={{
              borderColor: a?.measured ? 'rgba(244,114,182,0.4)' : undefined,
              background: a?.measured ? 'rgba(244,114,182,0.06)' : undefined,
            }}
            animate={a?.measured ? { scale: [1, 1.012, 1] } : {}}
            transition={{ duration: 0.35 }}
            key={`${update?.round_id}-measured`}
          >
            <div>
              <div className="label">Message signed &amp; broadcast</div>
              <div className="jsonpath">parties.alice.measured</div>
            </div>
            <div
              className="field__v"
              style={{ color: a?.measured ? 'var(--alice)' : 'var(--tx-faint)' }}
            >
              {a?.measured ? 'TRUE · SENT' : a === undefined ? '—' : 'FALSE'}
            </div>
          </motion.div>

          <BellSource
            roundId={update?.round_id}
            measured={Boolean(a?.measured)}
            bits={bits}
            basis={a?.basis}
          />

          <div className="grid2">
            <Field
              label="Transcript"
              path="parties.alice.outcome_bits"
              value={Array.isArray(bits) ? `[${bits.join(', ')}]` : null}
              color="var(--alice)"
            />
            <Field label="Basis" path="parties.alice.basis" value={a?.basis} />
          </div>
        </div>
      </Panel>
    </>
  )
}
