"""TASK_DEMO_DEPTH asset generator — 9router cx/gpt-5.6-luna-image ONLY.

I2I contract (fixed 2026-10-11): the local 9router codex adapter builds the
upstream `input_image` block ONLY from the structured request fields
`image` / `images` (string data-URI / base64 / URL). A data URI embedded
inside the `prompt` text is forwarded verbatim as plain text and is NOT
ingested as image input — outputs produced that way are unconditioned
(verified offline against open-sse/handlers/imageProviders/codex.js
buildBody/buildContent). No claim is made about why prompt-embed calls
returned images at all; only that conditioning was not consumed.

Pattern reused from ~/.hermes/cache/scratch/luna_probe.py:
  POST {base}/images/generations, Accept: text/event-stream,
  dual parse (pure JSON -> regex b64_json -> data:image/png;base64),
  background:"transparent" for sprites/strips (luna returns true RGBA).

Each asset: generate -> PIL check (RGBA + transparent% + non-blank
+ identity gates vs anchor for i2i) -> one retry if fail.
Writes <name>.png + <name>.prompt.txt + gen_log.json (append-only).

Usage:
  .venv/bin/python character-performer/kids/assets/depth_demo/gen_assets.py
  .venv/bin/python ... --only turtle_walk           # narrow re-run
  .venv/bin/python ... --only turtle_m0,turtle_mO
"""
import argparse
import base64
import hashlib
import io
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

REPO = Path(__file__).resolve().parents[4]  # depth_demo -> assets -> kids -> character-performer -> repo
OUT_DIR = Path(__file__).resolve().parent

# ---- env (never print the key) ----
load_dotenv(REPO / ".env")
KEY = os.environ.get("OPENAI_API_KEY")
BASE = os.environ.get("OPENAI_BASE_URL", "http://127.0.0.1:20128/v1").rstrip("/")
MODEL = "cx/gpt-5.6-luna-image"  # task rule 1: ONLY this model

STYLE_LOCK = (
    "flat kawaii children's picture-book style, thick dark-brown outlines, "
    "soft pastel colors, gentle cel shading, no text, no watermark"
)
TURTLE_ID = (
    "cute kawaii golden turtle with warm yellow dome shell and olive-green skin, "
    "friendly big brown eyes, smiling, side view, crawling pose, "
    "thick dark-brown outlines, flat pastel children's picture-book style, "
    "gentle cel shading, no text, isolated subject"
)
RABBIT_ID = (
    "kawaii white rabbit with soft cream highlights wearing a red vest with a "
    "single yellow button, thick dark-brown outline"
)
# Textual identity re-statement carried alongside the structured body.image ref.
TURTLE_ID_LOCK = (
    "The reference image is the EXACT character to keep: a flat kawaii cartoon "
    "golden turtle with a warm yellow dome shell and olive-green head and legs, "
    "friendly big brown eyes, thick dark-brown outlines, soft pastel cel shading, "
    "side view FACING RIGHT (head on the right side of the image, tail on the left)"
)
ANTI_DRIFT = (
    "Do NOT change the art style, do NOT flip or mirror the turtle, do NOT turn "
    "the skin yellow, do NOT make it realistic or 3d, keep the head on the RIGHT side"
)

T2I = "t2i"
I2I = "i2i"
EMBED_MAX_SIDE = 1024  # aspect-preserving lossless PNG embed for body.image

JOBS = [
    dict(
        name="bg_far", kind=T2I, size="1536x1024", background="opaque",
        min_transparent=-1,  # opaque full-bleed asset
        prompt=(
            "wide storybook landscape background, pale soft-blue sky with a few gentle "
            "clouds, distant rolling green hills, a faint hazy far-away tree line, "
            "atmospheric perspective with washed-out pale low-detail distance, "
            "open grassy meadow ground across the bottom, "
            f"{STYLE_LOCK}"
        ),
    ),
    dict(
        name="strip_mid", kind=T2I, size="1536x1024", background="transparent",
        prompt=(
            "horizontal scenery strip for layering: a row of soft green bushes and "
            "small rounded trees across the middle, and a wide brown dirt race-track "
            "road covering the bottom 40 percent, NO sky, the entire upper area above "
            "the bushes is fully transparent (alpha 0), road and bushes run across the "
            "full width edge to edge, "
            f"{STYLE_LOCK}, isolated ground layer with transparent background"
        ),
        min_transparent=25.0,
    ),
    dict(
        name="strip_fg", kind=T2I, size="1536x1024", background="transparent",
        prompt=(
            "foreground layer strip: low clusters of vivid green grass tufts and small "
            "pastel flowers (pink, yellow, white) sitting ONLY along the very bottom "
            "edge of the image, the closest layer to the camera so the most saturated "
            "colors, the entire upper 70 percent of the image is fully transparent "
            "(alpha 0), clusters repeat across the full width edge to edge, "
            f"{STYLE_LOCK}, isolated foreground layer with transparent background"
        ),
        min_transparent=25.0,
    ),
    dict(
        name="tree_sleep", kind=T2I, size="1024x1024", background="transparent",
        prompt=(
            "one big friendly oak tree with a thick sturdy trunk and a lush round "
            "leafy green canopy, wide enough shade at the base for a small rabbit to "
            "nap under, full tree visible, isolated subject, fully transparent "
            "background, "
            f"{STYLE_LOCK}, isolated subject on transparent background"
        ),
    ),
    dict(
        name="turtle_base", kind=T2I, size="1024x1024", background="transparent",
        prompt=(
            f"{TURTLE_ID}, {STYLE_LOCK}, fully transparent background, single turtle "
            "centered, side view facing right"
        ),
        min_transparent=25.0,
    ),
    dict(
        name="rabbit_sleep", kind=T2I, size="1024x1024", background="transparent",
        prompt=(
            f"{RABBIT_ID}, sleeping peacefully curled up in a ball, eyes closed with "
            "gentle curved eyelids, long ears relaxed drooping over the body, paws "
            "tucked in, leaning against a tree trunk base, do NOT draw any z letters "
            "or sleep symbols, side view, full body, "
            f"{STYLE_LOCK}, isolated subject on transparent background"
        ),
        min_transparent=25.0,
    ),
]


def img2img(name, src, change, gates):
    # source png is resolved lazily at run time (anchor must exist & be approved first)
    return dict(
        name=name, kind=I2I, size="auto", background="transparent",
        min_transparent=25.0,
        src=src,
        change=change,
        gates=gates,
    )


# Identity gates v2 (recalibrated 2026-10-11): v1 used a saturated-olive
# detector that even the anchor turtle_base fails (base skin = soft pastel
# olive, measures 0.0009). v2 gates: green-DOMINANT skin fraction (g>=r,
# g>b+6, g>70 — tolerant of pastel olive), yellow shell fraction, green
# centroid (facing), bbox registration. Relative gates compare to the anchor.
JOBS += [
    img2img(
        "turtle_walk",
        "turtle_base.png",
        "redraw this SAME turtle IDENTICALLY in a crawling pose mid-step with the "
        "front leg extended forward, mouth gently closed, eyes open and friendly",
        dict(green_floor=0.10, yellow_floor=0.30),
    ),
    img2img(
        "turtle_m0",
        "turtle_walk.png",
        "redraw this SAME turtle IDENTICALLY - same pose, same colors, same size, "
        "same framing, same facing direction - and change ONLY the mouth: mouth "
        "gently closed with a small friendly smile, eyes open normally",
        dict(rel_green=0.6, rel_yellow=0.6, reg=True),
    ),
    img2img(
        "turtle_mO",
        "turtle_walk.png",
        "redraw this SAME turtle IDENTICALLY - same pose, same colors, same size, "
        "same framing, same facing direction - and change ONLY the mouth: mouth "
        "open in a small round shape like saying the vowel 'o', eyes open normally",
        dict(rel_green=0.6, rel_yellow=0.6, reg=True),
    ),
]


def job_prompt(job):
    """Pure-text prompt. The conditioning image travels in body.image, never here."""
    if job["kind"] == T2I:
        return job["prompt"]
    return (
        f"{TURTLE_ID_LOCK}. Using the attached reference image as the exact same "
        f"character: {job['change']}. {ANTI_DRIFT}. {STYLE_LOCK}, "
        "fully transparent background"
    )


def ref_uri(job):
    """Aspect-preserving lossless PNG data URI of the anchor for body.image."""
    from PIL import Image

    src_path = OUT_DIR / job["src"]
    im = Image.open(src_path).convert("RGBA")
    w, h = im.size
    scale = min(1.0, EMBED_MAX_SIDE / max(w, h))
    if scale < 1.0:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    data = buf.getvalue()
    uri = "data:image/png;base64," + base64.b64encode(data).decode()
    prov = {
        "file": job["src"],
        "sha256": hashlib.sha256(src_path.read_bytes()).hexdigest()[:16],
        "source_px": f"{w}x{h}",
        "embed_px": f"{im.width}x{im.height}",
    }
    return uri, prov


def call_luna(prompt, size, background, image=None, image_detail=None,
              quality="auto", output_format="png", timeout=600):
    body = {
        "model": MODEL,
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "background": background,
        "output_format": output_format,
        "n": 1,
    }
    if image:
        body["image"] = image  # structured ref field -> upstream input_image
    if image_detail:
        body["image_detail"] = image_detail
    req = urllib.request.Request(
        BASE + "/images/generations",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": "Bearer " + (KEY or ""),
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
    )
    t0 = time.time()
    r = urllib.request.urlopen(req, timeout=timeout)
    raw = r.read().decode("utf-8", "replace")
    dt = time.time() - t0

    b64 = None
    # 1) pure JSON
    try:
        j = json.loads(raw)
        d = (j.get("data") or [{}])[0]
        b64 = d.get("b64_json") or d.get("image")
    except Exception:
        pass
    # 2) SSE: last b64_json
    if not b64:
        m = re.findall(r'"b64_json"\s*:\s*"([A-Za-z0-9+/=]{100,})"', raw)
        if m:
            b64 = m[-1]
    # 3) SSE: last data:image/png;base64
    if not b64:
        m = re.findall(r"data:image/png;base64,([A-Za-z0-9+/=]{100,})", raw)
        if m:
            b64 = m[-1]
    if not b64:
        raise RuntimeError("no image parsed; raw head: " + raw[:300])
    return base64.b64decode(b64), dt


def pil_check(path, min_transparent):
    """min_transparent semantics:
    -1  -> opaque asset (bg_far): RGB fine, only non-blank check
     0  -> transparent sprite, loose threshold (tree): RGBA + some transparency
    >0  -> strip/sprite: RGBA + transparent% >= threshold
    """
    from PIL import Image

    im = Image.open(path)
    total = im.width * im.height
    opaque_pct = None
    transparent_pct = None
    if im.mode == "RGBA":
        hist = im.getchannel("A").histogram()
        transparent_pct = round(100.0 * sum(hist[:16]) / total, 1)
        opaque_pct = round(100.0 * sum(hist[240:]) / total, 1)
        desc = f"mode=RGBA transparent={transparent_pct}% opaque={opaque_pct}%"
    else:
        desc = f"mode={im.mode}"

    if min_transparent == -1:  # opaque asset
        ok = im.mode in ("RGB", "RGBA")
        if ok and opaque_pct is None:
            ok = total > 0  # decoded, non-empty
        return ok, desc + (" (opaque asset)" if ok else " -> expected opaque RGB/RGBA"), {
            "size": f"{im.width}x{im.height}",
        }
    # transparent assets
    if im.mode != "RGBA":
        return False, desc + " -> expected RGBA sprite", {}
    thr = min_transparent if min_transparent > 0 else 5.0
    ok = transparent_pct >= thr and opaque_pct >= 3.0
    return ok, desc + (f" thr={thr}" if ok else f" -> FAIL thr={thr}"), {
        "transparent_pct": transparent_pct,
        "opaque_pct": opaque_pct,
        "size": f"{im.width}x{im.height}",
    }


def color_stats(path):
    """green-dominant skin + yellow shell fractions; green centroid (facing)."""
    import numpy as np
    from PIL import Image

    im = np.array(Image.open(path).convert("RGBA"), dtype=int)
    a = im[:, :, 3] > 40
    r, g, b = im[:, :, 0], im[:, :, 1], im[:, :, 2]
    green = ((g >= r) & (g > b + 6) & (g > 70) & a)
    yellow = ((r > 170) & (g > 130) & (b < 120) & (r > b + 80) & (g > b + 40) & a)
    vis = max(int(a.sum()), 1)
    frac_g = float(green.sum()) / vis
    frac_y = float(yellow.sum()) / vis
    if green.sum() >= 50:
        ys, xs = np.where(green)
        cx = float(xs.mean()) / im.shape[1]
    else:
        cx = 0.5
    return {"green_frac": round(frac_g, 4), "green_cx": round(cx, 3),
            "yellow_frac": round(frac_y, 4)}


def bbox_reg(path):
    from PIL import Image

    im = Image.open(path).convert("RGBA")
    W, H = im.size
    bb = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    if not bb:
        return None
    x0, y0, x1, y1 = bb
    return {"ar": round(W / H, 3), "x0": round(x0 / W, 3), "y0": round(y0 / H, 3),
            "x1": round(x1 / W, 3), "y1": round(y1 / H, 3),
            "cx": round((x0 + x1) / 2 / W, 3)}


def identity_check(job, out_path):
    """Numeric identity gates for turtle i2i jobs vs their anchor. Returns
    (ok, detail, stats). Registration drift beyond tolerance is reported so the
    caller can STOP (never silently regen beyond the one allowed retry)."""
    gates = job["gates"]
    cs = color_stats(out_path)
    reg = bbox_reg(out_path)
    stats = {**cs, "reg": reg}
    fails = []
    if cs["green_cx"] <= 0.5:
        fails.append(f"facing (green_cx={cs['green_cx']} not >0.5)")
    if "green_floor" in gates and cs["green_frac"] < gates["green_floor"]:
        fails.append(f"green_floor {cs['green_frac']}<{gates['green_floor']}")
    if "yellow_floor" in gates and cs["yellow_frac"] < gates["yellow_floor"]:
        fails.append(f"yellow_floor {cs['yellow_frac']}<{gates['yellow_floor']}")
    if "rel_green" in gates or "rel_yellow" in gates:
        anc = color_stats(OUT_DIR / job["src"])
        stats["anchor"] = anc
        if "rel_green" in gates and cs["green_frac"] < gates["rel_green"] * anc["green_frac"]:
            fails.append(f"rel_green {cs['green_frac']}<{gates['rel_green']}*{anc['green_frac']}")
        if "rel_yellow" in gates and cs["yellow_frac"] < gates["rel_yellow"] * anc["yellow_frac"]:
            fails.append(f"rel_yellow {cs['yellow_frac']}<{gates['rel_yellow']}*{anc['yellow_frac']}")
    if gates.get("reg"):
        anc_reg = bbox_reg(OUT_DIR / job["src"])
        stats["anchor_reg"] = anc_reg
        if anc_reg and reg:
            for k in ("cx", "y0", "y1"):
                if abs(reg[k] - anc_reg[k]) > 0.08:
                    fails.append(f"reg {k} {reg[k]} vs {anc_reg[k]} (|d|>0.08)")
            ar_ratio = reg["ar"] / anc_reg["ar"] if anc_reg["ar"] else 1
            if not (0.85 <= ar_ratio <= 1.18):
                fails.append(f"reg ar_ratio {ar_ratio:.3f}")
    detail = " ".join(fails) if fails else "identity OK"
    return (not fails), detail, stats


def run_job(job, log):
    name = job["name"]
    out = OUT_DIR / f"{name}.png"
    min_t = job.get("min_transparent", 0.0)
    attempts = []
    is_i2i = job["kind"] == I2I
    uri, ref_prov = (ref_uri(job) if is_i2i else (None, None))
    for attempt in (1, 2):  # gen + at most 1 retry
        try:
            prompt = job_prompt(job)
            png, dt = call_luna(
                prompt, job["size"], job["background"],
                image=uri,
                image_detail=("high" if is_i2i else None),
            )
            out.write_bytes(png)
            ok, desc, pstats = pil_check(out, min_t)
            id_ok, id_desc, istats = (identity_check(job, out) if is_i2i else (True, "", {}))
            ok = ok and id_ok
            attempts.append({
                "attempt": attempt, "elapsed_s": round(dt, 1), "ok": ok,
                "check": desc + ("; " + id_desc if is_i2i else ""),
                **({"stats": istats} if is_i2i else {}),
            })
            print(f"[{name}] try{attempt}: {dt:.0f}s {desc}"
                  + (f"; {id_desc}" if is_i2i else "")
                  + f" -> {'OK' if ok else 'FAIL'}", flush=True)
            if ok:
                (OUT_DIR / f"{name}.prompt.txt").write_text(
                    f"model: {MODEL}\nkind: {job['kind']}"
                    + (f"\nimg2img_source: {job['src']} (sha256:{ref_prov['sha256']} "
                       f"{ref_prov['source_px']} -> embed {ref_prov['embed_px']}, "
                       f"structured body.image)" if is_i2i else "")
                    + f"\nsize: {job['size']}\nbackground: {job['background']}"
                    + ("\nimage_detail: high" if is_i2i else "")
                    + f"\nquality: auto output_format: png n: 1"
                    f"\nelapsed_s: {dt:.0f}\ncheck: {desc}"
                    + (f"; {id_desc}" if is_i2i else "")
                    + "\n\n--- prompt (text only; ref image sent via body.image) ---\n"
                    f"{prompt}\n"
                )
                entry = {"ok": True, "attempts": attempts, **pstats}
                if is_i2i:
                    entry["ref"] = ref_prov
                    entry["conditioning"] = "structured body.image -> input_image"
                    entry["identity"] = istats
                log[name] = entry
                return True
        except Exception as e:
            attempts.append({"attempt": attempt, "error": repr(e)[:200]})
            print(f"[{name}] try{attempt}: ERROR {repr(e)[:160]}", flush=True)
            time.sleep(2)
    log[name] = {"ok": False, "attempts":
                 (log.get(name, {}).get("attempts", []) if isinstance(log.get(name), dict) else [])
                 + attempts,
                 **({"ref": ref_prov} if is_i2i else {})}
    return False


def mark_superseded(log):
    """Tag prompt-embedded (unconditioned) turtle outputs as superseded; keep
    their attempt history. Also record the failed 2026-10-11 mouth-variant run
    (text-lock + prompt-embed, 2 attempts each, both failed olive gate)."""
    note = ("UNCONDITIONED: data URI was embedded in prompt text; gateway ingests "
            "image refs only from body.image/body.images (codex adapter), so these "
            "outputs were not image-conditioned. Superseded 2026-10-11.")
    mouth_fail = {
        "turtle_m0": [
            {"attempt": "mouthfix1 (prompt-embed)", "elapsed_s": 70, "ok": False,
             "check": "olive_frac=0.0000 gate>=0.1245 facing=left"},
            {"attempt": "mouthfix2 (prompt-embed)", "elapsed_s": 109, "ok": False,
             "check": "olive_frac=0.0000 gate>=0.1245 facing=left"},
        ],
        "turtle_mO": [
            {"attempt": "mouthfix1 (prompt-embed)", "elapsed_s": 45, "ok": False,
             "check": "olive_frac=0.0002 gate>=0.1245 facing=right"},
            {"attempt": "mouthfix2 (prompt-embed)", "elapsed_s": 73, "ok": False,
             "check": "olive_frac=0.0072 gate>=0.1245 facing=left"},
        ],
    }
    for name in ("turtle_walk", "turtle_m0", "turtle_mO"):
        entry = log.get(name)
        if isinstance(entry, dict):
            entry["superseded"] = note
            if name in mouth_fail:
                entry["attempts"] = entry.get("attempts", []) + mouth_fail[name]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None,
                    help="comma-separated job names to run (others skipped)")
    args = ap.parse_args()
    only = set(args.only.split(",")) if args.only else None

    print(f"base={BASE} model={MODEL} jobs={len(JOBS)}"
          + (f" only={sorted(only)}" if only else ""), flush=True)
    log_path = OUT_DIR / "gen_log.json"
    log = {}
    if log_path.exists():
        try:
            log = json.loads(log_path.read_text())
        except Exception:
            log = {}
    mark_superseded(log)
    log_path.write_text(json.dumps(log, indent=1))

    failures = []
    for job in JOBS:
        if only and job["name"] not in only:
            continue
        prev = log.get(job["name"], {})
        if (prev.get("ok") and not prev.get("superseded")
                and (OUT_DIR / f"{job['name']}.png").exists()):
            print(f"[{job['name']}] already OK, skip", flush=True)
            continue
        if not run_job(job, log):
            failures.append(job["name"])
        log_path.write_text(json.dumps(log, indent=1))
        if failures:  # STOP on first failure — no silent extra generation
            break
    print("DONE failures=", failures or "none", flush=True)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
