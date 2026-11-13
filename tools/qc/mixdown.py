#!/usr/bin/env python3
"""mixdown.py — shared master-audio mixdown for OpenMontage episodes.

Lifted from per-project master_audio.sh (reference: tai-chinh-3tin-20261111):
draft voice+SFX extract → BGM loop+trim to episode duration → sidechain-duck
mix → loudnorm 2-pass → mux into the final video (c:v copy). Per-project
master_audio.sh scripts are thin calls into this tool; do not re-inline the
ffmpeg steps there.

Teardown (FAIL-OPEN): on any exit — success or failure — the intermediates
mix_base.wav / bgm_loop.wav / mix_bgm.wav are deleted from the work dir; mix
master (mix_master.wav) is kept by default because the QC validator's manifest
'mix' key points at it (--no-keep-master removes it too). Cleanup failure is a
warning, never an abort of a successful render. Trap-guarded via try/finally
so failed runs clean up too; SIGTERM/SIGHUP are converted to SystemExit so
even a killed process unwinds through the teardown.
Kill-switch: OM_AUDIO_CLEANUP=0 disables all deletion — including a
--sweep --delete run, which is downgraded to a dry-run.

Sweep (one-time stray cleanup): --sweep scans projects' renders dirs for
stray intermediates and REPORTS bytes reclaimed without deleting anything
(dry-run by default). Pass --delete to actually remove them.

Exit codes: 0 success / sweep report, 1 mixdown failure, 2 input error.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import signal
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
if __package__ in (None, ""):
    sys.path.insert(0, str(REPO))

from tools.qc.bgm_gate import GateError, episode_duration  # shared timing helper (F7)

INTERMEDIATES = ("mix_base.wav", "bgm_loop.wav", "mix_bgm.wav", "mix_master.wav")
KEEP_FOR_QC = ("mix_master.wav",)  # mix_validator manifest 'mix' key points here
# (source intermediate, retained name under renders/audio_stems/) — copied BEFORE
# teardown so mix_validator's narration/bgm manifest keys survive cleanup (F1).
QC_STEM_COPIES = (("mix_base.wav", "narration.wav"), ("bgm_loop.wav", "bgm.wav"))
CLEANUP_ENV = "OM_AUDIO_CLEANUP"
DEFAULT_TARGET_LUFS = -11.0
DEFAULT_TRUE_PEAK = -0.5
DEFAULT_LRA = 11.0
DEFAULT_SAMPLERATE = 48000
BGM_VOLUME = 0.12


class MixdownError(RuntimeError):
    pass


class InputError(MixdownError):
    pass


def install_signal_teardown_handlers():
    """Convert SIGTERM/SIGHUP into SystemExit so the try/finally teardown runs
    (review major #4). Python's default disposition for these signals kills
    the process without unwinding, leaking the ~intermediates in _master_work
    (the ~96 MiB/run leak class). Only the main thread may install handlers;
    library/embedded callers skip silently.
    """
    def _raise_system_exit(signum, _frame):
        raise SystemExit(128 + signum)

    for name in ("SIGTERM", "SIGHUP"):
        sig = getattr(signal, name, None)
        if sig is None:
            continue
        try:
            signal.signal(sig, _raise_system_exit)
        except (ValueError, OSError):
            pass  # not the main thread, or signal unsupported — skip quietly


def run_ffmpeg(args, timeout=600):
    """Run ffmpeg; raise MixdownError on non-zero exit or timeout."""
    cmd = ["ffmpeg", "-y", "-loglevel", "error", *[str(a) for a in args]]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired as e:
        raise MixdownError(f"ffmpeg timed out after {e.timeout}s ({' '.join(cmd[:8])} ...)") from e
    if p.returncode != 0:
        raise MixdownError(f"ffmpeg failed ({' '.join(cmd[:8])} ...): {(p.stderr or '')[-500:]}")
    return p


# --- mixdown steps (each takes/produces files inside `work`) -----------------

def extract_voice_sfx(draft, work):
    """1. Extract voice+SFX mix from the DRAFT render."""
    run_ffmpeg(["-i", draft, "-vn", "-ac", "2", "-ar", DEFAULT_SAMPLERATE, work / "mix_base.wav"])


def build_bgm_loop(bgm, duration, work):
    """2. BGM: loop until long enough, trim to episode duration."""
    run_ffmpeg(["-stream_loop", "-1", "-i", bgm, "-t", duration,
         "-ac", "2", "-ar", DEFAULT_SAMPLERATE, work / "bgm_loop.wav"])


def duck_and_mix(work):
    """3. Volume 0.12 + sidechain-duck BGM under narration, mix with base."""
    filter_complex = (
        "[0:a]volume=%s[bgm];"
        "[bgm][1:a]sidechaincompress=threshold=0.03:ratio=8:attack=120:release=600:makeup=1[bgmduck];"
        "[1:a][bgmduck]amix=inputs=2:duration=first:dropout_transition=0:weights=1 0.9[mix]"
    ) % BGM_VOLUME
    run_ffmpeg(["-i", work / "bgm_loop.wav", "-i", work / "mix_base.wav",
         "-filter_complex", filter_complex, "-map", "[mix]", work / "mix_bgm.wav"])


def loudnorm_pass_stats(work, target_lufs, true_peak, lra):
    """loudnorm pass 1: measure input stats (JSON on stderr)."""
    try:
        p = subprocess.run(
            ["ffmpeg", "-nostats", "-hide_banner", "-i", str(work / "mix_bgm.wav"),
             "-af", f"loudnorm=I={target_lufs}:TP={true_peak}:LRA={lra}:print_format=json",
             "-f", "null", "-"],
            capture_output=True, text=True, timeout=600,
        )
    except subprocess.TimeoutExpired as e:
        raise MixdownError(f"loudnorm pass-1 timed out after {e.timeout}s") from e
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr or "")
    if not m:
        raise MixdownError(f"loudnorm pass-1 stats unavailable: {(p.stderr or '')[-300:]}")
    d = json.loads(m.group(0))
    return d["input_i"], d["input_tp"], d["input_lra"], d["input_thresh"]


def loudnorm_apply(work, stats, target_lufs, true_peak, lra):
    """loudnorm pass 2: linear-mode apply measured stats."""
    i, tp, lra_, th = stats
    run_ffmpeg(["-i", work / "mix_bgm.wav", "-af",
         f"loudnorm=I={target_lufs}:TP={true_peak}:LRA={lra}"
         f":measured_I={i}:measured_TP={tp}:measured_LRA={lra_}"
         f":measured_thresh={th}:linear=true:print_format=none",
         "-ar", DEFAULT_SAMPLERATE, work / "mix_master.wav"])


def mux(final, work, out):
    """5. Mux the mastered audio into the FINAL video (c:v copy)."""
    run_ffmpeg(["-i", final, "-i", work / "mix_master.wav", "-map", "0:v", "-map", "1:a",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
         "-shortest", out])


# --- teardown + sweep --------------------------------------------------------

def retain_qc_stems(work, qc_dir):
    """Copy validator inputs to retained paths BEFORE teardown fires (F1).

    renders/audio_stems/narration.wav ← mix_base.wav, bgm.wav ← bgm_loop.wav;
    the manifest 'mix' key points at the retained mix_master.wav (KEEP_FOR_QC).
    Raises on mkdir/copy failure — this is deliverable output, not cleanup.
    """
    qc_dir = Path(qc_dir)
    try:
        qc_dir.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        raise MixdownError(f"failed to create QC dir: {e}") from e
    for src_name, dst_name in QC_STEM_COPIES:
        try:
            shutil.copy2(work / src_name, qc_dir / dst_name)
        except OSError as e:
            raise MixdownError(f"QC stem copy failed for {src_name} -> "
                               f"{qc_dir / dst_name}: {e}") from e
    return [dst for _, dst in QC_STEM_COPIES]


def cleanup_intermediates(work, *, keep=KEEP_FOR_QC):
    """FAIL-OPEN teardown: best-effort delete of intermediates from `work`.

    Returns (removed_names, problems). Never raises — a cleanup failure is a
    reported warning, and OM_AUDIO_CLEANUP=0 disables deletion entirely.
    """
    if str(os.environ.get(CLEANUP_ENV, "1")).strip() == "0":
        return [], [f"cleanup disabled: {CLEANUP_ENV}=0"]
    removed, problems = [], []
    for name in INTERMEDIATES:
        if name in keep:
            continue
        path = Path(work) / name
        try:
            if path.exists():
                path.unlink()
                removed.append(name)
        except OSError as e:
            problems.append(f"cleanup failed for {path}: {e}")
    return removed, problems


def sweep(projects_root, *, delete=False, include_master=False):
    """Scan projects' renders dirs for stray intermediates.

    Dry-run by default: report paths + bytes, delete nothing. delete=True
    performs the removal (fail-open: per-file errors are reported, never fatal).
    KEEP_FOR_QC masters (mix_master.wav) are excluded unless include_master=True
    — retained QC inputs must not be swept by default (F2).

    Honors the OM_AUDIO_CLEANUP=0 kill-switch (review major #6): the switch
    disables ALL deletion, so a --delete request is downgraded to a dry-run and
    reported in `problems` + the `cleanup_killswitch` report key.

    Symlink containment (review major #5): every match is resolved and checked
    to stay inside the projects root before it is reported or deleted —
    rglob can traverse directory symlinks, and a resolved match outside the
    root is skipped (a symlinked file pointing outside must never be unlinked).
    """
    root = Path(projects_root)
    if not root.is_dir():
        raise InputError(f"projects root not found: {root}")
    blocked_by_killswitch = delete and \
        str(os.environ.get(CLEANUP_ENV, "1")).strip() == "0"
    if blocked_by_killswitch:
        delete = False
    root_resolved = root.resolve()
    names = INTERMEDIATES if include_master else \
        tuple(n for n in INTERMEDIATES if n not in KEEP_FOR_QC)
    files, problems = [], []
    if blocked_by_killswitch:
        problems.append(f"delete blocked: {CLEANUP_ENV}=0 disables all "
                        "deletion — sweep downgraded to dry-run")
    for renders in sorted(root.glob("*/renders")):
        for name in names:
            for path in sorted(renders.rglob(name)):
                try:
                    resolved = path.resolve()
                    resolved.relative_to(root_resolved)
                except (OSError, ValueError) as e:
                    problems.append(f"skipped (outside projects root): "
                                    f"{path}: {e}")
                    continue
                try:
                    size = path.stat().st_size
                except OSError as e:
                    problems.append(f"stat failed for {path}: {e}")
                    continue
                files.append({"path": str(path), "bytes": size})
    if delete:
        for entry in files:
            try:
                Path(entry["path"]).unlink()
                entry["deleted"] = True
            except OSError as e:
                entry["deleted"] = False
                entry["error"] = str(e)
                problems.append(f"delete failed for {entry['path']}: {e}")
        deleted_bytes = sum(e["bytes"] for e in files if e.get("deleted"))
    else:
        deleted_bytes = 0
    report = {
        "mode": "delete" if delete else "dry-run",
        "include_master": include_master,
        "strays": len(files),
        "bytes_reclaimable": sum(e["bytes"] for e in files),
        "bytes_deleted": deleted_bytes,
        "files": files,
        "problems": problems,
    }
    if blocked_by_killswitch:
        report["cleanup_killswitch"] = True
    return report


# --- orchestration -----------------------------------------------------------

def mixdown(project, draft, final, out, *, bgm=None, work_dir=None,
            keep_master=True, target_lufs=DEFAULT_TARGET_LUFS,
            true_peak=DEFAULT_TRUE_PEAK, lra=DEFAULT_LRA, timing_path=None):
    """Full master-audio mixdown with trap-guarded fail-open teardown.

    Returns a summary dict. Raises MixdownError on any step failure — the
    finally-block still runs the teardown in that case.
    """
    project = Path(project)
    timing_path = Path(timing_path) if timing_path else project / "assets" / "scene_timing.json"
    work = Path(work_dir) if work_dir else project / "renders" / "_master_work"
    if bgm is None:
        bgm = REPO / "remotion-composer" / "public" / project.name / "bgm.mp3"
    draft, final, out, bgm = Path(draft), Path(final), Path(out), Path(bgm)
    for label, path in (("draft", draft), ("final", final), ("bgm", bgm)):
        if not path.is_file():
            raise InputError(f"{label} input not found: {path}")
    try:
        timing = json.loads(timing_path.read_text(encoding="utf-8"),
                            parse_constant=lambda x: float(x))
    except (OSError, json.JSONDecodeError, UnicodeDecodeError) as e:
        raise InputError(f"unreadable scene_timing.json ({timing_path}): {e}") from e
    try:
        # GateError (bgm_gate) is NOT a mixdown InputError — convert at the
        # boundary so malformed timing values keep the exit-2 envelope.
        duration = episode_duration(timing)
    except GateError as e:
        raise InputError(f"invalid scene_timing ({timing_path}): {e}") from e
    out.parent.mkdir(parents=True, exist_ok=True)
    warnings: list[str] = []
    try:
        work.mkdir(parents=True, exist_ok=True)
        print(f"video duration target: {duration}s", file=sys.stderr)
        extract_voice_sfx(draft, work)
        build_bgm_loop(bgm, duration, work)
        duck_and_mix(work)
        stats = loudnorm_pass_stats(work, target_lufs, true_peak, lra)
        print(f"pass1: I={stats[0]} TP={stats[1]} LRA={stats[2]} TH={stats[3]}",
              file=sys.stderr)
        loudnorm_apply(work, stats, target_lufs, true_peak, lra)
        mux(final, work, out)
        qc_dir = project / "renders" / "audio_stems"
        retained = retain_qc_stems(work, qc_dir)
        print(f"qc stems retained: {qc_dir}/{', '.join(retained)}", file=sys.stderr)
    finally:
        keep = KEEP_FOR_QC if keep_master else ()
        removed, problems = cleanup_intermediates(work, keep=keep)
        warnings.extend(problems)
        for w in warnings:
            print(f"WARNING (fail-open): {w}", file=sys.stderr)
    return {
        "operation": "mixdown",
        "episode_seconds": duration,
        "output": str(out),
        "work_dir": str(work),
        "qc_stems_dir": str(qc_dir),
        "qc_stems_retained": retained,
        "intermediates_removed": removed,
        "mix_master_retained": bool(keep_master),
        "cleanup_warnings": warnings,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Shared master-audio mixdown + teardown + sweep.")
    ap.add_argument("--project", help="project dir (renders/_master_work + assets/scene_timing.json)")
    ap.add_argument("--draft", help="DRAFT render mp4 (voice+SFX timing)")
    ap.add_argument("--final", help="FINAL video mp4 (video-only mux target)")
    ap.add_argument("--out", help="output mp4")
    ap.add_argument("--bgm", help="BGM source (default: remotion-composer/public/<slug>/bgm.mp3)")
    ap.add_argument("--no-keep-master", action="store_true",
                    help="delete mix_master.wav too (default: retained for QC)")
    ap.add_argument("--timing", help="override scene_timing.json path")
    ap.add_argument("--sweep", action="store_true",
                    help="one-time stray-intermediate sweep across project renders dirs (DRY-RUN by default)")
    ap.add_argument("--projects-root", default=str(REPO / "projects"),
                    help="root to sweep (default: <repo>/projects)")
    ap.add_argument("--delete", action="store_true",
                    help="with --sweep: actually delete the reported strays")
    ap.add_argument("--include-master", action="store_true",
                    help="with --sweep: also report/delete retained QC masters (mix_master.wav) — off by default")
    args = ap.parse_args(argv)

    # Review major #4: SIGTERM/SIGHUP must unwind through the try/finally
    # teardown (converted to SystemExit), not kill the process mid-mixdown.
    install_signal_teardown_handlers()

    if args.no_keep_master:
        # Review minor #7: the QC validator manifest 'mix' key points at
        # mix_master.wav (KEEP_FOR_QC) — deleting it breaks QC on this render.
        print("WARNING: --no-keep-master deletes mix_master.wav; the QC "
              "manifest 'mix' key requires it (mix_validator.py) — QC of "
              "this render will not find its master audio.", file=sys.stderr)

    if args.sweep:
        report = sweep(args.projects_root, delete=args.delete,
                       include_master=args.include_master)
        print(json.dumps(report, indent=1))
        if not args.delete and report["strays"]:
            print("DRY-RUN — re-run with --sweep --delete to reclaim "
                  f"{report['bytes_reclaimable']} bytes", file=sys.stderr)
        return 0

    missing = [f"--{f}" for f, v in (("project", args.project), ("draft", args.draft),
                                     ("final", args.final), ("out", args.out)) if not v]
    if missing:
        ap.error("mixdown mode requires " + " ".join(missing) +
                 " (or pass --sweep for the stray-cleanup report)")
    try:
        summary = mixdown(args.project, args.draft, args.final, args.out,
                          bgm=args.bgm, timing_path=args.timing,
                          keep_master=not args.no_keep_master)
    except InputError as e:
        print(json.dumps({"operation": "mixdown", "verdict": "error",
                          "errors": [str(e)]}, indent=1), file=sys.stderr)
        return 2
    except MixdownError as e:
        print(json.dumps({"operation": "mixdown", "verdict": "failed",
                          "errors": [str(e)]}, indent=1), file=sys.stderr)
        return 1
    print(json.dumps(summary, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
