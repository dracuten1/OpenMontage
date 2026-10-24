#!/usr/bin/env python
"""S2E02 Gate A probe: isolate các địa danh/số rủi ro (Phù Đổng, Võ Giàng, Kiến Sơ, Vệ Linh,
Đằng Ngà, Ninh Sóc, Soi Bia, Mộc Dục, cầu húc, hai trượng, số 1329/1313/1492) — mỗi clip
1 cụm, ASR riêng theo pattern probe_gate_a_v3 (S2E01 d-004): isolate sai → respell; isolate
đúng → giữ nguyên văn trong provider_text (lỗi whisper chỉ là context confusion)."""
import json
import subprocess
import sys
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = REPO / "projects" / "thanh-giong"
OUT = PROJ / "artifacts" / "probes"
PY = str(REPO / ".venv" / "bin" / "python")
OUT.mkdir(parents=True, exist_ok=True)

CLIPS = [
    ("phu_dong", "Phù Đổng. Phù Đổng."),
    ("phu_dong_ctx", "hội Gióng ở đền Phù Đổng, xã Phù Đổng, Gia Lâm."),
    ("vo_giang", "Võ Giàng. Võ Ninh. huyện Võ Giàng."),
    ("kien_so", "Kiến Sơ. chùa Kiến Sơ."),
    ("ve_linh", "Vệ Linh. làng Vệ Linh."),
    ("dang_nga", "Đằng Ngà. tre Đằng Ngà."),
    ("nhinh_soc", "Ninh Sóc. núi Ninh Sóc."),
    ("soc", "Sóc. đền Sóc. núi Sóc."),
    ("soi_bia", "Soi Bia. bãi Soi Bia."),
    ("moc_duc", "Mộc Dục. lễ Mộc Dục."),
    ("cau_huc", "cầu húc. vật cầu húc."),
    ("tien_du", "Tiên Du. huyện Tiên Du."),
    ("gia_binh", "Gia Bình. huyện Gia Bình."),
    ("hai_truong", "hai trượng. cao hơn hai trượng."),
    ("nam_1329", "một nghìn ba trăm hai mươi chín. Năm một nghìn ba trăm hai mươi chín."),
    ("nam_1313", "một nghìn ba trăm mười ba."),
    ("gio_ong", "Gióng. Thánh Gióng. Đức Thánh Gióng."),
    ("thien_tuong", "Ta là thiên tướng nhà Trời đây."),
]

sys.path.insert(0, str(REPO))
from tools.analysis.transcriber import Transcriber  # noqa: E402
tr = Transcriber()

report = {}
for key, text in CLIPS:
    wav = OUT / f"g2_{key}.wav"
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

(OUT / "gate_a_s2e02_result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))

def h(k):
    return report.get(k, {}).get("heard", "").lower()

v = []
v.append(("phu_dong", ("phù đồng" in h("phu_dong")) or ("phù đống" in h("phu_dong")) or ("phù đô" in h("phu_dong")) or ("phù đông" in h("phu_dong"))))
v.append(("vo_giang", ("giàng" in h("vo_giang")) or ("võ giàng" in h("vo_giang")) or ("võ giang" in h("vo_giang"))))
v.append(("kien_so", ("kiến s" in h("kien_so"))))
v.append(("ve_linh", ("vệ linh" in h("ve_linh")) or ("vệ lanh" in h("ve_linh"))))
v.append(("dang_nga", ("ngà" in h("dang_nga")) or ("ngá" in h("dang_nga"))))
v.append(("nhinh_soc", ("sóc" in h("nhinh_soc")) or ("sốc" in h("nhinh_soc"))))
v.append(("soi_bia", ("bia" in h("soi_bia"))))
v.append(("moc_duc", ("dục" in h("moc_duc")) or ("dực" in h("moc_duc"))))
v.append(("cau_huc", ("húc" in h("cau_huc")) or ("hừng" in h("cau_huc"))))
v.append(("hai_truong", ("trượng" in h("hai_truong")) or ("trướng" in h("hai_truong")) or ("trương" in h("hai_truong"))))
v.append(("1329_chu", ("ba trăm hai mươi chín" in h("nam_1329"))))
v.append(("gio_ong", ("gióng" in h("gio_ong"))))
print("\nVERDICT:", v)
print("RESPELL_NEEDED:", [k for k, ok in v if not ok])
