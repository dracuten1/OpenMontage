# Tidier Notes — OpenMontage

## Review: feature/timing-relock-hardening (436fda6..486cf7e)
- **Iteration 001** (2026-10-08): 2 workers (tidier-readable-code + tidier-static-hygiene), both reported.
- Verdict: **FIX-BEFORE-MERGE (light)** — 1 High (misleading docstring / dead return in `_check_script_section_durations`, lib/checkpoint.py:124-149,242 — docstring claims checkpoint-metadata emission that never happens; sibling edit-gate does attach, so false symmetry). Fix is 2 lines.
- 7 Medium (probe-helper duplication incl. lib→tools import inversion; unnamed 25.0 soft-cap literal; loop-body `import logging` + 5-level nesting; undocumented gate-activating params; unused tolerance imports in tests; 3× duplicated predecessor-checkpoint setup in tests).
- 9 Low. Exclusions honored: all 7 caller-listed backlog items unreported by both workers.
- Repo has no linter config; all style judgments are neighbor-convention based. No `.agents/tidier/rules/` yet.
- Ops note: both workers' `skill_feedback` calls rejected with "No usage record found" (load_skill delivery not tracked as usage record) — attribution gap, substance preserved in reports.

## Review: video-slowfix-phase2 (OM wt 44f4c5f9..dd7bc73; hermes wt 4ed33e18..956afc60)
- **Iteration 001** (2026-11-12): 2 workers (tidier-readable-code + tidier-static-hygiene), both reported.
- Verdict: **Pass** — 0 High. 6 Medium (deferred, non-blocking per caller rule), 15 Low notes.
- Mediums: burst-throttle magic numbers (governor.py:81-88); writer_runner signature bloat + untyped public API (writer_runner.py:62-63, merged finding); dup spawn/watchdog/stream legacy-vs-phase2 (writer_wrapper.py:48-102 vs writer_runner.py:34-110); dup env parse with divergent validation (run_cc_pipeline.py:29-35 vs governor.py:145-153); dead `stdout` var (writer_wrapper.py:169); hermes rollback-flag polarity inversion (terminal_tool.py:1694 vs process_registry.py:1582).
- Lint: hermes ruff GREEN (3 changed files; ruff 0.17.4 from /tmp venv picking repo pyproject config — nothing installed in repo); OM py_compile GREEN (7 files); OM `make lint` skipped (no .venv; target compiles 4 files unrelated to diff).
- Exclusions honored: 4 accepted nits + Phase1 regions untouched (0 findings contact them beyond informational).
- Deferred to Reviewer: governor burst `throttled=True, permits_reserved=0` under full load (governor.py:78-90); launcher uncaught ValueError on non-int env (run_cc_pipeline.py:36); `log_fp` closed without try/finally (writer_wrapper.py:170-179); parents[4] shim no sanity probe (writer_wrapper.py:28-32, reviewer_wrapper.py:21-24); watchdog thread sleeps full duration + thread-per-retry (writer_runner.py:105-110); hermes switches read at different lifecycle points; OM tests cross-import other test modules.
- Tidier committed nothing (read-only mandate) — fixes for Developer, `phase2(tidy):` conventional commits suggested.


## Review: fix/reviewer-only-timeout-hotfix (b3507076..c6b4ad6)
- **Iteration 001** (2026-11-14): 2 workers (tidier-readable-code + tidier-static-hygiene), both reported.
- Verdict: **Pass** — 0 High, 4 Medium (comment narrative drift, prose copy-paste, pre-existing module size), 7 Low.
- Cleanliness: Zero stray debug code (no print/pdb/TODO). Imports clean and consumed. Public functions typed.
- Deferred to Reviewer: runtime env whitelist completeness (missing proxy/locale vars vs broad provider keys); dot-sandbox exclusion ordering in scene_orchestrator.
