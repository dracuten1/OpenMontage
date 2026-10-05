"""Re-synthesize narration for s04 only and update alignments, timings, and staged assets.

1. Re-TTS sec_04 via VieneuTTS using provider_text from script.json
2. Post-process narration_s04.wav (48kHz, atempo=1.05 if overrun)
3. Transcribe narration_s04.wav via faster-whisper (small, int8, vi)
4. Align words and save transcripts/s04.json (including whisper words & transcript)
5. Recalculate scene_timing.json across all 9 scenes
6. Rebuild narration_words.json and subtitles.srt
7. Update asset_manifest.json and validate schema
8. Stage to remotion-composer/public/aivn-20261006/ (including narration_full.wav & words.json)
"""
from __future__ import annotations

import difflib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from dotenv import load_dotenv
load_dotenv(REPO_ROOT / ".env")

import av
import jsonschema
from faster_whisper import WhisperModel

from tools.audio.vieneu_tts import VieneuTTS

PROJECT_DIR = REPO_ROOT / "projects" / "aivn-20261006"
SCRIPT_PATH = PROJECT_DIR / "artifacts" / "script.json"
ASSETS_DIR = PROJECT_DIR / "assets"
AUDIO_DIR = ASSETS_DIR / "audio"
TRANSCRIPTS_DIR = AUDIO_DIR / "transcripts"
SUBTITLES_PATH = ASSETS_DIR / "subtitles.srt"
NARRATION_WORDS_PATH = PROJECT_DIR / "artifacts" / "narration_words.json"
SCENE_TIMING_PATH = PROJECT_DIR / "artifacts" / "scene_timing.json"
MANIFEST_PATH = PROJECT_DIR / "artifacts" / "asset_manifest.json"
MANIFEST_SCHEMA_PATH = REPO_ROOT / "schemas" / "artifacts" / "asset_manifest.schema.json"
PUBLIC_DIR = REPO_ROOT / "remotion-composer" / "public" / "aivn-20261006"


def clean_text_for_match(text: str) -> str:
    return re.sub(r"[^\w]", "", text).lower()


def get_audio_duration(file_path: Path) -> float:
    with av.open(str(file_path)) as container:
        stream = container.streams.audio[0]
        if stream.duration is not None and stream.time_base is not None:
            return round(float(stream.duration * stream.time_base), 3)
        if container.duration is not None:
            return round(float(container.duration) / av.time_base, 3)
    res = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(file_path)],
        capture_output=True, text=True, check=True,
    )
    return round(float(res.stdout.strip()), 3)


def align_words(script_words: list[str], whisper_words: list[dict[str, Any]]) -> list[dict[str, Any]]:
    s_clean = [clean_text_for_match(w) for w in script_words]
    w_clean = [clean_text_for_match(w["word"]) for w in whisper_words]
    matcher = difflib.SequenceMatcher(None, s_clean, w_clean)
    aligned: list[dict[str, Any]] = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        sw_slice = script_words[i1:i2]
        ww_slice = whisper_words[j1:j2]

        if tag == "equal":
            for s_w, w_obj in zip(sw_slice, ww_slice):
                aligned.append({
                    "word": s_w,
                    "clip_start": round(float(w_obj["start"]), 3),
                    "clip_end": round(float(w_obj["end"]), 3),
                })
        elif tag == "replace":
            if len(sw_slice) == len(ww_slice):
                for s_w, w_obj in zip(sw_slice, ww_slice):
                    aligned.append({
                        "word": s_w,
                        "clip_start": round(float(w_obj["start"]), 3),
                        "clip_end": round(float(w_obj["end"]), 3),
                    })
            else:
                start_t = float(ww_slice[0]["start"]) if ww_slice else 0.0
                end_t = float(ww_slice[-1]["end"]) if ww_slice else start_t
                span = max(0.01, end_t - start_t)
                n = len(sw_slice)
                for idx, s_w in enumerate(sw_slice):
                    aligned.append({
                        "word": s_w,
                        "clip_start": round(start_t + span * (idx / n), 3),
                        "clip_end": round(start_t + span * ((idx + 1) / n), 3),
                    })
        elif tag == "delete":
            prev_end = aligned[-1]["clip_end"] if aligned else 0.0
            next_start = float(whisper_words[j1]["start"]) if j1 < len(whisper_words) else prev_end + 0.3
            span = max(0.01, next_start - prev_end)
            n = len(sw_slice)
            for idx, s_w in enumerate(sw_slice):
                aligned.append({
                    "word": s_w,
                    "clip_start": round(prev_end + span * (idx / n), 3),
                    "clip_end": round(prev_end + span * ((idx + 1) / n), 3),
                })
        elif tag == "insert":
            pass

    return aligned


def make_cues(words: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    cues: list[list[dict[str, Any]]] = []
    curr: list[dict[str, Any]] = []
    i = 0
    n = len(words)
    while i < n:
        w = words[i]
        curr.append(w)
        txt = w["word"]
        has_major = any(txt.endswith(p) for p in [".", "?", "!", ":", ";"])
        has_comma = txt.endswith(",")
        next_has_major = (i + 1 < n) and any(words[i + 1]["word"].endswith(p) for p in [".", "?", "!", ":", ";"])
        next2_has_major = (i + 2 < n) and any(words[i + 2]["word"].endswith(p) for p in [".", "?", "!", ":", ";"])

        if has_major:
            cues.append(curr)
            curr = []
        elif has_comma and len(curr) >= 4:
            if not next_has_major:
                cues.append(curr)
                curr = []
        elif len(curr) >= 7:
            if not (next_has_major or next2_has_major):
                cues.append(curr)
                curr = []
        i += 1

    if curr:
        if len(curr) <= 2 and cues:
            cues[-1].extend(curr)
        else:
            cues.append(curr)
    return cues


def format_srt_time(seconds: float) -> str:
    total_ms = int(round(seconds * 1000))
    ms = total_ms % 1000
    total_s = total_ms // 1000
    s = total_s % 60
    total_m = total_s // 60
    m = total_m % 60
    h = total_m // 60
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def run_rebuild() -> dict[str, Any]:
    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        script_data = json.load(f)
    sections = script_data["sections"]
    sec_04 = next(s for s in sections if s["id"] in ("sec_04", "s04"))

    provider_text = sec_04["delivery_cues"]["provider_text"]
    # assert removed: this copy is parameterized for aivn-20261006 s04 (no GPT-6.1 text)
    print(f"[tts] Target provider_text: {provider_text}")

    # Step 1: Synthesize s04 via vieneu
    tts = VieneuTTS()
    raw_path = AUDIO_DIR / "raw_s04.wav"
    narration_path = AUDIO_DIR / "narration_s04.wav"

    res = tts.execute({"text": provider_text, "output_path": str(raw_path.resolve()), "voice": None, "threads": 6})
    if not res.success:
        raise RuntimeError(f"Vieneu TTS failed: {res.error}")

    raw_dur = get_audio_duration(raw_path)
    planned_slot = float(sec_04["end_seconds"]) - float(sec_04["start_seconds"])  # 12.0s
    filters = ["aresample=48000", "aresample=resampler=soxr"] if raw_dur <= planned_slot else ["atempo=1.05", "aresample=48000"]
    speed_note = "atempo=1.05 applied (overran slot)" if raw_dur > planned_slot else "native speed"
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(raw_path), "-filter:a", ",".join(filters), str(narration_path)],
        capture_output=True, check=True,
    )
    raw_path.unlink(missing_ok=True)
    new_s04_dur = get_audio_duration(narration_path)
    print(f"[tts] narration_s04.wav: raw={raw_dur}s, slot={planned_slot}s, final={new_s04_dur}s, {speed_note}")

    # Step 2: Transcribe s04 with faster-whisper
    print("[whisper] Transcribing narration_s04.wav...")
    whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
    segments_gen, _ = whisper_model.transcribe(str(narration_path), language="vi", word_timestamps=True)
    whisper_words: list[dict[str, Any]] = []
    full_transcript_parts: list[str] = []
    for seg in segments_gen:
        full_transcript_parts.append(seg.text)
        for w in seg.words:
            whisper_words.append({
                "word": w.word.strip(),
                "start": round(float(w.start), 3),
                "end": round(float(w.end), 3),
                "probability": round(float(w.probability), 3),
            })
    whisper_full_text = " ".join(full_transcript_parts).strip()
    print(f"[whisper] Recognized text: {whisper_full_text}")

    script_words = sec_04["text"].split()
    aligned_s04 = align_words(script_words, whisper_words)

    # Step 3: Recalculate scene timings for all 9 scenes
    scene_timings: list[dict[str, Any]] = []
    global_time = 0.0
    global_frame = 0

    for idx, sec in enumerate(sections, start=1):
        sec_audio_path = AUDIO_DIR / f"narration_s{idx:02d}.wav"
        audio_dur = get_audio_duration(sec_audio_path)
        tail_dur = float(sec.get("delivery_cues", {}).get("pause_after_seconds", 0.5))
        scene_dur = round(audio_dur + tail_dur, 3)
        scene_frames = round(scene_dur * 30)
        start_seconds = round(global_time, 3)
        end_seconds = round(start_seconds + scene_dur, 3)
        start_frame = global_frame
        end_frame = start_frame + scene_frames

        scene_timings.append({
            "scene_id": f"scene_{idx:02d}",
            "script_section_id": sec["id"],
            "audio_path": f"assets/audio/narration_s{idx:02d}.wav",
            "audio_duration": audio_dur,
            "tail_duration": tail_dur,
            "scene_duration": scene_dur,
            "scene_frames": scene_frames,
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
            "start_frame": start_frame,
            "end_frame": end_frame,
        })
        global_time = end_seconds
        global_frame = end_frame

    # Save scene_timing.json
    with open(SCENE_TIMING_PATH, "w", encoding="utf-8") as f:
        json.dump(scene_timings, f, ensure_ascii=False, indent=2)
    print(f"[timing] Saved scene_timing.json: total_duration={global_time:.3f}s, total_frames={global_frame}")

    # Step 4: Rebuild transcripts/s04.json and update all transcripts with new global offsets
    # For s04:
    s04_timing = next(st for st in scene_timings if st["scene_id"] == "scene_06")
    s04_start = s04_timing["start_seconds"]
    s04_words_global = []
    for w in aligned_s04:
        s04_words_global.append({
            "word": w["word"],
            "scene_id": "scene_06",
            "script_section_id": "sec_04",
            "scene_start_seconds": s04_start,
            "clip_start": w["clip_start"],
            "clip_end": w["clip_end"],
            "global_start": round(s04_start + w["clip_start"], 3),
            "global_end": round(s04_start + w["clip_end"], 3),
        })

    with open(TRANSCRIPTS_DIR / "s04.json", "w", encoding="utf-8") as f:
        json.dump({
            "section_id": "sec_04",
            "scene_id": "scene_06",
            "audio_path": "assets/audio/narration_s04.wav",
            "audio_duration": new_s04_dur,
            "scene_start_seconds": s04_start,
            "canonical_text": sec_04["text"],
            "provider_text": provider_text,
            "whisper_transcript": whisper_full_text,
            "whisper_words": whisper_words,
            "words": s04_words_global,
        }, f, ensure_ascii=False, indent=2)

    # For other scenes (s01..s05, s07..s09): update scene_start_seconds, global_start, global_end in transcripts and collect all_words
    all_words: list[dict[str, Any]] = []
    for idx in range(1, 10):
        sid = f"scene_{idx:02d}"
        st = next(item for item in scene_timings if item["scene_id"] == sid)
        t_path = TRANSCRIPTS_DIR / f"s{idx:02d}.json"
        with open(t_path, "r", encoding="utf-8") as f:
            t_data = json.load(f)

        t_data["scene_start_seconds"] = st["start_seconds"]
        t_data["audio_duration"] = st["audio_duration"]
        for w in t_data["words"]:
            w["scene_start_seconds"] = st["start_seconds"]
            w["global_start"] = round(st["start_seconds"] + w["clip_start"], 3)
            w["global_end"] = round(st["start_seconds"] + w["clip_end"], 3)
            all_words.append(w)

        with open(t_path, "w", encoding="utf-8") as f:
            json.dump(t_data, f, ensure_ascii=False, indent=2)

    # Step 5: Save narration_words.json and subtitles.srt
    with open(NARRATION_WORDS_PATH, "w", encoding="utf-8") as f:
        json.dump(all_words, f, ensure_ascii=False, indent=2)

    all_cues: list[dict[str, Any]] = []
    for idx in range(1, 10):
        sid = f"scene_{idx:02d}"
        sec_words = [w for w in all_words if w["scene_id"] == sid]
        for cue in make_cues(sec_words):
            all_cues.append({
                "start": cue[0]["global_start"],
                "end": cue[-1]["global_end"],
                "text": " ".join(cw["word"] for cw in cue),
                "scene_id": sid,
            })

    with open(SUBTITLES_PATH, "w", encoding="utf-8") as f:
        for cue_idx, cue in enumerate(all_cues, start=1):
            f.write(f"{cue_idx}\n{format_srt_time(cue['start'])} --> {format_srt_time(cue['end'])}\n{cue['text']}\n\n")

    print(f"[subtitles] Saved subtitles.srt ({len(all_cues)} cues), narration_words.json ({len(all_words)} words)")

    # Step 6: Update asset_manifest.json
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    total_audio_duration = round(sum(item["audio_duration"] for item in scene_timings), 2)
    for asset in manifest["assets"]:
        if asset["id"] == "narration-s04":
            asset["duration_seconds"] = new_s04_dur
        elif asset["id"] == "subtitles-full":
            asset["generation_summary"] = (
                f"{len(all_cues)} cues built from canonical script words aligned onto whisper word time-slots "
                "(speech-locked animation contract)."
            )

    manifest["metadata"]["narration_total_seconds"] = total_audio_duration
    manifest["metadata"]["timeline_total_seconds"] = round(global_time, 3)
    manifest["metadata"]["subtitle_cues_count"] = len(all_cues)
    manifest["metadata"]["words_synced_count"] = len(all_words)

    with open(MANIFEST_SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)
    jsonschema.validate(instance=manifest, schema=schema)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"[manifest] Validated and saved asset_manifest.json (narration total={total_audio_duration}s)")

    # Step 7: Stage into remotion-composer/public/aivn-20261006/
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SCENE_TIMING_PATH, PUBLIC_DIR / "scene_timing.json")
    shutil.copy2(AUDIO_DIR / "narration_s04.wav", PUBLIC_DIR / "narration_s04.wav")
    shutil.copy2(SUBTITLES_PATH, PUBLIC_DIR / "subtitles.srt")

    # Rebuild words.json
    words_dict: dict[str, list[dict[str, Any]]] = {}
    for w in all_words:
        sid = w["scene_id"]
        num = sid.replace("scene_", "")
        short_id = f"s{int(num):02d}"
        item = {"word": w["word"], "start": round(w["clip_start"], 3), "end": round(w["clip_end"], 3)}
        words_dict.setdefault(sid, []).append(item)
        words_dict.setdefault(short_id, []).append(item)
    with open(PUBLIC_DIR / "words.json", "w", encoding="utf-8") as f:
        json.dump(words_dict, f, ensure_ascii=False, indent=2)

    # Rebuild narration_full.wav
    args = ["ffmpeg", "-y", "-v", "error"]
    fc = []
    labels = ""
    for i, s in enumerate(scene_timings):
        audio_full_path = PROJECT_DIR / s["audio_path"]
        args += ["-i", str(audio_full_path)]
        fc.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=mono,apad=whole_dur={s['scene_duration']}[a{i}]")
        labels += f"[a{i}]"
    fc.append(f"{labels}concat=n={len(scene_timings)}:v=0:a=1[out]")
    args += ["-filter_complex", ";".join(fc), "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s16le", str(PUBLIC_DIR / "narration_full.wav")]
    subprocess.run(args, check=True)
    print(f"[public] Staged narration_full.wav, scene_timing.json, words.json to {PUBLIC_DIR}")

    return {
        "new_s04_dur": new_s04_dur,
        "total_timeline": round(global_time, 3),
        "total_frames": global_frame,
        "whisper_full_text": whisper_full_text,
    }


if __name__ == "__main__":
    res = run_rebuild()
    print("Done:", json.dumps(res, ensure_ascii=False, indent=2))
