# Sync Acceptance Test — video-skills-agent-team-sync (repo portion, Task 6/7)

Date: 2026-11-09
Repo: `/Users/tuyennguyen/project/OpenMontage`
Branch: `editorial-hardening-20261108` @ `a3724d4daeb1bb0abfb61867380b01a6318ad72e`
Plan under test: `docs/plans/2026-11-09-video-skills-agent-team-sync.md`
Test Leader: tester (dispatched 10 worker instances; no test executed directly)
Scope: full commissioned set T1–T9 — no reduction applied. Every requested item was executed.

**Overall: PASS (9/9 items PASS, with stated limitations). No critical failure. No repo mutation beyond the two permitted isolated acceptance dirs + this report.**

---

## Summary

| Item | Verdict | Evidence anchor |
|---|---|---|
| T1 full pytest suite | **PASS** | `2108 passed, 12 skipped, 3 xfailed in 77.46s`, exit 0, 0 failures |
| T2 doc-contract suite + non-tautology | **PASS** | repo: `19 passed` exit 0; mutated /tmp copy: `1 failed, 18 passed` exit 1 |
| T3 binding-block uniformity | **PASS** | 103/103 carriers, single md5 `1dd8e674ff57ae3b9fb711c9ff2190cd`, 0 deviants, 12/12 lanes |
| T4 real gate valid/invalid route | **PASS** | valid exit 0 `PASS — episode gate`; tampered exit 1, 4 reason codes; control exit 0 |
| T5 two-scene writer/reviewer workflow | **PASS (with caveat)** | real orchestrator ran offline; distinct writer/reviewer sessions+tokens; gate `valid: true` |
| T6 vitest + tsc | **PASS** | `Test Files 6 passed (6)` / `Tests 47 passed (47)`; `tsc --noEmit` exit 0 |
| T7 artifact hash adjudication | **PASS** | mp4 sha256 `2f2262e5…4c3929f7`, 8,376,927 B — matches doc |
| T8 inventory integrity | **PASS** | 659/659 paths exist, 0 ownerless ACTIVE, by_status matches exactly |
| T9 constraint sweep | **PASS** | 262 porcelain entries fully classified; 0 unexplained writes; smoke workspace byte-identical |

---

## T1 — FULL Python suite — **PASS**

### Exact commands
```bash
cd /Users/tuyennguyen/project/OpenMontage && perl -e 'alarm shift; exec @ARGV' 1900 \
  /Users/tuyennguyen/project/OpenMontage/.venv/bin/python -m pytest tests/ \
  > /tmp/om_pytest_full_t1_20261109.log 2>&1; ec=$?; echo "PYTEST_EXIT_CODE=$ec"
```
Suite command as commissioned: `cd /Users/tuyennguyen/project/OpenMontage && .venv/bin/python -m pytest tests/`
Dual-layer timeout: outer `proc_run` auto-kill 1900s + inner `perl alarm 1900`. Neither fired.
Host note: no `timeout`/`gtimeout` binary on this macOS host.

### Exit code
```
PYTEST_EXIT_CODE=0
```

### Final summary line (verbatim)
```
============ 2108 passed, 12 skipped, 3 xfailed in 77.46s (0:01:17) ============
```
Collection header (verbatim): `collected 2122 items / 1 skipped`

### Failures
**None.** Zero `FAILED` lines, zero error tracebacks in the full run output.

### Hexpix verdict — PASS
- Full test id: `tests/contracts/test_agent_skill_pointers.py::test_agent_skill_pointer_resolves[hexpix_scene-hexpix-scene-usage]`
- The file's progress line shows all-pass dots (`...........................`).
- Developer fix confirmed present: `.agents/skills/hexpix-scene-usage.md` is a symlink → `../../skills/creative/hexpix-scene-usage.md` (untracked, created Nov 9 11:40).

### Delta vs baseline
| | baseline | now |
|---|---|---|
| passed | 2088 | **2108** |
| failed | 1 | **0** |
| skipped | 12 | 12 |
| xfailed | 3 | 3 |

**No new failure appeared.** The single baseline failure flipped to pass. Net +20 passed = that flip plus ~19 additional now-passing tests (suite composition grew on this branch since the baseline was recorded — not decomposed).

### Flake analysis — `tests/qa/test_08_end_to_end.py`
Re-run command (as prescribed):
```bash
cd /Users/tuyennguyen/project/OpenMontage && perl -e 'alarm shift; exec @ARGV' 1900 \
  /Users/tuyennguyen/project/OpenMontage/.venv/bin/python -m pytest tests/qa/test_08_end_to_end.py -q
```
Result (verbatim): `no tests ran in 13.44s`, exit code **5**.

Root cause (source inspection): the module defines **zero `test_*` functions** — it is a standalone script that runs its 7-stage E2E pipeline at import time (module-level `mkdir` + writes into gitignored `tests/qa/output/`). Under pytest it deterministically collects nothing and produces no progress line. **The "~1/21 import flake" premise in the commission no longer matches this file's current shape** — this is a fact change, not a flake.

Gate-outcome comparison (the `lib/checkpoint.py` ~L700 swallowed-cause question): to obtain an actual outcome the script was executed directly once:
```
END-TO-END TEST COMPLETE: 38 passed, 0 failed
```
exit 0, final cost `{'total_spent_usd': 0.0, 'total_reserved_usd': 0, 'budget_remaining_usd': 5.0}`. All per-stage checkpoint/canonical-artifact checks `[PASS]`. **No gate-outcome divergence** between the in-suite import execution and the standalone runs.

### Skip/xfail detail
12 skipped = 11 `s` progress chars + 1 pre-run skip (`collected … / 1 skipped`).
The invisible pre-run skip is the canary `tests/test_network_guard.py::TestLiveApiMarkerIsSkipped::test_this_should_never_run_by_default` — marked `@pytest.mark.live_api`, pre-skipped by `tests/conftest.py::pytest_collection_modifyitems` unless `OPENMONTAGE_ALLOW_NETWORK=1`. The gate worked (canary did not execute). The 11 remaining skip names/reasons were **not available** from the single mandated run at default verbosity (a `-rA` re-run was not permitted); reported as unavailable rather than inferred.

### Runtime
77.46s (0:01:17) pytest-reported; test_08 re-run 13.44s.

### Side effects (declared)
`.pytest_cache` refreshed (explicitly allowed) and `tests/qa/output/` scratch artifacts refreshed by the mandated suite run + test_08 runs (gitignored via `.gitignore:29`). **No tracked file modified** — `/usr/bin/git diff --name-only -- tests/` is EMPTY.

---

## T2 — Doc-contract suite — **PASS** (both halves)

### T2a — repo run (unmutated)
```bash
cd /Users/tuyennguyen/project/OpenMontage && perl -e 'alarm shift; exec @ARGV' 300 \
  .venv/bin/python -m pytest tests/test_video_contract_docs.py -q
```
Exit code: **0**
Verbatim stdout:
```
...................                                                      [100%]
19 passed in 0.37s
```
Expected 19 passed → **observed 19 passed. PASS.** Zero failures, zero skips.

Path surface (for the mutation proof): the test resolves everything off its own location —
`REPO_ROOT = Path(__file__).resolve().parents[1]` (L50); reads `docs/ORCHESTRATION_DOCTRINE.md` (L52), `docs/video-contract-inventory.json` (L53), `docs/video-capability-status.md` (L636), `projects/test-production-hardening-20261109-0114` (L637), `AGENTS.md`, `CLAUDE.md`, `.claude/prompts/om_team_leader_prompt.md`, `pipeline_defs/*.yaml`, `skills/pipelines/*/*.md`, `.agents/skills/*/SKILL.md`, `.claude/skills/**`, `.claude/agents/`. No network (`http://` appears once, as a literal used to EXCLUDE url tokens). No writes (`open(...,'w')`/`write_text`/`mkdir`/`unlink` → zero hits).

### T2b — non-tautology proof (mutated COPY only)
Copy: `/tmp/syncacc-t2b-nontautology` (rsync base + evidence workspace + 52 remotion-composer paths the inventory/references require).

Copy baseline (unmutated copy):
```
19 passed in 0.31s     exit=0
```
→ copy faithfully reproduces the repo pass (19/19).

**The mutation** — exactly one token, one file:
`/tmp/syncacc-t2b-nontautology/skills/pipelines/animation/scene-director.md`, line 134, inside the binding block:
```diff
-...a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS"...
+...a mechanical gate failure is `deferred`, never "PASS WITH WARNINGS"...
```
Heading kept intact; no path token, authority phrase, or bypass pattern touched — isolates the binding-uniformity check.

Mutated run:
```bash
cd /tmp/syncacc-t2b-nontautology && perl -e 'alarm shift; exec @ARGV' 300 \
  env PYTHONDONTWRITEBYTECODE=1 \
  /Users/tuyennguyen/project/OpenMontage/.venv/bin/python -m pytest tests/test_video_contract_docs.py \
  -p no:cacheprovider
```
Exit code **1**. Verbatim:
```
tests/test_video_contract_docs.py ...F...............                    [100%]

=================================== FAILURES ===================================
_________ test_binding_block_byte_identical_across_all_pipeline_directors ________

    non_uniform = {h for h in hashes.values() if h != BINDING_BLOCK_MD5}
>       assert not non_uniform, (
            "Production Contract Binding blocks diverged from the pinned "
            f"md5 {BINDING_BLOCK_MD5}: {sorted(non_uniform)} "
            f"({len(hashes)} carriers scanned)"
        )
E       AssertionError: Production Contract Binding blocks diverged from the pinned md5 1dd8e674ff57ae3b9fb711c9ff2190cd: ['b094f9502e43df7c3746e3c0ebbf0872'] (103 carriers scanned)
E       assert not {'b094f9502e43df7c3746e3c0ebbf0872'}

tests/test_video_contract_docs.py:300: AssertionError
=========================== short test summary info ============================
FAILED tests/test_video_contract_docs.py::test_binding_block_byte_identical_across_all_pipeline_directors
========================= 1 failed, 18 passed in 0.20s =========================
```

**Non-tautology verdict: PASS.** One-token binding mutation → the targeted invariant FAILS with the divergent md5 named; the other 18 tests stay green. The suite detects real drift, not self-consistency.

**Repo integrity:** `git status --porcelain=v1` md5 `10f64ecc5f4ff48b87a8511e36a6d1ef` before AND after (262 lines each), `diff` empty (rc=0). Zero repo writes, zero repo files created by the mutation proof.

---

## T3 — Block uniformity — **PASS**

- Lanes: **12** — animation, avatar-spokesperson, character-animation, cinematic, clip-factory, documentary-montage, explainer, hybrid, localization-dub, podcast-repurpose, screen-demo, talking-head.
- Files scanned: `ls -1 skills/pipelines/*/*.md | wc -l` → **103**.
- Carriers (contain `## Production Contract Binding`): **103/103**.
- Distinct md5 set: **exactly one** — `1dd8e674ff57ae3b9fb711c9ff2190cd` (count 103).
- **MATCH** vs developer claim `1dd8e674ff57ae3b9fb711c9ff2190cd` (both RAW byte-exact and NORMALIZED `rstrip()+"\n"`).
- **Deviating files: none.** (No per-file diff exists to show.)
- **Lanes with zero carriers: none.** Every lane has carriers.
- **Non-carrier files: 0** — every one of the 103 md files carries the block.

Independent second implementation (cross-check):
```bash
for f in skills/pipelines/*/*.md; do awk 'f && /^## /{exit} /^## Production Contract Binding/{f=1} f' "$f" | md5 -q; done | sort | uniq -c
# 103 1dd8e674ff57ae3b9fb711c9ff2190cd
```

Extraction method (throwaway script in /tmp only): heading line matched by `^## Production Contract Binding\b`; block = heading through the line before the next `^## ` heading, or EOF; RAW text kept with `keepends` (byte-exact). Normalization rules: none applied to the primary hash; CRLF scan found **0** files with CRLF (all LF); normalized variant yields the same md5 (every block ends at EOF on a file-final newline). Heading-variant audit: a single variant across all 103 — `## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)`.

Reproducibility anchor: `skills/pipelines/explainer/script-director.md` lines 281–293 (EOF) →
```bash
sed -n '281,$p' skills/pipelines/explainer/script-director.md | md5 -q
# 1dd8e674ff57ae3b9fb711c9ff2190cd
```
**Trap recorded:** binding blocks end at EOF, so a `sed` range that stops at the next `^## ` silently deletes the final paragraph and yields a wrong hash (`c4bdfb90…`). The shipped method does not use that pattern.

---

## T4 — PUBLIC/VALID vs INVALID production route — **PASS**

### Real gate code path (never re-implemented)
- `tools/qc/episode_gate.py` (224 lines) — `validate_episode(episode_dir)` + CLI `main()`.
- Consumed by `tools/qc/scene_packet.py`, `tools/qc/timing_relock_guard.py`, `lib/production_validation.py`, `tools/qc/mix_validator.py`.
- Production caller: `tools/qc/scene_orchestrator.py:1286` → `raw_reasons = validate_episode(root)`.
- Entry point (verbatim, `episode_gate.py:213–224`):
```python
def main(argv=None):
    parser = argparse.ArgumentParser(description='Validate episode scene packets and cross-cut production gates'); parser.add_argument('episode_dir'); args = parser.parse_args(argv)
    root = Path(args.episode_dir)
    if not root.is_dir(): print(f'ERROR — episode directory missing: {root}', file=sys.stderr); return 2
    try: reasons = validate_episode(root)
    except OSError as e: print(f'ERROR — {e}', file=sys.stderr); return 2
    if reasons:
        print('FAIL — episode gate rejected')
        for r in reasons: print(f"- {r['code']}: {r['message']}")
        return 1
    print('PASS — episode gate'); return 0
if __name__ == '__main__': sys.exit(main())
```
- Invocation: `.venv/bin/python tools/qc/episode_gate.py <episode_dir>`. Exit convention: **0 = pass, 1 = rejected (reason codes), 2 = missing dir/OSError**. The target is the episode PACKET dir (`packets/episode/`), not the workspace root.

### VALID route (read-only over the smoke workspace)
```bash
.venv/bin/python tools/qc/episode_gate.py projects/test-production-hardening-20261109-0114/packets/episode
```
```
PASS — episode gate
```
Exit code **0**, stderr empty, reproduced twice. Write-proof: marker file → re-run → `find <workspace> -newer <marker>` returned **empty** (gate modifies nothing in its input).

### INVALID route (tampered COPY in isolated dir)
Tamper — one field, one file: `projects/test-sync-acceptance-20261109-t4-gate-routes/invalid/packet_cut-s1.json`, field `narration.sha256`:
```
before: 44fc317bac9074e4ff018a4cc337552f9b5a83e3c73e1993907f0a781e80ba7a
after:  44fc317bac9074e4ff018a4cc337552f9b5a83e3c73e1993907f0a781e80ba7b
```
Applied by surgical string replace (`assert t.count(old) == 1`). Nothing deleted.

Proof the tamper is the ONLY difference:
```
$ diff -rq control/ invalid/
Files control/packet_cut-s1.json and invalid/packet_cut-s1.json differ
```
(line-level diff: exactly line 12, the sha256 string; all other 190 files identical)

```bash
.venv/bin/python tools/qc/episode_gate.py projects/test-sync-acceptance-20261109-t4-gate-routes/invalid
```
```
FAIL — episode gate rejected
- output_hash_mismatch: packet_cut-s1.json: writer output hash mismatch or missing: assets/audio/voice_s1.wav
- output_not_frozen: packet_cut-s1.json: writer output absent from frozen_inputs or frozen hash differs: assets/audio/voice_s1.wav
- stale_packet: packet_cut-s1.json: packet narration hash 44fc317bac9074e4ff018a4cc337552f9b5a83e3c73e1993907f0a781e80ba7b does not match current cut source assets/audio/voice_s1.wav hash 44fc317bac9074e4ff018a4cc337552f9b5a83e3c73e1993907f0a781e80ba7a
- verdict_binding_mismatch: packet_cut-s1.json: reviewer verdict was for assets/audio/voice_s1.wav hash 44fc317bac9074e4ff018a4cc337552f9b5a83e3c73e1993907f0a781e80ba7a, but output hash is 44fc317bac9074e4ff018a4cc337552f9b5a83e3c73e1993907f0a781e80ba7b
```
Exit code **1** (reproduced on re-run), stderr empty. The single tampered hash was caught through **four independent mechanisms**.

### CONTROL run
```bash
.venv/bin/python tools/qc/episode_gate.py projects/test-sync-acceptance-20261109-t4-gate-routes/control
PASS — episode gate
```
Exit **0** — the smoke workspace is not special; the rejection is attributable to the tamper alone.

### Limitations
1. Workspace root is not a valid gate target (first run at the root returned exit 1 with `non_packet_json`/`scene_packet_missing`/`timing_relock_failed` cascade) — wrong invocation, not a gate defect.
2. Negative fixtures `production_evidence_neg1/-neg2` were not re-run (out of the commissioned scope of one tamper).
3. Gate exercised in CLI + `validate_episode()` form only; the orchestrator's session-persistence path was not invoked in T4 (covered in T5).
4. Fully offline, deterministic.

---

## T5 — Two-scene fresh-writer / independent-reviewer workflow — **PASS (mechanically) / caveat on LLM independence**

### Real orchestrator code path
- `tools/qc/scene_orchestrator.py` (1,523 lines) — `orchestrate_episode(episode_dir, max_concurrency, max_retries, runner, evidence_file, scene_ids, strict, daemon_timeout)`.
- CLI: `tools/qc/scene_orchestrator.py <episode_dir> --runner {auto|subprocess|daemon} --scenes <ids> --max-concurrency N --max-retries N [--evidence-file <path>] [--strict]`.
- Inner agent invocation (spawned by `SubprocessAgentRunner`):
  `python tools/qc/scene_orchestrator.py --internal-run-agent --role {writer|reviewer} --scene-id <id> --instance-id <id> --token <token> --workdir <dir> [--output-hashes <json>]`.
- Session/token minting (verbatim, `scene_orchestrator.py:1205-1207`, `949-985`):
```python
session_id = f"session-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
director_token = f"dir_{uuid.uuid4().hex[:12]}"
...
writer_id = f"writer_{scene_id}_{uuid.uuid4().hex[:8]}"
writer_token = f"wt_{scene_id}_{uuid.uuid4().hex[:12]}"
...
reviewer_id = f"reviewer_{scene_id}_{uuid.uuid4().hex[:8]}"
reviewer_token = f"rt_{scene_id}_{uuid.uuid4().hex[:12]}"
assert reviewer_id != writer_id, "Reviewer ID must not equal writer ID"
assert reviewer_token != writer_token, "Reviewer token must not equal writer token"
```
- Reviewer isolation: `create_reviewer_sandbox` (copy dir `.tmp_sandboxes/sandbox_<scene_id>_<hex>`); pre/post SHA-256 diffs enforce `verify_writer_scope` and `verify_reviewer_ownership` (reviewer must mutate **0** canonical files).

### Offline feasibility — OFFLINE CAPABLE
Zero references to `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `api_key` in `scene_orchestrator.py`, `scene_packet.py`, `episode_gate.py`. `DaemonAgentRunner` talks to the Ensemble daemon on `127.0.0.1:8088` and previously timed out (interactive prompt loops). `SubprocessAgentRunner` is self-contained and runs with **0 network calls**.

### What was actually run
Scaffold:
```bash
perl -e 'alarm shift; exec @ARGV' 300 /Users/tuyennguyen/project/OpenMontage/.venv/bin/python \
  projects/test-sync-acceptance-20261109-t5-scene-workflow/bootstrap_episode.py
```
exit **0**, 1s.

Orchestrator:
```bash
perl -e 'alarm shift; exec @ARGV' 300 .venv/bin/python tools/qc/scene_orchestrator.py \
  projects/test-sync-acceptance-20261109-t5-scene-workflow/episode/test_episode \
  --runner subprocess --scenes cut-1,cut-2 --max-concurrency 1 --max-retries 0
```
exit **0**, 1s wall (orchestrator-measured duration 0.32s).

Validators:
```bash
.venv/bin/python tools/qc/scene_packet.py .../packet_cut-1.json   # exit 0 — PASS — scene packet valid and integrated
.venv/bin/python tools/qc/scene_packet.py .../packet_cut-2.json   # exit 0 — PASS — scene packet valid and integrated
.venv/bin/python -c "from tools.qc.episode_gate import validate_episode; print(validate_episode('.../test_episode'))"
# exit 0 — reasons: [] , valid: True
```

### Session evidence (verbatim excerpt from `episode/test_episode/artifacts/scene_workflow_evidence.json`)
```json
{
  "session_id": "session-20261109T061829Z-14abc69f",
  "director_token": "dir_dcc6cec5eba0",
  "started_at": "2026-11-09T06:18:29.709227+00:00",
  "finished_at": "2026-11-09T06:18:30.029085+00:00",
  "duration_seconds": 0.3198518753051758,
  "config": {
    "max_concurrency": 1, "max_retries": 0, "runner": "SubprocessAgentRunner",
    "strict": true, "daemon_timeout": 600.0,
    "authoritative_scenes": ["cut-1", "cut-2"],
    "targeted_scenes": ["cut-1", "cut-2"]
  },
  "scenes": {
    "cut-1": {
      "scene_id": "cut-1", "status": "success",
      "attempts": [{
        "attempt_number": 1,
        "writer_result": {
          "instance_id": "writer_cut-1_63091311",
          "token": "wt_cut-1_3f82eb2dddcb",
          "role": "writer", "exit_code": 0,
          "stdout": "PASS — writer writer_cut-1_63091311 produced outputs for cut-1\n",
          "outputs": {}, "error": null
        },
        "reviewer_result": {
          "instance_id": "reviewer_cut-1_0517a678",
          "token": "rt_cut-1_11f06aa0de49",
          "role": "reviewer", "exit_code": 0,
          "stdout": "PASS — reviewer reviewer_cut-1_0517a678 approved cut-1\n",
          "outputs": {}, "error": null
        },
        "ownership": {
          "writer_scope_valid": true, "writer_modified_files": [],
          "reviewer_canonical_mutation": false, "reviewer_mutated_files": [],
          "error_message": null
        },
        "packet_valid": true, "packet_reasons": [],
        "packet_path": ".../episode/test_episode/packet_cut-1.json",
        "packet_hash": "8d9877ea74718e3ba91165769cae5d03c26d6fbfcf69dc57a142dabb5a256659",
        "success": true, "error": null
      }],
      "final_packet_path": ".../episode/test_episode/packet_cut-1.json",
      "final_packet_hash": "8d9877ea74718e3ba91165769cae5d03c26d6fbfcf69dc57a142dabb5a256659",
      "error": null
    },
    "cut-2": {
      "scene_id": "cut-2", "status": "success",
      "attempts": [{
        "attempt_number": 1,
        "writer_result": {
          "instance_id": "writer_cut-2_0f2ef207",
          "token": "wt_cut-2_6cc6c9720b1d",
          "role": "writer", "exit_code": 0,
          "stdout": "PASS — writer writer_cut-2_0f2ef207 produced outputs for cut-2\n",
          "outputs": {}, "error": null
        },
        "reviewer_result": {
          "instance_id": "reviewer_cut-2_f33e58aa",
          "token": "rt_cut-2_3e89ab764210",
          "role": "reviewer", "exit_code": 0,
          "stdout": "PASS — reviewer reviewer_cut-2_f33e58aa approved cut-2\n",
          "outputs": {}, "error": null
        },
        "ownership": {
          "writer_scope_valid": true, "writer_modified_files": [],
          "reviewer_canonical_mutation": false, "reviewer_mutated_files": [],
          "error_message": null
        },
        "packet_valid": true, "packet_reasons": [],
        "packet_path": ".../episode/test_episode/packet_cut-2.json",
        "packet_hash": "2a7ab246bbdee1ea72ac89caa9fe77cb52010b776d5dbaa43deb2c1363ba2e76",
        "success": true, "error": null
      }],
      "final_packet_path": ".../episode/test_episode/packet_cut-2.json",
      "final_packet_hash": "2a7ab246bbdee1ea72ac89caa9fe77cb52010b776d5dbaa43deb2c1363ba2e76",
      "error": null
    }
  },
  "episode_gate_result": { "valid": true, "reasons": [] },
  "overall_status": "pass",
  "ownership_model": {
    "reviewer_isolation": "sandbox-copy workspace + pre/post canonical SHA-256 diff",
    "writer_containment": "pre/post canonical SHA-256 diff against declared allowed_io",
    "token_independence": "director-minted distinct UUID4 tokens; writer_token != reviewer_token",
    "verdict_binding": "explicit reviewed_hashes mapping in reviewer findings + packet",
    "input_freeze": "pre-dispatch SHA-256 hash map in frozen_inputs",
    "llm_independence": "prompt-level context separation (separate instances/histories)"
  }
}
```

### Reviewer verdicts (verbatim)
`packets/cut-1_findings.json` (sha256 `285e48effb58b5eb17c4e61dea24825ef3d06e9acc78e133a105a98dd37574e0`):
```json
{
  "scene_id": "cut-1",
  "verdict": "approved",
  "reviewed_hashes": {
    "assets/audio/voice_cut-1.wav": "643f8a8dc8bd9c19225afffad2becfec5426180b3749cb208abdf1a6c8354efc",
    "artifacts/narration_words.json": "ebb9e1e430476bdbbfae850e4557a72e09eef5de6b927b16c7d634f51c92bd18",
    "packets/style_contract.json": "ab48596ca29092478bf18d97b59ce442337077e2a40a27964b15bd6c4d37436b"
  },
  "notes": "Independent review approved scene cut-1 outputs."
}
```
`packets/cut-2_findings.json` (sha256 `5bf247ec51323282bfdbf5a3df94870f99cbe4c16069a8318a57037862883227`) — same shape, `scene_id: cut-2`, `verdict: approved`, notes `Independent review approved scene cut-2 outputs.`

### Separation proof
| scene | writer id / token | reviewer id / token | distinct? |
|---|---|---|---|
| cut-1 | `writer_cut-1_63091311` / `wt_cut-1_3f82eb2dddcb` | `reviewer_cut-1_0517a678` / `rt_cut-1_11f06aa0de49` | yes (both) |
| cut-2 | `writer_cut-2_0f2ef207` / `wt_cut-2_6cc6c9720b1d` | `reviewer_cut-2_f33e58aa` / `rt_cut-2_3e89ab764210` | yes (both) |
Cross-scene freshness | `writer_cut-1_63091311` != `writer_cut-2_0f2ef207` | `reviewer_cut-1_0517a678` != `reviewer_cut-2_f33e58aa` | yes |

### Packets
- `projects/test-sync-acceptance-20261109-t5-scene-workflow/episode/test_episode/packet_cut-1.json` — sha256 `8d9877ea74718e3ba91165769cae5d03c26d6fbfcf69dc57a142dabb5a256659`
- `.../packet_cut-2.json` — sha256 `2a7ab246bbdee1ea72ac89caa9fe77cb52010b776d5dbaa43deb2c1363ba2e76`

### Existing smoke-workspace artifacts re-validated (read-only)
- `packets/episode/artifacts/scene_workflow_evidence_subprocess.json` records a prior 2-scene pass (`session-20261109T012449Z-abec1e08`).
- `scene_workflow_evidence.json` records a prior `DaemonAgentRunner` attempt failing at 61.5s polling.
- Repo validator re-run on the existing smoke packets: both exit 0 `PASS — scene packet valid and integrated`; `packet_cut-s1.json` sha256 `157c4d08ecbdb8e8127315d32055c04d1fb483546c3b24a04b18882f20cdb13b`, `packet_cut-s2.json` sha256 `3ad33822ead43b127a13eca88365462ee4d8b936aca01357f3e08e57d3efc389`.

### Exercise level achieved — **(i) FULL end-to-end**, with the caveat below
Real orchestrator invoked; two fresh packets produced; fresh writer OS subprocess and separate fresh reviewer OS subprocess per scene; reviewer sandboxed; pre/post SHA-256 ownership snapshots; verdict findings binding exact output hashes; both packets integrated; strict episode gate `valid: true`.

**Caveat (honest, material):** under `--runner subprocess` the inner `--internal-run-agent` executes deterministic shell/python (materialize + hash-verify), **not an LLM turn loop**. The mechanical guarantees (OS separation, token independence, sandbox isolation, hash binding, ownership enforcement) are genuinely exercised; **creative/subjective reasoning independence is NOT exercised** — the evidence field `llm_independence` is only "prompt-level context separation". The `--runner daemon` path (true LLM agent sessions) needs interactive writer/reviewer handlers on `127.0.0.1:8088` and times out otherwise. Plan Task 3's additional cases — missing/extra packet rejection and cross-scene write denial/detection — were **not** exercised in this commission.

---

## T6 — TypeScript / Remotion — **PASS**

### Exact commands
```bash
cd /Users/tuyennguyen/project/OpenMontage/remotion-composer && perl -e 'alarm shift; exec @ARGV' 300 npx vitest run
cd /Users/tuyennguyen/project/OpenMontage/remotion-composer && perl -e 'alarm shift; exec @ARGV' 300 npx tsc --noEmit
```
Watchdog never fired. **No install attempted** — both binaries resolved from the existing `remotion-composer/node_modules/.bin/`.

### Exit codes
`npx vitest run` → **0** ; `npx tsc --noEmit` → **0**

### vitest output (verbatim)
```
 RUN  v5.1.0 /Users/tuyennguyen/project/OpenMontage/remotion-composer


 Test Files  6 passed (6)
      Tests  47 passed (47)
   Start at  13:09:32
   Duration  140ms (tests 38%, import 38%, transform 17%, worker 7%)
```
### tsc output
Empty (no stdout, no stderr), exit 0.

### Versions
```
node -v             → v24.14.1
npm -v              → 11.19.0
npx vitest --version → vitest/5.1.0 darwin-arm64 node-v24.14.1
npx tsc --version    → Version 5.9.3
```
`remotion-composer/package.json`: `"typescript": "^5.3.0"`, `"vitest": "5.1.0"` — resolved vitest matches the exact pin; resolved tsc 5.9.3 satisfies `^5.3.0`.

### 47/47 verdict
**PASS** — `Tests  47 passed (47)` (6/6 files).

### src/ write proof
545 files under `remotion-composer/src/**` snapshotted (mtime|size|path) before the runs; `diff` after both runs → clean. `find remotion-composer/src -type f -newer <marker>` → **0**. Extended `find remotion-composer -newer <marker> -not -path '*/node_modules/*'` → **0**.

---

## T7 — Artifact hash adjudication — **PASS**

### MP4
```
projects/test-production-hardening-20261109-0114/renders/test-production-hardening-20261109-0114.mp4
sha256 2f2262e51de667ffee22e26b662223d5cefb88defe27b8f9cfe30e854c3929f7
bytes  8376927
mtime  2026-11-09 08:28:47
```
Command: `shasum -a 256 projects/test-production-hardening-20261109-0114/renders/*.mp4` ; `stat -f%z` for bytes.

### Doc's recorded claim (verbatim)
`docs/video-capability-status.md` line 53:
> - `renders/test-production-hardening-20261109-0114.mp4` (hash `2f2262e5…` ORIGINAL match), `audio_stems/{bgm,narration,sfx,mix}.wav`

line 73 (capability row 10):
> | 10 | **Production render (Remotion strict compose)** | `implemented-unverified` at HEAD; artifact `independently-verified` (bound to smoke session) | `tools/video/video_compose.py` → Remotion render | `renders/test-production-hardening-20261109-0114.mp4` SHA-256 `2f2262e5…` ORIGINAL match (smoke §1/§7); `history/render_final_1125.log` | **No re-render at `a3724d4`** (no npm ci / no new renders allowed); freshness at HEAD unproven |

Full un-elided hash lives one hop away — `history/smoke-report-20261109.md` line 16:
> | Render (mp4) | `…/renders/test-production-hardening-20261109-0114.mp4` | `2f2262e51de667ffee22e26b662223d5cefb88defe27b8f9cfe30e854c3929f7` | ORIGINAL — **matches** original table hash `2f2262e5…` |

### Verdict
| Check | Verdict |
|---|---|
| sha256 | **MATCH** — recomputed == smoke-report full hash == doc elided prefix |
| byte size | **MATCH** — 8,376,927 B exactly |

Byte-size convention: **mp4 file only** (renders/ also holds a 1,160,385 B thumbnail PNG and `.final_review_frames/` with 4 PNGs; whole-dir total would be ≥ 9,537,312 B).

### Evidence file map (sha256 first 16; all cited paths exist)
| Path | sha256 (first 16) | bytes |
|---|---|---|
| `renders/test-production-hardening-20261109-0114.mp4` | `2f2262e51de667ff` (FULL `2f2262e51de667ffee22e26b662223d5cefb88defe27b8f9cfe30e854c3929f7`) | 8,376,927 |
| `history/smoke-report-20261109.md` | `6f93817b42d5e22c` | 24,625 |
| `history/render_final_1125.log` | `fefa9383e7cfb5a7` | 1,802 |
| `APPROVAL_DEMO.md` | `041a9ee179c67484` | 1,238 |
| `checkpoint_proposal.json` | `8b49a43c91837684` | 8,817 |
| `checkpoint_research.json` | `1e1ad202bec61739` | 11,983 |
| `checkpoint_script.json` | `6a7ee5cf2e10bdc8` | 11,402 |
| `checkpoint_scene_plan.json` | `03f5d18e26937579` | 8,098 |
| `checkpoint_assets.json` | `e87f5544fa119c52` | 9,775 |
| `checkpoint_edit.json` | `e2bb132b75fe1632` | 5,424 |
| `checkpoint_compose.json` | `915032894cce0222` | 4,052 |
| `artifacts/layout_evidence.json` | `10f7307b623576b8` | 70 |
| `artifacts/semantic_evidence.json` | `7dda3cc0a72ddff3` | 43 |
| `artifacts/timing_evidence.json` | `7b6faef7df2831f8` | 39 |
| `artifacts/mix_evidence.json` | `1212f725cd1fc68c` | 37 |
| `artifacts/provenance_evidence.json` | `c92068f0545b75fa` | 44 |
| `artifacts/production_evidence.json` | `8791034a47ecc691` | 3,484 |
| `artifacts/production_evidence_neg1.json` | `030fe1d8c105d492` | 2,761 |
| `artifacts/production_evidence_neg2.json` | `c462a9959d2d54f0` | 3,241 |
| `packets/episode/artifacts/scene_workflow_evidence_restore.json` | `6179090345ca1981` | 5,587 |
| `packets/episode/artifacts/scene_workflow_evidence_subprocess.json` | `3dced248186e05eb` | 7,574 |
| `packets/episode/artifacts/scene_workflow_evidence_daemon.json` | `41a74553a69ab4e7` | 6,153 |
| `packets/episode/artifacts/scene_workflow_evidence_daemon_r2.json` | `2466998da0b7512f` | 10,088 |
| `packets/episode/packet_cut-s1.json` | `157c4d08ecbdb8e8` | 2,941 |
| `packets/episode/packet_cut-s2.json` | `3ad33822ead43b12` | 2,941 |
| `packets/episode/packets/cut-s1_findings.json` | `9ce36f2cb5564bcc` | 559 |
| `packets/episode/packets/cut-s2_findings.json` | `fc99bf7750f5033e` | 559 |
| `packets/episode/packets/style_contract.json` | `63080b8882170f9e` | 125 |
| `audio_stems/bgm.wav` | `8499a9a4a6ff2b7b` | 2,796,602 |
| `audio_stems/narration.wav` | `a1615c19c3621164` | 2,796,602 |
| `audio_stems/sfx.wav` | `72ef3f2094da02b0` | 2,796,602 |
| `audio_stems/mix.wav` | `4ad06d47143a01ab` | 2,796,636 |

Directory cites (existence + counts only, no hashes claimed by the doc): `qc/scene_sweep_v2/` (10 files), `qc/scene_sweep_v3/` (9 files), `qc/stills_v3/` (8 PNGs), `renders/.final_review_frames/` (4 PNGs), `qc/visual_density_gate.json` (284 B).

### Other hash claims checked — all MATCH
| Doc line | Claim | Recomputed | Verdict |
|---|---|---|---|
| 36 | subprocess evidence `3dced248…` | `3dced248186e05eb99894677b5cefe0ab41a2e8468838f2208433204d0b5d179` | MATCH |
| 45 | production_evidence `8791034a…` | `8791034a47ecc6918a37ab96e0f3a67c00010f53d451f5a15da77c2894e95f2e` | MATCH |
| 95 | ai-video-gen pair `f805fc45aeb61691…` | `f805fc45aeb61691978ed06f70f58945a2023d04a9fc3fbf486307ff27126a75` on BOTH `.agents` and `.claude` | MATCH |
| 95 | elevenlabs pair `fc802e043cc946a5…` | `fc802e043cc946a50b5074bf97b284d82eb772305ac6f1604fdac17ee9faaa31` on BOTH sides | MATCH |
| 4–5 | binding md5 `1dd8e674ff57ae3b9fb711c9ff2190cd` ×103 | single md5 across 103 | MATCH |
| 102 | HEAD `a3724d4daeb1bb0abfb61867380b01a6318ad72e` | identical | MATCH |

### Nuances (not mismatches — wording defects for the doc owner)
1. Line 95 calls `f805fc45…` / `fc802e04…` "aggregate sha256 pairs". They are the sha256 of each skill's **`SKILL.md` file**, not dir aggregates (a true concat-bytes dir aggregate for `elevenlabs/` would be `3116fc2d08d15622…`). The substantive claim — both mirror sides byte-identical — is true (`diff -rq` clean).
2. `scene_sweep_report.json` exists in BOTH `qc/scene_sweep_v2/` and `qc/scene_sweep_v3/`; the doc cites `v3/` but does not disambiguate.
3. Freshness at HEAD is **unproven** — by design (no re-render permitted). Hash+size prove the on-disk mp4 matches the smoke-session record; they do NOT prove a rebuild at `a3724d4` reproduces it. The doc states this honestly in row 10.

---

## T8 — Inventory integrity spot-check — **PASS**

File: `docs/video-contract-inventory.json`. Top-level keys: `schema_version`, `plan_ref`, `snapshot`, `edit_once_rule`, `kind_vocabulary`, `authority_vocabulary`, `decision_vocabulary`, `canonical_commands`, `symlink_verification`, `duplicate_audit`, `counts`, `exclusions`, `entries`.

Sample entry (verbatim):
```json
{
  "path": "docs/ORCHESTRATION_DOCTRINE.md",
  "kind": "canonical-contract",
  "authority_tier": "canonical",
  "owner_lane": "ENS-repo",
  "status": "active",
  "decision": "edit",
  "sha256_16": "b3bad848e3a588fc",
  "note": "Single authoritative production/team contract (plan Task 2 home — IMPLEMENTED in working tree). …"
}
```

### Path existence
- total **659** / existing **659** / missing **0** (missing list: none).
- Path traversal: **0**. No absolute paths, no `..` segments.
- Duplicates: **2 paths appear twice**
  - `skills/INDEX.md` — two DIFFERENT entries (idx 4 `tool-reference`/`refer`/`sha256_16: 88268b19e1b780a9`; idx 7 `domain-specialization`/`no-change`) — divergent kind/decision, looks like intentional dual-registration.
  - `tools/audio/refresh_manifest.py` — idx 656 and idx 657 **verbatim identical** (same kind/authority_tier/owner_lane/status/decision/note, both `decision: no-change`) — **likely accidental duplicate**. Informational finding; dedupe decision belongs to the inventory owner. Not auto-fixed (read-only task).

### Owner check
- Status vocabulary + counts: `active` 530, `duplicate-identical` 48, `mirror-active` 47, `untracked-dirty` 26, `legacy-reference` 6, `dirty-preserved` 1, `active-evidence` 1.
- Owner field `owner_lane` present on all 659.
- **ACTIVE entries: 530. ACTIVE with missing/empty owner: 0.** (No ownerless ACTIVE entry.) Non-ACTIVE with empty owner: 0.

### by_status recompute
| status | recorded | recomputed | flag |
|---|---|---|---|
| active | 530 | 530 | ok |
| mirror-active | 47 | 47 | ok |
| duplicate-identical | 48 | 48 | ok |
| legacy-reference | 6 | 6 | ok |
| dirty-preserved | 1 | 1 | ok |
| untracked-dirty | 26 | 26 | ok |
| active-evidence | 1 | 1 | ok |
| **total_entries** | 659 | 659 | ok |

No mismatches. The file's own `counts.by_status_derivation` pin ("530+47+48+6+1+26+1 = 659") reproduces exactly.

### Coverage
- Disk `skills/pipelines/*/*.md` = 103; covered by inventory = **103**; missing = **0**.
- Inventory entries matching `skills/pipelines/*/*.md` = 103, all `status: active`; `## Production Contract Binding` heading present in **103/103**, absent 0, read errors 0.

---

## T9 — Constraint sweep — **PASS**

### Git identity
```
branch: editorial-hardening-20261108
HEAD:   a3724d4daeb1bb0abfb61867380b01a6318ad72e
a3724d4 chore(deps): pin reproducible test dependencies (finding F9)
1fa85d6 fix(remotion): production layout enforcement + semantic SFX tail anchor fix, consumed by sample episode (findings F6/F7)
7b01e4e docs(orchestration): sync doctrine, agent team definitions, editorial skill, explainer directors to verified behavior
2cdb744 feat(scene-orchestration): executable writer/reviewer orchestrator with mechanical ownership enforcement (finding F3)
cb32930 fix(production-gates): strict evidence binding, episode packet coverage, provenance completeness, mix fail-closed; close legacy/checkpoint bypasses (review findings F1/F2/F4/F5/F8)
b7e0726 feat(p1.3): scene packet + episode integration gates — hash-frozen packets, writer/reviewer independence, doctrine §7
```
`git diff --cached --stat` → EMPTY (nothing staged). `git stash list` → EMPTY. `git reflog -5` → unchanged (no new commit/checkout activity).

### Raw porcelain
`/usr/bin/git status --porcelain=v1` → **262 entries** (142 ` M ` modified tracked, 120 `??` untracked).
`/usr/bin/git status --porcelain=v1 --untracked-files=all` → **2159 entries** (142 modified + 2017 untracked files).

### Classification (every entry accounted for)
| Bucket | Count | Content |
|---|---|---|
| **(a) sync change set** | **139 tracked modified files** | `docs/ORCHESTRATION_DOCTRINE.md` (+54/−4, §8 production contract + machine-readable metadata); 103 `skills/pipelines/*/*.md` (binding block appended; 15 also carry a 1–2 line stale-ref cleanup); 13 `pipeline_defs/*.yaml` (3-line doctrine header); 6 `.claude/agents/*.md` (subordination banner); `.claude/prompts/om_team_leader_prompt.md` (+16/−1); `AGENTS.md` (+5/−0); `CLAUDE.md` (+6/−0); 11 `.agents/skills/*` + `.claude/skills/*` sync fixes; `lib/checkpoint.py` (+12/−1, diagnostic-only cause preservation in `_check_prerequisites`); `skills/INDEX.md` (+1/−1) |
| **(b) pre-existing dirty** | **3** | `remotion-composer/src/Root.tsx` — verified **+29/−0** exactly (3 composition registrations: `ChinhPhuTichTruEditorialV1`, `…HUD`, `XangDauDemoDraftHud`); `.agents/tester/PACKS.md` +58/−0 (2026-11-08 P1.1/P1.3 pack definitions); `.agents/tester/README.md` +4/−3 (active-engagement note) |
| **(c) pre-existing untracked** | **120 v1 entries / 2017 files** | 33 historical `projects/*` dirs incl. `projects/test-production-hardening-20261109-0114/` (192 files) and `projects/xang-dau-demo-20261107-p1verify/` (38 files); 165 `remotion-composer/src/<project>/` composition files; `remotion-composer/projects_qc/` (33); 8 `remotion-composer/<pid>` temp files; `skills/creative/shotcraft/` (414); `tools/motion-workbench/` (353); `archive/bac-ha-ngap-20261107-rejected-v1/` (208); 9 `scripts/*.py`; 7 root `TASK_*.md` / `P0_GATE_PROGRESS.md`; `docs/plans/`, `docs/handoff/`, `docs/stage-gates/`, `docs/video-capability-status.md`, `docs/video-contract-inventory.json`; `tests/test_video_contract_docs.py`; `.superpowers/` (2); `assets/characters/` (8); `exports/thumbnails/` (2); `.agents/tester/LESSONS/` (3) + `.agents/tester/RESULTS/2026-11-08-*.md` (11) + `RESULTS/2026-11-09-hardening-final-test.md` (1) |
| **(d) NEW from this task** | **2 isolated dirs + this report** | see below |

**Anomalies: none unclassifiable.** Every porcelain entry lands in (a), (b), or (c).

### Bucket (d) — this task's artifacts
| Dir | files | bytes | manifest sha256 |
|---|---|---|---|
| `projects/test-sync-acceptance-20261109-t4-gate-routes/` | 70 | 17,097,527 | `ef495d6ef16a14362a89c40ddaa7969c05b9685682c503952d305cc1868a5612` |
| `projects/test-sync-acceptance-20261109-t5-scene-workflow/` | 31 | 338,073 | `a5fbbac1b10775046c0e062f9ed57b0cb5f1c81a391c90c26cea724937e34089` |

Both are gitignored via `.gitignore:35` (`projects/*/*`), which is why they do not appear in porcelain. `.agents/tester/` new paths: **0 before this report** — this file (`RESULTS/2026-11-09-sync-acceptance-test.md`) is the only repo file the tester wrote.

### Protected-path proof
| Check | Result |
|---|---|
| `/usr/bin/git diff --name-only -- remotion-composer/src/` | `remotion-composer/src/Root.tsx` only (pre-existing) |
| `/usr/bin/git status --porcelain=v1 -- renders/ media/ node_modules/` | EMPTY |
| `find remotion-composer/src -type f -newermt '2026-11-09 13:00:00' \| wc -l` | **0** |
| `find media renders -type f -newermt '2026-11-09 13:00:00'` | **0** (neither dir exists at repo root) |
| `find remotion-composer/node_modules -newermt '2026-11-09 13:00:00'` | **2** — vitest runner cache (`.vite/vitest/da39a3ee…/results.json`, 718 B), gitignored, not a tracked path |
| `find tests/qa/output -type f -newermt '2026-11-09 13:00:00' \| wc -l` | **47** — pytest/E2E scratch, gitignored (`.gitignore:29`) |
| `/usr/bin/git diff --name-only -- tests/` | **EMPTY** (no tracked test file modified) |

### Smoke workspace byte-identity (critical)
- Pre-task baseline: `/tmp/om_shas.txt`, capture-file sha256 `d63c3bc04142e9260cb4efb8cf32349afaa51800d7def4c79690a703bdb8dd5c`.
- Recomputed now: `/tmp/t9b_shas_now.txt`, 192 files, capture-file sha256 `d63c3bc04142e9260cb4efb8cf32349afaa51800d7def4c79690a703bdb8dd5c`.
- `diff -u /tmp/om_shas.txt /tmp/t9b_shas_now.txt` → **EMPTY** (rc=0).
- `find projects/test-production-hardening-20261109-0114 -type f -newermt '2026-11-09 12:02:00' | wc -l` → **0**.
- **Verdict: byte-identical. Zero modifications to the evidence workspace.**

### Repo-wide stray-write sweep
`find . -path ./node_modules -prune -o -path ./.git -prune -o -path ./.pytest_cache -prune -o -newermt '2026-11-09 13:00:00' -type f -print | sort` → **154 files**, all accounted for:
- 70 — t4 gate-routes isolated dir
- 31 — t5 scene-workflow isolated dir
- 47 — `tests/qa/output/` scratch (gitignored)
- 5 — `__pycache__` `.pyc` (python runtime cache)
- 1 — `remotion-composer/node_modules/.vite/vitest/…/results.json` (vitest cache, gitignored)

**Unexplained writes: 0.**

---

## Remaining limitations / not-proven

1. **T5 does not prove LLM-level writer/reviewer independence.** The executable proof used `--runner subprocess`, whose inner agent is deterministic code, not an LLM turn loop. Separation, token independence, sandbox isolation, hash binding, ownership enforcement, and verdict integration are genuinely exercised; **creative-reasoning independence is not**. True LLM sessions require the daemon runner with interactive handlers on `127.0.0.1:8088` (previously timed out at 61.5s polling).
2. **Plan Task 3 residual cases not exercised**: missing/extra scene-packet rejection, and cross-scene write denial/detection. Out of the commissioned T1–T9 set; still open against plan Task 3's full acceptance wording.
3. **Render freshness at HEAD is unproven.** T7 proves the on-disk mp4 hash/size match the smoke-session record; it does not prove a rebuild at `a3724d4` reproduces them (no re-render permitted). The capability doc already states this limitation.
4. **T5's episode input was scaffolded** by `bootstrap_episode.py` (753 B) inside the isolated dir (there is no offline real episode input). The scene packets themselves were produced by the real orchestrator code path, not hand-written — but the *input fixtures* are synthetic, so the exercise proves the orchestration mechanics, not production content quality.
5. **11 of 12 skipped-test names/reasons not printable** from the single mandated pytest run at default verbosity (a `-rA` re-run was disallowed). The 12th (live_api canary) was identified by source inspection.
6. **The commission's "known flake" premise for `tests/qa/test_08_end_to_end.py` is outdated** — the module now defines zero `test_*` functions and deterministically collects nothing. It is not a flake; it is a collection-shape change. Gate outcomes remain unchanged (direct run: `38 passed, 0 failed`).
7. **Inventory duplicate** `tools/audio/refresh_manifest.py` (idx 656/657, verbatim identical) — likely accidental, left untouched (read-only task; owner decides).
8. **Doc wording defects** (T7): `f805fc45…`/`fc802e04…` labelled "aggregate sha256 pairs" but are per-`SKILL.md` file hashes; `scene_sweep_report.json` cited from `qc/scene_sweep_v3/` without noting the identical copy in `qc/scene_sweep_v2/`. Neither changes the substantive claims.
9. **`.agents/tester/rules/ensure.md` does not exist** in this project (user-owned file, never created by the tester). Quality gates for this engagement were taken from the commissioned criteria in the task, not from ensure.md. If a project-specific ensure.md is wanted, its owner must add it.
10. **Two doc-contract test surfaces were verified for existence only** in T7 (`audio_stems/manifest.json` uncited-but-present; `qc/visual_density_gate.json` 284 B, uncited by hash) — the capability doc claims no hashes for them, so no adjudication was owed.
11. **Host quirks that affect reproducibility** (recorded to KB): the default `git` binary on this host wraps stdout and collapses it to a summary — use `/usr/bin/git` raw with output redirected to a file; there is **no** `timeout`/`gtimeout` binary — use `perl -e 'alarm shift; exec @ARGV' N cmd`; binding blocks end at EOF, so a `sed` range stopping at the next `^## ` yields a wrong md5 (`c4bdfb90…`) — extract heading→EOF in python with `keepends`.

---

## Documentation / artifacts written by this engagement

- `.agents/tester/RESULTS/2026-11-09-sync-acceptance-test.md` — this report (the ONLY repo file written by the tester).
- `projects/test-sync-acceptance-20261109-t4-gate-routes/` — gate valid/invalid/control evidence (70 files, gitignored).
- `projects/test-sync-acceptance-20261109-t5-scene-workflow/` — two-scene orchestrator evidence (31 files, gitignored).
- No commits. No git state mutation. No modifications to `PACKS.md`, `README.md`, `rules/`, any existing `projects/*` lane, `renders/`, `media/`, `remotion-composer/src/**`, or `node_modules`.

### Overall Status
- T1 full pytest: **PASS** (2108P / 0F / 12S / 3XF)
- T2 doc-contract + non-tautology: **PASS**
- T3 binding uniformity: **PASS** (103/103, single md5)
- T4 gate valid/invalid: **PASS**
- T5 writer/reviewer workflow: **PASS (mechanical) — LLM independence NOT proven**
- T6 vitest + tsc: **PASS** (47/47, tsc clean)
- T7 hash adjudication: **PASS**
- T8 inventory integrity: **PASS**
- T9 constraint sweep: **PASS** (smoke workspace byte-identical)
- **Acceptance: READY for the commissioned scope, with the T5 and Task 3 caveats above carried forward.**
