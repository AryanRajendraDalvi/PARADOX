#include "statevector.hpp"
#include <stdexcept>
#include <numeric>

// ─── Constructors ─────────────────────────────────────────────────────────────

Statevector::Statevector(int n_qubits)
    : n_(n_qubits), data_(1 << n_qubits, cx{0.0, 0.0})
{
    assert(n_qubits >= 1 && n_qubits <= 20);
    data_[0] = cx{1.0, 0.0};  // |0...0>
}

Statevector::Statevector(int n_qubits, std::vector<cx> amps)
    : n_(n_qubits), data_(std::move(amps))
{
    assert((int)data_.size() == (1 << n_qubits));
}

// ─── State management ─────────────────────────────────────────────────────────

void Statevector::reset() {
    std::fill(data_.begin(), data_.end(), cx{0.0, 0.0});
    data_[0] = cx{1.0, 0.0};
}

void Statevector::normalize() {
    double norm_sq = 0.0;
    for (const auto& a : data_) norm_sq += std::norm(a);
    const double norm = std::sqrt(norm_sq);
    if (norm > 1e-15)
        for (auto& a : data_) a /= norm;
}

// ─── Gate application ─────────────────────────────────────────────────────────

void Statevector::apply_gate(const Eigen::Matrix2cd& U, int qubit) {
    // Iterate over all basis-state pairs (i, j) that differ only in bit `qubit`.
    // Process each pair exactly once by only handling i where bit(i, qubit) == 0.
    for (int i = 0; i < (1 << n_); ++i) {
        if (bit(i, qubit) != 0) continue;     // skip; will be handled when i is the '0' state
        const int j = flip_bit(i, qubit);      // the '1' state of this pair
        const cx a0 = data_[i];
        const cx a1 = data_[j];
        data_[i] = U(0, 0) * a0 + U(0, 1) * a1;
        data_[j] = U(1, 0) * a0 + U(1, 1) * a1;
    }
}

void Statevector::apply_cnot(int ctrl_qubit, int tgt_qubit) {
    // When ctrl qubit is 1, flip the target qubit.
    // Process each affected pair (i, j) once (i < j).
    for (int i = 0; i < (1 << n_); ++i) {
        if (bit(i, ctrl_qubit) == 1) {
            const int j = flip_bit(i, tgt_qubit);
            if (i < j) std::swap(data_[i], data_[j]);
        }
    }
}

// ─── Measurement ──────────────────────────────────────────────────────────────

int Statevector::measure(int qubit, std::mt19937& rng) {
    const double p0 = prob(qubit, 0);
    std::uniform_real_distribution<double> dist(0.0, 1.0);
    const int outcome = (dist(rng) < p0) ? 0 : 1;

    // Collapse: zero out states inconsistent with the outcome
    double norm_sq = 0.0;
    for (int i = 0; i < (1 << n_); ++i) {
        if (bit(i, qubit) != outcome) {
            data_[i] = cx{0.0, 0.0};
        } else {
            norm_sq += std::norm(data_[i]);
        }
    }
    // Re-normalise
    const double norm = std::sqrt(norm_sq);
    if (norm > 1e-15)
        for (auto& a : data_) a /= norm;

    return outcome;
}

// ─── Probability queries ──────────────────────────────────────────────────────

double Statevector::prob(int qubit, int v) const {
    double p = 0.0;
    for (int i = 0; i < (1 << n_); ++i)
        if (bit(i, qubit) == v) p += std::norm(data_[i]);
    return p;
}

std::vector<double> Statevector::probs() const {
    std::vector<double> ps(1 << n_);
    for (int i = 0; i < (1 << n_); ++i) ps[i] = std::norm(data_[i]);
    return ps;
}

// ─── Tensor product ───────────────────────────────────────────────────────────

Statevector tensor(const Statevector& a, const Statevector& b) {
    const int na = a.n_qubits(), nb = b.n_qubits();
    std::vector<cx> amps(1 << (na + nb));
    for (int ia = 0; ia < (1 << na); ++ia)
        for (int ib = 0; ib < (1 << nb); ++ib)
            amps[(ia << nb) | ib] = a.amp(ia) * b.amp(ib);
    return Statevector(na + nb, std::move(amps));
}
