# Edit Director - Screen Demo Pipeline

## When To Use

This stage turns the plan into a concrete, schema-valid edit: trims, speeds, overlays, subtitles, and transitions. Keep the edit simple enough to execute with the current tooling and explicit enough that composition is predictable.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/edit_decisions.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["assets"]["asset_manifest"]`, `state.artifacts["scene_plan"]["scene_plan"]`, `state.artifacts["script"]["script"]` | Assets, visual plan, timing |
| Playbook | Active style playbook | Overlay and pacing rules |

## Process

### 1. Start With The Smallest Clear Edit

Screen demos get worse when over-edited. Build the timeline in this order:

1. trim or cut dead time,
2. apply speed changes,
3. place overlays,
4. set subtitle behavior,
5. define audio behavior,
6. capture detailed crop/ramp notes in `edit_decisions.metadata`.

### 2. Keep The Schema Clean

Use `cuts[]` for actual source segments and speed changes. Use `overlays[]`, `subtitles`, `music`, and `transitions` only for things the schema already models. Put screen-demo-specific detail in metadata:

- `crop_keyframes`
- `speed_plan`
- `subtitle_position_overrides`
- `audio_notes`
- `variant_notes`

### 3. Editing Rules

- the viewer should see useful motion or result within the first seconds,
- result moments stay at normal speed,
- typing, installs, and waiting should be accelerated or removed,
- no cut starts mid-word or ends before the payoff lands,
- do not introduce more motion through editing than the scene plan asked for.

### 4. Overlay Rules

- hook or step label can appear immediately,
- callouts should appear slightly before the action,
- blur masks must be treated as critical, not optional,
- subtitles and callouts must not compete for the same space.

### 5. Audio Rules

- keep primary speech clear and centered,
- mute or greatly reduce meaningless sped-up noise,
- only use background music if it adds value and survives ducking gracefully,
- if narration was generated, ensure it fits the tightened timeline.

### 6. Quality Gate

**Timeline integrity:**
- [ ] Cuts cover the full intended timeline
- [ ] No accidental black gaps
- [ ] Speed ramps don't overlap
- [ ] Effective duration matches the brief closely

**Overlay integrity:**
- [ ] Every planned callout or mask is represented
- [ ] No overlay collisions
- [ ] UI-anchored overlays are documented clearly enough to position during compose

**Audio integrity:**
- [ ] Primary audio or narration covers the entire timeline
- [ ] Speed-up segments have intentional audio treatment
- [ ] Music, if present, will not compete with instruction

**Subtitle integrity:**
- [ ] Subtitles are present for all narrated sections
- [ ] Position overrides protect important UI content
- [ ] Subtitle timing still works after planned speed changes

## Common Pitfalls

- Overbuilding the edit with cinematic transitions the workflow does not need.
- Letting sped-up audio become a wall of harsh clicks and typing.
- Forgetting that crop and speed plans live in metadata, not arbitrary schema fields.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
