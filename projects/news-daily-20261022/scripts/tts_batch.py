#!/usr/bin/env python
"""STEP2 news-daily-20261022: vieneu TTS batch (AUDIO ONLY, owner preauthorized).

Canonical -> provider text via token-level lexicon (longest-first). Same proven
logic as news-daily-20261021/scripts/tts_batch.py — only constants changed.
"""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json
import re
import subprocess
import time

from difflib import SequenceMatcher

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'scripts'))
PROJ = ROOT / 'projects/news-daily-20261022'
AUD = PROJ / 'assets/audio'
META_DIR = PROJ / 'audio'

import align_audio_words as A

SID_SECTION = {'s01': 'S1', 's02': 'S2', 's03': 'S3', 's04': 'S4',
               's05': 'S5', 's06': 'S6a', 's07': 'S6b', 's08': 'S7'}

SCENES = {
 's01': "Siêu bão Champi — cơn bão mạnh nhất hành tinh năm 2026 — đang áp sát Đài Loan với gió 210 km/h, cấp 16 giật trên cấp 17. Chứng khoán, trường học Đài Loan đóng cửa, chuyến bay đảo lộn; bão dự kiến tiếp tục hướng sang Nhật Bản. Bão ít khả năng vào Biển Đông, nhưng đông bắc Biển Đông có gió cấp 8 đến 9, sóng cao 4 đến 6 mét.",
 's02': "TPHCM ghi nhận chùm 5 ca não mô cầu, trong đó một học sinh 12 tuổi đã tử vong. Gần 100 người tiếp xúc gần được uống kháng sinh dự phòng; hơn 50.000 mũi vaccine não mô cầu đã được tiêm chỉ trong 6 ngày.",
 's03': "Bảy tàu chở dầu bị tấn công ở eo biển Hormuz, nhiều tàu bốc cháy. Aramco sơ tán nhân viên khỏi trụ sở Dhahran; nỗi lo chiến tranh tái diễn đẩy giá dầu thế giới bật mạnh.",
 's04': "Từ 15 giờ hôm nay, xăng E10 không cao hơn 25.213 đồng một lít, trong khi các loại dầu tăng 444 đến 1.238 đồng một lít.",
 's05': "Phái sinh Nasdaq giảm gần 2% vì nghi ngờ chi tiêu AI và giá dầu tăng, khiến Tesla và Meta lao dốc; IBM mất 7% dù doanh thu vượt dự báo.",
 's06': "Với người đi làm: bão ít khả năng vào Biển Đông, nhưng sóng cao 4 đến 6 mét nghĩa là vùng biển đông bắc vẫn nguy hiểm với tàu thuyền; từ nay đến hết tháng 10 chưa có dấu hiệu bão mới.",
 's07': "Xăng giảm là tin vui cho túi tiền, nhưng dầu tăng 444 đến 1.238 đồng, nên chi phí vận chuyển, giao hàng có thể chưa hạ theo. Với nhà có trẻ nhỏ, hơn 50.000 mũi vaccine não mô cầu trong 6 ngày cho thấy nhiều gia đình đã chủ động tiêm chủng.",
 's08': "Theo dõi để cập nhật bản tin tiếp theo.",
}

EXPECTED = {
 's01': ['Champi', 'năm 2026', '210 km/h', 'cấp 16 giật trên cấp 17',
         'cấp 8 đến 9', '4 đến 6 mét'],
 's02': ['TPHCM', 'chùm 5 ca', '12 tuổi', '100 người', '50.000 mũi',
         'trong 6 ngày'],
 's03': ['Hormuz', 'Aramco', 'Dhahran'],
 's04': ['15 giờ', 'E10', '25.213 đồng', '444 đến 1.238 đồng'],
 's05': ['Nasdaq', 'gần 2%', '7%', 'Tesla', 'Meta', 'IBM', 'AI'],
 's06': ['4 đến 6 mét', 'tháng 10'],
 's07': ['444 đến 1.238 đồng', '50.000 mũi', 'trong 6 ngày'],
 's08': [],
}

PUNCT_SUFFIX = re.compile(r'([.,;:!?…]+)$')


def split_punct(tok):
    m = PUNCT_SUFFIX.search(tok)
    if not m:
        return tok, ''
    return tok[:m.start()], m.group(1)


def to_provider(canonical, lex):
    # Match keys on canonical-token subsequences (all lexical), not split(),
    # so '4' glued to ',' as '4,' is still recognised inside '4 đến 6 mét'.
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


_KEY_PREFIX = {k: [A.norm(t) for t in A.lexical_words(k)] for k in json.loads(
    (Path(__file__).resolve().parent.parent / 'tts_lexicon.json').read_text(
        encoding='utf-8'))['news-daily-20261022']}


def canonical_to_provider_canonical(canon, prov):
    result = [None] * len(canon)
    matcher = SequenceMatcher(None, list(map(A.norm, canon)),
                              list(map(A.norm, prov)), autojunk=False)
    for tag, a, b, c, d in matcher.get_opcodes():
        if b - a == d - c:
            for i in range(b - a):
                result[a + i] = (c + i, c + i + 1)
        elif b - a == 1 and d > c:
            result[a] = (c, d)
        elif b > a and d > c:
            if d - c >= b - a:
                spans, ci = [], c
                for i in range(a, b - 1):
                    take_len, key = 1, None
                    for k in _KEY_PREFIX:
                        take = _KEY_PREFIX[k]
                        if (ci + len(take) <= d and take
                                and [A.norm(t) for t in prov[ci:ci + len(take)]] == take
                                and len(take) > take_len):
                            key, take_len = k, len(take)
                    spans.append((ci, ci + take_len))
                    ci += take_len
                spans.append((ci, d))
                ci = d
                for i, sp in enumerate(spans[:b - a]):
                    result[a + i] = sp
            else:
                raise ValueError(f'Ambiguous canonical/provider edit: {tag} '
                                 f'{canon[a:b]} -> {prov[c:d]}')
        else:
            raise ValueError(f'Ambiguous canonical/provider edit: {tag} '
                             f'{canon[a:b]} -> {prov[c:d]}')
    if any(x is None for x in result):
        raise ValueError('Canonical token has no spoken provider phrase')
    assert [i for a_, b_ in result for i in range(a_, b_)] == list(range(len(prov)))
    return result


def digit_or_punct_digit(tok):
    core, _ = split_punct(tok)
    return bool(core) and A.norm(core).isdigit()


def find_lex_span(lex_tokens, key_norm_tokens, start=0):
    """Greedy consecutive subsequence search in lexical-token space."""
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
    """All checks in LEXICAL token space (lexical_words drops punctuation-only
    tokens like '—', so split() char offsets desync — proven safe fix)."""
    lex_all = A.lexical_words(canonical)
    lex_norm = [A.norm(t) for t in lex_all]
    key_norm = {k: [A.norm(t) for t in A.lexical_words(k)] for k in lex}
    missing = [k for k in EXPECTED[sid] if k not in matched]
    subsumed, illegal = [], []
    for k in lex:
        if k in matched or k not in canonical:
            continue
        ks = find_lex_span(lex_norm, key_norm[k])
        covered = ks is not None and any(a <= ks[0] and ks[1] <= b
                                         for a, b in lex_spans)
        (subsumed if covered else illegal).append(k)
    residual_digits = [tok for i, tok in enumerate(lex_all)
                       if A.norm(tok.rstrip('.,;:!?%')).isdigit()
                       and not any(a <= i < b for a, b in lex_spans)]
    ok = not missing and not illegal and not residual_digits
    return {'expected': EXPECTED[sid], 'matched': sorted(matched),
            'missing': missing, 'subsumed_by_longer_match': sorted(subsumed),
            'present_but_uncovered': illegal,
            'canonical_digit_tokens_remaining': residual_digits, 'pass': ok,
            'note': 'checks in lexical-token space (split() char offsets '
                    'desync across punctuation-only tokens)'}


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n',
                    encoding='utf-8')


def probe_s(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                        'format=duration', '-of',
                        'default=noprint_wrappers=1:nokey=1', str(p)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def valid(p, min_s=1.5):
    if not p.exists():
        return False
    try:
        return probe_s(p) > min_s
    except Exception:
        return False


def main():
    meta_path = META_DIR / 'tts_batch_durations.json'
    meta = json.loads(meta_path.read_text(encoding='utf-8')) if meta_path.exists() else {}
    lex_all = json.loads((PROJ / 'tts_lexicon.json').read_text(encoding='utf-8'))
    lex = lex_all['news-daily-20261022']

    from tools.tool_registry import registry
    registry.discover()
    tool = registry._tools['vieneu_tts']

    failures = []
    for sid in sorted(SCENES):
        canonical = SCENES[sid]
        canon, prov, _, matched, lex_spans = to_provider(canonical, lex)
        provider_text = ' '.join(prov)
        try:
            mapping = A.canonical_to_provider(canon, prov)
            mapping_method = 'align_audio_words.canonical_to_provider'
        except ValueError:
            mapping = canonical_to_provider_canonical(canon, prov)
            mapping_method = 'lexicon_aware_boundary_resolution'
        cov = coverage_proof(sid, canonical, matched, lex_spans, lex)
        if not cov['pass']:
            failures.append({'scene': sid, 'error': f'lexicon coverage: {cov}'})
            meta[sid] = {'scene_id': sid, 'section_id': SID_SECTION[sid],
                         'success': False, 'error': f'lexicon coverage {cov}'}
            write(meta_path, meta)
            print(json.dumps({'scene': sid, 'error': 'lexicon coverage',
                              'detail': cov}, ensure_ascii=False), flush=True)
            continue

        raw, out = AUD / f'{sid}_raw.wav', AUD / f'voice_{sid}.wav'
        entry = {k: v for k, v in meta.get(sid, {}).items()
                 if k in ('tool', 'provider', 'requested_voice', 'processing',
                          'attempt', 'tool_duration_seconds', 'wall_seconds',
                          'gen_seconds', 'cost_usd')}
        if not valid(out):
            ok = False
            for attempt in (1, 2):
                if raw.exists():
                    raw.unlink()
                before = time.time()
                result = tool.execute({'text': provider_text, 'voice': None,
                                       'output_path': str(raw)})
                entry = {'tool': 'vieneu_tts', 'provider': 'vieneu',
                         'requested_voice': None, 'success': result.success,
                         'data': result.data, 'error': result.error,
                         'tool_duration_seconds': result.duration_seconds,
                         'wall_seconds': round(time.time() - before, 3),
                         'gen_seconds': (result.data or {}).get('gen_seconds'),
                         'attempt': attempt, 'cost_usd': 0}
                if result.success and valid(raw):
                    ok = True
                    break
                print(json.dumps({'scene': sid, 'attempt': attempt,
                                  'tts_success': result.success,
                                  'error': result.error}, ensure_ascii=False),
                      flush=True)
            if not ok:
                entry['error_note'] = 'stopped this scene after two true TTS failures'
                failures.append({'scene': sid, 'error': str(entry.get('error'))})
                entry.update(scene_id=sid, section_id=SID_SECTION[sid],
                             canonical_text=canonical, provider_text=provider_text,
                             coverage=cov)
                meta[sid] = entry
                write(meta_path, meta)
                continue
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error',
                            '-n', '-i', str(raw), '-af', 'atempo=1.15',
                            '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le',
                            str(out)], check=True)
            entry['processing'] = {'filter': 'atempo=1.15', 'applications': 1,
                                   'input': str(raw), 'output': str(out)}
        entry.update(scene_id=sid, section_id=SID_SECTION[sid],
                     canonical_text=canonical, provider_text=provider_text,
                     lexicon_replaces_applied=sorted(matched),
                     coverage=cov,
                     canonical_tokens=canon, provider_tokens=prov,
                     provider_mapping=[[a, b] for a, b in mapping],
                     provider_mapping_method=mapping_method,
                     raw_seconds=probe_s(raw), voice_seconds=probe_s(out))
        meta[sid] = entry
        write(meta_path, meta)
        print(json.dumps({'scene': sid, 'voice_seconds': entry['voice_seconds'],
                          'raw_seconds': entry['raw_seconds'],
                          'lexicon': sorted(matched),
                          'subsumed': cov['subsumed_by_longer_match']}),
              flush=True)

    print('TTS_BATCH_RESULT ' + json.dumps(
        {'ok': not failures, 'failed': failures,
         'scenes': sorted(k for k, v in meta.items() if v.get('voice_seconds'))},
        ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
