# TASK FIX9b — KidsStoryEp1V2.tsx round 2 (precision pass)

File to edit: `remotion-composer/src/KidsStoryEp1V2.tsx` (ONLY this file).
All numbers final — do NOT re-measure or re-derive. Registrations referenced
below already exist on disk + in sprite_reg.json / mouth_reg.json (verified by
Hermes: `turtle_side_m0`, `turtle_side_mO`, mouth `turtle_side`). NEVER Read a
.png. After edits run `npx tsc --noEmit` in `remotion-composer/` → must be 0
errors. Do NOT render.

## FIX9b-1 — punch-in endpoint: turtle dead-center ON the road between the posts
`const BG5_X = [540, 524, 427, 160];` → `const BG5_X = [540, 524, 427, 65];`
(BG5_Y unchanged. Max-zoom vision measurement: road at the gate spans world
x 14–109, center 61; 65 = between the posts, on the road.)

## FIX9b-2 — d2/d3: swap the weak 3/4 turtle for the TRUE side-profile pair
1. FILES map: add `"turtle_side_m0": "depth_demo/turtle_side_m0.png",`
2. The d2 gap-idle line becomes:
   `<Idle k="turtle_side_m0" x={710} y={885} H={260} scaleX={-1} opacity={env(t, 9.41, 13.97)} />`
   (currently `k="turtle_m0"` — only the `k` value changes).
3. The d3 Talking block: `closed="turtle_m0"` → `closed="turtle_side_m0"`,
   `mouthName="turtle_depth"` → `mouthName="turtle_side"`. Everything else
   (x=710, y=885, H=260, scaleX=-1, cues CUES[3], t0/t1, opacity env) stays.

## FIX9b-3 — d7 rabbit: ground it ON the road, far side, running toward camera
Replace the FIX9 rabbit SwapCycle block values:
```tsx
<SwapCycle
  kA="rabbit_front_run_m0"
  kB="rabbit_front_run2"
  every={5}
  f0={s2f(34.13)}
  x={ip(t, [34.13, 39.73], [615, 595])}
  y={ip(t, [34.13, 39.73], [545, 655])}
  H={ip(t, [34.13, 39.73], [75, 115])}
  ty={-10 * Math.abs(Math.sin((t - 34.13) * Math.PI * 2 * 2.2))}
  opacity={env(t, 34.13, 40.93)}
/>
```
(path now follows the road corridor measured at that depth — old x 860→790
was over grass; ty adds a small run-cadence hop like the d4 sprint.)

## Acceptance
- `npx tsc --noEmit` → 0 errors. Only this file changed.
