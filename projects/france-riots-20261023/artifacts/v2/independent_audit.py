"""Independent read-only composition audit; writes only independent_audit outputs.
Run with repository .venv/bin/python; no render, network, or image reads.
"""
from pathlib import Path
import json, math, re, hashlib, wave, subprocess
import jsonschema
ROOT=Path(__file__).resolve().parents[4]
PROJECT=ROOT/'projects/france-riots-20261023'
PUB=ROOT/'remotion-composer/public/france-riots-20261023/v2'
SRC=ROOT/'remotion-composer/src/france-riots-20261023/v2'
OUT=Path(__file__).parent
load=lambda p: json.loads(p.read_text())
norm=lambda s: re.sub(r'[^\w]+',' ',s.lower()).split()
checks=[]; findings=[]
def check(name,ok,details=None): checks.append(dict(check=name,passed=bool(ok),details=details))
def finding(severity,ref,description,fix): findings.append(dict(severity=severity,reference=ref,description=description,proposed_fix=fix))
def snap():
    paths=list((ROOT/'remotion-composer/src/france-riots-20261023').glob('*'))+list(PUB.parent.glob('*'))
    paths += [PROJECT/'artifacts/script.json',PROJECT/'artifacts/scene_plan.json',PROJECT/'decision_log.json']
    paths += [p for p in PUB.iterdir() if p.name.startswith(('voice_','words_','timing_','captions_s')) or p.name=='provider_texts.json']
    return {str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths if p.is_file()}
before=snap()
t=load(PUB/'scene_timing.json'); es=load(PUB/'scene_elements.json')['scenes']; caps=load(PUB/'captions_display.json')
script=load(PROJECT/'artifacts/script.json'); providers=load(PUB/'provider_texts.json')
# Explicit local structural schema: not the unrelated canonical render_report schema.
jsonschema.validate(load(PUB/'scene_elements.json'),{'type':'object','required':['version','scenes'],'properties':{'scenes':{'type':'array','items':{'type':'object','required':['scene','id','display','kind','start_frame_local','retrospective_reference'],'properties':{'scene':{'type':'string'},'id':{'type':'string'},'display':{'type':'string'},'start_frame_local':{'type':'integer','minimum':0},'retrospective_reference':{'type':'boolean'}}}}}})
check('local_flat_element_schema',True,'No canonical render_report exists: compose-only, no render requested.')
check('unique_element_ids',len({(e['scene'],e['id']) for e in es})==len(es))
check('21_scene_coverage',set(e['scene'] for e in es)=={f's{i:02}' for i in range(1,22)})
cursor=0; audio=0; unmatched=[]; word_errors=[]; payload_errors=[]
words_by_scene={}
for i,sc in enumerate(t['scenes'],1):
    sid=f's{i:02}'; wj=load(PUB/f'words_{sid}.json'); words=wj['words']; words_by_scene[sid]=words
    tj=load(PUB/f'timing_{sid}.json'); cj=load(PUB/f'captions_{sid}.json')
    with wave.open(str(PUB/f'voice_{sid}.wav')) as wav: duration=wav.getnframes()/wav.getframerate()
    check(sid+'_wav_duration',abs(duration-tj['duration_seconds'])<.000002)
    frames=math.ceil((tj['duration_seconds']+.8)*30)
    check(sid+'_frame_window',sc['start_frame']==cursor and sc['scene_frames']==frames)
    check(sid+'_script_provider_identity',wj['canonical_text']==script['sections'][i-1]['text'] and wj['provider_text']==providers[f'S{i}'] and cj['canonical_text']==wj['canonical_text'])
    for j,w in enumerate(words):
        if not (0<=w['start']<=w['end']<=duration+.2): word_errors.append([sid,j])
    for e in [e for e in es if e['scene']==sid and not e['retrospective_reference']]:
        a,b=e['anchor_start_word'],e['anchor_end_word']; phrase=' '.join(x['word'] for x in words[a:b+1])
        if norm(phrase)!=norm(e['anchor']): unmatched.append([sid,e['id']])
        expected=max(0,math.ceil((words[a]['start']-.32)*30))
        if e['start_frame_local']!=expected or e['global_anchor_end']>(cursor+frames)/30+.2: payload_errors.append([sid,e['id']])
    cursor+=frames; audio+=duration
check('duration_formula',t['total_frames']==cursor+30,dict(frames=cursor+30,audio_seconds=audio))
check('word_windows',not word_errors,word_errors);check('anchor_identity',not unmatched,unmatched);check('reveal_formula_and_windows',not payload_errors,payload_errors)
check('caption_length_85',all(len(c['text'])<=85 for cs in caps.values() for c in cs),max(len(c['text']) for cs in caps.values() for c in cs))
check('caption_windows',all(0<=c['startMs']<c['endMs']<=s['voice_seconds']*1000+200 for s in t['scenes'] for c in caps[s['scene_id']]))
s11=' '.join([e['display'] for e in es if e['scene']=='s11']+[c['text'] for c in caps['s11']])
check('forbidden_Marseille_counts_absent',not any(n in s11 for n in ['30.000','8.000','1.800','3.000']))
check('S14_full_force_composition',all(x in ' '.join(e['display'] for e in es if e['scene']=='s14').lower() for x in ['cảnh sát','hiến binh','lính cứu hỏa']))
check('S17_precise_annulment','Tòa hành chính PARIS hủy lệnh cấm tuần hành SINH VIÊN' in [e['display'] for e in es if e['scene']=='s17'])
bars=sorted([e for e in es if e['scene']=='s15' and e['kind'].startswith('bar')],key=lambda e:e['start_frame_local'])
check('chart_speech_order',[e['kind'] for e in bars]==['bar2026','bar2023','bar2018'],[{k:e[k] for k in ['kind','start_frame_local','display']} for e in bars])
code=(SRC/'EpisodeFullV2.tsx').read_text(); entry=(SRC/'entryV2.tsx').read_text()
check('static_camera_code_scan','scale(' not in code and 'zoom' not in re.sub(r'//[^\n]*','',code) and 'translateY(${8*(1-p)}px)' in code,'Source inspection only; opacity + <=8px element translation, no camera transform.')
check('HUD_fields',all(x in code for x in ['sc.scene_id','sc.start_frame+f','toFixed(2)','local {f}']))
check('registration_entry',all(x in entry for x in ['registerRoot(RootV2)','FranceRiots20261023V2Debug','width={1080}','height={1920}','durationInFrames={TOTAL_FRAMES}']))
check('media_paths_exist',all((PUB.parent/'media'/n).exists() for n in ['aix_gare_routiere_manifestation_17102026_gabrielfrom92.webm','paris_crowd_republique_teargas_17102026_JJxFile_0012.jpg','paris_firefighters_burning_car_17102026_JJxFile_0048.jpg']))
check('fixed_photo_credit',any(e['id']=='credit' and 'CC BY-SA 4.0' in e['display'] and 'khai báo 17/10/2026' in e['display'] for e in es))
# Regression rules describe forbidden later claims, not unconditional findings.
# Only measure a later phrase if its claim is present in the CURRENT display.
measurements=[]; regression_status=[]
rules=[('s03','e4','thứ Bảy',r'thứ bảy|xuống đường'),
       ('s04','e2','trường học xuống cấp',r'xuống cấp'),
       ('s13','e4','hơn 900',r'900|truy tố'),
       ('s16','e1','không khoan nhượng',r'khoan nhượng'),
       ('s16','e3','Macron từ chối',r'từ chối'),
       ('s17','e0','toà hành chính Paris',r'tòa|toà|phán quyết|hủy|huỷ'),
       ('s20','e1','tháng 4',r'4/2027|2027|tháng 4|tháng tư')]
for sid,eid,phrase,pattern in rules:
    e=next((e for e in es if e['scene']==sid and e['id']==eid),None)
    present=e is not None and re.search(pattern,e['display'],re.I) is not None
    status=dict(scene=sid,element=eid,display=e['display'] if e else None,later_claim=phrase,claim_present=present)
    if present:
        words=words_by_scene[sid]; flat=[]; owners=[]
        for j,w in enumerate(words):
            for token in norm(w['word']): flat.append(token);owners.append(j)
        needle=norm(phrase); hits=[j for j in range(len(flat)-len(needle)+1) if flat[j:j+len(needle)]==needle]
        delta=words[owners[hits[0]]]['start']-e['start_frame_local']/30 if hits else None
        status['lead_seconds']=None if delta is None else round(delta,3)
        if delta is None or delta>.35: measurements.append(status)
    status['resolved']=not present or (status.get('lead_seconds') is not None and status['lead_seconds']<=.35)
    regression_status.append(status)
check('named_card_claim_regressions',not measurements,regression_status)
if measurements:
    finding('critical',str(PUB/'scene_elements.json')+' named_card_claim_regressions','Current displays retain later claims before their own phrase: '+str(measurements),'Trim the later claim or independently speech-lock it; do not change canonical narration.')
s18=[e for e in es if e['scene']=='s18']
timeline_ids=re.search(r"const ids=\[([^\]]+)\]",code).group(1)
check('three_point_timeline_user_SSOT',re.findall(r"'([^']+)'",timeline_ids)==['timeline17','timeline22','e1'] and not any(e['id']=='timeline23' or ('23/10' in e['display'] and e['kind']!='source') for e in s18))
check('retrospective_references_genuine',all(e['kind'] in ['source','credit'] or (e['scene']=='s18' and e['id'] in ['timeline17','timeline22'] and e.get('reference') in ['s07','s17']) for e in es if e['retrospective_reference']))
check('133_elements',len(es)==133,len(es))
check('artifact_runtime_copies_equal',all(load(PROJECT/'artifacts/v2'/name)==load(PUB/name) for name in ['scene_elements.json','scene_timing.json']))
# Inspect the builder statically, never execute production builder.
import ast
builder=ast.parse((SRC/'buildV2.py').read_text())
specs=next(ast.literal_eval(n.value) for n in builder.body if isinstance(n,ast.Assign) and any(isinstance(a,ast.Name) and a.id=='SPECS' for a in n.targets))
check('builder_runtime_displays_match',all(next(e['display'] for e in es if e['scene']==f's{i:02}' and e['id']==f'e{k}')==spec[0] for i,scene in enumerate(specs,1) for k,spec in enumerate(scene)))
r=subprocess.run([str(ROOT/'remotion-composer/node_modules/.bin/tsc'),'--noEmit','-p',str(SRC/'tsconfig.scoped.json')],capture_output=True,text=True)
check('scoped_tsc',r.returncode==0,dict(returncode=r.returncode,output=(r.stdout+r.stderr)[-3000:]))
check('V1_and_inputs_unchanged_during_audit',before==snap(),'SHA256 audit-start/end comparison only; cannot prove historical V1 immutability without pre-compose baseline.')
if any(not c['passed'] for c in checks):finding('critical',str(OUT/'independent_audit_qc.json')+' checks','One or more deterministic checks failed.','Resolve each failed check and rerun independent_audit.py.')
finding('suggestion',str(SRC/'EpisodeFullV2.tsx')+':15-20,48','Generic stacked-card treatment dominates; slideshow/readability floor cannot be certified without visual review.','Lead should perform scene-by-scene mobile readability, clipping and slideshow QC before release; static camera is required, not a defect.')
result=dict(verdict='BLOCK' if any(f['severity']=='critical' for f in findings) else 'PASS_WITH_WARNINGS',checks=checks,findings=findings,compound_claim_measurements=measurements,regression_status=regression_status,unperformed=['No PNG/image reads, render, MP4 playback, perceptual readability, source-media visual verification, actual mix loudness/RMS, transcript round-trip, or full CLI bundling/browser registration test.','Canonical render_report schema not applicable: no render_report produced. Local element schema checked; no claim all pipeline artifacts validated.','Active preset pacing/color/bounce superseded by task-specific navy/coral theme, natural-duration scenes and static-camera veto.'],entry_usage='remotion render '+str(SRC/'entryV2.tsx')+' FranceRiots20261023V2Debug <output> (NOT EXECUTED)')
(OUT/'independent_audit_qc.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
critical=[f for f in findings if f['severity']=='critical']
report=f"""# COMPOSE V2 independent re-audit — {result['verdict']}

Critical: {len(critical)}. Named S3/S4/S13/S16/S17/S20 displays checked dynamically against current content; removed clauses are not treated as active claims. S18 three-point timeline is intentional user SSOT; no 23/10 council remains.

Deterministic: {len(checks)} checks; {sum(not c['passed'] for c in checks)} failures; scoped tsc exit {r.returncode}; {len(es)} elements; {t['total_frames']} frames. Caption limits, Marseille suppression, S14 composition, precise S17 court ruling, S15 reveal order and source registration checked.

Suggestion: visual/mobile readability, slideshow, media authenticity and audio mix QC remain unperformed. V1/canonical inputs unchanged during this audit, not historically certified.
"""
if critical: report+='\n'+'\n'.join(f['reference']+' — '+f['description']+' Fix: '+f['proposed_fix'] for f in critical)+'\n'
(OUT/'independent_audit_report.md').write_text(report)
print(json.dumps(dict(verdict=result['verdict'],checks=len(checks),failed=[c['check'] for c in checks if not c['passed']],critical=sum(f['severity']=='critical' for f in findings),outputs=[str(OUT/n) for n in ['independent_audit.py','independent_audit_qc.json','independent_audit_report.md']]),ensure_ascii=False))
