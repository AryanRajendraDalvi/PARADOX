# Work Division Plan — 3-Person Build
### QDS Threat Detection Framework (SIH, Egreen Quanta)

---

## 0. Why this split works, and the one thing that makes it work

Yes, this splits cleanly into three tracks — **Core Pipeline**, **Attack Simulation**, **Frontend** — because they're naturally separated in the plan already (§6.1's module tree maps almost directly onto three people). But three people building in parallel only works if they're not all blocked waiting on each other's finished code. The fix is standard in team software projects: **Person 1 defines a data/event contract on Day 1**, before writing the full implementation, and Persons 2 and 3 build against that contract (with mocked/simulated data) from day one — then swap in the real pipeline at integration time. Without this, Person 2 and 3 sit idle until Person 1 finishes, which defeats the point of splitting the work.

**Integration owner: Person 1.** They wrote the pipeline the other two plug into, so they're best placed to merge Person 2's attack module into the real pipeline and wire Person 3's frontend to real (not mocked) data at the end.

---

## 1. The Shared Contract (build this first, together, before splitting off)

Before anyone starts their own track, agree on one JSON event shape emitted once per round — this is what makes the other two tracks buildable independently:

```json
{
  "round_id": 142,
  "batch_id": 17,
  "batch_type": "SIGNING" | "TEST",
  "phase": "ghz_distribution" | "signing" | "verification" | "mermin_test",
  "parties": {
    "alice":   { "measured": true, "basis": "bell", "outcome_bits": [1,0] },
    "bob":     { "measured": true, "basis": "Z", "correction_applied": "X", "outcome": 1 },
    "charlie": { "measured": true, "basis": "Z", "outcome": 1 }
  },
  "checks": {
    "decoy_qber": 0.021,
    "mismatch_rate": 0.024,
    "tau_hoeffding": 0.061,
    "tau_cefb": 0.089,
    "mermin_value": 3.92
  },
  "attack": { "active": true, "type": "intercept" | "entangle" | "replay" | "batchNoise" | "blind" | "none" },
  "verdict": "ACCEPT" | "REJECT",
  "status": "PROVISIONAL" | "CONFIRMED" | "DISPUTED",
  "event_flags": ["decoy_qber_exceeded", "replay_detected"]
}
```

Person 1 owns this schema and is the one person allowed to change its shape after the kickoff — if Persons 2 or 3 need a new field, they request it from Person 1 rather than each building their own version.

---

## 2. Person 1 — Core Pipeline (Integration Owner)

**Owns**: `/core`, `/protocol`, `/stats`, `/auth`, `/audit`, `/simulation/noise_model.hpp` (the honest-channel noise baseline, not attacks themselves), and the event contract in §1.

| Maps to plan §§ | Deliverable |
|---|---|
| §2.1–2.3, §2.5–2.7 | GHZ generation, teleportation signing, verification, resource pool + async status |
| §2.4 | Wegman-Carter authentication on classical channels |
| §3.1–3.2 | Decoy-state QBER, replay/phase guard |
| §4.1–4.3 | Hoeffding + CEFB thresholds, decision-rule dispatch |
| §9 | Merkle-anchored audit ledger |

**Week-1 priority (unblocks the other two)**: emit the §1 event contract from a minimal end-to-end honest-path run — doesn't need real crypto correctness yet, just the right shape flowing through, so Persons 2 and 3 have something real to build against immediately.

**Final task**: integrate Person 2's attack module (swap simulated attack injection into the real pipeline points) and Person 3's frontend (point it at the real event stream instead of mocked data).

---

## 3. Person 2 — Attack Simulation

**Owns**: `/simulation/attack_sim.hpp/.cpp`, and the "Attack Simulation Suite" from §5.

| Maps to plan §§ | Deliverable |
|---|---|
| §5 | All five attack scenarios: intercept-resend, entanglement manipulation, replay, batch-correlated noise, detector blinding |
| §5 (reporting) | Detection-rate, false-positive-rate, rounds-to-detection metrics per attack |

**How to work in parallel with Person 1**: don't wait for the real pipeline. Build each attack as a function that takes a state/round object matching §1's contract and *perturbs* it exactly the way the real attack would (e.g., `intercept()` spikes `checks.decoy_qber`) — this is precisely how the demo dashboard already models it. Validate each attack's *logic* against this mocked contract first.

**Integration point with Person 1**: once Person 1's real pipeline exists, attacks move from perturbing a mocked JSON object to actually perturbing the real statevector/channel at the injection points Person 1 exposes (e.g., a hook in `ghz_resource.hpp` to intercept a qubit before it reaches Bob). Person 2 should ask Person 1 early for exactly where these hooks will live, so the attack functions are written against real injection points from the start rather than needing a rewrite later.

**Secondary deliverable**: the log/event stream specifically describing *what the attack is doing*, separate from the pipeline's own verdict log — this feeds Person 3's "attacker panel" and "attack log panel" directly (see §4 below).

---

## 4. Person 3 — Frontend (5 views)

**Owns**: the full demo UI, built against §1's contract from day one (see the working `qds-dashboard.jsx` artifact already built as a starting reference for visual language and live-chart wiring).

| View | Shows | Data source |
|---|---|---|
| **Alice panel** | Message prep, Bell measurement outcome, transcript sent | `parties.alice` from §1 contract |
| **Bob panel** | Correction applied, reconstructed state, local checks (decoy QBER, replay guard) | `parties.bob` + `checks.decoy_qber` |
| **Charlie panel** | Independent measurement, correlation-check result, provisional/confirmed status | `parties.charlie` + `status` |
| **Attacker panel** | Attack selector (mirrors the six buttons in the existing dashboard demo), currently-active attack description | `attack` field + Person 2's attack descriptions |
| **Attack/event log panel** | Chronological feed of flagged events (decoy spikes, CEFB failures, replay hits, Mermin drops) with round numbers | `event_flags` + Person 2's attack-specific log stream |

**How to work in parallel**: build all five views against a **mock data generator** first — literally the random-walk simulation already written into the existing `qds-dashboard.jsx` artifact satisfies this purpose almost as-is. Once Person 1's real pipeline emits the real event stream (matching the same JSON shape), swap the mock generator for a real feed (WebSocket or polling) with minimal UI code changes, since the shape doesn't change.

**Final task**: connect to Person 1's real event stream instead of the mock generator, and wire the attack-panel buttons to actually trigger Person 2's real attack functions (via Person 1's pipeline) instead of the mock's local state changes.

---

## 5. Integration Timeline (suggested)

| Stage | What happens |
|---|---|
| Day 0 | All three agree on §1's contract together — non-negotiable, do this before splitting off |
| Week 1 | P1 emits contract-shaped events from a minimal honest-path pipeline. P2 and P3 start building against mocked/simulated data immediately — don't wait for P1 |
| Weeks 2–3 | P1 builds out real protocol logic + stats + audit. P2 finalizes all 5 attacks against the mock contract. P3 finalizes all 5 views against the mock contract |
| Week 4 | **Integration**: P1 wires P2's attacks into real pipeline injection points; P1 wires P3's frontend to the real event stream. Everyone debugs together against the real system, not mocks |
| Final days | End-to-end rehearsal: run all 5 attacks live through the real pipeline into the real frontend, exactly as it'll be demoed to judges |

---

## 6. What each person should NOT wait on

- **P2 should never block on P1's crypto being "correct"** — attack logic is validated against the *shape* of the data, not the correctness of the math underneath, until final integration.
- **P3 should never block on either P1 or P2** — the mock generator is a complete stand-in for both until Week 4.
- **P1 should not attempt to build the attacks or the frontend** — their job in Weeks 1–3 is entirely the pipeline plus keeping the §1 contract stable; scope creep into the other two tracks is the most common way this kind of split falls apart under deadline pressure.
