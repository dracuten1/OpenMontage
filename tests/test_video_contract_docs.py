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
INVENTORY = REPO_ROOT / "docs" / "video-contract-inventory.json"

# The audited skill set is GLOB-DERIVED from .agents/skills/*/SKILL.md (the
# edit-once canonical surface), not hardcoded: a newly added first-party
# skill is audited automatically instead of being silently missed. Excluded
# skills are listed EXPLICITLY below, each with its measured reason
# (fresh scan 2026-11-09, reviewer-remediation group C / W7).
AUDITED_SKILL_EXCLUSIONS = {
    # Vendored third-party knowledge (inventory kind=vendored — imported
    # wholesale, never rewritten per the inventory kind vocabulary):
    "hyperframes-animation": "vendored third-party; cites repo-external helpers",
    "hyperframes-creative": "vendored third-party; cites repo-external helpers",
    "tailwind-design-system": "vendored third-party; cites repo-external helpers",
    # Heavy third-party provider/tool skills whose SKILL.md documents
    # upstream helper conventions (tools/<name>.py etc.) that do not exist
    # in this repo — upstream templates, not OpenMontage contract surfaces
    # (these carry 63 of the 66 measured stale repo-internal refs):
    "acestep": "upstream provider skill; 14 repo-external helper refs",
    "dashscope": "upstream provider skill; repo-external helper refs",
    "elevenlabs": "upstream provider skill; repo-external helper refs",
    "ltx2": "upstream provider skill; 11 repo-external helper refs",
    "music-to-video": "upstream provider skill; repo-external helper refs",
    "playwright-recording": "upstream provider skill; repo-external helper refs",
    "synthetic-screen-recording": "upstream provider skill; repo-external helper refs",
    "video-toolkit": "upstream provider skill; 22 repo-external helper refs",
    "video-understand": "upstream provider skill; 8 repo-external helper refs",
    # Blender-domain reconstruction skills: their "canonical source (policy)"
    # phrasing is image/view-template provenance, not production-contract
    # authority — a measured lexical false positive for the authority check.
    "mascot-logo-reconstruction": "Blender-domain skill; 'canonical source' = image template policy",
    "multiview-constraint-solver": "Blender-domain skill; 'canonical source' = view template policy",
}

# .agents/skills entries WITHOUT a SKILL.md that are deliberately tolerated
# (reported explicitly here instead of being silently skipped — S11).
SKILL_DIRS_WITHOUT_SKILL_MD = {
    "gsap": "README-only placeholder (imported GSAP docs, no SKILL.md contract surface)",
}

AUDITED_TOP_DOCS = [
    DOCTRINE,
    REPO_ROOT / "AGENTS.md",
    REPO_ROOT / "CLAUDE.md",
    REPO_ROOT / ".claude" / "prompts" / "om_team_leader_prompt.md",
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
    doctrine. All 103 pipeline director / executive-producer files carry the
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
    assert len(director_files) == 103, (
        f"expected 103 director files under skills/pipelines/, found {len(director_files)}"
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
# hashed verbatim. md5 pinned from the group-A sync (2026-11-09) — a
# deliberate block revision must update every carrier and re-pin here.
BINDING_HEADING = "## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)"
BINDING_BLOCK_MD5 = "1dd8e674ff57ae3b9fb711c9ff2190cd"


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
# 2. Inventory integrity
# ---------------------------------------------------------------------------


def _load_inventory() -> dict:
    assert INVENTORY.exists(), f"{INVENTORY.relative_to(REPO_ROOT)} is missing"
    return json.loads(INVENTORY.read_text(encoding="utf-8"))


def test_inventory_parses_and_counts_are_self_consistent() -> None:
    data = _load_inventory()
    entries = data["entries"]
    counts = data["counts"]
    assert counts["total_entries"] == len(entries), (
        "counts.total_entries does not match len(entries): "
        f"{counts['total_entries']} vs {len(entries)}"
    )
    for key, field in (
        ("by_kind", "kind"),
        ("by_authority_tier", "authority_tier"),
        ("by_owner_lane", "owner_lane"),
        ("by_decision", "decision"),
    ):
        recomputed = {}
        for entry in entries:
            recomputed[entry[field]] = recomputed.get(entry[field], 0) + 1
        assert counts[key] == recomputed, (
            f"counts.{key} does not match the entry distribution: "
            f"{counts[key]} vs {recomputed}"
        )


# Pinned by_status distribution — recomputed FRESH from the inventory
# entries on 2026-11-09 (reviewer-remediation group C / W5), not taken from
# the reviewer's numbers. Sums to 658 == counts.total_entries.
# The inventory RECORDS a counts.by_status block with these exact values,
# and the recorded-vs-recomputed assertion below is strict: any drift
# between the recorded block and a fresh recompute fails the test.
EXPECTED_BY_STATUS = {
    "active": 529,
    "mirror-active": 47,
    "duplicate-identical": 48,
    "legacy-reference": 6,
    "dirty-preserved": 1,
    "untracked-dirty": 26,
    "active-evidence": 1,
}


def test_inventory_by_status_recompute_matches_pinned_distribution() -> None:
    """The entry-status distribution must recompute to the pinned 7-value
    distribution, and any recorded counts.by_status block must match the
    recomputation exactly."""
    data = _load_inventory()
    entries = data["entries"]
    recomputed: dict[str, int] = {}
    for entry in entries:
        recomputed[entry["status"]] = recomputed.get(entry["status"], 0) + 1
    assert recomputed == EXPECTED_BY_STATUS, (
        f"by_status recompute drifted from the pinned distribution: "
        f"{recomputed} vs {EXPECTED_BY_STATUS}"
    )
    assert sum(EXPECTED_BY_STATUS.values()) == len(entries), (
        "pinned by_status values do not sum to len(entries)"
    )
    recorded = data["counts"].get("by_status")
    assert recorded == recomputed, (
        f"counts.by_status does not match the entry distribution: "
        f"{recorded} vs {recomputed}"
    )


def test_inventory_scalar_counts_match_disk() -> None:
    """Structural scalar counts that are unambiguously derivable from disk
    must match reality.

    ``counts.skills_tree_md_files`` was reconciled on 2026-11-09 (refresh #2:
    capture-time 296 was entry-derived and inflated by a duplicate
    skills/INDEX.md entry; the inventory now records 295, matching the
    on-disk walk) — so it is asserted like the other scalars.

    ``counts.episode_source_dirs`` (63) and ``counts.root_tsx_compositions`` (65)
    recompute from disk using the inventory's recorded derivation rules.
    """
    data = _load_inventory()
    counts = data["counts"]
    assert counts["pipeline_defs"] == len(
        list((REPO_ROOT / "pipeline_defs").glob("*.yaml"))
    ), "counts.pipeline_defs does not match pipeline_defs/*.yaml on disk"
    assert counts["skills_tree_md_files"] == len(
        list((REPO_ROOT / "skills").rglob("*.md"))
    ), "counts.skills_tree_md_files does not match the skills/ .md walk"
    agents_dirs = [
        p
        for p in (REPO_ROOT / ".agents" / "skills").iterdir()
        if p.is_dir() and not p.is_symlink()
    ]
    assert counts["agents_skills_dirs"] == len(agents_dirs), (
        "counts.agents_skills_dirs does not match .agents/skills/ directories"
    )
    assert counts["claude_skills_entries"] == len(
        list((REPO_ROOT / ".claude" / "skills").iterdir())
    ), "counts.claude_skills_entries does not match .claude/skills/ entries"
    claude_agents = REPO_ROOT / ".claude" / "agents"
    if claude_agents.exists():
        assert counts["claude_agents"] == len(list(claude_agents.iterdir())), (
            "counts.claude_agents does not match .claude/agents/ entries"
        )

    # counts.episode_source_dirs (63): remotion-composer/src/*/ dirs minus the
    # 4 shared framework dirs {components, lib, cinematic, rigs} per the
    # inventory's episode_source_dirs_derivation formula.
    framework_dirs = {"components", "lib", "cinematic", "rigs"}
    episode_dirs = [
        p
        for p in (REPO_ROOT / "remotion-composer" / "src").iterdir()
        if p.is_dir() and not p.is_symlink() and p.name not in framework_dirs
    ]
    assert counts["episode_source_dirs"] == len(episode_dirs), (
        f"counts.episode_source_dirs ({counts.get('episode_source_dirs')}) does not "
        f"match disk walk ({len(episode_dirs)})"
    )

    # counts.root_tsx_compositions (65): count <Composition id="..." registrations
    # in remotion-composer/src/Root.tsx (exactly 65 compositions registered).
    root_tsx = (REPO_ROOT / "remotion-composer" / "src" / "Root.tsx").read_text(
        encoding="utf-8"
    )
    compositions = re.findall(r'<Composition\s+id="([^"]+)"', root_tsx)
    assert counts["root_tsx_compositions"] == len(compositions), (
        f"counts.root_tsx_compositions ({counts.get('root_tsx_compositions')}) does not "
        f"match Root.tsx composition registrations ({len(compositions)})"
    )


def _collect_doc_test_count() -> int:
    """Collect the test count of this file at runtime via pytest --collect-only.
    Uses -p no:cacheprovider to prevent cache writes and avoid recursion."""
    repo_venv_python = REPO_ROOT / ".venv" / "bin" / "python"
    python_bin = str(repo_venv_python) if repo_venv_python.is_file() else sys.executable
    cmd = [
        python_bin,
        "-m",
        "pytest",
        "--collect-only",
        "-q",
        "-p",
        "no:cacheprovider",
        str(Path(__file__).resolve()),
    ]
    proc = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=True,
        cwd=str(REPO_ROOT),
    )
    match = re.search(r"(\d+)\s+tests?\s+collected", proc.stdout)
    assert match, f"Could not parse collected test count from pytest output:\n{proc.stdout}"
    return int(match.group(1))


def test_inventory_doc_rule_test_count_matches_collected() -> None:
    """The inventory must record the actual pytest-collected test count of
    this file (derived, self-verifying, no hardcode).

    Declared under ``counts.doc_rule_tests`` in docs/video-contract-inventory.json.
    Tolerant when absent (pending group C edit); strict once present.
    """
    data = _load_inventory()
    counts = data.get("counts", {})
    declared = counts.get("doc_rule_tests")
    actual = _collect_doc_test_count()
    if declared is None:
        pytest.skip(
            "counts.doc_rule_tests field is absent in docs/video-contract-inventory.json "
            f"(pending wave-2 group C addition of counts.doc_rule_tests = {actual})"
        )
    assert declared == actual, (
        f"counts.doc_rule_tests in docs/video-contract-inventory.json ({declared}) "
        f"does not match actual pytest-collected test count ({actual})"
    )


def test_inventory_active_paths_exist_on_disk() -> None:
    data = _load_inventory()
    missing = [
        entry["path"]
        for entry in data["entries"]
        if entry.get("status") == "active" and not (REPO_ROOT / entry["path"]).exists()
    ]
    assert not missing, (
        f"{len(missing)} inventory entries marked 'active' do not exist on "
        f"disk: {missing[:20]}"
    )


# ---------------------------------------------------------------------------
# 3. Symlink integrity
# ---------------------------------------------------------------------------


def test_editorial_explainer_manifest_symlink_resolves() -> None:
    link = REPO_ROOT / ".claude" / "skills" / "editorial-explainer-manifest"
    target = REPO_ROOT / ".agents" / "skills" / "editorial-explainer-manifest"
    assert link.is_symlink(), (
        ".claude/skills/editorial-explainer-manifest must stay a symlink "
        "(edit-once rule: canonical lives under .agents/skills/)"
    )
    assert link.resolve() == target.resolve(), (
        ".claude/skills/editorial-explainer-manifest must resolve to "
        f"{target}, got {link.resolve()}"
    )
    assert (link / "SKILL.md").is_file(), (
        "editorial-explainer-manifest symlink target has no SKILL.md"
    )


def test_no_dangling_symlinks_in_claude_skills() -> None:
    dangling = []
    for path in (REPO_ROOT / ".claude" / "skills").rglob("*"):
        if path.is_symlink() and not path.resolve().exists():
            dangling.append(str(path.relative_to(REPO_ROOT)))
    assert not dangling, f"dangling symlinks under .claude/skills: {dangling}"


# ---------------------------------------------------------------------------
# 4. Mirror consistency (drift detector)
# ---------------------------------------------------------------------------

# macOS Finder noise; never part of a skill.
_MIRROR_IGNORE = {".DS_Store"}


def _derive_mirror_pairs() -> list[tuple[Path, Path]]:
    """Real directories under .claude/skills whose names match an
    .agents/skills entry. Derived dynamically — never hardcoded — so new
    duplicates are covered the moment they appear."""
    agents = REPO_ROOT / ".agents" / "skills"
    claude = REPO_ROOT / ".claude" / "skills"
    pairs = []
    if not (agents.is_dir() and claude.is_dir()):
        return pairs
    for entry in sorted(claude.iterdir()):
        if entry.is_symlink() or not entry.is_dir():
            continue  # symlink mirrors are checked by the symlink tests
        canonical = agents / entry.name
        if canonical.is_dir() and not canonical.is_symlink():
            pairs.append((canonical, entry))
    return pairs


def _mirror_files(root: Path) -> dict[str, bytes]:
    files: dict[str, bytes] = {}
    for path in sorted(root.rglob("*")):
        if path.is_file() and path.name not in _MIRROR_IGNORE:
            files[str(path.relative_to(root))] = path.read_bytes()
    return files


def test_realdir_mirror_pairs_are_byte_identical() -> None:
    pairs = _derive_mirror_pairs()
    assert pairs, (
        "no .claude/skills real-directory mirror pairs derived — the "
        "dynamic derivation is broken or every mirror became a symlink"
    )
    diverged = []
    for canonical, mirror in pairs:
        canon_files = _mirror_files(canonical)
        mirror_files = _mirror_files(mirror)
        if set(canon_files) != set(mirror_files):
            only_c = sorted(set(canon_files) - set(mirror_files))
            only_m = sorted(set(mirror_files) - set(canon_files))
            diverged.append(
                f"{canonical.name}: file-set drift (canonical-only={only_c}, "
                f"mirror-only={only_m})"
            )
            continue
        for rel, canon_bytes in canon_files.items():
            if mirror_files[rel] != canon_bytes:
                diverged.append(f"{canonical.name}/{rel}: content drift")
    assert not diverged, (
        "byte-identical mirror rule violated (real-dir duplicates in "
        f".claude/skills must match .agents/skills exactly): {diverged}"
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
# 5b. Status-doc evidence citations resolve on disk
# ---------------------------------------------------------------------------

CAPABILITY_STATUS = REPO_ROOT / "docs" / "video-capability-status.md"
EVIDENCE_WORKSPACE = REPO_ROOT / "projects" / "test-production-hardening-20261109-0114"

_STATUS_DOC_PATH_EXTS = {
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
    ".log",
    ".wav",
    ".mp4",
    ".png",
}

# Token must contain a slash (a real path, not a bare module/filename), and
# its first component must exist as a directory at the repo root or inside
# the declared evidence workspace — that root requirement is the false-
# positive guard: shorthand like `semantic-events-valid/invalid.json`
# (a fixture-name description, no such dir) is not captured.
_STATUS_DOC_TOKEN_RE = re.compile(r"\.?[A-Za-z0-9][\w./+-]*")


def _status_doc_workspace_base_dirs(text: str) -> set[str]:
    """Workspace-relative base dirs the doc itself declares (e.g.
    `packets/episode/artifacts/`, `artifacts/`) — used to resolve citations
    that are stated relative to an Evidence-file-map section base."""
    bases = set()
    if not EVIDENCE_WORKSPACE.is_dir():
        return bases
    for span in re.findall(r"`([^`]+)`", text):
        for tok in re.findall(r"(?:[A-Za-z0-9][\w.-]*/)+", span):
            candidate = tok.rstrip("/")
            if (EVIDENCE_WORKSPACE / candidate).is_dir():
                bases.add(candidate)
    return bases


def _cited_status_doc_paths() -> tuple[list[str], list[str]]:
    """Path citations in docs/video-capability-status.md partitioned into:
    (repo_relative_paths, workspace_relative_paths).

    Repo-relative citations must resolve against REPO_ROOT and are asserted
    unconditionally. Workspace-relative citations belong to EVIDENCE_WORKSPACE
    (projects/test-production-hardening-20261109-0114/) and are asserted
    conditionally (skipped when the untracked workspace is absent).
    """
    text = CAPABILITY_STATUS.read_text(encoding="utf-8")
    repo_roots = {p.name for p in REPO_ROOT.iterdir()}
    try:
        ws_rel_prefix = f"{EVIDENCE_WORKSPACE.relative_to(REPO_ROOT)}/"
    except ValueError:
        ws_rel_prefix = f"{EVIDENCE_WORKSPACE}/"
    ws_roots = (
        {p.name for p in EVIDENCE_WORKSPACE.iterdir()}
        if EVIDENCE_WORKSPACE.is_dir()
        else set()
    )
    repo_cited = set()
    ws_cited = set()
    for span in re.findall(r"`([^`]+)`", text):
        for tok in _STATUS_DOC_TOKEN_RE.findall(span):
            if "/" not in tok or tok.endswith("/"):
                continue
            if tok.startswith(("~", "http://", "https://")) or ".." in tok:
                continue  # hermes-side / external / relative-escape forms
            if "*" in tok or "{" in tok or "}" in tok:
                continue  # glob and brace-expansion forms are not single files
            if Path(tok).suffix.lower() not in _STATUS_DOC_PATH_EXTS:
                continue
            if tok.startswith(ws_rel_prefix):
                ws_cited.add(tok)
                continue
            first = tok.split("/", 1)[0]
            if first in ws_roots:
                ws_cited.add(tok)
            elif first in repo_roots:
                repo_cited.add(tok)
    return sorted(repo_cited), sorted(ws_cited)


def test_status_doc_cited_evidence_paths_exist() -> None:
    """Every path citation in docs/video-capability-status.md must exist on
    disk.

    Repo-relative citations are asserted UNCONDITIONALLY (floor guard >= 20
    counts only repo-relative citations). Workspace-relative citations (under
    projects/test-production-hardening-20261109-0114/) are asserted ONLY when
    that workspace exists on disk; otherwise pytest.skip with an explicit reason
    naming the missing workspace and that it is untracked (not CI-reproducible).
    """
    repo_cited, ws_cited = _cited_status_doc_paths()
    assert len(repo_cited) >= 20, (
        "repo-relative evidence-path extraction collapsed "
        f"({len(repo_cited)} citations found) — extraction regex regressed"
    )
    missing_repo = [tok for tok in repo_cited if not (REPO_ROOT / tok).exists()]
    assert not missing_repo, (
        "docs/video-capability-status.md cites repo-relative evidence paths that "
        f"do not exist on disk: {missing_repo}"
    )

    if not EVIDENCE_WORKSPACE.is_dir():
        try:
            ws_rel = EVIDENCE_WORKSPACE.relative_to(REPO_ROOT)
        except ValueError:
            ws_rel = EVIDENCE_WORKSPACE
        pytest.skip(
            f"evidence workspace {ws_rel} is missing "
            "(untracked production workspace, not CI-reproducible)"
        )

    bases = _status_doc_workspace_base_dirs(CAPABILITY_STATUS.read_text(encoding="utf-8"))
    try:
        ws_rel_prefix = f"{EVIDENCE_WORKSPACE.relative_to(REPO_ROOT)}/"
    except ValueError:
        ws_rel_prefix = f"{EVIDENCE_WORKSPACE}/"
    missing_ws = []
    for tok in ws_cited:
        if tok.startswith(ws_rel_prefix):
            if not (REPO_ROOT / tok).exists():
                missing_ws.append(tok)
            continue
        if (
            not (EVIDENCE_WORKSPACE / tok).exists()
            and not any((EVIDENCE_WORKSPACE / base / tok).exists() for base in bases)
        ):
            missing_ws.append(tok)
    assert not missing_ws, (
        "docs/video-capability-status.md cites workspace evidence paths that do not "
        f"exist in {EVIDENCE_WORKSPACE.relative_to(REPO_ROOT)}: {missing_ws}"
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
    "tools/qc/scene_orchestrator.py",
    "tools/qc/episode_gate.py",
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
    Binding surfaces (pipeline yamls, director files, leader prompt) must
    exist on disk."""
    missing = []
    seen: set[tuple[str, str]] = set()
    surfaces = (
        sorted((REPO_ROOT / "pipeline_defs").glob("*.yaml"))
        + sorted((REPO_ROOT / "skills" / "pipelines").glob("*/*-director.md"))
        + sorted((REPO_ROOT / "skills" / "pipelines").glob("*/executive-producer.md"))
        + [REPO_ROOT / ".claude" / "prompts" / "om_team_leader_prompt.md"]
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
    assert meta["contract_version"] == "2.0", (
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
