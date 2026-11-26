# Script Director — Explainer Pipeline

## When to Use

You are the Script Writer for a generated explainer video. You have a `brief` artifact from the Idea Explorer. Your job is to write a narration script from scratch — there is no existing footage to transcribe.

The script is the backbone of the video. Every visual, every scene, every audio cue flows from what you write here. A mediocre script cannot be saved by great visuals.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/script.schema.json` | Artifact validation |
| Prior artifact | `proposal_packet` | Selected concept with title, hook, key_points, core_message, tone, narrative_structure, duration |
| Prior artifact | `research_brief` (optional but high-value) | Data points, audience insights, expert quotes — ground the script in real facts |
| Playbook | Active style playbook from `proposal_packet.selected_concept.suggested_playbook` | Voice style, pacing rules |
| Meta skill | `skills/meta/voice-performance-director.md` | Structured TTS delivery cues for natural, expressive narration |
| Layer 3 | TTS provider skills (check `agent_skills` on the selected TTS tool) | TTS capabilities for speaker directions |

## Process

### Step 1: Absorb the Proposal and Research

Read the `proposal_packet.selected_concept` carefully. Extract:
- **Target duration** — this is your word budget (see timing table below)
- **Hook** — your opening must deliver on this promise
- **Key points** — these must all be covered in the script
- **Core message** — the one thing the viewer should remember
- **Tone** — shapes word choice, sentence length, formality
- **Target audience** — shapes complexity and assumed knowledge
- **Narrative structure** — the structural approach (myth_busting, journey, data_narrative, etc.)

Then read the `research_brief` for grounding material:
- **`data_points`** — specific statistics and facts to weave into the script. Use claims with `surprise_factor: "surprising"` or `"counterintuitive"` as retention anchors.
- **`audience_insights.misconceptions`** — if the narrative structure is `myth_busting`, these are your myth/reality pairs.
- **`audience_insights.common_questions`** — address these directly in the script where they naturally fit.
- **`expert_voices`** — quotable experts add authority. Use sparingly — one or two per script.
- **`trending.recent_developments`** — if timely, reference them to make the content feel current.

**The research_brief is your cheat sheet.** Every fact, every surprising stat, every misconception is pre-verified and sourced. Use them. A script that cites "73% of developers..." (from research) is more compelling than one that says "many developers..."

### Step 2: Deepen Research Where Needed

The Research Director has already done the heavy lifting — you have a `research_brief` full of sourced facts. Your job here is targeted:

1. **Verify and update**: If any data point from the research_brief feels stale or uncertain, re-search to confirm.
2. **Fill script-specific gaps**: The research gives you broad facts. You may need a specific analogy, a precise technical detail, or a better example for a particular section.
3. **Find the best explanation**: How do the best educators (3Blue1Brown, Kurzgesagt, Fireship, Veritasium) explain this concept? What analogies work?
4. **Source quotable moments**: If the research_brief's expert_voices section has useful quotes, use them. If not, search for one strong quote to anchor a key section.

**Do NOT duplicate the Research Director's work.** If the research_brief already has 6 data points, you don't need to find 6 more. Focus on script-level needs: the right word, the right analogy, the right sequence.

### Step 3: Plan the Narrative Arc

Before writing prose, plan the structure so the video hooks immediately and sounds like a sharp human journalist — never an AI summary bot:

```
HOOK (0-5s)     → Scene 1 IS the cover thumbnail (t=0). Open with a stakes, contrast, or scale hook
                   from Research v2 ranked hook_candidates. Pair with an immediate visual proof (map/chart/cutout).
                   NEVER: "In this video, we'll learn about..."
                   NEVER: "Trong bối cảnh hiện nay...", "Hãy cùng tìm hiểu...", "Chào mừng các bạn..."
                   NEVER: burn seconds 0-3s on an intro brand bumper (BrandBumper goes strictly at the outro).

SETUP (5-15s)   → Why should the viewer care right now? Establish the tension or money/policy stakes.

BUILD (15-Xs)   → Progressive revelation using "therefore / but" causal transitions, NOT "and then."
                   Stick strictly to Research v2 `fact_table` numbers (`narration_form` for TTS, `display_string` for screen).

NHẬN ĐỊNH (POV) → Dedicated human editorial commentary beat: connect the facts to what actually matters next,
                   stating clear assumptions/nuance (DỰ THẢO, [tính toán], attribution) without hedging filler.

LANDING (last 5s) → Sharp takeaway + concrete CTA (before the 3s outro BrandBumper).
```

#### Engagement Mode Respect (`standard` vs. `debate_engagement`)
Check `proposal_packet.production_plan.engagement_mode` (or `selected_concept.engagement_mode`, default `standard`):
- **If `standard` (or omitted):** Follow the standard Narrative Arc above strictly. Do **NOT** inject unsolicited debate questions, forced-choice polls, or artificial controversy.
- **If `debate_engagement`:** Execute the approved `selected_concept.engagement_design` faithfully across the full content-driven runtime (fully flexible, no hard time cap):
  - Deliver the `opening_hook_type` tension in seconds 0–3.
  - Place each approved `friction_beats` micro-question at its planned act/chapter transition (with matching on-screen text/question card cue).
  - Present both `steelman_sides` (`camp_a` vs. `camp_b`) fairly without taking a partisan stance or inventing facts outside `fact_table`.
  - Close with the exact `closing_dilemma` (A vs. B / tradeoff question) paired with the `debate_visual_cue`.
  - **Audience-Centered Debate Rule:** Every spoken debate question (`opening`, `mid-roll`, and `closing`) MUST center on the target audience's own stakes (Vietnamese citizens, workers, exporters, consumers, or Vietnamese perspectives on VN channels). Keep foreign domestic reactions strictly as factual context, never asking viewers to pick sides on another country's internal interests.

#### Anti-AI Voice & Spoken Cadence Rules
- **Short spoken sentences & TTS chunk safety:** Keep every narration sentence `≤ 140` characters (and `≤ 18` words where natural in Vietnamese, max 1 clause pivot per beat) with crisp `.` or `?` punctuation. Never write a 200+ char run-on sentence in `provider_text` (local TTS engines cap per-chunk frame length; `build_episode_audio.py` also splits sub-chunks `≤ 150` chars and enforces Per-Section Tail Completeness). Hook `S01` should use **2 crisp short sentences** so the opening punch lands intact.
- **Content-Driven Flexible Duration (No Hard Cap):** Never artificially starve or truncate explainers to fit a default time box (`60s`, `90s`, `120s`, or `300s`) when the topic needs concrete examples, statutory exceptions, counterarguments, or step-by-step mechanisms. Scale naturally across as many `15–25s` sections as the story needs so every idea is complete and clear. Enforce a strict runtime cap only if the user explicitly specified one.
- **Display vs. Narration Consistency (Doctrine §3):** Use exact `fact_table.display_string` for on-screen text and `fact_table.narration_form` for TTS `provider_text`. Never display an English label while narrating a different Vietnamese translation (e.g., never display `"Expert"` while saying `"chuyên gia"`).
- **Ban AI Filler Words:** Reject openings/transitions like `"Đáng chú ý"`, `"Nhìn chung"`, `"Tóm lại là"`, `"Có thể thấy rằng"`, `"Một câu hỏi được đặt ra"`. Lead directly with the verb, person, or concrete number.

Map each of the brief's `key_points` to a specific section in the BUILD phase.

### Step 4: Write the Script

Before writing sections, create a top-level `voice_performance` plan using
`skills/meta/voice-performance-director.md`. The plan must describe the vocal
intent, pacing profile, energy curve, pause policy, and which section should be
used for TTS sample approval. Do not leave this as a vague "natural voice" note.

Write each section with these fields:

```json
{
  "id": "s1",
  "label": "Hook",
  "text": "Your database searches every single row. Every. Single. One. What if it didn't have to?",
  "start_seconds": 0,
  "end_seconds": 5,
  "speaker_directions": "Emphasize 'every single row' with measured pacing. Brief pause before the question.",
  "delivery_cues": {
    "pace": "measured",
    "energy": "curious",
    "emphasis_words": ["every", "single"],
    "pause_after_seconds": 0.6,
    "delivery_note": "Let the repetition feel intentional, then soften into the question.",
    "provider_text": "Your database searches every single row. Every. Single. One. <break time=\"0.6s\"/> What if it didn't have to?"
  },
  "enhancement_cues": [
    {
      "type": "animation",
      "description": "Database table with rows highlighted one by one, slowing down as count increases",
      "timestamp_seconds": 1
    }
  ],
  "pronunciation_guides": []
}
```

#### Section Duration and Splitting Guidance

Target **≤20–25s** per script section (soft cap). Split long thoughts at natural narrative boundaries (problem statement → data revelation, or cause → consequence).

**Why this matters (measured data):**
Empirical investigation of production runs demonstrates that planned-vs-actual TTS duration drift scales directly with section length:
- Sections **<10s** average only **0.86s** drift.
- Long sections of **30–40s** balloon to **7.7s** average drift.

Keeping sections ≤20–25s bounds duration drift, keeps speech aligned with scene visuals, and prevents cascading timing mismatches down the pipeline.

#### Timing Estimation

| Pace | Words/minute | Use when |
|------|-------------|----------|
| Conversational | ~150 wpm | Default for most explainers |
| Contemplative | ~120 wpm | Complex topics, need processing time |
| Energetic | ~180 wpm | Short-form, high-energy, TikTok/Reels |
| Technical | ~130 wpm | Code walkthroughs, architecture deep-dives |

**Word-to-duration reference (pacing guide, not a hard limit):**
- 30s video → ~65-75 words
- 60s video → ~130-150 words
- 90s video → ~195-225 words
- 120s video → ~260-300 words
- 180s (3 min) → ~390-450 words
- 300s (5 min) → ~650-750 words
- Longer / Custom → ~2.2-2.5 words/sec (`target_duration_seconds` scales from measured script + TTS unless the user explicitly locked a fixed time budget).

Only trim to fit a strict word/second budget when the user explicitly specified a fixed duration limit — otherwise let `total_duration_seconds` follow the natural script depth and split long thoughts into additional `≤25s` sections.

#### Speaker Directions

Write directions that TTS can actually implement. Prefer structured
`delivery_cues` over prose-only `speaker_directions`:

| Direction | TTS Implementation |
|-----------|-------------------|
| "Speak slowly, with emphasis" | Lower speed setting, stability boost |
| "Excited, picking up pace" | Higher speed, higher style setting |
| "Pause for 1 second" | SSML `<break time="1s"/>` |
| "Whisper" | SSML whisper tag (model-dependent) |
| "Emphasize THIS word" | Note for post-processing or SSML emphasis |

Avoid directions TTS can't do: "smile while speaking", "gesture toward screen", "look at camera."

**Expressive narration rule:** every narration-led section must include at
least two concrete cues among `pace`, `energy`, `emphasis_words`,
`pause_before_seconds`, `pause_after_seconds`, `delivery_note`, or
`provider_text`. Use `provider_text` when punctuation or SSML break tags are
needed to make the read sound human.

#### Enhancement Cues

Every section should have at least one enhancement cue. These tell the Scene Planner and Asset Generator what visuals to create.

| Cue Type | When to Use | Example |
|----------|-------------|---------|
| `overlay` | Key term, definition, label | "Show 'embedding' definition overlay" |
| `diagram` | Process, architecture, flow | "Mermaid flowchart: query → encode → search → rank" |
| `stat_card` | Surprising number or comparison | "Display: 1ms vs 500ms search time" |
| `animation` | Concept that needs motion to understand | "Animate vectors moving through high-dimensional space" |
| `code_snippet` | Code example | "Show Python: `results = collection.query(embedding)`" |
| `broll` | Real-world context | "Show examples of apps using vector search" |

**Density rule**: At least one enhancement cue every 8-10 seconds. A 60-second video should have 6-8 cues minimum. Viewers disengage if the visual doesn't change.

#### Pronunciation Guides

For technical terms, acronyms, and non-English words:

```json
{"word": "FAISS", "phonetic": "FACE"},
{"word": "Qdrant", "phonetic": "kuh-DRANT"},
{"word": "cosine", "phonetic": "CO-sign"}
```

### Step 5: Validate Against Playbook

Read the active style playbook and verify:

| Playbook Field | Script Impact |
|----------------|---------------|
| `identity.pace` | Match word density. `contemplative` = fewer words, longer pauses |
| `audio.voice_style` | Shape tone of speaker directions |
| `voice_performance` | Confirm pacing, pauses, and energy curve are explicit enough for TTS |
| `motion.pacing_rules` | E.g., "hold establishing shots for 2s minimum" affects section timing |
| `identity.mood` | Word choice: `warm` uses casual language; `professional` uses precise language |

### Step 6: Self-Evaluate

Score your script (1-5):

| Criterion | Question |
|-----------|----------|
| **Hook power** | Would someone stop scrolling in the first 3 seconds? |
| **Word count accuracy** | Within ±10% of target for the duration? |
| **Narrative flow** | Does each section build on the last? "Therefore/but" not "and then"? |
| **Enhancement density** | At least one cue every 8-10 seconds? |
| **Voice performance** | Are pauses, emphasis, pace, and sample section explicit? |
| **Jargon management** | Technical terms explained or have pronunciation guides? |
| **Climax payoff** | Does the aha moment deliver on the hook's promise? |
| **CTA relevance** | Is the call to action specific and actionable? |

If any dimension scores below 3, revise before submitting.

### Step 7: Submit

Validate `script_json` against the canonical script schema, persist it through
the checkpoint protocol, and attach the stage review. There is no separate
explainer submit function.

### Mid-Production Fact Verification

If you encounter uncertainty during script writing:
- Use `web_search` to verify factual claims before committing them to the script
- Use `web_search` to find reference images for visual accuracy
- Log verification in the decision log: `category="visual_accuracy_check"`

Every factual claim in the script should be traceable to the `research_brief`.
If you make a claim that isn't in the research, do additional research and
add the source. Do not invent statistics, dates, or attributions.

## Common Pitfalls

- **Writing too many words**: The #1 failure. TTS pacing is fixed. If you write 250 words for a 60-second video, either the audio will be rushed or the video will be 100 seconds. Count your words.
- **Front-loading information**: The hook should create curiosity, not dump information. "HTTPS uses TLS 1.3 with AEAD ciphers" is a terrible opening. "The padlock icon doesn't mean what you think it means" is compelling.
- **Missing enhancement cues**: A script without visual direction is a podcast script. Every section needs at least one cue telling the visual team what to show.
- **Generic speaker directions**: "Read naturally" is useless. "Start measured and precise, then accelerate through the list to convey scale" is actionable.
- **Forgetting the audience**: A script for CTOs should use different words than one for high schoolers, even if covering the same concept.
- **No transitions between sections**: Each section should have a logical bridge to the next. The viewer should never think "wait, why are we talking about this now?"

## Example: Well-Written Section

```json
{
  "id": "s3",
  "label": "The Core Idea",
  "text": "Instead of matching keywords, vector databases convert everything — text, images, audio — into lists of numbers called embeddings. Similar things get similar numbers. So finding related content becomes a math problem: which numbers are closest?",
  "start_seconds": 15,
  "end_seconds": 28,
  "speaker_directions": "Measured pace through 'text, images, audio' with slight pause between each. Speed up slightly on 'similar things get similar numbers' — it should feel like a revelation. Brief pause before the final question.",
  "enhancement_cues": [
    {
      "type": "animation",
      "description": "Show text/image/audio icons transforming into number arrays (embeddings). Arrays cluster by similarity in a 2D space.",
      "timestamp_seconds": 16
    },
    {
      "type": "stat_card",
      "description": "Display: 'Everything becomes numbers. Similar things → similar numbers.'",
      "timestamp_seconds": 22
    }
  ],
  "pronunciation_guides": [
    {"word": "embeddings", "phonetic": "em-BED-ings"}
  ]
}
```

---

## Gate Reminder (Binding)

This stage gates on human approval (`human_approval_default: true`). After review passes:
checkpoint with `status="awaiting_human"`, present the summary (the Backlot board renders
the artifact), and **END YOUR TURN**. Do not start the next stage in the same response.
Approval is per-gate — an earlier "go ahead" does not cover this gate.

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
