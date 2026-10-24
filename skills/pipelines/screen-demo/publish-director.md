# Publish Director - Screen Demo Pipeline

**REQUIRED owner delivery contract:** Read `/Users/tuyennguyen/.hermes/skills/media/video-producer/SKILL.md`, section **Mandatory thumbnail delivery contract (SSOT)**. Automatically generate and separately deliver a designed thumbnail PNG/JPG + video + copyable description for EVERY draft/final output, per clip/locale/target. Concepts, player posters, contact sheets and random frames do not count. Record thumbnail absolute paths, measured dimensions, QC and send status in the production report/handoff; failure = INCOMPLETE BUNDLE. Preserve approval gates and manual upload, no auto-post. This overrides any concept-only packaging guidance below.

## When To Use

Package the finished demo so the user can publish it quickly and so the metadata reflects the actual task, result, and tools involved.

## Prerequisites

| Layer | Resource | Purpose |
|-------|----------|---------|
| Schema | `schemas/artifacts/publish_log.schema.json` | Artifact validation |
| Prior artifacts | `state.artifacts["compose"]["render_report"]`, `state.artifacts["idea"]["brief"]`, `state.artifacts["script"]["script"]` | Video, brief, and sections |
| Playbook | Active style playbook | Thumbnail and copy tone |

## Process

### 1. Build Searchable Metadata

Screen-demo titles work best when they combine:

- task,
- tool,
- outcome.

Good patterns:

- `How to deploy on Vercel from Next.js`
- `Fix CORS in React + Express`
- `Set up GitHub Actions for Python tests`

Pull keywords from:

- software names,
- frameworks,
- commands,
- exact error text,
- outcome words such as `deploy`, `fix`, `connect`, `publish`, `ship`.

### 2. Use Chapter Markers As Navigation

Use script sections as the basis for chapter markers and packaging bullets. A good screen-demo package makes the workflow skimmable before the user even presses play.

### 3. Thumbnail Strategy

If a thumbnail concept is needed, it should show:

- the result state, not a generic setup screen,
- the recognizable tool surface,
- 2-4 words of value text.

Store the concept in `publish_log.metadata.thumbnail_concepts`.

### 4. Package By Platform

Prepare:

- video file,
- title and description/caption,
- chapter markers where relevant,
- keyword list,
- thumbnail concept notes.

For developer or product-demo content, also package:

- commands shown,
- software/version mentions,
- error terms if it is a troubleshooting demo.

### 5. Quality Gate

- metadata names the real tool and task,
- chapters match the actual rendered flow,
- export folders are clean and reusable,
- copy is tailored to the platform instead of duplicated.

## Common Pitfalls

- Publishing with generic titles that omit the actual software or task.
- Using the same caption for YouTube, LinkedIn, and short-form social.
- Building chapter markers from the script without checking the render.

---

## Gate Reminder (Binding)

This stage gates on human approval (`human_approval_default: true`). After review passes:
checkpoint with `status="awaiting_human"`, present the summary (the Backlot board renders
the artifact), and **END YOUR TURN**. Do not start the next stage in the same response.
Approval is per-gate — an earlier "go ahead" does not cover this gate.
