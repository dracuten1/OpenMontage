from pathlib import Path
import importlib.util,json
P=Path('/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong')
print('MODULES',{m:bool(importlib.util.find_spec(m)) for m in ['torch','stable_whisper','faster_whisper','whisperx','whisper','numpy']})
print('QC',[(str(x.relative_to(P)),x.stat().st_size) for x in (P/'qc').rglob('*.json')])
print('RENDERS',[(x.name,x.stat().st_size) for x in (P/'renders').glob('*')])
tr=P/'assets/audio/transcripts/s01_transcript.json'
d=json.loads(tr.read_text());print('TRANSCRIPT_KEYS',list(d));print('TRANSCRIPT_HEAD',json.dumps(d,ensure_ascii=False)[:1300])
sw=P/'qc/scene_sweep/scene_sweep_report.json'
if sw.exists():
 d=json.loads(sw.read_text());print('SW_KEYS',list(d));print('SW_HEAD',json.dumps(d,ensure_ascii=False)[:2400])
sp=json.loads((P/'artifacts/script.json').read_text());print('S01',json.dumps(sp['sections'][0],ensure_ascii=False));print('TIMING_HEAD',(P/'artifacts/scene_timing.json').read_text()[:1200])
print('S2A_LOGS',[(str(x),x.stat().st_size) for x in (P/'logs').glob('*audio*')])
