import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

// 1. Change simInterval to 35ms
const regexSim = /  \}, 900\);/g;
text = text.replace(regexSim, "  }, 35);");

let oldBlock = `        if (targetMsg) {
          const r = targetMsg.claimed_round;
          const isMacForge = r && r.event_flags && r.event_flags.includes('mac_verification_failure');
          const isBatchNoise = r && r.event_flags && r.event_flags.includes('cefb_bound_exceeded');
          const isNetworkReject = r && r.verdict === 'REJECT' && !isMacForge && !isBatchNoise;

          if (isBatchNoise) {`;

let newBlock = `        if (targetMsg) {
          const r = targetMsg.claimed_round;
          const isMacForge = r && r.event_flags && r.event_flags.includes('mac_verification_failure');
          
          const isBatchNoise = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('cefb_bound_exceeded'));
          const isBlind = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('hardware_integrity_failure'));
          const isNetworkReject = channelWindow.some(rw => rw.verdict === 'REJECT') && !isMacForge && !isBatchNoise && !isBlind;

          if (isBlind) {
             targetMsg.verification_failed = true;
             targetMsg.failure_type = 'instant';
             targetMsg.failure_reason = 'HARDWARE INTEGRITY FAILURE (MERMIN)';
          } else if (isBatchNoise) {`;

text = text.replace(oldBlock, newBlock);
fs.writeFileSync('server/index.js', text, 'utf8');