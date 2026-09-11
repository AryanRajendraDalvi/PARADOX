import { spawn } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer } from 'ws';

// ---------------------------------------------------------------------------
// Config Ã¢â‚¬â€ no hardcoded localhost. Bind address / port are configurable so
// this can run reachable on a LAN (e.g. HOST=0.0.0.0 PORT=4000).
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';
// Comma-separated list of allowed browser origins for the HTTP auth route.
// '*' is fine for a LAN demo; tighten this for anything beyond that.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim());

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes('*') ? '*' : ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// ---------------------------------------------------------------------------
// Users Ã¢â‚¬â€ demo accounts only. account_type is fixed (admin vs participant).
// There are NO permanent QDS protocol roles (sender/receiver/verifier).
// Those are derived per-message from who sends to whom Ã¢â‚¬â€ see MESSAGE_SEND.
// ---------------------------------------------------------------------------

const USERS = {
  admin:   { password: 'admin123',   account_type: 'admin',       displayName: 'Admin'   },
  alice:   { password: 'alice123',   account_type: 'participant', displayName: 'Alice'   },
  bob:     { password: 'bob123',     account_type: 'participant', displayName: 'Bob'     },
  charlie: { password: 'charlie123', account_type: 'participant', displayName: 'Charlie' }
};

// token -> { user_id, username, account_type, displayName }
const tokens = new Map();
const commandTimestamps = new Map();
const recentHashes = new Set();
const authFailures = new Map();
let threat_model_active = false;
let activeClassicalFlags = new Set();


// user_id -> { ws, username, account_type, displayName }
// One live connection per authenticated user_id. A second login for the
// same user replaces their own connection only.
const connections = new Map();

// ---------------------------------------------------------------------------
// QDS session Ã¢â‚¬â€ shared simulation run. No role state stored here at all.
// ---------------------------------------------------------------------------

const qdsSession = {
  session_id: `run-${crypto.randomUUID()}`
};

// ---------------------------------------------------------------------------
// QDS ROUND_UPDATE engine Ã¢â‚¬â€ same shape as before. Runs every 900 ms so
// every connected client sees the same live simulation stream. The alice/
// bob/charlie labels here refer to the QDS *protocol* roles in the
// simulation, not to any logged-in user account.
// ---------------------------------------------------------------------------

const messageHistory = [];
const ATTACKS = ['none', 'intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge', 'impersonate', 'rogue_verifier'];
let currentAttack = 'none';
let latestRoundData = null;
let channelWindow = [];
let currentRoles = { sender: 'alice', receiver: 'bob', verifier: 'charlie' };

let simProcess = null;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function send(ws, type, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(Object.assign({ type }, data)));
}

export function filterFrameForAccountType(frame, accountType) {
  if (accountType === 'admin') return frame;
  const { attack, auth, audit, event_flags, ...rest } = frame;
  return Object.assign(rest, {
    event_flags: (event_flags && event_flags.length > 0) ? ['alert_suppressed'] : []
  });
}

export function broadcastOnlineUsers() {
  const users = [...connections.values()]
    .filter((c) => c.account_type === 'participant')
    .map((c) => ({ user_id: c.user_id, displayName: c.displayName }));
  for (const conn of connections.values()) {
    send(conn.ws, 'ONLINE_USERS', { users });
  }
}
let eventQueue = [];
let simInterval = null;

export function spawnSimulator(attackType) {
  if (simProcess) {
    simProcess.kill();
    simProcess = null;
  }
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
  eventQueue = [];
  
  const env = Object.assign({}, process.env);
  env.PATH = 'C:\\msys64\\ucrt64\\bin;' + (env.PATH || '');

  const qdsDir = path.resolve(__dirname, '../../../../qds_framework');
  simProcess = spawn('./qds_sim.exe', ['--rounds', '1000', '--attack', attackType], { cwd: qdsDir, env });
  console.log('Spawned simulator with attack:', attackType);
  simProcess.on('error', (err) => console.error('Simulator spawn error:', err));
  simProcess.stderr.on('data', (d) => console.error('Simulator stderr:', d.toString()));
  
  const rl = readline.createInterface({
    input: simProcess.stdout,
    crlfDelay: Infinity
  });
  
  rl.on('line', (line) => {
    if (line.startsWith('{')) {
      try {
        const obj = JSON.parse(line);
        obj.session_id = qdsSession.session_id;
        eventQueue.push(obj);
      } catch (e) {}
    }
  });

  simInterval = setInterval(() => {
    if (eventQueue.length > 0) {
      const full = eventQueue.shift();
      latestRoundData = full;
      channelWindow.push(full);
      if (channelWindow.length > 50) channelWindow.shift();
      for (const conn of connections.values()) {
        const frame = filterFrameForAccountType(full, conn.account_type);
          frame.current_roles = currentRoles;
          
          let combinedFlags = Array.from(activeClassicalFlags);
          let threatActive = threat_model_active;

          // Map C++ simulation flags to frontend visual flags
          const eFlags = frame.event_flags || [];
          if (eFlags.includes('replay_detected')) {
             combinedFlags.push('control_replay_detected');
             threatActive = true;
          }
          if (eFlags.includes('mac_verification_failure') || eFlags.includes('unauthorized_verifier_detected')) {
             combinedFlags.push('brute_force_suspected');
             threatActive = true;
          }
          
          frame.classical_flags = combinedFlags;
          frame.threat_model_active = threatActive;
          send(conn.ws, 'ROUND_UPDATE', frame);
      }
    } else if (simProcess === null) {
      clearInterval(simInterval);
    }
  }, 100);
  
  simProcess.on('close', () => {
    simProcess = null;
  });
}
// Start initial simulation
spawnSimulator('none');


// ---------------------------------------------------------------------------
// HTTP Ã¢â‚¬â€ POST /api/auth/login only.
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/auth/login') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      let parsed;
      try {
        parsed = JSON.parse(body || '{}');
      } catch {
        res.writeHead(400, { ...headers, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed request body' }));
        return;
      }
      const { username, password } = parsed;
      const account = USERS[String(username || '').toLowerCase()];
      if (!account || account.password !== password) {
        res.writeHead(401, { ...headers, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid username or password' }));
        return;
      }
      const user_id = String(username).toLowerCase();
      const token = crypto.randomBytes(24).toString('hex');
      tokens.set(token, {
        user_id,
        username: user_id,
        account_type: account.account_type,
        displayName: account.displayName
      });
      res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          token,
          account_type: account.account_type,
          displayName: account.displayName,
          user_id,
          session_id: qdsSession.session_id
        })
      );
    });
    return;
  }

  res.writeHead(404, headers);
  res.end('Not found');
});

// ---------------------------------------------------------------------------
// WebSocket Ã¢â‚¬â€ one connection per authenticated user. Auth is verified from
// the token (query param or an AUTH frame), never from anything the client
// claims about its own identity or role.
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ server });

function authenticateFromRequest(req) {
  try {
    const url = new URL(req.url, 'http://placeholder');
    const token = url.searchParams.get('token');
    if (token && tokens.has(token)) return tokens.get(token);
  } catch {
    /* fall through to unauthenticated */
  }
  return null;
}

wss.on('connection', (ws, req) => {
  let identity = authenticateFromRequest(req);
  let registered = false;

  const heartbeat = setInterval(() => {
    send(ws, 'PING', {});
  }, 15000);

  function registerConnection() {
    if (!identity || registered) return;
    registered = true;
    connections.set(identity.user_id, { ws, ...identity });

    if (identity.account_type === 'admin') {
      // Admin gets the current message history on connect for monitoring.
      send(ws, 'MESSAGE_HISTORY', { messages: messageHistory.slice(-200) });
    }

    // All clients (participant and admin) get the current online user list.
    broadcastOnlineUsers();
  }

  // Query-param auth already resolved identity before 'connection'; if so,
  // register immediately. Otherwise wait for an explicit AUTH frame.
  if (identity) registerConnection();

  ws.on('message', (raw) => {
    const rawStr = raw.toString();
    const now = Date.now();
    let msg;
    try {
      msg = JSON.parse(rawStr);
    } catch {
      return;
    }

    const triggerFlag = (flag) => {
      activeClassicalFlags.add(flag);
      threat_model_active = true;
      setTimeout(() => {
        activeClassicalFlags.delete(flag);
        if (activeClassicalFlags.size === 0) threat_model_active = false;
      }, 5000);
    };

    if (msg.command === 'AUTH') {
      if (msg.token && tokens.has(msg.token)) {
        identity = tokens.get(msg.token);
        registerConnection();
      } else {
        const ip = req.socket.remoteAddress;
        const count = (authFailures.get(ip) || 0) + 1;
        authFailures.set(ip, count);
        if (count > 3) triggerFlag('brute_force_suspected');
      }
      return;
    }

    if (!identity) {
      const ip = req.socket.remoteAddress;
      const count = (authFailures.get(ip) || 0) + 1;
      authFailures.set(ip, count);
      if (count > 3) triggerFlag('brute_force_suspected');
      return;
    }

    // B1: Burst Detection
    const uid = identity.user_id;
    if (!commandTimestamps.has(uid)) commandTimestamps.set(uid, []);
    const stamps = commandTimestamps.get(uid);
    stamps.push(now);
    while (stamps.length > 0 && stamps[0] < now - 1000) stamps.shift();
    if (stamps.length > 10) triggerFlag('control_channel_burst');

    // B2: Replay Guard
    if (msg.command !== 'PING' && msg.type !== 'PONG' && msg.command !== 'START') {
      
      const hash = crypto.createHash('sha256').update(rawStr).digest('hex');
      if (recentHashes.has(hash)) {
        triggerFlag('control_replay_detected');
      } else {
        recentHashes.add(hash);
        setTimeout(() => recentHashes.delete(hash), 5000);
      }
    }

    if (msg.command === 'PING') {
      send(ws, 'PONG', {});
      return;
    }

    if (msg.type === 'PONG') return;

    // --- Admin-only: attack console ------------------------------------
    if (msg.command === 'START') {
      if (identity.account_type !== 'admin') return;
      const nextAttack = ATTACKS.includes(msg.attack) ? msg.attack : 'none';
      currentAttack = nextAttack;
      qdsSession.session_id = 'run-' + crypto.randomUUID(); // Reset session
      spawnSimulator(nextAttack);
      return;
    }

    // --- Messaging --------------------------------------------------------
    // Any authenticated participant may send a message to any other online
    // participant. The sender/receiver relationship is per-message only Ã¢â‚¬â€
    // there are no permanent protocol role slots. All remaining connected
    // participants (not sender, not receiver, not admin) become the
    // verification side automatically, per the QDS protocol.
    if (msg.command === 'MESSAGE_SEND') {
      if (identity.account_type !== 'participant') return;

      const to_user_id = String(msg.to_user_id || '');
      if (!to_user_id) {
        send(ws, 'MESSAGE_ACK', {
          client_id: msg.client_id,
          status: 'failed',
          reason: 'No recipient specified.'
        });
        return;
      }

      if (to_user_id === identity.user_id) {
        send(ws, 'MESSAGE_ACK', {
          client_id: msg.client_id,
          status: 'failed',
          reason: 'Cannot send a message to yourself.'
        });
        return;
      }

      const receiverConn = connections.get(to_user_id);
      if (!receiverConn || receiverConn.account_type !== 'participant') {
        send(ws, 'MESSAGE_ACK', {
          client_id: msg.client_id,
          status: 'failed',
          reason: 'Recipient is not currently online.'
        });
        return;
      }

      const text = String(msg.text || '').slice(0, 2000);
      if (!text.trim()) return;

      const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
      const dynamic_qkd_key = crypto.randomBytes(16).toString('hex');
        const valid_mac = crypto.createHmac('sha256', dynamic_qkd_key).update(text).digest('hex').slice(0, 16);
      let charlie_mac = valid_mac;
      
      let claimedRound = null;
      for (let i = 0; i < eventQueue.length; i++) {
        if (eventQueue[i].batch_type === 'SIGNING') {
           claimedRound = eventQueue.splice(i, 1)[0];
           break;
        }
      }
      if (!claimedRound && latestRoundData) claimedRound = latestRoundData;

      if (claimedRound) {
         claimedRound.claimed_by_message = crypto.randomUUID(); // tag it
         for (const conn of connections.values()) {
            send(conn.ws, 'ROUND_UPDATE', filterFrameForAccountType(claimedRound, conn.account_type));
         }

         // Send system broadcast to all participants about round allocation
         for (const conn of connections.values()) {
            if (conn.account_type === 'participant' && conn.user_id !== identity.user_id) {
               send(conn.ws, 'MESSAGE', {
                  message: {
                    id: crypto.randomUUID(),
                  session_id: qdsSession.session_id,
                  from_user_id: identity.user_id, // Tie it to the sender so it bypasses filterConversation
                  to_user_id: conn.user_id,
                  from_display_name: 'SYSTEM',
                  to_display_name: conn.displayName,
                  direction: 'incoming',
                  text: `[SYSTEM] Transmitter has reserved Quantum Round #${String(claimedRound.round_id).padStart(4, '0')} for an incoming payload.`,
                  ts: Date.now(),
                  status: 'delivered',
                  locked: false
                  }
               });
            }
         }
      }

      const isReplay = claimedRound && claimedRound.event_flags && claimedRound.event_flags.includes('replay_detected');

      const message = {
        id: crypto.randomUUID(),
        session_id: qdsSession.session_id,
        from_user_id: identity.user_id,
        from_display_name: identity.displayName,
        to_user_id,
        to_display_name: receiverConn.displayName,
        text,
        ts: Date.now(),
        locked: true,
        verification_failed: isReplay ? true : false,
        failure_type: isReplay ? 'instant' : undefined,
        failure_reason: isReplay ? 'DUPLICATE - ALREADY UNLOCKED AS ROUND ' + Math.floor(Math.random() * 50 + 10) : undefined,
        hash,
        valid_mac,
        charlie_mac,
        claimed_round: claimedRound,
        charlie_shared: false
      };
      currentRoles = {
        sender: identity.user_id,
        receiver: to_user_id,
        verifier: ['alice', 'bob', 'charlie'].find(u => u !== identity.user_id && u !== to_user_id)
      };
      messageHistory.push(message);
      if (messageHistory.length > 500) messageHistory.shift();

      send(receiverConn.ws, 'MESSAGE', { message });

      for (const conn of connections.values()) {
        if (conn.account_type === 'participant' && conn.user_id !== identity.user_id && conn.user_id !== to_user_id) {
          send(conn.ws, 'MESSAGE', { message, verification: true });
        }
        if (conn.account_type === 'admin') {
          send(conn.ws, 'MESSAGE', { message, monitored: true });
        }
      }

      send(ws, 'MESSAGE_ACK', {
        client_id: msg.client_id,
        status: 'delivered',
        message
      });
      return;
    }

    if (msg.command === 'TRANSMIT_SHARE') {
      console.log('Received TRANSMIT_SHARE for', msg.message_id);
      const targetMsg = messageHistory.find(m => m.id === msg.message_id);
      if (targetMsg) {
        console.log('Found targetMsg, broadcasting MESSAGE_UPDATE');
        targetMsg.charlie_shared = true;
        for (const conn of connections.values()) {
          send(conn.ws, 'MESSAGE_UPDATE', { message: targetMsg });
        }
      }
      return;
    }

    if (msg.command === 'UNLOCK_MESSAGE') {
      const targetMsg = messageHistory.find(m => m.id === msg.message_id);
      if (targetMsg) {
        const r = targetMsg.claimed_round;
        const isMacForge = r && r.event_flags && r.event_flags.includes('mac_verification_failure');
          const isBatchNoise = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('cefb_bound_exceeded'));
          const isBlind = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('hardware_integrity_failure'));
          const isRogueVerifier = channelWindow.some(rw => rw.event_flags && rw.event_flags.includes('unauthorized_verifier_detected'));
          const isNetworkReject = channelWindow.some(rw => rw.verdict === 'REJECT') && !isMacForge && !isBatchNoise && !isBlind && !isRogueVerifier;

          if (isRogueVerifier) {
             targetMsg.verification_failed = true;
             targetMsg.failure_type = 'rogue-verifier';
             targetMsg.failure_reason = 'UNAUTHORIZED VERIFICATION ATTEMPT';
          } else if (isBlind) {
             targetMsg.verification_failed = true;
             targetMsg.failure_type = 'instant';
             targetMsg.failure_reason = 'HARDWARE INTEGRITY FAILURE (MERMIN)';
          } else if (isBatchNoise) {
           targetMsg.verification_failed = true;
           targetMsg.failure_type = 'gradual';
           targetMsg.failure_reason = 'CEFB BOUND EXCEEDED';
        } else if (isNetworkReject) {
           targetMsg.verification_failed = true;
           targetMsg.failure_type = 'stalled';
           targetMsg.failure_reason = 'CHANNEL DISTURBANCE DETECTED';
        } else if (isMacForge || targetMsg.valid_mac !== targetMsg.charlie_mac) {
           targetMsg.verification_failed = true;
           targetMsg.failure_type = 'broken-seal';
           targetMsg.failure_reason = 'MAC VERIFICATION FAILURE';
        } else {
           targetMsg.locked = false;
        }
        for (const conn of connections.values()) {
          send(conn.ws, 'MESSAGE_UPDATE', { message: targetMsg });
        }
      }
      return;
    }
  });

  ws.on('close', () => {
    clearInterval(heartbeat);
    if (identity && connections.get(identity.user_id)?.ws === ws) {
      connections.delete(identity.user_id);
      // Broadcast updated online-user list to everyone remaining.
      broadcastOnlineUsers();
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`QDS session server listening on http://${HOST}:${PORT} (WS on the same port)`);
  console.log(`Session ID for this run: ${qdsSession.session_id}`);
});

