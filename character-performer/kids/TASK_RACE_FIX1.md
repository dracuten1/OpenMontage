# TASK RACE FIX1 — separation fix-loop for KidsRaceRigDemo (demo-gate shot)

ROLE: CC lead delegates ALL implementation to `rig-animator` subagent (Task tool).
Lead stays under 8 turns, verifies report on disk, done. Never Read .png (PIL only).
Workdir /Users/tuyennguyen/project/OpenMontage. Python .venv/bin/python.
Read budget <=3: KidsRaceRigDemo.tsx, race_shot_qc.json (numbers), your new report.

## CONTEXT (verified)
Comp `KidsRaceRigDemo` (src/KidsRaceRigDemo.tsx, registered in Root.tsx) renders
fine: RC 0, 102f, camera-static sky diff 0.0, no seams. ONE defect found by Hermes
vision QC at t=0.6/1.7/2.9: rabbit and turtle OVERLAP too much horizontally
(rabbit covers turtle's head; depth read is ambiguous). Cause: lane offsets (+40
rabbit / -55 turtle) vs measured content widths — rabbit ~222px, turtle ~346px at
their H schedules; center separation only ~90-98px. Path BG6_X=[556,524,508,572,540]
Y=[972,810,648,518,400] runs near-vertical so progress does not add X separation.
Current params (from the comp): rabbit lane +40, u4=clamp01((t-0.30)/3.0),
H=ip(u4,[0,1],[400,170]); turtle lane -55, uT=0.72*clamp01(t/3.4),
H=ip(uT,[0,1],[205,120]); opacity fades ip(t,[0,0.21]/[0,0.2],[0,1]).

## FIX (rig-animator)
Retune staging ONLY — camera stays TĨNH (identity), timeline/TTS/bg/frame-mapping/
H schedules stay. You may tune: lane X offsets (suggest rabbit +70..+85,
turtle -105..-125), turtle uT cap (0.5..0.62), turtle H end (>=110), start delays
(<=0.3s). Solve with the pin math + reg.json contents (rig_rabbit_run cwf 0.37565,
rig_turtle_walk cwf 0.96289 — turtle content is WIDE), then verify on REAL renders:

ACCEPTANCE (measure, print numbers into the report):
A1. At t=0.6/1.7/2.9 stills: horizontal bbox overlap between the two sprites
    <= 50% of the narrower content width, and rabbit's bbox right edge never
    crosses turtle's head zone (turtle head is at path direction = up-right of
    its center). Simplest robust metric: center separation
    dx >= 0.5*(wR + wT) - 0.25*min(wR,wT).
A2. Both sprites stay ON the road: sample the dirt-road predicate
    (R150-205, G105-155, B65-110, R-B>45 — rig_demo fix3 v2 precedent) at each
    sprite's feet row across its content columns at t=0.3/1.2/2.1/2.9;
    dirt ratio >= 0.45 per sprite per time (same threshold as fix3 v2).
A3. Camera-static re-proof: stills f8 vs f95 sky patch (60..180 x 40..160)
    mean|diff| < 2.0.
A4. `npx tsc --noEmit` 0 errors; render exit 0; ffprobe 1080x1080 102f 30fps audio.

Re-render out/kids_race_rig_demo.mp4 (overwrite), refresh race_still_{1,2,3}.jpg
(t=0.6/1.7/2.9), race_cam_f{8,95}.png, race_shot_qc.json (append fix1 numbers),
and APPEND a "## FIX1" section to character-performer/kids/REPORT_RACE_SHOT.md
with: final lane offsets / uT / H values, all A1-A4 numbers, render RC + wall time.
If A2 fails on the road edges (turtle too wide mid-frame), lower turtle H schedule
(H0 205->185, end 120->105) rather than moving it off-road; re-check A1/A2.
Do NOT touch anything else (frames, blend, other comps, V2/Remake, skills).
