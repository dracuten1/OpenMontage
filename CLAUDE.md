# OpenMontage

**MANDATORY: Read [`AGENT_GUIDE.md`](AGENT_GUIDE.md) before responding to ANY user message.**

Do not act on the user's request until you have read AGENT_GUIDE.md.
It contains routing rules that determine your first action based on what the user asked.
Skipping it WILL cause you to take the wrong action.

**Production contract authority:** [`docs/ORCHESTRATION_DOCTRINE.md`](docs/ORCHESTRATION_DOCTRINE.md)
is the single canonical orchestration/production contract. Production runs are ENS-orchestrated
first (ENS primary); `.claude/` assets, `skills/pipelines/*` directors and `pipeline_defs/*.yaml`
are synced mirrors of that contract; Claude-Code standalone usage is the legacy/secondary path
(doctrine §8.5).

**LOCAL: Also read [`NOTES.local.md`](NOTES.local.md)** — machine-local environment facts
(vieneu TTS tool, 9router image provider, .env, local patches to expect on git pull,
owner's standing production rules, in-flight project state). Not part of upstream.

There are no other instructions in this file. All shared instructions are in AGENT_GUIDE.md.
