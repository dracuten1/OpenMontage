"""R1 perf — concurrency governor default ceiling regression tests.

R1 removes every ``--max-concurrency 1`` pin (primer + dispatch templates) so
the credential-driven default ceiling applies unchanged:

- Anthropic API key Tier 4+ -> ``TIER4_MAX_CONCURRENCY`` (6)
- OAuth subscription / unknown / unprobeable -> ``DEFAULT_MAX_CONCURRENCY`` (4)
- ``OM_MAX_CONCURRENCY`` env still wins as the rollback lever (documented
  rollback value: 2) — never a default pin of 1.

Explicit ``probe`` args bypass the per-process tier cache so these tests stay
deterministic and network-free (see tests/conftest.py socket guard).
"""

from __future__ import annotations

import inspect
import re
from pathlib import Path

import pytest

import tools.qc.concurrency_governor as cg
import tools.qc.scene_orchestrator as scene_orchestrator_module
from tools.qc.concurrency_governor import (
    DEFAULT_MAX_CONCURRENCY,
    TIER4_MAX_CONCURRENCY,
    resolve_max_concurrency,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = REPO_ROOT / "tools" / "qc" / "cc_wrapper_templates"

# Live dispatch surface that must never carry a max-concurrency=1 pin.
_DISPATCH_FILES = [
    TEMPLATE_DIR / "run_cc_pipeline.py.tmpl",
    TEMPLATE_DIR / "writer_wrapper.py.tmpl",
    TEMPLATE_DIR / "reviewer_wrapper.py.tmpl",
    REPO_ROOT / "tools" / "qc" / "scene_orchestrator.py",
    REPO_ROOT / "tools" / "qc" / "writer_runner.py",
    REPO_ROOT / "tools" / "qc" / "reviewer_runner.py",
]

# Any form of pinning the ceiling to 1: CLI flag, kwarg default, env literal.
_PIN_PATTERNS = [
    re.compile(r"--max-concurrency[ =]1(?!\d)"),
    re.compile(r"\bmax_concurrency[ =]1(?!\d)"),
    re.compile(r"OM_MAX_CONCURRENCY[ =]1(?!\d)"),
    re.compile(r"OM_MAX_CONCURRENCY['\",= ]+['\"]?1['\"]"),
]


def test_default_ceiling_constants_unchanged():
    """R1 keeps the credential-driven constants exactly as designed."""
    assert cg.DEFAULT_MAX_CONCURRENCY == 4  # OAuth / unknown / unprobeable
    assert cg.TIER4_MAX_CONCURRENCY == 6    # API key Tier 4+


@pytest.mark.parametrize(
    "probe_tier,expected",
    [
        ("tier4", TIER4_MAX_CONCURRENCY),      # 6
        ("oauth", DEFAULT_MAX_CONCURRENCY),    # 4 — OAuth subscription (claude CLI)
        ("unknown", DEFAULT_MAX_CONCURRENCY),  # 4 — probe failed/unprobeable
        ("api-key", DEFAULT_MAX_CONCURRENCY),  # 4 — API key below Tier 4
    ],
)
def test_default_ceiling_selection_without_env_override(probe_tier, expected):
    """The default path (no OM_MAX_CONCURRENCY) picks the ceiling from the
    credential probe: 6 for Tier 4+, 4 for everything else. No 1 anywhere."""
    value, source = resolve_max_concurrency(env={}, probe=lambda: probe_tier)
    assert value == expected
    assert source == f"probe:{probe_tier}"


def test_env_rollback_still_wins_over_default():
    """OM_MAX_CONCURRENCY stays the explicit rollback lever over any probe."""
    value, source = resolve_max_concurrency(
        env={"OM_MAX_CONCURRENCY": "2"}, probe=lambda: "tier4"
    )
    assert (value, source) == (2, "env:OM_MAX_CONCURRENCY")


def test_orchestrator_default_max_concurrency_is_resolved_not_pinned():
    """R1: orchestrate_episode must keep ``max_concurrency=None`` as its
    signature default so the startup probe decides — never a hardcoded 1."""
    sig = inspect.signature(scene_orchestrator_module.orchestrate_episode)
    assert sig.parameters["max_concurrency"].default is None


@pytest.mark.parametrize("path", _DISPATCH_FILES)
def test_no_max_concurrency_1_pin_in_live_dispatch_surface(path):
    """No live dispatch template/script may pin --max-concurrency 1; the
    governor default ceiling (4 OAuth / 6 Tier-4) must be the only default."""
    assert path.is_file(), f"dispatch surface file missing: {path}"
    content = path.read_text(encoding="utf-8")
    for pattern in _PIN_PATTERNS:
        hit = pattern.search(content)
        assert hit is None, f"{path.name} pins concurrency 1 via {pattern.pattern!r}"
