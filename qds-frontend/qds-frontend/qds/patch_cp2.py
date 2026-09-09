import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

match_form = re.search(r'<form onSubmit=\{handleSend\}.*?</form>', text, re.DOTALL)
if match_form:
    replacement = """<form onSubmit={handleSend} className="p-2 flex gap-4 shrink-0 bg-transparent mb-4 mx-6 border border-white/20 rounded-full items-center">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!canSend}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-blue-400 placeholder:text-blue-400/50 font-mono text-sm px-4"
        />
        <button
          type="submit"
          disabled={!canSend || !draft.trim()}
          className="w-10 h-10 shrink-0 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      </form>"""
    text = text[:match_form.start()] + replacement + text[match_form.end():]

with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)