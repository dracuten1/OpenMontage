# Publish Director - Animation Pipeline

**REQUIRED owner delivery contract:** Follow `AGENT_GUIDE.md` **Thumbnail-as-Scene-1 Contract (SSOT)**. Thumbnail KHÔNG gửi file riêng nữa, mà được thiết kế trực tiếp làm Scene 1 (Thumbnail Card + Hook) của video (frame đầu `t=0` làm poster cover, kèm lời đọc hook), sau đó mới tới nội dung chi tiết. Gói bàn giao chỉ gồm: Video (draft HUD / final sạch) + Copyable description (không gửi thumbnail riêng). Preserve approval gates and manual upload, no auto-post.

## When To Use

Package the animation so the metadata, thumbnail concept, and platform framing reflect the actual visual system of the project.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/publish_log.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["compose"]["render_report"]`, `state.artifacts["proposal"]["proposal_packet"]`, `state.artifacts["research"]["research_brief"]`, `state.artifacts["script"]["script"]` | Final outputs and topic framing |
| Playbook | Active style playbook | Visual naming consistency |

## Process

### 1. Match Packaging To The Animation Mode

Examples:

- diagram-heavy videos should look structured and legible,
- kinetic-type pieces should package around strong copy,
- illustrative animation should package around hero imagery.

### 2. Preserve Visual-System Truth

Store in `publish_log.metadata`:

- `animation_mode`
- `hero_frame_notes`
- `thumbnail_concept`
- `platform_notes`

### 3. Quality Gate

- metadata fits the actual animation mode,
- thumbnail concept matches the final visual system,
- exports are labeled by purpose and platform,
- the package is usable without extra manual work.

## Common Pitfalls

- Writing generic metadata that ignores the animation style.
- Creating a thumbnail concept unrelated to the final frames.
- Mixing platform variants without clear labels.

---

## Gate Reminder (Binding)

This stage gates on human approval (`human_approval_default: true`). After review passes:
checkpoint with `status="awaiting_human"`, present the summary (the Backlot board renders
the artifact), and **END YOUR TURN**. Do not start the next stage in the same response.
Approval is per-gate — an earlier "go ahead" does not cover this gate.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (v3.0 Antigravity-native authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed inputs & visual prep; scene author/review; integration & pre-render gates; final render/mix review; delivery. Domain-specific phases (rig, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Source photo verification (when real/archival photos exist): `.venv/bin/python tools/qc/source_photo_gate.py --project projects/<slug>`.
- Fact whitelist check (Research v2 episodes): `.venv/bin/python tools/qc/fact_whitelist_gate.py --project projects/<slug>`.
- Editorial-language check (news-editorial-motion lane): `.venv/bin/python tools/qc/editorial_language_gate.py --project projects/<slug>`.
- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate` (strict mode default).
- Remotion layout/events validators (when rendering via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared.
- Antigravity episode gate & guarded render: `.venv/bin/python tools/qc/episode_gate.py projects/<slug> --mode agy`, then `.venv/bin/python tools/qc/render_episode.py <comp-id> <out.mp4> --agy` (never raw `npx remotion render`).

Strict success semantics (doctrine §6.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§6.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Publication separation (§6.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires explicit owner authorization.
