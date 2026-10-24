#!/usr/bin/env python
"""STEP5 france-riots-20261023: public scene_elements.json + captions.

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
PROJ = ROOT / 'projects/france-riots-20261023'
PUBLIC = ROOT / 'remotion-composer/public/france-riots-20261023'

import align_audio_words as A

ORDER = [f's{i:02d}' for i in range(1, 14)]

# id|display|anchor — verbatim from the task contract
ELEMENTS = {'s01': [('badge', 'PHÁP · 17/10/2026', 'Cách'), ('title', 'CÁCH ĐIỆN TỔNG THỐNG 200M', '200m'), ('chip1', 'Đám đông dựng barricade', 'đám đông đã dựng barricade'), ('chip2', 'Đây là chuyện đã xảy ra.', 'Đây là chuyện đã xảy ra'), ('sub', 'Đêm 17/10 — Paris', 'đêm 17/10')], 's02': [('badge', 'GỐC RỄ', 'Tất cả'), ('title', 'BẮT ĐẦU TỪ THÁNG 9', 'tháng 9'), ('chip1', 'Lớp học thiếu giáo viên', 'lớp học thiếu giáo viên'), ('chip2', 'Ngân sách 2027: xóa vị trí giáo viên', 'kế hoạch xóa vị trí giáo viên'), ('chip3', 'Đòi bỏ nền tảng tuyển sinh Parcoursup', 'đòi bỏ nền tảng')], 's03': [('badge', 'PHONG TRÀO LAN RỘNG', 'Phong trào'), ('title', 'TỪ XUỐNG ĐƯỜNG ĐẾN TIKTOK', 'Phong trào lan ra toàn quốc'), ('chip1', 'Người lao động + áo vàng tham gia', 'người lao động'), ('chip2', '16/10: trang đảng Les Républicains bị hack', 'Ngày 16/10'), ('chip3', 'Lời kêu gọi TikTok — bí danh V2', 'Đòn bẩy lớn nhất'), ('chip4', 'Bản đồ cộng tác: điểm tập hợp + barricade', 'bản đồ cộng tác')], 's04': [('badge', 'ĐÊM 17/10 · QUY MÔ', 'Thứ Bảy'), ('title', 'QUY MÔ TOÀN QUỐC', 'cả nước'), ('stat1', '550.000 người — Bộ Nội vụ', '550.000 người'), ('stat2', '110 cuộc biểu tình', '110 cuộc'), ('stat3', 'Paris: 110.000 người', 'riêng Paris'), ('stat4', '800.000 người — ban tổ chức', 'Ban tổ chức')], 's05': [('badge', 'PARIS', 'Tại Paris'), ('title', 'CÁCH ĐIỆN ÉLYSÉE 200M', '200 mét'), ('chip1', 'Barricade trên đại lộ Champs-Élysées', 'dựng barricade'), ('chip2', 'Hàng chục cửa hàng bị đập phá, cướp', 'hàng chục cửa hàng')], 's06': [('badge', 'CÁC THÀNH PHỐ', 'Sau Paris'), ('title', 'BẠO LOẠN LAN RỘNG', 'Sau Paris'), ('paris', 'Paris', 'Paris'), ('limoges', 'Limoges · toà thị chính 1883 cháy', 'Limoges'), ('heritage', '“Thảm họa di sản” — chính quyền', 'thảm họa di sản'), ('lyon', 'Lyon · 200–300 cửa hàng', 'Lyon'), ('marseille', 'Marseille · xông toà thị chính', 'Marseille')], 's07': [('badge', 'HẬU QUẢ SƠ BỘ', 'Đêm đó'), ('title', 'BẮT GIỮ · THƯƠNG TÍCH · CỬA HÀNG', 'Đêm đó'), ('stat1', '1.200 bắt giữ · 855 vùng Paris', '1.200 người'), ('stat2', 'Gần 2.400 bắt giữ — theo tổng kê giới chức', 'gần 2.400'), ('stat3', '997 cảnh sát bị thương', '997'), ('stat4', '~3.000 cửa hàng bị cướp, đập phá', '3.000 cửa hàng')], 's08': [('badge', 'CHI PHÍ BẢO HIỂM · TRIỆU €', 'Ngành bảo hiểm'), ('title', 'ƯỚC TÍNH THIỆT HẠI', 'ước tính'), ('bar2026', '17/10/2026 · ~1.000 · ƯỚC TÍNH', '1 tỷ euro'), ('bar2023', 'Bạo loạn 2023 · 795', '795 triệu euro'), ('bar2018', 'Áo vàng 2018–19 · 256', '256 triệu euro'), ('conclusion', 'Đợt đắt nhất lịch sử hiện đại của Pháp', 'Đợt đắt nhất')], 's09': [('badge', 'CHÍNH PHỦ PHẢN ỨNG', 'Tối hôm sau'), ('title', 'KHÔNG KHOAN NHƯỢNG', 'không khoan nhượng'), ('chip1', 'Macron lên truyền hình trong cơn giận', 'Tổng thống Macron'), ('chip2', 'Nuñez xin từ chức — bị từ chối', 'Bộ trưởng Nội vụ'), ('chip3', '22/10: cấm biểu tình “bất hợp pháp”', 'Đến 22/10')], 's10': [('badge', 'DIỄN BIẾN · 23/10/2026', 'Dòng thời gian'), ('title', 'PHÍA TRƯỚC: THỨ BẢY 24/10', 'Dòng thời gian'), ('t09', 'T9 · Học sinh', 'tháng 9'), ('t16', '16/10 · Bị hack', '16/10'), ('t17', '17/10 · Bạo loạn', '17/10'), ('t18', '18/10 · Truyền hình', '18/10'), ('t22', '22/10 · Lệnh cấm', '22/10'), ('t23', '23/10 · Họp quốc phòng', '23/10'), ('t24', '24/10 · Huy động mới?', 'thứ Bảy 24/10'), ('chip1', 'Lyon · Marseille · Nice đã cấm biểu tình', 'Lyon')], 's11': [('badge', 'GÓC NGƯỜI VIỆT', 'Ở Nice'), ('title', 'SINH HOẠT ĐẢO LỘN Ở NICE', 'Ở Nice'), ('chip1', 'Trường trong khu vực biểu tình', 'trường mình'), ('chip2', 'Người Việt lâu năm: không ngạc nhiên', 'Người Việt lâu năm'), ('chip3', 'Người mới đến: sốc trước cảnh đốt phá', 'người mới đến')], 's12': [('badge', 'NHẬN ĐỊNH', 'Bất ổn'), ('line1', '6 tháng trước bầu cử 2027: “sống đắt” thành khủng hoảng chính trị', '6 tháng'), ('line2', 'Bài học cho người đi làm: đệm chi phí cá nhân', 'Với người đi làm')], 's13': [('title', 'THỨ BẢY 24/10', 'thứ Bảy 24/10'), ('chip', 'Theo dõi để xem chuyện gì sẽ xảy ra', 'Theo dõi')]}
ELEMENTS['s02'] = [('badge', 'GỐC RỄ', 'Từ tháng 9'), ('title', 'TỪ THÁNG 9', 'tháng 9'), ('chip1', 'Lớp học thiếu giáo viên', 'thiếu giáo viên'), ('chip2', 'Ngân sách 2027: cắt vị trí', 'cắt vị trí'), ('chip3', 'Đòi bỏ nền tảng tuyển sinh Parcoursup', 'đòi bỏ')]
ELEMENTS['s03'] = [('badge', 'PHONG TRÀO LAN RỘNG', 'Người lao động'), ('title', 'TỪ XUỐNG ĐƯỜNG ĐẾN TIKTOK', 'Người lao động'), ('chip1', 'Người lao động + áo vàng tham gia', 'Người lao động'), ('chip2', '16/10: trang đảng Les Républicains bị hack', 'Ngày 16/10'), ('chip3', 'Lời kêu gọi TikTok — bí danh V2', 'Lời kêu gọi'), ('chip4', 'Bản đồ: điểm tập hợp + barricade', 'bản đồ')]
ELEMENTS['s10'] = [(eid, display, 'Từ tháng 9' if eid in ('badge', 'title') else anchor) for eid, display, anchor in ELEMENTS['s10']]
ELEMENTS['s12'] = [('badge', 'NHẬN ĐỊNH', 'Nhận định'), ('line1', '6 tháng trước bầu cử 2027: “sống đắt” thành khủng hoảng chính trị', 'sáu tháng'), ('line2', 'Bài học cho người đi làm: đệm chi phí cá nhân', 'Với người đi làm')]
RETROSPECTIVE = {('s10', 't16'): ('s03', 'Ngày 16/10'), ('s10', 't17'): ('s04', 'Thứ Bảy 17/10'), ('s10', 't18'): ('s09', 'Tối hôm sau')}
PERSIST = {('s12', 'badge')}

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
