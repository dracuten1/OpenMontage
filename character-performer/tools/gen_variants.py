"""img2img variants via 9router cx/gpt-image-2.5-sunburst (identity-preserving, SSE)."""
import base64, json, os, re, sys, urllib.request

env = open(os.path.expanduser("~/project/OpenMontage/.env")).read()
key = re.search(r'OPENAI_API_KEY=(.+)', env).group(1).strip()
base = re.search(r'OPENAI_BASE_URL=(.+)', env).group(1).strip()
SRC = "assets/adv_scene.png"
data_uri = "data:image/png;base64," + base64.b64encode(open(SRC, "rb").read()).decode()

KEEP = ("Keep EVERYTHING else exactly unchanged: same pose, same face, same eyes open, "
        "same crossbow, same background, same flat cartoon style, same line weight and palette. No text.")

JOBS = {
  "v_mouthA": "Edit this illustration: open the king's mouth WIDE as if shouting 'AH' — large dark rounded open mouth with subtle inner shading and a thin row of upper teeth. " + KEEP,
  "v_mouthB": "Edit this illustration: the king's mouth HALF-OPEN as if saying 'OH' — medium dark rounded oval opening. " + KEEP,
  "v_mouthD": "Edit this illustration: the king's mouth SLIGHTLY OPEN — narrow dark gap between the lips, lips parted a little. " + KEEP,
  "v_eyes":   "Edit this illustration: the king's eyes CLOSED — gentle downward-curved eyelid lines where the eyes were, calm expression. Mouth stays closed smiling. " + KEEP,
}

def gen(prompt, out):
    req = urllib.request.Request(base + "/images/generations",
        data=json.dumps({"model": "cx/gpt-image-2.5-sunburst", "prompt": prompt,
                         "n": 1, "image": data_uri}).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                 "Accept": "text/event-stream"})
    body = urllib.request.urlopen(req, timeout=300).read().decode()
    # SSE: image arrives in the final event: done data line
    m = re.findall(r'data:\s*(\{.*\})', body)
    img = None
    for chunk in m:
        try:
            d = json.loads(chunk)
            for it in d.get("data", []):
                b = it.get("b64_json") or it.get("image")
                if b: img = b
        except Exception: pass
    if not img: raise RuntimeError("no image in SSE: " + body[-300:])
    open(out, "wb").write(base64.b64decode(img.split(",", 1)[1] if "," in img else img))
    print(out, "OK")

for name, p in JOBS.items():
    gen(p, f"assets/{name}.png")
