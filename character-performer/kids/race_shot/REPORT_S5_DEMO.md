# REPORT_S5_DEMO — KidsS5BackDemo (DEMO-GATE)

Task: TASK_S5_DEMO (rig-animator). One new standalone Remotion comp (S5
back-view demo beat), Root.tsx registration, tsc, render, probe, report.
Inputs pre-verified by Hermes 2026-10-14; not re-verified per task rules.

## Build
- New file: remotion-composer/src/KidsS5BackDemo.tsx (standalone, no comp imports)
- Root.tsx: `import { KidsS5BackDemo }` after KidsStoryEp1Remake import +
  `<Composition id="KidsS5BackDemo" 198f/30fps/1080x1080>` after the
  KidsStoryEp1RemakeDemo block. No other files touched.
- `npx tsc --noEmit` → exit 0

## Render
- `npx remotion render KidsS5BackDemo out/kids_s5_back_demo.mp4 --concurrency=4 --log=error`
  → exit 0, wall time 12.7s (12.652 total)

## Probes

ffprobe out/kids_s5_back_demo.mp4:
- video stream: 1080x1080, r_frame_rate 30/1, nb_frames 198
- (audio stream: nb_frames 312 — codec-level count, not video)
- format: duration 6.656s, size 1,427,051 bytes (~1.36 MiB)

7 probe stills via `npx remotion still` (all exit 0), PIL-verified 1080x1080:

| frame | file | bytes |
|------|------|-------|
| 15 | /tmp/s5demo_f15.png | 1,970,869 |
| 45 | /tmp/s5demo_f45.png | 1,968,360 |
| 75 | /tmp/s5demo_f75.png | 1,967,508 |
| 105 | /tmp/s5demo_f105.png | 1,964,993 |
| 135 | /tmp/s5demo_f135.png | 1,962,404 |
| 165 | /tmp/s5demo_f165.png | 1,961,609 |
| 192 | /tmp/s5demo_f192.png | 1,961,222 |

PIL check: ALL_OK (7/7 exist, all 1080x1080).

## Deviations from spec
- None. Component, registrations, motion spec (polyline X/Y/H, easeInOutQuad,
  4-frame hard-swap gait every 8f, waddle 2.5·sin(2πt/1.15), turtle shared-scale
  exception S=H/1002, breathing scaleX 1−0.004s / scaleY 1+0.008s @ 3s cycle),
  layer stack, FG strip mask/blur, warm multiply tint, audio (d5_turtle at t=0,
  k_bgm_v2 loop fading 0.25→0 over [6.3,6.6]) all implemented as written.
- Camera static; only turtle path + rabbit breathing move.

Aesthetics intentionally not judged here — owner vets after DEMO-GATE.

