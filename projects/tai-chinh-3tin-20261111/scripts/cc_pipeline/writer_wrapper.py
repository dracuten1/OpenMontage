#!/usr/bin/env python
"""CC writer wrapper — sandboxed output + atomic promotion (video-slowfix phase1, task 1.3).

Phase 2 task 2.2: the writer session runs under jittered exponential backoff
(``tools/qc/writer_runner.execute_writer_with_backoff``) — transient API
errors (429 / 5xx / overloaded) retry up to 4 attempts with the shared
``ConcurrencyGovernor`` throttling live concurrency on a 429 burst.

Env: OM_SCENE_ID, OM_EPISODE_DIR, OM_ATTEMPT_INDEX (optional, default "0").
Kill-switch: OM_LEGACY_QUARANTINE=1 restores the legacy pre-phase1 behavior
exactly (Claude writes the canonical scene file directly; own-output pre-clean,
no sandbox, no promotion). Default (unset/0) runs the sandboxed flow:

1. Claude runs with cwd=episode (full task context) but is instructed to write
   its scene EXCLUSIVELY to `.tmp_sandboxes/{scene_id}_{attempt_idx}/{scene_id}.tsx`.
2. The wrapper stages the sandbox output to `scenes/.tmp_{scene_id}.tsx`, runs
   the own-scene TSC self-check against the staged file, then promotes
   atomically: `os.replace(tmp_target, canonical_target)` under `promo_mutex`.
3. No un-scoped deletions: the canonical scene file is only ever replaced by
   the atomic promotion, never unlinked or swept by mtime.

Exit 0 only when the canonical scene file is present (>200 bytes).
"""
from __future__ import annotations
import os, shutil, subprocess, sys, threading, time
from pathlib import Path

# Task 2.4: single source of truth — static repo-root resolution
# (projects/<proj>/scripts/cc_pipeline/<file>.py -> parents[4] = repo root).
REPO_ROOT = Path(__file__).resolve().parents[4]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.qc.concurrency_governor import ConcurrencyGovernor, resolve_max_concurrency  # noqa: E402
from tools.qc.scene_orchestrator import get_scenes_dir, resolve_scene_filename  # noqa: E402
from tools.qc.writer_runner import execute_writer_with_backoff  # noqa: E402

WATCHDOG_S = int(os.environ.get("OM_CC_WATCHDOG", "420"))
MAX_TURNS = os.environ.get("OM_CC_MAX_TURNS", "60")
PROJ_ROOT = Path(__file__).resolve().parents[2]  # projects/<project>

# Task 1.3: promotion mutex. Writer wrappers run as separate OS processes, so
# the cross-process safety actually comes from os.replace()'s atomicity; the
# mutex additionally serializes promotions inside one process.
promo_mutex = threading.Lock()


def _spawn_claude(cmd: list[str], cwd: Path, env: dict, log_path: Path):
    try:
        return subprocess.Popen(cmd, cwd=str(cwd), env=env, stdin=subprocess.PIPE,
                                stdout=open(log_path, "wb"), stderr=subprocess.STDOUT, text=True)
    except Exception as e:
        print(f"WRITER SPAWN FAIL: {e}", file=sys.stderr)
        return None


def _tsc_own_scene_fail(episode: Path, scene_id: str) -> tuple[bool, str]:
    """Run the composer-wide tsc self-check; return (own_scene_failed, output)."""
    composer = next((p for p in [episode, *episode.parents]
                     if (p / "tsconfig.json").is_file() and (p / "package.json").is_file()), None)
    if not composer:
        return False, ""
    try:
        tsc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(composer),
                             capture_output=True, text=True, timeout=240)
        own = [l for l in (tsc.stdout + tsc.stderr).splitlines() if scene_id in l]
        if tsc.returncode != 0 and own:
            return True, "\n".join(own)[:2000]
    except subprocess.TimeoutExpired:
        print(f"writer {scene_id}: tsc self-check timed out (non-fatal)")
    return False, ""


def _legacy_main(scene_id: str, episode: Path, task_file: Path, log_dir: Path) -> int:
    """OM_LEGACY_QUARANTINE=1 escape hatch: pre-phase1 behavior, unchanged."""
    nn = f"{int(scene_id.split('-')[-1]):02d}"
    log_path = log_dir / f"cc_writer_{scene_id}.log"
    scene_file = episode / f"scenes/S{nn}.tsx"

    task = task_file.read_text(encoding="utf-8")
    env = os.environ.copy()
    env["MAX_THINKING_TOKENS"] = "1024"
    cmd = ["claude", "--print", "--dangerously-skip-permissions",
           "--permission-mode", "acceptEdits",
           "--allowedTools", "Read,Edit,Write,Bash,Glob,Grep",
           "--max-turns", MAX_TURNS]

    t0 = time.time()
    # Pre-clean own stale outputs (retries start fresh) + quarantine dir
    scene_file.unlink(missing_ok=True)
    (episode / f"artifacts/{scene_id}_notes.md").unlink(missing_ok=True)
    quarantine = PROJ_ROOT / "history/cc_quarantine"
    quarantine.mkdir(parents=True, exist_ok=True)
    proc = _spawn_claude(cmd, episode, env, log_path)
    if proc is None:
        return 1

    def _kill():
        time.sleep(WATCHDOG_S)
        if proc.poll() is None:
            proc.kill()
    threading.Thread(target=_kill, daemon=True).start()
    proc.communicate(task)
    dur = time.time() - t0

    ok = scene_file.is_file() and scene_file.stat().st_size > 200
    # NOTE: no mtime-window quarantine here — with concurrent writers (conc>1)
    # another scene's wrapper owns the other S*.tsx files; moving them by
    # mtime window cross-deletes live outputs (infinite retry loop).
    # Fail fast: compile errors in own scene -> orchestrator retries writer
    # immediately instead of burning a full reviewer round on a broken file.
    if ok:
        failed, out = _tsc_own_scene_fail(episode, scene_id)
        if failed:
            print(f"writer {scene_id}: TSC FAIL (own scene):\n{out}")
            return 1
    print(f"writer {scene_id}: exit={proc.returncode} dur={dur:.0f}s file={'OK' if ok else 'MISSING'}")
    return 0 if ok else 1


def _sandboxed_main(scene_id: str, episode: Path, attempt_idx: str,
                    task_file: Path, log_dir: Path) -> int:
    """Default flow (task 1.3): sandboxed output + atomic promotion."""
    scenes_dir = get_scenes_dir(episode)
    target_filename = resolve_scene_filename(scenes_dir, scene_id)
    canonical_target = scenes_dir / target_filename
    tmp_target = scenes_dir / f".tmp_{scene_id}.tsx"

    # Fresh per-attempt sandbox: {scene_id}_{attempt_idx}
    sandbox = episode / ".tmp_sandboxes" / f"{scene_id}_{attempt_idx}"
    shutil.rmtree(sandbox, ignore_errors=True)
    sandbox.mkdir(parents=True, exist_ok=True)
    sandbox_file = sandbox / f"{scene_id}.tsx"

    log_path = log_dir / f"cc_writer_{scene_id}.log"
    task = (
        "## SANDBOX OUTPUT MODE (phase1 task 1.3)\n"
        f"Write your final scene component EXCLUSIVELY to `{sandbox.relative_to(episode)}/{scene_id}.tsx` "
        "(create parent dirs as needed). Do NOT write or edit any file under "
        f"`{scenes_dir.name}/` directly — the wrapper promotes your sandbox output "
        "atomically after validation.\n\n"
    ) + task_file.read_text(encoding="utf-8")

    env = os.environ.copy()
    env["MAX_THINKING_TOKENS"] = "1024"
    cmd = ["claude", "--print", "--dangerously-skip-permissions",
           "--permission-mode", "acceptEdits",
           "--allowedTools", "Read,Edit,Write,Bash,Glob,Grep",
           "--max-turns", MAX_TURNS]

    # Task 2.2: jittered exponential backoff around the writer session. On a
    # 429 burst the governor reserves permits (throttles 6 -> 4) before the
    # backoff sleep; each retry starts from a fresh sandbox (task 1.3), and
    # every attempt carries the phase1 watchdog kill timer (task 1.4).
    governor = ConcurrencyGovernor(max_concurrency=resolve_max_concurrency()[0])

    def _reset_sandbox():
        shutil.rmtree(sandbox, ignore_errors=True)
        sandbox.mkdir(parents=True, exist_ok=True)

    t0 = time.time()
    returncode, stdout = execute_writer_with_backoff(
        cmd, episode, env, task, governor,
        watchdog_seconds=WATCHDOG_S,
        on_retry=_reset_sandbox,
    )
    # Tee the captured session output (stdout+stderr merged) to the history log.
    try:
        log_path.write_text(stdout or "", encoding="utf-8")
    except OSError as e:
        print(f"writer {scene_id}: history log write failed (non-fatal): {e}")
    dur = time.time() - t0

    if not (sandbox_file.is_file() and sandbox_file.stat().st_size > 200):
        print(f"writer {scene_id}: exit={returncode} dur={dur:.0f}s file=MISSING (sandbox)")
        return 1

    # Stage for validation, then promote atomically. No un-scoped deletion of
    # the canonical scene file ever happens in this path.
    tmp_target.unlink(missing_ok=True)
    shutil.copyfile(sandbox_file, tmp_target)
    failed, out = _tsc_own_scene_fail(episode, scene_id)
    if failed:
        tmp_target.unlink(missing_ok=True)
        print(f"writer {scene_id}: TSC FAIL (own scene):\n{out}")
        return 1

    with promo_mutex:
        os.replace(tmp_target, canonical_target)

    ok = canonical_target.is_file() and canonical_target.stat().st_size > 200
    print(f"writer {scene_id}: exit={returncode} dur={dur:.0f}s file={'OK' if ok else 'MISSING'} (promoted)")
    return 0 if ok else 1


def main() -> int:
    scene_id = os.environ["OM_SCENE_ID"]
    episode = Path(os.environ["OM_EPISODE_DIR"]).resolve()
    task_file = PROJ_ROOT / "history/scene_tasks" / f"{scene_id}.task.md"
    log_dir = PROJ_ROOT / "history"
    log_dir.mkdir(parents=True, exist_ok=True)
    if os.environ.get("OM_LEGACY_QUARANTINE", "0") == "1":
        return _legacy_main(scene_id, episode, task_file, log_dir)
    attempt_idx = os.environ.get("OM_ATTEMPT_INDEX", "0")
    return _sandboxed_main(scene_id, episode, attempt_idx, task_file, log_dir)

if __name__ == "__main__":
    sys.exit(main())
