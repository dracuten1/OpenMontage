# Idea Director - Avatar Spokesperson Pipeline

## When To Use

Use this pipeline when the deliverable is a presenter-led avatar video: a spokesperson spot, product intro, onboarding message, internal comms update, or short scripted explainer where the speaker remains the visual anchor.

Your first job is to classify the avatar path honestly before anyone writes polished copy for an impossible production setup.

## Runtime Selection (MANDATORY — present the constraint, don't silently pick)

Lock `render_runtime = "remotion"`. **HyperFrames is NOT a valid runtime on this pipeline in Phase 1** — avatar-spokesperson depends on the Remotion `TalkingHead` composition and `remotion_caption_burn`, and neither has HyperFrames parity yet.

Per AGENT_GUIDE.md → "Present Both Composition Runtimes (HARD RULE)": do NOT silently default. Tell the user: "HyperFrames is available on your machine, but avatar-spokesperson depends on the Remotion TalkingHead composition and caption burn, so remotion is the only viable runtime here — OK to proceed?" Record a `render_runtime_selection` decision with hyperframes `rejected_because: "TalkingHead + caption parity deferred on avatar-spokesperson"`.

## Reference Inputs

- `skills/creative/storytelling.md`
- `skills/creative/short-form.md`

## Process

### 1. Classify The Avatar Path

Record which production mode the project actually has:

- `platform_avatar`
- `photo_talking_head`
- `presenter_plate_lip_sync`

Also record whether the avatar already exists or still has to be created outside the current run.

### 2. Define The Message Shape

Capture:

- audience,
- core offer or CTA,
- runtime target,
- platform targets,
- whether the video is sales, onboarding, support, or announcement led.

Spokesperson videos work best when they have one clear job.

### 3. Capture Source Reality

The brief should explicitly state:

- whether clean narration is supplied,
- whether TTS is acceptable,
- whether brand backgrounds or overlays exist,
- whether subtitles are required,
- whether multilingual variants are expected.

### 4. Build The Brief

Recommended metadata keys:

- `avatar_path`
- `avatar_exists`
- `narration_source`
- `target_audience`
- `cta_type`
- `background_strategy`
- `deliverable_mix`
- `missing_capabilities`

### 5. Quality Gate

- the avatar path is explicit,
- the message is narrow enough for a spokesperson format,
- missing narration or avatar dependencies are visible early,
- deliverables fit the actual source setup.

## Common Pitfalls

- Treating a generic generated-video request as a deterministic avatar workflow.
- Writing the CTA before confirming the avatar and narration path.
- Planning multiple aspect ratios before the hero layout is proven.

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
