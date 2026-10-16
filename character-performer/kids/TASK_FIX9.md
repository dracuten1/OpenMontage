# TASK FIX9 — KidsStoryEp1V2.tsx staging fixes (user feedback round 9)

File to edit: `remotion-composer/src/KidsStoryEp1V2.tsx` (ONLY this file).
All numbers below are final — do NOT re-measure, re-derive, or "improve" them.
All sprite/mouth registrations referenced below ALREADY exist on disk and in
sprite_reg.json / mouth_reg.json (verified by Hermes). Read budget: ≤2 (this
file's target TSX only). Verify images ONLY with PIL if ever needed — NEVER
Read a .png.

After edits run `npx tsc --noEmit` (repo root `remotion-composer/`) and fix
any errors you introduce. Do NOT render — Hermes renders + QCs.

## FIX9-1 — d2: turtle listener turns to face the rabbit
Scene B's turtle talker currently lives 4.0→13.47. Change its opacity env to
end when d2 starts:
- `opacity={env(t, 4.0, 13.47) * clamp01(spB * 2)}` → `opacity={env(t, 4.0, 9.91) * clamp01(spB * 2)}`

Replace the existing gap-idle `<Idle k="turtle_m0" x={710} y={885} H={260} opacity={env(t, 13.07, 13.97)} />`
with ONE mirrored side-view idle covering d2 + gap (faces LEFT toward rabbit):
```tsx
<Idle k="turtle_m0" x={710} y={885} H={260} scaleX={-1} opacity={env(t, 9.41, 13.97)} />
```

## FIX9-2 — d3: turtle TALKS facing the rabbit (side-view matched pair)
Replace the d3 `<Talking closed="turtle_front_m0" mouthName="turtle_front" ...>` block:
```tsx
<Talking
  closed="turtle_m0"
  mouthName="turtle_depth"
  cues={CUES[3]}
  t0={13.53}
  t1={17.19}
  x={710}
  y={885}
  H={260}
  opacity={env(t, 13.67, 17.72)}
  scaleX={-1}
/>
```
(turtle_m0 = depth side-view facing right → scaleX -1 flips it to face LEFT at
the rabbit. mouthName "turtle_depth" resolves MOUTH + REG["turtle_depth_mO"]
already registered. The Talking wrapper mirrors body+patch together.)

## FIX9-3 — punch-in: turtle walks ON the road at the gate
`const BG5_X = [540, 524, 427, 103];` → `const BG5_X = [540, 524, 427, 160];`
(BG5_Y unchanged. Vision-measured: road center at the turtle's end position is
world x≈164; old endpoint 103 landed on grass 80px left of road center.)

## FIX9-4 — nap: sleeping rabbit + wake rabbit smaller
- `<Sprite k="rabbit_sleeping" x={977} y={680} H={190} ...>` → `H={130}`
- `<Zzz x={977} y={460} ...>` → `x={960} y={550}`
- `<Sprite k="rabbit_wake" x={950} y={700} H={200} ...>` → `y={690} H={140}`
  (keep its existing opacity/scaleMul/spWake untouched)

## FIX9-5 — d7 finish: turtle one side, rabbit sprinting toward camera far side
1. turtle_proud move to the LEFT side (keep facing right = watching the road):
   `x={560}` → `x={420}` (y=845, H=300, everything else unchanged).
2. FILES map: add two entries:
   `"rabbit_front_run_m0": "sprite_lib/rabbit/rabbit_front_run_m0.png",`
   `"rabbit_front_run2": "sprite_lib/rabbit/rabbit_front_run2.png",`
3. Replace the whole FIX8 rabbit SwapCycle block (kA="rabbit_back_m0" ...
   x ip [700,640], y ip [520,560], H={100}) with:
```tsx
{/* FIX9: rabbit FAR on the RIGHT side sprinting TOWARD the camera —
    front-run 2-pose cycle, grows + descends (never reaches the finish) */}
<SwapCycle
  kA="rabbit_front_run_m0"
  kB="rabbit_front_run2"
  every={5}
  f0={s2f(34.13)}
  x={ip(t, [34.13, 39.73], [860, 790])}
  y={ip(t, [34.13, 39.73], [540, 660])}
  H={ip(t, [34.13, 39.73], [80, 125])}
  opacity={env(t, 34.13, 40.93)}
/>
```
4. Update the two comment blocks above those sections to describe the new
   staging (turtle left side of gate facing the road; rabbit far right,
   front-view sprint toward viewer).

## Acceptance
- `npx tsc --noEmit` → 0 errors.
- Only KidsStoryEp1V2.tsx modified (git diff shows 1 file).
- All interpolate() input ranges strictly increasing (they are in the spec).
