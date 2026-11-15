"""Defect 1 (tsc-gate S8 rescue, 2026-11-15) — writer wrapper tsc self-check.

Anomaly run tin-nong-5tin-20261115: the writer wrapper's ``npx tsc --noEmit``
self-check TIMED OUT and the TimeoutExpired was treated NON-FATAL (print +
pass), so the writer claimed "TS sạch" and promoted broken code — scene
gates are the only writer-side check before render. These tests pin:

1. tsc timeout -> attempt FAILS (no promotion), classified ``tsc_timeout``.
2. Budget override via ``OM_TSC_TIMEOUT`` honored; default = the wrapper's
   existing watchdog budget (``OM_CC_WATCHDOG`` / default 420); zero /
   negative / float-string values fall back to that default (clamped), and
   a readable ``OM_AGENT_TIMEOUT`` caps the budget at OM_AGENT_TIMEOUT - 60
   (self-check stays strictly inside the outer writer-session budget).
3. Scene-8-style signature error (``spring(currentTime, config)`` 2-positional
   form -> TS2554) is a FATAL content failure — and is NOT swallowed by the
   Failure-fixes-3 partial-generation baseline deferral (only TS2307-baseline
   errors defer).
"""
from __future__ import annotations

import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
TMPL_PATH = REPO_ROOT / "tools/qc/cc_wrapper_templates/writer_wrapper.py.tmpl"

# Existing conventions: reuse the fix-suite's mint + e2e helpers instead of
# re-deriving them (same import pattern as make_test_episode / build_project_layout).
from tests.test_failure_fixes import (  # noqa: E402
    STUB_CLAUDE,
    _mint_and_run_writer,
    _mint_writer_module,
)
from tests.test_video_slowfix_phase4 import build_project_layout  # noqa: E402

# Mirrors the promoted scenes/S08.tsx defect: spring() called with 2
# positional args (lines 22 and 50 of the promoted file) — tsc raises TS2554.
S08_SPRING_TS2554_LINES = [
    "scenes/S01.tsx(22,5): error TS2554: Expected 3 arguments, but got 2.",
    "scenes/S01.tsx(50,9): error TS2554: Expected 3 arguments, but got 2.",
]


def _tsc_episode(tmp_path, scene_ids=("scene-1", "scene-2")):
    """Episode + project layout anchored for the composer-wide tsc discovery
    (tsconfig.json + package.json at the episode's composer root)."""
    ep, project = build_project_layout(tmp_path, scene_ids=list(scene_ids))
    (ep / "tsconfig.json").write_text("{}", encoding="utf-8")
    (ep / "package.json").write_text("{}", encoding="utf-8")
    return ep, project


class _FakeTscResult:
    def __init__(self, returncode: int, stdout: str, stderr: str = ""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


# ==============================================================================
# Requirement 2: explicit budget — OM_TSC_TIMEOUT override, watchdog default
# ==============================================================================

def test_tsc_budget_env_override_and_watchdog_default(tmp_path, monkeypatch):
    """OM_TSC_TIMEOUT (seconds) is honored; unset/non-integer -> the existing
    watchdog budget (WATCHDOG_S, default 420) — never unbounded."""
    ep, project = _tsc_episode(tmp_path)
    mod = _mint_writer_module(tmp_path, project)

    monkeypatch.delenv("OM_TSC_TIMEOUT", raising=False)
    monkeypatch.delenv("OM_AGENT_TIMEOUT", raising=False)  # exact-value test
    assert mod._tsc_timeout_seconds() == 420
    assert mod._tsc_timeout_seconds() == mod.WATCHDOG_S  # same source as the watchdog

    monkeypatch.setenv("OM_TSC_TIMEOUT", "7")
    assert mod._tsc_timeout_seconds() == 7

    # A typo'd value must fall back to the bounded default, not widen it.
    monkeypatch.setenv("OM_TSC_TIMEOUT", "not-a-number")
    assert mod._tsc_timeout_seconds() == 420


def test_tsc_budget_zero_negative_and_float_fall_back(tmp_path, monkeypatch):
    """Clamp (Defect-1 polish review): OM_TSC_TIMEOUT = 0 or negative would
    otherwise pass int() and produce an IMMEDIATE TimeoutExpired false-fail
    on every attempt; float strings are non-integer. All fall back to the
    watchdog default (420)."""
    ep, project = _tsc_episode(tmp_path)
    mod = _mint_writer_module(tmp_path, project)

    for bad in ("0", "-1", "-420", "12.5"):
        monkeypatch.setenv("OM_TSC_TIMEOUT", bad)
        assert mod._tsc_timeout_seconds() == 420, f"OM_TSC_TIMEOUT={bad!r}"
        assert mod._tsc_timeout_seconds() == mod.WATCHDOG_S


def test_tsc_budget_capped_at_outer_agent_timeout_minus_60(tmp_path, monkeypatch):
    """Budget-vs-outer-watchdog constraint: OM_TSC_TIMEOUT must stay strictly
    inside the outer writer-session budget (OM_AGENT_TIMEOUT, default 900 in
    run_cc_pipeline.py.tmpl). When that env is readable here the budget is
    capped at OM_AGENT_TIMEOUT - 60; huge values under the cap are honored
    as-is, and with NO readable outer budget a huge value stands as
    configured (still bounded by the outer watchdog kill)."""
    ep, project = _tsc_episode(tmp_path)
    mod = _mint_writer_module(tmp_path, project)

    monkeypatch.setenv("OM_AGENT_TIMEOUT", "900")
    monkeypatch.setenv("OM_TSC_TIMEOUT", "2000")
    assert mod._tsc_timeout_seconds() == 840  # cap = 900 - 60 headroom

    monkeypatch.setenv("OM_TSC_TIMEOUT", "800")
    assert mod._tsc_timeout_seconds() == 800  # under the cap: honored as-is

    monkeypatch.delenv("OM_AGENT_TIMEOUT", raising=False)
    monkeypatch.setenv("OM_TSC_TIMEOUT", "2000")
    assert mod._tsc_timeout_seconds() == 2000  # outer env absent: honored

    monkeypatch.setenv("OM_AGENT_TIMEOUT", "not-a-number")
    assert mod._tsc_timeout_seconds() == 2000  # unreadable outer: honored


def test_template_carries_tsc_timeout_contract():
    """Template text pins the contract: explicit env name present, and the
    old NON-FATAL TimeoutExpired wording is gone (regression against
    re-introducing the silent pass). Also pins the outer-agent-budget cap
    machinery."""
    tmpl = TMPL_PATH.read_text(encoding="utf-8")
    assert 'TSC_TIMEOUT_ENV = "OM_TSC_TIMEOUT"' in tmpl
    assert '_AGENT_TIMEOUT_ENV = "OM_AGENT_TIMEOUT"' in tmpl
    assert "def _agent_budget_cap()" in tmpl
    assert "tsc_timeout" in tmpl
    assert "timed out (non-fatal)" not in tmpl
    assert "timeout=budget" in tmpl


# ==============================================================================
# Requirement 1: timeout is FATAL, classified tsc_timeout
# ==============================================================================

def test_tsc_timeout_is_fatal_and_classified_tsc_timeout(tmp_path, monkeypatch, capsys):
    """A TimeoutExpired from the self-check FAILS the check (was: print +
    non-fatal pass). The returned output carries the tsc_timeout marker."""
    ep, project = _tsc_episode(tmp_path)
    mod = _mint_writer_module(tmp_path, project)

    monkeypatch.delenv("OM_AGENT_TIMEOUT", raising=False)  # exact-value test

    seen: dict = {}

    def fake_tsc(*args, **kwargs):
        seen["cmd"] = args[0]
        seen["timeout"] = kwargs.get("timeout")
        raise subprocess.TimeoutExpired(cmd=args[0], timeout=kwargs.get("timeout"))

    monkeypatch.setattr(mod.subprocess, "run", fake_tsc)
    failed, out = mod._tsc_own_scene_fail(ep, "scene-1")

    assert failed is True  # fatal: the attempt must fail
    assert "tsc_timeout" in out
    assert seen["cmd"] == ["npx", "tsc", "--noEmit"]
    assert seen["timeout"] == 420  # default budget = existing watchdog value
    captured = capsys.readouterr().out
    assert "TSC TIMEOUT" in captured
    assert "tsc_timeout" in captured
    assert "non-fatal" not in captured


def test_om_tsc_timeout_override_reaches_subprocess(tmp_path, monkeypatch):
    """The env override reaches the actual subprocess.run timeout kwarg."""
    ep, project = _tsc_episode(tmp_path)
    mod = _mint_writer_module(tmp_path, project)
    monkeypatch.setenv("OM_TSC_TIMEOUT", "3")
    monkeypatch.delenv("OM_AGENT_TIMEOUT", raising=False)  # exact-value test

    seen: dict = {}

    def fake_tsc(*args, **kwargs):
        seen["timeout"] = kwargs.get("timeout")
        raise subprocess.TimeoutExpired(cmd=args[0], timeout=kwargs.get("timeout"))

    monkeypatch.setattr(mod.subprocess, "run", fake_tsc)
    failed, out = mod._tsc_own_scene_fail(ep, "scene-1")

    assert failed is True
    assert seen["timeout"] == 3
    assert "3s budget" in out


def test_writer_e2e_tsc_timeout_fails_attempt_and_never_promotes(
    tmp_path, monkeypatch
):
    """e2e: with a stub ``npx`` that hangs, the wrapper's tsc self-check times
    out (OM_TSC_TIMEOUT=1) -> wrapper exits 1 and the canonical scene file is
    NOT promoted (no false 'TS clean' claim can reach the render stage)."""
    ep, project = _tsc_episode(tmp_path, scene_ids=["scene-1"])
    # Fresh episode: remove the placeholder scene files (same convention as
    # test_writer_wrapper_promotes_fresh_scene_to_s_nn) so the only way
    # scenes/S01.tsx can exist afterward is an (unwanted) promotion.
    for f in (ep / "scenes").glob("*.tsx"):
        f.unlink()

    # Stub npx: hangs forever past the 1s budget. NOTE: real npx is never hit.
    bindir = tmp_path / "stubbin_tsc_timeout"
    bindir.mkdir()
    npx_stub = bindir / "npx"
    npx_stub.write_text("#!/usr/bin/env python3\nimport time\ntime.sleep(30)\n", encoding="utf-8")
    npx_stub.chmod(0o755)
    claude_stub = bindir / "claude"
    claude_stub.write_text(STUB_CLAUDE, encoding="utf-8")
    claude_stub.chmod(0o755)

    monkeypatch.setenv("OM_TSC_TIMEOUT", "1")
    # _mint_and_run_writer prepends stub_bin to PATH for the wrapper process.
    proc = _mint_and_run_writer(tmp_path, ep, project, monkeypatch, bindir)

    assert proc.returncode == 1, proc.stdout + proc.stderr
    assert "tsc_timeout" in proc.stdout
    assert "TSC TIMEOUT" in proc.stdout
    scenes = ep / "scenes"
    assert not (scenes / "S01.tsx").exists()  # NOT promoted
    assert not (scenes / "scene-1.tsx").exists()
    assert not (scenes / ".tmp_scene-1.tsx").exists()


# ==============================================================================
# Requirement 3 (+ Scene-8 regression): genuine tsc failure stays fatal
# ==============================================================================

def test_scene8_spring_ts2554_is_fatal_content_failure(tmp_path, monkeypatch, capsys):
    """Scene-8-style signature error: spring(currentTime, config) — 2
    positional args — raises TS2554 on own-scene lines and MUST fail the
    check as a real content failure."""
    ep, project = _tsc_episode(tmp_path)
    mod = _mint_writer_module(tmp_path, project)

    def fake_tsc_strict(*args, **kwargs):
        return _FakeTscResult(
            returncode=1,
            stdout="\n".join(S08_SPRING_TS2554_LINES) + "\nFound 2 errors.\n",
        )

    # Complete generation: strict gate — TS2554 fatal.
    monkeypatch.setattr(mod.subprocess, "run", fake_tsc_strict)
    failed, out = mod._tsc_own_scene_fail(ep, "scene-1")
    assert failed is True
    assert "TS2554" in out
    assert "Expected 3 arguments, but got 2" in out
    assert "TSC BASELINE WARN" not in capsys.readouterr().out


def test_scene8_spring_ts2554_not_deferred_while_partial(tmp_path, monkeypatch):
    """Sharper regression: even while sibling scenes are still missing (the
    Failure-fixes-3 partial-generation window), a TS2554 signature error is a
    REAL own-scene defect — only TS2307-missing-module baseline errors defer.
    The S08 defect must never ride the deferral into promotion."""
    ep, project = _tsc_episode(tmp_path)
    mod = _mint_writer_module(tmp_path, project)

    # scene-2/S02.tsx missing -> partial generation window active
    scenes = ep / "scenes"
    (scenes / "S02.tsx").unlink(missing_ok=True)
    (scenes / "S01.tsx").write_text("// scene 1\n", encoding="utf-8")

    def fake_tsc_partial(*args, **kwargs):
        return _FakeTscResult(
            returncode=1,
            stdout="\n".join(S08_SPRING_TS2554_LINES) + "\nFound 2 errors.\n",
        )

    monkeypatch.setattr(mod.subprocess, "run", fake_tsc_partial)
    failed, out = mod._tsc_own_scene_fail(ep, "scene-1")
    assert failed is True
    assert "TS2554" in out


def test_genuine_tsc_failure_without_timeout_stays_fatal(tmp_path, monkeypatch):
    """Requirement 3: a non-zero tsc exit (no timeout) with own-scene errors
    remains fatal — unchanged from the pre-fix behavior."""
    ep, project = _tsc_episode(tmp_path)
    mod = _mint_writer_module(tmp_path, project)

    def fake_tsc_fail(*args, **kwargs):
        return _FakeTscResult(
            returncode=1,
            stdout="scenes/S01.tsx(10,5): error TS2322: Type 'string' is not "
                   "assignable to type 'number'.\nFound 1 error.\n",
        )

    monkeypatch.setattr(mod.subprocess, "run", fake_tsc_fail)
    failed, out = mod._tsc_own_scene_fail(ep, "scene-1")
    assert failed is True
    assert "TS2322" in out


# ==============================================================================
# Requirement (Defect-1 polish review 3a): legacy quarantine path — timeout fatal
# ==============================================================================

def test_legacy_quarantine_path_tsc_timeout_is_fatal(tmp_path, monkeypatch):
    """The OM_LEGACY_QUARANTINE=1 escape hatch (_legacy_main, pre-phase1
    scoped-CLI contract: claude writes scenes/S{NN}.tsx itself, no sandbox)
    shares the SAME _tsc_own_scene_fail gate: a hung ``npx tsc`` self-check
    FAILS the attempt with the tsc_timeout marker — never the old non-fatal
    pass, in either flow."""
    ep, project = _tsc_episode(tmp_path, scene_ids=["scene-1"])

    bindir = tmp_path / "stubbin_legacy_timeout"
    bindir.mkdir()
    claude_stub = bindir / "claude"
    claude_stub.write_text(
        "#!/usr/bin/env python3\n"
        "import os, sys\n"
        "from pathlib import Path\n"
        "ep = Path(os.environ['OM_EPISODE_DIR'])\n"
        "sid = os.environ['OM_SCENE_ID']\n"
        "nn = '%02d' % int(sid.split('-')[-1])\n"
        "src = 'export default () => <div>legacy scene</div>;\\n'\n"
        "src += 'padding ' + 'x' * 200 + '\\n'\n"
        "(ep / 'scenes' / ('S' + nn + '.tsx')).write_text(src, encoding='utf-8')\n"
        "sys.exit(0)\n",
        encoding="utf-8",
    )
    claude_stub.chmod(0o755)
    npx_stub = bindir / "npx"
    npx_stub.write_text("#!/usr/bin/env python3\nimport time\ntime.sleep(30)\n", encoding="utf-8")
    npx_stub.chmod(0o755)

    monkeypatch.setenv("OM_LEGACY_QUARANTINE", "1")
    monkeypatch.setenv("OM_TSC_TIMEOUT", "1")
    proc = _mint_and_run_writer(tmp_path, ep, project, monkeypatch, bindir)

    assert proc.returncode == 1, proc.stdout + proc.stderr
    assert "TSC TIMEOUT" in proc.stdout  # marker from _tsc_own_scene_fail
    assert "tsc_timeout" in proc.stdout
    assert "TSC FAIL (own scene)" in proc.stdout  # legacy branch routed through the fatal gate
    assert not (ep / "scenes" / ".tmp_scene-1.tsx").exists()  # legacy path: nothing staged
