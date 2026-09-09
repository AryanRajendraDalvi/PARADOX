import fs from 'fs';
let text = fs.readFileSync('src/components/ChatPanel.jsx', 'utf8');

const regexEnd = /            \}\)\)\r?\n          <\/AnimatePresence>/g;
const replaceEnd = `            ))}
            {isDrawingGHZ && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-end pl-8 mb-2 mt-2">
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