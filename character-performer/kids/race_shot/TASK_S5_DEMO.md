# TASK_S5_DEMO — rig-animator: build + render S5 back-view demo beat (DEMO-GATE)

You are rig-animator. Hermes (orchestrator) has ALREADY verified every input below
(paths, mtimes, registrations, audio durations). Do NOT re-verify assets, do NOT
regenerate anything. Your job: write ONE new Remotion component, register it, tsc,
render, probe stills, write the report. The owner vets aesthetics AFTER this.

## HARD RULES (paid-for lessons — violations killed sessions before)
- NEVER use the Read tool on any .png/.jpg/.wav. Verify images only via PIL scripts.
- Cap Reads at 3 total (Root.tsx anchor area only — everything else is embedded below).
- Write files in chunks of ~25-40 lines per tool call (stream truncation kills sessions).
- Stay ≤25 turns. Write REPORT_S5_DEMO.md incrementally after each phase.
- Do NOT touch KidsStoryEp1Remake.tsx, KidsStoryEp1RemakeDemo.tsx, KidsRaceRigDemo.tsx
  or any existing file except Root.tsx (one insertion).
- Camera is ABSOLUTELY STATIC: no zoom, no pan, no Ken Burns, no parallax motion,
  no punch-in. Scale/position of every layer is either constant or a scripted sprite
  path. The ONLY moving element is the turtle (and rabbit breathing).

## STATE (verified by Hermes 2026-10-14, do not re-check)
- Repo: /Users/tuyennguyen/OpenMontage → ACTUALLY ~/project/OpenMontage (cd there first).
- New chain frames (Hermes-generated + PIL-canonned to m0's content box; identical reg
  to turtle_back_m0 by construction):
  - remotion-composer/public/character-performer/kids/sprite_lib/turtle/turtle_back_w1.png
  - remotion-composer/public/character-performer/kids/sprite_lib/turtle/turtle_back_w3.png
- Existing (approved): turtle_back_m0.png, turtle_back_walk2.png (same dir),
  remake/bg_d5_back.png, remake/tree_clean.png, sprite_lib/rabbit/rabbit_sleeping.png,
  depth_demo/strip_fg.png, k_bgm_v2.wav, dialogue_v2/d5_turtle.wav (6.15s).
- Render env: run everything from ~/project/OpenMontage/remotion-composer with
  `npx tsc --noEmit` then `npx remotion render ...` (node/npm on PATH; proven).

## REGISTRATIONS (embed these EXACT values; content bottom-center pin, H = content height)
const REG = {
  turtle_back_m0:  { w:1407, h:1021, t:0.0098, b:0.9902, cx:0.4826, chf:0.9804, cwf:0.6326 },
  turtle_back_w1:  { w:1407, h:1021, t:0.047,  b:0.9912, cx:0.4826, chf:0.9442, cwf:0.6326 },
  turtle_back_w3:  { w:1448, h:1086, t:0.047,  b:0.953,  cx:0.4834, chf:0.9061, cwf:0.6354 },
  turtle_back_walk2:{ w:1448, h:1086, t:0.0092, b:0.9521, cx:0.4827, chf:0.9429, cwf:0.6354 },
  rabbit_sleeping: { w:1302, h:918,  t:0.0087, b:0.9902, cx:0.4996, chf:0.9815, cwf:0.9869 },
  tree_clean:      { w:1223, h:1286, t:0.0,    b:0.9938, cx:0.4996, chf:0.9938, cwf:0.9992 },
};

## COMPONENT SPEC — file remotion-composer/src/KidsS5BackDemo.tsx
Export `KidsS5BackDemo`. Composition: id "KidsS5BackDemo", 1080x1080, fps 30,
durationInFrames 198 (6.6s). Copy the helper style of KidsStoryEp1Remake.tsx but the
file must be STANDALONE (no imports from other comps). KP = "character-performer/kids".

Layer stack (back to front), ALL static except turtle + breathing:
1. BG: <Img staticFile(KP+"/remake/bg_d5_back.png")> in a div position absolute
   left:-270, top:0, width:1620, height:1080. NO transform, NO animation.
2. Tree: Sprite k="tree_clean" x=870 y=685 H=620, shadow=false.
3. Sleeping rabbit: Sprite k="rabbit_sleeping" x=830 y=802.5 H=175 with breathing
   scaleX = 1-0.004*s, scaleY = 1+0.008*s, s = sin(t*2π/3).
4. TURTLE (the beat — see TURTLE MOTION below).
5. FG strip: div bottom:0 height:300 overflow hidden, maskImage linear-gradient(to
   bottom, transparent 0%, black 55%), inside <Img staticFile(KP+"/depth_demo/strip_fg.png")>
   left:-270 top:-240 width:1620 height:540 filter blur(2px).
6. Warm tint: AbsoluteFill background rgba(255,150,60,0.12), mixBlendMode "multiply".

Sprite component (embed verbatim):
- imgH = H / g.chf; imgW = imgH * (g.w/g.h); left = x - imgW*g.cx; top = y - imgH*g.b.
- Contact shadow div: width imgW*g.cwf*0.72, height width*0.18, top imgH*g.b - width*0.09*... (copy: top = imgH*g.b - sw*0.09, left (imgW-sw)/2, borderRadius 50%, background rgba(30,25,20,shOp), blur 8px, shOp = 0.1+0.15*clamp01((H-60)/560)).
- Wrap div position absolute + <Img width/height 100%>.
- Turtle extra transform: translateY(0) rotate(waddle) — transformOrigin
   `${g.cx*100}% ${g.b*100}%`.

TURTLE RENDER EXCEPTION (IMPORTANT — the dip frames must bob):
- Tree/rabbit use the standard per-frame formula above.
- The TURTLE cycle frames use a SHARED scale so the generated body-dip reads as a
  real vertical bob: S = H / 1002 (1002px = m0 content height in source pixels).
  Per frame k: imgH = S * g.h; imgW = S * g.w; left = x - imgW*g.cx;
  top = y - imgH*g.b. (Feet stay pinned; head height varies 94.8%-102.3% of H
  across the 4 frames — that undulation is INTENDED, do not normalize it away.)

TURTLE MOTION (the ONLY path — viewport px, 1080x1080):
- Walk window: local t in [0, 5.7). u = easeInOutQuad(clamp01(t/5.7)).
- Position polyline (feet anchor): X=[610,508,445,510,430,250], Y=[950,810,680,540,430,355],
  H=[290,232,185,140,98,60]. Use polyLin (linear polyline interpolation over equal
  segments, embedded helper).
- Hold t in [5.7, 6.6]: stand at the final point (X 250, Y 355, H 60), pose m0.
- 4-frame gait cycle, hard swap every 8 frames (267ms), NO crossfade, phase order
  [m0, w1, walk2, w3] repeating: idx = floor(t*30/8) % 4 while walking; hold uses m0.
- Waddle while walking: rotate = 2.5 * sin(t*2π/1.15) degrees, 0 during hold.
- Back-view = no mouth patch, no blink. (Line d5 audio plays over the walk; the
  turtle's face is away from camera — that is INTENDED.)

AUDIO:
- <Audio staticFile(KP+"/dialogue_v2/d5_turtle.wav") /> at t=0 (full line, 6.15s).
- <Audio staticFile(KP+"/k_bgm_v2.wav") volume={ip(t,[6.3,6.6],[0.25,0])} loop />.

HELPERS to embed: clamp01, lerp, easeInOutQuad, polyLin (equal-segment linear),
interpolate with clamp extrapolation (import from remotion). All interpolate() input
arrays must be strictly increasing with matching output lengths.

ROOT REGISTRATION (the ONLY edit to an existing file):
- In remotion-composer/src/Root.tsx: add import
  `import { KidsS5BackDemo } from "./KidsS5BackDemo";` next to the KidsStoryEp1Remake
  import, and a <Composition id="KidsS5BackDemo" component={KidsS5BackDemo}
  durationInFrames={198} fps={30} width={1080} height={1080} /> right after the
  KidsStoryEp1RemakeDemo <Composition> block. Use Edit with the anchor
  `id="KidsStoryEp1RemakeDemo"` — 1 Grep + 1 Read of that region is allowed.

## BUILD + VERIFY (in order; record exit codes)
1. cd ~/project/OpenMontage/remotion-composer && npx tsc --noEmit  → must exit 0.
2. npx remotion render KidsS5BackDemo out/kids_s5_back_demo.mp4 --concurrency=4 --log=error
   → exit 0. (If out/ doesn't exist, mkdir first.)
3. Probe stills (7): for f in 15,45,75,105,135,165,192 →
   npx remotion still KidsS5BackDemo /tmp/s5demo_f<f>.png --frame=<f>
4. ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,r_frame_rate,nb_frames out/kids_s5_back_demo.mp4
5. PIL verify stills exist + are 1080x1080 (script, no Read tool).

## REPORT — write character-performer/kids/race_shot/REPORT_S5_DEMO.md incrementally:
- tsc exit code; render exit code + wall time; ffprobe duration/frames/size.
- Still list + file sizes. Any deviation from spec. NO aesthetic claims (owner vets).

## FINAL CHECKLIST (mechanical, in order — do exactly these)
1. Write KidsS5BackDemo.tsx (chunked writes, ~6-8 calls).
2. Edit Root.tsx (import + Composition).
3. npx tsc --noEmit (exit 0 required; fix and re-run if not).
4. Render mp4 (exit 0 required).
5. 7 probe stills + ffprobe numbers.
6. Finish REPORT_S5_DEMO.md with all measured numbers.
