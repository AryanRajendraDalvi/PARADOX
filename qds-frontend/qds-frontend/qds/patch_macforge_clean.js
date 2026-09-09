import fs from 'fs';
let text = fs.readFileSync('src/components/ChatPanel.jsx', 'utf8');

text = text.replace('             status = msg.failure_reason;\n             status = "Quantum Correlation', '             status = "Quantum Correlation');
text = text.replace('             status = msg.failure_reason;\r\n             status = "Quantum Correlation', '             status = "Quantum Correlation');

fs.writeFileSync('src/components/ChatPanel.jsx', text, 'utf8');