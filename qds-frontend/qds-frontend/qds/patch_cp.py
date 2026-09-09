import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Hide the header in ChatPanel
text = text.replace("export default function ChatPanel({", "export default function ChatPanel({\n  hideHeader,")
match_header = re.search(r'<div className="flex items-center justify-between px-4 py-2\.5 border-b border-white/5">.*?</div>', text, re.DOTALL)
if match_header:
    text = text[:match_header.start()] + "{!hideHeader && (" + match_header.group(0) + ")}" + text[match_header.end():]

# Remove the outer styling of ChatPanel to let ParticipantView handle it
text = text.replace('className="rounded-lg border border-white/5 bg-surface/60 flex flex-col" style={{ height: 440 }}', 'className="flex flex-col flex-1 h-full bg-transparent"')

# Let's fix the input field to have a circle send button on the right
# The mock shows: <div className="border... input... [O]">
# Current input: <form className="p-3 border-t border-white/5 flex gap-2"> ... button ... </form>
match_form = re.search(r'<form onSubmit={handleSend} className="p-3 border-t border-white/5 flex gap-2 bg-black/20">.*?</form>', text, re.DOTALL)
if match_form:
    replacement = """<form onSubmit={handleSend} className="p-4 flex gap-4 shrink-0 bg-transparent mb-2 mx-4 border border-white/20 rounded-full">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={placeholderText}
          disabled={!recipientInfo || connection !== 'live'}
          className="flex-1 bg-transparent border-none outline-none text-blue-400 placeholder:text-blue-400/50 font-mono text-sm"
        />
        <button
          type="submit"
          disabled={!textInput.trim() || connection !== 'live'}
          className="w-8 h-8 shrink-0 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-colors disabled:opacity-50"
        >
          &uarr;
        </button>
      </form>"""
    text = text[:match_form.start()] + replacement + text[match_form.end():]


with open('src/components/ChatPanel.jsx', 'w', encoding='utf-8') as f:
    f.write(text)