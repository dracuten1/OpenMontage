#!/usr/bin/env python3
"""Independent pre-edit QC: snapshot v6 and inspect dialogue facing."""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

R = Path('/Users/tuyennguyen/project/OpenMontage')
D = R / 'character-performer/kids/turn7'
B = R / 'remotion-composer/public/character-performer/kids'
D.mkdir(parents=True, exist_ok=True)
(D / 'before_mp4').mkdir(exist_ok=True)
src = R / 'remotion-composer/src/KidsStoryEp1Remake.tsx'
snapshot = D / 'KidsStoryEp1Remake.v6.tsx'
if not snapshot.exists():
    shutil.copy2(src, snapshot)
files = [src, R/'remotion-composer/src/Root.tsx', R/'remotion-composer/out/kids_ep1_remake_v6.mp4']
files += sorted(p for p in B.rglob('*') if p.is_file())
manifest = {str(p.relative_to(R)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
if not (D/'baseline_hashes.json').exists():
    (D/'baseline_hashes.json').write_text(json.dumps(manifest, indent=2))
print('Hash baseline count:', len(manifest), 'free GB:', round(shutil.disk_usage(R).free/1e9, 2))
timeline = json.loads((B/'dialogue_v2/timeline.json').read_text())
mid = []
for line in timeline['lines']:
    if line['i'] not in [2, 3]:
        continue
    cues = json.loads((B/f"dialogue_v2/d{line['i']}_cues.json").read_text())['mouthCues']
    for c in cues:
        g0, g1 = line['start']+c['start'], line['start']+c['end']
        if c['value'] != 'X' and g1-g0 >= .07 and ((line['i']==2 and 10.9<= (g0+g1)/2 <12.4) or (line['i']==3 and 15.3<= (g0+g1)/2 <17.8)):
            mid.append({'line':line['i'], 'cue':c['value'], 'start':g0, 'end':g1, 'mid':(g0+g1)/2, 'frame':round((g0+g1)/2*30)})
print('Dialogue lines:', json.dumps([l for l in timeline['lines'] if l['i'] in [2,3]], ensure_ascii=False))
print('MID candidates:', json.dumps(mid, indent=2))
(D/'midcues.json').write_text(json.dumps(mid, indent=2))
frames = [333, 350, 361, 466, 485, 505, 513, 527]
video = R/'remotion-composer/out/kids_ep1_remake_v6.mp4'
for f in frames:
    target = D/f'before_mp4/f{f:04d}.png'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(video),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(target)], check=True)
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 22)
board = Image.new('RGB',(1440, 4*300),(242,244,247))
draw = ImageDraw.Draw(board)
for idx,f in enumerate(frames):
    im=Image.open(D/f'before_mp4/f{f:04d}.png').convert('RGB')
    crop=im.crop((160,460,1030,930)).resize((720,265))
    x=(idx%2)*720; y=(idx//2)*300
    board.paste(crop,(x,y+35)); draw.text((x+12,y+6),f'v6 f{f} | {f/30:.3f}s',font=font,fill='#111111')
board.save(D/'before_facing_board.jpg',quality=94)
asset_board=Image.new('RGB',(1200,700),'#e9e2d3')
draw=ImageDraw.Draw(asset_board)
for j,(name,rel) in enumerate([('rabbit_taunt','ep1_ai/rabbit_taunt.png'),('turtle_side','depth_demo/turtle_side_m0.png')]):
    im=Image.open(B/rel).convert('RGBA')
    print(name, im.size, 'alpha bbox', im.getbbox())
    im=im.crop(im.getbbox()); im.thumbnail((520,290))
    for row,mirrored in enumerate([False,True]):
        shown=ImageOps.mirror(im) if mirrored else im
        x=j*600+(600-shown.width)//2; y=row*350+45
        asset_board.paste(shown,(x,y),shown)
        draw.text((j*600+10,row*350+10),f'{name} | scaleX={-1 if mirrored else 1}',font=font,fill='black')
asset_board.save(D/'source_facing_board.jpg', quality=95)
print('Proof boards:', D/'before_facing_board.jpg', D/'source_facing_board.jpg')
