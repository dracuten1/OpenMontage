# OpenMontage manifest trust model — review lessons (2026-11-15)

Context: dcd7a21 review (fix/failure-fixes), 2-councilor code-review council, APPROVED.

## Pattern: writer-owned manifest = trust boundary with no signature
- `load_writer_attempt_manifest` (scene_orchestrator.py) validated schema string only → stale/foreign manifest at exact `{scene_id}_{attempt}` path trusted = fail-open. Fix pattern: identity cross-check (`scene_id` + `attempt_index` vs loader args), mismatch → legacy tier; `isinstance(writer_owned, list)` guard.
- Manifest tier must not inherit legacy carve-outs (`COLLABORATOR_SHARED_BASENAMES`, sibling regex) — manifest-owned sibling-scene write should be a violation, not allowed.
- Fail-closed tier selection: corrupt/missing manifest → None → legacy tier is the correct direction; dot-prefixed paths denied in BOTH tiers (defense-in-depth).

## Review process notes
- Byte-identical re-mint claims: verify with `shasum -a 256` across template + deployed copies (one command, decisive).
- Deep-review triggers fired on: retry markers + gate ordering + shared template propagation. Council converged round 0 — good prompt = enumerate mandated checks + residual concerns verbatim for adjudication.
- Mandate discipline: "no invented fix" claims (Hermes correlation UNRESOLVED) — verify docstring-only delta + doctrine section instead of accepting prose.

## Open follow-ups (next touch of scene_orchestrator.py)
1. Manifest scene_id/attempt_index identity validation
2. Manifest tier: owned sibling-scene writes = violations
3. `_module_target_exists` padded/unpadded alias probe (S02 vs S2.tsx)
4. Carve-out anchored to shared locations or freeze wiring files
5. Dead `utf-9` test expr; mid-file import dup in test_failure_fixes.py
