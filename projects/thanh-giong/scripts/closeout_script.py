#!/usr/bin/env python
"""Hermes closeout: checkpoint script (d-000 full-run pattern) + d-005."""
import json
import sys
from pathlib import Path

sys.path.insert(0, "/Users/tuyennguyen/project/OpenMontage")
from lib.checkpoint import write_checkpoint
from schemas.artifacts import validate_artifact

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")
d = json.loads((P / "artifacts" / "script.json").read_text())
validate_artifact("script", d)
cp = write_checkpoint(
    Path("projects"), project_id="thanh-giong", stage="script",
    status="completed", artifacts={"script": d},
    pipeline_type="animated-explainer", style_playbook="ink-genome",
    human_approval_required=True, human_approved=True,
    metadata={"notes": "Approved via d-000 full-run. S1b died gateway_timeout mid-Write (13/28 sections on disk); S1b2 --resume finished 28 sections 3872 words, self-trimmed from 4011. Hermes audit: whitelist pass (4 FP adjudicated), S2-C1 verbatim s23, quotes verbatim s02/s06/s07, Mỵ Nương danh xưng stated s02, provider_text ';'-fix x13 applied."},
)
print("checkpoint_script:", cp)

dl = json.loads((P / "decision_log.json").read_text())
dl["decisions"].append({
    "decision_id": "d-005",
    "stage": "script",
    "category": "script_qc",
    "subject": "Script audit pass sau 2 lần CC chết gateway_timeout (S1a proposal-only xong; S1b chết giữa Edit; S1b2 --resume hoàn tất)",
    "options_considered": [
        {"option_id": "resume_session", "label": "Respawn bằng --resume giữ context thay vì session mới", "score": 0.9, "reason": "Upstream flaky (gemini 502 đồng thời); resume giữ plan và chỉ viết phần còn thiếu."},
        {"option_id": "fresh_restart", "label": "Session mới viết lại từ đầu", "score": 0.4, "reason": "Tốn turn đọc lại; rủi ro chết mạng lặp lại giữa Write lớn."},
    ],
    "selected": "resume_session",
    "reason": "S1b2 resume xong trong ~8 phút: 28 sections / 3.872 từ (trong range 3.400–3.900), tự trim từ 4.011, tự bắt 3 chỗ ký tự ngoại lai. Hermes audit độc lập: 4 false positive đã adjudicate (asset f07, 'tháng 7, tháng 8' trong nguyên văn quote LNCQ, id S2-C1, regex hoa thường Mỵ Nương). Fix cơ học: provider_text ';'->'.' 13 sections (vieneu 3-vế lesson).",
    "user_visible": True,
    "user_approved": False,
    "confidence": 0.95,
})
(P / "decision_log.json").write_text(json.dumps(dl, ensure_ascii=False, indent=2) + "\n")
print("d-005 appended")
