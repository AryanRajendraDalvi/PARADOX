import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

// Update MESSAGE_SEND
const sendMatchRegex = /const valid_mac = .*?charlie_shared: false/s;
const sendReplace = `const valid_mac = crypto.createHmac('sha256', dynamic_qkd_key).update(text).digest('hex').slice(0, 16);
      let charlie_mac = valid_mac;
      
      let claimedRound = null;
      for (let i = 0; i < eventQueue.length; i++) {
        if (eventQueue[i].batch_type === 'SIGNING') {
           claimedRound = eventQueue.splice(i, 1)[0];
           break;
        }
      }
      if (!claimedRound && latestRoundData) claimedRound = latestRoundData;

      if (claimedRound) {
         claimedRound.claimed_by_message = crypto.randomUUID(); // tag it
         for (const conn of connections.values()) {
            send(conn.ws, 'ROUND_UPDATE', filterFrameForAccountType(claimedRound, conn.account_type));
         }
      }

      const isReplay = claimedRound && claimedRound.event_flags && claimedRound.event_flags.includes('replay_detected');

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
        claimed_round: claimedRound,
        charlie_shared: false`;
text = text.replace(sendMatchRegex, sendReplace);

// Update UNLOCK_MESSAGE
const unlockMatchRegex = /const isMacForge = channelWindow.*?!r\.event_flags\.includes\('replay_detected'\)\);/s;
const unlockReplace = `const r = targetMsg.claimed_round;
        const isMacForge = r && r.event_flags && r.event_flags.includes('mac_verification_failure');
        const isBatchNoise = r && r.event_flags && r.event_flags.includes('cefb_bound_exceeded');
        const isNetworkReject = r && r.verdict === 'REJECT' && !isMacForge && !isBatchNoise;`;
text = text.replace(unlockMatchRegex, unlockReplace);

fs.writeFileSync('server/index.js', text, 'utf8');