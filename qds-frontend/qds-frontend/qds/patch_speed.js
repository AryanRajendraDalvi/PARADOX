import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

text = text.replace(/  \}, 35\);/g, "  }, 200);");

fs.writeFileSync('server/index.js', text, 'utf8');