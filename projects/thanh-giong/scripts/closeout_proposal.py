#!/usr/bin/env python
"""Hermes closeout: checkpoint proposal (S1a chết mạng sau khi artifact VALID trên đĩa)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, "/Users/tuyennguyen/project/OpenMontage")
from lib.checkpoint import write_checkpoint
from schemas.artifacts import validate_artifact

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")
d = json.loads((P / "artifacts" / "proposal_packet.json").read_text())
validate_artifact("proposal_packet", d)
cp = write_checkpoint(
    Path("projects"), project_id="thanh-giong", stage="proposal",
    status="completed", artifacts={"proposal_packet": d},
    pipeline_type="animated-explainer", style_playbook="ink-genome",
    human_approval_required=True, human_approved=True,
    metadata={"notes": "Approved via d-000 full-run authorization (owner dispatch 2026-10-17 (S2E02 full-run, d-000), same pattern as Ep.02-06). S1a session died gateway_timeout AFTER writing valid artifact on disk (check-disk-first rule); Hermes closed out checkpoint."},
)
print("checkpoint_proposal:", cp)
