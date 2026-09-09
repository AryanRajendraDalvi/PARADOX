# QDS Threat Detection — Frontend + Session Server

React/Vite/Tailwind/Framer-Motion frontend, plus a small Node WebSocket
session server (`/server`) that provides real multi-PC messaging, dynamic
Sender/Receiver/Verifier role assignment, and server-enforced admin
authorization.

## Run it — single machine (dev)

```bash
# terminal 1 — session server
cd server
npm install
npm start            # listens on 0.0.0.0:4000

# terminal 2 — frontend
cd ..
npm install
npm run dev           # http://localhost:5173
```

With no `.env`, the frontend defaults to talking to the server on the same
hostname it was loaded from, port 4000 — fine for one machine.

## Run it — across multiple PCs on a LAN

1. Pick the PC that will host the server. Find its LAN IP (e.g. `192.168.1.100`).
2. On that PC: `cd server && npm start` (binds `0.0.0.0:4000` by default —
   reachable from other machines; make sure the OS firewall allows it).
3. On every PC that will run the frontend (including the server's own
   machine, if you want a browser there too): copy `.env.example` to `.env`
   and set:
   ```
   VITE_API_URL=http://192.168.1.100:4000
   VITE_WS_URL=ws://192.168.1.100:4000
   ```
4. `npm install && npm run dev -- --host` on each, then open
   `http://<that PC's own IP>:5173` from that PC's browser (or run
   `npm run build && npm run preview -- --host` for a production build).
5. Log in as a different demo account on each PC (see table below).

Nothing here hardcodes `localhost`/`127.0.0.1` — every address is either
env-configurable or derived from the page's own origin.

## Demo accounts

| username | password | account_type |
|---|---|---|
| `admin` | `admin123` | admin |
| `alice` | `alice123` | participant |
| `bob` | `bob123` | participant |
| `charlie` | `charlie123` | participant |

**Important:** these usernames are just login identities. They are **not**
permanently Sender/Receiver/Verifier — see below.

## How dynamic role assignment works

- `server/index.js` holds ONE piece of state per running session:
  `{ sender_id, receiver_id, verifier_id }`, storing **user_id**, not
  username-as-role.
- On connect, a participant with no current role auto-fills the first open
  slot (sender → receiver → verifier, in that order). A 4th simultaneous
  participant connects as a spectator until a slot frees or an admin
  reassigns.
- On disconnect, that user's slot frees. Nobody else is affected —
  disconnecting Alice never logs out Bob, Charlie, or Admin.
- Admin can explicitly reassign any slot at any time from the **Dynamic
  Role Assignment** panel (Admin dashboard → sends `ASSIGN_ROLES` over the
  socket). This is what lets you test "swap the roles" on demand.
- Every connection is told its role via `SESSION_ROLES_UPDATE`, pushed
  automatically whenever roles change — no reload needed.
- **The server, not the client, decides who's allowed to send.**
  `MESSAGE_SEND` is checked against the server's own role table
  (`roleOfUser(connection.user_id)`); a client cannot claim "I'm the
  sender" — I verified this directly (see "Verified" below): after an
  admin reassignment, the user who *used to* hold Sender got a hard
  `MESSAGE_ACK {status:"failed"}` when trying to send.

No source file changes are needed to swap roles — it's a runtime action.

## Messaging — how the flow actually works

- `MESSAGE_SEND` (client → server) → server validates the sender against
  its own role table → stores the message → replies `MESSAGE_ACK` (`sent`)
  to the sender → forwards `MESSAGE` to whoever currently holds Receiver
  and Verifier (and to any connected Admin, tagged `monitored: true`) →
  replies a second `MESSAGE_ACK` (`delivered` or `failed`, with a reason)
  once forwarding is attempted.
- Client-side (`useSocket.js`) never fakes any of this: if the socket
  isn't actually `'live'`, `sendMessage` immediately reports `failed` with
  "Not connected to the messaging server" — there is no local/offline
  message-delivery path, and nothing here touches `localStorage`. Message
  state lives only in memory for the life of the connection, plus whatever
  backlog (`MESSAGE_HISTORY`) the server replays to Admin on connect.
- Messages are kept in an entirely separate state channel from QDS data
  end to end: distinct server event types (`MESSAGE`/`MESSAGE_ACK` vs.
  `ROUND_UPDATE`), distinct client state (`messages[]` vs. `roundUpdates[]`
  in `useSocket.js`), distinct components (`ChatPanel.jsx` /
  `MessageMonitorPanel.jsx` vs. `EventLogStream.jsx`). Nothing merges them.

## Verified (not just implemented)

I ran the actual acceptance flow against the server as three separate
WebSocket clients (simulating three PCs) before shipping this:

1. Alice connects → auto-assigned Sender. Bob connects → auto-assigned
   Receiver. Charlie connects → auto-assigned Verifier.
2. Alice sends "Hello from PC 1" → Bob's connection receives `MESSAGE`
   with that text, Charlie's connection receives it too (tagged
   `verification: true`), and Alice receives `sent` then `delivered` acks
   — all within under a second, no polling.
3. Admin reassigns Bob→Sender, Charlie→Receiver, Alice→Verifier via
   `ASSIGN_ROLES` — no server restart, no code change. Bob sends a message
   → Charlie and Alice receive it correctly under their new roles.
4. Alice (now holding Verifier, not Sender) attempts to send anyway →
   server rejects it: `{"status":"failed","reason":"You are not the
   current sender for this session."}` — proving authorization is
   enforced server-side, not just hidden in the UI.

## Admin — what's new vs. unchanged

`OverviewMasterView.jsx` (the existing full QDS dashboard: attack console,
security ledger, event log, all three parties) is **unmodified**. It's now
wrapped by `AdminView.jsx`, which renders it as-is and adds two new panels
below it:
- **Dynamic Role Assignment** — who's connected, and dropdowns to set each
  role.
- **Message Monitor** — read-only feed of every message sent, sourced from
  `messages[]`, never from QDS log data.

Non-admin connections never receive attack/auth/audit/event_flags data or
the message-monitor stream — the server filters `ROUND_UPDATE` per
`account_type` before it goes on the wire (`filterFrameForAccountType` in
`server/index.js`), and only forwards `MESSAGE` events to the
current Receiver/Verifier/Admin. There's no client-side hiding involved;
`src/auth/filterFrameForRole.js` is now a documented no-op left in place
only as a pointer to where that logic used to live.

## Participant pages — what changed

The Sender/Receiver/Verifier pages are no longer QDS-log-only panels.
`ParticipantView.jsx` (routed to for any `account_type: "participant"`
session) now shows, side by side:
- A live **ChatPanel** (conversation history, input, Send button, and a
  per-message Sending → Sent → Delivered/Failed status trail), plus
  overall connection status and the current session ID.
- Whichever QDS visual panel matches the user's *current dynamic role* —
  `AliceView`/`BobView`/`CharlieView`, unchanged internally except for a
  new `embedded` prop (used here to drop their own header/wrapper, since
  `ParticipantView` already shows identity + role + connection state) and
  role-generic copy (e.g. "Receiver" instead of hardcoded "Bob").
  **Which of the three renders is chosen by `sessionRoles`, never by
  username** — if Alice currently holds the Verifier slot, she sees the
  Verifier QDS panel, not "Alice's panel."

If a participant currently holds no role (all three slots taken by
others), the page says so plainly and shows a read-only chat pane instead
of guessing a role.

## Remaining dependency on the real QDS `bridge.py`

`ROUND_UPDATE` frames are still generated by an in-process engine in
`server/index.js` (`generateRound()`), ported from the earlier client-side
mock so every connection sees a consistent live run. This is a stand-in
for the real bridge. Swapping it out means: replace the `setInterval(
broadcastRoundUpdate, 900)` loop with whatever ingests bridge.py's actual
stream, and call the existing `filterFrameForAccountType()` /
`broadcastSessionRoles()` / connection-fanout functions on each real frame
instead. **None of the messaging, auth, or dynamic-role code depends on
where `ROUND_UPDATE` comes from** — that boundary was kept deliberately
clean.

## Known limitations (LAN demo, not production)

- In-memory only: server restart clears all sessions, roles, and message
  history. No persistence layer.
- Plaintext passwords, unsigned random-hex tokens, no TLS. Fine on a
  trusted LAN for a demo; not for anything beyond that.
- One live connection per user_id (a second login for the same username
  replaces that user's own connection, not anyone else's). Multiple
  concurrent sessions *per role* (e.g. two people both able to act as
  "a sender") isn't implemented — only multiple concurrent *users*, each
  with one role, which is what the current spec calls for.
