#!/usr/bin/env python
"""S2E03 chu-dong-tu — canonical hóa script draft -> artifacts/script.json + native script checkpoint.
Proposal đã approved (Gate B, d-006) nên checkpoint script được phép ghi."""
import json
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
PROJ = REPO / "projects" / "chu-dong-tu"

draft = json.loads((PROJ / "drafts" / "script_draft.json").read_text())
# native script artifact = sections như draft (đã VALID ở P4 + Hermes QC)
script = {
    "version": draft["version"],
    "title": draft["title"],
    "total_duration_seconds": draft["total_duration_seconds"],
    "voice_performance": draft["voice_performance"],
    "sections": draft["sections"],
    "metadata": {**draft["metadata"], "status": "canonical_from_draft_gateB",
                 "canonicalized_at": "2026-10-19", "source": "drafts/script_draft.json (owner Gate B + demo approved)"},
}
from schemas.artifacts import validate_artifact
validate_artifact("script", script)
(PROJ / "artifacts" / "script.json").write_text(json.dumps(script, ensure_ascii=False, indent=1))
print("artifacts/script.json VALID")

from lib.checkpoint import write_checkpoint
from pathlib import Path as P
cp = write_checkpoint(
    P("projects"), project_id="chu-dong-tu", stage="script",
    status="completed", artifacts={"script": script},
    pipeline_type="animated-explainer", style_playbook="ink-genome",
    human_approval_required=False, human_approved=True,
    metadata={"notes": "Script canonical từ drafts/script_draft.json; Gate B approved 2026-10-19; demo s03 approved (msg 382)."},
)
print("checkpoint script completed:", cp)
