# OpenMontage Orchestration Doctrine

Owner: Tuyên (dracuten1). Viết bởi Hermes từ bằng chứng aivn-20261005/06 (2026-10-05/06).
Ngôn ngữ: Việt — kỹ thuật giữ nguyên thuật ngữ Anh.

Đây là hợp đồng orchestration cho mọi production OpenMontage chạy qua Claude Code.
Nguồn sự thật song song: `~/.hermes/skills/openmontage-video/references/claude-code-orchestration.md` (bản Hermes-side).
Sai doctrine = lỗi lặp lại; sửa doctrine = sửa tại đây rồi sync 2 chiều.

---

## §0. Pattern nền (đã chạy, đã đo)

3 Claude session + Hermes mechanical steps. Một lead đơn không sống nổi: aivn-20261005 lead chết "Prompt is too long" turn 99 context 177k; resume chết max-turns 60 context 157k; subagent 484–507 turns 0 chết. Chia:

| Session | Việc | max-turns | Thực tế |
|---|---|---|---|
| S1 PLAN | research→proposal→script→scene_plan (stage-worker + reviewer) | 40 | ~41 turns, $19.1 |
| S2 ASSETS | asset-worker batch TTS+whisper+images, reviewer gate | 20 | ~10 turns |
| S3 COMPOSE | edit-worker + composer (TSX, probe, render ≤5') | 25 | 26 turns → error_max_turns |
| PUBLISH + fix | **Hermes terminal trực tiếp** (validate, checkpoint, ASR, re-render) | 0 Claude turns | ~6 tool calls |

Nguyên tắc chuyển việc về Hermes: bước cơ học >5 phút hoặc sau render cuối → Hermes terminal, không vào lead.

## §0b. Chế độ team — native Agent Teams là CHÍNH (quyết định owner 2026-10-10)

Hai chế độ chạy team qua Claude Code:

- **Mode (b) NATIVE TEAMS — CHẾ ĐỘ CHÍNH**: 1 lead + N teammate trong 1 interactive session (tmux). Lead tự `TeamCreate` + spawn teammate (`Agent` tool), giao/nhận việc qua inbox `SendMessage`, task qua `TaskCreate/TaskList`. Dùng mặc định cho mọi việc cần nhiều worker phối hợp trong 1 stage.
- **Mode (a) N×`claude -p` song song (vn-myth S3 scaffold-first) — FALLBACK**: giữ cho batch cơ học rời rạc không cần messaging giữa worker (nhóm ≤6 scenes/session), khi cần `--max-turns` cứng từng worker, hoặc tmux/team hỏng mid-run. Kỳ tích đã chứng minh: Ep.06 $20/66 scenes, 0 death.

Stage-per-session + probe gates (§0, §1) KHÔNG đổi vì đổi chế độ team — chỉ đổi cách spawn worker bên trong.

### Điều kiện chạy được (verified 2026-10-10, từng chết 1 lần trước đó)

1. **tmux 3.8 đã cài** (brew, PATH qua `~/.zprofile`) — bản cũ doctrine "No tmux" đã stale.
2. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` bật global trong `~/.claude/settings.json` (có sẵn).
3. **Bẫy model teammate (silent death)**: teammate hardcode model `claude-opus-4-6` — KHÔNG qua alias `ANTHROPIC_DEFAULT_OPUS_MODEL`. 9router không có model tên đó → teammate spawn xong idle, 0 tool call, transcript ghi model `<synthetic>`. **Fix đã dựng: combo 9router `claude-opus-4-6` → `glmagenticfb`** (glm/glm-5.3 + ag/gemini-3.8-flash-high, fallback nội bộ). Đã map nốt `claude-sonnet-4-6`. Sau smoke: teammate chạy tool thật (Bash/Write/SendMessage), model glm-5.3, artifact verify độc lập.

### Recipe (Hermes → tmux)

1. `tmux new-session -d -s om-team -x 220 -y 50`
2. `tmux send-keys -t om-team 'cd ~/project/OpenMontage && claude' Enter` — prompt đầu qua send-keys cần **Enter ĐÔI** (1 lần wrap dòng + 1 lần submit); thiếu = im lặng không gửi.
3. Prompt lead: chỉ định team_name + vai trò teammate MỖI THẬT NHIỀU task bounded (artifact path + acceptance criteria ngay trong spawn prompt — teammate KHÔNG kế thừa context lead).
4. Monitor `tmux capture-pane -t om-team -p -S -80`; **permission của teammate hiện lên pane LEAD** → Enter approve ở lead, không approve = teammate stall.
5. Verify KHÔNG tin lời lead: `~/.claude/projects/<dir>/<session-id>/subagents/agent-*.jsonl` — model ≠ `<synthetic>` và có `tool_use`; inbox `~/.claude/teams/<team>/inboxes/` 2 chiều.
6. Dọn: `tmux kill-session -t om-team` + xóa scratch.

Nguyên tắc giữ nguyên từ rule cũ: lead là writer duy nhất của checkpoint/decision_log; teammate viết draft/assets rời rạc; human gate vẫn theo gate.

## §1. Probe gates (BẮT BUỘC, thêm 2026-10-05)

Bài học: S1 PASS schema + reviewer nhưng KHÔNG kiểm artifact chạy được — sửa "VRAM→Vê-ram" xong không replay TTS, đổi "expert→chuyên gia" xong không nghe audio → 4 lần render lại v2→v5. Schema-valid ≠ production-correct.

**Gate A — TTS probe ở cuối S1 (PLAN):** trước khi PASS, lead BẮT BUỘC:
1. Chọn 2–3 từ rủi ro nhất trong lexicon mới (thuật ngữ nước ngoài, số, tên riêng).
2. Sinh audio probe qua vieneu (`tts.infer` từng từ trong context câu ngắn), ASR lại bằng faster-whisper.
3. ASR khớp ý → checkpoint PASS. Sai → sửa lexicon/provider_text TRONG session, probe lại (tối đa +3 turn).

**Gate B — Frame probe ở S3 (COMPOSE):** trước khi render full:
1. `npx remotion still <CompositionId> probe.png --frame=<giữa scene dày chữ nhất>` (~30s).
2. Vision-check probe frame (text đúng, không overflow, đúng thứ tự xuất hiện theo narration).
3. FAIL → fix TSX trong session (+3 turn). PASS → mới render full.

Chi phí: +2 turn S1, +2 turn S3 (~$0.04). Lợi: khỏi 3–4 lần render full (3–4 phút CPU + 1 session fix mỗi lần).

**Gate C — final verify (Hermes, sau render):** ASR toàn track + vision 2–3 frame + ffprobe duration ±0.5s vs script. PASS mới giao.

## §2. Hermes là orchestrator, không phải thợ sửa (thêm 2026-10-05)

Vi phạm có thật: 10-05 Hermes tự viết `rebuild_aivn_20261006_pron.py`, tự re-render thay vì spawn fix-session. Lý do lúc đó (lead chết + 1 thay đổi nhỏ) không hợp lệ về doctrine.

Quy tắc cứng:
- Hermes KHÔNG Edit/Write trong `projects/<id>/artifacts/**`, `remotion-composer/src/**`, `projects/<id>/renders/**`. Chỉ đọc + tạo prompt/state file mới.
- Mỗi lần QA bắt lỗi → ghi `projects/<id>/fix_request_NN.json` (field: `issues[]`, `evidence`, `scope`, `forbidden_rework`) rồi spawn **fix-session ≤10 turns** với prompt "Read fix_request_NN.json, apply, đừng re-do phần đã PASS".
- QA order: Hermes độc lập verify (ASR/vision/ffprobe) → có lỗi → fix_request → fix-session → Hermes verify lại → loop tối đa 2 lần. Lần 2 vẫn fail → dừng, báo owner với checklist cụ thể.
- Lead session chết `error_max_turns`/context: Hermes KHÔNG viết thay. Chạy probe thu thập evidence (1 frame, 1 ASR excerpt), ghi fix_request, spawn session kế tiếp.
- Token budget: PLAN ≤40, ASSETS ≤20, COMPOSE ≤25, FIX ≤10.

## §3. Thuật ngữ nước ngoài trong TTS (display≠narration, định chính sách 2026-10-05)

vieneu v3 Turbo (sea-g2p `lang="vi"`) **tự code-switch sang English engine**: 'expert'→ˈɛkspɜːt, 'VRAM'→vɹˈæm, 'Qwen'→kjˈuːwˈɛn. Không cần ép phiên âm tiếng Việt cho từ đã có trong từ điển Anh.

**`phoneme_dict` KHÔNG hoạt động ở sea-g2p 0.7.x / vieneu 3.8.3** — xác minh 2026-10-05: wrapper `vieneu_utils/phonemize_text.py` nhận kwarg nhưng Rust binding `_rust_engine.phonemize(text, punc_norm)` bỏ qua (test: `phonemize_batch(..., phoneme_dict={"expert": "v i ɛ t"})` → output identical). Chờ upstream wire xong mới dùng; khi nghi ngờ re-verify bằng snippet:
```python
from sea_g2p import G2P
g2p = G2P(lang="vi")
a = g2p.phonemize_batch(["expert giữ năng lực"], punc_norm=True)[0].rstrip(".")
b = g2p.phonemize_batch(["expert giữ năng literacy".replace("literacy","lực")], punc_norm=True, phoneme_dict={"expert": "v i ɛ t"})[0].rstrip(".")
print(a != b)  # False = dict chết
```

**Chính sách chọn đường (khuyến nghị owner đã duyệt 2026-10-05):**
- **(a) Tên Anh nguyên văn** — mặc định cho thuật ngữ quốc tế/brand: `expert`, `token`, `GPU`, `Qwen`. vieneu tự đọc chuẩn. Display = narration.
- **(b) Phiên âm Việt trong tts_lexicon** — chỉ cho viết tắt dễ đọc nhầm hoặc brand cần đọc近似 Việt: `VRAM→Vê-ram`, `Qwen→Quen` (khi context yêu cầu), `Strata→Xtra-ta`. Display nguyên văn, narration dùng bản trong lexicon.
- **(c) Việt hóa hoàn toàn** — chỉ khi khái niệm thuộc về người xem Việt: `expert→chuyên gia` CHỈ khi slide cũng ghi "chuyên gia" (đừng display "Expert" + nói "chuyên gia" — mắt tai lệch, đúng lỗi v3→v4 aivn-20261006).

Rule vàng: **display và narration không được mâu thuẫn**. Khác nhau OK (display "VRAM", nói "Vê-ram"), mâu thuẫn không OK (display "Expert", nói "chuyên gia").

## §4. Focal visual: gen image nền + overlay code + hexpix region encoding (2026-10-07)

Quy tắc standing của owner cho visual TRỌNG TÂM của cảnh (bản đồ Cổ Loa, nhân vật, nỏ thần, sơ đồ cơ chế):

1. **Base layer = gen image** (9router: `cx/gpt-5.6-luna-image` mặc định — gemini quota hay cạn; qua skill image-generation). Không vẽ thuần TSX/SVG cho hero visual, cũng không thả gen image trơn.
2. **Draw layer = TSX/SVG đè lên nền**: mũi tên, vòng tròn, highlight box, nhãn, đường đi — speech-locked bằng máy anchor hiện có. Gen image = canvas, drawing = phần giải thích.
3. **hexpix — mã vùng ẩn trong chính ảnh gen** (test thực 2026-10-07, 3 prompt × luna-image, 1536×1024):
   - Prompt S2 nhúng marker spec: các vùng quan trọng được tô mã bão hòa tinh khiết (#FF00FF/#00FFFF/#FFD700/#FF6600/#009999...), kèm mệnh đề "ONLY saturated colors in the image" — phần còn lại giữ ink tones muted.
   - Kết quả thực đo: marker rơi ĐÚNG vị trí ngữ nghĩa (magenta trong vòng trong cạnh cung, cyan chạy theo sông/hào, gold trên nóc cửa bắc); cấu trúc vùng giữ đúng (3 vòng thành bbox lồng nhau, centroid trùng ~0.51/0.50); positional ("nửa trái", "góc dưới-phải") giữ tuyệt đối.
   - Giới hạn đã đo: "stripe/đường mảnh" KHÔNG đáng tin (bị hiểu thành vùng đặc) → chỉ mã hóa VÙNG/patch. Cyan ôm sông uốn lượn purity thấp (~4% trong bbox) → morphology open/close trước khi dùng.
   - Decode: `scripts/hexpix_decode.py <img> <spec.json>` → per-region coverage/purity/bbox/centroid + debug overlay (match L1 ≤60, hex exact-case). TSX overlay ăn geometry từ đây — khỏi toạ độ cứng.
   - Marker giữ nguyên như glow-accent (đã test: không phá ink-wash) hoặc dọn bằng sam2/Grounded-SAM (2-min timeout) nếu gây nhiễu.
4. **Visual phụ/decorative vẫn code-only.** Không gen toàn bộ — giữ ink-genome nhất quán cả tập.

### §4b. hexpix v2 — sprite động + path (verified end-to-end 2026-10-07, "thuyền chạy theo sông")

Kịch bản owner: gen ảnh bình thường, marker ẩn đánh dấu object + path; TSX cắt object, cho chạy theo path. Đã chạy trọn vẹn với `cx/gpt-5.6-luna-image`:

1. **Gen 1 lần, 2 marker** — prompt 2-stage ("lay out scene normally, THEN apply accents"): sông = teal BÃO HÒA (#1FA9A0 family, "noticeably saturated, colored-ink illustration style"), thuyền = silhouette tím flat (#C77DD8). Hue-đôi cách nhau ≥60° để decode không lẫn.
2. **Decode HSV gate** (không phải hex matching — model drift ±25°): sông = 1 component liền 441k px; polyline 12 điểm mượt bằng bin-centroid theo trục PCA chính.
3. **Sprite cắt bằng mask NGƯỢC**: trong bbox thuyền, non-teal = thuyền (thuyền nằm độc lập trên nước) → RGBA sprite sạch (73% transparent, đủ người+mũ+giỏ). Mask violet thuần BỊ SÓT viền tối của thuyền — đừng dùng.
4. **Xoá object khỏi nền: KHÔNG inpaint thủ công.** Đã thử 9 biến thể (TELEA/NS/box/exact-mask/texture-blend) — tất cả đều để lại artifact nhìn thấy được (vision-check bắt được từng bản). Lối ra: **img2img edit bằng `cx/gpt-image-2.5-sunburst`** (identity-preserving) — "remove the boat, fill with same water, keep everything else EXACTLY identical" → nền sạch, không artifact, toàn cảnh giữ nguyên.
5. **Frame demo**: sprite chạy theo polyline t=0.25/0.55/0.85 — vision xác nhận thuyền nằm ĐÚNG trên sông cả 3 vị trí.

**Contract pipeline (S2/S3):** prompt nhúng N marker (object = silhouette màu flat, path/region = màu bão hòa; hue-pair ≥60° apart) → `scripts/hexpix_extract.py` (HSV gate + sprite RGBA + polyline + inpaint fallback) → object-remove qua gen edit model → TSX: sprite `interpolate()` theo polyline, speech-locked với narration. Chi phí: 2 gen calls/scene (tạo + remove).

**Giới hạn đã đo:** marker "stealth" (tint nhạt mắt thường khó thấy) KHÔNG decode được — model render sat <0.05, lẫn completely vào sepia (hue-band histogram không tách nổi).

### §4c. hexpix v3 — 2-pass gen: nền thuần ink + marker là lớp colored-ink edit (verified 2026-10-07)

Ý "marker ẩn" khả thi cuối cùng — không phải ẩn về mặt mật mã, mà là **nền gen ra không có marker, marker chỉ tồn tại ở lớp edit** như colored-ink accent. Đã chạy end-to-end 3 gen calls (1536×1024):

1. **Pass 1 — gen nền thuần** (`cx/gpt-5.6-luna-image`): prompt ink-wash muted, KHÔNG nhắc marker → ảnh art sạch, không ràng buộc màu.
2. **Pass 2 — gen-edit thêm marker** (`cx/gpt-image-2.5-sunburst`, identity-preserving): "recolor river to #1FA9A0, boat hull to #C77DD8, keep everything else pixel-identical". Vision-check: marker đọc là **colored-ink accent có chủ đích** (hand-drawn, theo nét vẽ, hòa hợp) — không phải sticker neon.
3. **Pass 3 — gen-edit xoá object** khỏi ảnh pass 2: nền sạch, vision xác nhận không artifact, toàn cảnh giữ nguyên.
4. Decode + sprite inverse-teal cut (54.8% transparent) + composite t=0.25/0.55/0.85: cả 3 vị trí trên sông, seam sạch.

**Gotcha hue units:** `hexpix_extract.py` dùng thang OpenCV H **0–179** (= độ/2), KHÔNG phải 0–359. Spec ghi [155,185] cho teal → found:false cả 2 region. Đúng: teal #1FA9A0 → [78,100], violet #C77DD8 → [135,158]. Luôn chia 2 trước khi ghi spec.

**Trade-off vs v2:** v3 tốn 3 gen calls/scene (v2 = 2) nhưng đổi được: (a) nền pass 1 không bị "nhiễm" ràng buộc marker lúc gen — art tự nhiên hơn, (b) marker là quyết định hậu kỳ — cùng một nền tái dùng được cho nhiều loại mã hóa. Sprite cắt từ ảnh có marker nên giữ màu accent (violet hull) — render production giữ làm accent hoặc recolor tùy gu.

## §5. Bài học đã trả giá (giữ nguyên, tham chiếu)

- **Lead flooding là kẻ thù**: 44–45 Read/lead (240k chars). Read whitelist ≤6 file/session, đọc nguyên vẹn 1 lần, cấm paginated re-read, cấm TodoWrite, cấm post-render verify loop trong lead.
- **Agent Teams — cập nhật 2026-10-10: CHẾ ĐỘ CHÍNH, xem §0b.** Bản 10-05 "bẫy trên Mac không tmux" chỉ còn đúng 2 phần: `-p` không spawn teammates + in-process teammate chia context lead (thực tế 10-10 lead pass vẫn gọn 23 asst lines vì teammate có transcript riêng — nhưng vẫn giữ nguyên tắc bounded task). Tmux đã có → native teams đã verified chạy tool thật sau khi map model `claude-opus-4-6` ở 9router.
- **Permission denials là tín hiệu**: stop & report, không Bash-redirect vòng guard. Stub 19-byte viết lách qua Write denial là defect thật.
- **Checkpoint vs disk**: session chết có thể bỏ sót checkpoint; resume LUÔN diff checkpoint_*.json vs artifacts thật, backfill bằng payload thật (path-stub fail validator).
- **Kill process đúng cách**: `pkill -f "claude -p"` không khớp pattern khi prompt dài — kill theo PID.
- **max-turns phải khớp scope prompt**: prompt toàn pipeline + max-turns 40 = chết chắc (aivn-20261006 lần 1).
- **Probe-still trước render full** đã tiết kiệm 30' render discovery — giữ làm Gate B.

## §6. Changelog
- 2026-10-05: doctrine đầu tiên (3-session split, Read whitelist, Agent Teams verdict, resume discipline) — từ turn-level autopsy aivn-20261005.
- 2026-10-06: +§1 Probe gates (A/B/C), +§2 Hermes orchestrator rule (fix_request pattern), +§3 phoneme_dict caveat + chính sách 3 đường thuật ngữ, lỗi v2→v5 aivn-20261006 ghi nhận.
- 2026-10-07: +§4 Focal visual (gen image base + TSX overlay + hexpix region encoding, test thực 3 prompt luna-image) + script `scripts/hexpix_decode.py`. +§4b hexpix v2 sprite động + path (thuyền chạy theo sông, verified end-to-end) + script `scripts/hexpix_extract.py`; bài học: inpaint thủ công FAIL 9/9, xoá object bằng gen-edit model. +§4c hexpix v3 2-pass (nền ink thuần → edit marker colored-ink → edit remove): 3 gen calls, hue-unit gotcha OpenCV 0–179.
- 2026-10-10: +§0b native Agent Teams thành chế độ team CHÍNH (owner quyết định); N×`claude -p` song song xuống fallback. Đã restore doctrine từ commit de4c3b3 (file từng mất khỏi working tree ở branch `latest`). Guardrails: teammate hardcode `claude-opus-4-6` (map 9router combo `glmagenticfb`), permission teammate hiện pane lead, send-keys Enter đôi, verify qua subagent jsonl (model ≠ `<synthetic>` + tool_use thật).
