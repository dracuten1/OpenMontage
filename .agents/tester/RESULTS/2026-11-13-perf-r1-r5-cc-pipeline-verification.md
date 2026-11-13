# Test Report: perf R1-R5 CC video pipeline verification
Date: 2026-11-13 (engagement 16:44–17:0x UTC)
Worktree: /Users/tuyennguyen/project/OpenMontage-wt-perf-r1-r5
Branch: perf/cc-pipeline-r1-r5 @ b5e29b19477da2da88dacf060ecc55882e8c18dd (base fafd481, 5 commits: e706b50, 8496963, 0095c51, 5923e50, b5e29b1)
Worker instances: 9da1caf6 (W0 recon/env), bfb5b162 (P1), 95cd56a7 (P2), d63f735c (P3), a799b7e5 (P4), 537f173a (P5), 765305ef (P6, revived once after LLM-proxy i/o timeout), 34f8899c (P7 attribution)

## Verdict: NOT-READY — one in-range red test blocks a green suite
All production behavior verified working. Single blocker is a STALE TEST, not a code defect:
`tests/test_video_slowfix_phase1.py::test_orchestrator_timeout_error_exhausts_retries` pins the pre-R3
retry semantics (max_retries=0 ⇒ attempts==1) while in-range commit 0095c51/8496963 deliberately
redefined timeout_error as infra-retry-in-place (covered by new test
`test_r3_reviewer_timeout_verdict_is_infra_retry`, max_retries=0 ⇒ attempts==[1,1,1,1], infra=True).
Two contradictory contracts now live in-tree; the suite cannot be green until the stale phase1 test is
updated to the R3 contract (test-only change) or R3 gains an explicit infra-cap-0 escape hatch (design call).

## Scope Decision
Full suite requested + merge verdict commissioned → release-gate scope. Full run justified: diff spans
production orchestrator (tools/qc/scene_orchestrator.py +314/-14, reviewer_runner.py), 4 wrapper template /
8 deployed wrapper files, and 2 new test files; cross-cutting behavior contract (Phase 4C intactness) must hold.
All 2398 collected tests exercised via 6 inline packs (5 targeted + full suite). No packs skipped.

## Environment
- Interpreter: /Users/tuyennguyen/project/OpenMontage/.venv/bin/python (pytest 9.1.1, Python 3.12.13; jsonschema OK; lib.checkpoint imports worktree code via cwd). Worktree has no own .venv. Bare python3 broken as advertised (lib/checkpoint.py:15).
- Host: macOS, no timeout/gtimeout → perl-alarm 300 command-level guard on every pack (exit 142 = TIMEOUT). Never fired.
- Repo clean at b5e29b1 before/after; read-only engagement honored by all workers (throwaway outputs in /tmp only; base-differential worktree removed, zero residue).

## Suite-by-suite results
| Pack | Scope | Result | Counts | Runtime |
|---|---|---|---|---|
| P1 perf_r1_r5_new_suites | tests/test_perf_r1_r5.py (22) + tests/test_perf_r1_governor.py (13) | PASS | 35/0F/0E/0S | 1.31s |
| P2 scene_orchestrator_regression | tests/test_scene_orchestrator.py | PASS | 21/0F/0E/0S | 2.56s |
| P3 phase4c_intactness (MUST pass) | tests/test_video_slowfix_phase4.py (25) + tests/test_restore_seals.py (33) | PASS | 58/0F/0E/0S | 5.21s — Phase 4C intact: YES |
| P4 gate_packet_prevalidation | test_episode_gate.py (12) + test_episode_gate_provenance.py (9) + test_scene_packet.py (15) | PASS | 36/0F/0E/0S | 1.38s — no prevalidation false positives on legit layouts |
| P5 wrapper spot-check (static) | canary-phase4 + tai-chinh-3tin cc_pipeline | PASS | 5/5 checks | — |
| P6 full_suite_regression | pytest tests/ (2398 tests) | FAIL | 2371P/8F/17S/3XF | 109.83s |

### R1-R5 behavior coverage evidence (P1, all green)
- R1 governor: default ceilings 4/6 (`test_default_ceiling_constants_unchanged`, `[tier4-6]`, `[oauth-4]`, `[unknown-4]`, `[api-key-4]`), env rollback wins (`test_env_rollback_still_wins_over_default`). Commit e706b50 removed max-concurrency=1 pin.
- R2 brief from attempt 1: constant coverage, writer-template injection, minted-wrapper injection (`test_r2_minted_writer_wrapper_injects_brief_into_task`).
- R3 infra vs content: transport glitch / timeout verdict / CLI crash = infra retry in place; content rejection consumes attempt; mixed sequence; budget exhaustion escalates; backoff bounded (`test_r3_infra_backoff_delay_contract`).
- R4 prevalidation: clean episode; missing/corrupt packet + missing narration ref flagged; variant-aware scene presence (`test_r4_prevalidate_variant_aware_scene_presence`); 200B/201B boundary parity (`test_r4_prevalidate_200b_boundary_parity_with_promotion`); fail-fast on trivial scenes, full gate when render-ready.
- R5: turn cap 45 (`test_r5_reviewer_turn_cap_raised_to_45`), timeout_error contract synced both sides, minted reviewer wrapper emits timeout_error on missing verdict.

### P5 wrapper spot-check detail
- REVIEWER_STYLE_BRIEF: real import binding (writer_wrapper.py:46-52 from tools.qc.scene_orchestrator, sys.path shim lines 42-44), live usage `task = task + REVIEWER_STYLE_BRIEF` (:327, :404). Reviewer wrapper has none — by design (template has none); brief is writer-side only.
- timeout_error verdict: wired via `REVIEW_TIMEOUT_VERDICT` (reviewer_runner.py:38) at watchdog expiry (reviewer_wrapper.py:147) and no-verdict detection (:161), persisted into verdict/findings packets; downstream consumer scene_orchestrator.py:86 + R3 infra classification (:1244-1253, :1553-1557).
- Template parity: writer/reviewer rendered == .tmpl byte-identical (sha256 0b8e80e0… / 5b8e9203…); run_cc_pipeline.py differs only by {{PROJECT_SLUG}}/​{{DEFAULT_SCENE_COUNT}} substitution; .mint_manifest.json hashes match on-disk templates+renders; template_content_hash independently reproduced (932bc7ed…).
- Cross-project: wrappers byte-identical; run_cc_pipeline differs only in 5 slug lines; manifests differ only minted_at (2s), project name, rendered run hash, strict flag (true/false, env at mint time).
- Wrapper-specific tests: none exist under either project (coverage lives at repo level in tests/test_perf_r1_r5.py — includes minted-wrapper tests).
- Non-blocking anomalies: manifest om_commit records 0095c51 (HEAD at mint time, 2 commits before the re-mint chore commit); strict flag differs across projects.

## Full-suite failure attribution (P6 run + P7 base-differential at fafd481)
Method: `git worktree add --detach /tmp/om-base-fafd481 fafd481`, ran all 7 attributable tests at base with same venv; worktree removed after. In-range diff: 14 files (wrappers×8, templates×2, scene_orchestrator.py, reviewer_runner.py, tests×2); video_compose.py / editorial_language_gate.py / docs / all 4 failing test files NOT in diff; `grep "'source'"` in diff → 0 matches.

| # | Test | Bucket | Evidence |
|---|---|---|---|
| 1-3 | test_editorial_language_gate_contract.py :528 / :708 / :1216 | PRE-EXISTING-AT-BASE | All 3 fail at fafd481. Mechanism: video_compose.py:622 `Path(cut["source"])` vs fixtures carrying only `{"id":"s1"}` → bare KeyError('source') surfaced as ToolResult error. Untouched by diff. |
| 4 | test_compose_evidence.py :196 | ENVIRONMENTAL-FFMPEG | Fails at base too. Fixture is deliberate fake bytes (`voice_file.write_bytes(b"RIFFdummywavdata")`, test :46-47); host ffmpeg N-126924-tessus rejects with "Invalid data found" — exact P6 error reproduced by direct probe. |
| 5 | test_video_contract_docs.py :425 | PRE-EXISTING (documented) | MATCH vs 2026-11-10 baseline (295 vs 160 skills .md). |
| 6 | test_video_contract_docs.py :528 | ENVIRONMENTAL-WORKTREE | Same 138-entry failure at base. Missing entries (NOTES.local.md, skills/creative/shotcraft/**) never tracked (`git ls-tree` 0 at both refs), exist untracked in main repo checkout. |
| 7 | test_video_contract_docs.py :831 | ENVIRONMENTAL-WORKTREE | Cited docs/plans/2026-11-09-video-skills-agent-team-sync.md never committed (ls-tree 0 both refs), untracked in main repo. Same failure at base. |
| 8 | test_video_slowfix_phase1.py :499/:518 | **IN-RANGE — TEST-GAP (sole blocker)** | Base PASSES (max_retries=0 → range(1, 2) → 1 attempt). HEAD: `while attempt_idx <= max_retries + 1` (:1347) + timeout_error branch → `next_attempt_after_infra` holds attempt_idx while infra_retries < cap 3 (:1297-1310, backoff 2s/4s/8s) → 4 appended attempts. Test untouched in-range (git log empty). New in-range test test_r3_reviewer_timeout_verdict_is_infra_retry (test_perf_r1_r5.py:274-290) asserts the NEW contract at the same max_retries=0. Two contradictory contracts in-tree. Production change deliberate + documented (scene_orchestrator.py:1247-1250, :1325-1326). |

Baseline drift (informational): test_broken_links_zero_stale passed this run (failed on 2026-11-10 baseline) — fixed by e283138 (2026-11-11 postmortem), an ancestor of fafd481. Not in-range. 2026-11-08 hexpix pointer also absent.

## Failure → action map
- #8 (blocker): branch owner updates stale phase1 test to the R3 contract — OR adds explicit infra-cap-0 semantics if any caller treats max_retries=0 as "no retries at all" (design flag: such callers now burn up to 3 infra retries ≈ 14s backoff before escalation). Test-only fix preferred; needs owner decision because the phase1 test encodes the pre-R3 service contract.
- #1-3: pre-existing compose fixture debt on latest (KeyError('source') leak) — separate ticket, NOT this branch.
- #4: strict ffmpeg build vs fake fixture bytes — environment/test-fixture hygiene, separate ticket.
- #5-7: documented pre-existing + worktree-content drift (untracked main-repo files) — no action for this gate.

## ensure.md Validation Results
- `.agents/tester/rules/ensure.md`: NOT PRESENT (user-owned; prior ask on record in README.md). No project-specific gates to validate. Commissioned verification list (items 1-6 of the tasking) acted as the gate list — all executed. Carry-forward: ask user to add ensure.md.

## Overall Status
- New R1-R5 suites: ✅ PASS (35/35, full R1-R5 mapping)
- Orchestrator regression: ✅ PASS (21/21)
- Phase 4C intactness: ✅ PASS (58/58) — MUST-PASS contract holds
- Gate/packet suites: ✅ PASS (36/36) — no prevalidation false positives
- Minted wrapper spot-check: ✅ PASS — wrappers correctly re-minted from current templates
- Full suite: ❌ FAIL 2371P/8F — 7/8 attributed outside diff range; 1 in-range stale-test gap
- **Merge verdict: NOT-READY until the stale phase1 retry-contract test is reconciled (test-only change expected).**

## ADDENDUM (2026-11-13, post-reconciliation) — VERDICT: READY
Leader ruled Option A (stale test updated). Reconciliation commit a7c44809a2b71873e6cdc777381296384d0d429e
("test(perf): reconcile phase1 timeout test with R3 infra-retry contract") verified: touches ONLY
tests/test_video_slowfix_phase1.py (+15/−2, git show --stat verbatim in P8 evidence).
Recheck pack phase1_retry_contract_recheck (worker 30045150, perl-alarm 300, interpreter unchanged):
`pytest tests/test_video_slowfix_phase1.py -q` → **PASS, 25/25, 0F, 3.87s**. Reconciled test
test_orchestrator_timeout_error_exhausts_retries (:499) among passes; prior state 24P+1F → arithmetic
conclusive. Zero new failures. Full-suite failure ledger final state: 8F → 0 in-range (7 pre-existing/
environmental + 1 reconciled). Merge verdict: **READY**.
Artifact-convention evidence (P8 adjunct): tester docs historically committed via preserve-sweep commits
(fafd481 "preserve tester/reviewer evidence artifacts" precedent, 4 commits touching .agents/tester/).
Current dirty set = 2 modified (PACKS.md, README.md) + 2 untracked (RESULTS + LESSONS of this engagement) —
pre-preservation state. Recommendation: preserve-commit before worktree teardown (durability), matching
fafd481 precedent; or giter finalize sweep if it runs before removal.
