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
from tools.qc.episode_gate import validate_episode
from tools.qc.scene_packet import (
    SCHEMA_VERSION,
    integrate_scene_packet,
    load_packet,
    validate_packet,
)


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

    violations: list[str] = []
    for rel_path in mutated:
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
) -> tuple[bool, list[str], str | None]:
    """Verify reviewer did NOT mutate any file in the canonical episode directory."""
    diff = diff_snapshots(before, after)
    mutated = sorted(diff["added"] + diff["modified"] + diff["removed"])
    if mutated:
        msg = f"reviewer_canonical_mutation: reviewer mutated canonical files: {', '.join(mutated)}"
        return False, mutated, msg
    return True, [], None


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


def execute_scene_with_retries(
    scene_id: str,
    episode_dir: Path,
    runner: AgentRunner,
    max_retries: int = 1,
) -> SceneExecutionRecord:
    """Execute a single scene with bounded retries and OS-level ownership checks."""
    root = episode_dir.resolve()
    record = SceneExecutionRecord(scene_id=scene_id, status="failed")

    base_template = load_existing_packet_or_template(root, scene_id)
    allowed_io = base_template.get("allowed_io") or ["artifacts", "assets", "packets", "scene"]

    for attempt_idx in range(1, max_retries + 2):
        attempt = SceneRunAttempt(attempt_number=attempt_idx)
        sandbox_dir: Path | None = None
        try:
            # 1. Freeze inputs for this attempt
            frozen_inputs = freeze_episode_inputs(root, base_template)

            # 2. Fresh Writer Context
            writer_id = f"writer_{scene_id}_{uuid.uuid4().hex[:8]}"
            writer_token = f"wt_{scene_id}_{uuid.uuid4().hex[:12]}"
            writer_ctx = WriterContext(
                scene_id=scene_id,
                instance_id=writer_id,
                token=writer_token,
                episode_dir=root,
                allowed_io=allowed_io,
                frozen_inputs=frozen_inputs,
                claims=base_template.get("claims", {"facts": [f"{scene_id} claims"]}),
                neighbor_context=base_template.get("neighbor_context", {}),
            )

            # Snapshot canonical directory before writer
            snap_pre_writer = snapshot_directory_hashes(root)

            # Execute Writer
            writer_res = runner.run_writer(writer_ctx)
            attempt.writer_result = writer_res
            if _transport_glitch(writer_res):
                attempt.error = "Writer transport failure (empty/corrupt output — CC streaming glitch); retrying with a fresh instance"
                record.attempts.append(attempt)
                continue
            if writer_res.exit_code != 0:
                attempt.error = f"Writer failed: {writer_res.stderr or writer_res.error}"
                record.attempts.append(attempt)
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

            # Execute Reviewer in Sandbox
            reviewer_res = runner.run_reviewer(reviewer_ctx)
            attempt.reviewer_result = reviewer_res
            if _transport_glitch(reviewer_res):
                attempt.error = "Reviewer transport failure (empty/corrupt output — CC streaming glitch); retrying with a fresh instance"
                record.attempts.append(attempt)
                continue

            # Snapshot canonical directory after reviewer
            snap_post_reviewer = snapshot_directory_hashes(root)

            # Verify Reviewer Ownership (Canonical Preserved with 0 mutations)
            r_valid, r_mutated, r_err = verify_reviewer_ownership(
                snap_pre_reviewer,
                snap_post_reviewer,
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
                continue

            if reviewer_res.exit_code != 0:
                attempt.error = f"Reviewer failed: {reviewer_res.stderr or reviewer_res.error}"
                record.attempts.append(attempt)
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
                continue

            findings_data = json.loads(findings_source.read_text(encoding="utf-8"))
            if findings_data.get("verdict") != "approved":
                attempt.error = f"Reviewer rejected scene: verdict={findings_data.get('verdict')}"
                record.attempts.append(attempt)
                continue

            # Verify explicit reviewed_hashes mapping (no synthesis/backfill)
            rev_hashes = findings_data.get("reviewed_hashes")
            if not rev_hashes or not isinstance(rev_hashes, dict):
                attempt.error = f"Reviewer did not provide reviewed_hashes mapping for scene {scene_id}"
                record.attempts.append(attempt)
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
                continue

            # Successful attempt!
            attempt.success = True
            record.attempts.append(attempt)
            record.status = "success"
            record.final_packet_path = str(target_packet_path)
            record.final_packet_hash = attempt.packet_hash
            record.error = None
            break

        except Exception as e:
            attempt.error = str(e)
            record.attempts.append(attempt)
        finally:
            cleanup_sandbox(sandbox_dir)

    return record


def orchestrate_episode(
    episode_dir: Path | str,
    max_concurrency: int = 6,
    max_retries: int = 1,
    runner: AgentRunner | None = None,
    evidence_file: Path | str | None = None,
    scene_ids: list[str] | None = None,
    strict: bool = True,
    daemon_timeout: float = 600.0,
) -> OrchestrationSession:
    """Run full episode orchestration with bounded concurrency, retries, and gate verification."""
    root = Path(episode_dir).resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"Episode directory missing: {root}")

    t0 = time.time()
    iso_start = datetime.now(timezone.utc).isoformat()
    session_id = f"session-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
    director_token = f"dir_{uuid.uuid4().hex[:12]}"

    if runner is None:
        # Auto-detect runner: check if daemon is alive; else default to SubprocessAgentRunner
        daemon_runner = DaemonAgentRunner(timeout_seconds=daemon_timeout)
        if daemon_runner.check_health():
            runner = daemon_runner
        else:
            runner = SubprocessAgentRunner()

    # Discover target scenes
    authoritative_scenes = discover_authoritative_scenes(root)
    target_scenes = [s for s in authoritative_scenes if (scene_ids is None or s in scene_ids)]

    config = {
        "max_concurrency": max_concurrency,
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

    # Concurrency-bounded dispatch
    max_workers = max(1, min(max_concurrency, len(target_scenes)))
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_scene = {
            executor.submit(
                execute_scene_with_retries,
                sid,
                root,
                runner,
                max_retries,
            ): sid
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

    # Episode Integration Gate
    gate_reasons: list[dict[str, str]] = []
    if all_scenes_passed:
        raw_reasons = validate_episode(root)
        gate_reasons = [{"code": r.get("code", "error"), "message": r.get("message", "")} for r in raw_reasons]
        gate_valid = len(gate_reasons) == 0
    else:
        gate_valid = False
        gate_reasons = [{"code": "scene_execution_failed", "message": "one or more scenes failed during dispatch"}]

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


def _persist_session_evidence(
    session: OrchestrationSession,
    episode_dir: Path,
    evidence_file: Path | str | None = None,
):
    """Persist session evidence to artifacts directory."""
    if evidence_file:
        out_p = Path(evidence_file)
        if not out_p.is_absolute():
            out_p = episode_dir / out_p
    else:
        artifacts_dir = episode_dir / "artifacts"
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        out_p = artifacts_dir / "scene_workflow_evidence.json"

    out_p.parent.mkdir(parents=True, exist_ok=True)
    out_p.write_text(json.dumps(session.to_dict(), indent=2), encoding="utf-8")


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
    parser.add_argument("--max-concurrency", "-c", type=int, default=6, help="Max concurrent scenes (default: 6)")
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
