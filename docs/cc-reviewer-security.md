# Reviewer capability note (Wave1 security cycle-2)

`reviewer_wrapper.py.tmpl` strips `--allowedTools` and `--disallowedTools` from final Claude argv because provider drops final response when either flag appears. Stripped flags do not enforce restrictions. Reviewer runs against staged workspace copy, never canonical source; macOS wrapper invokes Claude through `sandbox-exec` Seatbelt profile that permits file writes only inside per-run staging root. Profile smoke test must pass before launch. If sandbox unavailable/broken, wrapper fails closed; no unrestricted override exists.

Reviewer/write child env: five safe essentials (`PATH`, `HOME`, `USER`, `SHELL`, `TMPDIR`) and per-wrapper explicit nine-key OM contract only. No API/provider credentials, `OM_TOKEN`, or `OM_INSTANCE_ID` reach Claude or `npx tsc`.

Reviewer verdicts accept legacy `<!-- VERDICT_START -->` JSON, current `@@VERDICT_START@@` text markers, and findings file. Stream retry count hard-clamped to one; no verdict produces prompt `timeout_error` rather than six 45-second waits.
