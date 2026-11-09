# Scene Director - Cinematic Pipeline

## When To Use

You are deciding how each cinematic beat will look and transition. This is where mood becomes a visual plan.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/scene_plan.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["script"]["script"]`, `state.artifacts["proposal"]["proposal_packet"]` | Beat map and source truth |
| Tools | `frame_sampler`, `scene_detect` | Source inspection and reframing checks |
| Playbook | Active style playbook | Color and typography consistency |

## Process

### 1. Make Hero Frames Explicit

Every cinematic piece needs a few memorable frames. Define them directly:

- opening image,
- reveal image,
- final image,
- any title-card hero moments.

### 2. Keep Source-Led Scenes Primary

If source footage exists, let it carry the piece. Generated inserts or text cards should support transitions, emphasis, or missing coverage, not dominate the timeline.

### 3. Limit Transition Vocabulary

Choose a small set:

- hard cut,
- fade to black,
- slow dissolve,
- restrained push or punch-in.

Too many transition types kill the mood.

### 4. Use Metadata For Visual Rules

Recommended metadata keys:

- `hero_frames`
- `transition_rules`
- `aspect_ratio_rules`
- `title_card_rules`
- `support_insert_rules`

### 5. 5-Aspect Scene-Plan Checklist

> Every scene beat — and especially every hero frame — must specify all five aspects. Cinematic relies on a small number of memorable frames; vague hero-frame specs are the single most common failure mode and produce unpredictable model output. Marking an aspect as N/A is allowed but must be explicit (e.g., "no subject — establishing scenery shot"). Silent omission is forbidden.
>
> 1. **Subject** — type + key visual attributes; if multiple, how to disambiguate. For hero frames, identity must be anchored verbatim across shots.
> 2. **Subject Motion** — actions in temporal order; subject↔object / subject↔subject interactions.
> 3. **Scene** — overlays (separately!) + POV + setting + time of day + scene dynamics.
> 4. **Spatial Framing** — shot size + position-in-frame + depth (FG/MG/BG) + camera-height-relative; and how those CHANGE across the beat.
> 5. **Camera** — playback speed → lens distortion → height → angle → focus/DoF → steadiness → movement.
>
> See `skills/creative/video-gen-prompting.md` for the primitive vocabulary.

> **Overlays callout.** Overlays (titles, subtitles, HUD, watermarks, framing graphics, lower-thirds, name plates, end-tag cards) are NOT part of the scene's foreground/midground/background depth axis. List them separately in scene metadata (`overlays: [...]`) with content and placement. Never describe an overlay as "in the foreground" — that confuses both downstream tools and any video-understanding model that re-analyzes the output.

### 6. Quality Gate

- every beat has a scene treatment,
- hero frames are identifiable AND fully specified across all 5 aspects,
- support inserts are justified,
- overlays are recorded under `overlays:`, never inside the depth/framing description,
- the visual language stays consistent across the piece.

## Common Pitfalls

- Using title cards as filler.
- Treating generated inserts like the primary story without saying so.
- Planning flashy transitions for every beat.

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
