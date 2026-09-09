import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Add imports
if 'node:child_process' not in text:
    text = "import { spawn } from 'node:child_process';\nimport readline from 'node:readline';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\n" + text

# Replace mock engine
mock_regex = r"const ATTACKS = \['none', 'intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge'\];.*?setInterval\(broadcastRoundUpdate, 900\);"
replacement = """const ATTACKS = ['none', 'intercept', 'entangle', 'replay', 'batchNoise', 'blind', 'macForge'];

let simProcess = null;
let eventQueue = [];
let simInterval = null;

export function spawnSimulator(attackType) {
  if (simProcess) {
    simProcess.kill();
    simProcess = null;
  }
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
  eventQueue = [];
  
  const env = Object.assign({}, process.env);
  env.PATH = 'C:\\\\msys64\\\\ucrt64\\\\bin;' + (env.PATH || '');

  const qdsDir = path.resolve(__dirname, '../../../../qds_framework');
  simProcess = spawn('./qds_sim.exe', ['--rounds', '1000', '--attack', attackType], { cwd: qdsDir, env });
  
  const rl = readline.createInterface({
    input: simProcess.stdout,
    crlfDelay: Infinity
  });
  
  rl.on('line', (line) => {
    if (line.startsWith('{')) {
      try {
        const obj = JSON.parse(line);
        obj.session_id = qdsSession.session_id;
        eventQueue.push(obj);
      } catch (e) {}
    }
  });

  simInterval = setInterval(() => {
    if (eventQueue.length > 0) {
      const full = eventQueue.shift();
      for (const conn of connections.values()) {
        send(conn.ws, 'ROUND_UPDATE', filterFrameForAccountType(full, conn.account_type));
      }
    } else if (simProcess === null) {
      clearInterval(simInterval);
    }
  }, 900);
  
  simProcess.on('close', () => {
    simProcess = null;
  });
}
// Start initial simulation
spawnSimulator('none');
"""
text = re.sub(mock_regex, replacement, text, flags=re.DOTALL)

# Replace START command logic
start_regex = r"if \(msg\.command === 'START'\) \{.*?roundId = 0; // matches confirmed backend behavior: resets per attack switch\s*return;"
start_replacement = """if (msg.command === 'START') {
      if (identity.account_type !== 'admin') return;
      const nextAttack = ATTACKS.includes(msg.attack) ? msg.attack : 'none';
      qdsSession.session_id = 'run-' + crypto.randomUUID(); // Reset session
      spawnSimulator(nextAttack);
      return;"""
text = re.sub(start_regex, start_replacement, text, flags=re.DOTALL)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)