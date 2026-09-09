import re
with open('src/components/MerminGauge.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

ticks_js = """
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
"""

text = text.replace("""
  const cx = SIZE / 2;
  const cy = SIZE / 2 + 10;

  const displayValue = isActive ? value : TSIRELSON_BOUND * 0.7;
  const needleAngle = angleForValue(displayValue);
  const tip = needleTip(cx, cy, RADIUS - 14, needleAngle);
  const classicalTick = tickMark(cx, cy, angleForValue(CLASSICAL_BOUND), RADIUS, RADIUS - 10);
  const tsirelsonTick = tickMark(cx, cy, angleForValue(TSIRELSON_BOUND), RADIUS, RADIUS - 10);
""", ticks_js)

ticks_svg = """          {/* Tsirelson (quantum) bound marker */}
          <line {...tsirelsonTick} stroke="#9d00ff" strokeWidth={2.5} />

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
"""

text = text.replace("""          {/* Tsirelson (quantum) bound marker */}
          <line {...tsirelsonTick} stroke="#9d00ff" strokeWidth={2.5} />""", ticks_svg)

with open('src/components/MerminGauge.jsx', 'w', encoding='utf-8') as f:
    f.write(text)