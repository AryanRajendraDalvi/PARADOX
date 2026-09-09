import fs from 'fs';
let text = fs.readFileSync('src/components/MerminGauge.jsx', 'utf8');

text = text.replace('const TSIRELSON_BOUND = 2 * Math.sqrt(2); // ~2.828', 'const TSIRELSON_BOUND = 4.0; // Tripartite GHZ Mermin bound');
text = text.replace('{TSIRELSON_BOUND.toFixed(3)}', '4.000');
text = text.replace('2^s2 = ', '|M| \\u2264 ');

fs.writeFileSync('src/components/MerminGauge.jsx', text, 'utf8');