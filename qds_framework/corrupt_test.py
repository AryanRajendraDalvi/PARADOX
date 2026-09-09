import json
with open('simulation_events_intercept.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()
# duplicate the first mac_tag into the second line
l1 = json.loads(lines[0])
l2 = json.loads(lines[1])
l2['auth']['mac_tag'] = l1['auth']['mac_tag']
lines[1] = json.dumps(l2) + '\n'
with open('simulation_events_intercept_corrupt.json', 'w', encoding='utf-8') as f:
    f.writelines(lines)