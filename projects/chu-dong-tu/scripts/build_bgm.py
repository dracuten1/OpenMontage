#!/usr/bin/env python
"""S2E03 chu-dong-tu — build BGM bed từ Mesmerize (Kevin MacLeod, CC BY 4.0, media-library):
body loop bằng acrossfade → trim đúng độ dài video → loudnorm I=-24 TP=-2 → fade-out 4s.
Usage: .venv/bin/python projects/chu-dong-tu/scripts/build_bgm.py <target_seconds>
"""
import subprocess
import sys
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = REPO / "projects" / "chu-dong-tu"
SRC = Path("/Users/tuyennguyen/project/media-library/bgm/explainer/Mesmerize.mp3")
OUT = PROJ / "assets" / "music" / "background_music.mp3"
PUB = REPO / "remotion-composer" / "public" / "chu-dong-tu"
OUT.parent.mkdir(parents=True, exist_ok=True)
PUB.mkdir(parents=True, exist_ok=True)

target = float(sys.argv[1]) if len(sys.argv) > 1 else 852.0
BODY_IN, BODY_OUT = 8.0, 416.0  # Mesmerize 7:04 (424s) — bỏ 8s intro, giữ thân 408s
XFADE = 4.0
body_len = BODY_OUT - BODY_IN
n_seg = int((target - BODY_IN) // body_len) + 2
segs = []
for i in range(n_seg):
    seg = PROJ / "assets" / "music" / f"_seg{i}.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(BODY_IN), "-to", str(BODY_OUT),
                    "-i", str(SRC), "-c", "copy", str(seg)], check=True)
    segs.append(seg)

inputs = []
for s in segs:
    inputs += ["-i", str(s)]
if len(segs) == 1:
    filter_complex = "[0:a]anull[out]"
else:
    chains = []
    prev = "[0:a]"
    for i in range(1, len(segs)):
        out = f"[a{i}]"
        chains.append(f"{prev}[{i}:a]acrossfade=d={XFADE}:c1=tri:c2=tri{out}")
        prev = out
    filter_complex = ";".join(chains) + f";{prev}atrim=0:{target},asetpts=PTS-STARTPTS[out]"
tmp = PROJ / "assets" / "music" / "_loop_raw.mp3"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", filter_complex,
                "-map", "[out]", "-c:a", "libmp3lame", "-q:a", "2", str(tmp)], check=True)

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp),
                "-af", f"loudnorm=I=-24:TP=-2:LRA=7,afade=t=out:st={target-4:.2f}:d=4",
                "-c:a", "libmp3lame", "-q:a", "2", str(OUT)], check=True)
for s in segs + [tmp]:
    s.unlink(missing_ok=True)
subprocess.run(["cp", str(OUT), str(PUB / "background_music.mp3")], check=True)

dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                      "-of", "csv=p=0", str(OUT)], capture_output=True, text=True).stdout.strip()
print(f"background_music.mp3: {float(dur):.1f}s (target {target}), Mesmerize {n_seg}-loop acrossfade {XFADE}s, loudnorm I=-24 TP=-2, fade-out 4s")
