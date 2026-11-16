"""Shared CC reviewer run logic (video-slowfix phase1, tasks 1.1 + 1.4).

Single source of truth for the independent reviewer's CLI invocation, stdout
verdict extraction, and the review watchdog default. Consumed by
``projects/*/scripts/cc_pipeline/reviewer_wrapper.py``; a project wrapper
enables the import by inserting the repo root (``Path(__file__).resolve()``
walk) into ``sys.path``. Full orchestrator-side formalization is Phase 2
Task 2.4 (out of bounds for phase 1).

Verdict channels (wave1 sec-cycle2, 2026-11-16) — extract_verdict accepts
ALL of, in order:
1. legacy ``<!-- VERDICT_START --> ... <!-- VERDICT_END -->`` JSON block
   (the phase-1 wire format; code fences stripped before parsing);
2. the current plain-text ``@@VERDICT_START@@ ... @@VERDICT_END@@`` block
   (the hotfix format the provider actually delivers — JSON braces in the
   final message get dropped by the provider);
3. no stdout block at all -> the caller falls back to the findings FILE the
   reviewer Write-tools itself (wrapper-side), and only then stamps the
   infra ``timeout_error`` verdict.
The command builder is TRUTHFUL about enforcement: CLI tool-scoping flags
are NOT part of the reviewer invocation (the provider silently drops the
final message when either flag is present — A/B probe 2026-11-15 — so the
wrapper strips them). Reviewer containment is layered, in enforcement
order: OS-level write confinement (tools.qc.reviewer_confinement, seatbelt
on macOS) + a staged review workspace the canonical tree is never the
child's cwd + the whitelisted child env (tools/qc child env allowlists) +
the orchestrator's reviewer-ownership snapshot check. NOTHING in this
module claims the stripped deny flags still enforce — they do not; that is
exactly why the layers above exist.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

# --- Reviewer-timeout hotfix: acceptEdits ------------------------------------
# acceptEdits: plan/default modes return EMPTY stdout with
# --dangerously-skip-permissions (probe 2026-11-14), so the verdict engine
# stamped timeout_error on 4/4 reviewer runs (cc_exit=0, timed_out=False, no
# verdict block); acceptEdits restores output. The mode is NOT containment.
REVIEW_PERMISSION_MODE = "acceptEdits"
# WAVE1 SEC-CYCLE2 (2026-11-16): the --allowedTools / --disallowedTools
# constants are GONE from the invocation — the provider silently drops the
# final message when either flag is present (A/B probe 2026-11-15: no-flags
# 3/4 verdicts delivered, --allowedTools 0/4), so the wrapper strips them and
# any remaining deny-flag claim would be FALSE. Enforcement lives in
# tools.qc.reviewer_confinement (OS write sandbox), the staged review
# workspace, the child env allowlist, and verify_reviewer_ownership.
REVIEW_TOOL_SCOPING_FLAGS = ("--allowedTools", "--disallowedTools")
# R5 (perf/cc-pipeline R1-R5): turn-cap headroom 30 -> 45. Complex scenes
# (dense word anchors + long windows) burned all 30 turns before delivering
# the verdict block; 45 absorbs the spike while "Max 12 turns" in the wrapper
# task stays the soft discipline target.
DEFAULT_REVIEW_MAX_TURNS = "45"

# --- R3/R5 infra-retry contract ---------------------------------------------
# The verdict string a reviewer emits when it could not deliver a verdict at
# all (watchdog expiry OR --max-turns cap exhaustion). The orchestrator treats
# it as an INFRASTRUCTURE failure — it must never be counted as a content
# rejection nor trigger a full rewrite. Single source of truth: the minted
# reviewer wrapper (tools/qc/cc_wrapper_templates/reviewer_wrapper.py.tmpl)
# imports THIS constant, and scene_orchestrator classifies against it — keep
# both sides in sync through this name.
REVIEW_TIMEOUT_VERDICT = "timeout_error"

# --- Task 1.4: watchdog default hardening -----------------------------------
DEFAULT_REVIEW_WATCHDOG_S = 360

# --- Task 1.1: delimited verdict extraction ---------------------------------
VERDICT_DELIMITER_RE = re.compile(
    r"<!-- VERDICT_START -->(.*?)<!-- VERDICT_END -->", re.DOTALL
)
_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)

# Scene-layout resolvers (mirror of scene_orchestrator.get_scenes_dir /
# resolve_scene_filename, kept here so the standalone wrapper subprocess can
# hash the reviewed scene file without importing the orchestrator module).


def get_scenes_dir(episode_dir: Path) -> Path:
    """Resolve the episode's scene directory: prefer ``scenes/`` over ``scene/``."""
    return episode_dir / "scenes" if (episode_dir / "scenes").is_dir() else episode_dir / "scene"


def resolve_scene_filename(scenes_dir: Path, scene_id: str) -> str:
    """Map a scene_id (e.g. ``scene-1``) to the on-disk TSX filename (e.g. ``S01.tsx``).

    Failure-fixes 1: unified ``S{NN}.tsx`` convention — on-disk files keep
    precedence (legacy ``scene-N.tsx`` episodes keep working); with no
    on-disk match the fallback is the canonical ``S{NN}.tsx`` name, mirroring
    tools.qc.scene_orchestrator.resolve_scene_filename.
    """
    if (scenes_dir / f"{scene_id}.tsx").is_file():
        return f"{scene_id}.tsx"
    m = re.match(r"(?:scene[-_]?)?(\d+)", scene_id, re.IGNORECASE)
    if m:
        num = int(m.group(1))
        for c in [f"S{num:02d}.tsx", f"S{num}.tsx", f"scene-{num}.tsx", f"scene_{num}.tsx"]:
            if (scenes_dir / c).is_file():
                return c
        # Failure-fixes 1: fresh scene -> canonical S{NN}.tsx (never scene-N.tsx)
        return f"S{num:02d}.tsx"
    return f"{scene_id}.tsx"


def build_reviewer_cmd(max_turns: str | None = None) -> list[str]:
    """Reviewer CLI invocation (task 1.1), TRUTHFUL about enforcement.

    NO ``--allowedTools`` / ``--disallowedTools`` here: the provider drops
    the final message when either flag is present (A/B probe 2026-11-15),
    so the effective command carries neither. ``--dangerously-skip-permissions``
    stays because acceptEdits alone returns empty stdout (probe 2026-11-14);
    the skip flag means the CLI's own permission prompts would not fire —
    containment is the OS write sandbox + staged workspace + env allowlist
    (see reviewer_confinement), NOT tool scoping. ``strip_tool_scoping_flags``
    below is the defensive belt-and-braces pass the wrapper runs on any cmd.
    """
    return [
        "claude", "--print", "--dangerously-skip-permissions",
        "--permission-mode", REVIEW_PERMISSION_MODE,
        "--max-turns", max_turns or os.environ.get(
            "OM_CC_REVIEW_MAX_TURNS", DEFAULT_REVIEW_MAX_TURNS
        ),
    ]


def strip_tool_scoping_flags(cmd: list[str]) -> list[str]:
    """Drop ``--allowedTools`` / ``--disallowedTools`` (flag + value) from a
    command line. The provider returns an EMPTY final message when either
    flag is present, so the reviewer child must never see them; keeping this
    as a shared helper makes the post-strip argv a testable contract."""
    cleaned: list[str] = []
    skip_next = False
    for token in cmd:
        if skip_next:
            skip_next = False
            continue
        if token in REVIEW_TOOL_SCOPING_FLAGS:
            skip_next = True
            continue
        cleaned.append(token)
    return cleaned


# --- Hotfix 2026-11-15 part 4: plain-text @@ verdict channel ------------------
# JSON-in-output verdict blocks get dropped by the provider (result "" —
# braces/brackets 0/8 vs control 5/8, 21:40-21:45), so the CURRENT wire
# format is plain text @@ markers parsed locally. The legacy <!-- --> JSON
# parser (VERDICT_DELIMITER_RE / extract_verdict) is kept and still honored.
AT_VERDICT_DELIMITER_RE = re.compile(r"@@VERDICT_START@@(.*?)@@VERDICT_END@@", re.DOTALL)
_AT_VERDICT_LINE_RE = re.compile(r"VERDICT:\s*(approved|rejected)", re.IGNORECASE)
_AT_ISSUE_LINE_RE = re.compile(r"^\s*ISSUE:\s*(.+)$", re.MULTILINE)


def extract_at_verdict(stdout_text: str) -> tuple[str, list[str], dict]:
    """Parse the plain-text ``@@VERDICT_START@@ ... @@VERDICT_END@@`` block.

    Returns ``(verdict, issues, data)``; a missing block yields the same
    ``(rejected, [reason], {})`` shape as the legacy parser."""
    match = AT_VERDICT_DELIMITER_RE.search(stdout_text or "")
    if not match:
        return "rejected", ["Delimiter @@VERDICT_START@@ not found in reviewer output"], {}
    block = match.group(1)
    vm = _AT_VERDICT_LINE_RE.search(block)
    verdict = vm.group(1).lower() if vm else "rejected"
    issues = [m.group(1).strip() for m in _AT_ISSUE_LINE_RE.finditer(block)]
    if not vm:
        issues = ["Verdict line missing in @@ block"] + issues
    return verdict, issues, {"metrics": {}}


def extract_verdict(stdout_text: str) -> tuple[str, list[str], dict]:
    """Extract the verdict from reviewer stdout — ALL supported channels.

    Channel order (wave1 sec-cycle2):
    1. legacy ``<!-- VERDICT_START -->`` JSON block (phase-1 wire format;
       markdown code fences stripped before parsing);
    2. current plain-text ``@@VERDICT_START@@ ... @@VERDICT_END@@`` block
       (the hotfix format; parsed via ``extract_at_verdict``);
    3. neither present -> ``(rejected, [<both-channel delimiter miss>], {})``
       — the CALLER (wrapper) then consults the findings FILE channel before
       stamping the infra ``timeout_error`` verdict.

    Returns ``(verdict, issues, data)``:
    - legacy delimiter found, JSON decodes -> verdict/issues from payload
      (``verdict`` defaults to ``rejected`` when the payload omits it)
    - legacy delimiter found, JSON invalid -> ``("rejected", ["Verdict JSON
      decode failure: ..."])``
    - @@ block found -> verdict/issues from the plain-text lines
    - neither -> ``("rejected", ["Delimiter <!-- VERDICT_START --> (or
      @@VERDICT_START@@) not found in reviewer output"])``
    """
    stdout_text = stdout_text or ""
    match = VERDICT_DELIMITER_RE.search(stdout_text)
    if match:
        raw_block = match.group(1).strip()
        clean_json = _CODE_FENCE_RE.sub("", raw_block).strip()
        try:
            data = json.loads(clean_json)
            verdict = data.get("verdict", "rejected")
            issues = data.get("issues", [])
            return verdict, issues, data
        except Exception as e:
            return "rejected", [f"Verdict JSON decode failure: {e}"], {}
    if AT_VERDICT_DELIMITER_RE.search(stdout_text):
        return extract_at_verdict(stdout_text)
    return "rejected", [
        "Delimiter <!-- VERDICT_START --> (or @@VERDICT_START@@) not found in reviewer output"
    ], {}
