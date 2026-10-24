#!/usr/bin/env python
"""Bounded read-only semantic inventory and sentence/frame evidence."""
import json,re
from pathlib import Path
from collections import Counter
P=Path('/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong'); SRC=P.parent.parent/'remotion-composer/src/thanh-giong'
sp=json.loads((P/'artifacts/script.json').read_text());plan=json.loads((P/'artifacts/scene_plan.json').read_text());tim=json.loads((P/'artifacts/scene_timing.json').read_text());ws=json.loads((P/'assets/audio/transcripts/narration_words.json').read_text())
tm={x['sceneId']:x for x in tim['scenes']};pl={x['id']:x for x in plan['scenes']}
sections={s['id']:s for s in sp['sections']}
out=[]
for g in 'abcdef':
    text=(SRC/f'scenes-{g}.tsx').read_text(); matches=list(re.finditer(r'export const (Sc\d+)\b',text))
    for i,m in enumerate(matches):
        sid='sc'+m[1][2:];body=text[m.start():matches[i+1].start() if i+1<len(matches) else len(text)];t=tm[sid];sec=t['sectionId']
        lo=t['startFrame']/30;hi=lo+t['durationInFrames']/30
        nums=[]
        # Keep string attrs + A expressions + timing math and plain JSX text (not svg glyph paths)
        lines=[]
        for ln in body.splitlines():
            if any(x in ln for x in [' A(', 'startFrac=', 'endFrac=', 'SceneTitle ', 'TextCard ', 'SourceTag ', 'sublabel=', 'label=', 'title=', 'caption=', 'twF(', 'slice(', 'opacity:', 'const f','const a','const show','const char','const nChars','text:','label:','source:','at:']):
                if len(ln)>280:ln=ln[:280]+'…'
                lines.append(ln.strip())
        out.append({'id':sid,'group':g,'section':sec,'win':[round(lo,3),round(hi,3)],'desc':pl[sid]['description'],'anchors':re.findall(r'\bA\(\s*"([^"]+)"\s*(?:,\s*(\d+))?\s*\)',body),'relevant_code':'\n'.join(lines),'spoken':' '.join(w['word'] for w in ws[sec] if w['start']>=lo-0.4 and w['start']<hi),'full_section':sections[sec].get('provider_text',sections[sec].get('text'))})
out.sort(key=lambda x:x['id']);(P/'qc/semantic_inventory.json').write_text(json.dumps(out,ensure_ascii=False,indent=1))
for g in 'abcdef':
    rows=[x for x in out if x['group']==g]
    (P/f'qc/semantic_{g}.txt').write_text('\n\n'.join(f"{x['id']} {x['section']} WIN {x['win']}\nDESC {x['desc']}\nSPOKEN {x['spoken']}\nCODE\n{x['relevant_code']}" for x in rows))
print('scene count',len(out),'script sections',len(sections),'sentences',sum(sum(bool(re.search(r'[.!?…]',w['word'])) for w in wlist) for wlist in ws.values()))
print('SECTION SCHEMA',json.dumps(sp['sections'][0],ensure_ascii=False)[:900])
for k in ['s01','s02','s04','s09','s11','s15','s20','s23','s24','s25','s27']:
    print('\n',k)
    for w in ws[k]:
        if re.search(r'[.!?…]',w['word']):print(f" {w['start']:.3f}-{w['end']:.3f} {w['word']}",end=';')
    print()
print('files semantic_[a..f].txt + semantic_inventory.json ready')
