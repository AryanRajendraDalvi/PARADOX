import fs from 'fs';
let text = fs.readFileSync('src/components/MerminGauge.jsx', 'utf8');

text = text.replace(/2[^\s]?\^s2 = 4\.000/, 'Quantum GHZ = 4.000');
text = text.replace(/2\^s2 = 4\.000/, 'Quantum GHZ = 4.000');
text = text.replace(/2\u221A2 = 4\.000/, 'Quantum GHZ = 4.000');
text = text.replace(/2.*2 = 4\.000/, 'Quantum GHZ = 4.000'); // catchall

fs.writeFileSync('src/components/MerminGauge.jsx', text, 'utf8');