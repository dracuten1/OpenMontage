#!/usr/bin/env python
"""STEP3 affordable-housing-20261024: OFFLINE faster_whisper ASR + canonical->ASR word mapping."""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json
import math
import os
import subprocess

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'scripts'))
PROJ = ROOT / 'projects/affordable-housing-20261024'
AUD = PROJ / 'assets/audio'
AUDIO_META_DIR = PROJ / 'audio'
PUBLIC = ROOT / 'remotion-composer/public/affordable-housing-20261024'

import align_audio_words as A
import tts_batch as TB

SCENES = TB.SCENES
SID_SECTION = TB.SID_SECTION
ORDER = [f's{i:02d}' for i in range(1, 9)]


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    tmp.replace(path)


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def ffprobe_s(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                        'format=duration', '-of',
                        'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


UNITS = {0: 'khong', 1: 'mot', 2: 'hai', 3: 'ba', 4: 'bon', 5: 'nam',
         6: 'sau', 7: 'bay', 8: 'tam', 9: 'chin'}


def vi_number(n):
    if n < 10: return [UNITS[n]]
    if n < 20: return ['muoi'] + ([] if n == 10 else ['lam' if n == 15 else UNITS[n % 10]])
    if n < 100: return [UNITS[n // 10], 'muoi'] + ([] if n % 10 == 0 else ['lam' if n % 10 == 5 else UNITS[n % 10]])
    if n < 1000:
        r = n % 100
        return [UNITS[n // 100], 'tram'] + ([] if r == 0 else (['le'] + vi_number(r) if r < 10 else vi_number(r)))
    for scale, label in [(1000000000, 'ty'), (1000000, 'trieu'), (1000, 'nghin')]:
        if n >= scale:
            return vi_number(n // scale) + [label] + (vi_number(n % scale) if n % scale else [])
    return [str(n)]


def fold_digit_token(token):
    token = token.strip('.,;:!?')
    if '/' in token:
        parts = token.split('/')
        if len(parts) == 2 and all(x.isdigit() for x in parts):
            return vi_number(int(parts[0])) + ['thang'] + vi_number(int(parts[1]))
    token = token.replace('.', '')
    if token.isdigit(): return vi_number(int(token))
    return [A.norm(token)]


def asr_token_variants(tok_norm):
    return fold_digit_token(tok_norm)


def raw_asr(model, path):
    segments, info = model.transcribe(str(path), language='vi',
                                      word_timestamps=True, vad_filter=False,
                                      condition_on_previous_text=True)
    segs, words = [], []
    for i, seg in enumerate(segments):
        segs.append({'id': seg.id, 'start': round(seg.start, 3),
                     'end': round(seg.end, 3), 'text': seg.text.strip()})
        for w in (seg.words or []):
            if A.norm(w.word):
                words.append({'word': w.word.strip(), 'start': float(w.start),
                              'end': float(w.end), 'probability': float(w.probability),
                              'segment_index': i})
    return segs, words, info


def map_canonical_to_asr(provider, raw_words, expansions):
    flat, owners = [], []
    for i, w in enumerate(raw_words):
        for tok in asr_token_variants(w['word'].lower()):
            flat.append(tok)
            owners.append(i)
    spans = [None] * len(provider)
    exact = [False] * len(provider)
    from difflib import SequenceMatcher
    matcher = SequenceMatcher(None, list(map(A.norm, provider)), flat, autojunk=False)
    edits = []
    for tag, a, b, c, d in matcher.get_opcodes():
        if tag == 'equal' or (tag == 'replace' and b - a == d - c):
            for j in range(b - a):
                spans[a + j] = (owners[c + j], owners[c + j] + 1)
                exact[a + j] = tag == 'equal'
        elif b > a and d > c:
            total = d - c
            if total < b - a:
                whole = (owners[c], owners[d - 1] + 1)
                for j in range(a, b):
                    spans[j] = whole
            else:
                per = total // (b - a)
                rem = total % (b - a)
                ci = c
                for j in range(a, b):
                    take = per + (1 if j - a < rem else 0)
                    seg_end = d if j == b - 1 else ci + take
                    spans[j] = (owners[ci], owners[seg_end - 1] + 1)
                    ci = seg_end
        if tag != 'equal':
            edits.append({'operation': tag, 'provider_range': [a, b],
                          'asr_flat_range': [c, d],
                          'provider_text': ' '.join(provider[a:b]),
                          'asr_text': ' '.join(flat[c:d])})
    for i, sp in enumerate(spans):
        if sp is not None:
            continue
        left = next((spans[j][1] for j in range(i - 1, -1, -1) if spans[j] is not None), 0)
        right = next((spans[j][0] for j in range(i + 1, len(spans)) if spans[j] is not None), len(raw_words))
        left = min(max(0, left), len(raw_words) - 1)
        spans[i] = (left, min(len(raw_words), max(left + 1, right)))
        edits.append({'operation': 'unmatched_gap_fill',
                      'provider_index': i, 'provider_text': provider[i],
                      'note': 'bounded by neighbouring matched ASR tokens'})
    return spans, exact, edits


def main():
    os.environ.update(HF_HUB_DISABLE_TELEMETRY='1')
    from faster_whisper import WhisperModel
    model = WhisperModel('base', device='cpu', compute_type='int8', local_files_only=False, cpu_threads=6)

    batch = read(AUDIO_META_DIR / 'tts_batch_durations.json')

    summary = {}
    for sid in ORDER:
        spec = batch[sid]
        voice = AUD / f'voice_{sid}.wav'
        duration = ffprobe_s(voice)
        assert abs(duration - spec['voice_seconds']) < 0.05

        canonical_text = spec['canonical_text']
        provider_text = spec['provider_text']
        canonical = A.lexical_words(canonical_text)
        provider = A.lexical_words(provider_text)

        cache = AUDIO_META_DIR / f'{sid}_raw_asr.json'
        if cache.exists():
            cached = read(cache)
            assert abs(cached['duration_seconds'] - duration) < 0.05
            segs, raw_words = cached['segments'], cached['words']
            language = cached['detected_language']
        else:
            segs, raw_words, info = raw_asr(model, voice)
            language = info.language
        asr_text = ' '.join(s['text'] for s in segs).strip()
        if not cache.exists():
            write(cache, {
                'section_id': sid, 'scene_id': sid, 'model_size': 'small',
                'device': 'cpu', 'compute_type': 'int8', 'language': 'vi',
                'vad_filter': False, 'local_files_only': True, 'offline': True,
                'audio': str(voice), 'duration_seconds': duration,
                'detected_language': language, 'asr_text': asr_text,
                'segments': segs,
                'words': [{'word': w['word'], 'start': round(w['start'], 5),
                           'end': round(w['end'], 5),
                           'probability': round(w['probability'], 4)}
                          for w in raw_words]})

        mapping = [tuple(x) for x in spec['provider_mapping']]
        expansions = {}
        for word, (a, b) in zip(canonical, mapping):
            if b - a > 1:
                expansions[A.norm(word)] = list(map(A.norm, provider[a:b]))

        spans, exact, edits = map_canonical_to_asr(provider, raw_words, expansions)

        words = []
        for i, (label, (lo, hi)) in enumerate(zip(canonical, mapping)):
            idx = sorted({k for sp in spans[lo:hi] for k in range(*sp)})
            if not idx:
                words.append({'word': label, 'start': None, 'end': None,
                              'matched': False, 'note': 'no asr span'})
                continue
            first, last = min(idx), max(idx)
            words.append({'word': label,
                          'start': round(float(raw_words[first]['start']), 5),
                          'end': round(float(raw_words[last]['end']), 5),
                          'provider_range': [lo, hi],
                          'raw_word_range': [first, last + 1],
                          'raw_asr_support': ('exact' if all(exact[lo:hi]) else 'substitution_or_unmatched'),
                          'spoken_text': ' '.join(provider[lo:hi]),
                          'canonical_index': i})
        for w in words:
            if w['start'] is None:
                continue
            w['start'] = max(0.0, w['start'])
            w['end'] = min(duration, w['end'])

        write(AUDIO_META_DIR / f'{sid}_words.json', {
            'section_id': sid, 'scene_id': sid, 'language': 'vi',
            'audio': str(voice), 'audio_duration_seconds': duration,
            'canonical_text': canonical_text, 'provider_text': provider_text,
            'word_count': len(words),
            'method': 'asr_word_span_mapping_small_offline',
            'global_proportional_interpolation': False,
            'mapping_edits': edits, 'words': words,
            'asr_text': asr_text})

        matched = sum(1 for w in words if w['start'] is not None)
        exact_n = sum(1 for w in words if w.get('raw_asr_support') == 'exact')
        summary[sid] = {'duration_seconds': duration,
                        'canonical_words': len(canonical),
                        'provider_words': len(provider),
                        'asr_words': len(raw_words), 'mapped': matched,
                        'exact': exact_n,
                        'speech_span': ([words[0]['start'], words[-1]['end']] if matched == len(words) else None)}
        print(json.dumps({'scene': sid, **summary[sid]}, ensure_ascii=False), flush=True)

    words_public = {}
    narration_meta = {}
    cursor = 0.0
    for sid in ORDER:
        spec = batch[sid]
        wdoc = read(AUDIO_META_DIR / f'{sid}_words.json')
        off = cursor
        entries = []
        for w in wdoc['words']:
            if w['start'] is None:
                entries.append({'word': w['word'], 'start': None, 'end': None, 'unmatched': True})
                continue
            entries.append({'word': w['word'],
                            'start': round(off + w['start'], 5),
                            'end': round(off + w['end'], 5)})
        words_public[sid] = entries
        narration_meta[sid] = {
            'section_id': SID_SECTION[sid], 'scene_id': sid,
            'canonical_text': spec['canonical_text'],
            'provider_text': spec['provider_text'],
            'voice_seconds': spec['voice_seconds'],
            'audio_file': f'voice_{sid}.wav'}
        cursor += math.ceil((spec['voice_seconds'] + 0.8) * 30) / 30
    write(PUBLIC / 'words.json', words_public)
    write(PUBLIC / 'narration_meta.json', narration_meta)
    import shutil
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for sid in ORDER:
        shutil.copy2(AUD / f'voice_{sid}.wav', PUBLIC / f'voice_{sid}.wav')

    print('ASR_ALIGN_RESULT ' + json.dumps(
        {'ok': all(v['mapped'] == v['canonical_words'] for v in summary.values()),
         'scenes': summary}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
