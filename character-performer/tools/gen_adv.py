import base64, json, os, re, urllib.request
env = open(os.path.expanduser("~/project/OpenMontage/.env")).read()
key = re.search(r'OPENAI_API_KEY=(.+)', env).group(1).strip()
base = re.search(r'OPENAI_BASE_URL=(.+)', env).group(1).strip()
def gen(prompt, out, model="ag/gemini-3.1-flash-image"):
    req = urllib.request.Request(base + "/images/generations",
        data=json.dumps({"model": model, "prompt": prompt, "n": 1, "response_format": "b64_json"}).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    r = json.loads(urllib.request.urlopen(req, timeout=240).read())
    b64 = r["data"][0].get("b64_json") or r["data"][0].get("image")
    open(out, "wb").write(base64.b64decode(b64.split(",",1)[1] if "," in b64 else b64))
    print(out, "OK")
gen("2D cartoon illustration, flat vector style, clean outlines, warm colors. Ancient Vietnamese King An Duong Vuong, upper body, standing slightly left of center facing viewer. He wears a red-gold royal robe and a traditional king's cap, holds a golden repeating crossbow (no than) diagonally in his hands. MOUTH CLOSED confident smile, eyes open looking at viewer. Background: flat cream ancient citadel wall of Co Loa with simple geometric spiral pattern, minimal, static. No text. Square 1:1.", "assets/adv_scene.png")
