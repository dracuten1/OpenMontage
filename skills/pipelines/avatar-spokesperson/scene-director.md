# Scene Director - Avatar Spokesperson Pipeline

## When To Use

Plan the visual system for the presenter-led cut. This stage decides how the speaker sits in frame, what support layers appear, and which aspect ratios are actually worth building.

## Reference Inputs

- `skills/creative/typography.md`

## Process

### 1. Lock The Presenter Layout

Choose a primary layout:

- full presenter center frame,
- presenter plus side panel,
- presenter plus lower-third system,
- presenter over branded background.

Keep the hero layout simple and reusable.

### 2. Choose Background Discipline

Use one family:

- clean solid or gradient background,
- branded office or set,
- product UI or image plate,
- transparent-avatar composite plan.

Background changes should mark real section changes, not compensate for weak copy.

### 3. Map Support Layers

For each scene, decide whether the support layer is:

- none,
- subtitle only,
- lower third,
- product image,
- side-panel proof point,
- CTA card.

### 4. Plan Variants Late

Default to one hero cut first. Only plan vertical or square variants if the presenter layout and text system can survive the crop.

### 5. Quality Gate

- the presenter remains primary,
- support layers solve specific communication needs,
- the background system is consistent,
- variant ambition stays realistic.

## Narration-Over-Graphics Fallback

When the EP triggers a no-avatar pivot (no `talking_head` or `lip_sync` available), redesign the visual system to carry the story with graphics and voice-over instead of a presenter:

### Layout changes:
- **Primary frame**: full-screen visual (background, image, diagram, or motion graphic) with voice-over narration underneath.
- **Support layers**: key-point text cards, lower-third stats, illustrated diagrams, product screenshots.
- **CTA scene**: dedicated end card with clear CTA text, no presenter needed.

### What stays the same:
- The script and scene breaks are unchanged — the narration drives pacing.
- Subtitle planning is unchanged.
- Background discipline still applies (consistent family, not random).

### What changes:
- No presenter framing decisions (center, left-third, etc.) — replaced with full-frame visual compositions.
- Each scene needs a **primary visual** that reinforces the spoken content, since there's no face to anchor attention.
- Plan more visual variety per scene — without a presenter, static backgrounds feel empty.

## Common Pitfalls

- Switching backgrounds every few seconds.
- Filling empty space with decorative panels.
- Assuming a landscape presenter layout will survive a vertical crop untouched.
- (Fallback mode) Producing a wall of text on screen to compensate for no presenter — let the narration carry the content.

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
