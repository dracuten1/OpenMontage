# Sprite Story Pipeline (v3)

Layered 2D sprite storytelling: deterministic generation contract → PIL
registration → Remotion manifest → two-gate verification (code first, vision
second) → bounded correction loop.

**Use when**: a production stages multiple characters/props as image sprites
over background plates (kids stories, dialogue scenes, narrative explainers).
Not for rig-based (COA Tools) or full-frame character-performer scenes —
those keep their own playbooks.

## Hard rules (all agents)

1. **Background first.** The L0 plate sets key light + palette. Extract a
   256×256 swatch (lit + shadow tone) and attach it as the visual reference
   to EVERY later sprite/prop generation. Text-only lighting vectors are
   weakly followed; the swatch is the real mechanism.
2. **Native transparency, not white-bg cutout.** Request
   `"background": "transparent"` on `cx/gpt-image-2.5-sunburst`. Verify with
   `tools/qc/sprite_register.py` — sprites below 40% transparent fail the
   alpha guard (only then fall back to cutout, re-verify ≥40%).
3. **Matched-pair variants only.** Generate canonical `m0` first; every
   mouth/pose variant is i2i FROM that exact m0 with a prompt-locked delta:
   `[Style Anchor] Using the provided sprite (m0) as an immutable template,
   ONLY change: <delta>. Keep identity, head position, body scale, feet
   placement, outfit folds, colors, lighting, framing 100% identical.`
   Drift gate: bbox drift ≤0.5% of canvas (`--variant-of`, exempt delta_w
   with `--allow-lateral-expansion` for arm-raise poses).
4. **Coordinates are viewport_space.** Backgrounds render `object-fit: cover`
   (e.g. 1672×941 → 1920×1080 crops the sides). Any anchor measured on the
   raw bg (horizon, gate, tree base) must be converted before it enters the
   manifest; staging anchors must sit in the 20–80% visible band.
   `sprite_gate.py` recomputes scale/offsets from
   `environment.background_cover` — never trust hand-computed values.
5. **No layer references an unregistered asset.** Everything measured by
   `sprite_register.py` into `registration.json` immediately after download.

## Model routing (9router, 127.0.0.1:20128)

| Task | Model | Notes |
|---|---|---|
| L0/L1 backgrounds, mood | `ag/gemini-3.1-flash-image` | Style-loose; ~14s–1MB; quota can exhaust (~35h reset) |
| bg fallback | `cx/gpt-5.6-luna-image` | Loose identity; 35–430s/image is normal, timeout 600s do NOT kill |
| m0 sprites, i2i variants, transparent | `cx/gpt-image-2.5-sunburst` | Identity-preserving; the ONLY native-transparent path |

9router i2i contract: reference goes in body field `image` = data URI,
downscale to ≤1024px (~300KB) before embedding; base64 in `prompt` is
silently treated as text. Endpoint sometimes returns plain JSON instead of
SSE — parse both. Sprites come back at arbitrary canvas sizes: never
hardcode geometry, always re-measure.

Prompt skeleton (every generation):
`[Style: <locked per production>] + subject/view + swatch instruction
("match the exact palette, ambient shading temperature, rim-light direction
and ink line weight in the attached swatch") + Universal negatives:
3D render, photorealistic, subsurface scattering, sketch lines, floor drop
shadows, lens flare, chromatic aberration, cropped feet, text, watermark.`

Canonical sprites are authored **facing right** (flip_x mirrors them).

## Pipeline steps

```
1. bg gen (style-loose model) -> register --type background
2. swatch crop (256x256, lit+shadow) -> reference for all sprite gens
3. m0 gen (transparent) -> register --type sprite
4. variants i2i from m0 (delta-locked) -> register --variant-of <m0>
5. write scene manifest (schema below) — positions viewport_space
6. GATE A: .venv/bin/python tools/qc/sprite_gate.py --manifest <m> --reg <reg>
   exit 1 = blocked: apply printed fixes (viewport_delta / flip_toggle /
   z_swap) to the manifest, re-run. Max 2 attempts per (layer, defect);
   oscillation (a fix reverting a previous fix) => stop, status
   needs_human_review, never auto-render.
7. GATE B (only after Gate A clean): Hermes renders one preview still
   (npx remotion still) and vision-checks ONLY perceptual rules:
   style harmonization, lighting match, in-asset defects, composition
   balance. Vision must not re-report geometry Gate A already verified.
   Style/light defect -> i2i re-shade (m0 + swatch, silhouette locked);
   in-asset defect -> regenerate m0 + variants; tangent -> bounded dx.
   Same loop bounds. WARNING passes with notes.
8. render (Remotion) — CC never Reads PNGs; image checks via PIL scripts.
```

## Manifest (v3) essentials — LEAN (single-source, no derived data)

Top-level: `manifest_version, scene_id, canvas{w,h,fps}, duration_seconds,
safe_margins, environment{key_light, color_temperature, background_cover{
asset_width, asset_height, camera_zoom}, ground_plane_y}, layers[],
verification_history[]`.
Sprite layer: `layer_id, z_index, type:"sprite", source, anchor:
"bottom-center", staging_asset_x, transform{x, y, scale, flip_x},
animation{enter, duration}`. Bubble: `type:"speech_bubble", target_actor,
transform{x,y,w,h} (top-left implied), content, timing{start,end}`.

**Single-source rules (redundancy removed 2026-10-16):**
- NO `asset_meta` block in the manifest — geometry lives ONLY in
  `registration.json`; the gate reads it via `--reg`.
- NO stored `effective_scale/offset_x/offset_y` — the gate recomputes them
  from `background_cover` inputs (asset size + camera_zoom).
- NO `ground_plane_asset_y` — convert at authoring time; the manifest is
  viewport_space only.
- NO threshold re-checks in Gate A (alpha/drift already enforced at
  registration; failing assets never enter registration.json) — A1 is a
  pure existence check.

Z tiers: L0 bg 0 · L1 scenery 10 · L2 mid_props 20 · L3 actors 30–39 ·
L4 fore_props 40 · L5 dialogue 50 · L6 post_fx 60. Overlapping actors:
closer to camera (larger feet-y) must have the higher z.

Gate A computes actor/head boxes itself (feet_y, center_x, head_box from
registration; flip mirrors around canvas center) — do not precompute.

Working example: see `tools/qc/sprite_gate.py` docstring + the
character-performer/kids dry-run (2026-10-16): registration drift 0.195% on
a real m0/mO pair; 4-defect manifest correctly blocked (staging band,
grounding, gaze flip, bubble∩head) with exact fixes.
