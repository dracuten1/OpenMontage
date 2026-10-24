#!/usr/bin/env python
"""S2E03 — d-008: demo scene s03 delivered (draft HUD), dừng ở demo gate awaiting_human."""
import json
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
dl_path = P / "decision_log.json"
dl = json.loads(dl_path.read_text())
if "d-008" not in {d["decision_id"] for d in dl["decisions"]}:
    dl["decisions"].append({
        "decision_id": "d-008",
        "stage": "edit",
        "category": "demo_gate",
        "subject": "Demo scene s03 'Một chiếc khố cho hai người' rendered draft HUD — chờ owner duyệt demo gate",
        "options_considered": [
            {"option_id": "deliver_demo", "label": "Render 720p HUD 34s + scene index + TG DM, dừng awaiting_human", "score": 0.95,
             "reason": "Đúng demo-first gate; assets tối thiểu (1 TTS 30.73s + 1 ảnh probe vision-QC PASS)."},
        ],
        "selected": "deliver_demo",
        "reason": (
            "TTS vieneu 30.73s; ảnh 9router ag/gemini-3.1-flash-image (JPEG 1024x1024, đổi đuôi .jpg đúng format); "
            "Demo.tsx 345 dòng (CC, tsc 0 lỗi) + ChuDongTuDemo registered; render 1280x720@30 34.05s 2.3MB crf26. "
            "Vision QC PASS: panel ink đúng style, quote card 2 dòng không còn '/', captions NGUYÊN VĂN s03 (14 cue — "
            "đã thay caption CC tự bịa sai biến thể truyện), HUD s03 f/1020. Ghi chú: 37 file public của project "
            "archived bị xóa trên branch latest làm gãy bundle — đã stub tối thiểu (gen_public_stubs.py) để build, "
            "KHÔNG render composition archived với stub."
        ),
        "user_visible": True,
        "user_approved": False,
        "confidence": 0.9,
    })
    dl_path.write_text(json.dumps(dl, ensure_ascii=False, indent=2) + "\n")
print("decision_log:", len(dl["decisions"]), "decisions (+d-008 demo gate)")
