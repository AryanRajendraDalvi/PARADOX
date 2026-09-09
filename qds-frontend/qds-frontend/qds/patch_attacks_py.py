import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Change simInterval
text = re.sub(r'\}, 900\);', r'}, 35);', text)

# 2. Fix UNLOCK_MESSAGE
match = re.search(r'          const r = targetMsg\.claimed_round;\s*const isMacForge = r && r\.event_flags && r\.event_flags\.includes\(\'mac_verification_failure\'\);\s*const isBatchNoise = r && r\.event_flags && r\.event_flags\.includes\(\'cefb_bound_exceeded\'\);\s*const isNetworkReject = r && r\.verdict === \'REJECT\' && !isMacForge && !isBatchNoise;\s*if \(isBatchNoise\) \{', text)
if match:
    replacement = """          const r = targetMsg.claimed_round;
          const isMacForge = r && r.event_flags && r.event_flags.includes('mac_verification_failure');
          
          // Statistical channel degradation (intercept, entangle, blind, batchNoise) 
          // can be caught by recent window, since they pop on interleaved TEST rounds.
          const isBatchNoise = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('cefb_bound_exceeded'));
          const isBlind = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('hardware_integrity_failure'));
          const isNetworkReject = channelWindow.some(rw => rw.verdict === 'REJECT') && !isMacForge && !isBatchNoise && !isBlind;

          if (isBlind) {
             targetMsg.verification_failed = true;
             targetMsg.failure_type = 'instant';
             targetMsg.failure_reason = 'HARDWARE INTEGRITY FAILURE (MERMIN)';
          } else if (isBatchNoise) {"""
    text = text[:match.start()] + replacement + text[match.end():]

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)