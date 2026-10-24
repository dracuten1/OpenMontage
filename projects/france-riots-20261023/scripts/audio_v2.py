#!/usr/bin/env python
"""AUDIO V2 france-riots-20261023: 21 sections, vieneu Turbo + atempo 1.15,
ASR round-trip, per-section outputs into remotion-composer/public/france-riots-20261023/v2/.

Reuses proven v1 logic (scripts/tts_batch.py + scripts/align_asr_words.py),
extended to S1..S21 and per-section timing/words/captions files.

Usage: .venv/bin/python scripts/audio_v2.py tts|asr|qc|all
"""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json
import math
import os
import re
import subprocess
import time
from difflib import SequenceMatcher

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'scripts'))
PROJ = ROOT / 'projects/france-riots-20261023'
AUD = PROJ / 'audio' / 'v2'          # raw + meta (project side)
OUT = ROOT / 'remotion-composer/public/france-riots-20261023/v2'

import align_audio_words as A

SCRIPT = json.loads((PROJ / 'artifacts/script.json').read_text(encoding='utf-8'))
SECTIONS = SCRIPT['sections']                          # S1..S21, text = display
SID_SECTION = {f's{i:02d}': f'S{i}' for i in range(1, 22)}
SCENES = {sid: next(x['text'] for x in SECTIONS if x['id'] == sec)
          for sid, sec in SID_SECTION.items()}
ORDER = sorted(SCENES)
LEX_ALL = json.loads((PROJ / 'tts_lexicon.json').read_text(encoding='utf-8'))
LEX = LEX_ALL['france-riots-20261023']
EXPECTED = {sid: [k for k in sorted(LEX, key=len, reverse=True)
                  if re.search(r'(?<!\w)' + re.escape(k) + r'(?!\w)', text)]
            for sid, text in SCENES.items()}

ATEMPO = 1.15
META_PATH = AUD / 'tts_batch_durations_v2.json'

PUNCT_SUFFIX = re.compile(r'([.,;:!?…]+)$')


def split_punct(tok):
    m = PUNCT_SUFFIX.search(tok)
    if not m:
        return tok, ''
    return tok[:m.start()], m.group(1)


# ------------------------------------------------------------- provider text
def to_provider(canonical, lex):
    canon = A.lexical_words(canonical)
    keys = sorted(lex, key=len, reverse=True)
    key_tokens = {k: [A.norm(t) for t in A.lexical_words(k)] for k in keys}
    prov, mapping, matched, spans = [], [], [], []
    i = 0
    while i < len(canon):
        hit = None
        for k in keys:
            kt = key_tokens[k]
            n = len(kt)
            if i + n <= len(canon) and [A.norm(canon[i + t]) for t in range(n)] == kt:
                hit = (k, n)
                break
        if hit:
            k, n = hit
            repl = A.lexical_words(lex[k])
            _, punct = split_punct(canon[i + n - 1])
            if punct:
                repl = repl[:-1] + [repl[-1] + punct]
            lo = len(prov)
            prov.extend(repl)
            for _ in range(n):
                mapping.append((lo, len(prov)))
            matched.append(k)
            spans.append((i, i + n))
            i += n
        else:
            prov.append(canon[i])
            mapping.append((len(prov) - 1, len(prov)))
            spans.append((i, i + 1))
            i += 1
    return canon, prov, mapping, matched, spans


def find_lex_span(lex_tokens, key_norm_tokens, start=0):
    n = len(key_norm_tokens)
    if n == 0:
        return None
    i = start
    while i + n <= len(lex_tokens):
        if lex_tokens[i:i + n] == key_norm_tokens:
            return (i, i + n)
        i += 1
    return None


def coverage_proof(sid, canonical, matched, lex_spans, lex):
    lex_all = A.lexical_words(canonical)
    lex_norm = [A.norm(t) for t in lex_all]
    key_norm = {k: [A.norm(t) for t in A.lexical_words(k)] for k in lex}
    subsumed, illegal = [], []
    for k in lex:
        if k in matched or k not in canonical:
            continue
        # raw-substring of a longer matched key (2018 ⊂ 'áo vàng 2018-19')
        if any(k != mk and k in mk for mk in matched):
            subsumed.append(k)
            continue
        ks = find_lex_span(lex_norm, key_norm[k])
        covered = ks is not None and any(a <= ks[0] and ks[1] <= b
                                         for a, b in lex_spans)
        (subsumed if covered else illegal).append(k)
    # a lexeme that is a whole-substring of an already matched longer key
    # (e.g. '2018' inside matched '2018-19') is covered by that key's span
    matched_toksets = {tuple(key_norm[k]) for k in matched}
    still_illegal = []
    for k in illegal:
        kt = tuple(key_norm[k])
        token_sub = any(
            len(m) > len(kt) and any(m[i:i + len(kt)] == kt
                                     for i in range(len(m) - len(kt) + 1))
            for m in matched_toksets)
        # char-level: single-token key whose text is contained in one token of
        # a matched longer key ('2018' inside '201819')
        char_sub = any(
            len(m) == 1 and len(kt) == 1 and kt[0] in m[0]
            for m in matched_toksets)
        if token_sub or char_sub:
            subsumed.append(k)
        else:
            still_illegal.append(k)
    illegal = still_illegal
    residual_digits = [tok for i, tok in enumerate(lex_all)
                       if A.norm(tok.rstrip('.,;:!?%')).isdigit()
                       and not any(a <= i < b for a, b in lex_spans)]
    missing = [k for k in EXPECTED[sid] if k not in matched and k not in subsumed
               # expected-via-raw-substring of a longer matched key (2018 ⊂ 2018-19)
               and not any(k != mk and k in mk for mk in matched)]
    ok = not missing and not illegal and not residual_digits
    return {'expected': EXPECTED[sid], 'matched': sorted(matched),
            'missing': missing, 'subsumed_by_longer_match': sorted(subsumed),
            'present_but_uncovered': illegal,
            'canonical_digit_tokens_remaining': residual_digits, 'pass': ok}


# --------------------------------------------------------------- file utils
def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2,
                              allow_nan=False) + '\n', encoding='utf-8')
    tmp.replace(path)


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def probe_s(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                        'format=duration', '-of',
                        'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def peak_dbfs(p):
    r = subprocess.run(['ffmpeg', '-i', str(p), '-af', 'volumedetect',
                        '-f', 'null', '-'], capture_output=True, text=True)
    m = re.search(r'max_volume:\s*(-?[\d.]+) dB', r.stderr)
    return float(m.group(1)) if m else None


def valid(p, min_s=1.0):
    if not p.exists() or p.stat().st_size < 2000:
        return False
    try:
        return probe_s(p) > min_s
    except Exception:
        return False


# ------------------------------------------------------------------ STEP tts
def step_tts():
    meta = read(META_PATH) if META_PATH.exists() else {}
    from tools.tool_registry import registry
    registry.discover()
    tool = registry._tools['vieneu_tts']
    failures = []
    for sid in ORDER:
        canonical = SCENES[sid]
        canon, prov, mapping, matched, lex_spans = to_provider(canonical, LEX)
        provider_text = ' '.join(prov)
        assert not re.search(r'\d', provider_text), \
            f'{sid}: residual digits: {provider_text}'
        cov = coverage_proof(sid, canonical, matched, lex_spans, LEX)
        if not cov['pass']:
            failures.append({'scene': sid, 'error': f'lexicon coverage: {cov}'})
            print(json.dumps({'scene': sid, 'error': 'coverage', 'detail': cov},
                             ensure_ascii=False), flush=True)
            continue
        raw, out = AUD / f'{sid}_raw.wav', OUT / f'voice_{sid}.wav'
        if valid(out):
            entry = meta.get(sid, {})
            entry.setdefault('provider_text', provider_text)
            entry.setdefault('provider_mapping', [[a, b] for a, b in mapping])
            entry.setdefault('coverage', cov)
            meta[sid] = entry
            write(META_PATH, meta)
            print(json.dumps({'scene': sid, 'skip': 'exists',
                              'voice_seconds': entry.get('voice_seconds')}),
                  flush=True)
            continue
        ok = valid(raw)
        entry = {}
        for attempt in (() if ok else (1, 2)):
            t0 = time.time()
            result = tool.execute({'text': provider_text, 'voice': None,
                                   'output_path': str(raw)})
            entry = {'tool': 'vieneu_tts', 'provider': 'vieneu (v3 Turbo 48kHz)',
                     'requested_voice': None, 'success': result.success,
                     'data': result.data, 'error': result.error,
                     'wall_seconds': round(time.time() - t0, 1),
                     'attempt': attempt or 1, 'cost_usd': 0}
            if result.success and valid(raw):
                ok = True
                break
            print(json.dumps({'scene': sid, 'attempt': attempt or 1,
                              'tts_success': result.success,
                              'error': result.error}, ensure_ascii=False),
                  flush=True)
        if not ok:
            failures.append({'scene': sid, 'error': str(entry.get('error'))})
            meta[sid] = entry
            write(META_PATH, meta)
            continue
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error',
                        '-n', '-i', str(raw), '-af', f'atempo={ATEMPO}',
                        '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le',
                        str(out)], check=True)
        entry.update(section_id=SID_SECTION[sid], scene_id=sid,
                     canonical_text=canonical, provider_text=provider_text,
                     lexicon_replaces_applied=sorted(matched), coverage=cov,
                     provider_mapping=[[a, b] for a, b in mapping],
                     processing={'filter': f'atempo={ATEMPO}',
                                 'applications': 1},
                     raw_seconds=probe_s(raw), voice_seconds=probe_s(out))
        meta[sid] = entry
        write(META_PATH, meta)
        print(json.dumps({'scene': sid, 'raw_s': entry['raw_seconds'],
                          'voice_s': entry['voice_seconds'],
                          'lexicon': sorted(matched)}), flush=True)
    print('TTS_V2_RESULT ' + json.dumps(
        {'ok': not failures, 'failed': failures,
         'scenes': sorted(k for k, v in meta.items() if v.get('voice_seconds'))},
        ensure_ascii=False), flush=True)
    return not failures


# ------------------------------------------------------------- ASR + mapping
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


def map_provider_to_asr(provider, raw_words):
    flat, owners = [], []
    for i, w in enumerate(raw_words):
        for tok in asr_token_variants(w['word'].lower()):
            flat.append(tok)
            owners.append(i)
    spans = [None] * len(provider)
    exact = [False] * len(provider)
    matcher = SequenceMatcher(None, list(map(A.norm, provider)), flat,
                              autojunk=False)
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
        left = next((spans[j][1] for j in range(i - 1, -1, -1)
                     if spans[j] is not None), 0)
        right = next((spans[j][0] for j in range(i + 1, len(spans))
                      if spans[j] is not None), len(raw_words))
        left = min(max(0, left), len(raw_words) - 1)
        spans[i] = (left, min(len(raw_words), max(left + 1, right)))
        edits.append({'operation': 'unmatched_gap_fill',
                      'provider_index': i, 'provider_text': provider[i],
                      'note': 'bounded by neighbouring matched ASR tokens'})
    return spans, exact, edits


SENT_END = re.compile(r'[.!?…]$')


def chunk_sentences(canonical):
    chunks, cur = [], []
    for i, tok in enumerate(canonical):
        cur.append(i)
        if SENT_END.search(tok):
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    return chunks


# ------------------------------------------------------------------ STEP asr
def step_asr():
    os.environ.update(HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1',
                      HF_HUB_DISABLE_TELEMETRY='1')
    from faster_whisper import WhisperModel
    model = WhisperModel('small', device='cpu', compute_type='int8',
                         local_files_only=True, cpu_threads=6)
    meta = read(META_PATH)
    summary = {}
    drift = {}
    for sid in ORDER:
        spec = meta[sid]
        voice = OUT / f'voice_{sid}.wav'
        duration = probe_s(voice)
        assert abs(duration - spec['voice_seconds']) < 0.05, \
            f'{sid}: ffprobe {duration} != manifest {spec["voice_seconds"]}'
        canonical_text, provider_text = spec['canonical_text'], spec['provider_text']
        canonical = A.lexical_words(canonical_text)
        provider = A.lexical_words(provider_text)
        mapping = [tuple(x) for x in spec['provider_mapping']]

        cache = AUD / f'{sid}_raw_asr.json'
        segs, raw_words, asr_text = None, None, None
        if cache.exists() and read(cache).get('duration_seconds') == duration:
            cached = read(cache)
            segs, raw_words, asr_text = (cached['segments'], cached['words'],
                                         cached['asr_text'])
        else:
            segs, raw_words, info = raw_asr(model, voice)
            asr_text = ' '.join(s['text'] for s in segs).strip()
            write(cache, {'section_id': sid, 'scene_id': sid,
                          'model_size': 'small', 'device': 'cpu',
                          'compute_type': 'int8', 'language': 'vi',
                          'audio': str(voice), 'duration_seconds': duration,
                          'asr_text': asr_text, 'segments': segs,
                          'words': [{'word': w['word'],
                                     'start': round(w['start'], 5),
                                     'end': round(w['end'], 5),
                                     'probability': round(w['probability'], 4)}
                                    for w in raw_words]})

        spans, exact, edits = map_provider_to_asr(provider, raw_words)

        words, mono_fixes = [], 0
        prev_start, prev_end = 0.0, 0.0
        for i, (label, (lo, hi)) in enumerate(zip(canonical, mapping)):
            idx = sorted({k for sp in spans[lo:hi] for k in range(*sp)})
            if not idx:
                words.append({'word': label, 'start': None, 'end': None,
                              'matched': False, 'note': 'no asr span'})
                continue
            first, last = min(idx), max(idx)
            s = max(0.0, float(raw_words[first]['start']))
            e = min(duration, float(raw_words[last]['end']))
            if s < prev_start:
                s, mono_fixes = prev_start, mono_fixes + 1
            if e < s:
                e, mono_fixes = s, mono_fixes + 1
            words.append({'word': label, 'start': round(s, 5), 'end': round(e, 5),
                          'spoken_text': ' '.join(provider[lo:hi]),
                          'raw_asr_support': ('exact' if all(exact[lo:hi])
                                              else 'substitution_or_unmatched')})
            prev_start, prev_end = s, max(e, prev_end)
        # trailing None-guard: unmatched keep None (flagged as drift)

        # captions from display text
        caps = []
        for chunk in chunk_sentences(canonical):
            ws = [words[i] for i in chunk if words[i].get('start') is not None]
            caps.append({'chunk_text': ' '.join(canonical[i] for i in chunk),
                         'anchor_start_word': chunk[0],
                         'anchor_end_word': chunk[-1],
                         'start': round(ws[0]['start'], 5) if ws else None,
                         'end': round(ws[-1]['end'], 5) if ws else None})

        write(OUT / f'timing_{sid}.json', {
            'section_id': SID_SECTION[sid], 'scene_id': sid,
            'audio_file': f'voice_{sid}.wav', 'duration': duration,
            'duration_seconds': duration, 'word_count': len(words),
            'mono_fixes': mono_fixes,
            'words': [{'word': w['word'], 'start': w['start'], 'end': w['end']}
                      for w in words]})
        write(OUT / f'words_{sid}.json', {
            'section_id': SID_SECTION[sid], 'scene_id': sid, 'language': 'vi',
            'audio': str(voice), 'audio_duration_seconds': duration,
            'canonical_text': canonical_text, 'provider_text': provider_text,
            'word_count': len(words),
            'method': 'asr_word_span_mapping_small_offline_v2',
            'mapping_edits': edits, 'words': words, 'asr_text': asr_text})
        write(OUT / f'captions_{sid}.json', {
            'section_id': SID_SECTION[sid], 'scene_id': sid,
            'canonical_text': canonical_text, 'chunks': caps})

        # drift candidates: non-exact provider edits + repeated ASR words
        rep = [f'{raw_words[i]["word"]}|{raw_words[i+1]["word"]}'
               for i in range(len(raw_words) - 1)
               if A.norm(raw_words[i]['word']) == A.norm(raw_words[i + 1]['word'])
               and A.norm(raw_words[i]['word'])]
        sub_edits = [e for e in edits if e['operation'] in ('replace', 'delete')]
        unmatched = [w['word'] for w in words if w.get('start') is None]
        nonexact_words = [w['word'] for w in words
                          if w.get('raw_asr_support') != 'exact' and w.get('start') is not None]
        drift[sid] = {'asr_substitution_edits': sub_edits,
                      'repeated_asr_pairs': rep, 'unmatched_words': unmatched,
                      'nonexact_words': nonexact_words[:15]}
        matched = sum(1 for w in words if w.get('start') is not None)
        summary[sid] = {'duration': duration, 'words': len(canonical),
                        'mapped': matched, 'mono_fixes': mono_fixes,
                        'exact': sum(1 for w in words
                                     if w.get('raw_asr_support') == 'exact')}
        print(json.dumps({'scene': sid, **summary[sid]}), flush=True)

    write(AUD / 'drift_candidates_v2.json', drift)
    write(OUT / 'provider_texts.json',
          {SID_SECTION[sid]: meta[sid]['provider_text'] for sid in ORDER})
    ok = all(v['mapped'] == v['words'] for v in summary.values())
    print('ASR_V2_RESULT ' + json.dumps({'ok': ok, 'scenes': summary},
                                        ensure_ascii=False), flush=True)
    return ok, summary, drift


# ------------------------------------------------------------------- STEP qc
def step_qc():
    meta = read(META_PATH)
    rows, fail = [], []
    total = 0.0
    for sid in ORDER:
        voice = OUT / f'voice_{sid}.wav'
        row = {'section': SID_SECTION[sid], 'scene': sid}
        if not voice.exists():
            row['error'] = 'missing wav'
            fail.append(row)
            continue
        dur = probe_s(voice)
        pk = peak_dbfs(voice)
        row['seconds'] = round(dur, 2)
        row['peak_dbfs'] = pk
        row['pass_peak'] = pk is not None and pk <= -1.0
        row['pass_dur'] = dur >= 0.5
        t = read(OUT / f'timing_{sid}.json')
        ws = t['words']
        mono = all(ws[i]['start'] is not None or True for i in range(len(ws)))
        bounds = all((w['start'] is None or (0 <= w['start'] <= t['duration']
                     and 0 <= w['end'] <= t['duration'])) for w in ws)
        seq = [w['start'] for w in ws if w['start'] is not None]
        mono = all(seq[i] <= seq[i + 1] + 1e-9 for i in range(len(seq) - 1))
        row['words'] = len(ws)
        row['pass_mono'] = mono
        row['pass_bounds'] = bounds
        caps = read(OUT / f'captions_{sid}.json')
        canon = ' '.join(A.lexical_words(meta[sid]['canonical_text']))
        cap_join = ' '.join(c['chunk_text'] for c in caps['chunks'])
        row['pass_captions'] = cap_join == canon
        row['pass'] = all(row[k] for k in
                          ('pass_peak', 'pass_dur', 'pass_mono',
                           'pass_bounds', 'pass_captions'))
        if not row['pass']:
            fail.append(row)
        total += dur
        rows.append(row)
    pt = read(OUT / 'provider_texts.json')
    macron_ok = len(pt) == 21 and all(
        'Macron' not in v and 'mác cờ ron' in v
        for k, v in pt.items() if 'Macron' in meta[f's{int(k[1:]):02d}']['canonical_text'])
    write(AUD / 'qc_v2.json', {'rows': rows, 'failed': fail,
                               'total_duration_seconds': round(total, 2),
                               'macron_rule_ok': bool(macron_ok)})
    print('QC_V2_RESULT ' + json.dumps(
        {'ok': not fail and macron_ok, 'failed': fail,
         'total': round(total, 2), 'macron_ok': bool(macron_ok)},
        ensure_ascii=False), flush=True)
    return not fail and bool(macron_ok), rows, total


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if cmd in ('tts', 'all'):
        if not step_tts():
            sys.exit(1)
    if cmd in ('asr', 'all'):
        ok, summary, drift = step_asr()
        if not ok:
            print('WARNING: unmatched words present — see drift', flush=True)
    if cmd in ('qc', 'all'):
        step_qc()
