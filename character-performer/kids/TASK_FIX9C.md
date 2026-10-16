# TASK FIX9c — KidsStoryEp1V2.tsx d7 rabbit depth fix (final)

File: `remotion-composer/src/KidsStoryEp1V2.tsx` ONLY. Numbers final. After
edits `npx tsc --noEmit` → 0 errors. Do NOT render, NEVER Read a .png.

Problem: d7 rabbit path ends inside the foreground turtle's head (reads as
perched on it). Fix: rabbit smaller + higher (farther, at the gate opening) AND
render it BEFORE the turtle so any overlap reads as BEHIND.

## Changes (section G only)
1. MOVE the rabbit SwapCycle block (kA="rabbit_front_run_m0" ... opacity
   env(t, 34.13, 40.93)) to BEFORE the turtle `<Talking closed="turtle_proud" ...>`
   block (swap the two blocks' order — rabbit first, turtle second). Update
   the comment above the rabbit block to: rabbit FAR at the gate opening,
   drawn behind the turtle.
2. In that rabbit SwapCycle, change ONLY these props:
   - `x={ip(t, [34.13, 39.73], [615, 595])}` → `[600, 575]`
   - `y={ip(t, [34.13, 39.73], [545, 655])}` → `[505, 565]`
   - `H={ip(t, [34.13, 39.73], [75, 115])}`  → `[62, 92]`
   (ty hop + every + f0 + opacity stay unchanged.)
3. No other edits.

## Acceptance
- tsc 0 errors; only this file changed.
