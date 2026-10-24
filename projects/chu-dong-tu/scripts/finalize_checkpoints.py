"""FINAL: hoàn tất checkpoints (assets/edit/compose completed) + checkpoint_publish human_approved + decision_log FINAL."""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")
now = datetime.now(timezone(timedelta(hours=7))).isoformat(timespec="seconds")
STAMP = now

def set_current(name, patch):
    p = P / f"checkpoint_{name}.json"
    obj = json.loads(p.read_text())
    cur = dict(obj.get("current", {}))
    cur.update(patch)
    cur["ts"] = STAMP
    obj["current"] = cur
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=1))
    print(name, "→", cur.get("status"), cur.get("human_approved", ""))

set_current("assets", {"status": "completed"})
set_current("edit", {"status": "completed"})
set_current("compose", {"status": "completed"})

pub = {
    "current": {
        "id": f"ck_publish_{STAMP}",
        "ts": STAMP,
        "stage": "publish",
        "status": "completed",
        "human_approved": True,
        "approval": "Owner terse-approve 'Duyệt' trên bản tóm tắt Gate C (draft HUD toàn tập, TG msg 384-386) — 2026-10-19",
        "scope": "FINAL render từ đúng nguồn draft (ChuDongTuDraft, draftHud=false); KHÔNG regenerate TTS/ảnh; KHÔNG auto-post (owner tự upload)",
        "master": "renders/s2e03_final_1080p.mp4",
        "preview": "renders/s2e03_final_720p.mp4",
    },
    "history": [],
}
(P / "checkpoint_publish.json").write_text(json.dumps(pub, ensure_ascii=False, indent=1))
print("publish checkpoint written, human_approved=true")

dl = json.loads((P / "decision_log.json").read_text())
dl["decisions"].append({
    "id": "final_render_approved", "ts": STAMP,
    "context": "Owner APPROVE draft toàn tập → FINAL",
    "decisions": [
        "Final = ChuDongTuDraft với --props draftHud:false (đúng nguồn đã duyệt; KHÔNG regenerate TTS/ảnh/timing)",
        "Master 1080p crf 22 + preview 720p (nén ffmpeg nếu >50MB, pattern draft)",
        "Draft files giữ nguyên rollback (không ghi đè)",
        "QC final: ffprobe + loudness ±0.5LU vs draft + vision 3 điểm (không ASR lại — nguồn không đổi)",
        "KHÔNG auto-post; owner tự upload",
    ],
})
(P / "decision_log.json").write_text(json.dumps(dl, ensure_ascii=False, indent=1))
print("decision_log:", len(dl["decisions"]), "entries")
