#!/usr/bin/env python
"""CC writer wrapper — MINTED from tools/qc/cc_wrapper_templates (phase 4A.2).

Do not hand-edit: re-mint via ``python -m tools.qc.mint_project_pipeline``.
Carries the landed Phase-1/2 semantics plus Phase-4A additions:

- task 1.3: sandboxed output + atomic promotion; per-attempt sandbox dirs.
- task 2.2: transient-API-error jittered exponential backoff
  (``tools.qc.writer_runner.execute_writer_with_backoff``) with the shared
  ``ConcurrencyGovernor`` throttling on a 429 burst.
- task 2.4: static repo-root ``sys.path`` shim (``parents[4]``) so project-local
  execution resolves ``tools.*`` imports from THIS checkout.
- R6 (phase 4A.2): NEVER the ``--permission-mode`` accept-edits mode — it voids
  ``--allowedTools`` scoping (writer mutated the packet in rounds 3-4).
  Default permission mode + explicit ``--allowedTools`` scoping only.
- 4A.1: prior reviewer findings appended to the writer task, gated on
  ``OM_FINDINGS_INJECT`` (default ON; ``=0`` disables both sides).
- 4A.3 (phase-3 task 3.2 pull-forward): SceneShell pre-seed header prepended
  to the task + ``validate_imports_and_theme`` fast pre-check on the sandbox
  output BEFORE the 240s ``npx tsc --noEmit`` spend — a missing mandatory
  import rejects the output immediately.

Env: OM_SCENE_ID, OM_EPISODE_DIR, OM_ATTEMPT_INDEX (optional, default "0").
Kill-switch: OM_LEGACY_QUARANTINE=1 restores the legacy pre-phase1 behavior
(Claude writes the canonical scene file directly; own-output pre-clean, no
sandbox, no promotion) — with the same scoped, accept-edits-free CLI.
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

# --- Phase 4A.1: prior reviewer findings injection (OM_FINDINGS_INJECT gate) --
FINDINGS_INJECT_ENV = "OM_FINDINGS_INJECT"
FINDINGS_FILE = PROJ_ROOT / "history/cc_findings" / "{scene_id}_latest.md"
FINDINGS_MAX_CHARS = 4000


def _findings_inject_enabled() -> bool:
    """Single if-gate (default ON: env absent = inject; =0 disables)."""
    return os.environ.get(FINDINGS_INJECT_ENV, "1") != "0"


def _prior_findings_block(scene_id: str, attempt_idx: str) -> str | None:
    """Load the canonical findings markdown into a task-append block.

    Canonical path base is the PROJECT ROOT (PROJ_ROOT = projects/<slug>/),
    matching the orchestrator-side writer (scene_orchestrator.write_scene_findings_md).
    Text is hard-capped at FINDINGS_MAX_CHARS to protect the writer context.
    """
    if not _findings_inject_enabled():
        return None
    path = Path(str(FINDINGS_FILE).format(scene_id=scene_id))
    if not path.is_file():
        return None
    try:
        text = path.read_text(encoding="utf-8")[:FINDINGS_MAX_CHARS]
    except OSError:
        return None
    if not text.strip():
        return None
    return (
        "\n## PRIOR REVIEWER ISSUES (attempt "
        + attempt_idx
        + " — fix ALL of these in this rewrite)\n"
        + text
        + "\n"
    )


# --- Phase 4A.3: SceneShell pre-seed header + import pre-flight --------------
# Ported verbatim from phase3-plan task 3.2 (single owner: this template's
# pre-flight; prompts/scene_generation_prompt.py does not exist in OM).
SCENE_SHELL_IMPORT_HEADER = """import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { SceneShell } from 'remotion-composer/src/common/SceneShell';
import { THEME_KEYS } from 'remotion-composer/src/common/theme';
"""

REQUIRED_SCENE_IMPORTS = [
    "remotion-composer/src/common/SceneShell",
    "remotion",
]


def validate_imports_and_theme(scene_tsx_content: str) -> tuple[bool, str]:
    """Fast AST/regex pre-check (phase-3 task 3.2, verbatim logic).

    Returns ``(ok, message)`` — ``(False, "Missing mandatory import: ...")``
    when a required import substring is absent from the scene source.
    """
    required_imports = list(REQUIRED_SCENE_IMPORTS)
    for req in required_imports:
        if req not in scene_tsx_content:
            return False, f"Missing mandatory import: {req}"
    return True, "OK"


# --- R6: scoped writer CLI — never the accept-edits permission mode ---------
def _writer_cmd() -> list[str]:
    """Writer CLI invocation. R6: the accept-edits permission mode voids ``--allowedTools``
    scoping (writer mutated the review packet). Default permission mode keeps
    the ``--allowedTools`` whitelist enforced; no permission-mode flag passed.
    """
    return [
        "claude", "--print", "--dangerously-skip-permissions",
        "--allowedTools", "Read,Edit,Write,Bash,Glob,Grep",
        "--max-turns", MAX_TURNS,
    ]


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


def _log_prior_findings(log_path: Path, block: str) -> None:
    """Record the injected findings block in the history log (auditable +
    grep-able: 'PRIOR REVIEWER ISSUES' appears on every injecting attempt)."""
    try:
        with open(log_path, "a", encoding="utf-8") as fp:
            fp.write("===== PRIOR REVIEWER ISSUES injected into task =====\n")
            fp.write(block)
            fp.write("===== end PRIOR REVIEWER ISSUES =====\n")
    except OSError:
        pass  # a failed log write must not kill the writer session


def _legacy_main(scene_id: str, episode: Path, task_file: Path, log_dir: Path) -> int:
    """OM_LEGACY_QUARANTINE=1 escape hatch: pre-phase1 behavior (scoped CLI)."""
    nn = f"{int(scene_id.split('-')[-1]):02d}"
    log_path = log_dir / f"cc_writer_{scene_id}.log"
    scene_file = episode / f"scenes/S{nn}.tsx"

    task = task_file.read_text(encoding="utf-8")
    block = _prior_findings_block(scene_id, os.environ.get("OM_ATTEMPT_INDEX", "0"))
    if block:
        task = task + block
        _log_prior_findings(log_path, block)
    env = os.environ.copy()
    env["MAX_THINKING_TOKENS"] = "1024"
    cmd = _writer_cmd()

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
        # 4A.3 pre-flight (fast check BEFORE the 240s tsc spend).
        scene_src = scene_file.read_text(encoding="utf-8", errors="replace")
        pre_ok, pre_msg = validate_imports_and_theme(scene_src)
        if not pre_ok:
            print(f"writer {scene_id}: PRE-FLIGHT FAIL: {pre_msg}")
            return 1
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
    # 4A.3: SceneShell pre-seed header goes FIRST (before the sandbox-mode
    # preamble) so the writer sees the canonical import block up front.
    task = (
        "## CANONICAL IMPORT HEADER (phase-3 task 3.2 pre-seed — use these)\n"
        "```tsx\n" + SCENE_SHELL_IMPORT_HEADER + "```\n\n"
        "## SANDBOX OUTPUT MODE (phase1 task 1.3)\n"
        f"Write your final scene component EXCLUSIVELY to `{sandbox.relative_to(episode)}/{scene_id}.tsx` "
        "(create parent dirs as needed). Do NOT write or edit any file under "
        f"`{scenes_dir.name}/` directly — the wrapper promotes your sandbox output "
        "atomically after validation.\n\n"
    ) + task_file.read_text(encoding="utf-8")
    # 4A.1: prior reviewer findings appended, gated on OM_FINDINGS_INJECT.
    block = _prior_findings_block(scene_id, attempt_idx)
    if block:
        task = task + block
        _log_prior_findings(log_path, block)

    env = os.environ.copy()
    env["MAX_THINKING_TOKENS"] = "1024"
    cmd = _writer_cmd()

    # Task 2.2: jittered exponential backoff around the writer session. On a
    # 429 burst the governor reserves permits (throttles 6 -> 4) before the
    # backoff sleep; each retry starts from a fresh sandbox (task 1.3), and
    # every attempt carries the phase1 watchdog kill timer (task 1.4).
    governor = ConcurrencyGovernor(max_concurrency=resolve_max_concurrency()[0])

    def _reset_sandbox():
        shutil.rmtree(sandbox, ignore_errors=True)
        sandbox.mkdir(parents=True, exist_ok=True)

    # Review fix 3: phase 1 streamed the writer session live into the history
    # log. Pass an open handle so every attempt is delimited and streamed as
    # it is produced — SIGKILL/OOM and retry storms no longer lose output.
    log_fp = None
    try:
        log_fp = open(log_path, "a", encoding="utf-8")
    except OSError as e:
        print(f"writer {scene_id}: history log open failed (buffered only): {e}")

    t0 = time.time()
    returncode, _ = execute_writer_with_backoff(
        cmd, episode, env, task, governor,
        watchdog_seconds=WATCHDOG_S,
        on_retry=_reset_sandbox,
        log_handle=log_fp,
    )
    if log_fp is not None:
        log_fp.close()
    dur = time.time() - t0

    if not (sandbox_file.is_file() and sandbox_file.stat().st_size > 200):
        print(f"writer {scene_id}: exit={returncode} dur={dur:.0f}s file=MISSING (sandbox)")
        return 1

    # 4A.3 pre-flight: fast import check BEFORE the 240s npx tsc spend — a
    # missing mandatory import rejects the output immediately (orchestrator
    # re-prompts with a fresh attempt; no TSC time burned on a broken file).
    scene_src = sandbox_file.read_text(encoding="utf-8", errors="replace")
    pre_ok, pre_msg = validate_imports_and_theme(scene_src)
    if not pre_ok:
        print(f"writer {scene_id}: PRE-FLIGHT FAIL: {pre_msg}")
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
