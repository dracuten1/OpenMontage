#!/usr/bin/env python
"""QC audits affordable-housing-20261024 (STEP6): speech_window / asr_roundtrip / audio_batch."""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json
from difflib import SequenceMatcher

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'scripts'))
PROJ = ROOT / 'projects/affordable-housing-20261024'
PUBLIC = ROOT / 'remotion-composer/public/affordable-housing-20261024'
QC = PROJ / 'qc'

import align_audio_words as A
from align_asr_words import fold_digit_token


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    tmp.replace(path)


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def main():
    timing = read(PUBLIC / 'scene_timing.json')
    elements = read(PUBLIC / 'scene_elements.json')['scenes']
    words_pub = read(PUBLIC / 'words.json')
    captions = read(PUBLIC / 'captions.json')
    scene_of = {s['scene_id']: s for s in timing['scenes']}

    rows, overflow = [], []
    for el in elements:
        sid = el['scene']
        sc = scene_of[sid]
        lo, hi = 0.0, sc['duration_seconds']
        if el.get('unmatched'):
            rows.append({'scene': sid, 'id': el['id'], 'unmatched': True, 'pass': False})
            overflow.append({'scene': sid, 'id': el['id'], 'reason': 'unmatched'})
            continue
        s, e = el['start'], el['end']
        ok = (s >= lo - 0.2) and (e <= hi + 0.2)
        row = {'scene': sid, 'id': el['id'], 'start': s, 'end': e, 'scene_window': [lo, hi], 'pass': ok}
        if not ok:
            row['violation'] = ('before_start' if s < lo - 0.2 else 'after_end')
            overflow.append(row)
        rows.append(row)

    for sid, entries in words_pub.items():
        sc = scene_of[sid]
        for i, w in enumerate(entries):
            if w['start'] is None or w['end'] is None or not (sc['start_seconds'] - 0.0001 <= w['start'] <= w['end'] <= sc['end_seconds'] + 0.0001):
                overflow.append({'scene': sid, 'kind': 'global_word', 'index': i, 'word': w})
        for i, c in enumerate(captions[sid]):
            if c.get('unmatched') or not (0 <= c['start'] <= c['end'] <= sc['duration_seconds'] + 0.0001):
                overflow.append({'scene': sid, 'kind': 'caption', 'index': i})
        raw = read(PROJ / 'audio' / f'{sid}_raw_asr.json')
        for i, w in enumerate(raw['words']):
            if not (0 <= w['start'] <= w['end'] <= sc['voice_seconds'] + 0.0001):
                overflow.append({'scene': sid, 'kind': 'raw_asr', 'index': i, 'word': w})

    write(QC / 'speech_window_audit.json', {
        'tolerance_seconds': 0.2, 'elements': rows,
        'overflows': overflow, 'overflow_count': len(overflow), 'pass': len(overflow) == 0,
        'verdict': 'PASS' if not overflow else 'FAIL'})
    sw_pass = not overflow

    lex_src = read(PROJ / 'tts_lexicon.json')
    lex = lex_src.get('affordable-housing-20261024', {})
    folds = []
    for k, v in lex.items():
        if any(ch.isdigit() for ch in k):
            continue
        spoken = [A.norm(t) for t in v.lower().split() if A.norm(t)]
        canon = [A.norm(t) for t in k.lower().split() if A.norm(t)]
        if spoken and spoken != canon:
            folds.append((spoken, canon))
    folds.sort(key=lambda sc: -len(sc[0]))

    def lexicon_fold(tokens):
        out, i = [], 0
        while i < len(tokens):
            for spoken, canon in folds:
                if tokens[i:i + len(spoken)] == spoken:
                    out.extend(canon)
                    i += len(spoken)
                    break
            else:
                out.append(tokens[i])
                i += 1
        return out

    def normalize(text):
        tokens = []
        for token in text.lower().split():
            tokens.extend(fold_digit_token(token))
        normed = [A.norm(t) for t in tokens if A.norm(t)]
        return lexicon_fold(normed)

    rr = {}
    batch = read(PROJ / 'audio/tts_batch_durations.json')
    for sid, spec in batch.items():
        raw = read(PROJ / 'audio' / f'{sid}_raw_asr.json')
        ref, hyp = normalize(spec['provider_text']), normalize(raw['asr_text'])
        n = max(1, len(ref) // 3)
        m = max(1, len(hyp) // 3)
        head = SequenceMatcher(None, ref[:n], hyp[:m], autojunk=False).ratio()
        tail = SequenceMatcher(None, ref[-n:], hyp[-m:], autojunk=False).ratio()
        overall = SequenceMatcher(None, ref, hyp, autojunk=False).ratio()
        rr[sid] = {'head_score': round(head, 4), 'tail_score': round(tail, 4),
                   'ratio': round(overall, 4), 'threshold': 0.45,
                   'provider_tokens': len(ref), 'raw_asr_tokens': len(hyp),
                   'pass': min(head, tail) >= 0.45}
    ar_pass = all(v['pass'] for v in rr.values())
    write(QC / 'asr_roundtrip.json', {'threshold': 0.45, 'scenes': rr, 'pass': ar_pass, 'verdict': 'PASS' if ar_pass else 'FAIL'})

    ab = {}
    for sid in sorted(batch):
        cov = batch[sid].get('coverage', {})
        ab[sid] = {'expected': cov.get('expected', []),
                   'matched': cov.get('matched', []),
                   'missing': cov.get('missing', []),
                   'pass': cov.get('pass', False)}
    ab_pass = all(v['pass'] for v in ab.values())
    write(QC / 'audio_batch.json', {'scenes': ab, 'pass': ab_pass, 'verdict': 'PASS' if ab_pass else 'FAIL'})

    print(json.dumps({
        'speech_window': {'pass': sw_pass, 'overflow': len(overflow)},
        'asr_roundtrip': {'pass': ar_pass},
        'audio_batch': {'pass': ab_pass}}, ensure_ascii=False))


if __name__ == '__main__':
    main()
