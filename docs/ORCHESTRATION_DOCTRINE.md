# OpenMontage Orchestration Doctrine

<!-- Machine-readable contract metadata (compact pointer; human prose below is authoritative) -->
```json
{
  "contract": "openmontage-orchestration-doctrine",
  "contract_version": "2.0",
  "last_sync": "2026-11-09",
  "source_of_truth": "docs/ORCHESTRATION_DOCTRINE.md (this file)",
  "sync_order": {
    "primary": "ENS repo contract (this file)",
    "synced_mirrors": [".claude/agents/*", ".claude/prompts/om_team_leader_prompt.md", "skills/pipelines/*/*.md", "pipeline_defs/*.yaml"],
    "legacy_secondary": "Claude-Code standalone usage"
  },
  "required_phases": ["brief_script_facts", "actual_audio_alignment", "sealed_scene_packets", "scene_author_review", "integration", "final_render_mix_review", "delivery"],
  "success_semantics": "strict",
  "publication_policy": "delivery_separate_from_render_acceptance"
}
```

Owner: Tuyên (dracuten1). Viết bởi Hermes từ bằng chứng aivn-20261005/06 (2026-10-05/06).
Ngôn ngữ: Việt — kỹ thuật giữ nguyên thuật ngữ Anh.

Đây là hợp đồng orchestration cho mọi production OpenMontage. ENS orchestration là **authority chính**; bản Hermes-side (`~/.hermes/skills/openmontage-video/references/claude-code-orchestration.md`) là mirror subordinate sync TỪ file này, không phải nguồn sự thật song song.
Sai doctrine = lỗi lặp lại; sửa doctrine = sửa tại đây rồi sync một chiều ENS → mirrors.

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
- 2026-11-09: +§8 production contract (7 required phases, strict success semantics, dependency freeze policy, legacy compat policy, publication/delivery separation) + machine-readable metadata block đầu file. +§8.5 sync order: ENS primary; `.claude/*`, director skills, pipeline yamls = synced mirrors; Claude-Code standalone = legacy/secondary. Cập nhật §7 mapping bullet theo sync order.
- 2026-10-05: doctrine đầu tiên (3-session split, Read whitelist, Agent Teams verdict, resume discipline) — từ turn-level autopsy aivn-20261005.
- 2026-10-06: +§1 Probe gates (A/B/C), +§2 Hermes orchestrator rule (fix_request pattern), +§3 phoneme_dict caveat + chính sách 3 đường thuật ngữ, lỗi v2→v5 aivn-20261006 ghi nhận.
- 2026-10-07: +§4 Focal visual (gen image base + TSX overlay + hexpix region encoding, test thực 3 prompt luna-image) + script `scripts/hexpix_decode.py`. +§4b hexpix v2 sprite động + path (thuyền chạy theo sông, verified end-to-end) + script `scripts/hexpix_extract.py`; bài học: inpaint thủ công FAIL 9/9, xoá object bằng gen-edit model. +§4c hexpix v3 2-pass (nền ink thuần → edit marker colored-ink → edit remove): 3 gen calls, hue-unit gotcha OpenCV 0–179.
- 2026-10-10: +§0b native Agent Teams thành chế độ team CHÍNH (owner quyết định); N×`claude -p` song song xuống fallback. Đã restore doctrine từ commit de4c3b3 (file từng mất khỏi working tree ở branch `latest`). Guardrails: teammate hardcode `claude-opus-4-6` (map 9router combo `glmagenticfb`), permission teammate hiện pane lead, send-keys Enter đôi, verify qua subagent jsonl (model ≠ `<synthetic>` + tool_use thật).

## §7. Scene-isolated production team (P1.3–P1.4, 2026-11-09)

- **Thin Director**: Director mỏng là writer duy nhất của scene packet canonical; director điều phối/planning/assets nhưng không tự viết nội dung scene. Khởi đầu bằng cryptographic freeze inputs (SHA-256).
- **Fresh Writer & Fresh Reviewer per Scene**: Mỗi scene dispatch một FRESH writer instance riêng (worker) và một SEPARATE FRESH independent reviewer. Concurrency bounded qua worker pool (mặc định `--max-concurrency 2`), retries bounded (`--max-retries 1`).
- **Mechanical vs Prompt-Level Ownership Enforcement (Ranh giới cơ học vs prompt)**:
  - **Mechanical (Enforced)**:
    - *Reviewer Read-Only Isolation*: Sandbox-copy pattern — reviewer chạy trong thư mục copy độc lập ngoài canonical tree. Bất kỳ thay đổi nào lên canonical tree đều kích hoạt `reviewer_canonical_mutation` reject.
    - *Reviewer Output Collection*: Findings JSON chỉ được thu thập từ sandbox dir; canonical tree không cho phép reviewer ghi đè.
    - *Writer Scope Containment*: Pre/post SHA-256 hash diff toàn bộ episode tree. Chỉ file thuộc declared `allowed_io` / scene-scoped paths (`packet.json` và thư mục `scene/`) được phép sửa; substring match đã bị gỡ bỏ; fail-closed khi scene discovery rỗng/thất bại; `io_operations` được nối trực tiếp vào `episode_gate.py` và `scene_orchestrator.py`; out-of-scope edit kích hoạt `writer_scope_violation` hoặc `io_outside_allowlist`.
    - *Symlink Security*: Symlink được hash rõ ràng dạng `symlink:<target>`, không đi qua target tự do.
    - *Frozen Inputs Immutability*: Director ghi SHA-256 input artifacts vào `frozen_inputs`; integration gate phát hiện mismatch là fail.
    - *Verdict-to-Hash Binding*: Reviewer findings bắt buộc ghi explicit `reviewed_hashes` map output refs với SHA-256 disk hash — không backfill tự động; thiếu hoặc mismatch kích hoạt `verdict_binding_missing`/`verdict_binding_incomplete`/`verdict_binding_mismatch`.
  - **Prompt-Level Only**:
    - *LLM Reasoning Independence*: Tách biệt system prompt, context cô lập, turn hội thoại độc lập. Ngăn context bleed ở tầng prompt nhưng không bảo đảm cơ học tuyệt đối ở tầng OS cho quá trình suy luận nội tại của LLM.
- **Orchestrator Executable (Operational)**:
  - Command:
    ```bash
    .venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner {auto|subprocess|daemon} --max-concurrency 2 --max-retries 1 --daemon-timeout 600 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json
    ```
  - Runner Status (Honesty):
    - `subprocess`: Deterministic, verified end-to-end (two-scene smoke PASS).
    - `daemon`: Writer turn đã kiểm chứng trên ENS instance thật (~258s, scope-clean); reviewer findings-file generation CHƯA kiểm chứng (LLM trả text thay vì ghi file JSON trong sandbox, gate fail-closed) — daemon runner hiện là experimental đối với reviewer turns; tài liệu KHÔNG được tuyên bố daemon hoàn toàn tự động.
- **Episode Gate (`tools/qc/episode_gate.py`)**:
  - Command:
    ```bash
    .venv/bin/python tools/qc/episode_gate.py <episode_root>
    ```
  - Rejection codes: `scene_packets_missing`, `scene_packet_missing`, `scene_packet_extra`, `stale_packet`, `verdict_binding_missing`, `verdict_binding_incomplete`, `verdict_binding_mismatch`, `mix_measurement_incomplete`, `timing_relock_failed`, `production_validation_inputs_missing`, `production_validation_failed`, `mix_validation_not_measured`, `mix_validation_failed`.
  - Unconditional packet coverage diff đối chiếu với `scene_manifest.scenes` và `edit_decisions.cuts` (fail-closed nếu thiếu/thừa).
- **Compose Strict (Public Path)**:
  - `VideoCompose.execute()` chạy với `validation_mode="strict"`.
  - Production workspaces bắt buộc strict (legacy mode bị reject).
  - Evidence nạp từ `inputs["evidence_records"]` hoặc canonical `artifacts/production_evidence.json`.
  - `EvidenceRecord` gates: layout, timing-audio, semantic-events, sfx-mix, provenance-freshness (per-scene set + episode provenance-freshness).
  - `artifact_hashes` và `input_hashes` được đối chiếu trực tiếp với disk (tamper/stale → BLOCKED).
  - Checkpoint gate fail-closed (`lib/checkpoint.py` strict default on ambiguous, stamps consumed).
- **Mix Validation**:
  - `tools/qc/mix_validator.py` fail-closed: missing stem chưa khai báo → invalid.
  - Khai báo `no_sfx`, `sfx_expected: false`, `sfx_mode: "none"` hoặc `declared_not_measured` được xử lý trung thực; `music_masking` giữ nguyên báo `not_measured`.
- **Verified Validator Commands**:
  - Layout: `npm run validate:layout -- <spec>`
  - Semantic events: `npm run validate:events -- <spec>`
  - Timing: `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<dir>', mode='strict')"`
  - Mix: `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>`
  - Editorial-language gate (lane-conditional, editorial lane): `.venv/bin/python tools/qc/editorial_language_gate.py --project projects/<slug>` — auto-applies khi manifest khai báo `style_playbook == "editorial-explainer-manifest"` hoặc `lane == "news-editorial-motion"`, hoặc khi `project.json` khai báo `style_playbook == "editorial-explainer-manifest"` VÀ `pipeline_type == "animated-explainer"` (manifest khai báo editorial key nhưng `pipeline_type` khác `animated-explainer` ⇒ finding blocked `EL-LANE-MISMATCH`); project KHÔNG khai báo key editorial nào bị SKIP (exit 0, không findings, không evidence — KHÔNG phải pass), audit tường minh bằng `--force-editorial` (CLI dùng `--project`, khác có chủ đích với positional arg của `tools/qc/episode_gate.py`). Rules: R1 `contract-sections` (`speech_lock_contract`/`camera_rig`/`physics`/`global_overlays` phải present + non-empty); R2 `graphic-native-required` (mỗi content scene ≥1 GENUINE graphic-native layer: `document_cutout` / `data_viz` / `evidence_annotation`); R3 `photo-frame-dominance` (role-agnostic: MỌI layer role `hero` bị chặn bất kể method — intentional over-block, MINOR 15; và mọi photo layer — method `t2i` hoặc prompt/prompt_digest trúng lexicon photoreal `photo|dslr|render|realistic|cinematic` — có `transform` w×h phủ ≥ 0.85 canvas đều bị chặn BẤT KỂ role, exemption `background` texture-backplate chỉ áp dụng DƯỚI ngưỡng; dim/opacity không cứu); R4 `unresolved-anchor` (zero `anchor:` string leaf). Fail-closed: per-finding chỉ có `pass`/`blocked` (advisories ghi vào `warnings[]`, không bao giờ ảnh hưởng verdict); bất kỳ finding `blocked` ⇒ BLOCKED ⇒ không được compose — không có "PASS WITH WARNINGS" (§8.2). Exit codes: 0 = mọi finding pass, 1 = ≥1 blocked finding, 2 = invocation error. Evidence: `artifacts/editorial_language_evidence.json` + `qc/editorial_language.json` (hashed). Enforcement mode: gate được enforce CHỈ trong strict validation mode; legacy mode không enforce và KHÔNG BAO GIỜ thỏa production acceptance/checkpoint completion (compose phát CRITICAL WARNING). Declaration/manifest split: nếu project CÓ khai báo editorial trên một trong hai metadata surface (`style_playbook == "editorial-explainer-manifest"` hoặc `lane == "news-editorial-motion"`) nhưng manifest được resolve bị thiếu, gate BLOCKED `EL-MANIFEST-MISSING`; nếu manifest tồn tại nhưng unparseable, strict compose BLOCKED qua producer-crash path (`EL-MANIFEST-UNPARSEABLE`). Residue compose-side (đã verify trong `tools/video/video_compose.py`, MINOR 14): gate là LANGUAGE check đòi hỏi project TỰ KHAI BÁO — project không có metadata editorial ĐỌC ĐƯỢC thì KHÔNG bị gate ở compose và KHÔNG BAO GIỜ được tính là pass; nếu CẢ `scene_manifest.json` lẫn `project.json` không khả dụng ở strict compose — VẮNG MẶT hoặc có nhưng unparseable — compose phát WARNING to (nêu trạng thái từng file) và KHÔNG enforce gate ở lần compose đó (documented residue — audit bằng `--force-editorial`).
- **Consolidation Proposal**: Vẫn là PLAN-ONLY — không có tuyên bố vận hành operational.

### §7.1 Ngưỡng tách scene-file theo CC (quyết định owner 2026-11-09)

- **Episode > 5 scenes (tức 6 scenes trở lên) BẮT BUỘC tách source thành per-scene files**: `src/<slug>/scenes/S#.tsx` (mỗi scene một file).
- Mỗi scene file do một **CC writer riêng** viết và một **CC reviewer riêng** verify — theo đúng scene-isolated pattern của §7: `allowed_io` scope per scene, reviewer sandbox read-only, verdict-to-hash binding.
- **Điều kiện tiên quyết trước khi spawn bất kỳ writer nào**: `theme.ts` + `src/<slug>/lib/SceneShell.tsx` (design system, safe-zone helpers, subs) phải **FROZEN TRƯỚC**; props interface + packet schema lock từ đầu; giữ nguyên demo-first gate (1 scene được duyệt trước, rồi mới batch).
- Khi tách per-scene: `Episode.tsx` chỉ còn vai trò **assemble-only** (Sequence wiring + Audio + timing).
- **Episode ≤ 5 scenes**: giữ single-file `Episode.tsx` theo convention hiện tại.
- **Các lane đang chạy theo kiểu cũ KHÔNG retrofit giữa chừng** — rule chỉ áp dụng cho lane mới.

### §7 Changelog
- 2026-11-08: +§7 scene-isolated production team, packet ownership/freeze/reviewer independence và CLI enforcement P1.3.
- 2026-11-09: Cập nhật P1.4 operational scene orchestrator CLI, phân định rõ ràng mechanical vs prompt-level ownership, runner status honesty (subprocess verified, daemon partially proven), episode gate codes, compose strict evidence requirements.
- 2026-11-09: +§7.1 ngưỡng tách scene-file theo CC (quyết định owner 2026-11-09): episode >5 scenes bắt buộc per-scene files `src/<slug>/scenes/S#.tsx` với writer/reviewer CC riêng per scene (allowed_io scope per scene, reviewer sandbox read-only, verdict-to-hash binding); freeze `theme.ts` + `src/<slug>/lib/SceneShell.tsx` + lock props interface/packet schema trước khi spawn writer; demo-first gate giữ nguyên; `Episode.tsx` assemble-only; ≤5 scenes giữ single-file `Episode.tsx`; không retrofit lane đang chạy.
- 2026-11-10: +editorial-language pre-render gate (lane-conditional pool LANE_CONDITIONAL_PRE_RENDER_SCENE_GATES; R1-R4; producer tools/qc/editorial_language_gate.py; fail-closed; hashed evidence)

### §7 Enforcement boundaries and operational reality
- Scheduler đã có code và hoạt động thực tế qua `tools/qc/scene_orchestrator.py` (không còn là prose-only).
- Reviewer sandbox-copy ngăn tuyệt đối reviewer sửa canonical tree (`reviewer_canonical_mutation`).
- Writer scope diff ngăn tuyệt đối writer sửa ngoài scene packet / scene dir (`writer_scope_violation`), fail-closed khi scene discovery rỗng, và `io_operations` được nối vào `episode_gate.py` và `scene_orchestrator.py`.
- Episode visual continuity checker chưa triển khai; continuity checks defer.
- ENS mapping: leader/director mỏng; worker = scene writer; reviewer = independent reviewer. `.claude/agents/` là synced mirror của contract này — không phải legacy reference tự trị; sync order đầy đủ xem §8.5 (ENS primary → mirrors; Claude-Code standalone = legacy/secondary).

### §7.2 Scene-file provenance enforcement + transport-glitch retry (postmortem 2026-11-11, tin-nong-3tin-20261110)
- `episode_gate.py` giờ bind trực tiếp MỖI file `scene/*.tsx` (scene-isolated lane) với reviewer verdict: thiếu packet → `scene_provenance_missing`; verdict ≠ approved → `scene_provenance_not_approved`; verdict không bind file → `scene_provenance_unbound`; file đổi sau review (hash lệch `reviewed_hashes`) → `scene_provenance_stale`. Lane single-file (không có `scene/`) không bị ảnh hưởng.
- `scene_orchestrator.py`: CC chết âm thầm (exit 0 nhưng stdout rỗng, hoặc lỗi streaming 'No tool call found for function call output') giờ là attempt FAIL có retry với instance mới — trước đây được tính thành công và đốt attempt downstream. Timeout subprocess 120s → 900s (CC thật chạy 176–495s/scene).
- Dispatch CC thủ công: dùng `tools/cc_dispatch.sh` (retry 1 lần khi glitch, exit ≠ 0 khi CC vẫn hỏng hoặc max-turns).

## §8. Production contract — phases, strict success, freeze, legacy compat, publication (2026-11-09)

### §8.1 Bảy phase bắt buộc của mọi production
Mọi production, mọi pipeline, đi qua đủ 7 phase sau. Stage list của từng pipeline (`pipeline_defs/*.yaml`) là mapping của các phase này — stage có thể gộp hoặc thêm phase domain-riêng (rig, localization, research, real_capture, …), nhưng không phase nào dưới đây được bỏ qua:

1. **Brief/Script/Facts** — brief/script + facts được chốt và freeze (research_brief, script, scene_plan; facts có nguồn, không bịa).
2. **Actual audio + alignment** — narration/audio THẬT đã sinh + alignment (word timestamps) đo từ audio thật; planned duration không bao giờ được dùng thay measured duration.
3. **Sealed scene packets** — khi production dùng scene-packet workflow: packet được seal kèm frozen inputs (SHA-256) trước khi writer/reviewer chạy.
4. **Scene author/review** — fresh writer + separate fresh reviewer độc lập (§7); verdict bind `reviewed_hashes`.
5. **Integration** — chỉ tích hợp output đã accepted; packet coverage diff đối chiếu `scene_manifest.scenes` + `edit_decisions.cuts` fail-closed (`scene_packet_missing` / `scene_packet_extra` / `stale_packet`).
6. **Final render/mix review** — compose strict + 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) + mix validation; editorial lane (`style_playbook` `editorial-explainer-manifest` / `lane` `news-editorial-motion`) thêm gate editorial-language (§7) thành gate thứ 6 — lane-conditional pool, không thuộc canonical 5, fail-closed như mọi gate khác; số liệu bổ sung review bằng mắt/tai, không thay thế.
7. **Delivery** — publish/delivery là phase riêng với authorization riêng (§8.4), không phải hệ quả tự động của phase 6.

### §8.2 Strict success semantics
Completion chỉ hợp lệ khi đồng thời có đủ: applicable gate identities, exact scene/cut set, stage scope, evidence files TỒN TẠI trên disk, bound revisions, và detector measurements thật. `revise`, `blocked`, thiếu evidence, hoặc measurement bắt buộc ở trạng thái `not_measured` **KHÔNG BAO GIỜ** được ghi nhận/upgrade thành completion.
- Schema-valid ≠ đã đo (§1): report schema-valid không phải bằng chứng detector đã chạy hay ảnh/audio đã được inspect.
- Not-applicable phải được KHAI BÁO tường minh (ví dụ `no_sfx: true`, `sfx_mode: "none"`, `declared_not_measured` được xử lý trung thực bởi mix_validator); thiếu measurement bắt buộc không được ngụy trang thành not-applicable.
- Prompt-level loop caps (max revisions/send-backs của director skills) KHÔNG được dùng để override mechanical gate fail: gate fail-closed là `blocked`, không phải "PASS WITH WARNINGS".

### §8.3 Dependency freeze policy
Freeze mọi dependency liên quan đến verdict/render: facts/script, toàn bộ narration/music/SFX, renderer-staged copies (`remotion-composer/public/…`), alignment/config, scene/composition/shared code, layout contracts, events, assets, renderer parameters.
Mọi mutation sau freeze → mọi verdict/render phụ thuộc trở nên STALE: bắt buộc re-review/re-render, cấm reuse verdict/hash cũ. Cơ chế hiện có: `stale_packet` (episode_gate so hash narration hiện tại vs packet), provenance-freshness + `artifact_hashes`/`input_hashes` đối chiếu disk (production_validation — tamper/stale → BLOCKED), timing re-lock per-cut + manifest-vs-file + total-duration (lib/timing_validator). Re-TTS → chạy `tools/audio/refresh_manifest.py` rồi re-lock cuts trước khi advance.

### §8.4 Legacy compat + publication separation
- **Legacy compat policy:** artifact/checkpoint lịch sử vẫn đọc được qua compat path — `validation_mode="legacy"` phải được KHAI BÁO tường minh trong checkpoint metadata hoặc project marker (`project.json`); resolve_validation_mode mặc định `strict` cho production mới. Chế độ legacy/historical **không tự động authorize production mới** — legacy chỉ hợp lệ cho đọc/fixture/điều tra lịch sử.
- **Publication/delivery separation:** render acceptance (QC PASS ở compose/publish checkpoint) **KHÔNG** phải publish authorization. Publish/upload/registration là quyết định riêng, explicit, của owner; không có cơ chế tự động publish nào dựa trên QC PASS. Delivery bundle theo AGENT_GUIDE.md vẫn là ràng buộc riêng của delivery, không đổi.

### §8.5 Sync order (single authority)
- **ENS repo = authority chính**: hợp đồng production/team nằm tại file này.
- `.claude/agents/*`, `.claude/prompts/om_team_leader_prompt.md`, `skills/pipelines/*/*.md`, `pipeline_defs/*.yaml` = **synced mirrors** — sửa contract TẠI ĐÂY rồi sync sang mirror; mirror không tự đặt ra authority đối lập, và khi mâu thuẫn thì doctrine thắng.
- **Claude-Code standalone** (§0/§0b) = legacy/secondary path: giữ cho chạy độc lập khi ENS không khả dụng; không phải default. Quy tắc đồng bộ: sửa doctrine → sync mirrors (một chiều ENS → mirrors) → mirror-side Hermes sync từ doctrine, không edit ngược trực tiếp.
- **Ngoại lệ điều chỉnh mirror-side-first (reconciliation exception)**: sửa đổi phía mirror trước chỉ được phép khi phía canonical sau cùng kết thúc byte-identical với mirror; BẮT BUỘC ghi nhận cả hai sha256 trong inventory `duplicate_audit.reconciled`; mọi lần điều chỉnh/đồng bộ tương lai bắt buộc đi qua canonical file.

### §8.6 Render path + delivery smoke (postmortem 2026-11-11, tin-nong-3tin-20261110)
- **Render đường duy nhất: `tools/qc/render_episode.py`** — chạy `episode_gate` TRƯỚC khi render (FAIL ⇒ refuse; override từng code qua `--override-codes` được ghi log, không tắt lặng), bỏ qua render khi input hash không đổi và output tồn tại (chống render lặp), ffprobe smoke SAU render (bắt lỗi mastering kiểu `-vn` mất video track).
- **Gọi thẳng `npx remotion render` = bypass gate, cấm.** Đây là lỗ hổng thực tế của lane 2026-11-10: gate FAIL nhưng render tay vẫn chạy 5 lần.
- **Canvas một episode = một kích thước**: mọi composition của cùng episode (kể cả DRAFT HUD) phải cùng width×height — `composition_dims_mismatch` chặn đúng lỗi DRAFT 720×1280 render layout thiết kế 1080×1920 (tràn phải toàn scene, sống sót qua 5 render + QC tới khi owner nhìn thấy). DRAFT HUD render tại canvas FINAL (1080×1920).
- **Pre-DM smoke bắt buộc**: `tools/qc/render_episode.py --check-file <mp4>` (video stream + audio + duration) exit 0 MỚI được gửi owner/upload. Bắt trường hợp msg-650: master `-vn` chỉ còn tiếng vẫn bị DM.

