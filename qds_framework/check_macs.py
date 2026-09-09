import json

with open("simulation_events.json", "r", encoding="utf-8") as f:
    lines = [json.loads(line) for line in f if line.strip().startswith("{")]
    
macs = set()
for l in lines:
    macs.add(l["auth"]["mac_tag"])

print(f"Total distinct MACs across {len(lines)} rounds: {len(macs)}")