#!/usr/bin/env python3
"""FIX2 verify — PIL alpha bbox: mouth patch (f150 solo) phải nằm TRONG vùng
ensemble head (f150 solo), KHÔNG thò qua mép phải ngoài head. Chạy bằng .venv."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOLO = os.path.join(ROOT, 'out', 'solo_fix2')
from PIL import Image

mouth = Image.open(os.path.join(SOLO, 'solo_mouth_f150.png')).convert('RGBA')
head = Image.open(os.path.join(SOLO, 'solo_head_f150.png')).convert('RGBA')
mb, hb = mouth.getbbox(), head.getbbox()  # alpha bbox
TOL = 15  # px — sai số render/anti-alias
inside = (mb[0] >= hb[0] - TOL and mb[1] >= hb[1] - TOL
          and mb[2] <= hb[2] + TOL and mb[3] <= hb[3] + TOL)
right_ok = mb[2] <= hb[2] + TOL  # "KHÔNG giao mép phải ngoài head"
ok = bool(inside and right_ok)
res = {'mouth_bbox': mb, 'head_bbox': hb, 'tol_px': TOL,
       'inside': bool(inside), 'right_edge_ok': bool(right_ok), 'ok': ok}
json.dump(res, open(os.path.join(ROOT, 'out', 'fix2_verify.json'), 'w'), indent=1)
print('[fix2-verify]', json.dumps(res))
print('FIX2_VERIFY_OK' if ok else 'FIX2_VERIFY_FAIL')
