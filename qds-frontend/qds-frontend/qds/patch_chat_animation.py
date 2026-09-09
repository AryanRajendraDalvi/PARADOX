import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

verify_func_regex = r"  const startVerification = \(\) => \{\n    setVerifyPhase\(1\);\n    setTimeout\(\(\) => setVerifyPhase\(2\), 1500\);\n    setTimeout\(\(\) => setVerifyPhase\(3\), 3000\);\n    setTimeout\(\(\) => setVerifyPhase\(4\), 4500\);\n    setTimeout\(\(\) => \{\n      setVerifyPhase\(5\);\n      sendCommand\(\{ command: 'UNLOCK_MESSAGE', message_id: msg\.id \}\);\n    \}, 6000\);\n  \};"

verify_func_replacement = """  const startVerification = () => {
    setVerifyPhase(1);
    sendCommand({ command: 'UNLOCK_MESSAGE', message_id: msg.id });
  };
  
  useEffect(() => {
    if (verifyPhase === 1) {
       if (msg.failure_type === 'stalled') {
          // Intercept/Entangle: Stalled
          setTimeout(() => setVerifyPhase(2), 1500);
          setTimeout(() => setVerifyPhase(3), 3000);
          // HANGS AT 3
       } else if (msg.failure_type === 'gradual') {
          // BatchNoise: Gradual degradation
          setTimeout(() => setVerifyPhase(2), 1500);
          setTimeout(() => setVerifyPhase(3), 3000);
          setTimeout(() => setVerifyPhase(4), 4500);
          // Fails after 4
       } else {
          // Normal or Broken-Seal
          setTimeout(() => setVerifyPhase(2), 1500);
          setTimeout(() => setVerifyPhase(3), 3000);
          setTimeout(() => setVerifyPhase(4), 4500);
          setTimeout(() => setVerifyPhase(5), 6000);
       }
    }
  }, [verifyPhase, msg.failure_type]);"""
text = re.sub(verify_func_regex, verify_func_replacement, text)

# Now update the rendering of the verification steps so they don't disappear when verification_failed is true.
render_regex = r"                 \{msg\.verification_failed \? \(\n                    <div className=\"text-\[10px\] text-crimson animate-pulse uppercase\">Verification Failed: \{msg\.failure_reason || 'MAC MISMATCH'\}!</div>\n                 \) : verifyPhase === 0 \? \(\n                    <button \n                      onClick=\{startVerification\}\n                      className=\"w-full text-xs font-mono bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded py-1 transition-colors\"\n                    >\n                      EXECUTE QUANTUM VERIFICATION\n                    </button>\n                 \) : \(\n                    <div className=\"text-\[10px\] font-mono text-cyan space-y-1\">\n                      <motion\.div initial=\{\{ opacity: 0 \}\} animate=\{\{ opacity: 1 \}\}>\n                        <span className=\"text-slate-400\">1\. Correlating GHZ State\.\.\.</span> \[OK\]\n                      </motion\.div>\n                      \{verifyPhase >= 2 && \(\n                        <motion\.div initial=\{\{ opacity: 0 \}\} animate=\{\{ opacity: 1 \}\}>\n                          <span className=\"text-slate-400\">2\. Alice's classical broadcast:</span> |\{aBits\}⟩\n                        </motion\.div>\n                      \)\}\n                      \{verifyPhase >= 3 && \(\n                        <motion\.div initial=\{\{ opacity: 0 \}\} animate=\{\{ opacity: 1 \}\}>\n                          <span className=\"text-slate-400\">3\. Applying Paulis:</span> Bob\(\{bPauli\}\), Charlie\(\{cPauli\}\)\n                        </motion\.div>\n                      \)\}\n                      \{verifyPhase >= 4 && \(\n                        <motion\.div initial=\{\{ opacity: 0 \}\} animate=\{\{ opacity: 1 \}\}>\n                          <span className=\"text-slate-400\">4\. Charlie's measurement:</span> \{cOut\} → Merging pattern\.\.\.\n                        </motion\.div>\n                      \)\}\n                      \{verifyPhase >= 5 && \(\n                        <motion\.div initial=\{\{ opacity: 0 \}\} animate=\{\{ opacity: 1 \}\} className=\"text-green-400 mt-2 font-bold uppercase animate-pulse\">\n                          QDS SIGNATURE VALID!\n                        </motion\.div>\n                      \)\}\n                    </div>\n                 \)\}"

render_replacement = """                 {verifyPhase === 0 && !msg.verification_failed ? (
                    <button 
                      onClick={startVerification}
                      className="w-full text-xs font-mono bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded py-1 transition-colors"
                    >
                      EXECUTE QUANTUM VERIFICATION
                    </button>
                 ) : (
                    <div className="text-[10px] font-mono text-cyan space-y-1">
                      {verifyPhase >= 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">1. Correlating GHZ State...</span> [OK]
                        </motion.div>
                      )}
                      {verifyPhase >= 2 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">2. Alice's classical broadcast:</span> |{aBits}⟩
                        </motion.div>
                      )}
                      {verifyPhase >= 3 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">3. Applying Paulis:</span> Bob({bPauli}), Charlie({cPauli})
                        </motion.div>
                      )}
                      {verifyPhase >= 4 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <span className="text-slate-400">4. Charlie's measurement:</span> {cOut} → Merging pattern...
                        </motion.div>
                      )}
                      
                      {/* Show failure immediately for instant/broken-seal, or after animation for stalled/gradual */}
                      {msg.verification_failed && (msg.failure_type === 'instant' || msg.failure_type === 'broken-seal' || (msg.failure_type === 'stalled' && verifyPhase >= 3) || (msg.failure_type === 'gradual' && verifyPhase >= 4)) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-crimson mt-2 font-bold uppercase animate-pulse">
                          Verification Failed: {msg.failure_reason || 'MAC MISMATCH'}!
                        </motion.div>
                      )}
                      
                      {verifyPhase >= 5 && !msg.verification_failed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 mt-2 font-bold uppercase animate-pulse">
                          QDS SIGNATURE VALID!
                        </motion.div>
                      )}
                    </div>
                 )}"""
text = re.sub(render_regex, render_replacement, text)

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)