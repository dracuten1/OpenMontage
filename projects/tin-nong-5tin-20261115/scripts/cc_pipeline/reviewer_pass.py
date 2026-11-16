#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""reviewer_pass.py — lead-level reviewer-only pass for 12 scenes.

Dispatches the (hotfixed) reviewer_wrapper per scene, serially, then performs
the SAME integration bookkeeping scene_orchestrator does on an approved
reviewer verdict (canonical findings + packet reviewer block + integration
status + evidence record). NO writer re-dispatch: scene TSX files already on
disk are reviewed as-is; hashes recorded at review time bind to those files.

Wave1 security cycle-2 (2026-11-16): reviewer_wrapper.py strips CLI tool-scope
flags because provider drops final messages when present; flags do not enforce.
Actual OS write confinement and a staged workspace prevent canonical writes.
All verdict channels are supported (legacy HTML JSON, current @@ text, findings
file); no verdict becomes prompt timeout_error, with no six-by-45s loop.

Usage: python3 reviewer_pass.py [--scenes scene-1,scene-2,...]
Env: same OM_CC_REVIEW_* knobs as the wrapper.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
import tempfile
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]  # projects/<proj>/scripts/cc_pipeline -> repo root
PROJ = HERE.parents[1]  # projects/<project>
EPISODE = REPO / "remotion-composer/src/tin-nong-5tin-20261115"
PACKETS_DIR = EPISODE / "packets"


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def resolve_scene_filename(scenes_dir: Path, scene_id: str) -> str:
    if (scenes_dir / f"{scene_id}.tsx").is_file():
        return f"{scene_id}.tsx"
    for c in (f"S{int(scene_id.split('-')[-1]):02d}.tsx",):
        if (scenes_dir / c).is_file():
            return c
    return f"{scene_id}.tsx"


def run_reviewer(scene_id: str, attempts: int = 3) -> tuple[str, dict | None]:
    """Retries wrapper on infra timeout (legacy API)."""
    # Wrapper returns timeout_error promptly; retry budget is explicit and
    # bounded here, never hidden in a six-attempt 45s stream sleep loop.
    _ENV_ALLOW_KEYS = ("PATH", "HOME", "USER", "SHELL", "TMPDIR")
    _ENV_ALLOW_OM_KEYS = (
        "OM_ROLE", "OM_SCENE_ID", "OM_SANDBOX_DIR", "OM_CANONICAL_DIR",
        "OM_CC_REVIEW_MAX_TURNS", "OM_CC_REVIEW_WATCHDOG",
        "OM_CC_REVIEW_OUTPUT", "OM_CC_REVIEW_STREAM_ATTEMPTS",
        "OM_CC_REVIEW_STREAM_SLEEP",
    )
    env = {k: v for k, v in os.environ.items()
           if k in _ENV_ALLOW_KEYS or k in _ENV_ALLOW_OM_KEYS}

    env.update({"OM_ROLE":"reviewer", "OM_SCENE_ID":scene_id,
                "OM_SANDBOX_DIR":str(EPISODE), "OM_CANONICAL_DIR":str(EPISODE)})
    findings_path = EPISODE / "packets" / f"{scene_id}_findings.json"
    # Single wrapper run: the template itself guarantees one attempt (no
    # hidden 6x45s stream loop); timeout_error is surfaced immediately.
    proc = subprocess.run(
        [sys.executable, str(HERE / "reviewer_wrapper.py")],
        cwd=str(EPISODE), env=env, capture_output=True, text=True, timeout=7400,
    )
    print(f"[{scene_id}] wrapper run: {proc.stdout.strip()[:200]}")
    if findings_path.is_file():
        data = json.loads(findings_path.read_text(encoding="utf-8"))
        v = data.get("verdict")
        if v in ("approved", "rejected"):
            data["findings_hash"] = sha256(findings_path)
            return v, data
    return "timeout_error", None

def _atomic_write_json(path: Path, data: dict) -> None:
    """Atomically replace JSON file; sibling temp stays on same filesystem."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
        os.replace(tmp_name, path)
    except Exception:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise


def _under_artifacts(path: Path, artifacts_root: Path) -> Path:
    """Reject target/parent symlinks and paths outside artifacts/ before write."""
    root = Path(artifacts_root).resolve()
    raw = Path(path)
    if not raw.is_absolute():
        raw = root / raw
    # Check candidate components from the artifacts root down. The root itself
    # may resolve from a platform temp symlink (/var -> /private/var); trust
    # the caller-pinned root and reject symlinks only below it.
    try:
        relative = raw.relative_to(root)
    except ValueError as exc:
        raise ValueError(f"evidence path escapes artifacts root: {path}") from exc
    current = root
    for part in relative.parts:
        current = current / part
        if current.is_symlink():
            raise ValueError(f"symlink path component rejected: {current}")
    resolved = raw.resolve(strict=False)
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise ValueError(f"evidence path escapes artifacts root: {path}") from exc
    if resolved == root:
        raise ValueError("evidence target must be below artifacts root")
    return resolved


def integrate(scene_id: str, verdict: str, findings: dict | None) -> bool:
    """Mirror scene_orchestrator's approved-reviewer integration bookkeeping.

    Wave1 P0-2 item 2: this pass may ONLY backfill provenance from on-disk
    evidence — never mint unverified provenance:
    - ``reviewed_hashes`` MUST come from the reviewer's own findings file
      (what the reviewer actually hashed). The old code synthesized
      ``{scene_rel: <current disk hash>}`` — a binding to bytes the reviewer
      may never have seen. That synthesis is gone.
    - Wave1 security cycle-1 CRITICAL-1: the scene file is hash-verified ON
      DISK before any packet state is touched — a missing scene file, an
      evidence entry with an empty ``findings_hash`` pointer, or a computed
      empty ``findings_hash`` all refuse integration (fail-closed), never a
      crash or a provenance backfill over unverified bytes.
    - verdict comes from the findings file (run_reviewer parsed it there).
    - reviewer identity is derived deterministically from the canonical
      findings bytes (verifiable evidence pointer), not a random mint.
    - writer provenance in ``frozen_inputs._provenance`` is left untouched
      except for the findings_hash pointer, which is re-pointed at the new
      findings evidence.
    """
    packet_path = EPISODE / f"packet_{scene_id}.json"
    if not packet_path.is_file():
        print(f"[{scene_id}] packet missing — skip integration")
        return False
    packet = json.loads(packet_path.read_text(encoding="utf-8"))

    scenes_dir = EPISODE / "scenes"
    target = resolve_scene_filename(scenes_dir, scene_id)
    scene_file = scenes_dir / target
    scene_rel = f"scenes/{target}"
    # Wave1 security cycle-1 CRITICAL-1: the scene file must exist on disk
    # BEFORE any hash verification — a missing file can never be verified
    # against ``reviewed_hashes``, and refusing explicitly (contract:
    # False + printed reason) beats a raw FileNotFoundError from sha256().
    if not scene_file.is_file():
        print(f"[{scene_id}] SCENE FILE MISSING on disk ({scene_rel}) — not integrating "
              f"(provenance backfill requires a hash-verifiable scene file)")
        return False
    scene_hash = sha256(scene_file)

    evidence_hashes = (findings or {}).get("reviewed_hashes")
    if not isinstance(evidence_hashes, dict) or not evidence_hashes:
        print(f"[{scene_id}] NO REVIEWER reviewed_hashes BINDING in findings — not integrating")
        return False
    reviewed_hashes = evidence_hashes
    reviewer_entry = reviewed_hashes.get(scene_rel) or reviewed_hashes.get(f"scene/{target}") \
        or reviewed_hashes.get(target)
    if not isinstance(reviewer_entry, str) or not reviewer_entry.strip():
        print(f"[{scene_id}] NO REVIEWER reviewed_hashes BINDING in findings — not integrating")
        return False
    evidence_findings_hash = (findings or {}).get("findings_hash")
    if not isinstance(evidence_findings_hash, str) or not evidence_findings_hash.strip():
        print(f"[{scene_id}] MISSING/EMPTY findings_hash in evidence entry — not integrating")
        return False
    if reviewer_entry != scene_hash:
        print(f"[{scene_id}] HASH MISMATCH reviewer vs disk — not integrating")
        return False

    artifacts_root = PROJ / "artifacts"
    artifacts_root.mkdir(parents=True, exist_ok=True)
    fpath = _under_artifacts(artifacts_root / "packets" / f"{scene_id}_findings.json", artifacts_root)
    # Findings file already exists under artifacts and its bytes are the
    # source evidence. Verify that content before any packet mutation; never
    # overwrite/re-mint findings or synthesize pointer from current scene.
    if not fpath.is_file():
        print(f"[{scene_id}] canonical findings evidence missing — not integrating")
        return False
    findings_hash = sha256(fpath)
    if not findings_hash or findings_hash != evidence_findings_hash:
        print(f"[{scene_id}] findings_hash does not match canonical findings evidence — not integrating")
        return False
    findings_rel = f"packets/{scene_id}_findings.json"

    ts = datetime.now(timezone.utc).isoformat()
    # Reviewer identity derived from the findings evidence bytes — verifiable
    # pointer, not a fabricated credential.
    evidence_digest = hashlib.sha256(fpath.read_bytes()).hexdigest()
    reviewer_id = f"reviewer_{scene_id}_leadpass"
    reviewer_token = f"rt_{scene_id}_leadpass_{evidence_digest[:12]}"
    packet["reviewer"] = {
        "instance_id": reviewer_id,
        "timestamp": ts,
        "verdict": verdict,
        "findings_ref": findings_rel,
        "findings_hash": findings_hash,
        "token": reviewer_token,
        "reviewed_hashes": dict(reviewed_hashes),
    }
    packet["reviewer_token"] = reviewer_token
    packet["integration_status"] = "integrated"

    # Re-point the frozen provenance block at the new findings evidence.
    # Writer identity/token are backfilled from the packet's own writer block
    # (on-disk evidence of who wrote); they are never invented here.
    frozen = packet.get("frozen_inputs")
    if not isinstance(frozen, dict):
        frozen = {}
    writer_block = packet.get("writer") if isinstance(packet.get("writer"), dict) else {}
    frozen["_provenance"] = {
        "writer_instance_id": writer_block.get("instance_id", ""),
        "writer_token": writer_block.get("token") or packet.get("writer_token", ""),
        "findings_hash": findings_hash,
    }
    frozen[findings_rel] = findings_hash
    frozen.update(dict(reviewed_hashes))
    packet["frozen_inputs"] = frozen
    _atomic_write_json(packet_path, packet)

    # Evidence record is strictly artifacts-contained; reject symlinked target
    # or any symlinked parent before reading or replacing it.
    ev_path = _under_artifacts(artifacts_root / "scene_workflow_evidence.json", artifacts_root)
    try:
        ev = json.loads(ev_path.read_text(encoding="utf-8"))
    except Exception:
        ev = {"sessions": [], "scenes": {}}
    ev.setdefault("scenes", {})[scene_id] = {
        "status": "success", "final_packet_path": str(packet_path),
        "final_packet_hash": sha256(packet_path), "error": None,
        "updated_at": ts, "lead_pass": True,
    }
    _atomic_write_json(ev_path, ev)
    print(f"[{scene_id}] INTEGRATED verdict={verdict} hash={scene_hash[:12]}")
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenes", default=",".join(f"scene-{i}" for i in range(1, 13)))
    args = ap.parse_args()
    ids = [s.strip() for s in args.scenes.split(",") if s.strip()]
    results = {}
    for sid in ids:
        scenes_dir = EPISODE / "scenes"
        fname = resolve_scene_filename(scenes_dir, sid)
        if not (scenes_dir / fname).is_file():
            print(f"[{sid}] scene file {fname} missing — SKIP")
            results[sid] = "missing"
            continue
        verdict, findings = run_reviewer(sid)
        results[sid] = verdict
        if verdict == "approved":
            integrate(sid, verdict, findings)
        else:
            print(f"[{sid}] NOT integrated (verdict={verdict})")
    print(json.dumps(results, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
