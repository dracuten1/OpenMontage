# Idea Director - Podcast Repurpose Pipeline

## When To Use

Use this pipeline when the source is a podcast episode, either audio-only or video podcast, and the user wants clips, social assets, or a companion long-form video treatment.

Your first responsibility is to decide what is feasible from the source that actually exists.

## Runtime Selection (MANDATORY — present the constraint, don't silently pick)

Lock `render_runtime = "remotion"` (audiograms and composed outputs) or `"ffmpeg"` (pure-audio-led clip exports). **HyperFrames is NOT a valid runtime on this pipeline in Phase 1** — podcast outputs lean on Remotion's word-level caption stack, which has no HyperFrames parity yet.

Per AGENT_GUIDE.md → "Present Both Composition Runtimes (HARD RULE)": surface the constraint to the user — "HyperFrames is available on your machine, but podcast-repurpose depends on Remotion caption burn, so remotion is the only viable choice here". Record a `render_runtime_selection` decision with hyperframes `rejected_because: "caption-burn parity deferred on podcast-repurpose"`.

## Reference Inputs

- `skills/creative/short-form.md`
- `skills/creative/long-form.md`

## Process

### 1. Classify The Source

Capture the source mode:

- `audio_only`
- `video_podcast`
- `hybrid` (audio plus stills, cover art, guest photos)

Also capture the conversational format:

- solo
- interview
- panel
- narrative / produced show

### 2. Choose Deliverables That Match Reality

Default deliverables should be feasible with the source and tools on hand.

Safe options:

- short-form highlight clips,
- audiogram or caption-led clips,
- quote-led clips,
- one optional full-episode companion layout.

Do not assume a high-production full-episode YouTube treatment unless the source video, branding assets, and optional imagery actually exist.

### 3. Set A Sensible Deliverable Mix

Typical starting point:

- `3-5` highlight clips
- `1-3` quote-led assets if the episode has strong one-liners
- optional long-form companion if the source justifies it

### 4. Respect Platform Differences

- `9:16` for Shorts, Reels, TikTok
- `1:1` for LinkedIn and safer feed repurposing
- `16:9` for YouTube companion video

If the source is audio-only, make that explicit in the brief. Downstream stages should not plan speaker-framed video that does not exist.

### 5. Build The Brief

Use `brief.metadata` for the richer podcast-specific contract:

- `source_mode`
- `show_name`
- `episode_title`
- `episode_number`
- `speakers`
- `conversation_format`
- `deliverable_mix`
- `brand_assets_available`
- `full_episode_companion_feasible`

### 6. Quality Gate

- the deliverable mix matches the actual source,
- clip counts are realistic for the episode length,
- the brief states whether visuals will be source-led, quote-led, or audiogram-led,
- long-form ambitions are scaled to the available assets.

## Common Pitfalls

- Treating audio-only and video-podcast sources as the same production problem.
- Planning too many deliverables from a weak episode.
- Promising a rich full-episode visual treatment without the assets to support it.

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
