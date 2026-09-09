#pragma once
#include <stdexcept>

// ─────────────────────────────────────────────────────────────────────────────
// §4.1  Hoeffding bound thresholds (i.i.d. rounds)
// ─────────────────────────────────────────────────────────────────────────────
namespace Hoeffding {

// Channel/decoy QBER threshold:
//   τ_H = p0 + sqrt( ln(1/δ) / (2n) )
// Used for decoy-state QBER detection (§3.1).
// Throws if n <= 0 or delta <= 0 or delta >= 1.
double threshold(double p0, int n, double delta);

// Mermin hardware self-test threshold:
//   2 + sqrt( 2 * ln(1/δ) / n_test )
// Accept hardware as trustworthy iff M_hat > mermin_threshold(n_test, delta).
double mermin_threshold(int n_test, double delta);

} // namespace Hoeffding
