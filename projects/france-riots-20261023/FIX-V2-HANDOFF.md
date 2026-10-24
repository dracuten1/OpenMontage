# FIX V2 HANDOFF — france-riots-20261023

Surgical Content & Audio Repair for S11 completed. Canonical script S11, narration audio, ASR alignment, derived composition timing, element anchors, caption display, and publication descriptions are updated. All other 20 scenes and non-S11 audio files remain 100% byte-identical. No MP4 render or Telegram notification executed.

## 1. Problem & Root Cause Resolution
- **Defect:** S11 audio previously resurrected rejected Marseille figures (30.000 / 8.000 / 1.800–3.000), while `buildV2.py` merely suppressed captions over those words. Hiding captions failed to address audible narration defect.
- **Root Cause Resolution:** Replaced S11 canonical text, regenerated ONLY S11 audio via local `vieneu_tts` v3 Turbo default voice (atempo=1.15), re-aligned via ASR with existing lexicon, restored full caption coverage without suppressing words, and synchronized element anchors with the new narration.

## 2. Canonical S11 Replacement
- **Canonical Text:**
  `Lyon: 200 đến 300 cửa hàng bị đập phá và cướp, văn phòng du lịch bị đốt, theo The Guardian. Tại Marseille, cửa tòa thị chính bị đập mở, theo bài phát biểu của Tổng thống Macron ngày 18/10.`
- **Provider Text (via existing lexicon, no novel respellings):**
  `Li ôn: hai trăm đến ba trăm cửa hàng bị đập phá và cướp, văn phòng du lịch bị đốt, theo The Guardian. Tại Mác xây, cửa tòa thị chính bị đập mở, theo bài phát biểu của Tổng thống mác cờ ron ngày mười tám tháng mười.`
- **Sources for S11:** The Guardian · Élysée (bài phát biểu Tổng thống Macron ngày 18/10).

## 3. Preservation & Integrity Evidence
- **Pre-fix Backups:** `/Users/tuyennguyen/project/OpenMontage/projects/france-riots-20261023/history/fix-v2-s11-before/`
  - `baseline_sha256.json`: Hashes of all pre-fix audio, alignment, and canonical artifacts.
  - `defect_reproduced.json`: Pre-change verification evidence capturing old defect.
  - `invalidated/`: Pre-fix S11 raw WAV, public WAV, ASR, timing, words, and captions.
- **WAV Baseline Integrity:** All 85 non-S11 audio files across the repository (V1 assets, V1 public, V2 public, V2 project audio) verified 100% byte-identical against baseline sha256. Evidence: `/Users/tuyennguyen/project/OpenMontage/projects/france-riots-20261023/qc/v2/wav_integrity_evidence.json`.
- **Other Sections Unchanged:** Script sections S1–S10 and S12–S21 are unchanged.

## 4. Regenerated S11 Audio & ASR Alignment
- **WAV File:** `/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/france-riots-20261023/v2/voice_s11.wav`
  - Duration: 9.120500 seconds (reduced from 14.159750s; delta -5.039250s).
  - Format: PCM 16-bit, 48000 Hz, mono, peak -1.5 dBFS.
- **ASR & Alignment:**
  - Raw ASR: `/Users/tuyennguyen/project/OpenMontage/projects/france-riots-20261023/audio/v2/s11_raw_asr.json`
  - Timing: `/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/france-riots-20261023/v2/timing_s11.json`
  - Words: `/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/france-riots-20261023/v2/words_s11.json` (39/39 words mapped, 0 mono fixes).
  - Captions: `/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/france-riots-20261023/v2/captions_s11.json` (full caption reconstruction, 0 omitted words).

## 5. Composition & Derived Artifacts
- **Total Duration:** 7888 frames / 262.933333 seconds (total audio: 244.862353 seconds).
- **Scene S11 Frames:** 298 frames (`ceil((9.1205 + 0.8) * 30)` = 298). Start frame: 3924, end frame: 4221.
- **Elements:** Exactly 133 elements (109 spoken + 24 reference/credit/source records), 0 unmatched anchors.
  - S11 Anchors:
    - `e0` (title): 'Lyon' @ global frame 3924 (local f0)
    - `e1` (card): '200–300 cửa hàng bị đập phá và cướp' ('200 đến 300 cửa hàng') @ global frame 3926 (local f2)
    - `e2` (card): 'Văn phòng du lịch bị đốt' ('văn phòng du lịch bị đốt') @ global frame 3990 (local f66)
    - `e3` (card): 'Theo The Guardian' ('theo The Guardian') @ global frame 4024 (local f100)
    - `e4` (card): 'Marseille · Cửa tòa thị chính bị đập mở' ('cửa tòa thị chính bị đập mở') @ global frame 4077 (local f153)
    - `e5` (card): 'Theo Tổng thống Macron · Bài phát biểu 18/10' ('theo bài phát biểu của Tổng thống Macron ngày 18/10') @ global frame 4115 (local f191)
- **Derived Files:**
  - `remotion-composer/public/france-riots-20261023/v2/scene_timing.json`
  - `remotion-composer/public/france-riots-20261023/v2/scene_elements.json`
  - `remotion-composer/public/france-riots-20261023/v2/captions_display.json`
  - `projects/france-riots-20261023/artifacts/scene_index_v2.md`
  - `projects/france-riots-20261023/artifacts/credits_v2.txt`
  - `projects/france-riots-20261023/artifacts/description_tiktok_v2.txt`

## 6. Verification & QC Results
1. **Scoped TypeScript:**
   - Command: `/Users/tuyennguyen/project/OpenMontage/remotion-composer/node_modules/.bin/tsc --noEmit -p /Users/tuyennguyen/project/OpenMontage/remotion-composer/src/france-riots-20261023/v2/tsconfig.scoped.json`
   - Result: PASS (exit code 0).
2. **Deterministic Compose Checks (`checkV2.py`):**
   - Command: `/Users/tuyennguyen/project/OpenMontage/.venv/bin/python /Users/tuyennguyen/project/OpenMontage/remotion-composer/src/france-riots-20261023/v2/checkV2.py`
   - Result: PASS (status=PASS, unmatched=0, 84 input files unchanged, caption max chars=72, speech window=PASS).
3. **Scene Sweep (2 stills / scene = 42 stills):**
   - Command:
     ```sh
     /Users/tuyennguyen/project/OpenMontage/.venv/bin/python /Users/tuyennguyen/project/OpenMontage/tools/qc/scene_sweep.py \
       --entry remotion-composer/src/france-riots-20261023/v2/entryV2.tsx \
       --composition FranceRiots20261023V2Debug \
       --scene-timing projects/france-riots-20261023/artifacts/v2/scene_timing.json \
       --frames-per-scene 2 \
       --max-stills 42 \
       --out /Users/tuyennguyen/project/OpenMontage/projects/france-riots-20261023/qc/v2/sweep \
       --proj france-riots-20261023
     ```
   - Result: `[scene_sweep] verdict=PASS edge=0 panel=0 dense=0` (42 PNG stills rendered in `/Users/tuyennguyen/project/OpenMontage/projects/france-riots-20261023/qc/v2/sweep/`). No PNG Read tool was invoked.
4. **Independent QA Audit:**
   - Report: `/Users/tuyennguyen/project/OpenMontage/projects/france-riots-20261023/qc/v2/fix_independent_audit.json`
   - Verdict: **PASS** (0 critical findings, 0 warnings).

## 7. Standalone Remotion Commands (No Render Executed)

### Preview in Studio
```sh
/Users/tuyennguyen/project/OpenMontage/remotion-composer/node_modules/.bin/remotion studio \
  /Users/tuyennguyen/project/OpenMontage/remotion-composer/src/france-riots-20261023/v2/entryV2.tsx \
  --public-dir=/Users/tuyennguyen/project/OpenMontage/remotion-composer/public
```
Select composition: `FranceRiots20261023V2Debug`.

### Render-Ready MP4 Command (When Authorized)
```sh
/Users/tuyennguyen/project/OpenMontage/remotion-composer/node_modules/.bin/remotion render \
  /Users/tuyennguyen/project/OpenMontage/remotion-composer/src/france-riots-20261023/v2/entryV2.tsx \
  FranceRiots20261023V2Debug \
  /Users/tuyennguyen/project/OpenMontage/projects/france-riots-20261023/renders/FranceRiots20261023_v2_fixed.mp4 \
  --public-dir=/Users/tuyennguyen/project/OpenMontage/remotion-composer/public
```
*(No MP4 render was executed in this task per instruction.)*
