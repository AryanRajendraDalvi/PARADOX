#pragma once
#include <vector>
#include <complex>
#include <cassert>
#include <cmath>
#include <random>
#include <Eigen/Dense>

using cx = std::complex<double>;

// ─────────────────────────────────────────────────────────────────────────────
// Dense statevector over 2^n basis states.
//
// Qubit ordering: qubit 0 is the MSB (leftmost in ket |q0 q1 ... q{n-1}>).
// Basis state index i: bit (n-1-k) of i is the value of qubit k.
//
// Example (3 qubits):
//   |010>  →  index 2  (qubit0=0, qubit1=1, qubit2=0)
//   |111>  →  index 7
// ─────────────────────────────────────────────────────────────────────────────
class Statevector {
public:
    explicit Statevector(int n_qubits);               // initialises to |0...0>
    Statevector(int n_qubits, std::vector<cx> amps);  // from explicit amplitudes

    int n_qubits() const { return n_; }
    int dim()      const { return 1 << n_; }

    cx&       amp(int i)       { return data_[i]; }
    const cx& amp(int i) const { return data_[i]; }

    void reset();      // resets to |0...0>
    void normalize();  // L2-normalise in-place

    // Apply a single-qubit 2×2 unitary gate U to qubit k (0 = MSB)
    void apply_gate(const Eigen::Matrix2cd& U, int qubit);

    // Apply CNOT: control=ctrl_qubit, target=tgt_qubit (both 0-indexed from MSB)
    void apply_cnot(int ctrl_qubit, int tgt_qubit);

    // Measure qubit k in the Z-basis; collapses state in-place; returns 0 or 1
    int measure(int qubit, std::mt19937& rng);

    // Probability that qubit k has value v (0 or 1), without collapsing
    double prob(int qubit, int v) const;

    // Full probability vector of length dim()
    std::vector<double> probs() const;

    const std::vector<cx>& data() const { return data_; }
    std::vector<cx>&       data()       { return data_; }

private:
    int n_;
    std::vector<cx> data_;

    // Value of qubit k in basis-state index i  (0 = MSB)
    int bit(int i, int qubit) const { return (i >> (n_ - 1 - qubit)) & 1; }
    // Flip the bit for qubit k in basis-state index i
    int flip_bit(int i, int qubit) const { return i ^ (1 << (n_ - 1 - qubit)); }
};

// Tensor product: result has a.n_qubits()+b.n_qubits() qubits; a is the MSB block
Statevector tensor(const Statevector& a, const Statevector& b);
