#!/usr/bin/env python3
"""Cross-check: still-v6 vs sequence-v6 at noisy frames (seals sequence-noise diagnosis)."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

D = Path('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn7')
out = {}
for f in [730, 780, 845, 886, 100, 600]:
    a = np.asarray(Image.open(D/f'still_v6/f{f:04d}.png').convert('RGB')).astype(np.int16)
    b = np.asarray(Image.open(D/f'lossless/v6/element-{f:04d}.png').convert('RGB')).astype(np.int16)
    c = np.asarray(Image.open(D/f'still_v7/f{f:04d}.png').convert('RGB')).astype(np.int16)
    out[f] = {'stillV6_vs_seqV6_nz': int(np.count_nonzero(np.abs(a-b))),
              'stillV6_vs_stillV7_nz': int(np.count_nonzero(np.abs(a-c)))}
    print(f, out[f])
(D/'seq_noise_crosscheck.json').write_text(json.dumps(out, indent=1))
