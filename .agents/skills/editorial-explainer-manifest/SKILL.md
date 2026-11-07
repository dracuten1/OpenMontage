---
name: editorial-explainer-manifest
description: Generate a structured 2D editorial motion graphic and documentary explainer manifest (JSON) before generating assets or rendering video. Orchestrates OpenMontage and Remotion pipelines for news, facts, investigative journalism, and technical explainers (Vox, Johnny Harris, ColdFusion style) with archival web sourcing, T2I/I2I editorial collage harmonization, programmatic data visualizations, camera rigs, frame-accurate documentary sound design (SFX), and multimodal vision QA.
---
# Editorial Explainer Manifest (News, Facts & Documentary Motion Graphics)

Design deterministic, frame-accurate 2D editorial motion graphic manifests for news analysis, factual storytelling, investigative journalism, and deep-dive explainers (inspired by Vox, Johnny Harris, The Economist, and ColdFusion). This skill bridges LLM narrative/evidence planning, archival web sourcing, T2I/I2I documentary style unification, Remotion data/chart primitives, synchronized tactile sound design (SFX), and Vision LLM quality assurance.

## When to Use

- Planning or scripting an editorial explainer, news breakdown, factual documentary, or technical/economic analysis video
- Structuring JSON scene manifests for OpenMontage and Remotion with data charts, map pan/zooms, document highlights, and documentary SFX triggers
- Harmonizing mixed-media web assets (news clippings, historical photos, maps, SVG icons, institutional logos) via Image-to-Image (I2I) and Text-to-Image (T2I)
- Automating multimodal vision QA checks on static rest frames to prevent data/label collisions, unreadable contrast, or messy photo cutouts before rendering

## 1. Editorial & Documentary Visual Language

Avoid cartoon or childish aesthetics. Anchor all visual and motion decisions in authoritative investigative journalism:

- **Mixed-Media Archival Cutouts:** Source real public-domain photographs, press clippings, patent diagrams, and satellite maps from the web. Treat them with high-contrast monochrome halftone, duotone ink tints, or crisp paper-tear borders via I2I or Remotion shaders.
- **Tactile Investigation Desk & Blueprint Backplates (`t2i`):** Generate dark slate grids, microfiche textures, illuminated lightboxes, or subtle archival paper backplates—never cartoon scenery.
- **Programmatic Evidence Layers (`remotion_native`):** Render all financial/statistical charts, animated timelines, map route lines, redaction bars, and yellow highlighter sweeps natively in Remotion code so numbers and labels remain razor-sharp.
- **Editorial Sound Design (`sfx_cues`):** Pair visual reveals with restrained, tactile documentary audio: mechanical camera shutters, microfiche clicks, highlighter pen strokes, subtle low sub-bass drops, muted paper slides, and telemetry ticks.

## 2. Editorial Motion Scene Manifest Schema

Emit this structured JSON manifest before generating assets or executing Remotion renders:

> **CANVAS: two supported variants — 9:16 vertical (default) and 16:9 landscape.** 「Ký Chủ Điểm Tin」 default: 1080×1920 master / 720×1280 draft HUD (the example below uses vertical coordinates). For YouTube/YouTube Shorts-embed/DESKTOP explainer use, emit a separate 16:9 variant (see §5). 9:16 safe zones: content band **y 360–1440 @1080p (240–960 @720p)**, right rail reserved (x ≥ 940 @1080p / ≥ 625 @720p), subtitles low (y 1540–1750 @1080p), nothing critical at y ≥ 1440.

```json
{
  "project_id": "investigative_explainer_01",
  "canvas": { "width": 1080, "height": 1920, "fps": 30, "posterize_fps": 15, "aspect_variants": ["9x16", "16x9"] },
  "style_anchor": "Editorial documentary collage, high-contrast monochrome halftone print with selective crimson accent #D90429, archival newsprint grain, sharp cutout edges, serious journalistic aesthetic",
  "negative_prompt": "cartoon, childish, anime, cute, 3D Pixar render, glossy plastic, comic bubble, vibrant neon, blurry text, watermark",
  "global_overlays": [
    {
      "type": "texture_loop",
      "source": "web_free:fine_archival_dust_and_grid.mp4",
      "blend_mode": "screen",
      "opacity": 0.12,
      "z_index": 90
    }
  ],
  "scenes": [
    {
      "scene_id": "scene_evidence_01",
      "narrative_beat": "In 2024, global shipping choke points drove container rates up by 310% in six weeks.",
      "duration_frames": 180,
      "camera": {
        "action": "pan_and_push",
        "from": { "x": 540, "y": 960, "scale": 1.0 },
        "to": { "x": 520, "y": 900, "scale": 1.1 },
        "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "layers": [
        {
          "layer_id": "bg_slate_grid",
          "z_index": 0,
          "role": "background",
          "pipeline": {
            "method": "t2i",
            "prompt": "dark charcoal architectural blueprint grid background #12161F, subtle coordinate ticks, flat studio vignette, documentary style"
          },
          "transform": { "x": 540, "y": 960, "w": 1080, "h": 1920, "anchor": "center" },
          "motion": { "enter": { "type": "fade_in", "start_frame": 0, "duration_frames": 12 } }
        },
        {
          "layer_id": "archival_press_clipping",
          "z_index": 20,
          "role": "document_cutout",
          "pipeline": {
            "method": "web_plus_i2i",
            "web_query": "cargo ship Suez canal aerial photo Wikimedia public domain",
            "i2i_denoise": 0.42,
            "prompt": "high-contrast black and white halftone newspaper photograph of a container ship, rough torn paper border, isolated on solid #00FF00 background",
            "remove_bg": true,
            "drop_shadow": { "dx": 12, "dy": 14, "blur": 18, "color": "rgba(0,0,0,0.65)" }
          },
          "transform": { "x": 540, "y": 840, "scale": 0.8, "rotation": -2.5, "anchor": "center" },
          "motion": {
            "enter": {
              "type": "slide_and_settle",
              "from_offset": { "dx": -180, "dy": 40 },
              "start_frame": 8,
              "spring_config": { "damping": 18, "stiffness": 140, "mass": 1.0 }
            }
          }
        },
        {
          "layer_id": "highlighter_callout",
          "z_index": 35,
          "role": "evidence_annotation",
          "pipeline": { "method": "remotion_native", "component": "HighlighterStroke" },
          "style": { "color": "#FFBE0B", "opacity": 0.85, "blend_mode": "multiply" },
          "transform": { "x": 130, "y": 1120, "w": 560, "h": 56, "anchor": "left-center" },
          "motion": {
            "enter": {
              "type": "wipe_left_to_right",
              "start_frame": 32,
              "duration_frames": 14
            }
          }
        },
        {
          "layer_id": "rate_spike_chart",
          "z_index": 40,
          "role": "data_viz",
          "pipeline": { "method": "remotion_native", "component": "AnimatedLineChart" },
          "data": {
            "labels": ["W1", "W2", "W3", "W4", "W5", "W6"],
            "values": [100, 118, 165, 240, 350, 410],
            "unit": "%",
            "accent_color": "#D90429"
          },
          "transform": { "x": 540, "y": 1250, "w": 860, "h": 420, "anchor": "center" },
          "motion": {
            "anchor_phrase": "310%",
            "enter": {
              "type": "draw_svg_path",
              "start_frame": 24,
              "duration_frames": 45
            }
          }
        },
        {
          "layer_id": "fact_header",
          "z_index": 50,
          "role": "editorial_typography",
          "pipeline": { "method": "remotion_native", "component": "EditorialHeadline" },
          "text_content": "+310% FREIGHT SURGE",
          "subtext": "SOURCE: DREWRY WORLD CONTAINER INDEX (2024)",
          "style": {
            "font_family": "JetBrains Mono",
            "font_size": 58,
            "color": "#F8F9FA",
            "tag_bg": "#D90429"
          },
          "transform": { "x": 540, "y": 500, "w": 900, "h": 150, "anchor": "center" },
          "motion": {
            "enter": {
              "type": "typewriter_reveal",
              "start_frame": 16,
              "duration_frames": 24
            }
          }
        }
      ],
      "sfx_cues": [
        {
          "sfx_id": "sfx_doc_slide",
          "trigger_frame": 8,
          "linked_layer": "archival_press_clipping",
          "query": "heavy archival cardstock paper slide on desk",
          "volume_db": -7.0
        },
        {
          "sfx_id": "sfx_data_telemetry",
          "trigger_frame": 16,
          "linked_layer": "fact_header",
          "query": "subtle mechanical data ticker click",
          "volume_db": -11.0
        },
        {
          "sfx_id": "sfx_marker_stroke",
          "trigger_frame": 32,
          "linked_layer": "highlighter_callout",
          "query": "felt tip highlighter marker swipe on paper",
          "volume_db": -6.5
        }
      ]
    }
  ]
}
```

## 3. Execution Pipeline Steps

### Step 1: Evidence & Script Decomposition (LLM)

1. Break the factual script or news narrative into 4-to-7-second evidence beats (`120` to `210` frames at 30fps).
2. Classify each visual asset into one of three specialized pipelines:
   - `t2i` (**Atmosphere & Backplates**): Dark tactical maps, blueprint grids, corkboards, microfiche frames, or subtle textured gradients.
   - `web_plus_i2i` (**Archival Cutouts & Real-World Evidence**): Fetch public-domain photos, historical portraits, hardware photos, or geographic SVGs from Wikimedia Commons, Unsplash, or SVGRepo. Pass them through `i2i` (`denoise: 0.35 - 0.50`) using the `style_anchor` to unify diverse web photos into a cohesive editorial print look (e.g., halftone monochrome or duotone).
   - `remotion_native` (**Data, Maps, & Typography**): All bar/line charts, percentage counters, source citations, redaction bars, and highlighter strokes. Never use T2I to render numbers, charts, or article text.

### Step 2: Documentary Motion & Camera Rigging

1. **Damped Editorial Physics:** Avoid bouncy cartoon springs (`damping < 10`). Use high-damping, crisp deceleration (`damping: 16 - 24`, `stiffness: 120 - 160`) or `cubic-bezier(0.22, 1, 0.36, 1)` so documents and charts snap into place with journalistic authority.
2. **2.5D Camera Push & Pan:** Always apply a continuous, slow camera drift (`scale: 1.0 -> 1.10`) or targeted pan across evidence layers in Remotion, separating background grids (`z_index: 0`), photo cutouts (`z_index: 20`), and foreground charts (`z_index: 40`) via parallax multiplier.
3. **Posterized Cutout Cadence:** Keep the global camera and typography at a smooth `30` or `60` fps, while applying `posterize_fps: 12` or `15` selectively to paper cutout slides and stop-motion collage layers for a tactile Vox-style contrast.

### Step 3: Peak-Frame Vision Model QA Loop

Render a static composite PNG at the scene's **Information Rest Frame** (the exact frame where all charts, text, and cutouts finish entering) and audit with the Vision LLM:

1. **Data & Citation Legibility:** Are all chart axes, numbers, and `SOURCE:` citations completely unobstructed and readable against the background?
2. **Highlighter & Callout Alignment:** Does any `evidence_annotation` (highlighter, circle, arrow) accurately land on its target region without obscuring critical facial features or primary headlines?
3. **Cutout Edge Quality:** Do `document_cutout` layers have clean alpha borders or intentional paper-tear edges without unintended green/white chroma artifacts?
4. **Editorial Tone Check:** Did T2I/I2I accidentally introduce cartoonish proportions or saturated comic styling?

If the Vision LLM flags a defect, patch the `transform` coordinates in the JSON manifest or re-run `i2i` with lower denoise (`0.30 - 0.40`) to preserve archival photo realism.

## 4. OpenMontage Pipeline Integration (MANDATORY)

This skill is a DESIGN layer on top of the OM pipeline — it never replaces the pipeline (owner rule 11-07: "luôn làm theo pipeline").

1. **Speech-locked triggers (non-negotiable).** `trigger_frame` / `start_frame` values in the manifest are PLACEHOLDERS until audio exists. Every layer motion and SFX cue must be re-derived from per-word timestamps (`words.json` / `scene_elements.json`) after TTS alignment — spoken word ±0.3s, never hand-estimated. Anchor ITEM blocks by the item's NAME word (narration says the name before the value); anchor NUMBER blocks (bars/tiles carrying the number) by the number word. Re-ASR after ANY TTS regeneration and rebuild the manifest timings; guard |wav duration − audio_seconds| ≤ 0.3s before compose.
2. **Exclusive speech-locked highlight (owner 11-03).** Sequential evidence layers/charts/rows use active (opacity 1 + glow) / settled (0.50–0.55, no glow) / ghost (0.15, no border, no glow) states keyed to cue windows. After the last element's cue +10–15f, all settle to full opacity. Verify with PIL mean-luminance crops, not vision alone.
3. **Rights gate for `web_plus_i2i` assets.** Check each source file's license individually (Wikimedia per-file, Unsplash, SVGRepo) and record: source URL, author, license, date fetched. On-screen attribution badge for real photos (`Ảnh: <nguồn>`). I2I stylization does NOT grant underlying rights — unresolved assets block publication (see RIGHTS_AUDIT convention) but may be used in private drafts.
4. **Pipeline stage hook.** The manifest is the `scene_plan` stage artifact: save as `projects/<id>/scene_manifest.json`, register it in `checkpoint_scene_plan.json` (with `pipeline_type`, e.g. `animated-explainer`) so the Backlot board reflects the episode. No production outside the board; renders land in `projects/<id>/renders/` (Backlot scans that folder flat — no nested revision dirs).
5. **SFX sourcing.** Prefer the repo library first: `music_library/sfx/` and `remotion-composer/public/sfx/` (11 curated cinematic files). Only fetch new SFX via `tools/sfx-source/` (CC0/Freesound) with license + source recorded in the manifest. Keep cues at −6 to −14 dB.
6. **CC worker discovery.** The skill lives in `.agents/skills/editorial-explainer-manifest` with a symlink at `.claude/skills/editorial-explainer-manifest` — if either moves, re-create the symlink or Claude Code workers won't discover it.

## 5. Aspect Variants: 9:16 + 16:9 (owner 11-07 — "để 2 version riêng, tùy thời sử dụng")

Both aspect ratios are first-class outputs, rendered SEPARATELY per episode — owner picks which to publish where (TikTok 9:16, YouTube 16:9). NEVER crop/scale one from the other — layouts are re-composed.

**Convention:**
- One manifest file per variant, sharing narration/cues/data: `scene_manifest.9x16.json` + `scene_manifest.16x9.json`. Only `canvas`, per-layer `transform`, and safe-zone constraints differ. Speech-lock anchors are IDENTICAL (same WAVs, same words.json) — do not re-align per variant.
- Renders: `renders/<slug>-9x16-<version>.mp4` and `renders/<slug>-16x9-<version>.mp4`; both land in `projects/<id>/renders/`.
- 16:9 canvas: 1920×1080 (draft 1280×720 HUD). Title-safe margins ≥5% each edge (x ≥ 96, y ≥ 54); no right-rail reservation; subtitles bottom (y ≥ 940) centered max-width 1600.
- Layout mapping for the same scene (example scene):
  - 9:16 stack (vertical): header y500 → cutout y840 → highlighter y1120 → chart y1250.
  - 16:9 split (horizontal): headline top-left (x 520, y 240, w 720), cutout left (x 520, y 560), highlighter under cutout (x 520, y 760, w 420), chart right (x 1360, y 580, w 720, h 460).
- Which variants to produce: default BOTH when budget allows; 9:16-only when the brief targets TikTok only. State the chosen variants in the manifest (`"aspect_variants": ["9x16", "16x9"]`) and in checkpoint_scene_plan.

## Gotchas

- **Never use bouncy springs for serious news:** Under-damped springs look playful and undermine factual credibility. Always use critical damping (`damping >= 16`) or exponential easing outs.
- **Never generate charts or maps with T2I:** Diffusion models hallucinate borders and corrupt data proportions. Source accurate SVG maps from Wikimedia/SimpleMaps and render charts programmatically in Remotion.
- **Keep SFX subtle and tactile:** Avoid loud cartoon boings or exaggerated swooshes. Use low-decibel (`-6dB` to `-14dB`) mechanical shutters, paper slides, muted bass pulses, and data ticks locked to `trigger_frame`.
