# Agent Orchestrator — Meta Skill

## Purpose

This skill defines the multi-agent orchestration architecture for OpenMontage to prevent **Big Context / Context Bloat**.

During full video productions, accumulating raw tool logs (API outputs, ffmpeg encoding traces, Whisper timestamps, image base64 payloads, Remotion/npm build messages) quickly exhausts the context window (150k+ tokens), causing attention dilution, rule forgetting, high latency, and high cost.

The solution is an **Orchestrator + Subagent Team** using a **Blackboard Architecture** (Disk-as-State).

---

## Architecture Overview

```
                      ┌───────────────────────────────┐
                      │        Human (Owner)          │
                      └──────────────┬────────────────┘
                                     │ (Approval Gates)
                      ┌──────────────▼────────────────┐
                      │       ORCHESTRATOR AGENT      │
                      │  (Context lean: < 25k tokens) │
                      │  - Drives state machine       │
                      │  - Human approval gates       │
                      │  - Spawns & monitors workers  │
                      └───────┬──────────────┬────────┘
                              │              │
         ┌────────────────────┘              └────────────────────┐
         ▼                                                        ▼
┌─────────────────────────────────┐                    ┌─────────────────────────┐
│       STAGE & ASSET WORKERS     │                    │    REVIEWER SUBAGENT    │
│  (Ephemeral Isolated Contexts)  │                    │  (Independent Auditor)  │
│  - stage-worker: planning/edit  │                    │  - Audits disk artifact │
│  - asset-worker: audio/visuals  │                    │  - Checks standing rules│
│  - composer: Remotion/render    │                    │  - Reports findings     │
└─────────────────────────────────┘                    └─────────────────────────┘
```

---

## Core Operational Rules

### 1. Disk-as-State (Blackboard Communication)
- Agents communicate **exclusively via standardized files on disk**:
  - `projects/<id>/artifacts/<stage_artifact>.json`
  - `projects/<id>/checkpoint_<stage>.json`
  - `projects/<id>/assets/...`
- **Never** pass large JSON payloads, raw transcripts, or base64 data through conversational messages.
- Subagents write directly to disk; Orchestrator only reads schemas or compact summaries.

### 2. Strict Reporting Caps
- When a subagent completes, its final report to the Orchestrator MUST be **under 100 words**.
- Content of report: Stage name, artifact path, key metric (e.g. word count, scene count, asset count), and schema validation status (`valid: true`).

### 3. Splitting the `assets` Stage
The `assets` stage is the single largest source of context exhaustion. It MUST be split into independent workers:
- **Audio Worker (`asset-worker`)**: Runs TTS (`vieneu_tts` or cloud TTS), speech-to-text alignment (`faster-whisper`), and outputs `subtitles.srt` + audio WAVs.
- **Visuals Worker (`asset-worker`)**: Runs image generation (e.g. 9router `openai_image` or FLUX) and SVG generation in parallel.

### 4. Independent Reviewer Pattern
- Self-review is performed by spawning the `reviewer` subagent.
- The reviewer reads the disk artifact with fresh attention and validates constraints:
  - Narration order constraint (visuals appear in exact narration order)
  - Style playbook constraints (pacing, typography, palette)
  - Schema validity (`lib/checkpoint.py`)
- Returns a structured verdict: `PASS`, `PASS_WITH_WARNINGS`, or `BLOCK` with line references.

### 5. Orchestrator Keeps Human Approval Gates Binding
- When a stage has `human_approval_default: true` in the manifest:
  - Orchestrator inspects the canonical artifact summary.
  - Checkpoint is set to `awaiting_human`.
  - Orchestrator presents findings and **ends its turn** to wait for user approval.

---

## Subagent Dispatch Reference

### Dispatching a Stage Worker
```python
# Orchestrator calls:
Agent(
    description="Execute scene_plan stage",
    subagent_type="stage-worker",
    prompt="""
Execute the scene_plan stage for project 'projects/nguon-goc-dan-toc-v2/'.
1. Read input: projects/nguon-goc-dan-toc-v2/artifacts/script.json
2. Read stage director: skills/pipelines/explainer/scene_plan-director.md
3. Read style playbook: styles/ink-genome.yaml
4. Produce: projects/nguon-goc-dan-toc-v2/artifacts/scene_plan.json
5. Validate against schemas/artifacts/scene_plan.schema.json
6. Report under 100 words. Do not dump JSON.
"""
)
```

### Dispatching Parallel Asset Workers
```python
# Dispatch Audio Worker:
Agent(
    description="Generate TTS narration audio",
    subagent_type="asset-worker",
    prompt="""
Generate audio assets for projects/nguon-goc-dan-toc-v2/.
1. Read scene_plan: projects/nguon-goc-dan-toc-v2/artifacts/scene_plan.json
2. Run TTS via vieneu_tts to projects/nguon-goc-dan-toc-v2/assets/audio/
3. Align with faster-whisper to projects/nguon-goc-dan-toc-v2/assets/audio/transcripts/
4. Report count and duration under 50 words.
"""
)

# Dispatch Visuals Worker:
Agent(
    description="Generate scene images",
    subagent_type="asset-worker",
    prompt="""
Generate visual image assets for projects/nguon-goc-dan-toc-v2/.
1. Read scene_plan: projects/nguon-goc-dan-toc-v2/artifacts/scene_plan.json
2. Generate images to projects/nguon-goc-dan-toc-v2/assets/images/ via 9router gateway
3. Report count and paths under 50 words.
"""
)
```
