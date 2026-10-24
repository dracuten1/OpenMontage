#!/usr/bin/env python
"""Aggregate real sweep evidence, contact sheets, source text audit."""
import json,re
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
P=Path('/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong')
SRC=P.parent.parent/'remotion-composer/src/thanh-giong'
QC=P/'qc'; SW=QC/'scene_sweep'
d=json.loads((SW/'scene_sweep_report.json').read_text())
flag=[]
for sid,s in d['scenes'].items():
    counts={k:len(s.get(k,[])) for k in ['edge_clip','panel_clip','dense_overlap']}
    if any(counts.values()):flag.append({'scene':sid,**counts})
print('FLAGGED',json.dumps(flag,ensure_ascii=False))
for start in range(0,len(flag),9):
    canvas=Image.new('RGB',(1440,864),(35,32,30)); draw=ImageDraw.Draw(canvas)
    for j,row in enumerate(flag[start:start+9]):
        sid=row['scene']; fr=d['scenes'][sid]['frames'][-1]; f=SW/fr['png']
        im=Image.open(f).convert('RGB'); im=ImageOps.fit(im,(480,270))
        x=(j%3)*480;y=(j//3)*288
        canvas.paste(im,(x,y+18));draw.text((x+6,y+3),str(row),fill='white')
    out=QC/f'flagged_{start//9+1}.jpg';canvas.save(out,quality=93);print(out)
# 10-per-sheet all scene end frames, preserved review manifest.
review=[]
for start in range(0,70,10):
    canvas=Image.new('RGB',(1920,1180),(35,32,30)); draw=ImageDraw.Draw(canvas)
    for j,(sid,s) in enumerate(list(d['scenes'].items())[start:start+10]):
        fr=s['frames'][-1]; im=Image.open(SW/fr['png']).convert('RGB'); im=im.resize((640,360))
        x=(j%3)*640;y=(j//3)*295
        # use 512x288 instead at rows 295; 3 cols => width1536.
        im=im.resize((512,288));x=(j%3)*640
        canvas.paste(im,(x,y+7));draw.text((x+5,y+8),f'{sid} f{fr["frame"]}',fill='yellow')
        review.append({'scene':sid,'frame':fr['frame'],'path':str(SW/fr['png'])})
    out=QC/f'all_ends_{start//10+1}.jpg';canvas.save(out,quality=92);print(out)
(QC/'review_frame_manifest.json').write_text(json.dumps(review,indent=2))
# Compact source per scene plus actual section text for QC (not changes).
sp=json.loads((P/'artifacts/script.json').read_text())
print('SCRIPT KEYS',list(sp))
for g in 'abcdef':
    txt=(SRC/f'scenes-{g}.tsx').read_text()
    print('GROUP',g,'f07',txt.count('f07-hung-vuong'),'A count',len(re.findall(r'\bA\(',txt)))
    if g=='a': print('SOURCE FIRST 100 LINES','\n'.join(txt.splitlines()[:100]))
print('PANEL',json.dumps(d['scenes']['sc052']['panel_clip'],ensure_ascii=False))
