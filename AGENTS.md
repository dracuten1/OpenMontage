# OpenMontage

**MANDATORY: Read `AGENT_GUIDE.md` before responding to ANY user message.**

Do not act on the user's request until you have read `AGENT_GUIDE.md`.
It contains routing rules that determine your first action based on what the user asked.

**Production contract authority:** `docs/ORCHESTRATION_DOCTRINE.md` is the canonical
production contract (v3.0 Antigravity-native). Production runs execute inside
**Antigravity / `agy` CLI** using native subagents/workflows (`invoke_subagent`,
`run_workflow`, multimodal Vision `read_file`) and deterministic Python QC gates
(`tools/qc/`). `skills/pipelines/*` directors and `pipeline_defs/*.yaml` are synced
mirrors of that contract.

There are no orchestration rules in this file beyond routing you to `AGENT_GUIDE.md`.
