#!/usr/bin/env python3
"""Reusable Gate C verification CLI for final rendered OpenMontage videos.

Runs post-render checks defined in docs/ORCHESTRATION_DOCTRINE.md §2:
  1. Delivery smoke check (`render_episode.py --check-file`)
  2. Container / stream / duration check via `ffprobe`
  3. EBU R128 loudness & true-peak check via `ffmpeg`
  4. 5-frame spotcheck extraction (t=0.05s cover, 3 interior frames, outro)
  5. Speech-bounded (`-t scenes_seconds`, `vad_filter=True`) `faster-whisper` ASR
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def _resolve_project_path(project_dir: Path, target: str) -> Path:
    """Resolve an input/output path relative to project_dir unless already absolute."""
    p = Path(target)
    return p if p.is_absolute() else (project_dir / p)


def load_scene_timing(project_dir: Path) -> dict[str, Any]:
    """Load scene_timing.json from assets/ first, then artifacts/."""
    for rel in ("assets/scene_timing.json", "artifacts/scene_timing.json"):
        candidate = project_dir / rel
        if candidate.is_file():
            return json.loads(candidate.read_text(encoding="utf-8"))
    return {}


def parse_ebur128_summary(stderr_text: str) -> dict[str, float]:
    """Parse integrated LUFS, LRA, and true peak dBFS from ffmpeg ebur128 Summary."""
    summary_idx = stderr_text.rfind("Summary:")
    tail = stderr_text[summary_idx:] if summary_idx != -1 else stderr_text

    i_match = re.search(r"Integrated loudness:\s*[\r\n]+\s*I:\s*([+-]?\d+(?:\.\d+)?)\s*LUFS", tail)
    lra_match = re.search(r"Loudness range:\s*[\r\n]+\s*LRA:\s*([+-]?\d+(?:\.\d+)?)\s*LU", tail)
    tp_match = re.search(r"True peak:\s*[\r\n]+\s*Peak:\s*([+-]?\d+(?:\.\d+)?)\s*dBFS", tail)

    if not (i_match and tp_match):
        raise ValueError("Unable to parse Summary Integrated loudness / True peak from ebur128 output.")

    result: dict[str, float] = {
        "integrated_lufs": float(i_match.group(1)),
        "true_peak_dbfs": float(tp_match.group(1)),
    }
    if lra_match:
        result["lra_lu"] = float(lra_match.group(1))
    return result


def probe_media(video_path: Path) -> dict[str, Any]:
    """Run ffprobe and extract normalized container and stream metadata."""
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(video_path),
        ],
        text=True,
    )
    data = json.loads(out)
    streams = data.get("streams", [])
    v = next((s for s in streams if s.get("codec_type") == "video"), None)
    a = next((s for s in streams if s.get("codec_type") == "audio"), None)
    if v is None:
        raise ValueError(f"Missing video stream in {video_path}")
    if a is None:
        raise ValueError(f"Missing audio stream in {video_path}")

    fps_raw = v.get("avg_frame_rate") or v.get("r_frame_rate") or "0/1"
    num, _, den = str(fps_raw).partition("/")
    fps = round(float(num) / float(den or 1), 3) if "/" in str(fps_raw) else float(fps_raw)

    fmt = data.get("format", {})
    return {
        "resolution": f"{v['width']}x{v['height']}",
        "fps": fps,
        "codec": v.get("codec_name", ""),
        "audio_codec": a.get("codec_name", ""),
        "nb_frames": int(v.get("nb_frames") or 0),
        "duration_seconds": round(float(fmt.get("duration") or v.get("duration") or 0.0), 6),
        "file_size_bytes": int(fmt.get("size") or video_path.stat().st_size),
    }


def compute_sample_timestamps(scenes_seconds: float, total_seconds: float) -> list[tuple[str, float]]:
    """Compute the 5 canonical Gate C frame timestamps (cover, 3 interior, outro)."""
    speech_dur = scenes_seconds if scenes_seconds > 0 else total_seconds
    max_t = max(0.1, total_seconds - 0.1)
    outro_t = (
        scenes_seconds + 1.2
        if scenes_seconds > 0 and total_seconds > scenes_seconds + 1.0
        else max(0.1, total_seconds - 0.5)
    )
    return [
        ("f01_cover.png", min(0.05, max_t)),
        ("f02_early_mid.png", min(round(0.22 * speech_dur, 2), max_t)),
        ("f03_midpoint.png", min(round(0.50 * speech_dur, 2), max_t)),
        ("f04_late_mid.png", min(round(0.78 * speech_dur, 2), max_t)),
        ("f05_outro.png", min(round(outro_t, 2), max_t)),
    ]


def extract_frames(video_path: Path, frames_dir: Path, timestamps: list[tuple[str, float]]) -> list[str]:
    """Extract still PNG spotcheck frames at each named timestamp."""
    frames_dir.mkdir(parents=True, exist_ok=True)
    written: list[str] = []
    for filename, ts in timestamps:
        out_png = frames_dir / filename
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-ss",
                f"{ts:.3f}",
                "-i",
                str(video_path),
                "-frames:v",
                "1",
                str(out_png),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if not out_png.is_file() or out_png.stat().st_size == 0:
            raise RuntimeError(f"Failed to extract Gate C frame: {out_png}")
        written.append(str(out_png))
    return written


def run_speech_bounded_asr(
    video_path: Path,
    project_dir: Path,
    speech_window_seconds: float,
    language: str,
    model_size: str,
) -> dict[str, Any]:
    """Run faster-whisper ASR clipped to spoken timeline to avoid outro bumper hallucinations."""
    from faster_whisper import WhisperModel

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(video_path),
                "-t",
                f"{speech_window_seconds:.3f}",
                "-vn",
                "-ac",
                "1",
                "-ar",
                "16000",
                tmp.name,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        segments, info = model.transcribe(
            tmp.name,
            language=language,
            beam_size=5,
            vad_filter=True,
            word_timestamps=False,
        )
        segs = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()} for s in segments]

    transcript = " ".join(s["text"] for s in segs).strip()
    result: dict[str, Any] = {
        "model": model_size,
        "compute_type": "int8",
        "language": info.language,
        "speech_window_seconds": round(speech_window_seconds, 3),
        "vad_filter": True,
        "segments_count": len(segs),
        "transcript": transcript,
        "segments": segs,
    }

    script_path = project_dir / "artifacts" / "script.json"
    if script_path.is_file():
        script = json.loads(script_path.read_text(encoding="utf-8"))
        script_text = " ".join(str(sec.get("text", "")) for sec in script.get("sections", []))
        tok = lambda s: re.findall(r"[\w]+", s.lower())
        result["token_similarity_vs_script"] = round(
            SequenceMatcher(None, tok(script_text), tok(transcript)).ratio(),
            3,
        )
    return result


def verify_project(
    *,
    project_dir: Path,
    video_rel: str = "renders/final.mp4",
    preview_rel: str = "renders/preview_720p.mp4",
    out_rel: str = "qc/gate_c_final_verify.json",
    frames_rel: str = "qc/gate_c_frames",
    target_lufs: float = -11.0,
    lufs_tolerance: float = 1.0,
    max_true_peak: float = -0.5,
    language: str = "vi",
    whisper_model: str = "small",
    skip_asr: bool = False,
) -> tuple[bool, dict[str, Any], list[str]]:
    """Run all Gate C verification checks and return (passed, report_dict, failures)."""
    failures: list[str] = []
    video_path = _resolve_project_path(project_dir, video_rel)
    if not video_path.is_file() or video_path.stat().st_size == 0:
        return False, {"gate": "gate_c_final_verify", "status": "fail", "failures": [f"Video missing: {video_path}"]}, [f"Video missing: {video_path}"]

    # 1. Delivery smoke check via render_episode.py --check-file
    smoke_proc = subprocess.run(
        [sys.executable, str(REPO_ROOT / "tools/qc/render_episode.py"), "--check-file", str(video_path)],
        capture_output=True,
        text=True,
    )
    smoke_ok = smoke_proc.returncode == 0
    if not smoke_ok:
        failures.append(f"delivery_smoke_failed: {smoke_proc.stdout.strip()} {smoke_proc.stderr.strip()}".strip())

    # 2. ffprobe check + duration guard vs scene_timing.json
    timing = load_scene_timing(project_dir)
    final_probe = probe_media(video_path)
    target_total = float(timing.get("total_seconds") or 0.0)
    scenes_seconds = float(timing.get("scenes_seconds") or final_probe["duration_seconds"])
    if target_total > 0 and abs(final_probe["duration_seconds"] - target_total) > 0.5:
        failures.append(
            f"duration_mismatch: actual={final_probe['duration_seconds']:.3f}s vs target={target_total:.3f}s (>0.5s)"
        )

    preview_probe = None
    if preview_rel:
        preview_path = _resolve_project_path(project_dir, preview_rel)
        if preview_path.is_file():
            preview_probe = probe_media(preview_path)

    # 3. EBU R128 loudness & true-peak check
    ebur_proc = subprocess.run(
        ["ffmpeg", "-i", str(video_path), "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    ebur_metrics: dict[str, float] = {}
    if ebur_proc.returncode != 0:
        failures.append(f"ebur128_failed: ffmpeg exited {ebur_proc.returncode}")
    else:
        ebur_metrics = parse_ebur128_summary(ebur_proc.stderr)
        if abs(ebur_metrics["integrated_lufs"] - target_lufs) > lufs_tolerance:
            failures.append(
                f"lufs_out_of_range: {ebur_metrics['integrated_lufs']} LUFS (target {target_lufs} ± {lufs_tolerance})"
            )
        if ebur_metrics["true_peak_dbfs"] > max_true_peak:
            failures.append(
                f"true_peak_exceeded: {ebur_metrics['true_peak_dbfs']} dBFS (> {max_true_peak})"
            )

    # 4. 5-frame spotcheck extraction
    frames_dir = _resolve_project_path(project_dir, frames_rel)
    timestamps = compute_sample_timestamps(scenes_seconds, final_probe["duration_seconds"])
    frame_paths = extract_frames(video_path, frames_dir, timestamps)

    # 5. Speech-bounded ASR check
    asr_report: dict[str, Any] | None = None
    if not skip_asr:
        asr_report = run_speech_bounded_asr(
            video_path,
            project_dir,
            speech_window_seconds=scenes_seconds,
            language=language,
            model_size=whisper_model,
        )
        if not asr_report.get("transcript"):
            failures.append("asr_empty_transcript: speech-bounded ASR produced empty transcript")

    passed = len(failures) == 0
    report: dict[str, Any] = {
        "gate": "gate_c_final_verify",
        "status": "pass" if passed else "fail",
        "output_path": str(video_path),
        "delivery_smoke": "PASS" if smoke_ok else "FAIL",
        "ffprobe_final": final_probe,
        "ffprobe_preview_720p": preview_probe,
        "ebur128": ebur_metrics,
        "sampled_frames": [
            {"path": p, "timestamp_seconds": ts}
            for p, (_, ts) in zip(frame_paths, timestamps)
        ],
        "asr": asr_report if asr_report is not None else {"skipped": True},
        "failures": failures,
    }

    out_path = _resolve_project_path(project_dir, out_rel)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return passed, report, failures


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run OpenMontage Gate C verification on a rendered MP4.")
    parser.add_argument("--project", required=True, help="Path to projects/<slug>")
    parser.add_argument("--video", default="renders/final.mp4", help="Video path (relative to project or absolute)")
    parser.add_argument("--preview", default="renders/preview_720p.mp4", help="Optional 720p preview path")
    parser.add_argument("--out", default="qc/gate_c_final_verify.json", help="Output JSON report path")
    parser.add_argument("--frames-dir", default="qc/gate_c_frames", help="Directory for 5 extracted PNG frames")
    parser.add_argument("--target-lufs", type=float, default=-11.0)
    parser.add_argument("--lufs-tolerance", type=float, default=1.0)
    parser.add_argument("--max-true-peak", type=float, default=-0.5)
    parser.add_argument("--language", default="vi")
    parser.add_argument("--whisper-model", default="small")
    parser.add_argument("--skip-asr", action="store_true", help="Skip faster-whisper transcription check")
    args = parser.parse_args(argv)

    project_dir = Path(args.project).resolve()
    if not project_dir.is_dir():
        print(f"ERROR — project directory missing: {project_dir}", file=sys.stderr)
        return 2

    passed, report, failures = verify_project(
        project_dir=project_dir,
        video_rel=args.video,
        preview_rel=args.preview,
        out_rel=args.out,
        frames_rel=args.frames_dir,
        target_lufs=args.target_lufs,
        lufs_tolerance=args.lufs_tolerance,
        max_true_peak=args.max_true_peak,
        language=args.language,
        whisper_model=args.whisper_model,
        skip_asr=args.skip_asr,
    )
    if passed:
        eb = report.get("ebur128", {})
        pr = report.get("ffprobe_final", {})
        print(
            f"PASS — gate_c_verify ({pr.get('resolution')}, {pr.get('duration_seconds')}s, "
            f"{eb.get('integrated_lufs')} LUFS / {eb.get('true_peak_dbfs')} dBFS)"
        )
        return 0
    print("FAIL — gate_c_verify rejected")
    for f in failures:
        print(f"- {f}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
