#!/usr/bin/env python
"""TASK_TURN4_A2 — canon width-driven (method turn-2 da kiem chung).

Usage: canon_run34.py 3|4   (3 = canon raw run3 probes, 4 = canon raw run4)
For each raw frame: scale content (alpha bbox) so content WIDTH == m0 content
width, paste centered on m0 content center-x, bottom row pinned to m0 bottom
row, canvas = m0 dims. Pixel content preserved (crop+LANCZOS resize only).
Gate: |cx-cx_m0|<=0.002, |cwf-cwf_m0|<=0.002, |b-b_m0|<=0.001 (re-measured).
"""
import json
import sys
from datetime import datetime
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[3]
RAB = REPO / "remotion-composer/public/character-performer/kids/sprite_lib/rabbit"
RAW = REPO / "character-performer/kids/turn4/probe"

CHAINS = {
    "back": {
        "m0": RAB / "rabbit_back_m0.png",
        "raw": RAW / "rabbit_back_run{n}.png",
        "out": RAB / "rabbit_back_run{n}.png",
    },
    "front": {
        "m0": RAB / "rabbit_front_run_m0.png",
        "raw": RAW / "rabbit_front_run{n}.png",
        "out": RAB / "rabbit_front_run{n}.png",
    },
}
TOL_CX, TOL_CWF, TOL_B = 0.002, 0.002, 0.001


def metrics(im: Image.Image) -> dict:
    w, h = im.size
    bb = im.getchannel("A").getbbox()
    return {
        "w": w, "h": h, "bb": bb,
        "cx": ((bb[0] + bb[2]) / 2) / w,
        "cwf": (bb[2] - bb[0]) / w,
        "b": (bb[3] - 1) / h,
        "t": bb[1],
    }


def canon(raw_path: Path, m0_path: Path, out_path: Path) -> dict:
    m0 = Image.open(m0_path).convert("RGBA")
    mm = metrics(m0)
    mx0, my1 = mm["bb"][0], mm["bb"][3]
    m_cw = mm["bb"][2] - mx0
    raw = Image.open(raw_path).convert("RGBA")
    rm = metrics(raw)
    rbb = rm["bb"]
    r_cw = rbb[2] - rbb[0]
    scale = m_cw / r_cw
    content = raw.crop(rbb)
    new_w = round(r_cw * scale)          # == m_cw (±0 from rounding)
    new_h = round((rbb[3] - rbb[1]) * scale)
    content = content.resize((new_w, new_h), Image.LANCZOS)
    # Preserve m0's bottom margin; if scaled content is taller than m0's
    # content box, PAD the canvas at top (task allows crop/pad; content
    # pixels are never cropped). Both chain m0s touch the canvas bottom
    # edge (margin 0), so padding keeps b ~ 1 within tolerance.
    margin = mm["h"] - my1
    canvas_h = max(mm["h"], margin + new_h)
    canvas = Image.new("RGBA", (mm["w"], canvas_h), (0, 0, 0, 0))
    px = round((mx0 + mm["bb"][2]) / 2) - round(new_w / 2)   # center-x = m0
    py = canvas_h - margin - new_h                           # bottom row = m0
    assert py >= 0 and px >= 0, f"negative paste {raw_path.name} ({px},{py})"
    canvas.paste(content, (px, py))
    canvas.save(out_path)
    cm = metrics(canvas)
    res = {
        "out": str(out_path.relative_to(REPO)),
        "raw": str(raw_path.relative_to(REPO)),
        "m0": str(m0_path.relative_to(REPO)),
        "scale": round(scale, 5), "paste": [px, py],
        "cx_res": round(cm["cx"] - mm["cx"], 5),
        "cwf_res": round(cm["cwf"] - mm["cwf"], 5),
        "b_res": round(cm["b"] - mm["b"], 5),
        "canon_w": cm["w"], "canon_h": cm["h"],
        "content_h_scaled": new_h, "content_h_m0": mm["bb"][3] - mm["bb"][1],
    }
    res["pass"] = (
        abs(res["cx_res"]) <= TOL_CX
        and abs(res["cwf_res"]) <= TOL_CWF
        and abs(res["b_res"]) <= TOL_B
    )
    return res


def main() -> None:
    n = sys.argv[1] if len(sys.argv) > 1 else ""
    if n not in ("3", "4"):
        sys.exit("usage: canon_run34.py 3|4")
    log = {"task": "TASK_TURN4_A2", "stage": f"run{n}", "frames": []}
    for view, spec in CHAINS.items():
        raw_path = Path(str(spec["raw"]).format(n=n))
        out_path = Path(str(spec["out"]).format(n=n))
        if not raw_path.exists():
            print(f"[{view}_run{n}] RAW MISSING: {raw_path}", flush=True)
            log["frames"].append({"view": view, "error": f"missing {raw_path}"})
            continue
        entry = canon(raw_path, spec["m0"], out_path)
        entry["view"] = f"{view}_run{n}"
        log["frames"].append(entry)
        print(f"[{entry['view']}] pass={entry['pass']} cx_res={entry['cx_res']} "
              f"cwf_res={entry['cwf_res']} b_res={entry['b_res']}", flush=True)
    log["finished"] = datetime.now().isoformat(timespec="seconds")
    lp = RAW / f"canon_log_run{n}.json"
    lp.write_text(json.dumps(log, indent=2))
    print(f"DONE canon run{n} exits={[f.get('pass') for f in log['frames']]}", flush=True)


if __name__ == "__main__":
    main()
