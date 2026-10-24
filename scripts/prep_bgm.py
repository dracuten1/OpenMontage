#!/usr/bin/env python
"""Prep BGM for news-daily-20261017: measure RMS windows, cut from stable body,
loudnorm -24 LUFS, fades 1.2/2.2s, encode mp3. Run with repo venv."""
import json
import re
import statistics
import subprocess
from pathlib import Path

ROOT = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = ROOT / "projects" / "news-daily-20261017"
MUSIC = PROJ / "assets" / "music"
PUBLIC = ROOT / "remotion-composer" / "public" / "news-daily-20261017"
SRC = Path("/Users/tuyennguyen/project/media-library/bgm/news/Fearless First.mp3")
WIN = 2.0  # seconds per RMS window


def run(cmd: list) -> str:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"cmd failed: {' '.join(cmd[:6])}...: {r.stderr[-300:]}")
    return r.stderr + r.stdout


def rms_windows() -> list:
    import audioop
    import math
    raw = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(SRC),
         "-ar", "48000", "-ac", "1", "-f", "s16le", "-"],
        capture_output=True, check=True).stdout
    win_bytes = int(48000 * WIN) * 2
    vals = []
    for i in range(0, len(raw) - win_bytes + 1, win_bytes):
        rms = audioop.rms(raw[i:i + win_bytes], 2)
        vals.append(20 * math.log10(rms / 32768.0) if rms > 0 else -90.0)
    if len(vals) < 8:
        raise RuntimeError(f"too few RMS windows: {len(vals)}")
    return vals


def main() -> None:
    MUSIC.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    total = json.loads((PROJ / "audio" / "scene_timing.json").read_text())["total_duration_seconds"]
    out_len = round(total + 1.0, 3)

    rms = rms_windows()
    body = rms[5:]  # >= 10s in
    med = statistics.median(body)
    thresh = med - 3.0
    cut = None
    for i in range(0, len(rms) - 1):
        if rms[i] >= thresh and rms[i + 1] >= thresh:
            cut = i * WIN
            break
    if cut is None:
        cut = 0.0
    # ensure enough source length from cut point
    dur_log = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                   "-of", "csv=p=0", str(SRC)])
    src_dur = float(dur_log.strip())
    if src_dur - cut < out_len + 0.5:
        cut = max(0.0, src_dur - out_len - 0.5)
    print(f"  rms windows={len(rms)} median_body={med:.1f}dB cut={cut:.1f}s len={out_len}s")

    wav = MUSIC / "bgm.wav"
    mp3 = MUSIC / "bgm.mp3"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-ss", f"{cut:.3f}", "-t", f"{out_len:.3f}", "-i", str(SRC),
         "-af", f"loudnorm=I=-24:TP=-2:LRA=7,"
                f"afade=t=in:st=0:d=1.2,afade=t=out:st={out_len - 2.2:.3f}:d=2.2",
         "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(wav)])
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
         "-c:a", "libmp3lame", "-q:a", "4", str(mp3)])
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(mp3)], capture_output=True, text=True)
    bgm_dur = float(d.stdout.strip())
    assert abs(bgm_dur - out_len) <= 0.3, f"bgm dur {bgm_dur} != {out_len}"

    (PUBLIC / "bgm.mp3").write_bytes(mp3.read_bytes())

    manifest_path = PROJ / "artifacts" / "asset_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["assets"] = [a for a in manifest["assets"] if a["id"] != "bgm"]
    manifest["assets"].append({
        "id": "bgm", "type": "music", "path": "assets/music/bgm.mp3",
        "source_tool": "ffmpeg+loudnorm", "scene_id": "all",
        "duration_seconds": round(bgm_dur, 3), "format": "mp3",
        "provider": "incompetech (Kevin MacLeod)", "license": "CC BY 4.0",
        "cost_usd": 0.0,
        "generation_summary": (
            'Track "Fearless First" by Kevin MacLeod (incompetech.com), '
            "CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ — reused from news 15-16/10 mix. "
            f"Cut from stable body at {cut:.1f}s (intro RMS weak, not boosted), len {out_len}s, "
            "loudnorm I=-24:TP=-2:LRA=7, fade in 1.2s / out 2.2s. Remotion reference volume 0.16."
        ),
    })
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({"job": "bgm", "cut_seconds": round(cut, 2),
                      "bgm_seconds": round(bgm_dur, 3), "source_seconds": round(src_dur, 1)}))


if __name__ == "__main__":
    main()
