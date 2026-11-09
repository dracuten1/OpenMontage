# Idea Director - Cinematic Pipeline

## When To Use

Use this pipeline for trailers, brand films, dramatic montages, or mood-led short videos where rhythm, atmosphere, and emotional escalation matter more than direct explanation.

Do not use this pipeline just because the user said "make it look cinematic." If the project is really a screen demo, explainer, or repurposing job, route it there instead.

## Reference Inputs

- `skills/creative/cinematic.md`
- `skills/creative/storytelling.md`

## Process

### 1. Classify The Source Reality

Capture the source mode:

- `footage_only`
- `footage_plus_stills`
- `still_led`
- `generated_support`
- `mixed_montage`

Also classify whether the requested delivery is motion-required. Store this as a boolean in `brief.metadata.motion_required`.

Set `motion_required = true` when the promise of the video depends on moving shots or animated compositions rather than static frames. This includes:

- sci-fi trailers,
- cinematic teasers,
- action or hype edits,
- agent/avatar outputs,
- any concept whose quality depends on generated video clips.

Do not assume stock, generated b-roll, or music exists unless the user has provided it or the environment can actually make it.

### 2. Define The Emotional Arc

Choose the arc in plain language:

- tension -> reveal
- wonder -> scale
- intimacy -> payoff
- urgency -> resolution
- mystery -> CTA

The brief should tell later stages what the video is trying to make the viewer feel, not just what it is about.

### 3. Pick The Delivery Shape

Common output shapes:

- `teaser`
- `trailer`
- `hero_brand_film`
- `mood_cut`
- `social_cutdown`

Store longer planning detail in `brief.metadata`.

Recommended metadata keys:

- `source_mode`
- `motion_required`
- `delivery_shape`
- `emotional_arc`
- `anchor_assets`
- `music_strategy`
- `generated_support_level`
- `aspect_ratio_plan`
- `rights_constraints`

### 4. Reality Check The Treatment

If the user has weak source media and no generation path, say so. A cinematic result still needs enough visual or audio material to carry mood.

If `motion_required = true`, be explicit about the motion path:

- confirm the planned clip-generation providers,
- confirm whether Remotion is required for the intended composition,
- if either is unavailable or unstable, mark the treatment as blocked rather than silently redesigning it around still images.

### 5. Music Plan (Mandatory)

Cinematic videos live and die by their audio. **Surface the music situation before the user approves the brief.**

Check availability in this order:

1. **User music library:** Check `registry.get_by_capability("music_library")` and inspect `music_library/`. List available tracks with durations and moods.
2. **Royalty-free search:** Check `registry.get_by_capability("music_search")`. Report available providers, licensing constraints, and any key requirement.
3. **Music generation APIs:** Check `registry.get_by_capability("music_generation")`. Report status, quota, cost, and quality tradeoffs.
4. **Bring your own:** The user can drop a track from another licensed source into `music_library/`.

Present explicit options:

```
MUSIC PLAN
├── Your music library: [N tracks / empty]
├── Royalty-free search: [providers / unavailable]
├── AI generation: [provider] — [AVAILABLE/UNAVAILABLE] [cost]
└── Bring your own: Drop a track in music_library/ before asset stage

Options:
  (a) Use a library track (which one?)
  (b) Search a royalty-free provider
  (c) Provide your own track
  (d) Generate via API (if available)
  (e) Proceed without music (not recommended for cinematic)
```

Record the decision in `brief.metadata.music_strategy` with the chosen source and path/prompt.

### 6. Quality Gate

- the source truth is explicit,
- the brief says whether motion is a hard requirement,
- the emotional arc is specific,
- the output shape fits the available assets,
- the music plan is resolved (source chosen or explicitly deferred),
- the treatment is cinematic for a reason, not by label only.

## Common Pitfalls

- Calling something cinematic when it is really just a normal edit with black bars.
- Assuming generated inserts are available without checking tools.
- Quietly turning a motion-led brief into a still-led teaser.
- Planning a trailer shape with no reveal or payoff.

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
