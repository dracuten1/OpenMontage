#!/usr/bin/env python
"""S2E03 — validate proposal_packet (lead QC sau CC session A)."""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
from schemas.artifacts import validate_artifact  # noqa: E402

P = REPO / "projects" / "chu-dong-tu"
d = json.loads((P / "artifacts" / "proposal_packet.json").read_text())
validate_artifact("proposal_packet", d)
print("proposal_packet VALID")
print("approval.status:", d["approval"]["status"])
print("concepts:", [(c["id"], c["title"][:60]) for c in d["concept_options"]])
print("selected:", d["selected_concept"]["concept_id"])
pp = d["production_plan"]
print("runtime:", pp.get("render_runtime"), "| mode:", pp.get("composition_mode"),
      "| renderer:", pp.get("renderer_family"))
print("cost total:", d["cost_estimate"]["total_estimated_usd"])
md = d.get("metadata", {})
for k in ("target_duration_seconds", "sections", "narration_words_target",
          "canon_proposed_this_episode", "package"):
    if k in md:
        print(f"meta.{k}:", md[k])
stages = [s["stage"] for s in pp["stages"]]
print("stages:", stages)
# gate check: script stage phải ghi drafts/ + pending
for s in pp["stages"]:
    if s["stage"] in ("script", "scene_plan", "assets"):
        print(f"--- {s['stage']} approach:", s["approach"][:220])
