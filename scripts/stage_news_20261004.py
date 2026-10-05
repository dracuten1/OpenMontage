"""Stage news-20261004 assets into remotion-composer/public/news-20261004/.

Builds narration_full.wav (each scene WAV padded to scene_duration, concatenated,
so scene i audio starts exactly at scene_timing start_seconds) and a compact words.json.
No atempo / remix. Run from repo root: .venv/bin/python scripts/stage_news_20261004.py
"""
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
P = ROOT / "projects" / "news-20261004"
D = ROOT / "remotion-composer" / "public" / "news-20261004"
D.mkdir(parents=True, exist_ok=True)

timing = json.loads((P / "artifacts" / "scene_timing.json").read_text())

for f in sorted((P / "assets" / "audio").glob("narration_s*.wav")):
    shutil.copy2(f, D / f.name)
for f in sorted((P / "assets" / "images").glob("img_*.png")):
    shutil.copy2(f, D / f.name)
shutil.copy2(P / "assets" / "music" / "bgm.mp3", D / "bgm.mp3")
shutil.copy2(P / "assets" / "audio" / "transcripts" / "narration_words.json", D / "narration_words.json")

args = ["ffmpeg", "-y", "-v", "error"]
fc = []
labels = ""
for i, s in enumerate(timing):
    args += ["-i", str(P / s["audio_path"])]
    fc.append(
        f"[{i}:a]aresample=48000,aformat=channel_layouts=mono,apad=whole_dur={s['scene_duration']}[a{i}]"
    )
    labels += f"[a{i}]"
fc.append(f"{labels}concat=n={len(timing)}:v=0:a=1[out]")
args += ["-filter_complex", ";".join(fc), "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s16le",
         str(D / "narration_full.wav")]
subprocess.run(args, check=True)

words = json.loads((P / "assets" / "audio" / "transcripts" / "narration_words.json").read_text())
bad = [w for w in words if abs(w["global_start"] - (w["scene_start_seconds"] + w["clip_start"])) > 0.002]
sc = {s["scene_id"]: s for s in timing}
bad2 = [w for w in words if abs(sc[w["scene_id"]]["start_seconds"] - w["scene_start_seconds"]) > 0.002]
print("words", len(words), "global_start mismatches", len(bad), "scene_start mismatches", len(bad2))
out = {}
for w in words:
    out.setdefault(w["scene_id"], []).append({"word": w["word"], "start": w["clip_start"], "end": w["clip_end"]})
(D / "words.json").write_text(json.dumps(out, ensure_ascii=False))
print({k: len(v) for k, v in out.items()})
