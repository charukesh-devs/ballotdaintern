import json
data = json.load(open("C:/Users/saisa/Documents/dataset sai/project/dashboard/public/demographics.json"))
states = data["states"]
print("States:", len(states))
for fips, st in list(states.items())[:5]:
    print(f"  {st['abbr']} {st['name']}: pop={st['population']['2023']:,}, growth={st['growth_pct']}%, income=${st['income']:,}")
    a = st["age"]
    print(f"    age: under18={a['under_18']}, 18-24={a['18_to_24']}, 25-44={a['25_to_44']}, 45-64={a['45_to_64']}, 65+={a['65_plus']}")
    r = st["race"]
    print(f"    race: white={r['white']:,}, black={r['black']:,}, hispanic={r['hispanic']:,}, asian={r['asian']:,}")
