import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Add to ATTACKS
text = text.replace("const ATTACKS = ['intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge'];", "const ATTACKS = ['intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge', 'impersonate', 'rogue_verifier'];")

text = text.replace("const isBlind = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('hardware_integrity_failure'));", "const isBlind = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('hardware_integrity_failure'));\n          const isRogueVerifier = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('unauthorized_verifier_detected'));")
text = text.replace("&& !isBatchNoise && !isBlind;", "&& !isBatchNoise && !isBlind && !isRogueVerifier;")

match = re.search(r'if \(isBlind\) \{', text)
if match:
    replacement = """if (isRogueVerifier) {
             targetMsg.verification_failed = true;
             targetMsg.failure_type = 'rogue-verifier';
             targetMsg.failure_reason = 'UNAUTHORIZED VERIFICATION ATTEMPT';
          } else if (isBlind) {"""
    text = text[:match.start()] + replacement + text[match.end():]

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)