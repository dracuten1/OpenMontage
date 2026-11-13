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


def test_loop_declared_requires_bgm_reference():
    assert loop_declared("<Audio src={staticFile(`x/bgm.mp3`)} loop />", "bgm.mp3") is True
    # `loop` on an element NOT referencing the bgm does not count.
    assert loop_declared("<Audio src={staticFile(`sfx/whoosh.mp3`)} loop />", "bgm.mp3") is False
    # bgm reference without the loop prop does not count.
    assert loop_declared("<Audio src={staticFile(`x/bgm.mp3`)} volume={0.12} />", "bgm.mp3") is False
