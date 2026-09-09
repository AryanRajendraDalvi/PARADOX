import re
with open('src/components/ArcGauge.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

ticks_js = """
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
"""

text = text.replace("""
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const trackPath = arcPath(cx, cy, RADIUS, START_ANGLE, START_ANGLE + SWEEP);
  const valuePath = arcPath(cx, cy, RADIUS, START_ANGLE, START_ANGLE + SWEEP * ratio);
  const thresholdPos = polarToCartesian(cx, cy, RADIUS, START_ANGLE + SWEEP * thresholdRatio);
""", ticks_js)

ticks_svg = """          <line
            x1={thresholdPos.x}
            y1={thresholdPos.y}
            x2={cx + (thresholdPos.x - cx) * 0.72}
            y2={cy + (thresholdPos.y - cy) * 0.72}
            stroke="#ff003c"
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
"""

text = text.replace("""          <line
            x1={thresholdPos.x}
            y1={thresholdPos.y}
            x2={cx + (thresholdPos.x - cx) * 0.72}
            y2={cy + (thresholdPos.y - cy) * 0.72}
            stroke="#ff003c"
            strokeWidth={2.5}
            strokeLinecap="round"
          />""", ticks_svg)

with open('src/components/ArcGauge.jsx', 'w', encoding='utf-8') as f:
    f.write(text)