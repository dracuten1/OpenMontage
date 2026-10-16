# TASK FIX10 — KidsStoryEp1V2.tsx d7 rabbit grounding (final)

File: `remotion-composer/src/KidsStoryEp1V2.tsx` ONLY. Numbers final —
measured from the rendered frame: road top edge behind the turtle is y≈713
across x 460–740; the rabbit currently floats 120–160px above it. NEVER Read
a .png. After edits `npx tsc --noEmit` → 0 errors. Do NOT render.

## Change (the d7 rabbit SwapCycle, currently x [600,575], y [505,565], H [62,92])
Replace ONLY these three props + the ty amplitude:
```tsx
  x={ip(t, [34.13, 39.73], [800, 735])}
  y={ip(t, [34.13, 39.73], [655, 740])}
  H={ip(t, [34.13, 39.73], [66, 110])}
  ty={-8 * Math.abs(Math.sin((t - 34.13) * Math.PI * 2 * 2.2))}
```
(kA/kB/every/f0/opacity unchanged. Rationale: feet end at y=740 = ON the road
top edge (713) to the RIGHT of the turtle (turtle right edge ≈686) — enters
mid-leap from the right, lands on the dirt, grows toward camera. Update the
comment above the block accordingly.)

## Acceptance
- tsc 0 errors; only this file changed.
