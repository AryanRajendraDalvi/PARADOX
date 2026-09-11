import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NODES = {
  source: { x: 300, y: 60, label: 'Î¦+ SOURCE' },
  alice: { x: 90, y: 260, label: 'ALICE' },
  bob: { x: 300, y: 300, label: 'BOB' },
  charlie: { x: 510, y: 260, label: 'CHARLIE' }
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function PhotonStream({ from, to, color, speed = 1.4, jitter = 0, count = 3, keyPrefix }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return (
    <>
      {particles.map((i) => {
        const delay = (i / count) * speed;
        return (
          <motion.circle
            key={`${keyPrefix}-${i}`}
            r={3.2}
            fill={color}
            
            initial={{ cx: from.x, cy: from.y, opacity: 0 }}
            animate={{
              cx: [from.x, lerp(from.x, to.x, 0.5) + (jitter ? (Math.random() - 0.5) * jitter : 0), to.x],
              cy: [from.y, lerp(from.y, to.y, 0.5) + (jitter ? (Math.random() - 0.5) * jitter : 0), to.y],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: speed,
              delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        );
      })}
    </>
  );
}

function FiberLine({ from, to, color = '#0891a8', width = 1.5, dashed = false }) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? '5 5' : undefined}
      opacity={0.5}
    />
  );
}

function NodeDot({ node, color = '#2563EB', size = 8, labelColor = '#475569' }) {
  return (
    <g>
      <circle cx={node.x} cy={node.y} r={size + 6} fill={color} opacity={0.12} />
      <circle cx={node.x} cy={node.y} r={size} fill={color}  />
      <text
        x={node.x}
        y={node.y + size + 16}
        textAnchor="middle"
        className=""
        fontSize="10"
        fill={labelColor}
        letterSpacing="0.5"
      >
        {node.label}
      </text>
    </g>
  );
}

/**
 * Central Canvas/SVG visualizer for the quantum entanglement layer
 * (photonic fiber from the Bell source to Alice/Bob/Charlie) and the
 * classical authenticated channel. Reads `attack.type` / `attack.active`
 * and `auth.mac_verified` from the latest ROUND_UPDATE frame to drive
 * the attack-specific animation layer.
 */
export default function NetworkTopology({ frame, compact = false, theme = 'light' }) {
  const attack = frame?.attack?.type ?? 'none';
  const attackActive = frame?.attack?.active ?? false;
  const macVerified = frame?.auth?.mac_verified ?? true;
  const height = compact ? 350 : 380;

  const nodeBlue = '#2563EB';
  const nodeConnected = '#16A34A';
  const nodeDisconnected = '#94A3B8';
  const channelClassical = '#64748B';
  const channelQuantum = '#2563EB';
  const labelColor = theme === 'dark' ? '#94A3B8' : '#475569';


  

  return (
    <div className={`relative w-full rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-slate-700/50 bg-[#111827]' : 'border-slate-200 bg-[#F8FAFC]'}`}>
      <svg viewBox={`0 0 600 ${height}`} className="w-full h-auto">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke={theme === 'dark' ? '#374151' : 'transparent'} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="600" height={height} fill={theme === 'dark' ? '#111827' : '#F8FAFC'} />
        <rect width="600" height={height} fill="url(#grid)" />

        {/* Quantum fiber lines */}
        <FiberLine from={NODES.source} to={NODES.alice} color={channelQuantum} />
          <FiberLine from={NODES.source} to={NODES.bob} color={channelQuantum} />
          <FiberLine from={NODES.source} to={NODES.charlie} color={channelQuantum} />

        {/* Classical authenticated channel â€” dashed amber, connects the parties' broadcasts */}
        <FiberLine from={NODES.alice} to={{ x: NODES.alice.x, y: NODES.alice.y + 30 }} color={channelClassical} dashed />
        <path
          d={`M ${NODES.alice.x} ${NODES.alice.y + 30} L ${NODES.bob.x} ${NODES.bob.y + 40} L ${NODES.charlie.x} ${NODES.charlie.y + 30}`}
          stroke={macVerified ? '#F59E0B' : '#DC2626'}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          fill="none"
          opacity={0.55}
        />

        {/* Baseline photon streams (quiet unless overridden by an attack effect below) */}
        {attack !== 'blind' && (
          <>
            <PhotonStream from={NODES.source} to={NODES.alice} color={channelQuantum} keyPrefix="a" count={attackActive ? 2 : 3} />
            <PhotonStream from={NODES.source} to={NODES.bob} color={channelQuantum} keyPrefix="b" count={attackActive ? 2 : 3} />
            <PhotonStream from={NODES.source} to={NODES.charlie} color={channelQuantum} keyPrefix="c" count={attackActive ? 2 : 3} />
          </>
        )}

        {/* Attack-specific overlays */}
        <AnimatePresence>
          {attackActive && attack === 'intercept' && <InterceptOverlay />}
          {attackActive && attack === 'entangle' && <EntangleOverlay />}
          {attackActive && attack === 'replay' && <ReplayOverlay />}
          {attackActive && attack === 'batchNoise' && <BatchNoiseOverlay />}
          {attackActive && attack === 'blind' && <BlindOverlay />}
          {(attack === 'macForge' && !macVerified) && <MacForgeOverlay />}
        </AnimatePresence>

        {/* Nodes drawn last so they sit above beams */}
        <NodeDot node={NODES.source} color={nodeBlue} size={9} labelColor={labelColor} />
        <NodeDot node={NODES.alice} color={nodeConnected} size={7} labelColor={labelColor} />
        <NodeDot node={NODES.bob} color={nodeConnected} size={7} labelColor={labelColor} />
        <NodeDot node={NODES.charlie} color={attack === "rogue_verifier" ? nodeDisconnected : nodeConnected} size={7} labelColor={labelColor} />
      </svg>

      <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] ">
        <span
          className={`w-1.5 h-1.5 rounded-full ${attackActive ? 'bg-[#DC2626] animate-pulse' : 'bg-[#16A34A]'}`}
        />
        <span className={attackActive ? 'text-[#DC2626]' : 'text-[#16A34A]'}>
          {attackActive ? `ATTACK: ${attack.toUpperCase()}` : 'CHANNEL NOMINAL'}
        </span>
      </div>
    </div>
  );
}

function InterceptOverlay() {
  const eveX = 195,
    eveY = 160;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.circle
        cx={eveX}
        cy={eveY}
        r={9}
        fill="none"
        stroke="#DC2626"
        strokeWidth={2}
        animate={{ r: [7, 11, 7] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />
      <text x={eveX} y={eveY - 16} textAnchor="middle" fontSize="9" fill="#DC2626" className="">
        EVE
      </text>
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          r={2}
          fill="#DC2626"
          initial={{ cx: eveX, cy: eveY, opacity: 1 }}
          animate={{
            cx: eveX + (Math.random() - 0.5) * 40,
            cy: eveY + 20 + Math.random() * 20,
            opacity: 0
          }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </motion.g>
  );
}

function EntangleOverlay() {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.circle
        cx={NODES.source.x}
        cy={NODES.source.y + 45}
        r={26}
        fill="none"
        stroke="#6D28D9"
        strokeWidth={2}
        strokeDasharray="4 4"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: `${NODES.source.x}px ${NODES.source.y + 45}px` }}
      />
      <text x={NODES.source.x} y={NODES.source.y + 90} textAnchor="middle" fontSize="9" fill="#6D28D9" className="">
        AUX PROBE
      </text>
    </motion.g>
  );
}

function ReplayOverlay() {
  const bx = 420,
    by = 150;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.circle
        cx={bx}
        cy={by}
        r={20}
        fill="none"
        stroke="#F59E0B"
        strokeWidth={1.5}
        strokeDasharray="2 6"
        animate={{ rotate: -360 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: `${bx}px ${by}px` }}
      />
      <circle cx={bx} cy={by} r={4} fill="#F59E0B" />
      <text x={bx} y={by - 28} textAnchor="middle" fontSize="9" fill="#F59E0B" className="">
        PHASE BUFFER
      </text>
    </motion.g>
  );
}

function BatchNoiseOverlay() {
  const paths = [NODES.alice, NODES.bob, NODES.charlie];
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {paths.map((to, idx) => (
        <motion.line
          key={idx}
          x1={NODES.source.x}
          y1={NODES.source.y}
          x2={to.x}
          y2={to.y}
          stroke="#F59E0B"
          strokeWidth={1}
          opacity={0.5}
          animate={{ x1: [NODES.source.x - 2, NODES.source.x + 2, NODES.source.x - 2] }}
          transition={{ duration: 0.15, repeat: Infinity }}
        />
      ))}
    </motion.g>
  );
}

function BlindOverlay() {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {[NODES.bob, NODES.charlie].map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={30}
          fill="#ffffff"
          animate={{ opacity: [0.15, 0.55, 0.15], r: [24, 34, 24] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      ))}
    </motion.g>
  );
}

function MacForgeOverlay() {
  const midX = 300,
    midY = 340;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {[0, 1, 2, 3].map((i) => (
        <motion.line
          key={i}
          x1={midX}
          y1={midY}
          x2={midX + Math.cos((i * Math.PI) / 2) * 18}
          y2={midY + Math.sin((i * Math.PI) / 2) * 18}
          stroke="#DC2626"
          strokeWidth={2}
          animate={{ opacity: [1, 0], x2: [midX, midX + Math.cos((i * Math.PI) / 2) * 26] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
      <text x={midX} y={midY + 30} textAnchor="middle" fontSize="9" fill="#DC2626" className="">
        MAC INTEGRITY BREACH
      </text>
    </motion.g>
  );
}
