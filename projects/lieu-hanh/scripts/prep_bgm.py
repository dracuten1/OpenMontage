#!/usr/bin/env python3
"""BGM machine audition + prep for lieu-hanh.
Audit: duration, loudness (EBU R128 via ffmpeg), true peak, silence ratio, clipping.
Prep: loudnorm to -24 LUFS, loop to >= 902s, gentle fades, AAC 192k -> public/lieu-hanh/background_music.mp3."""
import json, subprocess, sys
from pathlib import Path

FF = "/Users/tuyennguyen/.hermes/tools/ffmpeg-9.0.1-darwin-arm64/ffmpeg"
SRC = Path("/Users/tuyennguyen/project/media-library/bgm/explainer/Mesmerize.mp3")
OUT = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/lieu-hanh/background_music.mp3")
TARGET_S = 902.0

# duration
p = subprocess.run([FF, "-hide_banner", "-i", str(SRC)], capture_output=True, text=True)
dur = None
for tok in p.stderr.replace("\r", "\n").split():
    if tok.startswith("Duration:") or (dur is None and ":" in tok and tok.count(":") == 2):
        pass
import re
m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", p.stderr)
if m:
    dur = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
print(f"source duration: {dur:.2f}s")

# loudness full pass
p2 = subprocess.run([FF, "-hide_banner", "-i", str(SRC), "-af", "loudnorm=I=-24:TP=-2:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
mm = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p2.stderr)
stats = json.loads(mm.group(0)) if mm else {}
print("loudness:", json.dumps({k: stats.get(k) for k in ("input_i", "input_tp", "input_lra")}))

# silence + clipping via astats
p3 = subprocess.run([FF, "-hide_banner", "-i", str(SRC), "-af", "silencedetect=noise=-45dB:d=3,astats=metadata=1", "-f", "null", "-"], capture_output=True, text=True)
sil = re.findall(r"silence_duration:\s*([\d.]+)", p3.stderr)
pk = re.search(r"Peak level dB:\s*(-?[\d.]+)", p3.stderr)
print(f"silences>=3s: {len(sil)} (durations {sil[:5]}), peak {pk.group(1) if pk else '?'} dB")

ok = dur and dur > 30 and stats and float(stats["input_tp"]) < -1.0 and len(sil) == 0
print("MACHINE AUDITION:", "PASS" if ok else "CHECK-MANUALLY")

loops = int(TARGET_S // dur) + 1
OUT.parent.mkdir(parents=True, exist_ok=True)
cmd = [FF, "-y", "-loglevel", "error",
       "-stream_loop", str(loops - 1), "-i", str(SRC),
       "-t", str(TARGET_S),
       "-af", "loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=2,afade=t=out:st=" + str(TARGET_S - 4) + ":d=4",
       "-ar", "44100", "-b:a", "192k", str(OUT)]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print("PREP FAIL", r.stderr[:300])
    sys.exit(1)
p4 = subprocess.run([FF, "-hide_banner", "-i", str(OUT)], capture_output=True, text=True)
m4 = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", p4.stderr)
d4 = int(m4.group(1)) * 3600 + int(m4.group(2)) * 60 + float(m4.group(3)) if m4 else 0
print(f"PREP OK: {OUT} {OUT.stat().st_size}B {d4:.1f}s loudnorm -24 LUFS TP -2, fades 2s/4s")
