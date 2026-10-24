#!/usr/bin/env python3
"""STRICT audit mọi scene window và call A() runtime trong chu-dong-tu (S2E02).

Yêu cầu STRICT:
  - Scene windows contiguous, đúng TOTAL_FRAMES (= ceil((narration+2s)*30), động).
  - Mọi plan anchor và call A("phrase", occ?) phải có span start/end nằm trong
    window scene tương ứng (±0.2s tolerance).
  - Raw fraction (Math.round(start*30) - startFrame) / durationInFrames ∈ [0, 1].
  - Bảng từng dòng: scene · anchors · in-window · underflow · overflow · raw fraction ok.
  - Ghi artifacts/anchor_audit_strict.json; 0 overflow mới exit 0.
"""
from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

PROJECT = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
SRC = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/src/chu-dong-tu")
FPS = 30
TOL = 0.2

sys.path.insert(0, str(PROJECT / "scripts"))
from phrase_lock import (js_norm, js_round, find_occurrences, scan_scene_calls,
                         anchors_of, sentence_end, RETENTION_REQUIREMENTS, TOTAL_FRAMES)


def main() -> int:
    timing_doc = json.loads((PROJECT / "artifacts" / "scene_timing.json").read_text())
    scenes_timing = timing_doc["scenes"]
    expected_scenes = len(scenes_timing)
    words_by_sec = json.loads((PROJECT / "assets/audio/transcripts/narration_words.json").read_text())
    plan_doc = json.loads((PROJECT / "artifacts/scene_plan.json").read_text())
    plan_by_id = {s["id"]: s for s in plan_doc["scenes"] if isinstance(s, dict)}
    calls_by_scene = scan_scene_calls()

    # 1. Timeline integrity
    errors: list[str] = []
    if not (60 <= len(scenes_timing) <= 70):
        errors.append(f"Expected 60-70 scenes, got {len(scenes_timing)}")
    total_f = scenes_timing[-1]["startFrame"] + scenes_timing[-1]["durationInFrames"]
    if total_f != TOTAL_FRAMES:
        errors.append(f"Total frames {total_f} != {TOTAL_FRAMES}")
    if scenes_timing[0]["startFrame"] != 0:
        errors.append(f"First scene starts at {scenes_timing[0]['startFrame']} != 0")
    for a, b in zip(scenes_timing, scenes_timing[1:]):
        if a["startFrame"] + a["durationInFrames"] != b["startFrame"]:
            errors.append(f"Discontinuity between {a['sceneId']} and {b['sceneId']}")

    rows = []
    total_calls = 0
    total_in_window = 0
    total_overflow = 0
    total_bad_fractions = 0
    failing_scenes = []

    print(f"{'Scene':<7} | {'Sec':<4} | {'Start':<7} | {'Dur':<6} | {'Calls':<5} | {'InWin':<5} | {'MaxOver':<8} | {'Status'}")
    print("-" * 65)

    for sc in scenes_timing:
        sid = sc["sceneId"]
        sec = sc["sectionId"]
        sf = sc["startFrame"]
        dur = sc["durationInFrames"]
        w0 = sf / FPS
        w1 = (sf + dur) / FPS
        words = words_by_sec.get(sec, [])

        calls = calls_by_scene.get(sid, [])
        call_records = []
        scene_overflow = 0.0
        scene_bad_frac = 0

        for c in calls:
            phrase = c["phrase"]
            occ = c["occ"]
            occs = find_occurrences(words, phrase)
            if len(occs) < occ:
                call_records.append({
                    "phrase": phrase, "occ": occ, "missing": True,
                    "error": f"only {len(occs)} occurrences found"
                })
                scene_bad_frac += 1
                continue

            sp = occs[occ - 1]
            raw_frac = (js_round(sp.start * FPS) - sf) / dur
            under = max(0.0, w0 - sp.start)
            over = max(0.0, sp.end - w1)
            frac_ok = 0.0 <= raw_frac <= 1.0
            span_ok = under <= TOL and over <= TOL

            if over > scene_overflow:
                scene_overflow = over
            if not frac_ok or not span_ok:
                scene_bad_frac += 1

            call_records.append({
                "phrase": phrase,
                "occ": occ,
                "start": round(sp.start, 3),
                "end": round(sp.end, 3),
                "rawFraction": round(raw_frac, 4),
                "underflowSec": round(under, 3),
                "overflowSec": round(over, 3),
                "spanOk": span_ok,
                "fractionOk": frac_ok,
            })

        n_calls = len(call_records)
        n_ok = sum(1 for r in call_records if r.get("spanOk") and r.get("fractionOk"))
        total_calls += n_calls
        total_in_window += n_ok
        if scene_overflow > TOL:
            total_overflow += 1
        total_bad_fractions += scene_bad_frac

        is_pass = (scene_overflow <= TOL and scene_bad_frac == 0 and n_calls >= 1)
        if not is_pass:
            failing_scenes.append(sid)

        status_str = "PASS" if is_pass else f"FAIL(over={scene_overflow:.2f}s)"
        print(f"{sid:<7} | {sec:<4} | {w0:7.2f} | {dur/FPS:6.2f} | {n_calls:<5} | {n_ok:<5} | {scene_overflow:7.3f}s | {status_str}")

        rows.append({
            "sceneId": sid,
            "sectionId": sec,
            "window": [round(w0, 3), round(w1, 3)],
            "startFrame": sf,
            "durationInFrames": dur,
            "calls": call_records,
            "callCount": n_calls,
            "inWindowCount": n_ok,
            "maxOverflowSec": round(scene_overflow, 3),
            "pass": is_pass,
        })

    print("-" * 65)
    print(f"Summary: {len(rows)} scenes, {total_calls} calls | in-window: {total_in_window} | overflow>0.2s: {total_overflow} | bad fractions: {total_bad_fractions}")

    # Retention checks
    retention_results = []
    timing_by_id = {t["sceneId"]: t for t in scenes_timing}
    for req in RETENTION_REQUIREMENTS:
        sid = req["scene"]
        t = timing_by_id.get(sid)
        if not t:
            retention_results.append({**req, "pass": False, "error": "scene missing"})
            continue
        sc_end = (t["startFrame"] + t["durationInFrames"]) / FPS
        ok = sc_end >= req["expectEndSec"] - TOL
        retention_results.append({
            **req,
            "sceneEndSec": round(sc_end, 3),
            "marginSec": round(sc_end - req["expectEndSec"], 3),
            "pass": ok,
        })
        print(f"Retention {sid} «{req['anchor']}»: expectEnd={req['expectEndSec']}s, sceneEnd={sc_end:.3f}s, margin={sc_end - req['expectEndSec']:+.3f}s -> {'PASS' if ok else 'FAIL'}")

    all_retention_pass = all(r["pass"] for r in retention_results)
    overall_pass = (len(errors) == 0 and total_overflow == 0 and
                    total_bad_fractions == 0 and len(failing_scenes) == 0 and
                    all_retention_pass and len(rows) == expected_scenes)

    out_artifact = {
        "pass": overall_pass,
        "scenesChecked": len(rows),
        "passingScenes": len(rows) - len(failing_scenes),
        "totalCalls": total_calls,
        "inWindowCalls": total_in_window,
        "overflowCount": total_overflow,
        "badFractions": total_bad_fractions,
        "failingScenes": failing_scenes,
        "timelineErrors": errors,
        "retentionChecks": retention_results,
        "scenes": rows,
    }
    (PROJECT / "artifacts/anchor_audit_strict.json").write_text(
        json.dumps(out_artifact, ensure_ascii=False, indent=2) + "\n"
    )
    print(f"\nArtifact written: artifacts/anchor_audit_strict.json (OVERALL: {'PASS' if overall_pass else 'FAIL'})")
    return 0 if overall_pass else 1


if __name__ == "__main__":
    sys.exit(main())
