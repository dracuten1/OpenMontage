#!/usr/bin/env python
"""TASK_TURN4_A1 — PIL QC + A/A strips for the 2 probe run3 sprites.

No vision, PIL numbers only. Per image: size, mode, transparent% (gate >=50%),
non-blank check, palette drift vs run2 ref (mean/std abs RGB diff, informational —
these are RAW probes, not canon). Builds A/A strip: ref (run2) | probe (run3)
side by side on checker background, same scale by content height, PIL text labels.
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[3]
REF_DIR = REPO / "remotion-composer/public/character-performer/kids/sprite_lib/rabbit"
PROBE_DIR = REPO / "character-performer/kids/turn4/probe"

PAIRS = [
    {"probe": "rabbit_back_run3.png", "ref": "rabbit_back_run2.png", "strip": "strip_back_run3_AA.png", "label": "back"},
    {"probe": "rabbit_front_run3.png", "ref": "rabbit_front_run2.png", "strip": "strip_front_run3_AA.png", "label": "front"},
]

TARGET_H = 512
PAD = 24
GAP = 24
LABEL_H = 30
def transp_pct(img: Image.Image) -> float:
    hist = img.getchannel("A").histogram()
    return sum(hist[:8]) / (img.width * img.height) * 100.0


def content_scaled(img: Image.Image, target_h: int) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    crop = img.crop(bbox) if bbox else img
    w = max(1, round(crop.width * target_h / crop.height))
    return crop.resize((w, target_h), Image.LANCZOS)


def checker(w: int, h: int, cell: int = 16) -> Image.Image:
    base = Image.new("RGB", (w, h), (238, 238, 238))
    d = ImageDraw.Draw(base)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if (x // cell + y // cell) % 2 == 0:
                d.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(206, 206, 206))
    return base


def font(size: int = 18):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()
def build_strip(ref: Image.Image, probe: Image.Image, out_path: Path) -> str:
    r = content_scaled(ref, TARGET_H)
    p = content_scaled(probe, TARGET_H)
    w = PAD + r.width + GAP + p.width + PAD
    h = LABEL_H + TARGET_H + PAD
    strip = checker(w, h)
    strip.paste(r, (PAD, LABEL_H), r)
    strip.paste(p, (PAD + r.width + GAP, LABEL_H), p)
    d = ImageDraw.Draw(strip)
    f = font(18)
    for text, x0, panel_w in (("run2 (ref)", PAD, r.width), ("run3 (probe)", PAD + r.width + GAP, p.width)):
        tw = d.textlength(text, font=f)
        d.text((x0 + max(0, (panel_w - tw) / 2), 6), text, fill=(40, 40, 40), font=f)
    strip.save(out_path)
    return f"{w}x{h}"


def qc_one(pair: dict) -> dict:
    res = {"name": pair["probe"], "view": pair["label"]}
    probe_path = PROBE_DIR / pair["probe"]
    ref_path = REF_DIR / pair["ref"]
    if not probe_path.exists():
        res["error"] = f"probe missing: {probe_path}"
        return res
    probe = Image.open(probe_path)
    res["raw_mode"] = probe.mode
    probe = probe.convert("RGBA")
    ref = Image.open(ref_path).convert("RGBA")
    res["size"] = f"{probe.width}x{probe.height}"
    res["is_rgba"] = probe.mode == "RGBA"
    tp = transp_pct(probe)
    res["transparent_pct"] = round(tp, 1)
    res["transparent_gate_ge50"] = tp >= 50.0
    opaque = (100.0 - tp) / 100.0
    rgb_std = max(probe.convert("RGB").getchannel(c).getextrema()[1] for c in "RGB")
    res["non_blank"] = opaque > 0.005 and rgb_std > 2
    p_rgb = probe.convert("RGB")
    if p_rgb.size != ref.size:
        p_rgb = p_rgb.resize(ref.size, Image.LANCZOS)
    diff = [abs(a - b) for a, b in zip(p_rgb.convert("RGB").tobytes(), ref.convert("RGB").tobytes())]
    res["drift_rgb_mean"] = round(sum(diff) / len(diff), 2)
    mean = sum(diff) / len(diff)
    res["drift_rgb_std"] = round((sum((d - mean) ** 2 for d in diff) / len(diff)) ** 0.5, 2)
    res["drift_method"] = "probe resized to ref dims, full-frame abs RGB diff"
    strip_path = PROBE_DIR / pair["strip"]
    res["strip"] = str(strip_path.relative_to(REPO))
    res["strip_size"] = build_strip(ref, probe, strip_path)
    return res
def main() -> None:
    results = [qc_one(p) for p in PAIRS]
    out = PROBE_DIR / "qc_results.json"
    out.write_text(json.dumps({"task": "TASK_TURN4_A1", "results": results}, indent=2))
    print(json.dumps({"qc_results": str(out.relative_to(REPO)), "results": results}, indent=2))


if __name__ == "__main__":
    main()
