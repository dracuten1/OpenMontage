#!/usr/bin/env python3
"""Round 2: matched-pair TỪ head part (cùng canvas) -> head_mO + head_blink.
Chạy sau khi gen_parts.py xong hẳn (không ghi chung parts_reg.json)."""
import base64, json, os, sys, time, urllib.request
import numpy as np
import yaml
from PIL import Image

CFG = os.path.expanduser("~/.hermes/config.yaml")
ROOT = os.path.expanduser("~/project/OpenMontage/character-performer/kids")
HEAD = f"{ROOT}/rig_demo/parts/head.png"
OUT = f"{ROOT}/rig_demo/parts2"
os.makedirs(OUT, exist_ok=True)
MODEL = "cx/gpt-5.6-luna-image"
CANVAS = (1536, 1024)

def api():
    for p in yaml.safe_load(open(CFG)).get("custom_providers", []):
        if "20128" in p.get("base_url", ""):
            return p["base_url"].rstrip("/"), p["api_key"]
    sys.exit("no 9router")

def data_uri(path, max_w=1024):
    im = Image.open(path).convert("RGBA")
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.Resampling.LANCZOS)
    import io
    buf = io.BytesIO(); im.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

STYLE = ("The reference is the EXACT same 2D cartoon cutout puppet part: the head of a cute white rabbit, "
         "kawaii kids-storybook flat style, cream fur, thick dark-brown outline, pink cheek and nose, "
         "one eye open looking right, closed smiling mouth. ")

JOBS = {
  "head_mO": STYLE + "SAME pose, SAME scale, SAME position on the canvas, identical everything. "
             "ONLY change: the mouth opens WIDE in a happy shout — dark open mouth with a hint of tongue. "
             "Every other pixel identical. Transparent background, PNG with alpha.",
  "head_blink": STYLE + "SAME pose, SAME scale, SAME position on the canvas, identical everything. "
               "ONLY change: the eye is CLOSED into a gentle happy blink arc (curved eyelid). "
               "Every other pixel identical. Transparent background, PNG with alpha.",
}

def gen(prompt, ref_uri, out_png):
    payload = {"model": MODEL, "prompt": prompt, "n": 1, "size": "1536x1024",
               "output_format": "png", "image": ref_uri}
    req = urllib.request.Request(api()[0] + "/v1/images/generations",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + api()[1],
                 "Accept": "text/event-stream"})
    t0 = time.time()
    raw = urllib.request.urlopen(req, timeout=600).read()
    text = raw.decode("utf-8", errors="replace")
    if text.lstrip().startswith("{"):
        d = json.loads(text)["data"][0]
    else:
        done = [e for e in text.split("\n\n") if e.startswith("event: done")]
        d = json.loads(done[0].split("\n", 1)[1][len("data: "):])["data"][0]
    open(out_png, "wb").write(base64.b64decode(d["b64_json"]))
    return time.time() - t0

def normalize(path):
    im = Image.open(path)
    if im.size != CANVAS:
        im = im.resize(CANVAS, Image.Resampling.LANCZOS)
    im = im.convert("RGBA")
    a = np.asarray(im)
    mask = a[..., 3] > 16
    ys, xs = np.where(mask)
    im.save(path)
    return float(mask.mean() * 100), [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]

def drift(pA, pB):
    A = np.asarray(Image.open(pA).convert("RGBA")).astype(np.int16)
    B = np.asarray(Image.open(pB).convert("RGBA").astype(np.int16) if False else Image.open(pB).convert("RGBA")).astype(np.int16)
    u = (A[..., 3] > 16) | (B[..., 3] > 16)
    return float(np.abs(A - B).mean(axis=2)[u].mean() / 255 * 100)

def main():
    ref = data_uri(HEAD)
    reg = {}
    for name, prompt in JOBS.items():
        out_png = f"{OUT}/{name}.png"
        for attempt in (1, 2):
            try:
                dt = gen(prompt, ref, out_png)
                a, bbox = normalize(out_png)
                reg[name] = {"alpha_pct": round(a, 1), "bbox": bbox, "gen_s": round(dt, 1)}
                print(f"[ok] {name} {dt:.0f}s alpha={a:.1f}% bbox={bbox}", flush=True)
                break
            except Exception as e:
                print(f"[fail] {name} attempt {attempt}: {repr(e)[:180]}", flush=True)
                time.sleep(3)
        json.dump(reg, open(f"{OUT}/parts_reg2.json", "w"), indent=1)
    # drift vs head part
    for name in JOBS:
        try:
            reg[f"drift_{name}"] = round(drift(HEAD, f"{OUT}/{name}.png"), 3)
        except Exception as e:
            reg[f"drift_{name}"] = repr(e)[:120]
    json.dump(reg, open(f"{OUT}/parts_reg2.json", "w"), indent=1)
    print("DONE2 " + json.dumps(reg), flush=True)

if __name__ == "__main__":
    main()
