"""Stage aivn-20261005 assets into remotion-composer/public/aivn-20261005/.

Concatenates the 9 scene narration WAVs into narration_full.wav padded to scene durations,
copies images, bgm, and exports words.json and scene_timing.json.
"""
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
P = ROOT / "projects" / "aivn-20261005"
D = ROOT / "remotion-composer" / "public" / "aivn-20261005"
D.mkdir(parents=True, exist_ok=True)

timing_file = P / "artifacts" / "scene_timing.json"
timing = json.loads(timing_file.read_text())

# Copy scene_timing.json
shutil.copy2(timing_file, D / "scene_timing.json")

# Copy audio WAVs
for f in sorted((P / "assets" / "audio").glob("narration_s*.wav")):
    shutil.copy2(f, D / f.name)

# Copy images
for f in sorted((P / "assets" / "images").glob("scene_*.png")):
    shutil.copy2(f, D / f.name)

# Copy bgm
shutil.copy2(P / "assets" / "music" / "bgm.mp3", D / "bgm.mp3")

# Copy subtitles if exists
if (P / "assets" / "subtitles.srt").exists():
    shutil.copy2(P / "assets" / "subtitles.srt", D / "subtitles.srt")

# Build narration_full.wav using ffmpeg
args = ["ffmpeg", "-y", "-v", "error"]
fc = []
labels = ""
for i, s in enumerate(timing):
    audio_full_path = P / s["audio_path"]
    args += ["-i", str(audio_full_path)]
    fc.append(
        f"[{i}:a]aresample=48000,aformat=channel_layouts=mono,apad=whole_dur={s['scene_duration']}[a{i}]"
    )
    labels += f"[a{i}]"
fc.append(f"{labels}concat=n={len(timing)}:v=0:a=1[out]")
args += [
    "-filter_complex", ";".join(fc),
    "-map", "[out]",
    "-ar", "48000",
    "-c:a", "pcm_s16le",
    str(D / "narration_full.wav")
]
subprocess.run(args, check=True)

# Process words.json
words_file = P / "artifacts" / "narration_words.json"
words = json.loads(words_file.read_text())

out = {}
for w in words:
    sid = w["scene_id"]
    # map both "scene_01" and "s01"
    num = sid.replace("scene_", "")
    short_id = f"s{int(num):02d}"
    item = {"word": w["word"], "start": round(w["clip_start"], 3), "end": round(w["clip_end"], 3)}
    out.setdefault(sid, []).append(item)
    out.setdefault(short_id, []).append(item)

(D / "words.json").write_text(json.dumps(out, ensure_ascii=False, indent=2))
print("Staging complete.")
print("Words count per scene:", {k: len(v) for k, v in out.items() if k.startswith("s0")})
