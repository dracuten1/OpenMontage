# Idea Director - Animation Pipeline

## When To Use

Use this pipeline when the video should be built primarily through designed motion: motion graphics, kinetic typography, diagram-led explainers, math visuals, or illustrative animation.

Do not use this pipeline when the project is really footage-led with a few overlays. That belongs in `hybrid`.

## Reference Inputs

- `skills/creative/animation-pipeline.md`
- `skills/creative/storytelling.md`
- `skills/creative/ink-theater.md` — for hand-drawn **ink "doodle"** briefs: a character that draws itself and performs, or a deadpan contraption explainer (Ink Theater engine + Ink Puppet mocap; command `/ink-art`). A stick/pencil character that walks or dances belongs in the `character-animation` pipeline.

## Process

### 1. Classify The Animation Mode

Choose the primary mode:

- `diagrammatic`
- `motion_graphics`
- `kinetic_type`
- `math_animation`
- `illustrative`
- `mixed_animation`

### 2. Decide The Visual Path Early

Figure out which tools are supposed to do the work:

- `diagram_gen`
- `math_animate`
- `code_snippet`
- `image_selector`
- `video_selector` or a concrete video provider tool
- source-provided art

If the requested mode depends on unavailable tools, say so in the brief metadata immediately.

### 3. Choose A Reuse Strategy

Animation gets expensive when every scene is unique. Define:

- recurring motifs,
- layout system,
- transition family,
- typography hierarchy.

### 4. Build The Brief

Recommended metadata keys:

- `animation_mode`
- `visual_path`
- `narration_strategy`
- `reuse_strategy`
- `timing_style`
- `blocked_capabilities`

### 5. Quality Gate

- the animation mode is explicit,
- the visual path is feasible,
- the project is designed for reuse,
- the brief is honest about missing tools.

## Common Pitfalls

- Treating all animation as one generic category.
- Planning bespoke visuals for every scene.
- Hiding missing tool paths until the asset stage.

---

## Gate Reminder (Binding)

This stage gates on human approval (`human_approval_default: true`). After review passes:
checkpoint with `status="awaiting_human"`, present the summary (the Backlot board renders
the artifact), and **END YOUR TURN**. Do not start the next stage in the same response.
Approval is per-gate — an earlier "go ahead" does not cover this gate.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (v3.0 Antigravity-native authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed inputs & visual prep; scene author/review; integration & pre-render gates; final render/mix review; delivery. Domain-specific phases (rig, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Source photo verification (when real/archival photos exist): `.venv/bin/python tools/qc/source_photo_gate.py --project projects/<slug>`.
- Fact whitelist check (Research v2 episodes): `.venv/bin/python tools/qc/fact_whitelist_gate.py --project projects/<slug>`.
- Editorial-language check (news-editorial-motion lane): `.venv/bin/python tools/qc/editorial_language_gate.py --project projects/<slug>`.
- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate` (strict mode default).
- Remotion layout/events validators (when rendering via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared.
- Antigravity episode gate & guarded render: `.venv/bin/python tools/qc/episode_gate.py projects/<slug> --mode agy`, then `.venv/bin/python tools/qc/render_episode.py <comp-id> <out.mp4> --agy` (never raw `npx remotion render`).

Strict success semantics (doctrine §6.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§6.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Publication separation (§6.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires explicit owner authorization.
