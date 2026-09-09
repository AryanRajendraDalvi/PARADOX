#include "pauli_ops.hpp"
#include <cmath>

static constexpr double SQRT1_2 = 0.7071067811865476;

namespace Pauli {

// ─── Matrix definitions ───────────────────────────────────────────────────────

const Eigen::Matrix2cd I = (Eigen::Matrix2cd() <<
    cx(1,0), cx(0,0),
    cx(0,0), cx(1,0)).finished();

const Eigen::Matrix2cd X = (Eigen::Matrix2cd() <<
    cx(0,0), cx(1,0),
    cx(1,0), cx(0,0)).finished();

const Eigen::Matrix2cd Y = (Eigen::Matrix2cd() <<
    cx(0, 0), cx(0,-1),
    cx(0, 1), cx(0, 0)).finished();

const Eigen::Matrix2cd Z = (Eigen::Matrix2cd() <<
    cx(1, 0), cx( 0,0),
    cx(0, 0), cx(-1,0)).finished();

const Eigen::Matrix2cd H = (Eigen::Matrix2cd() <<
    cx(SQRT1_2, 0), cx( SQRT1_2, 0),
    cx(SQRT1_2, 0), cx(-SQRT1_2, 0)).finished();

// S† = [[1,0],[0,-i]]
const Eigen::Matrix2cd Sdg = (Eigen::Matrix2cd() <<
    cx(1, 0), cx(0, 0),
    cx(0, 0), cx(0,-1)).finished();

// ─── Correction operators ─────────────────────────────────────────────────────

Eigen::Matrix2cd bob_correction(int m1, int m2, std::string* label_out) {
    if (m1 == 0 && m2 == 0) {
        if (label_out) *label_out = "I";
        return I;
    } else if (m1 == 0 && m2 == 1) {
        if (label_out) *label_out = "X";
        return X;
    } else if (m1 == 1 && m2 == 0) {
        if (label_out) *label_out = "Z";
        return Z;
    } else if (m1 == 1 && m2 == 1) {
        if (label_out) *label_out = "Y";
        return Z * X;
    }
    throw std::invalid_argument("m1, m2 must each be 0 or 1");
}

Eigen::Matrix2cd charlie_correction(int m2) {
    return (m2 == 0) ? I : X;
}

} // namespace Pauli
