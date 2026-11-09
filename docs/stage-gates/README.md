# stage-gates (reserved placeholder — no gate documents live here)

Status (2026-11-09): this directory is empty by design. It was created 2026-10-03 as a
placeholder for stage-gate documents; the gates were implemented in code instead.
Repo-wide search found zero references to `stage-gates/` — there are no dangling links to fix.

The authoritative, machine-enforced stage gates are code + contract:

- **Contract:** `docs/ORCHESTRATION_DOCTRINE.md` (§7 scene-isolated team, §8 production contract)
- **Checkpoint gate enforcement:** `lib/checkpoint.py` (human approval gates, edit→compose timing
  re-lock, compose/publish production gate), `lib/timing_validator.py`, `lib/production_validation.py`
- **QC tools:** `tools/qc/scene_orchestrator.py`, `tools/qc/episode_gate.py`,
  `tools/qc/mix_validator.py`, `tools/qc/timing_relock_guard.py`, `tools/qc/scene_packet.py`

Do not place new gate documents here — extend the doctrine and the validators.
Restructuring stays plan-only (Leader decision D5, 2026-11-09); this README is a pointer, not a move.
