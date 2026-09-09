import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

match_broken = re.search(r"\} else if \(msg\.failure_type === 'broken-seal'\) \{", text)
if match_broken:
    replacement = """} else if (msg.failure_type === 'rogue-verifier') {
             icon = (<svg className="w-4 h-4 text-[#ffb800]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>);
             color = "bg-[#ffb800]/10 border-[#ffb800]/30";
             status = "Quantum Correlation: VALID \u2713 \u2014 Verifier MAC: FAILED \u2717";
             title = "UNAUTHORIZED VERIFICATION";
          } else if (msg.failure_type === 'broken-seal') {"""
    text = text[:match_broken.start()] + replacement + text[match_broken.end():]

# Fix `isVisuallyLocked || msg.failure_type === 'broken-seal' || !isVisuallyLocked` line:
text = text.replace("if (isVisuallyLocked || msg.failure_type === 'broken-seal' || !isVisuallyLocked) {", "if (isVisuallyLocked || msg.failure_type === 'broken-seal' || msg.failure_type === 'rogue-verifier' || !isVisuallyLocked) {")

# Fix text coloring:
text = text.replace("msg.failure_type === 'broken-seal' || \nmsg.failure_type === 'instant' ? 'text-crimson'", "msg.failure_type === 'broken-seal' || msg.failure_type === 'instant' ? 'text-crimson' : msg.failure_type === 'rogue-verifier' ? 'text-[#ffb800]'")
# Actually, the regex might be broken due to multiline in my find/replace, let's use exact match
with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)