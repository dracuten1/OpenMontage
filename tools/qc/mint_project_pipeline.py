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
- Non-destructive re-mint (4C.1): by default (no ``--force``, env
  ``OM_REMINT_PRESERVE`` != ``0``) findings of PRESERVED scenes — approved
  verdict + ``reviewed_hashes`` matching the on-disk files, per
  ``tools.qc.restore_seals`` — are kept; ``--force`` or ``OM_REMINT_PRESERVE=0``
  restores the legacy purge-everything behavior. The preserve set is recorded
  in the mint manifest.
- Re-scope note (4C.1, review round 2): per-scene task/packet regeneration
  stays in the per-project ``mint_director_inputs.py`` GENERATED artifacts —
  no shared 4th template in 4C scope; this module mints only the 4A.2
  three-wrapper carrier.
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

# Wave1 item 8 (2026-11-16): OPTIONAL templates, minted ONLY for projects
# that DECLARE them by already carrying the deployed artifact (the tracked
# on-disk copy IS the declaration — a project never grows one by re-mint).
# ``reviewer_pass.py`` is the lead-level reviewer-only pass used by
# tin-nong-5tin-20261115; faa-ground-stop-20261114 has none and must not
# gain one. Byte-identical render (modulo placeholders) is pinned by the
# test pack, closing the P0-2 silent-divergence flag (deployed-copy-only,
# no template).
PRESENCE_DECLARED_TEMPLATES = {
    "reviewer_pass.py.tmpl": "scripts/cc_pipeline/reviewer_pass.py",
}
# Wave1 security cycle-1 (CRITICAL-3 pre-check): the DEPLOYED-project roster —
# every git-tracked project dir carrying a minted scripts/cc_pipeline/ tree.
# ``--all-deployed`` re-mints + hash-verifies ALL of them; a roster that
# silently omits a deployed copy is exactly the drift/data-loss hole the
# strict gate exists to close (tai-chinh-3tin-20261111 and canary-phase4 were
# minted 2026-11-15 from pre-wave1 templates and absent from the informal
# re-mint list — the security review flagged both as untracked drift).
# canary-phase4 IS a git-tracked project dir with scripts/cc_pipeline/
# (verified: git ls-files projects/canary-phase4/scripts/cc_pipeline/), so it
# belongs on the roster like any production episode.
DEPLOYED_PROJECTS = [
    "tin-nong-5tin-20261115",
    "tin-nong-5tin-20261116",
    "tin-nong-5tin-20261118",
    "faa-ground-stop-20261114",
    "tai-chinh-3tin-20261111",
    "canary-phase4",
]
MANIFEST_NAME = ".mint_manifest.json"
STRICT_ENV = "OM_WRAPPER_TEMPLATE_STRICT"
FINDINGS_PURGE_DIR = "history/cc_findings"
FINDINGS_LATEST_SUFFIX = "_latest.md"
PRESERVE_ENV = "OM_REMINT_PRESERVE"


def preserve_mode_enabled(force: bool = False) -> bool:
    """4C.1 non-destructive re-mint gate: ON unless ``--force`` is passed or
    ``OM_REMINT_PRESERVE=0`` (global legacy re-mint)."""
    return not force and os.environ.get(PRESERVE_ENV, "1") != "0"


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def template_content_hash() -> tuple[str, dict[str, str]]:
    """Collective template content hash + per-template hashes (sorted, stable).

    Covers BOTH the always-minted templates and the presence-declared
    optional templates (auditability: drift in any template in this checkout
    is visible in every mint's output)."""
    per_file: dict[str, str] = {}
    hasher = hashlib.sha256()
    for name in sorted(set(WRAPPER_TEMPLATES) | set(PRESENCE_DECLARED_TEMPLATES)):
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


def purge_findings(project_dir: Path, preserve_scenes: frozenset[str] | set[str] = frozenset()) -> int:
    """4A.1 step 2: mint owns the findings purge (deterministic chokepoint).

    Phase 4C.1: when preserve mode is active, ``history/cc_findings/
    {scene_id}_latest.md`` entries for scenes whose seal is intact (approved
    + reviewed_hashes match on disk) are NEVER deleted — deleting them would
    destroy the findings a preserved scene's writer/reviewer produced and
    force needless rework.
    """
    _assert_purge_safe(project_dir)
    findings_dir = project_dir / FINDINGS_PURGE_DIR
    count = 0
    if findings_dir.is_dir():
        for entry in sorted(findings_dir.iterdir()):
            if entry.name.endswith(FINDINGS_LATEST_SUFFIX) and \
                    entry.name[: -len(FINDINGS_LATEST_SUFFIX)] in preserve_scenes:
                continue  # 4C.1: preserved scene — its findings must survive
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


def _declared_optional_templates(project_dir: Path) -> list[str]:
    """Optional templates the target project DECLARES (presence-declaration:
    the deployed artifact already exists on disk — Wave1 item 8)."""
    declared: list[str] = []
    for tmpl_name, rel in sorted(PRESENCE_DECLARED_TEMPLATES.items()):
        if (project_dir / rel).is_file():
            declared.append(tmpl_name)
    return declared


def _detect_hand_written(
    project_dir: Path, previous_manifest: dict | None, rendered: dict[str, str]
) -> list[str]:
    """Wrappers on disk that a previous mint did NOT produce (hand-written or
    hand-edited since the last mint). Covers the always-minted templates AND
    the declared optional ones (a hand-edited reviewer_pass.py must hit the
    same strict gate as a hand-edited wrapper)."""
    flagged: list[str] = []
    for tmpl_name in list(WRAPPER_TEMPLATES) + _declared_optional_templates(project_dir):
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


def mint_project(project_dir: Path, scene_count: int, force: bool = False,
                 episode_dir: Path | None = None) -> int:
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
    preview_templates = list(WRAPPER_TEMPLATES) + _declared_optional_templates(project_dir)
    rendered_hashes_preview = {
        tmpl[: -len(".tmpl")]: _sha256_bytes(_render(tmpl, slug, scene_count).encode("utf-8"))
        for tmpl in preview_templates
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

    # 4C.1 non-destructive re-mint: resolve the preserve set (approved verdict
    # + reviewed_hashes match on disk) BEFORE the purge, then purge only
    # findings of non-preserved scenes. --force / OM_REMINT_PRESERVE=0
    # restores the legacy purge-everything behavior.
    force = force or os.environ.get(PRESERVE_ENV, "1") == "0"
    findings_dir = project_dir / FINDINGS_PURGE_DIR
    findings_count = sum(1 for _ in findings_dir.iterdir()) if findings_dir.is_dir() else 0
    preserved: set[str] = set()
    if not force:
        from tools.qc.restore_seals import get_preserved_scenes
        preserved = get_preserved_scenes(project_dir, episode_dir=episode_dir)
        if not preserved and findings_count:
            print(
                f"WARNING: preserve mode ON ({PRESERVE_ENV}) but 0 preserved scenes detected; "
                f"{findings_count} findings entries will be purged. If this episode's packets "
                "live outside remotion-composer/src/<slug> (e.g. packets/episode/), pass "
                "--episode-dir explicitly."
            )

    # Purge owner: stale findings never leak across episodes/rounds (4A.1);
    # preserved scenes' findings survive (4C.1).
    purged = purge_findings(project_dir, preserve_scenes=preserved)

    out_dir.mkdir(parents=True, exist_ok=True)
    rendered: dict[str, str] = {}
    minted_templates = list(WRAPPER_TEMPLATES) + _declared_optional_templates(project_dir)
    for tmpl_name in minted_templates:
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
        "force": force,
        "preserved_scenes": sorted(preserved),
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Auditability: every mint prints what minted it (plan 4A.2 change item).
    print(f"mint_project_pipeline: project={project_dir} slug={slug}")
    print(f"purged {FINDINGS_PURGE_DIR}/ ({purged} entr{'y' if purged == 1 else 'ies'} removed)"
          + (f"; preserved {len(preserved)} scene(s): {', '.join(sorted(preserved))}" if preserved else ""))
    print(f"preserve mode: {'OFF (--force / OM_REMINT_PRESERVE=0)' if force else 'ON (4C.1 non-destructive)'} ({PRESERVE_ENV})")
    print(f"minted from OM commit {commit}")
    print(f"template content hash: {tpl_hash}")
    for tmpl_name in minted_templates:
        out_name = tmpl_name[: -len(".tmpl")]
        print(f"  {tmpl_name}  {per_template[tmpl_name][:12]}  -> {out_name}  (rendered {rendered[out_name][:12]})")
    skipped_optional = sorted(set(PRESENCE_DECLARED_TEMPLATES) - set(minted_templates))
    if skipped_optional:
        print(f"  optional templates NOT declared (skipped, no artifact minted): "
              + ", ".join(skipped_optional))
    print(f"strict mode: {'ON' if strict else 'OFF (warn-only)'} ({STRICT_ENV})")
    print(f"manifest: {manifest_path}")
    return 0


def verify_minted_hashes(project_dir: Path, scene_count: int | None = None) -> list[str]:
    """Verify every minted wrapper's on-disk sha256 matches BOTH the last
    mint manifest's recorded hash AND the freshly rendered template (rendered
    at ``scene_count`` — default: the manifest's recorded scene_count).

    Returns a list of human-readable mismatch strings; empty list = verified.
    CRITICAL-3: the re-mint roster is only as good as its verification — an
    unverified re-mint is the silent-clobber risk the strict gate guards.
    """
    manifest_path = project_dir / "scripts" / "cc_pipeline" / MANIFEST_NAME
    if not manifest_path.is_file():
        return [f"{project_dir}: no {MANIFEST_NAME} — nothing to verify"]
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as e:
        return [f"{project_dir}: unreadable {MANIFEST_NAME}: {e}"]
    rendered: dict[str, str] = manifest.get("rendered", {})
    if not isinstance(rendered, dict) or not rendered:
        return [f"{project_dir}: manifest carries no rendered hashes"]
    scenes = scene_count if scene_count is not None else int(manifest.get("scene_count", 15))
    slug = manifest.get("project") or project_dir.name
    mismatches: list[str] = []
    for out_name, recorded in sorted(rendered.items()):
        out_path = project_dir / "scripts" / "cc_pipeline" / out_name
        if not out_path.is_file():
            mismatches.append(f"{project_dir}: {out_name} MISSING on disk")
            continue
        on_disk = _sha256_bytes(out_path.read_bytes())
        if on_disk != recorded:
            mismatches.append(f"{project_dir}: {out_name} on-disk {on_disk[:12]} != manifest {recorded[:12]}")
        tmpl_name = out_name + ".tmpl"
        if (TEMPLATE_DIR / tmpl_name).is_file():
            fresh = _sha256_bytes(_render(tmpl_name, slug, scenes).encode("utf-8"))
            if fresh != on_disk:
                mismatches.append(f"{project_dir}: {out_name} on-disk {on_disk[:12]} != fresh render {fresh[:12]}")
    return mismatches


def mint_all_deployed(force: bool = False, episode_dir: Path | None = None,
                      scene_count: int | None = None) -> int:
    """Strict re-mint + hash-verify EVERY project on DEPLOYED_PROJECTS.

    CRITICAL-3: one command covers the whole roster — no deployed copy can be
    silently skipped by an operator re-minting from memory. Any mint failure
    or hash mismatch fails the batch (exit 1) with per-project detail. Each
    project re-mints at its OWN recorded scene_count (the launcher's
    {{DEFAULT_SCENE_COUNT}} placeholder is per-project state — a global
    scene count would silently rewrite tin/faa 12 -> 15), falling back to
    ``scene_count`` when no manifest exists yet.
    """
    failed = 0
    for slug in DEPLOYED_PROJECTS:
        project_dir = REPO_ROOT / "projects" / slug
        if not project_dir.is_dir():
            print(f"FAIL: deployed project dir missing: {project_dir}")
            failed += 1
            continue
        print(f"=== deployed project: {slug} ===")
        scenes = scene_count
        manifest_path = project_dir / "scripts" / "cc_pipeline" / MANIFEST_NAME
        if scenes is None and manifest_path.is_file():
            try:
                scenes = int(json.loads(manifest_path.read_text(encoding="utf-8"))
                             .get("scene_count", 15))
            except Exception:
                scenes = None
        if scenes is None:
            print(f"FAIL: {slug}: no manifest scene_count and no --scenes given")
            failed += 1
            continue
        rc = mint_project(project_dir, scenes, force=force, episode_dir=episode_dir)
        if rc != 0:
            failed += 1
            continue
        mismatches = verify_minted_hashes(project_dir, scenes)
        if mismatches:
            for m in mismatches:
                print(f"HASH MISMATCH: {m}")
            failed += 1
        else:
            for out_name in sorted(json.loads(
                    (project_dir / "scripts" / "cc_pipeline" / MANIFEST_NAME)
                    .read_text(encoding="utf-8")).get("rendered", {})):
                on_disk = _sha256_bytes(
                    (project_dir / "scripts" / "cc_pipeline" / out_name).read_bytes())
                print(f"  verify OK {slug}/scripts/cc_pipeline/{out_name} sha256={on_disk}")
    print(f"mint_all_deployed: {len(DEPLOYED_PROJECTS) - failed}/{len(DEPLOYED_PROJECTS)} project(s) minted+verified")
    return 1 if failed else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m tools.qc.mint_project_pipeline",
        description="Mint per-project CC pipeline wrappers from shared templates (phase 4A.2).",
    )
    parser.add_argument(
        "--all-deployed", action="store_true",
        help="CRITICAL-3: strict re-mint + sha256-verify EVERY project on "
             "the DEPLOYED_PROJECTS roster (mutually exclusive with "
             "--project-dir). Any mint failure or hash mismatch fails the "
             "batch with exit 1.",
    )
    parser.add_argument(
        "--project-dir", required=False, default=None,
        help="Target project dir, e.g. projects/<slug> (relative to cwd or absolute).",
    )
    parser.add_argument(
        "--scenes", type=int, default=None,
        help="Default scene count baked into the generated launcher. "
             "Single-project mode defaults to 15 when omitted; "
             "--all-deployed defaults to each project's recorded "
             "manifest scene_count (per-project state).",
    )
    parser.add_argument(
        "--episode-dir", default=None,
        help="Explicit episode dir for 4C.1 preserve detection (default: "
             "inferred from the project dir: remotion-composer/src/<slug>, "
             "project dir itself, or project/packets).",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Legacy destructive re-mint: purge ALL history/cc_findings and "
             "overwrite everything (default without --force is the 4C.1 "
             "preserve mode; OM_REMINT_PRESERVE=0 forces legacy globally).",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.all_deployed:
        if args.project_dir:
            print("FAIL: --all-deployed is mutually exclusive with --project-dir", file=sys.stderr)
            return 2
        if args.scenes is not None and args.scenes < 1:
            print("FAIL: --scenes must be >= 1", file=sys.stderr)
            return 2
        episode_dir = Path(args.episode_dir) if args.episode_dir else None
        return mint_all_deployed(force=args.force, episode_dir=episode_dir,
                                 scene_count=args.scenes)
    if not args.project_dir:
        print("FAIL: one of --project-dir / --all-deployed is required", file=sys.stderr)
        return 2
    scenes = args.scenes if args.scenes is not None else 15
    if scenes < 1:
        print("FAIL: --scenes must be >= 1", file=sys.stderr)
        return 2
    project_dir = Path(args.project_dir)
    if not project_dir.is_absolute():
        project_dir = Path.cwd() / project_dir
    episode_dir = Path(args.episode_dir) if args.episode_dir else None
    return mint_project(project_dir, scenes, force=args.force, episode_dir=episode_dir)


if __name__ == "__main__":
    sys.exit(main())
