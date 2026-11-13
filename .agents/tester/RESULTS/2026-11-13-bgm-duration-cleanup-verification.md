# Test Report: BGM Duration Gate and Cleanup Mixdown E2E Verification
Date: 2026-11-13
Branch: fix/bgm-duration-cleanup @ 435114317702c7842ac154a12ac6e09c339d9e03
Base: 02ac3d538c3f0ea47dbe7d75bff516b688e6e80a
Worktree: /Users/tuyennguyen/project/OpenMontage-wt-bgm-fix

### Summary
- Synthetic Canary Check (bgm_gate): 4/4 PASS
- Scratch Mixdown Teardown & Fail-open: PASS (Run A clean delete, Run C fail-open warning exit 0)
- Unit Tests (tools/qc): 32/32 PASS
- Regression Suite (tools): 572/572 PASS (0 branch regressions; 3 pre-existing contracts failures triaged)
- Sweep Mode: 3 files / 75,748,886 bytes reclaimed, master intact
- Overall Verdict: PASS

---

### 1. Synthetic Canary Check (tools.qc.bgm_gate)
Pack: synthetic_canary_bgm_gate
- **Scenario 1 (140s comp + 27s BGM, no loop):**
  - Command: `python3 -m tools.qc.bgm_gate ...`
  - Output: `verdict: "fail", valid: false`, silent tail 113.000s
  - Exit code: 1 (FAIL) ✅
- **Scenario 2 (140s comp + 27s BGM, loop declared):**
  - Command: `python3 -m tools.qc.bgm_gate ...`
  - Output: `verdict: "pass", valid: true, errors: []`, loop short-circuits short-BGM
  - Exit code: 0 (PASS) ✅
- **Scenario 3 (140s comp + 150s BGM, no loop):**
  - Command: `python3 -m tools.qc.bgm_gate ...`
  - Output: `verdict: "pass", valid: true, errors: []`, BGM >= comp duration
  - Exit code: 0 (PASS) ✅
- **Scenario 4 (Kill-switch OM_BGM_DURATION_GATE=0):**
  - Command: `OM_BGM_DURATION_GATE=0 python3 -m tools.qc.bgm_gate ...`
  - Output: `verdict: "disabled", valid: true`, gate disabled
  - Exit code: 0 (PASS) ✅

---

### 2. Scratch Mixdown Teardown & Fail-open (tools.qc.mixdown)
Pack: scratch_mixdown_verification (isolated /tmp/scratch_mixdown_test/)
- **Run A (Standard mixdown, clean teardown):**
  - Exit code: 0
  - Intermediates deleted: `mix_base.wav`, `bgm_loop.wav`, `mix_bgm.wav` (all ABSENT)
  - Master intact: `_master_work/mix_master.wav` (5,760,078 bytes, PRESENT)
  - QC stems retained: `renders/audio_stems/narration.wav` (5,760,078 bytes), `bgm.wav` (5,736,022 bytes)
- **Run C (Fail-open cleanup on undeletable intermediate):**
  - Trigger: `chflags uchg` set on `mix_bgm.wav`
  - Stderr warning: `WARNING (fail-open): cleanup failed for .../mix_bgm.wav: [Errno 1] Operation not permitted`
  - Pipeline status: Completed successfully, muxed final output valid (`out_final_failopen.mp4`, h264+aac)
  - Exit code: 0 (PASS)
  - Intermediates `mix_base.wav`, `bgm_loop.wav` deleted; master and stems retained

---

### 3. Unit Tests
Pack: `tests/tools/test_bgm_gate.py tests/tools/test_mixdown_teardown.py tests/tools/test_audio_mixer_target_duration.py`
- Result: 32 passed, 0 failed, 0 skipped (exit 0)
- Breakdown:
  - `test_bgm_gate.py`: 14 passed
  - `test_mixdown_teardown.py`: 15 passed
  - `test_audio_mixer_target_duration.py`: 3 passed
- Runtime: 0.8s wall

---

### 4. OM Regression Packs
- `tests/tools/`: 572 passed, 0 failed, 1 skipped, 3 xfail (exit 0)
- `tests/contracts/`: 1271 passed, 3 failed, 12 skipped
  - Triage: 3 failures in `test_editorial_language_gate_contract.py` (`KeyError: 'source'`)
  - Differential: exact same 3 failures occur on base commit `02ac3d5`
  - Conclusion: Pre-existing at base, 0 failures caused by BGM duration/cleanup branch

---

### 5. Sweep Mode Execution
- **Dry-run (`python3 -m tools.qc.mixdown --sweep`):**
  - Scanned projects roots: worktree (0 renders dirs), main repo (43 renders dirs)
  - Strays found in `projects/tai-chinh-3tin-20261111/renders/_master_work/`:
    - `mix_base.wav` (25,264,242 bytes)
    - `bgm_loop.wav` (25,220,360 bytes)
    - `mix_bgm.wav` (25,264,284 bytes)
  - Total reclaimable: 3 files, 75,748,886 bytes (~72.2 MiB)
  - Safety check: `mix_master.wav` excluded from delete list
- **Delete run (`python3 -m tools.qc.mixdown --sweep --delete`):**
  - Exit code: 0
  - Files removed: 3 files
  - Exact bytes reclaimed: 75,748,886 bytes
- **Post-sweep audit:**
  - `tai-chinh-3tin-20261111/renders/_master_work/mix_master.wav` retained (25,264,284 bytes, mtime Nov 12 17:13 untouched)
  - Remaining strays across all project renders dirs: 0
  - Git status: clean, no source modified, no commits
