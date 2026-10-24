#!/usr/bin/env python3
"""Post-approval mechanical prep for lieu-hanh (lead writer).
- proposal_packet: approval.status -> approved, record provenance in user_notes (schema-safe)
- copy drafts/script_draft.json -> artifacts/script.json with approval metadata
- decision_log: append approval decisions (same category+subject pattern, history kept)
- validate all via native schemas
Backups already in backups/pre-full-run/."""
import json, sys
from pathlib import Path
from datetime import datetime, timezone

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))
from schemas.artifacts import validate_artifact

P = OM / "projects" / "lieu-hanh"
now = datetime.now(timezone.utc).isoformat()
APP = json.loads((P / "owner_full_run_approval.json").read_text(encoding="utf-8"))
QUOTE = APP["owner_quote"]

# 1) proposal approval
pp_path = P / "artifacts" / "proposal_packet.json"
pp = json.loads(pp_path.read_text(encoding="utf-8"))
ap = pp["approval"]
ap["status"] = "approved"
notes = ap.get("user_notes") or ""
ap["user_notes"] = (notes + " | FULL-RUN APPROVAL " + now + ": \"" + QUOTE + "\" — concept c1 approved; runtime remotion approved; duration content-driven; internal demo/batch/QC/final authorized; no bible edit; no auto publish.").strip(" |")
# lock selected concept c1 if field present
if "selected_concept" in pp and isinstance(pp["selected_concept"], dict):
    pp["selected_concept"]["concept_id"] = "c1"
validate_artifact("proposal_packet", pp)
pp_path.write_text(json.dumps(pp, ensure_ascii=False, indent=1), encoding="utf-8")
print("proposal_packet: approved, schema PASS")

# 2) script artifact from approved draft
d = json.loads((P / "drafts" / "script_draft.json").read_text(encoding="utf-8"))
d.setdefault("metadata", {})
d["metadata"]["status"] = "owner_approved"
d["metadata"]["approved_at"] = now
d["metadata"]["approval_evidence"] = "projects/lieu-hanh/owner_full_run_approval.json"
d["metadata"]["concept"] = "c1 — Người con gái trở về (approved)"
d["metadata"]["note"] = "Timing fields remain editorial estimates; real durations come from measured TTS audio at assets stage."
validate_artifact("script", d)
(P / "artifacts" / "script.json").write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
print("artifacts/script.json: written, schema PASS")

# 3) decision log approvals (append-only, same category+subject)
dl_path = P / "decision_log.json"
dl = json.loads(dl_path.read_text(encoding="utf-8"))
approvals = [
    {"decision_id": "d-004", "stage": "proposal", "category": "pipeline_selection",
     "subject": "Scoped authorization S2E04 (approval_policy): research import + proposal + kịch bản chờ duyệt — DỪNG ở awaiting_human",
     "options_considered": [
        {"option_id": "scoped_to_script_review", "label": "Import research sealed v1 → proposal (pending) → script draft chờ duyệt; KHÔNG TTS/ảnh/render", "score": 0.0,
         "reason": "Superseded by owner full-run approval; kept for history."}],
     "selected": "full_run", "reason": "OWNER FULL-RUN APPROVAL " + now + " (Telegram DM615761638, relayed): \"" + QUOTE + "\" — S2E04 lieu-hanh all gates through final + Telegram delivery; evidence projects/lieu-hanh/owner_full_run_approval.json.",
     "user_visible": True, "user_approved": True, "confidence": 1.0},
    {"decision_id": "d-005", "stage": "proposal", "category": "render_runtime_selection",
     "subject": "Render runtime S2E04 = Remotion (continuation mùa S2, khuyến nghị) — HyperFrames available, trình bày cả hai cho owner chốt",
     "options_considered": [
        {"option_id": "remotion", "label": "Remotion atelier continuation (engine S2E01–S2E03)", "score": 0.95, "reason": "Approved by owner in full-run approval (CC+OpenMontage Remotion runtime explicitly listed)."},
        {"option_id": "hyperframes", "label": "HyperFrames HTML/GSAP composition", "score": 0.35, "reason": "Presented; not chosen by owner."}],
     "selected": "remotion", "reason": "Owner full-run approval names Remotion explicitly; locked for this episode only.",
     "user_visible": True, "user_approved": True, "confidence": 1.0},
    {"decision_id": "d-006", "stage": "proposal", "category": "concept_selection",
     "subject": "Concept S2E04: khuyến nghị c1 'Người con gái trở về' — c2 'Ba lớp sự thật' / c3 'Tháng Ba giỗ Mẹ' trình bày đủ; PENDING owner",
     "options_considered": [
        {"option_id": "c1", "label": "Người con gái trở về (approved)", "score": 1.0, "reason": "Owner approved recommended concept c1 incorporating c2/c3 per approval relay."}],
     "selected": "c1", "reason": "Owner full-run approval: recommended concept c1 approved.",
     "user_visible": True, "user_approved": True, "confidence": 1.0},
    {"decision_id": "d-007", "stage": "script", "category": "script_approval",
     "subject": "Script S2E04 (32 sections) + S2-C4 interpretive framing — approved",
     "options_considered": [
        {"option_id": "approve_script", "label": "Approve reviewed script as canonical", "score": 1.0, "reason": "Owner full-run approval covers reviewed script and S2-C4 framing for this episode; bible NOT modified."}],
     "selected": "approve_script", "reason": "Owner full-run approval; artifacts/script.json is canonical; timing estimates re-locked by measured audio at assets stage.",
     "user_visible": True, "user_approved": True, "confidence": 1.0},
]
have = {x["decision_id"] for x in dl.get("decisions", [])}
for a in approvals:
    if a["decision_id"] not in have:
        dl["decisions"].append(a)
dl_path.write_text(json.dumps(dl, ensure_ascii=False, indent=1), encoding="utf-8")
print("decision_log: appended d-004..d-007 (approvals)")
print("PREP-ARTIFACTS OK")
