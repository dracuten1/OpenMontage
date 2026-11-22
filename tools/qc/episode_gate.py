from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path: sys.path.insert(0, str(REPO_ROOT))
from tools.qc.scene_packet import load_packet, integrate_scene_packet
from lib.production_provenance import hash_file

# --- Scene-file provenance + composition canvas checks (2026-11-11, tin-nong-3tin postmortem) ---

def _check_scene_tsx_provenance(root: Path):
    """Scene-isolated lane: every scene/*.tsx must be bound to an APPROVED reviewer
    verdict whose reviewed_hashes entry matches the CURRENT on-disk sha256.

    Blocks the exact tin-nong-3tin-20261110 failure mode: scenes hand-repaired or
    self-written after/beside the orchestrator flow reach render with no valid
    provenance. Legacy single-file episodes (no scene/ dir) are unaffected.
    """
    reasons = []
    # Wave1 P0-2 item 3: probe BOTH scene-dir spellings, preferring the
    # modern plural ``scenes/`` layout (same probe as the orchestrator's
    # get_scenes_dir). The old code only looked at ``scene/`` — on episodes
    # laid out as ``scenes/*.tsx`` (every current project) the whole
    # scene_provenance_* family silently no-op'd.
    scene_dir = root / 'scenes' if (root / 'scenes').is_dir() else root / 'scene'
    if not scene_dir.is_dir():
        return reasons
    tsx_files = sorted(scene_dir.glob('*.tsx'))
    if not tsx_files:
        return reasons
    scenes_rel_prefix = scene_dir.name  # 'scenes' or 'scene'
    for tsx in tsx_files:
        rel = f'{scenes_rel_prefix}/{tsx.name}'
        sid = tsx.stem
        pkt_path = root / f'packet_{sid}.json'
        if not pkt_path.is_file():
            reasons.append({'code': 'scene_provenance_missing',
                'message': f'{rel}: no integrated packet packet_{sid}.json — scene file has no writer/reviewer provenance (produce it via tools/qc/scene_orchestrator.py)'})
            continue
        try:
            pkt = json.loads(pkt_path.read_text(encoding='utf-8'))
        except Exception as e:
            reasons.append({'code': 'scene_provenance_corrupt',
                'message': f'{rel}: cannot parse packet_{sid}.json: {e}'})
            continue
        reviewer = pkt.get('reviewer') if isinstance(pkt, dict) else None
        reviewer = reviewer if isinstance(reviewer, dict) else {}
        if reviewer.get('verdict') != 'approved':
            reasons.append({'code': 'scene_provenance_not_approved',
                'message': f'{rel}: reviewer verdict={reviewer.get("verdict")!r} — scene file never approved'})
            continue
        rh = reviewer.get('reviewed_hashes')
        rh = rh if isinstance(rh, dict) else {}
        exp = rh.get(rel) or rh.get(tsx.name) or rh.get(f'scene/{tsx.name}')
        if not exp:
            reasons.append({'code': 'scene_provenance_unbound',
                'message': f'{rel}: approved verdict not bound to this scene file (no reviewed_hashes entry)'})
            continue
        cur = hash_file(tsx)
        if cur and cur != exp:
            reasons.append({'code': 'scene_provenance_stale',
                'message': f'{rel}: file changed after review (on-disk {cur[:12]}… != reviewed {exp[:12]}…) — re-run writer/reviewer for this scene'})
    return reasons

def _episode_compositions(root: Path):
    """Parse sibling Root.tsx registrations: [(id, width, height)]."""
    root_tsx = root.parent / 'Root.tsx'
    if not root_tsx.is_file():
        return []
    try:
        text = root_tsx.read_text(encoding='utf-8', errors='replace')
    except OSError:
        return []
    comps = []
    for m in re.finditer(r'<Composition\b(.*?)/>', text, re.S):
        attrs = m.group(1)
        idm = re.search(r'id="([^"]+)"', attrs)
        wm = re.search(r'width=\{(\d+)\}', attrs)
        hm = re.search(r'height=\{(\d+)\}', attrs)
        if idm and wm and hm:
            comps.append((idm.group(1), int(wm.group(1)), int(hm.group(1))))
    return comps

def _check_composition_dims(root: Path):
    """All compositions of one episode MUST share one canvas size.

    Blocks the tin-nong-3tin-20261110 r1 failure: DRAFT comp 720x1280 while scene
    layout used 1080x1920 design coords — every scene overflowed the right edge and
    it survived 5 renders + QC until the owner saw it. Draft HUD now renders at the
    FINAL canvas (1080x1920) per doctrine §8.6.
    """
    reasons = []
    slug = root.name
    mine = [c for c in _episode_compositions(root) if c[0] == slug or c[0].startswith(slug + '-')]
    if not mine:
        return reasons  # not registered yet — pre-assemble gate run, nothing to compare
    sizes = {(w, h) for _, w, h in mine}
    if len(sizes) > 1:
        detail = ', '.join(f'{i}={w}x{h}' for i, w, h in mine)
        reasons.append({'code': 'composition_dims_mismatch',
            'message': f'episode compositions differ in canvas: {detail} — every comp of an episode (DRAFT HUD included) must render at the design canvas'})
    return reasons


REAL_PHOTO_ASSET_TYPES = frozenset({
    "real_photo_spotlight",
    "source_photo",
    "archival_photo",
})


def _check_source_photos(root: Path):
    """Enforce Vision + resolution photo verification when photos or provenance exist."""
    reasons = []
    local_prov = root / "assets" / "images" / "provenance.json"
    proj_root_candidate = REPO_ROOT / "projects" / root.name
    sibling_prov = proj_root_candidate / "assets" / "images" / "provenance.json"

    declares_real_photo = False
    manifest_p = root / "artifacts" / "asset_manifest.json"
    if manifest_p.is_file():
        try:
            manifest_data = json.loads(manifest_p.read_text(encoding="utf-8"))
        except Exception:
            manifest_data = None
        if isinstance(manifest_data, dict):
            for item in manifest_data.get("assets", []):
                if isinstance(item, dict):
                    atype = str(item.get("type") or "").strip().lower()
                    if atype in REAL_PHOTO_ASSET_TYPES:
                        declares_real_photo = True
                        break

    target_project: Path | None = None
    if local_prov.is_file():
        target_project = root
    elif root.parent.name == "src" and sibling_prov.is_file():
        target_project = proj_root_candidate
    elif declares_real_photo:
        target_project = proj_root_candidate if (root.parent.name == "src" and sibling_prov.is_file()) else root

    if target_project is None:
        return reasons

    from tools.qc.source_photo_gate import validate_source_photos

    report = validate_source_photos(target_project, write_report=False)
    for err in report.get("errors", []):
        reasons.append({
            "code": "source_photo_gate_failed",
            "message": f"{err.get('code', 'SPG')}: {err.get('message', '')}",
        })
    return reasons


def _contained_path(raw, root):
    """Task 1.6: containment-checked path resolution.

    Relative paths resolve against the episode root first; when the result
    escapes the episode (e.g. repo-level shared evidence), fall back to a
    REPO_ROOT-anchored resolution. Returns the resolved path only when it
    stays contained, else None.
    """
    p = Path(raw)
    resolved = (root / p).resolve() if not p.is_absolute() else p.resolve()
    try:
        resolved.relative_to(root.resolve())
        return resolved
    except ValueError:
        if not p.is_absolute():
            repo_resolved = (REPO_ROOT / p).resolve()
            try:
                repo_resolved.relative_to(REPO_ROOT.resolve())
                return repo_resolved
            except ValueError:
                return None
    return None

def _resolve_dual_roots(root: Path) -> tuple[Path, Path]:
    """Resolve (project_root, composition_root) across projects/<slug> and remotion-composer/src/<slug>."""
    slug = root.name
    proj_candidate = (REPO_ROOT / "projects" / slug).resolve()
    comp_candidate = (REPO_ROOT / "remotion-composer" / "src" / slug).resolve()

    if (root / "artifacts").is_dir() or (root / "project.json").is_file() or (root / "research").is_dir():
        proj_root = root
    elif proj_candidate.is_dir():
        proj_root = proj_candidate
    else:
        proj_root = root

    if (root / "scenes").is_dir() or (root / "scene").is_dir() or (root / "Episode.tsx").is_file():
        comp_root = root
    elif comp_candidate.is_dir():
        comp_root = comp_candidate
    else:
        comp_root = root

    return proj_root, comp_root


def _detect_agy_mode(root: Path, proj_root: Path, packets: list[tuple[Path, dict]], requested_mode: str) -> bool:
    if requested_mode == "agy":
        return True
    if requested_mode == "packet":
        return False
    if packets:
        return False
    for pj in (proj_root / "project.json", root / "project.json"):
        if pj.is_file():
            try:
                data = json.loads(pj.read_text(encoding="utf-8"))
                if isinstance(data, dict) and data.get("orchestrator") == "antigravity":
                    return True
            except Exception:
                pass
    return False


def _check_editorial_language(proj_root: Path, comp_root: Path) -> tuple[list[dict], bool]:
    """Run editorial_language_gate automatically when editorial lane is declared."""
    reasons: list[dict] = []
    from tools.qc.editorial_language_gate import (
        EditorialGateInvocationError,
        analyze_project,
        detect_editorial_lane,
        read_json_if_valid,
        resolve_manifest_path,
    )

    sm = read_json_if_valid(resolve_manifest_path(proj_root))
    pj = read_json_if_valid(proj_root / "project.json")
    is_editorial = detect_editorial_lane(sm, pj)
    if not is_editorial:
        return reasons, False
    try:
        has_local_comp = (comp_root / "scenes").is_dir() or (comp_root / "scene").is_dir() or (comp_root / "Episode.tsx").is_file()
        default_comp = (REPO_ROOT / "remotion-composer" / "src" / proj_root.name).resolve()
        override_comp = comp_root if (has_local_comp and comp_root != default_comp) else None
        report = analyze_project(proj_root, composition_root_override=override_comp)
        for f in report.blocked:
            reasons.append({
                "code": "editorial_language_gate_failed",
                "message": f"{f.scene_id or 'episode'}: {f.code}: {f.message}",
            })
    except EditorialGateInvocationError as exc:
        reasons.append({"code": "editorial_language_gate_failed", "message": str(exc)})
    except Exception as exc:
        reasons.append({"code": "editorial_language_gate_error", "message": str(exc)})
    return reasons, True


def _check_fact_whitelist(proj_root: Path, comp_root: Path) -> list[dict]:
    """Run fact_whitelist_gate automatically when a v2 fact whitelist exists."""
    reasons: list[dict] = []
    from tools.qc.fact_whitelist_gate import validate_fact_whitelist

    scenes_dir = comp_root / "scenes" if (comp_root / "scenes").is_dir() else None
    rep = validate_fact_whitelist(proj_root, scenes_dir=scenes_dir, write_report=False)
    if rep.get("activated") and not rep.get("pass"):
        for err in rep.get("errors", []):
            reasons.append({
                "code": "fact_whitelist_failed",
                "message": f"{err.get('code', 'FWG')}: {err.get('message', '')}",
            })
    return reasons


def _check_episode_captions_wiring(comp_root: Path) -> list[dict]:
    """Block module-scope delayRender()+fetch() caption race that drops captions on render."""
    ep_tsx = comp_root / "Episode.tsx"
    if not ep_tsx.is_file():
        return []
    try:
        text = ep_tsx.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []
    has_async_fetch = "delayRender(" in text and "fetch(" in text and "captions.json" in text
    has_mutable_let = bool(re.search(r"\blet\s+captions\w*\b", text))
    if has_async_fetch and has_mutable_let and "useState" not in text:
        return [{
            "code": "captions_async_fetch_race",
            "message": (
                "Episode.tsx loads captions.json via top-level delayRender()+fetch() into a mutable "
                "variable without React state (causes missing subtitles on render); replace with a "
                'static JSON import: import captionsData from "../../public/<slug>/captions.json"'
            ),
        }]
    return []


def validate_episode(episode_dir, *, mode: str = "auto"):
    root = Path(episode_dir).resolve(); reasons = []; packets = []
    proj_root, comp_root = _resolve_dual_roots(root)
    paths = sorted(root.glob('**/*.json'))
    for path in paths:
        try: packet = load_packet(path)
        except (RuntimeError, ValueError) as e:
            if path.parent == root: reasons.append({'code': 'packet_io_error', 'message': f'{path}: {e}'})
            continue
        if isinstance(packet, dict) and packet.get('packet_type') == 'openmontage.scene-packet': packets.append((path, packet))
        elif not path.name.startswith('checkpoint_') and path.name not in {'production_evidence.json', 'edit_decisions.json', 'asset_manifest.json', 'narration_words.json', 'mix_manifest.json', 'layout_evidence.json', 'mix_profile.json', 'scene_manifest.json', 'project.json', 'script.json', 'proposal_packet.json', 'research_brief.json', 'fact_whitelist.json', 'decision_log.json', 'tts_lexicon.json', 'provenance.json'}:
            if path.parent == root: reasons.append({'code': 'non_packet_json', 'message': f'{path.name}: missing packet_type marker'})

    agy_mode = _detect_agy_mode(root, proj_root, packets, mode)

    if not agy_mode:
        if not paths or not packets:
            reasons.append({'code': 'scene_packets_missing', 'message': 'no scene packets found' if paths else 'no scene packet JSON files found'})
            if not paths:
                return reasons
        seen = set()
        for path, p in packets:
            result = integrate_scene_packet(
                p,
                packet_path=path,
                writer_token=p.get('writer_token'),
                reviewer_token=p.get('reviewer_token'),
                episode_packets=[x[1] for x in packets],
                io_operations=p.get("io_operations") if isinstance(p, dict) else None,
            )
            for r in result['reasons']: reasons.append({'code': r['code'], 'message': f"{path.name}: {r['message']}"})
            if p.get('scene_id') in seen: reasons.append({'code': 'scene_id_collision', 'message': f"duplicate scene_id: {p.get('scene_id')}"})
            seen.add(p.get('scene_id'))

        # F4: Authoritative scene IDs discovery from scene_manifest.scenes + edit_decisions.cuts
        authoritative_scene_ids = set()
        manifest_data = None
        for mp in (proj_root / 'artifacts' / 'scene_manifest.json', proj_root / 'scene_manifest.json'):
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
        for ep in (proj_root / 'artifacts' / 'edit_decisions.json', proj_root / 'edit_decisions.json'):
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

        # Postmortem 2026-11-11 (tin-nong-3tin-20261110): scene-file provenance
        reasons.extend(_check_scene_tsx_provenance(comp_root))

    reasons.extend(_check_composition_dims(comp_root))
    reasons.extend(_check_episode_captions_wiring(comp_root))
    reasons.extend(_check_source_photos(proj_root))
    el_reasons, is_editorial = _check_editorial_language(proj_root, comp_root)
    reasons.extend(el_reasons)
    reasons.extend(_check_fact_whitelist(proj_root, comp_root))

    from tools.qc.timing_relock_guard import check_project_timing
    timing = check_project_timing(proj_root, mode='strict')
    if not timing.valid: reasons.extend({'code': 'timing_relock_failed', 'message': e} for e in timing.errors)
    from lib.production_validation import (
        GATE_EDITORIAL_LANGUAGE,
        REQUIRED_PRE_RENDER_GATES,
        validate_pre_render,
    )
    edit_path = proj_root / 'artifacts' / 'edit_decisions.json'; manifest_path = proj_root / 'artifacts' / 'asset_manifest.json'
    if not edit_path.is_file() or not manifest_path.is_file():
        reasons.append({'code': 'production_validation_inputs_missing', 'message': 'production validation requires artifacts/edit_decisions.json and artifacts/asset_manifest.json'})
    else:
        try:
            evidence_path = proj_root / 'artifacts' / 'production_evidence.json'
            if not evidence_path.is_file():
                if not agy_mode:
                    reasons.append({'code': 'production_validation_inputs_missing', 'message': 'production validation requires artifacts/production_evidence.json with verified scene evidence records'})
                evidence_records = []
            else:
                from lib.production_validation import EvidenceRecord
                raw = json.loads(evidence_path.read_text())
                if not isinstance(raw, list): raise ValueError('production_evidence.json must contain an array')
                evidence_records = [EvidenceRecord.from_dict(item) for item in raw]
                req_gates = sorted(REQUIRED_PRE_RENDER_GATES | {GATE_EDITORIAL_LANGUAGE}) if is_editorial else None
                report = validate_pre_render(
                    proj_root,
                    json.loads(edit_path.read_text()),
                    mode='strict',
                    asset_manifest=json.loads(manifest_path.read_text()),
                    evidence_records=evidence_records,
                    required_gates=req_gates,
                )
                if report.status.value != 'pass': reasons.extend({'code': 'production_validation_failed', 'message': x} for x in report.blocking_reasons or [f'production status {report.status.value}'])
        except Exception as e: reasons.append({'code': 'production_validation_error', 'message': str(e)})

    # F8: Mix validation + measurement completeness enforcement
    from tools.qc import mix_validator
    stems = proj_root / 'audio_stems' if (proj_root / 'audio_stems').is_dir() else (comp_root / 'audio_stems')
    profile = proj_root / 'mix_profile.json' if (proj_root / 'mix_profile.json').is_file() else (comp_root / 'mix_profile.json')
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
    parser = argparse.ArgumentParser(description='Validate episode scene packets and cross-cut production gates')
    parser.add_argument('episode_dir')
    parser.add_argument('--mode', choices=('auto', 'packet', 'agy'), default='auto',
                        help='auto (default), packet (CC scene packets), or agy (Antigravity-native)')
    args = parser.parse_args(argv)
    root = Path(args.episode_dir)
    if not root.is_dir(): print(f'ERROR — episode directory missing: {root}', file=sys.stderr); return 2
    try: reasons = validate_episode(root, mode=args.mode)
    except OSError as e: print(f'ERROR — {e}', file=sys.stderr); return 2
    if reasons:
        print('FAIL — episode gate rejected')
        for r in reasons: print(f"- {r['code']}: {r['message']}")
        return 1
    print('PASS — episode gate'); return 0
if __name__ == '__main__': sys.exit(main())
