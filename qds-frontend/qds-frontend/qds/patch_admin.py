import re

with open('src/views/AdminView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add import
if 'ClassicalLayerPanel' not in text:
    text = text.replace("import MerminGauge from '../components/MerminGauge.jsx';", "import MerminGauge from '../components/MerminGauge.jsx';\nimport ClassicalLayerPanel from '../components/ClassicalLayerPanel.jsx';")

# Dashboard Tab replacement
dash_old = """              <div className="flex flex-row justify-center gap-12 w-full max-w-5xl mx-auto h-full items-center">
                <div className="flex flex-col items-center">
                  <span className={`mb-2 font-mono uppercase text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>Decoy QBER</span>"""

dash_new = """              <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto h-full justify-center">
                <div className="flex flex-row justify-center gap-12 w-full">
                  <div className="flex flex-col items-center">
                    <span className={`mb-2 font-mono uppercase text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-slate-500'}`}>Decoy QBER</span>"""

text = text.replace(dash_old, dash_new)

dash_end_old = """                  <div className={`mt-4 text-center max-w-[280px] text-xs font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>If &lt; 2.0:</strong> Local realism holds. Quantum entanglement is broken. Hardware compromised.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 pl-6 flex items-center justify-center">
              <NetworkTopology frame={frame} />
            </div>"""

dash_end_new = """                  <div className={`mt-4 text-center max-w-[280px] text-xs font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>If &lt; 2.0:</strong> Local realism holds. Quantum entanglement is broken. Hardware compromised.
                  </div>
                </div>
              </div>

              <div className="mt-8 mx-auto w-full max-w-3xl">
                <ClassicalLayerPanel 
                    theme={theme}
                    active={frame?.threat_model_active}
                    classicalFlags={frame?.classical_flags || []}
                    fpRate={frame?.checks?.fp_rate}
                    fnRate={frame?.checks?.fn_rate}
                />
              </div>
            </div>

            <div className="flex-1 pl-6 flex items-center justify-center">
              <NetworkTopology frame={frame} />
            </div>"""

text = text.replace(dash_end_old, dash_end_new)

with open('src/views/AdminView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)