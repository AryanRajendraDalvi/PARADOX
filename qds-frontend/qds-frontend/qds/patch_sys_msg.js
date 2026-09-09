import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

// Broadcast SYSTEM message
const claimMatch = `         claimedRound.claimed_by_message = crypto.randomUUID(); // tag it
         for (const conn of connections.values()) {
            send(conn.ws, 'ROUND_UPDATE', filterFrameForAccountType(claimedRound, conn.account_type));
         }`;

const claimReplace = `         claimedRound.claimed_by_message = crypto.randomUUID(); // tag it
         for (const conn of connections.values()) {
            send(conn.ws, 'ROUND_UPDATE', filterFrameForAccountType(claimedRound, conn.account_type));
         }

         // Send system broadcast to all participants about round allocation
         for (const conn of connections.values()) {
            if (conn.account_type === 'participant' && conn.user_id !== identity.user_id) {
               send(conn.ws, 'MESSAGE', {
                  id: crypto.randomUUID(),
                  session_id: qdsSession.session_id,
                  from_user_id: identity.user_id, // Tie it to the sender so it bypasses filterConversation
                  to_user_id: conn.user_id,
                  direction: 'incoming',
                  text: \`[SYSTEM] Transmitter has reserved Quantum Round #\${String(claimedRound.round_id).padStart(4, '0')} for an incoming payload.\`,
                  ts: Date.now(),
                  status: 'delivered',
                  locked: false
               });
            }
         }`;

text = text.replace(claimMatch, claimReplace);

fs.writeFileSync('server/index.js', text, 'utf8');