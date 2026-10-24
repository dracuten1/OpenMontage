# Publish Director - Clip Factory Pipeline

**REQUIRED owner delivery contract:** Read `/Users/tuyennguyen/.hermes/skills/media/video-producer/SKILL.md`, section **Mandatory thumbnail delivery contract (SSOT)**. Automatically generate and separately deliver a designed thumbnail PNG/JPG + video + copyable description for EVERY draft/final output, per clip/locale/target. Concepts, player posters, contact sheets and random frames do not count. Record thumbnail absolute paths, measured dimensions, QC and send status in the production report/handoff; failure = INCOMPLETE BUNDLE. Preserve approval gates and manual upload, no auto-post. This overrides any concept-only packaging guidance below.

## When To Use

This stage packages the clip batch into a distribution plan. The goal is not just exported files. The goal is a usable content engine.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/publish_log.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["compose"]["render_report"]`, `state.artifacts["idea"]["brief"]`, `state.artifacts["script"]["script"]` | Outputs, rankings, and goals |
| Playbook | Active style playbook | Brand voice |

## Process

### 1. Lead With The Strongest Clip

Do not schedule by chronology. Schedule by ranking.

The first published clip should usually be:

- the strongest hook,
- the cleanest standalone clip,
- the clip most aligned with the batch goal.

### 2. Tailor Copy By Platform

Each platform needs its own tone and packaging:

- TikTok / Reels: direct, fast, hook-led
- Shorts: searchable, keyword-aware
- LinkedIn: insight-led and more professional
- X: short, punchy, opinion-friendly

### 3. Package The Batch Cleanly

Group by platform and include ready-to-paste text assets, not just video files.

### 4. Preserve Batch Truth

Store in `publish_log.metadata`:

- `clip_catalog`
- `posting_order`
- `platform_copy_map`
- `schedule_notes`

### 5. Quality Gate

- strongest clips lead the rollout,
- captions are platform-specific,
- export folders are usable without extra cleanup,
- the batch catalog clearly links ranking, file paths, and publishing intent.

## Common Pitfalls

- Publishing the whole batch on the same day.
- Using one caption everywhere.
- Losing the rank/order logic after rendering is complete.

---

## Gate Reminder (Binding)

This stage gates on human approval (`human_approval_default: true`). After review passes:
checkpoint with `status="awaiting_human"`, present the summary (the Backlot board renders
the artifact), and **END YOUR TURN**. Do not start the next stage in the same response.
Approval is per-gate — an earlier "go ahead" does not cover this gate.
