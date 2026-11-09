# Character Design Director - Character Animation Pipeline

## Goal

Produce `character_design`: a small cast with clear silhouettes, roles,
emotions, actions, and style anchors.

> **Hand-drawn ink "doodle" character?** (a stick/pencil figure that draws itself, then walks / dances / waves / jumps) → use the **Ink Puppet** system: `skills/creative/ink-theater.md` + `ink-theater/README.md`. The rig is proportion-agnostic and plays **real mocap** clips via `InkPuppet.choreograph([{clip:'wave'},{clip:'twist'},…])` — clip names come from `ink-theater/mocap/catalog.json` (12 CMU-sourced moves); the agent only chooses named moves, **never hand-tunes motion**; add moves with `node ink-theater/mocap/add-motion.mjs`. Command: `/ink-art`.

## Process

1. List every character with `id`, role, body type, and style.
2. Identify the minimum emotional range needed by the story.
3. Identify the minimum action list needed by the story.
4. Decide required views: front, 3/4, side, back. Keep MVPs to one or two views.
5. Note props attached to characters, such as scarf, feather, bag, glasses.

## Constraints

- One or two characters is the MVP sweet spot.
- Animal characters need species-specific parts and action cycles.
- More views multiply asset and pose requirements.
- Do not invent more poses than the approved duration can use.

## Tool Use

Use `character_spec_generator` for structured drafts. Use `image_selector` only
after the visual style and character sheet requirements are explicit. Before
using image generation, read the tool's Layer 3 skills from the registry.

## Quality Bar

A character design is ready only when an animator or tool can infer what parts,
expressions, and actions must exist.

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
