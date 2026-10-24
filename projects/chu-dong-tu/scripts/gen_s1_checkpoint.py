#!/usr/bin/env python
"""S2E03 — S1 checkpoint: proposal awaiting_human + decision_log d-002..d-004.
Chạy từ repo root: .venv/bin/python projects/chu-dong-tu/scripts/gen_s1_checkpoint.py
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO))
from lib.checkpoint import write_checkpoint  # noqa: E402
from schemas.artifacts import validate_artifact  # noqa: E402

P = REPO / "projects" / "chu-dong-tu"

# 1. checkpoint proposal — awaiting_human (owner duyệt Gate B)
packet = json.loads((P / "artifacts" / "proposal_packet.json").read_text())
validate_artifact("proposal_packet", packet)
assert packet["approval"]["status"] == "pending", "approval.status phải là pending"
cp = write_checkpoint(
    Path("projects"),
    "chu-dong-tu",
    "proposal",
    "awaiting_human",
    artifacts={"proposal_packet": packet},
    pipeline_type="animated-explainer",
    style_playbook="ink-genome",
    human_approval_required=True,
    human_approved=False,
    metadata={
        "notes": (
            "Proposal PENDING owner (Gate B: research+proposal+script). Concept khuyến nghị c1 "
            "'Sau đám cưới, dòng sông còn chảy'; runtime present-both (Remotion khuyến nghị vs "
            "HyperFrames available); S2-C3 + BGM reuse + duration 960s đều chờ duyệt. "
            "Script draft chạy song song vào drafts/ (KHÔNG phải artifact chính thức). "
            "Sinh bởi CC session A (max-turns 22 sau khi file xuống đĩa) + Hermes validate độc lập PASS."
        ),
        "validated_by": "scripts/qc_proposal.py — schema VALID, approval pending",
        "cc_session_log": "~/.hermes/profiles/video/cache/scratch/s2e03/cc_A_proposal.log",
    },
)
print("1. checkpoint_proposal written:", cp)

# 2. decision_log: append d-002..d-004 (pending owner)
dl_path = P / "decision_log.json"
dl = json.loads(dl_path.read_text())
existing_ids = {d["decision_id"] for d in dl["decisions"]}
new = [
    {
        "decision_id": "d-002",
        "stage": "proposal",
        "category": "concept_selection",
        "subject": "Concept S2E03 = c1 'Sau đám cưới, dòng sông còn chảy' (khuyến nghị) — chờ owner duyệt",
        "options_considered": [
            {"option_id": "c1", "label": "Sau đám cưới, dòng sông còn chảy — narrative, trục vật thể + nước, mở từ hôm nay", "score": 0.92,
             "reason": "Trả lời thẳng câu hỏi trung tâm; đúng hướng ưu tiên BRIEF + research_notes §5 góc 1; gắn nhịp phẩm giá (c2) và dị bản tên sư (c3) làm nhịp bên trong."},
            {"option_id": "c2", "label": "Một chiếc khố, hai lựa chọn — so sánh hành động, dòng cảm xúc phẩm giá", "score": 0.7,
             "reason": "Cảm xúc mạnh nhưng lệch trọng tâm khỏi 'vì sao được thờ'; phần sau hôn nhân + lễ hội bị nén."},
            {"option_id": "c3", "label": "Một truyện, nhiều tên người thầy — đối chiếu ba bản", "score": 0.55,
             "reason": "Rèn kiểm chứng nhưng xoay quanh một đoạn; không trả lời câu hỏi trung tâm."},
        ],
        "selected": "c1",
        "reason": "Đề xuất của Hermes theo BRIEF; owner chốt ở Gate B cùng proposal packet + PROPOSAL.md.",
        "user_visible": True,
        "user_approved": False,
        "confidence": 0.9,
    },
    {
        "decision_id": "d-003",
        "stage": "script",
        "category": "canon_proposal",
        "subject": "S2-C3 (đề xuất, KHÔNG tự sửa bible): cộng đồng nhớ Chử Đồng Tử như khát vọng đời sống có phẩm giá, vượt xuất thân",
        "options_considered": [
            {"option_id": "propose_framed", "label": "Đưa vào climax với đóng khung 'có thể đọc là…', ghi PENDING trong packet + script draft", "score": 0.9,
             "reason": "BRIEF chốt đây là đề xuất cần owner duyệt; đóng khung giữ đúng tinh thần 'diễn giải không áp kết luận'."},
            {"option_id": "omit", "label": "Bỏ hẳn S2-C3 khỏi tập", "score": 0.3,
             "reason": "Mất câu trả lời cho hook; bible yêu cầu mỗi tập thiết lập đúng 1 canon mới."},
            {"option_id": "assert", "label": "Nói trắng như kết luận", "score": 0.0,
             "reason": "Vi phạm anti-rule: không kết luận độc quyền về tín ngưỡng."},
        ],
        "selected": "propose_framed",
        "reason": "Chờ owner duyệt; nếu duyệt, bible bump version + changelog do owner/lead ghi, không tự sửa.",
        "user_visible": True,
        "user_approved": False,
        "confidence": 0.85,
    },
    {
        "decision_id": "d-004",
        "stage": "assets",
        "category": "music_licensing",
        "subject": "BGM S2E03 = đề xuất REUSE 'Mesmerize' (Kevin MacLeod, CC BY 4.0, đã QC S2E01/E02) — chờ owner duyệt",
        "options_considered": [
            {"option_id": "reuse_mesmerize", "label": "Reuse Mesmerize với credit đầy đủ", "score": 0.85,
             "reason": "Track đã QC ở 2 tập trước, license CC BY 4.0 cho phép tái sử dụng có credit; nhất quán giọng mùa."},
            {"option_id": "new_track_verified", "label": "Track mới từ media-library đã qua nghe review", "score": 0.5,
             "reason": "Hầu hết catalog chưa qua tai — vi phạm 'không kế thừa track chưa kiểm tra' nếu chọn vội."},
            {"option_id": "silent", "label": "Không BGM", "score": 0.2, "reason": "Giảm chất cảm xúc tập 16 phút."},
        ],
        "selected": "reuse_mesmerize",
        "reason": "Đề xuất theo pattern d-001 S2E02; owner chốt ở Gate B. Chưa copy track — assets stage sau duyệt.",
        "user_visible": True,
        "user_approved": False,
        "confidence": 0.85,
    },
]
for d in new:
    if d["decision_id"] not in existing_ids:
        dl["decisions"].append(d)
dl_path.write_text(json.dumps(dl, ensure_ascii=False, indent=2) + "\n")
print("2. decision_log appended →", len(dl["decisions"]), "decisions")
