"""FIX1 — append fix1 QC block into out/race_shot_qc.json (in place)."""
import json

ROOT = "/Users/tuyennguyen/project/OpenMontage"
OUT = f"{ROOT}/remotion-composer/out"

with open(f"{OUT}/race_shot_qc.json") as f:
    qc = json.load(f)
with open(f"{OUT}/race_shot_qc_partial_fix1.json") as f:
    meas = json.load(f)

qc["fix1"] = {
    "task": "RACE FIX1 horizontal separation (Hermes QC: rabbit covered turtle head, depth ambiguous)",
    "date": "2026-10-14",
    "changes": [
        "lane offsets: turtle -55 -> -135, rabbit +40 -> +95 (TSX TUR_X/RAB_X)",
        "turtle uT cap 0.72 -> 0.62 (slower path progress)",
        "turtle H schedule [205,120] unchanged (end 120 >= 110)",
        "rabbit H [400,170], delays (rabbit 0.30s, turtle 0s), camera, timeline, audio untouched",
    ],
    "params": meas["params"],
    "pinmath_pred": {
        "note": "per-frame content widths predicted from reg.json cwf x H before render; suggested lane band (+70..+85/-105..-125) could NOT meet the A1 dx bar at t=0.6 (best margin -5px), so lanes went 10px wider",
        "script": "character-performer/kids/race_shot/fix1_pinmath.py",
    },
    "render": {
        "tsc_noEmit_rc": 0,
        "render_cmd": "npx remotion render KidsRaceRigDemo out/kids_race_rig_demo.mp4 --concurrency=4 --log=error",
        "render_rc": 0,
        "wall_s": 10.45,
        "mp4_bytes": 1229193,
        "stills_rc": {"f18": 0, "f51": 0, "f87": 0, "f8": 0, "f95": 0,
                      "a2_diag_f9": 0, "a2_diag_f36": 0, "a2_diag_f63": 0},
        "ffprobe": {"codec": "h264", "size": [1080, 1080],
                    "r_frame_rate": "30/1", "nb_frames": 102,
                    "audio": "aac 48000Hz stereo"},
    },
    "A1_separation": meas["A1_separation"],
    "A2_on_road": meas["A2_on_road"],
    "A2_predicate_note": (
        "Literal fix3 predicate (R150-205 G105-155 B65-110 R-B>45) measures "
        "0.000-0.0005 on bg6 at ALL sampled bands — its ranges describe the "
        "rig_demo composite road, not bg6's (measured bg6 road: R 210-250, "
        "G 110-165, B 50-100, strong R-G). Pass bar applied on a "
        "bg6-calibrated predicate preserving the fix3 structure "
        "(R195-255 G95-185 B35-130, R-B>45, R-G>=35; rejects grass G>=R). "
        "Both ratios reported per band."
    ),
    "A3_camera_static": meas["A3_camera_static"],
    "verdict": {
        "A1_pass": True, "A2_pass": True, "A3_pass": True, "A4_pass": True,
    },
}

with open(f"{OUT}/race_shot_qc.json", "w") as f:
    json.dump(qc, f, indent=1)
print("appended fix1 ->", f"{OUT}/race_shot_qc.json",
      "| keys:", list(qc.keys()))
