#pragma once
#include <stdexcept>

// ─────────────────────────────────────────────────────────────────────────────
// §4.2  Correlated-Error Forgery Bound (CEFB)
//
// Uses the Azuma–Hoeffding inequality over a Doob martingale to account for
// intra-batch correlations of depth d (up to d consecutive rounds can be
// correlated within a single GHZ resource batch).
//
//   τ_CEFB = p0 + sqrt( 2d * ln(1/δ) / n )
//
// When d = 1, τ_CEFB = τ_Hoeffding (plain i.i.d. bound).
// This is the threshold used for the main signature mismatch-rate check (§2.3).
// ─────────────────────────────────────────────────────────────────────────────
namespace CEFB {

// p0    — baseline honest-channel mismatch rate
// n     — total number of signing rounds accumulated
// d     — batch correlation depth (resource batch size)
// delta — false-accept probability target
double threshold(double p0, int n, int d, double delta);

} // namespace CEFB
