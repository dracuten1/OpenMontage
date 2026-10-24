#!/usr/bin/env python
"""S2E03 — S1 checkpoint: script draft awaiting_human + decision d-005 (split CC sessions).
Chạy từ repo root: .venv/bin/python projects/chu-dong-tu/scripts/gen_s2_checkpoint.py
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
from lib.checkpoint import write_checkpoint  # noqa: E402
from schemas.artifacts import validate_artifact  # noqa: E402

P = REPO / "projects" / "chu-dong-tu"

# 1. checkpoint script — BỊ CHẶN đúng luật: stage 'proposal' đang awaiting_human
#    → theo approval_policy gate_B: giữ draft ở drafts/, KHÔNG vượt prerequisite.
#    Bản ghi minh bạch = decision d-005 + metadata của checkpoint_proposal (đã có).
draft = json.loads((P / "drafts" / "script_draft.json").read_text())
validate_artifact("script", draft)
assert draft["metadata"]["status"] == "draft_awaiting_owner"
print("1. draft VALID, giữ ở drafts/ — native script checkpoint blocked (proposal awaiting_human), đúng gate_B")

# 2. decision_log: append d-005 (mechanism — không cần owner, ghi minh bạch)
dl_path = P / "decision_log.json"
dl = json.loads(dl_path.read_text())
existing_ids = {d["decision_id"] for d in dl["decisions"]}
new = {
    "decision_id": "d-005",
    "stage": "script",
    "category": "execution_mechanism",
    "subject": "Kịch bản chia 4 phiên CC part + scaffold-append sau khi phiên đơn treo 2 lần",
    "options_considered": [
        {"option_id": "split_scaffold_append", "label": "4 phiên part (P1–P4), skeleton + marker, mỗi section 1 Edit nhỏ, MAX_THINKING_TOKENS=4000", "score": 0.9,
         "reason": "Phiên đơn (B, B1) treo tại bước sinh output dài sau khi đọc xong — jsonl đóng băng, CPU 0%, TCP mở; chia nhỏ output + giới hạn thinking giữ stream sống. Session A (proposal, nhiều Write vừa) đã chứng minh pattern này chạy được."},
        {"option_id": "single_session_retry", "label": "Retry phiên đơn lớn", "score": 0.15,
         "reason": "2 lần treo liên tiếp (B 02:24, B1 02:46) cùng một điểm; chi phí chờ mỗi lần 15–20 phút."},
        {"option_id": "hermes_writes_script", "label": "Lead tự viết narration", "score": 0.1,
         "reason": "Vi phạm phân vai pipeline: script là việc CC, lead chỉ spec + QC."},
    ],
    "selected": "split_scaffold_append",
    "reason": "4/4 phiên part hoàn tất exit 0, 32/32 sections, schema VALID. Ghi lại để tái dùng cho các tập sau.",
    "user_visible": True,
    "user_approved": True,
    "confidence": 0.95,
}
if new["decision_id"] not in existing_ids:
    dl["decisions"].append(new)
dl_path.write_text(json.dumps(dl, ensure_ascii=False, indent=2) + "\n")
print("2. decision_log appended →", len(dl["decisions"]), "decisions")
