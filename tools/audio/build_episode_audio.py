#!/usr/bin/env python3
"""build_episode_audio.py — Shared TTS + Whisper alignment + timing lock CLI for OpenMontage.

Replaces per-project gen_tts.py / align_words.py / align_and_lock.py scripts.
Reads script.json (+ optional tts_lexicon.json), runs VieNeu TTS + ffmpeg atempo,
aligns word timestamps via faster-whisper, and emits schema-valid artifacts:
  - projects/<slug>/assets/audio/voice_<sid>.wav (+ public/<slug>/audio/)
  - projects/<slug>/assets/scene_timing.json (+ public/<slug>/scene_timing.json)
  - projects/<slug>/assets/words.json, artifacts/narration_words.json, public/<slug>/words.json
  - projects/<slug>/assets/subtitles.srt
  - remotion-composer/public/<slug>/captions.json (canonical scene-local start/end)
  - remotion-composer/src/<slug>/timing.ts (and optional index.ts via --write-entry)
  - projects/<slug>/artifacts/asset_manifest.json & artifacts/edit_decisions.json
  - Updates script.json section windows and scene_manifest.json duration_frames
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import wave
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Callable

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


def _atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f"{path.name}.tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def _atomic_write_json(path: Path, data: Any) -> None:
    _atomic_write_text(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def _norm_token(s: str) -> str:
    return re.sub(r"[^\w]", "", s.lower())


def _srt_timestamp(t: float) -> str:
    ms = int(round((t - int(t)) * 1000))
    s = int(t)
    if ms >= 1000:
        s += 1
        ms -= 1000
    return f"{s // 3600:02}:{(s % 3600) // 60:02}:{s % 60:02},{ms:03}"


def _apply_lexicon(text: str, lexicon: dict[str, Any] | None) -> str:
    if not lexicon or not text:
        return text
    out = text
    replacements = lexicon.get("replacements") or lexicon.get("pronunciations") or {}
    if isinstance(replacements, dict):
        for src, dst in sorted(replacements.items(), key=lambda kv: len(kv[0]), reverse=True):
            if src and isinstance(dst, str):
                out = re.sub(rf"\b{re.escape(src)}\b", dst, out)
    return out


def _probe_wav_duration(wav_path: Path) -> float:
    with wave.open(str(wav_path), "rb") as w:
        return round(w.getnframes() / float(w.getframerate()), 3)


def _default_tts_runner(text: str, out_raw_wav: Path, *, voice: str | None, threads: int) -> None:
    from tools.audio.vieneu_tts import VieneuTTS

    res = VieneuTTS().execute({
        "text": text,
        "output_path": str(out_raw_wav),
        "voice": voice,
        "threads": threads,
    })
    if not res.success:
        raise RuntimeError(f"VieneuTTS failed: {res.error}")


def _default_whisper_transcriber(model_size: str, language: str) -> Callable[[Path], list[dict[str, Any]]]:
    from faster_whisper import WhisperModel

    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    def _transcribe(wav_path: Path) -> list[dict[str, Any]]:
        segs_iter, _info = model.transcribe(str(wav_path), language=language, word_timestamps=True)
        words: list[dict[str, Any]] = []
        for seg in segs_iter:
            for w in getattr(seg, "words", []) or []:
                words.append({
                    "word": str(w.word).strip(),
                    "start": round(float(w.start), 3),
                    "end": round(float(w.end), 3),
                })
        return words

    return _transcribe


def _align_script_tokens_to_asr(
    tokens: list[str],
    asr_words: list[dict[str, Any]],
    audio_sec: float,
) -> list[tuple[float, float]]:
    if not tokens:
        return []
    asr_norm = [_norm_token(w["word"]) for w in asr_words]
    tok_norm = [_norm_token(t) for t in tokens]
    matcher = SequenceMatcher(None, tok_norm, asr_norm, autojunk=False)
    slots: list[tuple[float, float] | None] = [None] * len(tokens)
    for a, b, size in matcher.get_matching_blocks():
        for i in range(size):
            slots[a + i] = (float(asr_words[b + i]["start"]), float(asr_words[b + i]["end"]))
    i = 0
    while i < len(slots):
        if slots[i] is not None:
            i += 1
            continue
        first = i
        while i < len(slots) and slots[i] is None:
            i += 1
        lo = slots[first - 1][1] if first else 0.0
        hi = slots[i][0] if i < len(slots) else audio_sec
        hi = max(lo, hi)
        count = i - first
        for k in range(count):
            slots[first + k] = (
                lo + (hi - lo) * k / count,
                lo + (hi - lo) * (k + 1) / count,
            )
    return [(round(s[0], 3), round(s[1], 3)) for s in slots if s is not None]


def _chunk_captions(
    tokens: list[str],
    slots: list[tuple[float, float]],
    *,
    section_start_sec: float,
    max_words: int = 6,
    max_chars: int = 64,
) -> tuple[list[dict[str, Any]], list[tuple[list[str], float, float]]]:
    chunks: list[dict[str, Any]] = []
    srt_rows: list[tuple[list[str], float, float]] = []
    i = 0
    while i < len(tokens):
        group: list[str] = []
        j = i
        while j < len(tokens) and len(group) < max_words:
            cand = " ".join(group + [tokens[j]])
            if group and len(cand) > max_chars:
                break
            group.append(tokens[j])
            j += 1
        st_local = slots[i][0]
        en_local = slots[j - 1][1]
        text = " ".join(group)
        chunks.append({
            "text": text,
            "start": round(st_local, 3),
            "end": round(max(st_local + 0.05, en_local), 3),
            "global_start": round(section_start_sec + st_local, 3),
            "global_end": round(section_start_sec + max(st_local + 0.05, en_local), 3),
        })
        srt_rows.append((group, section_start_sec + st_local, section_start_sec + max(st_local + 0.05, en_local)))
        i = j
    return chunks, srt_rows


def _pascal_case(slug: str) -> str:
    return "".join(part.capitalize() for part in re.split(r"[^a-zA-Z0-9]+", slug) if part)


def _render_timing_ts(slug: str, fps: int, sections: list[dict[str, Any]], scenes_end_frame: int, total_frames: int) -> str:
    lines = [
        f"// Frozen timing contract derived strictly from projects/{slug}/assets/scene_timing.json",
        'import { BRAND_BUMPER_FRAMES } from "../components/news";',
        "",
        f"export const FPS = {fps} as const;",
        f'export const ASSET_BASE = "{slug}" as const;',
        'export const ARCHIVAL_IMG_FILTER = "contrast(1.08) brightness(0.92)" as const;',
        "",
        "export function after(frame: number, start: number): boolean {",
        "  return frame >= start;",
        "}",
        "",
        "export function between(frame: number, start: number, end: number): boolean {",
        "  return frame >= start && frame < end;",
        "}",
        "",
        "export interface SceneTimingEntry {",
        "  scene_id: string;",
        "  sectionId: string;",
        "  start_frame: number;",
        "  duration_frames: number;",
        "  start_seconds: number;",
        "  end_seconds: number;",
        "  speech_seconds: number;",
        "}",
        "",
        "export const SCENES: Record<string, SceneTimingEntry> = {",
    ]
    order = []
    for st in sections:
        sid = st["scene_id"]
        order.append(sid)
        lines.append(
            f'  "{sid}": {{ scene_id: "{sid}", sectionId: "{st["section_id"]}", '
            f'start_frame: {st["start_frame"]}, duration_frames: {st["duration_frames"]}, '
            f'start_seconds: {st["start_seconds"]}, end_seconds: {st["end_seconds"]}, '
            f'speech_seconds: {st["speech_seconds"]} }},'
        )
    lines.extend([
        "};",
        "",
        f"export const SCENE_ORDER = {json.dumps(order)} as const;",
        f"export const SCENES_END_FRAME = {scenes_end_frame};",
        f"export const TOTAL_FRAMES = {total_frames};",
        "export { BRAND_BUMPER_FRAMES };",
        "",
    ])
    return "\n".join(lines)


def _render_episode_index_ts(slug: str, fps: int) -> str:
    comp_name = f"Episode{_pascal_case(slug)}"
    return (
        'import React from "react";\n'
        'import { Composition, registerRoot } from "remotion";\n'
        f'import {{ {comp_name}, TOTAL_FRAMES }} from "./Episode";\n\n'
        f"const {comp_name}Root: React.FC = () => (\n"
        "  <>\n"
        "    <Composition\n"
        f'      id="{slug}-DRAFT"\n'
        f"      component={{{comp_name}}}\n"
        "      durationInFrames={TOTAL_FRAMES}\n"
        f"      fps={{{fps}}}\n"
        "      width={1080}\n"
        "      height={1920}\n"
        "      defaultProps={{ showHud: true }}\n"
        "    />\n"
        "    <Composition\n"
        f'      id="{slug}-FINAL"\n'
        f"      component={{{comp_name}}}\n"
        "      durationInFrames={TOTAL_FRAMES}\n"
        f"      fps={{{fps}}}\n"
        "      width={1080}\n"
        "      height={1920}\n"
        "      defaultProps={{ showHud: false }}\n"
        "    />\n"
        "  </>\n"
        ");\n\n"
        f"registerRoot({comp_name}Root);\n"
    )


def build_episode_audio(
    project_dir: Path | str,
    *,
    channel: str | None = None,
    script_rel: str | None = None,
    lexicon_rel: str = "tts_lexicon.json",
    tail_seconds: float | None = None,
    speed: float | None = None,
    fps: int | None = None,
    bumper_frames: int | None = None,
    whisper_model: str = "small",
    language: str | None = None,
    voice: str | None = None,
    threads: int = 4,
    skip_tts: bool = False,
    force_tts: bool = False,
    bgm_path: Path | str | None = None,
    write_entry: bool = False,
    composer_root: Path | None = None,
    tts_fn: Callable[[str, Path], None] | None = None,
    transcribe_fn: Callable[[Path], list[dict[str, Any]]] | None = None,
) -> dict[str, Any]:
    from lib.channels import (
        detect_project_channel,
        load_channel,
        load_merged_lexicon,
        resolve_channel_asset,
    )

    proj = Path(project_dir).resolve()
    if not proj.is_dir():
        raise FileNotFoundError(f"Project directory not found: {proj}")

    resolved_channel = channel or detect_project_channel(proj)
    ch_cfg: dict[str, Any] = {}
    if resolved_channel:
        try:
            ch_cfg = load_channel(resolved_channel)
        except Exception:
            ch_cfg = {}

    ch_audio = ch_cfg.get("audio") or {}
    ch_canvas = ch_cfg.get("canvas") or {}
    ch_brand = ch_cfg.get("brand") or {}

    resolved_tail = float(tail_seconds if tail_seconds is not None else ch_audio.get("tail_seconds", 0.25))
    resolved_speed = float(speed if speed is not None else ch_audio.get("speed", 1.15))
    resolved_fps = int(fps if fps is not None else ch_canvas.get("fps", 30))
    if bumper_frames is not None:
        resolved_bumper_frames = int(bumper_frames)
    elif ch_cfg:
        resolved_bumper_frames = int(ch_brand.get("bumper_frames", 0)) if ch_brand.get("bumper_enabled") else 0
    else:
        resolved_bumper_frames = 90
    resolved_language = str(language if language is not None else ch_audio.get("language", "vi"))
    resolved_voice = voice if voice is not None else ch_audio.get("voice")

    tail_seconds = resolved_tail
    speed = resolved_speed
    fps = resolved_fps
    bumper_frames = resolved_bumper_frames
    language = resolved_language
    voice = resolved_voice

    slug = proj.name
    comp_base = composer_root or (REPO_ROOT / "remotion-composer")
    pub = comp_base / "public" / slug
    comp_src = comp_base / "src" / slug
    raw_dir = proj / "assets" / "audio" / "_raw"
    audio_dir = proj / "assets" / "audio"
    pub_audio = pub / "audio"
    for d in (raw_dir, audio_dir, pub_audio, comp_src, proj / "artifacts"):
        d.mkdir(parents=True, exist_ok=True)

    script_p = (
        (proj / script_rel)
        if script_rel
        else next((p for p in (proj / "artifacts" / "script.json", proj / "script.json") if p.is_file()), None)
    )
    if script_p is None or not script_p.is_file():
        raise FileNotFoundError(f"script.json not found in {proj}")
    script = json.loads(script_p.read_text(encoding="utf-8"))
    sections = script.get("sections") or []
    if not sections:
        raise ValueError(f"script.json has no sections[]: {script_p}")

    lexicon = load_merged_lexicon(resolved_channel, proj, lexicon_rel)

    if tts_fn is None:
        tts_fn = lambda txt, out_p: _default_tts_runner(txt, out_p, voice=voice, threads=threads)
    if transcribe_fn is None:
        transcribe_fn = _default_whisper_transcriber(whisper_model, language)

    # 1. TTS + atempo per section
    for sec in sections:
        sid = str(sec["id"]).lower()
        out_wav = audio_dir / f"voice_{sid}.wav"
        pub_wav = pub_audio / f"voice_{sid}.wav"
        raw_wav = raw_dir / f"raw_{sid}.wav"

        if not skip_tts:
            cues = sec.get("delivery_cues") or {}
            raw_text = str(cues.get("provider_text") or "").strip() or _apply_lexicon(str(sec.get("text") or ""), lexicon)
            if force_tts or not raw_wav.is_file():
                tts_fn(raw_text, raw_wav)
            if abs(speed - 1.0) > 1e-3:
                subprocess.run(
                    [
                        "ffmpeg", "-y", "-loglevel", "error", "-i", str(raw_wav),
                        "-filter:a", f"atempo={speed:.3f}", "-ar", "48000", "-ac", "1", str(out_wav),
                    ],
                    check=True,
                )
            else:
                shutil.copy2(raw_wav, out_wav)
        elif not out_wav.is_file():
            raise FileNotFoundError(f"--skip-tts set but voice stem missing: {out_wav}")

        shutil.copy2(out_wav, pub_wav)

    # 2. Whisper alignment + scene timing + captions
    scene_timing: list[dict[str, Any]] = []
    narration_words: dict[str, Any] = {}
    words_sections: dict[str, list[dict[str, Any]]] = {}
    captions: dict[str, list[dict[str, Any]]] = {}
    srt_entries: list[tuple[list[str], float, float]] = []

    cursor_sec = 0.0
    frame_cursor = 0
    for idx, sec in enumerate(sections, start=1):
        sid = str(sec["id"]).lower()
        scene_code = f"S{idx:02d}"
        wav = audio_dir / f"voice_{sid}.wav"
        audio_sec = _probe_wav_duration(wav)
        asr_words = transcribe_fn(wav)
        if not asr_words:
            raise RuntimeError(f"ASR returned zero words for {sid} ({wav})")

        start_sec = round(cursor_sec, 3)
        dur_sec = round(audio_sec + tail_seconds, 3)
        dur_frames = max(1, int(round(dur_sec * fps)))
        end_sec = round(start_sec + dur_frames / float(fps), 3)

        global_words = [
            {
                "word": w["word"],
                "local_start": round(float(w["start"]), 3),
                "local_end": round(float(w["end"]), 3),
                "start": round(start_sec + float(w["start"]), 3),
                "end": round(start_sec + float(w["end"]), 3),
                "start_frame": int(round((start_sec + float(w["start"])) * fps)),
                "end_frame": int(round((start_sec + float(w["end"])) * fps)),
            }
            for w in asr_words
        ]

        scene_timing.append({
            "scene_id": f"scene-{idx}",
            "section_id": sid,
            "label": sec.get("label", f"Scene {idx}"),
            "start_seconds": start_sec,
            "start_frame": frame_cursor,
            "end_seconds": end_sec,
            "duration_frames": dur_frames,
            "duration_seconds": round(dur_frames / float(fps), 3),
            "speech_seconds": audio_sec,
            "audio_seconds": audio_sec,
            "voice_wav": f"assets/audio/voice_{sid}.wav",
        })

        narration_words[sid] = {
            "section_id": sid,
            "scene_id": scene_code,
            "global_start": start_sec,
            "audio_seconds": audio_sec,
            "words": global_words,
        }
        words_sections[sid] = [
            {
                "word": gw["word"],
                "start": gw["local_start"],
                "end": gw["local_end"],
                "global_start": gw["start"],
                "global_end": gw["end"],
            }
            for gw in global_words
        ]

        tokens = str(sec.get("text") or "").split()
        slots = _align_script_tokens_to_asr(tokens, asr_words, audio_sec)
        sec_chunks, sec_srt = _chunk_captions(tokens, slots, section_start_sec=start_sec)
        captions[sid] = sec_chunks
        srt_entries.extend(sec_srt)

        sec["start_seconds"] = start_sec
        sec["end_seconds"] = end_sec
        cursor_sec = end_sec
        frame_cursor += dur_frames

    scenes_end_frame = frame_cursor
    scenes_seconds = round(scenes_end_frame / float(fps), 3)
    total_frames = scenes_end_frame + bumper_frames
    total_seconds = round(total_frames / float(fps), 3)

    timing_payload = {
        "version": "1.0",
        "project_id": slug,
        "fps": fps,
        "tail_seconds": tail_seconds,
        "scenes_end_frame": scenes_end_frame,
        "scenes_seconds": scenes_seconds,
        "outro_bumper_frames": bumper_frames,
        "total_frames": total_frames,
        "total_seconds": total_seconds,
        "sections": scene_timing,
        "scenes": scene_timing,
    }
    _atomic_write_json(proj / "assets" / "scene_timing.json", timing_payload)
    _atomic_write_json(pub / "scene_timing.json", timing_payload)
    _atomic_write_json(proj / "assets" / "words.json", {"version": "1.0", "project_id": slug, "sections": words_sections})
    _atomic_write_json(proj / "artifacts" / "narration_words.json", narration_words)
    _atomic_write_json(pub / "words.json", narration_words)
    _atomic_write_json(pub / "captions.json", {"version": "1.0", "clock": "scene_local", "captions": captions})

    srt_lines = [
        f"{idx}\n{_srt_timestamp(st)} --> {_srt_timestamp(en)}\n{' '.join(toks)}\n"
        for idx, (toks, st, en) in enumerate(srt_entries, start=1)
    ]
    _atomic_write_text(proj / "assets" / "subtitles.srt", "\n".join(srt_lines))

    script["total_duration_seconds"] = scenes_seconds
    _atomic_write_json(script_p, script)

    for sm_p in (proj / "scene_manifest.json", proj / "artifacts" / "scene_manifest.json"):
        if sm_p.is_file():
            sm = json.loads(sm_p.read_text(encoding="utf-8"))
            for idx, sc in enumerate(sm.get("scenes", [])):
                if idx < len(scene_timing):
                    sc["duration_frames"] = scene_timing[idx]["duration_frames"]
            _atomic_write_json(sm_p, sm)

    # 3. Optional normalized BGM ingestion
    bgm_info: dict[str, Any] | None = None
    if bgm_path:
        from tools.qc.mixdown import prepare_bgm_bed
        from tools.qc.bgm_gate import probe_duration
        cand_bgm = Path(bgm_path)
        if not cand_bgm.is_file():
            resolved_bgm = (
                resolve_channel_asset(resolved_channel, f"bgm/{bgm_path}", project_dir=proj)
                or resolve_channel_asset(resolved_channel, str(bgm_path), project_dir=proj)
            )
            if resolved_bgm is not None:
                cand_bgm = resolved_bgm
        bgm_src = cand_bgm.resolve()
        bgm_work = proj / "renders" / "_master_work"
        norm_bgm_wav = prepare_bgm_bed(bgm_src, total_seconds, bgm_work, out_path=bgm_work / "bgm_ingested.wav")
        music_dir = proj / "assets" / "music"
        music_dir.mkdir(parents=True, exist_ok=True)
        proj_bgm = music_dir / "bgm.mp3"
        pub_bgm = pub / "bgm.mp3"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(norm_bgm_wav), "-c:a", "libmp3lame", "-b:a", "192k", str(proj_bgm)],
            check=True,
        )
        shutil.copy2(proj_bgm, pub_bgm)
        norm_bgm_wav.unlink(missing_ok=True)
        bgm_info = {"path": "assets/music/bgm.mp3", "duration_seconds": round(probe_duration(proj_bgm), 3)}

    # 4. Schema-valid asset_manifest.json & edit_decisions.json
    existing_manifest_p = proj / "artifacts" / "asset_manifest.json"
    preserved_non_narration: list[dict[str, Any]] = []
    if existing_manifest_p.is_file():
        old_m = json.loads(existing_manifest_p.read_text(encoding="utf-8"))
        preserved_non_narration = [
            a for a in old_m.get("assets", [])
            if a.get("type") not in {"narration"} and not (bgm_info and a.get("id") == "bgm_main")
        ]

    assets: list[dict[str, Any]] = []
    total_speech = 0.0
    for idx, (sec, st) in enumerate(zip(sections, scene_timing), start=1):
        sid = st["section_id"]
        cues = sec.get("delivery_cues") or {}
        total_speech += float(st["speech_seconds"])
        assets.append({
            "id": f"tts_voice_{sid}",
            "type": "narration",
            "path": f"assets/audio/voice_{sid}.wav",
            "source_tool": "vieneu_tts",
            "scene_id": f"scene-{idx}",
            "duration_seconds": st["speech_seconds"],
            "format": "wav",
            "voice_performance": {
                "source_section_id": sid,
                "delivery_cues_applied": bool(cues),
                "provider_text_used": bool(cues.get("provider_text")),
            },
        })
    if bgm_info:
        assets.append({
            "id": "bgm_main",
            "type": "music",
            "path": bgm_info["path"],
            "source_tool": "music_library",
            "scene_id": "all",
            "duration_seconds": bgm_info["duration_seconds"],
            "format": "mp3",
        })
    assets.extend(preserved_non_narration)

    _atomic_write_json(existing_manifest_p, {
        "version": "1.0",
        "assets": assets,
        "metadata": {"total_audio_speech_duration_seconds": round(total_speech, 3)},
    })

    cuts = [
        {
            "id": f"cut-{st['section_id']}",
            "source": f"assets/audio/voice_{st['section_id']}.wav",
            "in_seconds": st["start_seconds"],
            "out_seconds": round(st["start_seconds"] + st["speech_seconds"], 3),
            "layer": "primary",
            "transition_in": "cut",
            "transition_out": "cut",
        }
        for st in scene_timing
    ]
    segments = [
        {
            "asset_id": f"tts_voice_{st['section_id']}",
            "start_seconds": st["start_seconds"],
            "end_seconds": round(st["start_seconds"] + st["speech_seconds"], 3),
        }
        for st in scene_timing
    ]
    _atomic_write_json(proj / "artifacts" / "edit_decisions.json", {
        "version": "1.0",
        "render_runtime": "remotion",
        "composition_mode": "atelier",
        "cuts": cuts,
        "audio": {"narration": {"segments": segments}},
        "metadata": {"tail_seconds": tail_seconds, "total_frames": total_frames},
    })

    # 5. Remotion timing.ts (+ optional index.ts)
    _atomic_write_text(comp_src / "timing.ts", _render_timing_ts(slug, fps, scene_timing, scenes_end_frame, total_frames))
    if write_entry:
        _atomic_write_text(comp_src / "index.ts", _render_episode_index_ts(slug, fps))

    return {
        "project": slug,
        "sections": len(scene_timing),
        "speech_seconds": round(total_speech, 3),
        "scenes_seconds": scenes_seconds,
        "total_seconds": total_seconds,
        "total_frames": total_frames,
        "timing_ts": str(comp_src / "timing.ts"),
        "captions_json": str(pub / "captions.json"),
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Build TTS, Whisper alignment, captions, and timing lock for an episode.")
    ap.add_argument("--project", required=True, help="projects/<slug> or projects/<channel>/<slug> directory")
    ap.add_argument("--channel", default=None, help="Optional channel id override (defaults to project.json/parent dir)")
    ap.add_argument("--script", default=None, help="Optional relative path to script.json")
    ap.add_argument("--lexicon", default="tts_lexicon.json", help="Lexicon JSON relative to project dir")
    ap.add_argument("--tail", type=float, default=None, help="Per-scene post-speech breathing pad in seconds (default from channel.yaml or 0.25)")
    ap.add_argument("--speed", type=float, default=None, help="ffmpeg atempo factor (default from channel.yaml or 1.15)")
    ap.add_argument("--fps", type=int, default=None, help="FPS (default from channel.yaml or 30)")
    ap.add_argument("--bumper-frames", type=int, default=None, help="Bumper frames (default from channel.yaml or 90)")
    ap.add_argument("--whisper-model", default="small")
    ap.add_argument("--language", default=None, help="Language code (default from channel.yaml or vi)")
    ap.add_argument("--voice", default=None)
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--skip-tts", action="store_true", help="Reuse existing assets/audio/voice_*.wav files")
    ap.add_argument("--force-tts", action="store_true", help="Regenerate raw TTS even if cached")
    ap.add_argument("--bgm", default=None, help="Optional BGM file or filename in channel assets/bgm/ to trim, normalize (-16 LUFS), and stage")
    ap.add_argument("--write-entry", action="store_true", help="Write per-episode remotion-composer/src/<slug>/index.ts")
    args = ap.parse_args(argv)

    summary = build_episode_audio(
        args.project,
        channel=args.channel,
        script_rel=args.script,
        lexicon_rel=args.lexicon,
        tail_seconds=args.tail,
        speed=args.speed,
        fps=args.fps,
        bumper_frames=args.bumper_frames,
        whisper_model=args.whisper_model,
        language=args.language,
        voice=args.voice,
        threads=args.threads,
        skip_tts=args.skip_tts,
        force_tts=args.force_tts,
        bgm_path=args.bgm,
        write_entry=args.write_entry,
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
