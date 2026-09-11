import re

with open('src/components/EventLogStream.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

badge_old = """function FlagBadge({ flag }) {
  return (
    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-amber/10 text-amber border border-amber/20 whitespace-nowrap">
      {flag}
    </span>
  );
}"""

badge_new = """function FlagBadge({ flag }) {
  let label = flag;
  let color = 'text-amber border-amber/20 bg-amber/10';

  if (flag === 'intercept_resend_pattern') {
    label = 'IR PATTERN'; color = 'text-orange-500 border-orange-500/30 bg-orange-500/10';
  } else if (flag === 'ghz_degradation_trend') {
    label = 'GHZ DEGRADE'; color = 'text-purple-400 border-purple-500/30 bg-purple-500/10';
  } else if (flag === 'pns_analog_suspected') {
    label = 'PNS ANALOG'; color = 'text-red-500 border-red-500/30 bg-red-500/10';
  } else if (flag === 'finite_key_epsilon_high') {
    label = 'ε HIGH'; color = 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
  } else if (flag === 'control_channel_burst') {
    label = 'CTRL BURST'; color = 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
  } else if (flag === 'control_replay_detected') {
    label = 'CTRL REPLAY'; color = 'text-amber-400 border-amber-400/30 bg-amber-400/10';
  } else if (flag === 'brute_force_suspected') {
    label = 'BRUTE FORCE'; color = 'text-red-600 border-red-600/30 bg-red-600/10';
  } else if (flag === 'automated_recon_suspected') {
    label = 'AUTO RECON'; color = 'text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/10';
  } else if (flag === 'premature_command') {
    label = 'PREMATURE'; color = 'text-orange-400 border-orange-400/30 bg-orange-400/10';
  }

  return (
    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border whitespace-nowrap ${color}`}>
      {label}
    </span>
  );
}"""

text = text.replace(badge_old, badge_new)

# Also need to map classical_flags correctly in LogRow!
# Wait, in ParticipantView and AdminView, event_flags inside `entry` are arrays of strings. 
# Did we merge classical_flags into event_flags?
# In `server/index.js`, we did: `res.classical_flags = Array.from(activeClassicalFlags);`
# But ParticipantView / AdminView might just be mapping `entry.event_flags`.
# I should update `EventLogStream.jsx` to render classical_flags too.
row_old = """      <div className="flex flex-wrap gap-1 justify-end">
        {entry.claimed_by_message && (
          <span className="text-[9px] text-white/40 italic mr-1 self-center border border-white/10 px-1 rounded">msg-tagged</span>
        )}
        {(entry.event_flags || []).map((f, i) => (
          <FlagBadge key={i} flag={f} />
        ))}
      </div>"""

row_new = """      <div className="flex flex-wrap gap-1 justify-end">
        {entry.claimed_by_message && (
          <span className="text-[9px] text-white/40 italic mr-1 self-center border border-white/10 px-1 rounded">msg-tagged</span>
        )}
        {(entry.event_flags || []).map((f, i) => (
          <FlagBadge key={`e-${i}`} flag={f} />
        ))}
        {(entry.classical_flags || []).map((f, i) => (
          <FlagBadge key={`c-${i}`} flag={f} />
        ))}
      </div>"""

text = text.replace(row_old, row_new)

with open('src/components/EventLogStream.jsx', 'w', encoding='utf-8') as f:
    f.write(text)