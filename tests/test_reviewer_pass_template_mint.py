"""Wave1 item 8 — reviewer_pass.py.tmpl template + minter propagation.

Closes the P0-2 flag: the lead-level reviewer-only pass existed ONLY as a
deployed copy (projects/tin-nong-5tin-20261115/scripts/cc_pipeline/
reviewer_pass.py) with no template — silent-divergence risk. Now:
- tools/qc/cc_wrapper_templates/reviewer_pass.py.tmpl is the source of truth
  and must render BYTE-IDENTICAL to the deployed copy (modulo placeholders);
- the minter mints it ONLY for projects that declare it (presence-declared:
  the deployed artifact already on disk IS the declaration) — faa, which has
  no reviewer_pass.py, never grows one;
- a hand-edited declared reviewer_pass.py hits the same strict gate as any
  wrapper.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from tools.qc.mint_project_pipeline import (
    MANIFEST_NAME,
    PRESENCE_DECLARED_TEMPLATES,
    build_parser,
    main as mint_main,
    template_content_hash,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = REPO_ROOT / "tools/qc/cc_wrapper_templates/reviewer_pass.py.tmpl"
DEPLOYED_TIN = REPO_ROOT / ("projects/tin-nong-5tin-20261115/scripts/"
                            "cc_pipeline/reviewer_pass.py")
SLUG_TIN = "tin-nong-5tin-20261115"
SLUG_FAA = "faa-ground-stop-20261114"


def render(template_path: Path, slug: str, scenes: int = 12) -> str:
    return (template_path.read_text(encoding="utf-8")
            .replace("{{PROJECT_SLUG}}", slug)
            .replace("{{DEFAULT_SCENE_COUNT}}", str(scenes)))


def seed_project(tmp_path: Path, slug: str, *, declare_reviewer_pass: bool) -> Path:
    project = tmp_path / "projects" / slug
    cc = project / "scripts" / "cc_pipeline"
    cc.mkdir(parents=True)
    if declare_reviewer_pass:
        # the presence-declaration seed: any tracked deployed-copy content
        (cc / "reviewer_pass.py").write_text("# seed declaration copy\n", encoding="utf-8")
    return project


# ------------------------------------------------------------------------------
# Byte-identical render contract
# ------------------------------------------------------------------------------

def test_template_renders_byte_identical_to_deployed_tin_copy():
    assert DEPLOYED_TIN.is_file()
    assert render(TEMPLATE, SLUG_TIN) == DEPLOYED_TIN.read_text(encoding="utf-8")


def test_template_carries_only_slug_placeholder():
    src = TEMPLATE.read_text(encoding="utf-8")
    assert src.count("{{PROJECT_SLUG}}") == 1  # the EPISODE constant
    assert "{{DEFAULT_SCENE_COUNT}}" not in src  # scene-count independent tool


def test_template_content_hash_covers_optional_template():
    _, per_file = template_content_hash()
    assert "reviewer_pass.py.tmpl" in per_file


# ------------------------------------------------------------------------------
# Minter propagation: presence-declaration
# ------------------------------------------------------------------------------

def test_declared_project_gets_reviewer_pass_minted(tmp_path, capsys, monkeypatch):
    project = seed_project(tmp_path, SLUG_TIN, declare_reviewer_pass=True)
    # first mint over a pre-existing (seed) copy: warn-and-overwrite is the
    # designed path now that the template is the tracked source of truth
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project), "--scenes", "12",
                      "--force"]) == 0
    minted = project / "scripts" / "cc_pipeline" / "reviewer_pass.py"
    assert minted.is_file()
    assert minted.read_text(encoding="utf-8") == render(TEMPLATE, SLUG_TIN)
    manifest = json.loads((project / "scripts" / "cc_pipeline" / MANIFEST_NAME)
                          .read_text(encoding="utf-8"))
    assert manifest["rendered"]["reviewer_pass.py"]


def test_undeclared_project_never_grows_reviewer_pass(tmp_path, capsys):
    """faa semantics: no reviewer_pass.py on disk -> no template minted, and
    the mint output says the optional template was skipped."""
    project = seed_project(tmp_path, SLUG_FAA, declare_reviewer_pass=False)
    assert mint_main(["--project-dir", str(project), "--scenes", "12",
                      "--force"]) == 0
    cc = project / "scripts" / "cc_pipeline"
    assert not (cc / "reviewer_pass.py").exists()
    manifest = json.loads((cc / MANIFEST_NAME).read_text(encoding="utf-8"))
    assert set(manifest["rendered"]) == {
        "writer_wrapper.py", "reviewer_wrapper.py", "run_cc_pipeline.py"}
    out = capsys.readouterr().out
    assert "NOT declared" in out and "reviewer_pass.py.tmpl" in out


def test_hand_edited_declared_reviewer_pass_hits_strict_gate(tmp_path, monkeypatch):
    """A hand-edited declared optional artifact must not be silently
    clobbered — same strict gate as the core wrappers."""
    project = seed_project(tmp_path, SLUG_TIN, declare_reviewer_pass=True)
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project), "--scenes", "12",
                      "--force"]) == 0
    minted = project / "scripts" / "cc_pipeline" / "reviewer_pass.py"
    minted.write_text("# hand-edited lead-pass tweak\n", encoding="utf-8")
    # strict (default): refuse
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "1")
    assert mint_main(["--project-dir", str(project), "--scenes", "12"]) == 1
    assert minted.read_text(encoding="utf-8") == "# hand-edited lead-pass tweak\n"
    # warn-and-overwrite (designed re-mint path): content comes back template-true
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project), "--scenes", "12",
                      "--force"]) == 0
    assert minted.read_text(encoding="utf-8") == render(TEMPLATE, SLUG_TIN)


def test_presence_declaration_helper(tmp_path):
    project = seed_project(tmp_path, SLUG_TIN, declare_reviewer_pass=True)
    other = seed_project(tmp_path, SLUG_FAA, declare_reviewer_pass=False)
    from tools.qc.mint_project_pipeline import _declared_optional_templates
    assert _declared_optional_templates(project) == ["reviewer_pass.py.tmpl"]
    assert _declared_optional_templates(other) == []


def test_declaration_map_pins_reviewer_pass_only():
    assert PRESENCE_DECLARED_TEMPLATES == {
        "reviewer_pass.py.tmpl": "scripts/cc_pipeline/reviewer_pass.py"}
    assert build_parser().prog == "python -m tools.qc.mint_project_pipeline"


def test_deployed_faa_has_no_reviewer_pass():
    """Ground truth for the undeclared-mint semantics above."""
    assert not (REPO_ROOT / f"projects/{SLUG_FAA}/scripts/cc_pipeline/"
                "reviewer_pass.py").exists()


# ------------------------------------------------------------------------------
# Wave1 security cycle-1 CRITICAL-3 — the deployed-project re-mint roster
# ------------------------------------------------------------------------------

def test_deployed_roster_covers_every_tracked_minted_project():
    """The roster must name EVERY git-tracked project dir that carries a
    minted scripts/cc_pipeline tree — an omitted deployed copy is re-mint
    drift the strict gate cannot see (tai-chinh-3tin-20261111 and
    canary-phase4 were exactly that omission)."""
    from tools.qc.mint_project_pipeline import DEPLOYED_PROJECTS
    import subprocess
    tracked = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "ls-files",
         "projects/*/scripts/cc_pipeline/.mint_manifest.json"],
        capture_output=True, text=True, check=True).stdout.split()
    tracked_slugs = sorted({Path(p).parts[1] for p in tracked})
    assert tracked_slugs, "fixture drift: no tracked minted projects found"
    for slug in tracked_slugs:
        assert slug in DEPLOYED_PROJECTS, f"deployed project {slug!r} missing from DEPLOYED_PROJECTS roster"
    assert set(DEPLOYED_PROJECTS) == set(tracked_slugs)


def test_verify_minted_hashes_flags_drift(tmp_path, monkeypatch):
    """verify_minted_hashes: on-disk drift vs the manifest rendered hash is
    reported; a template-true tree verifies clean."""
    from tools.qc.mint_project_pipeline import verify_minted_hashes
    project = seed_project(tmp_path, SLUG_TIN, declare_reviewer_pass=True)
    monkeypatch.setenv("OM_WRAPPER_TEMPLATE_STRICT", "0")
    assert mint_main(["--project-dir", str(project), "--scenes", "12", "--force"]) == 0
    assert verify_minted_hashes(project) == []
    (project / "scripts" / "cc_pipeline" / "writer_wrapper.py").write_text(
        "# drifted\n", encoding="utf-8")
    mismatches = verify_minted_hashes(project)
    assert any("writer_wrapper.py" in m for m in mismatches)
