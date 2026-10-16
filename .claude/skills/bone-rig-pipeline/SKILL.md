---
name: bone-rig-pipeline
description: Use when rebuilding or creating kids-story character motion via Blender+COA Tools 2 bone rigs from approved AI-art sprite layers, rendering PNG frame sequences, or compositing them into Remotion episodes. Encodes the FIX5 rules and points to verified SSOT scripts.
---

# Bone-rig pipeline (kids-story motion layer)

You are the **implementation worker**. Hermes/video-agent orchestrates and QCs;
all rig/Blender/render/compose code is written and run HERE by you. Never wait
for the orchestrator to hand-write implementation code — that was the 2026-10-13
failure mode ("faster deterministic" self-coding by the orchestrator).

## Environment (verified on this machine)
- Blender 5.2.2 wrapper: `~/.local/bin/blender` (headless: `~/.local/bin/blender -b -P script.py`).
- COA Tools 2 addon id: `coa_tools2` (enable via `addon_utils.enable('coa_tools2')`; diag pattern in `rig_demo/cc/fix_probe2.py`).
- Repo root: `~/project/OpenMontage`. Source sprites: `character-performer/kids/assets/ep1_ai/`.
- **SSOT scripts — reuse/adapt, do NOT re-derive** (in `character-performer/kids/rig_demo/cc/`):
  - `rig_build.py` — COA sprite import + armature (`bpy.ops.coa_tools2.create_sprite_object`, `import_sprite`)
  - `rig_animate.py` — bone animation: run cycle 8–12 fps, squash-stretch, ear follow-through
  - `fix5_patches.py` / `fix5_render_frames.py` / `fix5_verify.py` — mouth/blink patches, frame render, verification
  - `composite.py` / `render_composite.py` / `fix_camera_zoom.py` — OM composite + camera-rule enforcement
  - `clean_parts.py` — occlusion repair after layer split
- **Turtle layer-split is DONE — never redo**: `rig_turtle/` (7 layers: head / shell+rim / 4 legs / tail + mouth patch 3481 px + PIL blink lids) via palette+EDT **pure Python, no i2i** — keeps original pixels so identity matches the approved Ep.01 look. Report: `rig_turtle/REPORT_SPLIT_TURTLE.md` (also lists 4 paid-for bugs: `fill_holes` eating the whole sprite, brown rim linking iris→dome, etc.).
- Rendered frames already on disk: Thỏ 216 (`rig_demo/out/frames`), Rùa 248 (`rig_turtle/out/frames_t`). **CHECK DISK BEFORE regenerating anything.**

## Method (FIX5 — each rule paid for with a dead session)
1. **Pixel preservation**: split parts from ONE base image; verify by reassembling — diff must be feather-edge only (turtle reference: 0.44%). Matched-pair i2i ("SAME pose/scale/position, ONLY mouth opens") ONLY when color separation is impossible (rabbit fur); drift ≤0.5%, localized to the target region.
2. **Never Read .png** with the Read tool. Verify images ONLY via PIL scripts (alpha-bbox, frame-diff, region probes).
3. **Camera rule**: absolute static camera within a shot — constant scale, no push/Ken Burns/reframe; sprite-height % of frame changes ≤7pt and only at hard cuts.
4. **Mouth**: patch fade ≤70 ms on the mouth region only — never crossfade the whole sprite. Run/walk = hard swap 150/267 ms.
5. **Render**: PNG alpha (film transparent) headless; composite in Remotion as a sprite stack over the approved backgrounds; probe stills MID-cue for QC.
6. **Session discipline**: ≤25 turns; write long JSON in ~25–35 line chunks per tool call (stream truncation kills sessions); write `REPORT_<task>.md` incrementally — a session can die any moment and files on disk are the only state. Before respawning, check disk for the target file (session may have finished writing it).
7. **Handoff** = report paths + measured numbers. The orchestrator runs vision QC; the owner holds aesthetic veto (QC pass ≠ done).

## Numbers every report must contain
- assembly/reassembly diff %, mouth patch px + drift %, frame counts, render exit codes, per-phase durations, stills probed, scale-constancy check per shot.
