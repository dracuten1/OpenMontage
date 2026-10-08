# Test Packs — OpenMontage (ad-hoc, read-only acceptance)

No pack scripts are stored in the repo (read-only engagement). Packs are inline command
groups dispatched to workers; definitions live in the RESULTS report for the run.
| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| media_integrity_acceptance | acceptance | ffprobe gate, decode integrity, audio clarity ×3 windows on renders/final.mp4 | 2026-10-03 | PASS |
| artifacts_checkpoints_acceptance | acceptance | 7 artifact schema gates + 6 checkpoint gates + approval flags | 2026-10-03 | PASS |
| sync_consistency_acceptance | acceptance | cuts contiguity, narration sync ±0.5s, asset refs, cue order, render_report vs actual | 2026-10-03 | PASS |
| frames_stagedmedia_acceptance | acceptance | scene_{1..5}_mid.png non-black, staged narration/music, image byte-match | 2026-10-03 | PASS |

## 2026-10-08 — timing-relock-hardening engagement (branch feature/timing-relock-hardening @ fd2ea19)

Ad-hoc inline packs (definitions in RESULTS/2026-10-08-timing-relock-hardening.md). Outer wrapper on
this host: `perl -e 'alarm shift; exec @ARGV' 300 <cmd>` (no timeout/gtimeout installed).

| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| regression_lib_contracts_pack | regression | tests/lib + all 34 tests/contracts files (1263) | 2026-10-08 | FAIL (1 environmental, triaged pre-existing) |
| regression_tools_pack | regression | tests/tools (548) | 2026-10-08 | PASS |
| regression_qa_backlot_pack | regression | tests/qa + tests/backlot (39) | — | NOT RUN (worker infra 404 ×3; see Gaps) |
| regression_styles_root_pack | regression | tests/styles + network_guard + timing_relock (39) | 2026-10-08 | PASS |
| mission_gate_scenarios_acceptance | acceptance | real write_checkpoint: aivn BLOCKED / eth+gh6+bach PASS | 2026-10-08 | PASS w/ discrepancy (schema preempts timing error on legacy artifacts) |
| retts_recovery_loop_acceptance | acceptance | perturb scene audio → stale-manifest gate → refresh → gate | 2026-10-08 | FAIL (stale-manifest hole: per-scene-only re-TTS evades) |
| checkpoint_edge_behaviors_acceptance | acceptance | missing manifest / 0.0 placeholder / count mismatch / soft cap 30s+25s / bach narration_words | 2026-10-08 | PASS (6/6) + latent defect (Shape-2 offset double-count) |
| mock_fidelity_analysis | analysis | synthetic fixture shapes vs real eth/aivn/gh6/bach artifacts | 2026-10-08 | MISMATCH (narration_words); MATCH other 3 |
| worktree_triage_differential | triage | failing test at base 436fda6 vs HEAD fd2ea19 in /tmp worktrees | 2026-10-08 | VERDICT: pre-existing/environmental |

## 2026-10-08 — re-verification round (42e7430 "probe per-scene audio + fail-safe word alignment")

| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| revisit_real_matrix_acceptance | acceptance | aivn BLOCKED / eth PASS 0/0 / gh6 PASS 0+1 skip-warn | 2026-10-08 | PASS w/ 2 claim deviations (word-alignment composition; schema-before-timing open) |
| revisit_evasion_recovery_acceptance | acceptance | scene_3 +1.5s stale → BLOCKED (6/6 error elements) + 2-step recovery loop | 2026-10-08 | PASS — round-1 hole CLOSED |
| revisit_edge_behaviors_acceptance | acceptance | S1-S7 edge sweep + corrupt-probe + real bach counterfactual | — | INCOMPLETE (infra 404 ×3; risk-bounded, follow-up advised) |
| mock_fidelity_recheck | analysis | real token shapes covered at 42e7430 (22 tests) | 2026-10-08 | REAL-SHAPES-COVERED (1 legacy synthetic residue) |
| regression_qa_backlot_pack (retry) | regression | tests/qa + tests/backlot (39) | 2026-10-08 | PASS (37P/3S/0F) — round-1 gap closed |
| targeted_suites_pack | regression | timing_relock (22) + checkpoint_prerequisites (6) | 2026-10-08 | PASS (28/28) |
