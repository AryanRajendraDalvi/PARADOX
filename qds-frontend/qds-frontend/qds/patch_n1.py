import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Add to ATTACKS
text = text.replace("const ATTACKS = ['intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge'];", "const ATTACKS = ['intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge', 'impersonate', 'rogue_verifier'];")

# Map unauthorized_verifier_detected
match_eval = re.search(r'// Check for Mermin hardware failure', text)
if match_eval:
    replacement = """const rogue_verifier = channelWindow.some(r => r.event_flags && r.event_flags.includes('unauthorized_verifier_detected'));

          if (rogue_verifier) {
            failure_type = 'rogue-verifier';
            failure_reason = 'UNAUTHORIZED VERIFICATION ATTEMPT';
          } else if (mac_failure) {
"""
    text = text[:match_eval.start()] + replacement + text[match_eval.end():].replace('if (mac_failure) {', '', 1)
else:
    print("Could not find Mermin hardware failure block")

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)