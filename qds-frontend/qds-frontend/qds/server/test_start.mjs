import { WebSocket } from 'ws';

fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'password' })
})
.then(res => res.json())
.then(data => {
  console.log("Token:", data.token);
  const ws = new WebSocket(`ws://localhost:4000/?token=${data.token}`);
  ws.on('open', () => {
    console.log("WS open, sending START");
    ws.send(JSON.stringify({ command: 'START', attack: 'intercept' }));
    setTimeout(() => process.exit(0), 1000);
  });
})
.catch(console.error);