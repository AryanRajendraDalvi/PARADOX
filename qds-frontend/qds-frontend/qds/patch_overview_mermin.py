import re

with open('src/views/OverviewMasterView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

mermin_regex = r"<MerminGauge value=\{frame\?\.checks\?\.mermin_value \?\? null\} \/>"
mermin_replacement = "<MerminGauge value={frame?.checks?.mermin_value ?? null} attack={frame?.attack?.type} />"
text = re.sub(mermin_regex, mermin_replacement, text)

with open('src/views/OverviewMasterView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)