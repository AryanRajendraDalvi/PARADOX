import subprocess
import os

attacks = ['none', 'intercept', 'entangle', 'replay', 'batchNoise', 'blind']

my_env = os.environ.copy()
my_env['PATH'] = 'C:\\msys64\\ucrt64\\bin;' + my_env.get('PATH', '')

for attack in attacks:
    filename = 'simulation_events.json' if attack == 'none' else f'simulation_events_{attack}.json'
    print(f"Generating {filename}...")
    cmd = ['./qds_sim.exe', '--rounds', '1000', '--attack', attack]
    result = subprocess.run(cmd, env=my_env, capture_output=True, text=True, encoding='utf-8')
    with open(filename, 'w', encoding='utf-8', newline='\n') as f:
        f.write(result.stdout)
print("Done regenerating all files as UTF-8.")