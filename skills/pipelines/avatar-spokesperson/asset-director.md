# Asset Director - Avatar Spokesperson Pipeline

## When To Use

This stage prepares the actual spokesperson ingredients: narration, avatar or lip-sync footage, subtitle assets, branded backgrounds, and the minimal support graphics needed to complete the cut.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/asset_manifest.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["scene_plan"]["scene_plan"]`, `state.artifacts["script"]["script"]`, `state.artifacts["idea"]["brief"]` | Presenter plan and narration needs |
| Tools | `talking_head`, `lip_sync`, `tts_selector`, `subtitle_gen`, `image_selector`, `audio_enhance` — selectors auto-discover all available providers from the registry | Avatar, narration, and support asset options |
| Playbook | Active style playbook | Background, type, and subtitle rules |

## Process

### 1. Lock The Avatar Generation Path

Use one primary path and record it clearly:

- `talking_head` from still image plus audio,
- `lip_sync` from existing presenter plate plus new audio,
- externally supplied avatar render if created outside the current runtime.

Do not hide a blocked avatar path. Record it.

### 1b. Sample Preview (Prevents Wasted Spend)

Before batch-generating assets, produce one sample of each expensive type and show the user:

1. **TTS sample** (if generating narration): Generate one section. Confirm voice, pace, and persona before batching the rest.
2. **Avatar sample** (if using `talking_head`): Generate a short test clip. Confirm the avatar quality is acceptable before committing to full generation.

If rejected, adjust parameters and retry (max 3 iterations). Do not batch until approved.

### 2. Resolve Narration Before Support Graphics

Spokesperson videos depend on speech. Determine whether narration is:

- supplied,
- TTS-generated,
- already embedded in a presenter plate.

If narration is missing and no TTS tool is available, mark the project blocked instead of pretending the stage succeeded.

### 3. Build The Minimal Support Kit

Prepare only what the scene plan actually needs:

- subtitle files,
- one lower-third system,
- CTA card,
- background or plate assets,
- optional still or product support images.

### 4. Use Metadata For Capability Truth

Recommended metadata keys:

- `avatar_generation_path`
- `narration_assets`
- `subtitle_assets`
- `background_assets`
- `scene_asset_index`
- `blocked_assets`

### 5. Quality Gate

- the avatar path is explicit,
- narration and avatar assets align,
- support graphics stay minimal,
- every referenced file exists.

## No-Avatar Path

When the EP has triggered a narration-over-graphics pivot (neither `talking_head` nor `lip_sync` available), skip avatar generation entirely and produce a graphics-driven asset kit instead:

### What to produce:
1. **Narration audio** — via `tts_selector` (mandatory; block the project if no TTS is available either).
2. **Scene visuals** — via `image_selector` or `video_selector`. One primary visual per scene that reinforces the spoken point (diagram, illustration, product shot, or stock footage).
3. **Subtitle files** — same as standard path.
4. **Text cards** — key-point overlays, stat cards, CTA end card.
5. **Backgrounds** — consistent family matching the playbook.

### What to skip:
- No `talking_head` or `lip_sync` calls.
- No presenter framing metadata.
- `avatar_generation_path` should be set to `"none — narration-over-graphics pivot"`.

### Metadata for this path:
- `avatar_generation_path`: `"narration_over_graphics"`
- `pivot_reason`: why the no-avatar path was chosen
- All other metadata keys remain the same.

### Mid-Production Fact Verification

If you encounter uncertainty during asset generation:
- Use `web_search` to verify visual accuracy of subjects (e.g. what does this building actually look like?)
- Use `web_search` to find reference images before generating illustrations
- Log verification in the decision log: `category="visual_accuracy_check"`

Visual accuracy matters. If the script mentions a specific place, person, or object,
verify what it actually looks like before generating images. Don't rely on
the AI model's training data — it may be wrong or outdated.

## Common Pitfalls

- Building decorative assets before the narration path is solved.
- Mixing multiple avatar-generation strategies in one simple spokesperson video.
- Marking the stage complete when the core presenter asset is still hypothetical.
- (No-avatar path) Generating filler visuals with no connection to the narration — every image must reinforce the spoken point.


## When You Do Not Know How

If you encounter a generation technique, provider behavior, or prompting pattern you are unsure about:

1. **Search the web** for current best practices — models and APIs change frequently, and the agent's training data may be stale
2. **Check `.agents/skills/`** for existing Layer 3 knowledge (provider-specific prompting guides, API patterns)
3. **If neither helps**, write a project-scoped skill at `projects/<project-name>/skills/<name>.md` documenting what you learned
4. **Reference source URLs** in the skill so the knowledge is traceable
5. **Log it** in the decision log: `category: "capability_extension"`, `subject: "learned technique: <name>"`

This is especially important for:
- **Video generation prompting** — models respond to specific vocabularies that change with each version
- **Image model parameters** — optimal settings for FLUX, GPT Image, Imagen differ and evolve
- **Audio provider quirks** — voice cloning, music generation, and TTS each have model-specific best practices
- **Remotion component patterns** — new composition techniques emerge as the framework evolves

Do not rely on stale knowledge. When in doubt, search first.

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
