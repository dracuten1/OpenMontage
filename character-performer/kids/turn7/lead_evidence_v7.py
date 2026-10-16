#!/usr/bin/env python3
"""Build before/after evidence boards (gaze + scale) from v6 probes and v7 output."""
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

R = Path('/Users/tuyennguyen/project/OpenMontage')
D = R/'character-performer/kids/turn7'
V6 = R/'remotion-composer/out/kids_ep1_remake_v6.mp4'
V7 = R/'remotion-composer/out/kids_ep1_remake_v7.mp4'
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 24)
small = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 18)
CROP = (160, 460, 1030, 930)

def extract(mp4, f, out):
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(mp4),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(out)], check=True)
    return Image.open(out).convert('RGB').crop(CROP).resize((690, 254))

def frame_at(mp4, f):
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.png', dir=str(D), delete=False) as tf:
        p = Path(tf.name)
    extract(mp4, f, p)
    im = Image.open(p).convert('RGB').crop(CROP).resize((690, 254))
    p.unlink()
    return im

def shell(marks, gaze, scale):
    board = Image.new('RGB', (1460, 340 + 300*len(marks)), '#f2f4f7')
    d = ImageDraw.Draw(board)
    d.text((20, 14), 'USER FEEDBACK v6 -> v7 | Scene 1 dialogue', font=font, fill='#111')
    d.text((20, 48), gaze, font=small, fill='#333')
    d.text((760, 48), scale, font=small, fill='#333')
    d.text((20, 84), 'LEFT = v6 (truoc)   |   RIGHT = v7 (sau)   [crop x160-1030 y460-930]', font=small, fill='#555')
    for i, (f, label) in enumerate(marks):
        y = 120 + 300*i
        d.text((20, y), label, font=small, fill='#111')
        board.paste(frame_at(V6, f), (20, y+26))
        board.paste(frame_at(V7, f), (750, y+26))
    return board

marks1 = [(333, 'f333 11.10s | thỏ nói - MID cue C'), (350, 'f350 11.67s | MID cue B'), (361, 'f361 12.03s | MID cue F'),
          (367, 'f367 12.23s | MID cue A'), (370, 'f370 12.32s | MID cue B / cuối cửa 12.4')]
marks2 = [(463, 'f463 15.43s | rùa nói - MID cue A'), (486, 'f486 16.20s | MID cue C'), (499, 'f499 16.62s | MID cue B'),
          (508, 'f508 16.92s | MID cue B'), (527, 'f527 17.57s | cuối cửa 17.8')]
shell(marks1, 'Y/C 1 eye-contact: thỏ(trái) nhìn SANG PHẢI -> rùa; rùa(phải) nhìn SANG TRÁI -> thỏ',
      'Y/C 2 scale: close-up THỎ 1.22x @430,800 (GIỮ); rùa counter-scale NET 1.0 - KHÔNG bị phóng to').save(D/'board_v7_11s.jpg', quality=93)
shell(marks2, 'Y/C 1 eye-contact: rùa(trái-phải?) nói, cả 2 nhìn nhau suốt cửa',
      'Y/C 2 scale: zoom RÙA 1.18x -> camera 1.0 identity - không còn phóng to rùa').save(D/'board_v7_17s.jpg', quality=93)
print('boards saved:', D/'board_v7_11s.jpg', D/'board_v7_17s.jpg')
