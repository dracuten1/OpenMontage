#!/usr/bin/env python3
"""turn5 prep: compute MID open-cue frames for d0-d3 (Scene 1 mouth probes)."""
import json

BASE = "/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/character-performer/kids/dialogue_v2"
lines = json.load(open(f"{BASE}/timeline.json"))["lines"]
out = {}
for l in lines:
    print(f"d{l['i']} {l['who']:7s} start={l['start']:.2f} dur={l['dur']:.2f}  {l['text'][:45]}")
for i in [0, 1, 2, 3]:
    cues = json.load(open(f"{BASE}/d{i}_cues.json"))["mouthCues"]
    opens = [(c["start"], c["end"], c["value"]) for c in cues if c["value"] in "ABCDEFGH"]
    line = [l for l in lines if l["i"] == i][0]
    lo = max(opens, key=lambda c: c[1] - c[0])
    mid = (lo[0] + lo[1]) / 2
    g = line["start"] + mid
    frm = round(g * 30)
    out[f"d{i}"] = {"cue": lo[2], "local": [round(lo[0], 2), round(lo[1], 2)],
                    "global_s": round(g, 3), "frame": frm}
    print(f"d{i}: cue {lo[2]} local[{lo[0]:.2f},{lo[1]:.2f}] mid={mid:.2f} -> global {g:.3f}s frame {frm}")
json.dump(out, open("/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn5/midcues.json", "w"), indent=1)
print("saved turn5/midcues.json")
