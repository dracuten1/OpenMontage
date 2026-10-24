#!/usr/bin/env python3
"""Generate images via 9router ag/gemini-3.1-flash-image (S2E03 proven pattern).
Usage: gen_images.py [--only sc015,...]  — idempotent, skips existing PNGs."""
import base64, json, re, sys, time, urllib.request
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "lieu-hanh"
IMG = OM / "remotion-composer" / "public" / "lieu-hanh" / "images"
IMG.mkdir(parents=True, exist_ok=True)

env = {}
for line in open(OM / ".env"):
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"')
BASE = env.get("OPENAI_BASE_URL", "http://127.0.0.1:20128/v1").rstrip("/")
KEY = env.get("OPENAI_API_KEY", "")

prompts = json.loads((P / "artifacts" / "image_prompts.json").read_text(encoding="utf-8"))
only = None
if "--only" in sys.argv:
    only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    prompts = [p for p in prompts if p["scene"] in only]

MODELS = ["cx/gpt-5.6-luna-image", "ag/gemini-3.1-flash-image"]

def gen(entry):
    out = IMG / f"{entry['id']}.png"
    if out.exists() and out.stat().st_size > 5000:
        return "skip", out.stat().st_size
    last_err = None
    for model in MODELS:
        body = json.dumps({"model": model, "prompt": entry["prompt"],
                           "size": entry.get("size", "1080x1920"), "n": 1}).encode()
        req = urllib.request.Request(BASE + "/images/generations", data=body, headers={
            "Content-Type": "application/json", "Authorization": f"Bearer {KEY}",
            "Accept": "text/event-stream"})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                raw = r.read().decode()
        except Exception as ex:
            last_err = f"{model}: {type(ex).__name__} {str(ex)[:80]}"
            continue
        b64 = None
        try:
            d0 = json.loads(raw)["data"][0]
            b64 = d0.get("b64_json") or d0.get("image")
            if b64 and b64.startswith("data:"):
                b64 = b64.split(",", 1)[1]
        except Exception:
            m = re.search(r'"b64_json"\s*:\s*"([A-Za-z0-9+/=]+)"', raw) or re.search(r'"image"\s*:\s*"([A-Za-z0-9+/=]+)"', raw)
            if m:
                b64 = m.group(1)
        if not b64:
            last_err = f"{model}: NO_IMAGE raw:{raw[:120]}"
            continue
        tmp = out.with_suffix(".bin")
        tmp.write_bytes(base64.b64decode(b64))
        if tmp.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n":
            tmp.replace(out)
        else:
            # provider returned JPEG (ignores size param) — transcode to real PNG
            import subprocess
            r2 = subprocess.run(["/Users/tuyennguyen/.hermes/tools/ffmpeg-9.0.1-darwin-arm64/ffmpeg",
                                "-y", "-loglevel", "error", "-i", str(tmp), str(out)],
                               capture_output=True, text=True)
            tmp.unlink(missing_ok=True)
            if r2.returncode != 0:
                last_err = f"{model}: FFMPEG_ERR {r2.stderr[:100]}"
                continue
        ok = out.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n"
        return ("ok" if ok else "NOT_PNG"), out.stat().st_size
    return f"ERR {last_err}", 0

fails = []
for i, e in enumerate(prompts, 1):
    t0 = time.time()
    status, size = "ERR", 0
    for attempt in range(4):
        try:
            status, size = gen(e)
        except Exception as ex:
            status, size = f"ERR {type(ex).__name__}: {str(ex)[:120]}", 0
        if status in ("ok", "skip"):
            break
        # transient provider failures (502/timeout): backoff and retry
        time.sleep(15 * (attempt + 1))
    print(f"[{i}/{len(prompts)}] {e['id']} {e['scene']} {status} {size}B {time.time()-t0:.0f}s", flush=True)
    if status not in ("ok", "skip"):
        fails.append(e["id"])
print(f"GEN {'PASS' if not fails else 'FAIL'}: {len(prompts)-len(fails)}/{len(prompts)} ok; fails={fails}")
sys.exit(1 if fails else 0)
