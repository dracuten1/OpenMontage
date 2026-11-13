# 2026-11-13 — Phase 4C restore-seals verification (uncommitted, branch `latest`)

## Round-2 re-verification (same day, delta applied) — ALL 4 ITEMS PASS

Instances: W1 `8f5e2ea1` (suite, 6.97s), W2 `812102a9` (nested-layout + exit matrix, ~7 min), W3 `916e923d` (launcher pin grep).

1. Mandated suite `.venv/bin/pytest tests/test_restore_seals.py tests/test_scene_orchestrator.py tests/test_video_slowfix_phase4.py -v` → **79 passed exactly** (33+21+25 per-file split matches claim), zero FAIL/ERROR/SKIP/XFAIL lines.
2. Nested-layout blocker fix — **5/5 MATCH**: `infer_packet_episode_dir(<ep>/packet_s1.json)` → ref-bearing root `packets/episode` (not project root; refs_exist_at proven {packets/episode: true, packets: false, proj: false}); `get_preserved_scenes(proj)` → `["s1"]` both default and explicit-pin; mint default mode rc 0, `preserved 1 scene(s): s1`, s1 findings byte-identical post-mint, episode tree byte-identical, no `0 preserved scenes` warning; s2 findings purged; `--dry-run` rc 0, fixture shasum byte-identical.
3. Exit-code matrix — **6/6 MATCH**: missing=1, drift=3 plain AND under `--force` (`restore_seals.py:746-750`), unparseable evidence=2, missing evidence file=2, dry-run=0. Round-1 drift-exit-0 behavior CONFIRMED FIXED (now 3 in all variants).
4. Launcher pin — **PINNED**: `run_cc_pipeline.py.tmpl:158-161` passes `ep` to `resolve_scene_ids(ep)` (`:120`), which forwards `episode_dir=ep` → `get_preserved_scenes` (`restore_seals.py:505` accepts kwarg). Caveat: pin via internal forwarding, not a named `episode_dir` param on `resolve_scene_ids` itself — claim wording slightly imprecise, mechanism correct.

Defects: none. Round-1 D-1 note: copy-through-symlink fallback line (`:1714`-area) was NEW-IN-DIFF in round 1; round-2 suite (now 21 orchestrator tests incl. shape coverage additions) green — D-1 fix status not re-probed at runtime this round (no new failure signature in suite; spot-check scope per caller).

---

Independent verification of developer claims for the uncommitted Phase 4C change set:
`tools/qc/restore_seals.py` (new), `tools/qc/mint_project_pipeline.py` (mod),
`tools/qc/scene_orchestrator.py` (mod), `tests/test_restore_seals.py` (new),
`tests/test_video_slowfix_phase4.py` (mod).

## Scope Decision

> Whole tree NOT re-run. Change set = 5 files in 2 dirs; caller supplied 3 exact targeted
> commands + failure-attribution + 2 functional probes — ran exactly those. Whole-tree claim
> (2294 passed / 11 skipped / 3 xfailed / 2 failed) verified indirectly: the 2 claimed failures
> were reproduced individually and attributed via a HEAD worktree differential. Full suite not
> warranted for this scope.

## Instances
- W1 `86f8f464` (test-pack-execution) — pytest claims + failure differential, 162s
- W2 `7dac52d4` — restore_seals CLI probe, <1 min
- W3 `dc8ea8a4` — _persist_session_evidence shape probe, ~2 min
- W4 `39f7b6d2` — diff attribution for defect D-1

## Claim verification

| Claim | Verdict | Evidence |
|---|---|---|
| `pytest tests/test_restore_seals.py -q` → 21 passed | **CONFIRMED** | 21 passed, 0.88s, exit 0 |
| `pytest tests/test_restore_seals.py tests/test_video_slowfix_phase4.py -v` → 46 passed | **CONFIRMED** | 46 passed, 4.76s, exit 0 |
| Neighbors → 134 passed | **AMBIGUOUS** | No natural neighbor set yields 134: A (4 direct-import files) = 107 passed; B (A + test_video_contract_docs.py) = 125 passed 2 failed; C (B + test_scene_packet.py) = 140 passed 2 failed. Claim not reproducible with any derived set — see Open items. |
| Whole tree → 2294 passed, 11 skipped, 3 xfailed, 2 failed | **NOT RE-RUN** (per scope); the 2 failures reproduced + attributed pre-existing | see next section |

## Pre-existing failure attribution — CONFIRMED (both, pre-existing)

Both failures live in `tests/test_video_contract_docs.py` — untouched by the 5-file change set:

1. `tests/test_video_contract_docs.py::test_inventory_scalar_counts_match_disk` (`:454`)
   `AssertionError: counts.episode_source_dirs (66) does not match disk walk (70)`
   Inventory source `docs/video-contract-inventory.json:342` (`"episode_source_dirs": 66`) vs disk.
   → matches claim (a): stale docs JSON.
2. `tests/test_video_contract_docs.py::test_status_doc_cited_evidence_paths_exist` (`:862`)
   `docs/video-capability-status.md:78` cites `renders/test-production-hardening-20261109-0114.mp4`
   cited at 8,376,927 B ≈ 8 MB; `git ls-files` on the path → empty; repo tracks 0 `.mp4`;
   `.gitignore:35` `projects/*/*` ignores it. → matches claim (b): mp4 never in git.

Differential: `git worktree add --detach /tmp/om-phase4c-head HEAD` (HEAD `cecae00`); ran only
the 2 failing node ids there with the main repo venv python — **both fail at HEAD** →
pre-existing, NOT caused by Phase 4C. Caveat (honest): in the fresh HEAD worktree the same
tests trip on *different* missing untracked artifacts (`counts.skills_tree_md_files: assert
295 == 160`; missing `docs/plans/2026-11-09-video-skills-agent-team-sync.md`) — same failure
class (docs vs untracked/ignored disk artifacts), zero overlap with the change set, which
touches none of `docs/video-contract-inventory.json`, `docs/video-capability-status.md`,
`skills/`, `projects/*/renders/`, `docs/plans/`. Worktree removed after; only main repo +
pre-existing `macbook-touch-draft-worktree` remain.

## CLI spot-check: tools/qc/restore_seals.py — 4/4 MATCH, 0 defects

Actual contract (source): invoked as `python -m tools.qc.restore_seals`; flags `--from-evidence`
(required), `--episode-dir`, `--project-dir`, `--scenes`, `--dry-run`, `--force`
(`build_parser` `restore_seals.py:483-512`); env `OM_REMINT_PRESERVE` (`:48`, `:66-68`,
absent/≠"0" = preserve ON, `"0"` = kill-switch short-circuits `is_scene_preserved` False at
`:346-347`). Exit codes: 0 success (incl. dry-run; hash-drift is a per-scene refusal, run still
exits 0 `:582-584`/`:593`); 1 missing evidence `:548-550` (checked before dry-run, `:548`
precedes `:575`); 2 evidence-not-found / parse error / unresolved episode dir / no target
scenes / argparse (`:519-537`). Missing-evidence error prints to stdout, not stderr.

| Scenario | Result | Evidence |
|---|---|---|
| `--dry-run` writes nothing | MATCH | rc=0, plan printed, `dry-run: no packets written`; fixture tree shasum byte-identical before/after |
| Missing evidence → rc 1 + missing-scene list | MATCH | rc=1, stdout `ERROR: Missing evidence for scenes: s9`; persists under `--dry-run` |
| Hash drift refused even under `--force` | MATCH | Drift partitioned at `:556-559` before preserve detection; `sid in drift` REFUSED branch `:582-584` precedes `--force` check `:585`. Both no-force and `--force`: `hash drift (s1): scene/style.json (on-disk f507c963861c != reviewed b41e652bf5e1)` + `REFUSED s1`, `packet_s1` unchanged (`integration_status` stays `pending`) |
| `OM_REMINT_PRESERVE=0` kill-switch | MATCH | Default: `skipped s1: packet already preserved`, s2 re-sealed. With `=0`: no preserved list, `re-sealed s1` + `re-sealed s2`, both `integrated` |

Extra probes: nonexistent evidence → rc=2 stderr; unparseable JSON → rc=2 stderr; missing
required flag → rc=2 argparse usage. Side observation (documented, not defect): without drift,
`--force` does re-seal an already-preserved packet — `--force`'s documented purpose
(`test_force_reseals_already_preserved_packet:260-268`).

Fixtures: `/tmp/omqc/build_fixture.py` (stdlib only), shape copied from
`tests/test_restore_seals.py` helpers + `tests/test_episode_gate.py:39-56`; all fixture trees
under `/tmp`, repo untouched (`git status` unchanged, `PYTHONDONTWRITEBYTECODE=1`).

## _persist_session_evidence shape — PASS (task 4)

`tools/qc/scene_orchestrator.py:1729` (`_persist_session_evidence`), `:1692`
(`_point_latest_symlink_at`), `:1682-1688` (`OM_EVIDENCE_PER_ROUND` gate, default ON;
`EVIDENCE_BASENAME = "scene_workflow_evidence.json"`), session id `session-<YYYYmmddTHHMMSSZ>-<8hex>` (`:1559`).

- Stamped file: `scene_workflow_evidence_<session_id>.json` (`:1766`), valid JSON with
  `session_id`, `director_token`, `overall_status`, `ownership_model`.
- Unsuffixed name: relative symlink → stamped file; built as `.tmp_link` then `os.replace`
  (atomic link swap). `readlink` verified direction.
- Round 2 retarget: atomic, round-1 stamped file intact; prior-scene records carried forward
  into new payload (NOT retro-written into round-1 stamped file). Execution-proven.
- `OM_EVIDENCE_PER_ROUND=0`: legacy direct overwrite, breaks existing symlink first, no
  stamped file. Execution-proven.
- Copy fallback (`os.symlink` → OSError → `shutil.copyfile`, `:1714`): clean variant correct
  (plain copy, separate inode); mid-episode variant defective — see D-1.

## Defects

**D-1 (🟠 important, data-loss class, low likelihood):**
`tools/qc/scene_orchestrator.py:1714` — fallback `shutil.copyfile(stamped_p, latest_p)`
**follows** an existing `latest_p` symlink. Trigger: symlink OK in round N, symlink raises in
round N+1 → the copy writes the NEW payload through the old link into the PREVIOUS stamped
file, destroying it. Execution-proven: after forced symlink failure in round 3,
`scene_workflow_evidence_session-...cafebab02.json` contained the round-3 session_id
(clobbered) while `latest` still symlinked to it. Ironic given Phase 4C's preserve purpose.
Suggested fix (1 line): unlink the symlink (or copy via temp + `os.replace`) before copyfile.
Diff attribution (W4 `39f7b6d2`): **NEW-IN-DIFF.** `_point_latest_symlink_at` (incl. the
copyfile fallback) is added whole by the uncommitted diff; `_persist_session_evidence` is
MODIFIED-IN-DIFF (pre-existing at HEAD `:1677`, body rewritten; old line
`out_p = artifacts_dir / "scene_workflow_evidence.json"` replaced by
`out_p = artifacts_dir / EVIDENCE_BASENAME` + `_point_latest_symlink_at(out_p, stamped_p)`).
No `copyfile` / `_point_latest_symlink_at` exists at HEAD (`git show HEAD:` grep empty).
→ D-1 is introduced by this change set, not inherited.
Coverage gap: `tests/test_scene_orchestrator.py:394` asserts existence only — zero coverage of
stamped/symlink/fallback shape.

## Quarantine
None. No flaky tests encountered.

## Open items
- `ensure.md` absent (user-owned) — recurring note; gate list for this engagement came from
  the caller's task definition.
- Neighbor claim "134 passed" not reproducible with any derived natural set — developer's
  exact neighbor command/set needed to close.
- Whole-tree count (2294/11/3) not re-verified — accepted via failure reproduction +
  differential per scope decision.
