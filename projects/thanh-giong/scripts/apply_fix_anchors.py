#!/usr/bin/env python
"""S2E02 Gate C fix — thay 15 anchor call fail bằng anchor mới đã verify trong window (cơ học, không đổi visual)."""
import json
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
SRC = REPO / "remotion-composer" / "src" / "thanh-giong"
P = REPO / "projects" / "thanh-giong"

# (group, scene, old, new)
FIXES = [
    ("a", "sc001", "Thánh Gióng", "Một thanh gươm"),
    ("e", "sc005", "mâm cỗ", "khói đền"),
    ("d", "sc010", "kho vua chúa thần thánh", "Ai đã viết"),
    ("d", "sc016", "chân núi Vũ Ninh", "Vài dòng"),
    ("d", "sc034", "Đằng Ngà", "Tre ngả vàng"),
    ("d", "sc040", "Ngựa sắt", "Kiếm dài"),
    ("e", "sc041", "thời được kể", "Đây là câu hỏi"),
    ("e", "sc041", "câu hỏi", "không phải kết luận"),
    ("d", "sc052", "Hội lớn", "Bằng chứng tín ngưỡng"),
    ("d", "sc052", "bao đời nay", "năm xưa có thật"),
    ("e", "sc053", "đứa trẻ im lặng", "câu hỏi mở đầu"),
    ("e", "sc053", "lời xin vũ khí đầu đời", "Để trả lời"),
    ("c", "sc063", "hư mất đời", "không đi hội"),
    ("d", "sc064", "mồng Chín tháng Tư", "bãi Soi Bia"),
    ("e", "sc065", "Phù Đổng đứng thứ hai", "và Liễu Hạnh"),
]

audit = json.load(open(P / "artifacts" / "anchor_audit_strict.json"))
windows = {s["sceneId"]: (s["sectionId"], s["window"][0], s["window"][1]) for s in audit["scenes"]}
words = json.load(open(REPO / "remotion-composer" / "public" / "thanh-giong" / "transcripts" / "narration_words.json"))

def norm(w):
    return w.strip(".,!?;:\"'“”«»—-…").lower()

# index words theo section (list liên tiếp theo thứ tự đọc)
sec_words = {sid: ws for sid, ws in words.items() if isinstance(ws, list)}

def find_start(sec, phrase, occ=1):
    toks = [norm(t) for t in phrase.split()]
    seen = 0
    ws = sec_words.get(sec, [])
    for i in range(len(ws) - len(toks) + 1):
        if all(norm(ws[i + j]["word"]) == toks[j] for j in range(len(toks))):
            seen += 1
            if seen == occ:
                return ws[i]["start"], ws[i + len(toks) - 1]["end"]
    return None, None

report = []
for g, scene, old, new in FIXES:
    sec, w0, w1 = windows[scene]
    s, e = find_start(sec, new)
    ok = s is not None and (w0 - 0.2) <= s and e <= (w1 + 0.2)
    report.append((scene, old, new, s, e, "OK" if ok else "VERIFY_FAIL"))
    if not ok:
        continue
    f = SRC / f"scenes-{g}.tsx"
    txt = f.read_text()
    needle = f'A("{old}")'
    assert txt.count(needle) == 1, f"{needle} count={txt.count(needle)} in scenes-{g}.tsx"
    txt = txt.replace(needle, f'A("{new}")')
    f.write_text(txt)

for r in report:
    print(f"{r[0]}  {r[1]!r:42s} -> {r[2]!r:28s} start={r[3]} end={r[4]} {r[5]}")
bad = [r for r in report if r[5] != "OK"]
print("VERIFY_FAIL:", len(bad))
