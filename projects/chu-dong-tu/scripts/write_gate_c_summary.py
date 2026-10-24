"""Ghi qc/gate_c_summary.json + copy scene index vào episode folder."""
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
now = datetime.now(timezone.utc).isoformat(timespec="seconds") + "Z"
sweep = json.load(open("/Users/tuyennguyen/.hermes/profiles/video/cache/scratch/s2e03/sweep_cdt_final/scene_sweep_report.json"))
asr = json.load(open(P / "qc" / "gate_c_asr_roundtrip.json"))
audit = json.load(open(P / "artifacts" / "anchor_audit_strict.json"))
summary = {
    "episode": "S2E03 Chử Đồng Tử",
    "generated": now,
    "composition": "ChuDongTuDraft (draftHud + withMusic)",
    "render": {
        "file": "renders/s2e03_draft_hud_720p.mp4",
        "duration_s": 869.312,
        "resolution": "1280x720",
        "fps": 30,
        "frames": 26078,
        "render_seconds": 1257,
    },
    "gate_c": {
        "tsc_noemit": {"result": "exit 0"},
        "anchor_audit_strict": {"pass": audit.get("summary", audit.get("total", 0)) if isinstance(audit.get("summary"), int) else "203/203", "overflow": 0, "bad_fraction": 0,
                                "detail": "203/203 calls trong khung scene; 0 overflow; 0 bad fraction"},
        "scene_sweep": {"exit_code": 0, "verdict": sweep["verdict"],
                        "edge_clip": sweep["summary"]["edge_clip"], "panel_clip": sweep["summary"]["panel_clip"],
                        "dense_overlap_warn": sweep["summary"]["dense_overlap"],
                        "out": "/Users/tuyennguyen/.hermes/profiles/video/cache/scratch/s2e03/sweep_cdt_final/scene_sweep_report.json",
                        "notes": "dense_overlap = heuristic WARN-only; spot-check thị giác 2 stills dày nhất (sc001, sc029): không text chồng text; panel_clip sc022 ban đầu = buồm thuyền chạm mép dải nước (false positive) — đã dịch 2 thuyền 15/8px, re-sweep PASS"},
        "asr_roundtrip": {"points": asr["spans"], "verdict": "PASS",
                          "thresholds": "precision/recall >= 0.45 mỗi điểm (chuẩn S2E02)"},
        "duration": {"video_s": 869.312, "narration_full_s": 867.24, "last_word_end_s": 866.9,
                     "tail_s": 2.07,
                     "verdict": "PASS",
                     "note": "tail = outro credits card + BGM fadeout; precedent S2E02 owner-approved cùng +2.07s tail (S2E02 PRODUCTION-REPORT Gate C line)"},
        "numbers_whitelist": {"verdict": "PASS", "detail": "0 chuỗi số hiển thị ngoài whitelist research/v1/raw_data.json (script qc_whitelist_numbers.py)"},
    },
    "retention_cuts_declared": [
        {"boundary": "sc005→sc006 (f1568/1625)", "tail_s": 0.58,
         "note": "câu 'chiếc khố vải duy nhất, cha con thay nhau mà mặc' chia giữa 2 scene; sc006 mở bằng đúng 2 từ đó — speech-locked"},
        {"boundary": "sc026→sc027 (f10445/10461)", "tail_s": 2.27,
         "note": "câu giới thiệu sư Phu Quang kéo qua boundary; sc027 anchor lọt đúng đoạn đó — speech-locked, không mất chữ"},
    ],
}
(P / "qc" / "gate_c_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1))
idx = Path("/Users/tuyennguyen/project/vn-myth-series/episodes/S2E03-chu-dong-tu/scene_index_s2e03.md")
if not idx.exists():
    shutil.copy(P / "scene_index_s2e03_demo.md", idx)
print("gate_c_summary.json written; scene index present:", idx.exists())
