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
import wave
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
BGM_VOLUME = 0.22
DEFAULT_BGM_TARGET_LUFS = -16.0
QUIET_INTRO_THRESHOLD_DB = -22.0


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


def _volumedetect_mean_db(path: Path, *, ss: float = 0.0, duration: float = 30.0) -> float | None:
    """Measure mean_volume (dB) on a window of `path` using ffmpeg volumedetect."""
    cmd = ["ffmpeg", "-hide_banner", "-nostats"]
    if ss > 0:
        cmd.extend(["-ss", f"{ss:.3f}"])
    cmd.extend(["-t", f"{duration:.3f}", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"])
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.TimeoutExpired):
        return None
    m = re.search(r"mean_volume:\s*([+-]?\d+(?:\.\d+)?)\s*dB", p.stderr or "")
    return float(m.group(1)) if m else None


def prepare_bgm_bed(
    bgm_path: Path | str,
    duration: float,
    work: Path | str,
    *,
    target_lufs: float = DEFAULT_BGM_TARGET_LUFS,
    quiet_threshold_db: float = QUIET_INTRO_THRESHOLD_DB,
    out_path: Path | str | None = None,
) -> Path:
    """Trim quiet filmscore intros (mean < -22 dB), loop/trim to `duration`,
    and loudness-normalize the BGM bed to -16 LUFS into `out_path` (default `work/bgm_loop.wav`).
    """
    bgm_p = Path(bgm_path)
    work_dir = Path(work)
    work_dir.mkdir(parents=True, exist_ok=True)
    dst = Path(out_path) if out_path else (work_dir / "bgm_loop.wav")

    trim_ss = 0.0
    try:
        from tools.qc.bgm_gate import probe_duration
        bgm_dur = probe_duration(bgm_p)
    except Exception:
        bgm_dur = 0.0

    if bgm_dur > 20.0:
        intro_mean = _volumedetect_mean_db(bgm_p, ss=0.0, duration=min(30.0, bgm_dur))
        if intro_mean is not None and intro_mean < quiet_threshold_db:
            max_probe = min(bgm_dur - 10.0, 90.0)
            offset = 15.0
            while offset <= max_probe:
                win_mean = _volumedetect_mean_db(bgm_p, ss=offset, duration=15.0)
                if win_mean is not None and win_mean >= quiet_threshold_db:
                    trim_ss = offset
                    break
                offset += 15.0

    # Measure raw track loudness to check if loudnorm normalization is feasible
    in_args: list[str | Path] = ["-stream_loop", "-1"]
    if trim_ss > 0:
        in_args.extend(["-ss", f"{trim_ss:.3f}"])
    in_args.extend([
        "-i", bgm_p,
        "-t", f"{duration:.6f}",
        "-af", f"loudnorm=I={target_lufs:.1f}:TP=-2.0:LRA=5",
        "-ac", "2",
        "-ar", DEFAULT_SAMPLERATE,
        dst,
    ])
    run_ffmpeg(in_args)
    return dst


def duck_and_mix(work):
    """3. Volume 0.22 + sidechain-duck BGM under narration, mix with base."""
    filter_complex = (
        "[0:a]volume=%s[bgm];"
        "[bgm][1:a]sidechaincompress=threshold=0.015:ratio=14:attack=80:release=120:makeup=1[bgmduck];"
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


def _parse_sfx_entries(text: str, *, secs: dict[str, dict], fps: float, sfx_dir: Path) -> list[tuple[float, Path, float]]:
    """Parse BLOCK_SFX and SCENE_SFX structures from Episode.tsx source."""
    cues: list[tuple[float, Path, float]] = []
    m_block = re.search(r"BLOCK_SFX\b[^=]*=\s*\{([^}]*)\}", text, re.DOTALL)
    if m_block:
        for m in re.finditer(r"(\d+)\s*:\s*[\"']([^\"']+)[\"']", m_block.group(1)):
            snum = int(m.group(1))
            fname = m.group(2)
            sec = secs.get(f"scene-{snum}")
            sfx_file = sfx_dir / fname
            if sec is not None and sfx_file.is_file():
                cues.append((float(sec["start_seconds"]), sfx_file, 0.28))

    m_scene_sfx = re.search(r"SCENE_SFX\b[^=]*=\s*\{", text)
    if m_scene_sfx:
        start = text.find("{", m_scene_sfx.start())
        depth = 0
        end = start
        for idx_c in range(start, len(text)):
            ch = text[idx_c]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = idx_c
                    break
        body = text[start + 1 : end]
        for m_key in re.finditer(r"\bS(\d+)\s*:\s*\[([^\]]*)\]", body, re.DOTALL):
            snum = int(m_key.group(1))
            sec = secs.get(f"scene-{snum}") or secs.get(f"S{snum:02d}")
            if sec is None:
                continue
            s0 = float(sec["start_seconds"])
            arr_body = m_key.group(2)
            for obj_m in re.finditer(r"\{((?:[^{}]|\$\{[^}]*\})*)\}", arr_body, re.DOTALL):
                obj = obj_m.group(1)
                src_m = re.search(r"(?:sfx/)([A-Za-z0-9_.-]+\.(?:mp3|wav))", obj)
                if not src_m:
                    continue
                sfx_file = sfx_dir / src_m.group(1)
                if not sfx_file.is_file():
                    continue
                delay_m = re.search(r"delayFrames\s*:\s*(\d+)", obj)
                vol_m = re.search(r"volume\s*:\s*([\d.]+)", obj)
                delay_f = int(delay_m.group(1)) if delay_m else 0
                vol = float(vol_m.group(1)) if vol_m else 0.24
                cues.append((s0 + delay_f / fps, sfx_file, vol))
    return cues


def _collect_sfx_cues(episode_dir: Path, timing: dict, sfx_dir: Path) -> list[tuple[float, Path, float]]:
    """Extract composition SFX cues from Episode.tsx (BLOCK_SFX, SCENE_SFX, BrandBumper) and scenes/S*.tsx."""
    cues: list[tuple[float, Path, float]] = []
    if not episode_dir.is_dir() or not sfx_dir.is_dir():
        return cues
    fps = float(timing.get("fps", 30) or 30)
    secs: dict[str, dict] = {}
    for s in timing.get("sections", []):
        if isinstance(s, dict):
            if s.get("scene_id"):
                secs[str(s["scene_id"])] = s
            if s.get("section_id"):
                secs[str(s["section_id"])] = s
    ep_tsx = episode_dir / "Episode.tsx"
    if ep_tsx.is_file():
        ep_text = ep_tsx.read_text(encoding="utf-8")
        cues.extend(_parse_sfx_entries(ep_text, secs=secs, fps=fps, sfx_dir=sfx_dir))

        if "<BrandBumper" in ep_text and not re.search(r"<BrandBumper[^>]*\bstingSrc\s*=\s*\{null\}", ep_text):
            sting_pub = REPO / "remotion-composer" / "public" / "brand" / "kcdt_bumper_sting.wav"
            sting_repo = REPO / "assets" / "brand" / "kcdt-bumper" / "kcdt_bumper_sting.wav"
            sting_path = sting_pub if sting_pub.is_file() else (sting_repo if sting_repo.is_file() else None)
            if sting_path is not None:
                m_bvol = re.search(r"<BrandBumper[^>]*\bstingVolume\s*=\s*\{([\d.]+)\}", ep_text)
                bvol = float(m_bvol.group(1)) if m_bvol else 0.55
                if timing.get("bumper_start_seconds") is not None:
                    bumper_time = float(timing["bumper_start_seconds"])
                elif (
                    str(timing.get("bumper_position") or "").strip().lower() == "intro"
                    or re.search(r"<Sequence\b[^>]*\bfrom=\{\s*0\s*\}[^>]*>[\s\S]{0,160}<BrandBumper", ep_text)
                ):
                    bumper_time = 0.0
                else:
                    sec_ends: list[float] = []
                    for s in timing.get("sections", []):
                        if not isinstance(s, dict):
                            continue
                        if s.get("end_seconds") is not None:
                            sec_ends.append(float(s["end_seconds"]))
                        elif s.get("start_seconds") is not None:
                            s_end = float(s["start_seconds"])
                            if s.get("duration_seconds") is not None:
                                s_end += float(s["duration_seconds"])
                            elif s.get("duration_frames") is not None:
                                s_end += float(s["duration_frames"]) / fps
                            sec_ends.append(s_end)
                    if sec_ends:
                        bumper_time = max(sec_ends)
                    else:
                        bumper_time = max(0.0, float(timing.get("total_seconds", 0.0) or 0.0) - 3.0)
                cues.append((bumper_time, sting_path, bvol))

    scenes_dir = episode_dir / "scenes"
    if scenes_dir.is_dir():
        for sc_file in sorted(scenes_dir.glob("S*.tsx")):
            m_num = re.match(r"S(\d+)\.tsx$", sc_file.name)
            if not m_num:
                continue
            sec = secs.get(f"scene-{int(m_num.group(1))}")
            if sec is None:
                continue
            s0 = float(sec["start_seconds"])
            txt = sc_file.read_text(encoding="utf-8")
            for m in re.finditer(
                r"<Sequence\s+from=\{(\d+)\}[^>]*>\s*<Audio\b(.*?)/>",
                txt,
                re.DOTALL,
            ):
                f_local = int(m.group(1))
                attrs = m.group(2)
                m_src = re.search(r"staticFile\(\s*[\"']sfx/([^\"']+)[\"']\s*\)", attrs)
                if not m_src:
                    continue
                fname = m_src.group(1)
                m_vol = re.search(r"volume\s*=\s*\{([\d.]+)\}", attrs)
                vol = float(m_vol.group(1)) if m_vol else 0.28
                sfx_file = sfx_dir / fname
                if sfx_file.is_file():
                    cues.append((s0 + f_local / fps, sfx_file, vol))
    return cues


def _ebur128_integrated_lufs(wav_path: Path) -> float:
    p = subprocess.run(
        ["ffmpeg", "-nostats", "-hide_banner", "-i", str(wav_path), "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True, timeout=600,
    )
    vals = re.findall(r"I:\s*([-\d.]+)\s*LUFS", p.stderr or "")
    if not vals:
        raise MixdownError(f"ebur128 measurement unavailable for {wav_path}: {(p.stderr or '')[-300:]}")
    return float(vals[-1])


def _fine_trim_loudness(work: Path, target_lufs: float, duration: float) -> None:
    master = work / "mix_master.wav"
    for _ in range(2):
        cur_i = _ebur128_integrated_lufs(master)
        delta_db = target_lufs - cur_i
        if abs(delta_db) <= 0.15:
            break
        tmp = work / "mix_master.adj.wav"
        run_ffmpeg([
            "-i", master,
            "-af", f"volume={delta_db:+.2f}dB,alimiter=limit=-1.6dB:level=false:attack=5:release=60",
            "-ar", DEFAULT_SAMPLERATE, "-ac", "2", "-t", f"{duration:.6f}", tmp,
        ])
        tmp.replace(master)


def _pad_stem_to_duration(src: Path, dst: Path, duration: float) -> None:
    tmp = dst.with_suffix(".pad.wav")
    run_ffmpeg([
        "-i", src,
        "-af", f"apad=whole_dur={duration:.6f}", "-t", f"{duration:.6f}",
        "-ar", DEFAULT_SAMPLERATE, "-ac", "2", tmp,
    ])
    tmp.replace(dst)


def premix_from_stems(
    project,
    *,
    episode_dir=None,
    public_dir=None,
    sfx_dir=None,
    bgm=None,
    timing_path=None,
    sfx_cues_json=None,
    target_lufs=DEFAULT_TARGET_LUFS,
    true_peak=-2.0,
    lra=DEFAULT_LRA,
    no_sfx=False,
    keep_master=True,
):
    """Build lossless QC stems + mix_master.wav directly from per-scene WAVs BEFORE Remotion render.

    Eliminates the draft-render chicken-and-egg override (`mix_validation_failed`)
    and avoids double-AAC extraction loss.
    """
    project = Path(project).resolve()
    if not project.is_dir():
        raise InputError(f"project dir not found: {project}")
    slug = project.name
    ep_dir = Path(episode_dir).resolve() if episode_dir else (REPO / "remotion-composer" / "src" / slug).resolve()
    pub_dir = Path(public_dir).resolve() if public_dir else (REPO / "remotion-composer" / "public" / slug).resolve()
    sfx_root = Path(sfx_dir).resolve() if sfx_dir else (REPO / "remotion-composer" / "public" / "sfx").resolve()
    timing_p = Path(timing_path).resolve() if timing_path else (project / "assets" / "scene_timing.json")
    bgm_p = Path(bgm).resolve() if bgm else (pub_dir / "bgm.mp3")

    if not timing_p.is_file():
        raise InputError(f"scene_timing.json not found: {timing_p}")
    if not bgm_p.is_file():
        raise InputError(f"bgm input not found: {bgm_p}")

    try:
        timing = json.loads(timing_p.read_text(encoding="utf-8"), parse_constant=lambda x: float(x))
        duration = episode_duration(timing)
    except (OSError, json.JSONDecodeError, UnicodeDecodeError, GateError) as e:
        raise InputError(f"invalid scene_timing ({timing_p}): {e}") from e

    sections = timing.get("sections")
    if not isinstance(sections, list) or not sections:
        raise InputError(f"scene_timing.json missing sections[]: {timing_p}")

    voice_entries: list[tuple[float, Path, float]] = []
    for sec in sections:
        sid = str(sec.get("section_id") or "")
        if not sid:
            raise InputError(f"section missing section_id in {timing_p}")
        cand_pub = pub_dir / "audio" / f"voice_{sid}.wav"
        cand_proj = project / "assets" / "audio" / f"voice_{sid}.wav"
        wav_p = cand_pub if cand_pub.is_file() else cand_proj
        if not wav_p.is_file():
            raise InputError(f"voice stem missing for {sid}: tried {cand_pub} and {cand_proj}")
        with wave.open(str(wav_p), "rb") as w:
            vdur = round(w.getnframes() / w.getframerate(), 3)
        voice_entries.append((float(sec["start_seconds"]), wav_p, vdur))

    cues: list[tuple[float, Path, float]] = []
    if not no_sfx:
        auto_sfx_json = (
            Path(sfx_cues_json)
            if sfx_cues_json
            else next(
                (p for p in (project / "assets" / "sfx_cues.json", project / "artifacts" / "sfx_cues.json") if p.is_file()),
                None,
            )
        )
        if auto_sfx_json is not None:
            raw_cues = json.loads(Path(auto_sfx_json).read_text(encoding="utf-8"))
            for item in raw_cues:
                c_path = Path(item["path"]) if "path" in item else (sfx_root / item["file"])
                if not c_path.is_file():
                    raise InputError(f"SFX cue file not found: {c_path}")
                cues.append((float(item["time_seconds"]), c_path, float(item.get("volume", 0.3))))
        else:
            cues = _collect_sfx_cues(ep_dir, timing, sfx_root)

    work = project / "renders" / "_master_work"
    qc_dir = project / "renders" / "audio_stems"
    work.mkdir(parents=True, exist_ok=True)
    qc_dir.mkdir(parents=True, exist_ok=True)

    narration_wav = qc_dir / "narration.wav"
    bgm_wav = qc_dir / "bgm.wav"
    sfx_wav = qc_dir / "sfx.wav"
    mix_master = work / "mix_master.wav"
    premix_narr = work / "mix_base.wav"
    premix_sfx = work / "premix_sfx.wav"
    bgm_ducked = work / "bgm_ducked.wav"
    warnings: list[str] = []

    try:
        # 1. Assemble lossless narration bed from per-scene WAVs
        n_inputs = ["-f", "lavfi", "-t", f"{duration:.6f}", "-i", f"anullsrc=channel_layout=stereo:sample_rate={DEFAULT_SAMPLERATE}"]
        n_filters = []
        n_labels = ["[0:a]"]
        for i, (t_sec, wav_p, _vdur) in enumerate(voice_entries, start=1):
            n_inputs.extend(["-i", str(wav_p)])
            ms = max(0, int(round(t_sec * 1000)))
            n_filters.append(f"[{i}:a]aresample={DEFAULT_SAMPLERATE},aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{i}]")
            n_labels.append(f"[v{i}]")
        n_filters.append(f"{''.join(n_labels)}amix=inputs={len(n_labels)}:duration=first:normalize=0[out]")
        run_ffmpeg([*n_inputs, "-filter_complex", ";".join(n_filters), "-map", "[out]", "-t", f"{duration:.6f}", premix_narr])

        # 2. Trim quiet intro (if any), normalize BGM to -16 LUFS, loop & trim to duration
        prepare_bgm_bed(bgm_p, duration, work)

        # 3. Assemble SFX stem (or silence bed if 0 cues / --no-sfx)
        if cues:
            s_inputs = ["-f", "lavfi", "-t", f"{duration:.6f}", "-i", f"anullsrc=channel_layout=stereo:sample_rate={DEFAULT_SAMPLERATE}"]
            s_filters = []
            s_labels = ["[0:a]"]
            for i, (t_sec, s_path, vol) in enumerate(cues, start=1):
                s_inputs.extend(["-i", str(s_path)])
                ms = max(0, int(round(t_sec * 1000)))
                s_filters.append(
                    f"[{i}:a]aresample={DEFAULT_SAMPLERATE},aformat=channel_layouts=stereo,volume={vol},adelay={ms}|{ms}[s{i}]"
                )
                s_labels.append(f"[s{i}]")
            s_filters.append(f"{''.join(s_labels)}amix=inputs={len(s_labels)}:duration=first:normalize=0[out]")
            run_ffmpeg([*s_inputs, "-filter_complex", ";".join(s_filters), "-map", "[out]", "-t", f"{duration:.6f}", premix_sfx])
        else:
            run_ffmpeg([
                "-f", "lavfi", "-t", f"{duration:.6f}",
                "-i", f"anullsrc=channel_layout=stereo:sample_rate={DEFAULT_SAMPLERATE}",
                premix_sfx,
            ])

        # 4. Sidechain duck BGM under narration + capture ducked BGM stem for mix_validator + mix SFX
        if cues:
            fc = (
                f"[0:a]volume={BGM_VOLUME}[bgm];"
                "[bgm][1:a]sidechaincompress=threshold=0.015:ratio=14:attack=80:release=120:makeup=1,"
                "asplit=2[bgmduck_mix][bgmduck_qc];"
                "[1:a][bgmduck_mix][2:a]amix=inputs=3:duration=first:dropout_transition=0:weights=1 0.85 1[mix]"
            )
            run_ffmpeg([
                "-i", work / "bgm_loop.wav", "-i", premix_narr, "-i", premix_sfx,
                "-filter_complex", fc,
                "-map", "[mix]", "-t", f"{duration:.6f}", work / "mix_bgm.wav",
                "-map", "[bgmduck_qc]", "-t", f"{duration:.6f}", bgm_ducked,
            ])
        else:
            fc = (
                f"[0:a]volume={BGM_VOLUME}[bgm];"
                "[bgm][1:a]sidechaincompress=threshold=0.015:ratio=14:attack=80:release=120:makeup=1,"
                "asplit=2[bgmduck_mix][bgmduck_qc];"
                "[1:a][bgmduck_mix]amix=inputs=2:duration=first:dropout_transition=0:weights=1 0.85[mix]"
            )
            run_ffmpeg([
                "-i", work / "bgm_loop.wav", "-i", premix_narr,
                "-filter_complex", fc,
                "-map", "[mix]", "-t", f"{duration:.6f}", work / "mix_bgm.wav",
                "-map", "[bgmduck_qc]", "-t", f"{duration:.6f}", bgm_ducked,
            ])

        # 5. 2-pass loudnorm + fine trim
        stats = loudnorm_pass_stats(work, target_lufs, true_peak, lra)
        loudnorm_apply(work, stats, target_lufs, true_peak, lra)
        _fine_trim_loudness(work, target_lufs, duration)

        with wave.open(str(mix_master), "rb") as w:
            m_dur = w.getnframes() / w.getframerate()

        # 6. Pad/trim all retained QC stems (including actual ducked BGM!) to match mix_master.wav exact sample duration
        _pad_stem_to_duration(premix_narr, narration_wav, m_dur)
        _pad_stem_to_duration(bgm_ducked, bgm_wav, m_dur)
        _pad_stem_to_duration(premix_sfx, sfx_wav, m_dur)

        # 7. Compute measurable narration/ducking/signal windows + write audio_stems/manifest.json & mix_profile.json
        narration_windows: list[list[float]] = []
        expected_signal_windows: list[list[float]] = []
        prev_end = 0.0
        last_voice_end = 0.0
        for start_s, _wav_p, vdur in voice_entries:
            end_s = min(m_dur, start_s + vdur)
            last_voice_end = max(last_voice_end, end_s)
            if end_s - start_s >= 0.60:
                mid_s = (start_s + end_s) / 2.0
                expected_signal_windows.append([round(max(0.0, mid_s - 0.15), 3), round(min(m_dur, mid_s + 0.15), 3)])
                if start_s >= 0.50 and (start_s - prev_end) >= 0.50:
                    narration_windows.append([round(start_s, 3), round(end_s, 3)])
            prev_end = max(prev_end, end_s)

        stem_windows: dict[str, list[float]] = {}
        if last_voice_end > 0 and (m_dur - last_voice_end) > 0.25:
            stem_windows["narration"] = [0.0, round(min(m_dur, last_voice_end + 0.05), 3)]

        voice_manifest = {}
        for sec, (_t, wav_p, vdur) in zip(sections, voice_entries):
            sid = str(sec["section_id"])
            voice_manifest[f"voice_{sid}"] = {
                "path": str(wav_p),
                "kind": "voice",
                "duration_seconds": vdur,
                "start_frame": sec["start_frame"],
                "frames": sec["duration_frames"],
            }
        manifest_doc = {
            "schema": "openmontage.stems",
            "version": 1,
            "stems": voice_manifest,
            "narration": str(narration_wav),
            "bgm": str(bgm_wav),
            "mix": str(mix_master),
        }
        if not no_sfx:
            manifest_doc["sfx"] = str(sfx_wav)

        mix_profile = {
            "schema": "openmontage.mix-profile",
            "version": 1,
            "target_lufs": float(target_lufs),
            "lufs_tolerance": 0.4,
            "peak_limit": 0.944,
            "silence_threshold": 0.001,
            "boundary_tolerance_seconds": 0.05,
            "ducking": {"min_reduction_db": 10},
            "windows": {
                "narration": narration_windows,
                "expected_silent": [],
                "expected_signal": expected_signal_windows,
                "stem_windows": stem_windows,
            },
            "no_sfx": bool(no_sfx),
            "sfx_mode": "none" if no_sfx else "present_in_composition",
            "declared_not_measured": ["music_masking"] if no_sfx else ["music_masking", "leading_sfx"],
            "notes": f"Pre-mixed from lossless voice stems via mixdown.py --from-stems (BGM -16 LUFS, mix {target_lufs} LUFS, TP {true_peak} dBTP).",
        }
        for target_root in dict.fromkeys((project, ep_dir)):
            stems_out = target_root / "audio_stems"
            stems_out.mkdir(parents=True, exist_ok=True)
            (stems_out / "manifest.json").write_text(json.dumps(manifest_doc, indent=1), encoding="utf-8")
            (stems_out / "mix_profile.json").write_text(json.dumps(mix_profile, indent=1), encoding="utf-8")
            (target_root / "mix_profile.json").write_text(json.dumps(mix_profile, indent=1), encoding="utf-8")
    finally:
        for tmp_wav in (premix_sfx, bgm_ducked):
            if tmp_wav.exists():
                try:
                    tmp_wav.unlink()
                except OSError:
                    pass
        keep = KEEP_FOR_QC if keep_master else ()
        removed, problems = cleanup_intermediates(work, keep=keep)
        warnings.extend(problems)

    return {
        "operation": "premix_from_stems",
        "episode_seconds": duration,
        "mix_duration_seconds": m_dur,
        "cues": len(cues),
        "no_sfx": bool(no_sfx),
        "qc_stems_dir": str(qc_dir),
        "mix_master": str(mix_master),
        "episode_manifest": str(ep_dir / "audio_stems" / "manifest.json"),
        "episode_mix_profile": str(ep_dir / "mix_profile.json"),
        "intermediates_removed": removed,
        "cleanup_warnings": warnings,
    }


def mux_master(project, raw_video, out, *, master_wav=None, preview_720p=None):
    """Mux retained mix_master.wav onto a raw rendered MP4 (-c:v copy) and optional 720p preview."""
    project = Path(project)
    raw_p = Path(raw_video)
    out_p = Path(out)
    master_p = Path(master_wav) if master_wav else (project / "renders" / "_master_work" / "mix_master.wav")
    if not raw_p.is_file():
        raise InputError(f"raw video not found: {raw_p}")
    if not master_p.is_file():
        raise InputError(f"master audio WAV not found: {master_p}")
    out_p.parent.mkdir(parents=True, exist_ok=True)
    run_ffmpeg([
        "-i", raw_p, "-i", master_p,
        "-map", "0:v", "-map", "1:a",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", "-shortest", out_p,
    ])
    preview_out = None
    if preview_720p:
        prev_p = Path(preview_720p)
        prev_p.parent.mkdir(parents=True, exist_ok=True)
        run_ffmpeg([
            "-i", out_p,
            "-vf", "scale=720:1280:flags=lanczos",
            "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
            "-c:a", "copy", "-movflags", "+faststart", prev_p,
        ])
        preview_out = str(prev_p)
    return {
        "operation": "mux_only",
        "raw_video": str(raw_p),
        "master_wav": str(master_p),
        "output": str(out_p),
        "preview_720p": preview_out,
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
    ap.add_argument("--from-stems", action="store_true",
                    help="pre-mix lossless QC stems + mix_master.wav from voice_s*.wav + scene_timing.json BEFORE render")
    ap.add_argument("--episode-dir", help="override remotion-composer/src/<slug> (for --from-stems)")
    ap.add_argument("--public-dir", help="override remotion-composer/public/<slug> (for --from-stems)")
    ap.add_argument("--sfx-dir", help="override remotion-composer/public/sfx (for --from-stems)")
    ap.add_argument("--sfx-cues-json", help="optional JSON list of SFX cues [{time_seconds, file|path, volume}]")
    ap.add_argument("--target-lufs", type=float, default=DEFAULT_TARGET_LUFS)
    ap.add_argument("--true-peak", type=float, default=-2.0)
    ap.add_argument("--lra", type=float, default=DEFAULT_LRA)
    ap.add_argument("--no-sfx", action="store_true", help="declare no-sfx intent in generated mix_profile.json")
    ap.add_argument("--mux-only", metavar="RAW_MP4",
                    help="mux retained mix_master.wav onto an already-rendered raw MP4 (-c:v copy)")
    ap.add_argument("--master-wav", help="override mix_master.wav path for --mux-only")
    ap.add_argument("--preview-720p", help="optional 720x1280 preview output path for --mux-only")
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

    if args.from_stems:
        if not args.project:
            ap.error("--from-stems requires --project")
        try:
            summary = premix_from_stems(
                args.project,
                episode_dir=args.episode_dir,
                public_dir=args.public_dir,
                sfx_dir=args.sfx_dir,
                bgm=args.bgm,
                timing_path=args.timing,
                sfx_cues_json=args.sfx_cues_json,
                target_lufs=args.target_lufs,
                true_peak=args.true_peak,
                lra=args.lra,
                no_sfx=bool(args.no_sfx),
                keep_master=not args.no_keep_master,
            )
        except InputError as e:
            print(json.dumps({"operation": "premix_from_stems", "verdict": "error", "errors": [str(e)]}, indent=1), file=sys.stderr)
            return 2
        except MixdownError as e:
            print(json.dumps({"operation": "premix_from_stems", "verdict": "failed", "errors": [str(e)]}, indent=1), file=sys.stderr)
            return 1
        print(json.dumps(summary, indent=1))
        return 0

    if args.mux_only:
        if not args.project or not args.out:
            ap.error("--mux-only requires --project and --out")
        try:
            summary = mux_master(
                args.project,
                args.mux_only,
                args.out,
                master_wav=args.master_wav,
                preview_720p=args.preview_720p,
            )
        except InputError as e:
            print(json.dumps({"operation": "mux_only", "verdict": "error", "errors": [str(e)]}, indent=1), file=sys.stderr)
            return 2
        except MixdownError as e:
            print(json.dumps({"operation": "mux_only", "verdict": "failed", "errors": [str(e)]}, indent=1), file=sys.stderr)
            return 1
        print(json.dumps(summary, indent=1))
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
