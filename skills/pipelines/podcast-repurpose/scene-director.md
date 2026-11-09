# Scene Director - Podcast Repurpose Pipeline

## When To Use

You are deciding how each podcast deliverable should look based on the actual source mode. This is where you prevent "fake richness" and choose honest, effective treatments.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/scene_plan.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["script"]["script"]`, `state.artifacts["idea"]["brief"]` | Highlight set and source truth |
| Tools | `frame_sampler` | Optional visual inspection for video-podcast sources |
| Playbook | Active style playbook | Brand consistency |

## Process

### 1. Pick The Right Treatment Per Deliverable

Prefer a source-faithful hierarchy:

- if video podcast footage exists, use speaker-led scenes first,
- if only audio exists, use audiogram or quote-led layouts,
- if branding assets are limited, keep the visual system simple and repeatable.

### 2. Avoid Pretend Complexity

Do not plan a full episode with endless generated topic art unless the budget and tools support it. A clean branded companion layout is better than a noisy, underpowered pseudo-production.

### 3. Define Scene Families

Useful schema scene types:

- `talking_head` for source video speaker shots
- `text_card` for quote cards and chapter cards
- `generated` for optional topic art
- `diagram` for the rare cases where the discussion needs a graphic
- `transition` for chapter moves

### 4. Use Metadata For Layout Strategy

Recommended `scene_plan.metadata` keys:

- `deliverable_layouts`
- `speaker_card_rules`
- `quote_card_rules`
- `audiogram_rules`
- `full_episode_companion_rules`

### 5. Plan Safe Zones And Attribution

Every layout should clearly preserve:

- speaker attribution,
- subtitle zone,
- show branding,
- CTA or episode reference area if needed.

### 6. Quality Gate

- each deliverable has a treatment that matches the actual source,
- source video is used when it exists instead of being hidden behind generic graphics,
- audio-only assets remain visually simple and readable,
- long-form companion visuals are achievable.

## Common Pitfalls

- Planning speaker-centric layouts for audio-only episodes.
- Turning every clip into the same waveform-plus-logo composition.
- Using generated graphics to cover weak editorial choices.

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
