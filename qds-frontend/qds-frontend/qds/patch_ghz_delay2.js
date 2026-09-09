import fs from 'fs';
let text = fs.readFileSync('src/components/ChatPanel.jsx', 'utf8');

// 1. Regex replace handleSend
const regexHandleSend = /const handleSend = \(e\) => \{[\s\S]*?setDraft\(''\);\r?\n  \};/g;
const replaceHandleSend = `const [isDrawingGHZ, setIsDrawingGHZ] = useState(false);
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
  };`;

text = text.replace(regexHandleSend, replaceHandleSend);

// 2. Regex replace AnimatePresence end
const regexEnd = / {12}\}\)\)\r?\n {10}<\/AnimatePresence>/g;
const replaceEnd = `            ))}
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
          </AnimatePresence>`;

text = text.replace(regexEnd, replaceEnd);

fs.writeFileSync('src/components/ChatPanel.jsx', text, 'utf8');