import fs from 'fs';
let text = fs.readFileSync('src/components/ChatPanel.jsx', 'utf8');

// 1. Add state and handleSend logic
const stateMatch = `  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const canSend = !!selectedRecipient && connection === 'live';

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !canSend) return;
    sendMessage(text, selectedRecipient);
    setDraft('');
  };`;

const stateReplace = `  const [draft, setDraft] = useState('');
  const [isDrawingGHZ, setIsDrawingGHZ] = useState(false);
  const listRef = useRef(null);
  const canSend = !!selectedRecipient && connection === 'live';

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, isDrawingGHZ]);

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

text = text.replace(stateMatch, stateReplace);

// 2. Add visual bubble
const loopMatch = `          <AnimatePresence initial={false}>
            {messages.map((msg) => (`;

const loopReplace = `          <AnimatePresence initial={false}>
            {messages.map((msg) => (`;

const exitMatch = `            ))}
          </AnimatePresence>`;

const exitReplace = `            ))}
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

text = text.replace(exitMatch, exitReplace);

fs.writeFileSync('src/components/ChatPanel.jsx', text, 'utf8');