# Idea Director - Localization Dub Pipeline

## When To Use

Use this pipeline when the user has a source video and wants translated deliverables: subtitles, dubbed audio, or localized videos in one or more target languages.

Your first responsibility is to define what kind of localization is actually required, because subtitle-only, dubbed-audio, and lip-synced translation are different jobs.

## Runtime Selection (MANDATORY — present the constraint, don't silently pick)

Lock `render_runtime = "remotion"` (composed deliverables with per-locale caption burn / lip-sync) or `"ffmpeg"` (pure subtitle-burn over source with no composition). **HyperFrames is NOT a valid runtime on this pipeline in Phase 1** — localization depends on Remotion's caption stack and, for dubbed-with-lip-sync, on the Remotion TalkingHead pipeline.

Per AGENT_GUIDE.md → "Present Both Composition Runtimes (HARD RULE)": do NOT silently default to remotion. Tell the user: "HyperFrames is available, but localization-dub depends on Remotion caption + TalkingHead parity that isn't there yet in Phase 1 — remotion is the only viable choice". Record a `render_runtime_selection` decision with hyperframes `rejected_because: "caption + lip-sync parity deferred on localization-dub"`.

## Reference Inputs

- `skills/creative/short-form.md`
- `skills/creative/long-form.md`

## Process

### 1. Define The Localization Scope

Capture:

- source language,
- target languages,
- review owner,
- whether glossary or legal review is required,
- whether the user needs subtitles, dubbed audio, lip-sync, or a mix.

### 2. Classify The Source

Record the source mode:

- `single_speaker`
- `multi_speaker`
- `voiceover_led`
- `speaker_led_on_camera`

Also record whether on-screen text or motion graphics will need manual replacement or coverage.

### 3. Pick Deliverables That Match Reality

Possible deliverables:

- subtitle package only,
- dubbed video without lip sync,
- lip-synced localized video,
- per-language export bundle.

### 4. Build The Brief

Recommended metadata keys:

- `source_language`
- `target_languages`
- `deliverable_mode_map`
- `glossary_terms`
- `protected_terms`
- `review_requirements`
- `timing_risks`

### 5. Quality Gate

- localization scope is explicit,
- target outputs are realistic,
- glossary and review requirements are captured,
- risk increases from speaker count or visible mouths are surfaced.

## Common Pitfalls

- Calling every translation request a dubbing request.
- Ignoring glossary control until after audio is generated.
- Promising lip sync on visually difficult source footage without warning.

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
