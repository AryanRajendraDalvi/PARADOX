import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

// 1. Change simInterval to 35ms
const regexSim = /  \}, 900\);/g;
text = text.replace(regexSim, "  }, 35);");

// 2. Fix UNLOCK_MESSAGE to check channelWindow for all statistical attacks
const regexUnlock = /          const r = targetMsg\.claimed_round;\r?\n          const isMacForge = r && r\.event_flags && r\.event_flags\.includes\('mac_verification_failure'\);\r?\n          const isBatchNoise = r && r\.event_flags && r\.event_flags\.includes\('cefb_bound_exceeded'\);\r?\n          const isNetworkReject = r && r\.verdict === 'REJECT' && !isMacForge && !isBatchNoise;\r?\n\r?\n          if \(isBatchNoise\) \{/g;
const replaceUnlock = `          const r = targetMsg.claimed_round;
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
          } else if (isBatchNoise) {`;

text = text.replace(regexUnlock, replaceUnlock);
fs.writeFileSync('server/index.js', text, 'utf8');