/* ============================================================
   BobView (?role=bob) — plan §3.
   Home of the two statistical gauges, since Bob applies the
   reconstructive correction and is the party most directly exposed
   to channel-level tampering (decoy / CEFB).
   ============================================================ */

import { AnimatePresence, motion } from 'framer-motion'
import { ArcGauge } from '../components/ArcGauge.jsx'
import { Field, FlagBadges, Panel, PhaseBadge, SectionLabel, VerdictChip } from '../components/primitives.jsx'
import { thresholdState } from '../lib/protocol.js'

const CORRECTIONS = ['I', 'X', 'Y', 'Z']

/* The Pauli correction Bob applies to reconstruct the state.
   Shown as a 4-way selector so the applied gate is visible in
   context rather than as a bare letter. */
function CorrectionSelector({ applied }) {
  return (
    <div className="circuit" style={{ background: 'var(--bg-inset)' }}>
      <div className="gauge__head">
        <div>
          <div className="gauge__name">Reconstructive Correction</div>
          <div className="jsonpath">parties.bob.correction_applied</div>
        </div>
      </div>

      <div className="row" style={{ gap: 8, marginTop: 4 }}>
        {CORRECTIONS.map((g) => {
          const on = applied === g
          return (
            <motion.div
              key={g}
              style={{
                flex: 1,
                display: 'grid',
                placeItems: 'center',
                padding: '13px 0 11px',
                borderRadius: 8,
                fontFamily: 'var(--mono)',
                fontSize: 20,
                fontWeight: 700,
                position: 'relative',
                overflow: 'hidden',
                color: on ? '#04070d' : 'var(--tx-faint)',
                background: on ? 'var(--bob)' : 'rgba(120,165,220,0.05)',
                border: `1px solid ${on ? 'var(--bob)' : 'var(--line-faint)'}`,
                boxShadow: on ? '0 0 22px -6px var(--bob)' : 'none',
              }}
              animate={on ? { scale: [0.94, 1.04, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {g}
              {on && (
                <motion.span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.45)',
                  }}
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              )}
            </motion.div>
          )
        })}
        {/* null correction is a real state, not an error */}
        <motion.div
          style={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            padding: '13px 0 11px',
            borderRadius: 8,
            fontFamily: 'var(--mono)',
            fontSize: 12,
            fontWeight: 700,
            color: applied === null || applied === undefined ? 'var(--tx)' : 'var(--tx-faint)',
            background:
              applied === null || applied === undefined
                ? 'rgba(120,165,220,0.12)'
                : 'rgba(120,165,220,0.03)',
            border: '1px dashed var(--line)',
          }}
        >
          null
        </motion.div>
      </div>
    </div>
  )
}

export function BobView({ update }) {
  const b = update?.parties?.bob
  const c = update?.checks

  const qberSt = thresholdState(c?.decoy_qber, c?.tau_hoeffding)
  const cefbSt = thresholdState(c?.mismatch_rate, c?.tau_cefb)
  const anyBreach = qberSt.key === 'breach' || cefbSt.key === 'breach'

  return (
    <>
      <Panel
        accent="var(--bob)"
        id="B"
        title="Bob · Verifier"
        desc="correction + local statistical checks"
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
              label="Measurement outcome"
              path="parties.bob.outcome"
              value={b?.outcome ?? null}
              color="var(--bob)"
            />
          </div>

          <CorrectionSelector applied={b?.correction_applied} />

          <SectionLabel>quantum threat boundary</SectionLabel>

          {/* Both gauges scale to 2×tau so the guard line sits at the
              midpoint — see ArcGauge for why. */}
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

          <AnimatePresence>
            {anyBreach && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  className="field"
                  style={{
                    borderColor: 'rgba(244,69,60,0.5)',
                    background: 'rgba(244,69,60,0.07)',
                  }}
                >
                  <div>
                    <div className="label" style={{ color: 'var(--red)' }}>
                      threshold breached — local checks reject
                    </div>
                    <div className="jsonpath">event_flags</div>
                  </div>
                  <div className="log__flags" style={{ justifyContent: 'flex-end' }}>
                    <FlagBadges flags={update?.event_flags} max={2} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid2">
            <Field label="Basis" path="parties.bob.basis" value={b?.basis} />
            <Field
              label="Measured"
              path="parties.bob.measured"
              value={b ? String(b.measured) : null}
            />
          </div>
        </div>
      </Panel>
    </>
  )
}
