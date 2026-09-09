#include "noise_model.hpp"
#include "../core/pauli_ops.hpp"
#include <stdexcept>

NoiseModel::NoiseModel(const NoiseConfig& cfg) : cfg_(cfg) {
    if (cfg_.depolarizing_prob < 0.0 || cfg_.depolarizing_prob > 1.0)
        throw std::invalid_argument("depolarizing_prob must be in [0,1]");
    if (cfg_.detector_eta <= 0.0 || cfg_.detector_eta > 1.0)
        throw std::invalid_argument("detector_eta must be in (0,1]");
    if (cfg_.dark_count_prob < 0.0 || cfg_.dark_count_prob > 1.0)
        throw std::invalid_argument("dark_count_prob must be in [0,1]");
}

void NoiseModel::apply_depolarizing(Statevector& sv, int qubit, std::mt19937& rng) const {
    const double p = cfg_.depolarizing_prob;
    if (p <= 0.0) return;

    std::uniform_real_distribution<double> dist(0.0, 1.0);
    const double r = dist(rng);

    // Depolarizing channel: with prob p/4 each apply X, Y, Z; with prob 1−3p/4 apply I.
    if      (r < p / 4.0)         sv.apply_gate(Pauli::X, qubit);
    else if (r < p / 2.0)         sv.apply_gate(Pauli::Y, qubit);
    else if (r < 3.0 * p / 4.0)   sv.apply_gate(Pauli::Z, qubit);
    // else: identity — no-op
}

int NoiseModel::apply_detector_efficiency(int outcome, std::mt19937& rng) const {
    const double eta = cfg_.detector_eta;
    if (eta >= 1.0) return outcome;

    // With prob (1−η): no-click event; model as random outcome
    std::bernoulli_distribution missed(1.0 - eta);
    if (missed(rng)) {
        std::bernoulli_distribution random_bit(0.5);
        return random_bit(rng) ? 1 : 0;
    }
    return outcome;
}

int NoiseModel::apply_dark_count(int outcome, std::mt19937& rng) const {
    const double p = cfg_.dark_count_prob;
    if (p <= 0.0) return outcome;

    std::bernoulli_distribution dark(p);
    return dark(rng) ? (1 - outcome) : outcome;
}
