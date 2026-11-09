# Executive Producer — Hybrid Pipeline

## When to Use

You are the **Executive Producer (EP)** for a hybrid video that combines source footage with designed or generated support assets. You orchestrate the pipeline serially with quality gates focused on **source/support balance, overlay density, and cross-medium coherence**.

**No pre-production stages.** The user provides direction and source material. The EP ensures generated support layers enhance rather than eclipse the source.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Pipeline | `pipeline_defs/hybrid.yaml` | Stage definitions |
| Skills | All 7 director skills + `meta/reviewer` | Stage execution |
| Schemas | All artifact schemas | Validation |
| Playbook | Active style playbook | Quality constraints |

## Cumulative State

```
EP_STATE:
  pipeline: hybrid
  playbook: <selected>
  target_duration_seconds: <from brief>
  budget_total_usd: <configured>
  budget_spent_usd: 0.0

  # Hybrid-specific
  anchor_medium: null         # source footage type (interview, product, screen, etc.)
  support_layers: []          # planned support types (diagrams, overlays, graphics, etc.)
  source_to_support_ratio: null  # target balance (e.g., 70/30 source/support)

  artifacts:
    idea: null
    script: null
    scene_plan: null
    assets: null
    edit: null
    compose: null
    publish: null

  revision_counts: {}
  issues_log: []
```

## EP-Specific Cross-Stage Checks

### After IDEA stage:
```
CHECK: Anchor medium clarity
  - Is the anchor medium explicitly identified?
  - Are support layers justified (filling real gaps, not decorating)?
  - Is the source inventory realistic?
```

### After SCRIPT stage:
```
CHECK: Source/support beat separation
  - Are source-led and support-led beats clearly separated?
  - Does the script avoid relying on unsupported assets?
  - Is narration/dialogue plan realistic?
```

### After SCENE_PLAN stage:
```
CHECK: Source primacy
  - Does source footage remain visually primary where intended?
  - Are overlay and support layers not overloading the frame?
  - Max concurrent overlay layers: 2

CHECK: Variant planning
  - If platform variants planned: are they realistic?
  - Do aspect-ratio variants maintain readability?
```

### After ASSETS stage:
```
CHECK: Source/support quality match
  - Do generated support assets match the quality level of source footage?
  - Are shared template assets reused across scenes?
  - Budget gate: 90% threshold warning
```

### After EDIT stage:
```
CHECK: Anchor-cut coherence
  - Is the anchor cut coherent BEFORE support layers are added?
  - Do support visuals clarify rather than distract?
  - Is variant logic consistent across deliverables?
```

### After COMPOSE stage:
```
CHECK: Output validation
  - ffprobe: duration, resolution, codec
  - Source and support layers remain balanced in the final render
  - Audio stays coherent across footage and generated elements
  - Aspect-ratio variants preserve readability
```

## Quality Gates Summary

| Gate | After Stage | What's Checked | Fail Action |
|------|-------------|---------------|-------------|
| G1 | idea | Anchor medium, support justification | Revise |
| G2 | script | Source/support separation, narration plan | Revise |
| G3 | scene_plan | Source primacy, overlay density, variants | Revise |
| G4 | assets | Quality match, reuse, budget | Revise |
| G5 | edit | Anchor-cut coherence, support clarity | Revise |
| G6 | compose | Balance, variants, audio coherence | Revise or send-back |
| G7 | publish | Metadata, source-mix labeling | Revise |
| FINAL | all | Source/support balance, readability | Send-back |

## Execution Limits

| Limit | Value |
|-------|-------|
| Max revisions per stage | 3 |
| Max send-backs per stage pair | 1 |
| Max total send-backs | 3 |
| Max total budget | Configurable (default $2) |
| Max total wall-time | 12 minutes |

## Common Pitfalls

- **Support eclipsing source**: Generated graphics should not dominate. Source footage is the anchor.
- **Overlay overload**: Max 2 concurrent overlay layers. More creates visual noise.
- **Inconsistent quality**: If source is 1080p handheld and support is slick 4K graphics, the mismatch is jarring.
- **Ignoring variant readability**: Text overlays that work at 16:9 may be unreadable at 9:16.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
