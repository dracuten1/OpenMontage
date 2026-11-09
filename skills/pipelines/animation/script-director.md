# Script Director — Animation Pipeline

## When to Use

This stage turns the approved proposal into animation-ready beats. The script must leave room for motion, staging, and hold time — and must integrate the research findings and respect the selected animation mode.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/script.schema.json` | Artifact validation |
| Prior artifact | `proposal_packet` from Proposal Director | Selected concept, animation mode, target duration, reuse strategy |
| Optional artifact | `research_brief` from Research Director | Data points, audience insights, accuracy constraints |
| Meta skill | `skills/meta/voice-performance-director.md` | Structured TTS delivery cues for natural, expressive narration |
| Tools | `transcriber` | Optional source transcript support |

## Process

### 1. Absorb the Proposal

Read the `proposal_packet.selected_concept` thoroughly. Extract:

- **Title and hook** — the opening must deliver on this promise
- **Animation mode** — `manim`, `remotion`, `ai_video`, `diagram_stills`, or `mixed`. This constrains how you write.
- **Narrative structure** — `progressive_build`, `myth_busting`, `journey`, etc. Follow it.
- **Target duration** — word budget = target_seconds × 2.5 words/sec (at 150 WPM)
- **Key points** — from `selected_concept.key_points`
- **Reuse strategy** — recurring motifs mean recurring script structures

If `research_brief` is available, also extract:
- **Data points** — weave specific, sourced facts into the narration (not vague claims)
- **Audience misconceptions** — address them directly in the script
- **Mathematical accuracy notes** — constraints on what can and cannot be simplified

### 2. Write in Animation Beats

Each section should express ONE clear visual idea:

- **Statement** — introduce a concept (entrance animation)
- **Demonstration** — show it working (the main animation)
- **Transformation** — morph from one state to another (transition)
- **Comparison** — show two things side by side (split screen or sequential)
- **Conclusion** — land the insight (hold + emphasis)

If the piece is narration-led, also create `voice_performance` and section
`delivery_cues` using `skills/meta/voice-performance-director.md`. Motion-heavy
videos need vocal breathing room: mark pauses where the viewer must absorb an
animation, and mark emphasis where a reveal, transform, or comparison lands.

**Animation mode affects writing style:**

| Mode | Writing Style |
|------|---------------|
| Manim | Precise, mathematical. Each beat maps to a specific geometric transformation. Write narration that describes what's being shown. |
| Remotion | Data-driven, punchy. Each beat maps to a chart/component animation. Narration complements the visual data. |
| AI Video | Descriptive, evocative. Each beat describes a scene the AI should generate. Narration adds context the visual can't convey. |
| Diagram Stills | Explanatory, progressive. Each beat adds a layer to a building diagram. Narration walks through the build. |
| Mixed | Varies per section — tag each section's mode in metadata. |

### 3. Keep On-Screen Text Tight

Animation-heavy pieces fail when the viewer has to read too much while motion is happening:

- **Max 8 words** for on-screen titles
- **Max 15 words** for on-screen descriptions
- Prefer phrases over sentences
- Prefer numbers and labels over paragraphs
- Mathematical notation is fine — it IS the content in math-animation mode

### 4. Leave Room for Visual Holds

Do NOT fill every second with new information. The scene plan will need time for:

- **Entrances** (0.5-1s): objects appearing on screen
- **Reveals** (1-2s): progressive disclosure of complexity
- **Holds** (1-3s): letting the viewer absorb what they see
- **Exits** (0.5s): clearing the stage for the next beat

**Rule of thumb:** For every 10 seconds of narration, budget 3-4 seconds of visual breathing room. A 90-second video should have ~60-65 seconds of narration and ~25-30 seconds of visual holds.

### 5. Use Metadata for Motion Intent

Recommended metadata keys per section:

- `beat_type`: statement / demonstration / transformation / comparison / conclusion
- `animation_mode`: which mode this section uses (important for mixed mode)
- `text_constraints`: max words for on-screen text in this section
- `narration_plan`: how narration relates to visual (describes / complements / silent)
- `visual_priority`: what the viewer should focus on (the animation, the text, the data)
- `hold_time_seconds`: minimum visual hold time after this section's content
- `delivery_cues`: pace, energy, emphasis, pause timing, and provider-ready narration text for TTS
- `data_source`: if this section uses a research data point, reference it

### 6. Research Integration

If a `research_brief` is available:

- Use at least 2 data points from the research in the narration
- Ground the hook in the research's most surprising finding
- Address at least 1 audience misconception if the narrative structure supports it
- Cite sources naturally ("According to [source]..." or "A [year] study found...")
- Do NOT invent statistics — only use what the research found

### 7. Quality Gate

Before submitting the script, verify:

- [ ] Every section supports ONE strong visual idea
- [ ] On-screen text is concise (phrases, not paragraphs)
- [ ] Timing is animation-friendly (holds budgeted)
- [ ] Narration-led sections include concrete delivery cues and a voice-performance sample section
- [ ] Word count is within ±10% of target duration
- [ ] Animation mode is respected in writing style
- [ ] Research data points are integrated (if research_brief available)
- [ ] Mathematical accuracy is maintained (if applicable)
- [ ] Later stages can map scenes cleanly from this script

### Mid-Production Fact Verification

If you encounter uncertainty during script writing:
- Use `web_search` to verify factual claims before committing them to the script
- Use `web_search` to find reference images for visual accuracy
- Log verification in the decision log: `category="visual_accuracy_check"`

Every factual claim in the script should be traceable to the `research_brief`.
If you make a claim that isn't in the research, do additional research and
add the source. Do not invent statistics, dates, or attributions.

## Common Pitfalls

- **Writing too many ideas into one section.** One beat = one visual idea.
- **Treating captions and on-screen text as the same thing.** Subtitles are narration transcribed. On-screen text is designed content that's part of the animation.
- **Forgetting that motion needs pause and emphasis.** Budget hold times.
- **Ignoring the animation mode.** A Manim script reads differently than an AI video script.
- **Writing research-less scripts when a research_brief exists.** If the research found surprising data, use it. Generic scripts waste the research investment.
- **Oversimplifying math to the point of being wrong.** Check the research brief's accuracy notes.

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
