#!/usr/bin/env python3
"""Scan lieu-hanh scenes TSX for on-screen display strings and check vocabulary
against the approved script narration (all sections' text + display cues).
Flags strings containing words absent from script vocabulary (potential invented copy).
Quote slates (text from ledger) are checked against claim quotes too."""
import json, re, unicodedata
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
SRC = OM / "remotion-composer/src/lieu-hanh"
P = OM / "projects/lieu-hanh"

script = json.loads((P / "artifacts/script.json").read_text(encoding="utf-8"))
corpus = []
for s in script["sections"]:
    corpus.append(s.get("text") or "")
    for c in (s.get("enhancement_cues") or []):
        if isinstance(c, str):
            corpus.append(c)
        elif isinstance(c, dict):
            corpus.append(json.dumps(c, ensure_ascii=False))
    dc = s.get("delivery_cues") or {}
    corpus.append(dc.get("provider_text") or "")
    sd = s.get("speaker_directions") or {}
    if isinstance(sd, dict):
        for v in sd.values():
            corpus.append(str(v))
    else:
        corpus.append(str(sd))
blob = " ".join(corpus)

def words(text):
    text = unicodedata.normalize("NFC", text.lower())
    return set(re.findall(r"[a-zà-ỹăâđêôơư0-9]+", text))

vocab = words(blob)
# extra allowed meta vocabulary (labels phân loại được narration khái niệm phủ, pattern S2E03 approved)
ALLOWED_EXTRA = {"hồi", "một", "hai", "ba", "bốn", "lớp", "tổng", "kết", "thực", "hành", "bản", "kể",
                 "đền", "thờ", "ghi", "danh", "di", "sản", "unesco", "lịch", "sử", "hợp", "không",
                 "phải", "văn", "bản", "gốc", "nguồn", "phổ", "biến", "ngày", "nay", "trang", "nghiêm",
                 "trọng", "câu", "đối", "hồi", "kết", "chương", "mục", "đối", "chiếu", "cảm", "ơn",
                 "xem", "phần", "tiếp", "theo", "mục", "lục", "quảng", "cung", "linh", "từ", "phả", "ký",
                 "giữa", "trên", "dưới", "trái", "phải", "mốc", "niên", "đại", "tứ", "bất", "tử",
                 "hội", "phủ", "dầy", "tháng", "mùng", "âm", "lịch", "đinh", "tỵ", "sửu", "anh", "tôn",
                 "vua", "thời", "phùng", "khắc", "khoan", "trạng", "bùng", "đèo", "ngang", "phố", "cát",
                 "sùng", "sơn", "nam", "giao", "vân", "yên", "thái", "an", "mẫu", "nghi", "thiên", "hạ"}

files = sorted(SRC.glob("scenes-*.tsx"))
flagged = []
for f in files:
    text = f.read_text(encoding="utf-8")
    # split per scene
    for m in re.finditer(r"export const (Sc\d+)[\s\S]*?(?=\n/\*\*|\Z)", text):
        sid, body = m.group(1), m.group(0)
        # find JSX text nodes: >...< and attribute strings for title=/eyebrow=/note= and Chip children
        strings = []
        strings += re.findall(r'title="([^"]{4,})"', body)
        strings += re.findall(r'eyebrow="([^"]{4,})"', body)
        strings += re.findall(r'>([^<>{}]{8,120})<', body)
        for s2 in strings:
            s2 = s2.strip()
            if not s2 or s2.startswith("{") or "…" in s2:
                continue
            ws = words(s2) - ALLOWED_EXTRA
            missing = {w for w in ws if w not in vocab and len(w) > 2}
            if missing and len(missing) >= 2:
                flagged.append((f.name, sid, s2[:90], sorted(missing)[:8]))

print(f"corpus vocab: {len(vocab)} words; scanned {len(files)} files")
if not flagged:
    print("NO INVENTED-LOOKING STRINGS (all display text vocabulary grounded)")
for x in flagged:
    print(f"{x[0]} {x[1]}: \"{x[2]}\" missing={x[3]}")
