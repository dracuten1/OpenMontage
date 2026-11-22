"""Repo-local documentation contract checks for the video production surface.

Enforces the doc rules proposed in
``docs/plans/2026-11-09-video-skills-agent-team-sync.md`` (Task 6 — conflict
and executable-documentation checks):

1. Single authority — only ``docs/ORCHESTRATION_DOCTRINE.md`` may claim
   canonical production-contract authority; every audited surface must cite
   it as the canonical source, never itself.
2. Inventory integrity — ``docs/video-contract-inventory.json`` parses,
   its ``counts`` block matches its own entries, and every ``active`` path
   exists on disk.
3. Symlink integrity — ``.claude/skills`` symlinks (including the
   ``editorial-explainer-manifest`` mirror) resolve; nothing dangles.
4. Mirror consistency — real-directory duplicates in ``.claude/skills``
   whose names match ``.agents/skills`` entries stay byte-identical
   (drift detector; pairs derived dynamically, never hardcoded).
5. Broken links — repo-relative file references in the audited doc/skill
   set must all resolve (zero-stale policy; the 2026-11-09 known-stale
   baseline of 16 pre-existing dead refs was healed and retired).
6. No error-swallowing bypasses — doc examples must not teach agents to
   swallow required QC failures (``except: pass``, ``|| true``,
   ``continue-on-fail``, ...).
7. Command existence — tools/libs cited by the Production Contract
   Binding surfaces exist on disk.
8. Doctrine metadata — the machine-readable `````json```` block parses and
   declares the 7 required phases.
9. Binding uniformity — every pipeline director/executive-producer file
   carries the byte-identical ``## Production Contract Binding`` block.
10. Status-doc evidence — every path citation in
    ``docs/video-capability-status.md`` resolves on disk (repo-relative,
    workspace-relative, or relative to a base dir the doc itself declares).
11. ``by_status`` pin — inventory entry statuses match the pinned 7-value
    distribution; a recorded ``counts.by_status`` block must equal the
    recomputation.
12. Audited-skill derivation — the audited skill set is glob-derived with
    explicit, documented exclusions; no ``SKILL.md`` is silently skipped.

Stdlib + pytest only. Static documentation checks are necessary, not
runtime acceptance (plan Task 6).
"""

import fnmatch
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]

DOCTRINE = REPO_ROOT / "docs" / "ORCHESTRATION_DOCTRINE.md"

# The audited skill set is GLOB-DERIVED from .agents/skills/*/SKILL.md (the
# edit-once canonical surface), not hardcoded: a newly added first-party
# skill is audited automatically instead of being silently missed. Excluded
# skills are listed EXPLICITLY below, each with its measured reason.
AUDITED_SKILL_EXCLUSIONS = {
    "video-understand": "upstream provider skill; upstream repo-external helper refs",
}

# .agents/skills entries WITHOUT a SKILL.md that are deliberately tolerated
# (reported explicitly here instead of being silently skipped — S11).
SKILL_DIRS_WITHOUT_SKILL_MD: dict[str, str] = {}

AUDITED_TOP_DOCS = [
    DOCTRINE,
    REPO_ROOT / "AGENTS.md",
    REPO_ROOT / "AGENT_GUIDE.md",
]


def derived_audited_skills() -> list[str]:
    """Glob-derived audited skills: every .agents/skills/ directory with a
    SKILL.md, minus the explicit exclusion list above."""
    root = REPO_ROOT / ".agents" / "skills"
    return sorted(
        p.name
        for p in root.iterdir()
        if p.is_dir()
        and not p.is_symlink()
        and (p / "SKILL.md").is_file()
        and p.name not in AUDITED_SKILL_EXCLUSIONS
    )


def audited_files() -> list[Path]:
    """The audited doc/skill set: top docs, pipeline yamls, director files,
    executive producers, glob-derived audited skills, and flat skill entries
    (.agents/skills/*.md). Every returned path must exist — a missing file
    fails loudly here instead of silently shrinking the audited set (S11)."""
    files: list[Path] = list(AUDITED_TOP_DOCS)
    files += sorted((REPO_ROOT / "pipeline_defs").glob("*.yaml"))
    files += sorted((REPO_ROOT / "skills" / "pipelines").glob("*/*-director.md"))
    files += sorted((REPO_ROOT / "skills" / "pipelines").glob("*/executive-producer.md"))
    files += [
        REPO_ROOT / ".agents" / "skills" / name / "SKILL.md"
        for name in derived_audited_skills()
    ]
    files += sorted(
        p
        for p in (REPO_ROOT / ".agents" / "skills").iterdir()
        if p.name.endswith(".md") and (p.is_file() or p.is_symlink())
    )
    missing = [str(f.relative_to(REPO_ROOT)) for f in files if not f.exists()]
    assert not missing, (
        "Audited doc/skill set references missing files — report them, "
        f"never silently shrink the audited set: {missing}"
    )
    return files


def test_audited_skills_derivation_accounts_for_every_skill_dir() -> None:
    """Every .agents/skills entry must be explicitly accounted for: audited
    (glob-derived directory or flat .md entry), deliberately excluded (documented
    reason), a symlink mirror, or a tolerated no-SKILL.md placeholder.
    A skill directory without SKILL.md or an unaccounted flat .md entry must
    never appear or vanish silently."""
    root = REPO_ROOT / ".agents" / "skills"
    unaccounted = []
    derived = set(derived_audited_skills())
    audited = set(audited_files())
    for p in sorted(root.iterdir()):
        if p.is_symlink() and p.is_dir():
            continue  # symlink directory mirrors
        if p.name.endswith(".md"):
            # Flat .md skill entries are audited directly via audited_files().
            assert p in audited or p.name in AUDITED_SKILL_EXCLUSIONS, (
                f".agents/skills/{p.name} is a flat .md entry not included in audited_files()"
            )
            continue
        if (p / "SKILL.md").is_file():
            assert p.name in derived or p.name in AUDITED_SKILL_EXCLUSIONS, (
                f".agents/skills/{p.name}/ has a SKILL.md but is neither in "
                "the derived audited set nor in AUDITED_SKILL_EXCLUSIONS"
            )
            continue
        if p.name not in SKILL_DIRS_WITHOUT_SKILL_MD:
            unaccounted.append(p.name)
    assert not unaccounted, (
        "Skill directories without SKILL.md must be listed (with a reason) "
        f"in SKILL_DIRS_WITHOUT_SKILL_MD, not skipped silently: {unaccounted}"
    )


# ---------------------------------------------------------------------------
# 1. Single authority
# ---------------------------------------------------------------------------

# Phrases that claim canonical production-contract authority. Bare
# "source of truth" is deliberately NOT in this list: it also describes
# ordinary data provenance (e.g. "committed transcripts are the source of
# truth for your application"), which is not an orchestration-authority
# claim. "canonical source" (added 2026-11-09, S10) IS an authority claim;
# lines citing the doctrine file stay exempt via the subordination check
# below, and the two Blender-domain skills whose "canonical source (policy)"
# means image/view-template provenance are in AUDITED_SKILL_EXCLUSIONS with
# that reason documented.
AUTHORITY_PHRASES = [
    "canonical authority",
    "canonical contract",
    "canonical production contract",
    "canonical source",
    "single source of truth",
    "authoritative source",
    "is the authority",
]

DOCTRINE_REL = "docs/ORCHESTRATION_DOCTRINE.md"


def _authority_violations() -> list[tuple[str, int, str]]:
    """Lines outside the doctrine claiming canonical authority without
    citing the doctrine file on the same line."""
    violations: list[tuple[str, int, str]] = []
    for path in audited_files():
        if path == DOCTRINE:
            continue  # the doctrine is the canonical authority itself
        text = path.read_text(encoding="utf-8", errors="replace")
        for lineno, line in enumerate(text.splitlines(), 1):
            lowered = line.lower()
            if not any(phrase in lowered for phrase in AUTHORITY_PHRASES):
                continue
            if DOCTRINE_REL in line or DOCTRINE.name in line:
                continue  # correct subordination statement, not a rival claim
            violations.append((str(path.relative_to(REPO_ROOT)), lineno, line.strip()))
    return violations


def test_only_doctrine_claims_canonical_authority() -> None:
    violations = _authority_violations()
    assert not violations, (
        "Files outside docs/ORCHESTRATION_DOCTRINE.md claim canonical "
        "production-contract authority without citing the doctrine "
        f"(single-authority violation): {violations}"
    )


def test_director_files_cite_doctrine_binding_block() -> None:
    """Every director/executive-producer file must be subordinated to the
    doctrine. All 26 kept pipeline director / executive-producer files carry the
    "Production Contract Binding" block citing the doctrine. The explainer
    pipeline (10 files under skills/pipelines/explainer/) also enforces
    subordination at the lane level in pipeline_defs/animated-explainer.yaml.
    """
    binding_heading = "## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)"
    explainer = REPO_ROOT / "skills" / "pipelines" / "explainer"
    missing = []
    director_files = (
        sorted((REPO_ROOT / "skills" / "pipelines").glob("*/*-director.md"))
        + sorted((REPO_ROOT / "skills" / "pipelines").glob("*/executive-producer.md"))
    )
    assert len(director_files) == 26, (
        f"expected 26 director files under skills/pipelines/, found {len(director_files)}"
    )
    for path in director_files:
        text = path.read_text(encoding="utf-8", errors="replace")
        if binding_heading not in text:
            missing.append(str(path.relative_to(REPO_ROOT)))
    assert not missing, (
        f"{len(missing)} director files missing the Production "
        f"Contract Binding block citing {DOCTRINE_REL}: {missing}"
    )
    # Explainer lane-level binding backstop.
    explainer_yaml = REPO_ROOT / "pipeline_defs" / "animated-explainer.yaml"
    assert explainer_yaml.is_file(), (
        "pipeline_defs/animated-explainer.yaml is missing — the explainer "
        "lane has no manifest carrying the contract header"
    )
    first_line = explainer_yaml.read_text(encoding="utf-8", errors="replace").splitlines()[0]
    assert DOCTRINE_REL in first_line and "canonical authority" in first_line, (
        "pipeline_defs/animated-explainer.yaml header must cite "
        f"{DOCTRINE_REL} as the canonical authority (explainer lane binding)"
    )
    assert explainer.is_dir() and len(list(explainer.glob("*.md"))) >= 10, (
        "expected the explainer lane (10 director/producer files) under "
        "skills/pipelines/explainer/ — re-check the lane-level wiring"
    )


# The Production Contract Binding block is the LAST h2 section of every
# pipeline director/executive-producer file: heading line through EOF,
# hashed verbatim for the Antigravity-native v3.0 contract. A deliberate
# block revision must update every carrier and re-pin here.
BINDING_HEADING = "## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)"
BINDING_BLOCK_MD5 = "ffe79a4cf74239793ffc9ff68b7bb5ef"


def test_binding_block_byte_identical_across_all_pipeline_directors() -> None:
    """Every skills/pipelines/*/*.md file on disk (the full director +
    executive-producer set, explainer lanes included) must carry the
    byte-identical Production Contract Binding block; the carrier count must
    equal the disk-derived director/producer count, so a future pipeline
    without the block fails."""
    directors = sorted((REPO_ROOT / "skills" / "pipelines").glob("*/*.md"))
    assert directors, "no pipeline director files found under skills/pipelines/"
    producer_globs = (
        sorted((REPO_ROOT / "skills" / "pipelines").glob("*/*-director.md"))
        + sorted((REPO_ROOT / "skills" / "pipelines").glob("*/executive-producer.md"))
    )
    assert sorted(map(str, directors)) == sorted(map(str, producer_globs)), (
        "skills/pipelines/*/*.md contains files that are not director/"
        "executive-producer surfaces (or vice versa) — re-check the binding "
        "carrier universe"
    )
    hashes: dict[str, str] = {}
    missing = []
    for path in directors:
        text = path.read_text(encoding="utf-8", errors="replace")
        if BINDING_HEADING not in text:
            missing.append(str(path.relative_to(REPO_ROOT)))
            continue
        block = text[text.index(BINDING_HEADING):]
        hashes[str(path.relative_to(REPO_ROOT))] = hashlib.md5(
            block.encode("utf-8")
        ).hexdigest()
    assert not missing, (
        f"{len(missing)} pipeline director files missing the Production "
        f"Contract Binding block: {missing}"
    )
    non_uniform = {h for h in hashes.values() if h != BINDING_BLOCK_MD5}
    assert not non_uniform, (
        "Production Contract Binding blocks diverged from the pinned "
        f"md5 {BINDING_BLOCK_MD5}: {sorted(non_uniform)} "
        f"({len(hashes)} carriers scanned)"
    )


def test_pipeline_yaml_headers_cite_doctrine_as_canonical() -> None:
    """Every pipeline_defs/*.yaml must open with the 3-line contract header
    that names the doctrine as the canonical authority."""
    missing = []
    yamls = sorted((REPO_ROOT / "pipeline_defs").glob("*.yaml"))
    assert yamls, "no pipeline_defs/*.yaml found"
    for path in yamls:
        first_line = path.read_text(encoding="utf-8", errors="replace").splitlines()[0]
        if DOCTRINE_REL not in first_line or "canonical authority" not in first_line:
            missing.append(str(path.relative_to(REPO_ROOT)))
    assert not missing, (
        f"pipeline yaml files whose header does not cite {DOCTRINE_REL} "
        f"as canonical authority: {missing}"
    )


# ---------------------------------------------------------------------------
# 2. Antigravity-native surface & skill/pipeline catalog hygiene
# ---------------------------------------------------------------------------

EXPECTED_KEPT_PIPELINES = {
    "animated-explainer.yaml",
    "animation.yaml",
    "documentary-montage.yaml",
    "framework-smoke.yaml",
}

EXPECTED_KEPT_SKILLS = {
    "3d-asset-generation",
    "9router-web-fetch",
    "9router-web-search",
    "animation-principles",
    "beat-sync-editing",
    "blender-animation",
    "blender-cameras",
    "blender-lighting",
    "blender-materials",
    "blender-modeling",
    "blender-rendering",
    "d3-viz",
    "editorial-explainer-manifest",
    "ffmpeg",
    "motion-art-direction",
    "remotion",
    "remotion-best-practices",
    "video-edit",
    "video-understand",
    "visual-style",
}


def test_antigravity_only_no_legacy_claude_harness() -> None:
    """Claude Code / legacy harness artifacts must remain removed."""
    assert not (REPO_ROOT / ".claude").exists(), ".claude/ directory must not exist"
    assert not (REPO_ROOT / "CLAUDE.md").exists(), "CLAUDE.md must not exist"
    assert not (REPO_ROOT / ".superpowers").exists(), ".superpowers/ must not exist"


def test_kept_pipelines_and_agents_skills_match_contract() -> None:
    """Only the 4 kept pipeline manifests and 20 kept .agents/skills exist."""
    actual_pipelines = {p.name for p in (REPO_ROOT / "pipeline_defs").glob("*.yaml")}
    assert actual_pipelines == EXPECTED_KEPT_PIPELINES, (
        f"pipeline_defs drifted: expected {sorted(EXPECTED_KEPT_PIPELINES)}, "
        f"got {sorted(actual_pipelines)}"
    )
    actual_skills = {
        p.name
        for p in (REPO_ROOT / ".agents" / "skills").iterdir()
        if p.is_dir() and not p.is_symlink()
    }
    assert actual_skills == EXPECTED_KEPT_SKILLS, (
        f".agents/skills drifted: expected {len(EXPECTED_KEPT_SKILLS)} kept skills, "
        f"got missing={sorted(EXPECTED_KEPT_SKILLS - actual_skills)} "
        f"extra={sorted(actual_skills - EXPECTED_KEPT_SKILLS)}"
    )


# ---------------------------------------------------------------------------
# 5. Broken-link detector — zero-stale policy
# ---------------------------------------------------------------------------
#
# History: a known-stale baseline (16 refs, removed 2026-11-09) once pinned
# pre-existing dead references in skills/pipelines/** — 12 refs to planned
# docs/*-best-practices.md docs that were never created, plus per-project
# working refs (projects/mori-no-seishin/generate_images.py,
# remotion-composer/public/demo-props/{mori-no-seishin,deep-ocean}.json)
# removed along with their projects. All 16 were healed by repointing to
# real current docs/examples or dropping the stale reference; the equality
# baseline is retired. The test now asserts ZERO unresolved references: a
# new broken reference anywhere in the audited set fails immediately.

# Only tokens ending in a recognized file extension count as file
# references — bare tokens like "tools/keys" (API keys in prose) or
# "docs/versioning" (a topic) are not file paths.
_LINK_EXTENSIONS = {
    ".md",
    ".py",
    ".json",
    ".yaml",
    ".yml",
    ".mjs",
    ".ts",
    ".tsx",
    ".sh",
    ".txt",
    ".toml",
}

_LINK_PREFIXES = (
    "docs",
    "skills",
    "tools",
    "lib",
    "tests",
    "scripts",
    "pipeline_defs",
    ".agents",
    ".claude",
    "remotion-composer",
    "projects",
)

_LINK_PATTERN = re.compile(
    r"(?<![\w~/.])((?:"
    + "|".join(re.escape(p) for p in _LINK_PREFIXES)
    + r")/[A-Za-z0-9][\w./+-]*)"
)

# The retired KNOWN_STALE_REFS equality baseline (16 pre-existing dead refs
# in skills/pipelines/**, all healed on 2026-11-09 — history in the section
# comment above) is gone for good: the detector below is ZERO-TOLERANCE.
# A new unresolved reference anywhere in the audited set fails immediately;
# there is no baseline to grow into.
def _clean_reference_token(token: str) -> str:
    token = token.split("#", 1)[0]  # strip anchors
    token = re.sub(r":\d+$", "", token)  # strip line refs like file.md:12
    return token.rstrip(".,;:)'\"`")


def _reference_resolves(token: str, referencing_file: Path) -> bool:
    cleaned = _clean_reference_token(token)
    if not cleaned or "*" in cleaned:
        return True  # glob patterns and placeholders are not single files
    if Path(cleaned).suffix.lower() not in _LINK_EXTENSIONS:
        return True  # not a file reference (prose topic, module name, dir)
    if "<" in cleaned and ">" in cleaned:
        return True  # templated path placeholder (e.g. src/<slug>/lib/SceneShell.tsx) — per-episode scaffold, not a concrete repo file
    if (REPO_ROOT / cleaned).exists():
        return True
    # Relative references inside a skill directory resolve against that
    # directory (e.g. soundtrack's "node scripts/sync-check.mjs").
    return (referencing_file.parent / cleaned).exists()


def _unresolved_references() -> set[tuple[str, str]]:
    unresolved: set[tuple[str, str]] = set()
    for path in audited_files():
        text = path.read_text(encoding="utf-8", errors="replace")
        for match in _LINK_PATTERN.finditer(text):
            token = match.group(1)
            if not _reference_resolves(token, path):
                unresolved.add((str(path.relative_to(REPO_ROOT)), token))
    return unresolved


def test_broken_links_zero_stale() -> None:
    """Zero-stale assert: every repo-relative file reference in the audited
    set resolves. The 2026-11-09 known-stale equality baseline (16 refs) was
    healed and retired — unresolved must stay ZERO, forever."""
    unresolved = _unresolved_references()
    assert not unresolved, (
        "Broken file references in the audited doc/skill set "
        f"(resolve them, never re-introduce a stale baseline): "
        f"{sorted(unresolved)}"
    )


# ---------------------------------------------------------------------------
# 6. Forbidden error-swallowing bypass patterns
# ---------------------------------------------------------------------------

# Doc examples must not teach agents to swallow required QC failures.
# Patterns (case-insensitive):
_BYPASS_PATTERNS = [
    (re.compile(r"except[^:\n]*:\s*(?:#[^\n]*\n\s*)?pass\b", re.M), "except...: pass"),
    (re.compile(r"\|\|\s*true\b"), "shell `|| true`"),
    (re.compile(r"continue[-_ ]on[-_ ]fail", re.I), "continue-on-fail"),
    (re.compile(r"set\s*\+\s*e\b"), "shell `set +e`"),
    (re.compile(r"catch\s*\([^)]*\)\s*\{\s*\}"), "empty catch block"),
    # stderr suppression in documented commands hides gate failures
    # (added 2026-11-09, S9):
    (re.compile(r"2>\s*/dev/null"), "shell `2>/dev/null`"),
    # silent skip-over of failures in documented python examples (S9):
    (
        re.compile(r"except\s+Exception[^:\n]*:\s*(?:#[^\n]*\n\s*)?continue\b"),
        "except Exception: continue",
    ),
]


def test_no_error_swallowing_bypass_patterns() -> None:
    violations = []
    for path in audited_files():
        text = path.read_text(encoding="utf-8", errors="replace")
        for pattern, label in _BYPASS_PATTERNS:
            for match in pattern.finditer(text):
                lineno = text[: match.start()].count("\n") + 1
                violations.append(
                    (str(path.relative_to(REPO_ROOT)), lineno, label, match.group(0)[:60])
                )
    assert not violations, (
        "Documentation examples must not swallow required QC errors — "
        f"bypass patterns found: {violations}"
    )


# ---------------------------------------------------------------------------
# 7. Command existence
# ---------------------------------------------------------------------------

# The contract-cited gate/tool files every director and pipeline manifest
# relies on (Production Contract Binding surfaces, synced 2026-11-09).
REQUIRED_CONTRACT_COMMANDS = [
    "tools/qc/fact_whitelist_gate.py",
    "tools/qc/source_photo_gate.py",
    "tools/qc/editorial_language_gate.py",
    "tools/qc/episode_gate.py",
    "tools/qc/render_episode.py",
    "tools/qc/mix_validator.py",
    "tools/qc/timing_relock_guard.py",
    "tools/qc/scene_packet.py",
    "lib/checkpoint.py",
    "lib/production_validation.py",
    "lib/timing_validator.py",
    "tools/audio/refresh_manifest.py",
    "tools/audio/vieneu_tts.py",
]

_COMMAND_PATTERN = re.compile(
    r"(?<![\w~/.])((?:tools|lib|scripts)/[A-Za-z0-9][\w./+-]*\.(?:py|mjs|sh|ts))"
)


def test_required_contract_commands_exist() -> None:
    missing = [
        rel for rel in REQUIRED_CONTRACT_COMMANDS if not (REPO_ROOT / rel).is_file()
    ]
    assert not missing, f"contract-cited commands missing from disk: {missing}"


def test_cited_command_references_exist_on_disk() -> None:
    """Every tools/|lib/|scripts/ file reference in the Production Contract
    Binding surfaces (top docs, pipeline yamls, director files) must
    exist on disk."""
    missing = []
    seen: set[tuple[str, str]] = set()
    surfaces = (
        sorted((REPO_ROOT / "pipeline_defs").glob("*.yaml"))
        + sorted((REPO_ROOT / "skills" / "pipelines").glob("*/*-director.md"))
        + sorted((REPO_ROOT / "skills" / "pipelines").glob("*/executive-producer.md"))
        + list(AUDITED_TOP_DOCS)
    )
    for path in surfaces:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for match in _COMMAND_PATTERN.finditer(text):
            token = match.group(1)
            if (path, token) in seen:
                continue
            seen.add((path, token))
            if not (REPO_ROOT / token).is_file():
                missing.append((str(path.relative_to(REPO_ROOT)), token))
    assert not missing, f"command references missing from disk: {missing}"


# ---------------------------------------------------------------------------
# 8. Doctrine metadata block
# ---------------------------------------------------------------------------


def _doctrine_metadata() -> dict:
    text = DOCTRINE.read_text(encoding="utf-8")
    match = re.search(r"```json\s*\n(.*?)```", text, re.S)
    assert match, (
        "docs/ORCHESTRATION_DOCTRINE.md is missing its machine-readable "
        "```json contract metadata block"
    )
    return json.loads(match.group(1))  # raises json.JSONDecodeError if invalid


def test_doctrine_metadata_declares_seven_required_phases() -> None:
    meta = _doctrine_metadata()
    assert meta["contract_version"] == "3.0", (
        f"unexpected contract_version: {meta.get('contract_version')!r}"
    )
    required_phases = meta["required_phases"]
    assert isinstance(required_phases, list) and len(required_phases) == 7, (
        f"doctrine must declare exactly 7 required phases, got {required_phases!r}"
    )
    assert meta.get("success_semantics") == "strict"
    assert DOCTRINE_REL in meta.get("source_of_truth", ""), (
        f"source_of_truth must name {DOCTRINE_REL}, got {meta.get('source_of_truth')!r}"
    )


def test_doctrine_metadata_sync_order_mirrors_exist() -> None:
    """Every glob surface named in the doctrine's sync_order must match at
    least one file on disk, and the declared mirror glob set must be a
    superset of all disk-derived carriers carrying the Production Contract
    Binding block."""
    meta = _doctrine_metadata()
    sync_order = meta["sync_order"]
    mirrored = sync_order.get("synced_mirrors", [])
    assert mirrored, "doctrine sync_order.synced_mirrors must not be empty"
    dead = []
    for pattern in mirrored:
        matches = list(REPO_ROOT.glob(pattern))
        if not matches:
            dead.append(pattern)
    assert not dead, f"sync_order mirrors matching no files on disk: {dead}"

    # Disk-derived binding carriers (skills/pipelines/*/*.md carrying the binding block):
    binding_carriers = [
        path
        for path in sorted((REPO_ROOT / "skills" / "pipelines").glob("*/*.md"))
        if BINDING_HEADING in path.read_text(encoding="utf-8", errors="replace")
    ]
    assert binding_carriers, "no binding carriers found under skills/pipelines/*/*.md"

    # Assert declared mirror glob set is a superset of all disk-derived carriers:
    uncovered = [
        str(path.relative_to(REPO_ROOT))
        for path in binding_carriers
        if not any(
            fnmatch.fnmatch(str(path.relative_to(REPO_ROOT)), pat)
            for pat in mirrored
        )
    ]
    assert not uncovered, (
        f"Declared doctrine sync_order.synced_mirrors is not a superset of all "
        f"disk-derived binding carriers ({len(uncovered)} uncovered): {uncovered}. "
        "Expected doctrine glob 'skills/pipelines/*/*.md' to cover all director "
        "and executive-producer carriers."
    )


if __name__ == "__main__":  # pragma: no cover
    pytest.main([__file__, "-q"])
