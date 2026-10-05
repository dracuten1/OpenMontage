"""Multi-section TTS rebuild for aivn-20261006 (user pronunciation QC round 2).

Re-TTS target sections with corrected provider_text, re-align, rebuild timings/
words/subtitles/manifest, stage EVERYTHING the composition reads (both public root
and public/audio/ copies). Fixes inherited bugs: scene ids scene_0N (not scene_06),
staging narration_words.json flat + audio/narration_full.wav.
"""
from __future__ import annotations
import json, shutil, subprocess, sys
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))
from tools.audio.vieneu_tts import VieneuTTS
from faster_whisper import WhisperModel
sys.path.insert(0, str(REPO / "scripts"))
from rebuild_s04_audio_and_alignment import (  # reuse helpers
    align_words, make_cues, format_srt_time, get_audio_duration,
)

PROJECT = REPO / "projects" / "aivn-20261006"
SCRIPT_PATH = PROJECT / "artifacts" / "script.json"
AUDIO_DIR = PROJECT / "assets" / "audio"
TRANSCRIPTS = AUDIO_DIR / "transcripts"
PUBLIC = REPO / "remotion-composer" / "public" / "aivn-20261006"

# pronunciation fixes (applied to provider_text)
REPL = [
    ("Hếc-ke Niu", "hách cơ Niu"),
    ("Hếc-ke", "hách cơ"),
    ("hỗn hợp chuyên gia", "Em âu i"),
    ("tô-ken", "tốc cần"),
    ("En-grem", "en gờ ram"),
    ("Súi-ben Pro", "ét đúp liu ben bờ rô"),
    ("Súi-ben Verified", "ét đúp liu ben Verified"),
    ("Súi-ben", "ét đúp liu ben"),
    ("Clô Ô-pút", "Cờ loát Ô bus"),
    ("Đíp-Súi", "đíp ét đúp liu i"),
    ("bằng 1/9", "bằng một phần chín"),
    ("tối ưu Muon", "Muon Optimizer"),
]
# canonical text fix (s07 comma pause)
CANON = [("91% điểm SWE-bench Verified so với model gốc",
          "91% điểm SWE-bench Verified, so với model gốc")]
TARGETS = ["s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09"]

script = json.load(open(SCRIPT_PATH))
sections = script["sections"]
changed = []
for s in sections:
    if s["id"] not in TARGETS:
        continue
    pt = s["delivery_cues"]["provider_text"]
    orig = pt
    for a, b in REPL:
        pt = pt.replace(a, b)
    s["delivery_cues"]["provider_text"] = pt
    tx = s["text"]
    for a, b in CANON:
        tx = tx.replace(a, b)
    s["text"] = tx
    if pt != orig or tx != s["text"]:
        changed.append(s["id"])
json.dump(script, open(SCRIPT_PATH, "w"), ensure_ascii=False, indent=2)
print("[script] provider_text updated for:", changed)

tts = VieneuTTS()
wm = WhisperModel("small", device="cpu", compute_type="int8")

new_dur: dict[str, float] = {}
for sid in TARGETS:
    sec = next(s for s in sections if s["id"] == sid)
    pt = sec["delivery_cues"]["provider_text"]
    raw = AUDIO_DIR / f"raw_{sid}.wav"
    out = AUDIO_DIR / f"narration_{sid}.wav"
    res = tts.execute({"text": pt, "output_path": str(raw.resolve()), "voice": None, "threads": 6})
    if not res.success:
        raise RuntimeError(f"TTS failed {sid}: {res.error}")
    raw_dur = get_audio_duration(raw)
    slot = float(sec["end_seconds"]) - float(sec["start_seconds"])
    filters = ["atempo=1.05", "aresample=48000"] if raw_dur > slot else ["aresample=48000"]
    subprocess.run(["ffmpeg", "-y", "-i", str(raw), "-filter:a", ",".join(filters), str(out)],
                   capture_output=True, check=True)
    raw.unlink(missing_ok=True)
    d = get_audio_duration(out)
    new_dur[sid] = d
    # whisper
    segs, _ = wm.transcribe(str(out), language="vi", word_timestamps=True)
    wwords, wtext = [], []
    for seg in segs:
        wtext.append(seg.text)
        for w in seg.words:
            wwords.append({"word": w.word.strip(), "start": round(float(w.start), 3),
                           "end": round(float(w.end), 3)})
    aligned = align_words(sec["text"].split(), wwords)
    sec["_aligned"] = aligned
    sec["_whisper_words"] = wwords
    sec["_whisper_text"] = " ".join(wtext).strip()
    print(f"[tts] {sid}: raw={raw_dur:.2f}s slot={slot:.1f}s final={d:.2f}s | ASR: {sec['_whisper_text'][:90]}")

# scene timings from actual audio
timings, t0, f0 = [], 0.0, 0
for i, sec in enumerate(sections, start=1):
    sid = f"s{i:02d}"
    d = get_audio_duration(AUDIO_DIR / f"narration_{sid}.wav")
    tail = float(sec.get("delivery_cues", {}).get("pause_after_seconds", 0.5))
    sd = round(d + tail, 3)
    sf = round(sd * 30)
    end_s = round(t0 + sd, 3)
    end_f = f0 + sf
    timings.append({"scene_id": f"scene_{i:02d}", "script_section_id": sid,
                    "audio_path": f"assets/audio/narration_{sid}.wav",
                    "audio_duration": d, "tail_duration": tail, "scene_duration": sd,
                    "scene_frames": sf, "start_seconds": t0, "end_seconds": end_s,
                    "start_frame": f0, "end_frame": end_f})
    t0, f0 = end_s, end_f
print(f"[timing] total={t0:.2f}s frames={f0}")

# transcripts (fresh for targets, offset-update for others)
all_words = []
for i, sec in enumerate(sections, start=1):
    sid = f"s{i:02d}"
    scene_id = f"scene_{i:02d}"
    st = next(t for t in timings if t["script_section_id"] == sid)
    tp = TRANSCRIPTS / f"{sid}.json"
    if sid in TARGETS:
        words = [{"word": w["word"], "scene_id": scene_id, "script_section_id": sid,
                  "scene_start_seconds": st["start_seconds"],
                  "clip_start": w["clip_start"], "clip_end": w["clip_end"],
                  "global_start": round(st["start_seconds"] + w["clip_start"], 3),
                  "global_end": round(st["start_seconds"] + w["clip_end"], 3)}
                 for w in sec["_aligned"]]
        tdata = {"section_id": sid, "scene_id": scene_id,
                 "audio_path": f"assets/audio/narration_{sid}.wav",
                 "audio_duration": st["audio_duration"],
                 "scene_start_seconds": st["start_seconds"],
                 "canonical_text": sec["text"],
                 "provider_text": sec["delivery_cues"]["provider_text"],
                 "whisper_transcript": sec["_whisper_text"],
                 "whisper_words": sec["_whisper_words"], "words": words}
    else:
        tdata = json.load(open(tp))
        tdata["scene_start_seconds"] = st["start_seconds"]
        tdata["audio_duration"] = st["audio_duration"]
        for w in tdata["words"]:
            w["scene_start_seconds"] = st["start_seconds"]
            w["global_start"] = round(st["start_seconds"] + w["clip_start"], 3)
            w["global_end"] = round(st["start_seconds"] + w["clip_end"], 3)
        words = tdata["words"]
    json.dump(tdata, open(tp, "w"), ensure_ascii=False, indent=2)
    all_words.extend(words)

# words + subtitles
flat_words = [{k: w[k] for k in ("word", "scene_id", "script_section_id",
                                 "scene_start_seconds", "clip_start", "clip_end",
                                 "global_start", "global_end")} for w in all_words]
cues = []
for t in timings:
    sw = [w for w in all_words if w["scene_id"] == t["scene_id"]]
    for cue in make_cues(sw):
        cues.append({"start": cue[0]["global_start"], "end": cue[-1]["global_end"],
                     "text": " ".join(cw["word"] for cw in cue)})
with open(PROJECT / "assets" / "subtitles.srt", "w") as f:
    for i, c in enumerate(cues, 1):
        f.write(f"{i}\n{format_srt_time(c['start'])} --> {format_srt_time(c['end'])}\n{c['text']}\n\n")

# stage EVERYTHING composition reads
PUBLIC.mkdir(parents=True, exist_ok=True)
(PUBLIC / "audio").mkdir(exist_ok=True)
json.dump(timings, open(PUBLIC / "scene_timing.json", "w"), ensure_ascii=False, indent=2)
json.dump(flat_words, open(PUBLIC / "narration_words.json", "w"), ensure_ascii=False)
json.dump(flat_words, open(PUBLIC / "words.json", "w"), ensure_ascii=False)
shutil.copy2(PROJECT / "assets" / "subtitles.srt", PUBLIC / "subtitles.srt")
for sid in TARGETS:
    shutil.copy2(AUDIO_DIR / f"narration_{sid}.wav", PUBLIC / f"narration_{sid}.wav")

# narration_full via concat with per-scene pad
args = ["ffmpeg", "-y", "-v", "error"]
fc, labels = [], ""
for t in timings:
    args += ["-i", str(PROJECT / t["audio_path"])]
    fc.append(f"[{len(fc)}:a]aresample=48000,aformat=channel_layouts=mono,apad=whole_dur={t['scene_duration']}[a{len(fc)}]")
    labels += f"[a{len(fc)-1}]"
fc.append(f"{labels}concat=n={len(timings)}:v=0:a=1[out]")
args += ["-filter_complex", ";".join(fc), "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s16le"]
for dest in [PUBLIC / "narration_full.wav", PUBLIC / "audio" / "narration_full.wav",
             AUDIO_DIR / "narration_full.wav"]:
    subprocess.run(args + [str(dest)], check=True)
print("[public] staged: scene_timing, words(flat×2), subtitles, 8 wav, narration_full ×3")
print("Done:", json.dumps({"total_s": round(t0, 2), "frames": f0,
                           "new_dur": {k: round(v, 2) for k, v in new_dur.items()}}, ensure_ascii=False))
