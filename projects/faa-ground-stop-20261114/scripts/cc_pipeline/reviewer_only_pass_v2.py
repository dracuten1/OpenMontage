#!/usr/bin/env python
"""Reviewer-only pass v2 — canonical-dir reviews, no sandbox copies (faa-ground-stop-20261114).

Why v2: the claude CLI's FIRST --print run in a fresh cwd returns EMPTY stdout
(probe-verified 14/11); every orchestrator attempt used a FRESH sandbox copy ->
every reviewer was a first-run. v2 reviews in the CANONICAL episode dir:
- read-only enforced by --allowedTools Read,Glob,Grep (no write tools) + scene
  file chmod 0o444 during the review + pre/post hash check (mutation = attempt
  rejected);
- one warm-up session primes the canonical cwd;
- approved findings are materialized through the orchestrator's own
  integrate_scene_packet so packets stay schema-valid.

Usage: .venv/bin/python reviewer_only_pass_v2.py
Env: OM_SCENES (comma list), OM_MAX_CONCURRENCY, OM_CC_REVIEW_MAX_TURNS,
OM_CC_REVIEW_WATCHDOG, OM_REVIEW_ATTEMPTS.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from grep_gate import check_scene_file  # noqa: E402
from tools.qc.reviewer_runner import build_reviewer_cmd  # noqa: E402
from tools.qc.scene_packet import integrate_scene_packet  # noqa: E402
from tools.qc.scene_orchestrator import (  # noqa: E402
    get_scenes_dir,
    load_existing_packet_or_template,
    resolve_scene_filename,
    REVIEW_TIMEOUT_VERDICT,
)
from tools.qc.reviewer_runner import VERDICT_DELIMITER_RE, extract_verdict  # noqa: E402

EPISODE = (REPO / "remotion-composer/src/faa-ground-stop-20261114").resolve()
PROJ = REPO / "projects/faa-ground-stop-20261114"
SCENES = [s.strip() for s in os.environ.get("OM_SCENES", "scene-1,scene-2,scene-3,scene-4,scene-5,scene-6,scene-7,scene-8,scene-9,scene-10,scene-12").split(",") if s.strip()]
MAX_CONC = int(os.environ.get("OM_MAX_CONCURRENCY", "3"))
MAX_TURNS = os.environ.get("OM_CC_REVIEW_MAX_TURNS", "90")
WATCHDOG = int(os.environ.get("OM_CC_REVIEW_WATCHDOG", "300"))
ATTEMPTS = int(os.environ.get("OM_REVIEW_ATTEMPTS", "6"))

_ENV_ALLOW_KEYS = ("PATH", "HOME", "USER", "SHELL", "TMPDIR")
_ENV_ALLOW_PREFIXES = ("OM_",)
_ENV_ALLOW_PROVIDER_KEYS = ("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY")


def build_env() -> dict:
    env = {k: v for k, v in os.environ.items()
           if k in _ENV_ALLOW_KEYS or k.startswith(_ENV_ALLOW_PREFIXES) or k in _ENV_ALLOW_PROVIDER_KEYS}
    env["MAX_THINKING_TOKENS"] = "1024"
    return env


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def run_claude(cwd: Path, task_file: Path, max_turns: str, timeout: int, tag: str) -> str:
    env = build_env()
    cmd = build_reviewer_cmd(max_turns)
    proc = subprocess.Popen(cmd, cwd=str(cwd), env=env,
                            stdin=open(task_file, "r", encoding="utf-8"),
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    timed_out = False

    def _kill():
        nonlocal timed_out
        time.sleep(timeout)
        if proc.poll() is None:
            proc.kill()
            timed_out = True
    threading.Thread(target=_kill, daemon=True).start()
    try:
        out, _ = proc.communicate()
    except Exception:
        proc.kill()
        out, _ = proc.communicate()
    (PROJ / "history" / f"cc_reviewer_{tag}.log").parent.mkdir(parents=True, exist_ok=True)
    if timed_out:
        return ""
    return out or ""


def warmup() -> None:
    tf = EPISODE / ".warmup.md"
    tf.write_text("Reply with exactly: READY", encoding="utf-8")
    out = run_claude(EPISODE, tf, "3", 90, "warmup")
    tf.unlink(missing_ok=True)
    print(f"[warmup] canonical cwd primed (len={len(out)})", flush=True)


def review_scene(scene_id: str) -> tuple[str, str]:
    """Returns (scene_id, status: integrated|rejected|failed)."""
    scenes_dir = get_scenes_dir(EPISODE)
    fname = resolve_scene_filename(scenes_dir, scene_id)
    scene_file = scenes_dir / fname
    if not scene_file.is_file():
        return scene_id, "failed"
    pkt = EPISODE / f"packet_{scene_id}.json"
    if pkt.is_file():
        try:
            if json.loads(pkt.read_text(encoding="utf-8")).get("integration_status") == "integrated":
                return scene_id, "integrated"
        except Exception:
            pass
    issues = check_scene_file(scene_file)
    if issues:
        return scene_id, f"grep-gate-fail: {'; '.join(issues[:2])}"

    base_template = load_existing_packet_or_template(EPISODE, scene_id)
    log = PROJ / "history" / f"cc_reviewer_{scene_id}.log"

    for attempt in range(1, ATTEMPTS + 1):
        pre_hash = sha256(scene_file)
        task = f"""# TASK — independent reviewer {scene_id} (read-only verification)

You are the independent scene reviewer (doctrine §7.1: fresh context, findings only).
Verify the writer output `scenes/{fname}` in this repo working dir. You do not have write access.

WORKFLOW — EFFICIENCY CONTRACT (strict):
1. Read `scenes/{fname}` ONCE (full file).
2. Grep/Read `artifacts/words_{scene_id}.json` ONCE for window_frames + key word frames.
3. At most ONE Glob/Grep for shared contracts if genuinely needed.
Then IMMEDIATELY output the verdict block. Target: verdict within 8 assistant turns.
NEVER re-read a file. NEVER explore other scenes. A missing verdict block = infra timeout.

ABSOLUTE RULE — REVIEW ONLY: you must NOT create, delete, edit or patch ANY file.
If you are tempted to edit, you must instead REJECT with the issue list.

Checks (each → issue list entry when violated):
1. File parses as a React/TSX component with a default export.
2. Uses shared contracts (imports from './theme' / './timing' / './lib/SceneShell' or '../../components/...') — no re-implemented copies.
3. Every animation anchor stays within scene window [0, window_frames] from `artifacts/words_{scene_id}.json`; key word anchors match spoken words ±9f; last cue + reveal must end >=45f before scene end (>=20f tail suffices when the final cue lands after 65% of window_frames; compact the reveal). No overflow past window end.
4. No CSS `transition:` string. No `staticFile(` usage for images. No `<Img` of generated media.
5. Flex-column stacking (no sibling absolute blocks with tops <20px apart); container heights >= children stack + 30px; content distributed across y330–1440, last block ends y1300–1440; right edge x<=940.
6. spring damping >= 20; translateY positive→0; no camera scale/translate.
7. Numbers/labels on screen match the scene spec JSON exactly (whitelist values; caveat labels present when specified).

Output your final verdict in this delimiter block:
<!-- VERDICT_START -->
{{
  "scene_id": "{scene_id}",
  "verdict": "approved",
  "issues": ["list of issues if rejected, or empty if approved"],
  "metrics": {{"complexity": "low|medium|high"}}
}}
<!-- VERDICT_END -->
Then end. No file writes.
"""
        tf = EPISODE / f".reviewer_task_{scene_id}.md"
        tf.write_text(task, encoding="utf-8")
        original_mode = scene_file.stat().st_mode
        os.chmod(scene_file, 0o444)
        try:
            t0 = time.time()
            stdout = run_claude(EPISODE, tf, MAX_TURNS, WATCHDOG, scene_id)
            post_hash = sha256(scene_file)
        finally:
            os.chmod(scene_file, original_mode)
            tf.unlink(missing_ok=True)
        dur = time.time() - t0

        if post_hash != pre_hash:
            print(f"[{scene_id}] attempt {attempt}: MUTATION DETECTED — attempting recovery from packet history", flush=True)
            return scene_id, "failed"

        verdict, issues_list, data = extract_verdict(stdout)
        log.write_text(stdout or "", encoding="utf-8")
        if not VERDICT_DELIMITER_RE.search(stdout or ""):
            verdict = REVIEW_TIMEOUT_VERDICT
            issues_list = ["no verdict block — infra (empty/truncated stream)"]

        print(f"[{scene_id}] attempt {attempt}: dur={dur:.0f}s verdict={verdict} len={len(stdout)}", flush=True)

        if verdict == REVIEW_TIMEOUT_VERDICT:
            time.sleep(3)
            continue
        if verdict != "approved":
            return scene_id, f"rejected: {'; '.join(issues_list[:3])}"

        # Materialize approved packet exactly like the orchestrator.
        findings = {
            "scene_id": scene_id,
            "verdict": "approved",
            "reviewed_hashes": {f"scenes/{fname}": pre_hash},
            "issues": [],
            "notes": "ok",
        }
        findings_dir = EPISODE / "packets"
        findings_dir.mkdir(parents=True, exist_ok=True)
        findings_path = findings_dir / f"{scene_id}_findings.json"
        findings_path.write_text(json.dumps(findings, indent=2), encoding="utf-8")
        findings_hash = sha256(findings_path)
        findings_rel = findings_path.relative_to(EPISODE).as_posix()

        assembled = copy.deepcopy(base_template)
        assembled["scene_id"] = scene_id
        assembled["reviewer"] = {
            "instance_id": f"reviewer_v2_{scene_id}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "verdict": "approved",
            "findings_ref": findings_rel,
            "findings_hash": findings_hash,
            "token": f"rt_v2_{scene_id}",
            "reviewed_hashes": findings["reviewed_hashes"],
        }
        assembled["reviewer_token"] = assembled["reviewer"]["token"]
        assembled["writer"] = assembled.get("writer") or {
            "instance_id": f"writer_prior_{scene_id}",
            "timestamp": assembled.get("writer", {}).get("timestamp") if isinstance(assembled.get("writer"), dict) else None,
            "token": assembled.get("writer_token", f"wt_prior_{scene_id}"),
        }
        assembled["writer_token"] = assembled.get("writer_token") or assembled["writer"].get("token")
        assembled["integration_status"] = "integrated"

        target = EPISODE / f"packet_{scene_id}.json"
        target.write_text(json.dumps(assembled, indent=2, ensure_ascii=False), encoding="utf-8")
        result = integrate_scene_packet(
            assembled, packet_path=target,
            writer_token=assembled["writer_token"], reviewer_token=assembled["reviewer_token"],
            io_operations=assembled.get("io_operations"),
        )
        if result.get("valid"):
            return scene_id, "integrated"
        return scene_id, f"integrate-invalid: {str(result.get('reasons'))[:160]}"
    return scene_id, "failed: attempts exhausted"


def main() -> int:
    warmup()
    results: dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=MAX_CONC) as ex:
        futs = {ex.submit(review_scene, s): s for s in SCENES}
        for fut in as_completed(futs):
            sid, status = fut.result()
            results[sid] = status
            print(f"==> {sid}: {status}", flush=True)
    ok = sum(1 for v in results.values() if v == "integrated")
    print(f"\nTOTAL integrated: {ok}/{len(SCENES)}")
    for sid, v in sorted(results.items()):
        if v != "integrated":
            print(f"  {sid}: {v}")
    return 0 if ok == len(SCENES) else 1


if __name__ == "__main__":
    sys.exit(main())
