# Executive Producer - Character Animation Pipeline

## When To Use

Use this pipeline when the requested deliverable depends on reusable animated
characters: cartoon shorts, mascot explainers, music-led character scenes,
dialogue between simple characters, or reference-inspired local animation.

Do not use this pipeline for one-off motion graphics with no acting. Route those
to `animation`. Do not use it for avatar presenter lip-sync. Route that to
`avatar-spokesperson`.

## Contract

The pipeline produces local, deterministic character animation. It does not
silently substitute still-image motion for acting. If the character motion cannot
be built with the available rigs, assets, or runtime, surface a blocker.

## Stage Order

1. `research` - understand reference, technique, and feasibility.
2. `proposal` - present concepts, runtime options, cost, music plan, sample plan.
3. `script` - write action-friendly beats and dialogue/narration.
4. `character_design` - define characters, silhouettes, emotions, actions.
5. `rig_plan` - define parts, pivots, layers, constraints, poses.
6. `scene_plan` - map story beats to character scenes.
7. `assets` - produce or source character parts, backgrounds, props, audio.
8. `edit` - compile timed action timeline.
9. `compose` - render through the approved runtime and run QA.
10. `publish` - package the final output.

## Governance Rules

- Run registry preflight before proposal.
- If both Remotion and HyperFrames are available, present both before locking
  `render_runtime`.
- Produce a 10-15 second sample before full asset generation.
- Character differences belong in rig data, not one-off code paths.
- Every generated or runtime-authored asset must list Layer 3 skills read.
- Use `character_animation_reviewer` plus final `final_review` before delivery.

## Send-Back Triggers

- `character_design` lacks required actions or emotional range.
- `rig_plan` lacks pivots for moving parts.
- `pose_library` has no readable acting poses.
- `action_timeline` has actions that cannot be rendered by the rig.
- Compose used a runtime not approved in proposal.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
