import fs from 'fs';
let text = fs.readFileSync('server/index.js', 'utf8');

const regexBad = /send\(conn\.ws, 'MESSAGE', \{\r?\n                  id: crypto\.randomUUID\(\),/g;
const replaceGood = `send(conn.ws, 'MESSAGE', {
                  message: {
                    id: crypto.randomUUID(),`;

const regexBadEnd = /                  locked: false\r?\n               \}\);/g;
const replaceGoodEnd = `                  locked: false
                  }
               });`;

text = text.replace(regexBad, replaceGood);
text = text.replace(regexBadEnd, replaceGoodEnd);

fs.writeFileSync('server/index.js', text, 'utf8');