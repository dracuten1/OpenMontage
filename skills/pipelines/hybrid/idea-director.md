# Idea Director - Hybrid Pipeline

## When To Use

Use this pipeline when the project combines real source media with support visuals: interviews plus diagrams, footage plus overlays, screen recording plus branded graphics, or source-led edits with generated inserts.

Hybrid is not a catch-all. Your first job is to define what stays primary.

## Runtime Selection (MANDATORY — present both runtimes)

Before locking the production plan, decide `render_runtime` with the user. Hybrid supports BOTH Remotion and HyperFrames; neither is an auto-default. Follow the contract in AGENT_GUIDE.md → "Present Both Composition Runtimes (HARD RULE)":

1. Query `video_compose.get_info()["render_engines"]`. If both `remotion` and `hyperframes` are `True`, present both to the user with brief-specific analysis:
   - **Remotion** — fits when source footage dominates and support layers are React scene components (chart, callout, text card). Remotion composes video clips + React overlays in one pass via `<OffthreadVideo>`.
   - **HyperFrames** — fits when support layers are HTML/GSAP-native (kinetic callouts, registry blocks, typographic overlays) and source footage is embedded as `<video class="clip">`.
2. Recommend one with rationale tied to the anchor medium and the shape of the support layer.
3. Wait for explicit user approval.
4. Log the choice in `decision_log` as a `render_runtime_selection` decision with BOTH runtimes in `options_considered`.

A `render_runtime_selection` decision with only one runtime in `options_considered` when both were available is a CRITICAL reviewer finding.

## Reference Inputs

- `skills/creative/storytelling.md`
- `skills/creative/video-editing.md`

## Process

### 1. Choose The Anchor Medium

Pick the storytelling anchor:

- `talking_head`
- `broll_footage`
- `screen_recording`
- `still_sequence`
- `narration_led_graphics`

### 2. Define Support Layers

Possible support layers:

- subtitles,
- diagrams,
- code visuals,
- stat cards,
- generated inserts,
- narration,
- music.

Each support layer should solve a specific problem, not just decorate the timeline.

### 3. Decide The Deliverable Mix

Common outputs:

- hero cut,
- vertical cutdown,
- square cutdown,
- chaptered version,
- ad variant.

### 4. Build The Brief

Recommended metadata keys:

- `anchor_medium`
- `source_inventory`
- `support_layers`
- `deliverable_mix`
- `missing_capabilities`
- `fallback_policy`

### 5. Quality Gate

- the anchor medium is explicit,
- support layers are justified,
- the deliverable mix fits the source inventory,
- missing capabilities are surfaced early.

## Common Pitfalls

- Calling everything hybrid without defining a primary medium.
- Planning support layers before understanding the source.
- Treating optional generated inserts as guaranteed.

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
