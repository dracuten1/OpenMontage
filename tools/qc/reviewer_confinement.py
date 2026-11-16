"""OS-level confinement for the CC reviewer child process (wave1 sec-cycle2).

WHY (security review 2026-11-16): the reviewer CLI runs with
``--dangerously-skip-permissions`` and the provider drops the final message
when ``--allowedTools``/``--disallowedTools`` are present, so the wrapper
strips both flags — meaning CLI tool-scoping is NOT a containment layer.
The remaining containment layers are the staged review workspace, the
whitelisted child env, the orchestrator's reviewer-ownership snapshot check,
and — THIS module — a real OS-level sandbox that denies every filesystem
write outside a single staging root.

macOS implementation: ``/usr/bin/sandbox-exec`` (Seatbelt) with the profile

    (version 1)
    (allow default)
    (deny file-write* (require-not (subpath "<STAGING-ROOT>")))

i.e. every write whose resolved target is NOT under the staging root is
denied (create/append/rename/unlink all included; symlink escape is blocked
because the kernel evaluates the resolved vnode path). Empirically verified
on macOS 26.5 (sandbox-exec present, deny/allow precedence measured — a
generic ``(allow file-write* (subpath X))`` does NOT override a
``(deny file-write*)``, and ``(require-not (or ...))`` only honors its first
clause, which is why the profile uses exactly ONE staging root and puts the
child HOME/TMPDIR *inside* it).

Staging layout (created per reviewer run, removed afterwards)::

    <staging-root>/
      workspace/     # claude's cwd — the staged episode copy it may mutate
      home/          # staged HOME (claude session state lands here, not in
                     #   the real ~/.claude; auth settings copied in)
      tmp/           # staged TMPDIR
      reviewer.sb    # the seatbelt profile itself

Linux: bubblewrap (``bwrap``) is recognized but NOT implemented here; the
capability probe reports ``none`` with the reason and callers must fail
closed. No unsafe fallback exists.

Truthful-capability contract: ``confinement_kind()`` never guesses. A
wrapper without verified confinement MUST NOT launch reviewer.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

# No unsafe override: reviewer child MUST be OS-confined.

_SANDBOX_EXEC = Path("/usr/bin/sandbox-exec")

# Copy list for the staged HOME: auth/config the claude CLI needs to boot.
# Session/history dirs (projects/, file-history/, shell-snapshots/) are
# deliberately NOT copied — the staged home starts clean, keeps the real
# ~/.claude pristine, and any writes land inside the staging root anyway.
_HOME_COPY_FILES = (
    ".claude.json",
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".claude/credentials.json",
)
_HOME_COPY_DIRS = (
    ".claude/skills",
)

# Same ignore set as scene_orchestrator.create_reviewer_sandbox plus the
# heavyweight dependency tree the reviewer never reads.
_WORKSPACE_IGNORE = shutil.ignore_patterns(".tmp_*", "__pycache__", "*.pyc",
                                           ".git", "node_modules")


def confinement_kind() -> tuple[str, str]:
    """``(kind, reason)`` for THIS host. kind is ``seatbelt`` when a working
    sandbox-exec is present, ``bwrap``/``none`` otherwise (bwrap is
    recognized-but-unimplemented; ``none`` means fail-closed territory)."""
    if _SANDBOX_EXEC.is_file():
        return "seatbelt", f"{_SANDBOX_EXEC} present"
    if shutil.which("bwrap"):
        return "none", "bwrap present but not implemented for reviewer confinement"
    return "none", "no OS sandbox available (no sandbox-exec, no bwrap)"


@dataclass
class ConfinementPlan:
    """Everything a caller needs to launch a confined reviewer child."""

    kind: str
    parent: Path                    # the single allowed write root (resolved)
    workspace: Path                 # claude's cwd (under parent)
    home: Path                      # staged HOME (under parent)
    tmp: Path                       # staged TMPDIR (under parent)
    profile_path: Path | None       # seatbelt profile (None when unconfined)
    argv_prefix: list[str] = field(default_factory=list)
    env_overrides: dict = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)

    def child_argv(self, cmd: list[str]) -> list[str]:
        """The FULL argv to spawn: confinement prefix + the wrapped command."""
        return [*self.argv_prefix, *cmd]

    def cleanup(self) -> None:
        shutil.rmtree(self.parent, ignore_errors=True)


def _seatbelt_profile_text(parent: Path) -> str:
    resolved = str(parent.resolve())
    return (
        "(version 1)\n"
        "(allow default)\n"
        f"(deny file-write* (require-not (subpath \"{resolved}\")))\n"
    )


def stage_home(real_home: Path, parent: Path) -> Path:
    """Materialize ``parent/home`` with the config files the claude CLI needs.

    Missing files are simply skipped — a staged home with no ``.claude.json``
    boots claude fresh (verified on the probe runs; fail-loud behavior
    upstream if auth is genuinely required)."""
    staged = parent / "home"
    staged.mkdir(parents=True, exist_ok=True)
    for rel in _HOME_COPY_FILES:
        src = Path(real_home) / rel
        if src.is_file():
            dst = staged / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
    for rel in _HOME_COPY_DIRS:
        src = Path(real_home) / rel
        if src.is_dir():
            shutil.copytree(src, staged / rel, dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    return staged


def plan_review_confinement(
    real_home: Path | None = None,
    workspace_seed: Path | None = None,
    parent_prefix: str = "om_review_confinement_",
) -> ConfinementPlan:
    """Build a confinement plan (macOS seatbelt; nothing else for now).

    ``workspace_seed`` (optional) is staged-copy source: its content is
    copied into ``parent/workspace`` (the dir the reviewer child may write).
    When the caller already staged a workspace elsewhere (e.g. the
    orchestrator's per-scene sandbox), pass it here — the confinement copy
    is what the UNTRUSTED child actually runs in, so the caller's copy
    doubles as the seed and stays outside the child's write reach.

    NOTE: this function does NOT probe enforcement; call ``smoke_test`` on
    the returned plan before launching a real child.
    """
    kind, reason = confinement_kind()
    parent = Path(tempfile.mkdtemp(prefix=parent_prefix)).resolve()
    workspace = parent / "workspace"
    workspace.mkdir(parents=True, exist_ok=True)
    if workspace_seed is not None and Path(workspace_seed).is_dir():
        # copy2-based copytree so the seed becomes the child-visible copy.
        for item in Path(workspace_seed).iterdir():
            if item.name.startswith(".tmp_") or item.name in (".git", "__pycache__", ".pytest_cache"):
                continue
            dest = workspace / item.name
            if item.is_dir():
                shutil.copytree(item, dest, ignore=_WORKSPACE_IGNORE)
            else:
                shutil.copy2(item, dest)
    tmp = parent / "tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    home = stage_home(real_home or Path(os.environ.get("HOME", str(parent))), parent)
    plan = ConfinementPlan(
        kind=kind, parent=parent, workspace=workspace, home=home, tmp=tmp,
        profile_path=None, argv_prefix=[], env_overrides={},
        warnings=[],
    )
    if kind == "seatbelt":
        plan.profile_path = parent / "reviewer.sb"
        plan.profile_path.write_text(_seatbelt_profile_text(parent), encoding="utf-8")
        plan.argv_prefix = [str(_SANDBOX_EXEC), "-f", str(plan.profile_path)]
    else:
        plan.warnings.append(f"NO OS-level write confinement: {reason}")
    plan.env_overrides = {"HOME": str(home), "TMPDIR": str(tmp)}
    return plan


def smoke_test(plan: ConfinementPlan, probe_bin: str = "/bin/sh") -> tuple[bool, str]:
    """Actually EXERCISE the confinement: a write inside the staging root
    must succeed and an identical write OUTSIDE it must fail. Returns
    ``(enforced, detail)``. ``enforced=False`` on any unconfined plan or any
    probe surprise — callers must treat that as fail-closed."""
    if plan.kind == "none" or not plan.argv_prefix:
        return False, (plan.warnings[0] if plan.warnings else "unconfined plan")
    outside = Path(tempfile.mkdtemp(prefix="om_confinement_probe_")) / "must_not_exist.txt"
    try:
        inside = plan.parent / "smoke_inside.txt"
        inside_cmd = [*plan.argv_prefix, probe_bin,
                      "-c", f"echo inside > '{inside}'"]
        r_in = subprocess.run(inside_cmd, capture_output=True, text=True, timeout=30)
        outside_cmd = [*plan.argv_prefix, probe_bin,
                       "-c", f"echo outside > '{outside}'"]
        r_out = subprocess.run(outside_cmd, capture_output=True, text=True, timeout=30)
        inside_ok = r_in.returncode == 0 and inside.is_file()
        outside_blocked = r_out.returncode != 0 and not outside.is_file()
        if inside_ok and outside_blocked:
            return True, "inside write ok; outside write denied"
        return False, (
            f"confinement probe FAILED (inside_ok={inside_ok}, "
            f"outside_blocked={outside_blocked}, "
            f"inside rc={r_in.returncode}, outside rc={r_out.returncode})"
        )
    except Exception as e:  # noqa: BLE001 — any probe surprise is fail-closed
        return False, f"confinement probe error: {e}"
    finally:
        shutil.rmtree(outside.parent, ignore_errors=True)


__all__ = [
    "ConfinementPlan",
    "confinement_kind",
    "plan_review_confinement",
    "smoke_test",
    "stage_home",
]
