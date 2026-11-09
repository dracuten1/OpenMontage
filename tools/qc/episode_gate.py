from __future__ import annotations
import argparse, json, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path: sys.path.insert(0, str(REPO_ROOT))
from tools.qc.scene_packet import load_packet, integrate_scene_packet
from lib.production_provenance import hash_file

def _contained_path(raw, root):
    p = Path(raw)
    resolved = (root / p).resolve() if not p.is_absolute() else p.resolve()
    try:
        resolved.relative_to(root.resolve())
        return resolved
    except ValueError:
        return None

def validate_episode(episode_dir):
    root = Path(episode_dir).resolve(); reasons = []; packets = []
    paths = sorted(root.glob('**/*.json'))
    if not paths: return [{'code': 'scene_packets_missing', 'message': 'no scene packet JSON files found'}]
    for path in paths:
        try: packet = load_packet(path)
        except (RuntimeError, ValueError) as e:
            if path.parent == root: reasons.append({'code': 'packet_io_error', 'message': f'{path}: {e}'})
            continue
        if isinstance(packet, dict) and packet.get('packet_type') == 'openmontage.scene-packet': packets.append((path, packet))
        elif path.name not in {'production_evidence.json', 'edit_decisions.json', 'asset_manifest.json', 'narration_words.json', 'mix_manifest.json', 'layout_evidence.json', 'mix_profile.json', 'scene_manifest.json'}:
            if path.parent == root: reasons.append({'code': 'non_packet_json', 'message': f'{path.name}: missing packet_type marker'})
    if not packets: reasons.append({'code': 'scene_packets_missing', 'message': 'no scene packets found'})
    seen = set()
    for path, p in packets:
        result = integrate_scene_packet(p, packet_path=path, writer_token=p.get('writer_token'), reviewer_token=p.get('reviewer_token'), episode_packets=[x[1] for x in packets])
        for r in result['reasons']: reasons.append({'code': r['code'], 'message': f"{path.name}: {r['message']}"})
        if p.get('scene_id') in seen: reasons.append({'code': 'scene_id_collision', 'message': f"duplicate scene_id: {p.get('scene_id')}"})
        seen.add(p.get('scene_id'))

    # F4: Authoritative scene IDs discovery from scene_manifest.scenes + edit_decisions.cuts
    authoritative_scene_ids = set()
    manifest_data = None
    for mp in (root / 'artifacts' / 'scene_manifest.json', root / 'scene_manifest.json'):
        if mp.is_file():
            try: manifest_data = json.loads(mp.read_text(encoding='utf-8'))
            except Exception: pass
            if manifest_data: break
    if isinstance(manifest_data, dict):
        for s in manifest_data.get('scenes', []):
            if isinstance(s, dict):
                sid = s.get('scene_id') or s.get('id')
                if sid: authoritative_scene_ids.add(str(sid))
            elif isinstance(s, str) and s:
                authoritative_scene_ids.add(s)

    edit_data = None
    for ep in (root / 'artifacts' / 'edit_decisions.json', root / 'edit_decisions.json'):
        if ep.is_file():
            try: edit_data = json.loads(ep.read_text(encoding='utf-8'))
            except Exception: pass
            if edit_data: break
    if isinstance(edit_data, dict):
        for c in edit_data.get('cuts', []):
            if isinstance(c, dict):
                cid = c.get('scene_id') or c.get('id')
                if cid: authoritative_scene_ids.add(str(cid))
            elif isinstance(c, str) and c:
                authoritative_scene_ids.add(c)

    # Diff packet coverage against authoritative scene set
    packet_scene_ids = {p.get('scene_id') for _, p in packets if p.get('scene_id')}
    missing_scenes = sorted(authoritative_scene_ids - packet_scene_ids)
    for sid in missing_scenes:
        reasons.append({'code': 'scene_packet_missing', 'message': f'missing scene packet for authoritative scene: {sid}'})
    extra_scenes = sorted(packet_scene_ids - authoritative_scene_ids)
    for sid in extra_scenes:
        msg = (
            f'scene packet scene_id not in authoritative scene set: {sid}'
            if authoritative_scene_ids
            else f'scene packet scene_id not in authoritative scene set (no authoritative scenes discovered): {sid}'
        )
        reasons.append({'code': 'scene_packet_extra', 'message': msg})
    if not authoritative_scene_ids and packets and not packet_scene_ids:
        reasons.append({'code': 'scene_packet_extra', 'message': 'scene packets present but no authoritative scenes discovered'})

    # F4: Enforce packet staleness against current cut/scene state
    for path, p in packets:
        sid = p.get('scene_id')
        if not sid:
            continue
        if isinstance(edit_data, dict):
            cuts = [c for c in edit_data.get('cuts', []) if isinstance(c, dict) and str(c.get('scene_id') or c.get('id')) == sid]
            for cut in cuts:
                src = cut.get('source')
                if src:
                    src_p = _contained_path(src, root)
                    if src_p and src_p.is_file():
                        disk_hash = hash_file(src_p)
                        narr_ref = p.get('narration', {}).get('ref')
                        narr_p = _contained_path(narr_ref, root) if narr_ref else None
                        if narr_p and narr_p == src_p:
                            p_hash = p.get('narration', {}).get('sha256')
                            if p_hash and p_hash != disk_hash:
                                reasons.append({'code': 'stale_packet', 'message': f"{path.name}: packet narration hash {p_hash} does not match current cut source {src} hash {disk_hash}"})
                        elif any(str(src).lower().endswith(ext) for ext in ('.wav', '.mp3', '.aac', '.m4a')):
                            if narr_ref and narr_ref != src and narr_p != src_p:
                                reasons.append({'code': 'stale_packet', 'message': f"{path.name}: packet narration ref {narr_ref} does not match current cut source {src}"})

    # F4: Enforce verdict/output binding consistency
    for path, p in packets:
        reviewer = p.get('reviewer', {})
        if not isinstance(reviewer, dict):
            continue
        verdict = reviewer.get('verdict')
        if verdict != 'approved':
            continue

        reviewed_hashes = {}
        if isinstance(reviewer.get('reviewed_hashes'), dict):
            reviewed_hashes.update(reviewer['reviewed_hashes'])

        findings_ref = reviewer.get('findings_ref')
        if findings_ref:
            fp = _contained_path(findings_ref, root)
            if fp and fp.is_file():
                try:
                    f_data = json.loads(fp.read_text(encoding='utf-8'))
                    if isinstance(f_data, dict):
                        f_rev = f_data.get('reviewed_hashes') or f_data.get('output_hashes')
                        if isinstance(f_rev, dict):
                            reviewed_hashes.update(f_rev)
                except Exception:
                    pass

        if not reviewed_hashes:
            reasons.append({
                'code': 'verdict_binding_missing',
                'message': f"{path.name}: reviewer verdict not bound to reviewed output hashes"
            })
            continue

        out_items = []
        for key in ('narration', 'word_alignment', 'style_contract'):
            obj = p.get(key)
            if isinstance(obj, dict) and 'ref' in obj and 'sha256' in obj:
                out_items.append((key, obj['ref'], obj['sha256']))
        for i, a in enumerate(p.get('assets', [])):
            if isinstance(a, dict) and 'ref' in a and 'sha256' in a:
                out_items.append((f'asset[{i}]', a['ref'], a['sha256']))

        for field_name, ref, exp_hash in out_items:
            r_hash = (
                reviewed_hashes.get(ref)
                or reviewed_hashes.get(field_name)
                or reviewed_hashes.get(Path(ref).name)
                or (reviewed_hashes.get(str(_contained_path(ref, root))) if _contained_path(ref, root) else None)
            )
            if r_hash is None:
                reasons.append({
                    'code': 'verdict_binding_incomplete',
                    'message': f"{path.name}: reviewer verdict missing hash for output {ref}"
                })
            elif r_hash != exp_hash:
                reasons.append({
                    'code': 'verdict_binding_mismatch',
                    'message': f"{path.name}: reviewer verdict was for {ref} hash {r_hash}, but output hash is {exp_hash}"
                })

    from tools.qc.timing_relock_guard import check_project_timing
    timing = check_project_timing(root, mode='strict')
    if not timing.valid: reasons.extend({'code': 'timing_relock_failed', 'message': e} for e in timing.errors)
    from lib.production_validation import validate_pre_render
    edit_path = root / 'artifacts' / 'edit_decisions.json'; manifest_path = root / 'artifacts' / 'asset_manifest.json'
    if not edit_path.is_file() or not manifest_path.is_file(): reasons.append({'code': 'production_validation_inputs_missing', 'message': 'production validation requires artifacts/edit_decisions.json and artifacts/asset_manifest.json'})
    else:
        try:
            evidence_path = root / 'artifacts' / 'production_evidence.json'
            if not evidence_path.is_file():
                reasons.append({'code': 'production_validation_inputs_missing', 'message': 'production validation requires artifacts/production_evidence.json with verified scene evidence records'}); evidence_records = []
            else:
                from lib.production_validation import EvidenceRecord
                raw = json.loads(evidence_path.read_text())
                if not isinstance(raw, list): raise ValueError('production_evidence.json must contain an array')
                evidence_records = [EvidenceRecord.from_dict(item) for item in raw]
            report = validate_pre_render(root, json.loads(edit_path.read_text()), mode='strict', asset_manifest=json.loads(manifest_path.read_text()), evidence_records=evidence_records)
            if report.status.value != 'pass': reasons.extend({'code': 'production_validation_failed', 'message': x} for x in report.blocking_reasons or [f'production status {report.status.value}'])
        except Exception as e: reasons.append({'code': 'production_validation_error', 'message': str(e)})

    # F8: Mix validation + measurement completeness enforcement
    from tools.qc import mix_validator
    stems = root / 'audio_stems'; profile = root / 'mix_profile.json'
    if not stems.is_dir() or not (stems / 'manifest.json').is_file() or not profile.is_file():
        reasons.append({'code': 'mix_validation_not_measured', 'message': 'mix validator inputs missing (audio_stems/manifest.json and mix_profile.json required)'})
    else:
        try:
            verdict = mix_validator.validate(stems, profile)
            if not verdict['valid']: reasons.extend({'code': 'mix_validation_failed', 'message': x} for x in verdict['errors'])
            
            # Enforce mix measurement completeness
            profile_data = json.loads(profile.read_text(encoding='utf-8'))
            allowed_unmeasured = set(profile_data.get('declared_not_measured', []))
            if profile_data.get('no_sfx') or profile_data.get('sfx_expected') is False or profile_data.get('sfx_mode') == 'none':
                allowed_unmeasured.add('leading_sfx')

            for item in verdict.get('not_measured', []):
                chk = item.get('check')
                if chk not in allowed_unmeasured:
                    reasons.append({
                        'code': 'mix_measurement_incomplete',
                        'message': f"undeclared unmeasured mix check: {chk} ({item.get('reason')})"
                    })
        except Exception as e: reasons.append({'code': 'mix_validation_error', 'message': str(e)})
    return reasons

def main(argv=None):
    parser = argparse.ArgumentParser(description='Validate episode scene packets and cross-cut production gates'); parser.add_argument('episode_dir'); args = parser.parse_args(argv)
    root = Path(args.episode_dir)
    if not root.is_dir(): print(f'ERROR — episode directory missing: {root}', file=sys.stderr); return 2
    try: reasons = validate_episode(root)
    except OSError as e: print(f'ERROR — {e}', file=sys.stderr); return 2
    if reasons:
        print('FAIL — episode gate rejected')
        for r in reasons: print(f"- {r['code']}: {r['message']}")
        return 1
    print('PASS — episode gate'); return 0
if __name__ == '__main__': sys.exit(main())
