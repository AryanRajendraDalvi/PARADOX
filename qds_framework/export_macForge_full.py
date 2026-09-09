import subprocess
import os

my_env = os.environ.copy()
my_env['PATH'] = 'C:\\msys64\\ucrt64\\bin;' + my_env.get('PATH', '')

cmd = ['./qds_sim.exe', '--rounds', '1000', '--attack', 'macForge']
result = subprocess.run(cmd, env=my_env, capture_output=True, text=True, encoding='utf-8')
with open('simulation_events_macForge.json', 'w', encoding='utf-8', newline='\n') as f:
    f.write(result.stdout)