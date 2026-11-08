from __future__ import annotations
import argparse,json,sys
from pathlib import Path
REPO_ROOT=Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path: sys.path.insert(0,str(REPO_ROOT))
from tools.qc.scene_packet import load_packet, integrate_scene_packet

def validate_episode(episode_dir):
    root=Path(episode_dir).resolve(); reasons=[]; packets=[]
    paths=sorted(root.glob('**/*.json'))
    if not paths: return [{'code':'scene_packets_missing','message':'no scene packet JSON files found'}]
    for path in paths:
        try: packet=load_packet(path)
        except (RuntimeError, ValueError) as e:
            if path.parent == root: reasons.append({'code':'packet_io_error','message':f'{path}: {e}'})
            continue
        if isinstance(packet,dict) and packet.get('packet_type')=='openmontage.scene-packet': packets.append((path,packet))
        elif path.name not in {'production_evidence.json','edit_decisions.json','asset_manifest.json','narration_words.json','mix_manifest.json','layout_evidence.json','mix_profile.json'}:
            if path.parent == root: reasons.append({'code':'non_packet_json','message':f'{path.name}: missing packet_type marker'})
    if not packets: reasons.append({'code':'scene_packets_missing','message':'no scene packets found'})
    seen=set()
    for path,p in packets:
        result=integrate_scene_packet(p,packet_path=path,writer_token=p.get('writer_token'),reviewer_token=p.get('reviewer_token'),episode_packets=[x[1] for x in packets])
        for r in result['reasons']: reasons.append({'code':r['code'],'message':f"{path.name}: {r['message']}"})
        if p.get('scene_id') in seen: reasons.append({'code':'scene_id_collision','message':f"duplicate scene_id: {p.get('scene_id')}"})
        seen.add(p.get('scene_id'))
    from tools.qc.timing_relock_guard import check_project_timing
    timing=check_project_timing(root,mode='strict')
    if not timing.valid: reasons.extend({'code':'timing_relock_failed','message':e} for e in timing.errors)
    from lib.production_validation import validate_pre_render
    edit_path=root/'artifacts'/'edit_decisions.json'; manifest_path=root/'artifacts'/'asset_manifest.json'
    if not edit_path.is_file() or not manifest_path.is_file(): reasons.append({'code':'production_validation_inputs_missing','message':'production validation requires artifacts/edit_decisions.json and artifacts/asset_manifest.json'})
    else:
        try:
            evidence_path=root/'artifacts'/'production_evidence.json'
            if not evidence_path.is_file():
                reasons.append({'code':'production_validation_inputs_missing','message':'production validation requires artifacts/production_evidence.json with verified scene evidence records'}); evidence_records=[]
            else:
                from lib.production_validation import EvidenceRecord
                raw=json.loads(evidence_path.read_text())
                if not isinstance(raw,list): raise ValueError('production_evidence.json must contain an array')
                evidence_records=[EvidenceRecord.from_dict(item) for item in raw]
            report=validate_pre_render(root,json.loads(edit_path.read_text()),mode='strict',asset_manifest=json.loads(manifest_path.read_text()),evidence_records=evidence_records)
            if report.status.value!='pass': reasons.extend({'code':'production_validation_failed','message':x} for x in report.blocking_reasons or [f'production status {report.status.value}'])
        except Exception as e: reasons.append({'code':'production_validation_error','message':str(e)})
    from tools.qc import mix_validator
    stems=root/'audio_stems'; profile=root/'mix_profile.json'
    if not stems.is_dir() or not (stems/'manifest.json').is_file() or not profile.is_file():
        reasons.append({'code':'mix_validation_not_measured','message':'mix validator inputs missing (audio_stems/manifest.json and mix_profile.json required)'})
    else:
        try:
            verdict=mix_validator.validate(stems,profile)
            if not verdict['valid']: reasons.extend({'code':'mix_validation_failed','message':x} for x in verdict['errors'])
        except Exception as e: reasons.append({'code':'mix_validation_error','message':str(e)})
    return reasons

def main(argv=None):
    parser=argparse.ArgumentParser(description='Validate episode scene packets and cross-cut production gates'); parser.add_argument('episode_dir'); args=parser.parse_args(argv)
    root=Path(args.episode_dir)
    if not root.is_dir(): print(f'ERROR — episode directory missing: {root}',file=sys.stderr); return 2
    try: reasons=validate_episode(root)
    except OSError as e: print(f'ERROR — {e}',file=sys.stderr); return 2
    if reasons:
        print('FAIL — episode gate rejected')
        for r in reasons: print(f"- {r['code']}: {r['message']}")
        return 1
    print('PASS — episode gate'); return 0
if __name__=='__main__': sys.exit(main())
