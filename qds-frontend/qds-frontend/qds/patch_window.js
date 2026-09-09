import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

// 1. Add channelWindow
const varMatch = "let latestRoundData = null;";
text = text.replace(varMatch, "let latestRoundData = null;\nlet channelWindow = [];");

const intervalMatch = "latestRoundData = full;\r\n      latestRoundData = full;";
const intervalMatchUnix = "latestRoundData = full;\n      latestRoundData = full;";
const intervalReplace = `latestRoundData = full;
      channelWindow.push(full);
      if (channelWindow.length > 50) channelWindow.shift();`;

text = text.replace(intervalMatch, intervalReplace);
text = text.replace(intervalMatchUnix, intervalReplace);

// 2. Rewrite MESSAGE_SEND
const sendMatchRegex = /const isReplay = latestRoundData && latestRoundData\.event_flags && latestRoundData\.event_flags\.includes\('replay_detected'\);/s;
const sendReplace = `const isReplay = channelWindow.some(r => r.event_flags && r.event_flags.includes('replay_detected'));`;
text = text.replace(sendMatchRegex, sendReplace);

// 3. Rewrite UNLOCK_MESSAGE
const unlockMatchRegex = /const isMacForge = latestRoundData.*?const isNetworkReject = latestRoundData && latestRoundData\.verdict === 'REJECT' && !isMacForge && !isBatchNoise;/s;
const unlockReplace = `const isMacForge = channelWindow.some(r => r.event_flags && r.event_flags.includes('mac_verification_failure'));
        const isBatchNoise = channelWindow.some(r => r.event_flags && r.event_flags.includes('cefb_bound_exceeded'));
        const isNetworkReject = channelWindow.some(r => r.verdict === 'REJECT' && !r.event_flags.includes('mac_verification_failure') && !r.event_flags.includes('cefb_bound_exceeded') && !r.event_flags.includes('replay_detected'));`;
text = text.replace(unlockMatchRegex, unlockReplace);

fs.writeFileSync('server/index.js', text, 'utf8');