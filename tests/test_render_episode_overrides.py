"""Wave1 P0-2 item 6 — render_episode override discipline.

NON_OVERRIDABLE provenance codes are a frozenset; overrides must be on the
runbook allowlist; every accepted override logs its issuer.
"""
from __future__ import annotations

import hashlib
import json
import os
import socket
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
    # W5: JSONL — every line parses as JSON
    lines = log.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1
    rec = json.loads(lines[0])
    assert rec["event_type"] == "render_override"
    payload = rec["payload"]
    assert payload["issuer"] == "alice"
    assert payload["comp_id"] == "my-slug-DRAFT"
    assert "composition_dims_mismatch" in payload["codes"]
    assert {"code": "composition_dims_mismatch", "message": "canvas drift"} in payload["reasons"]


def test_override_log_jsonl_shape_uid_hostname_genesis(render_env, capsys):
    """W5: record shape, uid/hostname present, first entry chains from genesis."""
    ep, rendered, gate_reasons = render_env
    gate_reasons.append({"code": "mix_validation_failed", "message": "drift"})
    out = ep.parent / "out.mp4"
    rc = render_episode.main([
        "my-slug-DRAFT", str(out),
        "--override-codes", "mix_validation_failed",
        "--override-issued-by", "carol",
    ])
    assert rc == 0
    rec = json.loads((out.parent / "render_overrides.log").read_text(encoding="utf-8").splitlines()[0])
    payload = rec["payload"]
    assert payload["uid"] == os.getuid()
    assert payload["hostname"] == socket.gethostname()
    assert payload["prev_hash"] == render_episode.OVERRIDE_CHAIN_GENESIS_HASH
    # envelope contract from tools/qc/job_events.py
    assert rec["event_id"].startswith("jev_")
    assert rec["timestamp"]


def _recompute_chain(records: list[dict]) -> None:
    """Verify W5 chain over a sequence: linkage + per-entry hash recompute."""
    prev = render_episode.OVERRIDE_CHAIN_GENESIS_HASH
    for rec in records:
        payload = rec["payload"]
        assert payload["prev_hash"] == prev
        expected = payload.pop("entry_hash")
        canon = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
        got = hashlib.sha256((prev + canon).encode("utf-8")).hexdigest()
        assert got == expected
        prev = expected


def test_override_log_chain_verifies_across_events(tmp_path):
    """W5: two sequential events chain (rec2.prev_hash == rec1.entry_hash)
    and the whole sequence recomputes."""
    log = tmp_path / "render_overrides.log"
    r1 = render_episode.log_override_event(
        log, comp_id="c1-DRAFT", issuer="alice",
        overridden=[{"code": "composition_dims_mismatch", "message": "m1"}])
    r2 = render_episode.log_override_event(
        log, comp_id="c2-DRAFT", issuer="bob",
        overridden=[{"code": "timing_relock_failed", "message": "m2"},
                    {"code": "mix_validation_failed", "message": "m3"}])
    records = [json.loads(l) for l in log.read_text(encoding="utf-8").splitlines()]
    assert len(records) == 2
    assert records[1]["payload"]["prev_hash"] == r1["payload"]["entry_hash"]
    assert r2["payload"]["entry_hash"] == records[1]["payload"]["entry_hash"]
    _recompute_chain(records)


def test_override_log_chain_skips_torn_tail(tmp_path):
    """W5: a torn/garbage tail line does not break the chain — the next
    event still links from the last good entry_hash."""
    log = tmp_path / "render_overrides.log"
    r1 = render_episode.log_override_event(
        log, comp_id="c1-DRAFT", issuer="alice",
        overridden=[{"code": "mix_validation_failed", "message": "m1"}])
    with log.open("a", encoding="utf-8") as f:
        f.write('{"torn": line not json\n')
        f.write("\n")
    render_episode.log_override_event(
        log, comp_id="c2-DRAFT", issuer="bob",
        overridden=[{"code": "timing_relock_failed", "message": "m2"}])
    parsed = []
    for l in log.read_text(encoding="utf-8").splitlines():
        try:
            parsed.append(json.loads(l))
        except Exception:
            continue  # torn line — same skip the verifier applies
    good = [r for r in parsed if "entry_hash" in r.get("payload", {})]
    assert len(good) == 2
    assert good[1]["payload"]["prev_hash"] == r1["payload"]["entry_hash"]
    _recompute_chain(good)


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
    rec = json.loads((out.parent / "render_overrides.log").read_text(encoding="utf-8").splitlines()[0])
    assert rec["payload"]["issuer"] == "bob-env"
