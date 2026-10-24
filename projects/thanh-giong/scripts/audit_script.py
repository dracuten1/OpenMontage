#!/usr/bin/env python
"""Audit script.json S2E02 thanh-giong: whitelist số display, anti-rules, S2-C2,
provider_text sạch (không số Ả Rập, không '/', không viết tắt). Chạy từ repo root."""
import json
import re
import sys

P = "/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong/artifacts/script.json"
d = json.load(open(P))
secs = d["sections"]
issues, notes = [], []

# ---- 1. whitelist số: mọi số/địa danh display trong enhancement_cues ----
WHITELIST_NUMS = ["1329", "1313", "1492", "1479", "1697", "2010", "16/11/2010", "18", "7", "100", "3", "60", "6",
                  "7–9", "7-9", "9/4", "6–8", "6-8", "9", "5", "8", "4", "1/2010", "16", "11"]
PLACE_OK = ["Phù Đổng", "Võ Giàng", "Võ Ninh", "Tiên Du", "Kiến Sơ", "Vệ Linh", "Ninh Sóc", "Sóc Sơn",
            "Đằng Ngà", "Gia Bình", "làng Cháy", "Gia Lâm", "Soi Bia", "Vũ Ninh", "Tứ bất tử", "Tản Viên",
            "Chử Đồng Tử", "Liễu Hạnh", "Hà Nội"]
for s in secs:
    for cue in s.get("enhancement_cues", []):
        txt = cue.get("description", "") if isinstance(cue, dict) else str(cue)
        clean = re.sub(r"img-\d+", "", txt)  # bỏ reference id ảnh nội bộ (không lên màn)
        clean = re.sub(r"#[0-9A-Fa-f]{3,8}", "", clean)  # bỏ mã màu hex
        clean = re.sub(r"\d+\s*px", "", clean)  # bỏ kích thước px
        for num in re.findall(r"\d[\d.,/–-]*", clean):
            core = num.strip(".,")
            ok = any(w in num or num in w for w in WHITELIST_NUMS) if core else False
            if not ok and core not in ("30", "01", "1", "9", "2", "I", "II", "III", "3", "6"):
                issues.append(f"{s['id']}: số display ngoài whitelist? '{num}' trong cue: {txt[:70]}")

full_text = " ".join(s["text"] for s in secs if isinstance(s, dict))
ft_ci = full_text.casefold()

# ---- 2. S2-C2 chốt climax (nguyên văn ý: cả làng nuôi lớn + hạt gạo nhiều nhà) ----
C2a = "cả làng nuôi"
C2b = "không đủ gạo"
if C2a not in ft_ci:
    issues.append("S2-C2: cụm 'cả làng nuôi' KHÔNG thấy trong text (canon bắt buộc)")
if C2b not in ft_ci:
    issues.append("S2-C2: cụm 'không đủ gạo' KHÔNG thấy trong text (trước 'xóm làng chung góp')")

# ---- 3. anti-rules S2E02 ----
# 3a. giặc Ân phải đóng khung truyện kể
for m in re.finditer(r"giặc Ân", full_text):
    ctx = full_text[max(0, m.start() - 120):m.end() + 120]
    if not re.search(r"truyện kể|sách chép|trong truyện|kể rằng|đóng khung|dân gian|theo truyện", ctx):
        issues.append(f"anti-rule: 'giặc Ân' không đóng khung truyện kể: ...{ctx[:160]}...")
# 3b. không nói Gióng chết / tử trận
if re.search(r"Gióng (chết|tử trận|hy sinh)|cậu bé (chết|tử trận)", full_text):
    issues.append("anti-rule: Gióng KHÔNG chết — bay về trời (kiểm lại câu nói về cái chết)")
# 3c. không dùng lễ hội/UNESCO chứng minh trận đánh
for m in re.finditer(r"(UNESCO|di sản|lễ hội|đền)[^.]{0,120}(chứng minh|đúng là có thật|thật sự xảy ra)", full_text):
    ctx = full_text[max(0, m.start() - 100):m.end() + 60]
    if not re.search(r"không|chưa|chỉ nói|nói về", ctx):
        issues.append(f"anti-rule: dùng tín ngưỡng/UNESCO chứng minh trận đánh: ...{ctx[:160]}...")
# 3d. '7 nong cơm/3 chum cà' phải đóng khung 'dân gian kể thêm'
for m in re.finditer(r"(bảy nong|7 nong|ba chum|3 chum)", full_text):
    ctx = full_text[max(0, m.start() - 150):m.end() + 150]
    if not re.search(r"dân gian kể thêm|kể thêm|SGK|sau này thêm", ctx):
        issues.append(f"anti-rule: '7 nong/3 chum' không đóng khung 'dân gian kể thêm': ...{ctx[:160]}...")
# 3e. không gán niên đại bằng sắt/ngựa
for m in re.finditer(r"(ngựa sắt|roi sắt|vũ khí sắt|gươm sắt)[^.]{0,160}(niên đại|định tuổi|chứng tỏ|từ thời)", full_text):
    ctx = full_text[max(0, m.start() - 100):m.end() + 80]
    if not re.search(r"không|chưa|câu hỏi|có thể|người chép", ctx):
        issues.append(f"anti-rule: gán niên đại bằng vũ khí sắt: ...{ctx[:160]}...")
# 3f. climax phải giữ đóng khung cách đọc
if not re.search(r"(có thể đọc|đọc theo|truyện không nói trắng|cách đọc)", full_text):
    issues.append("anti-rule: climax thiếu đóng khung 'có thể đọc là…' (cách đọc, không kết luận áp lên truyện)")

# ---- 4. provider_text sạch ----
for s in secs:
    pt = s["delivery_cues"]["provider_text"]
    if "/" in pt:
        notes.append(f"{s['id']}: provider_text có '/' (vieneu đọc 'trên')")
    if re.search(r"ĐVSKTT|LNCQ|VĐULT", pt):
        issues.append(f"{s['id']}: provider_text chứa viết tắt ĐVSKTT/LNCQ/VĐULT")
    digits = re.findall(r"\d", pt)
    if digits:
        issues.append(f"{s['id']}: provider_text còn {len(digits)} chữ số Ả Rập (phải viết chữ)")
    if ";" in pt:
        notes.append(f"{s['id']}: provider_text có ';' (tách bằng dấu chấm)")

# ---- 5. cấu trúc ----
wc = sum(len(s["text"].split()) for s in secs)
if not (3400 <= wc <= 3900):
    issues.append(f"word count {wc} ngoài 3.400–3.900")
if not (28 <= len(secs) <= 31):
    issues.append(f"sections {len(secs)} ngoài 28–31")

# ---- 6. quotes verbatim bắt buộc ----
QUOTES = [
    "Xóm làng phải chung góp gạo vải với gia đình để nuôi cậu",
    "không biết nói cười",
    "một thanh gươm, một con ngựa và một roi sắt",
    "Ta là thiên tướng nhà Trời đây!",
]
for q in QUOTES:
    if q not in full_text:
        issues.append(f"trích dẫn bắt buộc thiếu: '{q}'")

print(f"sections={len(secs)} words={wc}")
print("ISSUES:", len(issues))
for i in issues:
    print("  !", i)
print("NOTES:", len(notes))
for n in notes:
    print("  -", n)
sys.exit(1 if issues else 0)
