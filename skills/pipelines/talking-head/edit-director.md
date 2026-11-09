# Edit Director — Talking Head Pipeline

## When to Use

You have a scene plan and asset manifest. Your job is to assemble the edit decision list for a talking-head video: primarily keeping the full footage with subtitle overlay and optional enhancements.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/edit_decisions.schema.json` | Artifact validation |
| Prior artifacts | Scene plan, Asset manifest, Script | Edit inputs |
| Playbook | Active style playbook | Transition and pacing rules |

## Process

### Step 1: Apply Silence Cuts (if planned)

If the scene plan includes silence removal, run `silence_cutter` before defining cuts:

```
silence_cutter.execute({
    "input_path": "<raw_footage>",
    "mode": "remove",           # or "speed_up" for less jarring result
    "silence_threshold_db": -35,
    "min_silence_duration": 0.5,
    "padding_seconds": 0.08,    # prevents clipped words
    "output_path": "<project>/assets/video/footage_cut.mp4"
})
```

**Choosing the mode:**
- `remove` — Hard jump cuts. Best for fast-paced social content (Reels, TikTok, Shorts)
- `speed_up` — Fast-forwards through silence at 6x. Less jarring for longer-form content (YouTube, LinkedIn)

Present the result to the user: "Removed X seconds of silence (Y%) — output is now Z seconds."

Use the cut footage as the source for all subsequent steps.

### Step 2: Define Primary Cut

For talking-head, the primary cut is usually the full footage (or trimmed segments). Create cuts that:
- Reference the raw footage (or silence-cut footage) as source
- Use timestamps from the script sections
- Apply any trim decisions (cut dead air, false starts)

### Step 3: Configure Subtitles

- Enable subtitles with playbook-compatible styling
- Reference the subtitle asset from the manifest
- Set position (usually bottom-center)

### Step 4: Configure Audio

- Set narration to the raw footage audio
- If background music is desired, configure ducking
- Set music volume per playbook

### Step 5: Plan Enhancements

If the scene plan includes overlays:
- Add overlay cuts for text cards, lower thirds
- Time them to match speech content

### Step 6: Self-Evaluate

| Criterion | Question |
|-----------|----------|
| **Coverage** | Do cuts span the full intended duration? |
| **Silence** | Were silence cuts applied if planned? What % was removed? |
| **Subtitles** | Are subtitles enabled and styled? |
| **Audio** | Is audio configuration complete? |

### Step 7: Submit

Validate the edit_decisions against the schema and persist via checkpoint.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
