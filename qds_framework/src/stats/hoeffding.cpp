#include "hoeffding.hpp"
#include <cmath>
#include <stdexcept>

namespace Hoeffding {

double threshold(double p0, int n, double delta) {
    if (n <= 0)            throw std::invalid_argument("Hoeffding::threshold: n must be > 0");
    if (delta <= 0.0 || delta >= 1.0)
        throw std::invalid_argument("Hoeffding::threshold: delta must be in (0,1)");
    return p0 + std::sqrt(std::log(1.0 / delta) / (2.0 * n));
}

double mermin_threshold(int n_test, double delta) {
    if (n_test <= 0)        throw std::invalid_argument("Hoeffding::mermin_threshold: n_test must be > 0");
    if (delta <= 0.0 || delta >= 1.0)
        throw std::invalid_argument("Hoeffding::mermin_threshold: delta must be in (0,1)");
    return 2.0 + std::sqrt(2.0 * std::log(1.0 / delta) / n_test);
}

} // namespace Hoeffding
