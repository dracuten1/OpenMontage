# Sync Acceptance Test — WAVE-2 REGRESSION + ACCEPTANCE RE-RUN

Date: 2026-11-09
Repo: `/Users/tuyennguyen/project/OpenMontage`
Branch: `editorial-hardening-20261108` @ `a3724d4daeb1bb0abfb61867380b01a6318ad72e` (working tree fully dirty — all changes uncommitted)
Trigger: developer wave-2 changed **PRODUCTION GATE CODE** — `tools/qc/scene_orchestrator.py` (+27/−0), `tools/qc/scene_packet.py` (+16/−1) — plus docs and tests (incl. NEW `tests/test_scene_orchestrator_denials.py`).
Predecessor report: `.agents/tester/RESULTS/2026-11-09-sync-acceptance-test.md` (prior wave: PASS 9/9)
Test Leader: tester (dispatched 15 worker instances; no test executed directly)
Scope: **full commissioned set W1–W12, no reduction applied.** Every item was executed.

> **STATUS: REPORT FINAL.** All commissioned items W1–W12 executed and evidenced. Zero git mutations; zero deletions/renames; protected paths/lanes verified clean.

---

## Summary

| Item | Verdict | Evidence anchor |
|---|---|---|
| W1 full python suite | **PASS** | `2120 passed, 12 skipped, 3 xfailed in 74.78s`, exit 0, 0 failures, collected 2134 |
| W2 qa e2e (direct) | **PASS** | `END-TO-END TEST COMPLETE: 38 passed, 0 failed`, exit 0, 14s. (pytest route is N/A by construction — pre-existing) |
| W3 docs contract + non-tautology | **PASS** | repo `20 passed`; /tmp mutation A `1 failed, 19 passed`; mutation B `1 failed, 19 passed`; restore `20 passed` |
| W4 enforcement routes | **PARTIAL** | (a) exit 1 `scene_packet_missing` ✓; (b) exit 1 `scene_packet_extra` ✓; (c) canonical cross-scene deny ✓ but **leader's literal subdir case ALLOWED (exit 0)** + leg asymmetry + `io_operations` unwired in prod |
| W5 gate regression + non-tautology | **PASS** | 4-file pack `55 passed in 2.80s`; /tmp revert → `5 failed, 6 passed`; restore → `11 passed` → **NON-TAUTOLOGICAL** |
| W6 block uniformity | **PASS** | block md5 `1dd8e674ff57ae3b9fb711c9ff2190cd` ×103, 12 lanes; `contract v2.0` 13/13; doctrine glob at lines 12 + 261 |
| W7 inventory recompute | **PASS** | 658 recorded == 658 recomputed; all by_* match; 0 ownerless ACTIVE; 0/658 missing paths; dedupe held |
| W8 artifact hash + drift | **PASS** | mp4 `2f2262e5…4c3929f7` / 8,376,927 B exact; both smoke workspaces byte-identical; drift none |
| W9 TS baseline | **PASS** | `Test Files 6 passed (6)` / `Tests 47 passed (47)` exit 0; `tsc --noEmit` exit 0, no output |
| W10 constraint sweep | **PASS** | 2163 entries classified: 146 (a) sync change set, 3 (b) pre-existing M, 2014 (c) pre-existing ??, 0 (d) in porcelain; staged 0; stash 0; reflog a3724d4; protected paths PASS |
| W11 capability-doc honesty | **PASS** | 19 rows, every evidence path exists, 0 capability-row overclaims; **1 off-by-one in doc prose (line 5)** |
| W12 residual honesty | **PASS** | Task-3 cases (a)(b)(c) now EXERCISED; ensure.md confirmed absent; 0 unqualified "independent reviewer" in capability rows |

**Overall: 11 PASS + 1 PARTIAL (W4). No regression detected in the wave-2 enforcement change. Two real enforcement defects and two doc defects surfaced — all recorded below, none of them silently passed.**

---

## W1 — FULL Python suite — **PASS**

### Exact command
```bash
cd /Users/tuyennguyen/project/OpenMontage && .venv/bin/python -m pytest tests/
```
(bash tool timeout 1900s as commissioned; actual runtime 74.78s — no cap was approached or raised)

### Exit code
```
0
```

### Final summary line (verbatim)
```
============ 2120 passed, 12 skipped, 3 xfailed in 74.78s (0:01:14) ============
```

Collection header (verbatim): `collected 2134 items / 1 skipped`

### Failures
**None.** Zero `FAILED` lines, zero tracebacks.

### Delta vs prior wave
| | prior wave | wave-2 | delta |
|---|---|---|---|
| passed | 2108 | **2120** | **+12** |
| failed | 0 | **0** | 0 |
| skipped | 12 | 12 | 0 |
| xfailed | 3 | 3 | 0 |

+12 = +1 new doc-rule test + 11 new tests in `tests/test_scene_orchestrator_denials.py` (worker confirmed **NEW-FILE TEST COUNT: 11**). Exactly as predicted — no unexplained growth.

### Gate-outcome divergence
**None.** Zero failures across `lib/checkpoint.py`, `tests/test_production_validation.py`, `tests/test_episode_gate.py`, `tests/test_scene_packet.py`, `tests/test_scene_orchestrator.py`, `tests/test_scene_orchestrator_denials.py`.

Independent recon of the wave-2 diff confirms the checkpoint layer is untouched in outcome terms: `lib/checkpoint.py` diff (+12/−1) is confined to `_enforce_stage_prerequisites` and is **diagnostics-only** — it adds `failure_causes: list[str] = []`, appends `f"{predecessor}: {type(exc).__name__}: {exc}"`, and surfaces those causes in `details`. The stage is still blocked exactly as before; only the error message gains the inner reason. `lib/checkpoint.py` **does not import** `scene_packet`/`scene_orchestrator`/`episode_gate` (grep returns zero hits); its production hook is `lib.production_validation.validate_checkpoint_production_gate`.

---

## W2 — `tests/qa/test_08_end_to_end.py` — **PASS** (via direct route)

### Route 1 — the commissioned pytest command — N/A by construction
```bash
cd /Users/tuyennguyen/project/OpenMontage && .venv/bin/python -m pytest tests/qa/test_08_end_to_end.py
```
```
EXIT CODE: 5
============================ no tests ran in 13.55s ============================
```
0 items collected. **Not a wave-2 regression.** Investigation evidence:

- The file defines **zero `test_*` functions**, no `pytest.mark`, no `unittest.TestCase`, no `__main__` guard. AST scan: **121 top-level executable statements**, 0 test functions. The full 7-stage E2E pipeline executes **at import time**.
- Unguarded module-scope execution (verbatim, lines 40–44):
  ```python
  # Clean previous run
  if PIPELINE_DIR.exists():
      shutil.rmtree(PIPELINE_DIR)
  if ASSETS_DIR.exists():
      shutil.rmtree(ASSETS_DIR)
  ASSETS_DIR.mkdir(parents=True, exist_ok=True)
  ```
  ending with unguarded `print(f"END-TO-END TEST COMPLETE: {PASS} passed, {FAIL} failed")`.
- File state: **tracked, clean, NOT in porcelain, zero diff**, sha256 `825bde1a2750f35b85dfc429ad49431c3d2fb8d24b592516b417b47947063953`, mtime Nov 9 10:14:32 local — **predating both the prior acceptance run and this wave**. Last commit touching it: `cb32930`.
- The **"38" is the script's own internal `check()` assertion counter**, printed only on a DIRECT run. It is not a pytest count. The prior report already documented both exits separately (pytest → exit 5 / "no tests ran in 13.44s"; direct → exit 0 / `38 passed, 0 failed`).
- Collection across `tests/qa/`: **2** collectable tests total (both in `test_09_hyperframes_compose.py`); `test_08` collects 0. **No file anywhere collects 38.** The plan text conflates two different executions.

### Route 2 — direct execution (produces the commissioned signal)
```bash
cd /Users/tuyennguyen/project/OpenMontage && .venv/bin/python tests/qa/test_08_end_to_end.py
```
```
EXIT CODE: 0
END-TO-END TEST COMPLETE: 38 passed, 0 failed
```
Wall clock 14s. Output tail (verbatim):
```
  [PASS] Checkpoint assets readable
  [PASS]   Has canonical artifact 'asset_manifest'
TIMING VALIDATION WARNING (stage 'edit', project 'qa_e2e_test'): asset_manifest.json does not exist yet at edit gate; skipping audio duration comparison.
  [PASS] Checkpoint edit readable
  [PASS]   Has canonical artifact 'edit_decisions'
  [PASS] Checkpoint compose readable
  [PASS]   Has canonical artifact 'render_report'
  [PASS] Checkpoint publish readable
  [PASS]   Has canonical artifact 'publish_log'

  Final cost: {'total_spent_usd': 0.0, 'total_reserved_usd': 0, 'budget_remaining_usd': 5.0}

============================================================
END-TO-END TEST COMPLETE: 38 passed, 0 failed
============================================================
```
Artifact: `tests/qa/output/e2e_final_output.mp4` size 713,066 B, sha256 `043dd365076fcdf42a22db9d25dd9c04bf8151bfc193b05042c3fab962392812`, mtime `2026-11-09T15:03:40` local. Porcelain entry count **2163 before → 2163 after** (no change). Writes confined to gitignored `tests/qa/output/`.

### Gate-outcome divergence
None.

### ⚠ Side effect disclosure
Both invocations of this file execute a real render at import (5+ ffmpeg calls, `rmtree` of `tests/qa/output/e2e_pipeline/` + `e2e_assets/`, 8 stage checkpoints, ~47 scratch files). This happened inside the gitignored `tests/qa/output/` tree; **zero tracked-file impact** (`git diff --name-only -- tests/` empty). This is a pre-existing property of the file, not a wave-2 change, and matches the prior wave's own behaviour (also 47 scratch files).

---

## W3 — Docs contract test + non-tautology — **PASS**

### Phase 1 — repo baseline
```bash
cd /Users/tuyennguyen/project/OpenMontage && .venv/bin/python -m pytest tests/test_video_contract_docs.py -q
```
```
EXIT CODE: 0
20 passed in 0.42s
```
Exactly the expected 20 (prior wave: 19 → +1 new doc-rule test).

### Phase 2 — non-tautology (all in `/tmp/w3_mut`)
Path resolution in the test (verbatim):
```python
REPO_ROOT = Path(__file__).resolve().parents[1]
DOCTRINE = REPO_ROOT / "docs" / "ORCHESTRATION_DOCTRINE.md"
INVENTORY = REPO_ROOT / "docs" / "video-contract-inventory.json"
CAPABILITY_STATUS = REPO_ROOT / "docs" / "video-capability-status.md"
EVIDENCE_WORKSPACE = REPO_ROOT / "projects" / "test-production-hardening-20261109-0114"
```
Imports are stdlib + pytest only (zero repo-module imports), so the copy needed no PYTHONPATH; the harness symlinked the non-mutated repo dirs read-only.

Copy baseline before mutation: `20 passed in 0.35s` ✔

**Mutation A — flip one capability row status** (entry index 0, `"status": "active"` → `"mirror-active"`):
```
1 failed, 19 passed in 0.57s
```
Failing test id: `tests/test_video_contract_docs.py::test_inventory_by_status_recompute_matches_pinned_distribution`
First assert line (verbatim):
```
E       AssertionError: by_status recompute drifted from the pinned distribution: {'mirror-active': 48, 'active': 528, 'duplicate-identical': 48, 'legacy-reference': 6, 'dirty-preserved': 1, 'untracked-dirty': 26, 'active-evidence': 1} vs {'active': 529, 'mirror-active': 47, 'duplicate-identical': 48, 'legacy-reference': 6, 'dirty-preserved': 1, 'untracked-dirty': 26, 'active-evidence': 1}
```

**Mutation B — delete/corrupt one evidence path** (`docs/ORCHESTRATION_DOCTRINE.md` → `docs/ORCHESTRATION_DOCTRINE_MUTATED_AWAY.md`):
```
1 failed, 19 passed in 0.34s
```
Failing test id: `tests/test_video_contract_docs.py::test_inventory_active_paths_exist_on_disk`
First assert line (verbatim):
```
E       AssertionError: 1 inventory entries marked 'active' do not exist on disk: ['docs/ORCHESTRATION_DOCTRINE_MUTATED_AWAY.md']
```

**Restore** → `20 passed in 0.32s`. Both failures provably came from the mutations, not the harness.

### ⚠ Coverage gap found
The status words in the **table rows of `docs/video-capability-status.md` itself** (`independently-verified`, `implemented-unverified`, …) are **not asserted by any test**. The test extracts only *path citations* from that doc and checks existence. Flipping a status word in the .md table would **not** fail the suite. Status enforcement lives solely in the inventory `by_status` pin + `EXPECTED_BY_STATUS` — which is what Mutations A and B exercised. **The test file is NOT tautological; the .md table's own status column is unenforced.**

---

## W4 — Enforcement routes via REAL code path — **PARTIAL**

### Real invocations discovered (never re-implemented)
```bash
python tools/qc/episode_gate.py <episode_dir>        # exit 0 pass / 1 rejected / 2 error
python tools/qc/scene_packet.py <packet.json>        # exit 0/1/2
orchestrate_episode(episode_dir=..., runner=CallableAgentRunner(writer_fn=...))   # real fn called by scene_orchestrator.main():1513
integrate_scene_packet(packet, packet_path=..., writer_token=..., reviewer_token=..., io_operations=[...])
```
Interpreter `.venv/bin/python` (repo venv 3.12.13; system python3 lacks pytest — the fixture chain imports it).

### (a) MISSING PACKET — **PASS**
```bash
.venv/bin/python tools/qc/episode_gate.py projects/test-sync-acceptance-20261109-t6-wave2-gate-routes/t6_route_a/episode
```
exit **1**, verbatim:
```
FAIL — episode gate rejected
- scene_packets_missing: no scene packets found
- scene_packet_missing: missing scene packet for authoritative scene: cut-1
```
Code match: `scene_packet_missing` **exact** ✔. Orchestrator leg (`packet_cut-2.json` deleted, `scene_ids=["cut-1"]`): child exit 1, verbatim `* scene_packet_missing: missing scene packet for authoritative scene: cut-2`, `OVERALL_STATUS: fail`.

### (b) EXTRA / UNKNOWN PACKET — **PASS**
```bash
.venv/bin/python tools/qc/episode_gate.py .../t6_route_b/episode     # packet_unknown-cut-99.json added
```
exit **1**, verbatim:
```
FAIL — episode gate rejected
- scene_packet_extra: scene packet scene_id not in authoritative scene set: unknown-cut-99
```
Code match: `scene_packet_extra` **exact** ✔. Orchestrator leg (rogue `packet_rogue-scene-x.json`): child exit 1, verbatim `* scene_packet_extra: scene packet scene_id not in authoritative scene set: rogue-scene-x`.

### (c) CROSS-SCENE WRITE DENIAL — **PASS for canonical shapes / FAILS for the leader's literal case**

**Passing shapes (exact expected codes, exit 1):**
- Writer-scope leg (real `verify_writer_scope` at `scene_orchestrator.py:1008`, malicious writer for cut-1 writes `packets/packet_cut-2.json`):
  ```
  OVERALL_STATUS: fail
  SCENE cut-1: status=failed
    attempt1 writer_scope_valid=False writer_modified=['packets/packet_cut-2.json'] reviewer_canonical_mutation=False
    attempt1 OWNERSHIP_ERROR: writer_scope_violation: writer modified files outside allowed scope: packets/packet_cut-2.json
    attempt1 ERROR: writer_scope_violation: writer modified files outside allowed scope: packets/packet_cut-2.json
  SCENE cut-2: status=success
    attempt1 writer_scope_valid=True writer_modified=['packets/packet_cut-2.json'] reviewer_canonical_mutation=False
  EPISODE_GATE: false
    * scene_execution_failed: one or more scenes failed during dispatch
  ```
- Packet leg (`integrate_scene_packet` with `io_operations=[{"path":"scene/cut-2/audio.wav"}]`): exit 1, verbatim `* io_outside_allowlist: IO outside allowed_io: scene/cut-2/audio.wav`.
- Writer-scope probes that deny (exit 1):
  - `packets/sub/packet_cut-2.json` → `writer_scope_violation: writer modified files outside allowed scope: packets/sub/packet_cut-2.json`
  - `scene/cut-2/audio.wav` → `writer_scope_violation: writer modified files outside allowed scope: scene/cut-2/audio.wav`

**🔴 DEFECT 1 — the leader's literal case is NOT denied.** A write under a **subdirectory of an allowed_io dir with a neutral name** is **ALLOWED (exit 0)** on both legs:
- writer-scope leg `packets/sub/x.json` → `VALID: True`, `ERR: None`, exit 0
- packet leg `packets/sub/x.json` → `VALID: True`, exit 0

The commission expected exit 1 + `writer_scope_violation` / `io_outside_allowlist` for a subdirectory write under an allowed_io dir. That expectation is **not met** for the generic case. The wave-2 predicate denies: other-scene `packet_*` / `packets/packet_*`, other-scene `packets/*_findings.json`, non-self `scene/...`, and any path whose text contains another authoritative scene id as a token (`re.search(rf"(?:^|[_\-.#/]){sid}(?:[_\-.#/]|$)")`). A subdirectory whose name is **not** a scene id falls through all four branches and is allowed. The case is only denied when the subdirectory happens to be named after another scene.

**🔴 DEFECT 2 — leg asymmetry.** `packets/sub/packet_cut-2.json`:
- writer-scope leg → **DENIED** (exit 1, `writer_scope_violation`)
- packet leg → **ALLOWED** (exit 0, `VALID: True`)

The packet leg's structural check matches the prefix `packets/packet_` only, so it misses the nested `packets/sub/packet_` form that the writer-scope leg catches.

**🟠 DEFECT 3 — the packet leg is unwired in production.** `io_operations=` is passed by **zero production callers** — neither `tools/qc/scene_packet.py` (CLI) nor `tools/qc/episode_gate.py` passes it. The `io_outside_allowlist` cross-scene branch is therefore **unreachable from any shipped CLI**; it fires only via direct API calls. The enforcement exists but is not on the production path.

### Controls (gate discriminates, does not always-fail)
(a) exit **0** (`PASS — episode gate`, intact episode) · (b) exit **0** (same intact episode) · (c) exit **0** (`OVERALL_STATUS: pass`, `EPISODE_GATE: true`; packet-CLI control `PASS — scene packet valid and integrated`).

### Isolation
All work in the NEW isolated dir `projects/test-sync-acceptance-20261109-t6-wave2-gate-routes/` (332 files; subdirs `t6_ctrl_ab/`, `t6_route_a/`, `t6_route_b/`, `t6_orch_{a,b,c,cc}/` (+`_abs`), `t6_packet_probe/`). Driver scripts in `/tmp` only. Pre/post aggregate sha256 over the three protected lanes → **UNCHANGED ×3**. No repo file modified outside the isolated dir.

### Limitations
1. `writer_scope_violation` cannot be triggered through the shipped CLI process itself (the CLI exposes no runner injection). It was driven through the real `orchestrate_episode` function — the exact function `main()` calls at `scene_orchestrator.py:1513` — using the shipped test's invocation shape verbatim. Child exit code mirrors `main():1546` (`0 if overall_status == "pass" else 1`), not a `main()` return.
2. `io_outside_allowlist` unreachable via any shipped CLI (see Defect 3).
3. First orchestrator-leg run used relative episode roots → `production_validation_failed` noise with doubled evidence paths (fixture embeds cwd-relative paths; driver artifact, not a product bug). The canonical runs used absolute paths and are clean; the relative-root runs remain in the isolated dir as noisy evidence.

---

## W5 — Gate regression + non-tautology — **PASS**

### W5a — consolidated 4-file pack
```bash
cd /Users/tuyennguyen/project/OpenMontage && .venv/bin/python -m pytest tests/test_scene_orchestrator.py tests/test_scene_orchestrator_denials.py tests/test_scene_packet.py tests/test_episode_gate.py -q
```
```
EXIT CODE: 0
55 passed in 2.80s
```
Per-file (collect-only): `test_scene_orchestrator.py`=17, `test_scene_orchestrator_denials.py`=**11**, `test_scene_packet.py`=15, `test_episode_gate.py`=12 → 55 ✔. Wall clock 3s. **No gate-outcome divergence.** No failures.

### W5b — non-tautology (revert wave-2 enforcement in `/tmp/w5b_mut`)

Baseline method: **(ii) HEAD versions**, cross-validated with (i) the prior report. HEAD `a3724d4` already contains `verify_writer_scope` and `integrate_scene_packet`; diffing HEAD→worktree shows the wave-2 delta is exactly +27/−0 and +16/−1, so reverting to HEAD removes **only wave-2**, not wave-1. `tools/qc/episode_gate.py` is byte-identical HEAD↔worktree — `scene_packet_missing`/`scene_packet_extra` predate wave-2.

Copy baseline (unmodified /tmp copy): `11 passed in 0.74s` (exit 0).

Revert applied (copy's two production files overwritten with `git show HEAD:` content; the denials test file untouched). Verbatim removed hunks: `import re`; the `authoritative_scenes`/`other_scenes` computation; the entire "Structural cross-scene denial" block; and the `sid`-aware `io_operations` restructuring in `scene_packet.py` (replaced by the original one-line predicate).

Reverted run:
```
5 failed, 6 passed in 0.60s
```

Failing tests (full id + first error/assert line verbatim):
| Test | First assert line |
|---|---|
| `tests/test_scene_orchestrator_denials.py::test_cross_scene_packets_dir_write_denied` | `E  assert True is False` (at `assert valid is False`, line 155) |
| `tests/test_scene_orchestrator_denials.py::test_cross_scene_findings_write_denied` | `E  assert True is False` (at `assert valid is False`, line 177) |
| `tests/test_scene_orchestrator_denials.py::test_cross_scene_directory_write_denied` | `E  assert True is False` (at `assert valid is False`, line 200) |
| `tests/test_scene_orchestrator_denials.py::test_cross_scene_audio_asset_write_denied` | `E  assert True is False` (at `assert valid is False`, line 222) |
| `tests/test_scene_orchestrator_denials.py::test_scene_packet_integrate_cross_scene_io_denied` | `E  AssertionError: assert 'io_outside_allowlist' in ['output_not_frozen', 'output_not_frozen', 'output_not_frozen', 'output_not_frozen', 'findings_hash_mismatch', 'findings_not_frozen']` (line 276) |

Still passing under revert (6) — these detect **pre-wave-2** enforcement: `test_missing_packet_rejected_by_episode_gate`, `test_missing_packet_rejected_by_scene_orchestrator`, `test_extra_unknown_packet_rejected_by_episode_gate`, `test_extra_unknown_packet_rejected_by_scene_orchestrator` (assert `episode_gate.py` codes, file unchanged by wave-2); `test_cross_scene_root_packet_write_denied`, `test_cross_scene_orchestrator_dispatch_denial_e2e` (target `packet_cut-2.json` at episode **root**, outside every `allowed_io` dir, so the pre-wave-2 directory-allowlist already denies it).

Restore → `11 passed in 0.54s`; the copy's two production files verified byte-identical to repo after restore.

4-file pack inside the reverted copy: `5 failed, 50 passed in 2.85s` — the only 5 failures are the denials tests above. **Wave-2 blast radius is exactly the 5 structural cross-scene denial tests.**

### VERDICT: **NON-TAUTOLOGICAL** — the denials tests genuinely depend on the wave-2 production enforcement.

---

## W6 — Block uniformity — **PASS**

### C1 — md5 uniformity
- **Contract-block level** (`## Production Contract Binding` heading → EOF, per file): **distinct md5 count = 1**, value `1dd8e674ff57ae3b9fb711c9ff2190cd` × **103** carriers, **12 lanes**. Confirmed by two independent extractors (awk block-extract + python line-scan); all 103 blocks end at EOF. → matches the expected single md5 exactly.
- **Whole-file level** (the literal command `md5 across ALL skills/pipelines/*/*.md`): **103 distinct** whole-file hashes; the expected value appears 0 times as a whole-file hash. **Pre-existing, not a wave-2 regression** — HEAD versions are also 103 distinct (verified via `git show HEAD:<file> | md5 -q`). The commissioned "single md5" is the *block* hash.

### C2 — `contract v2.0` in pipeline_defs
**13/13** yaml files contain it, 1 match each, **none missing**. (`pipeline_defs/` contains exactly **13** yaml files — animated-explainer, animation, avatar-spokesperson, character-animation, cinematic, clip-factory, documentary-montage, framework-smoke, hybrid, localization-dub, podcast-repurpose, screen-demo, talking-head. `find pipeline_defs -type f` confirms no 14th file and no `.yml` strays.)

### C3 — doctrine mirror glob
Glob string `skills/pipelines/*/*.md` hits at exactly the expected lines:
- line 12: `"synced_mirrors": [".claude/agents/*", ".claude/prompts/om_team_leader_prompt.md", "skills/pipelines/*/*.md", "pipeline_defs/*.yaml"],`
- line 261: ``- `.claude/agents/*`, `.claude/prompts/om_team_leader_prompt.md`, `skills/pipelines/*/*.md`, `pipeline_defs/*.yaml` = **synced mirrors** — sửa contract TẠI ĐÂY rồi sync sang mirror; ...``

**Extra check beyond the commission (my own addition, reported as such):** do the 103 carriers themselves embed that glob? **0/103 do.** Carriers bind via the binding block instead — 103/103 contain `## Production Contract Binding` and `docs/ORCHESTRATION_DOCTRINE.md`, and reference `pipeline_defs/<pipeline>.yaml` (angle-bracket placeholder). Only 2 files contain the substring `skills/pipelines` at all (incidental cross-links: `documentary-montage/asset-director.md:462`, `scene-director.md:19`). This is a spec-vs-implementation question for the contract owner, **not** a failure of the commissioned check.

---

## W7 — Inventory recompute — **PASS**

File: `docs/video-contract-inventory.json` (untracked). Top-level keys:
```
['schema_version', 'plan_ref', 'snapshot', 'edit_once_rule', 'kind_vocabulary', 'authority_vocabulary', 'decision_vocabulary', 'canonical_commands', 'symlink_verification', 'duplicate_audit', 'counts', 'exclusions', 'entries']
```
Entry fields: `path`, `kind`, `authority_tier`, `owner_lane`, `status`, `decision`, `sha256_16` (only 48/658 carry it), `note`.

| Check | Recorded | Recomputed | Match |
|---|---|---|---|
| total_entries | **658** | **658** | ✔ |
| by_status | `active 529, mirror-active 47, duplicate-identical 48, legacy-reference 6, dirty-preserved 1, untracked-dirty 26, active-evidence 1` | identical | ✔ (sum 658) |
| by_kind | `canonical-contract 27, entry-adapter 170, tool-reference 94, domain-specialization 309, vendored 55, mirror-duplicate 3` | identical | ✔ |
| by_authority_tier | `canonical 557, mirror 47, mirror-copy 48, legacy 6` | identical | ✔ |
| by_owner_lane | `ENS-repo 552, shared 106` | identical | ✔ |
| by_decision | `edit 2, refer 77, no-change 579` | identical | ✔ |

Disk-derivable scalars recomputed fresh: `pipeline_defs=13`, `skills_tree_md_files=295`, `agents_skills_dirs=139`, `claude_skills_entries=97`, `claude_agents=6`, `episode_source_dirs=63`, `root_tsx_compositions=65` — all match.

- **Ownerless ACTIVE: 0.** (The owner field is `owner_lane`; there is no `owner` key. All 658 entries carry a non-empty `owner_lane` ∈ {`ENS-repo`, `shared`}.)
- **Paths checked: 658 | missing: 0** (all entries checked, not only the `active` subset; 0 broken symlinks).
- **Dedupe held:** the wave-2 dedupe target `tools/audio/refresh_manifest.py` appears exactly **once**. Cross-check: `tools/audio/refresh_manifest.py` rewrites `asset_manifest.json` inside a project dir and never touches the inventory; the 659→658 reduction is recorded in the inventory's `snapshot.refresh.count_preservation` / `by_status_derivation` and in `docs/video-capability-status.md` L113.
- **One pre-existing dual-registration** (not wave drift, documented): `skills/INDEX.md` appears twice — entries[4] (kind=tool-reference, decision=refer, status=active) and entries[7] (kind=domain-specialization, decision=no-change, status=active).

---

## W8 — Artifact hash + smoke-workspace drift — **PASS**

### mp4
```
projects/test-production-hardening-20261109-0114/renders/test-production-hardening-20261109-0114.mp4
size  = 8,376,927 B   (expected 8,376,927 — exact)
sha256= 2f2262e51de667ffee22e26b662223d5cefb88defe27b8f9cfe30e854c3929f7   (expected — exact)
mtime = 2026-11-09T08:28:47+0700
```
Exactly one mp4 in that renders dir.

### Smoke workspaces
| dir | files | bytes | manifest sha256 (now) | prior baseline | verdict |
|---|---|---|---|---|---|
| `projects/test-sync-acceptance-20261109-t4-gate-routes/` | 70 | 17,097,527 | `ef495d6ef16a14362a89c40ddaa7969c05b9685682c503952d305cc1868a5612` | same | **MATCH** |
| `projects/test-sync-acceptance-20261109-t5-scene-workflow/` | 31 | 338,073 | `a5fbbac1b10775046c0e062f9ed57b0cb5f1c81a391c90c26cea724937e34089` | same | **MATCH** |

Recipe: `find $d -type f | sort | xargs shasum -a 256 | shasum -a 256`. 101 files total, no symlinks. All 7 individually recorded per-file baseline hashes from the prior report re-verified → MATCH. The one differing hash (`invalid/packet_cut-s1.json` `146a2043…`) is the prior run's **recorded T4 tamper**, not drift.

**DRIFT: none** — no file added, removed, resized, or re-hashed.

### mtime evidence
Newest workspace file mtime `2026-11-09T13:18:30+0700`; prior acceptance run finalized `13:36:50+0700`. Files newer than 13:37:00: **0**. Both dirs are gitignored via `.gitignore:35` (`projects/*/*`) → 0 porcelain entries, consistent with the prior report.

---

## W9 — TypeScript baseline — **PASS**

```bash
cd /Users/tuyennguyen/project/OpenMontage/remotion-composer && npx vitest run
```
```
EXIT CODE: 0
 Test Files  6 passed (6)
      Tests  47 passed (47)
   Start at  14:38:55
   Duration  134ms (import 39%, tests 38%, transform 17%, worker 5%)
```
47/47 ✔ (0.63s wall). No installs were performed.

```bash
cd /Users/tuyennguyen/project/OpenMontage/remotion-composer && npx tsc --noEmit
```
```
EXIT CODE: 0
(no output)
```
9.90s wall. **Artifact leaks: none** — no snapshot dirs, no coverage output.

---

## W10 — Constraint sweep — **PASS**

Execution mode: STRICT READ-ONLY git.

### Porcelain totals
```
/usr/bin/git status --porcelain=v1 -uall: 2163 entries
  - Tracked modified (' M'): 144
  - Untracked ('??'):       2019
  - Tracked deleted (' D'):     0
  - Tracked renamed (' R'):     0
  - Untracked deleted:          0
```

### Delta vs Prior Acceptance Wave (T9 Baseline @ 13:36:50)
Prior was **2159 entries** (142 ` M` + 2017 `??`). Current is **2163 entries** (144 ` M` + 2019 `??`).
**Delta = exactly +4 entries:**
- **+2 M:** wave-2 gate code changes — `tools/qc/scene_orchestrator.py` (+27/−0) and `tools/qc/scene_packet.py` (+16/−1)
- **+2 ??:** prior acceptance report `.agents/tester/RESULTS/2026-11-09-sync-acceptance-test.md` and new test `tests/test_scene_orchestrator_denials.py`

### Bucket classification (all 2163 entries accounted for)
- **(a) SYNC CHANGE SET: 146 entries** (141 tracked modified + 5 untracked: `tests/test_scene_orchestrator_denials.py`, `tests/test_video_contract_docs.py`, `docs/video-contract-inventory.json`, `docs/video-capability-status.md`, `docs/stage-gates/`)
- **(b) PRE-EXISTING M: 3 entries** — `remotion-composer/src/Root.tsx` (+29/−0, F6/F7 composition registrations), `.agents/tester/PACKS.md`, `.agents/tester/README.md`
- **(c) PRE-EXISTING UNTRACKED: 2014 entries** — pre-existing `archive/` historical lanes, project sources, shotcraft skills, tools workbench
- **(d) NEW THIS WAVE (in porcelain): 0 entries** — the 3 isolated test dirs reside under `projects/test-sync-acceptance-20261109-*/` and are gitignored via `.gitignore:35` `projects/*/*`. This report file was emitted after the sweep was taken.

### Index / Staged state
- `git diff --cached --numstat` → **EMPTY** (0 lines)
- `git diff --cached --name-only` → **EMPTY** (0 lines)
- `git diff --cached --stat` → **EMPTY** (0 lines)
Index is completely clean.

### Protected path invariants
| Invariant | Result | Evidence |
|---|---|---|
| `projects/` tracked modifications | **PASS** | `awk 'substr($0,1,2) ~ /M/' \| grep '^ projects/'` → **EMPTY** (0 tracked modifications). All 772 entries under `projects/` are pre-existing untracked files preserved byte-for-byte. |
| `renders/` | **PASS** | Matches **only** historical archive files under `archive/bac-ha-ngap-20261107-rejected-v1/renders/` (13 files from Nov 7). Zero entries under root `renders/` or under `projects/test-production-hardening-20261109-0114/renders/`. |
| `media/` | **PASS** | `grep -E '(^\|/)media/'` → **EMPTY** (0 hits). |
| `node_modules/` | **PASS** | Hits **only** historical archive symlink `archive/bac-ha-ngap-20261107-rejected-v1/node_modules`. Zero entries in root `node_modules/` or anywhere under `remotion-composer/node_modules/`. |
| Deletions (` D` / `D `) | **PASS** | **0 deletions** across whole repo. |
| Renames (` R` / `R `) | **PASS** | **0 renames** across whole repo. |
| `remotion-composer/src/` | **PASS** | Only `Root.tsx` is modified. Zero other tracked modifications. |
| `tests/qa/output/` scratch | **PASS** | 58 files on disk (regenerated by `test_08_end_to_end.py` run); **0 porcelain hits** (cleanly ignored via `.gitignore:29`). |

### Stash, Reflog & HEAD
- `git stash list` → **EMPTY** (0 stashes).
- `git rev-parse HEAD` → `a3724d4daeb1bb0abfb61867380b01a6318ad72e` (exact).
- `git log --oneline -3` (verbatim):
  ```
  a3724d4 chore(deps): pin reproducible test dependencies (finding F9)
  1fa85d6 fix(remotion): production layout enforcement + semantic SFX tail anchor fix, consumed by sample episode (findings F6/F7)
  7b01e4e docs(orchestration): sync doctrine, agent team definitions, editorial skill, explainer directors to verified behavior
  ```
- `git reflog --date=iso -1` → `a3724d4 HEAD@{2026-11-09 11:06:25 +0700}: commit: chore(deps): pin reproducible test dependencies (finding F9)` — newest reflog entry remains the F9 commit; **zero commit/checkout/reset activity occurred during either test wave**.

### Isolated test workspaces (gitignored via `.gitignore:35` `projects/*/*`)
1. `projects/test-sync-acceptance-20261109-t4-gate-routes/` (70 files, mtime 13:13:51)
2. `projects/test-sync-acceptance-20261109-t5-scene-workflow/` (31 files, mtime 13:18:10)
3. `projects/test-sync-acceptance-20261109-t6-wave2-gate-routes/` (332 files, mtime 15:09:16, created by W4)

### VERDICT: **PASS** — change set strictly contained; zero protected path drift; index and stash empty; HEAD unchanged.

---

## W11 — Capability-status doc honesty audit — **PASS**

Audited: `docs/video-capability-status.md`, **19 capability rows** (1–7c, 8–17).

| Check | Result |
|---|---|
| R1 evidence location label present + path exists on disk | **all 19 rows labelled**; **every referenced path exists** (0 missing) |
| R2 workspace-relative rows marked not-CI-reproducible | **13 rows** cite workspace-relative evidence; all carry `[workspace-relative]` + the global disclosure at L58–61: *"`[workspace-relative]` citations refer to files inside `projects/test-production-hardening-20261109-0114/`. This workspace is untracked working-tree state → **NOT CI-reproducible** from a bare git clone, but reproducible by executing the documented acceptance commands."* — **0 unmarked** |
| R3 no row implies a HEAD rebuild | **0 rows**; explicit disclaimers at Row 9, Row 10, Row 17 and Snapshot facts L108 |
| R4 T5 boundary mechanical | **PRESENT** — Row 7c: *"**T5 independence boundary**: mechanical independence proven (distinct token/session/ownership/hash-binding), but LLM-level creative reasoning independence NOT proven (prompt-level only per doctrine §7); daemon runner additionally requires interactive handlers on :8088"*; mirrored in D3 downgrade #8 |
| R5 scene_sweep citation | path `projects/test-production-hardening-20261109-0114/qc/scene_sweep_v3/scene_sweep_report.json` **exists**; doc claims vs actual file: version `1.0`/`1.0` ✔, verdict `WARN`/`WARN` ✔, scenes_checked `4`/`4` ✔, dense_overlap `2`/`2` ✔ — **all four match** |
| R6 hash labeling | labeled *"per-skill SKILL.md sha256"* and explicitly *"verified per-skill SKILL.md, not directory aggregates"*. Verified on disk: ai-video-gen `f805fc45…`, elevenlabs `fc802e04…`, elevenlabs/reference.md `1a4318b4…`, remotion-best-practices `7552b280…` — all match on both sides. **0 aggregate-mislabelled rows** |
| R7 mp4 freshness disclosure | **EXPLICIT** — Row 10: *"**CLAIM HYGIENE: mp4 hash refers strictly to smoke-workspace artifact, NOT a HEAD rebuild**; no re-render at HEAD (`a3724d4`) — re-render not permitted per constraint; render freshness at HEAD unproven"*; D3 #6: *"Render artifact verified ≠ HEAD rebuild verified"* |
| R8 overclaim rows | **NONE in the capability table (rows 1–17)** |

### 🟠 Doc defect found (preamble prose, not a capability row)
`docs/video-capability-status.md` **line 5** states `by_decision now edit 2 / refer 77 / no-change 580; total_entries 658`. The inventory's recorded `by_decision` is `{"edit": 2, "refer": 77, "no-change": 579}` — the doc's own sum reads **659** against its own `total_entries 658`. Off-by-one typo; the inventory JSON is correct and self-consistent.

---

## W12 — Residual honesty items — **PASS**

### (i) Plan Task-3 cases now EXERCISED (not merely claimed)

**Prior wave did NOT exercise them** — prior report line 448, verbatim: *"Plan Task 3's additional cases — missing/extra packet rejection and cross-scene write denial/detection — were **not** exercised in this commission."* The prior report also contains **zero** occurrences of `scene_packet_missing`, `scene_packet_extra`, `writer_scope_violation`, `io_outside_allowlist`.

Wave-2 exercises them via the real code path (full commands + outputs in W4):
- (a) missing packet → `tools/qc/episode_gate.py <episode>` → **exit 1**, `scene_packet_missing` ✔ exercised
- (b) extra packet → `tools/qc/episode_gate.py <episode>` → **exit 1**, `scene_packet_extra` ✔ exercised
- (c) cross-scene write denial → `writer_scope_violation` (real `orchestrate_episode` → `verify_writer_scope`) and `io_outside_allowlist` (real `integrate_scene_packet`) ✔ exercised — **with the two defects recorded in W4** (generic subdir allowed; packet leg unwired in prod). The leader's literal subdirectory case is **exercised and observed to be ALLOWED**, which is why W4 is PARTIAL rather than PASS.

### (ii) `.agents/tester/rules/ensure.md` — confirmed ABSENT
```
ls: .agents/tester/rules/: No such file or directory
ls: .agents/tester/rules/ensure.md: No such file or directory
```
`.agents/tester/` contains only `LESSONS/`, `PACKS.md`, `README.md`, `RESULTS/` — the `rules/` directory does not exist. **Reported as a limitation; NOT created** (the file is user-owned).

### (iii) "independent reviewer" without the mechanical-vs-LLM qualification
21 hits across 11 files: **12 qualified, 9 unqualified**.

**No capability row is unqualified.** The capability table qualifies every claim (Row 7c / D3 #8 as quoted in R4).

The 9 unqualified hits are **all outside the capability table**:
- 7 in legacy project prose predating the editorial-hardening effort — `remotion-composer/public/france-riots-20261023/v2/AUDIO-V2-HANDOFF.md:243`, `projects/france-riots-20261023/history/AUDIO-V2-HANDOFF.md:243`, `projects/france-riots-20261023/history/COMPOSE-V2-HANDOFF.md:33` and `:42`, `projects/binance-hack-20261030/full-v2/HANDOFF.md:25`, `projects/chinh-phu-tich-tru-20261106/archive/pre-redo-20261108/demo-v1/BLOCKER_REPORT.md:11` and `:14`
- `.claude/agents/mechanical-worker.md:22` — *"final review remains with the thin director and independent reviewer."* (a **synced mirror**, subordinate to doctrine)
- `skills/meta/agent-orchestrator.md:60` — `### 4. Independent Reviewer Pattern` (general dispatch pattern, no reference to the P1.4 boundary)

The active contract (`docs/ORCHESTRATION_DOCTRINE.md` §7 "Mechanical vs Prompt-Level Ownership Enforcement"), the orchestrator code (`tools/qc/scene_orchestrator.py` docstring table at L18: *"explicitly delineates what is OS-level/cryptographically enforced versus what remains at the prompt level"*), and the capability doc all maintain the boundary correctly.

---

## REMAINING LIMITATIONS

### Perceptual
1. **No perceptual / visual re-review this wave.** The mp4 was hash-verified, not watched. Row 12's own scene_sweep evidence carries **verdict WARN** (dense_overlap 2 of 4 scenes) — unchanged and not re-litigated.
2. **mp4 freshness at HEAD remains unproven** (inherited, unchanged): the hash refers strictly to the smoke-workspace artifact, not a HEAD rebuild; re-render is prohibited by the wave's constraints.
3. **T5 LLM-level independence is NOT proven** — only mechanical independence (distinct token/session/ownership/hash-binding). A human or LLM-level reviewer pass remains outstanding by design.

### Unsupported / weakly-supported
4. **`io_operations=` has zero production callers** → the packet leg's cross-scene enforcement is unreachable from any shipped CLI (W4 Defect 3). The wave-2 packet-leg change is therefore **not on the production path**.
5. **`writer_scope_violation` is unreachable via the shipped CLI process** (no runner injection); it was exercised through the real `orchestrate_episode` function that `main()` calls, not through `main()` itself.
6. **The `docs/video-capability-status.md` status column is not test-enforced** (W3 coverage gap). The doc's own table could claim any status without failing the suite.
7. **`docs/video-capability-status.md` line 5 off-by-one** (`no-change 580` vs inventory `579`; doc's own sum 659 ≠ 658).
8. **Legacy project prose still uses "independent reviewer" unqualified** (9 hits outside the capability table), including one synced mirror (`.claude/agents/mechanical-worker.md`) and one meta skill.

### Unexercised / enforcement gaps
9. **Generic subdirectory write under an allowed_io dir is ALLOWED** (`packets/sub/x.json` → exit 0, both legs). The commission expected exit 1. This is the single most material finding of the wave.
10. **Leg asymmetry:** `packets/sub/packet_<other>.json` is denied by the writer-scope leg but **allowed** by the packet leg (prefix `packets/packet_` only).
11. **`skills/INDEX.md` is dual-registered** in the inventory (2 entries) — pre-existing and intentional, but it means the "unique path" invariant has one exception.

### CI-fragility / environment
12. **`tests/qa/test_08_end_to_end.py` is pytest-unsafe**: it executes a full 7-stage render at *import*, so any pytest collection over `tests/qa/` performs real ffmpeg work and rewrites `tests/qa/output/`. It contributes 0 collectable tests. Both the commissioned pytest invocation and the direct run triggered this.
13. **No GNU `timeout`/`gtimeout` on this macOS host** — the pack skill's canonical `timeout 300 <cmd>` layer-1 guard exits 127 before pytest starts. Workers fell back to the bash-tool subprocess timeout as the outer guard. Defect filed against the `test-pack-execution` skill.
14. **`skill_feedback` is broken on the `load_skill` injection path** — "No usage record found for skill …" for `test-pack-execution` (worker-side), `test-strategy` and `test-pack-execution` (tester-side). No usage row is created when a skill is injected via `send_message(load_skill=...)`, so skill-evolution attribution silently loses every worker-dispatched skill. Defect filed.
15. **The skill-evolution lane is disabled** (`ENSEMBLE_SKILL_EVOLUTION_ENABLED` off / cooldown) — the filed fix request was recorded but **NOT dispatched** to a skill-keeper.
16. **The `git` output wrapper summarises stdout**, so raw porcelain/diff must be captured by redirect-then-read. One sweep worker wedged on this during the wave (15m in-flight bash) and was abandoned in favour of a revived peer.
17. **`.agents/tester/rules/ensure.md` is absent** — the project has no machine-checkable quality gate to validate against; this wave had to fall back to the commission's item list.

---

## Code Changes Summary

**No production code was changed by this testing wave.** No quick fixes were applied — every worker was dispatched read-only, and all failures were reported verbatim rather than patched (the wave's commission explicitly required read-only execution and forbade repo mutation outside the report file).

Repo writes made by this wave, in full:
1. `.agents/tester/RESULTS/2026-11-09-sync-acceptance-wave2.md` — this report (the only repo file the tester wrote).
2. `projects/test-sync-acceptance-20261109-t6-wave2-gate-routes/` — NEW isolated W4 acceptance workspace (332 files), permitted by the commission.
3. `tests/qa/output/**` — gitignored scratch regenerated by the W2 direct run of `tests/qa/test_08_end_to_end.py` (~47 files, including `e2e_final_output.mp4`). Unavoidable side effect of the commissioned command; zero tracked-file impact.

All other mutation was confined to `/tmp` (`/tmp/w3_mut/`, `/tmp/w5b_mut/`).

**No git write was performed by any worker or by the tester** — no add, commit, checkout, restore, reset, stash, clean, or rebase. HEAD remains `a3724d4daeb1bb0abfb61867380b01a6318ad72e` with the full wave-1 + wave-2 change set uncommitted, exactly as found.

---

## Worker Instance Ledger

| # | Worker | Item | Result |
|---|---|---|---|
| 1 | `5753c7ab` | W1 full python suite | PASS |
| 2 | `f9744cdb` | W2 pytest route | exit 5 → N/A by construction |
| 3 | `9c354711` | W9 TS baseline | PASS |
| 4 | `1c6e4719` | recon (code paths) | complete |
| 5 | `1bcc78f4` | W3 docs contract + mutation | PASS |
| 6 | `9f6878ed` | W6 block uniformity | PASS |
| 7 | `07e8adee` | W7 inventory | PASS |
| 8 | `12c118d0` | W8 artifact hash | PASS |
| 9 | `83e0c7f9` | W10 constraint sweep | transient error → revived |
| 10 | `350fe78e` | W11 doc honesty | PASS |
| 11 | `750aa2f9` | W5a gate regression | PASS |
| 12 | `dee7b7a2` | W5b non-tautology | PASS (NON-TAUTOLOGICAL) |
| 13 | `894c5444` | W4 enforcement routes | PARTIAL |
| 14 | `94ea7769` | W2 discrepancy investigation | complete |
| 15 | `5012ad91` | W2 direct run | PASS |
| 16 | `67d8210b` | W10b final-state sweep | in flight |
