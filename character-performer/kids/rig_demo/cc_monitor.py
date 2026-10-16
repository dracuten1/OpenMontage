import json, glob, os
f = sorted(glob.glob(os.path.expanduser("~/.claude/projects/-Users-tuyennguyen-project-OpenMontage-character-performer-kids-rig-demo/*.jsonl")), key=os.path.getmtime)[-1]
print("FILE", os.path.basename(f), "lines", sum(1 for _ in open(f)))
for line in open(f):
    try: d = json.loads(line)
    except: continue
    t = d.get("type")
    m = d.get("message", {})
    if t == "assistant":
        for c in m.get("content", []):
            if c.get("type") == "tool_use":
                inp = str(c.get("input", {}))[:140].replace("\n", " ")
                print("TOOL", c.get("name"), inp)
            elif c.get("type") == "text":
                print("SAY", c.get("text", "")[:140].replace("\n", " "))
