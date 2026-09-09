import fs from 'fs';

let text = fs.readFileSync('server/index.js', 'utf8');

const target = `        locked: true,
        hash,`;
const targetWindows = `        locked: true,\r\n        hash,`;

const replacement = `        locked: currentAttack !== 'replay',
        verification_failed: currentAttack === 'replay',
        failure_type: currentAttack === 'replay' ? 'instant' : undefined,
        failure_reason: currentAttack === 'replay' ? 'DUPLICATE - ALREADY UNLOCKED AS ROUND ' + Math.floor(Math.random() * 50 + 10) : undefined,
        hash,`;

text = text.replace(target, replacement);
text = text.replace(targetWindows, replacement);

fs.writeFileSync('server/index.js', text, 'utf8');
console.log("Replaced:", text.includes("currentAttack !== 'replay'"));