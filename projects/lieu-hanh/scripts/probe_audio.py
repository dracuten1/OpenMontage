#!/usr/bin/env python3
"""Gate A TTS probe for lieu-hanh: proper names + s01 sample (vieneu default series voice).
Outputs assets/audio/probe/*.wav + probe_report.json. ASR cross-check via Transcriber."""
import json, sys, time
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))
from tools.tool_registry import registry

registry.discover()
tts = registry._tools["vieneu_tts"]

P = OM / "projects" / "lieu-hanh"
OUT = P / "assets" / "audio" / "probe"
OUT.mkdir(parents=True, exist_ok=True)

PROBES = [
    ("p01", "Phủ Dầy"),
    ("p02", "Vân Cát, Yên Thái, An Thái"),
    ("p03", "đèo Ngang, phố Cát"),
    ("p04", "núi Sùng Sơn"),
    ("p05", "nền Nam Giao"),
    ("p06", "Phùng Khắc Khoan, Trạng Bùng"),
    ("p07", "Liễu Hạnh Công Chúa, Mẫu nghi thiên hạ"),
    ("p08", "Chế-thắng bảo hòa-diệu đại vương, Mã-vàng công chúa"),
    ("p09", "Addis Ababa, Ethiopia"),
    ("p10", "Quảng Cung linh từ phả ký, Vũ trung tùy bút"),
    ("s01", None),  # full section sample from approved script
]

script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))
s01 = next(s for s in script["sections"] if s["id"] == "s01")
probes = [(pid, txt) for pid, txt in PROBES if txt] + [("s01", s01["delivery_cues"]["provider_text"])]

report = []
for pid, text in probes:
    out = OUT / f"{pid}.wav"
    t0 = time.time()
    r = tts.execute({"text": text, "output_path": str(out), "threads": 6})
    entry = {"id": pid, "text": text[:120], "ok": r.success, "wav": str(out),
             "audio_seconds": (r.data or {}).get("audio_seconds") if r.success else None,
             "error": r.error, "wall_s": round(time.time() - t0, 1)}
    report.append(entry)
    print(pid, "OK" if r.success else f"FAIL {r.error}", entry["audio_seconds"], f'{entry["wall_s"]}s')

(P / "qc" / "probe_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
fails = [e for e in report if not e["ok"]]
print(f"PROBE {'PASS' if not fails else 'FAIL'}: {len(report)-len(fails)}/{len(report)} ok")
sys.exit(1 if fails else 0)
