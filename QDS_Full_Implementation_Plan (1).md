# Quantum-Inspired Cyber Threat Detection for Digital Signature Security
### Complete Implementation Plan — Teleportation-Based QDS (SIH, Egreen Quanta)

---

## 1. Overview & Scope

The framework provides threat detection for a teleportation-based Quantum Digital Signature (QDS) protocol, using only quantum-mechanical principles and statistical analysis — no AI/ML anywhere in the pipeline.

**Trust model.** Two layers of untrusted adversary are covered:
1. **Channel-level** — an attacker interfering with qubits in transit (interception, entanglement manipulation, replay). This is what the problem statement explicitly asks for.
2. **Hardware-level** — an attacker compromising measurement devices themselves (detector blinding/control attacks). Not requested by the problem statement, but included as a scoped extension (USP) — this is the class of attack that has actually broken real QKD systems in practice.

Everything below is designed to be directly implementable; each subsection maps to a concrete module in §6.

---

## 2. Protocol Design

### 2.1 GHZ Resource Distribution

A 3-party GHZ state is generated per signing round:
$$|GHZ\rangle = \frac{1}{\sqrt2}\left(|000\rangle + |111\rangle\right)$$

One qubit is distributed to each of: **Signer (Alice)**, **Receiver (Bob)**, **Arbiter/Verifier (Charlie)**. No single party's qubit carries information alone — the signature lives in the correlations across all three shares. This is what gives the "arbitrated" property: unilateral forgery would require fabricating a share consistent with the *other two* parties' independently-held shares.

### 2.2 Teleportation-Based Signing

1. Alice holds message qubit \(|\psi\rangle\) and her GHZ share.
2. Alice performs a joint Bell-basis measurement on \(|\psi\rangle\) + her share → 2 classical bits \((m_1, m_2)\).
3. Alice broadcasts \((m_1, m_2)\) over an authenticated classical channel.
4. Bob applies Pauli correction \(P \in \{I, X, Y, Z\}\) to his GHZ share, determined by \((m_1, m_2)\), reconstructing the signed state on his share. **⚠ Needs verification** (see §2.5): working the logical-qubit derivation through symbolically suggests the correction may need to act jointly on Bob's *and* Charlie's shares to stay within the correlated subspace the verification check relies on, not on Bob's share alone as stated here. Confirm via direct symbolic/simulation check before treating this step as final — do not silently change it without that check.

### 2.3 Verification Protocol

1. Charlie measures his GHZ share in a Pauli basis matching the expected public-key state.
2. Verification checks two things simultaneously:
   - **Correlation consistency**: Bob's and Charlie's outcomes must satisfy the algebraic relationship the GHZ state guarantees (see §3.3's Mermin correlations for the underlying math).
   - **Statistical threshold**: the accumulated mismatch rate over \(n\) rounds must fall under the CEFB threshold (§4.2).
3. Accept iff both checks pass.

### 2.4 Classical Channel Authentication

**Why this section exists.** Teleportation's security guarantee (no-cloning, measurement disturbance) covers the *quantum* channel used in §2.1's GHZ distribution only. It says nothing about the classical channels the protocol also depends on. There are three of them, and all three carry the same requirement:

| Channel | Carries | Risk if unauthenticated |
|---|---|---|
| Alice → Bob | 2-bit correction transcript (§2.2) | Attacker flips a bit → Bob applies the wrong Pauli correction, corrupting the signature silently |
| Alice → Charlie (or broadcast to both) | Same transcript, needed so Charlie knows what correlation to expect | Attacker substitutes a transcript consistent with a forged signature |
| Bob ↔ Charlie | Comparison of their measurement outcomes for the correlation check (§2.3) | Attacker alters a result in transit to force a false ACCEPT |

**These channels must be authenticated, not secret.** An eavesdropper reading any of them learns nothing useful on its own — the 2-bit transcript is provably independent of message content (a standard property of the Bell-measurement step in teleportation), and the accept/reject verdict is going to be announced publicly regardless. The actual risk is *tampering in transit*, not *reading* — so the requirement is integrity/authentication, not confidentiality.

**Mechanism: Wegman-Carter authentication.** Each classical message is tagged with a MAC built from universal hashing plus a short shared key. Its security is information-theoretic — no algebraic structure exists for Shor's algorithm, or any algorithm, to exploit — so it doesn't reintroduce the computational-hardness weakness the problem statement is designed to avoid. This is not a compromise specific to this design: every published QKD/QDS protocol (including BB84 itself) assumes an authenticated classical channel as a baseline axiom, not an add-on.

**Key bootstrap.** Wegman-Carter needs a short pre-shared key to start. Rather than a permanent classical dependency, a portion of each round's freshly-generated quantum key material is reserved to refresh the authentication key for the *next* round — so the scheme is self-sustaining after a one-time initial setup, not a recurring classical trust assumption.

**Open item — flag, don't assume closed.** The transcript's independence from message content is a property of *standard* teleportation. Whether the Bob↔Charlie *verification-check* bits (not the correction transcript itself) are similarly independent of message content depends on exactly how the message is bound into the GHZ correlation structure in your specific verification design (§2.3) — this needs an explicit derivation before you can claim it, not an assumption carried over from the standard protocol. Treat this as a proof obligation for the security analysis report (§7), not settled math. **Resolved for the Z-basis case — see §2.5.**

### 2.5 Content-Independence of the Verification Check (closes §2.4's open item, partially)

**Setup.** Relabel the joint (Bob, Charlie) pair as a single logical qubit: \(|0_L\rangle := |00\rangle_{BC}\), \(|1_L\rangle := |11\rangle_{BC}\). The GHZ state is then algebraically identical to a standard Bell pair between Alice and this logical qubit, so ordinary teleportation math applies with no new assumptions. After Alice's Bell measurement and Bob's correction, the corrected joint state becomes:
$$
\chi_{BC} = \alpha|00\rangle_{BC} + \beta|11\rangle_{BC}
$$
where \(\alpha,\beta\) are the original message amplitudes — now living in the *correlation* between Bob's and Charlie's qubits rather than in either share alone.

**Z-basis verification (the main check used in §2.3, feeding CEFB in §4.2) — content-independent.** If Bob and Charlie both measure in the computational (Z) basis, \(\chi_{BC}\) guarantees a **match (00 or 11) with probability 1, for every possible \(\alpha,\beta\)**, under honest execution. The individual bit value depends on the message; the match/mismatch pattern — the only thing the mismatch-rate statistic actually uses — does not. Any observed mismatch can only be attributed to external disturbance, never to message content. **This closes the open item for the protocol's primary verification statistic.**

**X-basis correlation checks — do leak message content, and must stay isolated.** If Bob and Charlie measure in the X basis instead (relevant to the Mermin self-test, §3.3), the match/mismatch probabilities become \(|\alpha+\beta|^2/2\) vs. \(|\alpha-\beta|^2/2\) — which depend on \(\alpha,\beta\). This means the Mermin self-test's use of **separate, dedicated GHZ batches rather than message-carrying ones** (as already specified in §3.3) is not just a convenient design choice — it is a **required security constraint**. Running an X-basis correlation check on a message-carrying resource would leak information about the signed content and must never happen.

**Status.** Z-basis verification content-independence: derived and closed. X-basis isolation requirement: derived and now stated as a hard constraint rather than an implicit assumption. The §2.2 correction-step detail flagged above should be confirmed before this section is treated as fully final, since it touches the same joint-subspace structure this derivation relies on.

### 2.6 Enforcing the X-Basis Isolation Constraint

The prohibition from §2.5 is scoped precisely: no X/Y-basis correlation-check measurement (Bob↔Charlie) on a batch carrying a signed message. It does not restrict Alice's Bell-basis measurement in §2.2, which is a separate, required step.

Enforcement, layered:
1. **Purpose fixed at batch creation**, before any message is bound in — never reassignable afterward (§6.2's `GHZBatch` subtypes).
2. **Type-level enforcement**: `SigningBatch` and `TestBatch` are distinct types (not a flag on one struct), so the verifier's Z-basis function only compiles against `SigningBatch&` and the Mermin function only against `TestBatch&`. Wrong-basis-on-wrong-batch becomes a compile error.
3. **Runtime assertion as defense in depth**: the verifier aborts if an X/Y setting is ever requested against a `SigningBatch`, independent of the type-system guarantee.
4. **Audit logging**: batch purpose and measurement basis used are recorded per round in the §9 audit layer, making any violation forensically visible after the fact.

### 2.7 Asynchronous Verification & Charlie Availability

**The problem.** As designed so far, §2.3's verification requires Charlie online in real time — if only Alice and Bob are online when a message is signed, Bob has to block waiting for Charlie. That's an availability failure, not a security one, but it needs an explicit fix rather than being left implicit.

**Fix: decouple entanglement generation from signing time.**

1. **Pre-distributed resource pool.** During windows when all three parties are online together, generate and bank a pool of GHZ batches in advance — each party stores their own share locally, the same way QKD systems bank key material ahead of use rather than generating it fresh per message.
2. **Signing needs only Alice and Bob.** At signing time, Alice draws a batch from the pool; Bob applies his correction and runs the checks that don't need Charlie — decoy QBER (§3.1) and the replay/phase guard (§3.2).
3. **Charlie's correlation check becomes deferred and asynchronous**, run against the batch-committed transcript (already anchored via §9) whenever Charlie is next online, producing a follow-up ledger entry that confirms the signature or raises a dispute.

**Status field — explicit, not implicit.** Every `VerificationRecord` (§9.2) carries a `status` of `PROVISIONAL` (Alice/Bob checks passed, Charlie's check pending) or `CONFIRMED` (Charlie's async check completed and passed) — or `DISPUTED` if Charlie's check later fails. This makes the real security state visible at every point rather than presenting a provisional accept as equivalent to a fully confirmed one.

**Stated trade-off.** Between signing and Charlie's confirmation, the message has channel-level guarantees (no interception, no replay) but not yet the full three-party forgery guarantee — that only finalizes on `CONFIRMED`. This is a real, bounded weakening of the security window for the sake of availability, not a free fix, and should be stated plainly rather than presented as if nothing were given up.

**Auto-fallback when Charlie is offline for an extended period.** Define a pool-depletion / staleness threshold — e.g. either the pre-distributed pool drops below a minimum reserve, or the oldest un-confirmed `PROVISIONAL` record exceeds a maximum pending time. On crossing either threshold:
- New signings continue to be accepted and marked `PROVISIONAL` (service doesn't halt), but
- The system surfaces a visible degraded-mode flag (e.g. `VERIFICATION_BACKLOG`) at the application layer, and
- Once Charlie reconnects, confirmations are processed in a batch sweep against the ledger's backlog of `PROVISIONAL` records, oldest first, before accepting new async checks.

This is a stated, operator-visible policy — auto-fallback to provisional-only mode rather than blocking signings — not a silent degradation. The alternative (blocking new signings until Charlie returns) is also defensible and should be a configuration choice, not a hardcoded one, since different deployments may prefer availability over confirmation latency or vice versa.

---

## 3. Threat Detection Layer

### 3.1 Channel Manipulation Detection (Decoy States)

Non-orthogonal decoy states are randomly interleaved into the teleportation channel (BB84-style — signer randomly substitutes a decoy qubit for the real signature qubit on a random subset of rounds, unknown to receiver until basis reconciliation). Any interception/cloning attempt disturbs decoys due to the no-cloning theorem, raising the decoy-subset QBER above the honest-channel baseline \(p_0\).

**Detection rule**: flag channel manipulation if decoy-subset QBER exceeds a Hoeffding-bound threshold (§4.1) around \(p_0\).

### 3.2 Replay & Impersonation Defense

Each round consumes a **freshly generated** GHZ resource — resources are never reused. Phase-matching is enforced between the classical correction transcript and the current round's resource state. A replayed transcript from an earlier round will not match the current round's phase reference and fails verification deterministically (not statistically — this is a hard fail, not a threshold check).

### 3.3 Hardware Trust Boundary (Detector-Integrity Monitor)

**Motivation**: The problem statement assumes trusted hardware; real-world QKD/QDS attacks (e.g. detector-blinding/faked-state attacks demonstrated against commercial systems) target this exact assumption. This section extends the trust boundary to cover it.

**Mechanism — Mermin-GHZ self-test.** On a randomly sampled subset of rounds (separate from decoy rounds), instead of the signing protocol, run a **Mermin correlation test** — the natural 3-party generalization of a Bell/CHSH test for GHZ states. Each party randomly measures in the X or Y Pauli basis according to one of four fixed setting combinations, each producing a ±1-valued outcome product:

$$
\langle XYY\rangle,\ \langle YXY\rangle,\ \langle YYX\rangle,\ \langle XXX\rangle
$$

For an **ideal, untampered** GHZ state, quantum mechanics predicts a deterministic algebraic relationship (the "GHZ paradox"):
$$
\langle XYY\rangle = \langle YXY\rangle = \langle YYX\rangle = +1, \qquad \langle XXX\rangle = -1
$$
giving the Mermin value
$$
M = \langle XYY\rangle + \langle YXY\rangle + \langle YYX\rangle - \langle XXX\rangle = 4 \quad \text{(maximal)}.
$$

Any **local hidden-variable model** — which is exactly what a blinded/classically-controlled detector effectively becomes, since a controlled detector just outputs a predetermined classical response — is bounded by \(|M| \le 2\). This is a strictly larger gap than a CHSH-style statistical bound (Tsirelson bound \(2\sqrt2\) vs. classical 2): the GHZ test gives an all-or-nothing violation, making tampering easier to catch with fewer test rounds.

**Statistical confidence bound.** Each Mermin test round independently consumes a fresh GHZ resource (unlike the main signing protocol, so plain i.i.d. Hoeffding is valid here — no correlation-depth correction needed). Over \(n_{\text{test}}\) sampled rounds, estimate \(\hat M\) as the sample mean of the per-round ±1 products (with sign flip on the \(XXX\) setting), and accept the hardware as trustworthy iff:

$$
\boxed{\hat M \;>\; 2 + \sqrt{\frac{2}{n_{\text{test}}}\ln(1/\delta)}}
$$

for target false-accept probability \(\delta\). If \(\hat M\) falls at or below this margin above the classical bound of 2, flag a **hardware-integrity failure** (possible detector blinding, device substitution, or malfunction) — independent of, and in addition to, the channel-level checks in §3.1–3.2.

---

## 4. Statistical Verification Engine

### 4.1 Baseline Hoeffding Bound (decoy-state / channel checks — i.i.d. rounds)

$$
\tau_{\text{Hoeffding}} = p_0 + \sqrt{\frac{1}{2n}\ln(1/\delta)}
$$

Used for §3.1 (decoy QBER) and §3.3 (Mermin self-test), where rounds are independent by construction.

### 4.2 Correlated-Error Forgery Bound (CEFB — main signature verification)

Because the main protocol draws \(n\) verification rounds from GHZ resource **batches** of size \(d\) (correlation depth — a single noise/collapse event can affect up to \(d\) consecutive rounds sharing a batch before refresh), a plain i.i.d. Hoeffding bound understates risk. Using a Doob martingale over the filtration of sequential measurement outcomes and the Azuma–Hoeffding inequality:

$$
\boxed{\tau_{\text{CEFB}} = p_0 + \sqrt{\frac{2d}{n}\ln(1/\delta)}}
$$

**Note on \(d=1\)**: CEFB does *not* algebraically reduce to \(\tau_{\text{Hoeffding}}\) at \(d=1\) — the margin term is a constant factor of exactly 2 wider (verified: \(\sqrt{2/n} \big/ \sqrt{1/(2n)} = 2\)). This is still a valid statistical bound — CEFB is intentionally conservative even in the uncorrelated case, since it's derived from a more general martingale argument rather than the tighter i.i.d.-specific Hoeffding derivation. The qualitative property that matters for detection — \(\tau_{\text{CEFB}} \ge \tau_{\text{Hoeffding}}\) always, with the gap widening as \(d\) grows — holds throughout, including at \(d=1\). An earlier version of this document incorrectly claimed exact equality at \(d=1\); that claim is corrected here. This is the threshold used in §2.3's verification step.

### 4.3 Decision Rules Summary

| Check | Rounds | Bound used | Failure meaning |
|---|---|---|---|
| Decoy QBER | i.i.d. | Hoeffding (§4.1) | Channel interception/manipulation |
| Signature mismatch rate | Correlated (batch \(d\)) | CEFB (§4.2) | Forgery/impersonation |
| Mermin value \(\hat M\) | i.i.d. | §3.3 bound | Hardware/detector compromise |
| Correction transcript reuse | — | Deterministic phase check | Replay attack |

---

## 5. Attack Simulation Suite

Simulate each attack independently to validate detection:
- **Intercept-resend**: attacker measures and retransmits a qubit — should spike decoy QBER.
- **Entanglement manipulation**: attacker entangles an ancilla with the channel qubit — should spike decoy QBER and degrade Mermin \(\hat M\).
- **Replay**: reuse a prior round's transcript against a fresh GHZ batch — should hard-fail phase matching.
- **Batch-correlated noise injection**: inject correlated noise across a full resource batch — validates that CEFB catches what plain Hoeffding misses (this is the key comparison plot for your security analysis report).
- **Detector blinding**: force one party's detector into a deterministic classical response — should collapse Mermin \(\hat M\) toward ≤2.

For each, report: detection rate, false-positive rate on honest runs, and rounds-to-detection.

---

## 6. Software Architecture (for implementation)

### 6.1 Suggested module breakdown (C++)

```
/src
  /core
    statevector.hpp/.cpp      // statevector representation, tensor product, partial trace
    pauli_ops.hpp/.cpp        // Pauli matrix definitions, correction operator application
    ghz_resource.hpp/.cpp     // GHZ state generation, batching (tracks batch id -> depth d)
    resource_pool.hpp/.cpp    // §2.7 pre-distributed batch pool, reserve tracking, staleness/backlog check
  /protocol
    signer.hpp/.cpp           // Bell-basis measurement, transcript generation
    receiver.hpp/.cpp         // Pauli correction application
    verifier.hpp/.cpp         // Pauli-basis measurement, correlation check
  /detection
    decoy_states.hpp/.cpp     // decoy injection + QBER computation
    replay_guard.hpp/.cpp     // transcript/phase tracking, hard-fail check
    mermin_test.hpp/.cpp      // XYY/YXY/YYX/XXX sampling, M-hat computation
  /stats
    hoeffding.hpp/.cpp        // §4.1 threshold
    cefb.hpp/.cpp             // §4.2 threshold (takes batch depth d as parameter)
  /auth
    wegman_carter.hpp/.cpp    // §2.4 universal-hash MAC, key refresh from quantum key material
  /simulation
    attack_sim.hpp/.cpp       // §5 attack injection harness
    noise_model.hpp/.cpp      // depolarizing channel, detector efficiency/dark counts
  /report
    metrics.hpp/.cpp          // detection rate, false-positive rate, ROC-style output
main.cpp
```

### 6.2 Core data structures

- `Statevector`: complex amplitude vector over \(2^k\) basis states for a \(k\)-qubit register; supports tensor product, single/multi-qubit gate application, and projective measurement with collapse.
- `GHZBatch`: **abstract base — never instantiated directly.** Holds batch id and correlation depth \(d\). Purpose is fixed at creation and enforced via two concrete subtypes, never a mutable flag:
  - `SigningBatch : GHZBatch` — message-carrying; only accepted by Z-basis correlation-check functions.
  - `TestBatch : GHZBatch` — Mermin self-test only; only accepted by X/Y-basis Mermin functions.
  This makes "X-basis measurement on a signing batch" a compile-time type error, not a runtime bug (§2.5 enforcement).
- `Transcript`: signer's classical correction bits + round id + batch id, used by both `receiver` (for correction) and `replay_guard` (for reuse detection).
- `MerminSample`: setting combination used (one of 4), per-party outcome, computed ±1 product.

### 6.3 Simulation flow (per round)

1. `ghz_resource` draws a share triple from the current batch (or starts a new batch every \(d\) rounds).
2. Randomly route the round to: signing (§2.2–2.3), decoy test (§3.1), or Mermin test (§3.3) — sampling probabilities are a tunable parameter.
3. Run the appropriate protocol path; optionally inject an attack via `attack_sim` before measurement.
4. Record outcome into the relevant accumulator (`decoy QBER`, `mismatch count`, `Mermin samples`).
5. After \(n\) rounds, compute thresholds (§4.1–4.3) and emit accept/reject + which check (if any) failed.

### 6.4 Suggested tech stack

- **Eigen** (header-only C++ linear algebra) for statevector/matrix operations — avoids hand-rolling tensor products for small qubit counts (this protocol only ever needs 3–4 qubit registers at a time, so a dense statevector simulator is more than sufficient; no need for a full quantum-circuit framework).
- Plain C++17/20, no external quantum SDK required — keeps the "native C++, low computational complexity" claim honest and easy to defend.
- A thin CLI or JSON-config driver (`main.cpp`) to set \(n\), \(d\), \(\delta\), noise parameters, and which attack (if any) to simulate — makes the Attack Simulation Suite (§5) reproducible and demo-ready.

---

## 7. Delivery Table

| Deliverable | Description | Key Technologies / Methods |
|---|---|---|
| C++ Quantum Simulation Engine | Statevector simulator for GHZ generation, teleportation, and measurement. | Native C++, Eigen, Statevector Simulation |
| Threat Detection Module | Decoy QBER, replay/phase guard, Mermin hardware self-test. | Decoy-State Protocols, Pauli Projections, Mermin-GHZ Test |
| Statistical Verification Engine | Hoeffding + CEFB thresholds, decision-rule dispatch. | Hoeffding & Azuma–Hoeffding Bounds |
| Attack Simulation Suite | Five attack scenarios (§5) with detection-rate reporting. | Noise Modeling, Detector-Efficiency Modeling |
| Security Analysis Report | CEFB vs. plain Hoeffding comparison; Mermin hardware-trust results. | Martingale Concentration Inequalities |
| Distributed Audit Layer *(optional)* | Tamper-evident ledger anchoring verdict history and replay-guard state. | Merkle Trees, Permissioned Blockchain |

---

## 8. What's standard vs. what's novel (for your presentation)

- **Standard, established primitives** (don't overclaim novelty here): teleportation-based signing, GHZ arbitration structure, decoy-state detection, baseline Hoeffding bound.
- **Genuinely novel contributions** (safe to present as your USPs):
  1. **CEFB (§4.2)** — corrected statistical threshold accounting for the GHZ protocol's own batch-correlation structure, which plain Hoeffding misses.
  2. **Hardware trust-boundary extension (§3.3)** — extending detection beyond the channel (as the problem statement asks) to detector-level compromise, using a Mermin-GHZ self-test not requested by the problem statement.
- **Framing to use with judges**: present both as *closing specific, identifiable gaps* in the naive approach, with the math to back each claim — not as "we invented a new secure protocol."

### 8.1 Three tiers of claim — keep these separate when presenting

It's tempting to let "novel" cover the whole project uniformly. Don't — the tiers below carry very different weight, and blurring them into one claim is a common way to lose credibility with judges who probe on any one of them.

| Tier | What it is | Examples here | How to phrase it |
|---|---|---|---|
| **1. Algorithmic/theoretical novelty** | A new primitive, proof, or statistic that didn't exist before. | CEFB (§4.2), Mermin-GHZ hardware self-test (§3.3) | "We derived/adapted a new bound that addresses a specific gap in the standard approach, with the math shown." |
| **2. Application/integration novelty** | An existing combination of established techniques, assembled for a problem domain it hasn't (to your knowledge) been assembled for before. | The full pipeline: teleportation-based signing + GHZ arbitration + decoy states + hardware self-test, bundled specifically for QDS threat detection | "To our knowledge, this is the first framework to combine these mechanisms specifically for teleportation-based QDS threat detection." Modest, defensible — but this is *engineering/systems merit*, not a research contribution, and should be presented as such. |
| **3. Established/standard** | Well-known primitives used as-is. | Teleportation-based signing, GHZ states, decoy-state detection, baseline Hoeffding bound | Present as sound engineering choices — cite the source technique, don't claim credit for inventing it. |

**Presentation rule of thumb**: lead with Tier 1 when asked "what's novel here" — it's the part that survives direct technical questioning. Mention Tier 2 only as a secondary point, clearly labeled as integration/systems value rather than a research claim. Never let Tier 3 techniques get described in language that implies Tier 1 or 2 novelty.

---

## 9. Distributed Audit Layer (Optional Module — Blockchain/Cybersecurity theme fit)

**Scope boundary — read this first.** This module secures the *classical control plane* (verdict logs, replay-guard state) — it does **not** contribute to, replace, or strengthen the quantum-layer security proof in §2–§4. That security is already complete on its own, from physical principles (no-cloning, measurement disturbance). Framing blockchain as adding "quantum-safe security" would be a category error and should be avoided in presentation; framing it as securing *accountability and tamper-evidence of the classical bookkeeping around the quantum protocol* is accurate and defensible.

### 9.1 The gap this closes

Two pieces of classical state currently exist only in local process memory/storage, with no protection against an attacker who compromises the host itself:
- **Verdict history** — the accept/reject decision and reasoning for every round (§2.3, §4.3). If an operator or attacker with host access can quietly edit this after the fact, your security analysis and audit trail are not trustworthy even if the underlying quantum-layer detection worked correctly.
- **Replay-guard state** (§3.2) — the record of consumed transcripts. If this state can be wiped or rolled back locally, a replay attack could succeed against a "freshly reset" verifier, since there'd be no consumed-transcript record left to check against.

### 9.2 Design — anchor hashes, not raw data

To keep the "low computational complexity" claim intact, the ledger is used for **integrity anchoring**, not as a data store — this is the standard pattern (commit a hash, keep full data off-chain), not a call to put per-round quantum data on-chain.

1. **VerificationRecord** per round: `{round_id, batch_id, timestamp, mismatch_rate, threshold_used, mermin_value (if tested), verdict, status (PROVISIONAL | CONFIRMED | DISPUTED, §2.7), event_flags}`.
2. Each record is serialized canonically and hashed (SHA-256) as a Merkle leaf.
3. Records are batched — naturally aligned with the existing GHZ batch size \(d\) from §4.2, so one Merkle root is committed per resource batch rather than per round.
4. Only the **Merkle root** (32 bytes) is committed to the ledger per batch; full records stay in local/off-chain storage, retrievable and verifiable against the committed root via a standard Merkle inclusion proof.
5. **Consumed-transcript hashes** (replay guard) are included as leaves in the same batch tree. A round's transcript is checked against both the local `replay_guard` map *and* a Merkle-proof lookup against the last committed root — so erasing local state alone is no longer sufficient to enable a replay; the attacker would need to compromise ledger consensus too.

### 9.3 Ledger choice

A **permissioned** ledger (e.g. Hyperledger Fabric) fits this deployment better than a public chain: your architecture already has a designated arbiter/verifier role (Charlie, §2.1), consensus doesn't need proof-of-work or public validators, and commit latency needs to stay low relative to round throughput. This is a suggested default, not a hard requirement — swap for any permissioned ledger your team is already comfortable building against.

### 9.4 Module addition to §6.1

```
  /audit
    merkle_tree.hpp/.cpp      // batch leaf hashing, root computation, inclusion proofs
    ledger_client.hpp/.cpp    // commits batch roots to the permissioned ledger
    verification_record.hpp   // canonical VerificationRecord serialization
```

### 9.5 How to present this

State plainly in the demo/report: "the quantum-layer protocol is secure on its own; this module adds tamper-evidence and non-repudiation to the classical audit trail around it, and hardens the replay guard against local-state tampering." That's a real, scoped contribution that answers the blockchain-theme question without overstating what blockchain is doing.
