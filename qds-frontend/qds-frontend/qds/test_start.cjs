const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:4000/?token=TEST');

ws.on('open', () => {
  ws.send(JSON.stringify({ command: 'START', attack: 'intercept' }));
  setTimeout(() => process.exit(0), 1000);
});