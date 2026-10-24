#!/usr/bin/env python
"""STEP5 news-daily-20261023: public scene_elements.json + captions.

Phrase-matched spans from REAL ASR-backed word times (same proven logic as
news-daily-20261021/scripts/scene_elements.py). Sequential cursor per element
in list order; repeated-phrase restart from 0 allowed. unmatched:true when a
phrase cannot be matched — never faked.
"""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json
import re
import unicodedata

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'scripts'))
PROJ = ROOT / 'projects/news-daily-20261023'
PUBLIC = ROOT / 'remotion-composer/public/news-daily-20261023'

import align_audio_words as A

ORDER = ['s01', 's02', 's03', 's04', 's05', 's06', 's07', 's08']

# id|display|anchor — verbatim from the task contract
ELEMENTS = {
 's01': [('badge', 'VIỆT NAM · GIÁO DỤC', 'Bộ Giáo dục'),
         ('title', 'THI LỚP 10: CHỈ TOÁN VÀ VĂN', 'thi vào lớp 10'),
         ('stat1', '2 môn thi — Toán và Văn', 'hai môn Toán và Văn'),
         ('sub', 'Đề xuất nhằm giảm áp lực thi cử', 'giảm áp lực thi cử'),
         ('chip1', 'Chưa phải quy định chính thức', 'chưa phải quy định chính thức')],
 's02': [('badge', 'VIỆT NAM · KINH TẾ', 'Chính phủ'),
         ('sub', 'Chính phủ trình Quốc hội', 'trình Quốc hội'),
         ('title', 'THUẾ VỚI ĐẤT BỎ HOANG', 'đánh thuế'),
         ('stat1', '0,2% — trên toàn bộ diện tích đất bỏ hoang', 'toàn bộ diện tích'),
         ('chip1', 'Không áp dụng hạn mức', 'không áp dụng hạn mức')],
 's03': [('badge', 'VIỆT NAM · PHÁP LUẬT', 'Công an Hà Nội'),
         ('title', 'GẦN 1.500 VĂN BẰNG, CHỨNG CHỈ GIẢ', '1.500 văn bằng'),
         ('stat1', 'Khởi tố 10 bị can', '10 bị can'),
         ('stat2', 'Trong đó có 2 giảng viên đại học', '2 giảng viên đại học'),
         ('stat3', 'Thu lời bất chính gần 3 tỷ đồng', 'gần 3 tỷ đồng')],
 's04': [('badge', 'VIỆT NAM · SỨC KHỎE', 'TP.HCM'),
         ('title', 'HƠN 40.000 CA TAY CHÂN MIỆNG', '40.000 ca tay chân miệng'),
         ('sub', 'Từ đầu năm', 'từ đầu năm'),
         ('stat1', 'Số ca tăng 32,2% trong một tuần', '32,2%'),
         ('chip1', 'Bác sĩ: nhận biết sớm dấu hiệu nặng', 'nhận biết sớm dấu hiệu nặng')],
 's05': [('badge', 'VIỆT NAM · HẠ TẦNG', 'Sân bay Long Thành'),
         ('title', 'LONG THÀNH: 4 GÓI THẦU NGUY CƠ TRỄ', '4 gói thầu nguy cơ trễ hẹn'),
         ('chip1', 'Thiếu nhân lực, chậm thanh toán', 'thiếu nhân lực và chậm thanh toán'),
         ('chip2', 'Dự kiến khai thác 24/12', 'khai thác 24/12')],
 's06': [('badge', 'NHẬN ĐỊNH', 'Với người có đất'),
         ('line1', 'Có đất bỏ hoang: nếu đề xuất thông qua sẽ tốn thêm thuế', 'tốn thêm thuế'),
         ('line2', 'Toàn bộ diện tích, không hạn mức — đất càng lớn, thuế càng cao', 'diện tích càng lớn')],
 's07': [('badge', 'NHẬN ĐỊNH', 'Với nhà có con'),
         ('line1', 'Thi 2 môn có thể giảm áp lực — nhưng vẫn là đề xuất, chưa phải quy định', 'hai môn Toán và Văn'),
         ('line2', 'Tay chân miệng đang tăng — nhận biết sớm dấu hiệu nặng', 'nhận biết sớm dấu hiệu nặng')],
 's08': [('title', 'TIN NHANH 23/10/2026', 'Theo dõi'),
         ('chip', 'Theo dõi để cập nhật bản tin tiếp theo', 'bản tin tiếp theo')],
}

# persist:'scene' badges — anchor at scene start word, stay whole scene
PERSIST = {('s06', 'badge'), ('s07', 'badge')}


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2,
                              allow_nan=False) + '\n', encoding='utf-8')
    tmp.replace(path)


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def norm_simple(s):
    out = []
    for t in s.lower().split():
        m = re.match(r'^(\d+,\d+)[%.,;:)]*$', t)
        if m:
            out.append(m.group(1))
        else:
            t2 = re.sub(r'[,.\-–—\'"«»!?;:()%·]', '', t)
            if t2:
                out.append(t2)
    return out


def norm_deep(tok):
    return A.norm(tok)


def match_phrase(words, phrase_tokens, search_from):
    n = len(phrase_tokens)
    if n == 0:
        return None
    i = search_from
    while i < len(words):
        if norm_deep(words[i]['word']) == phrase_tokens[0]:
            j, k = i, 1
            while k < n and j + 1 < len(words) and \
                    norm_deep(words[j + 1]['word']) == phrase_tokens[k]:
                j += 1
                k += 1
            if k == n:
                return i, j
        i += 1
    return None


def fuzzy_match_phrase(words, phrase_tokens, search_from):
    n = len(phrase_tokens)
    i = search_from
    while i < len(words):
        j, k = i, 0
        subs = 0
        while k < n and j < len(words):
            if norm_deep(words[j]['word']) == phrase_tokens[k]:
                j += 1
                k += 1
            elif (k + 1 < n and j + 1 < len(words)
                  and norm_deep(words[j]['word']) == phrase_tokens[k + 1]):
                j += 1
                k += 2
                subs += 1
            else:
                break
            if subs > 1:
                break
        if k >= n:
            return i, j - 1, subs
        i += 1
    return None


def sentence_chunks(canonical_text, max_chars=90):
    chunks = []
    parts = re.split(r'(?<=[.;])\s+', canonical_text.strip())
    for part in parts:
        if len(part) <= max_chars:
            chunks.append(part)
            continue
        pieces, cur = [], ''
        for w in part.split(' '):
            cand = (cur + ' ' + w).strip()
            if len(cand) > max_chars and cur:
                cut = cur.rfind(', ')
                if 0 < cut and len(cur[:cut + 1]) > 20:
                    rest = cur[cut + 2:]
                    pieces.append(cur[:cut + 1])
                    cur = rest + ' ' + w
                else:
                    pieces.append(cur)
                    cur = w
            else:
                cur = cand
        if cur:
            pieces.append(cur)
        chunks.extend(pieces)
    return chunks


def main():
    timing = read(PUBLIC / 'scene_timing.json')
    words_pub = read(PUBLIC / 'words.json')
    batch = read(PROJ / 'audio/tts_batch_durations.json')
    scene_of = {s['scene_id']: s for s in timing['scenes']}

    elements_out = []
    captions_out = {}
    unmatched_report = []
    for sid in ORDER:
        sc = scene_of[sid]
        canonical_text = batch[sid]['canonical_text']
        off = sc['start_seconds']
        local = [{'word': w['word'],
                  'start': (w['start'] - off) if w['start'] is not None else None,
                  'end': (w['end'] - off) if w['end'] is not None else None}
                 for w in words_pub[sid]]

        last_pos = 0
        for eid, display, anchor in ELEMENTS[sid]:
            phrase_tokens = [norm_deep(t) for t in norm_simple(anchor)]
            hit = match_phrase(local, phrase_tokens, last_pos)
            method = 'exact_token_join'
            if hit is None:
                fz = fuzzy_match_phrase(local, phrase_tokens, max(0, last_pos - 2))
                if fz is not None:
                    hit = (fz[0], fz[1])
                    method = 'consecutive_join_with_substitution'
            if hit is None:
                hit = match_phrase(local, phrase_tokens, 0)
                method += '+restart'
            entry = {'scene': sid, 'id': eid, 'display': display,
                     'anchor': anchor}
            if (sid, eid) in PERSIST:
                entry['persist'] = 'scene'
            if hit is None:
                entry.update({'unmatched': True,
                              'note': 'anchor not found in narration word '
                                      'sequence; not faked'})
                unmatched_report.append({'scene': sid, 'id': eid,
                                         'anchor': anchor})
            else:
                i, j = hit
                if local[i]['start'] is None or local[j]['end'] is None:
                    entry.update({'unmatched': True,
                                  'note': 'anchor words lack ASR spans'})
                    unmatched_report.append({'scene': sid, 'id': eid,
                                             'anchor': anchor})
                else:
                    start, end = local[i]['start'], local[j]['end']
                    start = max(0.0, start)
                    entry['start'] = round(start, 5)
                    entry['end'] = round(end, 5)
                    entry['start_frame'] = sc['start_frame'] + round(start * 30)
                    entry['match_method'] = method
                last_pos = j + 1
            elements_out.append(entry)

        toks = canonical_text.split()
        chunk_list = sentence_chunks(canonical_text)
        joined = ' '.join(chunk_list)
        assert joined == ' '.join(toks), f'{sid}: chunk tiling mismatch'
        caps = []
        wi = 0
        for chunk in chunk_list:
            n_words = len(chunk.split())
            a, b = wi, wi + n_words - 1
            wi = b + 1
            span_words = [w for w in local[a:b + 1] if w['start'] is not None]
            if span_words:
                start = max(0.0, min(w['start'] for w in span_words))
                end = min(sc['duration_seconds'],
                          max(w['end'] for w in span_words))
                caps.append({'chunk_text': chunk,
                             'anchor_start_word': a, 'anchor_end_word': b,
                             'start': round(start, 5), 'end': round(end, 5)})
            else:
                caps.append({'chunk_text': chunk,
                             'anchor_start_word': a, 'anchor_end_word': b,
                             'unmatched': True})
        captions_out[sid] = caps

    write(PUBLIC / 'scene_elements.json', {'scenes': elements_out,
                                           'unmatched_count':
                                               len(unmatched_report)})
    write(PUBLIC / 'captions.json', captions_out)
    print(json.dumps({'elements': len(elements_out),
                      'unmatched': unmatched_report,
                      'captions': sum(len(v) for v in captions_out.values())},
                     ensure_ascii=False))


if __name__ == '__main__':
    main()
