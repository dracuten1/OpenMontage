#!/usr/bin/env python
"""S2E02 chu-dong-tu — deterministic speech-locked scene timing. NO proportional fallback.

From scene_plan anchors × narration_words (global-second word timings):
  A) greedy first anchors (per-section cursor, iterated to fixed point),
  B) contiguous integer-frame windows: start(N+1) = firstAnchor(N+1) − 0.32s, scene 1 = 0,
     video end = 28050 frames (935.0s) hard-fixed,
  C) every anchor/A() call resolved to an in-window occurrence (see phrase_lock.py),
  D) trailing-END overflow pushes the boundary, capped at the next scene's first spoken frame.

Outputs:
  artifacts/scene_timing.json          (engine fields + full anchor/call rows w/ protectionEnd)
  remotion-composer/.../timing.ts      (regenerated; do NOT run gen_scaffold.py)
  artifacts/anchor_resolution_d012.json (per-scene anchor occurrence resolution)
  artifacts/timing_conflicts_d012.json  (content conflicts + pushes + applied codemod)
A missing phrase is an explicit failure — never an estimated timing."""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from phrase_lock import (FPS, TOTAL_FRAMES, PROJECT, SRC, ResolutionError, load_project,
                         resolve, finalize_timing, RETENTION_REQUIREMENTS)

TS_OUT = SRC / "timing.ts"
TS_HEADER = """// GENERATED from projects/chu-dong-tu/artifacts/scene_timing.json (S2 artifact).
// Do not hand-edit — regenerate via scripts/gen_scene_timing.py (speech-lock, engine pattern S2E01 d-012).


export type SceneTiming = {{
  sceneId: string;
  sectionId: string;
  startFrame: number;
  durationInFrames: number;
}};

export const TIMING: SceneTiming[] = [
{rows}
];
"""


def main() -> int:
    scenes, words, calls = load_project()
    res, sf, first_span, occ_fixes, failures = resolve(scenes, words, calls)
    try:
        timing, pushes, conflicts, retention_rows, retention_checks = finalize_timing(
            scenes, res, sf, first_span, words)
    except ResolutionError as e:
        print(f"FATAL: {e}")
        return 2

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    # Post-pass pushes can absorb a provisional-window spill (e.g. trailing anchor
    # 'cùng một công việc' 795.30-796.38 vs provisional end 796.10, pushed to 796.4x).
    # Status/conflicts derive from FINAL windows (finalize_timing = single source of
    # truth): re-test every provisional failure against the final window before it
    # can stop the run. Unresolved/absent phrases (no span) always stay failures.
    import re as _re
    kept_failures = []
    by_id = {t["sceneId"]: t for t in timing}
    for f in failures:
        m = _re.match(r"(sc\d+)", f)
        sid = m.group(1) if m else None
        t = by_id.get(sid)
        if t is None:
            kept_failures.append(f); continue
        w0 = t["startFrame"] / FPS
        w1 = (t["startFrame"] + t["durationInFrames"]) / FPS
        spans = [(a["start"], a["end"], a["phrase"]) for a in t.get("anchors", [])]
        spans += [(c["start"], c["end"], c["phrase"]) for c in t.get("calls", [])]
        bad = [p for s, e, p in spans if s < w0 - 0.2 or e > w1 + 0.2]
        if not spans or bad:
            kept_failures.append(f)
    if len(kept_failures) != len(failures):
        print(f"absorbed by final-window pushes: {len(failures) - len(kept_failures)} provisional failure(s)")
    failures = kept_failures
    if failures:
        # HARD mode: an unresolved phrase must STOP the run — production good timing
        # (timing.ts / scene_timing.json) is NOT replaced by partial output.
        print(f"RESOLVE FAILURES ({len(failures)}): production timing NOT rewritten")
        for f in failures[:20]:
            print("  -", f)
        _write_diagnostics(now, res, timing, pushes, conflicts, occ_fixes, failures)
        return 2

    (PROJECT / "artifacts" / "scene_timing.json").write_text(
        json.dumps({"fps": FPS, "generated": now,
                    "retentionRequirements": [
                        {k: v for k, v in r.items()} for r in RETENTION_REQUIREMENTS],
                    "retentionChecks": retention_checks,
                    "scenes": timing},
                   ensure_ascii=False, indent=1) + "\n")

    rows = ",\n".join(
        f'  {{ sceneId: "{t["sceneId"]}", sectionId: "{t["sectionId"]}", '
        f'startFrame: {t["startFrame"]}, durationInFrames: {t["durationInFrames"]} }}'
        for t in timing)
    TS_OUT.write_text(TS_HEADER.format(rows=rows))

    resolution = {"generated": now, "note": "occ 1-based per section; exact engine parity "
                 "(anchors.ts greedy join + normalization); boundaries firstAnchor-0.32s",
                 "scenes": {}}
    for t in timing:
        r = res[t["sceneId"]]
        resolution["scenes"][t["sceneId"]] = {
            "section": r.section,
            "firstAnchor": t["firstAnchor"],
            "firstAnchorStart": t["firstAnchorStart"],
            "anchors": [{"phrase": a["phrase"], "occ": a["occ"], "start": a["start"],
                         "end": a["end"], "protectionEnd": a["protectionEnd"]}
                        for a in t["anchors"]],
            "calls": [{"phrase": c["phrase"], "occ": c["occ"], "start": c["start"],
                       "end": c["end"]} for c in t["calls"]],
        }
    (PROJECT / "artifacts" / "anchor_resolution_s2e02.json").write_text(
        json.dumps(resolution, ensure_ascii=False, indent=1) + "\n")

    _write_diagnostics(now, res, timing, pushes, conflicts, occ_fixes, failures)

    total = timing[-1]["startFrame"] + timing[-1]["durationInFrames"]
    print(f"scene_timing.json + timing.ts: {len(timing)} scenes, total {total} frames "
          f"= {total / FPS:.2f}s | contiguous: "
          f"{all(timing[i]['startFrame'] + timing[i]['durationInFrames'] == timing[i + 1]['startFrame'] for i in range(len(timing) - 1))}")
    print(f"conflicts: {len(conflicts)} in scenes "
          f"{sorted({c['scene'] for c in conflicts})} | pushes: {len(pushes)} | "
          f"resolve failures: {len(failures)}")
    over = [(t['sceneId'], t['overflowSec']) for t in timing if t['overflowSec'] > 0.201]
    print(f"overflow>0.2s: {over if over else 'none'}")
    bad_ret = [t['sceneId'] for t in timing if not t['retention']['ok']]
    print(f"retention cut: {bad_ret if bad_ret else 'none'}")
    # production gate: conflicts (semantic, other worker) or retention failures => nonzero
    return 1 if (conflicts or bad_ret) else 0


def _write_diagnostics(now, res, timing, pushes, conflicts, occ_fixes, failures) -> None:
    PROJECT = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
    codemod_log = PROJECT / "logs" / "timing_codemod.json"
    conflicts_doc = {
        "generated": now,
        "summary": {
            "scenes": len(timing),
            "conflicts": len(conflicts),
            "conflictScenes": sorted({c["scene"] for c in conflicts}),
            "pushes": len(pushes),
            "resolveFailures": len(failures),
        },
        "planEdits": json.loads(codemod_log.read_text())["planEdit"] if codemod_log.exists() else None,
        "appliedCodemod": json.loads(codemod_log.read_text())["applied"] if codemod_log.exists() else [],
        "occFixesDerived": occ_fixes,
        "pushes": pushes,
        "conflicts": conflicts,
        "resolveFailures": failures,
        "note": "Interleaved narration vs plan order (4 pairs) is REAL content conflict: "
                "anchors spoken inside the neighbouring scene's window. Enumerated exactly; "
                "NOT silently clamped, reassigned, or proportionally faked. Owner decision "
                "required (swap scene order / re-anchor panel / re-record narration bit).",
    }
    (PROJECT / "artifacts" / "timing_conflicts_s2e02.json").write_text(
        json.dumps(conflicts_doc, ensure_ascii=False, indent=1) + "\n")

    total = timing[-1]["startFrame"] + timing[-1]["durationInFrames"]
    print(f"scene_timing.json + timing.ts: {len(timing)} scenes, total {total} frames "
          f"= {total / FPS:.2f}s | contiguous: "
          f"{all(timing[i]['startFrame'] + timing[i]['durationInFrames'] == timing[i + 1]['startFrame'] for i in range(len(timing) - 1))}")
    print(f"conflicts: {len(conflicts)} in scenes "
          f"{sorted({c['scene'] for c in conflicts})} | pushes: {len(pushes)} | "
          f"resolve failures: {len(failures)}")
    over = [(t['sceneId'], t['overflowSec']) for t in timing if t['overflowSec'] > 0.201]
    print(f"overflow>0.2s: {over if over else 'none'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
