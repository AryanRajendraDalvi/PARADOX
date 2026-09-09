import fs from 'fs';
let text = fs.readFileSync('src/components/ChatPanel.jsx', 'utf8');

const brokenSealMatch = `          } else if (msg.failure_type === 'broken-seal') {
             icon = (<svg className="w-4 h-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5L21 3m-4.5 9v1.5a7.5 7.5 0 11-15 0v-6a7.5 7.5 0 0113-5" /></svg>);
             color = "bg-crimson/10 border-crimson/30";
             status = msg.failure_reason;
             title = "MAC VERIFICATION FAILED";
          }`;

const brokenSealReplace = `          } else if (msg.failure_type === 'broken-seal') {
             icon = (<svg className="w-4 h-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5L21 3m-4.5 9v1.5a7.5 7.5 0 11-15 0v-6a7.5 7.5 0 0113-5" /></svg>);
             color = "bg-crimson/10 border-crimson/30";
             status = "Quantum Correlation: MATCHED ✓ — Classical MAC: FAILED ✗";
             title = "AUTHENTICATION FAILED";
          }`;

text = text.replace(brokenSealMatch, brokenSealReplace);

// Also fix the text coloring for broken-seal so it's red/crimson
const colorMatch = "`text-[9px] font-mono truncate ${msg.failure_type && msg.failure_type !== 'broken-seal' ? 'text-amber' : 'text-slate-500'}`";
const colorReplace = "`text-[9px] font-mono truncate ${msg.failure_type === 'broken-seal' || msg.failure_type === 'instant' ? 'text-crimson' : msg.failure_type ? 'text-amber' : 'text-slate-500'}`";

text = text.replace(colorMatch, colorReplace);

fs.writeFileSync('src/components/ChatPanel.jsx', text, 'utf8');