import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

const regex = /targetMsg\.failure_reason = 'MAC VERIFICATION FAILURE';\s*targetMsg\.locked = false;/g;
text = text.replace(regex, "targetMsg.failure_reason = 'MAC VERIFICATION FAILURE';");

fs.writeFileSync('server/index.js', text, 'utf8');