#!/usr/bin/env python3
"""Re-write proposal + script checkpoints as completed with human approval (native API).
Evidence: owner_full_run_approval.json (full_run_authorized, no additional owner wait)."""
import json, sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))
from lib.checkpoint import write_checkpoint, validate_checkpoint

P = OM / "projects" / "lieu-hanh"
pp = json.loads((P / "artifacts" / "proposal_packet.json").read_text(encoding="utf-8"))
sc = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))

ev = {"approval_evidence": "projects/lieu-hanh/owner_full_run_approval.json",
      "owner_quote": "Let finish the vn myth ep4 I approve all",
      "channel": "Telegram DM615761638 relayed in lead session 20261020_070647_629003"}

write_checkpoint(Path("projects"), project_id="lieu-hanh", stage="proposal", status="completed",
    artifacts={"proposal_packet": pp}, human_approval_required=True, human_approved=True,
    review={"reviewer": "owner via full-run approval", "notes": ev["owner_quote"], "result": "approved"})
write_checkpoint(Path("projects"), project_id="lieu-hanh", stage="script", status="completed",
    artifacts={"script": sc}, human_approval_required=True, human_approved=True,
    review={"reviewer": "owner via full-run approval", "notes": ev["owner_quote"], "result": "approved"})

for st in ("proposal", "script"):
    cp = json.loads((P / f"checkpoint_{st}.json").read_text(encoding="utf-8"))
    validate_checkpoint(cp, pipeline_dir=Path("projects"), project_id="lieu-hanh")
    print(st, cp["status"], "human_approved=", cp["human_approved"], "readback PASS")
