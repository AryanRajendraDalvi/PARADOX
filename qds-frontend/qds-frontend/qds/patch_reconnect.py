import re

with open('src/hooks/useSocket.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the useEffect block to add auto-reconnect
regex = r"  useEffect\(\(\) => \{\n    const connect = \(\) => \{\n      const ws = new WebSocket\(url\);\n      wsRef\.current = ws;\n\n      ws\.onopen = \(\) => \{\n        setConnection\('online'\);\n        if \(token\) \{\n          ws\.send\(JSON\.stringify\(\{ type: 'IDENTIFY', token \}\)\);\n        \}\n      \};\n\n      ws\.onclose = \(\) => \{\n        setConnection\('offline'\);\n      \};"
replacement = """  useEffect(() => {
    let reconnectTimer;
    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnection('online');
        if (token) {
          ws.send(JSON.stringify({ type: 'IDENTIFY', token }));
        }
      };

      ws.onclose = () => {
        setConnection('offline');
        reconnectTimer = setTimeout(connect, 2000);
      };"""
text = re.sub(regex, replacement, text)

cleanup_regex = r"    return \(\) => \{\n      if \(wsRef\.current\) \{\n        wsRef\.current\.close\(\);\n      \}\n    \};"
cleanup_replacement = """    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };"""
text = re.sub(cleanup_regex, cleanup_replacement, text)

with open('src/hooks/useSocket.js', 'w', encoding='utf-8') as f:
    f.write(text)