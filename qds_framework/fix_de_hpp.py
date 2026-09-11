import re

with open('src/stats/decision_engine.hpp', 'r', encoding='utf-8') as f:
    text = f.read()

# Add composable_epsilon, fp_rate, fn_rate to RoundAccumulators
new_vars = """
    // "?"?"? Advanced Tracking (A1, A5) "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
    double composable_epsilon = 0.0;
    double fp_rate = 0.0;
    double fn_rate = 0.0;
};"""

text = text.replace("};", new_vars, 1)

with open('src/stats/decision_engine.hpp', 'w', encoding='utf-8') as f:
    f.write(text)