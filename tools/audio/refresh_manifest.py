"""Audio duration and timing helpers using ffprobe (if available) or wave module.

Standard fallback: ffprobe on PATH is checked first. If ffprobe is not available or
fails, wave module is used for standard WAV files.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import wave
from pathlib import Path


def probe_audio_duration(file_path: str | Path) -> float | None:
    """Return audio duration in seconds, or None on failure.

    Checks ffprobe first (handles WAV, MP3, AAC, FLAC, etc.).
    Falls back to Python's standard `wave` module for .wav files if ffprobe
    is unavailable or fails.
    """
    path = Path(file_path)
    if not path.is_file():
        return None

    ffprobe = shutil.which("ffprobe")
    if ffprobe:
        try:
            res = subprocess.run(
                [
                    ffprobe,
                    "-v", "quiet",
                    "-print_format", "json",
                    "-show_format",
                    str(path),
                ],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if res.returncode == 0 and res.stdout:
                data = json.loads(res.stdout)
                dur = data.get("format", {}).get("duration")
                if dur is not None:
                    return float(dur)
        except Exception:
            pass

    # Fallback to standard library wave module for WAV files
    if path.suffix.lower() == ".wav":
        try:
            with wave.open(str(path), "rb") as w:
                frames = w.getnframes()
                rate = w.getframerate()
                if rate > 0:
                    return float(frames) / float(rate)
        except Exception:
            pass

    return None


def refresh_asset_manifest(
    manifest_path: str | Path,
    *,
    project_dir: str | Path | None = None,
) -> dict:
    """Re-probe actual audio files and update asset_manifest.json durations.

    Updates duration_seconds per narration/audio asset and recalculates
    metadata.total_audio_speech_duration_seconds.
    """
    manifest_path = Path(manifest_path)
    if not manifest_path.is_file():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")

    if project_dir is None:
        # Infer project_dir from manifest_path (typically <project_dir>/artifacts/asset_manifest.json)
        if manifest_path.parent.name == "artifacts":
            project_dir = manifest_path.parent.parent
        else:
            project_dir = manifest_path.parent
    else:
        project_dir = Path(project_dir)

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    assets = manifest.get("assets", [])
    total_speech_duration = 0.0
    updated_count = 0

    for asset in assets:
        asset_type = asset.get("type")
        raw_path = asset.get("path", "")
        if not raw_path:
            continue

        target_file = Path(raw_path)
        if not target_file.is_absolute():
            target_file = project_dir / target_file

        if asset_type in ("narration", "music", "sfx", "audio") or target_file.suffix.lower() in (".wav", ".mp3", ".m4a", ".flac"):
            probed_dur = probe_audio_duration(target_file)
            if probed_dur is not None:
                asset["duration_seconds"] = round(probed_dur, 3)
                updated_count += 1

        if asset_type == "narration" and asset.get("scene_id") != "all":
            dur = asset.get("duration_seconds")
            if dur is not None:
                total_speech_duration += float(dur)

    metadata = manifest.setdefault("metadata", {})
    if total_speech_duration > 0:
        metadata["total_audio_speech_duration_seconds"] = round(total_speech_duration, 3)

    # Atomic write: temp file in the SAME directory as the target (same
    # filesystem => os.replace is atomic on POSIX). A crash mid-write can
    # never leave a truncated manifest behind — the old file stays intact
    # until the rename lands. Formatting (indent=2, ensure_ascii=False) is
    # byte-identical to the previous direct write; atomicity is the only
    # behavioral change.
    tmp_path = manifest_path.with_name(manifest_path.name + ".tmp")
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        os.replace(tmp_path, manifest_path)
    except BaseException:
        # Best-effort cleanup of the partial temp file; the original
        # manifest on disk was never touched.
        try:
            tmp_path.unlink()
        except OSError:
            pass
        raise

    return {
        "updated_count": updated_count,
        "total_speech_duration": round(total_speech_duration, 3) if total_speech_duration > 0 else None,
        "manifest_path": str(manifest_path),
    }


def main() -> None:
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description="Re-probe audio assets and refresh asset_manifest.json durations."
    )
    parser.add_argument(
        "manifest",
        help="Path to asset_manifest.json or project directory.",
    )
    parser.add_argument(
        "--project-dir",
        default=None,
        help="Project directory root (optional, inferred from manifest path if omitted).",
    )
    args = parser.parse_args()

    target = Path(args.manifest)
    if target.is_dir():
        manifest_file = target / "artifacts" / "asset_manifest.json"
        if not manifest_file.exists():
            manifest_file = target / "asset_manifest.json"
        proj = target
    else:
        manifest_file = target
        proj = Path(args.project_dir) if args.project_dir else None

    if not manifest_file.exists():
        print(f"Error: Manifest file not found at {manifest_file}", file=sys.stderr)
        sys.exit(1)

    res = refresh_asset_manifest(manifest_file, project_dir=proj)
    print(f"Refreshed {res['updated_count']} assets in {res['manifest_path']}.")
    if res['total_speech_duration'] is not None:
        print(f"Updated total_audio_speech_duration_seconds: {res['total_speech_duration']}s")


if __name__ == "__main__":
    main()
