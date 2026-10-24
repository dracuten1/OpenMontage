#!/usr/bin/env python
"""STEP5 vietjet-20261023: public scene_elements.json + captions.

Phrase-matched spans from REAL ASR-backed word times (proven logic from
france-riots-20261023/scripts/scene_elements.py). Sequential cursor per
element in list order; repeated-phrase restart from 0 allowed.
unmatched:true when a phrase cannot be matched — never faked.
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
PROJ = ROOT / 'projects/vietjet-20261023'
PUBLIC = ROOT / 'remotion-composer/public/vietjet-20261023'

import align_audio_words as A

ORDER = [f's{i:02d}' for i in range(1, 18)]

# id|display|anchor — anchor là cụm từ THẬT trong narration (canonical form)
ELEMENTS = {
    's01': [('badge', 'VIETJET · TÒA ANH · 10/2026', 'Nợ'),
            ('title', 'ĐÓNG BĂNG 251 TRIỆU USD\nTÀI SẢN TOÀN CẦU', '251 triệu USD'),
            ('chip1', 'Nợ 7 triệu USD thời COVID', '7 triệu USD'),
            ('sub', 'Lệnh WFO 15/10/2026 — Tòa Thương mại Anh', 'tòa Anh')],
    's02': [('badge', 'GỐC RỄ', 'Gốc rễ'),
            ('title', '4 AIRBUS A321 THUÊ\n— RỒI COVID', 'Airbus A321'),
            ('chip1', 'Nợ thuê ~7,4 triệu USD', '7,4 triệu USD'),
            ('chip2', 'Cuối 2021: hợp đồng chấm dứt sớm', 'chấm dứt sớm')],
    's03': [('badge', 'CƠ CHẾ 1/4', 'Cơ chế thứ nhất'),
            ('title', 'ĐIỀU KHOẢN\nCHUYỂN NHƯỢNG NỢ', 'chuyển nhượng nợ'),
            ('chip1', 'Ngân hàng bán nợ → quỹ săn nợ Anh FitzWalter', 'quỹ săn nợ Anh'),
            ('chip2', 'Hết đối tác đàm phán giãn nợ', 'đàm phán giãn nợ')],
    's04': [('badge', 'CƠ CHẾ 2/4 + 3/4', 'Cơ chế thứ hai'),
            ('title', 'CHẤM DỨT HỢP ĐỒNG\nVẪN PHẢI ĐỀN', 'điều khoản chấm dứt'),
            ('chip1', 'Bản án 181,5 triệu USD (4/2025)', '181,5 triệu USD'),
            ('chip2', 'Phần lớn: bồi thường chấm dứt — theo phân tích phán quyết', 'bồi thường chấm dứt'),
            ('chip3', 'Kiện "khoản phạt vô lý" → tòa Anh bác', 'bác lập luận')],
    's05': [('badge', 'CƠ CHẾ 4/4', 'Cơ chế thứ tư'),
            ('title', 'LÃI CỘNG DỒN\n+ CHI PHÍ PHÁP LÝ', 'lãi chậm trả cộng dồn'),
            ('chip1', 'Đã trả máy bay từ 2022 — nợ vẫn tăng', 'trả từ 2022')],
    's06': [('badge', 'BA BẢN ÁN — TỔNG', 'ba bản án'),
            ('stat1', 'Tổng 3 bản án: 251,6 triệu USD\n(TRẦN lệnh đóng băng)', '251,6 triệu USD'),
            ('stat2', 'VietJet mới trả ~2 triệu USD (2025)', '2 triệu')],
    's07': [('badge', '12/2024', 'Tháng 12'),
            ('title', 'GIÁ TRỊ ~300 MÁY BAY\n→ CÔNG TY CAYMAN', '300 máy bay'),
            ('chip1', 'Angelica Holding (AHL) — liên quan tới VietJet', 'Angelica Holding'),
            ('chip2', 'Singapore: lệnh thu 9 máy bay — không thành', '9 máy bay')],
    's08': [('badge', '15/10/2026', '15/10/2026'),
            ('title', 'WFO: ĐÓNG BĂNG\n251,6 TRIỆU USD', 'đóng băng tài sản toàn cầu'),
            ('chip1', 'Thẩm phán Saini — Tòa Thương mại Anh', 'Saini'),
            ('chip2', '"Bằng chứng chắc chắn về nguy cơ tẩu tán"', 'nguy cơ tẩu tán')],
    's09': [('badge', 'LỜI THẨM PHÁN', 'Ba cụm từ'),
            ('q1', '"wholly illusory" — hoàn toàn ảo', 'hoàn toàn ảo'),
            ('q2', '"bizarre" — quái đản', 'quái đản'),
            ('q3', '"won\u2019t pay" — không chịu trả', 'không chịu trả'),
            ('note', 'Lời tòa trong phiên — chưa phải kết luận cuối', 'chưa phải kết luận cuối cùng')],
    's10': [('badge', 'PHẢN BÁC CỦA VIETJET', 'Phía VietJet'),
            ('chip1', '"Tài trợ / tái tài trợ thông thường trong ngành"', 'tài trợ'),
            ('chip2', 'Không phải tẩu tán', 'không phải tẩu tán'),
            ('chip3', 'Được quyền kháng án', 'kháng án')],
    's11': [('badge', 'NỢ PHÌNH TO (TRIỆU USD)', 'Nhìn lại'),
            ('b1', '7,4', '7,4'),
            ('b2', '18,8', '18,8'),
            ('b3', '181,5', '181,5'),
            ('b4', '18,3', '18,3'),
            ('b5', '251,6 — TRẦN đóng băng', '250 triệu USD'),
            ('note', 'TRẦN lệnh đóng băng — chưa phải số đã thu hồi', 'vượt mốc')],
    's12': [('badge', 'BỌC TÁCH 251,6 TRIỆU USD', 'Bóc tách'),
            ('qual', 'ƯỚC TÍNH THEO PHÂN TÍCH PHÁN QUYẾT', 'ước tính theo phân tích phán quyết'),
            ('p1', '~164,8 bồi thường chấm dứt', '164,8'),
            ('p2', '16,7 tiền thuê quá hạn', '16,7'),
            ('p3', 'Phần còn lại: 2 bản án nhỏ + lãi cộng dồn + chi phí pháp lý', 'lãi cộng dồn')],
    's13': [('badge', 'DÒNG THỜI GIAN', 'Dòng thời gian'),
            ('t1', '2018 — nhận máy bay', '2018'),
            ('t2', '2021 — mất hợp đồng', '2021'),
            ('t3', '2022 — thu hồi 4 chiếc', '2022'),
            ('t4', '2024 — bản án đầu tiên', 'bản án đầu tiên'),
            ('t5', '12/2024 — giao dịch Angelica', 'giao dịch Angelica'),
            ('t6', '15/10/2026 — WFO 251,6', 'lệnh đóng băng toàn cầu')],
    's14': [('badge', 'PHẠM VI ĐÓNG BĂNG', 'Bị đóng băng'),
            ('i1', '~300 máy bay đặt trước', '300 máy bay'),
            ('i2', 'Tiền cọc PDP', 'PDP'),
            ('i3', 'Động cơ', 'động cơ'),
            ('i4', 'Tiền vé qua đại lý', 'đại lý'),
            ('box', 'VẪN BAY BÌNH THƯỜNG\n— không phải lệnh cấm bay', 'không phải lệnh cấm bay')],
    's15': [('badge', 'ẢNH HƯỞNG', 'Cổ phiếu'),
            ('c1', 'VJC ~128.600 đồng (theo giao dịch gần đây) — không sàn', '128.600 đồng'),
            ('c2', 'Úc: 10 Boeing 737 — dự kiến khó hơn', 'Úc'),
            ('c3', 'Hành khách cuối năm: lịch bay không đổi', 'lịch bay không đổi')],
    's16': [('badge', 'NHẬN ĐỊNH', 'Nhận định'),
            ('line1', 'Hợp đồng quốc tế không có "khoan nhượng COVID"', 'khoan nhượng'),
            ('line2', 'Chuyển nhượng nợ + chấm dứt sớm: 7 triệu → hơn 250 triệu nghĩa vụ', 'chuyển nhượng nợ'),
            ('line3', 'Chuyện này còn dài', 'còn dài')],
    's17': [('title', 'THEO DÕI', 'Theo dõi'),
            ('sub', 'VietJet kháng án đến đâu?', 'kháng án')],
}
RETROSPECTIVE = {}
PERSIST = {('s12', 'qual'), ('s16', 'badge')}


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
            t2 = re.sub(r'[,.\-–—\'\"«»!?;:()%·]', '', t)
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


def sentence_chunks(canonical_text, max_chars=80):
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
            entry = {'scene': sid, 'id': eid, 'display': display,
                     'anchor': anchor}
            if (sid, eid) in RETROSPECTIVE:
                ref_scene, ref_anchor = RETROSPECTIVE[(sid, eid)]
                entry.update({'retrospective_reference': True,
                              'retrospective_of': {'scene': ref_scene,
                                                   'anchor': ref_anchor},
                              'start': 0.0, 'end': sc['duration_seconds'],
                              'persist': 'scene',
                              'start_frame': sc['start_frame'],
                              'match_method': 'static_retrospective_label'})
                elements_out.append(entry)
                continue
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
