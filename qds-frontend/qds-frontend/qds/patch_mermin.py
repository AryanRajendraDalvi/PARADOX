import re

with open('src/components/MerminGauge.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

react_regex = r"import React from 'react';"
react_replacement = "import React, { useState, useEffect } from 'react';"
text = re.sub(react_regex, react_replacement, text)

gauge_regex = r"export default function MerminGauge\(\{ value \}\) \{(.*?)\n\s*const isActive = value !== null && value !== undefined;"
gauge_replacement = """export default function MerminGauge({ value }) {
  const [lastValue, setLastValue] = useState(TSIRELSON_BOUND);
  useEffect(() => {
    if (value !== null && value !== undefined) {
      setLastValue(value);
    }
  }, [value]);
  
  const isActive = true;
  value = lastValue;"""
text = re.sub(gauge_regex, gauge_replacement, text, flags=re.DOTALL)

with open('src/components/MerminGauge.jsx', 'w', encoding='utf-8') as f:
    f.write(text)