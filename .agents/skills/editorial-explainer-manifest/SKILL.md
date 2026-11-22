---
name: editorial-explainer-manifest
description: Generate a structured 2D editorial motion graphic and documentary explainer manifest (JSON) before generating assets or rendering video. Orchestrates OpenMontage and Remotion pipelines for news, facts, investigative journalism, and technical explainers (Warm Archival Print / Vox / Economist style) with archival web sourcing, T2I/I2I editorial collage harmonization, programmatic data visualizations, camera rigs, frame-accurate documentary sound design (SFX), and multimodal vision QA.
---
# Editorial Explainer Manifest (News, Facts & Documentary Motion Graphics)

Design deterministic, frame-accurate 2D editorial motion graphic manifests for news analysis, factual storytelling, investigative journalism, and deep-dive explainers in the **Warm Archival Print / Editorial Broadsheet** personal visual style (`styles/archival-editorial.yaml`). This skill bridges LLM narrative/evidence planning, Research v2 closed fact-whitelisting, archival web sourcing, T2I/I2I print collage unification, optional matte Blender 3D illustration, Remotion data/chart/map primitives, synchronized tactile sound design (SFX), and Vision QA inside Antigravity / `agy` CLI.

## When to Use

- Planning or scripting an editorial explainer, news breakdown, factual documentary, or economic/policy analysis video
- Structuring JSON scene manifests for OpenMontage and Remotion with data charts, map pan/zooms, document highlights, and documentary SFX triggers
- Harmonizing mixed-media web assets (press clippings, archival photos, satellite maps, SVG icons) into a cohesive Warm Archival Print collage
- Enforcing Research v2 closed fact-whitelisting and Antigravity Vision QA checks before rendering

## 1. Personal Visual Language — Broadcast Photojournalism × Swiss Split (Anti-AI)

Reject sepia HTML Card-itis (`1px solid` boxes stacked on `#F4EFE6`), `JetBrains Mono` middot tags, floating subtitle toast rectangles, dark-mode SaaS neon glows, and plastic 3D aesthetics. Anchor every visual and motion decision in **Broadcast Photojournalism × Swiss Edge-to-Edge Split**:

- **Dual Ground & Film Grain Foundation:** Swiss Gallery stage (`#F5F5F2`) framed by full-bleed Broadcast Carbon (`#0B0C0E`) masthead and cinema lower-third bands (or `layoutMode="full-bleed"` photojournalism with multi-stop cinema scrim), Signal Red (`#E11D2E`), Signal Yellow (`#FFD100`), Signal Orange (`#FF5500`), real 12fps 35mm film grain (`textures/film_grain_1..3.png`), and borderless Economist/FT charts + dark tactical `EditorialMap`.
- **Typography:** `Barlow Condensed` (900 Black) for display headlines, kickers, and tabular metrics; `Plus Jakarta Sans` + `Be Vietnam Pro` for body and borderless kinetic subtitles (all loaded with Vietnamese subsets via `ensureFonts()`).
- **Mixed-Media Archival Cutouts & Full-Bleed Photos:** Source real public-domain photographs, press clippings, patent diagrams, and satellite photos. Unify them via `web_plus_i2i` treatments or straight full-impact `ArchivalSpotlight` frames (`rotateDeg={0}`) with flush dark-carbon caption decks and mandatory attribution badges (`ẢNH TƯ LIỆU <year>` + credit).
- **Programmatic Evidence Layers (`remotion_native`):** Render all statistical charts (`EditorialBarChart`, `EditorialLineChart`), geographic maps (`EditorialMap`), causal timelines (`FlowTimeline`), side-by-side comparisons (`ComparisonSplit`), and signal highlighter sweeps natively in Remotion code so numbers and Vietnamese diacritics stay razor-sharp.
- **Tactile Documentary Sound Design (`sfx_cues`):** Pair visual reveals with restrained, physical documentary audio: camera shutters, crisp transitions, felt-tip marker swipes, and telemetry clicks (`-6 dB` to `-14 dB`).

## 2. Hook-First Storytelling & Anti-AI Voice Rules

- **t=0 Cover Hook (Thumbnail-as-Scene-1):** Frame `0` of Scene 1 IS the cover poster. Open immediately with stakes/contrast (`HeroTitle` 2–5 punchy words + physical `#F3D34A` marker highlight + concrete map/chart/evidence visual). **Never** place `<BrandBumper />` at `from={0}`; brand bumpers belong strictly at the **outro** after the final scene.
- **Conversational Human Cadence (Vietnamese):** Write short spoken sentences (`≤18 words/sentence`, `≤3 numbers/sentence`). Ban generic AI phrasing (`"Trong bối cảnh hiện nay…"`, `"Hãy cùng tìm hiểu…"`, `"Tóm lại là…"`). Every episode includes an explicit editorial **`NHẬN ĐỊNH`** POV beat separating facts from analysis.
- **Research v2 Grounding (`research/research_brief.md` + `artifacts/fact_whitelist.json`):** Every event carries a stable ID (`EV-1..EV-n`), a 5-angle matrix (`macro-policy`, `personal-money`, `mechanism-cause`, `timeline`, `affected-people`), evidence-tagged hook candidates scored `0–5` minus `fragility_penalty`, and a single closed **Fact Whitelist Table** (`fact_id | display_string | type | source | verification | allowed_scenes | narration_form`). Any printed number outside the whitelist is blocked by `tools/qc/fact_whitelist_gate.py`.

## 3. Editorial Motion Scene Manifest Schema

Emit this structured JSON manifest (`scene_manifest.json` / `scene_manifest.9x16.json` + `scene_manifest.16x9.json`) before authoring scenes:

> **CANVAS: two supported variants — 9:16 vertical (default) and 16:9 landscape.** Default: 1080×1920 master. For YouTube/desktop explainers, emit a separate 16:9 variant (see §6). 9:16 Safe Zone v3.2 (`remotion-composer/src/components/news/theme.ts`): top kicker `y ≥ 250`, content band **y 350–1420 @1080p**, right rail reserved (`x ≥ 940 @1080p`, `left=90, maxW=850`), subtitles low (**y 1480–1600 @1080p**), keep core cards/charts/CTA out of right rail and bottom dead-zone.

```json
{
  "project_id": "investigative_explainer_01",
  "style_playbook": "archival-editorial",
  "lane": "news-editorial-motion",
  "canvas": { "width": 1080, "height": 1920, "fps": 30, "posterize_fps": 15, "aspect_variants": ["9x16", "16x9"] },
  "style_anchor": "Warm archival print editorial collage on matte ivory newsprint paper #F4EFE6, charcoal ink #141413, selective vermilion #C8281E and ochre #A87308 accents, physical felt-pen highlighter #F3D34A, subtle archival grain, crisp broadsheet rules",
  "negative_prompt": "dark neon, cyberpunk, cartoon, childish, anime, cute, 3D Pixar render, glossy plastic, glowing gradient, blurry text, watermark",
  "speech_lock_contract": "Every trigger_frame/start_frame in this manifest is a DESIGN PLACEHOLDER; real values are re-derived from scene_elements.json frames.* (from words.json per-word ASR, spoken word ±0.3s). Anchor NUMBER blocks (bars/tiles carrying the number) by the number word; anchor ITEM/label blocks by the item's NAME word. Exclusive highlight states: active (opacity 1.0 + solid border) / settled (0.50-0.55) / ghost (0.15, no border); after the last anchor + 12f every element settles to full opacity.",
  "camera_rig": {
    "action": "continuous slow drift",
    "scale": "1.0 -> 1.08 across each scene",
    "easing": "cubic-bezier(0.22, 1, 0.36, 1)",
    "parallax": { "bg_z0_multiplier": 1.0, "cutout_z20_multiplier": 1.04, "data_z40_multiplier": 1.08 }
  },
  "physics": { "spring_damping": "18-22", "stiffness": "130-150", "rule": "No bouncy springs (damping < 16 forbidden); pop-in translateY goes +N -> 0" },
  "global_overlays": [
    {
      "type": "paper_grain",
      "source": "remotion_native (feTurbulence archival grain)",
      "opacity": 0.045,
      "z_index": 90
    },
    {
      "type": "vignette",
      "source": "remotion_native (warm ivory edge radial gradient)",
      "opacity": 0.25,
      "z_index": 89
    }
  ],
  "scenes": [
    {
      "scene_id": "S01",
      "narrative_beat": "Giá cước container tăng vọt 310% chỉ trong sáu tuần vì nút thắt vận tải biển.",
      "duration_frames": 180,
      "camera": {
        "action": "pan_and_push",
        "from": { "x": 540, "y": 960, "scale": 1.0 },
        "to": { "x": 528, "y": 930, "scale": 1.08 },
        "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "layers": [
        {
          "layer_id": "bg_archival_paper",
          "z_index": 0,
          "role": "background",
          "pipeline": { "method": "remotion_native", "component": "ArchivalPaperBackdrop" },
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
            "i2i_denoise": 0.40,
            "prompt": "high-contrast monochrome halftone newspaper photograph of a container ship on warm paper #F4EFE6, rough torn paper edge, isolated on solid #00FF00 background",
            "remove_bg": true
          },
          "transform": { "x": 540, "y": 840, "scale": 0.8, "rotation": -1.5, "anchor": "center" },
          "motion": {
            "enter": {
              "type": "slide_and_settle",
              "from_offset": { "dx": -140, "dy": 30 },
              "start_frame": 8,
              "spring_config": { "damping": 20, "stiffness": 140, "mass": 1.0 }
            }
          }
        },
        {
          "layer_id": "highlighter_callout",
          "z_index": 35,
          "role": "evidence_annotation",
          "pipeline": { "method": "remotion_native", "component": "HighlightBar" },
          "style": { "color": "#F3D34A", "opacity": 0.85 },
          "transform": { "x": 130, "y": 1120, "w": 560, "h": 56, "anchor": "left-center" },
          "motion": {
            "enter": { "type": "wipe_left_to_right", "start_frame": 32, "duration_frames": 14 }
          }
        },
        {
          "layer_id": "rate_spike_chart",
          "z_index": 40,
          "role": "data_viz",
          "pipeline": { "method": "remotion_native", "component": "EditorialLineChart" },
          "data": {
            "labels": ["T1", "T2", "T3", "T4", "T5", "T6"],
            "values": [100, 118, 165, 240, 350, 410],
            "unit": "%",
            "accent_color": "#C8281E"
          },
          "transform": { "x": 540, "y": 1250, "w": 850, "h": 420, "anchor": "center" },
          "motion": {
            "anchor_phrase": "310%",
            "enter": { "type": "draw_svg_path", "start_frame": 24, "duration_frames": 45 }
          }
        },
        {
          "layer_id": "fact_header",
          "z_index": 50,
          "role": "editorial_typography",
          "pipeline": { "method": "remotion_native", "component": "HeroTitle" },
          "text_content": "CƯỚC TÀU TĂNG 310%",
          "subtext": "NGUỒN: DREWRY WORLD CONTAINER INDEX (2024)",
          "style": { "font_family": "Source Serif 4", "font_size": 68, "color": "#141413" },
          "transform": { "x": 540, "y": 500, "w": 850, "h": 150, "anchor": "center" },
          "motion": {
            "enter": { "type": "fade_in", "start_frame": 0, "duration_frames": 10 }
          }
        }
      ],
      "sfx_cues": [
        {
          "sfx_id": "sfx_doc_slide",
          "trigger_frame": 8,
          "linked_layer": "archival_press_clipping",
          "query": "heavy archival cardstock paper slide on desk",
          "volume_db": -8.0
        },
        {
          "sfx_id": "sfx_marker_stroke",
          "trigger_frame": 32,
          "linked_layer": "highlighter_callout",
          "query": "felt tip highlighter marker swipe on paper",
          "volume_db": -7.0
        }
      ]
    }
  ]
}
```

## 3b. Required Layer Language (Gate-Enforced)

The news-editorial-motion lane enforces a mandatory layer grammar via `tools/qc/editorial_language_gate.py`. BLOCKED ⇒ cannot compose.

**Activation (`detect_editorial_lane()` in `tools/qc/editorial_language_gate.py`):** auto-applies when ANY of these holds — (1) `scene_manifest.json` declares `style_playbook == "editorial-explainer-manifest"` or `lane == "news-editorial-motion"`; (2) `project.json` declares `style_playbook == "editorial-explainer-manifest"` AND `pipeline_type == "animated-explainer"`. Projects declaring NO editorial key are audited explicitly with `--force-editorial`.

- **Every content (non-closing) scene requires ≥1 GENUINE graphic-native layer:**
  - `document_cutout` — via `t2i_chroma_key` or `web_plus_i2i` + `remove_bg: true`;
  - `data_viz` — via `remotion_native` chart/map/timeline components;
  - `evidence_annotation` — via `remotion_native` highlighter/chip.
- **Photo-frame dominance (gate R3):** ANY `hero`-role layer is blocked regardless of method; and any raster photo layer (`t2i`, `i2i`, `web_plus_i2i`, etc., or photoreal prompt) covering `≥ 0.85` of the canvas is blocked regardless of role. Photos below 0.85 are permitted as muted backplate textures (`opacity <= 0.35`) or cutout subjects.
- **Closing/CTA scene budget:** at most ONE scene (the LAST scene) is exempt when its non-empty layer-role set is a subset of `{background, background_texture, editorial_typography, attribution}` and includes `editorial_typography`.
- **Zero unresolved `anchor:` placeholders:** every frame-valued leaf must resolve to a concrete integer frame before compose.

## 4. Execution & Shared Kit Surface

1. **Canonical Shared Kit (`remotion-composer/src/components/`):** import and compose directly instead of duplicating shells per episode:
   - News foundation (`remotion-composer/src/components/news/{theme,SceneShell,BrandBumper}`): Broadcast Photojournalism × Swiss Split tokens (`COLORS`, `FONTS`, `SAFE`, `SAFE_16X9`, `MOTION`), `ArchivalPaperBackdrop`, `SceneShell`, `HeroTitle`, `CaptionLayer`, `SourceBadge`, `AiBadge`, `SimulationBadge`, `ArchiveLabelBadge`, `PhotoCreditBadge`, `VerdictStamp`, `HighlightBar`, `CtaBand`, and outro `<BrandBumper />` (`BRAND_BUMPER_FRAMES = 90`, placed at the END of the episode).
   - Editorial archetypes (`remotion-composer/src/components/editorial/`): `EditorialMap` (`d3-geo` + `world-atlas`, dark tactical cartography), `ArchivalSpotlight` (`rotateDeg={0}`), `FlowTimeline`, `ComparisonSplit`.
   - Editorial charts (`remotion-composer/src/components/charts/`): `EditorialBarChart` (Economist pillar chart), `EditorialLineChart` (`yDomain: "auto" | "zero"` with automatic `TRỤC RÚT GỌN` axis-break warning and `deltaBadge`).
2. **Visual Variety Rule:** No two consecutive content scenes may use the same layout archetype. Cap 3-row stacks at `≤ 35%` of content scenes; alternate full-bleed photojournalism (`layoutMode="full-bleed"`), dark tactical maps, spotlights, timelines, splits, and pillar charts.
3. **Chart Selection Rule:** Narrow-variance series (e.g., gold or fuel prices `137.5 → 136.2`) MUST use `EditorialLineChart` (`yDomain: "auto"` + `TRỤC RÚT GỌN` + `deltaBadge`) instead of zero-based horizontal bars that flatten the move.
4. **Blender 3D Illustration Policy:**
   - **Daily quick roundups:** prefer `EditorialMap`, `ArchivalSpotlight`, and `FlowTimeline`.
   - **Flagship spatial / mechanism / infrastructure scenes & bumpers:** Blender MCP (`blender-explainer-animation`, `blender-*`, `3d-asset-generation`) IS encouraged when a physical/spatial illustration genuinely clarifies the story (e.g., bridge span mechanics, dam cross-sections, supply-chain geometry). Render using **matte architectural maquette / dark noir studio lighting** matching `#0B0C0E` / `#F5F5F2` with Signal Red `#E11D2E` / Signal Yellow `#FFD100` highlights — never glossy plastic or neon darkroom lighting — at native 30fps for exact scene duration, and stamp `SimulationBadge` (`MÔ PHỎNG 3D`), never `BLENDER`.
   - **Animated Explainer Reuse (`pipeline.method: "blender_explainer"`):** For living causal 3D clips, reuse free BlenderKit `.blend` props/foliage via `blenderkit_catalog` and `tools/graphics/templates/blender_explainer_kit.py`, bake Geometry Nodes with `disable_shadows=True` on dense foliage, render one-way `24fps` -> `30fps` MP4s (no ping-pong loops), and export `screen_tracks.json` for clamped Remotion tracked callout badges.

## 5. Antigravity / `agy` Pipeline Integration & Gates (MANDATORY)

1. **Speech-locked triggers:** `trigger_frame` / `start_frame` in initial manifests are placeholders. Generate actual TTS WAVs first, transcribe word timestamps (`words.json`), and re-derive every visual anchor (`±0.3s`). Anchor ITEM blocks on the item's NAME word; anchor NUMBER blocks on the number word. Re-run Whisper alignment after any TTS regeneration (`|wav duration - audio_seconds| <= 0.3s`).
2. **Exclusive speech-locked highlight:** Sequential cards/rows/steps use `active` (opacity 1.0 + solid accent border) / `settled` (0.50–0.55) / `ghost` (0.15) states keyed to speech windows; settle all elements to 1.0 after the last cue + 12f.
3. **Source Photo Gate (`tools/qc/source_photo_gate.py`):** Verify license, resolution (`≥800px` long edge), and inspect downloaded images directly via Vision (`read_file`) to confirm `vision_verified: true` and real photography (`assets/images/provenance.json`).
4. **Fact Whitelist Gate (`tools/qc/fact_whitelist_gate.py`):** Run `.venv/bin/python tools/qc/fact_whitelist_gate.py --project projects/<slug>` before compose whenever `artifacts/fact_whitelist.json` or a v2 `research_brief.md` fact table exists.
5. **Pre-mix & Mix Validator (`tools/qc/mixdown.py` & `tools/qc/mix_validator.py`):** Prefer `music_library/sfx/` and `remotion-composer/public/sfx/`. Run `.venv/bin/python tools/qc/mixdown.py --from-stems --project projects/<slug>` to produce lossless stems and `mix_profile.json`, then validate via `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>`.
6. **Antigravity Authoring + Pre-Render Gates (`render_episode.py`):**
   - For episodes `≤ 5` scenes, author in a single clean pass or per-scene modules; for `> 5` scenes, split into `remotion-composer/src/<slug>/scenes/S01.tsx` … `Snn.tsx` with frozen `theme.ts` / `SceneShell.tsx`, and fan out authoring/review via Antigravity `invoke_subagent` / `run_workflow`.
   - Validate before rendering:
     - `cd remotion-composer && npm run validate:layout -- <spec>`
     - `cd remotion-composer && npm run validate:events -- <spec>`
     - `.venv/bin/python tools/qc/source_photo_gate.py --project projects/<slug>`
     - `.venv/bin/python tools/qc/fact_whitelist_gate.py --project projects/<slug>`
     - `.venv/bin/python tools/qc/editorial_language_gate.py --project projects/<slug>`
     - `.venv/bin/python tools/qc/episode_gate.py projects/<slug> --mode agy`
   - Render exclusively via `.venv/bin/python tools/qc/render_episode.py <comp-id> <out.mp4>` (followed by `mixdown.py --mux-only` when mastering stems), never raw `npx remotion render`.

## 6. Aspect Variants: 9:16 + 16:9

Render 9:16 (`1080×1920`) and 16:9 (`1920×1080`) **separately** with re-composed layouts (`scene_manifest.9x16.json` + `scene_manifest.16x9.json`) sharing identical WAVs and speech-lock anchors. Never crop/scale one from the other.

## Gotchas

- **Never use bouncy springs for serious news:** Always keep `damping >= 16`.
- **Never generate charts or text-heavy graphics with T2I:** Render numbers, charts, and maps programmatically in Remotion.
- **Never put Card-itis 1px boxes, neon glow, or dark-slate SaaS gradients on editorial scenes:** Stick strictly to the Broadcast Carbon `#0B0C0E` + Swiss Gallery `#F5F5F2` dual ground with Signal Red `#E11D2E` / Signal Yellow `#FFD100` accents.
- **Keep SFX subtle and tactile:** `-6 dB` to `-14 dB` shutters, paper slides, felt marker swipes, and clicks locked to `trigger_frame`.
