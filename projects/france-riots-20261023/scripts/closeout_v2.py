#!/usr/bin/env python3
"""Deferred mechanical reconciliation. Lead runs ONLY after the V2 render exits."""
from __future__ import annotations

from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
from lib.checkpoint import write_checkpoint, validate_checkpoint
from lib.timing_validator import validate_edit_timing_against_audio
from schemas.artifacts import validate_artifact

PROJECT_ID = 'france-riots-20261023'
STAGES = {'assets': 'asset_manifest', 'edit': 'edit_decisions',
          'compose': 'render_report', 'publish': 'publish_log'}
AUTHORIZATION = ('Owner “Cho chạy” authorizes draft production only. '
                 'Not clean-final approval, publication permission, or listening sign-off.')
LIMITATIONS = [
    'DRAFT HUD: pending owner review; no clean-final approval.',
    'No auditory listening performed by closeout; pronunciation, numbers and mix intelligibility pending.',
    'ffprobe inspects container/streams only; no full decode, black-frame, visual, subtitle or speech-lock certification.',
    'Final integrated LUFS/true peak not measured by closeout.',
    'Media dates, claims, provenance and license validity not independently verified by closeout.',
    'Existing automated audits are referenced evidence only, not a new independent PASS.',
    'Telegram V2 delivery receipts pending lead; V1 receipts do not apply.',
]


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def probe(path):
    return json.loads(subprocess.run(
        ['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(path)],
        check=True, capture_output=True, text=True).stdout)


def closeout(repo=REPO, project=None):
    repo = Path(repo).resolve()
    project = Path(project or repo / 'projects' / PROJECT_ID).resolve()
    render = project / 'renders/france-riots-v2-draft-hud.mp4'
    if not render.is_file():
        raise FileNotFoundError(f'Render missing; no closeout writes made: {render}')
    before = (render.stat().st_size, render.stat().st_mtime_ns)
    raw_probe = probe(render)
    video = next(s for s in raw_probe['streams'] if s['codec_type'] == 'video')
    audio = next(s for s in raw_probe['streams'] if s['codec_type'] == 'audio')
    duration = float(raw_probe['format']['duration'])
    fps = float(Fraction(video['avg_frame_rate']))
    if duration <= 0 or before[0] <= 0 or fps <= 0:
        raise ValueError('Invalid/unfinished render metadata')
    if before != (render.stat().st_size, render.stat().st_mtime_ns):
        raise RuntimeError('Render changed while probing; wait for render process to exit')
    public = repo / 'remotion-composer/public' / PROJECT_ID
    v2 = public / 'v2'
    timing = read(v2 / 'scene_timing.json')
    entry = repo / 'remotion-composer/src' / PROJECT_ID / 'v2/entryV2.tsx'
    composition = 'FranceRiots20261023V2Debug'
    if composition not in entry.read_text():
        raise ValueError('Expected V2 Debug composition missing')
    if len(timing['scenes']) != 21:
        raise ValueError('Expected 21 V2 scenes')
    if abs(duration - timing['total_frames']/timing['fps']) > 0.15:
        raise ValueError('Rendered duration disagrees with actual V2 scene timing')
    def rel(path):
        return str(path.relative_to(repo))
    now = datetime.now(timezone.utc).isoformat()
    assets, cuts, segments, measurements = [], [], [], []
    cursor = 0
    for scene in timing['scenes']:
        sid = scene['scene_id']
        wav = v2 / f'voice_{sid}.wav'
        wav_probe = probe(wav)
        seconds = float(wav_probe['format']['duration'])
        frames = __import__('math').ceil((seconds + 0.8)*timing['fps'])
        if abs(seconds-scene['voice_seconds']) > 0.002 or frames != scene['scene_frames'] or cursor != scene['start_frame']:
            raise ValueError(f'Stale scene timing for {sid}; lead must rebuild timing/render first')
        aid = f'narration-{sid}'
        assets.append({'id': aid, 'type': 'narration', 'path': rel(wav),
                       'source_tool': 'existing_v2_file', 'scene_id': scene['section_id'],
                       'duration_seconds': seconds, 'format': 'wav',
                       'generation_summary': 'Existing public V2 WAV measured with ffprobe; generation provenance not inferred.'})
        cuts.append({'id': f'cut_{sid}', 'source': rel(wav), 'in_seconds': 0,
                     'out_seconds': seconds, 'layer': 'primary',
                     'transition_in': 'cut', 'transition_out': 'cut',
                     'reason': 'Actual WAV duration; scene hold/padding stored separately in V2 timing.'})
        segments.append({'asset_id': aid, 'start_seconds': cursor/timing['fps'],
                         'end_seconds': cursor/timing['fps']+seconds})
        measurements.append({'scene_id': sid, 'path': rel(wav), 'seconds': seconds})
        cursor += frames
    if cursor + timing['tail_frames'] != timing['total_frames']:
        raise ValueError('V2 total frame count mismatch')
    music = read(v2 / 'music_metadata.json')
    bed = public / music['public_bed_filename']
    assets.append({'id': 'music-bed', 'type': 'music', 'path': rel(bed),
                   'source_tool': 'existing_file', 'scene_id': 'all',
                   'duration_seconds': float(probe(bed)['format']['duration']),
                   'generation_summary': 'Existing reused bed; credit/provenance declared in V2 music_metadata, not independently certified.'})
    # Inventory only files explicitly referenced by the bespoke V2 composition.
    episode = (entry.parent / 'EpisodeFullV2.tsx').read_text()
    media_names = ['aix_gare_routiere_manifestation_17102026_gabrielfrom92.webm',
                   'paris_crowd_republique_teargas_17102026_JJxFile_0012.jpg',
                   'paris_firefighters_burning_car_17102026_JJxFile_0048.jpg']
    for index, name in enumerate(media_names):
        if name not in episode:
            raise ValueError(f'Composition media reference changed: {name}')
        path = public / 'media' / name
        if not path.is_file():
            raise FileNotFoundError(path)
        assets.append({'id': f'media-{index+1}', 'type': 'video' if path.suffix == '.webm' else 'image',
                       'path': rel(path), 'source_tool': 'existing_file',
                       'scene_id': 'S6' if index == 0 else 'S7',
                       'generation_summary': 'Existing source media; filename date is not independent date verification.'})
    captions = v2 / 'captions_display.json'
    read(captions)
    assets.append({'id': 'captions-v2', 'type': 'subtitle', 'path': rel(captions),
                   'source_tool': 'existing_v2_file', 'scene_id': 'all'})
    manifest = {'version': '1.0', 'assets': assets, 'metadata': {
        'revision': 'v2', 'authorization': AUTHORIZATION, 'limitations': LIMITATIONS,
        'music_metadata_ref': rel(v2 / 'music_metadata.json')}}
    edit = {'version': '1.0', 'composition_mode': 'atelier', 'render_runtime': 'remotion',
            'renderer_family': 'explainer-data', 'bespoke': {
                'entry': rel(entry), 'composition_id': composition,
                'art_direction': 'Existing bespoke V2 factual graphics, source media and burned-in debug HUD.'},
            'cuts': cuts, 'audio': {'narration': {'segments': segments},
                'music': {'asset_id': 'music-bed', 'volume': .7*music['gain_linear'],
                          'fade_in_seconds': .8, 'fade_out_seconds': 1.5}},
            'metadata': {'scene_timing_ref': rel(v2 / 'scene_timing.json'),
                         'captions_ref': rel(captions), 'draft_only': True}}
    timing_check = validate_edit_timing_against_audio(edit, project, asset_manifest=manifest)
    if not timing_check.valid:
        raise ValueError(timing_check.errors)
    output = {'path': rel(render), 'format': 'mp4', 'codec': video['codec_name'],
              'audio_codec': audio['codec_name'], 'resolution': f"{video['width']}x{video['height']}",
              'fps': fps, 'duration_seconds': duration, 'file_size_bytes': before[0],
              'platform_target': 'tiktok'}
    final = {'version': '1.0', 'output_path': rel(render), 'status': 'revise',
             'checks': {'technical_probe': {'valid_container': True, 'duration_seconds': duration,
                        'resolution': output['resolution'], 'fps': fps, 'has_audio': True,
                        'codec': video['codec_name'], 'file_size_bytes': before[0], 'issues': []},
                        **{key: {'issues': ['Not performed by mechanical closeout; pending lead/owner.']}
                           for key in ['visual_spotcheck', 'audio_spotcheck', 'promise_preservation', 'subtitle_check']}},
             'issues_found': LIMITATIONS, 'recommended_action': 'block',
             'metadata': {'draft_only': True, 'owner_review': 'pending', 'authorization': AUTHORIZATION}}
    report = {'version': '1.0', 'outputs': [output], 'render_grammar': 'explainer-data',
              'final_review_ref': rel(project / 'artifacts/final_review.json'),
              'verification_notes': ['ffprobe container/stream metadata collected from actual V2 MP4.',
                                     '21 public V2 WAV durations measured; scene frame arithmetic reconciled.'],
              'warnings': LIMITATIONS + timing_check.warnings,
              'metadata': {'draft_only': True, 'composition_id': composition,
                           'total_frames': timing['total_frames'], 'render_time_seconds': 'not measured'}}
    publish = {'version': '1.0', 'entries': [{'platform': 'tiktok', 'status': 'pending_review',
               'timestamp': now, 'export_path': rel(render), 'metadata_used': {
                   'description': 'Draft HUD only; description copy: '+rel(project/'artifacts/description_tiktok_v2.txt')}}],
               'metadata': {'draft_only': True, 'authorization': AUTHORIZATION,
                            'telegram_receipts': {'status': 'pending_lead', 'message_ids': []},
                            'blockers': LIMITATIONS}}
    artifacts = dict(zip(STAGES.values(), [manifest, edit, report, publish]))
    artifacts['final_review'] = final
    for name, data in artifacts.items():
        validate_artifact(name, data)
    # Fail before mutation if upstream human gates are absent/unapproved.
    for stage in ['idea', 'script', 'scene_plan']:
        cp = read(project / f'checkpoint_{stage}.json')
        validate_checkpoint(cp)
        if cp['status'] != 'completed' or not cp['human_approved'] or cp['pipeline_type'] != 'hybrid':
            raise ValueError(f'Upstream gate not approved: {stage}')
    backup = project / 'history' / ('closeout-v2-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    backup.mkdir(parents=True)
    originals = list(project.glob('checkpoint_*.json')) + [p for p in (project/'artifacts').iterdir() if p.is_file()]
    hashes = {}
    for path in originals:
        target = backup / path.relative_to(project)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        hashes[str(path.relative_to(project))] = hashlib.sha256(target.read_bytes()).hexdigest()
    save(backup/'backup_manifest.json', {'timestamp': now, 'sha256': hashes})
    for name, data in artifacts.items():
        save(project/'artifacts'/f'{name}.json', data)
        save(project/'artifacts/v2'/f'{name}.json', data)
    save(project/'artifacts/v2/ffprobe.json', raw_probe)
    for stage, name in STAGES.items():
        payload = {name: artifacts[name]}
        if stage == 'compose':
            payload['final_review'] = final
        write_checkpoint(project.parent, project.name, stage,
                         'awaiting_human' if stage == 'publish' else 'completed', payload,
                         pipeline_type='hybrid', human_approved=stage == 'assets',
                         metadata={'revision': 'v2', 'draft_only': True,
                                   'authorization': AUTHORIZATION, 'backup': rel(backup),
                                   'approval_scope': 'draft-production-only; NOT final acceptance',
                                   'telegram_receipts': 'pending_lead'})
    production = {'status': 'draft_pending_owner_review', 'render': output,
                  'backup': rel(backup), 'authorization': AUTHORIZATION,
                  'checks_performed': ['artifact schema validation', 'checkpoint validation via lib.checkpoint',
                                       'ffprobe streams/container', '21 WAV measurements and frame arithmetic',
                                       'edit timing validation', 'referenced media existence'],
                  'audio_measurements': measurements, 'limitations': LIMITATIONS,
                  'exact_paths': {name: rel(project/'artifacts'/f'{name}.json') for name in artifacts},
                  'existing_evidence_refs': [rel(p) for p in (project/'artifacts/v2').glob('independent_audit*')],
                  'telegram_receipts': {'status': 'pending_lead', 'message_ids': []}}
    save(project/'artifacts/v2/production_report.json', production)
    print(json.dumps({'status': production['status'], 'report': rel(project/'artifacts/v2/production_report.json'),
                      'backup': rel(backup)}, ensure_ascii=False))
    return production


if __name__ == '__main__':
    closeout()
