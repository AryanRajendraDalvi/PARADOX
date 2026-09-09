import json

with open("simulation_events_intercept.json", "r", encoding="utf-16") as f:
    events = [json.loads(line) for line in f if line.strip().startswith("{")]

print(f"Total events: {len(events)}")
tp = sum(1 for e in events if e.get("attack", {}).get("active", False) and e.get("verdict") == "REJECT")
print(f"TP: {tp}")