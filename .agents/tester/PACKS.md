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

## 2026-11-08 — P1.1 layout-primitives adversarial adjudication (branch editorial-hardening-20261108 @ a722521)

Ad-hoc inline packs (definitions + full evidence in RESULTS/2026-11-08-p11-layout-adversarial-adjudication.md).
Outer wrapper: `perl -e 'alarm shift; exec @ARGV' 300 <cmd>`. Probe specs in /tmp/p11_*.

| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| mandatory_baseline_pack | acceptance | vitest run verbatim (2 files/13), tsc --noEmit, validate:layout valid(0)/invalid(1+reason), git baseline | 2026-11-08 | PASS w/ 4 STATE-claim corrections (no Root.tsx test exists; layoutGuard file=12 tests) |
| temporal_adversarial_pack | adversarial | coverage gaps start/middle/end, 1-frame, fractional onset/end/settle/startFrame, full-coverage control, outside cue, zero-length | 2026-11-08 | PASS — 11/11, no bypass |
| geometry_adversarial_pack | adversarial | NaN/±Inf/-1/±1e308 × 7 entry points × all numeric fields; flex weights; gap>container; CLI raw literals | 2026-11-08 | PASS w/ defects — NaN/Inf fully guarded; G-1 flex grow 1e308 overflow (helper), G-2 grid container unconstrained, G-3 rail no lower bound (prod callers) |
| transforms_adversarial_pack | adversarial | 3-level chain hand-math, shrink scales, negative scale, extrema missing/wide/tight, safe-zone escape | 2026-11-08 | **FAIL — T-1 safe-zone BYPASS proven (scale:2 → right 945>940 PASSes), T-2 scale<0 check unreachable, T-3 extrema decorative** |
| vntext_ids_cli_pack | adversarial | NFC/NFD, CJK width, empty/combining-only, 5 blank-ID variants, states enum, CLI malformed/missing/empty/unknown-keys/1e309/strings | 2026-11-08 | PASS — no bypass; V-1 full-width Latin 0.58em under-estimate |

## 2026-11-13 — Phase 4C restore-seals verification (branch latest @ HEAD cecae00, uncommitted diff)

Ad-hoc inline packs (definitions + full evidence in RESULTS/2026-11-13-phase4c-restore-seals-verification.md).
Outer wrapper: `perl -e 'alarm shift; exec @ARGV' 300 <cmd>`.

| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| phase4c_targeted_verification_pack | verification | 3 targeted pytest commands (21/46/neighbors) + 2-failure HEAD-worktree differential + restore_seals CLI probe (4 scenarios) + _persist_session_evidence shape probe | 2026-11-13 | PASS w/ discrepancies — neighbor-count claim AMBIGUOUS; D-1 NEW-IN-DIFF defect (fallback copy-through-symlink clobber) |
| r2_mandated_suite_pack | verification | mandated 3-file pytest -v suite (79) + nested packets/episode/ layout probe (5 steps) + exit-code matrix (6 rows) + launcher pin grep | 2026-11-13 | PASS — 79 exact; 5/5 + 6/6 MATCH; drift exit 0→3 fix confirmed; launcher PINNED; 0 defects |
| preservation_recheck_pack | preservation | branch/HEAD, tracked set (6 pre-existing), package-lock, P1.1 untracked set, CLI/vitest/exports fingerprint, mtimes, helper-caller grep | 2026-11-08 | **STRICT FAIL on mtimes** — runtime.mjs (disclosed edit+restore) + cli.mjs (unattributed touch) written in-session; content integrity verified-equivalent; tracked set/locks/fingerprints all exact |

## 2026-11-08 — P1.1 re-adjudication round 2 (dev fixes @ 20:38-20:39, uncommitted)

Evidence: RESULTS/2026-11-08-p11-layout-readjudication-round2.md. Wrapper: perl-alarm 300.

| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| mandatory_recheck_pack | acceptance | verbatim 4-command block, 14/14 claim, per-file rows, cli.ts disposition, mtimes | 2026-11-08 | PASS — 14/14 CONFIRMED (layoutGuard file 12→13, new rail-drift test) |
| transforms_recheck_pack | adversarial | T-1 repro + Variant A (multi-element) + Variant B2 (final-level escape), T-2 -1/-0.5/0, T-3 containment 4 cases, T-4 3-step math, regressions | 2026-11-08 | **ALL FIXED** — safe-zone + per-element + final-level catches live; containment cites both; negative scale rejects |
| geometry_vn_recheck_pack | adversarial | G-1 bound ≤1e6, G-2 profile-dims rule, G-3 leftDesign + 13 caller sites, V-1 fullwidth 1.0em, NaN/Inf regression | 2026-11-08 | **ALL FIXED** — exact rules quoted; callers compatible; ＡＢＣ boundary now rejects |
| preservation_recheck2_pack | preservation | Root.tsx numstat 19/0 (diff numstat — resolves round-1 S-1 misread), lockfiles, tracked=6+tester-docs, lanes, mtimes ≤20:39, dev fixture attribution | 2026-11-08 | PRESERVED — bypass.json = DEV fixture (20:38) verified exit 1; zero round-2 worker writes |

**Round-2 verdict: CLEAN — APPROVED. Bypass list empty. Phase C P1.1 closed.**

## 2026-11-08 — Phase E P1.3 scene-packet/episode-gate adversarial adjudication (branch editorial-hardening-20261108 @ a722521)

Ad-hoc inline packs (full evidence: RESULTS/2026-11-08-phase-e-p1.3-scene-packet-episode-gate-adjudication.md). Wrapper: perl-alarm 300 (pytest) / 60-120 (CLI probes). Fixtures in /tmp/p13_*.

| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| p13_focused_pack | acceptance | pytest test_scene_packet.py + test_episode_gate.py (15) | 2026-11-08 | PASS — 15/15, 0.32s |
| p13_fullsuite_pack | regression | pytest tests/ (2021+), claim-shape confirm | 2026-11-08 | PASS — 2020P/1F/12S/3XF/1 subtest, 67.33s; sole fail = documented pre-existing hexpix pointer |
| p13_cli_contract_pack | acceptance | scene_packet 0/1/2 ×7 cases; episode_gate 0/1/2 ×5 | 2026-11-08 | PASS — named codes, no tracebacks in contract paths |
| p13_adv_hash_freeze_pack | adversarial | output-hash binding, malformed hashes ×4, findings tamper, freeze mtime/1-byte/wrong-hash, determinism | 2026-11-08 | PASS — no bypass; freeze content-hash confirmed |
| p13_adv_token_path_pack | adversarial | tokens ×9 (mismatch/missing/equality/None/forged/instance-ids), paths ×7 (traversal/absolute/symlink-inside/swap/chain) | 2026-11-08 | **1 BYPASS B-1** (shared token + distinct instance_id → ACCEPT) + trust boundary documented (equality-only; CLI self-attestation :118); paths all rejected |
| p13_adv_schema_episode_pack | adversarial | schema ×12, episode ×11 (dup/missing/junk/mix-absent/timing cross-cut/prod inputs) | 2026-11-08 | PASS w/ D-1 (binary junk → UnicodeDecodeError traceback, fail-closed) + 2 tolerances documented (neighbor_context {}, unknown top-level keys) |
| p13_preservation_pack | preservation | baseline + after-check: HEAD/log/8-file dirty set/numstat 21-0/staged/stash/untracked perimeter | 2026-11-08 | PRESERVED — zero drift, zero commits |

**P1.3 verdict: PASS WITH FINDINGS — B-1 (shared-credential independence hole, 1-line fix), D-1 (R4 UnicodeDecodeError traceback, 1-line fix), D-2..D-4 minor. Timing/mix/production cross-cuts REAL.**

## 2026-11-08 — Phase E P1.3 re-adjudication round 2 (B-1/D-1/D-4/DOC, same HEAD a722521)

Evidence: RESULTS/2026-11-08-phase-e-p1.3-readjudication-round2.md. Wrapper: perl-alarm. Fixtures /tmp/p13r2_*.

| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| r2_preservation_pack ×2 | preservation | baseline + after-check: HEAD/log/8-file set/numstat 22-0/staged/stash/diff-stat 1109-135 | 2026-11-08 | PRESERVED — zero drift, zero commits |
| r2_focused_pack | acceptance | pytest 2 focused files | 2026-11-08 | PASS — 27/27, 1.20s (15 + 12) |
| r2_fullsuite_pack | regression | pytest tests/ | 2026-11-08 | PASS — 2032P/1F/12S/3XF/1 subtest, 68.70s; sole fail = pre-existing hexpix; zero new |
| r2_probe_pack | adversarial | B-1 (shared token → reviewer_not_independent exit 1; distinct → exit 0), D-1 (binary junk → clean packet_io_error exit 1, traceback grep 0/8), 4 regression guards | 2026-11-08 | ALL FIXED-CONFIRMED — bypass list EMPTY |
| r2_d4spot_pack | analysis | 27 tests, de-vacuated freeze test, 5-of-8 new codes spot-verified w/ real asserts, CLI subprocess 0/1/2 both CLIs | 2026-11-08 | CONFIRMED — 20/27 named-code density |
| r2_doc_pack | doc-check | doctrine 22/0 append-only single hunk; trust sentence verbatim (consistency-check-not-authentication, CLI self-attestation, API trusted-orchestrator) | 2026-11-08 | ADEQUATE — CONFIRMED |

**Round-2 verdict: PASS — ALL FOUR FINDINGS CLOSED. Bypass list empty. Phase E P1.3 CLOSED.**

## 2026-11-10 — editorial-language-gate independent acceptance verification (branch feature/editorial-language-gate-20261110 @ 3d538b6, change set UNCOMMITTED)

Ad-hoc inline packs (definitions + full evidence in RESULTS/2026-11-10-editorial-language-gate-independent-acceptance.md).
Outer wrapper: `perl -e 'alarm shift; exec @ARGV' 300` (no timeout/gtimeout on this host). Fixtures in /tmp.

| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| gate_cli_fixtures_pack | acceptance | gate CLI on 2 real fixtures (mua-lu exit 1 / 56 blocked; xang-dau exit 0 under --force-editorial), per-finding JSON, gitignore proof | 2026-11-10 | PASS (bare xang-dau = SKIP exit 0, vacuous) |
| adversarial_probe_pack | adversarial | 10 fixture families vs 5 bypasses (role-name, missing transform, non-t2i, undeclared component, mid-string anchor) | 2026-11-10 | **FAIL — 5 bypasses CONFIRMED (exit 0 where 1 required)** |
| wiring_proof_pack | acceptance | compose-path wiring via /tmp harness (render stubs), fail-closed ordering, golden byte-identity | 2026-11-10 | PASS with caveats (enforcement at render entry, not compose; M6 residue) |
| project_census_pack | acceptance | gate over all 47 projects + remotion-composer/projects_qc | 2026-11-10 | PASS — FAIL=2 (mua-lu, nvidia-ceo), SKIP=44, ERROR=0 |
| contracts_suite_pack | regression | `pytest tests/contracts -q` | 2026-11-10 | PASS (1254P/0F/7S, +21 vs 1233 baseline) |
| root_suite_pack | regression | `pytest tests/ -q` + base-3d538b6 pre-existence proof | 2026-11-10 | PASS (exactly the 2 pre-existing failures; both red at pristine base) |
| tsc_vitest_pack | regression | `npx tsc --noEmit` + `npx vitest run` + importer/lane diff | 2026-11-10 | PASS (tsc exit 0 10.67s; vitest 6 files/47 tests) |
| docs_cli_consistency_pack | acceptance | doc-specified command verbatim, flag/positional form, exit-code contract | 2026-11-10 | PASS (0 hard mismatches; SKIP-0 caveat) |
| media_preservation_pack | preservation | media mtime census, render-tree deltas, fence start/end | 2026-11-10 | PASS (no media modified/deleted, no render) |

## 2026-11-10 — final verification of the two landed MAJOR fixes (branch feature/editorial-language-gate-20261110 @ 3d538b6)

Read-only focused final verification of the M1 (narrowed closing-scene exemption) + M2 (gate/compose verdict
parity, declared-but-unvalidatable = BLOCKED) remediations. Ad-hoc inline packs — the command groups below ARE
the packs (per `.agents/tester/README.md`: no pack scripts are registered in the repo for read-only runs; PACKS.md
lists ad-hoc pack names with their command groups in the RESULTS report instead). Full evidence:
`RESULTS/2026-11-10-editorial-language-gate-final-verification.md`.

Outer wrapper on this host: `perl -e 'alarm shift; exec @ARGV' 300 <cmd>` (GNU `timeout`/`gtimeout` are ABSENT —
`timeout 300 ...` exits 127 and skips the work; perl SIGALRM kill = exit 142 = TIMEOUT).

Gate CLI: `.venv/bin/python tools/qc/editorial_language_gate.py --project projects/<slug>` (flags `--force-editorial`, `--manifest`; exit 0 = not blocked/SKIP, 1 = blocked, 2 = invalid invocation/missing project/producer error).

| Pack | Type | Scope | Last Run | Status |
|---|---|---|---|---|
| editorial_gate_m1_closing_acceptance | acceptance | M1: 1-scene background-only last scene must BLOCK; `projects/xang-dau-demo-20261107 --force-editorial` = exit 0, 12 pass + 2 revise; `projects/mua-lu-trung-bo-2026-11-09` = exit 1, 56 blocked (4 contract-section + 7 graphic-native + 10 photo-dominance + 35 anchor) + 1 revise, scene-10 exempt; empty / non-string role sets fail closed | 2026-11-10 | RUNNING |
| editorial_gate_m2_parity_acceptance | integration | M2: declared + manifest MISSING => CLI exit 1 `EL-MANIFEST-MISSING` + compose blocks, no output; declared + manifest CORRUPT => CLI exit 2 `EL-MANIFEST-UNPARSEABLE` + compose blocks, no output; no-metadata => CLI SKIP, compose proceeds, NO warning; non-editorial => SKIP, no warning; CLI/compose parity over all 4 inputs | 2026-11-10 | RUNNING |
| editorial_gate_census_acceptance | acceptance | gate census over every project under `projects/` — FAIL set must be exactly {mua-lu-trung-bo-2026-11-09, nvidia-ceo-affair-20261109}, all others SKIP | 2026-11-10 | RUNNING |
| editorial_bypass_regression_acceptance | adversarial | 5 previously-closed bypasses still fail closed: unmounted card-stack component, one-token rename to a token that exists in the tree, role `background` at 100% canvas, `hero` any method, mid-string `anchor:` token | 2026-11-10 | RUNNING |
| editorial_wiring_ordering_acceptance | integration | editorial preflight runs BEFORE output-dir creation (blocked => no `renders/`, no output file, render never reached); non-editorial committed golden fixture unchanged | 2026-11-10 | RUNNING |
| regression_contracts_pack | regression | `.venv/bin/python -m pytest tests/contracts -q` | 2026-11-10 | PASS — exit 0, `1274 passed, 7 skipped in 22.64s` |
| regression_root_pack | regression | `.venv/bin/python -m pytest tests/ -q` — expect EXACTLY the 2 pre-existing failures (`tests/test_video_contract_docs.py::test_inventory_scalar_counts_match_disk`, `::test_broken_links_zero_stale`) | 2026-11-10 | RUNNING |
| ts_typecheck_pack | regression | `cd remotion-composer && npx tsc --noEmit` | 2026-11-10 | PASS — exit 0, 0 type errors |
| ts_vitest_pack | regression | `cd remotion-composer && npx vitest run` | 2026-11-10 | PASS — exit 0, 6 files / 47 tests |
| fence_media_artifact_acceptance | acceptance | fence stability (status count + md5 at pass start vs end; only gitignored qc writes + this RESULTS doc may differ), no media path added/modified/deleted, no new render artifacts, lane isolation (animation / kids / character-animation untouched, no non-editorial importer of the new components) | 2026-11-10 | RUNNING |
