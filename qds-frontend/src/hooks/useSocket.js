/* ============================================================
   useSocket — the single stream source for every panel (plan §7.1).

   Transport resolution order:
     1. ?ws=ws://host:8765   → explicit override
     2. VITE_QDS_WS env var  → build-time default
     3. built-in simulator   → so the UI is demoable with no backend
   Passing ?ws= is the "one URL change" swap from mock → bridge.py
   described in plan §7.5. The consuming components never know or
   care which transport is live.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSimulator } from '../lib/simulator.js'

const MAX_LOG = 220

function resolveTarget() {
  const q = new URLSearchParams(window.location.search)
  const ws = q.get('ws')
  if (ws) return { mode: 'ws', url: ws }
  const envUrl = import.meta.env?.VITE_QDS_WS
  if (envUrl) return { mode: 'ws', url: envUrl }
  return { mode: 'sim', url: null }
}

export function useSocket() {
  const target = useMemo(resolveTarget, [])

  const [update, setUpdate] = useState(null)
  const [log, setLog] = useState([])
  const [status, setStatus] = useState(target.mode === 'ws' ? 'connecting' : 'sim')
  const [attack, setAttack] = useState('none')

  const wsRef = useRef(null)
  const simRef = useRef(null)
  const retryRef = useRef(null)
  const aliveRef = useRef(true)

  /* One ingest path for both transports, so ordering/dedup logic
     can never drift between mock and live. */
  const ingest = useCallback((frame) => {
    if (!frame || frame.type !== 'ROUND_UPDATE') return
    setUpdate(frame)
    setAttack(frame.attack?.type ?? 'none')
    setLog((prev) => {
      const key = `${frame.session_id}-${frame.round_id}`
      // Guard against duplicate frames on reconnect: same compound key
      // means same round, so replace in place rather than double-render.
      if (prev.length && `${prev[0].session_id}-${prev[0].round_id}` === key) {
        return [frame, ...prev.slice(1)]
      }
      return [frame, ...prev].slice(0, MAX_LOG)
    })
  }, [])

  /* ---- transport: simulator ---- */
  useEffect(() => {
    if (target.mode !== 'sim') return
    const sim = createSimulator({ onFrame: ingest, intervalMs: 1400 })
    simRef.current = sim
    sim.start()
    setStatus('sim')
    return () => {
      sim.stop()
      simRef.current = null
    }
  }, [target.mode, ingest])

  /* ---- transport: websocket, with backoff reconnect ---- */
  useEffect(() => {
    if (target.mode !== 'ws') return
    aliveRef.current = true
    let attempt = 0

    const connect = () => {
      if (!aliveRef.current) return
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting')
      let sock
      try {
        sock = new WebSocket(target.url)
      } catch {
        schedule()
        return
      }
      wsRef.current = sock

      sock.onopen = () => {
        attempt = 0
        setStatus('live')
      }
      sock.onmessage = (ev) => {
        try {
          ingest(JSON.parse(ev.data))
        } catch {
          /* ignore malformed frame rather than tearing the stream down */
        }
      }
      sock.onerror = () => setStatus('error')
      sock.onclose = () => {
        wsRef.current = null
        if (aliveRef.current) schedule()
      }
    }

    const schedule = () => {
      attempt += 1
      const wait = Math.min(1000 * 2 ** (attempt - 1), 8000)
      setStatus('reconnecting')
      retryRef.current = setTimeout(connect, wait)
    }

    connect()
    return () => {
      aliveRef.current = false
      clearTimeout(retryRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [target.mode, target.url, ingest])

  /* ---- outbound: {"command":"START","attack":"..."} (plan §5.1) ---- */
  const sendCommand = useCallback((attackId) => {
    const payload = JSON.stringify({ command: 'START', attack: attackId })
    setAttack(attackId)
    // clear the log on attack switch: round_id restarts at 1 and a new
    // session begins, so the previous run's rows are a different session.
    setLog([])
    setUpdate(null)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload)
    } else {
      simRef.current?.send(payload)
    }
  }, [])

  return {
    update,
    log,
    status,
    attack,
    sendCommand,
    transport: target.mode,
    url: target.url,
  }
}
