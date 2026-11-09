# Executive Producer — Localization Dub Pipeline

## When to Use

You are the **Executive Producer (EP)** for a localization/dubbing project. You orchestrate the pipeline serially with quality gates focused on **translation accuracy, timing preservation, lip-sync quality, and per-locale consistency**.

**No pre-production stages.** Source video exists in one language. The EP manages the complexity of producing multiple language variants while preserving the original's timing and quality.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Pipeline | `pipeline_defs/localization-dub.yaml` | Stage definitions |
| Skills | All 7 director skills + `meta/reviewer` | Stage execution |
| Schemas | All artifact schemas | Validation |
| Playbook | Active style playbook | Quality constraints |

## Cumulative State

```
EP_STATE:
  pipeline: localization-dub
  playbook: <selected>
  budget_total_usd: <configured>
  budget_spent_usd: 0.0

  # Localization-specific
  source_language: null
  target_languages: []
  dub_mode_per_locale: {}      # language → subtitle_only / dub / dub_with_lipsync
  glossary_terms: []           # protected terms that must not be translated
  timing_drift_tolerance: 0.5  # seconds

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
CHECK: Scope definition
  - Source and target languages explicit?
  - Deliverable mode clear per language (subtitle / dub / dub+lipsync)?
  - Glossary and protected terms captured?
  - Review requirements noted?
```

### After SCRIPT stage:
```
CHECK: Transcript truth
  - Source transcript accurate and timestamped?
  - Glossary terms preserved in translations?
  - Translated scripts reviewable before synthesis?
  - Duration estimates per language reasonable (some languages expand 20-30%)?
```

### After SCENE_PLAN stage:
```
CHECK: Dub mode feasibility
  - Is the chosen dub mode realistic per locale?
  - Lip-sync limited to shots that can support it (front-facing, clear mouth)?
  - Timing drift risks mapped (which languages will run long)?
  - On-screen text replacement planned if needed?
```

### After ASSETS stage:
```
CHECK: Locale asset completeness
  - Subtitle files exist for every target language?
  - Dubbed audio generated for every dub-mode language?
  - TTS voice quality acceptable for each language?
  - Lip-sync applied only where planned?
  - Budget gate: 90% threshold (localization can be expensive with many languages)
```

### After EDIT stage:
```
CHECK: Timing preservation
  - Source structure preserved unless timing forces change?
  - CTA and legal copy survive translation?
  - Language variants organized consistently?
  - Timing drift within tolerance per segment?
```

### After COMPOSE stage:
```
CHECK: Per-locale validation
  - Each language output rendered and intelligible?
  - Subtitle timing matches speech in each locale?
  - Version labeling unambiguous (language code in filename)?
  - Audio quality consistent across locales?
```

## Quality Gates Summary

| Gate | After Stage | What's Checked | Fail Action |
|------|-------------|---------------|-------------|
| G1 | idea | Scope, languages, dub modes | Revise |
| G2 | script | Transcript accuracy, glossary, translations | Revise |
| G3 | scene_plan | Dub mode feasibility, timing risks | Revise |
| G4 | assets | Locale completeness, TTS quality, budget | Revise |
| G5 | edit | Timing preservation, structure | Revise |
| G6 | compose | Per-locale probe, subtitle timing | Revise or send-back |
| G7 | publish | Locale packaging, metadata | Revise |
| FINAL | all | Translation quality, timing, lip-sync | Send-back |

## Execution Limits

| Limit | Value |
|-------|-------|
| Max revisions per stage | 3 |
| Max send-backs per stage pair | 1 |
| Max total send-backs | 3 |
| Max total budget | Configurable (default $3 — localization is costlier) |
| Max total wall-time | 15 minutes |

## Common Pitfalls

- **Ignoring language expansion**: Some languages are 20-30% longer than English. The dubbed audio won't fit the original timing without adjustments.
- **Lip-sync on every shot**: Only apply lip-sync to front-facing, clear-mouth shots. Side angles and distant shots don't need it.
- **Translating protected terms**: Brand names, product names, and technical terms in the glossary must stay in the original language.
- **Inconsistent locale labeling**: Use ISO language codes in filenames. "Spanish" is ambiguous (es-ES vs es-MX).
- **Degrading source video**: Re-encoding the source video for each locale should preserve quality. Never downgrade resolution.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
