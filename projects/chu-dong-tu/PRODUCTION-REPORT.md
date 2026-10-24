# PRODUCTION REPORT — VN-Myth S2E03 "Chử Đồng Tử" — update 2026-10-19 (12:20 +07)

Trạng thái: **FINAL DELIVERED — LANE ĐÓNG.** Owner duyệt draft ("Duyệt", 2026-10-19 11:44 +07) → final sạch render từ ĐÚNG nguồn draft (ChuDongTuDraft, draftHud=false), QC PASS, DM đã gửi (msg 387 video + 388 caption). Owner tự upload — KHÔNG auto-post.

## Update FINAL (2026-10-19, session 20261019_020840_82fb79)

|| Việc | Kết quả | Bằng chứng |
|---|---|---|---|
| Fingerprint nguồn | PASS | 34 file src/public sha256; "Source newer than draft: []" — nguồn không đổi sau APPROVE (qc/final_source_manifest.json) |
| Master 1080p | DONE | renders/s2e03_final_1080p.mp4 — 1920×1080, 26.078f @30fps, 869.312s, 159,32MB, CRF 22, render ~23' exit 0 |
| Preview 720p | DONE | renders/s2e03_final_720p.mp4 — 1280×720, 26.078f, 869.312s, 42,22MB ≤50MB (CRF 26 từ master, lanczos, audio 128k) |
| QC ffprobe/loudness | PASS | duration 869.312s khớp draft ±0.1s; frames 26.078/26.078; loudness Δ master 0,00 LU / preview 0,05 LU (≤0,5) |
| Vision 3 điểm | PASS 3/3 | 30s/435s/860s: KHÔNG HUD ở cả 2 bản final, nội dung khớp draft (frame-diff ngoài band HUD 1,17–2,00/255 = encode noise); qc/final_frames/*.png |
| ASR/anchor re-run | SKIP (đúng luật) | nguồn không đổi — theo FINAL directive |
| Checkpoints | DONE | assets/edit/compose/publish = completed + human_approved=true; publish ghi owner terse-approve "Duyệt"; decision_log +d-008-final-delivered; qc/final_checkpoint_validation.json |
| Deliver DM | DONE | TG msg 387 (preview 42,2MB) + 388 (caption QC + master path 159,3MB >50MB → path only); qc/final_delivery.json |
| Draft rollback | GIỮ NGUYÊN | s2e03_draft_hud_720p.mp4 (84,5MB) + s2e03_draft_hud_720p_50mb.mp4 (48,3MB) không đụng |

Metadata upload (title/description/TIMESTAMPS 5 mốc verify + credit Mesmerize): `exports/metadata/youtube.json`. QC đầy đủ: `qc/final_qc.json` (status=pass).

## Update batch toàn tập (2026-10-19, session 20261019_020840_82fb79)

| Việc | Kết quả | Bằng chứng |
|---|---|---|
| TTS 32 section | DONE | narration_full.wav 867.24s, 3571 từ; DP min 0.85 (s08, floor đã duyệt ở probe); 0 zero-duration/long-gap; narration_words.json canonical |
| Ảnh batch | DONE | 13 plates (12 mới + demo_s03_kho.jpg reuse); probe 1 ảnh trước batch; không DNA; desc vật-thể theo S2-BIBLE §4 |
| BGM | DONE | Mesmerize (đã duyệt ở proposal) 870s loudnorm −24 LUFS; credit + TIMESTAMPS đã vào exports/metadata/youtube.json |
| Compose 63 scenes | DONE | scenes-a..f.tsx qua CC 4 nhóm (scaffold-first); speech-window strict; Root ChuDongTuDraft = ChuDongTuEpisode + draftHud |
| Anchor audit strict | PASS 203/203 | artifacts/anchor_audit_strict.json: 0 overflow, 0 bad fraction; 3 vòng fix A() phrase (25 chỗ) |
| tsc --noEmit | exit 0 | chạy cuối cùng trước render |
| scene_sweep full | exit 0, WARN-only | sweep_cdt_final: edge=0 panel=0 dense=30 (WARN heuristic; spot-check sc001/sc029 thị giác sạch); sc022 panel_clip false-positive (buồm chạm mép dải nước) → dịch 2 thuyền, re-sweep PASS |
| ASR round-trip (MP4 thật) | PASS 3 điểm | early 77/78%, mid 58/60%, late 88/89% (ngưỡng 45%, chuẩn S2E02) |
| Duration | PASS | 869.31s vs narration 867.24s = +2.07s tail credits — precedent S2E02 owner-approved (+2.07s) |
| Số trên màn hình | PASS | 0 chuỗi ngoài whitelist (qc_whitelist_numbers.py) |
| Render draft HUD | DONE | renders/s2e03_draft_hud_720p.mp4 1280x720 30fps 869.31s, render 21 phút; bản ≤50MB crf 31 đính kèm DM |
| Scene index | DONE | vn-myth-series/episodes/S2E03-chu-dong-tu/scene_index_s2e03.md (63 dòng) |

Quyết định biên tập khai báo (decision_log batch_full_production):
- 2 retention cuts (S5→S6 0.58s; S26→S27 2.27s): câu cuối kéo qua boundary, scene sau mở đúng đoạn đó (speech-locked, không mất chữ).
- demo_s03_kho tham chiếu .png→.jpg (file thật), boats sc022 dịch 15/8px (sweep), SourceTag shadow đậm hơn.

## Update Gate B → demo (2026-10-19 sáng)

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Bible bump v1.1 | DONE | SEASON-02-BIBLE.md: S2-C3 canon mục 3 ("owner duyệt 2026-10-19 Gate B") + changelog v1.1; S2-C2 typo "预留"→"dự phòng" |
| Checkpoint proposal | DONE | checkpoint_proposal.json = completed + human_approved=true (d-006, 7 decisions); KHÔNG tự mở gate sau (scene_plan/assets/edit/compose chưa tồn tại) |
| TTS probe Gate A | DONE, 18/18 PASS | artifacts/probes/gate_a_s2e03_result.json (18 clip isolate, whisper-small round-trip; verdict variant-based chuẩn S2E02 d-004). Dạ Trạch: whisper-small nghe "dạ chạy" → kiểm độc lập whisper-medium beam5 = "Dạ Trạch, Đầm Dạ Trạch" ĐÚNG → keep_verbatim. 0 respell; lexicon gate_a_s2e03 = 17 term |
| Demo scene s03 | DONE, PENDING OWNER | ChuDongTuDemo (Root.tsx độc lập): caption 14 cue + quote card 2 cửa sổ KHÓA theo word-timestamps ASR thật (demo_s03_words.json, DP alignment 83% stripped-match, +1.0s offset); audio vieneu 30.73s @48kHz; ảnh ink 9router probe 1 (vision PASS); tsc 0; sweep 2 stills |

## QC demo s03 (độc lập Hermes)

- ffprobe: 1280x720, h264+aac 48kHz stereo, 34.048s, 3.07MB, 30fps.
- ASR round-trip TỪ MP4 RENDER: 129 từ (khớp 100% nguồn), speech 0.9→31.48s, tail 2.57s — audio nhúng đúng demo_s03.wav.
- Speech-window: quote1 10.32–12.64, quote2 21.40–24.86 (từ thật); caption dur trim tại ranh giới cue sau (bắt lỗi vision @23.0s caption cũ đè 0.64s → đã fix + re-render).
- scene_sweep: verdict FAIL edge=12 — adjudicate vision: TOÀN Bộ là artwork tràn lề chủ ý (không text clip); text/caption/HUD nguyên vẹn — PASS theo pattern d-003.
- Vision frame 11.5s + 23.0s (sau fix): quote card đúng nội dung + window, caption khớp, dấu VN chuẩn; 1 nhận xét thẩm mỹ: caption box đè ~25px sang panel ảnh (không che chữ/khối chính) — để owner quyết.

## Files demo

- Video: `/Users/tuyennguyen/project/OpenMontage/remotion-composer/out/chu_dong_tu_demo_s03_draft_720p.mp4`
- Index: `projects/chu-dong-tu/scene_index_s2e03_demo.md`
- Timing: `remotion-composer/public/chu-dong-tu/demo_scene_timing.json` + `assets/audio/demo_s03_{words,cues}.json`
- Component: `remotion-composer/src/chu-dong-tu/Demo.tsx` (props draftHud, default ON)

---

# (Lưu lại bản Gate B 08:40 trước đó)

Trạng thái trước: AWAITING HUMAN (Gate B) — research + proposal + script draft chờ owner duyệt.

## Tóm tắt

| Giai đoạn | Trạng thái | Bằng chứng |
|---|---|---|
| Research import | DONE | 16/16 checksum khớp tại vn-myth-series; 15/15 sau import OM; research_brief VALID (13 data points, 6 nguồn, 3 angles, 3 landscape); checkpoint_research.json = completed |
| Proposal | DONE, PENDING OWNER | artifacts/proposal_packet.json — validate_artifact PASS, approval.status=pending; PROPOSAL.md 8 khối; checkpoint_proposal.json = awaiting_human |
| Script draft | DONE, PENDING OWNER | drafts/script_draft.json — 32 sections (s01–s32), 960.0s, 3.648 từ, validate_artifact PASS, metadata.status=draft_awaiting_owner; native script checkpoint bị chặn đúng luật (proposal chưa duyệt) — draft nằm ở drafts/ |
| Review docs | DONE | SCRIPT_REVIEW.md (32/32 section, narration nguyên văn, 47,9KB) + CONTENT_QC.md (13,1KB) — verdict **PASS_WITH_NOTES**: 16/16 quote khớp ledger, 18/18 anti-rules OK, needs_input [] (2 điểm tùy chọn biên tập: s01 "chín giờ sáng", s07 "cả trăm năm" — owner quyết) |

Concept khuyến nghị: **c1 "Sau đám cưới, dòng sông còn chảy"** (960s, 32 sections, ~3.648 từ; hook mở từ lễ rước nước hôm nay → câu hỏi trung tâm "Vì sao người không có cả chiếc khố lại được thờ làm thánh?").

## QC độc lập (Hermes, script draft)

- Schema: `validate_artifact("script")` → **VALID** (chạy bởi cả CC P4 và Hermes).
- Timing: 0.0 → 960.0, **không gap** giữa sections; tổng khối = 960 = total_duration_seconds.
- Quote: mọi chuỗi ngoặc kép >6 từ **khớp nguyên văn claim_ledger** (khác biệt chỉ là dấu kết câu/elision tại dấu phẩy — ghi rõ trong CONTENT_QC).
- Số hiển thị: chỉ trong whitelist (1492, 1493 = mốc lời tựa/bạt; 10–12 tháng Hai AL + 11/2 = "theo lịch được đăng"; 02/02/2023 + 153/QĐ-BVHTTDL + 01/03/2023 = "theo bài tin"; 9 làng + 3 năm một lần = quy mô bài 2023; 2023 = năm bài tin).
- Không ký tự lạ (CJK/Cyrillic/Greek) sau 3 lần tự sửa của CC + 1 lần Hermes ("передач khẩu"→"truyền khẩu" s04).
- provider_text: số spelled-out, không '/', không chữ số.

## Decisions (decision_log.json — 6)

- d-000 scoped_to_script_review (0.95) · d-001 runtime Remotion 0.95 / HyperFrames 0.35 present-both (chờ owner) · d-002 concept c1 (chờ owner) · d-003 S2-C3 đóng khung climax (chờ owner) · d-004 BGM reuse Mesmerize (chờ owner) · d-005 split-4-CC + scaffold-append + MAX_THINKING_TOKENS=4000 (done).

## Claude Code sessions (thật, resumable)

Vai trò · session UUID · lệnh resume (từ repo root `/Users/tuyennguyen/project/OpenMontage`):

- A — proposal: `a937f3cc-1cc9-49d7-8220-80477278d473` → `claude --resume a937f3cc-1cc9-49d7-8220-80477278d473`
- B — script đơn (TREO, killed): `0f37f267-12c7-4791-aa49-6444d77886f9` (không dùng lại)
- P1 — script s01–s08: `ab37dfdd-4ce8-4545-a221-90f2cf13e2da`
- P2 — script s09–s16: `fd883f10-bcb1-4ebb-a6df-49d8bcb574dc`
- P3 — script s17–s23: `70f9fcb0-b54b-47ea-9a04-739e0e9fe83d`
- P4 — script s24–s32 + metadata + validate: `4f3c331c-4967-4c8e-be1f-4d3c9af9b16d`
- S1c — review docs: `adf46a1a-48a3-476a-88b3-1906fd91c089`

Logs: `~/.hermes/profiles/video/cache/scratch/s2e03/cc_*.log` (A, B, B1c, B2, B3, B4, S1c).
Cơ chế sau 2 lần treo: scaffold-append (marker object, mỗi section 1 Edit nhỏ) + `MAX_THINKING_TOKENS=4000` — thinking dài làm gateway treo stream. Ghi d-005 để tái dùng.

## Chờ owner quyết (Gate B)

1. Duyệt research + proposal (concept c1, runtime Remotion vs HyperFrames, BGM Mesmerize, duration 960s).
2. Duyệt script draft + S2-C3 ("có thể đọc là khát vọng về đời sống có phẩm giá, vượt xuất thân" — đề xuất, KHÔNG tự sửa bible).
3. Sau duyệt: bible bump (nếu S2-C3 được duyệt) → TTS probe Gate A → 1 demo scene → batch TTS/ảnh → draft HUD 720p → final sau APPROVE.

## Files chính

- `/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu/artifacts/proposal_packet.json` + `PROPOSAL.md`
- `/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu/drafts/script_draft.json`
- `/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu/SCRIPT_REVIEW.md` + `CONTENT_QC.md`
- `/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu/checkpoint_research.json` (completed) + `checkpoint_proposal.json` (awaiting_human) + `decision_log.json` (6)
