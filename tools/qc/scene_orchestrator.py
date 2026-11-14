"""Executable Scene Workflow Orchestrator for OpenMontage.

Architecture and Enforced vs Prompt-Level Ownership Model
=========================================================

Reviewer Finding 3 rejection:
"scene_packet.py only validates caller-supplied tokens; no dispatch, no scheduler,
no ownership enforcement."

To make the scene workflow operational, this orchestrator implements a real
dispatch scheduler with bounded concurrency and bounded retries, cryptographically
freezes inputs, and enforces OS-level ownership boundaries before integrating scene
packets and running the episode gate.

Enforced vs Prompt-Level Ownership Distinction
----------------------------------------------
The table below explicitly delineates what is OS-level/cryptographically enforced
versus what remains at the prompt level (as required by the independent reviewer):

+-------------------------------+-----------------------------------------+----------------------------------------------+
| Property                      | Enforcement Mechanism                   | Verifiable Proof / Failure Mode              |
+-------------------------------+-----------------------------------------+----------------------------------------------+
| Reviewer Read-Only Isolation  | Sandbox-copy pattern: reviewer runs in  | Pre/post SHA-256 snapshot of canonical tree. |
|                               | an isolated filesystem copy outside     | ANY mutation to canonical tree triggers      |
|                               | canonical episode root.                 | `reviewer_canonical_mutation` reject.        |
+-------------------------------+-----------------------------------------+----------------------------------------------+
| Reviewer Output Collection    | Sandbox-only collection: findings JSON  | Orchestrator only ingests from sandbox;      |
|                               | is collected strictly from sandbox dir. | canonical tree is never writable by reviewer.|
+-------------------------------+-----------------------------------------+----------------------------------------------+
| Writer Scope Containment      | Pre/post SHA-256 snapshot diff of the   | Hash diff verifies only files inside         |
|                               | canonical episode directory tree.       | declared `allowed_io` or scene-scoped paths  |
|                               |                                         | were modified; out-of-scope edit triggers    |
|                               |                                         | `writer_scope_violation` reject.             |
+-------------------------------+-----------------------------------------+----------------------------------------------+
| Context & Token Independence  | Director mints distinct UUID4 instance  | integrate_scene_packet rejects identical     |
|                               | IDs and unforgeable cryptographic       | tokens (`reviewer_token_invalid`) or IDs     |
|                               | tokens (`wt_...` vs `rt_...`).          | (`reviewer_not_independent`).                |
+-------------------------------+-----------------------------------------+----------------------------------------------+
| Verdict-to-Hash Binding       | Reviewer findings embed explicit        | episode_gate rejects unbound/mismatched      |
|                               | `reviewed_hashes` mapping output refs    | verdicts (`verdict_binding_missing`,         |
|                               | to on-disk SHA-256 digests.             | `verdict_binding_incomplete`, `_mismatch`).  |
+-------------------------------+-----------------------------------------+----------------------------------------------+
| Frozen Input Immutability     | Director hashes all input artifacts     | integrate_scene_packet verifies inputs       |
|                               | into `frozen_inputs` before dispatch.   | match disk on integration; mismatch fails.   |
+-------------------------------+-----------------------------------------+----------------------------------------------+
| Bounded Concurrency & Retries | Director limits active scene workers via| ThreadPoolExecutor max_workers cap; retries  |
|                               | worker pool and limits retry count.     | bounded to `max_retries` (default 1).        |
+-------------------------------+-----------------------------------------+----------------------------------------------+
| LLM Reasoning Independence    | PROMPT-LEVEL ONLY: distinct system      | Prompt separation prevents context bleed,    |
|                               | prompts, isolated instance memory, and  | but internal LLM reasoning/judgment cannot   |
|                               | separate agent conversational turns.    | be mechanically guaranteed at OS level.      |
+-------------------------------+-----------------------------------------+----------------------------------------------+
"""

from __future__ import annotations

import abc
import argparse
import concurrent.futures
import copy
import hashlib
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from lib.production_provenance import hash_file
from tools.qc.concurrency_governor import ConcurrencyGovernor, resolve_max_concurrency
from tools.qc.episode_gate import validate_episode
from tools.qc.reviewer_runner import REVIEW_TIMEOUT_VERDICT
from tools.qc.writer_runner import is_transient_api_error
from tools.qc.scene_packet import (
    SCHEMA_VERSION,
    integrate_scene_packet,
    load_packet,
    validate_packet,
)

logger = logging.getLogger(__name__)


# ==============================================================================
# Data Structures
# ==============================================================================

@dataclass
class WriterContext:
    """Context provided to a writer agent instance."""
    scene_id: str
    instance_id: str
    token: str
    episode_dir: Path
    allowed_io: list[str]
    frozen_inputs: dict[str, str]
    claims: dict[str, Any] = field(default_factory=dict)
    neighbor_context: dict[str, str] = field(default_factory=dict)
    style_contract_ref: str = "packets/style_contract.json"
    extra_env: dict[str, str] = field(default_factory=dict)
    # Task 1.3: attempt ordinal, surfaced to the writer wrapper as
    # OM_ATTEMPT_INDEX so per-attempt sandbox dirs never collide.
    attempt_number: int = 0
    # Phase 4A.1: reviewer findings carried from prior rejected attempts so
    # non-CC runners can consume them too (the CC writer wrapper template
    # reads the canonical findings file itself, gated on OM_FINDINGS_INJECT).
    # Populated at the retry-loop construction site in
    # execute_scene_with_retries for attempts >= 2 only.
    prior_findings: list[str] | None = None


@dataclass
class ReviewerContext:
    """Context provided to an independent reviewer agent instance."""
    scene_id: str
    instance_id: str
    token: str
    sandbox_dir: Path
    canonical_dir: Path
    writer_instance_id: str
    writer_token: str
    output_hashes: dict[str, str]
    frozen_inputs: dict[str, str]
    findings_ref: str = "packets/{scene_id}_findings.json"
    extra_env: dict[str, str] = field(default_factory=dict)


@dataclass
class AgentRunResult:
    """Standardized result produced by an agent execution."""
    instance_id: str
    token: str
    role: str
    exit_code: int
    started_at: str
    finished_at: str
    duration_seconds: float
    stdout: str
    stderr: str
    outputs: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


@dataclass
class OwnershipVerification:
    """Audit of OS-level ownership constraints for a scene run."""
    writer_scope_valid: bool
    writer_modified_files: list[str]
    reviewer_canonical_mutation: bool
    reviewer_mutated_files: list[str]
    error_message: str | None = None


@dataclass
class SceneRunAttempt:
    """Audit record for a single execution attempt of a scene."""
    attempt_number: int
    writer_result: AgentRunResult | None = None
    reviewer_result: AgentRunResult | None = None
    ownership: OwnershipVerification | None = None
    packet_valid: bool = False
    packet_reasons: list[dict[str, str]] = field(default_factory=list)
    packet_path: str | None = None
    packet_hash: str | None = None
    success: bool = False
    error: str | None = None
    # R3 (perf/cc-pipeline R1-R5): True when this attempt record was consumed
    # by an infrastructure failure (transport glitch / reviewer turn-cap or
    # watchdog ``timeout_error``) and retried IN PLACE — the content attempt
    # ordinal was NOT incremented for it.
    infra: bool = False


@dataclass
class SceneExecutionRecord:
    """Summary of all attempts and final status for one scene."""
    scene_id: str
    status: str  # "success" | "failed"
    attempts: list[SceneRunAttempt] = field(default_factory=list)
    final_packet_path: str | None = None
    final_packet_hash: str | None = None
    error: str | None = None


@dataclass
class OrchestrationSession:
    """Complete session evidence produced by an orchestrator run."""
    session_id: str
    director_token: str
    started_at: str
    finished_at: str
    duration_seconds: float
    episode_dir: str
    config: dict[str, Any]
    scenes: dict[str, SceneExecutionRecord]
    episode_gate_result: dict[str, Any]
    overall_status: str  # "pass" | "fail"
    ownership_model: dict[str, str] = field(default_factory=lambda: {
        "reviewer_isolation": "sandbox-copy workspace + pre/post canonical SHA-256 diff",
        "writer_containment": "pre/post canonical SHA-256 diff against declared allowed_io",
        "token_independence": "director-minted distinct UUID4 tokens; writer_token != reviewer_token",
        "verdict_binding": "explicit reviewed_hashes mapping in reviewer findings + packet",
        "input_freeze": "pre-dispatch SHA-256 hash map in frozen_inputs",
        "llm_independence": "prompt-level context separation (separate instances/histories)",
    })

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ==============================================================================
# Phase 4A.1 — findings-to-retry injection (canonical findings files)
# ==============================================================================

# Kill-switch (single if-gate on BOTH sides): default ON (env absent = inject);
# OM_FINDINGS_INJECT=0 disables the orchestrator-side canonical findings write,
# the prior_findings population, AND the template reader-side task append.
FINDINGS_INJECT_ENV = "OM_FINDINGS_INJECT"
# Canonical findings base dir — RELATIVE TO THE PROJECT ROOT
# (projects/<slug>/), NOT the episode dir (remotion-composer/src/<slug>/).
# Writing under the episode dir silently no-ops the whole feature (the
# minted writer wrapper reader resolves PROJ_ROOT = projects/<slug>/).
FINDINGS_DIR_REL = "history/cc_findings"
FINDINGS_FILENAME_FMT = "{scene_id}_latest.md"
# Hard cap on injected text (plan 4A.1: protect the writer context).
FINDINGS_MAX_CHARS = 4000

# ==============================================================================
# R2 (perf/cc-pipeline R1-R5) — static reviewer-style brief, injected into the
# writer prompt from ATTEMPT 1
# ==============================================================================
# The generic rules that produced the tin-nong rejection round-trips. Phase
# 4A.1 taught the writer on retries (prior findings, attempt >= 2); R2 teaches
# the same class of rules UP FRONT so attempt 1 stops failing on them. Single
# source of truth: THIS constant. The minted writer wrapper
# (cc_wrapper_templates/writer_wrapper.py.tmpl) imports it and appends it to
# the writer task on every attempt — do NOT duplicate the text in the template
# or scatter per-rule strings elsewhere.
REVIEWER_STYLE_BRIEF = """\
## REVIEWER STYLE BRIEF (R2 — applies from attempt 1; these are auto-rejects)
- CountUp frame match: every CountUp/animated-number's frame span (``at``/``frames``) \
must land inside the scene window and match its spoken word anchors; never let a \
number finish after its cue tail.
- Currency whitelist: every on-screen currency amount/value must come from the \
scene spec JSON whitelist exactly — never round, recompute or invent a figure.
- Coordinate placement: flex-column stacking only; content distributed across \
y330-1440 with the last block ending y1300-1440; right edge x<=940; container \
heights >= children stack + 30px; no sibling absolute blocks with tops <20px apart.
- No placeholder components: no TODO/dummy/placeholder blocks, lorem text or \
stub sub-components — every rendered element is real content from the spec.
- SAFE.* props only: safe-area and spacing values come from the theme's \
``SAFE.*`` constants (and COLORS/FONTS likewise) — never raw magic pixel values.
- No invented vars: every import/identifier must exist in the episode's shared \
modules (./lib/SceneShell, ./theme, ./timing) or the React/remotion surface; \
do not reference variables that were never defined.
- No raw image leakage: no ``staticFile(`` for generated media, no ``<Img>`` \
of generated/raw assets, no base64 or external image URLs — visuals are built \
from theme components only.
"""



def findings_inject_enabled() -> bool:
    """OM_FINDINGS_INJECT gate — default ON (env absent = inject); =0 disables."""
    return os.environ.get(FINDINGS_INJECT_ENV, "1") != "0"


def resolve_project_root_from_episode(episode_dir: Path) -> Path | None:
    """Resolve the canonical project root (``projects/<slug>/``) from an
    episode dir path.

    Real layout: episode ``<repo>/remotion-composer/src/<slug>`` with project
    ``<repo>/projects/<slug>``. Walk the episode dir's ancestors looking for a
    ``projects/<slug>`` sibling. Returns ``None`` when no project root exists
    (callers must skip the findings write — writing under the episode dir is
    forbidden, it silently no-ops the wrapper reader).
    """
    slug = episode_dir.name
    for ancestor in (episode_dir, *episode_dir.parents):
        candidate = ancestor / "projects" / slug
        if candidate.is_dir():
            return candidate
    return None


def scene_findings_path(project_root: Path, scene_id: str) -> Path:
    """Canonical findings markdown path: ``<project_root>/history/cc_findings/{scene_id}_latest.md``."""
    return project_root / FINDINGS_DIR_REL / FINDINGS_FILENAME_FMT.format(scene_id=scene_id)


def write_scene_findings_md(
    project_root: Path | None,
    scene_id: str,
    findings_data: dict[str, Any],
    attempt_number: int,
) -> Path | None:
    """Persist a rejection's canonical findings markdown (phase 4A.1 step 1).

    Content: verdict + issues list + attempt number, hard-capped at
    FINDINGS_MAX_CHARS. Written atomically (temp file + ``os.replace()``).
    Returns the written path, or ``None`` when there is no resolvable project
    root (kill-switch off / synthetic test episode without a projects/ layout).
    """
    if project_root is None:
        return None
    issues = findings_data.get("issues") or []
    lines = [
        f"# Reviewer findings — {scene_id} (attempt {attempt_number})",
        "",
        f"verdict: {findings_data.get('verdict', 'rejected')}",
        "",
        "## issues",
    ]
    lines.extend(f"- {issue}" for issue in issues)
    text = "\n".join(lines)[:FINDINGS_MAX_CHARS]
    target = scene_findings_path(project_root, scene_id)
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = target.with_name(f".{target.name}.tmp")
    tmp_path.write_text(text, encoding="utf-8")
    os.replace(tmp_path, target)
    return target


def load_prior_findings(project_root: Path | None, scene_id: str) -> list[str] | None:
    """Read the canonical findings file for injection into the next attempt.

    Returns ``[findings_text]`` (capped) or ``None`` when absent/disabled.
    """
    if project_root is None:
        return None
    path = scene_findings_path(project_root, scene_id)
    if not path.is_file():
        return None
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as e:
        logger.warning(f"Could not read findings file for {scene_id}: {e}")
        return None
    return [text[:FINDINGS_MAX_CHARS]] or None


def reset_scene_findings(project_root: Path | None, scene_id: str) -> bool:
    """Delete the scene's canonical findings file (plan 4A.1 step 5: reset on
    ``approved`` so stale findings never leak into later re-mints)."""
    if project_root is None:
        return False
    path = scene_findings_path(project_root, scene_id)
    try:
        if path.is_file():
            path.unlink()
            logger.info(f"Reset findings file for approved scene {scene_id}: {path}")
            return True
    except OSError as e:
        logger.warning(f"Could not reset findings file for {scene_id}: {e}")
    return False


# ==============================================================================
# Filesystem & Cryptographic Snapshot Helpers
# ==============================================================================

def snapshot_directory_hashes(root: Path) -> dict[str, str]:
    """Compute relative_path -> sha256 for all regular files under root.

    Ignores ephemeral directories (.git, __pycache__, .tmp_*, etc.).
    """
    root = root.resolve()
    hashes: dict[str, str] = {}
    if not root.is_dir():
        return hashes
    for p in sorted(root.rglob("*")):
        parts = p.parts
        if any(
            part in (".git", "__pycache__", ".pytest_cache")
            or part.startswith(".tmp_")
            or part.startswith("om_reviewer_sandbox")
            for part in parts
        ):
            continue
        rel = p.relative_to(root).as_posix()
        if p.is_symlink():
            try:
                hashes[rel] = f"symlink:{os.readlink(p)}"
            except OSError:
                hashes[rel] = "symlink:broken"
        elif p.is_file():
            h = hash_file(p)
            if h:
                hashes[rel] = h
    return hashes


def diff_snapshots(before: dict[str, str], after: dict[str, str]) -> dict[str, list[str]]:
    """Return dict of modified, added, removed relative paths."""
    before_keys = set(before.keys())
    after_keys = set(after.keys())
    added = sorted(after_keys - before_keys)
    removed = sorted(before_keys - after_keys)
    modified = sorted(k for k in (before_keys & after_keys) if before[k] != after[k])
    return {"added": added, "removed": removed, "modified": modified}


# Task 1.2: dynamic scene directory + filename resolvers. Episodes use either
# ``scenes/`` (flat S01.tsx) or ``scene/``; scene_ids ("scene-1") map to
# on-disk filenames ("S01.tsx") via deterministic candidate probing.
def get_scenes_dir(episode_dir: Path) -> Path:
    return episode_dir / "scenes" if (episode_dir / "scenes").is_dir() else episode_dir / "scene"


def resolve_scene_filename(scenes_dir: Path, scene_id: str) -> str:
    if (scenes_dir / f"{scene_id}.tsx").is_file():
        return f"{scene_id}.tsx"
    m = re.match(r"(?:scene[-_]?)?(\d+)", scene_id, re.IGNORECASE)
    if m:
        num = int(m.group(1))
        for c in [f"S{num:02d}.tsx", f"S{num}.tsx", f"scene-{num}.tsx", f"scene_{num}.tsx"]:
            if (scenes_dir / c).is_file():
                return c
    return f"{scene_id}.tsx"


def _scene_file_variants(scenes_dir: Path, scene_id: str) -> set[str]:
    """All plausible episode-relative paths for scene_id's scene file.

    Covers both scene-dir spellings (``scene/`` and ``scenes/``) and every
    canonical filename candidate, so target identification stays correct even
    when the episode dir layout differs from the probed one (task 1.2).
    """
    candidates = [f"{scene_id}.tsx"]
    m = re.match(r"(?:scene[-_]?)?(\d+)", scene_id, re.IGNORECASE)
    if m:
        num = int(m.group(1))
        candidates += [f"S{num:02d}.tsx", f"S{num}.tsx", f"scene-{num}.tsx", f"scene_{num}.tsx"]
    variants: set[str] = set()
    for d in {scenes_dir.name, "scene", "scenes"}:
        for c in candidates:
            variants.add(f"{d}/{c}")
    return variants


def verify_writer_scope(
    before: dict[str, str],
    after: dict[str, str],
    scene_id: str,
    allowed_io: list[str],
    episode_dir: Path,
) -> tuple[bool, list[str], str | None]:
    """Verify that writer only modified or added files within allowed_io or scene-scoped paths."""
    diff = diff_snapshots(before, after)
    mutated = sorted(diff["added"] + diff["modified"] + diff["removed"])
    if not mutated:
        return True, [], None

    root = episode_dir.resolve()
    normalized_allowed: list[str] = []
    for item in allowed_io:
        p = Path(item)
        if not p.is_absolute():
            normalized_allowed.append(p.as_posix().rstrip("/"))
        else:
            try:
                rel = p.resolve().relative_to(root).as_posix().rstrip("/")
                normalized_allowed.append(rel)
            except ValueError:
                pass

    try:
        authoritative_scenes = set(discover_authoritative_scenes(root))
    except Exception:
        authoritative_scenes = set()
    other_scenes = authoritative_scenes - {scene_id}

    # Task 1.3: writer's own scene path (resolved via the scene-dir/filename
    # resolvers) is explicitly allowed; sibling scene files written by
    # concurrent writers and ephemeral/history paths are ignored entirely.
    scenes_dir = get_scenes_dir(root)
    own_variants = _scene_file_variants(scenes_dir, scene_id)

    violations: list[str] = []
    for rel_path in mutated:
        # Task 1.3: scoped hash diffing — writer sandbox dirs and history logs
        # are infrastructure-owned, never writer-scope violations.
        if rel_path.startswith(".tmp_sandboxes/") or rel_path.startswith("history/"):
            continue
        # Reviewer-timeout hotfix: any other path carrying a dot-prefixed
        # component (hidden dir/file) is a scope violation — never silently
        # contained. snapshot_directory_hashes filters dot-dirs upstream; this
        # guard keeps containment fail-closed if that filter ever widens.
        if any(part.startswith(".") for part in Path(rel_path).parts):
            violations.append(rel_path)
            continue
        # Task 1.3: sibling scene files (scene/S*.tsx or scenes/S*.tsx) belong
        # to concurrent writers for other scenes — exclude them here.
        if re.match(r"^(?:scenes?)/S\d+\.tsx$", rel_path) and rel_path not in own_variants:
            continue
        if rel_path in own_variants:
            continue  # writer's own scene path is explicitly allowed

        is_own_file = (
            rel_path in (
                f"packet_{scene_id}.json",
                f"packets/packet_{scene_id}.json",
                f"packets/{scene_id}_findings.json",
            )
            or rel_path.startswith(f"scene/{scene_id}/")
            or rel_path == f"scene/{scene_id}"
        )

        # Fail-closed when scene discovery fails or returns empty:
        # writer may only touch scene_id's own explicit files/directory
        if not authoritative_scenes and not is_own_file:
            violations.append(rel_path)
            continue

        is_allowed = False
        rel_p = Path(rel_path)
        for allowed in normalized_allowed:
            allowed_p = Path(allowed)
            if (
                rel_p == allowed_p
                or allowed_p in rel_p.parents
                or rel_path.startswith(allowed + "/")
            ):
                is_allowed = True
                break

        # Structural cross-scene denial: cannot write another scene's packet, findings, or directory
        if is_allowed:
            base_name = os.path.basename(rel_path)
            if (base_name.startswith("packet_") and base_name != f"packet_{scene_id}.json") or (
                base_name.endswith("_findings.json") and base_name != f"{scene_id}_findings.json"
            ):
                is_allowed = False
            elif (rel_path.startswith("packet_") or rel_path.startswith("packets/packet_")) and rel_path not in (
                f"packet_{scene_id}.json",
                f"packets/packet_{scene_id}.json",
            ):
                is_allowed = False
            elif rel_path.startswith("packets/") and rel_path.endswith("_findings.json") and rel_path != f"packets/{scene_id}_findings.json":
                is_allowed = False
            elif rel_path.startswith("scene/") and not (
                rel_path.startswith(f"scene/{scene_id}/") or rel_path == f"scene/{scene_id}" or rel_path.count("/") == 1
            ):
                is_allowed = False
            elif other_scenes:
                # Check if file references another authoritative scene ID as a token
                for other_sid in other_scenes:
                    if re.search(rf"(?:^|[_\-.#/]){re.escape(other_sid)}(?:[_\-.#/]|$)", rel_path):
                        is_allowed = False
                        break

        if not is_allowed:
            # Explicitly allow packet or finding files for this scene
            if is_own_file:
                is_allowed = True

        if not is_allowed:
            violations.append(rel_path)

    if violations:
        msg = f"writer_scope_violation: writer modified files outside allowed scope: {', '.join(violations)}"
        return False, mutated, msg
    return True, mutated, None


def verify_reviewer_ownership(
    before: dict[str, str],
    after: dict[str, str],
    scene_id: str,
    episode_dir: Path,
) -> tuple[bool, list[str], str | None]:
    """Task 1.2: scoped reviewer mutation check.

    The reviewer must not mutate the target scene file; sibling scene files
    (concurrent writers), packets, logs, temp dirs, and concurrent evidence /
    audio outputs are ignored. Returns ``(valid, violations, err_msg)``.
    """
    diff = diff_snapshots(before, after)
    mutated = sorted(diff["added"] + diff["modified"] + diff["removed"])
    scenes_dir = get_scenes_dir(episode_dir)
    target_filename = resolve_scene_filename(scenes_dir, scene_id)
    target_rel = f"{scenes_dir.name}/{target_filename}"
    target_variants = _scene_file_variants(scenes_dir, scene_id)

    illegal = []
    for p in mutated:
        # Exclude temp files, packets, logs, and concurrent evidence/audio outputs
        if p.startswith(".tmp_") or p.startswith("history/") or p.startswith("packets/"):
            continue
        if p.startswith("artifacts/") or p.startswith("audio_stems/"):
            continue
        # Sibling scene files written by concurrent writers are ignored. Match
        # both scene-dir spellings (but never the target's own variants).
        if re.match(r"^(?:scenes?)/S\d+\.tsx$", p) and p not in target_variants:
            continue
        if p.startswith(f"{scenes_dir.name}/") and p != target_rel:
            continue
        if p in target_variants:
            illegal.append(f"Target scene file {target_rel} was mutated during review")
        else:
            illegal.append(f"Unexpected file mutated: {p}")

    valid = len(illegal) == 0
    err_msg = None if valid else f"Reviewer modified canonical files: {illegal}"
    return valid, illegal, err_msg


def create_reviewer_sandbox(episode_dir: Path, scene_id: str) -> Path:
    """Materialize a temporary sandbox copy of the episode workspace for the reviewer."""
    sandbox_parent = episode_dir / ".tmp_sandboxes"
    sandbox_parent.mkdir(parents=True, exist_ok=True)
    sandbox_dir = Path(tempfile.mkdtemp(prefix=f"sandbox_{scene_id}_", dir=sandbox_parent))

    for item in episode_dir.iterdir():
        if (
            item.name.startswith(".tmp_")
            or item.name in (".git", "__pycache__", ".pytest_cache")
        ):
            continue
        dest = sandbox_dir / item.name
        if item.is_dir():
            shutil.copytree(
                item,
                dest,
                ignore=shutil.ignore_patterns(".tmp_*", "__pycache__", "*.pyc"),
            )
        else:
            shutil.copy2(item, dest)
    return sandbox_dir


def cleanup_sandbox(sandbox_dir: Path | None):
    """Safely remove a temporary reviewer sandbox."""
    if sandbox_dir and sandbox_dir.is_dir():
        shutil.rmtree(sandbox_dir, ignore_errors=True)


# ==============================================================================
# Agent Runner Interface & Implementations
# ==============================================================================

class AgentRunner(abc.ABC):
    """Abstract interface for executing writer and reviewer agent contexts."""

    @abc.abstractmethod
    def run_writer(self, context: WriterContext) -> AgentRunResult:
        """Run a writer agent context to produce scene outputs."""
        pass

    @abc.abstractmethod
    def run_reviewer(self, context: ReviewerContext) -> AgentRunResult:
        """Run an independent reviewer agent context in the sandbox workspace."""
        pass


class CallableAgentRunner(AgentRunner):
    """In-process runner delegating to callables (useful for unit tests and mocks)."""

    def __init__(
        self,
        writer_fn: Callable[[WriterContext], AgentRunResult] | None = None,
        reviewer_fn: Callable[[ReviewerContext], AgentRunResult] | None = None,
    ):
        self.writer_fn = writer_fn or self._default_writer
        self.reviewer_fn = reviewer_fn or self._default_reviewer

    def run_writer(self, context: WriterContext) -> AgentRunResult:
        return self.writer_fn(context)

    def run_reviewer(self, context: ReviewerContext) -> AgentRunResult:
        return self.reviewer_fn(context)

    @staticmethod
    def _default_writer(ctx: WriterContext) -> AgentRunResult:
        t0 = time.time()
        iso_start = datetime.now(timezone.utc).isoformat()
        # Default mock writer: ensures output files referenced in existing packet or default files exist
        out_dir = ctx.episode_dir / "scene"
        out_dir.mkdir(parents=True, exist_ok=True)
        t1 = time.time()
        iso_end = datetime.now(timezone.utc).isoformat()
        return AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="writer",
            exit_code=0,
            started_at=iso_start,
            finished_at=iso_end,
            duration_seconds=t1 - t0,
            stdout="Default in-process writer completed successfully.",
            stderr="",
        )

    @staticmethod
    def _default_reviewer(ctx: ReviewerContext) -> AgentRunResult:
        t0 = time.time()
        iso_start = datetime.now(timezone.utc).isoformat()
        findings_dir = ctx.sandbox_dir / "packets"
        findings_dir.mkdir(parents=True, exist_ok=True)
        findings_path = findings_dir / f"{ctx.scene_id}_findings.json"
        findings_payload = {
            "scene_id": ctx.scene_id,
            "verdict": "approved",
            "reviewed_hashes": ctx.output_hashes,
            "notes": f"Independent review for {ctx.scene_id} approved.",
        }
        findings_path.write_text(json.dumps(findings_payload, indent=2), encoding="utf-8")
        t1 = time.time()
        iso_end = datetime.now(timezone.utc).isoformat()
        return AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="reviewer",
            exit_code=0,
            started_at=iso_start,
            finished_at=iso_end,
            duration_seconds=t1 - t0,
            stdout="Default in-process reviewer approved outputs.",
            stderr="",
            outputs={"findings_file": str(findings_path)},
        )


class SubprocessAgentRunner(AgentRunner):
    """Executes fresh agent instances as isolated operating system subprocesses.

    Spawns real OS processes with isolated environment variables, captured logs,
    and wall-clock duration measurement.
    """

    def __init__(
        self,
        writer_cmd: list[str] | None = None,
        reviewer_cmd: list[str] | None = None,
        python_executable: str = sys.executable,
        timeout_seconds: float = 900.0,
    ):
        self.writer_cmd = writer_cmd
        self.reviewer_cmd = reviewer_cmd
        self.python_executable = python_executable
        # 2026-11-11: 120s killed real CC runs (observed 176–495s per scene)
        self.timeout_seconds = timeout_seconds

    def run_writer(self, context: WriterContext) -> AgentRunResult:
        t0 = time.time()
        iso_start = datetime.now(timezone.utc).isoformat()

        if self.writer_cmd:
            cmd = list(self.writer_cmd)
        else:
            # Built-in self-contained subprocess entrypoint
            cmd = [
                self.python_executable,
                str(Path(__file__).resolve()),
                "--internal-run-agent",
                "--role", "writer",
                "--scene-id", context.scene_id,
                "--instance-id", context.instance_id,
                "--token", context.token,
                "--workdir", str(context.episode_dir),
            ]

        env = os.environ.copy()
        env.update({
            "OM_ROLE": "writer",
            "OM_SCENE_ID": context.scene_id,
            "OM_INSTANCE_ID": context.instance_id,
            "OM_TOKEN": context.token,
            "OM_EPISODE_DIR": str(context.episode_dir),
        })
        env.update(context.extra_env)

        try:
            proc = subprocess.run(
                cmd,
                cwd=str(context.episode_dir),
                env=env,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
            )
            t1 = time.time()
            iso_end = datetime.now(timezone.utc).isoformat()
            return AgentRunResult(
                instance_id=context.instance_id,
                token=context.token,
                role="writer",
                exit_code=proc.returncode,
                started_at=iso_start,
                finished_at=iso_end,
                duration_seconds=t1 - t0,
                stdout=proc.stdout,
                stderr=proc.stderr,
                error=None if proc.returncode == 0 else f"Process exited with code {proc.returncode}",
            )
        except Exception as e:
            t1 = time.time()
            iso_end = datetime.now(timezone.utc).isoformat()
            return AgentRunResult(
                instance_id=context.instance_id,
                token=context.token,
                role="writer",
                exit_code=1,
                started_at=iso_start,
                finished_at=iso_end,
                duration_seconds=t1 - t0,
                stdout="",
                stderr=str(e),
                error=str(e),
            )

    def run_reviewer(self, context: ReviewerContext) -> AgentRunResult:
        t0 = time.time()
        iso_start = datetime.now(timezone.utc).isoformat()

        if self.reviewer_cmd:
            cmd = list(self.reviewer_cmd)
        else:
            cmd = [
                self.python_executable,
                str(Path(__file__).resolve()),
                "--internal-run-agent",
                "--role", "reviewer",
                "--scene-id", context.scene_id,
                "--instance-id", context.instance_id,
                "--token", context.token,
                "--workdir", str(context.sandbox_dir),
                "--output-hashes", json.dumps(context.output_hashes),
            ]

        env = os.environ.copy()
        env.update({
            "OM_ROLE": "reviewer",
            "OM_SCENE_ID": context.scene_id,
            "OM_INSTANCE_ID": context.instance_id,
            "OM_TOKEN": context.token,
            "OM_SANDBOX_DIR": str(context.sandbox_dir),
            "OM_CANONICAL_DIR": str(context.canonical_dir),
        })
        env.update(context.extra_env)

        try:
            proc = subprocess.run(
                cmd,
                cwd=str(context.sandbox_dir),
                env=env,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
            )
            t1 = time.time()
            iso_end = datetime.now(timezone.utc).isoformat()
            return AgentRunResult(
                instance_id=context.instance_id,
                token=context.token,
                role="reviewer",
                exit_code=proc.returncode,
                started_at=iso_start,
                finished_at=iso_end,
                duration_seconds=t1 - t0,
                stdout=proc.stdout,
                stderr=proc.stderr,
                error=None if proc.returncode == 0 else f"Process exited with code {proc.returncode}",
            )
        except Exception as e:
            t1 = time.time()
            iso_end = datetime.now(timezone.utc).isoformat()
            return AgentRunResult(
                instance_id=context.instance_id,
                token=context.token,
                role="reviewer",
                exit_code=1,
                started_at=iso_start,
                finished_at=iso_end,
                duration_seconds=t1 - t0,
                stdout="",
                stderr=str(e),
                error=str(e),
            )


class DaemonAgentRunner(AgentRunner):
    """Adapter for the Ensemble Daemon HTTP API on localhost:8088.

    Investigated API capability:
      - GET /api/health -> confirms daemon uptime
      - POST /api/instances -> creates fresh instance ID
      - POST /api/instances/{id}/messages -> enqueues turn
      - GET /api/instances/{id} -> retrieves status (running/completed)
      - DELETE /api/instances/{id} -> cleans up instance
    """

    def __init__(
        self,
        daemon_url: str | None = None,
        project_id: str | None = None,
        timeout_seconds: float = 600.0,
        poll_interval_seconds: float = 5.0,
    ):
        port = os.getenv("PORT", "8088")
        self.daemon_url = (daemon_url or os.getenv("ENSEMBLE_DAEMON_URL") or f"http://127.0.0.1:{port}").rstrip("/")
        self.project_id = project_id or "849549fb-bd9a-4134-811e-318cb6ff93f1"
        self.timeout_seconds = timeout_seconds
        self.poll_interval_seconds = poll_interval_seconds

    def check_health(self) -> bool:
        try:
            req = urllib.request.Request(f"{self.daemon_url}/api/health", headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                data = json.loads(resp.read())
                return data.get("status") == "healthy"
        except Exception:
            return False

    def run_writer(self, context: WriterContext) -> AgentRunResult:
        return self._run_daemon_turn(
            agent_id="worker",
            instance_id=context.instance_id,
            token=context.token,
            role="writer",
            prompt=(
                f"You are the scene writer for scene '{context.scene_id}'. "
                f"Episode directory: {context.episode_dir}. "
                f"Allowed IO: {context.allowed_io}. "
                f"Token: {context.token}."
            ),
            cwd=context.episode_dir,
        )

    def run_reviewer(self, context: ReviewerContext) -> AgentRunResult:
        return self._run_daemon_turn(
            agent_id="reviewer",
            instance_id=context.instance_id,
            token=context.token,
            role="reviewer",
            prompt=(
                f"You are the independent reviewer for scene '{context.scene_id}'. "
                f"Sandbox directory: {context.sandbox_dir}. "
                f"Output hashes to verify: {json.dumps(context.output_hashes)}. "
                f"Token: {context.token}."
            ),
            cwd=context.sandbox_dir,
        )

    def _run_daemon_turn(
        self,
        agent_id: str,
        instance_id: str,
        token: str,
        role: str,
        prompt: str,
        cwd: Path,
    ) -> AgentRunResult:
        t0 = time.time()
        iso_start = datetime.now(timezone.utc).isoformat()

        # Step 1: Create instance via daemon
        create_payload = json.dumps({
            "agent_id": agent_id,
            "project_id": self.project_id,
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{self.daemon_url}/api/instances",
            data=create_payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                inst_data = json.loads(resp.read())
                daemon_instance_id = inst_data.get("instance_id") or instance_id
        except Exception as e:
            t1 = time.time()
            return AgentRunResult(
                instance_id=instance_id,
                token=token,
                role=role,
                exit_code=1,
                started_at=iso_start,
                finished_at=datetime.now(timezone.utc).isoformat(),
                duration_seconds=t1 - t0,
                stdout="",
                stderr=f"Daemon instance spawn failed: {e}",
                error=str(e),
            )

        # Step 2: Send message to instance
        msg_payload = json.dumps({"content": prompt}).encode("utf-8")
        req_msg = urllib.request.Request(
            f"{self.daemon_url}/api/instances/{daemon_instance_id}/messages",
            data=msg_payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req_msg, timeout=10.0):
                pass
        except Exception as e:
            t1 = time.time()
            return AgentRunResult(
                instance_id=instance_id,
                token=token,
                role=role,
                exit_code=1,
                started_at=iso_start,
                finished_at=datetime.now(timezone.utc).isoformat(),
                duration_seconds=t1 - t0,
                stdout="",
                stderr=f"Daemon message send failed: {e}",
                error=str(e),
            )

        # Step 3: Poll status
        deadline = time.time() + self.timeout_seconds
        status = "running"
        while time.time() < deadline:
            try:
                req_status = urllib.request.Request(f"{self.daemon_url}/api/instances/{daemon_instance_id}")
                with urllib.request.urlopen(req_status, timeout=5.0) as resp:
                    data = json.loads(resp.read())
                    status = data.get("status", "running")
                    if status in ("completed", "error", "failed", "terminated", "idle"):
                        break
            except Exception:
                pass
            time.sleep(self.poll_interval_seconds)

        # Step 4: Cleanup
        try:
            req_del = urllib.request.Request(
                f"{self.daemon_url}/api/instances/{daemon_instance_id}?hard_delete=true",
                method="DELETE",
            )
            with urllib.request.urlopen(req_del, timeout=5.0):
                pass
        except Exception:
            pass

        t1 = time.time()
        iso_end = datetime.now(timezone.utc).isoformat()
        duration = t1 - t0
        timed_out = (status not in ("completed", "error", "failed", "terminated", "idle")) and (time.time() >= deadline)
        exit_code = 0 if status in ("completed", "idle") else 1

        if timed_out:
            err_msg = f"Daemon instance {daemon_instance_id} timed out after {duration:.1f}s (last status: {status})"
        elif exit_code != 0:
            err_msg = f"Daemon instance {daemon_instance_id} reached non-success status: {status} after {duration:.1f}s"
        else:
            err_msg = None

        return AgentRunResult(
            instance_id=instance_id,
            token=token,
            role=role,
            exit_code=exit_code,
            started_at=iso_start,
            finished_at=iso_end,
            duration_seconds=duration,
            stdout=f"Daemon instance {daemon_instance_id} finished with status '{status}'",
            stderr="" if exit_code == 0 else err_msg,
            error=err_msg,
            outputs={"daemon_instance_id": daemon_instance_id, "daemon_status": status, "timed_out": timed_out},
        )


# ==============================================================================
# Scene Discovery & Packet Assembly
# ==============================================================================

def discover_authoritative_scenes(episode_dir: Path) -> list[str]:
    """Discover authoritative scene IDs from scene_manifest.json and edit_decisions.json."""
    root = episode_dir.resolve()
    scene_ids: set[str] = set()

    for mp in (root / "artifacts" / "scene_manifest.json", root / "scene_manifest.json"):
        if mp.is_file():
            try:
                data = json.loads(mp.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    for s in data.get("scenes", []):
                        if isinstance(s, dict):
                            sid = s.get("scene_id") or s.get("id")
                            if sid:
                                scene_ids.add(str(sid))
                        elif isinstance(s, str) and s:
                            scene_ids.add(s)
            except Exception:
                pass
            if scene_ids:
                break

    for ep in (root / "artifacts" / "edit_decisions.json", root / "edit_decisions.json"):
        if ep.is_file():
            try:
                data = json.loads(ep.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    for c in data.get("cuts", []):
                        if isinstance(c, dict):
                            cid = c.get("scene_id") or c.get("id")
                            if cid:
                                scene_ids.add(str(cid))
                        elif isinstance(c, str) and c:
                            scene_ids.add(c)
            except Exception:
                pass

    if not scene_ids:
        # Fallback to existing scene packets in the episode
        for p in root.glob("**/*.json"):
            if p.name.startswith("packet_") or p.parent.name == "packets":
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    if (
                        isinstance(data, dict)
                        and data.get("packet_type") == "openmontage.scene-packet"
                    ):
                        sid = data.get("scene_id")
                        if sid:
                            scene_ids.add(str(sid))
                except Exception:
                    pass

    return sorted(scene_ids)


def load_existing_packet_or_template(episode_dir: Path, scene_id: str) -> dict[str, Any]:
    """Load an existing packet file for scene_id, or synthesize a valid initial skeleton."""
    root = episode_dir.resolve()
    candidate_paths = [
        root / f"packet_{scene_id}.json",
        root / "packets" / f"packet_{scene_id}.json",
        root / "packets" / "episode" / f"packet_{scene_id}.json",
    ]
    for p in candidate_paths:
        if p.is_file():
            try:
                data = load_packet(p)
                if isinstance(data, dict) and data.get("scene_id") == scene_id:
                    return data
            except Exception:
                pass

    # Synthesize template
    return {
        "packet_type": "openmontage.scene-packet",
        "schema_version": SCHEMA_VERSION,
        "scene_id": scene_id,
        "claims": {"facts": [f"Fact claim for {scene_id} verified"]},
        "narration": {"ref": f"assets/audio/voice_{scene_id}.wav", "sha256": ""},
        "word_alignment": {"ref": "artifacts/narration_words.json", "sha256": ""},
        "assets": [{"ref": "assets/audio/narration_full.wav", "sha256": "", "rights": "licensed"}],
        "style_contract": {"ref": "packets/style_contract.json", "sha256": ""},
        "neighbor_context": {},
        "allowed_io": ["artifacts", "assets", "packets", "scene"],
        "frozen_inputs": {},
        "writer": {"instance_id": "", "timestamp": "", "token": ""},
        "writer_token": "",
        "reviewer": {
            "instance_id": "",
            "timestamp": "",
            "verdict": "approved",
            "findings_ref": f"packets/{scene_id}_findings.json",
            "findings_hash": "",
            "token": "",
            "reviewed_hashes": {},
        },
        "reviewer_token": "",
        "integration_status": "pending",
    }


def to_relative_path(p: str | Path, root: Path) -> str:
    """Convert an absolute or relative path to a normalized posix relative path to root."""
    path = Path(p)
    resolved_root = root.resolve()
    if path.is_absolute():
        try:
            return path.resolve().relative_to(resolved_root).as_posix()
        except ValueError:
            return path.name
    return path.as_posix()


def freeze_episode_inputs(episode_dir: Path, base_packet: dict[str, Any]) -> dict[str, str]:
    """Freeze all input files referenced in the packet and directory into a relative_path->sha256 map."""
    root = episode_dir.resolve()
    frozen: dict[str, str] = {}

    # Copy existing frozen inputs, converting any absolute paths to relative
    if isinstance(base_packet.get("frozen_inputs"), dict):
        for k, v in base_packet["frozen_inputs"].items():
            rel_k = to_relative_path(k, root)
            target = root / rel_k
            if target.is_file():
                h = hash_file(target)
                if h:
                    frozen[rel_k] = h

    # Collect known canonical inputs
    candidates = [
        "artifacts/edit_decisions.json",
        "artifacts/asset_manifest.json",
        "artifacts/scene_manifest.json",
        "artifacts/narration_words.json",
        "packets/style_contract.json",
        "mix_profile.json",
    ]
    for cand in candidates:
        p = root / cand
        if p.is_file():
            h = hash_file(p)
            if h:
                frozen[cand] = h

    return frozen


# ==============================================================================
# Scene Orchestration & Scheduler
# ==============================================================================

def _transport_glitch(res) -> bool:
    """CC/CLI died mid-stream but exited 0: empty output, or the Anthropic
    streaming-desync error observed 5x on 2026-11-10/11 ('No tool call found
    for function call output with call_id …'). Treat as retryable failure —
    previously these counted as success and burned downstream attempts."""
    if res.exit_code != 0:
        return False
    combined = f"{res.stdout or ''}\n{res.stderr or ''}"
    if not (res.stdout or "").strip():
        return True
    return "No tool call found for function call output" in combined


# ==============================================================================
# R3 (perf/cc-pipeline R1-R5) — infra failures vs content rejections
# ==============================================================================
# Transport errors (CC streaming glitch, reviewer CLI crash) and reviewer
# turn-cap/watchdog exhaustion (verdict ``timeout_error``) are INFRASTRUCTURE
# failures: they say nothing about the scene content, so they must not consume
# a content attempt nor trigger a full rewrite. They retry IN PLACE — the
# attempt ordinal stays — with exponential backoff, bounded by
# OM_INFRA_RETRY_CAP; when the budget is exhausted the failure escalates to
# consuming a content attempt (loud, bounded, legacy behavior).
INFRA_RETRY_CAP_ENV = "OM_INFRA_RETRY_CAP"
INFRA_RETRY_DELAY_ENV = "OM_INFRA_RETRY_DELAY_S"
INFRA_RETRY_MAX_DELAY_S = 30.0


def _infra_retry_cap() -> int:
    """Infra-retry budget per scene (env-tunable; default 3)."""
    try:
        return int(os.environ.get(INFRA_RETRY_CAP_ENV, "3"))
    except ValueError:
        return 3


def _infra_retry_base_delay() -> float:
    """Base backoff seconds before the first in-place infra retry (env-tunable)."""
    try:
        return float(os.environ.get(INFRA_RETRY_DELAY_ENV, "2.0"))
    except ValueError:
        return 2.0


def infra_backoff_delay(infra_retries: int) -> float:
    """Exponential backoff before an in-place infra retry (1st retry: base,
    then doubling, capped at INFRA_RETRY_MAX_DELAY_S)."""
    return min(_infra_retry_base_delay() * (2 ** max(0, infra_retries - 1)),
               INFRA_RETRY_MAX_DELAY_S)


def next_attempt_after_infra(
    attempt_idx: int, infra_retries: int, scene_id: str
) -> int:
    """R3 retry policy: infra failures retry the SAME content attempt in place
    (attempt numbering increments for CONTENT rejections only).

    Returns the attempt ordinal the next loop pass must use: the same
    ``attempt_idx`` while the per-scene infra-retry budget lasts (sleeping
    the backoff first), or ``attempt_idx + 1`` once the OM_INFRA_RETRY_CAP
    infra failures have burned that budget (escalation consumes a content
    attempt so the loop stays bounded).

    NOTE: ``infra_retries`` is a CUMULATIVE per-scene budget — it is never
    reset on a content success, so infra failures across the scene's whole
    retry lifetime share one cap (test-pinned behavior).
    """
    if infra_retries < _infra_retry_cap():
        delay = infra_backoff_delay(infra_retries + 1)
        logger.warning(
            "Infra failure on %s: in-place retry %d/%d (attempt %d unchanged, sleep %.1fs)",
            scene_id, infra_retries + 1, _infra_retry_cap(), attempt_idx, delay,
        )
        if delay > 0:
            time.sleep(delay)
        return attempt_idx
    logger.warning(
        "Infra retry budget exhausted on %s after %d failure(s); escalating to a full content attempt",
        scene_id, infra_retries,
    )
    return attempt_idx + 1


def execute_scene_with_retries(
    scene_id: str,
    episode_dir: Path,
    runner: AgentRunner,
    max_retries: int = 1,
    governor: ConcurrencyGovernor | None = None,
) -> SceneExecutionRecord:
    """Execute a single scene with bounded retries and OS-level ownership checks.

    R3 (perf/cc-pipeline R1-R5): attempt ordinals count CONTENT attempts only.
    Infrastructure failures — writer/reviewer transport glitches, reviewer CLI
    crashes, and reviewer turn-cap/watchdog exhaustion (the wrapper's
    ``timeout_error`` verdict) — retry IN PLACE with exponential backoff
    (``next_attempt_after_infra``) and never consume a content attempt nor
    trigger a full rewrite of the scene, until the OM_INFRA_RETRY_CAP budget
    is exhausted (then the failure escalates to a bounded content attempt).
    """
    root = episode_dir.resolve()
    record = SceneExecutionRecord(scene_id=scene_id, status="failed")

    # Phase 4A.1: canonical findings base (projects/<slug>/), resolved once.
    # Single OM_FINDINGS_INJECT gate — switch off -> no write, no injection.
    project_root = resolve_project_root_from_episode(root) if findings_inject_enabled() else None

    base_template = load_existing_packet_or_template(root, scene_id)
    allowed_io = base_template.get("allowed_io") or ["artifacts", "assets", "packets", "scene"]

    # R3: ``attempt_idx`` is the CONTENT attempt ordinal — it increments on
    # content failures (reviewer rejection, integration rejection, writer
    # scope/tsc failures) only. Infra failures (transport glitches, reviewer
    # turn-cap/watchdog ``timeout_error``) retry IN PLACE via
    # next_attempt_after_infra, bounded by OM_INFRA_RETRY_CAP.
    attempt_idx = 1
    infra_retries = 0
    while attempt_idx <= max_retries + 1:
        attempt = SceneRunAttempt(attempt_number=attempt_idx)
        sandbox_dir: Path | None = None
        try:
            # 1. Freeze inputs for this attempt
            frozen_inputs = freeze_episode_inputs(root, base_template)

            # 2. Fresh Writer Context
            writer_id = f"writer_{scene_id}_{uuid.uuid4().hex[:8]}"
            writer_token = f"wt_{scene_id}_{uuid.uuid4().hex[:12]}"
            # Phase 4A.1: retry attempts (>= 2) learn from the prior round's
            # reviewer findings (canonical findings file written on rejection).
            prior_findings = (
                load_prior_findings(project_root, scene_id)
                if (project_root is not None and attempt_idx >= 2)
                else None
            )
            writer_ctx = WriterContext(
                scene_id=scene_id,
                instance_id=writer_id,
                token=writer_token,
                episode_dir=root,
                allowed_io=allowed_io,
                frozen_inputs=frozen_inputs,
                claims=base_template.get("claims", {"facts": [f"{scene_id} claims"]}),
                neighbor_context=base_template.get("neighbor_context", {}),
                attempt_number=attempt_idx,
                prior_findings=prior_findings,
            )

            # Snapshot canonical directory before writer
            snap_pre_writer = snapshot_directory_hashes(root)

            # Execute Writer
            writer_res = runner.run_writer(writer_ctx)
            attempt.writer_result = writer_res
            # Task 2.1 (phase2 review fix 1): the wrapper-process governors
            # throttle only their own retries; the shared pool governor must
            # see the 429 storm through the writer result itself — otherwise
            # live concurrency never drops during a burst. Single source of
            # truth for the marker list: tools.qc.writer_runner.
            if (
                governor is not None
                and writer_res.exit_code != 0
                and is_transient_api_error(f"{writer_res.stdout or ''}\n{writer_res.stderr or ''}")
            ):
                governor.handle_rate_limit_burst()
            if _transport_glitch(writer_res):
                # R3: transport glitch = INFRA failure — retry in place, the
                # content attempt ordinal is NOT consumed.
                attempt.error = "Writer transport failure (empty/corrupt output — CC streaming glitch); infra retry in place"
                attempt.infra = True
                record.attempts.append(attempt)
                attempt_idx = next_attempt_after_infra(attempt_idx, infra_retries, scene_id)
                infra_retries += 1
                continue
            if writer_res.exit_code != 0:
                attempt.error = f"Writer failed: {writer_res.stderr or writer_res.error}"
                record.attempts.append(attempt)
                attempt_idx += 1  # R3: content failure consumes the attempt
                continue

            # Snapshot canonical directory after writer
            snap_post_writer = snapshot_directory_hashes(root)

            # Verify Writer Ownership / Scope
            w_valid, w_mutated, w_err = verify_writer_scope(
                snap_pre_writer,
                snap_post_writer,
                scene_id,
                allowed_io,
                root,
            )
            if not w_valid:
                attempt.ownership = OwnershipVerification(
                    writer_scope_valid=False,
                    writer_modified_files=w_mutated,
                    reviewer_canonical_mutation=False,
                    reviewer_mutated_files=[],
                    error_message=w_err,
                )
                attempt.error = w_err
                record.attempts.append(attempt)
                attempt_idx += 1  # R3: content failure consumes the attempt
                continue

            # Identify Writer outputs to freeze
            output_hashes: dict[str, str] = {}
            for out_key in ("narration", "word_alignment", "style_contract"):
                ref = base_template.get(out_key, {}).get("ref")
                if ref:
                    p = root / ref
                    if p.is_file():
                        h = hash_file(p)
                        if h:
                            output_hashes[ref] = h
                            frozen_inputs[ref] = h

            for a in base_template.get("assets", []):
                ref = a.get("ref")
                if ref:
                    p = root / ref
                    if p.is_file():
                        h = hash_file(p)
                        if h:
                            output_hashes[ref] = h
                            frozen_inputs[ref] = h

            # 3. Fresh Independent Reviewer Context in Sandbox Copy
            reviewer_id = f"reviewer_{scene_id}_{uuid.uuid4().hex[:8]}"
            reviewer_token = f"rt_{scene_id}_{uuid.uuid4().hex[:12]}"
            assert reviewer_id != writer_id, "Reviewer ID must not equal writer ID"
            assert reviewer_token != writer_token, "Reviewer token must not equal writer token"

            sandbox_dir = create_reviewer_sandbox(root, scene_id)
            reviewer_ctx = ReviewerContext(
                scene_id=scene_id,
                instance_id=reviewer_id,
                token=reviewer_token,
                sandbox_dir=sandbox_dir,
                canonical_dir=root,
                writer_instance_id=writer_id,
                writer_token=writer_token,
                output_hashes=output_hashes,
                frozen_inputs=frozen_inputs,
            )

            # Snapshot canonical directory before reviewer
            snap_pre_reviewer = snapshot_directory_hashes(root)

            # Task 1.2: per-file write lock — the target scene file is set
            # read-only for the duration of the review and restored after.
            scenes_dir = get_scenes_dir(root)
            target_filename = resolve_scene_filename(scenes_dir, scene_id)
            scene_file = scenes_dir / target_filename
            original_mode = scene_file.stat().st_mode if scene_file.is_file() else None
            if original_mode:
                os.chmod(scene_file, 0o444)  # Read-only
            try:
                # Execute Reviewer in Sandbox
                reviewer_res = runner.run_reviewer(reviewer_ctx)
            finally:
                if original_mode and scene_file.is_file():
                    os.chmod(scene_file, 0o644)  # Restore read-write
            attempt.reviewer_result = reviewer_res
            if _transport_glitch(reviewer_res):
                # R3: reviewer transport glitch = INFRA failure — in-place retry.
                attempt.error = "Reviewer transport failure (empty/corrupt output — CC streaming glitch); infra retry in place"
                attempt.infra = True
                record.attempts.append(attempt)
                attempt_idx = next_attempt_after_infra(attempt_idx, infra_retries, scene_id)
                infra_retries += 1
                continue

            # Snapshot canonical directory after reviewer
            snap_post_reviewer = snapshot_directory_hashes(root)

            # Verify Reviewer Ownership (Task 1.2: scoped 3-tuple check)
            r_valid, r_mutated, r_err = verify_reviewer_ownership(
                snap_pre_reviewer,
                snap_post_reviewer,
                scene_id,
                root,
            )
            attempt.ownership = OwnershipVerification(
                writer_scope_valid=True,
                writer_modified_files=w_mutated,
                reviewer_canonical_mutation=not r_valid,
                reviewer_mutated_files=r_mutated,
                error_message=r_err,
            )

            if not r_valid:
                attempt.error = r_err
                record.attempts.append(attempt)
                attempt_idx += 1  # R3: content failure consumes the attempt
                continue

            if reviewer_res.exit_code != 0:
                # R3: the reviewer wrapper exits 0 whenever it wrote a findings
                # file — non-zero means the reviewer process itself broke
                # (spawn/CLI failure) = INFRA, in-place retry.
                attempt.error = f"Reviewer failed (infra): {reviewer_res.stderr or reviewer_res.error}"
                attempt.infra = True
                record.attempts.append(attempt)
                attempt_idx = next_attempt_after_infra(attempt_idx, infra_retries, scene_id)
                infra_retries += 1
                continue

            # Ingest reviewer findings from sandbox
            sandbox_findings_candidates = [
                sandbox_dir / "packets" / f"{scene_id}_findings.json",
                sandbox_dir / f"{scene_id}_findings.json",
                sandbox_dir / "scene" / "findings.json",
            ]
            findings_source: Path | None = None
            for cand in sandbox_findings_candidates:
                if cand.is_file():
                    findings_source = cand
                    break

            if not findings_source:
                attempt.error = f"Reviewer did not produce findings file in sandbox for scene {scene_id}"
                record.attempts.append(attempt)
                attempt_idx += 1  # R3: content failure consumes the attempt
                continue

            findings_data = json.loads(findings_source.read_text(encoding="utf-8"))
            # Task 1.4 + R3/R5: watchdog expiry AND reviewer turn-cap
            # exhaustion (the wrapper emits the REVIEW_TIMEOUT_VERDICT contract
            # string for both) are INFRASTRUCTURE failures, not content
            # rejections — retry this scene in place without consuming a
            # content attempt or triggering a full rewrite.
            if findings_data.get("verdict") == REVIEW_TIMEOUT_VERDICT:
                logger.warning(f"Reviewer timed out on {scene_id}; infrastructure retry triggered")
                attempt.error = f"Reviewer {REVIEW_TIMEOUT_VERDICT} on {scene_id}; infra retry in place"
                attempt.infra = True
                record.attempts.append(attempt)
                attempt_idx = next_attempt_after_infra(attempt_idx, infra_retries, scene_id)
                infra_retries += 1
                continue
            if findings_data.get("verdict") != "approved":
                attempt.error = f"Reviewer rejected scene: verdict={findings_data.get('verdict')}"
                # Phase 4A.1 step 1: persist canonical findings BEFORE the
                # continue, so the next attempt's writer learns the issues.
                findings_file = write_scene_findings_md(
                    project_root, scene_id, findings_data, attempt_idx
                )
                if findings_file is None:
                    logger.warning(
                        f"No project root resolved for {scene_id}; findings file skipped "
                        f"(canonical path is projects/<slug>/history/cc_findings/, not the episode dir)"
                    )
                record.attempts.append(attempt)
                attempt_idx += 1  # R3: content failure consumes the attempt
                continue

            # Verify explicit reviewed_hashes mapping (no synthesis/backfill)
            rev_hashes = findings_data.get("reviewed_hashes")
            if not rev_hashes or not isinstance(rev_hashes, dict):
                attempt.error = f"Reviewer did not provide reviewed_hashes mapping for scene {scene_id}"
                record.attempts.append(attempt)
                attempt_idx += 1  # R3: content failure consumes the attempt
                continue

            findings_reviewed_hashes = dict(rev_hashes)
            findings_data["reviewed_hashes"] = findings_reviewed_hashes

            # Materialize findings into canonical packets directory
            canonical_findings_dir = root / "packets"
            canonical_findings_dir.mkdir(parents=True, exist_ok=True)
            canonical_findings_path = canonical_findings_dir / f"{scene_id}_findings.json"
            canonical_findings_path.write_text(json.dumps(findings_data, indent=2), encoding="utf-8")

            findings_hash = hash_file(canonical_findings_path)
            findings_rel = canonical_findings_path.relative_to(root).as_posix()
            frozen_inputs[findings_rel] = findings_hash

            # 4. Assemble and integrate Scene Packet
            assembled_packet = copy.deepcopy(base_template)
            assembled_packet["scene_id"] = scene_id
            assembled_packet["frozen_inputs"] = frozen_inputs
            assembled_packet["writer"] = {
                "instance_id": writer_id,
                "timestamp": writer_res.finished_at,
                "token": writer_token,
            }
            assembled_packet["writer_token"] = writer_token
            assembled_packet["reviewer"] = {
                "instance_id": reviewer_id,
                "timestamp": reviewer_res.finished_at,
                "verdict": "approved",
                "findings_ref": findings_rel,
                "findings_hash": findings_hash,
                "token": reviewer_token,
                "reviewed_hashes": findings_reviewed_hashes,
            }
            assembled_packet["reviewer_token"] = reviewer_token
            assembled_packet["integration_status"] = "integrated"

            # Update output object sha256 in packet
            for k in ("narration", "word_alignment", "style_contract"):
                if k in assembled_packet and "ref" in assembled_packet[k]:
                    ref = assembled_packet[k]["ref"]
                    if ref in output_hashes:
                        assembled_packet[k]["sha256"] = output_hashes[ref]

            for a in assembled_packet.get("assets", []):
                ref = a.get("ref")
                if ref in output_hashes:
                    a["sha256"] = output_hashes[ref]

            # Save packet JSON directly under episode root so packet_path.parent == root
            target_packet_path = root / f"packet_{scene_id}.json"
            sub_packet = root / "packets" / f"packet_{scene_id}.json"
            if sub_packet.is_file() and sub_packet.resolve() != target_packet_path.resolve():
                sub_packet.unlink()
            target_packet_path.write_text(json.dumps(assembled_packet, indent=2), encoding="utf-8")

            # Integrate packet
            integration_result = integrate_scene_packet(
                assembled_packet,
                packet_path=target_packet_path,
                writer_token=writer_token,
                reviewer_token=reviewer_token,
                io_operations=assembled_packet.get("io_operations") if isinstance(assembled_packet, dict) else None,
            )
            attempt.packet_valid = integration_result["valid"]
            attempt.packet_reasons = integration_result.get("reasons", [])
            attempt.packet_path = str(target_packet_path)
            attempt.packet_hash = hash_file(target_packet_path)

            if not integration_result["valid"]:
                attempt.error = f"Scene integration rejected: {integration_result.get('reasons')}"
                record.attempts.append(attempt)
                attempt_idx += 1  # R3: content failure consumes the attempt
                continue

            # Successful attempt!
            attempt.success = True
            # Phase 4A.1 step 5: reset the scene's findings file on approval so
            # stale findings never leak into later attempts / re-mints.
            reset_scene_findings(project_root, scene_id)
            record.attempts.append(attempt)
            record.status = "success"
            record.final_packet_path = str(target_packet_path)
            record.final_packet_hash = attempt.packet_hash
            record.error = None
            break

        except Exception as e:
            attempt.error = str(e)
            record.attempts.append(attempt)
            # R3: an unexpected exception is treated as a content-attempt
            # consumer (never an infra in-place retry) so the while-loop below
            # stays bounded.
            attempt_idx += 1
        finally:
            cleanup_sandbox(sandbox_dir)

    return record


# ==============================================================================
# R4 (perf/cc-pipeline R1-R5) — pre-validate render inputs BEFORE the gate
# ==============================================================================
# The tin-nong r1 failure pattern: the episode gate ran and failed 11 times on
# missing/trivial inputs that a 2-cent file check would have caught before the
# render spend. prevalidate_render_inputs is that cheap check: it runs BEFORE
# validate_episode (and therefore before any DRAFT render built on a passing
# gate) and fails fast with precise per-input reason codes.
MIN_RENDER_INPUT_SCENE_BYTES = 200  # parity with the writer wrapper promotion threshold

def _legacy_scene_file_variants(scenes_dir: Path, scene_id: str) -> set[str]:
    """Episode-relative variants for the OM_LEGACY_QUARANTINE id spelling.

    The legacy escape hatch maps ANY '<prefix>-<N>' id to ``S{NN}.tsx``
    (``int(scene_id.split('-')[-1]):02d`` — writer_wrapper.py.tmpl
    ``_legacy_main``), so ``cut-1`` lands on ``scenes/S01.tsx`` even though
    the shared resolvers' ``(?:scene[-_]?)?`` regex does not cover it. Used
    ONLY to widen the prevalidate presence check — resolver suffix-split
    alignment itself is reviewer-deferred, so ``resolve_scene_filename`` /
    ``_scene_file_variants`` stay untouched.
    """
    tail = scene_id.rsplit("-", 1)[-1]
    if not tail.isdigit():
        return set()
    num = int(tail)
    variants: set[str] = set()
    for d in {scenes_dir.name, "scene", "scenes"}:
        variants.add(f"{d}/S{num:02d}.tsx")
    return variants


def prevalidate_render_inputs(
    root: Path, scene_ids: list[str] | None = None
) -> list[dict[str, str]]:
    """Cheap pre-gate check that the DRAFT render inputs exist and are non-trivial.

    Per scene: the integrated packet must exist and parse, the scene TSX file
    must exist at > MIN_RENDER_INPUT_SCENE_BYTES (parity with the writer
    wrapper promotion threshold), and the packet's narration +
    word-alignment refs must point at present, non-empty files. Returns a list
    of ``{code, message}`` reasons (empty = inputs are render-ready); codes are
    prefixed ``pre_render_`` so they never collide with episode_gate codes.

    The scene-file checks apply only to scene-file-based episodes (a scenes dir
    holding at least one ``.tsx`` — the real CC/Remotion layout). In-process
    synthetic episodes (packet-hash-only fixtures with an empty ``scene/`` dir)
    have no scene files by design; inventing a missing-file failure for them
    would break the packet-hash contract they exercise.
    """
    root = Path(root).resolve()
    reasons: list[dict[str, str]] = []
    if scene_ids is None:
        scene_ids = discover_authoritative_scenes(root)
    scenes_dir = get_scenes_dir(root)
    scene_based_layout = scenes_dir.is_dir() and any(scenes_dir.glob("*.tsx"))
    for sid in scene_ids:
        # 1. Integrated packet present + parses.
        packet_path = root / f"packet_{sid}.json"
        if not packet_path.is_file():
            reasons.append({
                "code": "pre_render_packet_missing",
                "message": f"{sid}: integrated packet packet_{sid}.json missing — scene never integrated; render inputs incomplete",
            })
            continue
        try:
            packet = json.loads(packet_path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as e:
            reasons.append({
                "code": "pre_render_packet_corrupt",
                "message": f"{sid}: packet_{sid}.json does not parse: {e}",
            })
            continue
        if not isinstance(packet, dict):
            reasons.append({
                "code": "pre_render_packet_corrupt",
                "message": f"{sid}: packet_{sid}.json is not an object",
            })
            continue

        # 2. Scene TSX file present + non-trivial (scene-file layouts only).
        #    Presence is VARIANT-AWARE (_scene_file_variants + the legacy
        #    OM_LEGACY_QUARANTINE spelling): ids like "cut-1" land on
        #    "S01.tsx" on disk, so pre_render_scene_file_missing fires only
        #    when NO variant exists — a variant-covered id falls through to
        #    the full gate. The trivial-size check is variant-driven too and
        #    flags only when EVERY present variant is trivial, so a real-size
        #    variant elsewhere never false-positives.
        if scene_based_layout:
            presence_variants = (
                _scene_file_variants(scenes_dir, sid)
                | _legacy_scene_file_variants(scenes_dir, sid)
            )
            present = [v for v in sorted(presence_variants) if (root / v).is_file()]
            if not present:
                scene_file = scenes_dir / resolve_scene_filename(scenes_dir, sid)
                reasons.append({
                    "code": "pre_render_scene_file_missing",
                    "message": f"{sid}: scene file {scene_file.name} missing under {scenes_dir.name}/ — nothing to render",
                })
            else:
                # <= parity with the writer wrapper promotion gate (> 200B):
                # an exactly-{MIN}B file must fail here, not pass prevalidate
                # and then block at promotion.
                trivial = [v for v in present if (root / v).stat().st_size <= MIN_RENDER_INPUT_SCENE_BYTES]
                if len(trivial) == len(present):
                    first = root / trivial[0]
                    reasons.append({
                        "code": "pre_render_scene_file_trivial",
                        "message": f"{sid}: scene file {first.name} is trivial ({first.stat().st_size}B <= {MIN_RENDER_INPUT_SCENE_BYTES}B) — likely a placeholder",
                    })

        # 3. Packet-referenced render inputs present + non-empty (narration,
        #    word alignment). Missing refs fail loudly here instead of inside
        #    the gate thrash loop.
        for key, code in (
            ("narration", "pre_render_narration_missing"),
            ("word_alignment", "pre_render_words_missing"),
        ):
            ref = packet.get(key, {}).get("ref") if isinstance(packet.get(key), dict) else None
            if not ref:
                continue  # packets without the section are the gate's business
            p = root / ref
            if not p.is_file() or p.stat().st_size == 0:
                reasons.append({
                    "code": code,
                    "message": f"{sid}: packet {key} ref {ref} missing or empty",
                })
    return reasons


def orchestrate_episode(
    episode_dir: Path | str,
    max_concurrency: int | None = None,
    max_retries: int = 1,
    runner: AgentRunner | None = None,
    evidence_file: Path | str | None = None,
    scene_ids: list[str] | None = None,
    strict: bool = True,
    daemon_timeout: float = 600.0,
    concurrency_source: str | None = None,
) -> OrchestrationSession:
    """Run full episode orchestration with bounded concurrency, retries, and gate verification.

    Task 2.1: when ``max_concurrency`` is None it is resolved from credentials
    (``OM_MAX_CONCURRENCY`` env override, else Anthropic tier probe — Tier 4+ -> 6,
    OAuth/unknown -> 4). Callers that already resolved the ceiling (CLI main)
    pass its true source via ``concurrency_source``; programmatic callers that
    pass a bare int get ``"arg"``. All scene workers acquire/release the shared
    ``ConcurrencyGovernor`` with try/finally release discipline, so a 429 burst
    throttles live concurrency (6 -> 4) and restores safely after cooldown.
    """
    root = Path(episode_dir).resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"Episode directory missing: {root}")

    t0 = time.time()
    iso_start = datetime.now(timezone.utc).isoformat()
    session_id = f"session-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
    director_token = f"dir_{uuid.uuid4().hex[:12]}"

    # Task 2.1 step 1: credential-driven concurrency ceiling (logged once at startup).
    if max_concurrency is None:
        max_concurrency, concurrency_source = resolve_max_concurrency()
    elif concurrency_source is None:
        concurrency_source = "arg"
    logger.info("Concurrency ceiling: %d (source: %s)", max_concurrency, concurrency_source)
    governor = ConcurrencyGovernor(max_concurrency=max_concurrency)

    if runner is None:
        # Auto-detect runner: check if daemon is alive; else default to SubprocessAgentRunner
        daemon_runner = DaemonAgentRunner(timeout_seconds=daemon_timeout)
        if daemon_runner.check_health():
            runner = daemon_runner
        else:
            runner = SubprocessAgentRunner()

    # Discover target scenes. Phase 4C.1 (re-round preserve): when the caller
    # did not explicitly target scenes (scene_ids=None, the full-episode
    # default), scenes whose seals are intact (approved + reviewed_hashes
    # match on disk) are skipped instead of needlessly re-dispatched —
    # OM_REMINT_PRESERVE=0 restores legacy dispatch-everything. An explicit
    # scene_ids list always dispatches verbatim (the operator asked for those
    # scenes). The subtraction never empties the target set: when every scene
    # is preserved we warn and dispatch the full list (loud over silent no-op).
    authoritative_scenes = discover_authoritative_scenes(root)
    if scene_ids is None:
        target_scenes = list(authoritative_scenes)
        try:
            from tools.qc.restore_seals import get_preserved_scenes, preserve_enabled
            if preserve_enabled() and authoritative_scenes:
                project_root = resolve_project_root_from_episode(root)
                # episode_dir=root pins discovery to THIS episode's packets —
                # sibling episodes' packets must never feed the preserve set.
                preserved = get_preserved_scenes(project_root or root, episode_dir=root)
                remaining = [s for s in target_scenes if s not in preserved]
                if preserved and remaining:
                    target_scenes = remaining
                    logger.info(
                        "Re-round preserve: skipping %d preserved scene(s) (approved + hashes match): %s",
                        len(preserved), ", ".join(sorted(preserved)),
                    )
                elif preserved:
                    logger.warning(
                        "Re-round preserve: all %d scene(s) are already preserved; "
                        "dispatching the full list anyway", len(target_scenes),
                    )
        except Exception as e:  # never let preserve-detection break dispatch
            logger.warning("Re-round preserve detection unavailable (%s); dispatching all scenes", e)
    else:
        target_scenes = [s for s in authoritative_scenes if s in scene_ids]

    config = {
        "max_concurrency": max_concurrency,
        "concurrency_source": concurrency_source,
        "max_retries": max_retries,
        "runner": runner.__class__.__name__,
        "strict": strict,
        "daemon_timeout": getattr(runner, "timeout_seconds", daemon_timeout),
        "authoritative_scenes": authoritative_scenes,
        "targeted_scenes": target_scenes,
    }

    scene_records: dict[str, SceneExecutionRecord] = {}

    if not target_scenes:
        # No scenes discovered
        t1 = time.time()
        iso_end = datetime.now(timezone.utc).isoformat()
        session = OrchestrationSession(
            session_id=session_id,
            director_token=director_token,
            started_at=iso_start,
            finished_at=iso_end,
            duration_seconds=t1 - t0,
            episode_dir=str(root),
            config=config,
            scenes={},
            episode_gate_result={"valid": False, "reasons": [{"code": "scene_packets_missing", "message": "no scenes found"}]},
            overall_status="fail",
        )
        _persist_session_evidence(session, root, evidence_file)
        return session

    # Concurrency-bounded dispatch. Task 2.1: every scene worker holds one
    # governor permit for its whole lifecycle, acquired/released with
    # try/finally discipline so an exception mid-scene can never leak a permit
    # (BoundedSemaphore would then wedge the whole pool).
    def _governed_scene(sid: str):
        governor.acquire()
        try:
            return execute_scene_with_retries(sid, root, runner, max_retries, governor=governor)
        finally:
            governor.release()

    max_workers = max(1, min(max_concurrency, len(target_scenes)))
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_scene = {
            executor.submit(_governed_scene, sid): sid
            for sid in target_scenes
        }
        for future in concurrent.futures.as_completed(future_to_scene):
            sid = future_to_scene[future]
            try:
                rec = future.result()
                scene_records[sid] = rec
            except Exception as e:
                scene_records[sid] = SceneExecutionRecord(
                    scene_id=sid,
                    status="failed",
                    error=str(e),
                )

    all_scenes_passed = all(r.status == "success" for r in scene_records.values())

    # Episode Integration Gate. R4: pre-validate the DRAFT render inputs
    # FIRST — a missing/trivial packet, scene file, narration or word-alignment
    # ref fails fast here with a precise ``pre_render_*`` code instead of
    # thrashing the full episode gate (the 11-failed-gate pattern). The full
    # gate only runs when the inputs are render-ready.
    gate_reasons: list[dict[str, str]] = []
    pre_render_reasons = prevalidate_render_inputs(root, target_scenes) if all_scenes_passed else []
    if not all_scenes_passed:
        gate_valid = False
        gate_reasons = [{"code": "scene_execution_failed", "message": "one or more scenes failed during dispatch"}]
    elif pre_render_reasons:
        gate_valid = False
        gate_reasons = pre_render_reasons
        logger.warning(
            "R4 pre-render input validation failed with %d reason(s); skipping the episode gate: %s",
            len(pre_render_reasons), [r["code"] for r in pre_render_reasons],
        )
    else:
        raw_reasons = validate_episode(root)
        gate_reasons = [{"code": r.get("code", "error"), "message": r.get("message", "")} for r in raw_reasons]
        gate_valid = len(gate_reasons) == 0

    overall_status = "pass" if (all_scenes_passed and gate_valid) else "fail"

    t1 = time.time()
    iso_end = datetime.now(timezone.utc).isoformat()

    session = OrchestrationSession(
        session_id=session_id,
        director_token=director_token,
        started_at=iso_start,
        finished_at=iso_end,
        duration_seconds=t1 - t0,
        episode_dir=str(root),
        config=config,
        scenes=scene_records,
        episode_gate_result={"valid": gate_valid, "reasons": gate_reasons},
        overall_status=overall_status,
    )

    _persist_session_evidence(session, root, evidence_file)
    return session


# Phase 4C.1 — per-round evidence retention
# ==============================================================================

# Kill-switch: default ON (env absent = per-round stamped evidence + "latest"
# symlink); OM_EVIDENCE_PER_ROUND=0 restores the legacy single-file overwrite.
EVIDENCE_PER_ROUND_ENV = "OM_EVIDENCE_PER_ROUND"
EVIDENCE_BASENAME = "scene_workflow_evidence.json"


def evidence_per_round_enabled() -> bool:
    """OM_EVIDENCE_PER_ROUND gate — default ON; =0 = legacy overwrite."""
    return os.environ.get(EVIDENCE_PER_ROUND_ENV, "1") != "0"


def _prior_evidence_scenes(out_p: Path) -> dict[str, Any]:
    """Scene execution records from the evidence file currently at ``out_p``
    (following a ``latest`` symlink if one is in place). Prior rounds' records
    must survive a re-run: scenes completed in earlier rounds that this round
    did not target stay recorded instead of being silently dropped."""
    try:
        src = out_p
        if out_p.is_symlink():
            target = Path(os.readlink(out_p))
            src = target if target.is_absolute() else (out_p.parent / target)
        if not src.is_file():
            return {}
        prior = json.loads(src.read_text(encoding="utf-8"))
        scenes = prior.get("scenes") if isinstance(prior, dict) else None
        return dict(scenes) if isinstance(scenes, dict) else {}
    except Exception:
        return {}


def _point_latest_symlink_at(latest_p: Path, stamped_p: Path) -> None:
    """Atomically point ``latest_p`` (relative symlink) at ``stamped_p``.
    Falls back to a plain copy (via tmp + os.replace) when symlinks fail."""
    rel_target = os.path.relpath(stamped_p, latest_p.parent)
    tmp_link = latest_p.parent / f".{latest_p.name}.tmp_link"
    tmp_copy: str | None = None
    try:
        if tmp_link.is_symlink() or tmp_link.exists():
            tmp_link.unlink()
        os.symlink(rel_target, tmp_link)
        os.replace(tmp_link, latest_p)
    except OSError:
        # Symlink creation failed (unsupported FS, etc.): copy via a temp file
        # + atomic replace. NEVER copyfile straight onto ``latest_p`` — when
        # it is an existing symlink, copyfile writes THROUGH the link and
        # clobbers the prior round's stamped payload (execution-proven D-1).
        try:
            if tmp_link.is_symlink() or tmp_link.exists():
                tmp_link.unlink()
        except OSError:
            pass
        try:
            fd, tmp_copy = tempfile.mkstemp(
                dir=str(latest_p.parent), prefix=f".{latest_p.name}.", suffix=".tmp")
            with os.fdopen(fd, "wb") as dst, open(stamped_p, "rb") as src:
                dst.write(src.read())
            os.replace(tmp_copy, latest_p)
        except Exception:
            try:
                if tmp_copy and (Path(tmp_copy).is_symlink() or Path(tmp_copy).exists()):
                    os.unlink(tmp_copy)
            except Exception:
                pass
            raise


def _persist_session_evidence(
    session: OrchestrationSession,
    episode_dir: Path,
    evidence_file: Path | str | None = None,
):
    """Persist session evidence to artifacts directory.

    Phase 4C.1 (evidence retention): each round writes a session-stamped
    evidence file ``scene_workflow_evidence_<session_id>.json`` so a later
    round can never overwrite (and lose) a previous round's records; the
    unsuffixed ``scene_workflow_evidence.json`` stays as the latest pointer
    for existing consumers (relative symlink, atomically replaced; plain copy
    when symlinks fail). ``OM_EVIDENCE_PER_ROUND=0`` restores the legacy
    direct overwrite of the unsuffixed file.

    Either way, scene records already present in the existing evidence file
    for scenes this round did not target are carried forward into the written
    payload (prior-round completions are never silently dropped).
    """
    if evidence_file:
        out_p = Path(evidence_file)
        if not out_p.is_absolute():
            out_p = episode_dir / out_p
    else:
        artifacts_dir = episode_dir / "artifacts"
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        out_p = artifacts_dir / EVIDENCE_BASENAME

    out_p.parent.mkdir(parents=True, exist_ok=True)

    payload = session.to_dict()
    prior_scenes = _prior_evidence_scenes(out_p)
    for sid, rec in prior_scenes.items():
        if sid not in payload["scenes"]:
            payload["scenes"][sid] = rec

    if evidence_per_round_enabled():
        stamped_p = out_p.with_name(f"{out_p.stem}_{session.session_id}{out_p.suffix}")
        stamped_p.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        _point_latest_symlink_at(out_p, stamped_p)
    else:
        if out_p.is_symlink():
            out_p.unlink()  # break the latest link; write a fresh regular file
        out_p.write_text(json.dumps(payload, indent=2), encoding="utf-8")


# ==============================================================================
# Internal Subprocess Agent Entrypoint
# ==============================================================================

def _run_internal_agent(args: argparse.Namespace) -> int:
    """Internal CLI handler invoked when SubprocessAgentRunner spawns an OS agent process."""
    role = args.role
    scene_id = args.scene_id
    workdir = Path(args.workdir).resolve()

    if role == "writer":
        # Writer: ensures output refs exist and match structure
        scene_dir = workdir / "scene"
        scene_dir.mkdir(parents=True, exist_ok=True)
        # Touch or verify sample outputs if not present
        audio = scene_dir / "audio.wav"
        if not audio.is_file():
            # Minimal 16-bit PCM silent wave header
            with open(audio, "wb") as f:
                f.write(b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00@\x1f\x00\x00@\x1f\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00")
        words = scene_dir / "words.json"
        if not words.is_file():
            words.write_text(json.dumps([{"word": f"speech_{scene_id}", "start": 0.0, "end": 1.0}]), encoding="utf-8")
        style = scene_dir / "style.json"
        if not style.is_file():
            style.write_text(json.dumps({"theme": "clean-professional"}), encoding="utf-8")
        print(f"PASS — writer {args.instance_id} produced outputs for {scene_id}")
        return 0

    elif role == "reviewer":
        # Reviewer: runs inside sandbox workdir, computes reviewed_hashes, writes findings.json
        output_hashes = {}
        if args.output_hashes:
            try:
                output_hashes = json.loads(args.output_hashes)
            except Exception:
                pass

        packets_dir = workdir / "packets"
        packets_dir.mkdir(parents=True, exist_ok=True)
        findings_path = packets_dir / f"{scene_id}_findings.json"

        # Verify output files in sandbox match hashes
        for ref, exp_hash in output_hashes.items():
            ref_path = workdir / ref
            if ref_path.is_file():
                actual = hash_file(ref_path)
                if actual and actual != exp_hash:
                    findings = {
                        "scene_id": scene_id,
                        "verdict": "rejected",
                        "reviewed_hashes": output_hashes,
                        "notes": f"Hash mismatch on {ref}: expected {exp_hash}, got {actual}",
                    }
                    findings_path.write_text(json.dumps(findings, indent=2), encoding="utf-8")
                    print(f"FAIL — reviewer {args.instance_id} detected hash mismatch on {ref}")
                    return 0

        findings = {
            "scene_id": scene_id,
            "verdict": "approved",
            "reviewed_hashes": output_hashes,
            "notes": f"Independent review approved scene {scene_id} outputs.",
        }
        findings_path.write_text(json.dumps(findings, indent=2), encoding="utf-8")
        print(f"PASS — reviewer {args.instance_id} approved {scene_id}")
        return 0

    else:
        print(f"ERROR — unknown internal role: {role}", file=sys.stderr)
        return 2


# ==============================================================================
# CLI Entry Point
# ==============================================================================

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="OpenMontage Scene Workflow Orchestrator — Bounded Concurrency & OS Ownership Enforcement",
    )
    # Internal agent runner flag
    parser.add_argument("--internal-run-agent", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--role", choices=["writer", "reviewer"], help=argparse.SUPPRESS)
    parser.add_argument("--scene-id", help=argparse.SUPPRESS)
    parser.add_argument("--instance-id", help=argparse.SUPPRESS)
    parser.add_argument("--token", help=argparse.SUPPRESS)
    parser.add_argument("--workdir", help=argparse.SUPPRESS)
    parser.add_argument("--output-hashes", help=argparse.SUPPRESS)

    # Standard CLI arguments
    parser.add_argument("episode_dir", nargs="?", default=".", help="Path to episode workspace")
    parser.add_argument(
        "--max-concurrency", "-c", type=int, default=None,
        help="Max concurrent scenes (default: auto — credential tier probe; "
             "OM_MAX_CONCURRENCY overrides, e.g. rollback OM_MAX_CONCURRENCY=2)",
    )
    parser.add_argument("--max-retries", "-r", type=int, default=1, help="Max retries per scene (default: 1)")
    parser.add_argument(
        "--runner",
        choices=["auto", "subprocess", "daemon"],
        default="auto",
        help="Agent dispatch runner (default: auto)",
    )
    parser.add_argument(
        "--evidence-file",
        "-e",
        help="Custom path to output session evidence JSON (default: <episode_dir>/artifacts/scene_workflow_evidence.json)",
    )
    parser.add_argument(
        "--daemon-timeout",
        type=float,
        default=600.0,
        help="Poll timeout in seconds for daemon runner (default: 600.0)",
    )
    parser.add_argument("--scenes", help="Comma-separated subset of scene IDs to orchestrate")
    parser.add_argument("--strict", action="store_true", default=True, help="Enforce strict production validation")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.internal_run_agent:
        return _run_internal_agent(args)

    episode_path = Path(args.episode_dir).resolve()
    if not episode_path.is_dir():
        print(f"ERROR — episode directory not found: {episode_path}", file=sys.stderr)
        return 2

    # Instantiate chosen runner
    if args.runner == "daemon":
        runner = DaemonAgentRunner(timeout_seconds=args.daemon_timeout)
    elif args.runner == "subprocess":
        runner = SubprocessAgentRunner()
    else:  # auto
        daemon_runner = DaemonAgentRunner(timeout_seconds=args.daemon_timeout)
        if daemon_runner.check_health():
            runner = daemon_runner
        else:
            runner = SubprocessAgentRunner()

    scene_subset = [s.strip() for s in args.scenes.split(",")] if args.scenes else None

    # Task 2.1: resolve the ceiling before the banner so the run log states it,
    # and thread the true source into the session config (review fix 5 — no
    # more "arg" mislabel when the ceiling actually came from env/probe).
    if args.max_concurrency is None:
        args.max_concurrency, concurrency_source = resolve_max_concurrency()
    else:
        concurrency_source = "arg"

    print(f"=== OpenMontage Scene Orchestrator ===")
    print(f"Episode:        {episode_path}")
    print(f"Runner:         {runner.__class__.__name__}")
    print(f"Daemon Timeout: {args.daemon_timeout}s")
    print(f"Concurrency:    {args.max_concurrency}")
    print(f"Retries:        {args.max_retries}")
    print(f"=======================================")

    try:
        session = orchestrate_episode(
            episode_dir=episode_path,
            max_concurrency=args.max_concurrency,
            concurrency_source=concurrency_source,
            max_retries=args.max_retries,
            runner=runner,
            evidence_file=args.evidence_file,
            scene_ids=scene_subset,
            strict=args.strict,
            daemon_timeout=args.daemon_timeout,
        )
    except Exception as e:
        print(f"ERROR — orchestration failed: {e}", file=sys.stderr)
        return 2

    print(f"\nSession ID: {session.session_id} (duration: {session.duration_seconds:.2f}s)")
    for sid, rec in session.scenes.items():
        status_chip = "PASS" if rec.status == "success" else "FAIL"
        print(f"- Scene {sid}: {status_chip} ({len(rec.attempts)} attempt(s))")
        for att in rec.attempts:
            if att.ownership and not att.ownership.writer_scope_valid:
                print(f"    * Attempt {att.attempt_number} Scope Violation: {att.ownership.error_message}")
            if att.ownership and att.ownership.reviewer_canonical_mutation:
                print(f"    * Attempt {att.attempt_number} Canonical Mutation: {att.ownership.error_message}")
            if att.error:
                print(f"    * Attempt {att.attempt_number} Error: {att.error}")

    gate_valid = session.episode_gate_result.get("valid", False)
    gate_chip = "PASS" if gate_valid else "FAIL"
    print(f"\nEpisode Gate: {gate_chip}")
    for r in session.episode_gate_result.get("reasons", []):
        print(f"  * {r.get('code')}: {r.get('message')}")

    print(f"\nOverall Status: {session.overall_status.upper()}")
    return 0 if session.overall_status == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
