#!/usr/bin/env python3
"""BGM prep dam-san ('The Complex' — Kevin MacLeod, CC-BY-4.0, unused in E04-S3E01)."""
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

FF = shutil.which("ffmpeg") or "/Users/tuyennguyen/.local/bin/ffmpeg"
SRC = Path("/Users/tuyennguyen/project/media-library/bgm/risk/The Complex.mp3")
SRC_SHA256 = "c270fb44a69828f6cae7412e077a38b92d55015d30ced549d0d477f864e7e41e"
P = Path("/Users/tuyennguyen/project/OpenMontage/projects/dam-san")
OUT = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/dam-san/background_music.mp3")

actual_sha = hashlib.sha256(SRC.read_bytes()).hexdigest()
assert actual_sha == SRC_SHA256, f"SHA mismatch: {actual_sha}"

st = json.loads((P / "artifacts" / "scene_timing.json").read_text(encoding="utf-8"))
TARGET_S = float(st["total_seconds"]) + 1.0

p = subprocess.run([FF, "-hide_banner", "-i", str(SRC)], capture_output=True, text=True)
m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", p.stderr)
dur = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)) if m else 267.69
loops = int(TARGET_S // dur) + 1
OUT.parent.mkdir(parents=True, exist_ok=True)

cmd = [
    FF, "-y", "-loglevel", "error",
    "-stream_loop", str(loops - 1), "-i", str(SRC),
    "-t", f"{TARGET_S:.2f}",
    "-af", f"loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=2,afade=t=out:st={TARGET_S - 5:.2f}:d=5",
    "-ar", "48000", "-b:a", "192k", str(OUT),
]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print("PREP FAIL", r.stderr[:400])
    sys.exit(1)
p4 = subprocess.run([FF, "-hide_banner", "-i", str(OUT)], capture_output=True, text=True)
m4 = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", p4.stderr)
d4 = int(m4.group(1)) * 3600 + int(m4.group(2)) * 60 + float(m4.group(3)) if m4 else 0
print(f"OK background_music.mp3 {d4:.2f}s (target {TARGET_S:.2f}s)")
