#!/usr/bin/env python
"""Fix packet approval block (schema chỉ cho status/user_notes/approved_budget_usd) rồi checkpoint approved."""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
from lib.checkpoint import write_checkpoint  # noqa: E402
from schemas.artifacts import validate_artifact  # noqa: E402

P = REPO / "projects" / "chu-dong-tu"
pk = P / "artifacts" / "proposal_packet.json"
packet = json.loads(pk.read_text())
old = packet.get("approval", {})
packet["approval"] = {
    "status": "approved",
    "user_notes": (
        "OWNER APPROVED 2026-10-19 (terse 'Duyệt', DM session default) — duyệt toàn bộ item "
        "awaiting_human lane S2E03: concept c1, runtime Remotion, BGM Mesmerize (provenance đã QC), "
        "S2-C3 (bible v1.1), 2 điểm biên tập theo đề xuất (giữ s01 'chín giờ sáng', s07 'cả trăm năm'). "
        "Nội dung chờ duyệt cũ: " + str(old.get("user_notes", ""))[:400]
    ),
    "approved_budget_usd": 0.0,
}
pk.write_text(json.dumps(packet, ensure_ascii=False, indent=2) + "\n")
validate_artifact("proposal_packet", packet)
print("0. packet approval fixed + VALID")

cp = write_checkpoint(
    Path("projects"),
    "chu-dong-tu",
    "proposal",
    "completed",
    artifacts={"proposal_packet": packet},
    pipeline_type="animated-explainer",
    style_playbook="ink-genome",
    human_approval_required=True,
    human_approved=True,
    metadata={
        "notes": (
            "Owner terse-approve 'Duyệt' (DM, 2026-10-19): c1, Remotion, BGM Mesmerize, S2-C3 "
            "(bible v1.1), 2 điểm biên tập theo đề xuất. KHÔNG tự mở gate sau — demo gate chờ "
            "TTS probe Gate A + 1 demo scene."
        ),
        "bible": "SEASON-02-BIBLE.md v1.1 (2026-10-19)",
        "approved_by": "owner (Tuyên, DM session default)",
        "approved_at": "2026-10-19T04:00:00+07:00",
    },
)
print("1. checkpoint_proposal → completed (human_approved=True):", cp)

dl_path = P / "decision_log.json"
dl = json.loads(dl_path.read_text())
for d in dl["decisions"]:
    if d["decision_id"] in ("d-002", "d-003", "d-004"):
        d["user_approved"] = True
if "d-006" not in {d["decision_id"] for d in dl["decisions"]}:
    dl["decisions"].append({
        "decision_id": "d-006",
        "stage": "proposal",
        "category": "gate_approval",
        "subject": "Gate B APPROVED — owner terse 'Duyệt' (DM 2026-10-19): c1 + Remotion + BGM Mesmerize + S2-C3 + 2 điểm biên tập",
        "options_considered": [
            {"option_id": "approve_all", "label": "Duyệt toàn bộ 5 item theo đề xuất", "score": 1.0,
             "reason": "Owner trả lời 'Duyệt', không item bị từ chối, không yêu cầu sửa."},
        ],
        "selected": "approve_all",
        "reason": "Terse-approve toàn bộ item awaiting_human lane S2E03. Bible bumped v1.1. Gate sau (demo) KHÔNG tự mở.",
        "user_visible": True,
        "user_approved": True,
        "approved_at": "2026-10-19T04:00:00+07:00",
        "confidence": 0.98,
    })
dl_path.write_text(json.dumps(dl, ensure_ascii=False, indent=2) + "\n")
print("2. decision_log:", len(dl["decisions"]), "decisions (d-002..d-004 approved + d-006)")
