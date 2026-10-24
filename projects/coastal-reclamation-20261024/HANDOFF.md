# HANDOFF — COASTAL RECLAMATION INFOGRAPHIC (FULL EPISODE)
**Project ID:** `coastal-reclamation-20261024`  
**Pipeline:** `animated-explainer`  
**Thời điểm cập nhật:** 2026-10-24  
**Chủ đề:** Lấn biển thay đổi dòng chảy và rừng ngập mặn như thế nào? (Infographic khoa học $0-first)  
**Trạng thái hiện tại:** `awaiting_human` (Đã hoàn thành toàn bộ tập Full Draft HUD 720p — Dừng tại cổng duyệt phê duyệt trước khi xuất bản)

---

## 1. Trạng thái các Stage & Checkpoint

| Stage | Artifact chính | Trạng thái Checkpoint | Ghi chú kiểm định |
|---|---|---|---|
| **research** | `research_brief.json`, `claim_ledger.json` | `completed` | Hợp lệ schema. 5 nguồn khoa học quốc tế (Nature, Springer, USGS, Frontiers, UNEP). |
| **proposal** | `proposal_packet.json`, `decision_log.json` | `completed` | Owner đã duyệt Concept c1 ("Bản đồ dòng chảy vô hình"). |
| **sample / demo** | `coastal_demo_s1_draft_hud_720p.mp4` | `completed` | Owner xem và duyệt thẩm mỹ ngày 2026-10-24 với lệnh "ok làm tiếp". |
| **script** | `script.json` (6 scenes, 118s) | `completed` | Hợp lệ `script.schema.json`. Trung lập, khách quan, không nhắm vào doanh nghiệp hay dự án cụ thể. |
| **scene_plan** | `scene_plan.json` (6 scenes) | `completed` | Hợp lệ `scene_plan.schema.json`. Bố cục isometric, vector flow, callout cards. |
| **assets** | `asset_manifest.json` | `completed` | Hợp lệ `asset_manifest.schema.json`. 6 ảnh AI 1024x1792 ($0 qua 9router), 6 audio TTS vieneu 48kHz, ASR faster-whisper word-level, BGM -24 LUFS. |
| **edit** | `edit_decisions.json` | `completed` | Hợp lệ `edit_decisions.schema.json`. Timeline 6 cảnh 97.0s (2910 frames @ 30fps), karaoke subtitles. |
| **compose** | `render_report.json` | `completed` | Hợp lệ `render_report.schema.json`. Render bản Full Draft HUD 720p (57.4 MB) và bản preview CRF 26 (15.5 MB). |
| **publish** | `publish_log.json` | `awaiting_human` | Hợp lệ `publish_log.schema.json`. DỪNG TẠI CỔNG DUYỆT (không auto-post, chờ Owner duyệt bản draft full). |

---

## 2. Đường dẫn tuyệt đối của các Artifacts

- **Project marker:** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/project.json`
- **Research Brief:** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/research_brief.json`
- **Claim Ledger:** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/claim_ledger.json`
- **Decision Log:** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/decision_log.json`
- **Script (Kịch bản 6 cảnh):** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/script.json`
- **Scene Plan (Phân cảnh):** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/scene_plan.json`
- **Asset Manifest:** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/asset_manifest.json`
- **Edit Decisions:** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/edit_decisions.json`
- **Render Report:** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/render_report.json`
- **Publish Log:** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/publish_log.json`
- **Scene Index Table:** `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/scene_index_reclamation.md`

### Media Files & Renders
- **Full Video Draft HUD 720p (Master):**  
  `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/renders/coastal_reclamation_draft_hud_720p.mp4`
- **Full Video Draft HUD 720p (CRF 26 Fast Preview):**  
  `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/renders/coastal_reclamation_draft_hud_720p_crf26.mp4`
- **Thumbnail Thiết kế Độc lập (1080x1920 PNG):**  
  `/Users/tuyennguyen/project/OpenMontage/projects/coastal-reclamation-20261024/exports/thumbnails/coastal-reclamation-1080x1920.png`
- **Mã nguồn Remotion Episode:**  
  `/Users/tuyennguyen/project/OpenMontage/remotion-composer/src/coastal-reclamation-20261024/Episode.tsx`
- **Mã nguồn Remotion Thumbnail:**  
  `/Users/tuyennguyen/project/OpenMontage/remotion-composer/src/coastal-reclamation-20261024/Thumbnail.tsx`

---

## 3. Bảng Phân Cảnh Chi Tiết (Scene Index)

| Cảnh | Frames | Thời gian | Section ID | Tiêu đề cảnh | Trọng tâm thị giác & Vector Atelier |
|---|---|---|---|---|---|
| **Scene 1** | 0 – 300 | 00:00 – 00:10 | `sec-01` | **Hook & Mở đầu** | Lát cắt 3D bờ biển nguyên sơ, đường đẳng sâu bathymetry (0m, -5m, -10m), luồng hạt hải lưu cyan, câu hỏi mở đầu về tác động lấn biển. |
| **Scene 2** | 300 – 840 | 00:10 – 00:28 | `sec-02` | **Lăng kính triều & Biến đổi độ sâu** | Thu hẹp mặt cắt lăng kính triều ($Q = A \times V$), vector vận tốc cam gia tốc tại eo hẹp, xoáy nước tù đọng. |
| **Scene 3** | 840 – 1410 | 00:28 – 00:47 | `sec-03` | **Cân bằng bùn cát & Xói lở ven bờ** | Đê kè vuông góc ngắt dòng cát dọc bờ (longshore drift), bồi tụ phía đón dòng (updrift), cảnh báo sạt lở phía khuất dòng (downdrift). |
| **Scene 4** | 1410 – 2010 | 00:47 – 01:07 | `sec-04` | **Rừng ngập mặn thở thế nào?** | Lát cắt rễ thở (pneumatophores), sóng giảm >70% khi qua rễ, cơ chế trao đổi khí qua triều rút, nguy cơ ngạt khi bồi lấp nhanh. |
| **Scene 5** | 2010 – 2490 | 01:07 – 01:23 | `sec-05` | **Kỹ thuật sinh thái thích ứng** | Đảo mở có kênh lưu thông triều, nuôi bãi định kỳ, vành đai đệm rừng ngập mặn tiêu năng tự nhiên. |
| **Scene 6** | 2490 – 2910 | 01:23 – 01:37 | `sec-06` | **Cân bằng động & Thông điệp kết** | Toàn cảnh bờ biển cân bằng sinh thái, thông điệp triết lý khoa học về hệ thống cân bằng động và phát triển bền vững. |

---

## 4. Thông số Kỹ thuật & Kiểm định Chất lượng (QC Report)

### 4.1. Video Full Draft HUD 720p
- **Độ phân giải:** 720 x 1280 (Tỷ lệ dọc 9:16)
- **Tốc độ khung hình:** 30.0 fps (Tổng cộng 2910 frames)
- **Thời lượng:** 97.05 giây (1 phút 37 giây)
- **Codec Video:** H.264 / AVC (High profile)
- **Codec Audio:** AAC stereo 48kHz
- **Dung lượng file:**
  - Master Remotion 720p: 57.4 MB (57,384,677 bytes)
  - Fast Preview CRF 26: 15.5 MB (15,963,136 bytes) — Tối ưu truyền tải nhanh qua Telegram/Mobile
- **Kiểm định trực quan (Vision QC):**
  - **Nhãn phân loại:** `[ HÌNH MINH HỌA / SƠ ĐỒ NGUYÊN LÝ ]` hiển thị xuyên suốt ở góc trên trái, xếp chồng gọn gàng ngay dưới thanh chương, không bị che khuất.
  - **Dynamic Vector Graphics:** Đường đẳng sâu bathymetry, hạt luồng chảy chuyển động hàm sin, vector gia tốc qua eo thắt, groyne chặn cát, rễ thở và sóng tiêu tán hiển thị sắc nét.
  - **Kinetic Subtitles:** Karaoke speech-lock đồng bộ từng từ từ `faster-whisper`, dấu tiếng Việt chuẩn 100%, tự động nâng vị trí khi có thẻ callout khoa học xuất hiện.
  - **Draft HUD:** Góc dưới trái hiển thị dạng `S{n} f{global} {sec}s [{f_scene}/{dur_scene}]` chính xác theo từng frame.

### 4.2. Thumbnail Độc lập (1080x1920 PNG)
- **Kích thước đo đạc thực tế (PIL):** 1080 x 1920 px
- **Định dạng:** PNG, chế độ màu RGB
- **Engine kết xuất:** Remotion Chromium (`Thumbnail.tsx`)
- **Kiểm định:** Độ tương phản cao, typography tiếng Việt có dấu hoàn hảo, an toàn vùng hiển thị UI mạng xã hội.

---

## 5. Bản sao chép mạng xã hội hoàn chỉnh (Copyable Social Text)

**Tiêu đề:**  
Lấn Biển & Thủy Động Lực: Dòng hải lưu và rừng ngập mặn thay đổi ra sao? 🌊🌱

**Mô tả:**  
Lấn biển không đơn thuần là việc mở rộng quỹ đất, mà là sự can thiệp trực tiếp vào một hệ thống cân bằng động ven bờ vốn vô cùng nhạy cảm. 

Khi một dải đất hay bờ kè nhân tạo vươn ra biển, dòng hải lưu sẽ phản ứng thế nào? Tại sao một bên bờ được bồi thêm cát trong khi phía đối diện lại sạt lở dữ dội? Và hệ thống rễ thở của rừng ngập mặn sẽ ra sao khi nguồn nước và trầm tích bị xáo trộn?

Hãy cùng phân tích 3 nguyên lý vật lý và sinh thái học then chốt dưới góc nhìn khoa học khách quan:

⏱️ **TIMESTAMPS / DANH MỤC CÁC PHẦN:**  
00:00 - Phần 1: Hook & Câu hỏi cốt lõi  
00:10 - Phần 2: Lăng kính triều & Biến đổi độ sâu đáy biển  
00:28 - Phần 3: Cân bằng bùn cát & Hiện tượng xói lở ven bờ  
00:47 - Phần 4: Rừng ngập mặn hô hấp thế nào?  
01:07 - Phần 5: Giải pháp công trình sinh thái thích ứng  
01:23 - Phần 6: Cân bằng động & Thông điệp phát triển bền vững  

📌 **3 CƠ CHẾ KHOA HỌC THEN CHỐT:**  
1. 🌊 **Lăng kính triều (Tidal Prism - Q = A × V):** San lấp thu hẹp diện tích mặt cắt ngập triều làm gia tốc dòng chảy tại các eo thắt, cuốn trôi bùn đáy và tạo vùng nước quẩn tù đọng phía sau kè.  
2. 🏖️ **Cân bằng bùn cát (Longshore Drift):** Đê kè vuông góc chặn đứng dòng cát dọc bờ, gây bồi lắng dày đặc ở bờ đón dòng nhưng làm đói cát và sạt lở nghiêm trọng ở bờ khuất dòng.  
3. 🌿 **Rừng ngập mặn thở (Pneumatophores):** Bộ rễ tiêu tán 70-80% năng lượng sóng biển nhưng bắt buộc phải có chu kỳ triều rút để hô hấp. Bồi lấp bùn quá nhanh hoặc tù đọng nước sẽ bít kín lỗ thở làm chết cây.  

*Lưu ý: Video nhằm mục đích phổ biến kiến thức khoa học khách quan. Mọi đồ họa là sơ đồ nguyên lý minh họa, tác động thực tế phụ thuộc vào đặc tính địa hình và giải pháp kỹ thuật của từng dự án.*

🔖 **HASHTAGS:**  
#KhoaHoc #DiaLy #ThuyDongLuc #LanBien #RungNgapMan #MoiTruong #BienDong #Infographic #HocMoiNgay
