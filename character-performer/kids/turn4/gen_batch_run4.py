#!/usr/bin/env python
"""TASK_TURN4_A2 — batch run4 sprites (i2i via cx/gpt-image-2.5-sunburst).

Method + prompts VERBATIM from gen_probe_run3.py (A1, vision-PASSed): chain
i2i from the CANON run3 frames now in sprite_lib/rabbit/ (canon per task
muc 2). Writes probe/rabbit_{back,front}_run4.png + .prompt.txt +
gen_log_run4.json. Contract: POST /v1/images/generations, Accept SSE,
dual parse (JSON -> regex b64_json), data-URI ref downscaled <=1024 keeping
aspect, background transparent. Timeout 600s; sequential; max 1 retry/image.
"""
import base64
import io
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from PIL import Image
from dotenv import load_dotenv

REPO = Path(__file__).resolve().parents[3]
ENDPOINT = "http://127.0.0.1:20128/v1/images/generations"
MODEL = "cx/gpt-image-2.5-sunburst"
REF_DIR = REPO / "remotion-composer/public/character-performer/kids/sprite_lib/rabbit"
OUT_DIR = REPO / "character-performer/kids/turn4/probe"

PROMPT_BACK = (
    "SAME white kawaii rabbit with red vest and single yellow button seen FROM BEHIND "
    "(back view), SAME pose, scale and position in frame EXACTLY, next running stride "
    "phase, legs swapped positions, ears swept back, mid-leap. Keep character design "
    "and colors EXACTLY identical to the reference. flat kawaii children's "
    "picture-book style, thick dark-brown outlines, soft pastel colors, gentle cel "
    "shading, no text, no watermark. Do NOT mirror, do NOT change style, do NOT turn "
    "the head."
)
PROMPT_FRONT = (
    "SAME white kawaii rabbit with red vest and single yellow button seen FROM THE "
    "FRONT (front view), running toward the camera, SAME pose, scale and position in "
    "frame EXACTLY, next running stride phase, legs swapped positions, mid-leap. Keep "
    "character design and colors EXACTLY identical to the reference. flat kawaii "
    "children's picture-book style, thick dark-brown outlines, soft pastel colors, "
    "gentle cel shading, no text, no watermark. Do NOT mirror, do NOT change style, "
    "do NOT turn the head."
)

SPECS = [
    {"name": "rabbit_back_run4", "ref": REF_DIR / "rabbit_back_run3.png", "prompt": PROMPT_BACK},
    {"name": "rabbit_front_run4", "ref": REF_DIR / "rabbit_front_run3.png", "prompt": PROMPT_FRONT},
]


def ref_data_uri(path: Path, max_side: int = 1024) -> str:
    """Downscale ref keeping aspect so max side <=1024, return PNG data-URI."""
    img = Image.open(path).convert("RGBA")
    if max(img.size) > max_side:
        img.thumbnail((max_side, max_side), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def parse_b64(text: str):
    """Dual parse: JSON body first, regex b64_json fallback (SSE-safe)."""
    try:
        data = json.loads(text)
        for item in data.get("data", []):
            if item.get("b64_json"):
                return base64.b64decode(item["b64_json"])
            url = item.get("url") or ""
            if url.startswith("data:"):
                return base64.b64decode(url.split(",", 1)[1])
    except (json.JSONDecodeError, TypeError):
        pass
    m = re.search(r'"b64_json"\s*:\s*"([A-Za-z0-9+/=]+)"', text)
    return base64.b64decode(m.group(1)) if m else None


def post_image(prompt: str, ref_path: Path, api_key: str) -> bytes:
    body = {
        "model": MODEL,
        "prompt": prompt,
        "image": ref_data_uri(ref_path),
        "background": "transparent",
        "n": 1,
        "size": "auto",
        "quality": "auto",
        "output_format": "png",
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
    }
    # transport-level 429 backoff (usage-limit window, NOT a generation attempt):
    # honor retry-after, bounded at 6 tries so a dead quota fails fast.
    for try_i in range(6):
        r = requests.post(ENDPOINT, headers=headers, json=body, timeout=600)
        if r.status_code != 429:
            break
        ra = r.headers.get("retry-after")
        wait = min(float(ra) if ra and ra.isdigit() else 8.0, 60.0) + 2.0
        print(f"[429] try{try_i + 1} usage limit, sleeping {wait:.0f}s", flush=True)
        time.sleep(wait)
    r.raise_for_status()
    raw = parse_b64(r.text)
    if not raw:
        raise RuntimeError(f"no b64_json in response ({len(r.text)} chars)")
    return raw


def png_stats(raw: bytes):
    img = Image.open(io.BytesIO(raw))
    img.load()
    transp = 0.0
    if img.mode == "RGBA":
        hist = img.getchannel("A").histogram()
        transp = sum(hist[:8]) / (img.width * img.height) * 100.0
    return img, transp


def main() -> None:
    load_dotenv(REPO / ".env")
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        sys.exit("FATAL: OPENAI_API_KEY missing after load_dotenv(repo/.env)")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    log_path = OUT_DIR / "gen_log_run4.json"
    log = {
        "task": "TASK_TURN4_A2",
        "model": MODEL,
        "endpoint": ENDPOINT,
        "started": datetime.now().isoformat(timespec="seconds"),
        "images": [],
    }
    for spec in SPECS:
        name = spec["name"]
        out_path = OUT_DIR / f"{name}.png"
        if out_path.exists():  # idempotent resume: never re-burn a done image
            print(f"[{name}] SKIP exists {out_path}", flush=True)
            log["images"].append({"file": name, "exit": 0, "skip": "exists"})
            continue
        if not spec["ref"].exists():
            print(f"[{name}] REF MISSING: {spec['ref']}", flush=True)
            log["images"].append({"file": name, "exit": 2, "error": f"ref missing: {spec['ref']}"})
            log_path.write_text(json.dumps(log, indent=2))
            continue
        (OUT_DIR / f"{name}.prompt.txt").write_text(spec["prompt"] + "\n")
        entry = {"file": name, "ref": str(spec["ref"].relative_to(REPO))}
        for attempt in (1, 2):
            t0 = time.time()
            try:
                raw = post_image(spec["prompt"], spec["ref"], api_key)
                dt = time.time() - t0
                out_path = OUT_DIR / f"{name}.png"
                out_path.write_bytes(raw)
                img, transp = png_stats(raw)
                entry.update({
                    "exit": 0, "attempt": attempt, "seconds": round(dt, 1),
                    "size": f"{img.width}x{img.height}", "bytes": len(raw),
                    "mode": img.mode, "transparent_pct": round(transp, 1),
                    "path": str(out_path.relative_to(REPO)),
                })
                print(f"[{name}] OK a{attempt}: {img.width}x{img.height} {img.mode} "
                      f"transp={transp:.1f}% {dt:.1f}s {len(raw)}B", flush=True)
                break
            except Exception as exc:  # log, retry once, then move on
                entry.update({
                    "exit": 1, "attempt": attempt,
                    "seconds": round(time.time() - t0, 1),
                    "error": f"{type(exc).__name__}: {exc}"[:300],
                })
                print(f"[{name}] a{attempt} FAIL: {exc}", flush=True)
        log["images"].append(entry)
        log_path.write_text(json.dumps(log, indent=2))
    log["finished"] = datetime.now().isoformat(timespec="seconds")
    log_path.write_text(json.dumps(log, indent=2))
    print(f"DONE gen_log_run4 exits={[e.get('exit') for e in log['images']]}", flush=True)


if __name__ == "__main__":
    main()
