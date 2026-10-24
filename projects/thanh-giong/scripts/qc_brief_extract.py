import json,re
from pathlib import Path
P=Path('/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong');S=P.parent.parent/'remotion-composer/src/thanh-giong'
scr=json.loads((P/'artifacts/script.json').read_text());scs=json.loads((P/'artifacts/scene_plan.json').read_text())['scenes']
for sec in scr['sections']:
 print('\n'+sec['id']+' '+sec['label']+'\n'+sec['text'])
 print('PLAN:')
 for sc in scs:
  if sc['script_section_id']==sec['id']:print(sc['id'],sc.get('overlay_notes'))
print('\nMETADATA\n'+(P/'exports/metadata/youtube.json').read_text())
for sid,g in [('sc007','a'),('sc052','d'),('sc066','f'),('sc068','b'),('sc069','c')]:
 t=(S/f'scenes-{g}.tsx').read_text();n=int(sid[2:]);m=re.search('export const Sc%03d'%n,t);en=t.find('export const',m.end());print('\nSOURCE',sid,'\n',t[m.start():en if en!=-1 else len(t)])
