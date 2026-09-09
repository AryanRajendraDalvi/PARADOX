#include "cefb.hpp"
#include <cmath>
#include <stdexcept>

namespace CEFB {

double threshold(double p0, int n, int d, double delta) {
    if (n <= 0)
        throw std::invalid_argument("CEFB::threshold: n must be > 0");
    if (d <= 0)
        throw std::invalid_argument("CEFB::threshold: d must be > 0");
    if (delta <= 0.0 || delta >= 1.0)
        throw std::invalid_argument("CEFB::threshold: delta must be in (0,1)");
    // τ_CEFB = p0 + sqrt(2d * ln(1/δ) / n)
    return p0 + std::sqrt(2.0 * d * std::log(1.0 / delta) / n);
}

} // namespace CEFB
