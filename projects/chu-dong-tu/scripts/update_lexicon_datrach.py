"""Cập nhật tts_lexicon.json: thêm Dạ Trạch PASS bằng evidence whisper-medium beam5."""
import json
from pathlib import Path

P = Path("projects/chu-dong-tu/tts_lexicon.json")
lex = json.loads(P.read_text())
ga = lex["gate_a_s2e03"]
if "Dạ Trạch" not in ga["keep_verbatim"]:
    ga["keep_verbatim"].append("Dạ Trạch")
ga["asr_variants"]["Dạ Trạch"] = ["dạ chạy", "dạ trạch", "đầm dạ trạch"]
ga["da_trach_evidence"] = (
    "whisper-small nghe 'dạ chạy' (rime noise) → kiểm độc lập whisper-medium beam5: "
    "'Dạ Trạch, Đầm Dạ Trạch' = TTS đọc ĐÚNG → keep_verbatim (2026-10-19)"
)
P.write_text(json.dumps(lex, ensure_ascii=False, indent=2))
print("lexicon updated:", len(ga["keep_verbatim"]), "terms keep_verbatim, 0 respell")
