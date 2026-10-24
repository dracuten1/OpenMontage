# S1a PLAN — thanh-giong (VN-Myth S2E02 — Season 2 "NHỮNG VỊ THẦN Ở LẠI", tập 2)

Bạn là stage-worker chạy một phiên Claude Code print mode trong repo OpenMontage. **Đọc `AGENT_GUIDE.md` (chỉ mục cần thiết) và `NOTES.local.md` (Owner's standing production rules) TRƯỚC KHI làm gì.**

## STATE (verified by Hermes, 2026-10-17 — ĐỪNG re-verify, ĐỪNG re-audit)

- Project: `projects/thanh-giong/` — `project.json` (pipeline_type `animated-explainer`, playbook `ink-genome`), `research_digest.json` (SEALED by Hermes — SSOT nội dung, sealed từ sources/07-thanh-giong.md), `artifacts/research_brief.json` (VALID + checkpoint research completed), `tts_lexicon.json`, `assets/reference/f07-hung-vuong.png` (reuse silhouette Hùng Vương S1), `decision_log.json` (d-000..d-003).
- Research ĐÃ XONG — KHÔNG đọc web, KHÔNG search, KHÔNG research thêm. Mọi claim/chỉ lấy từ `research_digest.json`.
- Full-run authorization ghi d-000 (owner dispatch 2026-10-17): self-review + viết artifact; Hermes (lead) audit + checkpoint sau.
- S2E01 (Sơn Tinh – Thủy Tinh) đã hoàn thành + approved — đây là tập 2 Season 2, KHÔNG phải pilot nữa nhưng giữ chuẩn như pilot.

## TASK — 1 artifact: proposal_packet.json (KHÔNG làm script/scene_plan — session sau)

### 1. proposal (viết `artifacts/proposal_packet.json`)
- Đọc `research_digest.json` + format mẫu `scripts/spec_proposal_format_sample.json` (giữ đúng keys/types; nội dung viết mới).
- 3 concept_options; selected = concept đi theo digest `target_structure` + 5 góc kể `angles_discovered` (hook "tiếng nói đầu tiên là lời xin vũ khí" → climax trả lời theo trục diễn giải); rationale nêu đúng tinh thần mùa S2 "Những vị thần ở lại": mở từ thứ khán giả GẶP HÔM NAY (trống hội làng, mâm cỗ, hạt gạo, đền) đi ngược vào thần thoại; kể qua VẬT THỂ (hạt gạo/nong/tre/đền), KHÔNG DNA.
- production_plan.stages: các stage animated-explainer (research→proposal→script→scene_plan→assets→edit→compose→publish); renderer_family `explainer-data`, render_runtime `remotion`, composition_mode `atelier` (continuation S2E01 Ep.06 engine). music_source: REUSE 'Mesmerize' — Kevin MacLeod (incompetech.com), CC BY 4.0 (d-001, track đã QC ở S2E01, license cho phép tái sử dụng có credit). voice_selection: vieneu v3 Turbo default news.
- cost_estimate: total 0.0 (budget $0, 9router free images); approval.status `approved` + user_notes ghi d-000 dispatch.
- metadata: series vn-myth, season 2, episode S2E02, target_duration_seconds 870, sections 28–31, narration_words_target 3650 (range 3.400–3.900), canon_established_this_episode "S2-C2" (sức mạnh anh hùng = cả làng nuôi lớn — hạt gạo nhiều nhà), speech_lock note.

## CONSTRAINTS phiên
- Read whitelist ≤6: AGENT_GUIDE.md (mục lục), NOTES.local.md, research_digest.json, tts_lexicon.json, scripts/spec_proposal_format_sample.json, (chỉ nếu validate lỗi) schemas/artifacts/proposal_packet.schema.json. KHÔNG đọc artifacts project khác.
- Không TodoWrite. Không verify-loop; viết xong validate 1 lần bằng script file (viết `projects/thanh-giong/scripts/_validate_prop.py` rồi `.venv/bin/python` chạy — KHÔNG dùng `python -c`):
  import json, sys; sys.path.insert(0, '.'); from schemas.artifacts import validate_artifact; d = json.load(open('projects/thanh-giong/artifacts/proposal_packet.json')); validate_artifact('proposal_packet', d); print('VALID')
- Checkpoint do HERMES viết sau audit — KHÔNG viết checkpoint.
- Budget $0. Không gen ảnh, không TTS trong session này.
- Nếu thiếu evidence cho ý nào → bỏ ý đó, KHÔNG bịa.

## OUTPUT CUỐI (report ≤6 dòng)
1. proposal: concept chọn + lý do 1 câu. 2. Đối chiếu: 3 concept khác nhau ở đâu (structure/hook/visual). 3. Whitelist check: concept có số nào ngoài legend không? 4. Anti-rule self-check pass? 5. Blocker (nếu có).
