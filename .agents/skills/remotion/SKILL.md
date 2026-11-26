---
name: remotion
description: Toolkit-specific Remotion patterns — custom transitions, shared components, and project conventions. For core Remotion framework knowledge (hooks, animations, rendering, etc.), see the `remotion-official` skill.
---

# Remotion — Toolkit Extensions

> **Core Remotion knowledge** lives in `.agents/skills/remotion-best-practices/` (synced from the official [remotion-dev/skills](https://github.com/remotion-dev/skills) repo). This file covers **toolkit-specific** patterns only.

## Shared Components

Reusable video components in `lib/components/`. Import in templates via:

```tsx
import { AnimatedBackground, SlideTransition, Label } from '../../../../lib/components';
```

| Component | Purpose |
|-----------|---------|
| `AnimatedBackground` | Floating shapes background (variants: subtle, tech, warm, dark) |
| `SlideTransition` | Scene transitions (fade, zoom, slide-up, blur-fade) |
| `Label` | Floating label badge with optional JIRA reference |
| `Vignette` | Cinematic edge darkening overlay |
| `LogoWatermark` | Corner logo branding |
| `SplitScreen` | Side-by-side video comparison |
| `NarratorPiP` | Picture-in-picture presenter overlay |
| `Envelope` | 3D envelope with opening flap animation |
| `PointingHand` | Animated hand emoji with slide-in and pulse |
| `MazeDecoration` | Animated isometric grid decoration for corners |

## Custom Transitions

The toolkit includes a transitions library at `lib/transitions/` for scene-to-scene effects beyond the official `@remotion/transitions` package.

### Using TransitionSeries

```tsx
import { TransitionSeries, linearTiming } from '@remotion/transitions';
// Import custom transitions from lib (adjust path based on your project location)
import { glitch, lightLeak, clockWipe, checkerboard } from '../../../../lib/transitions';
// Or import from @remotion/transitions for official ones
import { slide, fade } from '@remotion/transitions/slide';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <TitleSlide />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={glitch({ intensity: 0.8 })}
    timing={linearTiming({ durationInFrames: 30 })}
  />
  <TransitionSeries.Sequence durationInFrames={120}>
    <ContentSlide />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

### Available Custom Transitions

| Transition | Options | Best For |
|------------|---------|----------|
| `glitch()` | `intensity`, `slices`, `rgbShift` | Tech demos, edgy reveals, cyberpunk |
| `rgbSplit()` | `direction`, `displacement` | Modern tech, energetic transitions |
| `zoomBlur()` | `direction`, `blurAmount` | CTAs, high-energy moments, impact |
| `lightLeak()` | `temperature`, `direction` | Celebrations, film aesthetic, warm moments |
| `clockWipe()` | `startAngle`, `direction`, `segments` | Time-related content, playful reveals |
| `pixelate()` | `maxBlockSize`, `gridSize`, `scanlines`, `glitchArtifacts`, `randomness` | Retro/gaming, digital transformations |
| `checkerboard()` | `gridSize`, `pattern`, `stagger`, `squareAnimation` | Playful reveals, structured transitions |

**Checkerboard patterns:** `sequential`, `random`, `diagonal`, `alternating`, `spiral`, `rows`, `columns`, `center-out`, `corners-in`

### Transition Examples

```tsx
// Tech/cyberpunk feel
glitch({ intensity: 0.8, slices: 8, rgbShift: true })

// Warm celebration
lightLeak({ temperature: 'warm', direction: 'right' })

// High energy zoom
zoomBlur({ direction: 'in', blurAmount: 20 })

// Chromatic aberration
rgbSplit({ direction: 'diagonal', displacement: 30 })

// Clock sweep reveal
clockWipe({ direction: 'clockwise', startAngle: 0 })

// Retro pixelation
pixelate({ maxBlockSize: 50, glitchArtifacts: true })

// Checkerboard patterns
checkerboard({ pattern: 'diagonal', gridSize: 8 })
checkerboard({ pattern: 'spiral', gridSize: 10 })
checkerboard({ pattern: 'center-out', squareAnimation: 'scale' })
```

### Transition Duration Guidelines

| Type | Frames | Notes |
|------|--------|-------|
| Quick cut | 15-20 | Fast, punchy |
| Standard | 30-45 | Most common |
| Dramatic | 50-60 | Slow reveals |
| Glitch effects | 20-30 | Should feel sudden |
| Light leak | 45-60 | Needs time to sweep |

### Preview Transitions

Run the showcase gallery to see all transitions:

```bash
cd showcase/transitions && npm run studio
```

## Toolkit Best Practices

1. **Frame-based animations only** — Avoid CSS transitions/animations; they cause flickering during render
2. **Use fps from useVideoConfig()** — Make animations frame-rate independent
3. **Clamp interpolations** — Use `extrapolateRight: 'clamp'` to prevent runaway values
4. **Use OffthreadVideo** — Better performance than `<Video>` for complex compositions
5. **delayRender for async** — Always block rendering until data is ready
6. **staticFile for assets** — Reference files from `public/` folder correctly
7. **All projects use 30fps** — Timing: frames = seconds × 30
8. **playbackRate must be constant** — For variable/extreme speeds, pre-process with FFmpeg

## Project Timing Conventions

| Scene Type | Duration | Notes |
|------------|----------|-------|
| Title | 3-5s (90-150f) | Logo + headline |
| Overview | 10-20s | 3-5 bullet points |
| Demo | 10-30s | Adjust playbackRate to fit |
| Stats | 8-12s | 3-4 stat cards |
| Credits | 5-10s | Quick fade |

**Pacing:** ~150 words/minute for voiceover. Voiceover drives timing.

## Advanced API

For detailed API documentation on all hooks, components, renderer, Lambda, and Player APIs, see [reference.md](reference.md).

## License Note

Remotion has a special license. Companies may need to obtain a license for commercial use. Check https://remotion.dev/license

## OpenMontage News `SceneShell` & Mechanical QC Gate Cheatsheet

When authoring bespoke Atelier news scenes under `remotion-composer/src/<slug>/` using `src/components/news`:

1. **`SceneShell` `{children}` Local Coordinates (Critical):**
   - `SceneShell` already mounts `{children}` inside TikTok Safe Zone v3.2 (`top: 350`, `left: 90`, `width: 850`, `height: 1070`).
   - Always position children in **local `0..850 × 0..1040` coordinates** (never add `top: 350` or `left: 90` again, or bottom blocks will spill into the dark cinema lower-third band `y: 1444–1920`).
   - Below a `backplate={{ mode: "top-split", splitHeight: H }}`, start the lower data stage at local `top ≈ H + 12`.

2. **Verified Shared News Component Props:**
   - `HeroTitle`: accepts `{ text, highlight, color, highlightColor, align, sub, subColor }` (no `highlightTextColor` or `enterFrame`).
   - `AiBadge`: accepts `{ concept }` (not `label`) and **auto-prepends `"MINH HỌA AI / "`** — pass only the short concept (e.g. `concept="CÔNG BÁO"`), never repeat the prefix.
   - `ArchiveLabelBadge`: pass `archiveLabel="ẢNH TƯ LIỆU <year>"` (rather than `label=...`) so `fact_whitelist_gate.py` ignores the archival year via `NON_FACT_PROP_RE`.
   - `<OffthreadVideo muted />`: does **not** accept a `loop` prop — wrap in `<Loop durationInFrames={N}>` from `"remotion"`.

3. **`fact_whitelist_gate.py` & `editorial_language_gate.py` TSX Hygiene:**
   - Use `after(frame, N)` / `between(frame, a, b)` from `timing.ts` instead of raw `frame >= N` inside TSX files (prevents `>...<` regex false positives on unwhitelisted numbers).
   - Prefer `<path d="M ..." />` over `<polygon points="..." />` and avoid numeric CSS `filter: "contrast(1.06)"` strings.
   - Whitelist verified archival photograph years (e.g. `2019`, `2015`) in `fact_whitelist.json` when displayed in `<ArchiveLabelBadge />`.
   - Ensure every non-closing content scene has a genuine graphic-native layer (`EditorialBarChart`, `ComparisonSplit`, or SVG with `maxValue` / `GRID` math) bound in `scene_manifest.json`.

4. **Strict Timing Re-Lock & Mix Gate Defaults:**
   - Keep per-scene post-audio breathing pad at **`≤ 0.25s`** (strict `timing_relock_guard` tolerance is `±0.30s` against measured WAV duration).
   - Always emit `artifacts/narration_words.json` (section-dict shape) and include `"declared_not_measured": ["music_masking"]` in `mix_profile.json` when validating stems with `tools.qc.mix_validator`.

5. **BGM Audibility & Loudness Normalization (Never Ship `-50 dB` Music):**
   - Never wire a raw `music_library/` track directly at `0.08–0.10` volume without checking `0–30s` loudness (`ffmpeg -t 30 -i track.mp3 -af volumedetect -f null -`). Filmscore tracks often start at `-28` to `-30 dB`, making `0.085` completely inaudible beneath `-14 dB` narration.
   - If `0–30s` `mean_volume < -22 dB`, probe per-15s windows, trim `-ss` to the active pulse section, and normalize the ingested `bgm.mp3` to **`-16 LUFS`** (`loudnorm=I=-16:TP=-2.0:LRA=5`).
   - On a `-16 LUFS` normalized bed, set Remotion `<Audio>` gain to **`0.20–0.24`** under narration (`~13 dB` below voice — clearly audible without masking speech) and swell to **`0.35–0.40`** during the outro `<BrandBumper />` before fade-out.

6. **Multi-Channel Ship CLI & Strict Checkpoints:**
   - `build_episode_audio.py --write-entry` emits JSX into `src/<slug>/index.ts`; rename it to `index.tsx` before running `npx tsc --noEmit` / `ship_episode.py`.
   - Invoke `PYTHONPATH=. python3 tools/qc/ship_episode.py ...` from repo root so `lib.*` imports resolve cleanly.
   - Keep `assets/images/provenance.json` strictly for verified real photographs (`visual_type: "photograph"`, `taken`, `license`, `credit_line`, `source_url`, `vision_verified: true`, `subject_match_note` >= 12 chars) — never list AI-generated illustrations there.
   - Strict `compose`/`publish` checkpoints require `metadata.production_validation_report` (with `scene_coverage`, `expected_scenes`, `artifact_hashes`), `metadata.edit_decisions`, and `metadata.stage_fingerprint` computed via `recompute_checkpoint_fingerprint`.

7. **Audio Tail Hygiene, `EditorialMap` Non-Conflict Pins & SVG Text Width Guard:**
   - **TTS/ASR section-tail completeness (`build_episode_audio.py` + `gate_c_verify.py`):** Never end a `script.json` section's `text` or `delivery_cues.provider_text` with slashed/abbreviated units or dates (`9,6%/năm`, `10/12`, `12 mili giây` vs `mười hai phần nghìn giây`) — Whisper normalizes them differently and triggers fail-closed `tail_truncated` / `section_tail_truncated`. Always end each section with **2–3 plain Vietnamese words shared verbatim** between `text` and `provider_text` (e.g., `một năm.`, `tháng 12.`, `giảm một nửa.`).
   - **`EditorialMap` non-conflict pins & dense labels:** `EditorialMap` maps `status: "active"` to `"ĐÁNH TRÚNG"` (strike/conflict badge). For infrastructure, cable, trade, or city maps, always use `status: "info"` (`"MỐC"`) or `"restricted"` (`"HẠN CHẾ"`), omit `route.label` around dense clusters, and offset adjacent pins (e.g., Malaysia/Singapore) with opposing `labelOffset` vectors.
   - **SVG `<text>` no-wrap guard (`850px` Safe Zone):** SVG `<text>` never wraps automatically; when placing a right metric box at `x ≈ 600–630` inside an `850px` SVG, keep left-column `24px` body strings to `≤ 43` characters so copy never collides with the right badge.

---

## Feedback & Contributions

If this skill is missing information or could be improved:

- **Missing a pattern?** Describe what you needed
- **Found an error?** Let me know what's wrong
- **Want to contribute?** I can help you:
  1. Update this skill with improvements
  2. Create a PR to github.com/digitalsamba/claude-code-video-toolkit

Just say "improve this skill" and I'll guide you through updating `.agents/skills/remotion/SKILL.md`.
