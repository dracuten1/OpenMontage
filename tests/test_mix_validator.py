import json
import shutil
import subprocess
import sys
import wave

import numpy as np
import pytest

from tools.qc.mix_validator import validate


def wav(path, data, rate=8000):
    x = np.asarray(data)
    q = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(q.tobytes())


def setup(tmp_path, mode='clean'):
    rate = 8000
    n = rate * 4
    t = np.arange(n) / rate
    narr = np.zeros(n)
    narr[rate:2 * rate] = .2 * np.sin(2 * np.pi * 220 * t[rate:2 * rate])
    bgm = .2 * np.sin(2 * np.pi * 110 * t)
    bgm[rate:2 * rate] *= .15 if mode != 'no_duck' else 1
    sfx = np.zeros(n)
    mix = narr + bgm
    if mode == 'clip':
        mix *= 4
        mix[0] = 1.2
    if mode == 'bleed':
        sfx[3 * rate:] = .3
        mix += sfx
    if mode == 'silent_signal':
        mix[:] = 0
    if mode == 'wrong_lufs':
        mix *= .01
    for name, data in [('narration', narr), ('bgm', bgm), ('sfx', sfx), ('mix', mix)]:
        wav(tmp_path / f'{name}.wav', data)
    manifest = {k: f'{k}.wav' for k in ('narration', 'bgm', 'sfx', 'mix')}
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    profile = {
        'schema': 'openmontage.mix-profile', 'version': 1,
        'target_lufs': -18, 'lufs_tolerance': 2, 'peak_limit': .999,
        'silence_threshold': .003, 'boundary_tolerance_seconds': .05,
        'ducking': {'min_reduction_db': 12},
        'windows': {
            'narration': [[1, 2]], 'expected_silent': [],
            'expected_signal': [[.2, .8]], 'stem_windows': {'sfx': [0, 2]},
        },
    }
    (tmp_path / 'profile.json').write_text(json.dumps(profile))
    return tmp_path / 'profile.json'


def fake_lufs(path):
    return -16.


def test_clean(tmp_path):
    profile = setup(tmp_path)
    verdict = validate(tmp_path, profile, fake_lufs)
    assert verdict['valid'] is True, verdict['errors']


def test_clipping_fails(tmp_path):
    setup(tmp_path, 'clip')
    verdict = validate(tmp_path, tmp_path / 'profile.json', fake_lufs)
    assert verdict['valid'] is False
    assert any('mix clipping' in e for e in verdict['errors'])


def test_lufs_fails(tmp_path):
    setup(tmp_path, 'wrong_lufs')
    verdict = validate(tmp_path, tmp_path / 'profile.json', lambda p: -30)
    assert verdict['valid'] is False
    assert any('LUFS' in e for e in verdict['errors'])


def test_ducking_fails(tmp_path):
    setup(tmp_path, 'no_duck')
    verdict = validate(tmp_path, tmp_path / 'profile.json', fake_lufs)
    assert verdict['valid'] is False
    assert any('ducking' in e for e in verdict['errors'])


def test_boundary_bleed_fails(tmp_path):
    setup(tmp_path, 'bleed')
    verdict = validate(tmp_path, tmp_path / 'profile.json', fake_lufs)
    assert verdict['valid'] is False
    assert any('bleeds' in e for e in verdict['errors'])


def test_silent_expected_signal_fails(tmp_path):
    setup(tmp_path, 'silent_signal')
    verdict = validate(tmp_path, tmp_path / 'profile.json', fake_lufs)
    assert verdict['valid'] is False
    assert any('silence in expected-signal' in e for e in verdict['errors'])


def test_missing_stem_fails(tmp_path):
    setup(tmp_path)
    (tmp_path / 'bgm.wav').unlink()
    verdict = validate(tmp_path, tmp_path / 'profile.json', fake_lufs)
    assert verdict['valid'] is False
    assert any('missing/unreadable bgm stem or mix' in e for e in verdict['errors'])


def test_malformed_profile_fails(tmp_path):
    setup(tmp_path)
    (tmp_path / 'profile.json').write_text('{}')
    verdict = validate(tmp_path, tmp_path / 'profile.json', fake_lufs)
    assert verdict['valid'] is False
    assert any('unsupported profile schema/version' in e for e in verdict['errors'])


def test_real_ebur128(tmp_path):
    if not shutil.which('ffmpeg'):
        pytest.skip('ffmpeg not available')
    profile = setup(tmp_path)
    verdict = validate(tmp_path, profile)
    lufs = verdict['loudness']
    assert lufs is not None, errors
    assert abs(lufs - (-18)) <= 6
    expected_conformance = abs(lufs - (-18)) <= 2
    assert verdict['valid'] is expected_conformance, verdict['errors']


def _run_cli(args):
    return subprocess.run(
        [sys.executable, '-m', 'tools.qc.mix_validator', *map(str, args)],
        capture_output=True, text=True, cwd=Path(__file__).resolve().parents[1],
    )


from pathlib import Path


def test_cli_clean_exit_code(tmp_path):
    profile = setup(tmp_path)
    result = _run_cli([tmp_path, tmp_path / 'profile.json'])
    assert result.returncode == 0, result.stdout + result.stderr


def test_cli_adversarial_exit_code(tmp_path):
    setup(tmp_path, 'clip')
    result = _run_cli([tmp_path, tmp_path / 'profile.json'])
    assert result.returncode == 1, result.stdout + result.stderr


@pytest.mark.parametrize('args', [[], ['only-one-argument']])
def test_cli_missing_args_exit_code(args):
    result = _run_cli(args)
    assert result.returncode == 2, result.stdout + result.stderr


@pytest.mark.parametrize(('window','reason'), [
    ([[-.1, .5]], 'narration[0]'),
    ([[.8, .2]], 'narration[0]'),
    ([[3.5, 4.1]], 'narration[0]'),
])
def test_invalid_windows_fail_with_named_reason(tmp_path, window, reason):
    profile = setup(tmp_path)
    doc = json.loads(profile.read_text())
    doc['windows']['narration'] = window
    profile.write_text(json.dumps(doc))
    verdict = validate(tmp_path, profile, fake_lufs)
    assert not verdict['valid']
    assert any(reason in error and 'window' in error for error in verdict['errors'])


def test_nan_lufs_tolerance_rejected(tmp_path):
    profile = setup(tmp_path)
    doc = json.loads(profile.read_text())
    doc['lufs_tolerance'] = float('nan')
    profile.write_text(json.dumps(doc))
    verdict = validate(tmp_path, profile, fake_lufs)
    assert not verdict['valid']
    assert any('non-finite' in error for error in verdict['errors'])


def test_wrong_rate_stem_rejected(tmp_path):
    profile = setup(tmp_path)
    wav(tmp_path / 'bgm.wav', np.zeros(4 * 4000), rate=4000)
    verdict = validate(tmp_path, profile, fake_lufs)
    assert not verdict['valid']
    assert any('bgm sample rate' in error for error in verdict['errors'])


def test_channel_mismatch_rejected(tmp_path):
    profile = setup(tmp_path)
    x = np.zeros(4 * 8000)
    q = (x * 32767).astype('<i2')
    with wave.open(str(tmp_path / 'sfx.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(8000)
        w.writeframes(np.column_stack((q, q)).tobytes())
    verdict = validate(tmp_path, profile, fake_lufs)
    assert not verdict['valid']
    assert any('sfx channel count' in error for error in verdict['errors'])


def test_duration_mismatch_over_50ms_rejected(tmp_path):
    profile = setup(tmp_path)
    wav(tmp_path / 'narration.wav', np.zeros(4 * 8000 + 401))
    verdict = validate(tmp_path, profile, fake_lufs)
    assert not verdict['valid']
    assert any('narration duration' in error and '0.050s' in error for error in verdict['errors'])


def test_duration_mismatch_within_50ms_allowed(tmp_path):
    profile = setup(tmp_path)
    wav(tmp_path / 'narration.wav', np.zeros(4 * 8000 + 400))
    verdict = validate(tmp_path, profile, fake_lufs)
    assert verdict['valid'], verdict['errors']


def test_cli_invalid_profile_schema_exit_code_2(tmp_path):
    profile = setup(tmp_path)
    (tmp_path / 'profile.json').write_text(json.dumps({'schema': 'wrong', 'version': 1}))
    result = _run_cli([tmp_path, tmp_path / 'profile.json'])
    assert result.returncode == 2, result.stdout + result.stderr

@pytest.mark.parametrize(('sfx_energy','mix_energy','expected_valid'), [(0.0, .2, False), (.2, .0, True)])
def test_leading_sfx_gate_uses_sfx_stem_only(tmp_path, sfx_energy, mix_energy, expected_valid):
    profile = setup(tmp_path)
    doc = json.loads(profile.read_text())
    doc['leading_sfx'] = {'sfx_onset_seconds': 0.2, 'first_word_seconds': 0.8}
    doc['windows']['expected_signal'] = [[1, 2]]
    profile.write_text(json.dumps(doc))
    sfx = np.zeros(4 * 8000); sfx[1600:6400] = sfx_energy
    wav(tmp_path / 'sfx.wav', sfx)
    mix = np.zeros(4 * 8000); mix[8000:16000] = .2; mix[1600:6400] = mix_energy
    wav(tmp_path / 'mix.wav', mix)
    verdict = validate(tmp_path, profile, fake_lufs)
    assert verdict['valid'] is expected_valid, verdict['errors']
    if expected_valid:
        assert verdict['evidence']['leading_sfx']['source'] == 'sfx'
    else:
        assert any('silent on SFX stem' in e for e in verdict['errors'])

def test_leading_sfx_absent_is_not_measured(tmp_path):
    # F8 tightened contract: undeclared missing SFX stem fails closed with valid: False.
    profile = setup(tmp_path)
    doc = json.loads(profile.read_text())
    doc['leading_sfx'] = {'sfx_onset_seconds': 0.2, 'first_word_seconds': 0.8}
    doc['windows']['expected_signal'] = [[1, 2]]
    profile.write_text(json.dumps(doc))
    (tmp_path / 'sfx.wav').unlink()
    manifest = json.loads((tmp_path / 'manifest.json').read_text())
    del manifest['sfx']
    (tmp_path / 'manifest.json').write_text(json.dumps(manifest))
    verdict_undeclared = validate(tmp_path, profile, fake_lufs)
    entry_undeclared = next(x for x in verdict_undeclared['not_measured'] if x['check'] == 'leading_sfx')
    assert entry_undeclared['reason']
    assert verdict_undeclared['valid'] is False
    assert any('missing' in e.lower() and 'sfx' in e.lower() for e in verdict_undeclared['errors'])

    # Declared no-sfx in profile allows missing SFX stem to pass with valid: True.
    doc['no_sfx'] = True
    profile.write_text(json.dumps(doc))
    verdict = validate(tmp_path, profile, fake_lufs)
    entry = next(x for x in verdict['not_measured'] if x['check'] == 'leading_sfx')
    assert 'declared no-sfx' in entry['reason'].lower()
    assert verdict['valid'] is True, verdict['errors']

def test_declared_tail_is_anchored_to_actual_stem_end(tmp_path):
    profile = setup(tmp_path)
    doc = json.loads(profile.read_text())
    doc['windows']['stem_windows']['sfx'] = [0, 1]
    doc['declared_tails'] = [{'stem': 'sfx', 'tail_seconds': 1.0}]
    profile.write_text(json.dumps(doc))
    sfx = np.zeros(4 * 8000); sfx[:2 * 8000] = .2
    wav(tmp_path / 'sfx.wav', sfx)
    verdict = validate(tmp_path, profile, fake_lufs)
    assert verdict['valid'] is True, verdict['errors']

    # Signal extending past declared tail span fails, even within boundary tolerance.
    sfx[2 * 8000:2 * 8000 + 800] = .2
    wav(tmp_path / 'sfx.wav', sfx)
    verdict = validate(tmp_path, profile, fake_lufs)
    assert verdict['valid'] is False
    assert any('bleeds beyond declared tail end' in e for e in verdict['errors'])

def test_undeclared_tail_bleed_fails(tmp_path):
    profile = setup(tmp_path)
    doc = json.loads(profile.read_text())
    doc['windows']['stem_windows']['sfx'] = [0, 2]
    profile.write_text(json.dumps(doc))
    sfx = np.zeros(4 * 8000); sfx[2 * 8000:3 * 8000] = .2
    wav(tmp_path / 'sfx.wav', sfx)
    verdict = validate(tmp_path, profile, fake_lufs)
    assert verdict['valid'] is False
    assert any('sfx signal bleeds past window end 2.0s' in e for e in verdict['errors'])

def test_music_masking_is_reported_not_measured(tmp_path):
    profile = setup(tmp_path)
    verdict = validate(tmp_path, profile, fake_lufs)
    entry = next((item for item in verdict['not_measured'] if item['check'] == 'music_masking'), None)
    assert verdict['valid'] is True, verdict['errors']
    assert entry is not None
    assert 'perceptual verification unavailable' in entry['reason']


def _tail_profile(profile, stem_window, tail_seconds):
    doc = json.loads(profile.read_text())
    doc['windows']['stem_windows']['sfx'] = stem_window
    doc['declared_tails'] = [{'stem': 'sfx', 'tail_seconds': tail_seconds}]
    profile.write_text(json.dumps(doc))


def test_declared_tail_anchor_detects_g2d3_shaped_bleed(tmp_path):
    profile = setup(tmp_path)
    _tail_profile(profile, [0, 1.95], .15)
    sfx = np.zeros(4 * 8000)
    sfx[:int(1.8 * 8000)] = .2
    sfx[int(2.05 * 8000):int(2.18 * 8000)] = .2
    wav(tmp_path / 'sfx.wav', sfx)
    verdict = validate(tmp_path, profile, fake_lufs)
    assert not verdict['valid'], verdict['errors']
    assert any('bleeds beyond declared tail end' in e for e in verdict['errors'])


def test_declared_tail_anchor_uses_actual_signal_end(tmp_path):
    profile = setup(tmp_path)
    _tail_profile(profile, [0, 2.0], .1)
    sfx = np.zeros(4 * 8000)
    sfx[:int(.3 * 8000)] = .2
    sfx[int(.6 * 8000):int(.65 * 8000)] = .2
    sfx[int(.85 * 8000):int(.9 * 8000)] = .2
    sfx[int(1.0 * 8000):int(1.05 * 8000)] = .2
    sfx[int(1.4 * 8000):int(1.45 * 8000)] = .2
    sfx[int(1.8 * 8000):int(1.85 * 8000)] = .2
    sfx[int(2.0 * 8000):int(2.05 * 8000)] = .2
    wav(tmp_path / 'sfx.wav', sfx)
    verdict = validate(tmp_path, profile, fake_lufs)
    assert not verdict['valid'], verdict['errors']
    assert any('bleeds beyond declared tail end' in e for e in verdict['errors'])


def test_declared_tail_peak_detects_single_sample_impulse(tmp_path):
    profile = setup(tmp_path)
    _tail_profile(profile, [0, 1.0], .1)
    sfx = np.zeros(4 * 8000)
    sfx[:int(.8 * 8000)] = .2
    sfx[int(1.2 * 8000)] = .2
    wav(tmp_path / 'sfx.wav', sfx)
    verdict = validate(tmp_path, profile, fake_lufs)
    assert not verdict['valid'], verdict['errors']
    assert any('peak' in e and 'bleeds beyond declared tail end' in e for e in verdict['errors'])


def test_cli_leading_sfx_prints_evidence_and_not_measured(tmp_path):
    profile = setup(tmp_path)
    doc = json.loads(profile.read_text())
    doc['leading_sfx'] = {'sfx_onset_seconds': .2, 'first_word_seconds': .8}
    doc['windows']['expected_signal'] = [[1, 2]]
    profile.write_text(json.dumps(doc))
    sfx = np.zeros(4 * 8000); sfx[1600:6400] = .2
    wav(tmp_path / 'sfx.wav', sfx)
    result = _run_cli([tmp_path, profile])
    assert result.returncode == 0, result.stdout + result.stderr
    assert 'evidence leading_sfx:' in result.stdout and '"source": "sfx"' in result.stdout
    assert 'not_measured music_masking:' in result.stdout
