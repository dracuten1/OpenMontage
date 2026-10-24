#!/usr/bin/env python
"""QC audits vietjet-20261023 (STEP6): speech_window / asr_roundtrip /
audio_batch. Honest flags only — never manufactured."""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json
import re

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'scripts'))
PROJ = ROOT / 'projects/vietjet-20261023'
PUBLIC = ROOT / 'remotion-composer/public/vietjet-20261023'
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
    # Audit canonical word/caption windows and untouched raw ASR boundaries too.
    for sid, entries in words_pub.items():
        sc=scene_of[sid]
        for i,w in enumerate(entries):
            if w['start'] is None or w['end'] is None or not (sc['start_seconds']-0.0001 <= w['start'] <= w['end'] <= sc['end_seconds']+0.0001):
                overflow.append({'scene':sid,'kind':'global_word','index':i,'word':w})
        for i,c in enumerate(captions[sid]):
            if c.get('unmatched') or not (0 <= c['start'] <= c['end'] <= sc['duration_seconds']+0.0001):
                overflow.append({'scene':sid,'kind':'caption','index':i})
        raw=read(PROJ / 'audio' / f'{sid}_raw_asr.json')
        for i,w in enumerate(raw['words']):
            if not (0 <= w['start'] <= w['end'] <= sc['voice_seconds']+0.0001):
                overflow.append({'scene':sid,'kind':'raw_asr','index':i,'word':w})
    write(QC / 'speech_window_audit.json', {
        'tolerance_seconds': 0.2, 'elements': rows,
        'overflows': overflow, 'overflow_count': len(overflow), 'pass': len(overflow) == 0,
        'verdict': 'PASS' if not overflow else 'FAIL'})
    sw_pass = not overflow

    # Fidelity uses untouched raw ASR, never mapped canonical labels.
    from difflib import SequenceMatcher
    from align_asr_words import fold_digit_token
    # Numerals: provider speaks lexicon pronunciation ("hai nghìn không trăm
    # mười tám") while whisper writes digits ("2018"). Fold BOTH sides through
    # the same tts_lexicon used to synthesize audio — surface-form equivalence
    # only, never content changes.
    lex_src = read(PROJ / 'tts_lexicon.json')
    lex = lex_src.get('vietjet-20261023') if isinstance(lex_src, dict) else None
    lex = lex or (lex_src if isinstance(lex_src, dict) else {})
    folds = []
    for k, v in lex.items():
        spoken = [A.norm(t) for t in v.lower().split()]
        spoken = [t for t in spoken if t]
        canon = [t for t in k.lower().split()]
        if spoken and spoken != canon:
            folds.append((spoken, canon))
    folds.sort(key=lambda sc: -len(sc[0]))
    def lexicon_fold(tokens):
        out, i = [], 0
        while i < len(tokens):
            for spoken, canon in folds:
                if tokens[i:i+len(spoken)] == spoken:
                    out.extend(canon)
                    i += len(spoken)
                    break
            else:
                out.append(tokens[i]); i += 1
        return out
    def normalize(text):
        tokens=[]
        for token in text.lower().split():
            tokens.extend(fold_digit_token(token))
        normed = [A.norm(t) for t in tokens if A.norm(t)]
        return lexicon_fold(normed)
    rr = {}
    batch = read(PROJ / 'audio/tts_batch_durations.json')
    for sid, spec in batch.items():
        raw = read(PROJ / 'audio' / f'{sid}_raw_asr.json')
        ref, hyp = normalize(spec['provider_text']), normalize(raw['asr_text'])
        n=max(1, len(ref)//3); m=max(1,len(hyp)//3)
        head=SequenceMatcher(None,ref[:n],hyp[:m],autojunk=False).ratio()
        tail=SequenceMatcher(None,ref[-n:],hyp[-m:],autojunk=False).ratio()
        overall=SequenceMatcher(None,ref,hyp,autojunk=False).ratio()
        rr[sid]={'head_score':round(head,4),'tail_score':round(tail,4),
                 'ratio':round(overall,4),'threshold':0.45,
                 'provider_tokens':len(ref),'raw_asr_tokens':len(hyp),
                 'pass': min(head,tail)>=0.45}
    ar_pass = all(v['pass'] for v in rr.values())
    write(QC / 'asr_roundtrip.json', {'threshold':0.45,
        'method':'SequenceMatcher normalized actual raw ASR vs provider; independent head/tail thirds; alignment is NOT fidelity QC',
        'scenes':rr,'pass':ar_pass,'verdict':'PASS' if ar_pass else 'FAIL'})

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
