"""Shared CC reviewer run logic (video-slowfix phase1, tasks 1.1 + 1.4).

Single source of truth for the independent reviewer's CLI invocation, stdout
verdict extraction (delimited JSON + markdown code-fence stripping), and the
review watchdog default. Consumed by
``projects/*/scripts/cc_pipeline/reviewer_wrapper.py``; a project wrapper
enables the import by inserting the repo root (``Path(__file__).resolve()``
walk) into ``sys.path``. Full orchestrator-side formalization is Phase 2
Task 2.4 (out of bounds for phase 1).
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

# --- Reviewer-timeout hotfix: acceptEdits ------------------------------------
# acceptEdits + Read/Glob/Grep tool scoping: the reviewer still cannot write
# (tool list excludes Write/Edit; the wrapper writes verdict/findings on
# Claude's behalf), but no longer runs in plan mode. Probe 2026-11-14: plan/
# default modes return EMPTY stdout with --dangerously-skip-permissions, so
# the verdict engine stamped timeout_error on 4/4 reviewer runs (cc_exit=0,
# timed_out=False, no verdict block); acceptEdits restores output.
REVIEW_PERMISSION_MODE = "acceptEdits"
REVIEW_ALLOWED_TOOLS = "Read,Glob,Grep"
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
    """Map a scene_id (e.g. ``scene-1``) to the on-disk TSX filename (e.g. ``S01.tsx``)."""
    if (scenes_dir / f"{scene_id}.tsx").is_file():
        return f"{scene_id}.tsx"
    m = re.match(r"(?:scene[-_]?)?(\d+)", scene_id, re.IGNORECASE)
    if m:
        num = int(m.group(1))
        for c in [f"S{num:02d}.tsx", f"S{num}.tsx", f"scene-{num}.tsx", f"scene_{num}.tsx"]:
            if (scenes_dir / c).is_file():
                return c
    return f"{scene_id}.tsx"


def build_reviewer_cmd(max_turns: str | None = None) -> list[str]:
    """Read-only reviewer CLI invocation (task 1.1)."""
    return [
        "claude", "--print", "--dangerously-skip-permissions",
        "--permission-mode", REVIEW_PERMISSION_MODE,
        "--allowedTools", REVIEW_ALLOWED_TOOLS,
        "--max-turns", max_turns or os.environ.get(
            "OM_CC_REVIEW_MAX_TURNS", DEFAULT_REVIEW_MAX_TURNS
        ),
    ]


def extract_verdict(stdout_text: str) -> tuple[str, list[str], dict]:
    """Extract the delimited JSON verdict from reviewer stdout.

    Strips markdown code fences around the JSON block before parsing.

    Returns ``(verdict, issues, data)``:
    - delimiter found, JSON decodes  -> verdict/issues from payload (``verdict``
      defaults to ``rejected`` when the payload omits it)
    - delimiter found, JSON invalid  -> ``("rejected", ["Verdict JSON decode failure: ..."])``
    - delimiter missing              -> ``("rejected", ["Delimiter <!-- VERDICT_START --> not found in reviewer output"])``
    """
    match = VERDICT_DELIMITER_RE.search(stdout_text or "")
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
    return "rejected", ["Delimiter <!-- VERDICT_START --> not found in reviewer output"], {}
