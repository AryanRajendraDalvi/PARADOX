import re

with open('src/hooks/useSocket.js', 'r', encoding='utf-8') as f:
    text = f.read()

send_old = """  const sendCommand = useCallback((cmd) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    } else if (mockRef.current) {"""

send_new = """  const sendCommand = useCallback((cmd) => {
    console.log("SENDING COMMAND:", cmd);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    } else if (mockRef.current) {"""

text = text.replace(send_old, send_new)

with open('src/hooks/useSocket.js', 'w', encoding='utf-8') as f:
    f.write(text)