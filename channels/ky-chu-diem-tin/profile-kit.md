# Ký Chủ Điểm Tin — TikTok Profile & Publishing Kit

## 1. Thông tin kênh (Channel Identity)
- **Tên hiển thị (Display Name):** `Ký Chủ Điểm Tin`
- **Tuyến nội dung:** Điểm tin Kinh tế – Công nghệ – Địa chính trị có tác động trực tiếp tới Việt Nam
- **Chrome Profile đăng tải (TikTok Studio):** `Profile 2` (`Tuyên` / `nguyenleminhtuyen99@gmail.com`)
- **URL Upload:** `https://www.tiktok.com/tiktokstudio/upload`

---

## 2. Quy chuẩn Caption TikTok SEO (`description_tiktok_final.txt`)

1. **80–100 ký tự đầu:** Đặt hook + từ khóa của tin nóng nhất ngày lên ngay dòng đầu tiên (không chào hỏi dài dòng).
2. **Tóm tắt ngắn + Mốc thời gian (`Mốc nội dung:`):** Liệt kê 3–4 đầu tin chính theo đúng timestamp trong `scene_timing` / `captions.json` (`00:00`, `00:25`, ...).
3. **Câu hỏi tranh luận A/B hướng tới người Việt:** Kêu gọi khán giả chọn phe A hoặc B (liên quan tới túi tiền, công việc, doanh nghiệp hoặc lựa chọn của người Việt) và theo dõi kênh **Ký Chủ Điểm Tin**.
4. **Hashtags:** Chọn **3–5 hashtag chủ đề** liên quan trực tiếp tới các tin trong ngày (tối đa 5, luôn có `#KyChuDiemTin` hoặc `#DiemTinKinhTe`). **Cấm tuyệt đối** `#fyp`, `#foryou`, `#foryoupage`, `#xuhuong`.

### Mẫu khung chuẩn
```text
[80–100 ký tự hook + từ khóa tin tâm điểm hôm nay]

Bản tin Điểm Tin ngày DD/MM tổng hợp [3–4] diễn biến Kinh tế, Công nghệ và Địa chính trị đáng chú ý nhất tác động tới Việt Nam.

Bạn chọn A ([lựa chọn A cho người Việt]) hay B ([lựa chọn B cho người Việt])? Bình luận A hoặc B và theo dõi Ký Chủ Điểm Tin!

Mốc nội dung:
00:00 Điểm nóng hôm nay
00:12 [Tin 1 — ...]
00:48 [Tin 2 — ...]
01:25 [Tin 3 — ...]
02:00 Góc nhìn tranh luận & câu hỏi cho người Việt

#DiemTinKinhTe #CongNghe #DiaChinhTri #VietNam #KyChuDiemTin
```

---

## 3. Chính sách đăng bài Fail-Closed (`tiktok_studio_upload.py`)
- Chỉ gọi đăng tự động lên `Profile 2` khi **100% QC gates** (`ship_episode.py` + `gate_c_verify.py` + Vision QA `qc/gate_c_frames/`) đều đạt `PASS`.
- Nếu helper báo `AUTH_OR_CAPTCHA_BLOCKED` (chưa đăng nhập hoặc hiện CAPTCHA) hoặc `ACCESSIBILITY_UNAVAILABLE` (màn hình đang khóa), **dừng đăng ngay lập tức** — tuyệt đối không vượt CAPTCHA; giữ nguyên `renders/final.mp4` và `description_tiktok_final.txt` để owner đăng thủ công.
