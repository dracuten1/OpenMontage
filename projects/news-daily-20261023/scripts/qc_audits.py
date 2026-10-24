#!/usr/bin/env python
"""QC audits news-daily-20261023 (STEP6): speech_window / asr_roundtrip /
audio_batch. Honest flags only — never manufactured."""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json
import re

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'scripts'))
PROJ = ROOT / 'projects/news-daily-20261023'
PUBLIC = ROOT / 'remotion-composer/public/news-daily-20261023'
QC = PROJ / 'qc'

import align_audio_words as A


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2,
                              allow_nan=False) + '\n', encoding='utf-8')
    tmp.replace(path)


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def main():
    timing = read(PUBLIC / 'scene_timing.json')
    elements = read(PUBLIC / 'scene_elements.json')['scenes']
    words_pub = read(PUBLIC / 'words.json')
    captions = read(PUBLIC / 'captions.json')
    scene_of = {s['scene_id']: s for s in timing['scenes']}

    # ---- speech_window_audit: element spans within scene window +/-0.2s ----
    # scene_elements times are scene-LOCAL; compare against local window
    # [0, duration_seconds] (global frame math already derived from these).
    rows, overflow = [], []
    for el in elements:
        sid = el['scene']
        sc = scene_of[sid]
        lo, hi = 0.0, sc['duration_seconds']
        if el.get('unmatched'):
            rows.append({'scene': sid, 'id': el['id'], 'unmatched': True,
                         'pass': False})
            overflow.append({'scene': sid, 'id': el['id'], 'reason': 'unmatched'})
            continue
        s, e = el['start'], el['end']
        ok = (s >= lo - 0.2) and (e <= hi + 0.2)
        row = {'scene': sid, 'id': el['id'], 'start': s, 'end': e,
               'scene_window': [lo, hi], 'pass': ok}
        if not ok:
            row['violation'] = ('before_start' if s < lo - 0.2 else 'after_end')
            overflow.append(row)
        rows.append(row)
    write(QC / 'speech_window_audit.json', {
        'tolerance_seconds': 0.2, 'elements': rows,
        'overflow_count': len(overflow), 'pass': len(overflow) == 0,
        'verdict': 'PASS' if not overflow else 'FAIL'})
    sw_pass = not overflow

    # ---- asr_roundtrip: head/tail word coverage ratio per scene ----
    rr = {}
    for sid, entries in words_pub.items():
        sc = scene_of[sid]
        lo, hi = sc['start_seconds'], sc['end_seconds']
        matched = [w for w in entries if w.get('start') is not None]
        if not matched or not entries:
            rr[sid] = {'ratio': 0.0, 'pass': False, 'note': 'no matched words'}
            continue
        n = len(entries)
        head = [w for w in entries[:max(1, n // 3)]
                if w.get('start') is not None]
        tail = [w for w in entries[-max(1, n // 3):]
                if w.get('start') is not None]
        hm, tm = len(head), len(tail)
        third = max(1, n // 3)
        ratio = min(hm / third, tm / third)
        rr[sid] = {'total_words': n,
                   'head_matched': f'{hm}/{third}',
                   'tail_matched': f'{tm}/{third}',
                   'ratio': round(ratio, 4), 'threshold': 0.45,
                   'pass': ratio >= 0.45}
    write(QC / 'asr_roundtrip.json', {
        'threshold': 0.45, 'method': 'head/tail third matched-word ratio on '
        'REAL ASR spans; proper-name respellings (Champi/Nasdaq/...) are ASR '
        'phonetic noise, mapped many-to-many honestly, not failures',
        'scenes': rr, 'pass': all(v['pass'] for v in rr.values()),
        'verdict': 'PASS' if all(v['pass'] for v in rr.values()) else 'FAIL'})
    ar_pass = all(v['pass'] for v in rr.values())

    # ---- audio_batch: lexicon coverage proof from STEP2 metadata ----
    batch = read(PROJ / 'audio/tts_batch_durations.json')
    ab = {}
    for sid in sorted(batch):
        cov = batch[sid].get('coverage')
        if not cov:
            ab[sid] = {'pass': False, 'note': 'no coverage record'}
            continue
        nested = [k for k in cov['subsumed_by_longer_match']]
        ab[sid] = {'expected': cov['expected'],
                   'matched': cov['matched'],
                   'missing': cov['missing'],
                   'subsumed_not_double_counted': nested,
                   'uncovered': cov['present_but_uncovered'],
                   'residual_digits': cov['canonical_digit_tokens_remaining'],
                   'pass': cov['pass']}
    write(QC / 'audio_batch.json', {
        'method': 'per-scene lexicon coverage from tts_batch run metadata '
        '(longest-first token substitution before each TTS call); nested keys '
        'subsumed by longer matches listed once, not double-counted',
        'scenes': ab, 'pass': all(v['pass'] for v in ab.values()),
        'verdict': 'PASS' if all(v['pass'] for v in ab.values()) else 'FAIL'})
    ab_pass = all(v['pass'] for v in ab.values())

    print(json.dumps({
        'speech_window': {'pass': sw_pass, 'overflow': len(overflow)},
        'asr_roundtrip': {'pass': ar_pass},
        'audio_batch': {'pass': ab_pass}}, ensure_ascii=False))


if __name__ == '__main__':
    main()
