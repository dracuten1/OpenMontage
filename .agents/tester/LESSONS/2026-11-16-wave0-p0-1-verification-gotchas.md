# Wave 0 P0-1 Verification — Interpretation Gotchas (2026-11-16)

Engagement: independent verification of wrapper template backport + re-mints
(fix/roadmap-wave0-wave1 @ 096e305). Full evidence:
RESULTS/2026-11-16-wave0-p0-1-wrapper-verification.md. Verdict: PASS 6/6.

Three traps a future verifier of these wrappers should know upfront:

1. **Hunk A "plain-text wire markers" is regex-enforced, not literal-in-wrapper.**
   `@@VERDICT_END@@` appears NOWHERE as a plain-text line in the wrapper files.
   The pair lives in `tools/qc/reviewer_runner.py:153`
   (`AT_VERDICT_DELIMITER_RE = re.compile(r"@@VERDICT_START@@(.*?)@@VERDICT_END@@", re.DOTALL)`),
   imported by all 5 wrappers and consumed at wrapper L264 with
   `REVIEW_TIMEOUT_VERDICT` fallback when neither verdict regex matches.
   A naive literal grep of the wrapper for the END marker will report 0 and
   could false-FAIL the hunk. Check the wire protocol (imported regex),
   not the wrapper text alone.

2. **Writer template `{{` grep hits are f-string escapes, not placeholders.**
   `grep -o -E '\{\{[^}]*\}\}'` on writer_wrapper.py.tmpl returns 2 hits —
   L294 `import {{ SceneShell }} …` and L297 `import {{ COLORS, FONTS }} …` —
   Python f-string escaped braces emitting TypeScript imports. Zero real mint
   placeholders. Verify against the minter's substitution list
   (`tools/qc/mint_project_pipeline.py:_render` = only `{{PROJECT_SLUG}}` +
   `{{DEFAULT_SCENE_COUNT}}`) before flagging.

3. **Re-render idempotency is provable without the full minter.**
   `mint_project()` writes into the repo (strict-gate/purge/manifest), which
   read-only verification cannot run. The load-bearing equivalence is the
   render step: import the minter's own `_render()` with `python3 -B` and
   render into a mktemp dir — byte-compare there. 12/12 MATCH proves
   idempotency without touching deployed files.

Also observed: stale pre-existing `tools/qc/cc_wrapper_templates/__pycache__/`
(containing a VERDICT_END pyc) — not ours; flag for a repo-hygiene cleanup lane.
Workers must avoid in-repo imports/py_compile without a `cfile=` redirect:
both would silently create `__pycache__` in the deployed tree and violate the
read-only constraint.
