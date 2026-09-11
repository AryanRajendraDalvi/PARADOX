import re

with open('src/simulation/simulation.hpp', 'r', encoding='utf-8') as f:
    text = f.read()

# Add standard includes
if "<deque>" not in text:
    text = text.replace("#include <functional>", "#include <functional>\n#include <deque>\n#include <numeric>")

new_vars = """    uint32_t round_id_       = 0;
    int      mismatch_count_ = 0;
    int      signing_rounds_ = 0;
    
    // A2, A3, A5 trackers
    std::deque<double> recent_qbers_;
    std::deque<double> recent_mermins_;
    std::deque<bool> recent_fp_;
    std::deque<bool> recent_fn_;"""

text = text.replace("""    uint32_t round_id_       = 0;
    int      mismatch_count_ = 0;
    int      signing_rounds_ = 0;""", new_vars)

with open('src/simulation/simulation.hpp', 'w', encoding='utf-8') as f:
    f.write(text)