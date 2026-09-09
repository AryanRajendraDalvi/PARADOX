import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

const regexVars = /let channelWindow = \[\];/g;
text = text.replace(regexVars, "let channelWindow = [];\nlet currentRoles = { sender: 'alice', receiver: 'bob', verifier: 'charlie' };");

const regexFrame = /        send\(conn\.ws, 'ROUND_UPDATE', filterFrameForAccountType\(full, conn\.account_type\)\);/g;
const replaceFrame = `        const frame = filterFrameForAccountType(full, conn.account_type);
        frame.current_roles = currentRoles;
        send(conn.ws, 'ROUND_UPDATE', frame);`;
text = text.replace(regexFrame, replaceFrame);

const regexSend = /      messageHistory\.push\(message\);/g;
const replaceSend = `      currentRoles = {
        sender: identity.user_id,
        receiver: to_user_id,
        verifier: ['alice', 'bob', 'charlie'].find(u => u !== identity.user_id && u !== to_user_id)
      };
      messageHistory.push(message);`;
text = text.replace(regexSend, replaceSend);

fs.writeFileSync('server/index.js', text, 'utf8');