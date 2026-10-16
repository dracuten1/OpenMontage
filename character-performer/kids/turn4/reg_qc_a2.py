#!/usr/bin/env python
"""TASK_TURN4_A2 — reg measurement + numeric QC.

Measures alpha-bbox reg {w,h,t,b,cx,chf,cwf} for the 4 canon frames + the 4
existing m0/run2 chain frames (t/b in PX per remake/reg.json convention the
comp normalizes: t/h, b/h), APPENDS 8 new keys to remake/reg.json without
touching existing entries, and writes qc_a2.json with canon residuals
(vs chain m0), transparent% and gen seconds.
"""
import json
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[3]
RAB = REPO / "remotion-composer/public/character-performer/kids/sprite_lib/rabbit"
PROBE = REPO / "character-performer/kids/turn4/probe"
REG_JSON = (
    REPO / "remotion-composer/public/character-performer/kids/remake/reg.json"
)

KEYS = [
    ("rabbit_back_m0", RAB / "rabbit_back_m0.png"),
    ("rabbit_back_run2", RAB / "rabbit_back_run2.png"),
    ("rabbit_back_run3", RAB / "rabbit_back_run3.png"),
    ("rabbit_back_run4", RAB / "rabbit_back_run4.png"),
    ("rabbit_front_run_m0", RAB / "rabbit_front_run_m0.png"),
    ("rabbit_front_run2", RAB / "rabbit_front_run2.png"),
    ("rabbit_front_run3", RAB / "rabbit_front_run3.png"),
    ("rabbit_front_run4", RAB / "rabbit_front_run4.png"),
]


def measure(path: Path) -> dict:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    bb = im.getchannel("A").getbbox()
    hist = im.getchannel("A").histogram()
    transp = sum(hist[:8]) / (w * h) * 100.0
    return {
        "w": w, "h": h,
        "t": bb[1], "b": bb[3] - 1,
        "cx": round(((bb[0] + bb[2]) / 2) / w, 5),
        "chf": round((bb[3] - bb[1]) / h, 5),
        "cwf": round((bb[2] - bb[0]) / w, 5),
        "transp_pct": round(transp, 1),
    }


def main() -> None:
    reg = json.loads(REG_JSON.read_text())
    qc = {"task": "TASK_TURN4_A2", "frames": {}, "residuals": {}}
    for key, path in KEYS:
        if not path.exists():
            print(f"[{key}] MISSING {path}", flush=True)
            continue
        m = measure(path)
        qc["frames"][key] = {"path": str(path.relative_to(REPO)), **m}
        if key not in reg:  # append-only, never touch existing entries
            reg[key] = {k: m[k] for k in ("w", "h", "t", "b", "cx", "chf", "cwf")}
        print(f"[{key}] {m['w']}x{m['h']} t={m['t']} b={m['b']} cx={m['cx']} "
              f"chf={m['chf']} cwf={m['cwf']} transp={m['transp_pct']}%", flush=True)
    # canon residuals vs chain m0 (fractions)
    for chain, m0k in (("back", "rabbit_back_m0"), ("front", "rabbit_front_run_m0")):
        m0 = qc["frames"][m0k]
        for fr in ("run2", "run3", "run4"):
            k = f"rabbit_{chain}_{fr}" if chain == "back" else f"rabbit_front_{fr}"
            if k not in qc["frames"]:
                continue
            f = qc["frames"][k]
            qc["residuals"][k] = {
                "cx_res": round(f["cx"] - m0["cx"], 5),
                "cwf_res": round(f["cwf"] - m0["cwf"], 5),
                "b_res": round(f["b"] / f["h"] - m0["b"] / m0["h"], 5),
            }
            print(f"[res {k}] {qc['residuals'][k]}", flush=True)
    # gen seconds from logs
    for src, tag in ((PROBE / "gen_log.json", "run3"), (PROBE / "gen_log_run4.json", "run4")):
        if src.exists():
            for img in json.loads(src.read_text()).get("images", []):
                qc.setdefault("gen", {})[img["file"]] = {
                    "seconds": img.get("seconds"), "attempt": img.get("attempt"),
                    "exit": img.get("exit"), "raw_size": img.get("size"),
                    "raw_transp_pct": img.get("transparent_pct"),
                }
    REG_JSON.write_text(json.dumps(reg, indent=2) + "\n")
    out = PROBE / "qc_a2.json"
    out.write_text(json.dumps(qc, indent=2))
    print(f"REG appended -> {REG_JSON.relative_to(REPO)} ({len(reg)} keys); "
          f"QC -> {out.relative_to(REPO)}", flush=True)


if __name__ == "__main__":
    main()
