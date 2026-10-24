#!/usr/bin/env python
"""STEP5 affordable-housing-20261024: public scene_elements.json + captions.json."""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json
import re

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'scripts'))
PROJ = ROOT / 'projects/affordable-housing-20261024'
PUBLIC = ROOT / 'remotion-composer/public/affordable-housing-20261024'

import align_audio_words as A

ORDER = [f's{i:02d}' for i in range(1, 9)]

ELEMENTS = {
    's01': [
        ('badge', 'NGHỊCH LÝ AN CƯ · 10/2026', 'hai vợ chồng'),
        ('income', 'TỔNG THU NHẬP: 50 TRIỆU / THÁNG', '50 triệu'),
        ('stamp', 'DIỆN CẦN NHÀ NƯỚC HỖ TRỢ MUA NHÀ', 'hỗ trợ'),
        ('price', '60 – 70 TRIỆU / M²', 'thương mại'),
    ],
    's02': [
        ('badge', 'KIẾN NGHỊ HOREA · 10/2026', 'HoREA'),
        ('title', 'LUẬT HÓA: NHÀ Ở THƯƠNG MẠI GIÁ PHÙ HỢP', 'giá phù hợp'),
        ('tier1', 'Hà Nội & TP.HCM: 60 – 70 triệu/m²', '60 đến 70 triệu'),
        ('tier2', 'Các tỉnh thành khác: 25 – 30 triệu/m²', '25 đến 30 triệu'),
    ],
    's03': [
        ('badge', 'KHOẢNG TRỐNG "THE MISSING MIDDLE"', 'vùng trũng'),
        ('b1', '18 – 25 tr/m² · Nhà ở xã hội (Chặn trần thu nhập)', '18 đến 25 triệu'),
        ('b2', '60 – 70 tr/m² · Khoảng trống HoREA đề xuất', 'The Missing Middle'),
        ('b3', '102 – 107 tr/m² · Sơ cấp nội đô (CBRE Q3/2026)', '102 đến 107 triệu'),
    ],
    's04': [
        ('badge', 'GIẢI PHẪU CHI PHÍ 1M² CĂN HỘ', 'giá thành'),
        ('cost_land', 'Tiền sử dụng đất & GPMB: 25 – 30%', '25 đến 30 phần trăm'),
        ('cost_build', 'Xây dựng & Vật liệu: 35 – 40%', 'xây dựng'),
        ('cost_floor', 'Giá thành xuất xưởng tối thiểu: 45 – 55 triệu/m²', '45 đến 55 triệu'),
    ],
    's05': [
        ('badge', 'BÓC TÁCH DÒNG TIỀN 50 TRIỆU/THÁNG', 'bài toán'),
        ('seg1', '28 triệu (56%) — Trả nợ ngân hàng (Gốc + Lãi)', '28 triệu'),
        ('seg2', '15 triệu (30%) — Chi phí sinh hoạt tối thiểu', '15 triệu'),
        ('seg3', '7 triệu (14%) — Dự phòng rủi ro cả gia đình', '7 triệu'),
    ],
    's06': [
        ('badge', 'CẢNH BÁO LÃI SUẤT THẢ NỔI', 'thời gian'),
        ('rate1', 'Hết ưu đãi: Thả nổi theo thị trường', 'thả nổi'),
        ('rate2', 'Lãi suất vọt lên 11,5 – 12,5%/năm (+3% biên độ)', '11,5 đến 12,5 phần trăm'),
        ('shock', 'VỌT LÊN 33 – 36 TRIỆU/THÁNG (>65–70% THU NHẬP)', '33 đến 36 triệu'),
    ],
    's07': [
        ('badge', 'GIÁ NHÀ / THU NHẬP (NUMBEO 2026)', 'Numbeo'),
        ('hcm', 'TP. Hồ Chí Minh: 33,6 năm thu nhập', '33,6 năm'),
        ('hn', 'Hà Nội: 38,9 năm thu nhập (Top đầu châu Á)', '38,9 năm'),
        ('un', 'Chuẩn lành mạnh Liên Hợp Quốc: < 5,0 năm', '5 năm'),
    ],
    's08': [
        ('badge', 'NHẬN ĐỊNH & LỜI GIẢI VĨ MÔ', 'Đề xuất'),
        ('line1', 'Giá nhà nội đô đã vượt khỏi tầm với đại chúng', 'tầm với'),
        ('tod', 'Mô hình TOD Metro: Giãn dân ra vùng ven 20 – 30 triệu/m²', 'Metro'),
        ('cta', 'Thu nhập bao nhiêu mới dám mua nhà? Bình luận 👇', 'Việt Nam'),
    ],
}

PERSIST = {('s08', 'badge')}


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    tmp.replace(path)


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


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
            while k < n and j + 1 < len(words) and norm_deep(words[j + 1]['word']) == phrase_tokens[k]:
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
            elif k + 1 < n and j + 1 < len(words) and norm_deep(words[j]['word']) == phrase_tokens[k + 1]:
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


def sentence_chunks(canonical_text, max_chars=74):
    chunks = []
    parts = re.split(r'(?<=[.;?!])\s+', canonical_text.strip())
    for part in parts:
        if len(part) <= max_chars:
            chunks.append(part)
            continue
        pieces, cur = [], ''
        for w in part.split(' '):
            cand = (cur + ' ' + w).strip()
            if len(cand) > max_chars and cur:
                cut = cur.rfind(', ')
                if 0 < cut and len(cur[:cut + 1]) > 18:
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
            entry = {'scene': sid, 'id': eid, 'display': display, 'anchor': anchor}
            phrase_tokens = [A.norm(t) for t in A.lexical_words(anchor)]
            hit = match_phrase(local, phrase_tokens, last_pos)
            method = 'exact_token_join'
            if hit is None:
                hit = match_phrase(local, phrase_tokens, 0)
                method += '+restart'
            if hit is None:
                fz = fuzzy_match_phrase(local, phrase_tokens, 0)
                if fz is not None:
                    i, j, subs = fz
                    hit = (i, j)
                    method = f'fuzzy_sub{subs}'
            if (sid, eid) in PERSIST:
                entry['persist'] = 'scene'
            if hit is None:
                entry.update({'unmatched': True, 'note': 'anchor not found'})
                unmatched_report.append({'scene': sid, 'id': eid, 'anchor': anchor})
            else:
                i, j = hit
                if local[i]['start'] is None or local[j]['end'] is None:
                    entry.update({'unmatched': True, 'note': 'anchor words lack ASR spans'})
                    unmatched_report.append({'scene': sid, 'id': eid, 'anchor': anchor})
                else:
                    start, end = local[i]['start'], local[j]['end']
                    start = max(0.0, start)
                    entry['anchor_start'] = round(start, 5)
                    entry['anchor_end'] = round(end, 5)
                    if (sid, eid) in PERSIST:
                        start, end = 0.0, sc['duration_seconds']
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
            n_words = len(A.lexical_words(chunk))
            a, b = wi, wi + n_words - 1
            wi = b + 1
            span_words = [w for w in local[a:b + 1] if w['start'] is not None]
            if span_words:
                start = max(0.0, min(w['start'] for w in span_words))
                end = min(sc['duration_seconds'], max(w['end'] for w in span_words))
                caps.append({'chunk_text': chunk,
                             'anchor_start_word': a, 'anchor_end_word': b,
                             'start': round(start, 5), 'end': round(end, 5)})
            else:
                caps.append({'chunk_text': chunk,
                             'anchor_start_word': a, 'anchor_end_word': b,
                             'unmatched': True})
        captions_out[sid] = caps

    write(PUBLIC / 'scene_elements.json', {'scenes': elements_out, 'unmatched_count': len(unmatched_report)})
    write(PUBLIC / 'captions.json', captions_out)
    print(json.dumps({'elements': len(elements_out),
                      'unmatched': unmatched_report,
                      'captions': sum(len(v) for v in captions_out.values())},
                     ensure_ascii=False))


if __name__ == '__main__':
    main()
