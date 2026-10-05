"""Build all AIVN aivn-20261005 asset-stage assets in one batch:
  1. vieneu TTS narration for 9 sections (provider_text, 48kHz, atempo=1.05 only if a section overruns its slot)
  2. faster-whisper word alignment to canonical script words
  3. transcripts s01..s09.json, narration_words.json, scene_timing.json, subtitles.srt
  4. BGM copy from music_library
  5. 3 key visuals via 9router (cx/gpt-5.6-luna-image)
  6. asset_manifest.json validated against schemas/artifacts/asset_manifest.schema.json
"""
from __future__ import annotations

import difflib
import json
import re
import shutil
import struct
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from dotenv import load_dotenv

load_dotenv(REPO_ROOT / ".env")

import av  # noqa: E402
import jsonschema  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

from lib.checkpoint import write_checkpoint  # noqa: E402
from tools.audio.vieneu_tts import VieneuTTS  # noqa: E402
from tools.graphics.openai_image import OpenAIImage  # noqa: E402

PROJECT_DIR = REPO_ROOT / "projects" / "aivn-20261005"
SCRIPT_PATH = PROJECT_DIR / "artifacts" / "script.json"
ASSETS_DIR = PROJECT_DIR / "assets"
AUDIO_DIR = ASSETS_DIR / "audio"
TRANSCRIPTS_DIR = AUDIO_DIR / "transcripts"
IMAGES_DIR = ASSETS_DIR / "images"
MUSIC_DIR = ASSETS_DIR / "music"
SUBTITLES_PATH = ASSETS_DIR / "subtitles.srt"
NARRATION_WORDS_PATH = PROJECT_DIR / "artifacts" / "narration_words.json"
SCENE_TIMING_PATH = PROJECT_DIR / "artifacts" / "scene_timing.json"
MANIFEST_PATH = PROJECT_DIR / "artifacts" / "asset_manifest.json"
MANIFEST_SCHEMA_PATH = REPO_ROOT / "schemas" / "artifacts" / "asset_manifest.schema.json"
BGM_SRC = REPO_ROOT / "music_library" / "mixkit-new-bass-01.mp3"
BGM_DST = MUSIC_DIR / "bgm.mp3"

IMAGE_MODEL = "cx/gpt-5.6-luna-image"
IMAGE_JOBS = [
    {
        "file": "scene_01_pacific_divide.png",
        "scene_id": "scene_01",
        "prompt": (
            "Editorial split-screen concept art of a digital Pacific Ocean divide between two AI futures. "
            "Left half: the United States technology frontier in cool slate blue (#334155) and deep navy, "
            "a cautious safety radar sweep over a dark shoreline skyline with amber warning beacons (#F59E0B). "
            "Right half: Vietnam in vibrant cyan (#06B6D4) and emerald green (#10B981), a bright expanding "
            "network of glowing growth nodes rising over a dynamic coastline cityscape. A clean ocean horizon "
            "line divides the halves down the center. Flat vector editorial illustration, high contrast, crisp "
            "geometric shapes, subtle grid texture, even high-key lighting, wide 16:9 cinematic composition, "
            "no text, no lettering."
        ),
    },
    {
        "file": "scene_06_openai_hq.png",
        "scene_id": "scene_06",
        "prompt": (
            "Modern AI frontier research laboratory and glass headquarters at dusk. A sleek low-slung glass "
            "building with warm interior lights stands before a high-tech diagnostic display backdrop of "
            "abstract telemetry waveforms and safety-threshold readouts glowing amber (#F59E0B) on deep slate "
            "panels (#1E293B). Clean editorial illustration style, precise architectural lines, cool ambient "
            "lighting with subtle amber accent glow, wide 16:9 cinematic composition, no text, no lettering."
        ),
    },
    {
        "file": "scene_08_scope_authorization.png",
        "scene_id": "scene_08",
        "prompt": (
            "Abstract digital network visualization of an AI agent's authorization boundary. A central agent "
            "core node sits inside a translucent scope boundary dome; several external tool nodes outside the "
            "boundary send request paths that terminate at glowing authorization gates, one gate flashing an "
            "alert pulse in amber (#F59E0B). Fine connector lines, telemetry dots and diagnostic readout panels "
            "in cool slate (#334155) with cyan (#06B6D4) accents. Clean professional flat vector aesthetic, "
            "technical diagnostic mood, balanced symmetric composition, soft glow lighting, wide 16:9 cinematic "
            "composition, no text, no lettering."
        ),
    },
]


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


def png_size(path: Path) -> str:
    with open(path, "rb") as f:
        header = f.read(24)
    w, h = struct.unpack(">II", header[16:24])
    return f"{w}x{h}"


def align_words(script_words: list[str], whisper_words: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Map canonical script words onto whisper word time-slots."""
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


def refresh_progress(done: int, total: int, unit: str) -> None:
    write_checkpoint(
        "projects", "aivn-20261005", "assets", "in_progress",
        artifacts={},
        pipeline_type="animated-explainer",
        metadata={"partial_progress": {"done": done, "total": total, "unit": unit}},
    )


def main() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    MUSIC_DIR.mkdir(parents=True, exist_ok=True)

    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        script_data = json.load(f)
    sections = script_data["sections"]
    assert len(sections) == 9, f"expected 9 sections, got {len(sections)}"

    write_checkpoint(
        "projects", "aivn-20261005", "assets", "in_progress",
        artifacts={},
        pipeline_type="animated-explainer",
        metadata={"partial_progress": {"done": 0, "total": 13, "unit": "asset units (9 TTS + 3 images + 1 subtitle pack)"}},
    )

    # ---- 1. TTS narration (batch loop) ----
    tts = VieneuTTS()
    for idx, sec in enumerate(sections, start=1):
        narration_path = AUDIO_DIR / f"narration_s{idx:02d}.wav"
        if narration_path.exists() and narration_path.stat().st_size > 0:
            print(f"[tts] exists: {narration_path.name}")
            continue
        text = sec.get("delivery_cues", {}).get("provider_text") or sec["text"]
        raw_path = AUDIO_DIR / f"raw_s{idx:02d}.wav"
        print(f"[tts] synthesizing sec_{idx:02d}: {text[:48]}...")
        res = tts.execute({"text": text, "output_path": str(raw_path.resolve()), "voice": None, "threads": 6})
        if not res.success:
            raise RuntimeError(f"TTS failed for sec_{idx:02d}: {res.error}")

        raw_dur = get_audio_duration(raw_path)
        planned_slot = float(sec["end_seconds"]) - float(sec["start_seconds"])
        filters = ["aresample=48000", "aresample=resampler=soxr"] if raw_dur <= planned_slot else ["atempo=1.05", "aresample=48000"]
        speed_note = "atempo=1.05 applied (overran slot)" if raw_dur > planned_slot else "native speed"
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(raw_path), "-filter:a", ",".join(filters), str(narration_path)],
            capture_output=True, check=True,
        )
        raw_path.unlink(missing_ok=True)
        print(f"[tts] {narration_path.name}: raw={raw_dur}s, slot={planned_slot}s, {speed_note}")
        refresh_progress(idx, 13, f"tts_s{idx:02d}")

    # ---- 2. Whisper transcription + word alignment + timings + SRT ----
    print("[whisper] loading small/int8...")
    whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

    scene_timings: list[dict[str, Any]] = []
    all_words: list[dict[str, Any]] = []
    all_cues: list[dict[str, Any]] = []
    global_time = 0.0
    global_frame = 0

    for idx, sec in enumerate(sections, start=1):
        narration_path = AUDIO_DIR / f"narration_s{idx:02d}.wav"
        audio_duration = get_audio_duration(narration_path)
        # Tail = the script's own pause_after_seconds (voice_performance pause policy)
        tail_duration = float(sec.get("delivery_cues", {}).get("pause_after_seconds", 0.5))
        scene_duration = round(audio_duration + tail_duration, 3)
        scene_frames = round(scene_duration * 30)
        start_seconds = round(global_time, 3)
        end_seconds = round(start_seconds + scene_duration, 3)
        start_frame = global_frame
        end_frame = start_frame + scene_frames

        scene_timings.append({
            "scene_id": f"scene_{idx:02d}",
            "script_section_id": sec["id"],
            "audio_path": f"assets/audio/narration_s{idx:02d}.wav",
            "audio_duration": audio_duration,
            "tail_duration": tail_duration,
            "scene_duration": scene_duration,
            "scene_frames": scene_frames,
            "start_seconds": start_seconds,
            "end_seconds": end_seconds,
            "start_frame": start_frame,
            "end_frame": end_frame,
        })

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

        sec_words_global = []
        for w in aligned:
            word_dict = {
                "word": w["word"],
                "scene_id": f"scene_{idx:02d}",
                "script_section_id": sec["id"],
                "scene_start_seconds": start_seconds,
                "clip_start": w["clip_start"],
                "clip_end": w["clip_end"],
                "global_start": round(start_seconds + w["clip_start"], 3),
                "global_end": round(start_seconds + w["clip_end"], 3),
            }
            sec_words_global.append(word_dict)
            all_words.append(word_dict)

        with open(TRANSCRIPTS_DIR / f"s{idx:02d}.json", "w", encoding="utf-8") as f:
            json.dump({
                "section_id": sec["id"],
                "scene_id": f"scene_{idx:02d}",
                "audio_path": f"assets/audio/narration_s{idx:02d}.wav",
                "audio_duration": audio_duration,
                "scene_start_seconds": start_seconds,
                "canonical_text": sec["text"],
                "words": sec_words_global,
            }, f, ensure_ascii=False, indent=2)

        for cue in make_cues(sec_words_global):
            all_cues.append({
                "start": cue[0]["global_start"],
                "end": cue[-1]["global_end"],
                "text": " ".join(cw["word"] for cw in cue),
                "scene_id": f"scene_{idx:02d}",
            })

        global_time = end_seconds
        global_frame = end_frame
        print(f"[whisper] s{idx:02d}: audio={audio_duration}s scene={scene_duration}s words={len(aligned)}")

    with open(NARRATION_WORDS_PATH, "w", encoding="utf-8") as f:
        json.dump(all_words, f, ensure_ascii=False, indent=2)
    with open(SCENE_TIMING_PATH, "w", encoding="utf-8") as f:
        json.dump(scene_timings, f, ensure_ascii=False, indent=2)
    with open(SUBTITLES_PATH, "w", encoding="utf-8") as f:
        for cue_idx, cue in enumerate(all_cues, start=1):
            f.write(f"{cue_idx}\n{format_srt_time(cue['start'])} --> {format_srt_time(cue['end'])}\n{cue['text']}\n\n")
    print(f"[whisper] wrote {len(all_words)} words, {len(scene_timings)} scene timings, {len(all_cues)} SRT cues")

    # ---- 3. BGM copy ----
    if BGM_SRC.exists():
        shutil.copy(BGM_SRC, BGM_DST)
        print(f"[bgm] copied {BGM_SRC.name} -> {BGM_DST}")
    else:
        raise FileNotFoundError(f"BGM source missing: {BGM_SRC}")

    # ---- 4. Key visuals via 9router (cx/gpt-5.6-luna-image, T2I) ----
    image_tool = OpenAIImage()
    image_results: list[dict[str, Any]] = []
    for job_idx, job in enumerate(IMAGE_JOBS, start=1):
        out_path = IMAGES_DIR / job["file"]
        if out_path.exists() and out_path.stat().st_size > 1024:
            print(f"[image] exists: {out_path.name}")
        else:
            print(f"[image] generating {out_path.name} via {IMAGE_MODEL}...")
            res = image_tool.execute({
                "prompt": job["prompt"],
                "model": IMAGE_MODEL,
                "output_path": str(out_path.resolve()),
                "size": "1536x1024",
                "quality": "auto",
                "n": 1,
                "timeout": 300.0,
            })
            if not res.success:
                raise RuntimeError(f"Image generation failed for {job['file']}: {res.error}")
        image_results.append({
            "file": job["file"],
            "scene_id": job["scene_id"],
            "prompt": job["prompt"],
            "resolution": png_size(out_path),
        })
        refresh_progress(9 + job_idx, 13, f"image_{job['scene_id']}")

    # ---- 5. Asset manifest ----
    total_audio_duration = round(sum(item["audio_duration"] for item in scene_timings), 2)
    manifest_assets: list[dict[str, Any]] = []

    for idx, (sec, item) in enumerate(zip(sections, scene_timings), start=1):
        manifest_assets.append({
            "id": f"narration-s{idx:02d}",
            "type": "narration",
            "subtype": "segment",
            "path": item["audio_path"],
            "source_tool": "vieneu_tts",
            "provider": "vieneu",
            "scene_id": item["scene_id"],
            "duration_seconds": item["audio_duration"],
            "format": "wav/48kHz",
            "cost_usd": 0.0,
            "model": "vieneu v3 Turbo (default news voice)",
            "generation_summary": (
                "Synthesized from delivery_cues.provider_text (respelled foreign terms per tts_lexicon), "
                "normalized to 48kHz with optional atempo=1.05 when overrunning the script slot."
            ),
            "voice_performance": {
                "source_section_id": sec["id"],
                "delivery_cues_applied": True,
                "provider_text_used": True,
                "provider_settings": {"voice": "default news 48k", "atempo": "1.05 if slot overrun"},
            },
        })

    bgm_duration = get_audio_duration(BGM_DST)
    manifest_assets.append({
        "id": "bgm-main",
        "type": "music",
        "subtype": "background",
        "path": "assets/music/bgm.mp3",
        "source_tool": "local_library",
        "provider": "mixkit",
        "scene_id": "all",
        "duration_seconds": bgm_duration,
        "format": "mp3",
        "cost_usd": 0.0,
        "license": "Mixkit Stock Music Free License",
        "generation_summary": "Track 'New Bass 01' copied from music_library/mixkit-new-bass-01.mp3",
    })

    manifest_assets.append({
        "id": "subtitles-full",
        "type": "subtitle",
        "subtype": "word-aligned-srt",
        "path": "assets/subtitles.srt",
        "source_tool": "faster_whisper",
        "provider": "local",
        "scene_id": "all",
        "format": "srt",
        "cost_usd": 0.0,
        "model": "whisper-small (int8, vi)",
        "generation_summary": (
            f"{len(all_cues)} cues built from canonical script words aligned onto whisper word time-slots "
            "(speech-locked animation contract)."
        ),
    })

    for img in image_results:
        manifest_assets.append({
            "id": f"image-{img['scene_id']}",
            "type": "image",
            "subtype": "background",
            "path": f"assets/images/{img['file']}",
            "source_tool": "openai_image",
            "provider": "9router",
            "scene_id": img["scene_id"],
            "prompt": img["prompt"],
            "model": IMAGE_MODEL,
            "resolution": img["resolution"],
            "format": "png",
            "cost_usd": 0.0,
            "generation_summary": "Text-to-image key visual via local 9router gateway (16:9 composition).",
        })

    manifest = {
        "version": "1.0",
        "assets": manifest_assets,
        "total_cost_usd": 0.0,
        "metadata": {
            "project_id": "aivn-20261005",
            "narration_total_seconds": total_audio_duration,
            "timeline_total_seconds": round(global_time, 3),
            "total_scenes": len(scene_timings),
            "subtitle_cues_count": len(all_cues),
            "words_synced_count": len(all_words),
            "image_count": len(image_results),
            "tts_provider": "vieneu",
            "image_provider": "9router cx/gpt-5.6-luna-image",
            "speech_locked_timing": True,
        },
    }

    with open(MANIFEST_SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)
    jsonschema.validate(instance=manifest, schema=schema)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"[manifest] schema PASSED, wrote {MANIFEST_PATH}")

    print("\nSummary:")
    print(f"- Narration clips: {len(scene_timings)} | total narration {total_audio_duration:.2f}s | timeline {global_time:.2f}s")
    print(f"- Words synced: {len(all_words)} | SRT cues: {len(all_cues)}")
    print(f"- Images: {len(image_results)} | BGM: {bgm_duration:.1f}s")


if __name__ == "__main__":
    main()
