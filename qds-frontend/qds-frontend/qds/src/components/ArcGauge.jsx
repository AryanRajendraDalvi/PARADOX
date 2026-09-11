import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZE = 160;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const START_ANGLE = -210;
const SWEEP = 240;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/**
 * Dynamic threshold arc gauge. Value and threshold share the same
 * domain [0, domainMax]. Fill color runs cyan -> amber -> red as the
 * value approaches and crosses the threshold; a radial ping fires once
 * on the render where the value crosses from below to above.
 */
export default function ArcGauge({
  label,
  value,
  threshold,
  domainMax,
  unit = '',
  formatValue = (v) => v.toFixed(3),
  baseColor = '#2563EB'
}) {
  const wasOverRef = useRef(false);
  const [justCrossed, setJustCrossed] = useState(false);

  const clampedValue = Math.max(0, Math.min(value, domainMax));
  const clampedThreshold = Math.max(0, Math.min(threshold, domainMax));
  const ratio = clampedValue / domainMax;
  const thresholdRatio = clampedThreshold / domainMax;
  const isOver = value >= threshold;
  const proximity = threshold > 0 ? value / threshold : 0;

  useEffect(() => {
    if (isOver && !wasOverRef.current) {
      setJustCrossed(true);
      const t = setTimeout(() => setJustCrossed(false), 900);
      wasOverRef.current = true;
      return () => clearTimeout(t);
    }
    if (!isOver) wasOverRef.current = false;
  }, [isOver]);

  let color = baseColor;
  if (proximity >= 1) color = '#DC2626';
  else if (proximity >= 0.75) color = '#CA8A04';

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const trackPath = arcPath(cx, cy, RADIUS, START_ANGLE, START_ANGLE + SWEEP);
  const valuePath = arcPath(cx, cy, RADIUS, START_ANGLE, START_ANGLE + SWEEP * ratio);
  const thresholdPos = polarToCartesian(cx, cy, RADIUS, START_ANGLE + SWEEP * thresholdRatio);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const angle = START_ANGLE + SWEEP * pct;
    const val = domainMax * pct;
    const pos = polarToCartesian(cx, cy, RADIUS - 18, angle);
    return { pos, val, angle };
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <path d={trackPath} stroke="#1c2740" strokeWidth={STROKE} fill="none" strokeLinecap="round" />
          <motion.path
            d={valuePath}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            initial={false}
            animate={{ d: valuePath, stroke: color }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            
          />
          {/* Threshold tick */}
          <line
            x1={thresholdPos.x}
            y1={thresholdPos.y}
            x2={cx + (thresholdPos.x - cx) * 0.72}
            y2={cy + (thresholdPos.y - cy) * 0.72}
            stroke="#DC2626"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
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
              {formatValue(tick.val)}
            </text>
          ))}

        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className=" text-xl mono-nums" style={{ color }}>
            {formatValue(value)}
            {unit}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">τ {formatValue(threshold)}{unit}</span>
        </div>
        <AnimatePresence>
          {justCrossed && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: '2px solid #DC2626' }}
              initial={{ scale: 0.6, opacity: 0.9 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </div>
      <span className="text-xs tracking-wide text-slate-400">{label}</span>
      <span
        className={`text-[10px]  px-2 py-0.5 rounded-sm ${
          isOver ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
        }`}
      >
        {isOver ? 'THRESHOLD EXCEEDED' : 'NOMINAL'}
      </span>
    </div>
  );
}
