import re

with open('src/views/ParticipantView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport { useAuth } from '../auth/AuthContext.jsx';")

match = re.search(r'export default function ParticipantView\(\{.*?\}\) \{', text)
if match:
    text = text[:match.end()] + "\n  const { logout } = useAuth();\n  const [showLogout, setShowLogout] = useState(false);" + text[match.end():]

# In the Connected to Server section:
# <div className="w-5 h-5 rounded-full border-[3px] border-green-500"></div>
# <span className="text-xl">{session.displayName}</span>
match_connection = re.search(r'<div className="flex items-center gap-3 text-blue-400">.*?</div>\n\s*</div>', text, re.DOTALL)
if match_connection:
    replacement = """<div className="relative">
              <div 
                className="flex items-center gap-3 text-blue-400 cursor-pointer"
                onClick={() => setShowLogout(!showLogout)}
              >
                <div className="w-5 h-5 rounded-full border-[3px] border-green-500"></div>
                <span className="text-xl hover:text-white transition-colors">{session.displayName}</span>
              </div>
              <AnimatePresence>
                {showLogout && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={logout}
                    className="absolute bottom-10 left-0 bg-red-900/80 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg border border-red-500/50 shadow-lg"
                  >
                    Sign Out
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>"""
    text = text[:match_connection.start()] + replacement + text[match_connection.end():]

with open('src/views/ParticipantView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)