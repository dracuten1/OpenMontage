#!/usr/bin/env python
"""S2E03 demo — PROBE 1 ảnh ink-genome (chiếc khố, amber myth) qua 9router. Đây là probe duy nhất trước batch."""
import base64
import json
from pathlib import Path
import urllib.request

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
IMG = REPO / "projects" / "chu-dong-tu" / "assets" / "images"
PUBIMG = REPO / "remotion-composer" / "public" / "chu-dong-tu" / "images"
IMG.mkdir(parents=True, exist_ok=True)
PUBIMG.mkdir(parents=True, exist_ok=True)

env = {}
for line in open(REPO / ".env"):
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"')
BASE = env.get("OPENAI_BASE_URL", "http://127.0.0.1:20128/v1").rstrip("/")
KEY = env.get("OPENAI_API_KEY", "")

# Prompt EN style proven ở S2E02 (STYLE chuẩn mùa — tránh lỗi render chữ trên ảnh)
PROMPT = (
    "A single worn loincloth cloth laid flat on warm cream dó paper background, two faint silhouettes "
    "of a father and son behind it passing the cloth to each other, embers and smoke of a house fire "
    "fading at the edges"
    ", hand-drawn whiteboard storytelling illustration, loose black ink marker line art on warm cream "
    "parchment paper, minimal flat shading, a few golden yellow accents, Vietnamese folk tale art, "
    "no text, no watermark"
)

body = json.dumps({"model": "ag/gemini-3.1-flash-image", "prompt": PROMPT, "size": "1080x1920", "n": 1}).encode()
req = urllib.request.Request(BASE + "/images/generations", data=body, headers={
    "Content-Type": "application/json", "Authorization": f"Bearer {KEY}", "Accept": "text/event-stream"})
with urllib.request.urlopen(req, timeout=600) as r:
    raw = r.read().decode()

b64 = None
try:
    j = json.loads(raw)
    d0 = j["data"][0]
    b64 = d0.get("b64_json") or d0.get("image")
    if b64 and b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
except Exception:
    import re
    m = re.search(r'"b64_json"\s*:\s*"([A-Za-z0-9+/=]+)"', raw) or re.search(r'"image"\s*:\s*"([A-Za-z0-9+/=]+)"', raw)
    if m:
        b64 = m.group(1)
if not b64:
    print("NO IMAGE — raw head:", raw[:500]); raise SystemExit(1)

out = IMG / "demo_s03_kho.png"
out.write_bytes(base64.b64decode(b64))
# verify PNG
sig = out.read_bytes()[:8]
ok = sig == b"\x89PNG\r\n\x1a\n"
import shutil
shutil.copy(out, PUBIMG / "demo_s03_kho.png")
print("PNG OK" if ok else "NOT PNG!", out, out.stat().st_size, "bytes →", PUBIMG / "demo_s03_kho.png")
