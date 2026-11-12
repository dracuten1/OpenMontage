#!/usr/bin/env python
"""CC reviewer wrapper — read-only reviewer session (video-slowfix phase1, tasks 1.1/1.2/1.4).

Env: OM_SCENE_ID, OM_SANDBOX_DIR, OM_CANONICAL_DIR (optional; history log dir).
1. Runs `claude` with planOnly + Read,Glob,Grep (reviewer cannot write — task 1.1).
2. Captures stdout, tees raw output to <episode>/history/cc_reviewer_{scene_id}.log.
3. Extracts the delimited JSON verdict from stdout via tools/qc/reviewer_runner
   (code-fence stripped) — no verdict file is expected from Claude anymore.
4. Writes packets/{scene_id}_cc_verdict.json AND packets/{scene_id}_findings.json
   on Claude's behalf (task 1.1 item 5).
5. Findings embed "reviewed_hashes": {<scenes_dir>/<resolved filename>: sha256}
   for the reviewed scene file (task 1.2 item 4).
Watchdog expiry writes verdict "timeout_error" instead of a content rejection
(task 1.4); the orchestrator treats that as an infrastructure retry.
Exit 0 always when findings file written (verdict may be 'rejected').
"""
from __future__ import annotations
import hashlib, json, os, subprocess, sys, threading, time
from pathlib import Path

# Import enabler (phase1 minimal; full formalization is Phase 2 Task 2.4):
REPO_ROOT = next(
    (p for p in Path(__file__).resolve().parents if (p / "tools" / "qc" / "reviewer_runner.py").is_file()),
    None,
)
if REPO_ROOT and str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.qc.reviewer_runner import (  # noqa: E402
    DEFAULT_REVIEW_WATCHDOG_S,
    build_reviewer_cmd,
    extract_verdict,
    get_scenes_dir,
    resolve_scene_filename,
)

# Task 1.4: dedicated review watchdog, default 360s.
WATCHDOG_S = int(os.environ.get("OM_CC_REVIEW_WATCHDOG", str(DEFAULT_REVIEW_WATCHDOG_S)))
PROJ_ROOT = Path(__file__).resolve().parents[2]  # projects/<project>

def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()

def main() -> int:
    scene_id = os.environ["OM_SCENE_ID"]
    sandbox = Path(os.environ["OM_SANDBOX_DIR"]).resolve()
    # History log lives in the canonical episode's history/ dir (task 1.1);
    # the orchestrator's scoped reviewer ownership check excludes history/.
    episode = Path(os.environ.get("OM_CANONICAL_DIR") or sandbox).resolve()
    log_dir = episode / "history"
    log_dir.mkdir(parents=True, exist_ok=True)

    packets = sandbox / "packets"
    packets.mkdir(parents=True, exist_ok=True)
    findings_path = packets / f"{scene_id}_findings.json"
    verdict_path = packets / f"{scene_id}_cc_verdict.json"

    # Task 1.2 item 4: hash the reviewed scene file under its resolved name.
    scenes_dir = get_scenes_dir(sandbox)
    target_filename = resolve_scene_filename(scenes_dir, scene_id)
    scene_file = scenes_dir / target_filename
    scene_rel = f"{scenes_dir.name}/{target_filename}"

    reviewed_hashes: dict[str, str] = {}
    if scene_file.is_file():
        reviewed_hashes[scene_rel] = sha256(scene_file)
    else:
        findings_path.write_text(json.dumps({
            "scene_id": scene_id, "verdict": "rejected", "reviewed_hashes": {},
            "issues": [f"writer output {scene_rel} missing in sandbox"],
            "notes": f"writer output {scene_rel} missing in sandbox",
        }, indent=1, ensure_ascii=False))
        print(f"reviewer {scene_id}: scene file missing in sandbox -> rejected")
        return 0

    task = f"""# TASK — independent reviewer {scene_id} (read-only verification)

You are the independent scene reviewer (doctrine §7.1: fresh context, findings only).
Verify the writer output `{scene_rel}` in this sandbox. You do not have write access.

ABSOLUTE RULE — REVIEW ONLY: you must NOT create, delete, edit or patch ANY file.
Fixing syntax/layout yourself is a violation (auto-fail `reviewer_canonical_mutation`).
If you are tempted to edit, you must instead REJECT with the issue list.

Checks (each → issue list entry when violated):
1. File parses as a React/TSX component with a default export.
2. Uses shared contracts (imports from './theme' / './timing' / './lib/SceneShell' or '../../components/...') — no re-implemented copies.
3. Every animation anchor (interpolate input frame / spring condition) stays within scene window [0, window_frames] read from `artifacts/words_{scene_id}.json`; key word anchors match spoken words ±9f; last cue + reveal must end >=45f before scene end — EXCEPTION: when the final spoken-word cue lands after 65% of window_frames, >=20f tail suffices (compact the reveal: shorter duration, no multi-step stagger on the tail block). No overflow past window end.
4. No CSS `transition:` string. No `staticFile(` usage for images. No `<Img` of generated media.
5. Flex-column stacking (no sibling absolute blocks with tops <20px apart); container heights >= children stack + 30px; content distributed across y330–1440, last block ends y1300–1440; right edge x<=940.
6. spring damping >= 20; translateY positive→0; no camera scale/translate.
7. Numbers/labels on screen match the scene spec JSON exactly (whitelist values; caveat labels present when specified).

You do not have write access. Analyze the scene and output your final verdict in this delimiter block:
<!-- VERDICT_START -->
{{
  "scene_id": "{scene_id}",
  "verdict": "approved" | "rejected",
  "issues": ["list of issues if rejected, or empty if approved"],
  "metrics": {{"complexity": "low|medium|high"}}
}}
<!-- VERDICT_END -->
Then end. Max 12 turns, reads <=4, no file writes.
"""
    env = os.environ.copy()
    env["MAX_THINKING_TOKENS"] = "1024"
    cmd = build_reviewer_cmd()
    try:
        proc = subprocess.Popen(cmd, cwd=str(sandbox), env=env, stdin=subprocess.PIPE,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    except Exception as e:
        print(f"REVIEWER SPAWN FAIL {scene_id}: {e}", file=sys.stderr)
        return 1

    # Task 1.4: watchdog fires proc.kill() and flags the timeout distinctly.
    timed_out = False

    def _kill():
        nonlocal timed_out
        time.sleep(WATCHDOG_S)
        if proc.poll() is None:
            proc.kill()
            timed_out = True
    threading.Thread(target=_kill, daemon=True).start()
    stdout_text, _ = proc.communicate(task)

    # Task 1.1 item 3: tee raw reviewer stdout to the history log.
    (log_dir / f"cc_reviewer_{scene_id}.log").write_text(stdout_text or "", encoding="utf-8")

    if timed_out:
        verdict = "timeout_error"
        issues = [f"Reviewer watchdog expired after {WATCHDOG_S}s"]
        data: dict = {}
    else:
        verdict, issues, data = extract_verdict(stdout_text)

    # Task 1.1 item 5: wrapper writes both packet files on Claude's behalf.
    verdict_path.write_text(json.dumps({
        "scene_id": scene_id,
        "verdict": verdict,
        "issues": issues,
        "metrics": data.get("metrics", {}) if isinstance(data, dict) else {},
    }, indent=1, ensure_ascii=False))

    findings_path.write_text(json.dumps({
        "scene_id": scene_id,
        "verdict": verdict,
        "reviewed_hashes": reviewed_hashes,
        "issues": issues,
        "notes": "; ".join(issues) if issues else "ok",
    }, indent=1, ensure_ascii=False))
    print(f"reviewer {scene_id}: cc_exit={proc.returncode} timed_out={timed_out} verdict={verdict}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
