import numpy as np
from PIL import Image
import os

PARTS = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out/parts'
BASE = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids'
m0 = Image.open(os.path.join(BASE, 'assets', 'depth_demo', 'turtle_m0.png')).convert('RGBA')
shell = Image.open(os.path.join(PARTS, 'shell.png')).convert('RGBA')
head = Image.open(os.path.join(PARTS, 'head.png')).convert('RGBA')

X0, Y0, X1, Y1 = 1290, 330, 1510, 570   # vung mat xa + mom
tiles = []
for im in (m0, shell, head):
    c = im.crop((X0, Y0, X1, Y1))
    bg = Image.new('RGBA', c.size, (255, 255, 255, 255))
    bg.alpha_composite(c)
    tiles.append(bg.convert('RGB').resize(((X1 - X0) * 2, (Y1 - Y0) * 2), Image.Resampling.LANCZOS))
sheet = Image.new('RGB', (tiles[0].width * 3 + 40, tiles[0].height + 20), 'white')
for i, t in enumerate(tiles):
    sheet.paste(t, (i * (t.width + 20) + 10, 10))
sheet.save(os.path.join(BASE, 'rig_turtle', 'out', 'dbg_3panel_fareye.png'))
print('PANEL_OK')
