import re

with open('src/stats/decision_engine.hpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('bool mac_verified    = true;', 'bool mac_verified    = true;\n    bool verifier_mac_verified = true;')

with open('src/stats/decision_engine.hpp', 'w', encoding='utf-8') as f:
    f.write(text)

with open('src/stats/decision_engine.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('if (!acc.mac_verified) {', 'if (!acc.mac_verified) {\n        res.event_flags.push_back("mac_verification_failure");\n        res.verdict = Verdict::REJECT;\n    }\n    if (!acc.verifier_mac_verified) {\n        res.event_flags.push_back("unauthorized_verifier_detected");\n        res.verdict = Verdict::REJECT;\n    }\n    if (false) {')

with open('src/stats/decision_engine.cpp', 'w', encoding='utf-8') as f:
    f.write(text)