#!/usr/bin/env python3
"""Run ASR for 10 regenerated sections with faster-whisper base.
"""
from __future__ import annotations

import json
import shutil
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.analysis.transcriber import Transcriber

PROJECT_DIR = REPO_ROOT / "projects" / "thanh-giong"
AUDIO_DIR = PROJECT_DIR / "assets" / "audio"
TRANSCRIPTS_DIR = AUDIO_DIR / "transcripts"
TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

CHANGED_IDS = ["s03", "s08", "s09", "s11", "s12", "s13", "s14", "s15", "s22", "s23"]

def main():
    t0 = time.time()
    print("=== START ASR FOR 10 REGENERATED SECTIONS ===")
    transcriber = Transcriber()

    results = {}
    for idx, sid in enumerate(CHANGED_IDS, 1):
        wav_path = AUDIO_DIR / f"{sid}.wav"
        print(f"[{idx}/10] Transcribing {sid} ({wav_path.name})...")
        t_sec = time.time()
        res = transcriber.execute({
            "input_path": str(wav_path.resolve()),
            "language": "vi",
            "model_size": "base",
            "output_dir": str(AUDIO_DIR.resolve()),
        })
        if not res.success:
            raise RuntimeError(f"ASR failed for {sid}: {res.error}")
        
        # Copy to transcripts/
        src_tr = AUDIO_DIR / f"{sid}_transcript.json"
        dst_tr = TRANSCRIPTS_DIR / f"{sid}_transcript.json"
        shutil.copy2(src_tr, dst_tr)

        data = res.data or {}
        n_words = len(data.get("word_timestamps", []))
        dur = data.get("duration_seconds", 0.0)
        elapsed_sec = round(time.time() - t_sec, 2)
        print(f"  -> {sid}: {dur:.2f}s, {n_words} words transcribed ({elapsed_sec}s)")
        results[sid] = {
            "duration": dur,
            "words_count": n_words,
            "elapsed_sec": elapsed_sec,
        }

    total_elapsed = round(time.time() - t0, 2)
    print(f"\nAll 10 sections transcribed successfully in {total_elapsed}s.")
    
    # Save summary report
    summary_path = PROJECT_DIR / "qc" / "asr_rebuild_10.json"
    summary_path.write_text(json.dumps({
        "status": "success",
        "total_elapsed_seconds": total_elapsed,
        "sections": results,
    }, indent=2), encoding="utf-8")
    print(f"Wrote summary to {summary_path}")

if __name__ == "__main__":
    main()
