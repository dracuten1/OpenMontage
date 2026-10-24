"""Fix vòng 3 — 3 anchor mép còn lại."""
from pathlib import Path

BASE = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/src/chu-dong-tu")
FIX = [
    ("scenes-e.tsx", 496, 'A("gặp nhau ở đúng một dòng nước")', 'A("một chiếc khố nhỏ đến thế")'),
    ("scenes-e.tsx", 142, 'A("chín làng trong Tổng Mễ xưa")', 'A("nhịp ấy vẫn đang chạy")'),
    ("scenes-f.tsx", 174, 'A("Và vẫn dành một chỗ thờ")', 'A("cho kẻ nghèo nhất xóm bãi")'),
]
by_file = {}
for f, ln, old, new in FIX:
    by_file.setdefault(f, []).append((ln, old, new))
for f, edits in by_file.items():
    p = BASE / f
    lines = p.read_text().split("\n")
    for ln, old, new in edits:
        i = ln - 1
        assert old in lines[i], f"{f}:{ln} missing {old!r}"
        lines[i] = lines[i].replace(old, new)
    p.write_text("\n".join(lines))
    print(f, "applied", len(edits))
