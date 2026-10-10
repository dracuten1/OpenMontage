# character-performer — frozen-scene 2D character animation layer

**Pattern (v7, QC-verified): whole-frame img2img variant swap.** No patches, no masks — seams impossible by construction.

Combo: **9router image + img2img variants + rhubarb-lip-sync + vieneu TTS + OM Remotion**.
No video model, no GPU, $0/render, deterministic. Scene frozen; only mouth/eyes (full-frame swap) + Remotion transforms move.

## Pipeline (per character)

1. **Base scene** — 9router `ag/gemini-3.1-flash-image`: flat 2D cartoon, character upper-body facing viewer, MOUTH CLOSED, eyes open, static bg.
2. **Variants (img2img, `cx/gpt-image-2.5-sunburst` = identity-preserving, SSE `Accept: text/event-stream`, `image` = base64 data URI)** — `tools/gen_variants.py`:
   - v_mouthA (wide "AH"), v_mouthB (half "OH"), v_mouthD (slight gap), v_eyes (closed lids)
   - Prompt lock: "Keep EVERYTHING else exactly unchanged: same pose/face/crossbow/background/style/line weight/palette. No text."
   - ~4 × 60-90s, $0.
3. **Narration** — vieneu → wav; **rhubarb** → `tools/Rhubarb-Lip-Sync-1.14.0-macOS/rhubarb -f json -o audio/<name>_mouthcues.json audio/<name>.wav` (dict, take `.mouthCues`).
4. **Composition** — `CharacterPerformer.tsx` v3: full-frame swap by cue tier (X=0 closed, A=3 wide, B/C/G/H=2, D/E/F=1), blink from v_eyes every 3.4s (suppressed during wide), breathing bob + sway + slow zoom/drift via Remotion transforms, `<Audio>` mux. Register in Root.tsx (1080², fps 30, duration = wav + ~1.5s tail).
5. **Render** — `cd remotion-composer && npx remotion render CharacterPerformerAdv ../character-performer/renders/x.mp4 --concurrency=4 --log=error`.

## Why NOT patches (dead ends, 2026-10-10 — 6 failed iterations)

PIL-drawn ovals (v1) and any pasted-region approach (v2–v6: raw variant crops, pixel-diff holes, flood-fill blobs, skin underlays, dilated-mask pastes) ALL leak: color mismatch, seams, gray halos, double lips, pad misalignment (script pad ≠ composer mouthPad prop), global re-shading noise between independent img2img runs. Vision QC scored 2/10 repeatedly. Whole-frame swap scored 6/10 first try — the only residual is the generator's own mouth edge, no compositing artifacts. Lesson: **don't composite over a generated image — generate the composite states.**

## Remotion's actual job here
Cue→frame timing at 30fps (rhubarb seconds → tier → which full frame), blink clock, spring/entrance, breathing/sway/zoom/drift transforms, title overlay, audio mux + H.264 encode. The animation logic is 100% Remotion; the pixels are 100% generation-side.

## Gotchas
- Composer public dir: `remotion-composer/public/character-performer/`, JSON import via `../public/...`, use `staticFile()` everywhere.
- `src/eth-tradingagents-20261010/entry.tsx` has a pre-existing tsc error (missing ./Episode) — unrelated, webpack render unaffected.
- Verify each variant with vision before rendering (identity/crossbow/bg preserved).
- Probe stills: A-cue times for mouth (2.90, 6.30), 3.45 for blink window (t%3.4 ∈ [0.085, 0.13)).
- vieneu load ~8s per call; rhubarb ~10s on 7s wav (M4).

## Status (2026-10-10)
- adv_demo_v7.mp4 — 9.05s, mouth naturalness 6/10 (vision QC), blink clean, full lineage preserved. renders/ keeps v1–v7 as evidence trail.
