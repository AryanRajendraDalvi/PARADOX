import re
with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

decoy_old = """<ArcGauge
                        label="Hoeffding Threshold"
                        value={latestRound?.checks?.decoy_qber ?? 0}
                        threshold={latestRound?.checks?.tau_hoeffding ?? 0.061}
                        domainMax={0.18}
                      />"""
decoy_new = """<ArcGauge
                        label="Hoeffding Threshold"
                        value={latestRound?.checks?.decoy_qber ?? 0}
                        threshold={latestRound?.checks?.tau_hoeffding ?? 0.061}
                        domainMax={0.18}
                      />
                      <div className={`mt-2 text-center max-w-[200px] text-[10px] font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <strong>If &gt; {((latestRound?.checks?.tau_hoeffding ?? 0.061)*100).toFixed(1)}%:</strong> Eavesdropper detected in quantum channel (Hoeffding bound). Protocol aborts.
                      </div>"""

text = text.replace(decoy_old, decoy_new)

cefb_old = """<ArcGauge
                        label="CEFB Bound"
                        value={latestRound?.checks?.mismatch_rate ?? 0}
                        threshold={latestRound?.checks?.tau_cefb ?? 0.089}
                        domainMax={0.18}
                      />"""
cefb_new = """<ArcGauge
                        label="CEFB Bound"
                        value={latestRound?.checks?.mismatch_rate ?? 0}
                        threshold={latestRound?.checks?.tau_cefb ?? 0.089}
                        domainMax={0.18}
                      />
                      <div className={`mt-2 text-center max-w-[200px] text-[10px] font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <strong>If &gt; {((latestRound?.checks?.tau_cefb ?? 0.089)*100).toFixed(1)}%:</strong> Information-theoretic MAC forgery becomes mathematically possible. Protocol aborts.
                      </div>"""

text = text.replace(cefb_old, cefb_new)

mermin_old = """<MerminGauge value={latestRound?.checks?.mermin_value ?? null} />"""
mermin_new = """<MerminGauge value={latestRound?.checks?.mermin_value ?? null} />
                      <div className={`mt-2 text-center max-w-[200px] text-[10px] font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        <strong>If &lt; 2.0:</strong> Local realism holds. Quantum entanglement is broken. Hardware compromised.
                      </div>"""

text = text.replace(mermin_old, mermin_new)

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)