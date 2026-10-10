#!/usr/bin/env python
"""btc-tradingagents-20261008 — stage ASSETS, audio batch (idempotent, resumable).

Phase 1: vieneu TTS per section (provider_text đã áp tts_lexicon) -> atempo=1.15 in-place
Phase 2: tts_batch_summary.json
Phase 3: concat voice_sXX + 0.65s silence gaps -> narration_full.wav
Phase 4: faster-whisper (language=vi) -> narration_full_transcript.json
Phase 5: transcripts/narration_words.json (per-word global_start/end)
Phase 6: subtitles.srt — CANONICAL script text mapped onto whisper word time-slots
         (standing rule 2026-10-04: captions dùng script text, không dùng whisper mangled text)

Usage: .venv/bin/python scripts/btc08_audio_batch.py [--force]
"""
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PROJECT_ID = "btc-tradingagents-20261008"
PROJ = REPO / "projects" / PROJECT_ID
AUDIO = PROJ / "assets" / "audio"
TRANSCRIPTS = AUDIO / "transcripts"
VIENEU_PY = Path.home() / "project" / "vietnamese-tts" / ".venv" / "bin" / "python"
VIENEU_CLI = Path.home() / "project" / "vietnamese-tts" / "vieneu_cli.py"
ATEMPO = 1.15
GAP = 0.65
FORCE = "--force" in sys.argv

TZ = timezone(timedelta(hours=7))


def now_iso():
    return datetime.now(TZ).isoformat()


def run(cmd, timeout=300):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=True)


def ffprobe_duration(path: Path) -> float:
    out = run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ])
    return round(float(out.stdout.strip()), 3)


def apply_lexicon(text: str, lexicon: dict) -> str:
    """Fallback only — script.json đã có provider_text cho mọi section."""
    for term, entry in lexicon.get("entries", {}).items():
        resp = entry.get("respelling", "")
        if not resp or "display only" in resp or resp.startswith("(") or "(sau số)" in resp:
            continue
        if entry.get("status") == "keep":
            continue
        text = text.replace(term, resp)
    return text


def write_in_progress_checkpoint():
    try:
        sys.path.insert(0, str(REPO))
        from lib.checkpoint import write_checkpoint
        write_checkpoint(
            PROJECT_ID, "assets", "in_progress",
            metadata={"partial_progress": {"audio": "batch_running"}},
        )
    except Exception as exc:  # board progress only — never block the batch
        print(f"[warn] checkpoint in_progress failed (non-fatal): {exc}", flush=True)


# ---------------------------------------------------------------- Phase 1+2
def tts_batch(script: dict, lexicon: dict) -> list[dict]:
    sections = []
    for sec in script["sections"]:
        sid = sec["id"]
        planned = round(sec["end_seconds"] - sec["start_seconds"], 1)
        out = AUDIO / f"voice_{sid}.wav"
        pt = sec.get("delivery_cues", {}).get("provider_text") or apply_lexicon(sec["text"], lexicon)

        if out.exists() and not FORCE:
            dur = ffprobe_duration(out)
            print(f"[tts] {sid} EXISTS dur={dur}s — skip", flush=True)
            sections.append({
                "id": sid, "label": sec["label"], "text_chars": len(pt),
                "planned_seconds": planned, "duration_seconds": dur,
                "duration_after_tempo": dur,
                "deviation_pct": round((dur - planned) / planned * 100, 1),
                "gen_seconds": None, "raw_duration_seconds": None, "sample_rate": 48000,
            })
            continue

        t0 = time.time()
        res = run([
            str(VIENEU_PY), str(VIENEU_CLI), "--text", pt, "--output", str(out),
        ], timeout=600)
        line = res.stdout.strip().splitlines()[-1]
        info = json.loads(line)
        if not info.get("ok"):
            raise RuntimeError(f"{sid}: vieneu ok=false — {info}")
        raw_dur = round(float(info["audio_seconds"]), 3)
        gen_s = round(float(info["gen_seconds"]), 3)

        tmp = out.with_suffix(".tmp.wav")
        run(["ffmpeg", "-y", "-i", str(out), "-filter:a", f"atempo={ATEMPO}",
             "-ar", "48000", "-ac", "1", str(tmp)])
        os.replace(tmp, out)
        dur = ffprobe_duration(out)
        print(f"[tts] {sid} raw={raw_dur}s -> tempo={dur}s (plan {planned}s) "
              f"gen={gen_s}s wall={time.time()-t0:.1f}s", flush=True)
        sections.append({
            "id": sid, "label": sec["label"], "text_chars": len(pt),
            "planned_seconds": planned, "raw_duration_seconds": raw_dur,
            "duration_seconds": dur, "duration_after_tempo": dur,
            "deviation_pct": round((dur - planned) / planned * 100, 1),
            "gen_seconds": gen_s, "sample_rate": info.get("sample_rate", 48000),
        })

    total_voice = round(sum(s["duration_seconds"] for s in sections), 3)
    total_gap = round(GAP * (len(sections) - 1), 3)
    summary = {
        "version": "1.0",
        "project_id": PROJECT_ID,
        "generated_at": now_iso(),
        "provider": "vieneu (local) default voice, 48kHz, voice=None",
        "atempo": ATEMPO,
        "gap_seconds": GAP,
        "total_voice_seconds": total_voice,
        "total_gap_seconds": total_gap,
        "total_duration_seconds": round(total_voice + total_gap, 3),
        "sections": sections,
    }
    (AUDIO / "tts_batch_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[summary] voice={total_voice}s + gaps={total_gap}s = {summary['total_duration_seconds']}s", flush=True)
    return sections


# ---------------------------------------------------------------- Phase 3
def concat_full(sections: list[dict]) -> float:
    silence = AUDIO / "silence_065.wav"
    if not silence.exists():
        run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
             "-t", str(GAP), "-c:a", "pcm_s16le", str(silence)])
    lst = AUDIO / "concat_list.txt"
    lines = []
    for i, s in enumerate(sections):
        lines.append(f"file '{AUDIO / f'voice_{s['id']}.wav'}'")
        if i < len(sections) - 1:
            lines.append(f"file '{silence}'")
    lst.write_text("\n".join(lines) + "\n")
    full = AUDIO / "narration_full.wav"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-c:a", "pcm_s16le", str(full)])
    lst.unlink()
    dur = ffprobe_duration(full)
    print(f"[concat] narration_full.wav {dur}s", flush=True)
    return dur


# ---------------------------------------------------------------- Phase 4
def transcribe(full_dur: float) -> dict:
    sys.path.insert(0, str(REPO))
    from tools.analysis.transcriber import Transcriber
    result = Transcriber().execute({
        "input_path": str(AUDIO / "narration_full.wav"), "language": "vi"})
    if not result.success:
        raise RuntimeError(f"whisper failed: {result.error}")
    data = result.data
    (AUDIO / "narration_full_transcript.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[whisper] {len(data.get('word_timestamps', []))} words, "
          f"engine duration={data.get('duration_seconds')}", flush=True)
    return data


# ---------------------------------------------------------------- Phase 5
def write_words_json(words_raw: list[dict], full_dur: float) -> int:
    TRANSCRIPTS.mkdir(parents=True, exist_ok=True)
    words = []
    for w in words_raw:
        text = (w.get("word") or "").strip()
        if not text:
            continue
        words.append({
            "text": text,
            "global_start": w["start"],
            "global_end": w["end"],
            "probability": w.get("probability"),
        })
    payload = {
        "version": "1.0",
        "project_id": PROJECT_ID,
        "source": "assets/audio/narration_full.wav",
        "engine": "faster-whisper via tools.analysis.transcriber, language=vi",
        "generated_at": now_iso(),
        "total_duration_seconds": full_dur,
        "words": words,
    }
    (TRANSCRIPTS / "narration_words.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[words] {len(words)} timed words -> transcripts/narration_words.json", flush=True)
    return len(words)


# ---------------------------------------------------------------- Phase 6
def fmt_ts(t: float) -> str:
    ms = int(round(t * 1000))
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(script: dict, sections: list[dict], whisper_words: list[dict], full_dur: float) -> int:
    """Canonical provider_text words timed onto whisper word slots (per section)."""
    # section boundaries in narration_full
    bounds = []
    t = 0.0
    for s in sections:
        bounds.append((t, t + s["duration_seconds"]))
        t += s["duration_seconds"] + GAP

    def wtime(w):
        return (w.get("global_start") if isinstance(w, dict) else w["start"],
                w.get("global_end") if isinstance(w, dict) else w["end"])

    timed_words = []  # (section_idx, text, start, end)
    for i, sec in enumerate(script["sections"]):
        sec_start, sec_end = bounds[i]
        pt = sec.get("delivery_cues", {}).get("provider_text") or sec["text"]
        canon = pt.split()
        if not canon:
            continue
        in_sec = []
        for w in whisper_words:
            ws, we = wtime(w)
            mid = (ws + we) / 2 if ws is not None and we is not None else None
            if mid is not None and sec_start <= mid < sec_end:
                in_sec.append((ws, we))
        K, M = len(in_sec), len(canon)
        for j, word in enumerate(canon):
            if K > 0:
                a = in_sec[min(K - 1, round(j * K / M))][0]
                b = in_sec[min(K - 1, max(round(j * K / M), round((j + 1) * K / M) - 1))][1]
                start = max(a, sec_start) if a is not None else sec_start
                end = min(b, sec_end) if b is not None else sec_end
                if end <= start:
                    end = start + 0.12
            else:
                d = sec_end - sec_start
                start = sec_start + d * j / M
                end = sec_start + d * (j + 1) / M
            timed_words.append((i, word, round(start, 3), round(end, 3)))

    # cue packing: <=6 words, <=3.5s, sentence-punct aware
    cues = []
    cur = []
    for tw in timed_words:
        cur.append(tw)
        text = tw[1]
        span = cur[-1][3] - cur[0][2]
        end_punct = text.endswith((".", "?", "!", "…")) or text in ("—",)
        if len(cur) >= 6 or span > 3.5 or (end_punct and len(cur) >= 3):
            cues.append(cur)
            cur = []
    if cur:
        cues.append(cur)

    lines = []
    for idx, cue in enumerate(cues, 1):
        start = fmt_ts(cue[0][2])
        end = fmt_ts(min(cue[-1][3], full_dur))
        text = " ".join(w[1] for w in cue)
        lines.append(f"{idx}\n{start} --> {end}\n{text}\n")
    (AUDIO / "subtitles.srt").write_text("\n".join(lines), encoding="utf-8")
    print(f"[srt] {len(cues)} cues (canonical text, whisper-timed) -> assets/audio/subtitles.srt", flush=True)
    return len(cues)


def main():
    AUDIO.mkdir(parents=True, exist_ok=True)
    script = json.loads((PROJ / "artifacts" / "script.json").read_text(encoding="utf-8"))
    lexicon = json.loads((PROJ / "tts_lexicon.json").read_text(encoding="utf-8"))
    write_in_progress_checkpoint()

    sections = tts_batch(script, lexicon)
    full_dur = concat_full(sections)
    data = transcribe(full_dur)
    n_words = write_words_json(data.get("word_timestamps", []), full_dur)
    n_cues = write_srt(script, sections, data.get("word_timestamps", []), full_dur)

    print("=== AUDIO BATCH DONE ===", flush=True)
    print(f"narration_full: {full_dur}s (plan 108.8s)", flush=True)
    print(f"words: {n_words} | srt cues: {n_cues}", flush=True)
    for s in sections:
        print(f"  {s['id']}: {s['duration_seconds']}s / plan {s['planned_seconds']}s "
              f"({s['deviation_pct']:+.1f}%)", flush=True)


if __name__ == "__main__":
    main()
