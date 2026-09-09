import re

with open('src/views/OverviewMasterView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacement = """<QuadrantCard title="QUANTUM / CLASSICAL CHANNEL">
            <NetworkTopology frame={frame} compact />
            
            <div className="mt-4 p-3 rounded-lg border border-white/5 bg-black/40">
              <div className="text-[10px] tracking-wide text-slate-500 mb-2 font-mono">SIMULATION PERFORMANCE METRICS</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400">GHZ TELEPORTATION THROUGHPUT</span>
                  <span className="font-mono text-cyan text-sm">{frame?.performance?.throughput_hz ? Math.round(frame.performance.throughput_hz).toLocaleString() : '---'} sigs/sec</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400">MEAN ROUND LATENCY</span>
                  <span className="font-mono text-cyan text-sm">{frame?.performance?.latency_us ? frame.performance.latency_us.toFixed(2) : '---'} µs</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-slate-500 italic">
                * Note: Traditional BB84 QDS requires O(L) qubit transmissions at signing time, bottlenecking throughput to ~1-10 sigs/sec in physical fiber. This simulation pre-distributes GHZ entanglement, making the signing phase entirely classical.
              </div>
            </div>
          </QuadrantCard>"""

text = text.replace("<QuadrantCard title=\"QUANTUM / CLASSICAL CHANNEL\">\n          <NetworkTopology frame={frame} compact />\n        </QuadrantCard>", replacement)

with open('src/views/OverviewMasterView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)