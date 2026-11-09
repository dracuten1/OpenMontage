# Idea Director - Clip Factory Pipeline

## When To Use

Use this pipeline when the source is long-form footage and the goal is multiple short-form deliverables: webinar clips, interview cuts, livestream highlights, keynote excerpts, or presentation snippets.

You are not planning one video. You are planning a ranked portfolio of clips.

## Runtime Selection (MANDATORY — present the constraint, don't silently pick)

Lock `render_runtime = "remotion"` (for composed clips with word-level captions) or `"ffmpeg"` (for pure concat/trim with no composition). **HyperFrames is NOT a valid runtime on this pipeline in Phase 1** — clip-factory depends on Remotion's word-level caption burn, which has no HyperFrames parity yet.

Per AGENT_GUIDE.md → "Present Both Composition Runtimes (HARD RULE)": do NOT silently lock remotion. Surface the constraint to the user: "HyperFrames is an available runtime on your machine, but clip-factory depends on Remotion caption burn that doesn't have HyperFrames parity yet, so remotion is the only viable choice here — OK to proceed?" Record the decision in `decision_log` with category `render_runtime_selection`, including hyperframes as a rejected option (`rejected_because: "caption-burn parity deferred on clip-factory"`).

## Reference Inputs

- `skills/creative/short-form.md`
- `skills/creative/video-editing.md`

## Process

### 1. Understand The Source And The Goal

Capture the source shape:

- webinar
- interview
- panel
- keynote
- stream
- customer story

Then capture the business goal:

- awareness
- thought leadership
- lead generation
- product education
- event recap

### 2. Choose A Clip Portfolio Strategy

A good batch mixes clip types instead of extracting the same energy repeatedly.

Common clip families:

- `hook`: surprising claim or strong cold open
- `insight`: useful takeaway or lesson
- `story`: narrative moment with emotional shape
- `proof`: stat, case study, demo result
- `opinion`: hot take, disagreement, contrarian point

Use the brief metadata to define the intended balance across those families.

### 3. Set Yield Targets Realistically

Guideline ranges:

- `15-30 min`: 3-6 strong clips
- `30-60 min`: 5-10 strong clips
- `60+ min`: 8-15 strong clips if the source quality supports it

Do not inflate clip count to satisfy a round number. A smaller strong batch beats a padded weak batch.

### 4. Map Platforms Before Extraction

Plan platform fit early:

- `9:16` for Shorts, Reels, TikTok
- `1:1` for LinkedIn and safer feed repurposing
- `16:9` when slides, demos, or wide context matter

If the source framing clearly will not survive vertical crops, say so in the brief metadata now.

### 5. Build The Brief

Keep the schema-level brief concise and put the richer batch plan in `brief.metadata`.

Recommended metadata keys:

- `source_type`
- `source_duration_seconds`
- `clip_target_range`
- `clip_families`
- `primary_platforms`
- `secondary_platforms`
- `selection_criteria`
- `known_visual_constraints`
- `distribution_goal`

### 6. Quality Gate

- the clip count target is realistic,
- the platform mix matches the content,
- the brief defines ranking criteria before extraction starts,
- the agent has acknowledged any obvious reframing limits.

## Common Pitfalls

- Planning a batch around quantity before quality.
- Assuming every source can produce vertical clips cleanly.
- Treating all clips as interchangeable instead of intentionally varied.
- Starting extraction without defining what "good" means for this batch.

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
