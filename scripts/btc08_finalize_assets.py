#!/usr/bin/env python
"""btc-tradingagents-20261008 — finalize ASSETS: manifest + checkpoint + decision d-004."""
import json
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PROJECT_ID = "btc-tradingagents-20261008"
PROJ = REPO / "projects" / PROJECT_ID
AUDIO = PROJ / "assets" / "audio"
IMAGES = PROJ / "assets" / "images"
TZ = timezone(timedelta(hours=7))

sys.path.insert(0, str(REPO))
from schemas.artifacts import validate_artifact  # noqa: E402
from lib.checkpoint import write_checkpoint  # noqa: E402

BG_PROMPTS = {
    "bg_s01": ("Vertical dark fintech terminal mood background, 9:16 portrait: deep charcoal black "
               "#0D1117 base, subtle dim neon grid lines fading into darkness, one faint ghostly "
               "goldfish silhouette swimming among abstract blurred falling red candlestick shapes, "
               "soft depth-of-field haze, cinematic dark tech atmosphere, moody minimal, absolutely "
               "NO text NO numbers NO letters NO UI elements"),
    "bg_s08": ("Vertical dark fintech terminal mood background, 9:16 portrait: deep charcoal black "
               "#0D1117 base, subtle dim neon grid receding into darkness, blurred candlestick "
               "silhouettes descending toward a faint glowing horizontal danger band of amber-to-red "
               "gradient light low in the frame, ominous tension, soft haze, cinematic dark tech "
               "atmosphere, moody minimal, absolutely NO text NO numbers NO letters NO UI elements"),
}


def ffprobe_dims(p: Path) -> str:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", str(p)],
        capture_output=True, text=True, check=True)
    return out.stdout.strip().replace(",", "x")


def main():
    summary = json.loads((AUDIO / "tts_batch_summary.json").read_text(encoding="utf-8"))
    words = json.loads((AUDIO / "transcripts" / "narration_words.json").read_text(encoding="utf-8"))
    n_cues = (AUDIO / "subtitles.srt").read_text(encoding="utf-8").count("\n\n") + 1
    full_dur = summary["total_duration_seconds"]

    # cleanup model probes (not manifest items)
    for p in (IMAGES / "probes").glob("probe_*.png"):
        p.unlink()

    assets = []
    for s in summary["sections"]:
        sid = s["id"]
        assets.append({
            "id": f"voice_{sid}",
            "type": "narration",
            "path": f"assets/audio/voice_{sid}.wav",
            "source_tool": "vieneu_tts (local, default voice 48kHz) + ffmpeg atempo=1.15",
            "scene_id": sid,
            "duration_seconds": s["duration_seconds"],
            "provider": "vieneu",
            "generation_summary": s["label"],
            "voice_performance": {
                "source_section_id": sid,
                "delivery_cues_applied": True,
                "provider_text_used": True,
                "provider_settings": {"voice": "default", "sample_rate_hz": 48000, "atempo": 1.15},
            },
        })
    assets.append({
        "id": "narration_full",
        "type": "audio",
        "path": "assets/audio/narration_full.wav",
        "source_tool": "ffmpeg concat of voice_sXX.wav with 0.65s inter-section silence",
        "scene_id": "all",
        "duration_seconds": full_dur,
        "provider": "vieneu",
        "subtype": "narration_concat",
        "generation_summary": (f"full narration: vieneu default 48k atempo 1.15; "
                               f"voice {summary['total_voice_seconds']}s + gaps {summary['total_gap_seconds']}s "
                               f"(actual offsets for speech-lock: cumulative durations + 0.65s gaps)"),
    })
    assets.append({
        "id": "transcript_narration_words",
        "type": "subtitle",
        "path": "assets/audio/transcripts/narration_words.json",
        "source_tool": "tools.analysis.transcriber (faster-whisper, language=vi)",
        "scene_id": "all",
        "duration_seconds": full_dur,
        "provider": "faster-whisper",
        "subtype": "word_timings",
        "generation_summary": f"{len(words['words'])} flat word timings (global_start/end) for speech-locked animation; source: narration_full.wav",
    })
    assets.append({
        "id": "subtitles_srt",
        "type": "subtitle",
        "path": "assets/audio/subtitles.srt",
        "source_tool": "derived from transcript_narration_words.json — canonical script text (provider_text) mapped onto whisper word time-slots",
        "scene_id": "all",
        "duration_seconds": full_dur,
        "provider": "faster-whisper",
        "subtype": "srt",
        "format": "srt",
        "generation_summary": f"{n_cues} cues <=6 words / 3.5s; canonical Vietnamese text (anti whisper-mangle per standing rule 2026-10-04)",
    })
    for bg_id, scene in (("bg_s01", "s01"), ("bg_s08", "s08")):
        p = IMAGES / f"{bg_id}.png"
        assets.append({
            "id": bg_id,
            "type": "image",
            "path": f"assets/images/{bg_id}.png",
            "source_tool": "tools.graphics.openai_image (9router gateway, SSE)",
            "scene_id": scene,
            "model": "cx/gpt-5.6-luna-image",
            "prompt": BG_PROMPTS[bg_id],
            "resolution": ffprobe_dims(p),
            "format": "png",
            "subtype": "generated",
            "provider": "9router",
            "generation_summary": (f"mood background base layer for {scene} hero (focal-visual rule: gen canvas + "
                                   "TSX overlay speech-locked on top); no text/numbers/UI — visually verified"),
        })
    assets.append({
        "id": "bgm",
        "type": "music",
        "path": "assets/music/bgm.mp3",
        "source_tool": "copied from ~/project/media-library/bgm/technology/Inspired.mp3 (Incompetech, catalog.json)",
        "scene_id": "all",
        "duration_seconds": 286.0,
        "format": "mp3",
        "provider": "incompetech",
        "license": "CC BY 4.0",
        "subtype": "bgm_bed",
        "generation_summary": ("Kevin MacLeod 'Inspired' (ISRC USUAN1600022, 120bpm guitar/synths, bright-relaxed "
                               "bed; switched from gh6's Cipher2 to avoid reuse); credit artifacts/bgm_credit.json; "
                               "sha256 byte-identical to catalog"),
    })

    manifest = {
        "version": "1.0",
        "assets": assets,
        "total_cost_usd": 0.0,
        "metadata": {
            "project_id": PROJECT_ID,
            "provenance": ("vieneu default 48k atempo 1.15 (10 voice + concat 0.65s gaps); whisper vi word "
                           "timings + canonical SRT; 2 gen bg cx/gpt-5.6-luna-image; bgm Incompetech CC BY 4.0"),
            "partial_progress": {"audio": "done", "images": "done"},
        },
    }
    validate_artifact("asset_manifest", manifest)

    bgm_credit = {
        "track_id": "inspired",
        "title": "Inspired",
        "author": "Kevin MacLeod",
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "source": "Incompetech via ~/project/media-library/bgm/technology/Inspired.mp3",
        "credit_line": "\"Inspired\" Kevin MacLeod (incompetech.com). Licensed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/",
        "isrc": "USUAN1600022",
        "bpm": "120",
        "genre": "technology",
        "duration_sec": 286.0,
        "sha256": "40b1af74145cedac77814d060155ad4658e04efa14d1b649decedc98fbb25f69",
    }
    (PROJ / "artifacts" / "bgm_credit.json").write_text(
        json.dumps(bgm_credit, ensure_ascii=False, indent=2), encoding="utf-8")
    (PROJ / "artifacts" / "asset_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    write_checkpoint(
        PROJECT_ID, "assets", "completed",
        artifacts={"asset_manifest": manifest},
        human_approved=True,  # full-run pre-auth d-001
        metadata={"partial_progress": {"audio": "done", "images": "done"},
                  "cost_snapshot": {"stage_total_usd": 0.0}},
    )

    # ---- decision log d-004
    dlog_path = PROJ / "decision_log.json"
    dlog = json.loads(dlog_path.read_text(encoding="utf-8"))
    dev = "; ".join(f"{s['id']} {s['duration_seconds']}s/{s['planned_seconds']}s ({s['deviation_pct']:+.1f}%)"
                    for s in summary["sections"])
    dlog.append({
        "id": "d-004",
        "timestamp": datetime.now(TZ).isoformat(),
        "topic": "assets — audio batch + 2 bg mood images + BGM Inspired",
        "actor": "Claude Code (LEAD, assets stage)",
        "summary": (f"TTS vieneu 10 section (provider_text đã áp lexicon) + atempo 1.15: narration_full "
                    f"{full_dur}s vs plan 108.8s (trong target 100-118s). Whisper vi: {len(words['words'])} word "
                    f"timings + SRT {n_cues} cues canonical-mapped (chữ script, giờ whisper). Ảnh nền mood: "
                    f"cx/gpt-5.6-luna-image (probe cả ag/gemini-3.1-flash-image lẫn luna đều sống; chọn luna — "
                    f"proven no-text ở gh6) gen 2 nền 941x1672 dọc cho s01/s08, vision-check không chữ/số/UI. "
                    f"BGM: Inspired (Kevin MacLeod, CC BY 4.0) — đổi khỏi Cipher2 của gh6 tránh lặp. Cost $0."),
        "per_section_durations": dev,
        "state_mechanics_note": (f"Run-1 vieneu SIGABRT SAU khi ghi voice_s01.wav (raw chưa tempo) — skip-exists "
                                 f"lần rerun lấy nhầm raw 8.96s; đã fix atempo in-place (7.803s) + tính lại toàn bộ "
                                 f"downstream. QUAN TRỌNG cho edit/compose: narration thực tế {full_dur}s ≠ 108.8s "
                                 f"scene_plan — scene offsets phải lấy từ tts_batch_summary.json (cumulative "
                                 f"duration + 0.65s gap), KHÔNG dùng start/end_seconds của scene_plan; speech-lock "
                                 f"theo words.json."),
        "artifacts": [
            "artifacts/asset_manifest.json",
            "artifacts/bgm_credit.json",
            "assets/audio/ (voice_s01-s10, narration_full.wav, tts_batch_summary.json, narration_full_transcript.json, transcripts/narration_words.json, subtitles.srt, silence_065.wav)",
            "assets/images/ (bg_s01.png, bg_s08.png)",
            "assets/music/bgm.mp3",
            "checkpoint_assets.json",
        ],
    })
    dlog_path.write_text(json.dumps(dlog, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"OK manifest={len(assets)} assets validated; checkpoint assets=completed (pre-auth d-001); "
          f"d-004 appended; full={full_dur}s words={len(words['words'])} cues={n_cues}")


if __name__ == "__main__":
    main()
