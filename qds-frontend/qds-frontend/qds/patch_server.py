import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add globals
globals_old = """const tokens = new Map(); // token -> { user_id, username, account_type, displayName }"""
globals_new = """const tokens = new Map(); // token -> { user_id, username, account_type, displayName }

// B1-B3: Classical Layer Hardening Trackers
const commandTimestamps = new Map();
const recentHashes = new Set();
const authFailures = new Map();
let threat_model_active = false;
let activeClassicalFlags = new Set();
"""
text = text.replace(globals_old, globals_new)

# 2. Add to filterFrameForAccountType
filter_old = """export function filterFrameForAccountType(frame, accountType) {
  if (accountType === 'admin') return frame;
  const { attack, auth, audit, event_flags, ...rest } = frame;
  return Object.assign(rest, {
    event_flags: (event_flags && event_flags.length > 0) ? ['alert_suppressed'] : []
  });
}"""

filter_new = """export function filterFrameForAccountType(frame, accountType) {
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
text = text.replace(filter_old, filter_new)

# 3. Inside ws.on('message', ...)
msg_old = """    if (msg.command === 'AUTH') {
      if (msg.token && tokens.has(msg.token)) {
        identity = tokens.get(msg.token);
        registerConnection();
      }
      return;
    }

    if (!identity) return; // ignore everything else from unauthenticated sockets"""

msg_new = """    const now = Date.now();

    if (msg.command === 'AUTH') {
      if (msg.token && tokens.has(msg.token)) {
        identity = tokens.get(msg.token);
        registerConnection();
      } else {
        const ip = req.socket.remoteAddress;
        const failData = authFailures.get(ip) || { count: 0, firstFail: now };
        if (now - failData.firstFail > 10000) {
            failData.count = 1;
            failData.firstFail = now;
        } else {
            failData.count++;
        }
        authFailures.set(ip, failData);
        if (failData.count > 3) {
            threat_model_active = true;
            activeClassicalFlags.add('brute_force_suspected');
        }
      }
      return;
    }

    if (!identity) {
        threat_model_active = true;
        activeClassicalFlags.add('premature_command');
        return;
    }

    // B1: Burst and zero-interval detection
    let times = commandTimestamps.get(identity.user_id) || [];
    times.push(now);
    if (times.length > 20) times.shift();
    commandTimestamps.set(identity.user_id, times);

    if (times.length >= 2 && (now - times[times.length - 2] < 5)) {
        threat_model_active = true;
        activeClassicalFlags.add('automated_recon_suspected');
    }
    if (times.length === 20 && (now - times[0] < 1000)) {
        threat_model_active = true;
        activeClassicalFlags.add('control_channel_burst');
    }

    // B2: Replay detection
    if (msg.command === 'MESSAGE_SEND') {
        const hashInput = (msg.text || '') + identity.user_id + (msg.to_user_id || '');
        const hash = require('crypto').createHash('sha256').update(hashInput).digest('hex');
        if (recentHashes.has(hash)) {
            threat_model_active = true;
            activeClassicalFlags.add('control_replay_detected');
        } else {
            recentHashes.add(hash);
            if (recentHashes.size > 500) {
                const first = recentHashes.values().next().value;
                recentHashes.delete(first);
            }
        }
    }"""

text = text.replace(msg_old, msg_new)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)