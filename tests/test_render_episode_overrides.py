"""Wave1 P0-2 item 6 — render_episode override discipline.

NON_OVERRIDABLE provenance codes are a frozenset; overrides must be on the
runbook allowlist; every accepted override logs its issuer.
"""
from __future__ import annotations

from pathlib import Path

import pytest

import tools.qc.render_episode as render_episode


# ==============================================================================
# Item 6 — render_episode override discipline
# ==============================================================================

def test_classify_overrides_non_overridable_frozenset():
    assert isinstance(render_episode.NON_OVERRIDABLE_CODES, frozenset)
    assert isinstance(render_episode.RUNBOOK_OVERRIDABLE_CODES, frozenset)
    # provenance codes are never overridable, even if someone allowlists them
    for code in ("scene_provenance_stale", "writer_token_invalid", "provenance_missing"):
        assert code in render_episode.NON_OVERRIDABLE_CODES
    allowed, non_ovr, unlisted = render_episode.classify_overrides(
        {"composition_dims_mismatch", "scene_provenance_stale", "made_up_code"})
    assert allowed == {"composition_dims_mismatch"}
    assert non_ovr == ["scene_provenance_stale"]
    assert unlisted == ["made_up_code"]


def test_resolve_override_issuer_flag_and_env():
    assert render_episode.resolve_override_issuer("alice") == "alice"
    assert render_episode.resolve_override_issuer("", {"OM_RENDER_OVERRIDE_ISSUED_BY": "bob"}) == "bob"
    assert render_episode.resolve_override_issuer("  ", {"OM_RENDER_OVERRIDE_ISSUED_BY": "bob"}) == "bob"
    assert render_episode.resolve_override_issuer("", {}) == ""


@pytest.fixture()
def render_env(tmp_path, monkeypatch):
    """Minimal render_episode main() env: episode dir under a fake COMPOSER,
    gate + subprocess mocked, so only the override discipline is exercised.
    ``gate_reasons`` lets a test plant gate findings (e.g. an overridable
    code) without touching the real gate."""
    src = tmp_path / "src"
    ep = src / "my-slug"
    ep.mkdir(parents=True)
    monkeypatch.setattr(render_episode, "COMPOSER", tmp_path)
    gate_reasons: list[dict] = []
    monkeypatch.setattr("tools.qc.episode_gate.validate_episode", lambda root: list(gate_reasons))
    rendered = []

    def fake_run(cmd, **kw):
        # remotion writes the output file; emulate that so the post-render
        # stat/marker path works
        Path(cmd[4]).write_bytes(b"fake-mp4-bytes")
        rendered.append(cmd)
        return type("P", (), {"returncode": 0})()

    monkeypatch.setattr(render_episode.subprocess, "run", fake_run)
    # skip smoke + ffprobe post-steps
    monkeypatch.setattr(render_episode, "smoke_check", lambda path, expect: [])
    monkeypatch.setattr(render_episode, "ffprobe_streams",
                        lambda path: {"duration": 1.0, "video": "h264", "audio": "aac"})
    return ep, rendered, gate_reasons


def test_render_refuses_non_overridable_code(render_env, capsys):
    ep, rendered, gate_reasons = render_env
    out = ep.parent / "out.mp4"
    rc = render_episode.main([
        str("my-slug-DRAFT"), str(out),
        "--override-codes", "scene_provenance_stale",
        "--override-issued-by", "alice",
    ])
    assert rc == 1
    assert rendered == []  # no render happened
    err = capsys.readouterr().err
    assert "NON_OVERRIDABLE" in err


def test_render_refuses_unlisted_code(render_env, capsys):
    ep, rendered, gate_reasons = render_env
    out = ep.parent / "out.mp4"
    rc = render_episode.main([
        "my-slug-DRAFT", str(out),
        "--override-codes", "made_up_code",
        "--override-issued-by", "alice",
    ])
    assert rc == 1
    assert rendered == []
    err = capsys.readouterr().err
    assert "NOT IN RUNBOOK ALLOWLIST" in err


def test_render_refuses_override_without_issuer(render_env, capsys):
    ep, rendered, gate_reasons = render_env
    out = ep.parent / "out.mp4"
    rc = render_episode.main([
        "my-slug-DRAFT", str(out),
        "--override-codes", "composition_dims_mismatch",
    ])
    assert rc == 1
    assert rendered == []
    err = capsys.readouterr().err
    assert "issuer" in err


def test_render_allows_allowlisted_code_with_issuer_and_logs_it(render_env, capsys):
    ep, rendered, gate_reasons = render_env
    gate_reasons.append({"code": "composition_dims_mismatch", "message": "canvas drift"})
    out = ep.parent / "out.mp4"
    rc = render_episode.main([
        "my-slug-DRAFT", str(out),
        "--override-codes", "composition_dims_mismatch",
        "--override-issued-by", "alice",
    ])
    assert rc == 0
    assert len(rendered) == 1
    log = out.parent / "render_overrides.log"
    assert log.is_file()
    content = log.read_text(encoding="utf-8")
    assert "issuer=alice" in content
    assert "composition_dims_mismatch" in content


def test_render_env_issuer_fallback_logged(render_env, capsys, monkeypatch):
    ep, rendered, gate_reasons = render_env
    gate_reasons.append({"code": "timing_relock_failed", "message": "drift"})
    monkeypatch.setenv(render_episode.OVERRIDE_ISSUER_ENV, "bob-env")
    out = ep.parent / "out.mp4"
    rc = render_episode.main([
        "my-slug-DRAFT", str(out),
        "--override-codes", "timing_relock_failed",
    ])
    assert rc == 0
    content = (out.parent / "render_overrides.log").read_text(encoding="utf-8")
    assert "issuer=bob-env" in content
