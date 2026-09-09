import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

text = text.replace(/  \}, 200\);/g, "  }, 100);");

fs.writeFileSync('server/index.js', text, 'utf8');