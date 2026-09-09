import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');
text = text.replace("locked: currentAttack !== 'replay',", "locked: true,");
fs.writeFileSync('server/index.js', text, 'utf8');