/* ============================================================
   Protocol constants + presentation helpers.
   Single source of truth for anything the UI needs to know about
   the finalized backend contract (plan §6). No React in here.
   ============================================================ */

export const ROLES = ['alice', 'bob', 'charlie', 'attacker', 'all']

export const ROLE_META = {
  alice: { label: 'Alice', accent: 'var(--alice)', title: 'Alice · Signer', desc: 'Bell measurement + broadcast' },
  bob: { label: 'Bob', accent: 'var(--bob)', title: 'Bob · Verifier', desc: 'Correction + local checks' },
  charlie: { label: 'Charlie', accent: 'var(--charlie)', title: 'Charlie · Verifier', desc: 'Correlation + hardware checks' },
  attacker: { label: 'Attacker', accent: 'var(--attacker)', title: 'Attacker & Logs', desc: 'Attack controls + security ledger' },
  all: { label: 'Wall', accent: 'var(--cyan)', title: 'Command Wall', desc: 'All four panels, one screen' },
}

/* phase → hue + human label (plan brief §4: distinct hue per phase) */
export const PHASE_META = {
  verification: { hue: 'var(--phase-verification)', label: 'Verification' },
  mermin_test: { hue: 'var(--phase-mermin)', label: 'Mermin Test' },
  signing: { hue: 'var(--phase-signing)', label: 'Signing' },
}

export function phaseMeta(phase) {
  return PHASE_META[phase] || { hue: 'var(--tx-dim)', label: String(phase ?? '—') }
}

/* ---- the six attacks + reset (plan §5.1) ----
   `vector` copy drives the Threat Vector HUD so a non-technical
   observer can see what the attack is trying to exploit. */
export const ATTACKS = [
  {
    id: 'none',
    name: 'NONE / RESET',
    short: 'Reset',
    color: 'var(--emerald)',
    desc: 'Clean channel. Baseline honest run.',
    vector: {
      title: 'Channel Restored',
      kicker: 'baseline',
      blurb:
        'No adversary on the fiber. Decoy QBER and mismatch rates settle back below their security thresholds and every round should return ACCEPT.',
      exploits: 'nothing — control run',
      detector: 'all checks nominal',
    },
  },
  {
    id: 'intercept',
    name: 'INTERCEPT',
    short: 'Intercept',
    color: '#f97316',
    desc: 'Measure-and-resend on the quantum channel.',
    vector: {
      title: 'Intercept–Resend',
      kicker: 'eavesdropper node',
      blurb:
        'Eve taps the optical fiber between Alice and Bob, measures each photon in a guessed basis and forwards a fresh one. Her guesses are wrong half the time, so she injects detectable noise into the decoy statistics.',
      exploits: 'quantum channel Alice → Bob',
      detector: 'decoy_qber vs tau_hoeffding',
    },
  },
  {
    id: 'entangle',
    name: 'ENTANGLE',
    short: 'Entangle',
    color: '#8b5cf6',
    desc: 'Ancilla entanglement / collective attack.',
    vector: {
      title: 'Entangling Probe',
      kicker: 'ancilla injection',
      blurb:
        'Eve entangles her own ancilla qubit with the travelling photon and delays measurement. This degrades the genuine three-party correlation — Bob and Charlie stop agreeing, and the Mermin value falls out of the non-classical zone.',
      exploits: 'entanglement between all three parties',
      detector: 'mermin_value + B/C correlation',
    },
  },
  {
    id: 'replay',
    name: 'REPLAY',
    short: 'Replay',
    color: '#eab308',
    desc: 'Re-send a previously captured valid round.',
    vector: {
      title: 'Replay Injection',
      kicker: 'stale transcript',
      blurb:
        'Eve records a round that legitimately passed, then re-injects that exact transcript later hoping it is accepted twice. The freshness/nonce binding in the signature layer is what has to catch it.',
      exploits: 'transcript freshness',
      detector: 'mismatch_rate + replay flag',
    },
  },
  {
    id: 'batchNoise',
    name: 'BATCH NOISE',
    short: 'Batch Noise',
    color: '#06b6d4',
    desc: 'Low-level noise smeared across a whole batch.',
    vector: {
      title: 'Batch Noise Smear',
      kicker: 'sub-threshold drip',
      blurb:
        'Instead of one loud tamper, Eve adds a little noise to every round in the batch, trying to stay under the per-round limit while still corrupting the batch. The CEFB bound is the aggregate check that sees it.',
      exploits: 'per-round vs per-batch accounting gap',
      detector: 'mismatch_rate vs tau_cefb',
    },
  },
  {
    id: 'blind',
    name: 'BLIND',
    short: 'Blind',
    color: '#ec4899',
    desc: 'Detector blinding / bright-light control.',
    vector: {
      title: 'Detector Blinding',
      kicker: 'hardware side channel',
      blurb:
        'Eve shines bright light to force the single-photon detectors into linear mode, letting her dictate which detector clicks. It is a hardware attack, so it shows up as impossible-looking statistics rather than ordinary noise.',
      exploits: 'detector hardware, not the maths',
      detector: 'decoy_qber collapse + mermin anomaly',
    },
  },
  {
    id: 'macForge',
    name: 'MAC FORGE',
    short: 'MAC Forge',
    color: 'var(--red)',
    desc: 'Forge the classical authentication tag.',
    vector: {
      title: 'MAC Forgery',
      kicker: 'classical channel',
      blurb:
        'Eve leaves the quantum channel alone and instead forges the classical authentication tag on the broadcast. The quantum statistics stay clean — the MAC check alone is what rejects the round.',
      exploits: 'classical authenticated channel',
      detector: 'auth.mac_verified → REJECT',
    },
  },
]

export const ATTACK_BY_ID = Object.fromEntries(ATTACKS.map((a) => [a.id, a]))

/* Human-readable flag names. Unknown flags fall back to a
   de-snake-cased version so a new backend flag never renders blank. */
const FLAG_LABELS = {
  mac_verification_failure: 'MAC VERIFICATION FAILURE',
  decoy_threshold_breach: 'DECOY THRESHOLD BREACH',
  cefb_threshold_breach: 'CEFB THRESHOLD BREACH',
  correlation_mismatch: 'CORRELATION MISMATCH',
  mermin_violation_lost: 'MERMIN VIOLATION LOST',
  replay_detected: 'REPLAY DETECTED',
  stale_nonce: 'STALE NONCE',
  detector_blinding_suspected: 'DETECTOR BLINDING',
  batch_noise_detected: 'BATCH NOISE',
  qber_anomaly: 'QBER ANOMALY',
}

export function flagLabel(f) {
  return FLAG_LABELS[f] || String(f).replace(/_/g, ' ').toUpperCase()
}

/* ---- formatting ---- */

export function pct(v, digits = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return `${(v * 100).toFixed(digits)}%`
}

export function num(v, digits = 3) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return Number(v).toFixed(digits)
}

/* Threshold state for a value/limit pair.
   Cyan → amber at 65% of the limit → red on breach. */
export function thresholdState(value, tau) {
  if (value === null || value === undefined || !tau) {
    return { key: 'idle', color: 'var(--tx-dim)', text: 'NO DATA', ratio: 0 }
  }
  const ratio = value / tau
  if (ratio >= 1) return { key: 'breach', color: 'var(--red)', text: 'BREACH', ratio }
  if (ratio >= 0.65) return { key: 'warn', color: 'var(--amber)', text: 'ELEVATED', ratio }
  return { key: 'safe', color: 'var(--cyan)', text: 'NOMINAL', ratio }
}

/* Mermin: classical bound 2, quantum (Tsirelson-style) target 2√2 ≈ 2.828 */
export const MERMIN_CLASSICAL = 2
export const MERMIN_QUANTUM = 2 * Math.SQRT2
export const MERMIN_MAX = 4

export function merminState(v) {
  if (v === null || v === undefined) {
    return { key: 'offline', color: 'var(--tx-dim)', text: 'OFFLINE' }
  }
  if (v > MERMIN_QUANTUM) return { key: 'quantum', color: 'var(--violet)', text: 'NON-CLASSICAL' }
  if (v > MERMIN_CLASSICAL) return { key: 'weak', color: 'var(--amber)', text: 'WEAK VIOLATION' }
  return { key: 'classical', color: 'var(--red)', text: 'CLASSICAL — NO VIOLATION' }
}

/* Correlation verdict (plan §4): derived, and only meaningful on
   verification rounds where both parties actually measured. */
export function correlationVerdict(update) {
  if (!update) return { key: 'idle', text: 'AWAITING ROUND', color: 'var(--tx-dim)', match: null }
  const { phase, parties } = update
  const b = parties?.bob
  const c = parties?.charlie
  if (phase !== 'verification') {
    return { key: 'na', text: 'NOT A VERIFICATION ROUND', color: 'var(--tx-dim)', match: null }
  }
  if (!b?.measured || !c?.measured || b.outcome === null || c.outcome === null) {
    return { key: 'na', text: 'CHARLIE NOT PARTICIPATING', color: 'var(--tx-dim)', match: null }
  }
  const match = b.outcome === c.outcome
  return match
    ? { key: 'match', text: 'CORRELATED', color: 'var(--emerald)', match: true }
    : { key: 'mismatch', text: 'DECOHERENCE — MISMATCH', color: 'var(--red)', match: false }
}

/* Stable React key for a round (plan §5.2) */
export function roundKey(u) {
  return `${u.session_id}-${u.round_id}`
}

export const BATCH_DEPTH = 10
