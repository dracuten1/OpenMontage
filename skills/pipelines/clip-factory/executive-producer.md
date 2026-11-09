# Executive Producer — Clip Factory Pipeline

## When to Use

You are the **Executive Producer (EP)** for a clip factory project. You orchestrate the pipeline serially with quality gates focused on **clip selection quality, batch consistency, hook placement, and per-platform optimization**.

**No pre-production stages.** Long-form source content exists. The EP manages the extraction of multiple independent short clips, ensuring each stands alone while maintaining series consistency.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Pipeline | `pipeline_defs/clip-factory.yaml` | Stage definitions |
| Skills | All 7 director skills + `meta/reviewer` | Stage execution |
| Schemas | All artifact schemas | Validation |
| Playbook | Active style playbook | Quality constraints |

## Cumulative State

```
EP_STATE:
  pipeline: clip-factory
  playbook: <selected>
  budget_total_usd: <configured>
  budget_spent_usd: 0.0

  # Clip-factory specific
  source_type: null            # webinar / stream / presentation / interview
  clip_count_target: 0
  platform_targets: []         # per-clip platform assignments
  clips_completed: 0

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
CHECK: Source and targets
  - Source content type identified?
  - Clip count target realistic for source duration? (rule of thumb: 1 clip per 5-10 min source)
  - Platform mix defined?
  - Clip selection criteria clear?
```

### After SCRIPT stage:
```
CHECK: Transcript and ranking
  - Full transcription with accurate timestamps?
  - At least N candidate clips where N >= clip_count_target?
  - Each candidate is self-contained (standalone test)?
  - Clips ranked by quality/engagement potential?
```

### After SCENE_PLAN stage:
```
CHECK: Clip boundaries
  - Each clip has clean in/out points (no mid-sentence cuts)?
  - Platform-specific framing planned (vertical vs square vs landscape)?
  - No clip exceeds platform max duration?

CHECK: Batch diversity
  - Clips cover different topics/moments from the source?
  - Not all clips from one section of the source?
```

### After ASSETS stage:
```
CHECK: Batch consistency
  - Per-clip subtitles with correct time offsets?
  - Shared branding assets (title cards, hooks) prepared?
  - Audio normalized consistently across all clips?
  - Budget gate: 90% threshold warning
```

### After EDIT stage:
```
CHECK: Hook placement
  - Each clip has its hook within first 2-3 seconds?
  - Subtitle styling consistent across all clips?
  - Each edit is independent (no cross-clip dependencies)?

CHECK: Completeness
  - Edit decisions exist for every planned clip?
```

### After COMPOSE stage:
```
CHECK: Batch render validation
  - All clips rendered successfully?
  - Each clip meets target platform specs (resolution, aspect ratio)?
  - Audio levels consistent across clips?
  - No clip has rendering artifacts?
```

## Quality Gates Summary

| Gate | After Stage | What's Checked | Fail Action |
|------|-------------|---------------|-------------|
| G1 | idea | Source assessment, clip targets | Revise |
| G2 | script | Transcript quality, clip ranking | Revise |
| G3 | scene_plan | Clip boundaries, batch diversity | Revise |
| G4 | assets | Batch consistency, audio normalization | Revise |
| G5 | edit | Hook placement, completeness | Revise |
| G6 | compose | Batch render probe, platform specs | Revise or send-back |
| G7 | publish | Per-clip metadata, posting order | Revise |
| FINAL | all | Clip quality, consistency, hooks | Send-back |

## Execution Limits

| Limit | Value |
|-------|-------|
| Max revisions per stage | 3 |
| Max send-backs per stage pair | 1 |
| Max total send-backs | 3 |
| Max total budget | Configurable (default $1) |
| Max total wall-time | 12 minutes |

## Common Pitfalls

- **Context-dependent clips**: Each clip must make sense alone. No "as I was saying" openings.
- **Slow hooks**: Social clips need to hook in 2-3 seconds. Front-load the interesting part.
- **Inconsistent audio levels**: Clips from different parts of the source have different audio levels. Normalize.
- **Missing platform optimization**: A YouTube clip and a TikTok clip need different aspect ratios.
- **All clips from one section**: Diverse clips from across the source perform better than 5 clips from the same 10 minutes.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
