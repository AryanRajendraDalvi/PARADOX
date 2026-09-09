import re
with open('src/views/AdminView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add explanations below gauges
decoy_old = """<ArcGauge
                      label="Decoy"
                      value={frame?.checks?.decoy_qber ?? 0}
                      threshold={frame?.checks?.tau_hoeffding ?? 0.061}
                      domainMax={0.18}
                    />
                  </div>
                </div>"""
decoy_new = """<ArcGauge
                      label="Decoy"
                      value={frame?.checks?.decoy_qber ?? 0}
                      threshold={frame?.checks?.tau_hoeffding ?? 0.061}
                      domainMax={0.18}
                    />
                  </div>
                  <div className={`mt-4 text-center max-w-[280px] text-xs font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>If &gt; {((frame?.checks?.tau_hoeffding ?? 0.061)*100).toFixed(1)}%:</strong> Eavesdropper detected in quantum channel (Hoeffding bound). Protocol aborts.
                  </div>
                </div>"""

text = text.replace(decoy_old, decoy_new)

cefb_old = """<ArcGauge
                      label="CEFB Bound"
                      value={frame?.checks?.mismatch_rate ?? 0}
                      threshold={frame?.checks?.tau_cefb ?? 0.089}
                      domainMax={0.18}
                    />
                  </div>
                </div>"""
cefb_new = """<ArcGauge
                      label="CEFB Bound"
                      value={frame?.checks?.mismatch_rate ?? 0}
                      threshold={frame?.checks?.tau_cefb ?? 0.089}
                      domainMax={0.18}
                    />
                  </div>
                  <div className={`mt-4 text-center max-w-[280px] text-xs font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>If &gt; {((frame?.checks?.tau_cefb ?? 0.089)*100).toFixed(1)}%:</strong> Information-theoretic MAC forgery becomes mathematically possible. Protocol aborts.
                  </div>
                </div>"""

text = text.replace(cefb_old, cefb_new)

mermin_old = """<MerminGauge value={frame?.checks?.mermin_value ?? null} />
                  </div>
                </div>"""
mermin_new = """<MerminGauge value={frame?.checks?.mermin_value ?? null} />
                  </div>
                  <div className={`mt-4 text-center max-w-[280px] text-xs font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>If &lt; 2.0:</strong> Local realism holds. Quantum entanglement is broken. Hardware compromised.
                  </div>
                </div>"""

text = text.replace(mermin_old, mermin_new)

with open('src/views/AdminView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)