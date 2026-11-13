"""Tests for tools/qc/bgm_gate.py — fail-closed BGM duration gate.

Enumerated cases (spec): fail-closed (BGM < duration, no loop declared → FAIL);
pass (loop declared → PASS); pass (BGM >= duration → PASS); kill-switch env.
"""
import json
from pathlib import Path

import pytest

from tools.qc import bgm_gate
from tools.qc.bgm_gate import episode_duration, gate, loop_declared

EPISODE_SECONDS = 139.984


def _timing(tmp_path: Path, total_seconds=EPISODE_SECONDS) -> Path:
    p = tmp_path / "scene_timing.json"
    p.write_text(json.dumps({"version": "1.0", "fps": 30, "total_seconds": total_seconds}))
    return p


def _composition(tmp_path: Path, *, loop: bool) -> Path:
    loop_line = "\n      loop" if loop else ""
    text = (
        "const Episode = (\n  <AbsoluteFill>\n"
        "    <Audio\n"
        "      src={staticFile(`${BASE}/bgm.mp3`)}" + loop_line + "\n"
        "      volume={(f) => 0.12}\n"
        "    />\n"
        "  </AbsoluteFill>\n);"
    )
    p = tmp_path / "Episode.tsx"
    p.write_text(text)
    return p


def _probe(seconds: float):
    return lambda path: seconds


def test_fail_closed_bgm_shorter_no_loop(tmp_path, monkeypatch):
    monkeypatch.delenv(bgm_gate.KILL_SWITCH_ENV, raising=False)
    verdict = gate(_timing(tmp_path), tmp_path / "bgm.mp3",
                   _composition(tmp_path, loop=False), probe=_probe(27.097))
    assert verdict["valid"] is False
    assert verdict["verdict"] == "fail"
    assert verdict["loop_declared"] is False
    assert verdict["episode_seconds"] == pytest.approx(EPISODE_SECONDS)
    assert verdict["bgm_seconds"] == pytest.approx(27.097)
    assert any("silent tail" in e for e in verdict["errors"])
    # CLI exits non-zero on the fail verdict (fail-closed).
    (tmp_path / "bgm.mp3").write_bytes(b"\0")
    monkeypatch.setattr(bgm_gate, "probe_duration", _probe(27.097))
    assert bgm_gate.main(["--timing", str(_timing(tmp_path)),
                          "--bgm", str(tmp_path / "bgm.mp3"),
                          "--composition", str(_composition(tmp_path, loop=False))]) == 1


def test_pass_loop_declared(tmp_path, monkeypatch):
    monkeypatch.delenv(bgm_gate.KILL_SWITCH_ENV, raising=False)
    verdict = gate(_timing(tmp_path), tmp_path / "bgm.mp3",
                   _composition(tmp_path, loop=True), probe=_probe(27.097))
    assert verdict["valid"] is True
    assert verdict["verdict"] == "pass"
    assert verdict["loop_declared"] is True
    assert verdict["errors"] == []


def test_pass_bgm_long_enough(tmp_path, monkeypatch):
    monkeypatch.delenv(bgm_gate.KILL_SWITCH_ENV, raising=False)
    verdict = gate(_timing(tmp_path), tmp_path / "bgm.mp3",
                   _composition(tmp_path, loop=False), probe=_probe(150.0))
    assert verdict["valid"] is True
    assert verdict["verdict"] == "pass"
    assert verdict["loop_declared"] is False


def test_kill_switch_env(tmp_path, monkeypatch):
    monkeypatch.setenv(bgm_gate.KILL_SWITCH_ENV, "0")
    verdict = gate(_timing(tmp_path), tmp_path / "bgm.mp3",
                   _composition(tmp_path, loop=False), probe=_probe(27.097))
    assert verdict["verdict"] == "disabled"
    assert verdict["valid"] is True
    # CLI exits 0 when the gate is disabled.
    assert bgm_gate.main(["--timing", str(_timing(tmp_path)),
                          "--bgm", str(tmp_path / "bgm.mp3"),
                          "--composition", str(_composition(tmp_path, loop=False))]) == 0


def test_episode_duration_falls_back_to_frames_fps(tmp_path):
    assert episode_duration({"total_frames": 4200, "fps": 30}) == pytest.approx(140.0)
    assert episode_duration({"video_total_frames": 900, "fps": 30}) == pytest.approx(30.0)


def test_loop_false_counts_not_declared(tmp_path, monkeypatch):
    # F4: explicit loop={false} is a fail-closed NOT-looped, never a false PASS.
    monkeypatch.delenv(bgm_gate.KILL_SWITCH_ENV, raising=False)
    text = ("<Audio\n      src={staticFile(`${BASE}/bgm.mp3`)}\n"
            "      loop={false}\n      volume={0.12}\n    />")
    p = tmp_path / "Episode.tsx"
    p.write_text(text)
    assert loop_declared(text, "bgm.mp3") is False
    verdict = gate(_timing(tmp_path), tmp_path / "bgm.mp3", p, probe=_probe(27.097))
    assert verdict["valid"] is False
    assert verdict["loop_declared"] is False


def test_input_error_exit2(tmp_path):
    # Fail-closed: unusable inputs are a non-zero exit with the JSON envelope.
    missing = tmp_path / "nope.json"
    with pytest.raises(bgm_gate.InputError):
        gate(missing, tmp_path / "bgm.mp3", tmp_path / "Episode.tsx")
    rc = bgm_gate.main(["--timing", str(missing), "--bgm", str(tmp_path / "bgm.mp3"),
                        "--composition", str(tmp_path / "Episode.tsx")])
    assert rc == 2


def test_probe_timeout_maps_to_input_error(tmp_path, monkeypatch):
    # F5: TimeoutExpired surfaces as GateError (exit 2 envelope), not a traceback.
    import subprocess

    def boom(*args, **kwargs):
        raise subprocess.TimeoutExpired(cmd="ffprobe", timeout=60)

    monkeypatch.setattr(bgm_gate.subprocess, "run", boom)
    with pytest.raises(bgm_gate.InputError, match="timed out"):
        gate(_timing(tmp_path), tmp_path / "bgm.mp3",
             _composition(tmp_path, loop=True),
             probe=lambda path: bgm_gate.probe_duration(path))
    # CLI path: real probe_duration + patched subprocess.run → exit 2 envelope.
    rc = bgm_gate.main(["--timing", str(_timing(tmp_path)),
                        "--bgm", str(tmp_path / "bgm.mp3"),
                        "--composition", str(_composition(tmp_path, loop=True))])
    assert rc == 2


def test_bgm_gate_nan_duration_fails(tmp_path, monkeypatch):
    # Review CRITICAL: parse_constant turns JSON NaN/Infinity into float
    # nan/inf, and nan <= 0 is False → the gate silently PASSed (exit 0).
    # Non-finite and non-positive durations must raise InputError (exit 2).
    monkeypatch.delenv(bgm_gate.KILL_SWITCH_ENV, raising=False)
    timing = tmp_path / "scene_timing.json"
    comp = _composition(tmp_path, loop=False)
    probe = _probe(27.097)
    timing.write_text('{"fps": 30, "total_seconds": NaN}')
    with pytest.raises(bgm_gate.InputError, match="non-finite"):
        gate(timing, tmp_path / "bgm.mp3", comp, probe=probe)
    timing.write_text('{"fps": 30, "total_seconds": -Infinity}')
    with pytest.raises(bgm_gate.InputError, match="non-finite"):
        gate(timing, tmp_path / "bgm.mp3", comp, probe=probe)
    # Non-positive total_seconds (0 / negative floats compare fine) → reject.
    for bad in ("0", "-5.5"):
        timing.write_text('{"fps": 30, "total_seconds": %s}' % bad)
        with pytest.raises(bgm_gate.InputError, match="positive"):
            gate(timing, tmp_path / "bgm.mp3", comp, probe=probe)
    # Frames/fps fallback path rejects NaN too.
    timing.write_text('{"total_frames": NaN, "fps": 30}')
    with pytest.raises(bgm_gate.InputError, match="non-finite"):
        gate(timing, tmp_path / "bgm.mp3", comp, probe=probe)
    # CLI: fail-closed input error → exit 2 envelope.
    timing.write_text('{"fps": 30, "total_seconds": NaN}')
    assert bgm_gate.main(["--timing", str(timing),
                          "--bgm", str(tmp_path / "bgm.mp3"),
                          "--composition", str(comp)]) == 2


def test_bgm_gate_loop_in_filename_not_treated_as_loop_prop(tmp_path, monkeypatch):
    # Review MAJOR: \bloop\b matched inside src content (/loop/bgm.mp3,
    # theme-loop.mp3) → loop_declared=True without any loop prop → false PASS.
    monkeypatch.delenv(bgm_gate.KILL_SWITCH_ENV, raising=False)
    text = ("const Episode = (\n  <AbsoluteFill>\n    <Audio\n"
            "      src={staticFile(`${BASE}/loop/bgm.mp3`)}\n"
            "      volume={(f) => 0.12}\n    />\n  </AbsoluteFill>\n);")
    p = tmp_path / "Episode.tsx"
    p.write_text(text)
    assert loop_declared(text, "bgm.mp3") is False
    verdict = gate(_timing(tmp_path), tmp_path / "bgm.mp3", p, probe=_probe(27.097))
    assert verdict["valid"] is False
    assert verdict["verdict"] == "fail"
    assert verdict["loop_declared"] is False
    # CLI: the fail verdict exits 1 (gate fires, not a silent pass).
    (tmp_path / "bgm.mp3").write_bytes(b"\0")
    monkeypatch.setattr(bgm_gate, "probe_duration", _probe(27.097))
    assert bgm_gate.main(["--timing", str(_timing(tmp_path)),
                          "--bgm", str(tmp_path / "bgm.mp3"),
                          "--composition", str(p)]) == 1
    # Loop inside the filename stem is equally NOT a prop.
    text2 = ("<Audio\n      src={staticFile(`${BASE}/theme-loop.mp3`)}\n"
             "      volume={0.12}\n    />")
    assert loop_declared(text2, "theme-loop.mp3") is False
    # A real loop prop on the same loop-path element is still detected.
    assert loop_declared(
        "<Audio src={staticFile(`${BASE}/loop/bgm.mp3`)} loop />",
        "bgm.mp3") is True
    # loop={0} is a falsy NOT-looped form, like loop={false}.
    assert loop_declared(
        "<Audio src={staticFile(`${BASE}/bgm.mp3`)} loop={0} />",
        "bgm.mp3") is False


def test_corrupt_timing_json_is_input_error(tmp_path, monkeypatch):
    # Review MINOR: UnicodeDecodeError escaped the (OSError, JSONDecodeError)
    # catch tuple → traceback instead of the fail-closed exit-2 envelope.
    monkeypatch.delenv(bgm_gate.KILL_SWITCH_ENV, raising=False)
    timing = tmp_path / "scene_timing.json"
    timing.write_bytes(b"\xff\xfe\x00not-utf8")
    with pytest.raises(bgm_gate.InputError, match="unreadable scene_timing.json"):
        gate(timing, tmp_path / "bgm.mp3", _composition(tmp_path, loop=True))
    # Corrupt composition file hits the same class on the comp read.
    # (probe is injected explicitly: gate probes the BGM before reading comp.)
    comp = tmp_path / "Episode.tsx"
    comp.write_bytes(b"\xff\xfe\x00not-utf8")
    with pytest.raises(bgm_gate.InputError, match="unreadable composition"):
        gate(_timing(tmp_path), tmp_path / "bgm.mp3", comp, probe=_probe(150.0))
    rc = bgm_gate.main(["--timing", str(timing),
                        "--bgm", str(tmp_path / "bgm.mp3"),
                        "--composition", str(_composition(tmp_path, loop=True))])
    assert rc == 2


def test_bgm_gate_non_finite_or_non_positive_probe_duration_fails(tmp_path, monkeypatch):
    # Mirror of the timing-side CRITICAL, BGM side: ffprobe printing nan/inf
    # makes bgm_seconds < duration evaluate False (silent PASS), and 0/negative
    # BGM durations are unusable — all must raise InputError (CLI exit 2).
    # subprocess.run is stubbed so the REAL probe_duration validation runs.
    monkeypatch.delenv(bgm_gate.KILL_SWITCH_ENV, raising=False)
    comp = _composition(tmp_path, loop=False)
    timing = _timing(tmp_path)
    for bad in ("nan", "inf", "-inf", "0.0", "-1.0"):
        def fake_run(*args, _out=bad, **kwargs):
            return type("P", (), {"stdout": f"{_out}\n", "stderr": ""})()
        monkeypatch.setattr(bgm_gate.subprocess, "run", fake_run)
        with pytest.raises(bgm_gate.InputError,
                           match="non-finite or non-positive"):
            gate(timing, tmp_path / "bgm.mp3", comp)
    # CLI path: same stubbed ffprobe output → exit-2 envelope.
    rc = bgm_gate.main(["--timing", str(timing),
                        "--bgm", str(tmp_path / "bgm.mp3"),
                        "--composition", str(comp)])
    assert rc == 2


def test_loop_declared_requires_bgm_reference():
    assert loop_declared("<Audio src={staticFile(`x/bgm.mp3`)} loop />", "bgm.mp3") is True
    # `loop` on an element NOT referencing the bgm does not count.
    assert loop_declared("<Audio src={staticFile(`sfx/whoosh.mp3`)} loop />", "bgm.mp3") is False
    # bgm reference without the loop prop does not count.
    assert loop_declared("<Audio src={staticFile(`x/bgm.mp3`)} volume={0.12} />", "bgm.mp3") is False
