# PRODUCTION REPORT — VN-Myth S3E02: Sử thi Đăm Săn (`Klei Khan Y Đam San`)

- **Project ID / Slug:** `dam-san` (`dam-san-FINAL` / `dam-san-DRAFT` / `dam-san-PREVIEW`)
- **Góc kể:** Concept `c1` — *«Vì sao người anh hùng mạnh nhất Tây Nguyên lại thất bại khi cầu hôn Nữ thần Mặt Trời?»*
- **Kiến trúc thị giác:** Hybrid **Blender 5.2.2 LTS** (`10 animated 3D clips EEVEE + BlenderKit 1080p @ 30fps, 10.0s` + `20 renders Cycles 64 samples Metal GPU`) × **Remotion Atelier** (30 scenes + 12 bespoke infographics + 3D-tracked callouts)
- **Trạng thái:** `final_delivered_awaiting_human_upload` (`checkpoint_publish.json`: `awaiting_human`, `human_approved: false`, không tự đăng bài)

## 1. Deliverables & SHA-256 Checksums

| Artifact | Path | Size | SHA-256 |
|---|---|---:|---|
| **FINAL Master 1080p** (0 caption, 0 HUD) | `projects/dam-san/renders/dam-san-final-1080p.mp4` | `572,439,588 B` | `0d8715cf970d175bdf8b204989db7fceac4f0ca9e61d2c6b8a76f096a733c997` |
| **Thumbnail 1280×720** | `projects/dam-san/deliverables/dam-san-thumbnail-1280x720.jpg` | `182,285 B` | `4ddbd42c9fcbba0ed59ca7ee34c7ea9971b6aa43a775e7c9e405a5692849b208` |
| **Sidecar Phụ đề SRT** | `remotion-composer/public/dam-san/captions.srt` | `21,658 B` | `414eb2faf0707a527687a4e3bbd50c84eb6f4a2771d77b61f5d00dc5d4934432` |
| **Mô tả YouTube** | `projects/dam-san/deliverables/YOUTUBE_DESCRIPTION.md` | `2,749 B` | `79706f8a728eadf7f2a8d7a59356cddd10c1229d7627909d6d618d4eab671edc` |

## 2. Thông số kỹ thuật & Kiểm định

| Hạng mục | Kết quả đo thực tế |
|---|---|
| **Research Seal v1** | `/Users/tuyennguyen/project/vn-myth-series/episodes/S3E02-dam-san/research/v1/` — 15 claims, 33/33 citations `PASS_RAW`, 27 raw snapshots |
| **TTS & Alignment** | 30/30 đoạn VieNeu local 48kHz (`669.12s` raw audio, `2766` từ Whisper aligned) -> tổng master `686.20s` (`20586` frames @ 30fps) |
| **3D Blender + BlenderKit** | 10 animated `.blend` (`blender_anim/`) + 10 animated video clips (`1920×1080 @ 30fps`, `10.0s` one-way EEVEE + BlenderKit) + 20 Cycles PNG stills (`1920×1080`, `AgX`, OIDN) |
| **Video Stream (`ffprobe`)** | `h264` `1920×1080` @ `30fps` + `aac` `48000Hz` |
| **Loudness (`ebur128`)** | Integrated: `-14.4 LUFS` · LRA: `2.1 LU` · BGM: `The Complex` (CC-BY-4.0) |
| **Checkpoints** | Đủ 8 checkpoint validated schema (`research`, `proposal`, `script`, `scene_plan`, `assets`, `edit`, `compose` = `completed`; `publish` = `awaiting_human`) |
