# Script Director - Clip Factory Pipeline

## When To Use

This stage converts the long-form source into a ranked candidate list and then into the final clip selections. You are mining for standout moments, not summarizing the entire source.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/script.schema.json` | Artifact validation |
| Prior artifact | `state.artifacts["idea"]["brief"]` | Batch goals and platform targets |
| Tools | `transcriber`, `scene_detect` | Transcript-first selection and visual checks |

## Process

### 1. Transcribe The Full Source

Use `transcriber` first. The transcript is the search surface for hooks, not an afterthought.

Use `scene_detect` only to sanity-check visual boundaries, speaker changes, or slide changes near promising moments.

### 2. Score Candidate Moments

Use the brief's ranking criteria and evaluate each moment on:

- `hook`
- `coherence`
- `value`
- `energy`
- `platform_fit`

This mirrors the way modern clipping products talk about virality and clip quality, while keeping the judgment transparent.

### 3. Apply The Standalone Test

Every approved clip must make sense to a cold viewer.

Reject or widen clips that contain:

- unresolved pronouns,
- references to earlier context,
- long lead-ins before the point lands,
- endings that stop before the payoff.

### 4. Select The Final Batch

Pick the smallest set that best satisfies the batch goal.

Maintain diversity across:

- source sections,
- speakers,
- clip families,
- energy levels.

### 5. Use Metadata For Ranking Truth

The script schema is small, so store the richer batch analysis in `script.metadata`.

Recommended metadata keys:

- `candidate_clips`
- `selected_clip_ids`
- `ranking_model`
- `rejected_candidates`
- `source_coverage_map`
- `platform_assignments`

Each candidate should record:

- source in/out,
- hook text,
- reason selected or rejected,
- scoring dimensions,
- likely crop viability.

### 6. Quality Gate

- the top-ranked clips are genuinely the strongest, not just the earliest found,
- every selected clip passes the standalone test,
- the set covers the source deliberately instead of clustering in one section,
- low-quality candidates are rejected honestly.

### Mid-Production Fact Verification

If you encounter uncertainty during script writing:
- Use `web_search` to verify factual claims before committing them to the script
- Use `web_search` to find reference images for visual accuracy
- Log verification in the decision log: `category="visual_accuracy_check"`

Every factual claim in the script should be traceable to the `research_brief`.
If you make a claim that isn't in the research, do additional research and
add the source. Do not invent statistics, dates, or attributions.

## Common Pitfalls

- Trusting first-pass candidate timestamps without transcript-level review.
- Selecting too many calm, same-energy clips.
- Preserving chronological order instead of ranking by quality.
- Treating transcript quality issues as minor when they affect selection accuracy.

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
