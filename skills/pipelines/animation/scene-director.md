# Scene Director - Animation Pipeline

## When To Use

You are converting the script into a feasible animation plan. This is the stage that decides whether the project feels designed or chaotic.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/scene_plan.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["script"]["script"]`, `state.artifacts["proposal"]["proposal_packet"]` | Beat map and tool path |
| Playbook | Active style playbook | Palette, typography, motion consistency |

## Process

### 1. Make An Animatic-Minded Plan

For each scene, define:

- what appears first,
- what changes,
- what is held,
- how the scene exits.

### 2. Limit Transition Families

Choose a small set of transition meanings:

- cut,
- fade,
- slide,
- transform.

### 3. Match Scene Type To Tool Path

Use:

- `diagram` scenes for structured explanation,
- `animation` scenes for motion-first sequences,
- `text_card` for clean high-impact copy moments,
- `generated` only where needed.

**For `image_animation` approach (anime/illustration style):**

Use `anime_scene` type for each scene. Plan:

- **Images per scene**: 2-3 images built from the same visual system and nearby seeds for crossfade effect
- **Camera motion**: choose from `zoom-in`, `zoom-out`, `pan-left`, `pan-right`, `ken-burns`, `drift-up`, `drift-down`, `parallax`, `static` — vary per scene to prevent monotony
- **Particle type**: choose from `fireflies`, `petals`, `sparkles`, `mist`, `light-rays` — match to scene mood
- **Lighting**: optional `lightingFrom`/`lightingTo` gradient for atmospheric shifts within the scene
- **Vignette**: `true` for cinematic framing (default), `false` for bright/open scenes
- **Scene duration**: 4-7 seconds per scene. Longer scenes need more images for crossfade variety.

**Scene variety rules for image_animation:**
- Don't use the same camera motion for consecutive scenes
- Alternate between warm and cool particle types
- Mix close-up and wide establishing shots
- Use overlays (`hero_title`, `section_title`) to add narrative structure

**JSON prop name mapping** (use these exact field names in the composition JSON):

| Concept | JSON Field | Example Values |
|---------|-----------|----------------|
| Camera motion | `animation` | `"zoom-in"`, `"pan-right"`, `"ken-burns"` |
| Particle effect | `particles` | `"fireflies"`, `"sparkles"`, `"mist"` |
| Particle color | `particleColor` | `"#FFE082"` |
| Particle density | `particleCount` | `20` (range: 1-50) |
| Particle brightness | `particleIntensity` | `0.5` (range: 0-1) |
| Lighting start | `lightingFrom` | `"rgba(255,200,100,0.15)"` or `"transparent"` |
| Lighting end | `lightingTo` | `"rgba(255,107,157,0.08)"` or `"transparent"` |
| Cinematic edge darken | `vignette` | `true` / `false` |
| Scene background | `backgroundColor` | theme-derived value such as `"#0A0A1A"` or `"#F6F1E8"` |

Historical examples `mori-no-seishin.json` (6 scenes using this pattern) and `deep-ocean.json` (6 underwater scenes with different palette) were removed from the repo; current format examples: `remotion-composer/public/demo-props/`.

### 4. Use Metadata For Timing Rules

Recommended metadata keys:

- `animatic_rules`
- `transition_rules`
- `hold_rules`
- `tool_path_map`
- `reusable_motifs`

### 5. 5-Aspect Scene-Plan Checklist

> Every scene must specify all five aspects, BUT the load shifts with the scene's `animation_mode`. Manim and other diagrammatic/programmatic scenes care most about **Subject** and **Spatial Framing** — Camera and Subject Motion in the cinematographic sense often map to N/A or to abstract equivalents. AI-video / `image_animation` / `anime_scene` scenes care about all five and behave like cinematic shots. Marking an aspect as N/A is allowed but must be explicit per scene; silent omission is forbidden.
>
> 1. **Subject** — type + key visual attributes; for Manim, the equation/object/graph being foregrounded; for `anime_scene`, the character or environment in focus.
> 2. **Subject Motion** — for Manim, the order of `Create`/`Transform`/`FadeIn` and what each animation conveys; for AI-video, the actions and interactions in temporal order.
> 3. **Scene** — overlays (separately!) + POV + setting + time of day + scene dynamics. For Manim, "setting" is the canvas background + axis style; for `anime_scene`, the environment + lighting gradient.
> 4. **Spatial Framing** — shot size + position-in-frame + depth (FG/MG/BG) + camera-height-relative; and how those CHANGE. Manim cares about layout grid + element positions; AI-video cares about full cinematographic framing.
> 5. **Camera** — playback speed → lens distortion → height → angle → focus/DoF → steadiness → movement. For Manim and pure motion-graphics, default to N/A unless using a virtual camera move (`MoveCamera`, `self.frame`). For `anime_scene` and AI-video, specify fully.
>
> Tie this back to `animation_mode` in scene metadata: a Manim scene that lists Camera fully is over-specified; an AI-video scene that omits Camera is under-specified. See `skills/creative/video-gen-prompting.md` for the primitive vocabulary.

> **Overlays callout.** Overlays (titles, subtitles, HUD, watermarks, framing graphics, lower-thirds, `hero_title`, `section_title`, `provider_chip`) are NOT part of the scene's foreground/midground/background depth axis. List them separately in scene metadata (`overlays: [...]`) with content and placement. Never describe an overlay as "in the foreground" — that confuses both downstream tools and any video-understanding model that re-analyzes the output.

### 6. Quality Gate

- every scene has a clear timing intent,
- the 5-aspect checklist is satisfied for the scene's `animation_mode` (with explicit N/A where appropriate),
- overlays live under `overlays:`, never inside the framing description,
- the transition system is limited and meaningful,
- the tool path is explicit,
- the sequence feels like one designed system.

## Common Pitfalls

- Adding a new transition idea in every scene.
- Planning scenes that have no realistic production path.
- Overanimating text-heavy scenes.

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
