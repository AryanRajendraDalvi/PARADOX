import fs from 'fs';
let text = fs.readFileSync('src/components/EventLogStream.jsx', 'utf8');

const regexBadge = /\{entry\.event_flags\.length > 0 \? \(/;
const replaceBadge = `{entry.claimed_by_message && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-violet/10 text-violet border border-violet/20 whitespace-nowrap">
            CLAIMED
          </span>
        )}
        {entry.event_flags.length > 0 ? (`;

text = text.replace(regexBadge, replaceBadge);
fs.writeFileSync('src/components/EventLogStream.jsx', text, 'utf8');