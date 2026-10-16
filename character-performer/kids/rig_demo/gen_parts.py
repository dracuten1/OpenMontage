#!/usr/bin/env python3
"""Batch tách lớp THỎ (rig_demo) từ rabbit_shock_m0.png via 9router i2i luna.
Locked-canvas parts: giữ vị trí gốc để pivot/toạ độ mouth-patch dùng lại được.
Resumable (skip file hợp lệ), normalize về 1536x1024, đo bbox + drift matched-pairs.
Chạy: ~/project/OpenMontage/.venv/bin/python gen_parts.py
"""
import base64, json, os, sys, time, traceback, urllib.request, urllib.error
import numpy as np
import yaml
from PIL import Image

CFG = os.path.expanduser("~/.hermes/config.yaml")
ROOT = os.path.expanduser("~/project/OpenMontage/character-performer/kids")
M0 = f"{ROOT}/assets/ep1_ai/rabbit_shock_m0.png"
OUT = f"{ROOT}/rig_demo/parts"
os.makedirs(OUT, exist_ok=True)
MODEL = "cx/gpt-5.6-luna-image"
CANVAS = (1536, 1024)
LOG = f"{OUT}/gen_log.jsonl"
REG = f"{OUT}/parts_reg.json"
TIMEOUT = 600

def api():
    for p in yaml.safe_load(open(CFG)).get("custom_providers", []):
        if "20128" in p.get("base_url", ""):
            return p["base_url"].rstrip("/"), p["api_key"]
    sys.exit("9router not found")

def data_uri(path, max_w=1024):
    im = Image.open(path).convert("RGBA")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.Resampling.LANCZOS)
    import io
    buf = io.BytesIO(); im.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

STYLE = ("The reference is the EXACT same 2D cartoon cutout character sprite: a cute white rabbit with red vest "
         "and yellow button, thick dark-brown outlines, kawaii kids-storybook flat style, warm cream fur, pink "
         "inner ears, pink cheek, pink nose. ")

PLACE = (" Keep the extracted part EXACTLY at its original position, scale and rotation on the canvas. "
         "Everything else fully transparent. No background, no vignette, no drop shadow, no text. "
         "Where another body part hides part of it, reconstruct the hidden area plausibly with the same flat "
         "colors and the same outline weight so the parts will reassemble seamlessly. Output PNG with alpha.")

JOBS = {
  "head": STYLE + "Cutout puppet part: extract ONLY the head — the whole face with both eyes open, smiling CLOSED mouth, cheek and nose — WITHOUT the two long ears and WITHOUT the torso/vest." + PLACE,
  "ear_up": STYLE + "Cutout puppet part: extract ONLY ONE ear — the taller ear that stands nearly vertically from the crown of the head (slightly leaning left). No other body parts." + PLACE,
  "ear_tilt": STYLE + "Cutout puppet part: extract ONLY ONE ear — the other ear leaning about 30 degrees to the left of vertical. No other body parts." + PLACE,
  "body": STYLE + "Cutout puppet part: extract ONLY the torso with the red vest, yellow button and the fluffy round white tail at the left hip — WITHOUT head, ears, front paws, legs and feet. Reconstruct the chest fur and vest fabric hidden behind the paws/head." + PLACE,
  "arm_near": STYLE + "Cutout puppet part: extract ONLY ONE arm with its rounded white paw — the paw held HIGHER, closer to the face. Just that one limb, nothing else; reconstruct the shoulder end where it meets the body." + PLACE,
  "arm_far": STYLE + "Cutout puppet part: extract ONLY ONE arm with its rounded white paw — the paw held LOWER, farther from the face. Just that one limb, nothing else; reconstruct the shoulder end where it meets the body." + PLACE,
  "leg_left": STYLE + "Cutout puppet part: extract ONLY ONE hind leg with its bare furry foot and small toe marks — the leg reaching down toward the LEFT. Just that one limb, nothing else; reconstruct the hip end where it meets the vest." + PLACE,
  "leg_right": STYLE + "Cutout puppet part: extract ONLY ONE hind leg with its bare furry foot and small toe marks — the leg reaching down toward the RIGHT. Just that one limb, nothing else; reconstruct the hip end where it meets the vest." + PLACE,
  "mO_full": STYLE + "SAME pose, SAME scale, SAME position on the canvas, same everything. ONLY change: the mouth now opens WIDE in a happy shout showing a dark mouth and a hint of tongue. Every other pixel identical." + " Transparent background, PNG with alpha.",
  "blink_full": STYLE + "SAME pose, SAME scale, SAME position on the canvas, same everything. ONLY change: both eyes are CLOSED into gentle downward blink arcs (eyelid creases). Every other pixel identical." + " Transparent background, PNG with alpha.",
}

def logd(d):
    with open(LOG, "a") as f:
        f.write(json.dumps(d) + "\n")

def gen(prompt, ref_uri, out_png, try_i=0):
    payload = {"model": MODEL, "prompt": prompt, "n": 1, "size": "1536x1024",
               "output_format": "png", "image": ref_uri}
    req = urllib.request.Request(api()[0] + "/v1/images/generations",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + api()[1],
                 "Accept": "text/event-stream"})
    t0 = time.time()
    raw = urllib.request.urlopen(req, timeout=TIMEOUT).read()
    text = raw.decode("utf-8", errors="replace")
    if text.lstrip().startswith("{"):
        d = json.loads(text)["data"][0]
    else:
        done = [e for e in text.split("\n\n") if e.startswith("event: done")]
        if not done:
            raise RuntimeError(f"no done event ({len(text.split(chr(10)))} lines head={text[:120]!r})")
        d = json.loads(done[0].split("\n", 1)[1][len("data: "):])["data"][0]
    if not d.get("b64_json"):
        raise RuntimeError(f"no image keys={list(d)}")
    open(out_png, "wb").write(base64.b64decode(d["b64_json"]))
    return time.time() - t0

def normalize(path):
    """RGBA + đúng canvas; trả (mode, alpha_pct, bbox l,t,r,b, rescaled?)"""
    im = Image.open(path)
    rescaled = False
    if im.size != CANVAS:
        ar = im.width / im.height
        if not (1.40 <= ar <= 1.60):
            raise RuntimeError(f"bad aspect {im.size} ar={ar:.2f}")
        im = im.resize(CANVAS, Image.Resampling.LANCZOS); rescaled = True
    im = im.convert("RGBA")
    a = np.asarray(im)
    alpha_pct = float((a[..., 3] > 16).mean() * 100)
    mask = a[..., 3] > 16
    if not mask.any():
        raise RuntimeError("empty alpha")
    ys, xs = np.where(mask)
    bbox = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    im.save(path)
    return alpha_pct, bbox, rescaled

def drift(pA, pB):
    """norm mean abs diff RGBA trên union alpha, cùng canvas 1536x1024."""
    A = np.asarray(Image.open(pA).convert("RGBA").resize(CANVAS, Image.Resampling.LANCZOS)).astype(np.int16)
    B = np.asarray(Image.open(pB).convert("RGBA").resize(CANVAS, Image.Resampling.LANCZOS)).astype(np.int16)
    u = (A[..., 3] > 16) | (B[..., 3] > 16)
    return float(np.abs(A - B).mean(axis=2)[u].mean() / 255 * 100)

def main():
    ref = data_uri(M0)
    reg = {}
    if os.path.exists(REG):
        reg = json.load(open(REG))
    for name, prompt in JOBS.items():
        out_png = f"{OUT}/{name}.png"
        if os.path.exists(out_png):
            try:
                a, bbox, rsc = normalize(out_png)
                reg[name] = {"alpha_pct": round(a, 1), "bbox": bbox, "rescaled": rsc,
                             "size": list(CANVAS), "skipped_existing": True}
                print(f"[skip] {name} ok alpha={a:.1f}%", flush=True)
                continue
            except Exception as e:
                print(f"[re-gen] {name} existing invalid: {e}", flush=True)
        ok, err = False, None
        for attempt in (1, 2):
            try:
                dt = gen(prompt, ref, out_png)
                a, bbox, rsc = normalize(out_png)
                reg[name] = {"alpha_pct": round(a, 1), "bbox": bbox, "rescaled": rsc,
                             "size": list(CANVAS), "gen_s": round(dt, 1)}
                ok = True
                print(f"[ok] {name} {dt:.0f}s alpha={a:.1f}% bbox={bbox} rescaled={rsc}", flush=True)
                break
            except Exception as e:
                err = f"{repr(e)[:200]}"
                print(f"[fail] {name} attempt {attempt}: {err}", flush=True)
                time.sleep(3)
        logd({"name": name, "ok": ok, "err": err})
        json.dump(reg, open(REG, "w"), indent=1)
    # drift matched pairs vs m0 gốc
    m0n = f"{OUT}/_m0_ref.png"
    Image.open(M0).convert("RGBA").resize(CANVAS, Image.Resampling.LANCZOS).save(m0n)
    for pair in ("mO_full", "blink_full"):
        try:
            reg[f"drift_{pair}"] = {"vs": "m0", "norm_pct": round(drift(m0n, f"{OUT}/{pair}.png"), 3)}
        except Exception as e:
            reg[f"drift_{pair}"] = {"error": repr(e)[:150]}
    # bbox matched-pair lệch px
    for pair in ("mO_full", "blink_full"):
        if pair in reg and "bbox" in reg.get(pair, {}):
            pass
    json.dump(reg, open(REG, "w"), indent=1)
    print("DONE " + json.dumps(reg), flush=True)

if __name__ == "__main__":
    main()
