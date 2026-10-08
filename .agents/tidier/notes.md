# Tidier Notes — OpenMontage

## Review: feature/timing-relock-hardening (436fda6..486cf7e)
- **Iteration 001** (2026-10-08): 2 workers (tidier-readable-code + tidier-static-hygiene), both reported.
- Verdict: **FIX-BEFORE-MERGE (light)** — 1 High (misleading docstring / dead return in `_check_script_section_durations`, lib/checkpoint.py:124-149,242 — docstring claims checkpoint-metadata emission that never happens; sibling edit-gate does attach, so false symmetry). Fix is 2 lines.
- 7 Medium (probe-helper duplication incl. lib→tools import inversion; unnamed 25.0 soft-cap literal; loop-body `import logging` + 5-level nesting; undocumented gate-activating params; unused tolerance imports in tests; 3× duplicated predecessor-checkpoint setup in tests).
- 9 Low. Exclusions honored: all 7 caller-listed backlog items unreported by both workers.
- Repo has no linter config; all style judgments are neighbor-convention based. No `.agents/tidier/rules/` yet.
- Ops note: both workers' `skill_feedback` calls rejected with "No usage record found" (load_skill delivery not tracked as usage record) — attribution gap, substance preserved in reports.
