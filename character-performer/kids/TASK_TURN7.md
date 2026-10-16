# TASK_TURN7 — rig-animator: user v6 feedback, surgical Scene 1 only

You are the implementation worker rig-animator. Work in /Users/tuyennguyen/project/OpenMontage. Follow preloaded bone-rig-pipeline. Budget $0, existing free route only, do NOT switch model/provider. No network generation needed. NEVER Read PNGs. Read <=3 text files (target TSX once, your chosen API source if necessary). <=18 turns. All build/compose/render implementation is YOUR responsibility; Hermes does independent QC.

User verbatim: (1) 'Có cách nào để 2 nv nhìn nhau khi nói chuyện k?' (2) 'đừng phóng to rùa'. Required windows [10.9,12.4) and [15.3,17.8) only. Restore/keep rabbit close-up 1.22x @430,800 ONLY first window, remove turtle close-up 1.18x @660,800 second window (identity). No audio/TTS/timeline/cue/viseme changes. All other v6 parts unchanged incl S3b staging/dialogue, five scenes, banner already removed at20s.

## Verified pre-edit state (Hermes has ALREADY done this; do not repeat investigation)
Canonical file: remotion-composer/src/KidsStoryEp1Remake.tsx (1173 lines).
Composition KidsStoryEp1Remake, 1080^2, 30fps,1230f. v6 video out/kids_ep1_remake_v6.mp4, 12414120B,41.045333s. Existing source snapshot + 393 hashes: character-performer/kids/turn7/KidsStoryEp1Remake.v6.tsx, baseline_hashes.json. DO NOT overwrite snapshot/hashes.
Independent v6 probes from MP4 f333,350,361,466,485,505,513,527 AND native sprite board ALREADY inspected by vision:
- Native rabbit_taunt points LEFT, native turtle_side_m0 points RIGHT. Both are true profile, one eye.
- Existing scaleX=-1 on both makes rabbit (x350) look RIGHT, turtle(x710) look LEFT. In BOTH windows, eyes/muzzles ALREADY point at each other. Do NOT flip them to +1 just to claim a change! Cheapest valid facing fix = keep explicit inward profile pair, annotate/document this fact and prove after. No new images/head rig required.
- Body+mouth share Talking wrapper scaleX, so keep -1 on wrapper; do not flip patch separately.

Camera CURRENT v6 camAt, ~655:
if t>=33.9 camZ1.04 origin540,540; >=20.9 identity; >=18.9 1.02; >=17.79 identity; if t<15.3 identity; else1.18 origin660,800.
IMPORTANT brief overrides v6: v6 had removed S2b1.22; v7 must restore rabbit-close while NOT enlarging turtle. DO NOT globally enlarge the turtle as v5 did.

Staging ~963..1027:
S2 Talking rabbit_taunt mouthName rabbit_taunt, cues CUES[2], t0=9.91,t1=12.93,x350,y880,H310, opacity until(t,9.41,12.4)*clamp01(spC*2),scaleX=-1.
S2 Idle turtle_side_m0 x710,y885,H260,scaleX=-1,opacity until(t,9.41,12.4).
Reaction 12.4..13.53 turtle H340 rotate-5 etc: DO NOT TOUCH.
S3 Talking turtle_side_m0 mouthName turtle_side cuesCUES[3] t0=13.53,t1=17.19,x710,y885,H300,scaleX=-1,ty=nod3,opacity until(t,13.53,17.94,.4).
S3 Idle rabbit_taunt x350,y880,H310,scaleX=-1,opacity until(t,13.53,17.94,.4).

## Changes (ONE canonical TSX, nothing else in src/public)
1) camAt: preserve all >=17.79 states EXACTLY. Return1.22 @430,800 only if10.9<=t<12.4; all other t<17.79 identity. Remove stale comments claiming S3b zoom stays; accurate table. No interpolation/push/new motion.
2) Keep turtle S2 SAME SCREEN SIZE/POSITION during rabbit close. Preferred cheapest exact method: counter-transform ONLY S2 Idle turtle subtree by inverse camera scale1/1.22 about SAME origin430,800 for [10.9,12.4). Thus overall turtle transform identity, rabbit+bg camera1.22. All spriteH,x/y,facing,breathing/opacity remain exactly v6. Use conditional wrapper only inwindow or ensure wrapper identity outside; no changes to shared components. Counter-transform must not affect rabbit or mouth. Report world-camera1.22, turtle NET1.0; do NOT claim all scene sprite net1.22.
3) Facing: retain profile scaleX=-1 for rabbit and turtle in both windows, no pose regeneration; comments/report state measured already-correct inward gaze. If implementation finds contradictory hard evidence, STOP and report, not speculative flips. Target after screen rabbit right/turtle left.
4) Window2 [15.3,17.79] camera1.0, S3 turtle H300 unchanged, nod3 unchanged. Preserve t>=17.79 exactly (frame534=17.8).

## Verification + artifacts
Save report incrementally character-performer/kids/turn7/REPORT_TURN7.md. Only outputs allowed outside target TSX are turn7 artifacts + new v7 MP4. Root/public/audio untouched, do NOT git reset/stash/commit; repo has pre-existing user changes.
First npx tsc --noEmit from remotion-composer, must exit0.
Render v7 via existing Remotion: npx remotion render KidsStoryEp1Remake out/kids_ep1_remake_v7.mp4 --concurrency=4 --log=error (record duration/rc). No audio manipulation; keep encode settings. ffprobe record1230f1080x108030fps ~41.045s stereo.
Stills after: character-performer/kids/turn7/v7_stills/fNNNN.png (ABSOLUTE paths preferred). Required frames:
100,190,326,327,331,339,355,361,367,370,371,372,390,448,458,459,463,469,478,486,499,502,508,515,527,533,534,567,585,600,615,780,886,920,1017,1150,1229.
For stronger scope QC, produce LOSSLESS IMAGE SEQUENCES of all1230frames for v6/v7, output turn7/lossless/v6 and v7. The v6 snapshot is outside src and can be bundled without altering canonical file by a temporary registerRoot entry OUTSIDE production src. Reuse renderFrames/renderMedia image-sequence API or renderFrames direct JS module, installed Remotion (do not download packages). There are >40GB free,1230*2PNG ~5GB. Can write a small cc_turn7_qc_frames script in turn7. Native image-sequence and bundling instructions inspect as needed. Prefer all frames (diff0 outsidewindows, not only samples). If not possible inside remaining turn budget, write reusable script and report limitation; main v7 render+stills first.
Report MUST: actual diff/line changes, facing audit fact (not fake flip), camera table and turtle countertransform, source assets untouched, tsc/renderexit/time, outputbytes, ffprobe, still paths, any incomplete QC honestly. Hermes will independently verify before Telegram delivery. Do not send Telegram yourself, do not mark approved.
