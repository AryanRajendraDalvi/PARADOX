import re

with open('src/views/AdminView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Hoeffding ArcGauge
qber_old = """                    <ArcGauge
                      label="Decoy QBER"
                      value={frame?.checks?.decoy_qber ?? 0}
                      threshold={frame?.checks?.tau_hoeffding ?? 0.061}
                      domainMax={0.15}
                    />"""

qber_new = """                    <ArcGauge
                      label="Decoy QBER"
                      value={frame?.checks?.decoy_qber ?? 0}
                      threshold={frame?.checks?.tau_hoeffding ?? 0.061}
                      domainMax={0.15}
                      epsilon={frame?.checks?.composable_epsilon}
                    />"""
text = text.replace(qber_old, qber_new)

with open('src/views/AdminView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)