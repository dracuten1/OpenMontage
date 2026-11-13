# Tester — OpenMontage
Current engagement (2026-11-13): perf R1-R5 CC video pipeline verification on worktree
`OpenMontage-wt-perf-r1-r5` (branch perf/cc-pipeline-r1-r5, fafd481..a7c4480 after reconciliation)
— see RESULTS/2026-11-13-perf-r1-r5-cc-pipeline-verification.md (FINAL verdict READY: sole in-range
red (stale phase1 retry-contract test) reconciled by a7c4480, recheck 25/25; 7 other failures
attributed pre-existing/environmental; Phase 4C intactness held;
LESSONS/2026-11-13-r3-infra-retry-contract-vs-stale-phase1-test.md).
Prior engagements: 2026-11-13 Phase 4C restore-seals, 2026-11-10 editorial-language-gate,
2026-11-08 Phase F / P1.4 / P1.3, 2026-10-08 timing-relock-hardening.

## Project
OpenMontage: Remotion-based animated explainer production pipeline.
Current engagement: final acceptance of `projects/eth-tradingagents-20261003/renders/final.mp4`.

## Test approach
- Acceptance runs are READ-ONLY against project deliverables: no repo file may be
  created/modified/deleted by test packs. Throwaway scripts go to /tmp only.
- Packs are ad-hoc inline command groups (named `*_acceptance`) — no pack scripts are
  registered in the repo for read-only runs; PACKS.md therefore lists ad-hoc pack names
  with their command groups in the RESULTS report instead.
- Dual-layer timeout still applies: outer `timeout 300`/`gtimeout`/subprocess timeout,
  plus an internal watchdog (`signal.alarm`) in any throwaway python.

## Rules / quality gates
- `.agents/tester/rules/ensure.md`: NOT PRESENT (user-owned). For the current engagement
  the commissioned acceptance criteria (ffprobe gate, decode integrity, audio clarity,
  7 artifact schema gates, 6 checkpoint gates, sync/consistency, frames, staged media)
  act as the gate list. Ask user to add ensure.md for future engagements.

## Environment
- Repo root: /Users/tuyennguyen/project/OpenMontage (macOS).
- NO `timeout` AND NO `gtimeout` on this host — use the perl-alarm watchdog instead:
  `perl -e 'alarm shift; exec @ARGV' <seconds> <cmd>` (verified 2026-10-08).
- Python: `.venv/bin/python` from repo root.
- Expected render actuals: h264 1920x1080@30, AAC, 64.04s, 19,459,083 B,
  duration gate [59.83, 66.13]s.

## Directories
- RESULTS/ — dated acceptance reports
