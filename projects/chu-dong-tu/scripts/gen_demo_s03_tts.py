#!/usr/bin/env python
"""S2E03 demo s03 — TTS provider_text của s03 (đúng chuẩn lexicon: số chữ, ' ... ' pause)."""
import subprocess
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = REPO / "projects" / "chu-dong-tu"
AUD = PROJ / "assets" / "audio"
PUB = REPO / "remotion-composer" / "public" / "chu-dong-tu"
for d in (AUD, PUB):
    d.mkdir(parents=True, exist_ok=True)

TEXT = (
    "Trước khi hỏi vì sao người ta thờ, phải biết người ấy nghèo đến mức nào. "
    "Bản kể chép lại gia cảnh ấy bằng vài dòng rất gọn. "
    "Cha từ, con hiếu, nhà gặp hỏa hoạn, của cải sạch không, chỉ còn lại một khố vải duy nhất, "
    "cha con ra vào thay nhau mà mặc. ... Một vụ cháy. Của cải sạch không. "
    "Cha và con, hai người, thay nhau mặc một chiếc khố duy nhất. ... Rồi người cha lâm bệnh. "
    "Trước khi mất, ông dặn con ... Cha chết cứ để trần mà chôn, giữ khố lại cho con, để khỏi xấu hổ. ... "
    "Để trần mà chôn, đổi lấy cho con một lớp che thân khi ra khỏi nhà. "
    "Nhưng người con không nỡ làm theo, liệm khố rồi đem chôn."
)

wav = AUD / "demo_s03.wav"
r = subprocess.run(
    [str(REPO / ".venv/bin/python"), "-m", "tools.audio.vieneu_tts",
     "--text", TEXT, "--output", str(wav), "--threads", "6"],
    capture_output=True, text=True, cwd=str(REPO), timeout=900)
print("TTS rc:", r.returncode)
if r.returncode != 0:
    print(r.stderr[-400:]); raise SystemExit(1)

import wave
with wave.open(str(wav), "rb") as w:
    dur = w.getnframes() / w.getframerate()
    print(f"wav: {wav} — {dur:.2f}s @ {w.getframerate()}Hz")
import shutil
shutil.copy(wav, PUB / "demo_s03.wav")
print("copied →", PUB / "demo_s03.wav")
