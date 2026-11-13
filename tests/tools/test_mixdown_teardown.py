"""Tests for tools/qc/mixdown.py teardown semantics (Fix B2).

Enumerated cases (spec): intermediates deleted on the success path AND on the
failure path; cleanup failure → warning, not abort. Plus the OM_AUDIO_CLEANUP=0
kill-switch declared for the cleanup lane.
"""
import json
from pathlib import Path

import pytest

from tools.qc import mixdown
from tools.qc.mixdown import INTERMEDIATES, cleanup_intermediates

BULK_NAMES = ("mix_base.wav", "bgm_loop.wav", "mix_bgm.wav")


def _seed(work: Path) -> None:
    work.mkdir(parents=True, exist_ok=True)
    for name in INTERMEDIATES:
        (work / name).write_bytes(b"\0" * 32)


def _inputs(tmp_path: Path):
    return {
        "project": tmp_path,
        "draft": tmp_path / "draft.mp4",
        "final": tmp_path / "final.mp4",
        "out": tmp_path / "out.mp4",
        "bgm": tmp_path / "bgm.mp3",
        "timing_path": tmp_path / "scene_timing.json",
    }


def _stub_inputs(tmp_path: Path):
    """Physical stubs so mixdown's input pre-check passes; ffmpeg is monkeypatched."""
    d = _inputs(tmp_path)
    for key in ("draft", "final", "bgm"):
        d[key].write_bytes(b"\0")
    d["timing_path"].write_text(json.dumps({"total_seconds": 139.984, "fps": 30}))
    return d


def test_success_path_deletes_intermediates_keeps_master(tmp_path, monkeypatch):
    monkeypatch.delenv(mixdown.CLEANUP_ENV, raising=False)
    work = tmp_path / "_master_work"
    _seed(work)
    removed, problems = cleanup_intermediates(work)
    assert removed == list(BULK_NAMES)
    assert problems == []
    for name in BULK_NAMES:
        assert not (work / name).exists()
    # mix_master.wav is retained: the QC validator manifest 'mix' key points at it.
    assert (work / "mix_master.wav").is_file()


def test_failure_path_still_cleans_up(tmp_path, monkeypatch):
    monkeypatch.delenv(mixdown.CLEANUP_ENV, raising=False)
    d = _stub_inputs(tmp_path)
    work = tmp_path / "renders" / "_master_work"
    _seed(work)

    def boom(*args, **kwargs):
        raise mixdown.MixdownError("simulated ffmpeg failure")

    monkeypatch.setattr(mixdown, "run_ffmpeg", boom)
    with pytest.raises(mixdown.MixdownError, match="simulated ffmpeg failure"):
        mixdown.mixdown(**d)
    # Trap-guarded teardown ran even though the mixdown raised.
    for name in BULK_NAMES:
        assert not (work / name).exists()


def test_cleanup_failure_warns_not_aborts(tmp_path, monkeypatch):
    monkeypatch.delenv(mixdown.CLEANUP_ENV, raising=False)
    work = tmp_path / "_master_work"
    _seed(work)
    # Make one intermediate undeletable: replace it with a directory so
    # unlink() fails with IsADirectoryError.
    (work / "mix_base.wav").unlink()
    (work / "mix_base.wav").mkdir()
    (work / "mix_base.wav" / "stub.wav").write_bytes(b"\0")

    removed, problems = cleanup_intermediates(work)  # must NOT raise
    assert problems and "mix_base.wav" in problems[0]
    assert removed == ["bgm_loop.wav", "mix_bgm.wav"]
    assert (work / "mix_base.wav").is_dir()


def test_cleanup_kill_switch_env(tmp_path, monkeypatch):
    monkeypatch.setenv(mixdown.CLEANUP_ENV, "0")
    work = tmp_path / "_master_work"
    _seed(work)
    removed, problems = cleanup_intermediates(work)
    assert removed == []
    for name in INTERMEDIATES:
        assert (work / name).is_file()


def test_success_path_wiring_retains_qc_stems(tmp_path, monkeypatch):
    # F1/F6: full mixdown() success path — fake ffmpeg materializes each output;
    # QC stems must be copied to renders/audio_stems/ BEFORE teardown deletes
    # the _master_work intermediates, so mix_validator inputs survive.
    monkeypatch.delenv(mixdown.CLEANUP_ENV, raising=False)
    d = _stub_inputs(tmp_path)
    work = tmp_path / "renders" / "_master_work"

    def fake_ffmpeg(args, timeout=600):
        out = Path(str(args[-1]))
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(b"\0" * 16)

    monkeypatch.setattr(mixdown, "run_ffmpeg", fake_ffmpeg)
    monkeypatch.setattr(mixdown, "loudnorm_pass_stats",
                        lambda work, i, tp, lra: ("-14.0", "-1.0", "9.0", "-24.0"))
    summary = mixdown.mixdown(**d)
    qc_dir = tmp_path / "renders" / "audio_stems"
    assert (qc_dir / "narration.wav").is_file()   # ← mix_base.wav copy
    assert (qc_dir / "bgm.wav").is_file()         # ← bgm_loop.wav copy
    for name in BULK_NAMES:
        assert not (work / name).exists()          # teardown still fired
    assert (work / "mix_master.wav").is_file()     # KEEP_FOR_QC
    assert summary["qc_stems_retained"] == ["narration.wav", "bgm.wav"]
    assert summary["mix_master_retained"] is True
    assert summary["cleanup_warnings"] == []


def test_input_error_exit2(tmp_path, monkeypatch):
    # Fail-closed input error → exit 2 with JSON envelope on stderr, no traceback.
    d = _stub_inputs(tmp_path)
    d["draft"].unlink()  # required input missing
    rc = mixdown.main(["--project", str(tmp_path), "--draft", str(d["draft"]),
                       "--final", str(d["final"]), "--out", str(d["out"]),
                       "--bgm", str(d["bgm"])])
    assert rc == 2


def _sweep_root(tmp_path):
    root = tmp_path / "projects"
    work = root / "p1" / "renders" / "_master_work"
    _seed(work)
    return root, work


def test_sweep_dry_run_default_excludes_master(tmp_path):
    # F2: mix_master.wav (KEEP_FOR_QC) is never reported by default; dry-run deletes nothing.
    root, work = _sweep_root(tmp_path)
    report = mixdown.sweep(root)
    names = {Path(f["path"]).name for f in report["files"]}
    assert names == {"mix_base.wav", "bgm_loop.wav", "mix_bgm.wav"}
    assert report["mode"] == "dry-run" and report["include_master"] is False
    assert report["bytes_deleted"] == 0
    for name in INTERMEDIATES:
        assert (work / name).is_file()


def test_sweep_delete_and_master_optin(tmp_path):
    # F2: --delete removes reported strays; retained QC masters survive until
    # an explicit include_master opt-in.
    root, work = _sweep_root(tmp_path)
    report = mixdown.sweep(root, delete=True)
    assert report["mode"] == "delete"
    assert not (work / "mix_base.wav").exists()
    assert (work / "mix_master.wav").is_file()
    report = mixdown.sweep(root, delete=True, include_master=True)
    assert report["include_master"] is True
    assert not (work / "mix_master.wav").exists()
    assert report["bytes_deleted"] > 0
