---
name: blender-explainer-animation
description: Author one-way animated 3D explainer scenes in Blender + BlenderKit with articulated character rigs, baked Geometry Nodes, shadow-optimized foliage, fast EEVEE rendering, 3D-to-2D screen_tracks.json callout export, and Remotion crossfade loop compositing. Use when creating explainer scenes that need physical motion, cutaways, rising data/relics, or living storytelling rather than static camera ping-pong clips.
---

# Blender + BlenderKit Animated Explainer Workflow

Use this skill whenever an explainer video benefits from real 3D physical motion, architectural cutaways, moving characters, progressive map arcs, or kinetic diorama storytelling rendered locally in Blender (`blender_explainer_kit.py` + `blenderkit_catalog`).

---

## 1. BlenderKit-First Asset Reuse Rule

Before building complex props, animals, trees, books, vessels, furniture, or studio equipment from primitives:

1. Search and cache free `.blend` assets using `blenderkit_catalog` (`operation: "search"` / `"download"`) or `download_blenderkit_model(...)` from `tools/graphics/templates/blender_explainer_kit.py`.
2. **Mandatory 1-Frame Vision Probe Gate**: Never approve an asset from API title/thumbnail alone. Run `blenderkit_catalog` (`operation: "probe"`, `output_path: "...jpg"`) and inspect the rendered preview with `read_file`. Reject models that are:
   - voxel/pixelated meshes, wrong-object matches (e.g., 55-gallon industrial drum returned for tribal drum), or whole-room backdrops masquerading as single props;
   - astronomically high polygon count (`> 100k` polys for small props). Re-query with `skip_ids=[assetBaseId]` up to 3 candidates; fall back to clean sculpted geometry if no candidate fits the cultural/historical domain.
3. Persist provenance (`slug`, `name`, `assetBaseId`, `query`, `local_file`, `size_bytes`, `sha256`) in `<project>/assets/blenderkit_assets/blenderkit_manifest.json`.
4. Normalize with `append_normalized_blend(...)`:
   - Use `target_height=...` for standing/upright assets (trees, jars, animals, axes) and `target_max_dim=...` for flat or shallow objects (open/closed books, cassette tapes, tabletop folios) so thin Z-thickness never blows up XY dimensions.
   - Automatically strips imported lights/cameras, hides Rigify `WGT-*` / `WGT_` / `CS_*` / `*Widget*` helper meshes before bounding-box computation, centers `XY=0`, and sets bottom `minZ=0`.

---

## 2. Geometry Nodes Bake & Alpha-Foliage Shadow Rules

- **Geometry Nodes Bake Rule (`bake_geonodes=True` default)**: BlenderKit foliage/scatter models (e.g., `stylized_tree`) often evaluate Geometry Nodes per frame in EEVEE, turning a `0.7s` render into `6–25s/frame`. Always bake `NODES` modifiers (realizing instances first via `GeometryNodeRealizeInstances`) once at append time via `append_normalized_blend(..., bake_geonodes=True)` or `instance_baked_blend(...)`.
- **Alpha-Foliage Shadow Rule (`disable_shadows=True`)**: Do **not** override lush green tree shaders with opaque procedural leaf materials just to gain speed — opaque shaders turn alpha-card leaf quads into spiky triangles. Instead, preserve the original PBR leaf alpha & brown bark textures and pass `disable_shadows=True` (sets `o.visible_shadow = False` on MESH children) + disable shadow casting on `LGT-Fill` / `LGT-Rim` lights. This cuts dense foliage EEVEE render times (`~26s/f` -> `~0.7s/f`) while keeping natural beauty intact.

---

## 3. One-Way Narrative Action vs Ping-Pong Camera Loops

Never ship hero explanatory scenes as static sculptures with a forward-backward ping-pong camera wobble (`[0 -> N] concat [reverse]`). Author a continuous **one-way 240-frame @ 24fps (`10.0s`)** timeline encoding causal explanation:

- **Articulated Characters (`create_articulated_actor`)**: Characters face `-Y` in local space (`R_z(rot_z)` faces `(sin(rot_z), -cos(rot_z))`), arms hang `-Z` (`-rot_x` swings forward), with `pelvis -> hipL/hipR, torso -> head/lidL/lidR, shoulderL/R`. Use `anim_walk()`, `anim_sit_talk()`, `anim_blink()`.
- **Visual Explainer Mechanics**:
  - Architectural cutaways (hinged roofs/walls lifting open, sliding extension bays)
  - Progressive NURBS paths (`bevel_factor_end: 0 -> 1`) led by a moving light comet
  - Staggered rising data/archive stacks & censorship seals lifting off documents
  - Pivoted physical collisions/strikes (`gong` swings + expanding acoustic torus waves; spark/dust puffs scaled on Empty pivots)
- **Remotion Crossfade Playback**: Encode renders cleanly one-way at 30fps via `encode_oneway_mp4(frames_dir, out_mp4, src_fps=24, out_fps=30)`. In Remotion, if scene duration `<= 420` frames, play single pass with `playbackRate = 300 / dur`; if `> 420` frames, stack `<Sequence>` passes at `playbackRate = 0.75` (`400f` cycle, `24f` opacity fade overlap, `376f` stride) instead of hard-cutting back to frame 0.

---

## 4. 3D-to-2D Screen Tracking Bridge (`screen_tracks.json`)

Export screen-space anchor coordinates alongside every `.blend` using `export_screen_tracks(scene, cam_obj, anchors, 1, 240, out_json)`. In Remotion:

- Map the active `CrossfadeLoopVideo` playback pass progress back to Blender frame `1..240` and dim opacity smoothly during crossfade overlaps (`computeTrackFrame`) so 3D-tracked callout badges never jump across cuts.
- Clamp overlaid badges inside safe screen bands (`x: 170..1750`, `y: 210..840` on `1920x1080`) and skip tracked badges on quote/diagram split slides so headers and subtitles stay unobstructed.

---

## 5. Blender 5.x & EEVEE Guardrails

1. **Primitive Scale Trap**: Primitive builders that store dimensions in `obj.scale` must **never** have `obj.scale` directly keyframed as `(1.0, 1.0, 1.0)`. Always parent the primitive to an Empty (`Pivot-...`) and keyframe `pivot.scale` (`0.001..1.0`) — or keyframe `hide_render` + scale `(0, 0, 0)` on beams/cones before their entrance frame so zero `0.001m` glowing needle appears prematurely.
2. **EEVEE Speed**: Call `setup_eevee_explainer(samples=12, frame_end=240, fps=24, use_raytracing=False)` (`0.6–1.4s/frame` at `1080p` on Apple Silicon).
3. **Blender 5.x Layered Actions**: Always set interpolation via `set_interp(owner)` which handles both legacy `action.fcurves` and Blender 5.x channelbag `anim_utils.action_get_channelbag_for_slot(...)`.
