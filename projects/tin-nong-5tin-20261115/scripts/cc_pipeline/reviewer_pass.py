#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""reviewer_pass.py — lead-level reviewer-only pass for 12 scenes.

Dispatches the (hotfixed) reviewer_wrapper per scene, serially, then performs
the SAME integration bookkeeping scene_orchestrator does on an approved
reviewer verdict (canonical findings + packet reviewer block + integration
status + evidence record). NO writer re-dispatch: scene TSX files already on
disk are reviewed as-is; hashes recorded at review time bind to those files.

Hotfix context (2026-11-15): provider drops final messages when the CLI is
invoked with --allowedTools/--disallowedTools and when the verdict output
contains JSON braces. reviewer_wrapper.py strips the flags, speaks plain-text
@@ markers and retries empty streams internally (OM_CC_REVIEW_STREAM_*).

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
    """Run reviewer_wrapper; retry whole-wrapper on infra timeout verdicts."""
    env = os.environ.copy()
    env.update({
        "OM_ROLE": "reviewer",
        "OM_SCENE_ID": scene_id,
        "OM_SANDBOX_DIR": str(EPISODE),
        "OM_CANONICAL_DIR": str(EPISODE),
    })
    findings_path = EPISODE / "packets" / f"{scene_id}_findings.json"
    for i in range(1, attempts + 1):
        proc = subprocess.run(
            [sys.executable, str(HERE / "reviewer_wrapper.py")],
            cwd=str(EPISODE), env=env, capture_output=True, text=True, timeout=7400,
        )
        print(f"[{scene_id}] wrapper run {i}/{attempts}: {proc.stdout.strip()[:200]}")
        if findings_path.is_file():
            data = json.loads(findings_path.read_text(encoding="utf-8"))
            v = data.get("verdict")
            if v in ("approved", "rejected"):
                return v, data
        time.sleep(15)
    return "timeout_error", None


def integrate(scene_id: str, verdict: str, findings: dict | None) -> bool:
    """Mirror scene_orchestrator's approved-reviewer integration bookkeeping."""
    packet_path = EPISODE / f"packet_{scene_id}.json"
    if not packet_path.is_file():
        print(f"[{scene_id}] packet missing — skip integration")
        return False
    packet = json.loads(packet_path.read_text(encoding="utf-8"))

    scenes_dir = EPISODE / "scenes"
    target = resolve_scene_filename(scenes_dir, scene_id)
    scene_file = scenes_dir / target
    scene_rel = f"scenes/{target}"
    scene_hash = sha256(scene_file)

    reviewed_hashes = (findings or {}).get("reviewed_hashes") or {}
    on_disk = {scene_rel: scene_hash}
    if reviewed_hashes and reviewed_hashes.get(scene_rel) not in (None, scene_hash):
        # reviewer hashed a different content than on disk now -> do not fake binding
        print(f"[{scene_id}] HASH MISMATCH reviewer vs disk — not integrating")
        return False

    findings_canonical = {
        "scene_id": scene_id,
        "verdict": verdict,
        "reviewed_hashes": on_disk,
        "issues": (findings or {}).get("issues", []),
        "notes": (findings or {}).get("notes", "ok"),
    }
    PACKETS_DIR.mkdir(parents=True, exist_ok=True)
    fpath = PACKETS_DIR / f"{scene_id}_findings.json"
    fpath.write_text(json.dumps(findings_canonical, indent=2), encoding="utf-8")
    findings_hash = sha256(fpath)
    findings_rel = f"packets/{scene_id}_findings.json"

    ts = datetime.now(timezone.utc).isoformat()
    packet["reviewer"] = {
        "instance_id": f"reviewer_{scene_id}_leadpass",
        "timestamp": ts,
        "verdict": verdict,
        "findings_ref": findings_rel,
        "findings_hash": findings_hash,
        "token": f"rt_{scene_id}_leadpass",
        "reviewed_hashes": on_disk,
    }
    packet["reviewer_token"] = f"rt_{scene_id}_leadpass"
    packet["integration_status"] = "integrated"
    packet_path.write_text(json.dumps(packet, indent=2), encoding="utf-8")

    # evidence record (same file scene_orchestrator writes)
    ev_path = PROJ / "artifacts" / "scene_workflow_evidence.json"
    try:
        ev = json.loads(ev_path.read_text(encoding="utf-8"))
    except Exception:
        ev = {"sessions": [], "scenes": {}}
    ev.setdefault("scenes", {})[scene_id] = {
        "status": "success",
        "final_packet_path": str(packet_path),
        "final_packet_hash": sha256(packet_path),
        "error": None,
        "updated_at": ts,
        "lead_pass": True,
    }
    ev_path.write_text(json.dumps(ev, indent=2), encoding="utf-8")
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
