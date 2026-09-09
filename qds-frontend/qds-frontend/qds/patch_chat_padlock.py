import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add padlock UI above the text
text_regex = r"        <div className=\"text-sm text-slate-200 whitespace-pre-wrap break-words\">\n          \{msg\.locked \? <span className=\"text-slate-500 italic blur-\[4px\] select-none\">\{msg\.text\.replace\(/./g, \"\*\"\)\}</span> : msg\.text\}\n        </div>"

text_replacement = """        {(() => {
          let icon = (
             <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          );
          let color = "bg-surface border-white/10";
          let status = "Awaiting QDS correlation check...";
          let title = "ENCRYPTED QUANTUM PAYLOAD";

          if (msg.failure_type === 'instant') {
             icon = (<svg className="w-4 h-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
             color = "bg-crimson/10 border-crimson/30";
             status = msg.failure_reason;
             title = "REJECTED";
          } else if (msg.failure_type === 'stalled') {
             icon = (<svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
             color = "bg-amber/10 border-amber/30 animate-pulse";
             status = msg.failure_reason;
          } else if (msg.failure_type === 'gradual') {
             icon = (<svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
             color = "bg-amber/10 border-amber/30 animate-pulse";
             status = msg.failure_reason;
          } else if (msg.failure_type === 'broken-seal') {
             icon = (<svg className="w-4 h-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5L21 3m-4.5 9v1.5a7.5 7.5 0 11-15 0v-6a7.5 7.5 0 0113-5" /></svg>);
             color = "bg-crimson/10 border-crimson/30";
             status = msg.failure_reason;
             title = "MAC VERIFICATION FAILED";
          } else if (!msg.locked) {
             icon = (<svg className="w-4 h-4 text-phosphor" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>);
             color = "bg-phosphor/10 border-phosphor/30";
             status = "Quantum Signature Verified";
             title = "PAYLOAD DECRYPTED";
          }

          if (msg.locked || msg.failure_type === 'broken-seal' || !msg.locked) {
            return (
              <div className="flex items-center gap-3 mb-3 bg-black/20 p-2 rounded border border-white/5">
                 <div className={w-8 h-8 rounded flex items-center justify-center border }>
                   {icon}
                 </div>
                 <div className="overflow-hidden">
                   <div className="text-[10px] font-mono text-slate-400 truncate">{title}</div>
                   <div className={	ext-[9px] font-mono truncate }>{status}</div>
                 </div>
              </div>
            );
          }
          return null;
        })()}
        <div className="text-sm text-slate-200 whitespace-pre-wrap break-words">
          {msg.locked ? <span className="text-slate-500 italic blur-[4px] select-none">{msg.text.replace(/./g, "*")}</span> : msg.text}
        </div>"""
text = re.sub(text_regex, text_replacement, text)

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)