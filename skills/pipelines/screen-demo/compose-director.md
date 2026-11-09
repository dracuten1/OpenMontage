# Compose Director - Screen Demo Pipeline

## When To Use

Render the final screen-demo outputs. The quality bar is simple: the UI must be readable, the pacing must feel intentional, and the result must match the planned platform shapes.

## Runtime Routing (MANDATORY first step)

Read `edit_decisions.render_runtime` first. Screen-demo compositions use three distinct runtimes depending on the demo shape:

- **`render_runtime="remotion"` with `TerminalScene`** — the preferred path for synthetic terminal/CLI/install flows. See `.agents/skills/synthetic-screen-recording/`.
- **`render_runtime="remotion"`** (other scenes) — for mixed screen-capture + animated overlays.
- **`render_runtime="hyperframes"`** — for custom synthetic HTML UI demos where CSS + GSAP express the UI naturally. Read `skills/core/hyperframes.md`. `hyperframes lint` and `hyperframes validate` must both pass before render.
- **`render_runtime="ffmpeg"`** — for simple cut/concat of real screen recordings without composition.

Silent swaps between runtimes are CRITICAL governance violations. If the locked runtime is unavailable, escalate per AGENT_GUIDE.md before substituting.

**Pass `proposal_packet` to `video_compose.execute()`** so the tool can directly confirm the runtime locked at proposal matches what edit_decisions says. Without it the in-tool swap check is skipped and you rely entirely on the reviewer skill to catch drift.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/render_report.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["edit"]["edit_decisions"]`, `state.artifacts["assets"]["asset_manifest"]` | What to render |
| Tools | `video_compose`, `audio_mixer`, `video_trimmer` | Rendering capabilities |
| Playbook | Active style playbook | Quality targets |

## Process

### 1. Render For Legibility First

Prefer the simplest reliable render chain:

- trim and speed-adjust source footage,
- compose overlays and subtitles,
- mix audio only as much as needed,
- encode at a bitrate suitable for text-heavy content.

### 2. Choose Output Shapes Pragmatically

| Platform | Aspect Ratio | Resolution | Notes |
|----------|--------------|------------|-------|
| YouTube / docs | `16:9` | 1920x1080 or higher | safest default for dense UI |
| LinkedIn feed | `1:1` | 1080x1080 | good compromise when vertical is too tight |
| Shorts / Reels / TikTok | `9:16` | 1080x1920 | only if crop plan is actually readable |

If the source is 4K and text is tiny, keep a higher resolution when practical.

### 3. Compose In The Right Order

1. apply trims and speed changes,
2. apply crop and framing strategy,
3. place masks and overlays,
4. burn subtitles,
5. mix audio,
6. encode with text-preserving settings.

Use sharp scaling and avoid aggressive compression. Screen text is the first thing viewers notice when encode quality drops.

### 4. Keep Audio Honest

- preserve original speech clarity,
- do not overcompress,
- mute or simplify useless sped-up noise,
- use music sparingly, if at all.

### 5. Verify Every Output

**File checks:**
- [ ] Output file exists and is a valid MP4 container
- [ ] Duration matches effective target within +/-5%
- [ ] Resolution matches selected profile

**Visual spot checks:**
- [ ] Text is sharp and readable at sampled frames
- [ ] Crop transitions are smooth enough to follow
- [ ] Callout overlays appear and disappear cleanly
- [ ] Blur masks fully cover sensitive data
- [ ] No black frames or timing glitches
- [ ] Subtitles do not sit on top of critical UI

**Audio spot checks:**
- [ ] Narration/voiceover is clear and consistent volume
- [ ] Music, if used, is not competing with speech
- [ ] No obvious audio glitches at speed boundaries
- [ ] No clipping or distortion

Record important findings in:

- `render_report.verification_notes`
- `render_report.warnings`
- `render_report.metadata.variant_notes`

## Common Pitfalls

- Rendering `9:16` versions that are technically exported but practically unreadable.
- Encoding screen text with generic low-bitrate social defaults.
- Letting decorative backgrounds or padding reduce usable UI area too far.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
