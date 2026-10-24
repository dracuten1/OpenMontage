#!/usr/bin/env python3
"""Generate scene_plan skeleton with append marker + per-section provisional timing metadata."""
import json, sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "lieu-hanh"
script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))

meta_sections = []
t = 0.0
for s in script["sections"]:
    d = float(s.get("estimated_duration_seconds") or s.get("duration_seconds") or 30)
    meta_sections.append({"id": s["id"], "est_start": round(t, 2), "est_duration": round(d, 2)})
    t += d

skel = {
    "version": "1.0",
    "style_playbook": "s2-ink-genome-lieu-hanh",
    "scenes": [
        {"__APPEND_MARKER__": True}
    ],
    "metadata": {
        "status": "provisional",
        "note": "start/end_seconds are provisional editorial estimates; production re-locks to measured TTS audio + forced alignment (speech-locked boundaries, panels retained through final spoken sentence).",
        "approval": "owner full-run 2026-10-21 (projects/lieu-hanh/owner_full_run_approval.json)",
        "section_timing_estimates": meta_sections,
        "claim_map_note": "Per-scene claim IDs/source_refs live in script sections (script_section_id -> artifacts/script.json). Quotes shown on overlays must be verbatim from ledger.",
        "scene_index_note": "scene_index artifact built at edit stage from real audio."
    },
}
out = P / "drafts" / "scene_plan.json"
out.write_text(json.dumps(skel, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"skeleton written; {len(meta_sections)} sections, provisional total {t:.0f}s")
