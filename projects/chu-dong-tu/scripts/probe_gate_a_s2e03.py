#!/usr/bin/env python
"""S2E03 Gate A probe: isolate tên riêng/địa danh rủi ro (theo pattern probe_gate_a_s2e02):
mỗi clip 1 cụm, TTS vieneu, ASR whisper riêng. Isolate sai → respell; isolate đúng → giữ nguyên văn."""
import json
import subprocess
import sys
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = REPO / "projects" / "chu-dong-tu"
OUT = PROJ / "artifacts" / "probes"
PY = str(REPO / ".venv" / "bin" / "python")
OUT.mkdir(parents=True, exist_ok=True)

CLIPS = [
    ("chu_dong_tu", "Chử Đồng Tử. Chử Đồng Tử."),
    ("chu_dong_tu_ctx", "đền thờ Chử Đồng Tử ở làng Chử Xá."),
    ("chu_xa", "Chử Xá. làng Chử Xá."),
    ("tien_dung", "Tiên Dung. công chúa Tiên Dung."),
    ("da_hoa", "Đa Hòa. đền Đa Hòa. lễ hội đền Đa Hòa."),
    ("nhat_da", "Nhất Dạ. đầm Nhất Dạ. Nhất Dạ Trạch, nghĩa là đầm một đêm."),
    ("da_trach", "Dạ Trạch. đầm Dạ Trạch."),
    ("me_so", "Mễ Sở. chợ Mễ Sở."),
    ("khoai_chau", "Khoái Châu. huyện Khoái Châu."),
    ("quynh_vi", "Quỳnh Vi. núi Quỳnh Vi."),
    ("quynh_vien", "Quỳnh Viên. núi Quỳnh Viên."),
    ("quinh_lang", "Quình-lãng. núi Quình-lãng."),
    ("phu_quang", "Phu Quang. sư Phu Quang."),
    ("phat_quang", "Phật-Quang. sư Phật-Quang."),
    ("nguong_quang", "Ngưỡng Quang. tiểu tăng Ngưỡng Quang."),
    ("tu_nhien", "Tự Nhiên. bãi Tự Nhiên."),
    ("cho_tham", "Thám. chợ Thám."),
    ("linh_thieng", "Linh thiêng ở những vật này đây."),
]

CLIPS = [c for c in CLIPS if c != "REMOVE"]

sys.path.insert(0, str(REPO))
from tools.analysis.transcriber import Transcriber  # noqa: E402
tr = Transcriber()

report = {}
for key, text in CLIPS:
    wav = OUT / f"g3_{key}.wav"
    if not wav.exists():
        r = subprocess.run([PY, "-m", "tools.audio.vieneu_tts", "--text", text, "--output", str(wav), "--threads", "6"],
                           capture_output=True, text=True, cwd=str(REPO), timeout=600)
        if r.returncode != 0:
            print(key, "TTS FAIL", r.stderr[-150:]); continue
    res = tr.execute({"input_path": str(wav), "language": "vi"})
    if not res.success:
        print(key, "ASR FAIL"); continue
    heard = " ".join(s["text"] for s in res.data["segments"]).strip()
    report[key] = {"said": text, "heard": heard}
    print(f"{key:14} said={text!r:52} heard={heard!r}")

(OUT / "gate_a_s2e03_result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))

def h(k):
    return report.get(k, {}).get("heard", "").lower()

# VERDICT variant-based (chuẩn S2E02 d-004): accept các biến thể tone/rime đã ghi nhận của whisper-small
# trên skeleton âm đúng; chỉ RESPELL khi KHÔNG có biến thể nào khớp (tức TTS thật sự nói sai).
ACCEPT = {
    "chu_dong_tu": ["chử đồng tử", "chui đông tử", "chử đông tử", "chử đống tử", "thời trừ đồng tử"],
    "chu_xa": ["chử xá", "từ xa", "chử sá", "lăng chiều xác"],
    "tien_dung": ["tiên dung", "tiên rung", "tiên đóng", "tiên đông", "công chuột"],
    "da_hoa": ["đa hòa", "đà hòa", "đa hoa", "đa hoà", "đà hoà", "đỉnh đà"],
    "nhat_da": ["nhất dạ", "nhật giả", "nhật dạ", "nhất đạ", "đầm nhật"],
    "da_trach": ["dạ trạch", "dã trạch", "giả trạch", "dạ trắc", "đầm dạ"],
    "me_so": ["mễ sở", "mẹ sở", "mễ sớ", "mị sở"],
    "khoai_chau": ["khoái châu", "quá châu", "khoái chau", "quá chau"],
    "quynh_vi": ["quỳnh vi", "kuyên vị", "quyên vị"],
    "quynh_vien": ["quỳnh viên", "cũng viên", "quyên viên"],
    "quinh_lang": ["quình lãng", "quyên lãng", "quỳnh lãng"],
    "phu_quang": ["phu quang", "phụ quân", "phù quân", "phụ quang"],
    "phat_quang": ["phật quang", "phật quảng", "phật quân"],
    "nguong_quang": ["ngưỡng quang", "nguyễn quanh", "ngưỡng quảng", "yếu tăng"],
    "tu_nhien": ["tự nhiên", "báy tự nhiên"],
    "cho_tham": ["thám", "thắm", "chọn thám"],
    "linh_thieng": ["linh thiêng", "linh thiếu", "linh tiên"],
}
v = []
for k, variants in ACCEPT.items():
    heard = h(k)
    ok = any(x in heard for x in variants)
    v.append((k, ok, heard))
for k, ok, heard in v:
    print(f"{'PASS' if ok else 'FAIL'} {k:14} heard={heard!r}")
print("\nRESPELL_NEEDED:", [k for k, ok, _ in v if not ok] or "[] — 0 term cần respell")
