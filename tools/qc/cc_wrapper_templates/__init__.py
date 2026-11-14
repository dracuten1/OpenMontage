"""CC wrapper templates — single source of truth for per-project pipeline minting (phase 4A.2).

``tools/qc/mint_project_pipeline.py`` renders the ``.tmpl`` files in this
package into ``<project>/scripts/cc_pipeline/*.py``. The templates carry the
Phase-1/2 semantics the 2026-11-12 run proved missing:

- watchdog expiry emits verdict ``"timeout_error"`` (reviewer) — activates the
  orchestrator's infrastructure retry;
- reviewer permission mode ``acceptEdits`` + ``--allowedTools Read,Glob,Grep``
  tool scoping, stdout ``<!-- VERDICT_START/END -->`` extraction with code-fence
  stripping, wrapper itself writes the verdict + findings files
  (reviewer-timeout hotfix 2026-11-14: planOnly reviewers burned the whole
  turn budget planning instead of converging — deterministic 4/4
  ``timeout_error``. Historical R6 note: an earlier incident attributed
  ``--allowedTools`` scoping loss to accept-edits mode; containment now
  rests on sandbox isolation + canonical-mutation scope checks);
- writer: transient-API-error jittered exponential backoff (``writer_runner``),
  ``sys.path`` repo-root shim (task 2.4), findings append gated on
  ``OM_FINDINGS_INJECT`` (4A.1), SceneShell pre-seed header +
  ``validate_imports_and_theme`` pre-flight (4A.3, ported from phase-3 task
  3.2 — single owner is the writer template's pre-flight);
- launcher: ``max_concurrency=None`` pass-through (no hardcoded ceiling) +
  fail-loud ``ConcurrencyGovernor`` import assert.
"""
