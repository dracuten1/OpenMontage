#!/usr/bin/env python3
"""PHASE-B joint-cap underpaint (TASK_FINISH_RIG s6) — head neck cap only.
Head sprite sits 2.5 BU BEHIND the shell plane, so a downward cap on the head
is hidden behind the shell at rest and only shows when the nod lifts the chin.
Cap color = parent (shell) palette at rest. Originals backed up to parts_orig/.
"""
import json, os, shutil, time
import numpy as np
from PIL import Image

T0 = time.time()
OUT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out'
PARTS = os.path.join(OUT, 'parts')
BAK = os.path.join(OUT, 'parts_orig')
os.makedirs(BAK, exist_ok=True)

head_p = os.path.join(PARTS, 'head.png')
shell_p = os.path.join(PARTS, 'shell.png')
if not os.path.exists(os.path.join(BAK, 'head.png')):
    shutil.copy(head_p, os.path.join(BAK, 'head.png'))

head = np.array(Image.open(head_p).convert('RGBA'), dtype='uint8')
shell = np.array(Image.open(shell_p).convert('RGBA'), dtype='int16')
H, W = head.shape[:2]
CAP = 40
stats = {'cap_px': 0, 'cols_capped': 0, 'edge_y_range': [None, None],
         'cap_len_px': CAP, 'canvas': [W, H]}

for x in range(845, 1158):
    col_a = head[:, x, 3]
    ys = np.nonzero(col_a > 10)[0]
    if not len(ys):
        continue
    y_b = int(ys.max())
    if not (540 <= y_b <= 760):
        continue
    stats['cols_capped'] += 1
    if stats['edge_y_range'][0] is None:
        stats['edge_y_range'] = [y_b, y_b]
    else:
        stats['edge_y_range'][0] = min(stats['edge_y_range'][0], y_b)
        stats['edge_y_range'][1] = max(stats['edge_y_range'][1], y_b)
    y1 = min(y_b + CAP, H - 1)
    for y in range(y_b + 1, y1 + 1):
        if head[y, x, 3] == 0 and shell[y, x, 3] > 0:
            head[y, x, 0:3] = shell[y, x, 0:3]
            head[y, x, 3] = 255
            stats['cap_px'] += 1

Image.fromarray(head, 'RGBA').save(head_p)
stats['t_s'] = round(time.time() - T0, 2)
json.dump(stats, open(os.path.join(OUT, 'underpaint_meta.json'), 'w'), indent=1)
print(json.dumps(stats))
print('UNDERPAINT_OK')
