# Wave 0 (P0-1) Wrapper Template Backport + Re-mint — Independent Verification

- **Date**: 2026-11-16
- **Engagement**: third-pair-of-eyes verification (audit + review had already run; this pass = independent re-verification + offline behavioral checks)
- **Repo**: /Users/tuyennguyen/project/OpenMontage-wt-roadmap-wave0-wave1
- **Branch/Tip verified**: fix/roadmap-wave0-wave1 @ 096e305eb5dc767b7b96ba6c1bdeff2b3949ee47 (all 3 workers confirmed rev-parse match)
- **Workers**: fac082ef (Pack A hashes/idempotency/placeholders), 57d3d640 (Pack B hunks/syntax), 1a442ef6 (Pack C behavioral smoke)
- **Constraints honored**: zero repo writes (pre/post `git status` identical, only pre-existing untracked `?? projects/tai-chinh-3tin-20261111/artifacts/`); no live LLM/claude invocations; re-renders to mktemp dirs only, cleaned; dual-layer timeout (perl alarm outer + internal watchdog); Wave 1 files untouched.

## Verdict

**PASS — 6/6 claims verified, no BLOCK.** Wave 0 (P0-1) backport + re-mints are internally consistent: templates ≡ deployed (byte-identical), re-render is idempotent via the minter's own `_render()`, all hunks present with expected semantics, 11/11 syntax-clean, and the offline verdict-extraction harness passes all scenarios on both exercised deployed variants.

## Per-Claim Results

### Claim 1 — Hash identity: PASS
`shasum -a 256` — reviewer family all `1dcbc50750d837bddcd6adb0035b0557d066a2c789e6e8f946977904f3cdbc6b` (template + canary-phase4 + faa-ground-stop-20261114 + tai-chinh-3tin-20261111 + tin-nong-5tin-20261115); writer family all `ec948f5707dd5b71145a8c377a0c6a1b59b4a09241a26af2f96581130a536aac`. 10/10 byte-identical.

run_cc_pipeline variance: 6/6 pairwise diffs, identical hunk shape (lines 2/62/157/273/284-285), only `<SLUG>` values differ. `DEFAULT_SCENE_COUNT` line (153, `15 + 1`) identical across all 4 (all mints scene_count=15 per `.mint_manifest.json`).

### Claim 2 — Re-mint idempotency: PASS
Mint mechanism LOCATED (not derived-sed): `tools/qc/mint_project_pipeline.py` `_render()` (lines 186-192) = `{{PROJECT_SLUG}}` + `{{DEFAULT_SCENE_COUNT}}` replace-only. Worker re-rendered via the minter's OWN `_render` with `python3 -B` into `<tmp>/remint/` → **12/12 byte-matches** (writer + reviewer + run_cc_pipeline × 4 projects). Manifest cross-tie: recorded rendered-hash prefixes match deployed hashes. Caveat: full `mint_project()` side effects (strict-gate/purge/manifest) not exercised — read-only constraint; render equivalence is the load-bearing part and is proven.

### Claim 3 — Hunk presence (A-E + faa extras): PASS (1 documented shape nuance)
All 5 files (template + 4 deployed) identical at identical line numbers:

| Hunk | Verdict | Evidence |
|---|---|---|
| A `@@VERDICT_START@@`/`@@VERDICT_END@@` wire | PASS (wire-level) | START literal @ L23 all 5. END exists nowhere as a plain-text wrapper line — enforced via `tools/qc/reviewer_runner.py:153` `AT_VERDICT_DELIMITER_RE = re.compile(r"@@VERDICT_START@@(.*?)@@VERDICT_END@@", re.DOTALL)`, imported by all 5 wrappers, consumed at wrapper L264 (fallback `REVIEW_TIMEOUT_VERDICT` when neither regex matches). Interpreted as wire-protocol PASS; literal-in-file reading of hunk A as specified is NOT met — flagged, not blocking. |
| B no `--allowedTools`/`--disallowedTools` in cmd | PASS | 2 grep hits per file are docstring L10 + a hard guard (L189-192: `REVIEWER ARGUMENT CONTRACT FAIL` if a tool-scope flag survives `strip_tool_scoping_flags(cmd)` at L164). Flags stripped then asserted absent — semantics satisfied, never in cmd construction. |
| C `OM_CC_REVIEW_STREAM_ATTEMPTS` | PASS | L164-168: value forced to 1 + stderr warning (`reviewer: OM_CC_REVIEW_STREAM_ATTEMPTS forced to 1; no verdict => timeout_error`). Expected semantics confirmed from code. |
| D file-channel verdict + `reviewed_hashes` re-stamp | PASS | L125 `reviewed_hashes = {scene_rel: sha256(scene_file)}` (after sandbox existence check; missing → rejected findings w/ empty map), stamped at atomic findings write L271-274. |
| E `OM_CC_REVIEW_OUTPUT` gate | PASS | L159-163: `mode = env.get("OM_CC_REVIEW_OUTPUT", "text").strip().lower()`; only `"json"` adds `--output-format json`; anything else → text (default-safe). |
| faa per-cwd CLI warm-up | PASS — NOT faa-only | Present in ALL 5 files incl. template, L197-212 (`warmup.md` + `child_argv` + `strip_tool_scoping_flags`; evolved confinement-aware form of the 116caa9 reference shape). |
| faa stdin-from-file race fix | PASS — NOT faa-only | Present in ALL 5 files, L218 (`stdin=open(task_file, ...)`) — main task fed from file too. |

### Claim 4 — Syntax (py_compile): PASS 11/11
4 reviewers + 4 writers + 2 templates + tin `reviewer_pass.py` (located: `projects/tin-nong-5tin-20261115/scripts/cc_pipeline/reviewer_pass.py`) — all exit 0, no stderr. Bytecode cfile to /tmp, cleaned (no in-repo `__pycache__` writes).

### Claim 5 — Behavioral smoke (offline): PASS
Wrappers byte-identical across variants → behavior identical by construction; harness exercised canary-phase4 + tin-nong-5tin-20261115 copies separately via tmp-mirror imports (REPO_ROOT walked inside tmp).

- (a) findings-file channel + re-stamp: verdict parsed `approved`; wrapper-stamped `reviewed_hashes['scenes/S01.tsx']` byte-for-byte equal to independently computed sha256 of fixture (canary `ab4da5f4…170f1`, tin `626254c5…9b0c`). PASS both.
- (b) env gate: `json`→json mode (argv gains `--output-format json`), unset→text, `garbage123`→text. 6/6 case PASS (default-safe confirmed).
- (c) stdout masquerade: file=approved + forged stdout=rejected → winner `approved` (file wins); supplementary c2 (file=rejected, stdout=approved → rejected) and c3 (invalid file verdict → stdout legitimately used) both correct. No masquerade hole. PASS both.

Real mechanisms exercised: `main()` end-to-end (L103-280), `sha256()` + `_atomic_write_json()`, `reviewer_runner.extract_verdict`/`extract_at_verdict`, scene filename resolution, confinement plan/argv/cleanup (real tempfile staging + seatbelt profile; `sandbox-exec` probe itself simulated, documented).

### Claim 6 — Placeholder integrity: PASS
- reviewer_wrapper.py.tmpl: 0 matches.
- writer_wrapper.py.tmpl: raw grep 2 — both f-string escaped braces emitting TS imports (L294 `import {{ SceneShell }} …`, L297 `import {{ COLORS, FONTS }} …`), NOT mint placeholders. Zero real placeholders.
- run_cc_pipeline.py.tmpl: 7 occurrences, exactly 2 distinct: `{{PROJECT_SLUG}}` ×6, `{{DEFAULT_SCENE_COUNT}}` ×1 — matches the two documented config vars.

## Offline-not-verified (explicit gaps, all bounded)
1. Seatbelt (`sandbox-exec`) enforcement probe — patched to sim in harness; OS-lane coverage belongs to prior packs, not verdict logic.
2. Provider-side `--output-format json` envelope-unwrap branch (wrapper L232-237) live shape — requires real LLM output. Observable mode difference verified at the argv level instead (flag present iff `OM_CC_REVIEW_OUTPUT=json`).
3. `timed_out` → `timeout_error` branch (L260-261) — real-watchdog-only; verdict value is a constant, low value.
4. `reviewer_pass.py` hash-identity (tin-only optional template, outside the 3-file mint-set claim) — presence + syntax verified only.
5. Full `mint_project()` (strict-gate/purge/manifest side effects) — would write in-repo; `_render` equivalence proven instead.

## Hygiene observations (non-blocking)
- Pre-existing stale `tools/qc/cc_wrapper_templates/__pycache__/` (`.cpython-312.pyc` containing VERDICT_END) predates this run — worth a repo cleanup by an owning lane.
- Pre-existing untracked `projects/tai-chinh-3tin-20261111/artifacts/` untouched.

## Pack definitions (ad-hoc, read-only — per README convention)
| Pack | Type | Scope | Last Run | Status |
|---|---|---|---|---|
| wave0_p0_1_hash_identity_pack | verification | 10-way sha256 identity, 6-pair run_cc_pipeline variance, `_render` re-mint to tmp, placeholder inventory | 2026-11-16 | PASS |
| wave0_p0_1_hunks_syntax_pack | static | hunks A-E + faa extras across template+4 deployed; py_compile 11 files (cfile→/tmp) | 2026-11-16 | PASS |
| wave0_p0_1_verdict_smoke_pack | behavioral (offline) | findings-channel + re-stamp hash equality, env-gate json/unset/garbage, stdout masquerade precedence × 2 variants | 2026-11-16 | PASS |

Wrapper: perl-alarm (no timeout/gtimeout on host). Interpreter: system `python3` (worktree has no venv).
