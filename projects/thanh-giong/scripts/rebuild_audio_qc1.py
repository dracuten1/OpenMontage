#!/usr/bin/env python3
"""Rebuild audio QC1 helper for projects/thanh-giong.

Regenerates TTS for 10 changed sections (s03, s08, s09, s11, s12, s13, s14, s15, s22, s23).
Untouched 18 sections are verified identical.
Rebuilds full narration and copies to public/.
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import sys
import time
import wave
from pathlib import Path

# Insert repo root into sys.path
REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.audio.vieneu_tts import VieneuTTS

PROJECT_DIR = REPO_ROOT / "projects" / "thanh-giong"
SCRIPT_PATH = PROJECT_DIR / "artifacts" / "script.json"
MANIFEST_PATH = PROJECT_DIR / "artifacts" / "asset_manifest.json"
AUDIO_DIR = PROJECT_DIR / "assets" / "audio"
TRANSCRIPTS_DIR = AUDIO_DIR / "transcripts"
QC_DIR = PROJECT_DIR / "qc"
BACKUP_DIR = QC_DIR / "pre-audio-rebuild"
STAGE_DIR = QC_DIR / "audio-regenerated"
PUBLIC_FULL_WAV = REPO_ROOT / "remotion-composer" / "public" / "thanh-giong" / "narration_full.wav"
CANONICAL_FULL_WAV = AUDIO_DIR / "narration_full.wav"

CHANGED_IDS = ["s03", "s08", "s09", "s11", "s12", "s13", "s14", "s15", "s22", "s23"]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def get_wav_duration_and_frames(path: Path) -> tuple[float, int]:
    with wave.open(str(path), "rb") as w:
        framerate = w.getframerate()
        nframes = w.getnframes()
        return nframes / framerate, nframes


def main():
    t_start = time.time()
    print("=== START REBUILD AUDIO QC1 ===")

    # 1. Load script
    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        script = json.load(f)

    # 2. Apply script fixes
    # s11 text+provider_text 'bộ giáp và thanh roi' -> 'bộ giáp và thanh kiếm'
    # s27 enhancement description only replace with poverty/smallcloth silhouettenospoil, no river
    script_modified = False
    for sec in script.get("sections", []):
        sid = sec["id"]
        if sid == "s11":
            if "bộ giáp và thanh roi" in sec.get("text", ""):
                sec["text"] = sec["text"].replace("bộ giáp và thanh roi", "bộ giáp và thanh kiếm")
                script_modified = True
            cues = sec.get("delivery_cues", {})
            if "bộ giáp và thanh roi" in cues.get("provider_text", ""):
                cues["provider_text"] = cues["provider_text"].replace("bộ giáp và thanh roi", "bộ giáp và thanh kiếm")
                script_modified = True
        elif sid == "s27":
            for cue in sec.get("enhancement_cues", []):
                cue["description"] = (
                    "Bóng silhouette người đàn ông nghèo khó, tấm vải nhỏ thô sơ "
                    "(không mặt, không tên — không spoil, không cảnh sông)"
                )
                script_modified = True

    with open(SCRIPT_PATH, "w", encoding="utf-8") as f:
        json.dump(script, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Applied fixes to script.json (modified: {script_modified})")

    # Determine all sections and untouched 18
    all_sections = script.get("sections", [])
    all_ids = [s["id"] for s in all_sections]
    untouched_ids = [s_id for s_id in all_ids if s_id not in CHANGED_IDS]
    assert len(CHANGED_IDS) == 10, f"Expected 10 changed IDs, got {len(CHANGED_IDS)}"
    assert len(untouched_ids) == 18, f"Expected 18 untouched IDs, got {len(untouched_ids)}"

    # Record hashes BEFORE any new audio
    hashes_before = {}
    for sid in all_ids:
        wav_file = AUDIO_DIR / f"{sid}.wav"
        if wav_file.exists():
            hashes_before[sid] = sha256_file(wav_file)
    hashes_before_full = sha256_file(CANONICAL_FULL_WAV) if CANONICAL_FULL_WAV.exists() else None
    hashes_before_public = sha256_file(PUBLIC_FULL_WAV) if PUBLIC_FULL_WAV.exists() else None

    # 3. Backup before ANY new audio
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_script = BACKUP_DIR / "script_snapshot.json"
    backup_manifest = BACKUP_DIR / "manifest_snapshot.json"
    backup_full = BACKUP_DIR / "narration_full.wav"
    backup_public = BACKUP_DIR / "public_narration_full.wav"
    backup_audio_dir = BACKUP_DIR / "assets" / "audio"
    backup_audio_transcripts = backup_audio_dir / "transcripts"
    backup_audio_transcripts.mkdir(parents=True, exist_ok=True)

    if not backup_script.exists():
        shutil.copy2(SCRIPT_PATH, backup_script)
    if not backup_manifest.exists():
        shutil.copy2(MANIFEST_PATH, backup_manifest)
    if not backup_full.exists() and CANONICAL_FULL_WAV.exists():
        shutil.copy2(CANONICAL_FULL_WAV, backup_full)
    if not backup_public.exists() and PUBLIC_FULL_WAV.exists():
        shutil.copy2(PUBLIC_FULL_WAV, backup_public)

    for sid in CHANGED_IDS:
        src_wav = AUDIO_DIR / f"{sid}.wav"
        dst_wav = backup_audio_dir / f"{sid}.wav"
        if src_wav.exists() and not dst_wav.exists():
            shutil.copy2(src_wav, dst_wav)

        src_tr1 = AUDIO_DIR / f"{sid}_transcript.json"
        dst_tr1 = backup_audio_dir / f"{sid}_transcript.json"
        if src_tr1.exists() and not dst_tr1.exists():
            shutil.copy2(src_tr1, dst_tr1)

        src_tr2 = TRANSCRIPTS_DIR / f"{sid}_transcript.json"
        dst_tr2 = backup_audio_transcripts / f"{sid}_transcript.json"
        if src_tr2.exists() and not dst_tr2.exists():
            shutil.copy2(src_tr2, dst_tr2)

    print("Backup completed under qc/pre-audio-rebuild/")

    # 4. Stage under qc/audio-regenerated/sXX.wav
    STAGE_DIR.mkdir(parents=True, exist_ok=True)
    tts = VieneuTTS()
    provider_shas = {}
    staged_durations = {}

    sec_map = {s["id"]: s for s in all_sections}

    for idx, sid in enumerate(CHANGED_IDS, 1):
        sec = sec_map[sid]
        provider_text = sec["delivery_cues"]["provider_text"]
        p_sha = hashlib.sha256(provider_text.encode("utf-8")).hexdigest()
        provider_shas[sid] = p_sha

        stage_wav = STAGE_DIR / f"{sid}.wav"
        sidecar_json = STAGE_DIR / f"{sid}.json"

        # Check sidecar cache
        cached_valid = False
        if stage_wav.exists() and sidecar_json.exists():
            try:
                with open(sidecar_json, "r", encoding="utf-8") as sf:
                    sidecar = json.load(sf)
                if (
                    sidecar.get("provider_sha") == p_sha
                    and sidecar.get("duration", 0) > 1.0
                    and sha256_file(stage_wav) == sidecar.get("stage_sha")
                ):
                    cached_valid = True
                    staged_durations[sid] = sidecar["duration"]
                    print(f"[{idx}/{len(CHANGED_IDS)}] {sid}: Cache hit ({sidecar['duration']:.2f}s)")
            except Exception as e:
                cached_valid = False

        if not cached_valid:
            success = False
            for attempt in range(1, 3):
                print(f"[{idx}/{len(CHANGED_IDS)}] {sid}: Generating TTS attempt {attempt}/2...")
                res = tts.execute({
                    "text": provider_text,
                    "output_path": str(stage_wav.resolve()),
                    "threads": 6,
                })
                if res.success and stage_wav.exists():
                    dur, frames = get_wav_duration_and_frames(stage_wav)
                    if dur > 1.0:
                        s_sha = sha256_file(stage_wav)
                        with open(sidecar_json, "w", encoding="utf-8") as sf:
                            json.dump({
                                "section_id": sid,
                                "provider_sha": p_sha,
                                "stage_sha": s_sha,
                                "duration": dur,
                                "frames": frames,
                                "generated_at": time.time(),
                                "attempt": attempt,
                            }, sf, indent=2)
                        staged_durations[sid] = dur
                        print(f"[{idx}/{len(CHANGED_IDS)}] {sid}: Generated successfully ({dur:.2f}s)")
                        success = True
                        break
                print(f"[{idx}/{len(CHANGED_IDS)}] {sid}: Attempt {attempt} failed.")

            if not success:
                raise RuntimeError(f"Failed to generate TTS for {sid} after 2 attempts.")

    # 5. After all 10 staged valid, copy to canonical assets/audio/sXX.wav
    for sid in CHANGED_IDS:
        stage_wav = STAGE_DIR / f"{sid}.wav"
        dest_wav = AUDIO_DIR / f"{sid}.wav"
        shutil.copy2(stage_wav, dest_wav)
        dur, _ = get_wav_duration_and_frames(dest_wav)
        staged_durations[sid] = dur
    print("Copied all 10 regenerated files to assets/audio/")

    # Assert untouched 18 are NOT mutated
    hashes_after = {}
    for sid in untouched_ids:
        wav_file = AUDIO_DIR / f"{sid}.wav"
        curr_hash = sha256_file(wav_file)
        hashes_after[sid] = curr_hash
        assert curr_hash == hashes_before[sid], f"Untouched section {sid} was mutated!"
    print("Verified: all 18 untouched sections are byte-identical.")

    for sid in CHANGED_IDS:
        hashes_after[sid] = sha256_file(AUDIO_DIR / f"{sid}.wav")

    # 6. Rebuild full narration
    print("Rebuilding narration_full.wav...")
    sample_rate = 48000
    nchannels = 1
    sampwidth = 2

    with wave.open(str(CANONICAL_FULL_WAV), "wb") as out_w:
        out_w.setnchannels(nchannels)
        out_w.setsampwidth(sampwidth)
        out_w.setframerate(sample_rate)

        for i, sec in enumerate(all_sections):
            sid = sec["id"]
            sec_wav = AUDIO_DIR / f"{sid}.wav"
            with wave.open(str(sec_wav), "rb") as in_w:
                assert in_w.getnchannels() == nchannels, f"Channel mismatch in {sid}"
                assert in_w.getsampwidth() == sampwidth, f"Sampwidth mismatch in {sid}"
                assert in_w.getframerate() == sample_rate, f"Framerate mismatch in {sid}"
                frames = in_w.readframes(in_w.getnframes())
                out_w.writeframes(frames)

            # Pause after section (NOT after last section)
            if i < len(all_sections) - 1:
                pause_sec = sec.get("delivery_cues", {}).get("pause_after_seconds", 0.0)
                silence_frames = int(round(pause_sec * sample_rate))
                if silence_frames > 0:
                    out_w.writeframes(b"\x00" * (silence_frames * sampwidth * nchannels))

    full_dur, full_frames = get_wav_duration_and_frames(CANONICAL_FULL_WAV)
    print(f"narration_full.wav rebuilt: {full_dur:.2f}s ({full_frames} frames)")

    # Copy to public/thanh-giong/narration_full.wav
    PUBLIC_FULL_WAV.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(CANONICAL_FULL_WAV, PUBLIC_FULL_WAV)
    assert sha256_file(CANONICAL_FULL_WAV) == sha256_file(PUBLIC_FULL_WAV), "Public copy hash mismatch!"
    print("Copied narration_full.wav to remotion-composer/public/thanh-giong/ (exact copy verified).")

    # 7. Update asset_manifest.json
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Calculate all section durations
    all_durations = {}
    for sec in all_sections:
        sid = sec["id"]
        sec_dur, _ = get_wav_duration_and_frames(AUDIO_DIR / f"{sid}.wav")
        all_durations[sid] = round(sec_dur, 2)

    # Update manifest assets
    for asset in manifest.get("assets", []):
        aid = asset.get("id")
        if aid and aid.startswith("narr_"):
            sid = aid.replace("narr_", "")
            if sid in CHANGED_IDS:
                asset["duration_seconds"] = all_durations[sid]
                asset["generation_summary"] = "Default news voice, delivery_cues.provider_text, threads 6 (QC1 regenerated)"
        elif aid == "narration_full":
            asset["duration_seconds"] = round(full_dur, 2)
            delta = round(full_dur - 870.0, 2)
            asset["generation_summary"] = (
                f"28 sections concatenated with delivery_cues.pause_after_seconds; "
                f"delta vs 870s budget: +{delta}s (QC1 regenerated 10 sections)"
            )

    # Update metadata
    meta = manifest.get("metadata", {})
    meta["narration_full_seconds"] = round(full_dur, 2)
    meta["narration_total_seconds"] = round(sum(all_durations.values()), 2)
    if "duration_delta_vs_script_budget" in meta:
        meta["duration_delta_vs_script_budget"]["actual_full_seconds"] = round(full_dur, 2)
        meta["duration_delta_vs_script_budget"]["delta_seconds"] = round(full_dur - 870.0, 2)

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("Updated asset_manifest.json with new durations.")

    # 8. Write qc/audio_rebuild_qc1.json
    elapsed = round(time.time() - t_start, 2)
    qc_report = {
        "status": "tts_complete_asr_pending",
        "changedSections10": CHANGED_IDS,
        "untouchedSections18": untouched_ids,
        "hashesBeforeAfter": {
            "changed": {
                sid: {
                    "before": hashes_before.get(sid),
                    "after": hashes_after[sid],
                }
                for sid in CHANGED_IDS
            },
            "untouched": {
                sid: {
                    "before": hashes_before.get(sid),
                    "after": hashes_after[sid],
                    "identical": hashes_before.get(sid) == hashes_after[sid],
                }
                for sid in untouched_ids
            },
            "narration_full": {
                "before": hashes_before_full,
                "after": sha256_file(CANONICAL_FULL_WAV),
            },
            "public_narration_full": {
                "before": hashes_before_public,
                "after": sha256_file(PUBLIC_FULL_WAV),
            },
        },
        "providerSHA": provider_shas,
        "durations": {
            "changed_10": {sid: all_durations[sid] for sid in CHANGED_IDS},
            "untouched_18": {sid: all_durations[sid] for sid in untouched_ids},
            "all_sections": all_durations,
            "sections_sum": round(sum(all_durations.values()), 2),
            "full_duration": round(full_dur, 2),
        },
        "fullDuration": round(full_dur, 2),
        "publicExactCopy": True,
        "cost0": True,
        "elapsed_seconds": elapsed,
        "rawASR_status": "rawASR for 10 changed sections is stale and pending next job",
    }

    report_path = QC_DIR / "audio_rebuild_qc1.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(qc_report, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"Wrote QC report to {report_path}")

    print("\n=== REBUILD AUDIO QC1 SUMMARY ===")
    print(f"Status: tts_complete_asr_pending")
    print(f"Elapsed: {elapsed}s")
    print(f"10 Regenerated Sections:")
    for sid in CHANGED_IDS:
        print(f"  {sid}: {all_durations[sid]}s (hash: {hashes_after[sid][:12]})")
    print(f"Untouched 18 sections: all verified byte-identical.")
    print(f"Full narration: {full_dur:.2f}s (delta vs 870s budget: +{round(full_dur - 870.0, 2)}s)")
    print(f"Public narration exact copy: True")
    print(f"rawASR status: 10 changed sections stale (pending next job)")


if __name__ == "__main__":
    main()
