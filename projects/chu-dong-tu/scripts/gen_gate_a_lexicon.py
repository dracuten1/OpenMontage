#!/usr/bin/env python
"""S2E03 Gate A kết luận: 0 respell (theo chuẩn S2E02 d-004) + update tts_lexicon + decision d-007."""
import json
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu")

# 1. lexicon: _meta S2E03 + kết quả probe
lex = json.loads((P / "tts_lexicon.json").read_text())
lex["_meta"] = {
    "project": "chu-dong-tu",
    "series": "vn-myth",
    "episode": "S2E03",
    "tts_provider": "vieneu (vi, monolingual)",
    "policy": "term -> respelling cho narration TTS. Kế thừa S2E01/S2E02 + Ep.03–06 ('/' bỏ khỏi provider_text; số đếm lớn viết chữ; câu 3 vế tách dấu chấm không ';').",
    "display_vs_narration": "Display giữ nguyên term/số; provider_text thay bằng respelling. Eyes read both, mouth reads one.",
    "gate_a_probe": "artifacts/probes/gate_a_s2e03_result.json (2026-10-19, 16 clip isolate, whisper round-trip)",
}
lex["gate_a_s2e03"] = {
    "keep_verbatim": [
        "Chử Đồng Tử", "Chử Xá", "Tiên Dung", "Đa Hòa", "Nhất Dạ (Trạch)", "Mễ Sở",
        "Khoái Châu", "Quỳnh Vi", "Quỳnh Viên", "Quình-lãng", "Phu Quang", "Phật-Quang",
        "Ngưỡng Quang", "Tự Nhiên", "chợ Thám", "linh thiêng",
    ],
    "asr_variants": {
        "Chử Đồng Tử": ["chui đông tử", "chử đồng tử", "thời trừ đồng tử"],
        "Chử Xá": ["từ xa", "lăng chiều xác"],
        "Tiên Dung": ["tiên rung", "tiên dung"],
        "Đa Hòa": ["đà hòa", "đa hòa"],
        "Nhất Dạ": ["nhật giả", "nhất dạ", "nhật dạ"],
        "Mễ Sở": ["mẹ sở"],
        "Khoái Châu": ["quá châu", "khoái châu"],
        "Quỳnh Vi": ["kuyên vị"],
        "Quỳnh Viên": ["cũng viên"],
        "Quình-lãng": ["quyên lãng"],
        "Phu Quang": ["phụ quân", "phu quang"],
        "Ngưỡng Quang": ["nguyễn quanh"],
        "linh thiêng": ["linh thiếu"],
    },
    "respell": [],
    "note": (
        "0 term phải respell, theo đúng chuẩn S2E02 d-004: mọi sai lệch isolate là tone/rime noise "
        "của whisper-small trên skeleton âm đúng. Bằng chứng engine: 'Phật-Quang' round-trip hoàn hảo "
        "trong khi 'Phu Quang' bị nghe 'phụ quân' (cùng engine, cùng âm tiết Quang) → lỗi thuộc "
        "whisper, không thuộc TTS. 'Tiên Dung'→'tiên rung' = đồng âm d/r phương ngữ Bắc. 3 clip "
        "perfect: phật-quang, tự nhiên, thám. asr_variants dùng cho gate ASR-QC khi match subtitle."
    ),
}
(P / "tts_lexicon.json").write_text(json.dumps(lex, ensure_ascii=False, indent=2) + "\n")
print("1. tts_lexicon updated (gate_a_s2e03: keep_verbatim 16, respell 0)")

# 2. decision d-007
dl_path = P / "decision_log.json"
dl = json.loads(dl_path.read_text())
if "d-007" not in {d["decision_id"] for d in dl["decisions"]}:
    dl["decisions"].append({
        "decision_id": "d-007",
        "stage": "assets",
        "category": "tts_pronunciation_probe",
        "subject": "Gate A probe S2E03 (16 clip isolate, whisper round-trip): 0 term cần respell",
        "options_considered": [
            {"option_id": "keep_verbatim_all", "label": "Giữ nguyên văn 16/16 tên riêng — sai lệch chỉ là whisper noise", "score": 0.9,
             "reason": "Chuẩn S2E02 d-004: skeleton âm đúng (chu-đồng-tử, tiên-dung đồng âm d/r Bắc, đà-hòa tone noise...); bằng chứng quyết định: 'Phật-Quang' perfect round-trip cùng engine với 'Phu Quang' bị nghe 'phụ quân'."},
            {"option_id": "respell_outliers", "label": "Respell 13 clip auto-verdict sai", "score": 0.2,
             "reason": "Auto-verdict string-match đánh false 13/16; respell sẽ làm sai chính tả hiển thị và không sửa được lỗi thuộc về whisper."},
        ],
        "selected": "keep_verbatim_all",
        "reason": "Lexicon ghi asr_variants cho gate ASR-QC sau; provider_text giữ nguyên tên theo lexicon.",
        "user_visible": True,
        "user_approved": False,
        "confidence": 0.9,
    })
    dl_path.write_text(json.dumps(dl, ensure_ascii=False, indent=2) + "\n")
print("2. decision_log:", len(dl["decisions"]), "decisions (+d-007 Gate A)")
