"""Wave1 P0-3 item 8 residual — orchestrator child env whitelist.

Pins the SubprocessAgentRunner launch path (scene_orchestrator.py):
- run_writer / run_reviewer hand the child a whitelisted env, NOT a full
  ``os.environ.copy()`` (credentials must not leak to agent children);
- ambient allowlists mirror the cc_wrapper_templates lists (superset
  containment so minted wrappers keep working);
- PATH survives, missing ambient keys are skipped (no KeyError), the
  runner's deliberate injections and the caller's extra_env still land.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

import pytest

from tools.qc import scene_orchestrator as so
from tools.qc.scene_orchestrator import ReviewerContext, SubprocessAgentRunner, WriterContext

REPO_ROOT = Path(__file__).resolve().parents[1]
WRITER_TMPL = REPO_ROOT / "tools/qc/cc_wrapper_templates/writer_wrapper.py.tmpl"
REVIEWER_TMPL = REPO_ROOT / "tools/qc/cc_wrapper_templates/reviewer_wrapper.py.tmpl"

SENTINELS = ("OM_TEST_SECRET_DO_NOT_SET", "GENERIC_SECRET")


# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------

def _template_env_tuples(path: Path) -> tuple[set[str], set[str]]:
    """Extract the (system, OM) allowlist tuples from a wrapper template.

    Read-only regex parse — the templates are reference artifacts and are
    never executed or edited here.
    """
    text = path.read_text(encoding="utf-8")
    sys_m = re.search(r"_ENV_ALLOW_KEYS\s*=\s*\(([^)]*)\)", text)
    om_m = re.search(r"_ENV_ALLOW_OM_KEYS\s*=\s*\(([^)]*)\)", text)
    assert sys_m and om_m, f"allowlists not found in {path}"
    keys = lambda blob: set(re.findall(r'"([A-Z_][A-Z0-9_]*)"', blob))
    return keys(sys_m.group(1)), keys(om_m.group(1))


def _capture_run(monkeypatch):
    """Patch subprocess.run inside the orchestrator module; return capture list."""
    captured: list[dict] = []

    def fake_run(cmd, cwd=None, env=None, **kwargs):
        captured.append({"cmd": cmd, "cwd": cwd, "env": env})
        return subprocess.CompletedProcess(cmd, returncode=0, stdout="ok", stderr="")

    monkeypatch.setattr(so.subprocess, "run", fake_run)
    return captured


def _make_writer_ctx(tmp_path, extra_env=None) -> WriterContext:
    return WriterContext(
        scene_id="cut-1",
        instance_id="inst-w",
        token="tok-w",
        episode_dir=tmp_path / "episode",
        allowed_io=[str(tmp_path / "episode" / "scene")],
        frozen_inputs={},
        extra_env=extra_env or {},
    )


def _make_reviewer_ctx(tmp_path, extra_env=None) -> ReviewerContext:
    return ReviewerContext(
        scene_id="cut-1",
        instance_id="inst-r",
        token="tok-r",
        sandbox_dir=tmp_path / "sandbox",
        canonical_dir=tmp_path / "canonical",
        writer_instance_id="inst-w",
        writer_token="tok-w",
        output_hashes={},
        frozen_inputs={},
        extra_env=extra_env or {},
    )


@pytest.fixture(autouse=True)
def seeded_ambient_env(monkeypatch):
    """Ambient env carrying credentials + allowed OM keys (the leak scenario)."""
    monkeypatch.setenv("OM_TEST_SECRET_DO_NOT_SET", "sk-leak-1")
    monkeypatch.setenv("GENERIC_SECRET", "leak-2")
    monkeypatch.setenv("OM_TSC_TIMEOUT", "120")
    monkeypatch.setenv("OM_CC_MAX_TURNS", "45")
    monkeypatch.setenv("OM_AGENT_TIMEOUT", "600")
    monkeypatch.setenv("OM_CC_REVIEW_MAX_TURNS", "12")
    monkeypatch.setenv("SOME_RANDOM_AMBIENT_VAR", "noise")
    return monkeypatch


# ------------------------------------------------------------------------------
# Writer child
# ------------------------------------------------------------------------------

def test_writer_child_env_whitelisted(monkeypatch, tmp_path):
    captured = _capture_run(monkeypatch)
    runner = SubprocessAgentRunner()
    result = runner.run_writer(_make_writer_ctx(tmp_path))

    assert result.exit_code == 0
    env = captured[0]["env"]
    assert env is not None

    # PATH survives
    assert "PATH" in env

    # No credentials leaked from ambient env
    for sentinel in SENTINELS:
        assert sentinel not in env, sentinel
    assert "SOME_RANDOM_AMBIENT_VAR" not in env

    # Every key is inside the allowlist superset (ambient allowlists + the
    # runner's deliberate injections)
    injected = {"OM_ROLE", "OM_SCENE_ID", "OM_INSTANCE_ID", "OM_TOKEN", "OM_EPISODE_DIR"}
    allowed = set(so._ORCH_CHILD_ENV_ALLOW_KEYS) | set(so._ORCH_WRITER_ENV_ALLOW_OM_KEYS) | injected
    stray = set(env) - allowed
    assert not stray, f"keys outside allowlist: {sorted(stray)}"

    # Allowed ambient OM key survives; deliberate runner injections present
    assert env.get("OM_TSC_TIMEOUT") == "120"
    # Wrapper-child env-only knobs (writer_wrapper.py.tmpl:106 MAX_TURNS,
    # :126/:131 _agent_budget_cap) pass through the whitelist
    assert env.get("OM_CC_MAX_TURNS") == "45"
    assert env.get("OM_AGENT_TIMEOUT") == "600"
    assert env["OM_ROLE"] == "writer"
    assert env["OM_SCENE_ID"] == "cut-1"


def test_writer_allowlist_superset_of_template():
    sys_keys, om_keys = _template_env_tuples(WRITER_TMPL)
    assert set(so._ORCH_CHILD_ENV_ALLOW_KEYS) >= sys_keys
    assert set(so._ORCH_WRITER_ENV_ALLOW_OM_KEYS) >= om_keys


# ------------------------------------------------------------------------------
# Reviewer-side child
# ------------------------------------------------------------------------------

def test_reviewer_child_env_whitelisted(monkeypatch, tmp_path):
    captured = _capture_run(monkeypatch)
    runner = SubprocessAgentRunner()
    result = runner.run_reviewer(_make_reviewer_ctx(tmp_path))

    assert result.exit_code == 0
    env = captured[0]["env"]
    assert env is not None

    assert "PATH" in env

    for sentinel in SENTINELS:
        assert sentinel not in env, sentinel
    assert "SOME_RANDOM_AMBIENT_VAR" not in env

    injected = {
        "OM_ROLE", "OM_SCENE_ID", "OM_INSTANCE_ID", "OM_TOKEN",
        "OM_SANDBOX_DIR", "OM_CANONICAL_DIR",
    }
    allowed = set(so._ORCH_CHILD_ENV_ALLOW_KEYS) | set(so._ORCH_REVIEWER_ENV_ALLOW_OM_KEYS) | injected
    stray = set(env) - allowed
    assert not stray, f"keys outside allowlist: {sorted(stray)}"

    assert env.get("OM_CC_REVIEW_MAX_TURNS") == "12"
    assert env["OM_ROLE"] == "reviewer"
    assert env["OM_SANDBOX_DIR"] == str(tmp_path / "sandbox")


def test_reviewer_allowlist_superset_of_template():
    sys_keys, om_keys = _template_env_tuples(REVIEWER_TMPL)
    assert set(so._ORCH_CHILD_ENV_ALLOW_KEYS) >= sys_keys
    assert set(so._ORCH_REVIEWER_ENV_ALLOW_OM_KEYS) >= om_keys


# ------------------------------------------------------------------------------
# Tolerance + deliberate augmentation
# ------------------------------------------------------------------------------

def test_missing_ambient_keys_skipped_no_keyerror(monkeypatch, tmp_path):
    # Remove EVERY ambient key the allowlist could look up.
    for key in (*so._ORCH_CHILD_ENV_ALLOW_KEYS,
                *so._ORCH_WRITER_ENV_ALLOW_OM_KEYS,
                *so._ORCH_REVIEWER_ENV_ALLOW_OM_KEYS):
        monkeypatch.delenv(key, raising=False)

    captured = _capture_run(monkeypatch)
    runner = SubprocessAgentRunner()

    wres = runner.run_writer(_make_writer_ctx(tmp_path))
    rres = runner.run_reviewer(_make_reviewer_ctx(tmp_path))
    assert wres.exit_code == 0 and rres.exit_code == 0

    wenv, renv = captured[0]["env"], captured[1]["env"]
    # Only deliberate injections (+ extra_env) remain — no KeyError raised.
    assert set(wenv) == {
        "OM_ROLE", "OM_SCENE_ID", "OM_INSTANCE_ID", "OM_TOKEN", "OM_EPISODE_DIR",
    }
    assert set(renv) == {
        "OM_ROLE", "OM_SCENE_ID", "OM_INSTANCE_ID", "OM_TOKEN",
        "OM_SANDBOX_DIR", "OM_CANONICAL_DIR",
    }


def test_extra_env_deliberate_augmentation_preserved(monkeypatch, tmp_path):
    captured = _capture_run(monkeypatch)
    runner = SubprocessAgentRunner()

    runner.run_writer(_make_writer_ctx(tmp_path, extra_env={"OM_CUSTOM_FLAG": "w"}))
    runner.run_reviewer(_make_reviewer_ctx(tmp_path, extra_env={"OM_CUSTOM_FLAG": "r"}))

    assert captured[0]["env"]["OM_CUSTOM_FLAG"] == "w"
    assert captured[1]["env"]["OM_CUSTOM_FLAG"] == "r"
    # Deliberate augmentation does not reopen the ambient leak door.
    for sentinel in SENTINELS:
        assert sentinel not in captured[0]["env"]
        assert sentinel not in captured[1]["env"]
