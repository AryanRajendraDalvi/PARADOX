import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace AnimatePresence end tag
text = re.sub(r'(\s*)\}\)\)(\s*)</AnimatePresence>', r'\1}))\2  {isDrawingGHZ && (\2    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-end pl-8 mb-2 mt-2">\2      <div className="max-w-[80%] rounded-lg px-3 py-2 border border-violet/30 bg-violet/5">\2        <div className="flex items-center gap-2 mb-1">\2          <span className="text-[10px] font-mono uppercase tracking-wide text-violet animate-pulse">\2            Allocating GHZ Resource Batch...\2          </span>\2        </div>\2        <div className="text-[10px] font-mono text-slate-400">\2          Requesting fresh quantum correlation from hardware...\2        </div>\2      </div>\2    </motion.div>\2  )}\2</AnimatePresence>', text)

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)