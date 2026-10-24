# TRIM-HANDOFF — france-riots-20261023

Audio trim completed directly in-session; no agents, research, model changes, Telegram, checkpoints, rendering, or TSX edits.

## Exact measured duration
- Previous timeline: 138.333333 s.
- New timeline: **3557 frames at 30 fps = 118.566666… s** (JSON: 118.566667 s).
- Reduction: 593 frames = 19.766666… s.
- Sum of 13 processed voice durations: 107.939438 s; timeline includes existing 0.8 s per-scene padding and frame rounding.
- Canonical script reduction: 88 whitespace-delimited words across S2/S3/S10/S12; exact requested replacement texts applied.

## Regeneration and reuse
- Regenerated raw TTS: 4 (s02, s03, s10, s12).
- Regenerated processed audio: 4, each from fresh raw via atempo=1.15 exactly once, 48 kHz mono PCM; vieneu native/default voice=None, unchanged provider/model.
- New processed durations: s02 6.744708 s; s03 6.895813 s; s10 9.050917 s; s12 6.761333 s.
- Regenerated raw ASR: 4, existing offline small/int8 settings.
- Reused audio: 9 scenes, without additional speed processing.
- Reused raw ASR: same 9 scenes; canonical word mapping/public offsets refreshed for all 13.
- Verified unchanged SHA-256 for 27 files: 9 raw WAV + 9 processed WAV + 9 raw ASR JSON. Evidence: audio/pre-trim/untouched_checksums.json.
- Backed up and invalidated only the 16 target cache files (4 raw WAV, 4 processed WAV, 4 raw ASR, 4 word caches). Original target files and prior batch/timing metadata retained under audio/pre-trim/.
- Existing lexicon fully covers revised script; no lexicon additions required.

## Refreshed outputs
Ran, synchronously and in order, using .venv/bin/python:
1. scripts/tts_batch.py
2. scripts/align_asr_words.py (4 new ASR, 9 cached raw ASR reused)
3. scripts/scene_timing.py
4. scripts/scene_elements.py
5. scripts/qc_audits.py

Public WAVs refreshed from project audio. Verified byte-identical public/artifacts copies of scene_timing.json, words.json, narration_meta.json, scene_elements.json, captions.json.
Logs: audio/trim_tts_execution.log and audio/trim_alignment_execution.log.

## Anchors and mandatory elements
- 70 elements retained; 39 caption chunks; zero unmatched anchors.
- S2/S3/S12 anchors updated to actual revised phrases; S12 NHẬN ĐỊNH badge starts at local frame 0 and persists through scene.
- S10 retains all seven timeline marks: T9, 16/10, 17/10, 18/10, 22/10, 23/10, 24/10.
- t16/t17/t18 are explicitly retrospective_reference=true, visible from local start 0 throughout S10, match_method=static_retrospective_label. They carry retrospective_of references to actual earlier narration: s03 “Ngày 16/10”, s04 “Thứ Bảy 17/10”, s09 “Tối hôm sau”. No fabricated S10 exact match or anchor timestamps for absent phrases.
- S10 remaining timeline anchors match actual narration; chip1 anchors Lyon.
- Mandatory chart/stat elements and unchanged-scene narration retained. No proportional timing introduced; word timings remain actual ASR-span mappings.

## Final audits
- qc/speech_window_audit.json: PASS, 0 overflows.
- qc/asr_roundtrip.json: PASS, all 13 scenes.
- qc/audio_batch.json: PASS, all 13 scenes.
- Final checksum verification: 27/27 untouched files identical.
- Target 100–120 s: PASS.

Audio/data handoff only; no video render or browser visual verification performed.
