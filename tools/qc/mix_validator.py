from __future__ import annotations
import argparse, json, math, re, shutil, subprocess, sys, wave
from pathlib import Path
import numpy as np

# Audio streams may differ in duration by at most 50 ms; this allows WAV frame rounding.
DURATION_TOLERANCE_SECONDS = 0.05

class ValidationError(ValueError): pass
class ProfileError(ValidationError): pass
class InputError(ValidationError): pass


def read_wav(path):
    with wave.open(str(path), 'rb') as w:
        n, rate, width, frames = w.getnchannels(), w.getframerate(), w.getsampwidth(), w.getnframes()
        raw = w.readframes(frames)
    if width == 2: data = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768
    elif width == 4: data = np.frombuffer(raw, dtype='<i4').astype(np.float32) / 2147483648
    elif width == 1: data = (np.frombuffer(raw, dtype=np.uint8).astype(np.float32) - 128) / 128
    else: raise ValidationError(f'unsupported WAV width: {path}')
    return data.reshape(-1, n), rate


def integrated_lufs(path):
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg: raise InputError('ffmpeg not found; LUFS unmeasured')
    p = subprocess.run([ffmpeg, '-hide_banner', '-i', str(path), '-af', 'ebur128=framelog=verbose', '-f', 'null', '-'], capture_output=True, text=True, timeout=120)
    vals = re.findall(r'I:\s*(-?\d+(?:\.\d+)?)\s*LUFS', p.stderr)
    if p.returncode and not vals: raise InputError(f'ebur128 failed: {p.stderr[-500:]}')
    if not vals: raise InputError('ebur128 integrated LUFS unavailable')
    return float(vals[-1])


def validate(source, profile_path, measure=integrated_lufs, *, raise_errors=False):
    errors = []; loudness = None; valid = True
    not_measured = [{'check': 'music_masking', 'reason': 'perceptual verification unavailable — mechanical validator has no perceptual model'}]
    leading_sfx = None; leading_sfx_energy = None; leading_sfx_source = None
    try:
        profile = json.loads(Path(profile_path).read_text(), parse_constant=lambda x: float(x))
        if not isinstance(profile, dict) or profile.get('schema') != 'openmontage.mix-profile' or profile.get('version') != 1:
            raise ProfileError('unsupported profile schema/version')
        try:
            target = float(profile['target_lufs']); tol = float(profile['lufs_tolerance'])
            numeric = [target, tol]
            defaults = {'peak_limit': .999, 'silence_threshold': .001, 'boundary_tolerance_seconds': .05}
            for key, default in defaults.items():
                value = float(profile.get(key, default))
                if not math.isfinite(value): raise ProfileError(f'non-finite numeric profile field: {key}')
            ducking = profile.get('ducking', {})
            if not isinstance(ducking, dict): raise ProfileError('invalid ducking profile section')
            numeric.append(float(ducking.get('min_reduction_db', 12)))
            windows = profile.get('windows', {})
            if not isinstance(windows, dict): raise ProfileError('invalid windows section')
            if not all(math.isfinite(x) for x in numeric): raise ProfileError('non-finite numeric profile field')
            if not -70 <= target <= 0 or tol < 0: raise ProfileError('invalid LUFS target/tolerance')
            no_sfx = bool(profile.get('no_sfx', False) or profile.get('sfx_expected') is False or profile.get('sfx_mode') == 'none')
            declared_not_measured = profile.get('declared_not_measured', [])
            if not isinstance(declared_not_measured, list) or not all(isinstance(x, str) for x in declared_not_measured):
                raise ProfileError('invalid declared_not_measured list')
        except ProfileError: raise
        except (KeyError, TypeError, ValueError) as e:
            raise ProfileError(f'invalid numeric profile field: {e}') from e

        root = Path(source)
        try:
            manifest = json.loads(root.read_text()) if root.is_file() else json.loads((root / 'manifest.json').read_text())
        except (OSError, json.JSONDecodeError) as e:
            raise InputError(f'invalid/unreadable manifest: {e}') from e
        if not isinstance(manifest, dict): raise InputError('invalid manifest: expected JSON object')
        base = root.parent if root.is_file() else root
        paths = {k: (base / v if not Path(v).is_absolute() else Path(v)) for k, v in manifest.items() if isinstance(v, str)}
        for key in ('narration', 'bgm', 'mix'):
            if key not in paths or not paths[key].is_file():
                raise InputError(f'missing/unreadable {key} stem or mix: {paths.get(key, key)}')
        # Optional v1 extensions: leading_sfx={sfx_onset_seconds, first_word_seconds}; declared_tails=[{stem, tail_seconds}].
        leading_sfx = profile.get('leading_sfx')
        if leading_sfx is not None and ('sfx' not in paths or not paths['sfx'].is_file()):
            reason = 'declared no-sfx intent in profile; leading_sfx unmeasured' if no_sfx else 'SFX stem absent from manifest or stems; mix fallback is not authoritative'
            if not any(item['check'] == 'leading_sfx' and item['reason'] == reason for item in not_measured):
                not_measured.append({'check': 'leading_sfx', 'reason': reason})
        # SFX is required unless explicit no-sfx intent is declared.
        if not no_sfx and ('sfx' not in paths or not paths['sfx'].is_file()):
            if raise_errors:
                raise InputError(f'missing/unreadable sfx stem or mix: {paths.get("sfx", "sfx")}')
            errors.append(f'missing/unreadable sfx stem or mix: {paths.get("sfx", "sfx")}')
            valid = False
        audio = {}
        for key in ('narration', 'bgm', 'mix', 'sfx'):
            if key not in paths or not paths[key].is_file():
                continue
            try: audio[key] = read_wav(paths[key])
            except Exception as e: raise InputError(f'unreadable {key} audio: {e}') from e
        mix_data, mix_rate = audio['mix']; channels = mix_data.shape[1]; duration = len(mix_data) / mix_rate
        for key, (data, rate) in audio.items():
            stem_duration = len(data) / rate
            if rate != mix_rate: errors.append(f'{key} sample rate {rate} does not match mix rate {mix_rate}')
            if data.shape[1] != channels: errors.append(f'{key} channel count {data.shape[1]} does not match mix channel count {channels}')
            if abs(stem_duration - duration) > DURATION_TOLERANCE_SECONDS:
                errors.append(f'{key} duration {stem_duration:.3f}s differs from mix duration {duration:.3f}s by more than {DURATION_TOLERANCE_SECONDS:.3f}s')
        if errors: return {'valid': False, 'errors': errors, 'loudness': None, 'not_measured': not_measured, 'evidence': {}}

        stem_windows = windows.get('stem_windows', {})
        if not isinstance(stem_windows, dict): raise ProfileError('invalid windows list: stem_windows')
        # Optional v1 extensions: leading_sfx={sfx_onset_seconds, first_word_seconds}; declared_tails=[{stem, tail_seconds}].
        leading_sfx = profile.get('leading_sfx')
        if leading_sfx is not None:
            if not isinstance(leading_sfx, dict): raise ProfileError('invalid leading_sfx section')
            try:
                sfx_onset = float(leading_sfx['sfx_onset_seconds'])
                first_word = float(leading_sfx['first_word_seconds'])
            except (KeyError, TypeError, ValueError) as e: raise ProfileError(f'invalid leading_sfx fields: {e}') from e
            if not math.isfinite(sfx_onset) or not math.isfinite(first_word) or not 0 <= sfx_onset < first_word <= duration:
                raise ProfileError('leading_sfx window outside audio bounds or reversed')
            if 'sfx' not in audio:
                reason = 'declared no-sfx intent in profile; leading_sfx unmeasured' if no_sfx else 'SFX stem absent from manifest or stems; mix fallback is not authoritative'
                if not any(item['check'] == 'leading_sfx' and item['reason'] == reason for item in not_measured):
                    not_measured.append({'check': 'leading_sfx', 'reason': reason})
        declared_tails = profile.get('declared_tails', [])  # Optional v1 extension: [{stem, tail_seconds}].
        if not isinstance(declared_tails, list): raise ProfileError('invalid declared_tails list')
        tails = {}
        for i, tail in enumerate(declared_tails):
            try:
                stem, seconds = tail['stem'], float(tail['tail_seconds'])
            except (TypeError, KeyError, ValueError): raise ProfileError(f'invalid declared_tails[{i}]')
            if stem not in audio or not math.isfinite(seconds) or seconds <= 0: raise ProfileError(f'invalid declared_tails[{i}] stem or tail_seconds')
            tails[stem] = max(tails.get(stem, 0), seconds)
        def validate_windows(name, pairs):
            if not isinstance(pairs, list): raise ProfileError(f'invalid windows list: {name}')
            for index, pair in enumerate(pairs):
                label = f'{name}[{index}]'
                try: start, end = map(float, pair)
                except (TypeError, ValueError): raise ProfileError(f'invalid window {label}')
                if not math.isfinite(start) or not math.isfinite(end) or not 0 <= start < end <= duration:
                    raise ProfileError(f'window {label} ({start}-{end}s) outside audio bounds [0,{duration:.3f}s] or reversed')
        for name in ('narration', 'expected_silent', 'expected_signal'):
            validate_windows(name, windows.get(name, []))
        for stem, bounds in stem_windows.items():
            if stem not in audio:
                if stem == 'sfx' and (leading_sfx is not None or no_sfx): continue
                raise ProfileError(f'unknown stem window: {stem}')
            validate_windows(f'stem_windows.{stem}', [bounds])

        prof = profile; mix, mix_rate = audio['mix']
        if np.max(np.abs(mix)) >= float(prof.get('peak_limit', .999)):
            errors.append('mix clipping: peak sample exceeds limit (true-peak proxy is sample peak; no oversampling)')
        def rms(data, rate, start, end):
            x = data[max(0, int(start * rate)):min(len(data), int(end * rate))]
            return float(np.sqrt(np.mean(x * x))) if x.size else 0.
        for start, end in windows.get('narration', []):
            bgm, rate = audio['bgm']; mid = (start + end) / 2
            before = rms(bgm, rate, max(0, start - .5), start); during = rms(bgm, rate, mid - .2, mid + .2)
            reduction = 20 * np.log10(max(before, 1e-9) / max(during, 1e-9))
            if reduction < float(prof.get('ducking', {}).get('min_reduction_db', 12)):
                errors.append(f'ducking insufficient in {start}-{end}s: {reduction:.1f} dB')
        threshold = float(prof.get('silence_threshold', .001))
        leading_sfx_energy = None
        leading_sfx_source = None
        if leading_sfx is not None:
            start, end = sfx_onset, first_word
            sfx_entry = audio.get('sfx')
            if sfx_entry is None:
                reason = 'declared no-sfx intent in profile; leading_sfx unmeasured' if no_sfx else 'SFX stem absent from manifest or stems; mix fallback is not authoritative'
                if not any(item['check'] == 'leading_sfx' and item['reason'] == reason for item in not_measured):
                    not_measured.append({'check': 'leading_sfx', 'reason': reason})
            else:
                sfx, rate = sfx_entry
                energy = rms(sfx, rate, start, end)
                leading_sfx_energy, leading_sfx_source = energy, 'sfx'
                if energy <= threshold: errors.append(f'leading SFX window {start}-{end}s is silent on SFX stem (RMS {energy:.6f})')
        for start, end in windows.get('expected_silent', []):
            if rms(mix, mix_rate, start, end) > threshold: errors.append(f'signal in expected-silent window {start}-{end}s')
        for start, end in windows.get('expected_signal', []):
            if rms(mix, mix_rate, start, end) <= threshold: errors.append(f'silence in expected-signal window {start}-{end}s')
        for stem, bounds in stem_windows.items():
            if stem not in audio: continue
            data, rate = audio[stem]; end = float(bounds[1]); tolerance = float(prof.get('boundary_tolerance_seconds', .05))
            tail_seconds = tails.get(stem, 0)
            if tail_seconds:
                # body_end is the last active 10ms RMS window, with anchor capped at declared window end so bleed cannot shift it.
                window_samples = max(1, int(rate * .01))
                cap_samples = min(len(data), int(end * rate))
                active = [i for i in range(0, cap_samples, window_samples)
                          if rms(data, rate, i / rate, min(cap_samples / rate, (i + window_samples) / rate)) > threshold]
                if not active:
                    continue
                body_end = min(cap_samples / rate, (active[-1] + window_samples) / rate)
                tail_end = body_end + tail_seconds + tolerance
                bleed = rms(data, rate, tail_end, len(data) / rate)
                peak = float(np.max(np.abs(data[int(tail_end * rate):]))) if int(tail_end * rate) < len(data) else 0.
                # RMS catches sustained bleed; peak floor catches isolated transients hidden by window averaging.
                if bleed > threshold or peak > threshold:
                    errors.append(f'{stem} signal bleeds beyond declared tail end {tail_end:.3f}s (RMS {bleed:.6f}, peak {peak:.6f}; peak floor {threshold:.6f})')
            else:
                inspect_start = end + tolerance
                bleed = rms(data, rate, inspect_start, len(data) / rate)
                if bleed > threshold:
                    errors.append(f'{stem} signal bleeds past window end {end}s')
        loudness = measure(paths['mix'])
        if abs(loudness - target) > tol: errors.append(f'LUFS {loudness:.1f} outside target {target:.1f} ± {tol:.1f}')
    except ProfileError as e:
        if raise_errors: raise
        errors.append(str(e)); valid = False
    except InputError as e:
        if raise_errors: raise
        errors.append(str(e)); valid = False
    except (OSError, ValueError, wave.Error, json.JSONDecodeError) as e:
        if raise_errors: raise InputError(str(e)) from e
        errors.append(str(e)); valid = False
    except Exception as e:
        if raise_errors: raise InputError(str(e)) from e
        errors.append(str(e)); valid = False
    return {'valid': valid and not errors, 'errors': errors, 'loudness': loudness, 'not_measured': not_measured, 'evidence': ({'leading_sfx': {'rms': leading_sfx_energy, 'source': leading_sfx_source, **({'declared_no_sfx': True} if no_sfx else {})}} if leading_sfx is not None else {})}


def main(argv=None):
    parser = argparse.ArgumentParser(description='Validate stems and rendered mix against versioned audio profile')
    parser.add_argument('stems_dir_or_manifest'); parser.add_argument('profile')
    args = parser.parse_args(argv)
    try:
        verdict = validate(args.stems_dir_or_manifest, args.profile, raise_errors=True)
        ok, errors, lufs = verdict['valid'], verdict['errors'], verdict['loudness']
    except (ProfileError, InputError, OSError, ValueError, wave.Error, json.JSONDecodeError) as e:
        print(f'FAIL — {e}', file=sys.stderr)
        return 2
    print(('PASS' if ok else 'FAIL') + (f' — integrated LUFS {lufs:.1f}' if lufs is not None else ''))
    for error in errors: print(f'- {error}')
    for name, values in verdict['evidence'].items(): print(f'evidence {name}: {json.dumps(values, sort_keys=True)}')
    for item in verdict['not_measured']: print(f"not_measured {item['check']}: {item['reason']}")
    return 0 if ok else 1


if __name__ == '__main__': sys.exit(main())
