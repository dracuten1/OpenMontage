# Ký Chủ Điểm Tin — Daily News Digest Playbook

Playbook biên tập và sản xuất tự động hằng ngày cho tuyến **Điểm Tin Kinh Tế – Công Nghệ – Địa Chính Trị** trên kênh **Ký Chủ Điểm Tin** (`channels/ky-chu-diem-tin/`).

---

## 1. Phạm vi & Tiêu chí chọn 3–4 tin/tập

Mỗi tập điểm tin hằng ngày tổng hợp **3–4 tin tức nổi bật nhất trong 24 giờ qua** thuộc 3 trụ cột ưu tiên:

1. **Kinh tế / Thương mại / Thị trường:** Thuế quan, tỷ giá, vàng, lãi suất, lạm phát, xuất nhập khẩu, giá năng lượng, chuỗi cung ứng, FDI, chính sách tài khóa – tiền tệ tác động tới doanh nghiệp & người dân Việt Nam.
2. **Công nghệ / AI / Bán dẫn / Hạ tầng số:** Chính sách chip & AI lớn, hạ tầng dữ liệu, nền tảng số, an ninh mạng, dịch chuyển chuỗi cung ứng công nghệ liên quan tới thị trường & nhân lực Việt Nam.
3. **Địa chính trị / Ngoại giao kinh tế / Vận tải biển:** Xung đột, tuyến hàng hải, thương chiến Mỹ–Trung–EU, hiệp định thương mại hoặc biến động chuỗi cung ứng toàn cầu có hệ quả trực tiếp tới kinh tế Việt Nam.

### Quy tắc loại trừ & liên kết Việt Nam
- **Loại trừ:** Tin giải trí/showbiz, tin đồn chưa kiểm chứng, sự vụ địa phương đơn lẻ không có hàm ý kinh tế/công nghệ/vĩ mô.
- **Bắt buộc hướng tới người Việt (Rule #8):** Mọi tin quốc tế hay vĩ mô đều phải giải thích rõ sợi dây tác động tới **người tiêu dùng, người lao động, nhà đầu tư hoặc doanh nghiệp xuất nhập khẩu Việt Nam** (giá cả, đơn hàng, việc làm, cơ hội hoặc rủi ro).

---

## 2. Quy trình tìm & kiểm chứng nguồn tin 2 lớp (Dual-Layer Sourcing)

### Lớp 1 — Seed cùng ngày (tùy chọn)
- Kiểm tra thời gian sửa đổi (`mtime`) của:
  - `/Users/tuyennguyen/.hermes/cron/output/news-daily/latest-vn.md`
  - `/Users/tuyennguyen/.hermes/cron/output/news-daily/latest-world.md`
- **Chỉ đọc làm danh sách ứng viên ban đầu** nếu file được cập nhật **trong đúng ngày chạy (`YYYY-MM-DD`, `Asia/Ho_Chi_Minh`)**. Nếu cũ hơn, bỏ qua hoàn toàn.

### Lớp 2 — Live Search & Đối chiếu bắt buộc (Research v2)
- **Primary (Interactive / máy mở Chrome):** Dùng `gemini_web_search` (`tools/analysis/gemini_web_search.py` → `gemini.google.com/app` qua `agent-desktop` / `chrome_ax_helper.py`, tự động xoay vòng 3 profile `Default` → `Profile 2` → `Profile 5`, bật `--prefer-copy-code` để giữ nguyên URL nguồn) cho bước săn tin Google-grounded & tổng hợp đa nguồn (~0 token Antigravity).
- **Verification & Headless Fallback (bắt buộc để chốt số liệu):**
  - Không bao giờ xem tóm tắt của Gemini Web là `PRIMARY_FETCHED` — bắt buộc dùng **`web_url_read`** (SearXNG MCP) hoặc `curl -sL` đọc trực tiếp bài báo / công văn gốc để đối chiếu số liệu, ngày công bố và tên thực thể trước khi khóa vào `artifacts/fact_whitelist.json`.
  - Khi chạy nền / khóa màn hình / không mở Chrome GUI (hoặc Gemini Web chạm giới hạn cả 3 profile), tự động chuyển sang **`searxng_web_search`** (`time_range="day"`) + **`web_url_read`** (hoặc 9Router `web_search`).
  - **Fallback khi SearXNG bị rate-limit/CAPTCHA hoặc site chặn `web_url_read` (SSL/403):** Chuyển ngay sang `search_web` tích hợp (giải mã URL chuyển hướng bằng `curl -sIL -o /dev/null -w '%{url_effective}'`) kết hợp đọc trực tiếp trang chuyên mục bằng `web_url_read` trên các báo Việt Nam ổn định (`vnexpress.net/kinh-doanh`, `thanhnien.vn/kinh-te.htm`, `cafef.vn/vi-mo-dau-tu.chn`, `tuoitre.vn`, `dantri.com.vn`) để đảm bảo đủ bài gốc `PRIMARY_FETCHED`.
- Nguồn ưu tiên:
  - **Việt Nam:** `vnexpress.net`, `dantri.com.vn`, `thanhnien.vn`, `tuoitre.vn`, `cafef.vn`, `vneconomy.vn`, `baochinhphu.vn`.
  - **Quốc tế:** `reuters.com`, `apnews.com`, `bbc.com`, `cnbc.com`, `bloomberg.com`, `ft.com`.
- **Chuẩn xác minh:** Mỗi tin chính phải có **≥ 2 nguồn đối chiếu** (hoặc 1 nguồn báo chí/cơ quan gốc cấp 1 kèm dẫn chứng số liệu cụ thể).
- Toàn bộ số liệu, phần trăm, mốc thời gian, giá trị tiền tệ và tên thực thể phải được khóa chặt vào `artifacts/fact_whitelist.json` kèm `narration_form` tiếng Việt chuẩn (`tts_lexicon.json`). Tuyệt đối không suy diễn hoặc làm tròn tùy tiện ngoài whitelist.

---

## 3. Idempotency & Chống trùng lặp 72 giờ

- **Slug chuẩn theo ngày (`Asia/Ho_Chi_Minh`):** `projects/ky-chu-diem-tin/diem-tin-YYYYMMDD`.
- **Idempotency check:** Trước khi chạy research/sản xuất, đọc `channels/ky-chu-diem-tin/daily_digest_log.json`:
  - Nếu ngày `YYYY-MM-DD` / slug `diem-tin-YYYYMMDD` đã có `publish_status: "published"` → **dừng an toàn**, không sản xuất hoặc đăng lặp.
- **Dedup 72h:** Đối chiếu danh sách `topics` trong `daily_digest_log.json` (3 ngày gần nhất) và các thư mục gần đây trong `projects/ky-chu-diem-tin/`.
  - Không lặp lại tin chính đã lên sóng trong 72h qua.
  - Ngoại lệ duy nhất: có **diễn biến đột phá mới** trong 24h (mức thuế mới, con số mới, phán quyết mới) — khi đó phải gắn nhãn rõ `"Cập nhật mới"` và chỉ tập trung vào dữ kiện mới.

---

## 4. Kiến trúc phân cảnh chuẩn (8–12 cảnh, ~120–240 giây)

> Thời lượng và số cảnh hoàn toàn **linh hoạt theo độ sâu nội dung** (không ép trần cứng 60s/90s). Giữ câu đọc **≤ 140 ký tự**, ngắt câu rõ bằng `.`/`?`, mỗi cảnh **15–25s** với **2–4 nhịp chuyển động (`cueFrame`)**.

1. **`S01` — Cover Thumbnail + Hook (`~6–10s`):**
   - Frame `t = 0` là Cover Poster (tiêu đề **2–5 từ punchy**, highlight 1 từ khóa bằng `#FFD100` chữ `#0B0C0E` hoặc `#E11D2E` chữ trắng, kèm pill ngày `ĐIỂM TIN DD/MM`).
   - Lời đọc 2 câu ngắn dứt khoát, nêu trực diện 3–4 điểm nóng + tác động tới người Việt.
2. **`S02` — Bản đồ Điểm Tin (`~10–15s`):**
   - Tóm lược trực quan 3–4 đầu mục trong bản tin hôm nay bằng `FlowTimeline` hoặc `EditorialMap` (tuyệt đối cấm bullet slide chữ thuần).
3. **`S03..S(N-2)` — 3–4 Cụm tin phân tích (`2 cảnh / tin`, `~15–25s / cảnh`):**
   - **Cảnh A (Dữ kiện & Bằng chứng):** Trình bày sự kiện và số liệu cốt lõi bằng ảnh báo chí thật đã qua Vision check (`ArchivalSpotlight` + badge `NGUỒN: ...` / `ẢNH TƯ LIỆU <year>`) hoặc biểu đồ/bản đồ (`EditorialBarChart`, `EditorialLineChart`, `EditorialMap`).
   - **Cảnh B (Tác động tới Việt Nam):** Chuyển hóa tin vĩ mô/quốc tế thành hệ quả cụ thể cho người Việt (giá hàng hóa, tỷ giá, đơn hàng xuất khẩu, cơ hội/rủi ro ngành).
4. **`S(N-1)` — Trục tranh luận hướng tới người Việt (`~15–22s`):**
   - Tổng hợp điểm giao cắt hoặc đánh đổi lớn nhất trong ngày thành lựa chọn **A vs B** (`ComparisonSplit`), xoay quanh chiến lược/lợi ích của người Việt (tuân thủ Rule #8 trong `editorial-rules.md`).
5. **`SN` — Outro + `<BrandBumper />` (`~8–12s`):**
   - CTA mời khán giả bình luận chọn A hoặc B + theo dõi kênh **Ký Chủ Điểm Tin**.
   - `<BrandBumper />` (`BRAND_BUMPER_FRAMES = 90`) chỉ đặt ở cuối cảnh này, không bao giờ đặt ở `from={0}`.

---

## 5. Chuẩn kỹ thuật Audio & Remotion (OpenMontage v3.0)

- **BGM mặc định:** `tech-news-broadcast-bed.m4a` (nếu cả 3–4 tin đều thuần phân tích vĩ mô/tài chính chuyên sâu, có thể chọn `data-and-systems.m4a`).
- **Audio Lock CLI:**
  ```bash
  cd /Users/tuyennguyen/project/OpenMontage && PYTHONPATH=/Users/tuyennguyen/project/OpenMontage /Users/tuyennguyen/project/OpenMontage/.venv/bin/python tools/audio/build_episode_audio.py --project projects/ky-chu-diem-tin/diem-tin-<YYYYMMDD> --channel ky-chu-diem-tin --bgm tech-news-broadcast-bed.m4a --write-entry
  ```
- **SFX:** Copy 5 file SFX chuẩn từ `music_library/sfx/` vào `remotion-composer/public/diem-tin-<YYYYMMDD>/sfx/`.
- **Remotion TSX:** Tách `S01.tsx..SNN.tsx` + `Episode.tsx` trong `remotion-composer/src/diem-tin-<YYYYMMDD>/` (tham chiếu mẫu chuẩn [`remotion-composer/src/my-thue-quan-14-doi-tac-20261126/`](file:///Users/tuyennguyen/project/OpenMontage/remotion-composer/src/my-thue-quan-14-doi-tac-20261126/)). Tuân thủ Safe Zone v3.2 (`y: 350..1420`, `x: 90..940`), import tĩnh `captions.json`, `cueFrame(sectionId, phrase, fallback)`, không Card-itis.
- **Ship & Gate C:** Chạy fail-closed qua `tools/qc/ship_episode.py --project projects/ky-chu-diem-tin/diem-tin-<YYYYMMDD> --comp diem-tin-<YYYYMMDD>-FINAL` và kiểm tra trực tiếp `qc/gate_c_frames/` bằng `read_file` trước khi đăng.
