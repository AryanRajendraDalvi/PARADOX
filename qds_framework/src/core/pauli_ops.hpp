#pragma once
#include <complex>
#include <stdexcept>
#include <Eigen/Dense>

using cx = std::complex<double>;

// ─────────────────────────────────────────────────────────────────────────────
// Standard Pauli matrices and correction operators.
//
// Bell measurement correction table (derived from first principles):
//   Circuit: CNOT(ctrl=M=qubit0, tgt=A=qubit1), then H(qubit0)
//   Alice measures qubit0 → m1, qubit1 → m2, broadcasts (m1, m2).
//
//   (m1,m2) | BC state after collapse         | Bob gate | Charlie gate
//   (0,0)   | α|00>+β|11>  (= target, done)  | I        | I
//   (0,1)   | α|11>+β|00>                     | X        | X
//   (1,0)   | α|00>−β|11>                     | Z        | I
//   (1,1)   | α|11>−β|00>                     | ZX=iY    | X
//
//   Charlie applies X iff m2 == 1.
// ─────────────────────────────────────────────────────────────────────────────
namespace Pauli {

extern const Eigen::Matrix2cd I;
extern const Eigen::Matrix2cd X;
extern const Eigen::Matrix2cd Y;
extern const Eigen::Matrix2cd Z;
extern const Eigen::Matrix2cd H;  // Hadamard

// Sdg = S†  = [[1,0],[0,-i]]  — used for Y-basis measurement (Sdg then H, then measure Z)
extern const Eigen::Matrix2cd Sdg;

// Gate Bob applies to qubit B based on (m1, m2)
// (0,0)->I  (0,1)->X  (1,0)->Z  (1,1)->ZX (=iY up to global phase)
Eigen::Matrix2cd bob_correction(int m1, int m2, std::string* label_out = nullptr);

// Gate Charlie applies to qubit C based on m2
// m2=0 -> I,  m2=1 -> X
Eigen::Matrix2cd charlie_correction(int m2);

} // namespace Pauli
