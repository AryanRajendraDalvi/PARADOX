import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

filter_old = """export function filterFrameForAccountType(frame, accountType) {
  let res;
  if (accountType === 'admin') {
    res = { ...frame };
    res.classical_flags = Array.from(activeClassicalFlags);
  } else {
    const { attack, auth, audit, event_flags, ...rest } = frame;
    res = Object.assign(rest, {
      event_flags: (event_flags && event_flags.length > 0) ? ['alert_suppressed'] : []
    });
  }
  res.threat_model_active = threat_model_active;
  return res;
}"""

filter_new = """export function filterFrameForAccountType(frame, accountType) {
  let res = { ...frame };
  res.classical_flags = Array.from(activeClassicalFlags);
  res.threat_model_active = threat_model_active;
  
  if (accountType !== 'admin') {
    // Only strip attack ground truth and auth secrets, keep event_flags for the demo UI
    delete res.attack;
    delete res.auth;
    delete res.audit;
  }
  
  return res;
}"""

text = text.replace(filter_old, filter_new)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)