import base64, json, os, re, urllib.request
env = open(os.path.expanduser("~/project/OpenMontage/.env")).read()
key = re.search(r'OPENAI_API_KEY=(.+)', env).group(1).strip()
base = re.search(r'OPENAI_BASE_URL=(.+)', env).group(1).strip()
def gen(prompt, out):
    req = urllib.request.Request(base + "/images/generations",
        data=json.dumps({"model": "ag/gemini-3.1-flash-image", "prompt": prompt, "n": 1,
                         "response_format": "b64_json"}).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    r = json.loads(urllib.request.urlopen(req, timeout=240).read())
    b64 = r["data"][0].get("b64_json") or r["data"][0].get("image")
    open(out, "wb").write(base64.b64decode(b64.split(",",1)[1] if "," in b64 else b64))
    print(out, "OK")
gen("2D cartoon illustration for young children, flat vector style, thick dark outlines, bright cheerful colors. A cute white rabbit storyteller with a BIG head, BIG sparkly eyes, long upright ears, pink inner ears, wearing a little red vest, upper body facing viewer, one paw raised waving. MOUTH CLOSED in a gentle smile. Background: simple sunny green meadow, a few big simple flowers, rolling hills, one big smiling sun, minimal, completely static. No text anywhere. Square 1:1.", "kids/assets/k_base.png")
