# Publish Director - Character Animation Pipeline

**REQUIRED owner delivery contract:** Read `/Users/tuyennguyen/.hermes/skills/media/video-producer/SKILL.md`, section **Thumbnail-as-Scene-1 Contract (SSOT)**. Thumbnail KHÔNG gửi file riêng nữa, mà được thiết kế trực tiếp làm Scene 1 (Thumbnail Card + Hook) của video (frame đầu t=0 làm poster cover, kèm lời đọc hook), sau đó mới tới nội dung chi tiết. Gói bàn giao chỉ gồm: Video (draft HUD / final sạch) + Copyable description (không gửi thumbnail riêng). Preserve approval gates and manual upload, no auto-post.

## Goal

Package the final character-animation deliverable with honest metadata and a
strong character-forward thumbnail concept.

## Requirements

- Mention the actual visual treatment: local rigged character animation,
  procedural effects, Remotion/HyperFrames render, or mixed.
- Pick a poster frame where the main character's emotion is readable.
- If the output is a sample, label it as a sample.
- If the final is inspired by a reference, describe the inspiration without
  claiming duplication.

## Output

Produce `publish_log` with:

- final video path,
- thumbnail/poster-frame notes,
- title ideas,
- description,
- platform-specific export notes,
- limitations or follow-up recommendations.

---

## Gate Reminder (Binding)

This stage gates on human approval (`human_approval_default: true`). After review passes:
checkpoint with `status="awaiting_human"`, present the summary (the Backlot board renders
the artifact), and **END YOUR TURN**. Do not start the next stage in the same response.
Approval is per-gate — an earlier "go ahead" does not cover this gate.
