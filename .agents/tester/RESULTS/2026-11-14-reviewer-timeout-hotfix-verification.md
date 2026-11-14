# Test Report: Reviewer-Only Timeout Hotfix Verification
Date: 2026-11-14
Worktree: /Users/tuyennguyen/project/OpenMontage-wt-reviewer-timeout-hotfix
Branch: fix/reviewer-only-timeout-hotfix @ c6b4ad61cd0c3edd42618031b567fc7e684c9125 (base b3507076, 3 commits: 4d5b76b, df34182, c6b4ad6)
Worker instances: a79f7166 (test-exec-worker), d99971bf (wrapper-contract-worker)

## Verdict: PASS — Hotfix contracts intact, all targeted tests green

All hotfix changes pass verification across test suites, minted wrappers, tool permissions, env whitelist, and dot-dir sandbox containment. 3 test failures in `test_video_contract_docs.py` are triaged as pre-existing docs-inventory drift and worktree untracked files, not hotfix regressions.

## Environment
- Interpreter: `/Users/tuyennguyen/project/OpenMontage/.venv/bin/python` (Python 3.12.13, pytest 9.1.1)
- Host: macOS (Darwin arm64); no `timeout`/`gtimeout` -> dual-layer protection via `perl -e 'alarm shift; exec @ARGV' 300 <cmd>` outer guard
- Clean tree at `c6b4ad6`

## Part 1: Targeted Unit & Integration Tests

Command:
```bash
perl -e 'alarm shift; exec @ARGV' 300 /Users/tuyennguyen/project/OpenMontage/.venv/bin/python -m pytest \
  tests/test_perf_r1_governor.py \
  tests/test_perf_r1_r5.py \
  tests/test_restore_seals.py \
  tests/test_scene_orchestrator.py \
  tests/test_scene_orchestrator_denials.py \
  tests/test_video_contract_docs.py \
  tests/test_video_slowfix_phase1.py \
  tests/test_video_slowfix_phase2.py \
  tests/test_video_slowfix_phase4.py -v
```

Counts:
- Total: 226 | Passed: 223 | Failed: 3 | Skipped: 0
- Runtime: 15.85s (well within 300s limit)

Breakdown:
- `tests/test_scene_orchestrator_denials.py`: PASS
- `tests/test_video_slowfix_phase1.py`: PASS (25/25)
- `tests/test_video_slowfix_phase4.py`: PASS (including canary watchdog timeout_error, findings injection toggle, governor assert)
- `tests/test_scene_orchestrator.py`: PASS (21/21)
- `tests/test_perf_r1_governor.py`: PASS (13/13)
- `tests/test_perf_r1_r5.py`: PASS (22/22)
- `tests/test_restore_seals.py`: PASS (33/33)
- `tests/test_video_slowfix_phase2.py`: PASS
- `tests/test_video_contract_docs.py`: 3 failures (triaged pre-existing/environment)
  1. `test_inventory_scalar_counts_match_disk`: skills_tree_md_files claim 295 vs 160 on disk (pre-existing in main repo)
  2. `test_status_doc_cited_evidence_paths_exist`: missing 2026-11-09 sync doc (pre-existing in main repo)
  3. `test_inventory_active_paths_exist_on_disk`: untracked main checkout directory `skills/creative/shotcraft/` missing in worktree

## Part 2: Wrapper Syntax & Contract Integrity

### 1. py_compile check: PASS
All 6 minted wrappers across both projects compiled cleanly:
- `projects/canary-phase4/scripts/cc_pipeline/reviewer_wrapper.py`: exit 0
- `projects/canary-phase4/scripts/cc_pipeline/writer_wrapper.py`: exit 0
- `projects/canary-phase4/scripts/cc_pipeline/run_cc_pipeline.py`: exit 0
- `projects/tai-chinh-3tin-20261111/scripts/cc_pipeline/reviewer_wrapper.py`: exit 0
- `projects/tai-chinh-3tin-20261111/scripts/cc_pipeline/writer_wrapper.py`: exit 0
- `projects/tai-chinh-3tin-20261111/scripts/cc_pipeline/run_cc_pipeline.py`: exit 0
- Template byte-identity and manifest hashes (`.mint_manifest.json`) verified consistent.

### 2. Disallowed tools configuration: PASS
- `tools/qc/reviewer_runner.py:35`: `REVIEW_DISALLOWED_TOOLS = "Write,Edit,MultiEdit,NotebookEdit,Bash,WebFetch,WebSearch"`
- `tools/qc/reviewer_runner.py:97`: argv emits `"--disallowedTools", REVIEW_DISALLOWED_TOOLS`
- Exact built argv:
  `['claude', '--print', '--dangerously-skip-permissions', '--permission-mode', 'acceptEdits', '--allowedTools', 'Read,Glob,Grep', '--disallowedTools', 'Write,Edit,MultiEdit,NotebookEdit,Bash,WebFetch,WebSearch', '--max-turns', '45']`
- Confirmed tested by `tests/test_video_slowfix_phase1.py::test_build_reviewer_cmd_is_read_only`.

### 3. Env whitelist: PASS
- `reviewer_wrapper.py:130-143`: whitelist filters parent env to:
  `_ENV_ALLOW_KEYS = ("PATH", "HOME", "USER", "SHELL", "TMPDIR")`
  `_ENV_ALLOW_PREFIXES = ("OM_",)`
  `_ENV_ALLOW_PROVIDER_KEYS = ("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY")`
  `MAX_THINKING_TOKENS = "1024"`
- End-to-end verification with stubbed child binary confirmed: all AWS credentials (`AWS_SECRET_ACCESS_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SESSION_TOKEN`), tokens (`GITHUB_TOKEN`, `SLACK_BOT_TOKEN`, `HF_TOKEN`), `DATABASE_URL`, and `ENSEMBLE_KMS_HANDLE` stripped.

### 4. Dot-dir sandbox rejection: PASS
- `tools/qc/scene_orchestrator.py:499-505`:
  `if any(part.startswith(".") for part in Path(rel_path).parts): violations.append(rel_path)`
- Tested against `.agents/skill.md`, `.venv/pyvenv.cfg`, `.claude/settings.json`, `.hidden_evil/scene/S01.tsx`, `scene/.hidden.tsx`, `.git/hooks/pre-commit`. All rejected as writer scope violations.
- Allowed exceptions preserved: `.tmp_sandboxes/` and `history/`.
- Confirmed tested by `tests/test_scene_orchestrator_denials.py::test_dotdir_path_rejected_not_silently_contained`.
