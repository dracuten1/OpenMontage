# Compose Director - Podcast Repurpose Pipeline

## When To Use

Render the podcast-derived outputs with audio fidelity as the top priority. The visuals need to support the speech, not compete with it.

## Runtime Routing (HARD CONSTRAINT — Remotion or FFmpeg only)

Phase 1 deferred from HyperFrames. `edit_decisions.render_runtime` must be `"remotion"` (audiograms, composed outputs) or `"ffmpeg"` (pure-audio-led clip exports). HyperFrames caption-burn parity is deferred, and podcast outputs lean on Remotion's word-level caption stack.

- If `edit_decisions.render_runtime == "hyperframes"`, stop. Re-open the idea stage and surface the constraint to the user. Never silently rewrite the runtime.
- Per AGENT_GUIDE.md → "Present Both Composition Runtimes (HARD RULE)": tell the user HyperFrames exists and why it isn't viable on this pipeline, rather than silently locking remotion. Record a `render_runtime_selection` decision with hyperframes `rejected_because: "caption-burn parity deferred on podcast-repurpose"`.
- Pass `proposal_packet`/`brief` to `video_compose.execute()` for end-to-end runtime-swap detection.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/render_report.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["edit"]["edit_decisions"]`, `state.artifacts["assets"]["asset_manifest"]` | Output plans and asset paths |
| Tools | `video_compose`, `audio_mixer` | Rendering and mix control |
| Playbook | Active style playbook | Brand consistency |

## Process

### 1. Render Highest-Value Outputs First

Priority order:

1. short highlight clips
2. quote-led clips
3. optional long-form companion video

This keeps the most publishable assets available first.

### 2. Preserve Audio Quality

- avoid unnecessary re-encoding,
- keep speech intelligible and stable,
- use music sparingly and only when it does not compete,
- verify subtitle sync after render.

### 3. Respect Platform Shapes

- `9:16` for short-form social
- `1:1` for quote-led or feed-safe clips
- `16:9` for long-form YouTube companion output

### 4. Verify Every Deliverable

- correct duration,
- correct aspect ratio,
- readable subtitles,
- accurate speaker attribution,
- stable audio,
- consistent brand treatment.

### 5. Use Render Report Metadata

Recommended metadata keys:

- `deliverable_groups`
- `audio_notes`
- `subtitle_checks`
- `failed_outputs`

## Common Pitfalls

- Letting visual treatments degrade audio quality.
- Rendering the full companion first and delaying the clips that matter most.
- Forgetting that a simple, readable clip beats a technically elaborate but confusing one.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
