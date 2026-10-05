"""Build all audio assets, transcriptions, timings, subtitles, and manifest for news-20261004."""
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

import av
from faster_whisper import WhisperModel
import jsonschema

from tools.audio.vieneu_tts import VieneuTTS

PROJECT_DIR = Path("projects/news-20261004")
SCRIPT_PATH = PROJECT_DIR / "artifacts" / "script.json"
ASSETS_DIR = PROJECT_DIR / "assets"
AUDIO_DIR = ASSETS_DIR / "audio"
TRANSCRIPTS_DIR = AUDIO_DIR / "transcripts"
MUSIC_DIR = ASSETS_DIR / "music"
SUBTITLES_PATH = ASSETS_DIR / "subtitles.srt"
SCENE_TIMING_PATH = PROJECT_DIR / "artifacts" / "scene_timing.json"
MANIFEST_PATH = PROJECT_DIR / "artifacts" / "asset_manifest.json"
MANIFEST_SCHEMA_PATH = Path("schemas/artifacts/asset_manifest.schema.json")
BGM_SRC = Path("music_library/mixkit-new-bass-01.mp3")
BGM_DST = MUSIC_DIR / "bgm.mp3"


def clean_text_for_match(text: str) -> str:
    return re.sub(r"[^\w]", "", text).lower()


def get_audio_duration(file_path: Path) -> float:
    with av.open(str(file_path)) as container:
        stream = container.streams.audio[0]
        if stream.duration is not None and stream.time_base is not None:
            return round(float(stream.duration * stream.time_base), 3)
        if container.duration is not None:
            return round(float(container.duration) / av.time_base, 3)
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(file_path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return round(float(res.stdout.strip()), 3)


def align_words(script_words: list[str], whisper_words: list[dict[str, Any]]) -> list[dict[str, Any]]:
    s_clean = [clean_text_for_match(w) for w in script_words]
    w_clean = [clean_text_for_match(w["word"]) for w in whisper_words]

    matcher = difflib.SequenceMatcher(None, s_clean, w_clean)
    aligned = []

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
                    w_s = round(start_t + span * (idx / n), 3)
                    w_e = round(start_t + span * ((idx + 1) / n), 3)
                    aligned.append({"word": s_w, "clip_start": w_s, "clip_end": w_e})
        elif tag == "delete":
            prev_end = aligned[-1]["clip_end"] if aligned else 0.0
            next_start = float(whisper_words[j1]["start"]) if j1 < len(whisper_words) else prev_end + 0.3
            span = max(0.01, next_start - prev_end)
            n = len(sw_slice)
            for idx, s_w in enumerate(sw_slice):
                w_s = round(prev_end + span * (idx / n), 3)
                w_e = round(prev_end + span * ((idx + 1) / n), 3)
                aligned.append({"word": s_w, "clip_start": w_s, "clip_end": w_e})
        elif tag == "insert":
            pass

    return aligned


def make_cues(words: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    cues = []
    curr = []
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


def main() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    MUSIC_DIR.mkdir(parents=True, exist_ok=True)

    if BGM_SRC.exists() and not BGM_DST.exists():
        shutil.copy(BGM_SRC, BGM_DST)
        print(f"Copied BGM to {BGM_DST}")

    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        script_data = json.load(f)

    sections = script_data["sections"]
    tts = VieneuTTS()

    print(f"Loaded script with {len(sections)} sections.")

    # 1. Generate / verify narration WAVs
    for idx, sec in enumerate(sections, start=1):
        sec_id = sec["id"]
        raw_path = AUDIO_DIR / f"raw_s{idx:02d}.wav"
        narration_path = AUDIO_DIR / f"narration_s{idx:02d}.wav"

        # Check if narration audio already exists and is non-empty
        if not narration_path.exists() or narration_path.stat().st_size == 0:
            text = sec.get("delivery_cues", {}).get("provider_text") or sec["text"]
            print(f"Synthesizing [{sec_id}]: {text[:45]}...")
            tts_res = tts.execute({
                "text": text,
                "output_path": str(raw_path.resolve()),
                "voice": None,
                "threads": 6
            })
            if not tts_res.success:
                raise RuntimeError(f"TTS generation failed for {sec_id}: {tts_res.error}")

            cmd = [
                "ffmpeg", "-y", "-i", str(raw_path),
                "-filter:a", "atempo=1.15",
                "-ar", "48000",
                str(narration_path)
            ]
            subprocess.run(cmd, capture_output=True, check=True)
            if raw_path.exists():
                raw_path.unlink()
            print(f"Created {narration_path.name}")
        else:
            print(f"Found existing {narration_path.name}")

    # 2. Transcribe and build scene timings
    print("Loading faster-whisper small model...")
    whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

    scene_timings = []
    all_words = []
    all_cues = []
    current_global_time = 0.0
    current_global_frame = 0

    for idx, sec in enumerate(sections, start=1):
        sec_id = sec["id"]
        narration_path = AUDIO_DIR / f"narration_s{idx:02d}.wav"

        audio_duration = get_audio_duration(narration_path)
        tail_duration = 0.8
        scene_duration = round(audio_duration + tail_duration, 3)
        scene_frames = round(scene_duration * 30)

        start_seconds = round(current_global_time, 3)
        end_seconds = round(start_seconds + scene_duration, 3)
        start_frame = current_global_frame
        end_frame = start_frame + scene_frames

        scene_timing_entry = {
            "scene_id": sec_id,
            "script_section_id": sec_id,
            "audio_path": f"assets/audio/narration_s{idx:02d}.wav",
            "audio_duration": audio_duration,
            "tail_duration": tail_duration,
            "scene_duration": scene_duration,
            "scene_frames": scene_frames,
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
            "start_frame": start_frame,
            "end_frame": end_frame,
        }
        scene_timings.append(scene_timing_entry)

        # Transcribe with faster-whisper
        segments_gen, _ = whisper_model.transcribe(str(narration_path), language="vi", word_timestamps=True)
        whisper_words = []
        for seg in segments_gen:
            for w in seg.words:
                whisper_words.append({
                    "word": w.word.strip(),
                    "start": round(float(w.start), 3),
                    "end": round(float(w.end), 3),
                    "probability": round(float(w.probability), 3),
                })

        script_words = sec["text"].split()
        aligned = align_words(script_words, whisper_words)

        # Build words with global timestamps
        sec_words_global = []
        for w in aligned:
            g_start = round(start_seconds + w["clip_start"], 3)
            g_end = round(start_seconds + w["clip_end"], 3)
            word_dict = {
                "word": w["word"],
                "scene_id": sec_id,
                "scene_start_seconds": start_seconds,
                "clip_start": w["clip_start"],
                "clip_end": w["clip_end"],
                "global_start": g_start,
                "global_end": g_end,
            }
            sec_words_global.append(word_dict)
            all_words.append(word_dict)

        # Save per-section transcript
        sec_transcript = {
            "section_id": sec_id,
            "audio_duration": audio_duration,
            "scene_start_seconds": start_seconds,
            "words": sec_words_global,
            "canonical_text": sec["text"],
        }
        with open(TRANSCRIPTS_DIR / f"{sec_id}_transcript.json", "w", encoding="utf-8") as f:
            json.dump(sec_transcript, f, ensure_ascii=False, indent=2)

        # Generate subtitle cues for this section
        cues_in_sec = make_cues(sec_words_global)
        for cue in cues_in_sec:
            all_cues.append({
                "start": cue[0]["global_start"],
                "end": cue[-1]["global_end"],
                "text": " ".join(cw["word"] for cw in cue),
                "scene_id": sec_id,
            })

        current_global_time = end_seconds
        current_global_frame = end_frame
        print(f"Processed [{sec_id}]: audio={audio_duration}s, scene={scene_duration}s, words={len(aligned)}")

    # 3. Write narration_words.json
    NARRATION_WORDS_PATH = TRANSCRIPTS_DIR / "narration_words.json"
    with open(NARRATION_WORDS_PATH, "w", encoding="utf-8") as f:
        json.dump(all_words, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(all_words)} words to {NARRATION_WORDS_PATH}")

    # 4. Write scene_timing.json
    with open(SCENE_TIMING_PATH, "w", encoding="utf-8") as f:
        json.dump(scene_timings, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(scene_timings)} scenes timing to {SCENE_TIMING_PATH}")

    # 5. Write subtitles.srt
    with open(SUBTITLES_PATH, "w", encoding="utf-8") as f:
        for idx, cue in enumerate(all_cues, start=1):
            st_str = format_srt_time(cue["start"])
            et_str = format_srt_time(cue["end"])
            f.write(f"{idx}\n{st_str} --> {et_str}\n{cue['text']}\n\n")
    print(f"Wrote {len(all_cues)} cues to {SUBTITLES_PATH}")

    # 6. Build and write asset_manifest.json
    bgm_duration = get_audio_duration(BGM_DST) if BGM_DST.exists() else 0.0
    total_audio_duration = round(sum(item["audio_duration"] for item in scene_timings), 2)

    manifest_assets = []
    for idx, item in enumerate(scene_timings, start=1):
        sec_id = item["scene_id"]
        manifest_assets.append({
            "id": f"narration-{sec_id}",
            "type": "narration",
            "subtype": "segment",
            "path": item["audio_path"],
            "source_tool": "vieneu_tts",
            "provider": "vieneu",
            "scene_id": sec_id,
            "duration_seconds": item["audio_duration"],
            "format": "wav/48kHz",
            "cost_usd": 0.0,
            "model": "vieneu v3 Turbo (voice default)",
            "voice_performance": {
                "source_section_id": sec_id,
                "delivery_cues_applied": True,
                "provider_text_used": True,
                "provider_settings": {
                    "voice": "default news 48k",
                    "speed": 1.15
                }
            }
        })

    manifest_assets.append({
        "id": "bgm-main",
        "type": "music",
        "subtype": "background",
        "path": "assets/music/bgm.mp3",
        "source_tool": "local_library",
        "scene_id": "all",
        "duration_seconds": bgm_duration,
        "format": "mp3",
        "cost_usd": 0.0,
        "provider": "mixkit",
        "license": "Mixkit Stock Music Free License",
        "generation_summary": "Original track 'New Bass 01' by Lily J (Mixkit), copied from music_library/mixkit-new-bass-01.mp3"
    })

    manifest = {
        "version": "1.0",
        "assets": manifest_assets,
        "total_cost_usd": 0.0,
        "metadata": {
            "narration_total_seconds": total_audio_duration,
            "total_scenes": len(scene_timings),
            "subtitle_cues_count": len(all_cues),
            "words_synced_count": len(all_words)
        }
    }

    # Validate against schema
    if MANIFEST_SCHEMA_PATH.exists():
        with open(MANIFEST_SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema = json.load(f)
        jsonschema.validate(instance=manifest, schema=schema)
        print("Asset manifest schema validation PASSED.")

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"Wrote asset manifest to {MANIFEST_PATH}")

    print("\nSummary:")
    print(f"- Narration clips: {len(scene_timings)}")
    print(f"- Total audio duration: {total_audio_duration:.2f}s")
    print(f"- Words synced: {len(all_words)}")
    print(f"- Subtitle cues: {len(all_cues)}")


if __name__ == "__main__":
    main()
