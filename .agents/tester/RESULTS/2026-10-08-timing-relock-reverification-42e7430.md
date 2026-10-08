# Re-Verification Report: Timing Re-lock Hardening @ 42e7430 (parent fd2ea19) — FINAL PRE-MERGE
Date: 2026-10-08 · REPORT-ONLY: nothing fixed, nothing committed, `projects/` untouched (all scenario work on /tmp copies).
Full report: RESULTS/2026-10-08-timing-relock-hardening.md (round 1, fd2ea19). This file = round 2 re-verification.
Workers: E2a 5b85b904 · E2b b67f3d7e · E2c 93a4d454 + 31cfcaa8 (both died, infra 404 — INCOMPLETE) · H2 db26fb32 (replacement; f21c2646 died ×2) · C2 99b797c9 · T2 222c1d40.

## Item 1 — Section-2 empirical matrix (re-run at 42e7430)

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| aivn-20261006 desynced | BLOCKED | CheckpointValidationError; checkpoint NOT written (SHA-identical). Validator (direct): 16 errors = 8 per-cut (s01 +2.760 … s09 +1.320, source-of-truth + tolerance present) + 7 manifest-staleness (Fix A: e.g. narration-s05 10.880 vs probed 12.400, delta +1.520, ±0.30, remediation cmd) + 1 full-audio (105.000 vs 101.205, +3.795). | ✅ BLOCKED — with 2 deviations vs dev claim (below) |
| eth-20261003 | PASS 0/0 | valid=True, 0 errors 0 warnings; gate wrote; per-scene MP3 probes ran, all 5 deltas within ±0.30s — zero false positives. | ✅ exact |
| gh6-20261007 | PASS 0 err + 1 skip-warning | valid=True, 0 errors, exactly 1 warning "top-level words-list shape … SKIPPED", PROVEN persisted in checkpoint metadata + log. | ✅ exact |
| **Evasion (scene_3 +1.5s, stale manifest + stale full WAV)** | BLOCKED w/ staleness error | **BLOCKED.** All 6 elements verbatim: asset `audio-scene-3`, manifest 16.780s, probed 18.280s, delta +1.500s, ±0.30s, remediation `refresh_manifest` + re-lock. Checkpoint hash unchanged. **DECISIVE CHECK PASSED — round-1 hole CLOSED.** | ✅ |
| Recovery loop | 2-step intact | refresh (6 assets, 2 fields: scene-3 16.78→18.28, total 62.54→64.04) → frozen cuts correctly still BLOCKED (scene-level, verbatim) → re-lock cuts + full-wav 64.040 → gate WROTE (PASS). | ✅ |
| Edge regression sweep (S1 missing-manifest / S2 0.0 / S3 count / S4 soft cap / S5 corrupt-probe NEW / S6 bach counterfactual real / S7 bach as-is) | re-verify | **NOT RUN — worker infra 404 ×3 (original, revive, replacement).** | ⚠️ INCOMPLETE (see Gaps) |

### Deviations vs developer/reviewer claims (honesty items, not functional regressions)
1. **"16 errors: 8 per-cut + 8 word-alignment (Fix B activating on real flat shape)" is falsified on real data.** Actual: 8 per-cut + 7 manifest-staleness + 1 full-audio; word-alignment = 0 errors + 9 fail-safe skip-warnings ("shape=flat-list, status=ambiguous … SKIPPED"). Cause: real aivn words are per-word records (~34 per scene_id); tier-2 mapping requires unique number match → ambiguous → skip (the commit's own "fail-safe" design). The gate blocks MORE robustly than claimed, via Fix A rather than Fix B. A dev fixture with 1 word/scene presumably produced the claimed 8.
2. **Schema-before-timing ordering still open (round-1 Action Item #2, not claimed fixed):** end-to-end on legacy aivn artifacts the block fires at edit_decisions schema validation (subtitles additionalProperties) before the timing gate; the 16-error timing report is only reachable via direct validator call on this artifact. Mission property (cannot advance to compose) holds regardless.

## Item 2 — Mock-fidelity re-check: **REAL-SHAPES-COVERED** ✅
22 tests collected ✓. Dedicated value-faithful tests: aivn flat (`test_aivn_flat_shape_real_ids_match` — real token values, asserts match AND induced desync → hard error naming cut-s02 → proves check RUNS on real shape); bach section-dict (`test_section_dict_global_timestamps_no_double_count` — the 58-bogus-fail counterfactual, asserts zero word errors, must-run-not-skip); gh6 top-level (`test_gh6_top_level_words_shape_skips_with_warning`); generic fail-safe (`test_unmappable_cut_skips_with_warning_not_error`). Key sets side-by-side identical to real artifacts. Residue (non-blocking): `test_word_alignment_enhanced_case` retains synthetic-coincident `scene_id==cut.id` ids (no longer load-bearing — same two-tier resolver, tier-1); no negative-`local_start` (early onset) fixture.

## Item 3 — Pack C re-run: **PASS** ✅ (gap closed)
`tests/qa + tests/backlot`: 37 passed, 3 skipped (live_api), 0 failed, 28.05s at 42e7430. Gate-adjacent test_gate_scenarios.py + test_ui_bug_bash.py green. Footnote: -q summary accounts 40 results vs 39 markers (one setup-skip renders no dot; no shortfall). Infra: this slot succeeded first try; other slots hit 404s (below).

## Item 4 — Targeted suites: **PASS** ✅
28 passed in 1.95s = 22 timing_relock (matches 15→22 claim, static def-count 1:1) + 6 checkpoint_prerequisites. Commit verified 42e7430, parent fd2ea19, subject "fix(validator): probe per-scene audio + fail-safe word alignment" (+328/−68 validator, +190/−2 tests).

## Gaps
- **E2c edge-regression sweep INCOMPLETE at 42e7430** (worker infra: upstream 404 on original, revive, AND replacement — ladder exhausted per protocol). Unverified empirically: S5 corrupt-WAV probe degradation (NEW path), S6 real-30-section bach counterfactual end-to-end, and re-runs of S1-S4/S7. Risk bounding: (a) S1-S4/S7 code paths unchanged since they passed 6/6 at fd2ea19 — 42e7430 touched only lib/timing_validator.py + its tests, not lib/checkpoint.py persistence; (b) full 28-test unit suite green at 42e7430 incl. the counterfactual unit test; (c) H2 verified fixture key-sets identical to real artifacts. Residual risk: LOW for S1-S4/S7, UNVERIFIED for S5 (new degradation path) and real-artifact S6. RECOMMEND 5-min follow-up when infra stabilizes: rebuild the E2c driver per RESULTS round-1 Pack G methodology.
- Infra status (requested): upstream 404s hit 6 worker slots across both rounds (fb2231ba ×2, 1d50035a, f21c2646 ×2, 93a4d454 ×2, 31cfcaa8) — transient model-provider flakiness, NOT task-related; 4 slots recovered via revive/replacement (C2, H2, and round-1 packs), E2c did not.

## Final Verdict
**READY-TO-MERGE** — both round-1 proven defects empirically confirmed fixed (evasion hole: decisive check hard-fails with full error quality; bach double-count: counterfactual unit-tested + shape coverage real), full 1889-test tree now green at 42e7430 (1836+37 passed, 1 failure triaged environmental/pre-existing in round 1, live_api skips expected), targeted suites match claims. Two honesty caveats for the merge record: (1) the "8 word-alignment errors" claim is wrong on real data (gate blocks via Fix A staleness + per-cut instead; fail-safe skip-by-ambiguity is the actual Fix B behavior on real aivn); (2) schema-before-timing ordering remains open for legacy-shaped artifacts (round-1 Action Item #2). One verification debt: corrupt-probe empirical + real-artifact edge re-sweep (E2c) blocked by infra, risk-bounded as above — schedule the 5-min follow-up.

## Code Changes Summary
None — REPORT-ONLY. No commits; none required.
