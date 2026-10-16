"""Assemble final race_shot_qc.json from measured partials + process facts."""

import json

ROOT = "/Users/tuyennguyen/project/OpenMontage"
OUT = f"{ROOT}/remotion-composer/out"

with open(f"{ROOT}/character-performer/kids/race_shot/prep_out.json") as f:
    prep = json.load(f)
with open(f"{OUT}/race_shot_qc_partial3.json") as f:
    meas = json.load(f)

qc = {
    "task": "PHASE B RACE SHOT dual-character demo comp (Ep.01 bone-rig remake, demo-gate)",
    "date": "2026-10-14",
    "comp": {
        "id": "KidsRaceRigDemo",
        "src": "remotion-composer/src/KidsRaceRigDemo.tsx",
        "size": [1080, 1080],
        "fps": 30,
        "durationInFrames": 102,
        "duration_s": 3.4,
        "episode_offset_s": 17.49,
        "camera": "static (bg6 cover-fit 1620x1080 @ left:-270, Img scale 1.0 constant, no wrapper)",
    },
    "assets": {
        "rig_rabbit_run": {
            "src": "character-performer/kids/rig_demo/out/frames/f0001..f0108.png",
            "dst_dir": "remotion-composer/public/character-performer/kids/remake/rig_rabbit_run/",
            "frames_copied": prep["rabbit"]["count"],
            "frame_size": prep["rabbit"]["size"],
            "unflip": "FLIP_TOP_BOTTOM",
            "f0001_feet_gap_px": prep["rabbit"]["feet_gap_f0001_px"],
            "feet_near_bottom_40px": prep["rabbit"]["feet_gap_f0001_px"] <= 40,
            "union_bbox_px": prep["rabbit"]["union_bbox_px"],
        },
        "rig_turtle_walk": {
            "src": "character-performer/kids/rig_turtle/out/frames_t/f0001..f0097.png",
            "dst_dir": "remotion-composer/public/character-performer/kids/remake/rig_turtle_walk/",
            "frames_copied": prep["turtle"]["count"],
            "frame_size": prep["turtle"]["size"],
            "size_note": "MEASURED 1536x1024 (task allowed 1535 or 1536)",
            "unflip": "FLIP_TOP_BOTTOM",
            "f0001_feet_gap_px": prep["turtle"]["feet_gap_f0001_px"],
            "feet_near_bottom_40px": prep["turtle"]["feet_gap_f0001_px"] <= 40,
            "feet_gap_note": "100px > ~40px guide: walk-cycle f1 is mid-stride; placement unaffected (bottom-center pin anchors content bottom to path Y)",
            "union_bbox_px": prep["turtle"]["union_bbox_px"],
        },
        "bg": {
            "file": "remotion-composer/public/character-performer/kids/ep1_v2/bg6_walk.png",
            "measured_size": prep["bg6_walk_size"],
            "note": "task said 1536x1024; measured 1254x1254; drawn with V2-approved geometry so BG6 track coords match",
        },
    },
    "reg_entries": {
        "file": "remotion-composer/public/character-performer/kids/remake/reg.json",
        "semantics": "V2 Sprite: t/b/cx fractions of image box, chf=b-t, cwf=content width fraction; pin: imgH=H/chf, imgW=imgH*(w/h), left=x-imgW*cx, top=y-imgH*b",
        "rig_rabbit_run": prep["rabbit"]["reg"],
        "rig_turtle_walk": prep["turtle"]["reg"],
    },
    "checks": {
        "tsc_noEmit_errors": 0,
        "tsc_exit_code": 0,
        "interpolate_scan": {
            "calls_checked": 4,
            "call_sites": [
                "ip(uT,[0,1],[205,120])", "ip(t,[0,0.2],[0,1])",
                "ip(u4,[0,1],[400,170])", "ip(t,[0,0.21],[0,1])",
            ],
            "strictly_increasing_inputs": True,
            "in_out_lengths_equal": True,
            "violations": 0,
        },
    },
    "render": {
        "cmd": "npx remotion render KidsRaceRigDemo out/kids_race_rig_demo.mp4 --concurrency=4 --log=error",
        "exit_code": 0,
        "wall_time_s": 11.7,
        "output": "remotion-composer/out/kids_race_rig_demo.mp4",
        "bytes": 1136140,
        "note_first_attempt": "RC=1: k_bgm_v2.wav measures exactly 17.500s = 525 frames @30fps, startFrom={525} left 0 frames and Remotion <Loop> rejected durationInFrames=0; fixed to startFrom={524} (1 frame = 33ms earlier into the loop bed; BGM then loops from position 0, matching episode phase at t=17.49 within 0.3 frames)",
    },
    "ffprobe": {
        "video": {"codec": "h264", "width": 1080, "height": 1080, "r_frame_rate": "30/1"},
        "duration_s": 3.456,
        "audio": {"codec": "aac", "channels": 2, "present": True},
    },
    "camera_static": meas["camera_static"],
    "seam": dict(
        meas["seam"],
        method="comp frame 16 (t=0.533, turtle src f13); band rows from src alpha gap in x-window 1038..1060; bleed col = median |still-BGREF| < 15 over band rows +-2; interior = src opaque above AND below band (real hole), margin = transparent-by-design silhouette",
        carry_forward_issue="Phase A: turtle neck seam at swing extremes, src f13/f19+24k, src x~1049+-11",
        conclusion="residual src gap 4 rows (744..747) maps to 0.94 comp rows at H=195; bilinear downscale closes it -> 0 interior bleed columns; ACCEPT (<=8)",
    ),
    "sprite_heights": dict(
        meas["sprite_heights"],
        method="measured head-to-feet vs exact pin-math label composite (per-frame expected) and vs spec H envelope (union chf); diff>25 vs BGREF counted only at the sprite's own label columns",
        conclusion="all 6 measurements within 0.6% of pinned geometry (comp renders pin math exactly); turtle also within 0.5% of spec H; rabbit 14.8-31.8% below spec H envelope at these phases = stride-phase ear tuck (union top row 5 is an extreme-reach pose), not a scale error",
    ),
    "stills": {
        "race_still_1.jpg": {"frame": 18, "t_s": 0.6, "exit_code": 0},
        "race_still_2.jpg": {"frame": 51, "t_s": 1.7, "exit_code": 0},
        "race_still_3.jpg": {"frame": 87, "t_s": 2.9, "exit_code": 0},
        "race_still_seam.jpg": {"frame": 16, "t_s": 0.533, "exit_code": 0},
        "race_cam_f8.png": {"frame": 8, "exit_code": 0},
        "race_cam_f95.png": {"frame": 95, "exit_code": 0},
    },
}

with open(f"{OUT}/race_shot_qc.json", "w") as f:
    json.dump(qc, f, indent=2)
    f.write("\n")
print("wrote", f"{OUT}/race_shot_qc.json")
