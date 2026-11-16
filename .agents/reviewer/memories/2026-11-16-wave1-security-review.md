# Wave 1 Security Review — 2026-11-16

Target: OpenMontage wt-roadmap-wave0-wave1 @ 64981ef (fix/roadmap-wave0-wave1). Deep-Review council (security-review, 2/2 councilors: agentic + coding), governor dfe3006b-07e7-4210-b009-1f846a17adf1.

**Verdict: APPROVE.** 0 blocking / 5 should-fix / 9 optional.

## Should-fix (land as follow-up hardening, priority order)
1. `scene_orchestrator.py:2086-2093` + `restore_seals.py:570` — `runner=None` auto-detect prefers DaemonAgentRunner → redispatch_drifted_scenes (provenance lane) can route around P0-3 containment. Fix: default SubprocessAgentRunner.
2. `run_cc_pipeline.py.tmpl:305-325` — `run_pipeline_once()` not exception-wrapped → crash path skips fail_exit/owner_approval_request emit. Fix: try/except → exit 1 + summary.
3. `scene_orchestrator.py:899-902` — `extra_env` merged post-whitelist, unfiltered. Fix: strip KEY/TOKEN/SECRET/PASSWORD-shaped keys.
4. `scene_packet.py:205` + `episode_gate.py:141-146` — gate-time token read-back is self-attestation (design gap, not regression). Fix: orchestrator-minted registry or HMAC.
5. `render_episode.py:222-232` — override log free-text append, self-asserted issuer. Fix: JSONL via emit_job_event + sha256 chain + uid/hostname.

## Test gate baseline (verified by execution, both councilors)
- Phase 4C = 84/84 (restore_seals 33 + scene_orchestrator 26 + video_slowfix_phase4 25).
- Targeted Wave-1 pack actual = 220/220 (~172s). "144/144" claim maps to no single named suite — 220 is the superset; report actual counts.
- Full suite = 2531 passed / 7 failed / 17 skipped / 3 xfailed (610s). 7 failures exactly == baseline `.agents/tester/RESULTS/2026-11-15-failure-fixes-verification.md` (editorial_language_gate ×3, compose-evidence 1, video_contract_docs ×3). Zero new failures.
- Mint manifests verify_minted_hashes 4/4.

## Patterns worth reusing
- Council convergence: env whitelist (4-layer, no os.environ passthrough), provenance chain closed at every layer, NON_OVERRIDABLE frozenset is sole soften path.
- Relaunch cap: ship default 2, 3 = explicit OM_RELAUNCH_MAX_ATTEMPTS=3 operator ceiling — converged as defensible; one shared hard cap blocks infra/content gaming; backoff clamped ≤3600s.
- 600s bash wall cap doctrine: both councilors shell-detached test runs (nohup + poll), no SIGKILL losses.
