#!/usr/bin/env python3
"""Joint-cap underpaint v2 (seam fix attempt). Render-2 showed f13 neck gap
growth 11->29px / 13->120 cols: the nod retracts the head out of the shell
notch and the 40px shell-conditional cap (v1) misses it (0/60 gap cols had
shell coverage in part space). v2: CAP=110px from the TRUE head bottom edge
(detected on parts_orig/head.png), paint where head alpha==0:
 - shell alpha>0            -> shell palette (hidden behind shell at rest)
 - shell alpha==0, pixel inside the shell sprite's vertical span in that
   column, y<806            -> head-edge color (visible neck extension
                                through the notch; shell edges mask sides)
 - otherwise                -> skip (no floating pixels)
Originals stay in parts_orig/. Writes out/underpaint2_meta.json."""
import json, os, shutil, time
import numpy as np
from PIL import Image

T0 = time.time()
OUT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out'
PARTS = os.path.join(OUT, 'parts')
BAK = os.path.join(OUT, 'parts_orig')

head_p = os.path.join(PARTS, 'head.png')
orig_p = os.path.join(BAK, 'head.png')
shell_p = os.path.join(PARTS, 'shell.png')
if not os.path.exists(orig_p):
    shutil.copy(head_p, orig_p)   # first-ever backup

head = np.array(Image.open(head_p).convert('RGBA'), dtype='uint8')
orig = np.array(Image.open(orig_p).convert('RGBA'))
shell = np.array(Image.open(shell_p).convert('RGBA'), dtype='uint8')
H, W = head.shape[:2]
CAP = 110
stats = {'cap_px_shell_hidden': 0, 'cap_px_notch_visible': 0, 'cols_painted': 0,
         'edge_y_range': [None, None], 'cap_len_px': CAP, 'canvas': [W, H]}

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
    # head edge color: last opaque original rows (mean of 5)
    ey = slice(max(y_b - 4, 0), y_b + 1)
    edge_rgb = orig[ey, x, 0:3][oa[ey] > 10].mean(axis=0).astype('uint8')
    # shell vertical span in this column
    ss = np.nonzero(shell[:, x, 3] > 10)[0]
    s_top, s_bot = (int(ss.min()), int(ss.max())) if len(ss) else (None, None)
    y1 = min(y_b + CAP, 806, H - 1)
    for y in range(y_b + 1, y1 + 1):
        if head[y, x, 3] != 0:
            continue
        if shell[y, x, 3] > 0:
            head[y, x, 0:3] = shell[y, x, 0:3]
            head[y, x, 3] = 255
            stats['cap_px_shell_hidden'] += 1
        elif s_top is not None and s_top < y < min(s_bot, 806):
            head[y, x, 0:3] = edge_rgb
            head[y, x, 3] = 255
            stats['cap_px_notch_visible'] += 1

Image.fromarray(head, 'RGBA').save(head_p)
stats['t_s'] = round(time.time() - T0, 2)
json.dump(stats, open(os.path.join(OUT, 'underpaint2_meta.json'), 'w'), indent=1)
print(json.dumps(stats))
print('UNDERPAINT2_OK')
