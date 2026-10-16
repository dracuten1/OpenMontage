"""TASK_EP1_AI_ASSETS batch generator — extends the verified depth_demo
gen_assets.py (imports it; no rewrite). Model cx/gpt-5.6-luna-image ONLY.

Task rules honored here:
1. Images verified ONLY via PIL (size/mode/alpha%/bbox). No vision QC.
2. img2img ref travels in body field `image` as a data URI, downscaled to
   <=1024px max side BEFORE encoding (ref_uri_from).
3. Model/gateway/key from .env via the depth module (key never printed).
4. background "transparent" for sprites; alpha-bbox measured after EACH
   image and appended to registration.json (never hardcoded).
5. STYLE_LOCK appended to every prompt.
6. Max 1 retry per image; after retry failure -> log and CONTINUE to next
   image (report at end). Child jobs whose ref is missing are skipped.
7. Sequential; request timeout 600s (depth.call_luna timeout param).

Resumable: a job whose gen_log entry is ok AND whose png exists is skipped
and only re-copied to public if the copy is missing.

Usage:
  .venv/bin/python character-performer/kids/assets/ep1_ai/gen_ep1_assets.py
  .venv/bin/python ... --only rabbit_greet,rabbit_greet_mO
"""
import argparse
import base64
import hashlib
import importlib.util
import io
import json
import shutil
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent                 # character-performer/kids/assets/ep1_ai
REPO = HERE.parents[3]                                  # repo root
DEPTH_SCRIPT = HERE.parent / "depth_demo" / "gen_assets.py"
PROBE = Path("/Users/tuyennguyen/.hermes/cache/scratch/luna_probe.png")
DEMO_DIR = REPO / "remotion-composer" / "public" / "character-performer" / "kids" / "depth_demo"
PUBLIC = REPO / "remotion-composer" / "public" / "character-performer" / "kids" / "ep1_ai"

spec = importlib.util.spec_from_file_location("depth_gen_assets", DEPTH_SCRIPT)
depth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(depth)                          # main() is __main__-guarded

MODEL = depth.MODEL
T2I, I2I = "t2i", "i2i"

RABBIT_ID_LOCK = (
    "The reference image is the EXACT character to keep: a kawaii white rabbit "
    "with soft cream highlights wearing a red vest with a single yellow button, "
    "thick dark-brown outlines, soft pastel cel shading, flat 2d kawaii "
    "children's picture-book style"
)
RABBIT_DRIFT = (
    "Do NOT change the art style, do NOT change the fur color, the red vest or "
    "the yellow button, do NOT make it realistic or 3d"
)
MOUTH_LOCK = (
    "keep character design and colors EXACTLY, same pose, same size, same "
    "framing, same facing direction - only change the mouth"
)


def rabbit(change):
    return (
        f"{RABBIT_ID_LOCK}. Using the attached reference image as the exact "
        f"same character: {change}. {RABBIT_DRIFT}. {depth.STYLE_LOCK}, "
        "fully transparent background, isolated subject"
    )


JOBS = [
    dict(name="rabbit_greet", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=PROBE,
         prompt=rabbit("the same rabbit standing, facing LEFT, one paw raised "
                       "waving hello, big happy smile, mouth CLOSED, full body "
                       "side view")),
    dict(name="rabbit_greet_mO", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=HERE / "rabbit_greet.png",
         prompt=rabbit(f"{MOUTH_LOCK}: mouth open in a small round O shape "
                       "as if speaking")),
    dict(name="rabbit_taunt", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=PROBE,
         prompt=rabbit("the same rabbit standing facing LEFT, smug teasing "
                       "smirk, paws on hips, mouth CLOSED, full body side view")),
    dict(name="rabbit_taunt_mO", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=HERE / "rabbit_taunt.png",
         prompt=rabbit(f"{MOUTH_LOCK}: mouth open in a small round O shape "
                       "as if speaking")),
    dict(name="rabbit_run1", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=PROBE,
         prompt=rabbit("the same rabbit sprinting FACING RIGHT, body stretched "
                       "long, ears swept back, mid-leap, full speed, full body "
                       "side view")),
    dict(name="rabbit_run2", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=HERE / "rabbit_run1.png",
         prompt=rabbit("the same running rabbit IDENTICALLY - same style, "
                       "colors, outfit, still sprinting FACING RIGHT mid-leap - "
                       "but the NEXT stride phase of the same run cycle, front "
                       "and back legs swapped positions")),
    dict(name="rabbit_shock", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=PROBE,
         prompt=rabbit("the same rabbit startled awake, eyes wide open, ears "
                       "bolt upright, mouth open small, facing RIGHT, full "
                       "body side view")),
    dict(name="rabbit_shock_m0", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=HERE / "rabbit_shock.png",
         prompt=rabbit(f"{MOUTH_LOCK}: mouth CLOSED as a small friendly line")),
    dict(name="turtle_proud", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=DEMO_DIR / "turtle_walk.png",
         prompt=(
             f"{depth.TURTLE_ID_LOCK}. Using the attached reference image as "
             "the exact same character: the same golden turtle, head held "
             "high, proud gentle smile, mouth CLOSED, full body side view "
             f"facing RIGHT. {depth.ANTI_DRIFT}. {depth.STYLE_LOCK}, fully "
             "transparent background, isolated subject"
         )),
    dict(name="turtle_proud_mO", kind=I2I, size="auto", background="transparent",
         min_transparent=25.0, ref=HERE / "turtle_proud.png",
         prompt=(
             f"{depth.TURTLE_ID_LOCK}. Using the attached reference image as "
             f"the exact same character: {MOUTH_LOCK}: mouth open in a small "
             f"round O shape as if speaking. {depth.ANTI_DRIFT}. "
             f"{depth.STYLE_LOCK}, fully transparent background, isolated subject"
         )),
    dict(name="finish_bg", kind=T2I, size="1536x1024", background="opaque",
         min_transparent=-1, ref=None,
         prompt=(
             "wide sunny meadow FINISH LINE for a race: a plain red ribbon "
             "banner stretched between two wooden poles across a brown dirt "
             "road, small colorful pennant flags on strings, distant soft "
             "green hills, bright friendly sky, NO characters, no animals, "
             "plain red ribbon with no letters or writing on it, "
             f"{depth.STYLE_LOCK}"
         )),
]

# Legacy sprites re-measured into registration.json (deliverable 2).
LEGACY = {
    "turtle_walk.png": DEMO_DIR / "turtle_walk.png",
    "turtle_m0.png": DEMO_DIR / "turtle_m0.png",
    "turtle_mO.png": DEMO_DIR / "turtle_mO.png",
    "rabbit_sleep.png": DEMO_DIR / "rabbit_sleep.png",
    "tree_sleep.png": DEMO_DIR / "tree_sleep.png",
}

GEN_LOG = HERE / "gen_log.json"
REG = HERE / "registration.json"


def load_json(path, default):
    try:
        return json.loads(path.read_text())
    except Exception:
        return default


def ref_uri_from(src_path):
    """Aspect-preserving lossless PNG data URI (<=1024px max side) for body.image."""
    from PIL import Image
    im = Image.open(src_path).convert("RGBA")
    w, h = im.size
    scale = min(1.0, depth.EMBED_MAX_SIDE / max(w, h))
    if scale < 1.0:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))),
                       Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    prov = {
        "file": str(src_path.relative_to(REPO)) if src_path.is_relative_to(REPO) else str(src_path),
        "sha256": hashlib.sha256(src_path.read_bytes()).hexdigest()[:16],
        "source_px": f"{w}x{h}",
        "embed_px": f"{im.width}x{im.height}",
    }
    return uri, prov


def reg_entry(path):
    """{size, ar, t, b, cx, content_h_frac} from PIL alpha-bbox (alpha>16)."""
    from PIL import Image
    im = Image.open(path).convert("RGBA")
    W, H = im.size
    bb = im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox()
    if bb is None:
        return {"size": [W, H], "ar": round(W / H, 4), "bbox": None,
                "content_h_frac": 0.0}
    x0, y0, x1, y1 = bb
    return {
        "size": [W, H], "ar": round(W / H, 4),
        "t": int(y0), "b": int(y1), "cx": int((x0 + x1) // 2),
        "content_h_frac": round((y1 - y0) / H, 4),
    }


def write_prompt_txt(job, dt, desc, prov):
    is_i2i = job["kind"] == I2I
    (HERE / f"{job['name']}.prompt.txt").write_text(
        f"model: {MODEL}\nkind: {job['kind']}"
        + (f"\nimg2img_source: {prov['file']} (sha256:{prov['sha256']} "
           f"{prov['source_px']} -> embed {prov['embed_px']}, structured "
           f"body.image)" if is_i2i else "")
        + f"\nsize: {job['size']}\nbackground: {job['background']}"
        + ("\nimage_detail: high" if is_i2i else "")
        + "\nquality: auto output_format: png n: 1"
        + f"\nelapsed_s: {dt:.0f}\ncheck: {desc}"
        + "\n\n--- prompt (text only; ref image sent via body.image) ---\n"
        f"{job['prompt']}\n"
    )


def run_job(job, log, reg):
    """Generate + PIL QC + 1 retry. Continue-on-fail (task rule 6)."""
    name = job["name"]
    out = HERE / f"{name}.png"
    uri = prov = None
    if job["kind"] == I2I:
        uri, prov = ref_uri_from(job["ref"])
    attempts = []
    for attempt in (1, 2):
        try:
            png, dt = depth.call_luna(
                job["prompt"], job["size"], job["background"],
                image=uri, image_detail=("high" if uri else None),
            )
            out.write_bytes(png)
            ok, desc, pstats = depth.pil_check(out, job["min_transparent"])
            attempts.append({"attempt": attempt, "elapsed_s": round(dt, 1),
                             "ok": ok, "check": desc})
            print(f"[{name}] try{attempt}: {dt:.0f}s {desc} -> "
                  f"{'OK' if ok else 'FAIL'}", flush=True)
            if ok:
                write_prompt_txt(job, dt, desc, prov)
                log[name] = {
                    "ok": True, "seconds": round(dt, 1),
                    "size": pstats.get("size"),
                    "transparent_pct": pstats.get("transparent_pct"),
                    "opaque_pct": pstats.get("opaque_pct"),
                    "attempts": attempts,
                }
                if prov:
                    log[name]["ref"] = prov
                shutil.copy2(out, PUBLIC / out.name)
                shutil.copy2(HERE / f"{name}.prompt.txt",
                             PUBLIC / f"{name}.prompt.txt")
                reg[f"{name}.png"] = reg_entry(out)   # measure after EACH image
                return True
        except Exception as e:
            attempts.append({"attempt": attempt, "error": repr(e)[:200]})
            print(f"[{name}] try{attempt}: ERROR {repr(e)[:160]}", flush=True)
            time.sleep(2)
    log[name] = {"ok": False, "attempts": attempts}
    if prov:
        log[name]["ref"] = prov
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=None,
                    help="comma-separated job names to run (others skipped)")
    args = ap.parse_args()
    only = set(args.only.split(",")) if args.only else None

    PUBLIC.mkdir(parents=True, exist_ok=True)
    log = load_json(GEN_LOG, {})
    reg = load_json(REG, {})

    print(f"base={depth.BASE} model={MODEL} jobs={len(JOBS)}"
          + (f" only={sorted(only)}" if only else ""), flush=True)

    not_ok, skipped = [], []
    for job in JOBS:
        name = job["name"]
        if only and name not in only:
            continue
        prev = log.get(name, {})
        out = HERE / f"{name}.png"
        if prev.get("ok") and out.exists():
            print(f"[{name}] already OK, skip", flush=True)
            for f in (out, HERE / f"{name}.prompt.txt"):
                if f.exists() and not (PUBLIC / f.name).exists():
                    shutil.copy2(f, PUBLIC / f.name)
            if f"{name}.png" not in reg:
                reg[f"{name}.png"] = reg_entry(out)
            continue
        if job["ref"] is not None and not job["ref"].exists():
            print(f"[{name}] SKIP: ref missing ({job['ref'].name})", flush=True)
            log[name] = {"ok": False, "skipped": f"ref missing: {job['ref']}"}
            skipped.append(name)
            GEN_LOG.write_text(json.dumps(log, indent=1))
            continue
        if not run_job(job, log, reg):
            not_ok.append(name)
        GEN_LOG.write_text(json.dumps(log, indent=1))
        REG.write_text(json.dumps(reg, indent=1))

    for fname, p in LEGACY.items():                     # deliverable 2: legacy 5
        if p.exists():
            reg[fname] = reg_entry(p)
        else:
            print(f"[reg] legacy missing: {fname}", flush=True)
    REG.write_text(json.dumps(reg, indent=1))

    total_s = sum(v.get("seconds", 0) for v in log.values()
                  if isinstance(v, dict) and v.get("ok"))
    print(f"DONE ok={sum(1 for j in JOBS if log.get(j['name'], {}).get('ok'))}"
          f"/{len(JOBS)} fail={not_ok or 'none'} skipped={skipped or 'none'} "
          f"total_gen_s={total_s:.0f}", flush=True)
    sys.exit(1 if not_ok or skipped else 0)


if __name__ == "__main__":
    main()
