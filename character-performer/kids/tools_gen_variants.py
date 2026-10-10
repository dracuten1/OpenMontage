import base64, json, os, re, urllib.request
env = open(os.path.expanduser("~/project/OpenMontage/.env")).read()
key = re.search(r'OPENAI_API_KEY=(.+)', env).group(1).strip()
base = re.search(r'OPENAI_BASE_URL=(.+)', env).group(1).strip()
data_uri = "data:image/png;base64," + base64.b64encode(open("kids/assets/k_base.png","rb").read()).decode()
KEEP = ("Keep EVERYTHING else exactly unchanged: same cute white rabbit, same big head and sparkly eyes, "
        "same red vest, same raised waving paw, same meadow background with smiling sun, same thick outlines, "
        "bright flat colors, children's book style. No text.")
JOBS = {
  "k_v0":  "Edit: the rabbit's mouth CLOSED in a gentle warm smile (lips together). " + KEEP,
  "k_v2":  "Edit: the rabbit's mouth a small ROUND 'O' shape, curious surprised expression. " + KEEP,
  "k_v3":  "Edit: the rabbit's mouth WIDE OPEN in a joyful laugh, big happy open mouth. " + KEEP,
  "k_blink": "Edit: the rabbit's eyes CLOSED as happy curved arcs (joyful squinting smile), keep small open smiling mouth. " + KEEP,
}
def gen(prompt, out):
    req = urllib.request.Request(base + "/images/generations",
        data=json.dumps({"model": "cx/gpt-image-2.5-sunburst", "prompt": prompt,
                         "n": 1, "image": data_uri}).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                 "Accept": "text/event-stream"})
    body = urllib.request.urlopen(req, timeout=300).read().decode()
    img = None
    for chunk in re.findall(r'data:\s*(\{.*\})', body):
        try:
            d = json.loads(chunk)
            for it in d.get("data", []):
                b = it.get("b64_json") or it.get("image")
                if b: img = b
        except Exception: pass
    if not img: raise RuntimeError("no image: " + body[-200:])
    open(out, "wb").write(base64.b64decode(img.split(",",1)[1] if "," in img else img))
    print(out, "OK")
for n,p in JOBS.items(): gen(p, f"kids/assets/{n}.png")
