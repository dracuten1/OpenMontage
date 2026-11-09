import json
import wave
import numpy as np
import pytest

from tools.qc.episode_gate import validate_episode
from tools.qc.mix_validator import validate
from tests.test_episode_gate import valid_episode, packet
from tests.test_mix_validator import setup, fake_lufs


def test_f4_red_multiscene_episode_covered_by_single_packet_rejected(tmp_path):
    """F4 RED test: multi-scene episode covered by single packet currently passes."""
    from tests.test_timing_relock_validator import _write_real_wav_file
    from lib.production_validation import EvidenceRecord, ValidationStatus
    project = valid_episode(tmp_path)
    audio = project / 'assets/audio'
    wav2 = audio / 'voice_s2.wav'
    _write_real_wav_file(wav2, 1.0)

    edit_path = project / 'artifacts' / 'edit_decisions.json'
    edit = json.loads(edit_path.read_text())
    edit['cuts'].append({
        'id': 'cut-2',
        'source': 'assets/audio/voice_s2.wav',
        'in_seconds': 0,
        'out_seconds': 1.0,
        'layer': 'primary'
    })
    edit_path.write_text(json.dumps(edit))

    manifest_path = project / 'artifacts' / 'asset_manifest.json'
    manifest = json.loads(manifest_path.read_text())
    manifest['assets'].append({
        'id': 'voice-s2',
        'type': 'narration',
        'scene_id': 'cut-2',
        'path': 'assets/audio/voice_s2.wav',
        'duration_seconds': 1.0
    })
    manifest['metadata']['total_audio_speech_duration_seconds'] = 2.0
    manifest_path.write_text(json.dumps(manifest))

    art = project / 'artifacts'
    words = [
        {'word': 'spoken1', 'scene_id': 'cut-1', 'global_start': 0.05, 'global_end': 0.3},
        {'word': 'spoken2', 'scene_id': 'cut-2', 'global_start': 0.05, 'global_end': 0.3},
    ]
    (art / 'narration_words.json').write_text(json.dumps(words))

    stems = project / 'audio_stems'
    for name in ('narration', 'bgm', 'sfx', 'mix'):
        with wave.open(str(stems / f'{name}.wav'), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(b'\x00\x00' * 16000)

    ev = project / 'artifacts' / 'layout_evidence.json'
    # Fixture contract (review A-1 + A-2 hardening): full required gate set with
    # per-path content hashes, so this test isolates the F4 packet-coverage defect
    # instead of tripping the pre-render production gate.
    from tests.test_episode_gate import _full_gate_records
    records = _full_gate_records(project / 'artifacts', ['cut-1', 'cut-2'])
    (project / 'artifacts' / 'production_evidence.json').write_text(json.dumps([r.to_dict() for r in records]))

    # Currently: only 1 packet exists (packet.json for cut-1 / s1).
    # On unhardened code, validate_episode returns [] (it PASSES without detecting missing cut-2 packet!).
    reasons = validate_episode(project)
    codes = {r['code'] for r in reasons}
    # Strict contract requirement: missing packet for cut-2 must be rejected
    assert 'scene_packet_missing' in codes


def test_f8_a_red_undeclared_missing_sfx_must_fail(tmp_path):
    """F8 RED test (a): undeclared missing sfx stem with not_measured populated must return valid:false."""
    profile = setup(tmp_path)
    doc = json.loads(profile.read_text())
    doc['leading_sfx'] = {'sfx_onset_seconds': 0.2, 'first_word_seconds': 0.8}
    doc['windows']['expected_signal'] = [[1, 2]]
    # Notice: doc does NOT declare 'no_sfx': True
    profile.write_text(json.dumps(doc))

    # Unlink sfx stem
    (tmp_path / 'sfx.wav').unlink()
    manifest = json.loads((tmp_path / 'manifest.json').read_text())
    del manifest['sfx']
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))

    verdict = validate(tmp_path, profile, fake_lufs)
    # Check that not_measured is populated
    assert any(x['check'] == 'leading_sfx' for x in verdict['not_measured'])
    # Strict contract requirement: undeclared missing required stem must return valid: false
    assert verdict['valid'] is False
    assert any('sfx' in e.lower() and 'missing' in e.lower() for e in verdict['errors'])


def test_f8_b_red_episode_gate_unmeasured_mix_fields_must_fail(tmp_path):
    """F8 RED test (b): episode_gate passes a mix report carrying unmeasured fields when undeclared."""
    project = valid_episode(tmp_path)
    # Remove declared_not_measured so music_masking is undeclared unmeasured
    prof = project / 'mix_profile.json'
    doc = json.loads(prof.read_text())
    doc.pop('declared_not_measured', None)
    prof.write_text(json.dumps(doc))

    reasons = validate_episode(project)
    codes = {r['code'] for r in reasons}
    # Strict contract requirement: episode_gate must reject unmeasured mix checks
    assert 'mix_measurement_incomplete' in codes


def test_f4_extra_packet_rejected(tmp_path):
    """Extra packet not in authoritative scenes must be rejected."""
    project = valid_episode(tmp_path)
    # Add an extra packet with scene_id: 'unknown-scene'
    p_extra = packet(project)
    p_extra['scene_id'] = 'unknown-scene'
    (project / 'extra_packet.json').write_text(json.dumps(p_extra))
    reasons = validate_episode(project)
    codes = {r['code'] for r in reasons}
    assert 'scene_packet_extra' in codes


def test_f4_empty_authoritative_scenes_with_packet_rejected(tmp_path):
    """Fail-closed: when packets exist but no authoritative scenes discovered, gate must block."""
    project = valid_episode(tmp_path)
    # Absent scene_manifest and edit_decisions
    (project / 'artifacts' / 'edit_decisions.json').unlink()
    reasons = validate_episode(project)
    codes = {r['code'] for r in reasons}
    assert 'scene_packet_extra' in codes
    assert any('no authoritative scenes discovered' in r['message'] for r in reasons if r['code'] == 'scene_packet_extra')

    # Empty cuts in edit_decisions and absent scene_manifest
    project_empty = valid_episode(tmp_path / 'empty_cuts')
    edit_path = project_empty / 'artifacts' / 'edit_decisions.json'
    edit = json.loads(edit_path.read_text())
    edit['cuts'] = []
    edit_path.write_text(json.dumps(edit))
    reasons_empty = validate_episode(project_empty)
    codes_empty = {r['code'] for r in reasons_empty}
    assert 'scene_packet_extra' in codes_empty
    assert any('no authoritative scenes discovered' in r['message'] for r in reasons_empty if r['code'] == 'scene_packet_extra')


def test_f4_stale_packet_rejected(tmp_path):
    """Packet whose content no longer matches current scene/cut state must be rejected."""
    project = valid_episode(tmp_path)
    # Mutate the audio file referenced by the cut on disk while keeping valid WAV format and duration
    wav = project / 'assets/audio/voice_s1.wav'
    with wave.open(str(wav), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(b'\x01\x00' * 16000)
    reasons = validate_episode(project)
    codes = {r['code'] for r in reasons}
    assert 'stale_packet' in codes


def test_f4_verdict_binding_mismatch_rejected(tmp_path):
    """Reviewer verdict tied to old hashes must not bless new output hashes."""
    project = valid_episode(tmp_path)
    packet_path = project / 'packet.json'
    p = json.loads(packet_path.read_text())
    # Writer updates output hash, but reviewer verdict was on old hash
    p['narration']['sha256'] = 'f' * 64
    p['frozen_inputs'][str(project / 'scene/audio.wav')] = 'f' * 64
    # The actual file is written with matching hash so it's not a missing file
    (project / 'scene/audio.wav').write_bytes(b'fresh_content')
    import hashlib
    actual_fresh_hash = hashlib.sha256(b'fresh_content').hexdigest()
    p['narration']['sha256'] = actual_fresh_hash
    p['frozen_inputs'][str(project / 'scene/audio.wav')] = actual_fresh_hash
    # But reviewer.reviewed_hashes or findings still reflects the OLD hash
    if 'reviewed_hashes' in p.get('reviewer', {}):
        p['reviewer']['reviewed_hashes']['scene/audio.wav'] = '0' * 64
    packet_path.write_text(json.dumps(p))
    reasons = validate_episode(project)
    codes = {r['code'] for r in reasons}
    assert any(c in codes for c in ('verdict_binding_mismatch', 'verdict_binding_missing'))


def test_f8_declared_no_sfx_passes(tmp_path):
    """Declared no-SFX in profile allows missing SFX stem."""
    profile = setup(tmp_path)
    doc = json.loads(profile.read_text())
    doc['leading_sfx'] = {'sfx_onset_seconds': 0.2, 'first_word_seconds': 0.8}
    doc['windows']['expected_signal'] = [[1, 2]]
    doc['no_sfx'] = True
    profile.write_text(json.dumps(doc))

    # Unlink sfx stem
    (tmp_path / 'sfx.wav').unlink()
    manifest = json.loads((tmp_path / 'manifest.json').read_text())
    del manifest['sfx']
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))

    verdict = validate(tmp_path, profile, fake_lufs)
    assert verdict['valid'] is True, verdict['errors']
    assert any(x['check'] == 'leading_sfx' for x in verdict['not_measured'])
    assert any('declared no-sfx' in x['reason'].lower() for x in verdict['not_measured'])
