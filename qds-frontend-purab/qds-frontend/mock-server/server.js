/* ============================================================
   Standalone mock relay server (plan §7.1).

   Purpose: the multi-machine LAN test (§7). The in-browser simulator
   is per-tab, so four machines would each run their own independent
   stream and drift apart. This server is the single coordinator —
   every panel connects to it and sees identical rounds, and an attack
   pressed on the attacker machine is reflected on all of them.

   It emits exactly the plan §6 frame shape and injects `session_id`
   the way bridge.py does, so the mock and the real stream are
   shape-identical. Swapping to bridge.py is a URL change only.

   Run:   npm run mock            (listens on 0.0.0.0:8765)
   Point: http://<host>:3000/?role=bob&ws=ws://<host>:8765
   ============================================================ */

import { WebSocketServer } from 'ws'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT || 8765)
const INTERVAL = Number(process.env.INTERVAL || 1400)

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
const BATCH_DEPTH = 10
const TAU_HOEFFDING = 0.061
const TAU_CEFB = 0.089

const PROFILE = {
  none: { qber: 0.021, mism: 0.024, mermin: 2.78, corrBreak: 0 },
  intercept: { qber: 0.094, mism: 0.052, mermin: 2.42, corrBreak: 0.22 },
  entangle: { qber: 0.048, mism: 0.101, mermin: 1.86, corrBreak: 0.4 },
  replay: { qber: 0.026, mism: 0.118, mermin: 2.66, corrBreak: 0.3 },
  batchNoise: { qber: 0.057, mism: 0.086, mermin: 2.55, corrBreak: 0.16 },
  blind: { qber: 0.003, mism: 0.097, mermin: 3.51, corrBreak: 0.34 },
  macForge: { qber: 0.022, mism: 0.025, mermin: 2.8, corrBreak: 0 },
}

const hex = (n) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
const jitter = (s) => (Math.random() + Math.random() + Math.random() - 1.5) * (s / 1.5)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

let attack = 'none'
let sessionId = randomUUID()
let round = 0
let lastRoot = null
let captured = null

function reset(next) {
  attack = next
  round = 0
  sessionId = randomUUID()
  lastRoot = null
  captured = null
  console.log(`[qds-mock] attack → ${next} · new session ${sessionId.slice(0, 8)}`)
}

function build() {
  round += 1
  const p = PROFILE[attack] || PROFILE.none
  const phase = PHASE_CYCLE[(round - 1) % PHASE_CYCLE.length]
  const batchId = Math.floor((round - 1) / BATCH_DEPTH) + 1
  const committed = round % BATCH_DEPTH === 0
  const posInBatch = ((round - 1) % BATCH_DEPTH) / (BATCH_DEPTH - 1)
  const ramp = attack === 'batchNoise' ? 0.55 + 0.75 * posInBatch : 1

  const decoyQber = clamp(p.qber * ramp + jitter(0.008), 0.0002, 0.35)
  const mismatchRate = clamp(p.mism * ramp + jitter(0.009), 0.0002, 0.35)

  let bits
  const isReplayRound = attack === 'replay' && captured && round % 3 === 0
  if (isReplayRound) {
    bits = [...captured]
  } else {
    bits = [Math.random() < 0.5 ? 0 : 1, Math.random() < 0.5 ? 0 : 1]
    if (round % 7 === 0) captured = [...bits]
  }

  const charlieIn = phase !== 'signing'
  const bobOutcome = Math.random() < 0.5 ? 0 : 1
  const charlieOutcome = charlieIn
    ? Math.random() < p.corrBreak
      ? bobOutcome ^ 1
      : bobOutcome
    : null

  const mermin = phase === 'mermin_test' ? clamp(p.mermin + jitter(0.14), 0, 4) : null
  const macVerified = attack === 'macForge' ? false : Math.random() > 0.002

  const flags = []
  if (!macVerified) flags.push('mac_verification_failure')
  if (decoyQber > TAU_HOEFFDING) flags.push('decoy_threshold_breach')
  if (mismatchRate > TAU_CEFB) flags.push('cefb_threshold_breach')
  if (charlieIn && phase === 'verification' && charlieOutcome !== bobOutcome) {
    flags.push('correlation_mismatch')
  }
  if (mermin !== null && mermin <= 2) flags.push('mermin_violation_lost')
  if (isReplayRound) flags.push('replay_detected')
  if (attack === 'blind' && decoyQber < 0.006) flags.push('detector_blinding_suspected')
  if (attack === 'batchNoise' && posInBatch > 0.7) flags.push('batch_noise_detected')

  if (committed) lastRoot = hex(64)

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
    audit: { batch_committed: committed, merkle_root: committed ? lastRoot : null },
    attack: { active: attack !== 'none', type: attack },
    verdict: flags.length ? 'REJECT' : 'ACCEPT',
    status: 'PROVISIONAL',
    event_flags: flags,
    // bridge.py injects this in production; injected here too so the
    // mock and live streams stay shape-identical (plan §6 note).
    session_id: sessionId,
  }
}

const wss = new WebSocketServer({ host: '0.0.0.0', port: PORT })

wss.on('connection', (ws, req) => {
  console.log(`[qds-mock] panel connected from ${req.socket.remoteAddress}`)
  ws.send(JSON.stringify(build()))

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    if (msg?.command === 'START' && PROFILE[msg.attack]) {
      reset(msg.attack)
      // push the first frame of the new session immediately so every
      // panel flips at the same moment rather than on the next tick
      broadcast(build())
    }
  })

  ws.on('close', () => console.log('[qds-mock] panel disconnected'))
})

function broadcast(frame) {
  const payload = JSON.stringify(frame)
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(payload)
  }
}

setInterval(() => {
  if (wss.clients.size > 0) broadcast(build())
}, INTERVAL)

console.log(`[qds-mock] coordinator listening on ws://0.0.0.0:${PORT}`)
console.log(`[qds-mock] open: http://<this-host>:3000/?role=attacker&ws=ws://<this-host>:${PORT}`)
