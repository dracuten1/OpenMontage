# Edit Director - Animation Pipeline

## When To Use

This stage turns the scene plan into an animatic-grade edit plan. Timing is the product.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/edit_decisions.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["assets"]["asset_manifest"]`, `state.artifacts["scene_plan"]["scene_plan"]`, `state.artifacts["script"]["script"]` | Assets, timing plan, and beats |
| Playbook | Active style playbook | Motion and typography rules |

## Process

### 1. Protect Hold Time

After key reveals, plan enough time for the viewer to process the frame. Do not stack every scene edge to edge with motion.

### 2. Stagger Secondary Elements

Primary element first, supporting elements second. The edit decisions should reinforce hierarchy.

### 3. Keep Motion Meaningful

Motion should signal:

- emphasis,
- transition,
- transformation,
- contrast.

### 4. Use Metadata For Timing Detail

Recommended metadata keys:

- `hold_windows`
- `stagger_rules`
- `transition_map`
- `scene_timing_notes`

### 5. Quality Gate

- key information has enough dwell time,
- movement clarifies hierarchy,
- transitions stay consistent,
- the edit remains readable on the target platform.

## Common Pitfalls

- Overcrowding the timeline with continuous motion.
- Revealing all elements at once.
- Letting stylistic motion reduce readability.

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
