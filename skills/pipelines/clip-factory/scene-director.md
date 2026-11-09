# Scene Director - Clip Factory Pipeline

## When To Use

You are planning how each selected clip will be framed and packaged for its destination platform. This is where clip viability gets proven or disproven.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/scene_plan.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["script"]["script"]`, `state.artifacts["idea"]["brief"]` | Selected clips and platform goals |
| Tools | `frame_sampler`, `scene_detect` | Visual checks and boundary inspection |
| Playbook | Active style playbook | Layout language and safe zones |

## Process

### 1. Choose The Right Frame For Each Clip

Do not default every clip to `9:16`.

Use:

- `9:16` when a face-first crop works,
- `1:1` when speaker plus context both matter,
- `16:9` when slides, demos, or multi-speaker width are essential.

OpenMontage does not yet have first-class auto-reframe. If a vertical crop is weak, plan a safer aspect ratio instead of pretending the crop will work.

### 2. Plan First-Second Composition

For each clip, define:

- what the viewer sees on frame 1,
- where hook text can safely appear,
- where subtitles can live,
- whether the speaker needs a punch-in or whether the original framing is already good.

### 3. Standardize The Batch

Use the scene plan to lock series consistency:

- same top hook zone,
- same subtitle zone,
- same watermark / brand area,
- same lower-third logic.

### 4. Store Reframe Detail In Metadata

The schema is generic, so store richer layout notes in `scene_plan.metadata`.

Recommended metadata keys:

- `clip_layouts`
- `safe_zones`
- `crop_variants`
- `speaker_positions`
- `platform_variants`

### 5. Use Scenes To Represent Deliverables

Each scene should map to one clip variant or one clip family deliverable. Keep `description` human-readable and use `required_assets` for hook overlays, lower thirds, or branded frames.

### 6. Quality Gate

- every clip has a platform-aware framing plan,
- hook and subtitle zones do not collide,
- weak vertical crops are downgraded honestly,
- the batch will feel visually consistent when rendered together.

## Common Pitfalls

- Center-cropping a wide shot and calling it vertical optimization.
- Ignoring slide or screen-share content while focusing only on faces.
- Letting each clip invent its own layout.
- Forgetting that the first frame determines whether a viewer keeps watching.

---

## Gate Reminder (Binding)

This stage gates on human approval (`human_approval_default: true`). After review passes:
checkpoint with `status="awaiting_human"`, present the summary (the Backlot board renders
the artifact), and **END YOUR TURN**. Do not start the next stage in the same response.
Approval is per-gate — an earlier "go ahead" does not cover this gate.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
