# Lesson: two in-tree tests encoding contradictory contracts (R3 infra-retry vs stale phase1 test)

Date: 2026-11-13 — engagement perf-r1-r5-cc-pipeline-verification (worktree OpenMontage-wt-perf-r1-r5)

## What happened
Full-suite run on a perf branch showed a behavioral failure with an in-range smell:
`tests/test_video_slowfix_phase1.py::test_orchestrator_timeout_error_exhausts_retries` asserted
`len(rec.attempts) == 1` under `max_retries=0`, but the orchestrator (changed in-range by R3) produced
4 attempts — timeout_error now triggers in-place infra retries (cap 3, backoff 2s/4s/8s) independent of
the content `max_retries`.

## Root cause pattern
The R3 change was intentional, documented (scene_orchestrator.py:1247-1250, :1325-1326), and covered by a
NEW in-range test (`test_r3_reviewer_timeout_verdict_is_infra_retry`, test_perf_r1_r5.py:274-290, asserting
`[1, 1, 1, 1]` with `infra=True` at max_retries=0). But the OLD test pinning the pre-R3 semantics was left
untouched — so the branch ships two tests asserting opposite contracts on the same behavior. The suite is
red without any production defect.

## Detection method that worked
1. Base differential (git worktree at fafd481 in /tmp, same venv): base PASSES → not pre-existing.
2. `git log <range> -- <failing test file>` empty → test not updated in-range.
3. Grep the in-range diff + the new tests for the new contract → found the deliberate redefinition.

## Lessons
- When a behavior contract changes in-range, grep the WHOLE tests/ tree for tests pinning the OLD
  semantics — not just the new suite being added. One grep per old-contract keyword would have caught this
  before the pack run (e.g. search for `max_retries` assertions near timeout/retry wording).
- "In-range failure" ≠ "regression": classify carefully — (a) stale test needs update, (b) real regression,
  (c) pre-existing. The base differential decides between all three in one step (~1 min per test).
- A deliberate contract change that leaves any old-contract test alive is a MERGE BLOCKER even when the
  production change is correct: the suite cannot go green, and the stale test will keep failing CI.
- Design flag worth surfacing: `max_retries=0` no longer means "zero retries" for infra-class failures
  (up to 3 infra retries ≈ 14s backoff before escalation). If any caller relies on the old semantics, the
  fix is an explicit infra-cap-0 escape hatch, not just a test update.

## Reusable commands (macOS host, no timeout/gtimeout)
- Base differential: `git worktree add --detach /tmp/<name> <base-sha>` → run failing node ids with
  `/Users/tuyennguyen/project/OpenMontage/.venv/bin/python -m pytest <nodeids> -q` under
  `perl -e 'alarm shift; exec @ARGV' 120` → `git worktree remove --force /tmp/<name>`.
- Attribution buckets used: IN-RANGE / PRE-EXISTING-AT-BASE / ENVIRONMENTAL-WORKTREE / ENVIRONMENTAL-FFMPEG.
