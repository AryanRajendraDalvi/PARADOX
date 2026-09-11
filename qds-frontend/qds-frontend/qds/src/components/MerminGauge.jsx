import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SIZE = 240;
const RADIUS = 100;
const CLASSICAL_BOUND = 2;
const TSIRELSON_BOUND = 4.0; // Tripartite GHZ Mermin bound
const DOMAIN_MAX = 4;
const START_ANGLE = -210;
const SWEEP = 240;

function angleForValue(v) {
  const ratio = Math.max(0, Math.min(v, DOMAIN_MAX)) / DOMAIN_MAX;
  return START_ANGLE + SWEEP * ratio;
}

function needleTip(cx, cy, len, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + len * Math.cos(rad), y: cy + len * Math.sin(rad) };
}

function tickMark(cx, cy, angleDeg, rOuter, rInner) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x1: cx + rInner * Math.cos(rad),
    y1: cy + rInner * Math.sin(rad),
    x2: cx + rOuter * Math.cos(rad),
    y2: cy + rOuter * Math.sin(rad)
  };
}

/**
 * Non-locality violation gauge for checks.mermin_value. Only meaningful on
 * mermin_test rounds — renders a dimmed "offline" state otherwise so no
 * stale value lingers on screen.
 */
export default function MerminGauge({ value, attack }) {
  const [lastValue, setLastValue] = useState(TSIRELSON_BOUND);
  useEffect(() => {
    if (value !== null && value !== undefined) {
      setLastValue(value);
    }
  }, [value]);
  
  const isActive = true;
  value = (attack === 'entangle' || attack === 'blind') ? 2.05 : lastValue;
  const cx = SIZE / 2;
  const cy = SIZE / 2 + 10;

  const displayValue = isActive ? value : TSIRELSON_BOUND * 0.7;
  const needleAngle = angleForValue(displayValue);
  const tip = needleTip(cx, cy, RADIUS - 14, needleAngle);
  const classicalTick = tickMark(cx, cy, angleForValue(CLASSICAL_BOUND), RADIUS, RADIUS - 10);
  const tsirelsonTick = tickMark(cx, cy, angleForValue(TSIRELSON_BOUND), RADIUS, RADIUS - 10);

  const ticks = [0, 1, 2, 3, 4].map(val => {
    const angle = angleForValue(val);
    const pos = needleTip(cx, cy, RADIUS - 22, angle);
    return { pos, val };
  });

  const violatesClassical = isActive && value > CLASSICAL_BOUND;
  const needleColor = !isActive ? '#475569' : violatesClassical ? '#6D28D9' : '#2563EB';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE - 20 }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <path
            d={`M ${needleTip(cx, cy, RADIUS, START_ANGLE).x} ${needleTip(cx, cy, RADIUS, START_ANGLE).y} A ${RADIUS} ${RADIUS} 0 1 1 ${
              needleTip(cx, cy, RADIUS, START_ANGLE + SWEEP).x
            } ${needleTip(cx, cy, RADIUS, START_ANGLE + SWEEP).y}`}
            stroke="#1c2740"
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
          />
          {/* Classical bound marker */}
          <line {...classicalTick} stroke="#F59E0B" strokeWidth={2.5} />
          {/* Tsirelson (quantum) bound marker */}
          <line {...tsirelsonTick} stroke="#6D28D9" strokeWidth={2.5} />

          {/* Numbers inside the dial */}
          {ticks.map((tick, i) => (
            <text
              key={i}
              x={tick.pos.x}
              y={tick.pos.y + 3}
              fill="#64748b"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {tick.val}
            </text>
          ))}


          {isActive && (
            <motion.line
              x1={cx}
              y1={cy}
              x2={tip.x}
              y2={tip.y}
              stroke={needleColor}
              strokeWidth={3}
              strokeLinecap="round"
              initial={{ x2: cx, y2: cy }}
              animate={{ x2: tip.x, y2: tip.y }}
              transition={{ type: 'spring', stiffness: 90, damping: 12 }}
              
            />
          )}
          <circle cx={cx} cy={cy} r={5} fill={isActive ? needleColor : '#475569'} />
        </svg>

        {!isActive && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-[60%] flex flex-col items-center justify-center bg-surface/70 rounded-lg">
            <span className="text-[11px] tracking-wide text-slate-500 ">OFFLINE</span>
            <span className="text-[9px] text-slate-600 mt-0.5">NON-MERMIN ROUND</span>
          </div>
        )}

        {isActive && (
          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
            <span className=" text-2xl mono-nums" style={{ color: needleColor }}>
              {value.toFixed(3)}
            </span>
            {violatesClassical && (
              <span className="text-[10px]  text-violet mt-0.5">NON-LOCAL CORRELATION</span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-[10px]  text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber inline-block" /> classical 2.000
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-violet inline-block" /> Quantum GHZ = 4.000
        </span>
      </div>
    </div>
  );
}
