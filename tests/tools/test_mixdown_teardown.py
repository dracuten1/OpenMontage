"""Tests for tools/qc/mixdown.py teardown semantics (Fix B2).

Enumerated cases (spec): intermediates deleted on the success path AND on the
failure path; cleanup failure → warning, not abort. Plus the OM_AUDIO_CLEANUP=0
kill-switch declared for the cleanup lane.
"""
import json
import os
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


def test_sweep_symlink_traversal_blocked(tmp_path):
    # Review MAJOR #5: rglob can traverse directory symlinks; every match is
    # resolved + containment-checked, and anything resolving outside the
    # projects root is skipped — never reported as deletable, never unlinked.
    root, work = _sweep_root(tmp_path)
    outside = tmp_path / "outside"
    (outside / "renders").mkdir(parents=True)
    (outside / "renders" / "mix_base.wav").write_bytes(b"\0" * 64)
    # (a) directory symlink inside renders → outside tree
    os.symlink(outside, root / "p1" / "renders" / "linked")
    # (b) file symlink inside renders → outside target (replaces a stray)
    (work / "bgm_loop.wav").unlink()
    os.symlink(outside / "renders" / "mix_base.wav", work / "bgm_loop.wav")

    report = mixdown.sweep(root, delete=True)
    # The REAL stray inside the root was found and deleted.
    assert not (work / "mix_base.wav").exists()
    assert report["mode"] == "delete"
    # Nothing resolving outside the root was touched — the symlinked file's
    # target (outside/renders/mix_base.wav) survives with content intact.
    assert (outside / "renders" / "mix_base.wav").is_file()
    assert (outside / "renders" / "mix_base.wav").stat().st_size == 64
    reported = {Path(f["path"]) for f in report["files"]}
    for f in reported:
        assert root.resolve() in f.resolve().parents or \
            f.resolve() == root.resolve()
        assert not f.is_symlink()  # symlinked entries are never reported
    # The name-matched symlink inside the root was skipped, not deleted.
    # (Engine note: dir-symlink traversal inside rglob varies by Python
    # version — 3.13 does not recurse into symlinks — so assert only the
    # invariant: ≥1 containment skip, and every skip names the root guard.)
    skipped = [p for p in report["problems"] if "outside projects root" in p]
    assert skipped, "symlinked matches must be reported as skipped"
    assert len(skipped) >= 1


def test_sweep_honors_cleanup_killswitch(tmp_path, monkeypatch):
    # Review MAJOR #6: OM_AUDIO_CLEANUP=0 disables ALL deletion — a --delete
    # request is downgraded to a dry-run and surfaced in the report.
    monkeypatch.setenv(mixdown.CLEANUP_ENV, "0")
    root, work = _sweep_root(tmp_path)
    report = mixdown.sweep(root, delete=True)
    assert report["mode"] == "dry-run"
    assert report["bytes_deleted"] == 0
    assert report.get("cleanup_killswitch") is True
    assert any("delete blocked" in p for p in report["problems"])
    assert report["strays"] > 0  # strays still REPORTED, just not deleted
    for name in INTERMEDIATES:
        assert (work / name).is_file()


def test_signal_handlers_convert_sigterm_to_system_exit(monkeypatch):
    # Review MAJOR #4: handlers raise SystemExit(128+signum) so the try/finally
    # teardown unwinds; non-main-thread installs are tolerated silently.
    import signal
    import threading

    old_term = signal.getsignal(signal.SIGTERM)
    mixdown.install_signal_teardown_handlers()
    try:
        handler = signal.getsignal(signal.SIGTERM)
        assert callable(handler) and handler is not old_term
        with pytest.raises(SystemExit) as ei:
            handler(signal.SIGTERM, None)
        assert ei.value.code == 128 + signal.SIGTERM
        if hasattr(signal, "SIGHUP"):
            with pytest.raises(SystemExit) as ei:
                signal.getsignal(signal.SIGHUP)(signal.SIGHUP, None)
            assert ei.value.code == 128 + signal.SIGHUP
    finally:
        signal.signal(signal.SIGTERM, old_term)
    # Library/embedded use (non-main thread) must not raise.
    errors = []

    def _install_off_thread():
        try:
            mixdown.install_signal_teardown_handlers()
        except Exception as e:  # pragma: no cover — failure path
            errors.append(e)

    t = threading.Thread(target=_install_off_thread)
    t.start()
    t.join()
    assert errors == []


def test_sigterm_style_exit_still_runs_teardown(tmp_path, monkeypatch):
    # SystemExit (what the SIGTERM/SIGHUP handlers raise) must unwind through
    # the try/finally teardown — no intermediate leak on a killed run.
    monkeypatch.delenv(mixdown.CLEANUP_ENV, raising=False)
    d = _stub_inputs(tmp_path)
    work = tmp_path / "renders" / "_master_work"
    _seed(work)

    def term(*args, **kwargs):
        raise SystemExit(143)

    monkeypatch.setattr(mixdown, "run_ffmpeg", term)
    with pytest.raises(SystemExit):
        mixdown.mixdown(**d)
    for name in BULK_NAMES:
        assert not (work / name).exists()


def test_retain_qc_stem_copy_failure_is_mixdown_error(tmp_path):
    # Review MINOR #7: a bare OSError from shutil.copy2 surfaced as a
    # traceback; it must surface as MixdownError instead.
    work = tmp_path / "work"
    work.mkdir()
    (work / "bgm_loop.wav").write_bytes(b"\0")  # mix_base.wav missing
    with pytest.raises(mixdown.MixdownError, match="QC stem copy failed"):
        mixdown.retain_qc_stems(work, tmp_path / "qc")


def test_no_keep_master_warns_on_qc_manifest_dependency(tmp_path, monkeypatch, capsys):
    # Review MINOR #7: --no-keep-master must warn that the QC manifest 'mix'
    # key requires mix_master.wav.
    monkeypatch.delenv(mixdown.CLEANUP_ENV, raising=False)
    d = _stub_inputs(tmp_path)

    def fake_ffmpeg(args, timeout=600):
        out = Path(str(args[-1]))
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(b"\0" * 8)

    monkeypatch.setattr(mixdown, "run_ffmpeg", fake_ffmpeg)
    monkeypatch.setattr(mixdown, "loudnorm_pass_stats",
                        lambda work, i, tp, lra: ("-14.0", "-1.0", "9.0", "-24.0"))
    rc = mixdown.main(["--project", str(tmp_path), "--draft", str(d["draft"]),
                       "--final", str(d["final"]), "--out", str(d["out"]),
                       "--bgm", str(d["bgm"]), "--timing", str(d["timing_path"]),
                       "--no-keep-master"])
    assert rc == 0
    err = capsys.readouterr().err
    assert "mix_master.wav" in err and "QC" in err
