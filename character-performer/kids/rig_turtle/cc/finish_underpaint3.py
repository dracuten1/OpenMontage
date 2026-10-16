#!/usr/bin/env python3
"""Joint-cap underpaint v3 (seam fix attempt 2). Mechanism (measured): the
f13 neck-region gap growth (11->29px worst, 13->120 cols) is the NEAR-FRONT
LEG vacating under-chin columns (~30px centroid swing); head in-plane roll is
only ~8px horizontal at that lever. v2's shell-span rule painted 0 visible px.
v3 paints below the TRUE head bottom edge (parts_orig) wherever head alpha==0
AND some OTHER part covers at rest (shell/legs/tail are canvas-aligned at
rest): shell-palette where shell covers (hidden), head-edge color elsewhere
(hidden behind the leg at rest; becomes the visible neck when the leg swings).
Never paints pixels uncovered at rest (no floating). -> underpaint3_meta.json"""
import json, os, shutil, time
import numpy as np
from PIL import Image

T0 = time.time()
OUT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out'
PARTS = os.path.join(OUT, 'parts')
BAK = os.path.join(OUT, 'parts_orig')

head_p = os.path.join(PARTS, 'head.png')
orig_p = os.path.join(BAK, 'head.png')
head = np.array(Image.open(head_p).convert('RGBA'), dtype='uint8')
orig = np.array(Image.open(orig_p).convert('RGBA'))
shell = np.array(Image.open(os.path.join(PARTS, 'shell.png')).convert('RGBA'))
H, W = head.shape[:2]

# rest coverage by OTHER parts (canvas-aligned at rest per parts_meta bboxes)
others = np.zeros((H, W), dtype=bool)
for fn in ('shell.png', 'leg_near_front.png', 'leg_far_front.png',
           'leg_near_hind.png', 'leg_far_hind.png', 'tail.png'):
    a = np.array(Image.open(os.path.join(PARTS, fn)).convert('RGBA'))[:, :, 3] > 10
    others |= a
shell_m = shell[:, :, 3] > 10

CAP = 110
stats = {'cap_px_shell_palette': 0, 'cap_px_edge_color': 0, 'cols_painted': 0,
         'edge_y_range': [None, None], 'cap_len_px': CAP, 'skipped_uncovered_px': 0}

for x in range(845, 1158):
    oa = orig[:, x, 3]
    ys = np.nonzero(oa > 10)[0]
    if not len(ys):
        continue
    y_b = int(ys.max())
    if not (540 <= y_b <= 760):
        continue
    stats['cols_painted'] += 1
    if stats['edge_y_range'][0] is None:
        stats['edge_y_range'] = [y_b, y_b]
    else:
        stats['edge_y_range'][0] = min(stats['edge_y_range'][0], y_b)
        stats['edge_y_range'][1] = max(stats['edge_y_range'][1], y_b)
    ey = slice(max(y_b - 4, 0), y_b + 1)
    edge_rgb = orig[ey, x, 0:3][oa[ey] > 10].mean(axis=0).astype('uint8')
    y1 = min(y_b + CAP, 806, H - 1)
    for y in range(y_b + 1, y1 + 1):
        if head[y, x, 3] != 0:
            continue
        if shell_m[y, x]:
            head[y, x, 0:3] = shell[y, x, 0:3]
            head[y, x, 3] = 255
            stats['cap_px_shell_palette'] += 1
        elif others[y, x]:
            head[y, x, 0:3] = edge_rgb
            head[y, x, 3] = 255
            stats['cap_px_edge_color'] += 1
        else:
            stats['skipped_uncovered_px'] += 1

Image.fromarray(head, 'RGBA').save(head_p)
stats['t_s'] = round(time.time() - T0, 2)
json.dump(stats, open(os.path.join(OUT, 'underpaint3_meta.json'), 'w'), indent=1)
print(json.dumps(stats))
print('UNDERPAINT3_OK')
