import base64, json, os, re, sys, urllib.request
env = open(os.path.expanduser("~/project/OpenMontage/.env")).read()
key = re.search(r'OPENAI_API_KEY=(.+)', env).group(1).strip()
base = re.search(r'OPENAI_BASE_URL=(.+)', env).group(1).strip()

def gen(prompt, out, model="ag/gemini-3.1-flash-image"):
    req = urllib.request.Request(base + "/images/generations",
        data=json.dumps({"model": model, "prompt": prompt, "n": 1,
                         "response_format": "b64_json"}).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    r = json.loads(urllib.request.urlopen(req, timeout=180).read())
    b64 = r["data"][0].get("b64_json") or r["data"][0].get("image")
    png = base64.b64decode(b64 if "," not in b64 else b64.split(",",1)[1])
    open(out, "wb").write(png); print(out, len(png)//1024, "KB")

# full scene: cartoon narrator girl, mouth CLOSED, arm DOWN, flat background
gen("2D cartoon illustration, flat vector style, simple shapes. A cheerful Vietnamese girl narrator, upper-body, standing slightly left of center, facing viewer. Eyes open, MOUTH CLOSED smiling, right arm relaxed down. Character completely flat and static. Background: simple flat cream studio backdrop with a few simple geometric shapes, subtle. No text anywhere. Square 1:1.", "assets/scene.png")
