#pragma once
#include "statevector.hpp"
#include <functional>
#include <cstdint>
#include <tuple>
#include <random>

// ─────────────────────────────────────────────────────────────────────────────
// QubitTransitHook — injected before a qubit share reaches its party.
// Default = identity (no perturbation). Person 2's attacks register here.
// Args: (Statevector 1-qubit snapshot, party_index: 0=Alice,1=Bob,2=Charlie)
// ─────────────────────────────────────────────────────────────────────────────
using QubitTransitHook = std::function<Statevector(Statevector, int)>;

// ─────────────────────────────────────────────────────────────────────────────
// GHZShares — output of GHZBatch::generate_shares()
// ─────────────────────────────────────────────────────────────────────────────
struct GHZShares {
    Statevector joint;         // Full 3-qubit GHZ state (q0=Alice, q1=Bob, q2=Charlie)
    Statevector alice_view;    // 1-qubit post-hook snapshot (attack tracking only)
    Statevector bob_view;
    Statevector charlie_view;
};

// ─────────────────────────────────────────────────────────────────────────────
// GHZBatch — abstract base; purpose is fixed at creation, never reassignable.
// ─────────────────────────────────────────────────────────────────────────────
struct GHZBatch {
    uint32_t        batch_id;
    int             depth;        // correlation depth d (§4.2)
    QubitTransitHook transit_hook;

    GHZBatch(uint32_t id, int d)
        : batch_id(id), depth(d),
          transit_hook([](Statevector sv, int) { return sv; }) {}

    virtual ~GHZBatch() = default;

    // Generate a fresh GHZ resource set.
    // Returns the full joint 3-qubit GHZ state + 1-qubit hook views per party.
    GHZShares generate_shares() const;

    // Generate just the full joint 3-qubit GHZ state (used by Mermin test).
    Statevector generate_joint() const;
};

// ─────────────────────────────────────────────────────────────────────────────
// SigningBatch — message-carrying; ONLY passed to Z-basis verification.
// TestBatch   — Mermin test only; ONLY passed to X/Y-basis Mermin functions.
// Type mismatch between these two is enforced at compile time.
// ─────────────────────────────────────────────────────────────────────────────
struct SigningBatch : GHZBatch { using GHZBatch::GHZBatch; };
struct TestBatch   : GHZBatch { using GHZBatch::GHZBatch; };
