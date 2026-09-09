import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Config — WS URL is configurable via VITE_WS_URL (see .env.example) so this
// never hardcodes localhost/127.0.0.1; it must work from other PCs on the
// LAN pointed at the server's real address.
// ---------------------------------------------------------------------------

const DEFAULT_WS_URL = (() => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window === 'undefined') return 'ws://localhost:4000';
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  // Same host the page was loaded from, session-server's default port.
  // This only matters for the "open the Vite dev server directly on
  // another PC" case — normally VITE_WS_URL should be set explicitly.
  return `${proto}://${window.location.hostname}:4000`;
})();

const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = 12000;
const RECONNECT_BASE_MS = 800;
const RECONNECT_MAX_MS = 8000;

const ATTACKS = ['none', 'intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge'];

// ---------------------------------------------------------------------------
// Mock engine — QDS ROUND_UPDATE only. This is a DEV-ONLY fallback for
// working on the QDS panels with no server running at all, and it is never
// used for messaging: real-time chat requires an actual second participant
// on an actual server connection, so there is nothing meaningful to mock
// there. If the socket isn't 'live', sendMessage reports a real failure
// instead of pretending to deliver anything (see sendMessage below).
// ---------------------------------------------------------------------------

function makeSessionId() {
  return 'mock-' + Math.random().toString(16).slice(2, 10) + '-' + Date.now().toString(16);
}
function randRange(min, max) {
  return min + Math.random() * (max - min);
}
function bit() {
  return Math.random() > 0.5 ? 1 : 0;
}

function createMockEngine(onMessage) {
  let sessionId = makeSessionId();
  let roundId = 0;
  let batchId = 0;
  let attack = 'none';
  let attackActive = false;
  let timer = null;
  let stopped = false;

  function phaseForRound(r) {
    if (r % 7 === 0) return 'mermin_test';
    if (r % 3 === 0) return 'verification';
    return 'signing';
  }

  function tick() {
    roundId += 1;
    const phase = phaseForRound(roundId);
    const isMermin = phase === 'mermin_test';
    const isVerification = phase === 'verification';

    const aliceBits = [bit(), bit()];
    let bobOutcome = bit();
    let charlieOutcome = isVerification ? bobOutcome : bit();

    let decoyQber = randRange(0.005, 0.028);
    let mismatchRate = randRange(0.004, 0.03);
    const tauHoeffding = 0.061;
    const tauCefb = 0.089;
    let merminValue = isMermin ? randRange(2.72, 2.82) : null;

    let macVerified = true;
    let eventFlags = [];
    let verdict = 'ACCEPT';

    if (attackActive) {
      switch (attack) {
        case 'intercept':
          decoyQber = randRange(0.07, 0.16);
          eventFlags.push('decoy_qber_exceeded');
          break;
        case 'entangle':
          decoyQber = randRange(0.05, 0.11);
          mismatchRate = randRange(0.05, 0.1);
          eventFlags.push('decoy_qber_exceeded', 'mismatch_rate_exceeded');
          break;
        case 'replay':
          mismatchRate = randRange(0.06, 0.13);
          eventFlags.push('mismatch_rate_exceeded', 'replay_detected');
          break;
        case 'batchNoise':
          decoyQber = randRange(0.045, 0.09);
          mismatchRate = randRange(0.04, 0.08);
          eventFlags.push('elevated_noise_floor');
          break;
        case 'blind':
          if (!isVerification) charlieOutcome = bit();
          mismatchRate = randRange(0.05, 0.1);
          eventFlags.push('receiver_saturation', 'mismatch_rate_exceeded');
          break;
        case 'macForge':
          macVerified = false;
          eventFlags = ['mac_verification_failure'];
          break;
        default:
          break;
      }
      if (decoyQber > tauHoeffding || mismatchRate > tauCefb || !macVerified) {
        verdict = 'REJECT';
      }
    }

    if (isVerification && bobOutcome !== charlieOutcome) {
      eventFlags.push('correlation_mismatch');
    }

    const batchCommitted = roundId % 10 === 0;
    if (batchCommitted) batchId += 1;

    onMessage({
      type: 'ROUND_UPDATE',
      round_id: roundId,
      batch_id: batchId,
      batch_type: 'SIGNING',
      phase,
      parties: {
        alice: { measured: true, basis: 'bell', outcome_bits: aliceBits },
        bob: {
          measured: true,
          basis: 'Z',
          correction_applied: ['I', 'X', 'Y', 'Z'][Math.floor(Math.random() * 4)],
          outcome: bobOutcome
        },
        charlie: { measured: true, basis: isMermin ? 'bell' : 'Z', outcome: charlieOutcome }
      },
      checks: {
        decoy_qber: Number(decoyQber.toFixed(4)),
        mismatch_rate: Number(mismatchRate.toFixed(4)),
        tau_hoeffding: tauHoeffding,
        tau_cefb: tauCefb,
        mermin_value: merminValue === null ? null : Number(merminValue.toFixed(4))
      },
      auth: {
        mac_tag: Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        mac_verified: macVerified
      },
      audit: {
        batch_committed: batchCommitted,
        merkle_root: batchCommitted
          ? Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
          : null
      },
      attack: { active: attackActive, type: attack },
      verdict,
      status: 'PROVISIONAL',
      event_flags: eventFlags,
      session_id: sessionId
    });
  }

  function start() {
    if (stopped) return;
    timer = setInterval(tick, 900);
  }

  function sendCommand(cmd) {
    if (cmd.command === 'START') {
      const nextAttack = ATTACKS.includes(cmd.attack) ? cmd.attack : 'none';
      attack = nextAttack;
      attackActive = nextAttack !== 'none';
      roundId = 0;
    }
  }

  function destroy() {
    stopped = true;
    if (timer) clearInterval(timer);
  }

  start();
  return { sendCommand, destroy };
}

// ---------------------------------------------------------------------------
// useSocket
// ---------------------------------------------------------------------------

/**
 * Resilient WebSocket consumer for the QDS session server.
 *
 * Handles three DISTINCT kinds of server events, kept in separate state so
 * QDS monitoring data and user messages never get mixed together:
 *
 *   - roundUpdates[] / latestRound  <- ROUND_UPDATE frames (QDS protocol/log data)
 *   - messages[]                    <- MESSAGE / MESSAGE_ACK / MESSAGE_HISTORY (chat)
 *   - onlineUsers[]                 <- ONLINE_USERS (connected participants roster)
 *
 * There are NO session-wide role slots (sender/receiver/verifier). Those are
 * derived per-message: whoever calls sendMessage(text, toUserId) is the sender
 * for that message; toUserId is the receiver; all other participants are
 * automatic verifiers. The server enforces this — see server/index.js.
 *
 * Auth: the session token is sent as a query param on connect AND as an
 * explicit AUTH frame (for proxies that strip query strings). The server —
 * not this hook — decides what a given connection is allowed to see; see
 * server/index.js.
 *
 * Falls back to a QDS-only mock engine when no server is reachable at all,
 * strictly for frontend dev on the QDS panels. Messaging never uses that
 * fallback — see sendMessage.
 */
export function useSocket(url = DEFAULT_WS_URL, token = null) {
  const [latestRound, setLatestRound] = useState(null);
  const [roundUpdates, setRoundUpdates] = useState([]);
  const [messages, setMessages] = useState([]);
  // onlineUsers: [{ user_id, displayName }] — participants currently connected.
  // Does NOT include admin accounts (they are observers only).
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connection, setConnection] = useState('connecting'); // connecting | live | mock

  const wsRef = useRef(null);
  const mockRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const heartbeatSendRef = useRef(null);
  const heartbeatCheckRef = useRef(null);
  const lastPongRef = useRef(Date.now());
  const mountedRef = useRef(true);
  const connectionRef = useRef('connecting');
  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);

  const upsertMessageByClientId = useCallback((clientId, patch) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.client_id === clientId);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  const handleServerEvent = useCallback(
    (payload) => {
      if (!mountedRef.current || !payload) return;

      switch (payload.type) {
        case 'PONG':
          lastPongRef.current = Date.now();
          return;

        case 'ROUND_UPDATE':
          setLatestRound(payload);
          setRoundUpdates((prev) => {
            const next = [payload, ...prev];
            return next.length > 300 ? next.slice(0, 300) : next;
          });
          return;

        case 'MESSAGE_HISTORY':
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id).filter(Boolean));
            const backlog = (payload.messages || [])
              .filter((m) => !existingIds.has(m.id))
              .map((m) => ({ ...m, client_id: m.id, status: 'delivered', direction: 'incoming' }));
            return [...backlog, ...prev];
          });
          return;

        case 'MESSAGE': {
          const m = payload.message;
          setMessages((prev) => {
            if (prev.some((existing) => existing.id === m.id)) return prev;
            return [
              ...prev,
              {
                ...m,
                client_id: m.id,
                status: 'delivered',
                direction: 'incoming',
                verification: !!payload.verification,
                monitored: !!payload.monitored
              }
            ];
          });
          return;
        }

        case 'MESSAGE_ACK':
          upsertMessageByClientId(payload.client_id, {
            status: payload.status,
            reason: payload.reason,
            // Merge the full confirmed message so from_user_id / to_user_id
            // are present for conversation filtering in ParticipantView.
            ...(payload.message || {})
          });
          return;

        case 'MESSAGE_UPDATE':
          if (!payload.message) return;
          setMessages((prev) => prev.map(m => m.id === payload.message.id ? { ...m, ...payload.message } : m));
          return;

        case 'ONLINE_USERS':
          // Replace the roster with the server's authoritative list.
          setOnlineUsers(payload.users || []);
          return;

        default:
          return;
      }
    },
    [upsertMessageByClientId]
  );

  const stopMock = useCallback(() => {
    if (mockRef.current) {
      mockRef.current.destroy();
      mockRef.current = null;
    }
  }, []);

  const startMock = useCallback(() => {
    if (mockRef.current) return;
    setConnection('mock');
    mockRef.current = createMockEngine(handleServerEvent);
  }, [handleServerEvent]);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatSendRef.current) clearInterval(heartbeatSendRef.current);
    if (heartbeatCheckRef.current) clearInterval(heartbeatCheckRef.current);
    heartbeatSendRef.current = null;
    heartbeatCheckRef.current = null;
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    let ws;
    const connectUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
    try {
      ws = new WebSocket(connectUrl);
    } catch (err) {
      startMock();
      return;
    }
    wsRef.current = ws;
    setConnection('connecting');

    const connectTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) ws.close();
    }, 4000);

    ws.onopen = () => {
      clearTimeout(connectTimeout);
      if (!mountedRef.current) return;
      reconnectAttemptRef.current = 0;
      lastPongRef.current = Date.now();
      stopMock();
      setConnection('live');

      if (token) {
        try {
          ws.send(JSON.stringify({ command: 'AUTH', token }));
        } catch (e) {
          /* ignore */
        }
      }

      heartbeatSendRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ command: 'PING' }));
          } catch (e) {
            /* ignore */
          }
        }
      }, HEARTBEAT_INTERVAL_MS);

      heartbeatCheckRef.current = setInterval(() => {
        if (Date.now() - lastPongRef.current > HEARTBEAT_TIMEOUT_MS) ws.close();
      }, HEARTBEAT_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      lastPongRef.current = Date.now();
      try {
        handleServerEvent(JSON.parse(event.data));
      } catch (e) {
        /* ignore malformed frame */
      }
    };

    ws.onerror = () => {
      /* swallow — onclose handles reconnect/fallback */
    };

    ws.onclose = () => {
      clearTimeout(connectTimeout);
      clearHeartbeat();
      wsRef.current = null;
      if (!mountedRef.current) return;

      reconnectAttemptRef.current += 1;
      if (reconnectAttemptRef.current >= 1) startMock();

      const delay = Math.min(RECONNECT_BASE_MS * 2 ** (reconnectAttemptRef.current - 1), RECONNECT_MAX_MS);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  }, [url, token, handleServerEvent, startMock, stopMock, clearHeartbeat]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearHeartbeat();
      stopMock();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, token]);

  const sendCommand = useCallback((cmd) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    } else if (mockRef.current) {
      mockRef.current.sendCommand(cmd);
    }
  }, []);

  /**
   * Sends a chat message to a specific recipient through the real server
   * connection only. There is no local/mock delivery path: if the socket
   * isn't actually 'live', the message is recorded as genuinely failed
   * rather than faked as sent, so the UI never lies about whether it
   * reached anyone.
   *
   * @param {string} text        Message body (max 2000 chars, enforced server-side)
   * @param {string} toUserId    user_id of the recipient participant
   */
  const sendMessage = useCallback(
    (text, toUserId) => {
      const clientId = `c-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const optimistic = {
        client_id: clientId,
        id: null,
        text,
        to_user_id: toUserId,
        direction: 'outgoing',
        ts: Date.now(),
        status: 'sending'
      };
      setMessages((prev) => [...prev, optimistic]);

      if (connectionRef.current !== 'live' || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        upsertMessageByClientId(clientId, {
          status: 'failed',
          reason: 'Not connected to the messaging server.'
        });
        return clientId;
      }

      if (!toUserId) {
        upsertMessageByClientId(clientId, {
          status: 'failed',
          reason: 'No recipient selected.'
        });
        return clientId;
      }

      try {
        wsRef.current.send(JSON.stringify({ command: 'MESSAGE_SEND', text, to_user_id: toUserId, client_id: clientId }));
      } catch (e) {
        upsertMessageByClientId(clientId, { status: 'failed', reason: 'Send error.' });
      }
      return clientId;
    },
    [upsertMessageByClientId]
  );

  return {
    latestRound,
    roundUpdates,
    messages,
    onlineUsers,
    connection,
    sendCommand,
    sendMessage
  };
}

export { ATTACKS };
