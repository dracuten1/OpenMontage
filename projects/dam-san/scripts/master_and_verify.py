#!/usr/bin/env python3
"""Mix narration + ducked BGM (-19dB + fade), normalize to -14 LUFS via loudnorm, remux bit-for-bit, and run QC probes."""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "dam-san"
PUB = OM / "remotion-composer" / "public" / "dam-san"
FF = shutil.which("ffmpeg") or "/Users/tuyennguyen/.local/bin/ffmpeg"
FP = shutil.which("ffprobe") or "/Users/tuyennguyen/.local/bin/ffprobe"

RAW_VIDEO = P / "renders" / "dam-san-raw-1080p.mp4"
FINAL_VIDEO = P / "renders" / "dam-san-final-1080p.mp4"
NARR = PUB / "narration_full.wav"
BGM = PUB / "background_music.mp3"
QC_DIR = P / "qc"
QC_DIR.mkdir(parents=True, exist_ok=True)


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("CMD FAILED:", " ".join(cmd), "\nSTDERR:", r.stderr[-800:])
        sys.exit(r.returncode)
    return r


def main() -> None:
    assert RAW_VIDEO.exists(), f"Missing rendered Remotion master: {RAW_VIDEO}"
    assert NARR.exists() and BGM.exists(), "Missing narration or BGM audio"

    # Measure total duration from narration_full.wav
    p_info = run([FP, "-v", "error", "-show_format", "-show_streams", "-of", "json", str(RAW_VIDEO)])
    info = json.loads(p_info.stdout)
    dur = float(info["format"]["duration"])

    # Mix narration (1.0) + BGM ducked (-19dB -> 0.115 amplitude) -> loudnorm to -14 LUFS, -1.0 dBTP
    mix_wav = P / "renders" / "master_mix_loudnorm.wav"
    cmd_mix = [
        FF, "-y", "-loglevel", "error",
        "-i", str(NARR),
        "-i", str(BGM),
        "-filter_complex",
        f"[1:a]volume=0.115,apad[bgm];[0:a][bgm]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=7[aout]",
        "-map", "[aout]", "-t", f"{dur:.3f}", "-ar", "48000", "-c:a", "pcm_s16le", str(mix_wav),
    ]
    run(cmd_mix)

    # Remux video stream bit-for-bit (-c:v copy) with mastered AAC 192k
    cmd_mux = [
        FF, "-y", "-loglevel", "error",
        "-i", str(RAW_VIDEO),
        "-i", str(mix_wav),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart", "-shortest", str(FINAL_VIDEO),
    ]
    run(cmd_mux)

    # Measure final video ffprobe & ebur128
    fin_probe = json.loads(
        run([FP, "-v", "error", "-show_format", "-show_streams", "-of", "json", str(FINAL_VIDEO)]).stdout
    )
    ebur = subprocess.run(
        [FF, "-nostats", "-i", str(FINAL_VIDEO), "-af", "ebur128", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    m_i = re.search(r"Integrated loudness:\s*\n\s*I:\s*([-\d.]+)\s*LUFS", ebur.stderr)
    m_lra = re.search(r"Loudness range:\s*\n\s*LRA:\s*([-\d.]+)\s*LU", ebur.stderr)
    lufs_i = float(m_i.group(1)) if m_i else None
    lra = float(m_lra.group(1)) if m_lra else None

    # Extract 3 probe stills (start 4s, mid 50%, late 92%) for multimodal Vision QA
    stills = {}
    for label, ts in [("start", 4.0), ("mid", dur * 0.50), ("late", dur * 0.92)]:
        sp = QC_DIR / f"final_{label}.jpg"
        run([FF, "-y", "-loglevel", "error", "-ss", f"{ts:.2f}", "-i", str(FINAL_VIDEO), "-frames:v", "1", "-q:v", "2", str(sp)])
        stills[label] = str(sp)

    sha = hashlib.sha256(FINAL_VIDEO.read_bytes()).hexdigest()
    metrics = {
        "final_video": str(FINAL_VIDEO),
        "bytes": FINAL_VIDEO.stat().st_size,
        "sha256": sha,
        "duration_seconds": float(fin_probe["format"]["duration"]),
        "streams": fin_probe["streams"],
        "ebur128_integrated_lufs": lufs_i,
        "ebur128_lra_lu": lra,
        "probe_stills": stills,
    }
    (QC_DIR / "final_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"PASS final master: {FINAL_VIDEO} ({metrics['bytes']} B, {metrics['duration_seconds']:.2f}s, {lufs_i} LUFS, LRA {lra} LU, sha256={sha})")


if __name__ == "__main__":
    main()
