"""Shared seal-restore + preserve-detection utilities (phase 4C.1).

Replaces the run's hand-written scratch ``restore_seals_3tin.py``. Two jobs:

1. **Preserve detection** (used by the non-destructive re-mint):
   ``is_scene_preserved`` / ``get_preserved_scenes`` mirror the orchestrator's
   gate-grade binding check (``scene_orchestrator.py`` — "Verify explicit
   reviewed_hashes mapping (no synthesis/backfill)"): a scene is preserved
   only when its canonical packet carries ``verdict: "approved"`` AND a
   non-empty ``reviewed_hashes`` map AND every reviewed hash still matches the
   current on-disk sha256. ``OM_REMINT_PRESERVE=0`` disables preserve mode
   globally (legacy destructive behavior).

2. **Seal restore**: ``python -m tools.qc.restore_seals --from-evidence
   <artifacts/scene_workflow_evidence[_<session_id>].json>`` re-seals
   ``packet_{scene_id}.json`` from prior-round evidence + current file
   hashes — after a re-mint clobbered packets. Exits non-zero listing the
   scenes whose evidence records are truly absent (a record present but
   without a successful attempt is reported, not fatal), instead of silently
   skipping them (this run silently lost scenes 6/8 evidence on the second
   re-mint).

Security posture (review round 2): evidence JSON is UNTRUSTED input.
- Scene IDs are validated (``^[A-Za-z0-9._-]+$``, no ``.``/``..``) at every
  boundary before path interpolation; invalid ids are skipped + reported.
- The attempt-recorded ``packet_path`` fallback is clamped INSIDE the episode
  dir (``_contained_path`` idiom, scene_packet.py) before it is read or
  written — a crafted absolute/outside path can never redirect the restore
  write (arbitrary file overwrite) nor leak file reads outside the episode.

CLI:
    python -m tools.qc.restore_seals --from-evidence <evidence.json> \
        [--episode-dir <dir>] [--project-dir <dir>] [--scenes s1,s2,...] \
        [--dry-run] [--force]

Exit codes: 0 ok/dry-run; 1 missing (truly-absent) evidence; 2 usage/parse
errors; 3 restore ran but hash-drifted scenes were refused.
"""
from __future__ import annotations

import argparse
import copy
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from lib.production_provenance import hash_file  # noqa: E402
from tools.qc.scene_orchestrator import (  # noqa: E402
    discover_authoritative_scenes,
    resolve_project_root_from_episode,
)
from tools.qc.scene_packet import SCHEMA_VERSION  # noqa: E402

PRESERVE_ENV = "OM_REMINT_PRESERVE"
PACKET_FILENAME_FMT = "packet_{scene_id}.json"
FINDINGS_REL_FMT = "packets/{scene_id}_findings.json"
FINDINGS_LATEST_SUFFIX = "_latest.md"
SCENE_ID_RE = re.compile(r"^[A-Za-z0-9._-]+$")

__all__ = [
    "PRESERVE_ENV",
    "preserve_enabled",
    "is_valid_scene_id",
    "load_evidence",
    "is_scene_preserved",
    "seal_intact",
    "get_preserved_scenes",
    "scene_seal_payload",
    "scene_seal_status",
    "restore_scene_seal",
    "build_parser",
    "main",
]


def preserve_enabled() -> bool:
    """OM_REMINT_PRESERVE gate — default ON (env absent = preserve); =0 disables."""
    return os.environ.get(PRESERVE_ENV, "1") != "0"


def is_valid_scene_id(scene_id: str) -> bool:
    """Scene IDs are interpolated into path formats — restrict to a safe
    charset with no path separators and no ``.``/``..`` traversal literals."""
    if not isinstance(scene_id, str) or not scene_id:
        return False
    if scene_id in (".", ".."):
        return False
    return SCENE_ID_RE.match(scene_id) is not None


def _contained_path(raw: str | Path, root: Path) -> Path | None:
    """Resolve ``raw`` and require containment under ``root`` (same idiom as
    ``tools.qc.scene_packet._contained_path``). Returns None when ``raw``
    escapes ``root`` — callers must treat None as "reject, never write"."""
    p = Path(raw)
    resolved = (root / p).resolve() if not p.is_absolute() else p.resolve()
    try:
        resolved.relative_to(root.resolve())
    except ValueError:
        return None
    return resolved


# ==============================================================================
# Path resolution
# ==============================================================================

def candidate_episode_dirs(project_dir: Path | None) -> list[Path]:
    """Episode-dir candidates inferred from a project dir (``projects/<slug>``).

    Real layout: project ``<repo>/projects/<slug>`` siblings with episode
    ``<repo>/remotion-composer/src/<slug>`` (same walk the orchestrator uses
    for the reverse mapping). Flat layouts (packets directly inside the
    project dir) are covered by the trailing fallbacks.
    """
    if project_dir is None:
        return []
    slug = project_dir.name
    cands: list[Path] = []
    for ancestor in (project_dir, *project_dir.parents):
        cands.append(ancestor / "remotion-composer" / "src" / slug)
    cands.append(project_dir)
    cands.append(project_dir / "packets")
    return cands


def infer_packet_episode_dir(packet_path: Path, reviewed_hashes: dict[str, str] | None = None) -> Path:
    """Episode root for a packet found on disk.

    Probes candidate roots by REF RESOLUTION — the packet's own dir first,
    then its ancestors up to the ``packets``/``episode`` name-walkup result —
    and accepts the first root where every ``reviewed_hashes`` ref actually
    exists. Ref-probing beats the name-walkup: on the real nested layout
    ``<project>/packets/episode/packet_<sid>.json`` the ref tree lives under
    ``packets/episode/`` itself, so the name-walkup lands on the PROJECT root
    where the refs are missing — every hash check fails,
    ``get_preserved_scenes`` returns an empty set, and a default-flag mint
    purges ALL findings. Falls back to the name-walkup root when the packet
    carries no readable ``reviewed_hashes``.
    """
    own = packet_path.parent
    walk = own
    while walk.name in ("packets", "episode") and walk.parent != walk:
        walk = walk.parent
    hashes = reviewed_hashes
    if hashes is None:
        packet = _load_packet_json(packet_path)
        reviewer = packet.get("reviewer") if isinstance(packet, dict) and isinstance(packet.get("reviewer"), dict) else {}
        rh = reviewer.get("reviewed_hashes") if isinstance(reviewer, dict) else {}
        hashes = _clean_hash_map(rh) if isinstance(rh, dict) else {}
    if not hashes:
        return walk
    candidates = [own]
    p = own
    while p != walk and p.parent != p:
        p = p.parent
        if p not in candidates:
            candidates.append(p)
    if walk not in candidates:
        candidates.append(walk)
    for cand in candidates:
        if all((cand / rel).exists() for rel in hashes):
            return cand
    return walk


def _looks_like_episode_dir(path: Path) -> bool:
    if not path.is_dir():
        return False
    if list(path.glob("packet_*.json")):
        return True
    return (path / "scene_manifest.json").is_file() or (path / "artifacts" / "scene_manifest.json").is_file()


def infer_episode_dir(
    evidence: dict[str, Any],
    evidence_path: Path | None,
    project_dir: Path | None,
    episode_dir_arg: Path | None,
) -> Path | None:
    """Resolve the episode dir: --episode-dir > evidence["episode_dir"] >
    project-dir siblings > evidence-path neighbors."""
    if episode_dir_arg is not None:
        return Path(episode_dir_arg)
    raw = evidence.get("episode_dir")
    if raw and Path(str(raw)).is_dir():
        return Path(str(raw))
    if project_dir is not None:
        for cand in candidate_episode_dirs(project_dir):
            if _looks_like_episode_dir(cand):
                return cand
    if evidence_path is not None and evidence_path.parent.name == "artifacts":
        cand = evidence_path.parent.parent
        if _looks_like_episode_dir(cand):
            return cand
    return None


def infer_project_dir(evidence: dict[str, Any], episode_dir: Path | None) -> Path | None:
    """Resolve the project dir (``projects/<slug>``): --project-dir handled by
    the caller; here episode-dir first, then evidence["episode_dir"]."""
    for ep in (episode_dir, evidence.get("episode_dir")):
        if ep and Path(str(ep)).is_dir():
            pr = resolve_project_root_from_episode(Path(str(ep)))
            if pr is not None:
                return pr
    return None


def packet_path_for(episode_dir: Path, scene_id: str, recorded: str | None = None) -> Path:
    """Canonical packet location (episode root, per the orchestrator's write
    path). The attempt-recorded ``packet_path`` fallback is UNTRUSTED evidence
    data: it is clamped inside ``episode_dir`` before use, and rejected (never
    read, never written) when it escapes — the canonical path remains the
    write target in that case."""
    canonical = episode_dir / PACKET_FILENAME_FMT.format(scene_id=scene_id)
    if canonical.is_file():
        return canonical
    if recorded:
        contained = _contained_path(recorded, episode_dir)
        if contained is not None and contained.is_file():
            return contained
    return canonical


def findings_path_for(episode_dir: Path, scene_id: str) -> Path | None:
    for rel in (FINDINGS_REL_FMT.format(scene_id=scene_id), f"{scene_id}_findings.json"):
        p = episode_dir / rel
        if p.is_file():
            return p
    return None


# ==============================================================================
# Evidence parsing
# ==============================================================================

def load_evidence(evidence_path: Path) -> dict[str, Any]:
    data = json.loads(Path(evidence_path).read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("evidence JSON must be an object")
    return data


def evidence_scene_records(evidence: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Scene records keyed by VALIDATED scene id (invalid ids — path-traversal
    or foreign-charset keys — are dropped at this boundary)."""
    scenes = evidence.get("scenes")
    raw: list[tuple[str, Any]] = []
    if isinstance(scenes, dict):
        raw = list(scenes.items())
    elif isinstance(scenes, list):  # tolerate record lists
        raw = [(str(r.get("scene_id")), r) for r in scenes if isinstance(r, dict) and r.get("scene_id")]
    out: dict[str, dict[str, Any]] = {}
    for key, rec in raw:
        if is_valid_scene_id(key) and isinstance(rec, dict):
            out[key] = rec
    return out


def target_scene_ids(
    evidence: dict[str, Any],
    scenes_arg: str | None,
    episode_dir: Path,
) -> list[str]:
    """--scenes > evidence["scenes"] keys > authoritative scenes from the
    episode dir (scene_manifest.json / edit_decisions.json). Invalid scene
    ids are dropped here; the CLI reports them."""
    if scenes_arg:
        return [s.strip() for s in scenes_arg.split(",") if s.strip()]
    recorded = sorted(evidence_scene_records(evidence))
    if recorded:
        return recorded
    return [s for s in discover_authoritative_scenes(episode_dir) if is_valid_scene_id(s)]


def scene_seal_status(
    evidence: dict[str, Any],
    scene_id: str,
    episode_dir: Path | None,
) -> tuple[str, dict[str, Any] | None, str]:
    """Classify one scene's re-seal evidence.

    Returns ``(status, payload, reason)`` with status:
    - ``"absent"`` — the scene has NO record in the evidence (truly missing);
    - ``"no_successful_attempt"`` — a record exists but no attempt succeeded
      (rejected/failed rounds are NOT "missing evidence");
    - ``"incomplete"`` — a successful attempt exists but the combined sources
      cannot establish writer token, reviewer token, an approved verdict, and
      a non-empty ``reviewed_hashes`` map;
    - ``"ok"`` — complete payload ready for a hash check.
    """
    if not is_valid_scene_id(scene_id):
        return "absent", None, f"invalid scene id {scene_id!r}"
    rec = evidence_scene_records(evidence).get(scene_id)
    if rec is None:
        return "absent", None, "no record in evidence"
    attempts = rec.get("attempts")
    ok_attempt: dict[str, Any] | None = None
    if isinstance(attempts, list):
        for att in attempts:
            if isinstance(att, dict) and att.get("success") is True:
                ok_attempt = att
                break
    if ok_attempt is None:
        return "no_successful_attempt", None, "no attempt with success=true in evidence"

    payload: dict[str, Any] = {
        "scene_id": scene_id,
        "writer_instance_id": "", "writer_token": "", "writer_timestamp": "",
        "reviewer_instance_id": "", "reviewer_token": "", "reviewer_timestamp": "",
        "verdict": "", "reviewed_hashes": {}, "findings_ref": "", "findings_hash": "",
        "attempt_packet_path": ok_attempt.get("packet_path"),
    }

    def _take(res: Any, keys: tuple[str, str, str], out: tuple[str, str, str]) -> None:
        if isinstance(res, dict):
            for src, dst in zip(keys, out):
                if not payload[dst] and isinstance(res.get(src), str):
                    payload[dst] = res[src]

    _take(ok_attempt.get("writer_result"),
          ("instance_id", "token", "finished_at"),
          ("writer_instance_id", "writer_token", "writer_timestamp"))
    _take(ok_attempt.get("reviewer_result"),
          ("instance_id", "token", "finished_at"),
          ("reviewer_instance_id", "reviewer_token", "reviewer_timestamp"))

    # UNTRUSTED: the recorded packet path is clamped inside the episode dir
    # before any read (packet_path_for).
    packet = _load_packet_json(packet_path_for(episode_dir, scene_id, payload["attempt_packet_path"])) \
        if episode_dir is not None else None
    if isinstance(packet, dict):
        writer = packet.get("writer") if isinstance(packet.get("writer"), dict) else {}
        reviewer = packet.get("reviewer") if isinstance(packet.get("reviewer"), dict) else {}
        if not payload["writer_instance_id"] and isinstance(writer.get("instance_id"), str):
            payload["writer_instance_id"] = writer["instance_id"]
        if not payload["writer_token"] and isinstance(writer.get("token"), str):
            payload["writer_token"] = writer["token"]
        if not payload["writer_token"] and isinstance(packet.get("writer_token"), str):
            payload["writer_token"] = packet["writer_token"]
        if not payload["writer_timestamp"] and isinstance(writer.get("timestamp"), str):
            payload["writer_timestamp"] = writer["timestamp"]
        if not payload["reviewer_instance_id"] and isinstance(reviewer.get("instance_id"), str):
            payload["reviewer_instance_id"] = reviewer["instance_id"]
        if not payload["reviewer_token"] and isinstance(reviewer.get("token"), str):
            payload["reviewer_token"] = reviewer["token"]
        if not payload["reviewer_token"] and isinstance(packet.get("reviewer_token"), str):
            payload["reviewer_token"] = packet["reviewer_token"]
        if not payload["reviewer_timestamp"] and isinstance(reviewer.get("timestamp"), str):
            payload["reviewer_timestamp"] = reviewer["timestamp"]
        if not payload["findings_ref"] and isinstance(reviewer.get("findings_ref"), str):
            payload["findings_ref"] = reviewer["findings_ref"]
        if not payload["findings_hash"] and isinstance(reviewer.get("findings_hash"), str):
            payload["findings_hash"] = reviewer["findings_hash"]
        if reviewer.get("verdict") == "approved":
            payload["verdict"] = "approved"
        rh = reviewer.get("reviewed_hashes")
        if isinstance(rh, dict):
            payload["reviewed_hashes"].update(_clean_hash_map(rh))

    if payload["verdict"] != "approved" or not payload["reviewed_hashes"]:
        findings = _load_packet_json(findings_path_for(episode_dir, scene_id)) \
            if episode_dir is not None else None
        if isinstance(findings, dict):
            if findings.get("verdict") == "approved":
                payload["verdict"] = "approved"
            rh = findings.get("reviewed_hashes")
            if isinstance(rh, dict):
                payload["reviewed_hashes"].update(_clean_hash_map(rh))

    gaps: list[str] = []
    if not payload["writer_token"]:
        gaps.append("writer token")
    if not payload["reviewer_token"]:
        gaps.append("reviewer token")
    if payload["verdict"] != "approved":
        gaps.append("approved verdict")
    if not payload["reviewed_hashes"]:
        gaps.append("reviewed_hashes")
    if gaps:
        return "incomplete", payload, "missing: " + ", ".join(gaps)
    return "ok", payload, "complete seal evidence"


def scene_seal_payload(
    evidence: dict[str, Any],
    scene_id: str,
    episode_dir: Path | None,
) -> dict[str, Any] | None:
    """Complete re-seal payload for one scene, or ``None`` when the evidence
    is absent / carries no successful attempt / is incomplete. See
    ``scene_seal_status`` for the split classification."""
    status, payload, _ = scene_seal_status(evidence, scene_id, episode_dir)
    return payload if status == "ok" else None


def _clean_hash_map(rh: dict) -> dict[str, str]:
    return {str(k): str(v) for k, v in rh.items() if isinstance(k, str) and isinstance(v, str) and v}


def _load_packet_json(path: Path | None) -> dict[str, Any] | None:
    if path is None or not Path(path).is_file():
        return None
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        return None
    return data if isinstance(data, dict) else None


# ==============================================================================
# Hash verification (gate-grade binding, mirrors the orchestrator's check)
# ==============================================================================

def hash_binding_mismatches(reviewed_hashes: dict[str, str], episode_dir: Path | None) -> list[str]:
    """Reviewed-hash entries whose on-disk file is missing or has drifted.

    Keys are episode-relative paths from the reviewer's findings (also accept
    absolute paths); each resolved target must stay inside ``episode_dir``
    when one is known — foreign keys cannot redirect the check.
    """
    mismatches: list[str] = []
    for rel, expected in sorted(reviewed_hashes.items()):
        target: Path | None = None
        p = Path(rel)
        if p.is_absolute():
            if episode_dir is not None:
                target = _contained_path(p, episode_dir)
        else:
            target = episode_dir / rel if episode_dir else None
        actual = hash_file(target) if target is not None else ""
        if not actual or actual != expected:
            state = "missing" if not actual else actual[:12]
            mismatches.append(f"{rel} (on-disk {state} != reviewed {expected[:12]})")
    return mismatches


# ==============================================================================
# Preserve detection (re-mint integration)
# ==============================================================================

def seal_intact(packet_path: Path, episode_dir: Path | None = None) -> tuple[bool, str]:
    """ENV-INDEPENDENT core check: packet exists, ``reviewer.verdict ==
    "approved"``, a non-empty ``reviewed_hashes`` dict, and every reviewed
    hash matches the on-disk sha256 — the same binding the orchestrator
    verifies on the findings mapping (scene_orchestrator.py reviewed_hashes
    check, "no synthesis/backfill").

    Deliberately ignores ``OM_REMINT_PRESERVE`` so the restore CLI's
    already-preserved classification cannot be flipped by the env; the
    env-gated view for re-mint decisions is ``is_scene_preserved``.
    """
    packet_path = Path(packet_path)
    if not packet_path.is_file():
        return False, "packet missing"
    packet = _load_packet_json(packet_path)
    if packet is None:
        return False, "packet unreadable"
    reviewer = packet.get("reviewer") if isinstance(packet.get("reviewer"), dict) else {}
    if reviewer.get("verdict") != "approved":
        return False, f"reviewer verdict={reviewer.get('verdict')!r} (not approved)"
    rh = reviewer.get("reviewed_hashes")
    if not isinstance(rh, dict) or not rh:
        return False, "no reviewed_hashes binding (verdict not bound to outputs)"
    hashes = _clean_hash_map(rh)
    if not hashes:
        return False, "no usable reviewed_hashes binding"
    if episode_dir is None:
        episode_dir = infer_packet_episode_dir(packet_path, hashes)
    mismatches = hash_binding_mismatches(hashes, Path(episode_dir))
    if mismatches:
        return False, "file changed since review: " + "; ".join(mismatches)
    return True, "approved + all reviewed_hashes match on disk"


def is_scene_preserved(packet_path: Path, episode_dir: Path | None = None) -> tuple[bool, str]:
    """``seal_intact`` gated on ``OM_REMINT_PRESERVE`` (=0 ⇒ always False, the
    legacy destructive re-mint contract)."""
    if os.environ.get(PRESERVE_ENV, "1") == "0":
        return False, f"{PRESERVE_ENV}=0 — preserve mode disabled"
    return seal_intact(packet_path, episode_dir)


def _iter_packet_files(episode_dir: Path) -> list[Path]:
    """All packet files under an episode dir, recursively (covers the real
    nested ``packets/episode/`` layout), skipping hidden/temp trees such as
    ``.tmp_sandboxes`` whose copies must never count as seals."""
    out: list[Path] = []
    for p in episode_dir.rglob("packet_*.json"):
        if any(part.startswith(".") or part == "node_modules" for part in p.relative_to(episode_dir).parts):
            continue
        out.append(p)
    return sorted(out)


def get_preserved_scenes(project_dir: Path, episode_dir: Path | None = None) -> set[str]:
    """Scene IDs whose packets pass ``is_scene_preserved`` (re-mint preserve set).

    Packet discovery is recursive over the episode dir (nested
    ``packets/episode/`` layouts included). ``OM_REMINT_PRESERVE=0`` returns
    an empty set (legacy destructive mode).
    """
    if not preserve_enabled():
        return set()
    project_dir = Path(project_dir)
    seen: set[str] = set()
    if episode_dir is not None:
        episode_dirs = [Path(episode_dir)]  # explicit pin: scan ONLY this dir
    else:
        episode_dirs = [c for c in candidate_episode_dirs(project_dir)]
    for ep in episode_dirs:
        if not ep.is_dir():
            continue
        for pkt in _iter_packet_files(ep):
            sid = pkt.stem[len("packet_"):]
            if not sid or not is_valid_scene_id(sid) or sid in seen:
                continue
            # Explicit episode_dir pins the root; otherwise leave episode_dir
            # unset so seal_intact probes the packet's OWN ref-resolving root
            # (ref-resolution, not the packets/episode name-walkup — see
            # infer_packet_episode_dir for the real nested-layout case).
            pkt_ep = Path(episode_dir) if episode_dir is not None else None
            ok, _ = is_scene_preserved(pkt, pkt_ep)
            if ok:
                seen.add(sid)
    return seen


# ==============================================================================
# Seal restore
# ==============================================================================

def build_sealed_packet(
    payload: dict[str, Any],
    scene_id: str,
    episode_dir: Path,
    existing: dict[str, Any] | None,
) -> dict[str, Any]:
    """Reconstruct or re-seal ``packet_{scene_id}.json``: writer details,
    reviewer details (approved + reviewed_hashes bound to the current file
    hashes), ``integration_status: "integrated"``. The packet body (claims,
    narration, assets, frozen inputs) is kept from the existing packet when
    one survives; a missing packet gets the orchestrator's skeleton shape."""
    packet = copy.deepcopy(existing) if isinstance(existing, dict) else {
        "claims": {"facts": [f"Fact claim for {scene_id} verified"]},
        "narration": {"ref": f"assets/audio/voice_{scene_id}.wav", "sha256": ""},
        "word_alignment": {"ref": "artifacts/narration_words.json", "sha256": ""},
        "assets": [{"ref": f"assets/audio/voice_{scene_id}.wav", "sha256": "", "rights": "licensed"}],
        "style_contract": {"ref": "packets/style_contract.json", "sha256": ""},
        "neighbor_context": {},
        "allowed_io": ["artifacts", "assets", "packets", "scene"],
        "frozen_inputs": {},
    }
    packet["packet_type"] = "openmontage.scene-packet"
    packet["schema_version"] = SCHEMA_VERSION
    packet["scene_id"] = scene_id
    packet["writer"] = {
        "instance_id": payload["writer_instance_id"],
        "timestamp": payload["writer_timestamp"],
        "token": payload["writer_token"],
    }
    packet["writer_token"] = payload["writer_token"]
    if not payload["findings_ref"]:
        payload["findings_ref"] = FINDINGS_REL_FMT.format(scene_id=scene_id)
    findings_file = findings_path_for(episode_dir, scene_id)
    if not payload["findings_hash"] and findings_file is not None:
        payload["findings_hash"] = hash_file(findings_file)
    packet["reviewer"] = {
        "instance_id": payload["reviewer_instance_id"],
        "timestamp": payload["reviewer_timestamp"],
        "verdict": "approved",
        "findings_ref": payload["findings_ref"],
        "findings_hash": payload["findings_hash"],
        "token": payload["reviewer_token"],
        "reviewed_hashes": dict(payload["reviewed_hashes"]),
    }
    packet["reviewer_token"] = payload["reviewer_token"]
    packet["integration_status"] = "integrated"
    return packet


def restore_scene_seal(
    payload: dict[str, Any],
    scene_id: str,
    episode_dir: Path,
) -> Path:
    """Write the re-sealed packet atomically (tmp + os.replace, matching the
    repo's write hygiene). Returns the packet path. The write target is
    always the episode-contained canonical (or clamped fallback) path —
    never an uncontained evidence-controlled path."""
    if not is_valid_scene_id(scene_id):
        raise ValueError(f"invalid scene id: {scene_id!r}")
    packet_path = packet_path_for(episode_dir, scene_id, payload.get("attempt_packet_path"))
    existing = _load_packet_json(packet_path)
    sealed = build_sealed_packet(payload, scene_id, episode_dir, existing)
    packet_path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=str(packet_path.parent), prefix=f".{packet_path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(sealed, fh, indent=2)
        os.replace(tmp_name, packet_path)
    except Exception:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise
    return packet_path


# ==============================================================================
# CLI
# ==============================================================================

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m tools.qc.restore_seals",
        description="Re-seal scene packets from prior-round session evidence (phase 4C.1).",
    )
    parser.add_argument(
        "--from-evidence", required=True,
        help="Path to the session evidence JSON (artifacts/scene_workflow_evidence[_<session_id>].json).",
    )
    parser.add_argument(
        "--episode-dir", default=None,
        help="Episode dir (default: evidence JSON 'episode_dir', else inferred).",
    )
    parser.add_argument(
        "--project-dir", default=None,
        help="Project dir projects/<slug> (default: inferred from the episode dir or evidence).",
    )
    parser.add_argument(
        "--scenes", default=None,
        help="Comma-separated scene IDs to check/restore (default: all scenes in the evidence).",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Report the sealable set and exit 0 without writing any packet.",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Force re-seal even for scenes whose packet is already preserved "
             "(never overrides hash-drift refusal).",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    evidence_path = Path(args.from_evidence)
    if not evidence_path.is_file():
        print(f"ERROR: evidence file not found: {evidence_path}", file=sys.stderr)
        return 2
    try:
        evidence = load_evidence(evidence_path)
    except Exception as e:
        print(f"ERROR: cannot parse evidence {evidence_path}: {e}", file=sys.stderr)
        return 2

    project_dir = Path(args.project_dir) if args.project_dir else None
    episode_dir = infer_episode_dir(evidence, evidence_path, project_dir, Path(args.episode_dir) if args.episode_dir else None)
    if episode_dir is None:
        print("ERROR: could not resolve the episode dir (pass --episode-dir)", file=sys.stderr)
        return 2

    targets = target_scene_ids(evidence, args.scenes, episode_dir)
    invalid = [s for s in targets if not is_valid_scene_id(s)]
    if invalid:
        # C2: untrusted ids never reach path interpolation
        print(f"WARNING: skipping invalid scene id(s): {', '.join(sorted(invalid))}")
        targets = [s for s in targets if is_valid_scene_id(s)]
    if not targets:
        print("ERROR: no valid target scenes (none requested, recorded, or discovered)", file=sys.stderr)
        return 2

    # W6: only truly-absent records block. Rejected/failed rounds and
    # incomplete evidence are reported, not fatal — a mixed-round episode
    # must still get its dry-run exit 0.
    payloads: dict[str, dict[str, Any]] = {}
    missing: list[str] = []
    not_sealed: list[str] = []
    incomplete: dict[str, str] = {}
    for sid in targets:
        status, payload, reason = scene_seal_status(evidence, sid, episode_dir)
        if status == "ok":
            payloads[sid] = payload
        elif status == "absent":
            missing.append(sid)
        elif status == "no_successful_attempt":
            not_sealed.append(sid)
        else:
            incomplete[sid] = reason

    if missing:
        print("ERROR: Missing evidence for scenes: " + ", ".join(sorted(missing)))
        return 1
    if not_sealed:
        print(f"not sealed — no successful attempt in evidence ({len(not_sealed)}): "
              + ", ".join(sorted(not_sealed)))
    if incomplete:
        for sid in sorted(incomplete):
            print(f"evidence incomplete for {sid} ({incomplete[sid]}) — not sealable")

    sealable: list[str] = []
    drift: dict[str, list[str]] = {}
    preserved: list[str] = []
    for sid, payload in payloads.items():
        mismatches = hash_binding_mismatches(payload["reviewed_hashes"], episode_dir)
        if mismatches:
            drift[sid] = mismatches
            continue
        sealable.append(sid)
        pkt = packet_path_for(episode_dir, sid, payload.get("attempt_packet_path"))
        # W7: env-independent intact check — OM_REMINT_PRESERVE=0 must not
        # turn the preserved-skip into a silent re-seal.
        if seal_intact(pkt, episode_dir)[0]:
            preserved.append(sid)

    print(f"restore_seals: evidence={evidence_path}")
    print(f"episode_dir: {episode_dir}")
    print(f"targets ({len(targets)}): {', '.join(sorted(targets))}")
    print(f"sealable ({len(sealable)}): {', '.join(sorted(sealable)) or '-'}")
    if preserved:
        print(f"  already preserved ({len(preserved)}): {', '.join(sorted(preserved))}")
    if drift:
        for sid in sorted(drift):
            print(f"  hash drift ({sid}): " + "; ".join(drift[sid]))

    if args.dry_run:
        print("dry-run: no packets written")
        return 0

    restored = 0
    skipped = 0
    for sid in sorted(payloads):
        if sid in drift:
            # Invariant: drift refusal CANNOT be bypassed by --force — a
            # re-seal would bind stale reviewed hashes and defeat the gate.
            print(f"REFUSED {sid}: scene files changed since review — re-run writer/reviewer instead of re-sealing")
            continue
        if sid in preserved and not args.force:
            print(f"skipped {sid}: packet already preserved (use --force to re-seal)")
            skipped += 1
            continue
        path = restore_scene_seal(payloads[sid], sid, episode_dir)
        restored += 1
        print(f"re-sealed {sid} -> {path} (integration_status=integrated)")
    print(f"done: {restored} re-sealed, {skipped} preserved skipped, {len(drift)} hash-drift refused")
    return 3 if drift else 0


if __name__ == "__main__":
    sys.exit(main())
