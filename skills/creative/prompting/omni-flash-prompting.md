# Omni Flash Prompting — Multi-Clip Stickman Generation Contract (Phase B)

> Extracted from [kaomei/stickman-video-director](https://github.com/kaomei/stickman-video-director) (MIT), adapted for OpenMontage. Companion to `creative/stickman-director.md` (Phase A). Applies to any synced-audio text-to-video model generating independent ~10s clips that must look/sound like one film (Gemini Omni Flash, Seedance, Veo, etc.).

Use ONLY after explicit approval of the current Phase A proposal.

## Production package order

1. Global continuity block
2. N standalone English prompts (N = duration / 10)
3. Stitching guide
4. Voice and music continuity note

**Global continuity block** (review summary): aspect ratio, duration, style, character anchor design, palette/environment, narrator identity, audio arc, continuity strategy. Each prompt still repeats ALL critical locks — prompts must be usable standalone with zero external context.

## Standalone prompt structure (12 fields, in order)

1. **Output spec**: ~10 seconds, ratio, 720p, 24 FPS, synchronized audio
2. **Environment**: per style spec (Style 1 Light: flat digitally pure-white canvas, no shading/3D depth; Style 1 Dark: pitch-black canvas, pure white line art; Style 2A: white high-key studio + light-gray perspective grid floor + cyan/blue glass UI; Style 2B: rich full-color cinematic environment, volumetric light, DoF)
3. **Character lock** (see anchors below)
4. **Palette**: ordinary color names only (vivid red, electric blue, warm gold) — never hex/RGB/HSL/Pantone (models render prominent notation as unwanted on-screen text)
5. **Composition** for ratio: 16:9 = left-center-right staging + lateral tracking + negative space; 9:16 = depth, stacked motion, vertical reveals, interface-safe placement
6. **First-frame state** inherited from previous clip
7. **Three timed beats** `[0–3s] [3–7s] [7–10s]` tied to spoken ideas
8. **Exact audio-only dialogue** in quotes: `Audio voiceover only, strictly no speech bubbles, no dialogue boxes.` Forbid adding, omitting, paraphrasing, repeating, reordering, captioning, or visually transcribing words
9. **Identical narrator description** verbatim across all clips
10. **BGM + synced SFX**, voice-first mixing (clips 2–N mandate BGM continuity from clip 1)
11. **Final-frame transition state** inherited by next clip
12. **Negative constraints** (see list below)

## Character anchors (anti-deformation lock)

**Style 1** (all clips): `A minimalist 2D stick figure with a hollow circular head, no facial features, no hair, no clothing, no filled body, uniform medium line weight.`

**Style 2 Clip 1**: `A minimalist 2D animated stick figure wearing a bright red beanie (smooth rounded knit, no pom-pom) and a yellow t-shirt, with simple black stick limbs and shorts. Simple black lines, vibrant colors, smooth 2D animation style.`

**Style 2 Clips 2–N**: `The same minimalist 2D animated stick figure in a bright red beanie and yellow shirt... Simple black lines, vibrant colors, smooth 2D animation style.`

Rules: no detailed pupils/irises/photoreal faces (triggers bug-eye deformation); smooth rounded beanie top (no pom-poms); always include BOTH beanie and t-shirt (omitting either degrades the character).

## Style language

Density without drift: `rapid scene changes, kinetic motion-graphic transformations, and frequent visual events, while preserving an identical stick-figure design, constant line weight, and strict temporal consistency`. Avoid `rapid style changes` — invites drawing-style/line-weight drift.

## Anti-stutter & anti-lag

- No abstract liquid/object shape morphing (stairs melting into a clock → diffusion latent jitter, frame drops)
- Drive motion with concrete character actions: leaping, touching glass, drawing luminous lines, opening heavy doors
- Character never idles or stares at camera for multiple seconds

## Audio continuity dual-lock

Independent generations produce random voices/disjoint music unless locked:

1. **Narrator lock** — repeat identical narrator spec verbatim in every prompt: `Identical narrator: confident, articulate, warm young adult American male voice, natural conversational storytelling tone, voice-first mix.` (adapt gender/age once for the whole package)
2. **BGM lock** — Clip 1 establishes the theme (`Voiceover clearly audible over quiet, thoughtful piano and subtle soft ambient synth, building gentle optimistic momentum.`); Clips 2–N: `Audio: Voiceover seamlessly continues the identical quiet, thoughtful piano and subtle soft ambient synth from clip 1, maintaining identical tempo, instrumentation, and optimistic narrative momentum. Synchronized crisp SFX on physical actions.`

## Negative contract (append per style)

Universal: no photorealism or 3D humanoid rendering; no facial features/hair unless approved; no extra limbs/malformed anatomy/changed proportions; no broken or changing line weight; no inverted theme polarity; no unintended characters or irrelevant spectacle; no visible words/letters/numbers/interface copy/captions/subtitles/logos/watermarks; no altered/omitted/repeated/reordered dialogue; no speech bubbles or text boxes.

Style 2A adds: `strictly minimalist studio aesthetic, no circuit board textures, no sci-fi wall panels, no spaceship corridors, no cracked concrete, no grunge textures.`
Style 2B adds: `no photorealistic human skin, no 3D humanoid CGI models, no chaotic line glitches.`

## Stitching guide

List all N clips in order. For every cut, repeat the exact ending state and matching opening state. Include trim / short audio crossfade / match-cut notes for assembly.

## OpenMontage assembly note

When audio consistency matters most (news/explainer productions), prefer generating clips **without model audio** where the provider allows, then laying ONE continuous external voiceover (vieneu/edge-tts pipeline) + BGM during compose — this is the same reason `subtitle-sync` + speech-locked animation exist here. Use the model-generated audio path only when the video model's synced SFX is itself the deliverable.

## Phase B checks

Phase A approved; exactly N prompts; each repeats ratio/style/character/palette/voice/audio/transition/negative locks; each has 3 timed beats + ≥4 visual devices; every ending matches next opening; dialogue matches approved narration exactly; dialogue is audio-only and never displayed; no technical color notation; Style 2 prompts carry character anchor + BGM lock + anti-clutter negatives; no visible writing in generated scenes (overlays listed separately).
