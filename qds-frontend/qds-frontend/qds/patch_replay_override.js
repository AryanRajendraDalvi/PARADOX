import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');
text = text.replace("charlie_shared: false,\r\n        verification_failed: false", "charlie_shared: false");
text = text.replace("charlie_shared: false,\n        verification_failed: false", "charlie_shared: false");
fs.writeFileSync('server/index.js', text, 'utf8');