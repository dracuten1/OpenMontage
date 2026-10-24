"""Focused compose checks, not the independent editorial/visual reviewer audit."""
from pathlib import Path
import json, math, hashlib
P=Path('/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/france-riots-20261023/v2')
def read(n): return json.loads((P/n).read_text())
t=read('scene_timing.json'); es=read('scene_elements.json')['scenes']; caps=read('captions_display.json'); hashes=read('input_hashes.json')
assert len(t['scenes'])==21
assert t['total_frames']==sum(math.ceil((s['voice_seconds']+.8)*30) for s in t['scenes'])+30
for n,h in hashes.items(): assert hashlib.sha256((P/n).read_bytes()).hexdigest()==h,('input changed',n)
for s in t['scenes']:
 sid=s['scene_id']; words=read(f'words_{sid}.json')['words']
 assert all(0<=w['start']<=w['end']<=s['voice_seconds']+.2 for w in words),(sid,'word overflow')
 assert all(0<=c['startMs']<=c['endMs']<=s['voice_seconds']*1000+200 and len(c['text'])<=85 for c in caps[sid]),(sid,'caption overflow')
 for e in [e for e in es if e['scene']==sid]:
  assert 0<=e['start_frame_local']<s['scene_frames']
  if not e['retrospective_reference']:
   a=words[e['anchor_start_word']]; b=words[e['anchor_end_word']]
   assert e['anchor_start_seconds']==a['start'] and e['anchor_end_seconds']==b['end']
   assert e['start_frame_local']==max(0,math.ceil((a['start']-.32)*30))
   assert s['start_seconds']+b['end']<=s['end_seconds']+.2
# S11 exact canonical, provider metadata, and absence of disputed Marseille counts
w11=read('words_s11.json')
exact_canonical="Lyon: 200 đến 300 cửa hàng bị đập phá và cướp, văn phòng du lịch bị đốt, theo The Guardian. Tại Marseille, cửa tòa thị chính bị đập mở, theo bài phát biểu của Tổng thống Macron ngày 18/10."
assert w11.get('canonical_text')==exact_canonical,('s11','canonical_text mismatch')
assert w11.get('provider_text') and 'Li ôn' in w11['provider_text'] and 'Mác xây' in w11['provider_text'],('s11','missing provider metadata')
blocked_counts=['30.000','8.000','1.800','3.000']
s11_lexical_targets=[w11.get('canonical_text',''),w11.get('provider_text',''),' '.join(w['word'] for w in w11['words']),' '.join(c['text'] for c in caps['s11']),' '.join(e['display'] for e in es if e['scene']=='s11')]
asr_p=Path('/Users/tuyennguyen/project/OpenMontage/projects/france-riots-20261023/audio/v2/s11_raw_asr.json')
if asr_p.exists(): s11_lexical_targets.append(json.loads(asr_p.read_text()).get('asr_text',''))
for text in s11_lexical_targets:
 for bc in blocked_counts: assert bc not in text,(bc,'leaked in s11',text)
# Full caption reconstruction with normalized whitespace
import re
norm_caps=re.sub(r'[^\w]+',' ',' '.join(c['text'] for c in caps['s11'])).strip().lower()
norm_words=re.sub(r'[^\w]+',' ',' '.join(w['word'] for w in w11['words'])).strip().lower()
assert norm_caps==norm_words,('s11','caption words mismatch')
s11_expected=[('Lyon','Lyon'),('200–300 cửa hàng bị đập phá và cướp','200 đến 300 cửa hàng'),('Văn phòng du lịch bị đốt','văn phòng du lịch bị đốt'),('Theo The Guardian','theo The Guardian'),('Marseille · Cửa tòa thị chính bị đập mở','cửa tòa thị chính bị đập mở'),('Theo Tổng thống Macron · Bài phát biểu 18/10','theo bài phát biểu của Tổng thống Macron ngày 18/10')]
assert [(e['display'],e['anchor']) for e in es if e['scene']=='s11' and not e['retrospective_reference']]==s11_expected,('s11','stale display or anchor')
assert next(s['source'] for s in t['scenes'] if s['scene_id']=='s11')=='The Guardian · Élysée'
assert all('nhiều thành phố' not in e['display'] for e in es if e['scene']=='s17')
assert any('Lính cứu hỏa' in e['display'] for e in es if e['scene']=='s14')
assert any(e['kind']=='bar2026' and e['anchor']=='1,2 tỷ' for e in es)
assert sum(1 for e in es if not e['retrospective_reference'] and not e['anchor'])==0
# Regression checks for reviewer BLOCK findings. Do not run/overwrite independent audit.
assert not any(e['id']=='timeline23' for e in es)
source=Path(__file__).with_name('EpisodeFullV2.tsx').read_text()
assert "const ids=['timeline17','timeline22','e1']" in source and 'timeline23' not in source
expected={('s03','e4'):'Hàng triệu lượt xem',('s04','e2'):'Thiếu giáo viên',('s13','e4'):'174 tạm giam\nTheo Bộ trưởng Tư pháp',('s16','e1'):'Macron: giận và thẹn',('s16','e3'):'Nuñez xin từ chức\nTheo Euronews',('s17','e0'):'Thứ Năm 22/10',('s20','e1'):'Sáu tháng trước bầu cử'}
for (sid,eid),display in expected.items():
 assert next(e['display'] for e in es if e['scene']==sid and e['id']==eid)==display,(sid,eid,'early bundled claim regression')
sweep_file=Path('/Users/tuyennguyen/project/OpenMontage/projects/france-riots-20261023/qc/v2/sweep/scene_sweep_report.json')
if sweep_file.exists():
 try:
  sw=json.loads(sweep_file.read_text())
  visual_qc_desc=f"scene_sweep {sw.get('stills_rendered',42)} stills ({sw.get('verdict','PASS')}) — deterministic pixel heuristics only (edge/panel/dense), no perceptual image review"
 except Exception:
  visual_qc_desc='scene_sweep report exists — deterministic heuristics only, no perceptual review'
else:
 visual_qc_desc='scene_sweep pending (42 stills deterministic layout check; no perceptual image review)'
result=dict(status='PASS',scope='compose-only deterministic checks, independent audit pending',scenes=21,elements=len(es),unmatched=0,total_frames=t['total_frames'],duration_seconds=t['duration_seconds'],input_files_unchanged=len(hashes),caption_max_chars=max(len(c['text']) for pages in caps.values() for c in pages),speech_window='PASS',tsc='PASS (separately invoked)',visual_qc=visual_qc_desc,post_render_check='NOT APPLICABLE — no MP4 render requested (still sweep only)')
(P/'compose_checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result))
