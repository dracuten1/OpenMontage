import hashlib,json,wave
from tools.qc.episode_gate import validate_episode
from tools.qc.scene_packet import SCHEMA_VERSION


def _full_gate_records(art, scene_ids, gate_names=None):
 """Fixture helper: build PASS evidence records for the FULL required gate set.

 Fixture contract (review A-1 + A-2 hardening): strict pre-render validation
 enforces every canonical required gate (layout / timing-audio / semantic-events /
 sfx-mix per scene, provenance-freshness per episode) and requires a content
 hash for EVERY declared evidence path. Metadata may not narrow the gate set.
 """
 from lib.production_validation import (
  GATE_LAYOUT, GATE_TIMING_AUDIO, GATE_SEMANTIC_EVENTS, GATE_SFX_MIX,
  GATE_PROVENANCE_FRESHNESS, EvidenceRecord, ValidationStatus,
 )
 gates = gate_names or (GATE_LAYOUT, GATE_TIMING_AUDIO, GATE_SEMANTIC_EVENTS, GATE_SFX_MIX)
 records = []
 for g in gates:
  p = art/f'{g}_evidence.json'
  p.write_text(json.dumps({'gate': g, 'ok': True}))
  records.append(EvidenceRecord(
   gate_name=g, scope='pre_render', status=ValidationStatus.PASS,
   evidence_paths=[str(p)], scene_coverage=list(scene_ids),
   expected_scenes=list(scene_ids),
   artifact_hashes={str(p): hashlib.sha256(p.read_bytes()).hexdigest()},
  ))
 p_prov = art/'provenance_evidence.json'
 p_prov.write_text(json.dumps({'gate': 'provenance-freshness', 'ok': True}))
 records.append(EvidenceRecord(
  gate_name=GATE_PROVENANCE_FRESHNESS, scope='pre_render', status=ValidationStatus.PASS,
  evidence_paths=[str(p_prov)], scene_coverage=[], expected_scenes=[],
  artifact_hashes={str(p_prov): hashlib.sha256(p_prov.read_bytes()).hexdigest()},
 ))
 return records


def packet(root, scene_id='cut-1'):
 f=root/'frozen.txt'; f.write_text('stable')
 out=root/'scene'; out.mkdir(exist_ok=True)
 refs={}
 for name,content in [('audio.wav','audio'),('words.json','words'),('style.json','style'),('asset.png','asset')]:
  path=out/name; path.write_text(content); refs[name]=hashlib.sha256(path.read_bytes()).hexdigest()
 reviewed_hashes={
  'scene/audio.wav': refs['audio.wav'],
  'scene/words.json': refs['words.json'],
  'scene/style.json': refs['style.json'],
  'scene/asset.png': refs['asset.png'],
 }
 findings_path=out/'findings.json'
 findings_path.write_text(json.dumps({'scene_id':scene_id,'verdict':'approved','reviewed_hashes':reviewed_hashes}))
 refs['findings.json']=hashlib.sha256(findings_path.read_bytes()).hexdigest()
 frozen={str(f):hashlib.sha256(f.read_bytes()).hexdigest()}
 frozen.update({str(out/name):digest for name,digest in refs.items()})
 # Wave1 P0-2: packets are minted with the writer provenance block.
 frozen['_provenance']={'writer_instance_id':'w','writer_token':'wt','findings_hash':refs['findings.json']}
 return {'packet_type':'openmontage.scene-packet','schema_version':SCHEMA_VERSION,'scene_id':scene_id,'claims':{'facts':['approved']},'narration':{'ref':'scene/audio.wav','sha256':refs['audio.wav']},'word_alignment':{'ref':'scene/words.json','sha256':refs['words.json']},'assets':[{'ref':'scene/asset.png','sha256':refs['asset.png'],'rights':'licensed'}],'style_contract':{'ref':'scene/style.json','sha256':refs['style.json']},'neighbor_context':{'prev':'previous scene','next':'next scene'},'allowed_io':['scene'],'frozen_inputs':frozen,'writer':{'instance_id':'w','timestamp':'t','token':'wt'},'writer_token':'wt','reviewer':{'instance_id':'r','timestamp':'t','verdict':'approved','findings_hash':refs['findings.json'],'findings_ref':'scene/findings.json','token':'rt','reviewed_hashes':reviewed_hashes},'reviewer_token':'rt','integration_status':'pending'}


def valid_episode(root):
 from tests.test_timing_relock_validator import _write_real_wav_file
 from lib.production_validation import EvidenceRecord, ValidationStatus
 from tools.qc.episode_gate import validate_episode
 project=root/'episode'; art=project/'artifacts'; audio=project/'assets/audio'; art.mkdir(parents=True); audio.mkdir(parents=True)
 wav=audio/'voice_s1.wav'; _write_real_wav_file(wav,1.0)
 wav_hash=hashlib.sha256(wav.read_bytes()).hexdigest()
 edit={'version':'1.0','render_runtime':'remotion','required_gates':['layout'],'cuts':[{'id':'cut-1','source':'assets/audio/voice_s1.wav','in_seconds':0,'out_seconds':1.0,'layer':'primary'}]}
 manifest={'version':'1.0','assets':[{'id':'voice-s1','type':'narration','scene_id':'cut-1','path':'assets/audio/voice_s1.wav','duration_seconds':1.0}], 'metadata':{'total_audio_speech_duration_seconds':1.0}}
 (art/'edit_decisions.json').write_text(json.dumps(edit)); (art/'asset_manifest.json').write_text(json.dumps(manifest))
 stems=project/'audio_stems'; stems.mkdir();
 for name in ('narration','bgm','sfx','mix'):
  with wave.open(str(stems/f'{name}.wav'),'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(b'\x00\x00'*16000)
 (stems/'manifest.json').write_text(json.dumps({k:f'{k}.wav' for k in ('narration','bgm','sfx','mix')}))
 (project/'mix_profile.json').write_text(json.dumps({'schema':'openmontage.mix-profile','version':1,'target_lufs':-60,'lufs_tolerance':60,'ducking':{'min_reduction_db':0},'windows':{},'declared_not_measured':['music_masking']}))
 (art/'narration_words.json').write_text(json.dumps([{'word':'spoken','scene_id':'cut-1','global_start':0.05,'global_end':0.3}]))
 ev=art/'layout_evidence.json'; ev.write_text('{"verified":true}')
 # Fixture contract (A-1 + A-2): strict mode enforces the FULL required gate set
 # (layout, timing-audio, semantic-events, sfx-mix per scene + provenance-freshness
 # per episode) and requires a content hash for EVERY evidence path. Edit-decisions
 # metadata may no longer narrow the enforced set, so the fixture supplies all gates.
 records=_full_gate_records(art,['cut-1'])
 (art/'production_evidence.json').write_text(json.dumps([r.to_dict() for r in records]))
 from lib.production_validation import validate_pre_render
 report=validate_pre_render(project,edit,mode='strict',asset_manifest=manifest,evidence_records=records)
 assert report.status == ValidationStatus.PASS
 p=packet(project, scene_id='cut-1')
 p['narration']={'ref':'assets/audio/voice_s1.wav','sha256':wav_hash}
 p['frozen_inputs'][str(wav)]=wav_hash
 p['reviewer']['reviewed_hashes']['assets/audio/voice_s1.wav']=wav_hash
 fp=project/'scene'/'findings.json'
 fp.write_text(json.dumps({'scene_id':'cut-1','verdict':'approved','reviewed_hashes':p['reviewer']['reviewed_hashes']}))
 f_hash=hashlib.sha256(fp.read_bytes()).hexdigest()
 p['reviewer']['findings_hash']=f_hash
 p['frozen_inputs'][str(fp)]=f_hash
 # Wave1 P0-2: findings evidence changed -> re-point the minted provenance
 p['frozen_inputs']['_provenance']['findings_hash']=f_hash
 (project/'packet.json').write_text(json.dumps(p))
 return project


def test_episode_valid_fixture_passes(tmp_path):
 project=valid_episode(tmp_path)
 assert validate_episode(project)==[]
 (project/'frozen.txt').write_text('mutated')
 assert 'frozen_input_mismatch' in {r['code'] for r in validate_episode(project)}


def test_episode_consolidated_fail_closed_and_mutation(tmp_path):
 (tmp_path/'scene').mkdir(); (tmp_path/'packet.json').write_text(json.dumps(packet(tmp_path)))
 reasons=validate_episode(tmp_path)
 codes={r['code'] for r in reasons}
 assert 'timing_relock_failed' in codes and 'production_validation_inputs_missing' in codes
 assert 'mix_validation_not_measured' in codes
 (tmp_path/'frozen.txt').write_text('changed')
 reasons=validate_episode(tmp_path)
 assert 'frozen_input_mismatch' in {r['code'] for r in reasons}

def test_mix_validation_not_measured(tmp_path):
 (tmp_path/'scene').mkdir(); (tmp_path/'packet.json').write_text(json.dumps(packet(tmp_path)))
 reasons=validate_episode(tmp_path)
 assert 'mix_validation_not_measured' in {r['code'] for r in reasons}

def test_episode_duplicate_scene_ids(tmp_path):
 p=packet(tmp_path); (tmp_path/'a.json').write_text(json.dumps(p)); (tmp_path/'b.json').write_text(json.dumps(p))
 assert 'scene_id_collision' in {r['code'] for r in validate_episode(tmp_path)}


def test_episode_scene_packets_missing(tmp_path):
 empty=tmp_path/'empty'; empty.mkdir()
 reasons=validate_episode(empty)
 assert 'scene_packets_missing' in {r['code'] for r in reasons}


def test_episode_packet_io_error(tmp_path):
 project=valid_episode(tmp_path)
 (project/'junk.json').write_bytes(b'\x80\xff\xfe\x00')
 reasons=validate_episode(project)
 assert 'packet_io_error' in {r['code'] for r in reasons}


def test_episode_non_packet_json(tmp_path):
 project=valid_episode(tmp_path)
 (project/'unknown_meta.json').write_text('{"foo":"bar"}')
 reasons=validate_episode(project)
 assert 'non_packet_json' in {r['code'] for r in reasons}


def test_episode_production_validation_failed(tmp_path):
 project=valid_episode(tmp_path)
 from lib.production_validation import EvidenceRecord, ValidationStatus
 ev=project/'artifacts/layout_evidence.json'
 bad=EvidenceRecord(gate_name='layout',scope='pre_render',status=ValidationStatus.BLOCKED,evidence_paths=[str(ev)],scene_coverage=['cut-1'],expected_scenes=['cut-1'],issues=['forced'])
 (project/'artifacts/production_evidence.json').write_text(json.dumps([bad.to_dict()]))
 reasons=validate_episode(project)
 assert 'production_validation_failed' in {r['code'] for r in reasons}


def test_episode_production_validation_error(tmp_path):
 project=valid_episode(tmp_path)
 (project/'artifacts/production_evidence.json').write_text('{"not":"a list"}')
 reasons=validate_episode(project)
 assert 'production_validation_error' in {r['code'] for r in reasons}


def test_episode_mix_validation_failed(tmp_path):
 project=valid_episode(tmp_path)
 (project/'mix_profile.json').write_text(json.dumps({'schema':'openmontage.mix-profile','version':1,'target_lufs':0.0,'lufs_tolerance':0.1,'ducking':{'min_reduction_db':0},'windows':{}}))
 reasons=validate_episode(project)
 assert 'mix_validation_failed' in {r['code'] for r in reasons}


def test_episode_mix_validation_error(tmp_path, monkeypatch):
 from tools.qc import mix_validator
 project=valid_episode(tmp_path)
 monkeypatch.setattr(mix_validator,'validate',lambda *args,**kwargs:(_ for _ in ()).throw(RuntimeError('crash')))
 reasons=validate_episode(project)
 assert 'mix_validation_error' in {r['code'] for r in reasons}


def test_episode_gate_cli_subprocess(tmp_path):
 import subprocess, sys
 project=valid_episode(tmp_path)
 proc0=subprocess.run([sys.executable,'tools/qc/episode_gate.py',str(project)],capture_output=True,text=True)
 assert proc0.returncode==0
 (project/'frozen.txt').write_text('mutated')
 proc1=subprocess.run([sys.executable,'tools/qc/episode_gate.py',str(project)],capture_output=True,text=True)
 assert proc1.returncode==1
 proc2=subprocess.run([sys.executable,'tools/qc/episode_gate.py',str(tmp_path/'nonexistent_dir')],capture_output=True,text=True)
 assert proc2.returncode==2


def _write_test_png(path, size=(1000, 800)):
 from PIL import Image
 path.parent.mkdir(parents=True, exist_ok=True)
 Image.new('RGB', size, (40, 80, 120)).save(path, format='PNG')


def test_episode_source_photo_gate_passes_verified_photo(tmp_path):
 project = valid_episode(tmp_path)
 _write_test_png(project / 'assets' / 'images' / 'photo.png', (1200, 900))
 prov = [{
  'file': 'assets/images/photo.png',
  'license': 'CC BY-SA 4.0',
  'credit_line': 'Photo: Wikimedia / Test Author',
  'page': 'https://commons.wikimedia.org/wiki/File:Test.jpg',
  'taken': '2026-03-01',
  'vision_verified': True,
  'visual_type': 'photograph',
  'subject_match_note': 'Verified real archival press photograph of the target structure.',
 }]
 (project / 'assets' / 'images' / 'provenance.json').write_text(json.dumps(prov), encoding='utf-8')
 assert validate_episode(project) == []


def test_episode_source_photo_gate_blocks_stamp_or_unverified(tmp_path):
 project = valid_episode(tmp_path)
 _write_test_png(project / 'assets' / 'images' / 'stamp.png', (1000, 700))
 prov = [{
  'file': 'assets/images/stamp.png',
  'license': 'CC0',
  'credit_line': 'Test Stamp',
  'page': 'https://example.org/stamp',
  'taken': '2023-05-01',
  'vision_verified': False,
  'visual_type': 'stamp',
  'subject_match_note': 'bad',
 }]
 (project / 'assets' / 'images' / 'provenance.json').write_text(json.dumps(prov), encoding='utf-8')
 codes = {r['code'] for r in validate_episode(project)}
 assert 'source_photo_gate_failed' in codes


def test_episode_source_photo_gate_blocks_declared_real_photo_without_provenance(tmp_path):
 project = valid_episode(tmp_path)
 manifest_p = project / 'artifacts' / 'asset_manifest.json'
 manifest = json.loads(manifest_p.read_text(encoding='utf-8'))
 manifest['assets'].append({
  'id': 'bridge_photo',
  'type': 'real_photo_spotlight',
  'path': 'assets/images/bridge.jpg',
  'scene_id': 'cut-1',
 })
 (project / 'artifacts' / 'asset_manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
 codes = {r['code'] for r in validate_episode(project)}
 assert 'source_photo_gate_failed' in codes


def test_episode_agy_mode_enforces_editorial_and_fact_whitelist(tmp_path):
 from tests.test_timing_relock_validator import _write_real_wav_file
 project = tmp_path / 'agy-news'
 art = project / 'artifacts'
 audio = project / 'assets' / 'audio'
 scenes = project / 'scenes'
 art.mkdir(parents=True); audio.mkdir(parents=True); scenes.mkdir(parents=True)

 wav = audio / 'voice_s1.wav'
 _write_real_wav_file(wav, 1.0)
 (project / 'project.json').write_text(json.dumps({
  'project_id': 'agy-news',
  'pipeline_type': 'animated-explainer',
  'style_playbook': 'archival-editorial',
  'lane': 'news-editorial-motion',
  'orchestrator': 'antigravity',
 }), encoding='utf-8')
 (art / 'edit_decisions.json').write_text(json.dumps({
  'version': '1.0', 'render_runtime': 'remotion',
  'cuts': [{'id': 'S01', 'source': 'assets/audio/voice_s1.wav', 'in_seconds': 0, 'out_seconds': 1.0, 'layer': 'primary'}],
 }), encoding='utf-8')
 (art / 'asset_manifest.json').write_text(json.dumps({
  'version': '1.0',
  'assets': [{'id': 'voice-s1', 'type': 'narration', 'scene_id': 'S01', 'path': 'assets/audio/voice_s1.wav', 'duration_seconds': 1.0}],
  'metadata': {'total_audio_speech_duration_seconds': 1.0},
 }), encoding='utf-8')
 (art / 'narration_words.json').write_text(json.dumps([{'word': 'test', 'scene_id': 'S01', 'global_start': 0.05, 'global_end': 0.3}]))
 stems = project / 'audio_stems'; stems.mkdir()
 for name in ('narration', 'bgm', 'sfx', 'mix'):
  with wave.open(str(stems / f'{name}.wav'), 'wb') as w:
   w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(b'\x00\x00' * 16000)
 (stems / 'manifest.json').write_text(json.dumps({k: f'{k}.wav' for k in ('narration', 'bgm', 'sfx', 'mix')}))
 (project / 'mix_profile.json').write_text(json.dumps({
  'schema': 'openmontage.mix-profile', 'version': 1, 'target_lufs': -60, 'lufs_tolerance': 60,
  'ducking': {'min_reduction_db': 0}, 'windows': {}, 'declared_not_measured': ['music_masking'],
 }))
 (art / 'fact_whitelist.json').write_text(json.dumps({
  'facts': [{'fact_id': 'EV-1#f01', 'display_string': '136,2', 'verification': 'CORROBORATED', 'allowed_scenes': ['S01']}],
 }))
 (project / 'scene_manifest.json').write_text(json.dumps({
  'project_id': 'agy-news',
  'lane': 'news-editorial-motion',
  'canvas': {'width': 1080, 'height': 1920, 'fps': 30},
  'speech_lock_contract': 'locked', 'camera_rig': {'scale': '1.0->1.08'}, 'physics': {'spring_damping': '20'},
  'global_overlays': [{'type': 'vignette'}],
  'scenes': [{
   'scene_id': 'S01',
   'layers': [{'layer_id': 'chart', 'role': 'data_viz', 'pipeline': {'method': 'remotion_native', 'component': 'PriceLineChart'}}],
  }],
 }), encoding='utf-8')
 # Missing PriceLineChart + leaked number 999 -> both editorial_language_gate_failed & fact_whitelist_failed fire without packet_*.json
 (scenes / 'S01.tsx').write_text('export default function S01() { return <div>999</div>; }', encoding='utf-8')
 codes = {r['code'] for r in validate_episode(project)}
 assert 'scene_packets_missing' not in codes
 assert 'editorial_language_gate_failed' in codes
 assert 'fact_whitelist_failed' in codes

 # Fix S01 to declare genuine PriceLineChart and whitelisted number -> auto agy mode passes!
 (scenes / 'S01.tsx').write_text(
  'const PriceLineChart = () => <div data-editorial-line-chart="true">136,2</div>;\n'
  'export default function S01() { return <PriceLineChart />; }\n',
  encoding='utf-8',
 )
 assert validate_episode(project) == []


def test_episode_gate_agy_allows_root_checkpoint_json(tmp_path):
 from tests.test_timing_relock_validator import _write_real_wav_file
 project = tmp_path / 'agy-ckpt'
 art = project / 'artifacts'
 audio = project / 'assets' / 'audio'
 scenes = project / 'scenes'
 art.mkdir(parents=True); audio.mkdir(parents=True); scenes.mkdir(parents=True)
 _write_real_wav_file(audio / 'voice_s1.wav', 1.0)
 (project / 'project.json').write_text(json.dumps({
  'project_id': 'agy-ckpt',
  'pipeline_type': 'animated-explainer',
  'orchestrator': 'antigravity',
 }), encoding='utf-8')
 (art / 'edit_decisions.json').write_text(json.dumps({
  'version': '1.0', 'render_runtime': 'remotion',
  'cuts': [{'id': 'S01', 'source': 'assets/audio/voice_s1.wav', 'in_seconds': 0, 'out_seconds': 1.0, 'layer': 'primary'}],
 }))
 (art / 'asset_manifest.json').write_text(json.dumps({
  'version': '1.0',
  'assets': [{'id': 'voice-s1', 'type': 'narration', 'scene_id': 'S01', 'path': 'assets/audio/voice_s1.wav', 'duration_seconds': 1.0}],
  'metadata': {'total_audio_speech_duration_seconds': 1.0},
 }))
 (art / 'narration_words.json').write_text(json.dumps([{'word': 'test', 'scene_id': 'S01', 'global_start': 0.05, 'global_end': 0.3}]))
 stems = project / 'audio_stems'; stems.mkdir()
 for name in ('narration', 'bgm', 'sfx', 'mix'):
  with wave.open(str(stems / f'{name}.wav'), 'wb') as w:
   w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(b'\x00\x00' * 16000)
 (stems / 'manifest.json').write_text(json.dumps({k: f'{k}.wav' for k in ('narration', 'bgm', 'sfx', 'mix')}))
 (project / 'mix_profile.json').write_text(json.dumps({
  'schema': 'openmontage.mix-profile', 'version': 1, 'target_lufs': -60, 'lufs_tolerance': 60,
  'ducking': {'min_reduction_db': 0}, 'windows': {}, 'declared_not_measured': ['music_masking'],
 }))
 (project / 'checkpoint_compose.json').write_text(json.dumps({'stage': 'compose', 'status': 'completed'}))
 codes = {r['code'] for r in validate_episode(project, mode='agy')}
 assert 'non_packet_json' not in codes
 assert codes == set()


def test_episode_gate_flags_async_captions_fetch_race(tmp_path):
 from tools.qc.episode_gate import _check_episode_captions_wiring
 comp = tmp_path / 'ep'
 comp.mkdir()
 (comp / 'Episode.tsx').write_text(
  'import { delayRender, fetch } from "remotion";\n'
  'let captionsBySection = {};\n'
  'const h = delayRender("cap");\n'
  'fetch("x/captions.json").then(() => continueRender(h));\n',
  encoding='utf-8',
 )
 codes = {r['code'] for r in _check_episode_captions_wiring(comp)}
 assert codes == {'captions_async_fetch_race'}

 (comp / 'Episode.tsx').write_text(
  'import captionsData from "../../public/x/captions.json";\n'
  'const captionsBySection = captionsData.captions;\n',
  encoding='utf-8',
 )
 assert _check_episode_captions_wiring(comp) == []
