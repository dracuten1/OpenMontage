# Lesson: schema-valid ≠ authentic — verdict-shaped provenance is a trust boundary (P0.3 round 2, 2026-11-08)

## Context
Round-2 adjudication of OpenMontage strict provenance gate. Dev fixed all shape/truthiness holes (round 1: `or`-chain fail-open — see 2026-11-08-strict-gate-or-selection-fail-open.md). New critical bypass remained.

## Root cause pattern
Validator accepts TWO provenance shapes:
- PAIR (`{"current": ..., "recorded": ...}`) → **recomputes** freshness via `verify_provenance_freshness` — trustworthy.
- VERDICT (`{"is_fresh": ..., stale evidence fields}`) → schema + internal-consistency checks only, then `FreshnessResult.from_dict(value)` — **verdict trusted as-is**.

A schema-valid fabricated verdict (`{"is_fresh": True, "stale_stages": [], "stale_reasons": [], "mismatched_fingerprints": {}}`) is internally consistent BY CONSTRUCTION — schema validation cannot distinguish it from an honestly computed one. Gate accepted it over genuinely stale artifacts (all 4 source slots + first-source-wins conflict case). `present[0]` selection also means later genuine-stale sources are never examined.

## Detection recipe (reusable)
After any "strict validation" fix: probe the FULLY-VALID fabricated claim, not just malformed shapes. Formula: construct the most honest-looking LIE — every required field, correct types, internally consistent, verdict favorable — while ground truth (recomputable artifacts) contradicts it. If the validator recomputes ground truth → safe. If it trusts the claim → bypass. Test every accepted shape (not just the first) and every source slot.

## Fix direction (production, for dev)
Verdict-shaped provenance = claim, not evidence. Strict gate should recompute fingerprints from pipeline artifacts (pair shape already does) and treat verdict shapes as claims to verify, or require pair shape / attestation. Also: validate ALL present sources, not `present[0]` (or at minimum recompute over artifacts regardless of source).

Evidence: RESULTS/2026-11-08-phase-b-p0.3-provenance-adjudication-r2.md §4; repro /tmp/p03r2_fabricated.log.
