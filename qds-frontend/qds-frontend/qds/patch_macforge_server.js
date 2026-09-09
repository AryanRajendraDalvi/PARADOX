import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');
text = text.replace("             targetMsg.failure_reason = 'MAC VERIFICATION FAILURE';\r\n             targetMsg.locked = false;", "             targetMsg.failure_reason = 'MAC VERIFICATION FAILURE';");
text = text.replace("             targetMsg.failure_reason = 'MAC VERIFICATION FAILURE';\n             targetMsg.locked = false;", "             targetMsg.failure_reason = 'MAC VERIFICATION FAILURE';");
fs.writeFileSync('server/index.js', text, 'utf8');