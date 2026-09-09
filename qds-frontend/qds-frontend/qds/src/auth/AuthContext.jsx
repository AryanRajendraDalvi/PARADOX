import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Session storage (not localStorage) so each browser TAB/machine holds its
 * own independent session by construction — nothing here is a module-level
 * `currentUser` that a second login could stomp on. Opening the app as
 * admin in one tab and alice in another tab on the same machine, or on
 * four different machines, produces four independent AuthProvider trees,
 * each with its own token.
 *
 * IMPORTANT: `account_type` ("admin" | "participant") is fixed identity,
 * returned once at login. It is NOT the current QDS protocol role — that
 * (sender/receiver/verifier) is assigned dynamically per session by the
 * server and arrives separately over the WebSocket as SESSION_ROLES_UPDATE
 * (see useSocket.js / ParticipantView.jsx). Never conflate the two.
 */
const SESSION_KEY = 'qds.session.v1';

// Configurable, LAN-friendly — never hardcode localhost/127.0.0.1. Set
// VITE_API_URL in .env (see .env.example) to the session server's real
// address, e.g. http://192.168.1.100:4000
const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:4000`;

const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.token && parsed.account_type) return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * Backend contract (implemented in server/index.js):
 *
 *   POST {API_URL}/api/auth/login
 *   body: { username, password }
 *   200 -> { token, account_type: "admin"|"participant", displayName, user_id, session_id }
 *   401 -> { error }
 *
 * `account_type` is the only thing the frontend trusts to decide
 * admin-vs-participant rendering — never the `?role=` URL param. `token`
 * is sent on every WebSocket connection so the server decides what that
 * connection may see and do.
 *
 * Real rejections (401 from an actual server) are surfaced as errors, full
 * stop. Only an actual network failure (no server process reachable at
 * API_URL at all) falls back to DEV_MOCK_ACCOUNTS, clearly labeled in the
 * UI, so the app is still runnable while the server isn't up yet.
 */
const DEV_MOCK_ACCOUNTS = {
  admin: { password: 'admin123', account_type: 'admin', displayName: 'Admin' },
  alice: { password: 'alice123', account_type: 'participant', displayName: 'Alice' },
  bob: { password: 'bob123', account_type: 'participant', displayName: 'Bob' },
  charlie: { password: 'charlie123', account_type: 'participant', displayName: 'Charlie' }
};

function mockLogin(username, password) {
  const account = DEV_MOCK_ACCOUNTS[username?.toLowerCase()];
  if (!account || account.password !== password) {
    const err = new Error('Invalid username or password');
    err.isAuthRejection = true;
    throw err;
  }
  const user_id = username.toLowerCase();
  return {
    token: `dev-mock.${user_id}.${Math.random().toString(16).slice(2)}`,
    account_type: account.account_type,
    displayName: account.displayName,
    user_id,
    session_id: 'dev-mock-session',
    mock: true
  };
}

async function loginRequest(username, password) {
  let res;
  try {
    res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  } catch (networkErr) {
    // No server process reachable at API_URL at all (connection refused,
    // DNS failure, CORS preflight failure, etc.) — fall back to the
    // labeled dev mock so the app is still usable during development.
    return mockLogin(username, password);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Something answered at that address but isn't the session server
    // (e.g. a dev server's SPA-fallback HTML) — treat as "no real backend".
    return mockLogin(username, password);
  }

  if (!res.ok) {
    let message = 'Login failed';
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* ignore parse failure */
    }
    const err = new Error(message);
    err.isAuthRejection = true;
    throw err;
  }
  return res.json();
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  }, [session]);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginRequest(username, password);
      setSession(data);
      return data;
    } catch (err) {
      setError(err.isAuthRejection ? err.message : `${err.message} (is the session server running at ${API_URL}?)`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  return <AuthContext.Provider value={{ session, login, logout, loading, error }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
