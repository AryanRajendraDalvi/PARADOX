import re

with open('src/components/ArcGauge.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

sig_old = """export default function ArcGauge({ label, value, threshold, domainMax, unit = '%', formatValue = defaultFormat }) {"""
sig_new = """export default function ArcGauge({ label, value, threshold, domainMax, unit = '%', formatValue = defaultFormat, epsilon = null }) {"""

text = text.replace(sig_old, sig_new)

# Add epsilon overlay near the value display
val_old = """          <div className="text-3xl font-mono font-black" style={{ color }}>
            {formatValue(value)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{label}</div>
        </div>
      </div>
    </div>"""

val_new = """          <div className="text-3xl font-mono font-black" style={{ color }}>
            {formatValue(value)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">{label}</div>
          {epsilon !== null && (
            <div className="text-[9px] font-mono font-bold mt-1 bg-black/60 px-2 py-0.5 rounded text-yellow-400 border border-yellow-500/30">
              ε = {epsilon.toExponential(2)}
            </div>
          )}
        </div>
      </div>
    </div>"""

text = text.replace(val_old, val_new)

with open('src/components/ArcGauge.jsx', 'w', encoding='utf-8') as f:
    f.write(text)