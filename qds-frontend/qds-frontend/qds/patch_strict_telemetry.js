import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

// 1. Add latestRoundData tracking
const intervalMatch = "  simInterval = setInterval(() => {\r\n    if (eventQueue.length > 0) {\r\n      const full = eventQueue.shift();";
const intervalMatchUnix = "  simInterval = setInterval(() => {\n    if (eventQueue.length > 0) {\n      const full = eventQueue.shift();";

const intervalReplace = `  simInterval = setInterval(() => {
    if (eventQueue.length > 0) {
      const full = eventQueue.shift();
      latestRoundData = full;`;

text = text.replace(intervalMatch, intervalReplace);
text = text.replace(intervalMatchUnix, intervalReplace);

// Add global var
text = text.replace("let currentAttack = 'none';", "let currentAttack = 'none';\nlet latestRoundData = null;");

// 2. Rewrite MESSAGE_SEND
const sendMatchRegex = /const valid_mac = .*?charlie_shared: false/s;
const sendReplace = `const valid_mac = crypto.createHmac('sha256', dynamic_qkd_key).update(text).digest('hex').slice(0, 16);
      let charlie_mac = valid_mac;
      
      const isReplay = latestRoundData && latestRoundData.event_flags && latestRoundData.event_flags.includes('replay_detected');

      const message = {
        id: crypto.randomUUID(),
        session_id: qdsSession.session_id,
        from_user_id: identity.user_id,
        from_display_name: identity.displayName,
        to_user_id,
        to_display_name: receiverConn.displayName,
        text,
        ts: Date.now(),
        locked: true,
        verification_failed: isReplay ? true : false,
        failure_type: isReplay ? 'instant' : undefined,
        failure_reason: isReplay ? 'DUPLICATE - ALREADY UNLOCKED AS ROUND ' + Math.floor(Math.random() * 50 + 10) : undefined,
        hash,
        valid_mac,
        charlie_mac,
        charlie_shared: false`;
text = text.replace(sendMatchRegex, sendReplace);

// 3. Rewrite UNLOCK_MESSAGE
const unlockMatchRegex = /if \(msg\.command === 'UNLOCK_MESSAGE'\) \{.*?for \(const conn of connections\.values\(\)\) \{/s;
const unlockReplace = `if (msg.command === 'UNLOCK_MESSAGE') {
      const targetMsg = messageHistory.find(m => m.id === msg.message_id);
      if (targetMsg) {
        const isMacForge = latestRoundData && latestRoundData.event_flags && latestRoundData.event_flags.includes('mac_verification_failure');
        const isBatchNoise = latestRoundData && latestRoundData.event_flags && latestRoundData.event_flags.includes('cefb_bound_exceeded');
        const isNetworkReject = latestRoundData && latestRoundData.verdict === 'REJECT' && !isMacForge && !isBatchNoise;

        if (isBatchNoise) {
           targetMsg.verification_failed = true;
           targetMsg.failure_type = 'gradual';
           targetMsg.failure_reason = 'CEFB BOUND EXCEEDED';
        } else if (isNetworkReject) {
           targetMsg.verification_failed = true;
           targetMsg.failure_type = 'stalled';
           targetMsg.failure_reason = 'CHANNEL DISTURBANCE DETECTED';
        } else if (isMacForge || targetMsg.valid_mac !== targetMsg.charlie_mac) {
           targetMsg.verification_failed = true;
           targetMsg.failure_type = 'broken-seal';
           targetMsg.failure_reason = 'MAC VERIFICATION FAILURE';
        } else {
           targetMsg.locked = false;
        }
        for (const conn of connections.values()) {`;

text = text.replace(unlockMatchRegex, unlockReplace);

fs.writeFileSync('server/index.js', text, 'utf8');