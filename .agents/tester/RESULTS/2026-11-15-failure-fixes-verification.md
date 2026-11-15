# Test Report: fix/failure-fixes (dcd7a21) — independent verification

Date: 2026-11-15
Worktree: /Users/tuyennguyen/project/OpenMontage-wt-failure-fixes (branch fix/failure-fixes, HEAD dcd7a2183bf874fd90a35baf5f875dfd5f3ff600)
Workers: c4920af8 (gate), 052a0652 (suite+baseline), db6a9b78 (test review), d8bb3633 (evidence manifests)
Plan ref: OpenMontage minimal evidence-supported fixes 1-5
Constraint honored: no live video-production run, no perf claims, main checkout untouched.

## Summary
- Targeted gate: PASS — 103/103 in 9.85s (restore_seals 33 + scene_orchestrator 26 + video_slowfix_phase4 25 + test_failure_fixes 19)
- Full suite: 2399 passed / 7 failed / 16 skipped / 3 xfailed in 96.59s (20 test files)
- Baseline stability: all 7 failures reproduce IDENTICALLY at dcd7a21^ (=9456376, git-archive extraction, no checkout). Same error strings, same failure line numbers (528/708/1216/196/425/528/831). Test files byte-identical parent↔HEAD (`git diff --stat 9456376 dcd7a21 -- <3 test files>` empty). Verdict: PRE-EXISTING ×7, zero regressions from dcd7a21.
- Evidence preservation: PASS — projects/ tree 419 files, sha256 manifests identical pre/post (zero added/deleted/modified), `git status --porcelain -- projects` clean. tin-nong-5tin-20261115 ABSENT in worktree evidence tree (absent pre-run too; nothing to overwrite).
- Test review: 19 tests exist, all map to fixes 1-5, no mock-echo weakness found. 14/19 revert-detecting (static analysis); 5 are regression-guards/doc-conformance by design.
- Overall: READY. Developer claims verified: counts exact (2399/7), failure set exact.

## The 7 failures (all PRE-EXISTING, confirmed by runtime at parent)
| Test | Error @ dcd7a21 | Error @ dcd7a21^ |
|---|---|---|
| contracts/test_editorial_language_gate_contract.py::test_producer_not_invoked_when_lane_not_detected | compose aborts, `'source'` | same |
| ::test_editorial_compose_proceeds_and_ids_align | `'source'` | same |
| ::test_non_editorial_compose_passes_required_gates_none | `'source'` | same |
| test_compose_evidence.py::test_public_compose_positive_fully_valid_evidence_proceeds | ffmpeg exit 183, invalid voice.wav | same |
| test_video_contract_docs.py::test_inventory_scalar_counts_match_disk | 295 vs 160 | same |
| ::test_inventory_active_paths_exist_on_disk | 138 active entries missing | same |
| ::test_status_doc_cited_evidence_paths_exist | missing cited plan doc | same |

Root-cause shape (not fixed by this branch, pre-existing):
- editorial ×3: one root — compose error `"'source'"` via lib.production_validation + tools/qc/editorial_language_gate.py (both UNCHANGED in dcd7a21; static overlap check confirms no overlap).
- compose_evidence ×1: env-shaped — ffmpeg build N-126924-g68e78f1826f-tessus rejects generated voice.wav.
- video_contract_docs ×3: docs-vs-disk inventory drift. NOTE: file reads changed docs/ORCHESTRATION_DOCTRINE.md — static analysis alone could not rule out regression, but runtime at parent shows identical failures → settled: pre-existing.

## New-test coverage (fixes 1-4 + guard)
- Fix 1 filename parity (S{NN}.tsx canonical + legacy fallback): 8 tests (5 revert-detecting). E2E #15 runs REAL minted wrapper via subprocess with stub `claude` bin; asserts S01.tsx created AND scene-1.tsx absent. #16 asserts preamble text delivered to claude stdin contains "scenes/S01.tsx". Revert → returns "scene-1.tsx" → fail. Fidelity: real-process, not mock-echo.
- Fix 2 manifest scope isolation: 5/5 revert-detecting. New `load_writer_attempt_manifest`/`attempt_manifest=` — revert → AttributeError/TypeError. Negative control (sibling scene denied), dot-dir fail-closed, carve-out tier (no-manifest path), e2e dispatch asserting `writer_scope_valid is True` + freeze contract still fires (`frozen_input_mismatch`). False-violation prevention + real denials preserved.
- Fix 3 tsc defer: 2/2 revert-detecting. `_tsc_own_scene_fail` 3-state: partial+baseline-only → defer (failed is False, "TSC BASELINE WARN"); TS2322 while partial → strict; all-scenes+TS2307 → strict. Revert removes defer branch → baseline case returns strict → fail. Fail-closed rules covered (TS2307 vs existing file → False; non-TS2307 → False).
- Fix 4 deadline marker + bounded retry: 2/3 revert-detecting. `TRANSIENT_API_ERROR_MARKERS` + "context deadline exceeded" — revert → non-transient → immediate fail. #14 pins bounded exhaustion: 4 spawns, 4 governor bursts, "Exhausted retries on API errors". #12 pins retry-then-success + jitter window `4.5 <= sleep <= 6.5`. Bounded loop pre-existed; tests pin it.
- Fix 5 preserve-guard: #19 structure guard (by design passes either way).
- Caveat: revert-detection verdicts are static-analysis conclusions (read-only mandate — no revert actually executed).

## Evidence-safety notes
- test_failure_fixes.py / test_restore_seals.py / test_scene_orchestrator.py: clean — all writes tmp_path-scoped; env vars (OM_EPISODE_DIR, OM_STUB_PROJECT_ROOT, mint --project-dir) point into tmp.
- test_video_slowfix_phase4.py: ONE flag (PRE-EXISTING, outside dcd7a21 diff): guard test creates + rmtree's `REPO_ROOT/projects/_guard_nonexistent_project` — transient repo write, self-cleaning, invisible to pre/post manifests (created+removed within run). Race risk for parallel git-status checks only.
- test_video_slowfix_phase1.py: clean but COUPLED to real repo copy projects/tai-chinh-3tin-20261111/scripts/cc_pipeline/writer_wrapper.py (read/exec only; updated in dcd7a21 — good coverage, coupling risk if project dir pruned).
- No `tin-nong` references in any of the 5 test files.

## Failure-mode prevention (point 5 — test-evidence based, no live run)
- Scene naming mismatch (scene-1.tsx vs S01.tsx): COVERED — resolver + template parity asserted; real-process e2e proves canonical file minted and legacy name absent.
- False scope violations on collaborator shared edits: COVERED — manifest tier exempts manifest-allowed shared edits while sibling-scene + dot-dir denials still fire; e2e separates scope tier from freeze contract.
- tsc on partial scenes: COVERED — defer-on-baseline-only-with-partial asserted, strict-on-real-error asserted; revert-detecting.

## Scope decision
> Targeted gate + full suite run in the failure-fixes worktree only, per explicit request; main checkout untouched; baseline via git-archive extraction to /tmp (no checkout/stash). Skipped: live video-production run (out of scope per task), perf claims.

## Docs updated
- RESULTS/2026-11-15-failure-fixes-verification.md (this file, untracked)
