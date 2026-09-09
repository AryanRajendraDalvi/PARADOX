import re
with open('src/views/AdminView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure useAuth is imported
if 'useAuth' not in text:
    text = text.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useAuth } from '../auth/AuthContext.jsx';")

# Add logout hook
match_state = re.search(r'const \[theme, setTheme\] = useState\(\'dark\'\);', text)
if match_state:
    text = text[:match_state.end()] + "\n  const { logout } = useAuth();" + text[match_state.end():]

# Add Sign out button next to Theme Toggle
toggle_block = """{/* Theme Toggle */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`text-xl ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-black'}`}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>"""

new_toggle_block = """{/* Actions */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-6">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`text-xl ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-black'}`}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button onClick={logout} className={`text-sm font-mono tracking-wide ${theme === 'dark' ? 'text-red-500 hover:text-red-400' : 'text-red-600 hover:text-red-500'}`}>
            SIGN OUT
          </button>
        </div>"""

text = text.replace(toggle_block, new_toggle_block)

with open('src/views/AdminView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)