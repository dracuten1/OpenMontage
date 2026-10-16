#!/usr/bin/env python3
"""SSOT still-based diff (turn5/turn6 grammar): render v6snap + v7 stills at
diagnostic + standard frames, diff bit-exact. Temp entry created/removed here."""
import json
import shutil
import subprocess
import time
from pathlib import Path
import numpy as np
from PIL import Image

R = Path('/Users/tuyennguyen/project/OpenMontage')
D = R/'character-performer/kids/turn7'
SNAP = D/'KidsStoryEp1Remake.v6.tsx'
TMP_SNAP = R/'remotion-composer/src/__lead_v6snap.tsx'
TMP_ENTRY = R/'remotion-composer/src/__lead_v6entry.tsx'
OUT6 = D/'still_v6'; OUT7 = D/'still_v7'
OUT6.mkdir(exist_ok=True); OUT7.mkdir(exist_ok=True)
FRAMES = [100, 190, 372, 534, 567, 600, 730, 750, 780, 812, 845, 886, 920, 1150]
ENTRY = '''import React from "react";
import { Composition, registerRoot } from "remotion";
import { KidsStoryEp1Remake as V6 } from "./__lead_v6snap";
registerRoot(() => (
  <Composition id="LeadV6" component={V6} durationInFrames={1230} fps={30} width={1080} height={1080} />
));
'''
def run(args, cwd=R/'remotion-composer'):
    p = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(f'{args}\n{p.stderr[-1500:]}')
    return p.stdout

try:
    shutil.copy2(SNAP, TMP_SNAP)
    TMP_ENTRY.write_text(ENTRY)
    t0 = time.time()
    for f in FRAMES:
        run(['npx','remotion','still','src/__lead_v6entry.tsx','LeadV6',str(OUT6/f'f{f:04d}.png'),'--frame',str(f),'--log=error'])
        run(['npx','remotion','still','KidsStoryEp1Remake',str(OUT7/f'f{f:04d}.png'),'--frame',str(f),'--log=error'])
        print(f'still f{f} done ({time.time()-t0:.0f}s)', flush=True)
finally:
    TMP_SNAP.unlink(missing_ok=True)
    TMP_ENTRY.unlink(missing_ok=True)

res = {}
for f in FRAMES:
    a = np.asarray(Image.open(OUT6/f'f{f:04d}.png').convert('RGB')).astype(np.int16)
    b = np.asarray(Image.open(OUT7/f'f{f:04d}.png').convert('RGB')).astype(np.int16)
    d = np.abs(a-b)
    res[f] = {'mean': float(d.mean()), 'nz': int(np.count_nonzero(d))}
    print(f'f{f}: mean {d.mean():.4f} nz {np.count_nonzero(d)}')
(D/'still_diff.json').write_text(json.dumps(res, indent=1))
outside = {f: r for f, r in res.items() if not (327 <= f < 372 or 459 <= f < 534)}
print('OUTSIDE-WINDOW stills:', {f: r['nz'] for f, r in outside.items()})
print('VERDICT:', 'PASS 0.0000' if all(r['nz'] == 0 for r in outside.values()) else 'FAIL')
