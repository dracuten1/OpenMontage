# Publish Director - Avatar Spokesperson Pipeline

**REQUIRED owner delivery contract:** Read `/Users/tuyennguyen/.hermes/skills/media/video-producer/SKILL.md`, section **Mandatory thumbnail delivery contract (SSOT)**. Automatically generate and separately deliver a designed thumbnail PNG/JPG + video + copyable description for EVERY draft/final output, per clip/locale/target. Concepts, player posters, contact sheets and random frames do not count. Record thumbnail absolute paths, measured dimensions, QC and send status in the production report/handoff; failure = INCOMPLETE BUNDLE. Preserve approval gates and manual upload, no auto-post. This overrides any concept-only packaging guidance below.

## When To Use

Package the finished spokesperson outputs for delivery. This stage should make it obvious which file is the hero cut, which are derivatives, and what message or audience each version serves.

## Process

### 1. Label Deliverables Clearly

Distinguish:

- hero cut,
- vertical cutdown,
- square cutdown,
- language variants,
- watermark or review versions.

### 2. Keep Metadata Message-Led

Recommended metadata keys:

- `audience_segment`
- `cta_copy`
- `offer_name`
- `locale`
- `thumbnail_concept`

### 3. Package Review Notes

If the avatar path has limitations such as visible lip-sync risk, retain that note in the package instead of hiding it.

### 4. Quality Gate

- exports are clearly named,
- metadata matches the intended message,
- poster frame or thumbnail concept features the presenter cleanly,
- review notes stay attached to the package.

## Common Pitfalls

- Mixing hero and derivative exports without clear naming.
- Reusing generic metadata that ignores the spokesperson offer.
- Dropping risk notes that matter for downstream publishing teams.

---

## Gate Reminder (Binding)

This stage gates on human approval (`human_approval_default: true`). After review passes:
checkpoint with `status="awaiting_human"`, present the summary (the Backlot board renders
the artifact), and **END YOUR TURN**. Do not start the next stage in the same response.
Approval is per-gate — an earlier "go ahead" does not cover this gate.
