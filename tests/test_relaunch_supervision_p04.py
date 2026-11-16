"""Wave1 P0-4 — fail-exit supervision + notification stub hooks (launcher).

Pins the run_cc_pipeline.py.tmpl supervision contract:
- bounded auto-relaunch: at most OM_RELAUNCH_MAX_ATTEMPTS TOTAL attempts
  (default 2 = initial pass + one relaunch; NEVER a third), doubling
  backoff before each relaunch;
- notification hook points on final fail-exit: fail_exit AND
  owner_approval_request records emitted to the job-event lane — STUB/EMIT
  ONLY (tools/qc/job_events.py JSONL file lane, no real channel);
- truthful-proc print (item 7, backported from the faa deployed copy at OM
  53449df): every agent dispatch logs role/scene/exit/duration/bytes.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
LAUNCHER_TMPL = REPO_ROOT / "tools/qc/cc_wrapper_templates/run_cc_pipeline.py.tmpl"
SLUG = "supervision-canary"

from tools.qc.job_events import read_job_events  # noqa: E402


def render_launcher(tmp_path: Path) -> Path:
    """Render the launcher into a realistic project layout so the module's
    REPO-root shim + default sink resolve inside the tmp tree."""
    out_dir = tmp_path / "projects" / SLUG / "scripts" / "cc_pipeline"
    out_dir.mkdir(parents=True, exist_ok=True)
    text = (LAUNCHER_TMPL.read_text(encoding="utf-8")
            .replace("{{PROJECT_SLUG}}", SLUG)
            .replace("{{DEFAULT_SCENE_COUNT}}", "3"))
    src = out_dir / "run_cc_pipeline.py"
    src.write_text(text, encoding="utf-8")
    return src


@pytest.fixture()
def launcher_mod(tmp_path):
    src = render_launcher(tmp_path)
    spec = importlib.util.spec_from_file_location("run_cc_pipeline_under_test_p04", src)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture()
def sleep_log(monkeypatch):
    calls: list[float] = []
    monkeypatch.setattr("time.sleep", lambda s: calls.append(s))
    return calls


# ------------------------------------------------------------------------------
# Item 4: bounded relaunch
# ------------------------------------------------------------------------------

def test_relaunch_backoff_doubles(launcher_mod):
    assert launcher_mod.relaunch_backoff_s(30.0, 1) == 30.0
    assert launcher_mod.relaunch_backoff_s(30.0, 2) == 60.0
    assert launcher_mod.relaunch_backoff_s(30.0, 3) == 120.0
    assert launcher_mod.relaunch_backoff_s(30.0, 0) == 0.0


def test_relaunch_cap_two_attempts_no_third(launcher_mod, monkeypatch, sleep_log):
    launcher_mod.RELAUNCH_MAX_ATTEMPTS = 2
    launcher_mod.RELAUNCH_BACKOFF_BASE_S = 30.0
    calls = {"n": 0}

    def fake_once():
        calls["n"] += 1
        return 1, f"fail {calls['n']}"

    monkeypatch.setattr(launcher_mod, "run_pipeline_once", fake_once)
    rc = launcher_mod.run_pipeline_supervised()
    assert rc == 1
    assert calls["n"] == 2          # initial + ONE relaunch; never a third
    assert sleep_log == [30.0]      # doubling backoff: relaunch 1 waits base


def test_relaunch_success_first_pass_no_sleep(launcher_mod, monkeypatch, sleep_log):
    monkeypatch.setattr(launcher_mod, "run_pipeline_once", lambda: (0, "ok"))
    assert launcher_mod.run_pipeline_supervised() == 0
    assert sleep_log == []


def test_relaunch_success_on_second_pass(launcher_mod, monkeypatch, sleep_log):
    seq = iter([(1, "transient"), (0, "recovered")])
    monkeypatch.setattr(launcher_mod, "run_pipeline_once", lambda: next(seq))
    assert launcher_mod.run_pipeline_supervised() == 0
    assert sleep_log == [30.0]


def test_relaunch_cap_spent_emits_both_notification_stubs(
        launcher_mod, monkeypatch, sleep_log, tmp_path):
    launcher_mod.RELAUNCH_MAX_ATTEMPTS = 2
    monkeypatch.setattr(launcher_mod, "run_pipeline_once", lambda: (1, "still failing"))
    rc = launcher_mod.run_pipeline_supervised()
    assert rc == 1
    sink = tmp_path / "projects" / SLUG / "artifacts" / "job_events.jsonl"
    records = read_job_events(sink)
    types = [r["event_type"] for r in records]
    assert "fail_exit" in types and "owner_approval_request" in types
    fail = next(r for r in records if r["event_type"] == "fail_exit")
    assert fail["payload"]["attempts_used"] == 2
    assert fail["payload"]["attempts_cap"] == 2
    approval = next(r for r in records if r["event_type"] == "owner_approval_request")
    assert approval["payload"]["requires_owner"] is True


def test_relaunch_cap_one_means_no_relaunch(launcher_mod, monkeypatch, sleep_log):
    launcher_mod.RELAUNCH_MAX_ATTEMPTS = 1
    calls = {"n": 0}

    def fake_once():
        calls["n"] += 1
        return 1, "fail"

    monkeypatch.setattr(launcher_mod, "run_pipeline_once", fake_once)
    assert launcher_mod.run_pipeline_supervised() == 1
    assert calls["n"] == 1
    assert sleep_log == []


# ------------------------------------------------------------------------------
# Item 6: notification stub semantics
# ------------------------------------------------------------------------------

def test_job_event_stub_emits_jsonl_and_reads_back(tmp_path):
    from tools.qc.job_events import emit_job_event
    sink = tmp_path / "lane" / "job_events.jsonl"
    rec = emit_job_event("fail_exit", {"exit_code": 1}, sink=sink)
    assert rec["event_id"].startswith("jev_")
    assert rec["event_type"] == "fail_exit"
    assert rec["payload"] == {"exit_code": 1}
    assert rec["timestamp"]  # iso timestamp present
    recs = read_job_events(sink)
    assert [r["event_id"] for r in recs] == [rec["event_id"]]
    raw = sink.read_text(encoding="utf-8").strip().splitlines()
    assert json.loads(raw[0])["event_type"] == "fail_exit"


def test_job_event_stub_sink_none_writes_nothing(tmp_path):
    from tools.qc.job_events import emit_job_event
    rec = emit_job_event("stall_detected", {}, sink=None)
    assert rec["event_type"] == "stall_detected"
    assert list(tmp_path.rglob("job_events.jsonl")) == []


def test_job_event_stub_read_skips_torn_lines(tmp_path):
    from tools.qc.job_events import emit_job_event
    sink = tmp_path / "job_events.jsonl"
    good = emit_job_event("a", {}, sink=sink)
    with open(sink, "a", encoding="utf-8") as fh:
        fh.write('{"event_id": "torn", "payload": {"unfinished')  # torn tail
    recs = read_job_events(sink)
    assert [r["event_id"] for r in recs] == [good["event_id"]]


def test_launcher_notification_emit_failure_never_raises(launcher_mod, monkeypatch):
    """A broken notification lane must not mask the supervision exit path:
    the hook's internal guard swallows transport errors (the stub's emit is
    best-effort by contract)."""
    def boom(event_type, payload, sink=None):
        raise RuntimeError("lane down")

    monkeypatch.setattr("tools.qc.job_events.emit_job_event", boom)
    monkeypatch.setattr(launcher_mod, "run_pipeline_once", lambda: (1, "x"))
    launcher_mod.RELAUNCH_MAX_ATTEMPTS = 1
    assert launcher_mod.run_pipeline_supervised() == 1


# ------------------------------------------------------------------------------
# Item 7: truthful-proc print backport (faa 53449df format)
# ------------------------------------------------------------------------------

def test_truthful_proc_print_in_template():
    src = LAUNCHER_TMPL.read_text(encoding="utf-8")
    # exact faa-carried format: "[agent] {OM_ROLE} {OM_SCENE_ID} exit=… dur=… out=…B err=…"
    assert 'f"[agent] {env_extra.get(\'OM_ROLE\')} {env_extra.get(\'OM_SCENE_ID\')} "' in src
    assert 'f"exit={proc.returncode} dur={time.time()-t0:.0f}s "' in src
    assert 'f"out={len(proc.stdout or \'\')}B err={(proc.stderr or \'\')[:120]!r}", flush=True)' in src
    # it prints on the SUCCESS path of _run (after subprocess.run returns)
    run_block = src[src.index("proc = subprocess.run"):]
    run_block = run_block[:run_block.index("return AgentRunResult")]
    assert "[agent]" in run_block


def test_truthful_proc_print_survives_mint_render(tmp_path):
    src_path = render_launcher(tmp_path)
    src = src_path.read_text(encoding="utf-8")
    assert '"[agent]' in src
    assert "{{PROJECT_SLUG}}" not in src


def test_launcher_module_defaults_are_conservative():
    """Defaults without env: cap 2 total attempts, base backoff 30s — pinned
    on the template literals (the conservative supervision contract). The
    parse now goes through guarded helpers (security review finding 3,
    2026-11-16): non-integer env warns + defaults instead of crashing."""
    src = LAUNCHER_TMPL.read_text(encoding="utf-8")
    assert 'os.environ.get("OM_RELAUNCH_MAX_ATTEMPTS")' in src
    assert 'os.environ.get("OM_RELAUNCH_BACKOFF_S")' in src
    assert "_parse_relaunch_max_attempts(os.environ.get(\"OM_RELAUNCH_MAX_ATTEMPTS\"))" in src
    assert "_parse_relaunch_backoff_base_s(os.environ.get(\"OM_RELAUNCH_BACKOFF_S\"))" in src
    # guarded parses: no bare int()/float() on the relaunch env anymore
    assert 'int(os.environ.get("OM_RELAUNCH_MAX_ATTEMPTS"' not in src
    assert 'float(os.environ.get("OM_RELAUNCH_BACKOFF_S"' not in src


# ------------------------------------------------------------------------------
# Finding 3 (security review 2026-11-16): env override cannot exceed hard cap
# ------------------------------------------------------------------------------

def test_relaunch_hard_cap_constant():
    src = launcher_defaults_src()
    assert src.count("\nRELAUNCH_HARD_CAP = 3") == 1   # the definition line
    assert "RELAUNCH_HARD_CAP" in src.split("# --- Wave1 P0-4")[1]


def launcher_defaults_src() -> str:
    return LAUNCHER_TMPL.read_text(encoding="utf-8")


def test_parse_relaunch_max_attempts_clamped(launcher_mod):
    parse = launcher_mod._parse_relaunch_max_attempts
    assert parse(None) == 2                       # unset -> default 2
    assert parse("2") == 2                        # normal value honored
    assert parse("1") == 1
    assert parse("3") == 3                        # the cap itself is allowed
    assert parse("10") == launcher_mod.RELAUNCH_HARD_CAP   # cannot exceed cap
    assert parse("999") == launcher_mod.RELAUNCH_HARD_CAP
    assert parse("0") == 1                        # lower clamp intact
    assert parse("-4") == 1


def test_parse_relaunch_max_attempts_non_integer_warns_and_defaults(
        launcher_mod, capsys):
    parse = launcher_mod._parse_relaunch_max_attempts
    assert parse("abc") == 2                      # default, no ValueError
    assert parse("2.5") == 2                      # int() rejects float strings
    assert parse("") == 2
    out = capsys.readouterr().out
    assert out.count("invalid OM_RELAUNCH_MAX_ATTEMPTS") == 3
    assert "WARN" in out


def test_parse_relaunch_backoff_base_s_guards_and_clamps(launcher_mod, capsys):
    parse = launcher_mod._parse_relaunch_backoff_base_s
    assert parse(None) == 30.0                    # unset -> default 30
    assert parse("45") == 45.0
    assert parse("-5") == 0.0                     # lower clamp intact
    assert parse("junk") == 30.0                  # non-float -> warn + default
    assert parse("") == 30.0
    out = capsys.readouterr().out
    assert out.count("invalid OM_RELAUNCH_BACKOFF_S") == 2


def test_module_level_parse_runs_clean_at_import(launcher_mod):
    """The launcher module imported fine (fixture) — i.e. the module-level
    parse of whatever env the test runner carries did not raise, proving the
    no-ValueError-at-import contract for the normal path."""
    assert launcher_mod.RELAUNCH_MAX_ATTEMPTS >= 1
    assert launcher_mod.RELAUNCH_MAX_ATTEMPTS <= launcher_mod.RELAUNCH_HARD_CAP
    assert launcher_mod.RELAUNCH_BACKOFF_BASE_S >= 0.0
