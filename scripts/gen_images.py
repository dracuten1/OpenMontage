#!/usr/bin/env python
"""Generate 4 news images via 9router. Primary ag/gemini-3.1-flash-image,
fallback cx/gpt-5.6-luna-image. Verify with PIL only. Run with repo venv."""
import base64
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = ROOT / "projects" / "news-daily-20261017"
IMG_DIR = PROJ / "assets" / "images"
PUBLIC = ROOT / "remotion-composer" / "public" / "news-daily-20261017"
PRIMARY = "ag/gemini-3.1-flash-image"
FALLBACK = "cx/gpt-5.6-luna-image"
SIZE = "1536x1024"

env = {}
for line in (ROOT / ".env").read_text().splitlines():
    m = re.match(r"\s*(OPENAI_API_KEY|OPENAI_BASE_URL)\s*=\s*\"?([^\"\n]+)\"?", line)
    if m:
        env[m.group(1)] = m.group(2).strip()
API_KEY = env["OPENAI_API_KEY"]
BASE = env.get("OPENAI_BASE_URL", "http://127.0.0.1:20128/v1").rstrip("/")
URL = f"{BASE}/images/generations"


def extract_images(text: str) -> list:
    """Handle both pure JSON and SSE (data: lines) responses."""
    blobs = []
    chunks = []
    for m in re.finditer(r"^data:\s*(\{.*\})\s*$", text, re.M):
        try:
            chunks.append(json.loads(m.group(1)))
        except json.JSONDecodeError:
            pass
    if not chunks:
        try:
            chunks = [json.loads(text)]
        except json.JSONDecodeError:
            return blobs
    for ch in chunks:
        data = ch.get("data") if isinstance(ch, dict) else None
        for item in data or []:
            if not isinstance(item, dict):
                continue
            if item.get("b64_json"):
                blobs.append(base64.b64decode(item["b64_json"]))
            elif item.get("url"):
                with urllib.request.urlopen(item["url"], timeout=120) as r:
                    blobs.append(r.read())
    return blobs


def gen(model: str, prompt: str) -> bytes:
    body = json.dumps({"model": model, "prompt": prompt, "size": SIZE, "n": 1}).encode()
    req = urllib.request.Request(URL, data=body, headers={
        "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        text = r.read().decode("utf-8", errors="replace")
    blobs = extract_images(text)
    if not blobs:
        raise RuntimeError(f"no image in response ({model}), head={text[:200]!r}")
    return blobs[0]


def verify_png(p: Path) -> str:
    from PIL import Image
    with Image.open(p) as im:
        im.load()
        assert im.mode in ("RGB", "RGBA"), f"mode={im.mode}"
        assert im.width >= 1000, f"width={im.width}"
        return f"{im.width}x{im.height}"


def main() -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    script = json.loads((PROJ / "script.json").read_text(encoding="utf-8"))
    manifest_path = PROJ / "artifacts" / "asset_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    results = {}
    for fname, prompt in script["image_prompts"].items():
        sid = fname.replace("img_", "").replace(".png", "")
        out = IMG_DIR / fname
        used = None
        err = None
        for model in (PRIMARY, FALLBACK):
            try:
                out.write_bytes(gen(model, prompt))
                res = verify_png(out)
                used = {"model": model, "resolution": res}
                break
            except Exception as e:
                err = f"{model}: {type(e).__name__} {e}"
        if not used:
            raise RuntimeError(f"FAILED {fname}: {err}")
        (PUBLIC / fname).write_bytes(out.read_bytes())
        manifest["assets"] = [a for a in manifest["assets"] if a["id"] != fname]
        manifest["assets"].append({
            "id": fname, "type": "image", "path": f"assets/images/{fname}",
            "source_tool": f"9router:{used['model']}", "scene_id": sid,
            "resolution": used["resolution"], "format": "png", "model": used["model"],
            "cost_usd": 0.0,
            "generation_summary": f"Editorial flat-style illustration (prompt): {prompt}",
        })
        results[fname] = used
        print(f"  {fname}: {used['model']} {used['resolution']}")

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({"job": "images", "count": len(results),
                      "models": {k: v["model"] for k, v in results.items()}}))


if __name__ == "__main__":
    main()
