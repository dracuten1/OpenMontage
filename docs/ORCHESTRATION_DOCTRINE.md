# OpenMontage Orchestration Doctrine (v3.0 — Antigravity-Native)

<!-- Machine-readable contract metadata (compact pointer; human prose below is authoritative) -->
```json
{
  "contract": "openmontage-orchestration-doctrine",
  "contract_version": "3.0",
  "last_sync": "2026-11-22",
  "source_of_truth": "docs/ORCHESTRATION_DOCTRINE.md",
  "runtime": "antigravity-agy-cli",
  "sync_order": {
    "primary": "docs/ORCHESTRATION_DOCTRINE.md",
    "synced_mirrors": ["skills/pipelines/*/*.md", "pipeline_defs/*.yaml"]
  },
  "required_phases": [
    "brief_script_facts",
    "actual_audio_alignment",
    "sealed_scene_packets",
    "scene_author_review",
    "integration",
    "final_render_mix_review",
    "delivery"
  ],
  "success_semantics": "strict",
  "publication_policy": "delivery_separate_from_render_acceptance"
}
```

Owner: Tuyên (dracuten1).
Ngôn ngữ: Việt — kỹ thuật giữ nguyên thuật ngữ Anh.

Đây là hợp đồng orchestration cho mọi production OpenMontage chạy trên **Antigravity / `agy` CLI**. File này là authority duy nhất; `skills/pipelines/*/*.md` và `pipeline_defs/*.yaml` là synced mirrors phục tùng hợp đồng này.

---

## §1. Antigravity / `agy` CLI Execution Model

Antigravity tự cung cấp native subagents (`invoke_subagent`), orchestration workflows (`run_workflow`), terminal execution (`run_command`), và native multimodal Vision (`read_file` trên PNG/MP4). Không dùng Claude Code (`cc_wrapper`), `tmux`, hoặc Hermes wrapper.

### Chiến lược điều phối theo độ dài tập
- **Tập ngắn (≤ 5 scenes):** Single-session Antigravity hoặc 1 `Episode.tsx` sạch trong `remotion-composer/src/<slug>/`, chia 3 nhịp rõ ràng: (1) Plan + Research v2 + TTS Probe, (2) Assets + Audio Alignment + Photo/Whitelist Prep, (3) Scene Authoring + Mechanical QC Gates + Render.
- **Tập dài (> 5 scenes — từ 6 scenes trở lên):**
  1. Bắt buộc tách source per-scene: `remotion-composer/src/<slug>/scenes/S01.tsx`, `S02.tsx`, ... (`S{NN}.tsx`), với `Episode.tsx` chỉ làm nhiệm vụ assemble `<Sequence>` + audio + captions.
  2. Freeze `remotion-composer/src/components/news/theme.ts`, `SceneShell.tsx`, `timing.ts`, và `artifacts/fact_whitelist.json` **trước** khi sinh scene.
  3. Dùng `invoke_subagent` (hoặc `run_workflow`) để phân tán authoring theo scene/batch và chạy một independent reviewer subagent riêng kiểm tra code/layout/frame PNG trước khi merge.
  4. **Disk-as-State:** Mọi stage/subagent ghi artifact chuẩn vào `projects/<slug>/` và source vào `remotion-composer/src/<slug>/`, trả báo cáo ngắn gọn cho coordinator để tránh context bloat.

---

## §2. Probe Gates Bắt Buộc (A / B / C)

Schema-valid ≠ production-correct. Ba probe gate sau là bắt buộc:

- **Gate A — TTS Probe (cuối Script / đầu Assets):**
  1. Chọn 2–3 thuật ngữ rủi ro nhất (tên riêng, viết tắt, số lớn) từ `tts_lexicon.json` / `fact_table.narration_form`.
  2. Sinh audio thử qua TTS tool (`vieneu_tts.py` / selected TTS), ASR lại bằng `faster-whisper`.
  3. Khớp ngữ âm → tiếp tục batch TTS. Lệch → sửa `narration_form` / `tts_lexicon.json` rồi probe lại.
- **Gate B — Still Frame Vision Probe (trước khi render full):**
  1. Render frame đại diện cho scene dày chữ / dữ liệu nhất (và scene ảnh `ArchivalSpotlight` nếu có) bằng `npx remotion still <CompId> /tmp/probe.png --frame=<frame>`.
  2. Dùng Antigravity `read_file` inspect ảnh PNG trực tiếp: kiểm tra Warm Archival Print palette (`#F4EFE6` / `#141413`), dấu tiếng Việt `Source Serif 4`, thanh phụ đề hiển thị rõ trong dải `y=1480..1600`, không tràn Safe Zone v3.2, không đè sub, không neon glow; với chân dung dọc trong `ArchivalSpotlight`, dùng `objectPosition="center 24%"` và `quoteEnterFrame <= 60` để không crop mặt hoặc ẩn pull-quote.
  3. PASS mới chạy full render via `tools/qc/render_episode.py`.
- **Gate C — Final Verify (sau render, trước khi bàn giao):**
  1. Chạy `.venv/bin/python tools/qc/gate_c_verify.py --project projects/<slug>` (chạy `--check-file`, `ffprobe`, `ebur128`, trích 5 frame spotcheck, và `faster-whisper` speech-bounded `-t scenes_seconds` + `vad_filter=True` để tránh outro bumper music gây ảo giác).
  2. Inspect trực tiếp các frame đã trích bằng `read_file` và đối chiếu `|actual_duration - target_duration| <= 0.5s`.

---

## §3. Chính Sách Thuật Ngữ Nước Ngoài Trong TTS

- **(a) Tên Anh nguyên văn** cho thuật ngữ quốc tế/brand phổ biến (`GPU`, `VRAM`, `API`) nếu `vieneu` đọc chuẩn.
- **(b) Phiên âm Việt trong `tts_lexicon.json` / `narration_form`** khi viết tắt dễ đọc sai (`VRAM→Vê-ram`). Display trên màn hình giữ nguyên văn theo `fact_table.display_string`; narration đọc theo `narration_form`.
- **(c) Việt hóa hoàn toàn** chỉ khi slide/card trên màn hình cũng dùng tiếng Việt (`chuyên gia` trên màn hình + `chuyên gia` trong audio).
- **Rule vàng:** Display và narration **không được mâu thuẫn** (cấm hiện `"Expert"` trên màn hình mà đọc `"chuyên gia"`).

---

## §4. Personal Visual Theme — Warm Archival Print (Anti-AI)

Mọi video news/explainer tuân thủ thẩm mỹ **Warm Archival Print / Broadsheet** (`styles/archival-editorial.yaml`, SSOT code `remotion-composer/src/components/news/theme.ts`):

1. **Bảng màu & Typography:**
   - Nền giấy archival `#F4EFE6`, bề mặt card `#FAF7F2` / `#EFE8DB`, mực in `#141413`, chữ phụ `#5A554E`.
   - Điểm nhấn tiết chế: Đỏ son `#C8281E` (vermilion) và Vàng đất `#A87308` (ochre); highlight dùng nền bút nhớ `#F3D34A` sau chữ tối `#141413`.
   - Headline dùng `Source Serif 4`, nội dung `Be Vietnam Pro`, dữ liệu/kicker/stamp dùng `JetBrains Mono`.
   - **Cấm tuyệt đối:** Nền dark-slate gradient AI, `textShadow`/`boxShadow` neon glow, card glassmorphism bo tròn 999px, bullet slide thuần chữ.
2. **Hệ thống component chuẩn (`remotion-composer/src/components/`):**
   - `news/`: `SceneShell`, `ArchivalPaperBackdrop`, `HeroTitle`, `CaptionLayer`, `KickerPill`, `SourceBadge`, `AiBadge`, `SimulationBadge`, `ArchiveLabelBadge`, `PhotoCreditBadge`, `VerdictStamp`, `HighlightBar`, `CtaBand`, outro `<BrandBumper />`.
   - `editorial/`: `EditorialMap`, `ArchivalSpotlight`, `FlowTimeline`, `ComparisonSplit`.
   - `charts/`: `EditorialBarChart`, `EditorialLineChart`.
   - **Captions binding rule:** `Episode.tsx` BẮT BUỘC import `captions.json` tĩnh (`import captionsData from "../../public/<slug>/captions.json"`) — tuyệt đối không dùng `delayRender() + fetch()` gán vào biến `let` ngoài React state (gây mất phụ đề khi render).
3. **Hook & Thumbnail-as-Scene-1:**
   - Frame `t = 0` của `S01` là Cover Thumbnail + Hook. Mở thẳng vào stakes/contrast + visual proof (map/chart/archival cutout).
   - `<BrandBumper />` **CHỈ đặt ở outro cuối tập** (`BRAND_BUMPER_FRAMES = 90`), không bao giờ đặt ở `from={0}`.
4. **Blender 3D Illustration Policy:**
   - Khuyến khích dùng Blender MCP (`blender-*`, `3d-asset-generation`) cho các cảnh minh họa không gian/kỹ thuật/hạ tầng hoặc bumper chuyên biệt khi 2D không diễn tả đủ chiều sâu.
   - Lighting và material phải theo phong cách **matte architectural maquette / clay / archival paper** hài hòa với `#F4EFE6`, gắn badge `SimulationBadge` (`MÔ PHỎNG 3D`), không bao giờ dùng nhựa bóng neon hoặc gắn nhãn tên tool `BLENDER`.
5. **hexpix Focal Visuals:** Khi dùng AI image làm nền tương tác cho TSX overlay hoặc sprite động theo path, sử dụng `scripts/hexpix_decode.py` / `scripts/hexpix_extract.py` (OpenCV H `0–179` = độ/2) kết hợp I2I cleanup.

---

## §5. Research v2 & Closed Fact Whitelist

Mọi tập news/explainer đi qua **Research v2** (`skills/pipelines/explainer/research-director.md`):
- Stable event IDs `EV-1..EV-n`, `freshness_anchor`, và `scene_count_exact` cố định.
- Per-event **5-Angle Matrix** (`macro-policy`, `personal-money`, `mechanism-cause`, `timeline`, `affected-people`).
- **Ranked Hook Candidates** chấm điểm 0–5 trên 5 trục (`scale`, `personal_stakes`, `shock_novelty`, `contrast`, `relatability`) trừ `fragility_penalty (-1..-3)`, mỗi điểm phải gắn `fact_id` thật.
- **Single Closed Fact Whitelist** (`artifacts/fact_whitelist.json` hoặc bảng `fact_table` trong `research/research_brief.md`) + `banned_strings`, được kiểm soát cơ học bằng `tools/qc/fact_whitelist_gate.py`.

---

## §6. Bảy Phase Bắt Buộc & Cổng Cơ Học (Strict Success Semantics)

### §6.1 Bảy phase bắt buộc
1. **Brief / Script / Facts** — chốt `research_brief`, `proposal_packet`, `script`, `scene_plan` / `scene_manifest.json`, và freeze `fact_whitelist`.
2. **Actual audio + alignment** — sinh TTS thật (`tts_selector` / `vieneu_tts.py`), chạy Whisper alignment lấy `words.json` và `narration_words.json`; mọi `trigger_frame` / `start_frame` re-lock theo từ nói thật (`±0.3s`).
3. **Sealed inputs & Visual prep** — kiểm tra ảnh thật qua `tools/qc/source_photo_gate.py`, pre-mix stems qua `tools/qc/mixdown.py --from-stems`.
4. **Scene author & independent review** — author `S01.tsx..Snn.tsx` (hoặc `Episode.tsx` nếu ≤5 scenes), tự kiểm `npx tsc --noEmit`, `npm run validate:layout`, `npm run validate:events`, và Gate B vision check.
5. **Integration & Pre-render gates** — chạy đầy đủ các gate fail-closed trước render.
6. **Final render / mix review** — render duy nhất qua `tools/qc/render_episode.py`, mux master stems qua `mixdown.py --mux-only`, kiểm tra Gate C.
7. **Delivery** — đóng gói Video + Copyable description theo `AGENT_GUIDE.md`; quyết định publish/upload thuộc về owner tách biệt khỏi QC PASS (§6.4).

### §6.2 Strict success semantics
Hoàn thành chỉ hợp lệ khi có đủ gate identity, exact scene set, evidence file tồn tại trên disk, và kết quả đo thật từ detector/gate. `revise`, `blocked`, hoặc thiếu measurement ở trạng thái `not_measured` **KHÔNG BAO GIỜ** được nâng cấp thành `"PASS WITH WARNINGS"`. Mọi `not-applicable` (như `no_sfx: true`) phải khai báo tường minh.

### §6.3 Dependency freeze
Mọi thay đổi trên facts, narration WAV, word alignment, shared theme/SceneShell, hoặc asset sau khi lock đều làm verdict cũ thành stale — bắt buộc chạy lại `tools/audio/refresh_manifest.py` (nếu đổi TTS), re-lock timing, và re-run gates.

### §6.4 Render path, gates & publication separation
- **Đường render duy nhất:** `.venv/bin/python tools/qc/render_episode.py <comp-id> <out.mp4> --agy` (tự động gọi `episode_gate.py` trước khi render và `ffprobe` smoke check sau render). Cấm gọi trực tiếp `npx remotion render` để bypass gate.
- **Các gate cơ học đã verify trong repo:**
  - Source photos: `.venv/bin/python tools/qc/source_photo_gate.py --project projects/<slug>`
  - Fact whitelist: `.venv/bin/python tools/qc/fact_whitelist_gate.py --project projects/<slug>`
  - Editorial language (editorial lane): `.venv/bin/python tools/qc/editorial_language_gate.py --project projects/<slug>`
  - Timing re-lock: `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('projects/<slug>', mode='strict')"`
  - Mix validation: `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>`
  - Episode gate (Antigravity mode): `.venv/bin/python tools/qc/episode_gate.py projects/<slug> --mode agy`
  - Remotion layout/events: `npm run validate:layout -- <spec>` và `npm run validate:events -- <spec>` trong `remotion-composer/`
  - Pre-DM smoke: `.venv/bin/python tools/qc/render_episode.py --check-file <mp4>`
  - Gate C bundle check: `.venv/bin/python tools/qc/gate_c_verify.py --project projects/<slug>` (speech-bounded `faster-whisper` với `vad_filter=True` + `ffprobe` + `ebur128` + 5 frame PNG)
- **Override discipline:** Các mã provenance/editorial/fact-whitelist/source-photo nằm trong `NON_OVERRIDABLE_CODES` của `tools/qc/render_episode.py` — không thể bypass.
- **Publication separation:** QC PASS ở compose không tự động cho phép đăng bài; mọi upload/publish cần owner duyệt riêng.
