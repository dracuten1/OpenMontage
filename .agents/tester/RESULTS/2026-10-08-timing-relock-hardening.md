# Test Report: Timing Re-lock Hardening (feature/timing-relock-hardening @ fd2ea19, base 436fda6)
Date: 2026-10-08
Engagement: REPORT-ONLY acceptance commissioned by leader (fix NOTHING). No repo/source/artifact files were modified by any pack; all scenario work ran on /tmp copies. Zero commits (none required).

Worker instances:
- Discovery: 4f5f203f (read-only inventory)
- Pack A (lib+contracts regression): eb9a9b87
- Pack B (tools regression): 1f547b97
- Pack C (qa+backlot regression): fb2231ba (failed ×2, upstream 404) + replacement 1d50035a (failed, same 404) → INCOMPLETE
- Pack D (styles+root regression): acf82321
- Pack E (mission gate scenarios): 5eb391ea
- Pack F (re-TTS recovery loop): 1bfbb75f
- Pack G (checkpoint edge behaviors): 70f98beb
- Pack H (mock fidelity): b68d221a
- Triage (worktree differential): 50e2ac14

## Scope Decision
Full tree warranted and commissioned: cross-cutting hard-fail gate on the checkpoint path (critical blast radius); developer explicitly deferred the wider net (1889 collected, never executed). Executed as 4 parallel directory-sliced packs (≤5-min cap each, perl-alarm 300s wrapper — host has NO timeout/gtimeout), NOT one monolithic `pytest tests/` run.

## Summary
- Regression: 1850/1889 executed → 1836 passed, 1 failed (ENVIRONMENTAL, pre-existing — see Triage), 8 skipped (live_api conftest auto-skips), 3 xfailed; 39 NOT RUN (worker infra failure) → Gaps.
- Mission gate: desynced aivn run BLOCKED at write_checkpoint (no checkpoint written); clean runs eth/gh6/bach PASS, zero false positives. One discrepancy + one evasion hole documented below.
- Mock fidelity: MATCH for asset_manifest / edit_decisions / script.json; MISMATCH for narration_words (concrete false-green chain).
- Edge behaviors: 6/6 expectations matched on real artifacts; one latent defect found (narration_words offset double-count).

### Overall Status
- Section 1 Wider regression net: PASS (with 1 environmental failure triaged pre-existing; 39-test gap)
- Section 2 Original-scenario verification: PASS WITH CAVEATS (mission met: desynced class blocked; 2 documented holes/discrepancies)
- Section 3 Mock fidelity: MISMATCH (narration_words)
- Section 4 Edge cases: PASS 6/6 (with 1 latent defect)
- **Testing Complete: YES for this engagement's commissioned checks, with findings requiring follow-up (see Action Needed). No code was changed (report-only).**

---

## Section 1 — Wider Regression Net

Commands (from repo root, all with outer `perl -e 'alarm shift; exec @ARGV' 300` wrapper, `-q --tb=short -p no:cacheprovider`, no `-x`):

| Pack | Scope | Result | Counts | Runtime |
|---|---|---|---|---|
| A | tests/lib + all 34 tests/contracts files (closed list) | **FAIL** | 1255 passed, 1 failed, 7 skipped (live_api) | 23s |
| B | tests/tools | **PASS** | 544 passed, 1 skipped, 3 xfailed | 20s |
| C | tests/qa + tests/backlot | **NOT RUN** — worker infra failure (upstream 404 ×3: original, revive, replacement) | 39 tests unexecuted | — |
| D | tests/styles + tests/test_network_guard.py + tests/test_timing_relock_validator.py | **PASS** | 38 passed, 1 skipped | 1s |

Executed total: 1850/1889. The branch's own 15-test suite passed inside Pack D (38 passed incl. all 15 timing_relock).

### Triage of the single Pack A failure
`tests/contracts/test_agent_skill_pointers.py:67 — test_agent_skill_pointer_resolves[hexpix_scene-hexpix-scene-usage]`
**VERDICT: PRE-EXISTING / ENVIRONMENTAL — NOT branch-introduced.** Evidence (worktree differential, main checkout never switched):
- Advertisement lives in `tools/graphics/hexpix_scene.py:141` — an UNTRACKED WIP file (git ls-files fails; ls-tree of BOTH fd2ea19 and 436fda6 has no hexpix file).
- Clean worktree @ base 436fda6: whole file 194 passed (the hexpix parametrization doesn't even collect without the untracked file).
- Clean worktree @ HEAD fd2ea19: whole file 194 passed — identical.
- Cause: untracked WIP advertises skill at `skills/creative/hexpix-scene-usage.md`; contract requires `.agents/skills/hexpix-scene-usage{.md,/SKILL.md}` which exists nowhere.
- Latent note for WIP author: if committed as-is, CI will fail too. Worktrees removed + pruned after triage.

---

## Section 2 — Original-Scenario Verification (mission definition of done)

All via REAL gate path `lib.checkpoint.write_checkpoint(pipeline_dir, project_id, stage="edit", status="completed", artifacts={"edit_decisions": <real>}, human_approved=True)` on /tmp copies; gate wired at lib/checkpoint.py:277-280 in `_validate_artifacts_for_stage`.

### S1 desynced aivn-20261006 → BLOCKED ✅ (with discrepancy)
- CheckpointValidationError raised; `checkpoint_edit.json` NOT written (pre/post SHA-256 identical).
- **Discrepancy**: block fired via edit_decisions SCHEMA validation (line 257: `additionalProperties: false` rejects legacy `subtitles.timing_source/highlight_color/background_color`) BEFORE the timing gate (line 278). Error text is the jsonschema message, not "TIMING RE-LOCK VALIDATION FAILED".
- Timing gate in isolation on the same artifacts: catches ALL 8 desynced scenes with scene ids, cut vs measured durations, deltas (+0.42s…+2.76s), source of truth (manifest asset narration-sXX), tolerance (±0.30s / ±1.00s). E.g. "Scene 1 (cut-s01): cut duration (11.000s) exceeds measured audio (8.240s) by 2.760s (source of truth: manifest asset narration-s01, tolerance ±0.30s)."
- Net: the desynced class CANNOT advance to compose (mission met), but on legacy-shaped artifacts the user sees the less-informative schema error first.

### S2-S4 clean runs → PASS, zero false positives ✅
- eth-tradingagents-20261003 (0.44s tail; NO narration_words.json): PASS, checkpoint written, history archived.
- gh6-20261007 (0.65s pause): PASS. bach-viet-bien-mat (bespoke, 0 cuts): PASS.

### Re-TTS recovery loop — MIXED (one real hole)
- a) Baseline gate on pristine eth copy: PASS.
- b) scene_3 audio +1.5s (WAV stdlib-padded 16.78→18.28s; mp3 re-encoded via ffmpeg since probe reads the manifest path = .mp3; deltas ffprobe-verified).
- c) **Stale-manifest check: GATE PASSED — HOLE.** Per-scene "measured audio" is read FROM THE MANIFEST (timing_validator.py:176-229); the only real file probe is narration_full.wav (:244-263). Per-scene-only re-synthesis leaving narration_full.wav stale = cuts↔manifest↔full-wav all consistently stale → valid. This is exactly the aivn d-011 shape when only a single scene is re-done.
- c2) Supplementary: padding narration_full.wav (+1.5s) with stale manifest+cuts → HARD FAIL with two precise errors (scene-level 1.500s delta + total 62.98 vs 64.04s). The realistic FULL re-TTS IS caught.
- d) `refresh_asset_manifest` (tools/audio/refresh_manifest.py): updated 7 entries — audio-scene-3 16.78→18.28, metadata total 62.54→64.04; cuts untouched (by design).
- e) Post-refresh gate with frozen cuts: STILL HARD FAIL ("Scene 3 … shorter than measured audio by 1.500s") — correct behavior; recovery is a 2-step loop (refresh manifest → re-run edit to re-lock cuts). Documented, not forced green.

### Soft cap ✅
- script.json section 30.0s → checkpoint writes non-fatally; persisted metadata: "Section 's3' duration (30.0s) exceeds soft cap (25s). Empirical drift grows from 0.86s (<10s) to 7.7s (30-40s)…"
- Control 24.4s → persisted metadata null (no warning). Reads sections[].start_seconds/end_seconds (checkpoint.py:150-154).

---

## Section 3 — Mock Fidelity (TrueAuto)

| Artifact type | Verdict | Detail |
|---|---|---|
| asset_manifest | **MATCH** | Validator reads assets[].duration_seconds filtered type=="narration", scene_id!="all", "probe" not in id (timing_validator.py:176-182,205); real manifests populate 100% (eth 9.28/13.54/16.78/10.0/12.94 matching cuts; full-audio asset excluded via scene_id:"all"). The "all"/"probe" exclusion rules are untested (false-RED risk, not false-green). |
| edit_decisions | **MATCH** | Validator reads only id/in_seconds/out_seconds (+cuts[-1].out_seconds); synthetic ⊂ real on every read key; frame fields (aivn start/end_frame, verified 9/9 consistent @30fps) are ignored by validator — exposure B. |
| script.json | **MATCH** | Soft cap reads sections[].start/end_seconds; real eth/aivn populate 5/5, 9/9. |
| narration_words | **MISMATCH** | Synthetic flat-list fixture coins scene_id==cut.id (works in test); real aivn flat-list uses scene_id "scene_01" vs cut "cut-s01" → matching_words empty → check silently no-ops; gh6 dict-with-words hits hard-coded no-op branch (L92-95); only bach-style section-keyed dicts activate it — and that path has ZERO unit coverage. |

**False-green chain A**: the 15 green unit tests do not attest the word-alignment check works on ANY real flat-list artifact. Defense-in-depth is weakened (per-cut checks still guard aivn/gh6), not voided.
**Exposure B**: frame-grid fields rendered by Remotion but never validated (consistent today; future seconds-consistent/frames-stale producer would pass green).
**Exposure C**: zip(cuts, assets) position pairing; id conventions never matched; a reordered-asset producer would mispair silently.

---

## Section 4 — Edge Cases (all via real write_checkpoint on /tmp copies)

| Scenario | Expected | Actual | Evidence |
|---|---|---|---|
| Missing asset_manifest | warning + checkpoint writes | ✅ match | persisted metadata.timing_validation_warnings: ["asset_manifest.json does not exist yet at edit gate; skipping audio duration comparison."]; checkpoint_edit.json written |
| 0.0 placeholder + nonzero cuts | hard fail | ✅ match | "Scene 2 (cut-sc02): cut duration (13.540s) exceeds measured audio (0.000s) by 13.540s (source of truth: manifest asset audio-scene-2…)" |
| Cut count ≠ narration count | warning + total check bounds drift | ✅ match | warns-and-writes, per-cut check SKIPPED (stated in warning); control: last cut out→64.00 (diff +1.46s > 1.00s) → validator valid=False. Drift bounded. |
| Soft cap 30s / ≤25s | non-fatal persisted warning / none | ✅ match | see Section 2 |
| bach narration_words real shape | report actual behavior | **see below** | three-layer answer |

### bach narration_words (S6) — latent defect (extends mock-fidelity chain A)
1. As-is: whole validator skip-with-info no-op — real bach is composition_mode="atelier", cuts=[] → valid=True with info "No cuts defined (overlays-only or bespoke layout)" BEFORE reading manifest/audio/words; info invisible in log+metadata (only warnings are surfaced, checkpoint.py:196-206). Gate PASS.
2. The enhanced words check is NOT structurally no-op — it is ACTIVE on bach's dict shape and WRONG: words' `start` values are already global-timeline, but the Shape-2 extractor (timing_validator.py:108-124) adds entry.global_start AGAIN (L123) → ~2× offset for sections ≥ s02 (s02 58.08 vs true ≈28.98; s30 1749.2 vs ≈874.5).
3. Counterfactual 30-cut run from real values: valid=False with 58 errors = 29 bogus word-alignment (double-count) + 29 manifest-surplus (pause-inclusive spans vs pure-speech durations, e.g. 29.1s cut vs 28.3s measured > ±0.30s). If bach ever moves to cut-based edit_decisions, the gate bogus-fails the entire run. Suggested fix direction (NOT applied): prefer local_start + global_start, or detect local_start presence.

---

## Gaps
- **Pack C (tests/qa + tests/backlot, 39 tests) NOT executed.** Worker fb2231ba failed twice (original + revive) and replacement 1d50035a failed once — all identical upstream 404 infrastructure errors, not task errors. Re-dispatch budget exhausted (max 1). Affected files include gate-adjacent tests/backlot/test_gate_scenarios.py, test_ui_bug_bash.py (import lib.checkpoint) and tests/qa/test_08_end_to_end.py. Residual risk bounded: Pack A already ran the OTHER checkpoint-importing suites (phase0/1/3 contracts, backlot_contract, pipeline_catalog — green) and Pack D ran the full 15-test timing suite; but the backlot gate-scenario file itself remains unexecuted. RECOMMEND: re-run `perl -e 'alarm shift; exec @ARGV' 300 .venv/bin/pytest tests/qa tests/backlot -q --tb=short -p no:cacheprovider` when worker infra recovers.
- skill_feedback could not be recorded by 4 workers (daemon: "No usage record found" for injected-context skills) — attribution gap noted, no test impact.

## Action Needed (for developer/leader — nothing was changed by me)
1. 🔴 Stale-manifest hole (Section 2c): per-scene re-TTS without narration_full.wav regeneration evades the gate. Fix direction: probe per-scene audio files (or their manifest paths) directly, not only the full wav.
2. 🟠 Schema-before-timing ordering (Section 2 S1): on legacy artifacts (aivn subtitles extension keys) the timing gate's superior error is preempted by generic schema validation. Either allow/sanitize legacy subtitles keys or run the timing gate first / aggregate errors.
3. 🟠 narration_words Shape-2 double-count (Section 4 S6) + zero unit coverage of the only shape that activates it (Section 3 MISMATCH). Fix extractor; add fixtures for real aivn flat-list (scene_id≠cut-id), gh6 dict-with-words, bach section-dict shapes.
4. 🟢 Exposures B (frame fields unvalidated) and C (position-based pairing) — hardening candidates.
5. 🟢 Untracked WIP hexpix files will fail CI if committed as-is (skill file at wrong path).
6. ⬜ Re-run Pack C when infra recovers.

## Documentation Updated
- RESULTS/2026-10-08-timing-relock-hardening.md (this file)
- PACKS.md — this run's ad-hoc packs appended
- README.md — engagement + environment notes (perl-alarm; gtimeout also absent)

## Code Changes Summary
None — REPORT-ONLY engagement per commission. No commits made; none required.
