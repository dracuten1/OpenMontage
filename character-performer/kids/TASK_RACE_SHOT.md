# TASK RACE SHOT — Ep.01 bone-rig remake, demo-gate shot (2026-10-14)

ROLE SPLIT (owner standing rule): You (CC lead) ONLY orchestrate + verify reports.
ALL implementation (probe scripts, Blender, PIL, Remotion TSX, render) is delegated
to your `rig-animator` subagent (Task tool — it preloads skill bone-rig-pipeline).
Stay under 12 lead turns. Never Read .png files (PIL only). Check disk before
regenerating anything. Budget $0, no network, no model calls, no i2i.

Workdir: /Users/tuyennguyen/project/OpenMontage
Python: .venv/bin/python (from repo root). Blender: ~/.local/bin/blender -b --python <script>
Read budget (lead+subagent combined <=8 text files): allowed Reads are
rig_turtle/TASK_FINISH_RIG.md, REPORT_SPLIT_TURTLE.md, remotion-composer/src/KidsStoryEp1V2.tsx
(reference comp), remotion-composer/src/Root.tsx, and report files you write.
Everything else you need is embedded below.

## STATE ON DISK (verified by Hermes 2026-10-14 — do NOT redo)
- Rabbit rig DONE + owner-verified (FIX5 pass): rig_demo/out/frames/f0001..f0216.png
  (1536x1024, stored V-FLIPPED). Run+closed-mouth = f0001..f0108 (dark-px probe constant
  21651). Talk (d0 cues) = f0110..f0216 — DO NOT USE in this task. rabbit_rig.blend OK.
- Turtle split DONE (7 layers, 0.44%): rig_turtle/out/parts/*.png — never redo.
- Turtle rig built + 248 frames rendered (103.7s): rig_turtle/out/frames_t/f0001..f0248.png
  (1535x1024, stored V-FLIPPED), turtle_rig.blend saved 00:14, anim_meta (f_talk0=98,
  cues d5), rig_meta verify_bbox true. MISSING: qc_rig.json, rig_cycle_strip.jpg,
  REPORT_FINISH_RIG.md — the finish-rig session died before any probe ran
  (cc_finish_rig.json/.err are 0 bytes).
- Turtle mouth probe (Hermes, DISK coords x0,y0,x1,y1 = 1274,428,1366,501):
  f0001..f0097 = closed (mean|diff| <= 2.2 vs f0001); real opens f0101..f0248 (~43).
  => closed-mouth walk range for the race shot = f0001..f0097 (97 frames, 4.04s @24fps).
- SSOT scripts to adapt: rig_demo/cc/{fix5_verify.py,fix5_probe_full.py,fix5_render_frames.py,composite.py}
  and rig_turtle/cc/{rig_build.py,rig_animate.py,render_frames.py}.
- Approved Ep.01 = src/KidsStoryEp1V2.tsx (rendered kids_ep1_v2_tg.mp4). Audio:
  public/character-performer/kids/dialogue_v2/d4_rabbit.wav (d4 = rabbit line
  17.79–22.19s "Một hai ba, chạy nào! Ơ, chạy trước vậy chắc ăn rồi… ngủ chút đã nhỉ."),
  k_bgm_v2.wav. BG: public/character-performer/kids/ep1_v2/bg6_walk.png (1536x1024,
  road S-curve centerline in VIEWPORT px: X [556,524,508,572,540], Y [972,810,648,518,400]).

## PHASE A — finish turtle rig verification (delegate to rig-animator #1)
Deliver the missing TASK_FINISH_RIG.md outputs. If a probe FAILS, fix + re-render
(frames_t full overwrite) + re-probe; report honestly.
1. Adapt fix5_verify.py -> rig_turtle/cc/finish_verify.py (blender -b on
   out/turtle_rig.blend): (a) 4 leg sprites bound to own leg_*_b bone (not hips);
   (b) mouth/eyelid are head-copy meshes parented to head_b with own mesh/material
   (M_mouth/M_eyelid) and matrix_parent_inverse == head's; (c) animation keys cover
   f1..f248 (no stop at 152); (d) in-plane rotations use LOCAL Z.
2. Motion probe (PIL on frames_t, un-flip first): leg-tip displacement per leg over
   one 24f cycle (4 legs, diagonal gait = near-front+far-hind in phase); head-patch
   world matrix XZ residual < 1e-4 across f1/f7/f13/f19; body sway <=1deg, head <=3deg.
3. Filmstrip out/rig_cycle_strip.jpg: frames f1,f7,f13,f19 UN-FLIPPED (upright) on flat
   pale-green bg + 2x zoom crops at neck and a leg root. Inspect via PIL metrics
   (seam = alpha gap column at joint lines; no white halo = no bright ring). If seam
   exposed: PIL underpaint joint caps from parent palette (TASK_FINISH §6), re-render.
4. Write out/qc_rig.json (honest booleans + numbers + exit codes) and
   rig_turtle/REPORT_FINISH_RIG.md (paths, RCs, timings, PASS/FAIL per check).

## PHASE B — compose RACE SHOT (dual-character, demo-gate) (delegate to rig-animator #2)
NEW standalone comp `KidsRaceRigDemo` — do NOT modify KidsStoryEp1V2/Remake/other comps.
1. Asset prep (PIL): un-flip + copy
   rabbit f0001..f0108 -> public/character-performer/kids/remake/rig_rabbit_run/f%04d.png
   turtle  f0001..f0097 -> public/character-performer/kids/remake/rig_turtle_walk/f%04d.png
   (upright; verify counts 108/97, sizes 1536x1024 / 1535x1024, feet near canvas bottom).
2. Measure reg (PIL): per sequence union content bbox over ALL used frames + rest-feet
   anchor (bottom row at f0001) -> append entries `rig_rabbit_run`,`rig_turtle_walk`
   (w,h,t,b,cx,chf,cwf — same pin math as V2 `Sprite`: imgH=H/chf, bottom-center pin)
   to public/character-performer/kids/remake/reg.json.
3. src/KidsRaceRigDemo.tsx (new file, pure function of frame, no random):
   1080x1080 @30fps, 102 frames. Comp t=0 == episode t=17.49 (approved V2 S4 window).
   - BG: bg6_walk cover-fit: div left -270, size 1620x1080, Img inside, scale 1.0
     CONSTANT. NO Ken Burns, NO pan, NO zoom, NO camera wrapper — camera TĨNH TUYỆT ĐỐI.
   - Rabbit (leader, right lane): frame idx = 1+floor((t-0.30)*24), clamp 1..108
     (no loop). Path polyLerp over X=[556,524,508,572,540]+40, Y=[972,810,648,518,400],
     H=[400,170], u4=clamp01((t-0.30)/3.0) (easeOutCubic inside segments, V2 polyLerp).
     opacity ip(t,[0,0.21],[0,1]). Soft ellipse shadow at feet (V2 Sprite shadow spec:
     w=0.72*contentW, rgba(30,25,20,0.28), blur 8).
   - Turtle (rear, left lane): frame idx = 1+floor(t*24) clamp 1..97. Same polyline,
     X offset -55, uT=0.72*clamp01(t/3.4), H lerp 205->120. opacity ip(t,[0,0.2],[0,1]).
     Render turtle BEFORE rabbit (further up-road at end). Both already face RIGHT
     (fits the road diagonal) — NO mirroring.
   - Audio: <Sequence from={9}><Audio d4_rabbit.wav/></Sequence> (comp t 0.30);
     <Audio k_bgm_v2.wav volume={0.3} startFrom={525} loop/> (episode offset 17.49s).
   - No end card, no confetti, no title (this is a motion-layer demo shot).
4. Register in Root.tsx: id "KidsRaceRigDemo", 1080x1080, fps 30, 102 frames.
5. Checks then render (from remotion-composer/): `npx tsc --noEmit` (0 errors);
   static-scan every interpolate() (inputs strictly increasing, in/out lengths equal);
   `npx remotion render KidsRaceRigDemo out/kids_race_rig_demo.mp4 --concurrency=4 --log=error`
   (exit 0). ffprobe: 1080x1080, 3.4s, has audio stream.
6. Shot QC (PIL/ffmpeg): extract stills t=0.6/1.7/2.9 -> out/race_still_{1,2,3}.jpg;
   camera-static proof: `npx remotion still KidsRaceRigDemo --frame=8` and `--frame=95`,
   diff a 120x120 sky patch (e.g. viewport x 60..180, y 40..160) between them —
   mean|diff| must be < 2.0 (bg identical => camera static). Write
   remotion-composer/out/race_shot_qc.json (frame counts, bboxes, anchors, diffs, RCs).
7. Write character-performer/kids/REPORT_RACE_SHOT.md: every number (files copied,
   reg values, tsc result, render RC + duration, still-diff numbers, ffprobe).

CONSTRAINTS (FIX5 rules — paid for): camera static in-shot; sprite-height changes
WITHIN shot = character depth movement only (rabbit 400->170, turtle 205->120 —
approved V2 S4 numbers); mouth: both racers closed-mouth during the shot (V2-approved
convention while running; d4 audio plays) — any future mouth patch must be <=70ms
region-only fade; no whole-sprite crossfade EVER; frames swap at native 24fps timing.
Do NOT touch: rig_demo frames, parts/, skill files, KidsStoryEp1V2.tsx, Remake comps,
blend của rabbit. Deliverable = files + reports with measured numbers, no claims.
