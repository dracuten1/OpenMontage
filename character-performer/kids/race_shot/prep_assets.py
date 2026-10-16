"""RACE SHOT asset prep (Phase B, 2026-10-14).

Un-flip (FLIP_TOP_BOTTOM) + copy bone-rig render frames into the Remotion
public tree, then measure registration (union bbox + rest-feet anchor) with
the V2 Sprite field semantics: t/b/cx fractions of the image box, chf = b-t,
cwf = content width fraction. Appends rig_rabbit_run / rig_turtle_walk to
remake/reg.json without touching existing entries.
"""

import json
from PIL import Image

ROOT = "/Users/tuyennguyen/project/OpenMontage"
RAB_SRC = f"{ROOT}/character-performer/kids/rig_demo/out/frames"
TUR_SRC = f"{ROOT}/character-performer/kids/rig_turtle/out/frames_t"
RAB_DST = (
    f"{ROOT}/remotion-composer/public/character-performer/kids/remake/rig_rabbit_run"
)
TUR_DST = (
    f"{ROOT}/remotion-composer/public/character-performer/kids/remake/rig_turtle_walk"
)
REG_JSON = f"{ROOT}/remotion-composer/public/character-performer/kids/remake/reg.json"
BG = f"{ROOT}/remotion-composer/public/character-performer/kids/ep1_v2/bg6_walk.png"


def process(name, src, dst, lo, hi):
    """Un-flip+copy frames lo..hi; return (count, size, union bbox, rest bbox)."""
    import os

    os.makedirs(dst, exist_ok=True)
    n = 0
    sizes = set()
    ux0 = uy0 = 10**9
    ux1 = uy1 = -1
    rest_bb = None
    for i in range(lo, hi + 1):
        p = f"{src}/f{i:04d}.png"
        im = Image.open(p)
        if im.mode != "RGBA":
            im = im.convert("RGBA")
        im = im.transpose(Image.FLIP_TOP_BOTTOM)
        im.save(f"{dst}/f{i:04d}.png")
        n += 1
        sizes.add(im.size)
        bb = im.getchannel("A").getbbox()
        if bb:
            ux0 = min(ux0, bb[0])
            uy0 = min(uy0, bb[1])
            ux1 = max(ux1, bb[2])
            uy1 = max(uy1, bb[3])
        if i == lo:
            rest_bb = bb
    assert len(sizes) == 1, f"{name}: mixed frame sizes {sizes}"
    return n, sizes.pop(), (ux0, uy0, ux1, uy1), rest_bb


def reg_entry(size, union, rest_bb):
    w, h = size
    rest_bottom = rest_bb[3] - 1  # rest-feet anchor row (f0001 bottom row)
    return {
        "w": w,
        "h": h,
        "t": round(union[1] / h, 5),
        "b": round(rest_bottom / h, 5),
        "cx": round(((union[0] + union[2]) / 2) / w, 5),
        "chf": round((rest_bottom - union[1]) / h, 5),
        "cwf": round((union[2] - union[0]) / w, 5),
    }


rab_n, rab_size, rab_union, rab_rest = process("rabbit", RAB_SRC, RAB_DST, 1, 108)
tur_n, tur_size, tur_union, tur_rest = process("turtle", TUR_SRC, TUR_DST, 1, 97)

rab_reg = reg_entry(rab_size, rab_union, rab_rest)
tur_reg = reg_entry(tur_size, tur_union, tur_rest)

with open(REG_JSON) as f:
    reg = json.load(f)
assert "rig_rabbit_run" not in reg and "rig_turtle_walk" not in reg
reg["rig_rabbit_run"] = rab_reg
reg["rig_turtle_walk"] = tur_reg
with open(REG_JSON, "w") as f:
    json.dump(reg, f, indent=2)
    f.write("\n")

bg = Image.open(BG)
out = {
    "rabbit": {
        "count": rab_n,
        "size": list(rab_size),
        "union_bbox_px": list(rab_union),
        "rest_bbox_f0001_px": list(rab_rest),
        "feet_gap_f0001_px": rab_size[1] - rab_rest[3],
        "reg": rab_reg,
    },
    "turtle": {
        "count": tur_n,
        "size": list(tur_size),
        "union_bbox_px": list(tur_union),
        "rest_bbox_f0001_px": list(tur_rest),
        "feet_gap_f0001_px": tur_size[1] - tur_rest[3],
        "reg": tur_reg,
    },
    "bg6_walk_size": list(bg.size),
}
with open(f"{ROOT}/character-performer/kids/race_shot/prep_out.json", "w") as f:
    json.dump(out, f, indent=2)
print(json.dumps(out, indent=2))
