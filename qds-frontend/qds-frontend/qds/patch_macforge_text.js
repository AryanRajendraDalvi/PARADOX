import fs from 'fs';
let text = fs.readFileSync('src/components/ChatPanel.jsx', 'utf8');

text = text.replace('title = "MAC VERIFICATION FAILED";', 'status = "Quantum Correlation: MATCHED \\u2713 \\u2014 Classical MAC: FAILED \\u2717";\n             title = "AUTHENTICATION FAILED";');

fs.writeFileSync('src/components/ChatPanel.jsx', text, 'utf8');