# Lesson: `or`-based optional-field selection makes strict gates fail-open (P0.3 adjudication, 2026-11-08)

## Context
Adversarial adjudication of OpenMontage Phase B P0.3 provenance/invalidation (branch editorial-hardening-20261108). Dev claimed strict gate fails closed on unrecognized provenance metadata. It does not — for 10 input shapes.

## Root cause pattern
`value = metadata.get(key) or default` — falsey values (`[]`, `{}`, `""`, `None`) collapse into the default path, so downstream verification is silently SKIPPED, not failed. Combined with:
- malformed-shape guard checking presence of metadata KEYS, not the shape of subvalues (`provenance_keys_present` inspected the wrong level);
- freshness accepted on key-presence + truthiness (`"is_fresh" in provenance`, `bool(value)`), so `{"is_fresh": "yes"}` passes;
- `from_dict` defaulting missing fields (partial dicts become "fresh").

Only truthy unrecognized STRINGS (`"   "`, `"null"`) hit the malformed rejection — the passes/fails split tracks Python truthiness, not schema validity.

## Detection recipe (reusable)
Against any "strict/fail-closed" claim, probe the optional-field seam with: empty list, empty dict, empty string, None, partial dict with one truthy required-looking key, wrong-typed scalar where bool expected, unknown nested dict, unknown nested list, extra key beside valid payload. Wrap in an otherwise-valid passing context — bypass = gate returns normally.

## Fix direction (production, for dev)
Validate shape/type explicitly BEFORE any `or` fallback; in strict mode, provenance-present-but-malformed must raise (it did for truthy strings — extend to falsey + partial + wrong-type); strict schema check on recognized keys; reject non-bool `is_fresh`.

Evidence: RESULTS/2026-11-08-phase-b-p0.3-provenance-adjudication.md; repros /tmp/p03_probe_shapes_confirm.py.
