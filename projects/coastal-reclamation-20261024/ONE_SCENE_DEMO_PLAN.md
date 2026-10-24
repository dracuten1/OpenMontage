# KẾ HOẠCH DEMO 1 CẢNH (ONE-SCENE DEMO PLAN)
**Dự án:** `coastal-reclamation-20261024`  
**Tập/Chủ đề:** Lấn biển thay đổi dòng chảy và rừng ngập mặn như thế nào?  
**Pha áp dụng:** Demo-first gate (chỉ thực hiện sau khi Owner phê duyệt Proposal này)  
**Thời lượng demo:** 10.0 giây (300 frames @ 30fps)  
**Định dạng:** Mobile Vertical 9:16 (1080x1920), Draft HUD 720p  

---

## 1. Mục tiêu của Cảnh Demo
1. **Kiểm chứng thẩm mỹ thị giác (Aesthetic Proof of Concept):** Kiểm tra phong cách đồ họa isometric khoa học, độ tương phản màu sắc (Deep Marine/Teal/Cát trầm) và cách tích hợp nhãn "HÌNH MINH HỌA / SƠ ĐỒ NGUYÊN LÝ".
2. **Kiểm chứng cơ chế chuyển động Remotion Atelier:** Đánh giá chuyển động của các hạt dòng chảy (streamline particles) và đường bình độ sâu đáy biển (bathymetry contours) được sinh theo thuật toán vector Remotion độc lập trên nền ảnh AI.
3. **Kiểm chứng âm thanh & Giọng đọc:** Kiểm tra chất lượng giọng đọc vieneu TTS tiếng Việt tại nhịp độ atempo 0.87, độ cân bằng với nhạc nền ambient (-24 LUFS).
4. **Kiểm chứng Draft HUD & Bundle Thumbnail:** Đo đạc kích thước thumbnail độc lập (1080x1920) bằng PIL, kiểm tra vùng an toàn (safe areas) và chuẩn bị bản mô tả copyable.

---

## 2. Kịch bản chi tiết Cảnh 1 (Scene 1: Opening Hook)

### 2.1. Lời thoại (Narration) & Âm thanh
- **Display Text (Hiển thị):** "Lấn biển: Dòng hải lưu và Rừng ngập mặn thay đổi ra sao?"
- **Provider Text (Đưa vào vieneu TTS):** "Khi lấn một mét đất ra biển, dòng hải lưu và rừng ngập mặn xung quanh sẽ thay đổi ra sao?"
- **Thời lượng dự kiến:** ~4.5 - 5.0 giây (phần thời gian còn lại giữ nhịp trực quan và mở ra sơ đồ nguyên lý).
- **Voice model:** vieneu runner cục bộ (`vieneu_cli.py`), giọng Thiện Minh hoặc Trúc Ly.
- **BGM:** Nhạc nền ambient tối giản từ `~/project/media-library/bgm`, cắt fade-in/fade-out, chuẩn hóa Loudnorm -24 LUFS.

### 2.2. Bố cục thị giác (Visual Staging & Remotion Atelier)
Khung hình chia theo trục đứng 9:16 (1080 x 1920):
1. **Lớp nền (Background Layer):**
   - 1 ảnh nền Isometric 3D mô phỏng mặt cắt bờ biển và bãi triều nguyên sơ sinh qua 9router (`cx/gpt-5.6-luna-image` hoặc `ag/gemini-3.1-flash-image`, chi phí $0).
   - Nhãn góc trên: `[ HÌNH MINH HỌA / SƠ ĐỒ NGUYÊN LÝ ]` (font chữ kỹ thuật, nền mờ bán trong suốt, kích thước rõ ràng).
2. **Lớp chuyển động Vector (Remotion Atelier SVG/Canvas Layer):**
   - **Đường đẳng sâu (Bathymetry depth contours):** Các đường viền cao trình đáy biển (0m, -5m, -10m) sáng mờ dần theo hiệu ứng vẽ nét (strokeDashoffset animation).
   - **Hạt dòng hải lưu (Current streamlines):** Dải hạt ánh sáng cyan (#00b4d8) trôi êm ả men theo bờ biển tự nhiên theo hàm sin toán học, biểu thị dòng triều và dòng ven bờ trước khi có công trình.
   - **Vùng đệm rừng ngập mặn:** Biểu tượng các cụm rễ đước/mắm viền xanh lục (#2a9d8f) với hiệu ứng sóng biển bị triệt tiêu biên độ khi đi qua.
3. **Lớp tiêu đề & Phụ đề (Typography Overlay):**
   - Tiêu đề câu hỏi mở đầu xuất hiện mạnh mẽ trong 2 giây đầu, sau đó thu nhỏ lên thanh header.
   - Phụ đề karaoke/word-level highlight chạy ăn khớp tuyệt đối theo per-word timestamps từ `narration_words.json`.
4. **Lớp Debug HUD (Draft HUD):**
   - Góc dưới trái: `S1 f{global_frame} {sec}s [{frame_in_scene}/300]` (tắt được qua prop `debug=false` khi chuyển sang final).

---

## 3. Quy trình thực hiện chi tiết (Sau khi được duyệt)

```
[Owner duyệt Proposal]
        │
        ▼
[Bước 1: Probe 1 ảnh 9router ($0)]
   → Model: cx/gpt-5.6-luna-image (fallback ag/gemini-3.1-flash-image)
   → Lưu tại: projects/coastal-reclamation-20261024/assets/images/sc01_bg.png
   → Đo kích thước thực tế bằng PIL (chống biến dạng)
        │
        ▼
[Bước 2: Tạo giọng đọc Scene 1 ($0)]
   → vieneu_tts tạo sc01_voice.wav (atempo 0.87)
   → Transcriber trích xuất narration_words.json (khóa speech-lock)
        │
        ▼
[Bước 3: Lập trình Component Remotion Atelier]
   → src/coastal-reclamation-20261024/Scene01Demo.tsx
   → Đăng ký Composition ID: CoastalReclamationDemo
   → Kiểm tra compile: npx tsc --noEmit
        │
        ▼
[Bước 4: Thiết kế Thumbnail Độc Lập]
   → 1080x1920 PNG độc lập theo SSOT contract
   → Tiêu đề lớn, bố cục an toàn, đo PIL + Vision QC
        │
        ▼
[Bước 5: Render Draft 720p có HUD]
   → npx remotion render CoastalReclamationDemo out/demo_s1_draft.mp4
   → ffprobe kiểm tra thông số (codec h264, aac, fps 30)
        │
        ▼
[Bước 6: Trình duyệt Owner (Gate 2)]
   → Gửi kèm: Video demo HUD + Thumbnail PNG + Scene Index + Description mẫu
   → Đợi Owner phê duyệt thẩm mỹ trước khi sản xuất hàng loạt
```

---

## 4. Tiêu chí Đạt / Không đạt (QC Acceptance Criteria)
- [ ] **Thẩm mỹ:** Không có viền đen, không chữ chồng chữ, không artifact hình ảnh AI kỳ dị.
- [ ] **Khoa học:** Đồ họa thể hiện đúng mặt cắt bờ biển và độ sâu, nhãn minh họa rõ ràng, không thông tin sai lệch.
- [ ] **Đồng bộ âm thanh:** Từ ngữ trên hình xuất hiện lệch không quá ±0.3s so với giọng đọc thực tế.
- [ ] **Bundle đầy đủ:** Gồm video demo + file ảnh thumbnail PNG riêng biệt + mô tả copyable.
