import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

log_regex = r"simProcess = spawn\('\./qds_sim\.exe', \['--rounds', '1000', '--attack', attackType\], \{ cwd: qdsDir, env \}\);"
log_replacement = """simProcess = spawn('./qds_sim.exe', ['--rounds', '1000', '--attack', attackType], { cwd: qdsDir, env });
  console.log('Spawned simulator with attack:', attackType);
  simProcess.on('error', (err) => console.error('Simulator spawn error:', err));
  simProcess.stderr.on('data', (d) => console.error('Simulator stderr:', d.toString()));"""

text = re.sub(log_regex, log_replacement, text)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)