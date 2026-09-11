/* ============================================================
   In-browser protocol simulator.

   Stands in for bridge.py during development and for the demo
   preview. It emits ROUND_UPDATE frames that are byte-shape
   identical to plan §6 — same keys, same nesting, same nullability,
   including the `session_id` that bridge.py injects.

   Nothing here is a security model. It is a *presentation* model:
   the statistics are shaped so each of the six attacks drives the
   check that the plan says detects it, so the UI can be verified
   end to end before the real engine is attached.
   ============================================================ */

import { ATTACK_BY_ID, BATCH_DEPTH } from './protocol.js'

const PHASE_CYCLE = [
  'verification',
  'verification',
  'verification',
  'mermin_test',
  'verification',
  'signing',
  'verification',
  'verification',
  'mermin_test',
  'signing',
]

const CORRECTIONS = ['I', 'X', 'Y', 'Z']

function hex(n) {
  let s = ''
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`
}

/* gaussian-ish jitter without long tails */
function jitter(spread) {
  return (Math.random() + Math.random() + Math.random() - 1.5) * (spread / 1.5)
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

/* Per-attack statistical profile.
   qber/mismatch are means; the thresholds are fixed by the engine
   (tau_hoeffding 0.061, tau_cefb 0.089 per the §6 sample). */
const PROFILE = {
  none: { qber: 0.021, mism: 0.024, mermin: 2.78, corrBreak: 0, mac: 1 },
  intercept: { qber: 0.094, mism: 0.052, mermin: 2.42, corrBreak: 0.22, mac: 1 },
  entangle: { qber: 0.048, mism: 0.101, mermin: 1.86, corrBreak: 0.4, mac: 1 },
  replay: { qber: 0.026, mism: 0.118, mermin: 2.66, corrBreak: 0.3, mac: 1 },
  batchNoise: { qber: 0.057, mism: 0.086, mermin: 2.55, corrBreak: 0.16, mac: 1 },
  blind: { qber: 0.003, mism: 0.097, mermin: 3.51, corrBreak: 0.34, mac: 1 },
  macForge: { qber: 0.022, mism: 0.025, mermin: 2.8, corrBreak: 0, mac: 0 },
}

const TAU_HOEFFDING = 0.061
const TAU_CEFB = 0.089

export function createSimulator({ onFrame, intervalMs = 1400 } = {}) {
  let attack = 'none'
  let sessionId = uuid()
  let round = 0
  let timer = null
  let lastRoot = null
  let running = false

  /* replay attack needs a remembered transcript to re-inject */
  let capturedBits = null

  function reset(nextAttack) {
    attack = nextAttack
    // round_id resets to 1 and a fresh session_id is issued — this is the
    // exact behaviour the compound log key in plan §5.2 exists to survive.
    round = 0
    sessionId = uuid()
    lastRoot = null
    capturedBits = null
  }

  function build() {
    round += 1
    const p = PROFILE[attack] || PROFILE.none
    const isAttack = attack !== 'none'
    const phase = PHASE_CYCLE[(round - 1) % PHASE_CYCLE.length]
    const batchId = Math.floor((round - 1) / BATCH_DEPTH) + 1
    const committed = round % BATCH_DEPTH === 0

    /* batchNoise ramps within a batch — the whole point of the attack is
       that no single round looks bad but the batch aggregate does. */
    const posInBatch = ((round - 1) % BATCH_DEPTH) / (BATCH_DEPTH - 1)
    const ramp = attack === 'batchNoise' ? 0.55 + 0.75 * posInBatch : 1

    const decoyQber = clamp(p.qber * ramp + jitter(0.008), 0.0002, 0.35)
    const mismatchRate = clamp(p.mism * ramp + jitter(0.009), 0.0002, 0.35)

    /* Alice: 2-bit Bell outcome. Replay re-sends the captured pair. */
    let bits
    if (attack === 'replay' && capturedBits && round % 3 === 0) {
      bits = [...capturedBits]
    } else {
      bits = [Math.random() < 0.5 ? 0 : 1, Math.random() < 0.5 ? 0 : 1]
      if (round % 7 === 0) capturedBits = [...bits]
    }

    /* Charlie only participates on verification + mermin rounds. */
    const charlieIn = phase !== 'signing'
    const bobOutcome = Math.random() < 0.5 ? 0 : 1
    const charlieOutcome = charlieIn
      ? Math.random() < p.corrBreak
        ? bobOutcome ^ 1
        : bobOutcome
      : null

    const mermin =
      phase === 'mermin_test' ? clamp(p.mermin + jitter(0.14), 0, 4) : null

    const macVerified = attack === 'macForge' ? false : Math.random() > 0.002

    /* ---- verdict + flags ---- */
    const flags = []
    if (!macVerified) flags.push('mac_verification_failure')
    if (decoyQber > TAU_HOEFFDING) flags.push('decoy_threshold_breach')
    if (mismatchRate > TAU_CEFB) flags.push('cefb_threshold_breach')
    if (charlieIn && phase === 'verification' && charlieOutcome !== bobOutcome) {
      flags.push('correlation_mismatch')
    }
    if (mermin !== null && mermin <= 2) flags.push('mermin_violation_lost')
    if (attack === 'replay' && capturedBits && round % 3 === 0) flags.push('replay_detected')
    if (attack === 'blind' && decoyQber < 0.006) flags.push('detector_blinding_suspected')
    if (attack === 'batchNoise' && posInBatch > 0.7) flags.push('batch_noise_detected')

    const verdict = flags.length > 0 ? 'REJECT' : 'ACCEPT'

    if (committed) lastRoot = hex(64)

    /* Exactly the plan §6 shape — key order included, for readability
       when someone diffs this against the real stream. */
    return {
      type: 'ROUND_UPDATE',
      round_id: round,
      batch_id: batchId,
      batch_type: phase === 'signing' ? 'SIGNING' : 'VERIFICATION',
      phase,
      parties: {
        alice: { measured: true, basis: 'bell', outcome_bits: bits },
        bob: {
          measured: true,
          basis: 'Z',
          correction_applied: CORRECTIONS[(bits[0] * 2 + bits[1]) % 4],
          outcome: bobOutcome,
        },
        charlie: {
          measured: charlieIn,
          basis: charlieIn ? (phase === 'mermin_test' ? 'X' : 'Z') : null,
          outcome: charlieOutcome,
        },
      },
      checks: {
        decoy_qber: Number(decoyQber.toFixed(4)),
        mismatch_rate: Number(mismatchRate.toFixed(4)),
        tau_hoeffding: TAU_HOEFFDING,
        tau_cefb: TAU_CEFB,
        mermin_value: mermin === null ? null : Number(mermin.toFixed(3)),
      },
      auth: { mac_tag: hex(16), mac_verified: macVerified },
      audit: {
        batch_committed: committed,
        merkle_root: committed ? lastRoot : null,
      },
      attack: { active: isAttack, type: attack },
      verdict,
      status: 'PROVISIONAL',
      event_flags: flags,
      // injected by bridge.py in production (plan §6 note) — the mock and
      // the simulator both inject it so all three streams stay identical.
      session_id: sessionId,
    }
  }

  return {
    start() {
      if (running) return
      running = true
      onFrame?.(build())
      timer = setInterval(() => onFrame?.(build()), intervalMs)
    },
    stop() {
      running = false
      clearInterval(timer)
      timer = null
    },
    /* mirrors the {"command":"START","attack":"..."} contract (§5.1) */
    send(msg) {
      let parsed = msg
      if (typeof msg === 'string') {
        try {
          parsed = JSON.parse(msg)
        } catch {
          return
        }
      }
      if (parsed?.command === 'START' && ATTACK_BY_ID[parsed.attack]) {
        reset(parsed.attack)
      }
    },
    get attack() {
      return attack
    },
  }
}
