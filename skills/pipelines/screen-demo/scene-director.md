# Scene Director - Screen Demo Pipeline

## When To Use

You are planning how the viewer's attention moves through an existing screen capture. The source video already exists; your job is to decide when to stay wide, when to crop in, and when to add minimal guidance.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/scene_plan.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["script"]["script"]`, `state.artifacts["idea"]["brief"]` | Script timing and source notes |
| Tools | `frame_sampler`, `scene_detect` | Extract reference frames and transitions |
| Playbook | Active style playbook | Overlay style and pacing rules |

## Process

### 1. Plan Attention, Not Constant Motion

Modern screen-demo tools converge on click-led zoom because it reduces random camera motion. Use that principle here:

- zoom when the viewer truly needs help reading or locating something,
- stay steady during comprehension,
- zoom manually when the key event has no click anchor,
- reset to a wider context between major steps.

Use `frame_sampler` for exact reference frames around each key action and store detailed crop notes in `scene_plan.metadata`.

### 2. Choose Scene Shapes

Use simple scene types that match the schema:

- `screen_recording` for live UI capture sections
- `text_card` for step labels, title cards, or recap slides
- `diagram` only when the UI alone cannot explain the concept
- `transition` sparingly between major workflow phases

### 3. Plan Crop Strategy In Metadata

The schema does not have first-class zoom objects, so keep the scene descriptions concise and place the detailed crop plan in `scene_plan.metadata.crop_regions`.

Recommended `crop_regions` fields:

- `section_id`
- `start_seconds`
- `end_seconds`
- `region`
- `zoom_level`
- `trigger` (`click_cluster`, `typing`, `result`, `manual_focus`)
- `transition_duration`
- `rationale`

Useful heuristics:

| UI Element | Zoom Level | Region Sizing | Notes |
|------------|-----------|---------------|-------|
| Terminal / code | 1.5-2.2x | keep enough surrounding context to orient the viewer |
| Small button / icon | 2.0-3.0x | show padding so the viewer knows where it lives |
| Modal / dialog | 1.4-2.0x | capture the full modal, not a partial crop |
| Full-page result | 1.0-1.3x | show more context before zooming again |

### 4. Plan Callouts With Restraint

Document overlay needs in `required_assets` and `metadata.callout_plan`.

Use only the patterns that clarify the action:

- `highlight_box`
- `arrow`
- `step_label`
- `keystroke_badge`
- `blur_mask`

Rules:

- no more than two attention cues at once,
- show the cue just before the action,
- remove it quickly after the action,
- prefer highlight or zoom; do not stack both unless readability truly demands it.

### 5. Plan Speed Treatment

Mark repetitive segments as either:

- `speed_up`
- `cut`
- `realtime`

Useful visual treatments for sped-up sections:

- progress label,
- small status text,
- simple dissolve over the removed wait.

Do not invent flashy transition behavior for installs, builds, or long typing stretches.

### 6. Choose Aspect Ratio Per Segment

If the whole project targets multiple outputs, note in metadata which scene crops are viable for:

- `16:9`
- `1:1`
- `9:16`

If a step cannot survive vertical, say so. The correct answer is sometimes to ship landscape only or create a separate simplified vertical cut.

### 7. Quality Gate

**Zoom coherence:**
- [ ] motion is intentional, not constant
- [ ] every zoom exists for legibility or orientation
- [ ] every major section gets a wider re-establishing view
- [ ] crops do not cut off the relevant text or control

**Callout coherence:**
- [ ] every critical action has either a crop or a callout
- [ ] callouts do not obscure the UI
- [ ] subtitle and callout zones do not collide
- [ ] sensitive data has a planned mask

**Pacing coherence:**
- [ ] result moments stay at normal speed
- [ ] waiting and repetitive typing are compressed or removed
- [ ] the output duration still matches the brief

## Common Pitfalls

- Staying zoomed in so long that the viewer loses the interface map.
- Planning vertical crops for wide UI without admitting they fail.
- Adding highlight layers everywhere instead of choosing the single clearest cue.
- Ignoring sensitive data revealed in seemingly minor frames.

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
