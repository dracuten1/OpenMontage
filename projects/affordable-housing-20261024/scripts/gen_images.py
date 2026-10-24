#!/usr/bin/env python
"""Generate 8 stylized isometric 3D infographic scene illustrations via local 9router ($0)."""
import base64
import json
import re
import shutil
import sys
import time
import urllib.request
from pathlib import Path

sys.dont_write_bytecode = True

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
PROJ = ROOT / 'projects/affordable-housing-20261024'
IMG_DIR = PROJ / 'assets/images'
PUBLIC_DIR = ROOT / 'remotion-composer/public/affordable-housing-20261024'

env = {}
for line in (ROOT / '.env').read_text(encoding='utf-8').splitlines():
    if '=' in line and not line.strip().startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"').strip("'")

BASE = env.get('OPENAI_BASE_URL', 'http://127.0.0.1:20128/v1').rstrip('/')
KEY = env.get('OPENAI_API_KEY', '')
MODELS = ['ag/gemini-3.1-flash-image', 'cx/gpt-5.6-luna-image', 'cx/gpt-image-2.5']

PROMPTS = {
    'sc01_bg.png': (
        "Stylized 3D isometric editorial infographic illustration on a deep midnight navy background (#0B132B). "
        "In the center, a miniature isometric diorama of a young Vietnamese office-worker couple sitting at a glowing glass desk "
        "looking up at floating hologram apartment towers and a glowing golden price tag icon. Clean geometric vector-3D aesthetic, "
        "Kurzgesagt and Visual Capitalist inspired, warm amber and coral neon accents, generous dark negative space at top and bottom for HUD overlays, no text, no watermark."
    ),
    'sc02_bg.png': (
        "Stylized 3D isometric architectural infographic illustration on a deep dark slate-blue background (#0B132B). "
        "Two miniature glowing isometric city skylines representing Hanoi and Ho Chi Minh City connected by luminous cyan blueprint grid lines "
        "and a glowing legal document pedestal in the center. Clean modern vector-3D diorama, warm gold and cyan rim lighting, "
        "ample dark negative space at top and bottom for data cards, no text, no watermark."
    ),
    'sc03_bg.png': (
        "Stylized 3D isometric urban economic infographic illustration on a dark navy background (#0B132B). "
        "Three distinct architectural tiers across a glowing isometric platform: on the left a small modest low-rise housing block behind a locked gate, "
        "in the middle a dramatic glowing canyon gap with a floating question mark bridge, and on the right a towering ultra-tall "
        "luxury glass skyscraper reaching into golden clouds. High contrast editorial 3D vector art, no text, no watermark."
    ),
    'sc04_bg.png': (
        "Stylized 3D isometric architectural cutaway blueprint of a compact 50-square-meter 2-bedroom urban apartment floating like a hologram "
        "above a glowing financial calculator and stacks of golden coins on a dark midnight navy background (#0B132B). "
        "Crisp cyan wireframe lines, glowing coral highlights, clean editorial infographic style, generous dark space at top and bottom, no text, no watermark."
    ),
    'sc05_bg.png': (
        "Stylized 3D isometric financial cash-flow diorama on a deep navy background (#0B132B). "
        "A glowing glass cylindrical income vault being divided into three glowing pipelines: a massive coral-red pipeline flowing into a bank tower, "
        "a medium amber pipeline flowing into a grocery basket, and a tiny cyan droplet falling into a small piggy bank. "
        "Clean editorial 3D infographic art, dramatic studio lighting, no text, no watermark."
    ),
    'sc06_bg.png': (
        "Stylized 3D isometric financial stress-test illustration on a dark midnight background (#0B132B). "
        "A miniature modern apartment building resting on a giant glowing pressure gauge dial with red warning sparks and upward-pointing interest rate arrows. "
        "Dramatic coral-red and amber neon lighting, clean geometric 3D infographic style, generous dark space at top and bottom, no text, no watermark."
    ),
    'sc07_bg.png': (
        "Stylized 3D isometric surreal infographic illustration on a dark navy background (#0B132B). "
        "A miniature office worker climbing an impossibly tall spiral calendar staircase of 39 glowing steps winding up into the clouds toward a floating golden house key. "
        "Editorial Visual Capitalist / Kurzgesagt 3D style, cyan and coral highlights, ample dark negative space at top and bottom, no text, no watermark."
    ),
    'sc08_bg.png': (
        "Stylized 3D isometric transit-oriented development urban planning illustration on a deep navy background (#0B132B). "
        "A sleek glowing cyan elevated Metro train gliding outward from a dense expensive red-lit city core along radial tracks toward lush green, "
        "welcoming satellite residential neighborhoods. Clean futuristic infographic 3D diorama, no text, no watermark."
    ),
}


def gen(prompt, model, size='1024x1536', timeout=180):
    body = json.dumps({'model': model, 'prompt': prompt, 'size': size, 'n': 1}).encode()
    req = urllib.request.Request(BASE + '/images/generations', data=body, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {KEY}',
        'Accept': 'text/event-stream',
    })
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode('utf-8', errors='replace')
    b64 = None
    try:
        j = json.loads(raw)
        d0 = j['data'][0]
        b64 = d0.get('b64_json') or d0.get('image')
        if b64 and b64.startswith('data:'):
            b64 = b64.split(',', 1)[1]
    except Exception:
        for pat in (r'"b64_json":\s*"([^"]+)"', r'data:image/[a-zA-Z]+;base64,([^"\s]+)'):
            m = re.search(pat, raw)
            if m:
                b64 = m.group(1)
                break
        if not b64:
            raise RuntimeError(f'no image in response: {raw[:240]}')
    return base64.b64decode(b64), time.time() - t0


def main():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    results = {}

    for fname, prompt in PROMPTS.items():
        out_path = IMG_DIR / fname
        pub_path = PUBLIC_DIR / fname
        if out_path.exists() and out_path.stat().st_size > 20000:
            shutil.copy2(out_path, pub_path)
            results[fname] = {'status': 'cached', 'bytes': out_path.stat().st_size}
            print(f'[cached] {fname} ({out_path.stat().st_size // 1024}KB)', flush=True)
            continue

        got = False
        for model in MODELS:
            try:
                data, dt = gen(prompt, model, '1024x1536')
                out_path.write_bytes(data)
                shutil.copy2(out_path, pub_path)
                results[fname] = {'status': 'generated', 'model': model, 'seconds': round(dt, 1), 'bytes': len(data)}
                print(f'[ok] {fname} <- {model} ({dt:.1f}s, {len(data) // 1024}KB)', flush=True)
                got = True
                break
            except Exception as e:
                print(f'[err] {fname} {model}: {str(e)[:160]}', flush=True)
        if not got:
            results[fname] = {'status': 'failed'}

    print('GEN_IMAGES_RESULT ' + json.dumps(results, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
