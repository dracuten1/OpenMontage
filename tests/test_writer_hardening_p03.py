"""Wave1 P0-3 — writer child hardening (wrapper template family).

Pins the writer_wrapper.py.tmpl containment migration:
- invocation shape mirrors the reviewer wrapper: --permission-mode acceptEdits
  + explicit --disallowedTools deny-list (canonical scenes/, packets/,
  infra dot-directories), and the voided --allowedTools allow-list is GONE;
- child env is whitelisted like the reviewer's (credentials never leak);
- the post-hoc file-presence wrapper exit check stays intact in BOTH mains.
"""
from __future__ import annotations

import importlib.util
import inspect
import os
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
WRITER_TMPL = REPO_ROOT / "tools/qc/cc_wrapper_templates/writer_wrapper.py.tmpl"
REVIEWER_TMPL = REPO_ROOT / "tools/qc/cc_wrapper_templates/reviewer_wrapper.py.tmpl"


def render_writer_template() -> str:
    text = WRITER_TMPL.read_text(encoding="utf-8")
    assert "{{PROJECT_SLUG}}" not in text  # writer wrapper carries no slug placeholders
    return text


@pytest.fixture()
def writer_module(tmp_path):
    src = tmp_path / "writer_wrapper.py"
    src.write_text(render_writer_template(), encoding="utf-8")
    spec = importlib.util.spec_from_file_location("writer_wrapper_under_test_p03", src)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


# ------------------------------------------------------------------------------
# Item 1: invocation shape
# ------------------------------------------------------------------------------

def test_writer_cmd_reviewer_shape_accept_edits_plus_deny_list(writer_module):
    cmd = writer_module._writer_cmd()
    assert cmd[0] == "claude"
    assert "--print" in cmd and "--dangerously-skip-permissions" in cmd
    assert cmd[cmd.index("--permission-mode") + 1] == "acceptEdits"
    assert "--max-turns" in cmd
    deny = cmd[cmd.index("--disallowedTools") + 1].split(",")
    # canonical scenes/ denied for every edit-class tool
    for tool in ("Edit", "Write", "MultiEdit"):
        assert f"{tool}(scenes/**)" in deny, deny
    # packets/ denied (the R6 mutation surface)
    for tool in ("Edit", "Write", "MultiEdit"):
        assert f"{tool}(packets/**)" in deny, deny
    # infra dot-directories denied — MultiEdit parity included (security
    # review finding 2, 2026-11-16): all three edit-class tools on both dirs
    assert "Edit(.git/**)" in deny and "Write(.git/**)" in deny
    assert "MultiEdit(.git/**)" in deny
    assert "Edit(.claude/**)" in deny and "Write(.claude/**)" in deny
    assert "MultiEdit(.claude/**)" in deny


def test_writer_cmd_has_no_allowed_tools_flag(writer_module):
    """The allow-list flag is gone FOR GOOD from the invocation list (it was
    voided under --dangerously-skip-permissions; reviewer probe 2026-11-14)."""
    assert "--allowedTools" not in writer_module._writer_cmd()
    assert "--allowedTools" not in writer_module._writer_cmd(legacy_writes_scenes=True)
    # and no quoted code literal remains anywhere in the template
    assert '"--allowedTools"' not in render_writer_template()


def test_writer_deny_list_spares_the_sandbox_target(writer_module):
    """The writer's one sanctioned write target (.tmp_sandboxes/**) must NOT
    be denied — no blanket dot-dir pattern may match it."""
    deny = writer_module._writer_cmd()[writer_module._writer_cmd().index("--disallowedTools") + 1]
    for rule in deny.split(","):
        assert ".tmp_sandboxes" not in rule
        assert not rule.endswith("(.*)"), rule  # no blanket-dot catch-alls


def test_writer_cmd_legacy_variant_drops_scenes_deny_only(writer_module):
    """OM_LEGACY_QUARANTINE=1 kill-switch flow edits the canonical scene file
    directly, so scenes/** deny rules drop; packets + dot-dirs stay denied."""
    cmd = writer_module._writer_cmd(legacy_writes_scenes=True)
    deny = cmd[cmd.index("--disallowedTools") + 1].split(",")
    assert not any("(scenes/**)" in rule for rule in deny)
    assert "Write(packets/**)" in deny and "Edit(packets/**)" in deny
    assert "Write(.git/**)" in deny and "Write(.claude/**)" in deny
    assert "MultiEdit(.git/**)" in deny and "MultiEdit(.claude/**)" in deny
    # shape parity with the sandboxed variant: same acceptEdits contract
    assert cmd[cmd.index("--permission-mode") + 1] == "acceptEdits"


def test_writer_bash_remains_enabled_with_documented_residual_risk(writer_module):
    """Finding 1 disposition (security review 2026-11-16, EVIDENCE branch):
    writer tasks DO require Bash — the per-scene task text (wrapper preamble
    sibling task files minted by mint_director_inputs) instructs
    ``npx tsc --noEmit``. So Bash is NOT denied (denying it would break the
    instructed self-check), and the residual risk — shell writes bypass
    tool-level denies — is documented in the template header with the
    compensating controls named. Path-matching on Bash command strings is
    unreliable and is deliberately NOT pretended."""
    deny = writer_module._writer_cmd()[writer_module._writer_cmd().index("--disallowedTools") + 1].split(",")
    assert not any(rule.startswith("Bash(") for rule in deny), deny
    src = render_writer_template()
    # the evidence reason is on record in the template
    assert "npx tsc --noEmit" in src
    assert "RESIDUAL RISK" in src
    for control in ("pre-flight", "tsc", "reviewer", "episode gate", "symlink-safety"):
        assert control in src, control
    # and no unreliable Bash path-matching deny is faked anywhere
    assert "Bash(scenes" not in src and "Bash(packets" not in src


def test_writer_mains_use_their_own_cmd_variants():
    src = render_writer_template()
    assert "cmd = _writer_cmd(legacy_writes_scenes=True)" in src  # _legacy_main
    assert "cmd = _writer_cmd()" in src  # _sandboxed_main


def test_reviewer_wrapper_uses_real_confinement_and_final_argv_contract():
    """Stripped flags are not enforcement; actual Seatbelt denies writes."""
    src = REVIEWER_TMPL.read_text(encoding="utf-8")
    for needle in ("plan_review_confinement", "smoke_test_confinement",
                   "strip_tool_scoping_flags", "REVIEWER CONFINEMENT FAIL"):
        assert needle in src
    assert "os.environ.copy()" not in src
    assert "_ENV_ALLOW_OM_KEYS" in src
    assert "ANTHROPIC_API_KEY" not in src


def test_reviewer_confinement_enforces_actual_write_denial(tmp_path):
    """Run real processes; writes confined to stage, canonical write denied."""
    import subprocess
    from tools.qc.reviewer_confinement import confinement_kind, plan_review_confinement, smoke_test
    kind, _ = confinement_kind()
    if kind != "seatbelt":
        pytest.skip("host lacks implemented Seatbelt capability")
    plan = plan_review_confinement(real_home=tmp_path / "home")
    try:
        ok, detail = smoke_test(plan)
        assert ok, detail
        denied_target = tmp_path / "canonical.tsx"
        r = subprocess.run([*plan.argv_prefix, "/bin/sh", "-c",
                            f"echo forbidden > '{denied_target}'"],
                           capture_output=True, text=True, timeout=30)
        assert r.returncode != 0 and not denied_target.exists()
        allowed = plan.workspace / "packets" / "findings.json"
        r = subprocess.run([*plan.argv_prefix, "/bin/sh", "-c",
                            f"mkdir -p '{allowed.parent}' && echo ok > '{allowed}'"],
                           capture_output=True, text=True, timeout=30)
        assert r.returncode == 0, r.stderr
        assert allowed.read_text().strip() == "ok"
    finally:
        plan.cleanup()
# ------------------------------------------------------------------------------
# Item 2: child env whitelist
# ------------------------------------------------------------------------------

def test_writer_template_has_no_full_env_copy():
    """Mirror of the reviewer wrapper's env contract: no full-env copy is
    left anywhere in the writer template."""
    assert "os.environ.copy()" not in render_writer_template()
    src = render_writer_template()
    for key in ("PATH", "HOME", "OM_SCENE_ID", "OM_TSC_TIMEOUT", "OM_WRAPPER_TEMPLATE_STRICT"):
        assert key in src
    assert "_WRITER_ENV_ALLOW_OM_KEYS" in src
    assert "_WRITER_ENV_ALLOW_PREFIXES" not in src
    assert "_WRITER_ENV_ALLOW_PROVIDER_KEYS" not in src


def test_writer_child_env_whitelist(writer_module, monkeypatch):
    seeded = {
        "PATH": "/usr/bin:/bin", "HOME": "/home/op", "USER": "op",
        "SHELL": "/bin/zsh", "TMPDIR": "/tmp",
        "OM_SCENE_ID": "scene-1", "OM_EPISODE_DIR": "/ep", "OM_ATTEMPT_INDEX": "2",
        "OM_CC_WATCHDOG": "420", "OM_TSC_TIMEOUT": "30", "OM_FINDINGS_INJECT": "1",
        "OM_LEGACY_QUARANTINE": "0", "OM_MAX_CONCURRENCY": "4",
        "OM_WRAPPER_TEMPLATE_STRICT": "1",
        "OM_TOKEN": "secret-token", "OM_INSTANCE_ID": "secret-instance",
        "OM_UNDOCUMENTED": "secret-future-key",
        "ANTHROPIC_API_KEY": "sk-ant-secret", "OPENAI_API_KEY": "sk-oai-secret",
        "GEMINI_API_KEY": "gemini-secret",
        "AWS_SECRET_ACCESS_KEY": "leak-me-not", "GITHUB_TOKEN": "ghp_leak_me_not",
        "DATABASE_URL": "postgres://user:pass@host/db", "SLACK_BOT_TOKEN": "xoxb-leak-me-not",
        "MY_RANDOM_TOOL_SECRET": "nope", "MAX_THINKING_TOKENS": "999999",
    }
    monkeypatch.setattr(writer_module.os, "environ", seeded)
    env = writer_module._writer_child_env()
    assert env["PATH"] == "/usr/bin:/bin"
    assert env["OM_SCENE_ID"] == "scene-1" and env["OM_EPISODE_DIR"] == "/ep"
    assert env["OM_TSC_TIMEOUT"] == "30" and env["OM_MAX_CONCURRENCY"] == "4"
    assert env["MAX_THINKING_TOKENS"] == "1024"
    for secret in ("OM_TOKEN", "OM_INSTANCE_ID", "OM_UNDOCUMENTED",
                   "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY",
                   "AWS_SECRET_ACCESS_KEY", "GITHUB_TOKEN", "DATABASE_URL",
                   "SLACK_BOT_TOKEN", "MY_RANDOM_TOOL_SECRET"):
        assert secret not in env, secret


def test_writer_child_env_matches_reviewer_allow_shape(writer_module):
    """Both wrappers use safe essentials + explicit, noncredential OM keys."""
    reviewer_src = REVIEWER_TMPL.read_text(encoding="utf-8")
    assert writer_module._WRITER_ENV_ALLOW_KEYS == ("PATH", "HOME", "USER", "SHELL", "TMPDIR")
    assert len(writer_module._WRITER_ENV_ALLOW_OM_KEYS) == 9
    assert "OM_TOKEN" not in writer_module._WRITER_ENV_ALLOW_OM_KEYS
    assert "OM_INSTANCE_ID" not in writer_module._WRITER_ENV_ALLOW_OM_KEYS
    assert '"OM_TOKEN"' not in reviewer_src and '"OM_INSTANCE_ID"' not in reviewer_src
    assert "_ENV_ALLOW_OM_KEYS" in reviewer_src
    assert "ANTHROPIC_API_KEY" not in reviewer_src

# ------------------------------------------------------------------------------
# Item 3: file-presence exit check stays intact
# ------------------------------------------------------------------------------

def test_writer_file_presence_exit_checks_intact():
    """Both mains must keep the post-hoc actual-output gate (the wrapper's
    exit code is driven by the file the writer REALLY wrote, not the child's
    exit status)."""
    src = render_writer_template()
    # sandboxed main: sandbox output must exist and be non-trivial
    assert "sandbox_file.is_file() and sandbox_file.stat().st_size > 200" in src
    assert 'file=MISSING (sandbox)' in src
    # legacy main: canonical file must exist and be non-trivial
    assert "scene_file.is_file() and scene_file.stat().st_size > 200" in src
    # promotion parity: > 200, never >= (test_perf_r1_r5 pins the same)
    assert "canonical_target.is_file() and canonical_target.stat().st_size > 200" in src
    assert "st_size >= 200" not in src
    assert "file={'OK' if ok else 'MISSING'} (promoted)" in src


def test_writer_cmd_is_used_by_spawn_paths(writer_module):
    """The constructed command is the one the backoff executor receives in
    the sandboxed main (no parallel un-contained invocation)."""
    import inspect
    src = inspect.getsource(writer_module._sandboxed_main)
    assert "execute_writer_with_backoff(\n        cmd, episode, env, task, governor," in src
    assert "_writer_cmd()" in src


# ------------------------------------------------------------------------------
# Finding 6 (security review 2026-11-16): tsc self-check env whitelist
# ------------------------------------------------------------------------------

def test_tsc_self_check_runs_with_whitelisted_child_env(writer_module):
    """The ``npx tsc --noEmit`` self-check subprocess must NOT inherit the
    full parent env (node_modules binaries/scripts would see every parent
    credential). It receives the same whitelisted construction as the claude
    child (_writer_child_env) — no new env surface invented."""
    import inspect
    src = inspect.getsource(writer_module._tsc_own_scene_fail)
    assert "env=_writer_child_env()" in src
    # Actual child environment has no provenance IDs or API credentials.
    from unittest.mock import patch
    seeded = {"PATH":"/bin", "OM_SCENE_ID":"scene-1", "OM_TOKEN":"secret",
              "OM_INSTANCE_ID":"instance-secret", "ANTHROPIC_API_KEY":"api-secret",
              "GITHUB_TOKEN":"gh-secret", "OM_EPISODE_DIR":"/episode"}
    with patch.dict(writer_module.os.environ, seeded, clear=True):
        child_env = writer_module._writer_child_env()
        assert child_env["OM_SCENE_ID"] == "scene-1"
        for secret in ("OM_TOKEN", "OM_INSTANCE_ID", "ANTHROPIC_API_KEY", "GITHUB_TOKEN"):
            assert secret not in child_env
    assert 'subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(composer),\n                             env=_writer_child_env(),' in src
    seeded = {"PATH":"/bin", "OM_SCENE_ID":"scene-1", "OM_TOKEN":"secret",
              "OM_INSTANCE_ID":"instance-secret", "ANTHROPIC_API_KEY":"api-secret"}
    from unittest.mock import patch
    with patch.dict(writer_module.os.environ, seeded, clear=True):
        env = writer_module._writer_child_env()
        assert "OM_TOKEN" not in env and "OM_INSTANCE_ID" not in env
        assert "ANTHROPIC_API_KEY" not in env
