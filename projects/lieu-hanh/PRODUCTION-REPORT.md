# PRODUCTION REPORT — VN-Myth S2E04 Liễu Hạnh

Status: DONE — S2E04 Liễu Hạnh hoàn thành & delivered (final QC PASS, Telegram DM đã gửi). Ngày cập nhật: 2026-10-21.
MASTER: /Users/tuyennguyen/project/OpenMontage/remotion-composer/out/lieu-hanh-final-1080p.mp4 (1920x1080, 900.16s, 741.9MB)
PREVIEW TG: /Users/tuyennguyen/project/OpenMontage/remotion-composer/out/lieu-hanh-preview-720p.mp4 (37.2MB)
DESCRIPTION: /Users/tuyennguyen/project/OpenMontage/projects/lieu-hanh/deliverables/YOUTUBE_DESCRIPTION.md
SCENE INDEX: /Users/tuyennguyen/project/OpenMontage/projects/lieu-hanh/scene_index_S2E04.md
Lead Hermes profile: video. Session thật: 20261020_070647_629003
Resume: hermes -p video chat --resume 20261020_070647_629003 -q "S2E04 lieu-hanh: tiếp tục từ PRODUCTION-REPORT"
Không resume session S2E03; không đụng project chu-dong-tu.

OWNER FULL-RUN APPROVAL (2026-10-21)
- Quote: "Let finish the vn myth ep4 I approve all" — Telegram DM615761638, relay trong lead session.
- Record: projects/lieu-hanh/owner_full_run_approval.json (full_run_authorized, additional_owner_wait_required=false).
- Phạm vi duyệt: research v1, concept c1 (kèm c2/c3), script 32 section, S2-C4 framing tập này, CC+Remotion, duration content-driven 12–20', demo nội bộ + batch + draft QC + final, Telegram delivery. Quality gates vẫn bắt buộc; KHÔNG tự đăng, KHÔNG E05, KHÔNG sửa bible, KHÔNG cron/config.

ĐÃ HOÀN TẤT (milestone log, mới nhất cuối)
- [x] 10-20 Gate B: research sealed 14/14; script 32 sections schema PASS (3848 canonical/4032 provider units); 25 quotes khớp ledger 0 unmatched; SCRIPT_REVIEW/CONTENT_QC/PROPOSAL (+qc note 10-20). Fix CC session chạm max-turns exit 1 — lead tự hoàn tất phần còn lại, ghi trung thực.
- [x] 10-21 Backup pending: backups/pre-full-run/ (11 files: report/proposal/review/qc/checkpoints/decision/lexicon).
- [x] 10-21 Approval artifacts: proposal_packet approval.status=approved (schema PASS); artifacts/script.json owner_approved (schema PASS); decision_log +d-004..d-007 (lịch sử giữ nguyên).
- [x] 10-21 Checkpoints native: proposal completed human_approved=True; script completed human_approved=True (readback PASS). Soft-cap duration warnings 26-49s/section được GHI NHẬN — xử lý bằng speech-lock theo audio thật (không split lại script đã duyệt).
- [x] 10-21 Gate A TTS probe: 11/11 wav ok (vieneu default series voice). ASR cross-check whisper-base: p06 khớp verbatim, p10 gần khớp; LIMITATION: whisper-base sai chính tả tên riêng VN (Dầy→xây) — chỉ dùng check audibility. Minimal-pair phổ xác nhận "Dầy" đọc /z/ hữu thanh đúng (hi_lo 0.087 ≈ dây 0.091, xa xây 0.222). qc/gate_a_probe.json. Retries: 0. PASS.
- [x] 10-21 Scene plan worker CC dispatch (TASK_SCENE_PLAN.md + skeleton append-marker + validate_scene_plan.py). CC prep đầu tiên chết max-turns không ghi gì (đọc guide quá nhiều) — respawn task hẹp nhúng sẵn quy tắc; nếu CC lần này vẫn chậm, lead tự sinh phần còn lại (cơ học từ enhancement_cues).
- [~] 10-21 TTS batch 32 sections: assets/audio/sections/s##.wav + qc/tts_durations.json (idempotent, chạy nền). Timing production re-lock từ audio thật + word timestamps.
- [x] 10-21 Image prompts 50 entries (CC worker, style genome verbatim, teal/amber accents, dignity rules) → artifacts/image_prompts.json.
- [x] 10-21 BGM machine audition + prep: Mesmerize (local catalog, ISRC USUAN1500005) — file thực PCM 192kHz 424s; loudnorm -24 LUFS TP -2, loop 902s, fades 2s/4s → public/lieu-hanh/background_music.mp3 (21.6MB). LIMITATION trung thực: machine audition (loudness/peak/silence/PCM sạch) phát hiện 2 đoạn lặng 3.4s/9.5s — chấp nhận cho BGM 0.32 dưới narration; human ear-check chưa có. Credit CC BY 4.0 sẽ ghi trong description.
- [x] 10-21 Image batch 50/50 PNG thật (9router; ag/gemini 502 dai dẳng → fallback cx/gpt-5.6-luna-image ~30-40s/ảnh; JPEG bytes tự transcode PNG qua ffmpeg). Demo ảnh sc015 vision-QC PASS (intent khớp, style khớp, 0 text, dignity, usable).
- [x] 10-21 Compose (CC worker, 1976 dòng src/lieu-hanh: theme/anchors/common/draft-hud/scenes a–f 50 scenes/Demo/Episode + Root registrations 3 compositions). CC chết max-turns exit 1 SAU khi land — lead kiểm đĩa, sửa nốt: scenes-e Sc039 parse break (rewrite sạch), common.tsx getStaticFiles API + AbsoluteFill opacity, HUD Demo frameOffset (demo frame cục bộ vs TIMING global).
- [x] 10-21 Demo render sc015 nội bộ + vision QC 3 điểm + 2 crop: artwork/caption/HUD PASS; bắt được subtitle bịa "cong trở về — đổ bóng xuống thềm nhà" (không có trong script) → thay bằng câu thật "về lại vùng Vân Cát" + scrim; Chip "RỜI NHÀ THƠ VÂN CÁT" → "HỒI HAI — TIÊN CHÚA TRỞ VỀ".
- [x] 10-21 Display-text scan toàn 50 scenes (scan_display_text.py, corpus 933 từ từ script): 3 eyebrow/subtitle bịa sửa về từ vựng narration (Sc025/Sc033/Sc042); còn lại source-attribution labels (quote C12b · vi.wiki Phủ Dầy) — hợp lệ attribution visible.
- [x] 10-21 Timing engine audit VỚI A() calls thật (chạy lại gen_scene_timing sau khi scenes tồn tại): 10 content conflicts (phrase spoken ngoài window) — fix từng cái bằng phrase trong window (sc004/sc006/sc010/sc039/sc041/sc047); KẾT QUẢ: 50 scenes, 27003f=900.10s, contiguous, conflicts 0, resolve failures 0, retention cuts 0. Speech-lock chặt: KHÔNG proportional.
- [x] 10-21 scene_timing public convert (snake_case) cho scene_sweep; tsc --noEmit 0 lỗi lieu-hanh.
- [x] 10-21 scene_sweep gate PASS: 100 stills (50 scenes × anchor+end), edge_clip=0, panel_clip=0, dense=87 (grid heuristic ink-style, xác nhận bằng vision). 
- [x] 10-21 DRAFT HUD 720p render xong: out/lieu-hanh-draft-hud-720p.mp4 — 1280x720, 27003 frames = 900.16s, khớp timing engine (Δ0.06s container). QC: 8 điểm vision (f1150/f4400/f8454/f16000/f20000/f24000/f26800 + f16000-fix) — HUD đúng scene/section mọi điểm; text dấu đủ; dignified (sc009 áo đỏ PASS); caption không cắt. BẮT 2 lỗi: subtitle bịa Sc015 (đã thay câu thật "về lại vùng Vân Cát"+scrim), caption chồng panel Sc024 (thu card 920→800 + svg 240→150, re-still verify PASS). Nguồn "Nghiên cứu Tôn giáo 10/2010" xác minh có trong script C13/C14/C15 sealed. Loudness draft: I=-15.2 LUFS, LRA 2.1 (chuẩn YT).
- [x] 10-21 FINAL v1 render xong nhưng QC vision bắt lỗi hệ thống: cue caption 3-4 dòng + card InkPanel cao (h820-940) bị caption band đè NỘI DUNG hình (sc007/sc024/sc028); captions còn từ lặp ASR ("Yên-thái, yên thái") và chính tả phonetic TTS ("u nét cô"). FIX GỐC: (1) InkPanel clamp đáy card ≤800 + objectPosition 38%; (2) gen_captions split cue >92 chars tại word boundary thật; (3) fix_captions_text.py re-align cue text về provider_text bằng difflib (43 cues thay, 0 từ lặp) + display map UNESCO; KQ: 317 cues, max 2 dòng, "được UNESCO ghi danh" hiển thị đúng. Re-still verify sc007/sc024/sc028 PASS (caption dưới card, không che). Bản v1 giữ backup lieu-hanh-final-1080p_v1_backup.mp4.
- [x] 10-21 FINAL v2 render xong EXIT 0: out/lieu-hanh-final-1080p.mp4 — 1920x1080, 27003 frames, 900.16s, 741.9MB. QC: 3 điểm vision (f8454/f12300/f26900) KHÔNG HUD, caption 2 dòng không đè card, dignified; "lớp bản kể"/"đùa bỡn" verify hợp lệ trong TSX+script (vision đọc nhím font ink). Loudness I=-15.2 LUFS LRA 2.1 (Δ vs draft 0.0 LU, Δduration 0.000s). Preview TG: out/lieu-hanh-preview-720p.mp4 (37.2MB, crf33+aac96k, spotcheck chữ rõ).
- [x] 10-21 DELIVERY: Telegram DM 615761638 — video preview + description đầy đủ (title/tags/timestamps thật 32 mốc/BGM credit CC BY 4.0 + modification notice) + báo cáo cuối. Master 1080p owner tự upload.
- [x] S2E04 DONE — lane đóng.



- [x] 10-21 Scene plan HOÀN TẤT: 50 scenes (16 generated/24 animation/8 diagram/2 text_card), heroes sc015/sc024/sc027/sc046, coverage s01–s32, validator PASS. CC worker 1 (s01–s23) + CC worker 2 (s24–s32, exit 0).
- [x] 10-21 TTS batch 32/32 PASS — assets/audio/sections/*.wav, tổng audio THẬT 898.07s (~15 phút, trong khung series 12–20'). s25 crash transient 1 lần, re-run idempotent lấy lại.
- [x] 10-21 Forced alignment word-level 32/32 (faster-whisper word_timestamps) → qc/align/*_transcript.json.
- [x] 10-21 narration_full.wav concat không gap (898.07s, 86MB) → remotion-composer/public/lieu-hanh/; narration_words.json global offsets (scripts/build_narration_full.py).
- [x] 10-21 Speech-locked timing ENGINE (d-012 parity, scripts/phrase_lock_lh.py + gen_scene_timing_lh.py): rebuild punctuation từ provider_text (3823/3974 words matched, 223 câu thật) → derive anchors «...» 50/50 scenes từ từ THẬT transcript → artifacts/scene_timing.json + remotion-composer/src/lieu-hanh/timing.ts: 50 scenes, 27003 frames = 900.10s, contiguous TRUE, conflicts 0, resolve failures 0, retention cuts 0, pushes 2. KHÔNG proportional timing.
- [ ] Demo 1 scene nội bộ → QC thị giác lead → batch ảnh → compose Remotion → draft HUD 720p + scene index → QC (delta ≤0.1s, loudness ≤0.5LU, ≥3 điểm thị giác) → final 1080p sạch → Telegram DM 615761638 (verify ok=True message_id video + description) → cập nhật report này.

THAM CHIẾU NHANH
- Script canonical: projects/lieu-hanh/artifacts/script.json (approved). Draft gốc: drafts/script_draft.json.
- Scene plan (đang build): drafts/scene_plan.json; validator: scripts/validate_scene_plan.py.
- TTS/QC scripts: scripts/probe_audio.py, probe_asr_check.py, batch_tts.py, prepare_approved.py, checkpoint_approved.py.
- BGM dự kiến (chỉ dùng nếu audition đạt): "Mesmerize" Kevin MacLeod (incompetech.com), CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ , ISRC USUAN1500005, local: /Users/tuyennguyen/project/media-library/bgm/explainer/Mesmerize.mp3. Listening QC chưa chạy — KHÔNG kế thừa file chưa kiểm.
- Nguồn UNESCO gốc chưa tải được (QA sealed) — không tuyên bố đối chiếu bản gốc.

GIỚI HẠN VẬN HÀNH
- Terminal guard chặn python heredoc/-c: dùng file scratch .py. execute_code từng bị BLOCK → luôn dùng read_file/terminal.
- CC treo output dài: MAX_THINKING_TOKENS=4000 + scaffold append-marker; check disk sau worker death; max-turns exit 1 ≠ fail task nếu artifact land.
- Render concurrency max 1 lane; không background-then-exit khi còn bước phụ thuộc — wait-loop foreground cùng session.
