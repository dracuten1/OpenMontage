# Executive Producer — Podcast Repurpose Pipeline

## When to Use

You are the **Executive Producer (EP)** for a podcast repurpose project. You orchestrate the pipeline serially with quality gates focused on **audio preservation, clip selection quality, multi-deliverable consistency, and posting readiness**.

**No pre-production stages.** Source audio/video exists. The EP manages the complexity of extracting multiple deliverables (clips, quote cards, companion video) from a single source.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Pipeline | `pipeline_defs/podcast-repurpose.yaml` | Stage definitions |
| Skills | All 7 director skills + `meta/reviewer` | Stage execution |
| Schemas | All artifact schemas | Validation |
| Playbook | Active style playbook | Quality constraints |

## Cumulative State

```
EP_STATE:
  pipeline: podcast-repurpose
  playbook: <selected>
  budget_total_usd: <configured>
  budget_spent_usd: 0.0

  # Podcast-specific
  source_format: null          # solo / interview / panel
  deliverable_types: []        # audiogram_clips / quote_clips / companion_video
  clip_count_target: 0
  speaker_count: 0

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
CHECK: Source assessment
  - Source podcast format identified (solo, interview, panel)?
  - Output types specified and realistic for source length?
  - Clip count target achievable given source duration?
```

### After SCRIPT stage:
```
CHECK: Transcript quality
  - Full episode transcribed with accurate timestamps?
  - Speaker diarization present if multi-speaker?
  - Highlight segments and quotable moments identified?
  - At least N candidate clips where N >= clip_count_target?
```

### After SCENE_PLAN stage:
```
CHECK: Clip standalone quality
  - Does each planned clip make sense without episode context?
  - Does each clip have a strong opening hook?
  - Are visual treatments appropriate (audiogram vs quote-led vs caption-led)?

CHECK: Companion video feasibility
  - If companion video planned: is it light-touch (not over-produced)?
  - Does chapter structure align with topic transitions?
```

### After ASSETS stage:
```
CHECK: Audio preservation
  - Original podcast audio quality preserved (no degradation)?
  - Speaker-specific assets (photos, name cards) consistent?
  - Subtitles generated for all deliverables?
  - Budget gate: 90% threshold warning
```

### After EDIT stage:
```
CHECK: Clip openings
  - Each clip opens with its hook within first 3 seconds
  - Attribution (show name, speaker) present but not slow
  - Quote cards and captions timed correctly

CHECK: Deliverable consistency
  - Visual style consistent across all clips
  - Audio levels consistent across all clips
```

### After COMPOSE stage:
```
CHECK: Multi-deliverable validation
  - All planned deliverables rendered (clips + companion if planned)?
  - Each clip meets platform specs (resolution, aspect ratio)?
  - Audio quality preserved from original podcast?
  - Waveform/motion treatments correct per layout?
```

## Quality Gates Summary

| Gate | After Stage | What's Checked | Fail Action |
|------|-------------|---------------|-------------|
| G1 | idea | Source format, deliverable types | Revise |
| G2 | script | Transcript quality, highlights | Revise |
| G3 | scene_plan | Clip quality, companion feasibility | Revise |
| G4 | assets | Audio preservation, subtitles, budget | Revise |
| G5 | edit | Clip hooks, deliverable consistency | Revise |
| G6 | compose | Multi-deliverable probe, audio quality | Revise or send-back |
| G7 | publish | Per-clip metadata, posting schedule | Revise |
| FINAL | all | Audio quality, clip selection, consistency | Send-back |

## Execution Limits

| Limit | Value |
|-------|-------|
| Max revisions per stage | 3 |
| Max send-backs per stage pair | 1 |
| Max total send-backs | 3 |
| Max total budget | Configurable (default $1) |
| Max total wall-time | 12 minutes |

## Common Pitfalls

- **Degrading source audio**: The podcast audio is the product. Never re-encode at lower quality.
- **Context-dependent clips**: Every clip must stand alone. Test: would a stranger understand this clip?
- **Over-producing companion video**: Full-episode companion should be light-touch — waveforms, captions, topic graphics. Not a feature film.
- **Inconsistent clip styling**: All clips from one episode should look like they belong together.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
