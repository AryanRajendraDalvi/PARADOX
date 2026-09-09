import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

const regexSysMsg = /from_user_id: identity\.user_id, \/\/ Tie it to the sender so it bypasses filterConversation\r?\n                  to_user_id: conn\.user_id,\r?\n                  direction: 'incoming',/g;
const replaceSysMsg = `from_user_id: identity.user_id, // Tie it to the sender so it bypasses filterConversation
                  to_user_id: conn.user_id,
                  from_display_name: 'SYSTEM',
                  to_display_name: conn.displayName,
                  direction: 'incoming',`;

text = text.replace(regexSysMsg, replaceSysMsg);

fs.writeFileSync('server/index.js', text, 'utf8');