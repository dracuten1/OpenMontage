#!/usr/bin/env python
"""CC reviewer wrapper — MINTED from tools/qc/cc_wrapper_templates (phase 4A.2).

Do not hand-edit: re-mint via ``python -m tools.qc.mint_project_pipeline``.
Strictly read-only toward scene files (video-slowfix phase1, tasks 1.1/1.2/1.4).

Env: OM_SCENE_ID, OM_SANDBOX_DIR, OM_CANONICAL_DIR (optional; history log dir).

Hotfix B + security cycle-2 (2026-11-16): the provider drops the final
message when ``--allowedTools`` OR ``--disallowedTools`` is present (A/B
probe 2026-11-15), so wrapper strips those flags and values. They DO NOT
contain the process after stripping. Actual enforcement: real OS-level write
confinement in ``tools.qc.reviewer_confinement`` (macOS Seatbelt), reviewer
runs in a confined COPY of the staged episode (never canonical source),
least-privilege child environment, and orchestrator ownership snapshot check.
No OS sandbox -> fail closed.

The reviewer still uses ``--dangerously-skip-permissions`` + ``acceptEdits``
because plan/default mode yields empty output; skip-permissions is NOT
containment. CLI tool-scope flags stay out due to provider behavior.

Verdict protocol accepts all supported channels: legacy
``<!-- VERDICT_START -->`` JSON, current ``@@VERDICT_START@@`` plain text,
and reviewer-written findings file (preferred). Empty stdout and no findings
file -> infra ``timeout_error``; wrapper is forbidden from retrying forever.

"""
from __future__ import annotations
import hashlib, json, os, re, shutil, subprocess, sys, threading, time
from pathlib import Path

# Reviewer confinement: tool-scope flags are stripped (provider drops final
# response); real Seatbelt OS write restriction must pass a smoke test.
REPO_ROOT = Path(__file__).resolve().parents[4]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.qc.reviewer_runner import (  # noqa: E402
    DEFAULT_REVIEW_MAX_TURNS,
    DEFAULT_REVIEW_WATCHDOG_S,
    REVIEW_TIMEOUT_VERDICT,
    VERDICT_DELIMITER_RE,
    AT_VERDICT_DELIMITER_RE,
    build_reviewer_cmd,
    strip_tool_scoping_flags,
    extract_verdict,
    extract_at_verdict,
    get_scenes_dir,
    resolve_scene_filename,
)
from tools.qc.reviewer_confinement import (
    plan_review_confinement,
    smoke_test as smoke_test_confinement,
)

# Both legacy HTML JSON and current @@ plain-text verdicts are accepted by
# the shared parser. Tool-scope flags are absent from final argv due provider
# behavior; OS-level Seatbelt confinement is the enforcement boundary.
# Findings are reviewer-written under packets/, but wrapper always re-stamps
# the computed hash and atomically writes canonical wrapper-owned evidence.
# Watchdog is user-configurable, but must remain finite and bounded so a
# malformed or hostile environment value cannot disable reviewer termination.
_MAX_REVIEW_WATCHDOG_S = 3600
_RAW_WATCHDOG = os.environ.get("OM_CC_REVIEW_WATCHDOG", str(DEFAULT_REVIEW_WATCHDOG_S))
try:
    WATCHDOG_S = int(_RAW_WATCHDOG)
except (TypeError, ValueError):
    print(f"WARNING: invalid OM_CC_REVIEW_WATCHDOG={_RAW_WATCHDOG!r}; using default {DEFAULT_REVIEW_WATCHDOG_S}s", file=sys.stderr)
    WATCHDOG_S = DEFAULT_REVIEW_WATCHDOG_S
else:
    if WATCHDOG_S <= 0:
        print(f"WARNING: OM_CC_REVIEW_WATCHDOG must be positive; using default {DEFAULT_REVIEW_WATCHDOG_S}s", file=sys.stderr)
        WATCHDOG_S = DEFAULT_REVIEW_WATCHDOG_S
    elif WATCHDOG_S > _MAX_REVIEW_WATCHDOG_S:
        print(f"WARNING: OM_CC_REVIEW_WATCHDOG exceeds {_MAX_REVIEW_WATCHDOG_S}s; clamping", file=sys.stderr)
        WATCHDOG_S = _MAX_REVIEW_WATCHDOG_S
PROJ_ROOT = Path(__file__).resolve().parents[2]  # projects/<project>

def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()

def _atomic_write_json(path: Path, data: dict) -> None:
    """Atomic wrapper-owned JSON write."""
    import tempfile
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=1, ensure_ascii=False)
        os.replace(tmp_name, path)
    except Exception:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise


def main() -> int:
    scene_id = os.environ["OM_SCENE_ID"]
    sandbox = Path(os.environ["OM_SANDBOX_DIR"]).resolve()
    episode = Path(os.environ.get("OM_CANONICAL_DIR") or sandbox).resolve()
    log_dir = episode / "history"
    log_dir.mkdir(parents=True, exist_ok=True)
    packets = sandbox / "packets"
    packets.mkdir(parents=True, exist_ok=True)
    findings_path = packets / f"{scene_id}_findings.json"
    verdict_path = packets / f"{scene_id}_cc_verdict.json"
    scenes_dir = get_scenes_dir(sandbox)
    target_filename = resolve_scene_filename(scenes_dir, scene_id)
    scene_file = scenes_dir / target_filename
    scene_rel = f"{scenes_dir.name}/{target_filename}"
    if not scene_file.is_file():
        _atomic_write_json(findings_path, {
            "scene_id": scene_id, "verdict": "rejected", "reviewed_hashes": {},
            "issues": [f"writer output {scene_rel} missing in sandbox"],
            "notes": f"writer output {scene_rel} missing in sandbox",
        })
        print(f"reviewer {scene_id}: scene file missing in sandbox -> rejected")
        return 0
    reviewed_hashes = {scene_rel: sha256(scene_file)}
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

You do not have write access to scene files. Write exactly one JSON findings file to `packets/{scene_id}_findings.json` inside this staged workspace: {{"scene_id":"{scene_id}","verdict":"approved|rejected","issues":[],"notes":"ok"}}. Then final message exactly DONE. Max 12 turns, reads <=4.
"""
    # Exactly nine documented OM contract vars; never pass provenance IDs or
    # provider/API credentials. CLI needs ambient login in staged HOME.
    _ENV_ALLOW_KEYS = ("PATH", "HOME", "USER", "SHELL", "TMPDIR")
    _ENV_ALLOW_OM_KEYS = (
        "OM_ROLE", "OM_SCENE_ID", "OM_SANDBOX_DIR", "OM_CANONICAL_DIR",
        "OM_CC_REVIEW_MAX_TURNS", "OM_CC_REVIEW_WATCHDOG",
        "OM_CC_REVIEW_OUTPUT", "OM_CC_REVIEW_STREAM_ATTEMPTS",
        "OM_CC_REVIEW_STREAM_SLEEP",
    )
    env = {k: v for k, v in os.environ.items()
           if k in _ENV_ALLOW_KEYS or k in _ENV_ALLOW_OM_KEYS}
    env["MAX_THINKING_TOKENS"] = "1024"
    max_turns = os.environ.get("OM_CC_REVIEW_MAX_TURNS", DEFAULT_REVIEW_MAX_TURNS)
    mode = os.environ.get("OM_CC_REVIEW_OUTPUT", "text").strip().lower()
    cmd = build_reviewer_cmd(max_turns)
    if mode == "json":
        cmd += ["--output-format", "json"]
    cmd = strip_tool_scoping_flags(cmd)
    # Fixed one-attempt policy. Historical six x 45s sleeps are forbidden.
    requested_attempts = int(os.environ.get("OM_CC_REVIEW_STREAM_ATTEMPTS", "1"))
    if requested_attempts != 1:
        print("reviewer: OM_CC_REVIEW_STREAM_ATTEMPTS forced to 1; no verdict => timeout_error", file=sys.stderr)
    attempts = 1

    confinement = plan_review_confinement(
        real_home=Path(os.environ.get("HOME", str(sandbox))), workspace_seed=sandbox
    )
    child_workspace = confinement.workspace
    child_findings = child_workspace / "packets" / f"{scene_id}_findings.json"
    child_verdict = child_workspace / "packets" / f"{scene_id}_cc_verdict.json"
    child_findings.parent.mkdir(parents=True, exist_ok=True)
    child_log = child_workspace / "history" / f"cc_reviewer_{scene_id}.log"
    child_log.parent.mkdir(parents=True, exist_ok=True)
    child_env = dict(env)
    child_env.update(confinement.env_overrides)
    smoke_ok, smoke_detail = smoke_test_confinement(confinement)
    if not smoke_ok:
        confinement.cleanup()
        print(f"REVIEWER CONFINEMENT FAIL {scene_id}: {smoke_detail}; not launching reviewer", file=sys.stderr)
        return 1
    print(f"reviewer {scene_id}: OS write confinement active ({confinement.kind}; {smoke_detail})")
    # This pins the *post-strip final argv* provider contract. Seatbelt, not
    # this assertion, is the security boundary.
    if any(x in ("--allowedTools", "--disallowedTools") for x in cmd):
        confinement.cleanup()
        print("REVIEWER ARGUMENT CONTRACT FAIL: tool-scope flag survived strip", file=sys.stderr)
        return 1
    child_findings.unlink(missing_ok=True)
    child_verdict.unlink(missing_ok=True)
    task_file = confinement.parent / "task.md"
    task_file.write_text(task, encoding="utf-8")
    warm_file = confinement.parent / "warmup.md"
    warm_file.write_text("Reply with exactly: READY", encoding="utf-8")
    try:
        warm_cmd = strip_tool_scoping_flags(build_reviewer_cmd("3"))
        warm = subprocess.Popen(confinement.child_argv(warm_cmd), cwd=str(child_workspace), env=child_env,
                                stdin=open(warm_file, "r", encoding="utf-8"), stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, text=True)
        try:
            warm.communicate(timeout=120)
        except subprocess.TimeoutExpired:
            warm.kill()
            warm.communicate()
    except Exception as exc:
        print(f"reviewer {scene_id}: warmup skipped ({exc})", file=sys.stderr)
    finally:
        warm_file.unlink(missing_ok=True)
    timed_out = False
    final_rc = None
    stdout_text = ""
    try:
        proc = subprocess.Popen(confinement.child_argv(cmd), cwd=str(child_workspace), env=child_env,
                                stdin=open(task_file, "r", encoding="utf-8"), stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, text=True)
        attempt_timed_out = False
        def _kill(p):
            nonlocal attempt_timed_out
            time.sleep(WATCHDOG_S)
            try:
                if p.poll() is None:
                    p.kill()
                    attempt_timed_out = True
            except Exception:
                pass
        threading.Thread(target=_kill, args=(proc,), daemon=True).start()
        out, _ = proc.communicate()
        if mode == "json":
            try:
                envelope = json.loads(out or "")
                out = envelope.get("result", "") if isinstance(envelope, dict) else out
            except Exception:
                pass
        stdout_text = out or ""
        timed_out = attempt_timed_out
        final_rc = proc.returncode
        with open(child_log, "a", encoding="utf-8") as lf:
            lf.write(f"--- stream attempt 1/1 rc={final_rc} timed_out={timed_out} ---\n{stdout_text}\n")
    except Exception as exc:
        confinement.cleanup()
        print(f"REVIEWER SPAWN FAIL {scene_id}: {exc}", file=sys.stderr)
        return 1
    finally:
        task_file.unlink(missing_ok=True)
    file_findings = None
    try:
        cand = json.loads(child_findings.read_text(encoding="utf-8"))
        if isinstance(cand, dict) and cand.get("verdict") in ("approved", "rejected"):
            file_findings = cand
    except Exception:
        pass
    if file_findings is not None:
        verdict = file_findings["verdict"]
        issues = [str(i) for i in file_findings.get("issues", []) or []]
        data = {"metrics": file_findings.get("metrics", {}) if isinstance(file_findings.get("metrics", {}), dict) else {}}
    elif timed_out:
        verdict, issues, data = REVIEW_TIMEOUT_VERDICT, [f"Reviewer watchdog expired after {WATCHDOG_S}s"], {}
    else:
        verdict, issues, data = extract_verdict(stdout_text)
        if not (VERDICT_DELIMITER_RE.search(stdout_text) or AT_VERDICT_DELIMITER_RE.search(stdout_text)):
            verdict = REVIEW_TIMEOUT_VERDICT
            issues = [f"Reviewer delivered no verdict block (turn cap {max_turns} exhausted or stream truncated) — infra timeout, not a content rejection"]
            data = {}
    _atomic_write_json(verdict_path, {
        "scene_id": scene_id, "verdict": verdict, "issues": issues,
        "metrics": data.get("metrics", {}) if isinstance(data, dict) else {},
    })
    _atomic_write_json(findings_path, {
        "scene_id": scene_id, "verdict": verdict, "reviewed_hashes": reviewed_hashes,
        "issues": issues, "notes": "; ".join(issues) if issues else "ok",
    })
    with open(log_dir / f"cc_reviewer_{scene_id}.log", "a", encoding="utf-8") as lf:
        lf.write(f"--- confined reviewer rc={final_rc} timed_out={timed_out} verdict={verdict} ---\n{stdout_text}\n")
    confinement.cleanup()
    print(f"reviewer {scene_id}: cc_exit={final_rc} timed_out={timed_out} verdict={verdict}")
    return 0
if __name__ == "__main__":
    sys.exit(main())
