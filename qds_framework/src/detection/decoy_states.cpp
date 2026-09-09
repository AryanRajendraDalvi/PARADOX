#include "decoy_states.hpp"
#include <cmath>
#include <stdexcept>

static constexpr double SQRT1_2 = 0.7071067811865476;

DecoyInjector::DecoyInjector(double inject_prob)
    : inject_prob_(inject_prob)
{
    if (inject_prob <= 0.0 || inject_prob >= 1.0)
        throw std::invalid_argument("inject_prob must be in (0,1)");
}

bool DecoyInjector::should_inject(std::mt19937& rng) const {
    std::bernoulli_distribution dist(inject_prob_);
    return dist(rng);
}

std::pair<Statevector, DecoyState>
DecoyInjector::random_decoy(std::mt19937& rng) const {
    std::uniform_int_distribution<int> pick(0, 3);
    const int idx = pick(rng);
    const DecoyState state = static_cast<DecoyState>(idx);

    Statevector sv(1);
    switch (state) {
        case DecoyState::Z0:
            sv.amp(0) = cx(1.0, 0.0);
            sv.amp(1) = cx(0.0, 0.0);
            break;
        case DecoyState::Z1:
            sv.amp(0) = cx(0.0, 0.0);
            sv.amp(1) = cx(1.0, 0.0);
            break;
        case DecoyState::X0:  // |+> = (|0>+|1>)/√2
            sv.amp(0) = cx(SQRT1_2, 0.0);
            sv.amp(1) = cx(SQRT1_2, 0.0);
            break;
        case DecoyState::X1:  // |-> = (|0>-|1>)/√2
            sv.amp(0) = cx( SQRT1_2, 0.0);
            sv.amp(1) = cx(-SQRT1_2, 0.0);
            break;
    }
    return {sv, state};
}

void DecoyInjector::record_outcome(const DecoyOutcome& o) {
    outcomes_.push_back(o);
}

double DecoyInjector::compute_qber() const {
    int matched = 0, errors = 0;
    for (const auto& o : outcomes_) {
        const int state_idx = (int)o.sent;
        const int sent_basis = (state_idx < 2) ? 0 : 1;   // 0=Z, 1=X
        if (o.measured_basis != sent_basis) continue;      // basis mismatch — discard

        // Expected outcome: Z0→0, Z1→1, X0→0, X1→1
        const int expected = (state_idx % 2);
        ++matched;
        if (o.measured_outcome != expected) ++errors;
    }
    if (matched == 0) return 0.0;
    return (double)errors / matched;
}

int DecoyInjector::matched_basis_count() const {
    int matched = 0;
    for (const auto& o : outcomes_) {
        const int sent_basis = ((int)o.sent < 2) ? 0 : 1;
        if (o.measured_basis == sent_basis) ++matched;
    }
    return matched;
}

void DecoyInjector::reset() {
    outcomes_.clear();
}
