"""Fix vòng 2 — thay A() phrase theo (file, dòng-nối-tiếp, cũ, mới) đã chọn tay từ window text."""
from pathlib import Path

BASE = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/src/chu-dong-tu")
FIX = [
    ("scenes-a.tsx", 58, 'A("trên sông Hồng.")', 'A("du thuyền rước nước trên sông Hồng")'),
    ("scenes-a.tsx", 451, 'A("người kiểm kê")', 'A("Tôi chỉ lần theo các vật")'),
    ("scenes-b.tsx", 61, 'A("kẻ không có nổi man vải")', 'A("hai thế giới cách nhau bởi một tấm màn")'),
    ("scenes-b.tsx", 183, 'A("Hồi hai bắt đầu ở phố chợ")', 'A("tới lượt gậy, nón, và nước")'),
    ("scenes-c.tsx", 185, 'A("Chuyến thuyền ấy")', 'A("Hồi ba bắt đầu từ đây")'),
    ("scenes-c.tsx", 248, 'A("lấy uống nước")', 'A("cùng lái buôn đi buôn bán")'),
    ("scenes-c.tsx", 329, 'A("ở lại học phép")', 'A("tên gọi Phu Quang")'),
    ("scenes-c.tsx", 330, 'A("Chỉ một dòng")', 'A("trong am có sư")'),
    ("scenes-d.tsx", 149, 'A("Sách chép")', 'A("Chỉ một câu hành quân")'),
    ("scenes-e.tsx", 102, 'A("người thờ")', 'A("tôi dẫn theo bài công bố")'),
    ("scenes-e.tsx", 142, 'A("quy mô của lễ")', 'A("chín làng trong Tổng Mễ xưa")'),
    ("scenes-e.tsx", 349, 'A("Nhân dân làm gì để tưởng nhớ")', 'A("không nằm trên trang sách")'),
    ("scenes-e.tsx", 496, 'A("chiếc khố")', 'A("gặp nhau ở đúng một dòng nước")'),
    ("scenes-e.tsx", 570, 'A("chiếc khố")', 'A("gặp nhau ở đúng một dòng nước")'),
    ("scenes-e.tsx", 571, 'A("Màn che")', 'A("không phải một bằng chứng lịch sử")'),
    ("scenes-e.tsx", 572, 'A("Phố chợ")', 'A("một câu biên tập của tôi")'),
    ("scenes-e.tsx", 573, 'A("thuyền buôn")', 'A("từ truyện tới hôm nay")'),
    ("scenes-f.tsx", 98, 'A("Những điều ta biết rõ lắm")', 'A("người Việt vẫn rước nước")'),
    ("scenes-f.tsx", 174, 'A("có những điều ta biết rõ lắm")', 'A("Và vẫn dành một chỗ thờ")'),
    ("scenes-f.tsx", 176, 'A("thắp hương")', 'A("cách truyện ấy nhìn người nghèo")'),
    ("scenes-f.tsx", 305, 'A("một người phụ nữ")', 'A("Còn một người")'),
    ("scenes-f.tsx", 351, "A(\"ở lại' mỗi tập, một truyền thuyết,\")", 'A("mỗi tập, một truyền thuyết")'),
]
by_file = {}
for f, ln, old, new in FIX:
    by_file.setdefault(f, []).append((ln, old, new))
for f, edits in by_file.items():
    p = BASE / f
    lines = p.read_text().split("\n")
    for ln, old, new in edits:
        i = ln - 1
        assert old in lines[i], f"{f}:{ln} missing {old!r}: {lines[i][:80]}"
        lines[i] = lines[i].replace(old, new)
    p.write_text("\n".join(lines))
    print(f, "applied", len(edits))
print("TOTAL", len(FIX))
