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
- R6 -> Wave1 P0-3 (2026-11-16): the writer CLI migrates to the reviewer
  wrapper's containment shape — ``--permission-mode acceptEdits`` PLUS an
  explicit ``--disallowedTools`` DENY-list (canonical ``scenes/``, ``packets/``,
  infra dot-directories), and the ``--allowedTools`` allow-list is GONE.
  R6's original phrasing ("never acceptEdits") encoded the real bug of its
  day: an accept-edits writer paired with an ALLOW-list, and allow-lists are
  VOID under ``--dangerously-skip-permissions`` (probe 2026-11-14 confirmed
  Write/Edit/Bash still execute) — that writer mutated the packet in rounds
  3-4. The deny-list, unlike the allow-list, survives the skip flag for
  tool-level file writes (``Write``/``Edit``/``MultiEdit``). ``acceptEdits``
  itself stays REQUIRED: plan/default modes return EMPTY stdout under the
  skip flag (probe 2026-11-14). The writer's one sanctioned write target —
  ``.tmp_sandboxes/{scene_id}_{attempt}/`` — is NOT in the deny list.
  RESIDUAL RISK (documented): ``Bash`` remains enabled because writer tasks
  instruct ``npx tsc --noEmit``; shell writes via ``Bash`` bypass tool-level
  denies. Compensating controls: pre-flight import check + bounded wrapper
  ``tsc`` self-check + reviewer gate + episode gate + promotion symlink-safety.
- Wave1 P0-3: the writer child env is WHITELISTED (system essentials + OM_*
  + provider API keys, mirroring reviewer_wrapper.py.tmpl) — the full parent
  environment (credentials included) never reaches the claude child.
- 4A.1: prior reviewer findings appended to the writer task, gated on
  ``OM_FINDINGS_INJECT`` (default ON; ``=0`` disables both sides).
- R2 (perf/cc-pipeline R1-R5): the static reviewer-style brief
  (``scene_orchestrator.REVIEWER_STYLE_BRIEF``) is appended to the writer task
  from ATTEMPT 1 — generic auto-reject rules (CountUp frame match, currency
  whitelist, coordinates, no placeholders, SAFE.* props, no invented vars, no
  raw image leakage) are taught up front, not learned from rejections.
- 4A.3 (phase-3 task 3.2 pull-forward, REV-2): per-episode SceneShell/theme
  layout detected on disk -> pre-seed header uses the REAL specifiers
  (``./lib/SceneShell`` style; ``remotion-composer/src/common/`` does not
  exist in OM) + ``_preflight_gate`` fast pre-check on the sandbox output
  BEFORE the bounded ``npx tsc --noEmit`` spend (``OM_TSC_TIMEOUT``,
  default = watchdog budget). Warn-and-allow when no
  SceneShell module exists under the episode (unknown layout never
  hard-fails the pre-flight; tsc remains the real gate).
- Failure-fixes 1 (2026-11-15): the sandbox preamble states the unified
  ``S{NN}.tsx`` scene filename convention and the resolved canonical target,
  so writer output/promotion/references never diverge to ``{scene_id}.tsx``.
- Failure-fixes 2 (2026-11-15): this wrapper writes an ATTEMPT MANIFEST
  (``.tmp_sandboxes/{scene_id}_{attempt}/attempt_manifest.json``) listing
  every episode-relative path its own process wrote; the orchestrator's
  ``verify_writer_scope`` is attempt-owned/manifest-based, so concurrent
  lead/collaborator edits (mix_profile.json, Episode.tsx, shared manifests)
  are never falsely blamed on the writer.
- Failure-fixes 3 (2026-11-15): the composer-wide ``tsc`` self-check is
  DEFERRED while the episode is partially generated — own-scene errors that
  are exclusively missing-module/baseline (TS2307 against files absent on
  disk) are downgraded to a printed TSC BASELINE WARN instead of failing the
  writer; once all expected scenes exist the strict own-scene gate returns.
- Defect 1 (tsc-gate S8 rescue, 2026-11-15): the tsc self-check timeout is
  FATAL. The old code hard-coded ``timeout=240`` and treated a
  ``subprocess.TimeoutExpired`` as NON-FATAL (print + pass), so a slow or
  cold environment promoted unverified code as "TS clean" (anomaly run
  tin-nong-5tin-20261115: scene gates are the only check before render, and
  broken S08 code reached the render stage). The budget is now explicit:
  ``OM_TSC_TIMEOUT`` (seconds), defaulting to the same watchdog budget the
  wrapper already uses (``OM_CC_WATCHDOG`` / ``WATCHDOG_S``, default 420).
  On expiry the attempt FAILS (exit 1, no promotion) with the
  infra-style ``tsc_timeout`` classification marker (mirrors the reviewer
  ``timeout_error`` verdict contract; the exit-1 attempt consumption follows
  the orchestrator's existing writer-side failure semantics). Genuine
  non-timeout tsc failures stay fatal as before.

Env: OM_SCENE_ID, OM_EPISODE_DIR, OM_ATTEMPT_INDEX (optional, default "0").
Kill-switch: OM_LEGACY_QUARANTINE=1 restores the legacy pre-phase1 behavior
(Claude writes the canonical scene file directly; own-output pre-clean, no
sandbox, no promotion) — with the same Wave1 P0-3 containment CLI shape.
"""
from __future__ import annotations
import json, os, re, shutil, subprocess, sys, threading, time
from pathlib import Path

# Task 2.4: single source of truth — static repo-root resolution
# (projects/<proj>/scripts/cc_pipeline/<file>.py -> parents[4] = repo root).
REPO_ROOT = Path(__file__).resolve().parents[4]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.qc.concurrency_governor import ConcurrencyGovernor, resolve_max_concurrency  # noqa: E402
from tools.qc.scene_orchestrator import (  # noqa: E402
    REVIEWER_STYLE_BRIEF,
    discover_authoritative_scenes,
    get_scenes_dir,
    resolve_scene_filename,
)
from tools.qc.writer_runner import execute_writer_with_backoff  # noqa: E402

# Failure-fixes 2: attempt-manifest contract — must mirror
# tools.qc.scene_orchestrator.WRITER_ATTEMPT_MANIFEST_SCHEMA / _NAME.
WRITER_ATTEMPT_MANIFEST_SCHEMA = "writer-attempt-manifest/1"
WRITER_ATTEMPT_MANIFEST_NAME = "attempt_manifest.json"

WATCHDOG_S = int(os.environ.get("OM_CC_WATCHDOG", "420"))
MAX_TURNS = os.environ.get("OM_CC_MAX_TURNS", "60")
PROJ_ROOT = Path(__file__).resolve().parents[2]  # projects/<project>

# Defect 1 (tsc-gate S8 rescue, 2026-11-15): bounded budget for the
# ``npx tsc --noEmit`` self-check. Previously hard-coded ``timeout=240``
# with a NON-FATAL TimeoutExpired handler. The budget is now explicit env
# ``OM_TSC_TIMEOUT`` (seconds); unset -> reuse the SAME budget as this
# wrapper's existing writer-session watchdog (WATCHDOG_S above, default
# 420) rather than a second independently-tuned constant.
TSC_TIMEOUT_ENV = "OM_TSC_TIMEOUT"

# Defect-1 polish (2026-11-15 review): the self-check budget must stay
# strictly INSIDE the outer writer-session budget (``OM_AGENT_TIMEOUT``,
# default 900 — run_cc_pipeline.py.tmpl ENV_TIMEOUT), otherwise a hung tsc
# self-check eats the session and the watchdog kills the writer anyway
# (wasted attempt, no ``tsc_timeout`` marker). Constraint: OM_TSC_TIMEOUT
# < OM_AGENT_TIMEOUT; when the outer env is readable we enforce a hard cap
# of OM_AGENT_TIMEOUT - 60 at this site; when it is NOT readable, a large
# OM_TSC_TIMEOUT is honored as-is (bounded only by the outer watchdog).
_AGENT_TIMEOUT_ENV = "OM_AGENT_TIMEOUT"

def _agent_budget_cap():
    """Cap seconds for the tsc self-check derived from the outer session
    budget: ``OM_AGENT_TIMEOUT - 60`` (60s headroom for promotion + exit).
    Returns None when the outer env is unset / non-integer / too small —
    the budget is then honored as-is (the outer watchdog still bounds it)."""
    raw = os.environ.get(_AGENT_TIMEOUT_ENV, "")
    if raw:
        try:
            outer = int(raw)
        except ValueError:
            return None
        if outer > 60:
            return outer - 60
    return None


def _tsc_timeout_seconds() -> int:
    """Self-check budget seconds: ``OM_TSC_TIMEOUT`` or the watchdog default.

    - Unset / non-integer / zero / negative -> ``WATCHDOG_S`` (the wrapper's
      existing watchdog budget, default 420), so a typo'd env var can never
      produce an immediate-fail (``<= 0``) or widen the budget by accident.
    - A valid value is honored as-is, EXCEPT it is capped at
      ``OM_AGENT_TIMEOUT - 60`` when that outer budget is readable here
      (constraint: the self-check must stay strictly inside the outer
      writer-session budget — see ``_agent_budget_cap``). No readable outer
      budget -> the value stands as configured (still bounded by the
      outer watchdog kill, not unbounded).
    """
    raw = os.environ.get(TSC_TIMEOUT_ENV, "")
    if raw:
        try:
            value = int(raw)
        except ValueError:
            value = 0
        if value > 0:
            cap = _agent_budget_cap()
            return min(value, cap) if cap is not None else value
    return WATCHDOG_S

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
# Ported from phase3-plan task 3.2, then REV-2 (2026-11-13 OM audit): episodes
# carry a PER-EPISODE SceneShell/theme — ``scenes/lib/SceneShell.tsx`` (imported
# from scenes as ``./lib/SceneShell``) or ``<episode>/lib/SceneShell.tsx``
# (imported as ``../lib/SceneShell``) plus a sibling ``theme.ts``
# (COLORS/FONTS/SAFE). ``remotion-composer/src/common/`` does NOT exist
# anywhere in OM, so the original phase-3 specifiers were unresolvable and the
# literal-substring pre-flight false-failed valid real-episode scenes while
# false-passing output that merely pasted the phantom header. Rev-2 rules:
#   - the pre-seed header uses the specifier DETECTED on disk for this episode
#     (default: the dominant ``./lib/SceneShell`` + ``./theme`` pattern);
#   - the pre-flight passes on a ``SceneShell``-symbol import from any real
#     per-episode specifier (``./lib/SceneShell``, ``../lib/SceneShell``,
#     ``./common[/SceneShell]``, ``./SceneShell``, ``@alias/SceneShell``) OR a
#     bare ``remotion`` import;
#   - when no SceneShell module exists under the episode on disk, the layout
#     cannot be anchored -> WARN + ALLOW (the bounded ``npx tsc --noEmit``
#     self-check remains the real gate), never a hard pre-flight exit;
#   - theme import/usage is WARN-only (S01-style scenes legitimately skip it).
SCENE_SHELL_IMPORT_HEADER = """import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { SceneShell } from './lib/SceneShell';
import { COLORS, FONTS } from './theme';
"""

# Accepted SceneShell import specifiers (real per-episode layouts).
_SCENE_SHELL_IMPORT_RE = re.compile(
    r"import\s[^;]*?\bSceneShell\b[^;]*?from\s*['\"]"
    r"(?:\.{1,2}/(?:lib|common)(?:/SceneShell)?|\.{0,2}/SceneShell|@[^'\"]+/SceneShell)"
    r"['\"]"
)

# Bare remotion fallback: a scene built on raw remotion primitives
# (AbsoluteFill/Sequence/...) without the episode shell is still valid output.
_BARE_REMOTION_IMPORT_RE = re.compile(r"from\s*['\"]remotion['\"]")

# Theme: module import (./theme, ../theme, @alias/theme) or canonical usage.
_THEME_IMPORT_RE = re.compile(r"from\s*['\"](?:\.{1,2}/theme|@[^'\"]+/theme)['\"]")
_THEME_USAGE_RE = re.compile(r"\b(?:COLORS|FONTS|SAFE|THEME_KEYS|useTheme)\b")


def _detect_episode_shell_layout(episode: Path) -> tuple[str, str | None] | None:
    """Probe the episode tree for the SceneShell/theme modules ACTUALLY on disk.

    Returns ``(shell_specifier, theme_specifier)`` as import specifiers
    relative to the scenes dir (``get_scenes_dir`` semantics: ``scenes/`` or
    ``scene/`` — the dir the writer's output lands in), or ``None`` when no
    SceneShell module exists under the episode (layout unknown -> pre-flight
    must warn-and-allow).
    """
    scenes_dir = get_scenes_dir(episode)
    for base in (scenes_dir / "lib", episode / "lib",
                 scenes_dir / "common", episode / "common",
                 scenes_dir, episode):
        if not (base / "SceneShell.tsx").is_file():
            continue
        rel = os.path.relpath(base, scenes_dir).replace(os.sep, "/")
        shell_spec = "./SceneShell" if rel == "." else f"{rel}/SceneShell"
        if not shell_spec.startswith("."):
            shell_spec = f"./{shell_spec}"
        theme_base = base
        if not (theme_base / "theme.ts").is_file():
            theme_base = base.parent
        theme_spec = None
        if (theme_base / "theme.ts").is_file():
            rel_t = os.path.relpath(theme_base, scenes_dir).replace(os.sep, "/")
            theme_spec = "./theme" if rel_t == "." else f"{rel_t}/theme"
            if not theme_spec.startswith("."):
                theme_spec = f"./{theme_spec}"
        return shell_spec, theme_spec
    return None


def _scene_shell_header(episode: Path) -> str:
    """Pre-seed header using the episode's DETECTED on-disk specifiers
    (falls back to the default ``./lib/SceneShell`` + ``./theme`` header when
    the episode carries no SceneShell module — warn-and-allow parity)."""
    layout = _detect_episode_shell_layout(episode)
    if layout is None:
        return SCENE_SHELL_IMPORT_HEADER
    shell_spec, theme_spec = layout
    lines = [
        "import React from 'react';",
        "import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';",
        f"import {{ SceneShell }} from '{shell_spec}';",
    ]
    if theme_spec:
        lines.append(f"import {{ COLORS, FONTS }} from '{theme_spec}';")
    return "\n".join(lines) + "\n"


def validate_imports_and_theme(scene_tsx_content: str) -> tuple[bool, str]:
    """Fast import pre-check (4A.3 rev-2: OM-real-layout aware).

    Passes when the scene imports the ``SceneShell`` symbol from a real
    per-episode specifier OR carries a bare ``remotion`` import. Theme
    import/usage is reported but WARN-only (never fails the pre-flight).
    Returns ``(ok, message)``.
    """
    shell_ok = bool(_SCENE_SHELL_IMPORT_RE.search(scene_tsx_content))
    remotion_ok = bool(_BARE_REMOTION_IMPORT_RE.search(scene_tsx_content))
    if not (shell_ok or remotion_ok):
        return False, (
            "Missing mandatory import: SceneShell ('./lib/SceneShell' style) or 'remotion'"
        )
    if _THEME_IMPORT_RE.search(scene_tsx_content) or _THEME_USAGE_RE.search(scene_tsx_content):
        return True, "OK"
    return True, "OK (theme import/usage absent — warn-only)"


def _preflight_gate(episode: Path, scene_src: str, scene_id: str) -> bool:
    """4A.3 rev-2 pre-flight dispatch (warn-and-allow on unknown layout).

    - No SceneShell module on disk under the episode: layout cannot be
      anchored -> WARN + ALLOW (True). The bounded tsc self-check (``OM_TSC_TIMEOUT``) remains the
      real gate; a phantom-specifier hard exit here only false-fails valid
      real-episode scenes.
    - Layout detected: hard-fail ONLY on a missing SceneShell/remotion
      import; theme absence is WARN-only.
    """
    layout = _detect_episode_shell_layout(episode)
    ok, msg = validate_imports_and_theme(scene_src)
    if layout is None:
        print(f"writer {scene_id}: PRE-FLIGHT WARN: no SceneShell module under episode "
              f"(layout unknown) — check skipped, allowing: {msg}")
        return True
    if not ok:
        print(f"writer {scene_id}: PRE-FLIGHT FAIL: {msg}")
        return False
    if msg != "OK":
        print(f"writer {scene_id}: PRE-FLIGHT WARN: {msg}")
    return True


# --- R6 -> Wave1 P0-3: containment writer CLI --------------------------------
# R6 history (phase 4A.2): the writer ran accept-edits with an ALLOW-list, and
# allow-lists are VOID under ``--dangerously-skip-permissions`` (probe
# 2026-11-14: Write/Edit/Bash still execute) — that writer mutated its review
# packet in rounds 3-4. Wave1 P0-3 migrates the writer to the reviewer
# wrapper's containment shape (reviewer_wrapper.py.tmpl header + phase1 task
# 1.1): ``--permission-mode acceptEdits`` (plan/default modes return EMPTY
# stdout under the skip flag) PLUS an explicit ``--disallowedTools`` deny-list
# — the deny-list, unlike the allow-list, overrides the skip flag for
# tool-level file writes (Write/Edit/MultiEdit). Note: ``Bash`` remains
# enabled because writer tasks instruct ``npx tsc --noEmit``; shell writes
# bypass tool-level denies (compensating controls: pre-flight + wrapper tsc +
# reviewer + episode gates + promotion symlink-safety). Deny scope
# (sandboxed writer, cwd = episode dir): the canonical ``scenes/`` dir (the
# wrapper promotes validated output itself), ``packets/`` (the R6 mutation
# surface), and repository infra dot-directories (``.git/``, ``.claude/``).
# The writer's one sanctioned write target — ``.tmp_sandboxes/**`` — is NOT
# denied, so no blanket ``.*`` dot pattern can be used (it would match the
# sandbox dir itself); infra dot-dirs are enumerated explicitly.
_WRITER_DISALLOWED_TOOLS = ",".join([
    "Edit(scenes/**)", "Write(scenes/**)", "MultiEdit(scenes/**)",
    "Edit(packets/**)", "Write(packets/**)", "MultiEdit(packets/**)",
    "Edit(.git/**)", "Write(.git/**)", "MultiEdit(.git/**)",
    "Edit(.claude/**)", "Write(.claude/**)", "MultiEdit(.claude/**)",
])
_WRITER_SCENES_DENY_RULES = ("Edit(scenes/**)", "Write(scenes/**)", "MultiEdit(scenes/**)")


def _writer_cmd(legacy_writes_scenes: bool = False) -> list[str]:
    """Writer CLI invocation (Wave1 P0-3): reviewer-wrapper containment shape —
    ``--permission-mode acceptEdits`` + ``--disallowedTools`` deny-list, NO
    allow-list flag (voided under ``--dangerously-skip-permissions``; R6
    probe 2026-11-14 — the flag is gone for good, never re-added).
    ``legacy_writes_scenes=True`` (OM_LEGACY_QUARANTINE=1 kill-switch flow)
    drops the ``scenes/**`` deny rules: that legacy path has the writer edit
    the canonical scene file directly (no sandbox, no promotion).
    """
    if legacy_writes_scenes:
        denied = ",".join(rule for rule in _WRITER_DISALLOWED_TOOLS.split(",")
                          if rule not in _WRITER_SCENES_DENY_RULES)
    else:
        denied = _WRITER_DISALLOWED_TOOLS
    return [
        "claude", "--print", "--dangerously-skip-permissions",
        "--permission-mode", "acceptEdits",
        "--disallowedTools", denied,
        "--max-turns", MAX_TURNS,
    ]


# --- Least-privilege child environment (Wave1 sec-cycle2) -------------------
# Explicit nine-key OM contract only. token IDs and instance IDs are
# provenance IDs, not child config; API/provider credentials are never passed.
_WRITER_ENV_ALLOW_KEYS = ("PATH", "HOME", "USER", "SHELL", "TMPDIR")
_WRITER_ENV_ALLOW_OM_KEYS = (
    "OM_SCENE_ID", "OM_EPISODE_DIR", "OM_ATTEMPT_INDEX", "OM_CC_WATCHDOG",
    "OM_TSC_TIMEOUT", "OM_FINDINGS_INJECT", "OM_LEGACY_QUARANTINE",
    "OM_MAX_CONCURRENCY", "OM_WRAPPER_TEMPLATE_STRICT",
)

def _writer_child_env() -> dict:
    env = {k: v for k, v in os.environ.items()
           if k in _WRITER_ENV_ALLOW_KEYS or k in _WRITER_ENV_ALLOW_OM_KEYS}
    env["MAX_THINKING_TOKENS"] = "1024"
    return env


def _spawn_claude(cmd: list[str], cwd: Path, env: dict, log_path: Path):
    try:
        return subprocess.Popen(cmd, cwd=str(cwd), env=env, stdin=subprocess.PIPE,
                                stdout=open(log_path, "wb"), stderr=subprocess.STDOUT, text=True)
    except Exception as e:
        print(f"WRITER SPAWN FAIL: {e}", file=sys.stderr)
        return None


def _tsc_lines_for_scene(lines: list[str], markers: list[str]) -> list[str]:
    """tsc diagnostic lines whose file BASENAME is one of this scene's files.

    Matching is scoped to the basename of the ``path(line,col)`` head (tsc
    emits ``S01.tsx(12,5): error ...``), so error TEXT mentioning another
    scene id, or a sibling like ``scene-11.tsx`` under scene ``scene-1``'s
    substring, cannot cross-attribute a failure.
    """
    own = []
    for line in lines:
        head = line.split("(", 1)[0].strip().replace("\\", "/")
        base = Path(head).name if head else ""
        if base and base in markers:
            own.append(line)
    return own


def _tsc_own_scene_fail(episode: Path, scene_id: str) -> tuple[bool, str]:
    """Run the composer-wide tsc self-check; return (own_scene_failed, output).

    Own-scene lines match the RESOLVED scene filename (``resolve_scene_filename``
    maps ``scene-1`` -> ``S01.tsx`` where that placeholder exists) plus the
    literal ``<scene_id>.tsx`` spelling — tsc emits ``S01.tsx(12,5): error``
    and a raw ``scene-1`` substring alone would miss it (4A rev-2 reviewer fix).

    Failure-fixes 3 (2026-11-15): the project-wide tsc is DEFERRED while the
    episode is partially generated. When expected sibling scenes are still
    missing AND every own-scene error line is a missing-module/baseline error
    (TS2307 against a file absent on disk), the check prints a TSC BASELINE
    WARN and passes — shared/baseline failures during early scenes must not
    fail the writer (the reviewer + episode gates still see the full picture).
    With all expected scenes on disk, own-scene errors fail strictly again.
    """
    composer = next((p for p in [episode, *episode.parents]
                     if (p / "tsconfig.json").is_file() and (p / "package.json").is_file()), None)
    if not composer:
        return False, ""
    try:
        fname = resolve_scene_filename(get_scenes_dir(episode), scene_id)
    except Exception:
        fname = f"{scene_id}.tsx"
    markers = sorted({fname, f"{scene_id}.tsx"})
    budget = _tsc_timeout_seconds()
    try:
        tsc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(composer),
                             env=_writer_child_env(),
                             capture_output=True, text=True,
                             timeout=budget)
        own = _tsc_lines_for_scene((tsc.stdout + tsc.stderr).splitlines(), markers)
        if tsc.returncode != 0 and own:
            missing = _expected_scene_missing(episode)
            if missing and _own_tsc_errors_are_baseline(own, episode):
                print(
                    f"writer {scene_id}: TSC BASELINE WARN (project-wide tsc DEFERRED — "
                    f"{len(missing)} expected scene(s) not yet generated: "
                    f"{', '.join(missing[:8])}); own-scene errors are "
                    f"missing-module/baseline only:\n" + "\n".join(own)[:2000]
                )
                return False, ""
            return True, "\n".join(own)[:2000]
    except subprocess.TimeoutExpired:
        # Defect 1 (tsc-gate S8 rescue, 2026-11-15): FATAL — was print +
        # "non-fatal" pass, which let an unverified scene promote as
        # "TS clean" (scene gates are the only writer-side check before
        # render). Classification decision, documented: a self-check
        # timeout is ENVIRONMENTAL (slow machine / cold npx cache), so the
        # printed marker is the infra-style ``tsc_timeout`` contract,
        # mirroring the reviewer ``timeout_error`` verdict that
        # scene_orchestrator maps to an in-place infra retry. The wrapper
        # has no verdict channel to the orchestrator — only its process
        # exit code — and the orchestrator's EXISTING semantics classify
        # any non-zero writer exit as a consumed content attempt
        # (execute_scene_with_retries: "writer scope/tsc failures",
        # bounded by max_retries). We follow existing taxonomy semantics:
        # fail the attempt (return failed=True -> caller unlinks the
        # staged file and exits 1 -> NO promotion) instead of inventing a
        # new exit channel, and emit the machine-grepable ``tsc_timeout``
        # marker so a future orchestrator-side infra mapping can key off
        # it without another wrapper change. ``budget`` is the value
        # actually passed to subprocess.run (hoisted above the try).
        print(f"writer {scene_id}: TSC TIMEOUT (tsc_timeout): self-check exceeded "
              f"{budget}s — FAILING attempt (environmental infra-style "
              f"classification marker; no promotion)")
        return True, (
            f"tsc_timeout: npx tsc --noEmit exceeded its {budget}s budget "
            f"({TSC_TIMEOUT_ENV} or watchdog default) — attempt failed, "
            "scene NOT promoted."
        )
    return False, ""


# --- Failure-fixes 3: deferred project-wide tsc during partial generation ----
_TS2307_MODULE_RE = re.compile(r"error\s+TS2307:.*?['\"]([^'\"]+)['\"]")


def _expected_scene_missing(episode: Path) -> list[str] | None:
    """Expected authoritative scene ids whose scene file is NOT on disk yet.

    Returns ``None`` when the expected set cannot be determined (discovery
    unavailable) — callers must then keep the strict gate (fail-closed).
    An empty list means every expected scene exists (generation complete).
    """
    try:
        expected = discover_authoritative_scenes(episode)
    except Exception:
        return None
    if not expected:
        return []
    scenes_dir = get_scenes_dir(episode)
    missing: list[str] = []
    for sid in expected:
        try:
            fname = resolve_scene_filename(scenes_dir, sid)
        except Exception:
            fname = f"{sid}.tsx"
        if not (scenes_dir / fname).is_file():
            missing.append(sid)
    return missing


def _module_target_exists(episode: Path, specifier: str) -> bool:
    """Resolve a TS2307 module specifier against the episode tree.

    Only RELATIVE specifiers (``./x``, ``../x``) can be resolved from the
    scene dir / episode root; bare specifiers (npm packages, tsconfig path
    aliases like ``@episode/...``) are unresolvable here and count as
    EXISTING (fail-closed: their absence is a real own-scene error, not a
    missing-sibling baseline). tsc emits specifiers without extensions, so
    ``.tsx``/``.ts``/``index`` suffix variants are probed.
    """
    if not specifier.startswith("."):
        return True
    suffixes = ("", ".tsx", ".ts", ".d.ts", "/index.tsx", "/index.ts")
    for base in (get_scenes_dir(episode), episode):
        for suffix in suffixes:
            candidate = (base / (specifier + suffix)).resolve()
            if candidate.exists():
                return True
    return False


def _own_tsc_errors_are_baseline(own_lines: list[str], episode: Path) -> bool:
    """True when EVERY own-scene error line is a TS2307 against a file absent
    on disk — i.e. the project-wide failures are missing-sibling/baseline
    noise from partial generation, not defects in this scene's output."""
    if not own_lines:
        return False
    for line in own_lines:
        m = _TS2307_MODULE_RE.search(line)
        if not m:
            return False  # a non-module error is a real own-scene defect
        if _module_target_exists(episode, m.group(1)):
            return False  # the imported file exists: real resolution defect
    return True


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


def _write_attempt_manifest(episode: Path, scene_id: str, attempt_idx: str,
                            sandbox: Path, canonical_target: Path | None) -> None:
    """Failure-fixes 2: record what THIS wrapper process wrote.

    The manifest (``.tmp_sandboxes/{scene_id}_{attempt}/attempt_manifest.json``)
    lists the episode-relative ``writer_owned`` paths — sandbox output, the
    scenes-dir staging file, and the promoted canonical target. The
    orchestrator's ``verify_writer_scope`` is manifest-based in this mode:
    only listed paths can be writer-scope violations, so concurrent
    lead/collaborator edits of shared files are never blamed on the writer.
    Best-effort: a manifest write failure falls back to the tree-diff check.
    """
    try:
        owned: set[str] = set()
        for p in sandbox.rglob("*"):
            if p.is_file() and p.name != WRITER_ATTEMPT_MANIFEST_NAME:
                owned.add(p.relative_to(episode).as_posix())
        staged = get_scenes_dir(episode) / f".tmp_{scene_id}.tsx"
        if staged.is_file():
            owned.add(staged.relative_to(episode).as_posix())
        if canonical_target is not None and canonical_target.is_file():
            owned.add(canonical_target.relative_to(episode).as_posix())
        payload = {
            "schema": WRITER_ATTEMPT_MANIFEST_SCHEMA,
            "scene_id": scene_id,
            "attempt_index": str(attempt_idx),
            "writer_owned": sorted(owned),
        }
        (sandbox / WRITER_ATTEMPT_MANIFEST_NAME).write_text(
            json.dumps(payload, indent=1), encoding="utf-8")
    except Exception as e:
        print(f"writer {scene_id}: attempt manifest write failed (tree-diff fallback): {e}")


def _legacy_main(scene_id: str, episode: Path, task_file: Path, log_dir: Path) -> int:
    """OM_LEGACY_QUARANTINE=1 escape hatch: pre-phase1 behavior (scoped CLI)."""
    nn = f"{int(scene_id.split('-')[-1]):02d}"
    log_path = log_dir / f"cc_writer_{scene_id}.log"
    scene_file = episode / f"scenes/S{nn}.tsx"

    task = task_file.read_text(encoding="utf-8")
    # R2 (perf/cc-pipeline R1-R5): the static reviewer-style brief applies from
    # ATTEMPT 1 — the generic auto-reject rules (CountUp frame match, currency
    # whitelist, coordinate placement, no placeholders, SAFE.* props only, no
    # invented vars, no raw image leakage) are taught up front instead of being
    # learned from a round-1 rejection. Single source of truth:
    # tools.qc.scene_orchestrator.REVIEWER_STYLE_BRIEF.
    task = task + REVIEWER_STYLE_BRIEF
    block = _prior_findings_block(scene_id, os.environ.get("OM_ATTEMPT_INDEX", "0"))
    if block:
        task = task + block
        _log_prior_findings(log_path, block)
    env = _writer_child_env()
    cmd = _writer_cmd(legacy_writes_scenes=True)

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
        # 4A.3 pre-flight (fast check BEFORE the bounded tsc spend).
        scene_src = scene_file.read_text(encoding="utf-8", errors="replace")
        if not _preflight_gate(episode, scene_src, scene_id):
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
    # 4A.3 rev-2: SceneShell pre-seed header goes FIRST (before the sandbox-mode
    # preamble) using the episode's DETECTED on-disk specifiers, so the writer
    # sees an import block that actually resolves in THIS episode.
    # Failure-fixes 1: the preamble also states the unified S{NN}.tsx
    # convention and the RESOLVED canonical target so writer-side references,
    # generated imports and the promotion target never diverge.
    task = (
        "## CANONICAL IMPORT HEADER (phase-3 task 3.2 pre-seed — use these)\n"
        "```tsx\n" + _scene_shell_header(episode) + "```\n\n"
        "## CANONICAL TARGET (OpenMontage scene filename convention)\n"
        f"Your scene promotes to `{scenes_dir.name}/{target_filename}`. The unified "
        "OpenMontage convention is `S{NN}.tsx` (scenes/S01.tsx, scenes/S02.tsx, ...); "
        f"reference sibling scenes and packets with the same convention — never "
        "invent `{scene_id}.tsx`-style scene filenames.\n\n"
        "## SANDBOX OUTPUT MODE (phase1 task 1.3)\n"
        f"Write your final scene component EXCLUSIVELY to `{sandbox.relative_to(episode)}/{scene_id}.tsx` "
        "(create parent dirs as needed). Do NOT write or edit any file under "
        f"`{scenes_dir.name}/` directly — the wrapper promotes your sandbox output "
        "atomically after validation.\n\n"
    ) + task_file.read_text(encoding="utf-8")
    # R2 (perf/cc-pipeline R1-R5): static reviewer-style brief from ATTEMPT 1 —
    # generic auto-reject rules taught up front (single source of truth:
    # tools.qc.scene_orchestrator.REVIEWER_STYLE_BRIEF). Appended BEFORE the
    # 4A.1 prior-findings block so attempt-specific findings stay last.
    task = task + REVIEWER_STYLE_BRIEF
    # 4A.1: prior reviewer findings appended, gated on OM_FINDINGS_INJECT.
    block = _prior_findings_block(scene_id, attempt_idx)
    if block:
        task = task + block
        _log_prior_findings(log_path, block)

    env = _writer_child_env()
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
        _write_attempt_manifest(episode, scene_id, attempt_idx, sandbox, None)
        print(f"writer {scene_id}: exit={returncode} dur={dur:.0f}s file=MISSING (sandbox)")
        return 1

    # 4A.3 pre-flight: fast import check BEFORE the bounded npx tsc spend — a
    # missing mandatory import rejects the output immediately (orchestrator
    # re-prompts with a fresh attempt; no TSC time burned on a broken file).
    # Rev-2: warn-and-allow when the episode carries no SceneShell module
    # (unknown layout) — see _preflight_gate.
    scene_src = sandbox_file.read_text(encoding="utf-8", errors="replace")
    if not _preflight_gate(episode, scene_src, scene_id):
        _write_attempt_manifest(episode, scene_id, attempt_idx, sandbox, None)
        return 1

    # Stage for validation, then promote atomically. No un-scoped deletion of
    # the canonical scene file ever happens in this path.
    tmp_target.unlink(missing_ok=True)
    shutil.copyfile(sandbox_file, tmp_target)
    failed, out = _tsc_own_scene_fail(episode, scene_id)
    if failed:
        tmp_target.unlink(missing_ok=True)
        _write_attempt_manifest(episode, scene_id, attempt_idx, sandbox, None)
        print(f"writer {scene_id}: TSC FAIL (own scene):\n{out}")
        return 1

    with promo_mutex:
        os.replace(tmp_target, canonical_target)

    _write_attempt_manifest(episode, scene_id, attempt_idx, sandbox, canonical_target)
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
