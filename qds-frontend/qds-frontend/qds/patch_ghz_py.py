import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace handleSend
match1 = re.search(r'const handleSend = \(e\) => \{.*?setDraft\(\'\'\);\n  \};', text, re.DOTALL)
if match1:
    replacement1 = """const [isDrawingGHZ, setIsDrawingGHZ] = useState(false);
  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canSend || isDrawingGHZ) return;
    
    setIsDrawingGHZ(true);
    setDraft('');
    
    setTimeout(() => {
       setIsDrawingGHZ(false);
       sendMessage(text, selectedRecipient);
    }, 3000);
  };"""
    text = text[:match1.start()] + replacement1 + text[match1.end():]

# Replace AnimatePresence
match2 = re.search(r' {12}\}\)\)\n {10}<\/AnimatePresence>', text)
if match2:
    replacement2 = """            ))}
            {isDrawingGHZ && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-end pl-8 mb-2">
                <div className="max-w-[80%] rounded-lg px-3 py-2 border border-violet/30 bg-violet/5">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-mono uppercase tracking-wide text-violet animate-pulse">
                       Allocating GHZ Resource Batch...
                     </span>
                   </div>
                   <div className="text-[10px] font-mono text-slate-400">
                     Requesting fresh quantum correlation from hardware...
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>"""
    text = text[:match2.start()] + replacement2 + text[match2.end():]

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)