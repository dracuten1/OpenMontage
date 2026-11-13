"""Mint per-project CC pipeline wrappers from shared templates (phase 4A.2).

Single source of truth: the templates in ``tools/qc/cc_wrapper_templates/``
carry the Phase-1/2 semantics (watchdog ``timeout_error``, read-only reviewer
verdict extraction, accept-edits-free scoped CLI, writer backoff, repo-root shim,
4A.1 findings injection, 4A.3 SceneShell pre-flight); this CLI renders them
into ``<project>/scripts/cc_pipeline/*.py``.

Invocation (from the OM repo root):
    python -m tools.qc.mint_project_pipeline --project-dir projects/<slug> [--scenes N]

Behavior:
- Purge owner (4A.1 step 2): clears ``<project>/history/cc_findings/`` at mint
  time — the single deterministic chokepoint per episode/round (stale
  ``_latest.md`` findings from a prior round can otherwise leak into a later
  episode's first attempt).
- Prints the OM commit sha + template content hash on EVERY mint (auditability;
  risk #2 mitigation: templates drifting from shared runner code).
- Kill-switch ``OM_WRAPPER_TEMPLATE_STRICT`` (default ``1`` = strict): when the
  target project already holds hand-written or hand-edited wrappers (on-disk
  hash differs from the last mint's manifest, or no manifest exists), strict
  mode FAILS the mint instead of silently clobbering them; ``=0`` warns and
  proceeds. Hand-written wrappers remain valid — mint is opt-in per project.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
TEMPLATE_DIR = Path(__file__).resolve().parent / "cc_wrapper_templates"

WRAPPER_TEMPLATES = [
    "writer_wrapper.py.tmpl",
    "reviewer_wrapper.py.tmpl",
    "run_cc_pipeline.py.tmpl",
]
MANIFEST_NAME = ".mint_manifest.json"
STRICT_ENV = "OM_WRAPPER_TEMPLATE_STRICT"
FINDINGS_PURGE_DIR = "history/cc_findings"


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def template_content_hash() -> tuple[str, dict[str, str]]:
    """Collective template content hash + per-template hashes (sorted, stable)."""
    per_file: dict[str, str] = {}
    hasher = hashlib.sha256()
    for name in sorted(WRAPPER_TEMPLATES):
        data = (TEMPLATE_DIR / name).read_bytes()
        per_file[name] = _sha256_bytes(data)
        hasher.update(name.encode("utf-8"))
        hasher.update(data)
    return hasher.hexdigest(), per_file


def om_commit() -> str:
    """Current OM commit sha ('unknown' outside a git checkout — never raises)."""
    try:
        out = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "rev-parse", "HEAD"],
            capture_output=True, text=True, timeout=10,
        )
        if out.returncode == 0:
            return out.stdout.strip()
    except Exception:
        pass
    return "unknown"


def strict_mode_enabled() -> bool:
    """OM_WRAPPER_TEMPLATE_STRICT — default ON (=1 / unset); =0 warn-only."""
    return os.environ.get(STRICT_ENV, "1") != "0"


def _assert_purge_safe(project_dir: Path) -> None:
    """Reviewer guard (phase-4A fix): mint's purge DELETES files, so refuse to
    run it against a target outside this checkout. The OS temp dir is allowed
    because the hermetic pytest pack legitimately mints into ``tmp_path``
    scratch trees (throwaway by definition). Anything else outside the repo
    root (e.g. ``--project-dir ~/some-episode``) is refused BEFORE any
    deletion — a mistyped path can never purge a user's ``history/cc_findings``.
    """
    resolved = project_dir.resolve()
    if resolved.is_relative_to(REPO_ROOT.resolve()):
        return
    if resolved.is_relative_to(Path(tempfile.gettempdir()).resolve()):
        return
    raise RuntimeError(
        f"REFUSING findings purge: {resolved} is outside repo root "
        f"{REPO_ROOT.resolve()} and outside the OS temp dir — mint only "
        "purges history/cc_findings inside its own checkout"
    )


def purge_findings(project_dir: Path) -> int:
    """4A.1 step 2: mint owns the findings purge (deterministic chokepoint)."""
    _assert_purge_safe(project_dir)
    findings_dir = project_dir / FINDINGS_PURGE_DIR
    count = 0
    if findings_dir.is_dir():
        for entry in sorted(findings_dir.iterdir()):
            try:
                if entry.is_file():
                    entry.unlink()
                    count += 1
                elif entry.is_dir():
                    import shutil
                    shutil.rmtree(entry)
                    count += 1
            except OSError as e:
                print(f"WARNING: could not purge {entry}: {e}", file=sys.stderr)
    findings_dir.mkdir(parents=True, exist_ok=True)
    return count


def _render(template_name: str, slug: str, scene_count: int) -> str:
    text = (TEMPLATE_DIR / template_name).read_text(encoding="utf-8")
    return (
        text
        .replace("{{PROJECT_SLUG}}", slug)
        .replace("{{DEFAULT_SCENE_COUNT}}", str(scene_count))
    )


def _detect_hand_written(
    project_dir: Path, previous_manifest: dict | None, rendered: dict[str, str]
) -> list[str]:
    """Wrappers on disk that a previous mint did NOT produce (hand-written or
    hand-edited since the last mint)."""
    flagged: list[str] = []
    for tmpl_name in WRAPPER_TEMPLATES:
        out_name = tmpl_name[: -len(".tmpl")]
        out_path = project_dir / "scripts" / "cc_pipeline" / out_name
        if not out_path.is_file():
            continue
        on_disk = _sha256_bytes(out_path.read_bytes())
        if previous_manifest is None:
            flagged.append(out_name)
        elif previous_manifest.get("rendered", {}).get(out_name) != on_disk:
            flagged.append(out_name)
    return flagged


def mint_project(project_dir: Path, scene_count: int) -> int:
    project_dir = project_dir.resolve()
    slug = project_dir.name
    out_dir = project_dir / "scripts" / "cc_pipeline"
    manifest_path = out_dir / MANIFEST_NAME

    previous_manifest: dict | None = None
    if manifest_path.is_file():
        try:
            previous_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"WARNING: unreadable mint manifest ({e}); treating wrappers as unmanaged")

    # Strict gate BEFORE any mutation: hand-written wrappers remain valid —
    # strict mode refuses to clobber them silently (plan 4A.2 kill-switch).
    rendered_hashes_preview = {
        tmpl[: -len(".tmpl")]: _sha256_bytes(_render(tmpl, slug, scene_count).encode("utf-8"))
        for tmpl in WRAPPER_TEMPLATES
    }
    flagged = _detect_hand_written(project_dir, previous_manifest, rendered_hashes_preview)
    strict = strict_mode_enabled()
    if flagged:
        detail = ", ".join(flagged)
        if strict:
            print(
                f"FAIL: hand-written/hand-edited wrapper(s) detected: {detail}. "
                f"Refusing to clobber (default OM_WRAPPER_TEMPLATE_STRICT=1). "
                f"Set OM_WRAPPER_TEMPLATE_STRICT=0 to warn-and-overwrite."
            )
            return 1
        print(
            f"WARNING: overwriting hand-written/hand-edited wrapper(s): {detail} "
            f"(OM_WRAPPER_TEMPLATE_STRICT=0 — warn only)"
        )

    # Purge owner: stale findings never leak across episodes/rounds (4A.1).
    purged = purge_findings(project_dir)

    out_dir.mkdir(parents=True, exist_ok=True)
    rendered: dict[str, str] = {}
    for tmpl_name in WRAPPER_TEMPLATES:
        content = _render(tmpl_name, slug, scene_count)
        out_name = tmpl_name[: -len(".tmpl")]
        out_path = out_dir / out_name
        out_path.write_text(content, encoding="utf-8")
        rendered[out_name] = _sha256_bytes(content.encode("utf-8"))

    tpl_hash, per_template = template_content_hash()
    commit = om_commit()
    manifest = {
        "minted_at": datetime.now(timezone.utc).isoformat(),
        "om_commit": commit,
        "template_content_hash": tpl_hash,
        "templates": per_template,
        "rendered": rendered,
        "project": slug,
        "scene_count": scene_count,
        "strict": strict,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Auditability: every mint prints what minted it (plan 4A.2 change item).
    print(f"mint_project_pipeline: project={project_dir} slug={slug}")
    print(f"purged {FINDINGS_PURGE_DIR}/ ({purged} entr{'y' if purged == 1 else 'ies'} removed)")
    print(f"minted from OM commit {commit}")
    print(f"template content hash: {tpl_hash}")
    for tmpl_name in WRAPPER_TEMPLATES:
        out_name = tmpl_name[: -len(".tmpl")]
        print(f"  {tmpl_name}  {per_template[tmpl_name][:12]}  -> {out_name}  (rendered {rendered[out_name][:12]})")
    print(f"strict mode: {'ON' if strict else 'OFF (warn-only)'} ({STRICT_ENV})")
    print(f"manifest: {manifest_path}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m tools.qc.mint_project_pipeline",
        description="Mint per-project CC pipeline wrappers from shared templates (phase 4A.2).",
    )
    parser.add_argument(
        "--project-dir", required=True,
        help="Target project dir, e.g. projects/<slug> (relative to cwd or absolute).",
    )
    parser.add_argument(
        "--scenes", type=int, default=15,
        help="Default scene count baked into the generated launcher (default: 15).",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    project_dir = Path(args.project_dir)
    if not project_dir.is_absolute():
        project_dir = Path.cwd() / project_dir
    if args.scenes < 1:
        print("FAIL: --scenes must be >= 1", file=sys.stderr)
        return 2
    return mint_project(project_dir, args.scenes)


if __name__ == "__main__":
    sys.exit(main())
