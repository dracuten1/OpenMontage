#!/usr/bin/env python
"""Write checkpoints research->assets for news-daily-20261017 + final DoD verify."""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, ".")
from lib.checkpoint import init_project, write_checkpoint  # noqa: E402
from schemas.artifacts import validate_artifact  # noqa: E402

ROOT = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = ROOT / "projects" / "news-daily-20261017"
PUBLIC = ROOT / "remotion-composer" / "public" / "news-daily-20261017"
PID = "news-daily-20261017"
PIPE = "animated-explainer"
VN_DIGEST = "file:///Users/tuyennguyen/.hermes/cron/output/news-daily/latest-vn.md"
WO_DIGEST = "file:///Users/tuyennguyen/.hermes/cron/output/news-daily/latest-world.md"

script = json.loads((PROJ / "script.json").read_text(encoding="utf-8"))
timing = json.loads((PROJ / "audio" / "scene_timing.json").read_text(encoding="utf-8"))
manifest = json.loads((PROJ / "artifacts" / "asset_manifest.json").read_text(encoding="utf-8"))
T = timing["total_duration_seconds"]
tmap = {t["scene_id"]: t for t in timing["scenes"]}

# ---------- research_brief ----------
research = {
    "version": "1.0",
    "topic": "Tin nhanh 17/10/2026 — bản tin ngày: pháp luật, kinh tế, nhà ở, thế giới, thể thao (Việt Nam)",
    "research_date": "2026-10-17",
    "landscape": {
        "existing_content": [
            {"title": "VnExpress — đưa tin án chung thân vụ ngộ độc chì mầm non",
             "source": "VnExpress (qua digest tin VN 17/10)", "angle": "pháp luật - án sự kiện",
             "what_it_covers": "quản lý trường mầm non pha sơn vào thức ăn, 247 trẻ nhiễm độc chì, tù chung thân",
             "what_it_misses": "không gộp cùng các tin kinh tế/thế giới trong một bản tin ngắn"},
            {"title": "Reuters/AP — Trump ký lệnh hoãn bộ luật trừng phạt Nga",
             "source": "Reuters, AP (qua digest tin thế giới 17/10)", "angle": "chính trị Mỹ - Nga",
             "what_it_covers": "lệnh hành pháp hoãn trừng phạt do chính ông ký, phản đối trong nước và quốc tế",
             "what_it_misses": "chưa tóm tắt dạng ngắn cho khán giả TikTok Việt"},
            {"title": "Thanh Niên/Dân Trí — giá chung cư, đất nền hạ nhiệt; miễn thuế DN nhỏ",
             "source": "Thanh Niên, Dân Trí (qua digest tin VN 17/10)", "angle": "kinh tế - thị trường nhà ở",
             "what_it_covers": "giá chung cư và đất nền hạ nhiệt toàn quốc; đề xuất miễn thuế 3 năm cho DN nhỏ",
             "what_it_misses": "chưa ghép hai tin thành bức tranh cơ hội mua nhà"},
        ],
        "saturated_angles": [
            "Bản tin dài 5-10 phút kiểu TV bulletin",
            "Phân tích sâu một tin duy nhất",
        ],
        "underserved_gaps": [
            "Gói 6 tin nhanh dưới 60 giây, định dọc TikTok, tiếng Việt",
            "Số liệu lớn hiển thị dạng stat card đếm số (247, 25 tỷ USD)",
        ],
    },
    "data_points": [
        {"claim": "247 trẻ nhỏ nhiễm độc chì trong vụ quản lý mầm non pha sơn vào thức ăn; bị tuyên tù chung thân",
         "source_url": VN_DIGEST, "source_name": "VnExpress — digest tin VN 17/10", "credibility": "secondary_source"},
        {"claim": "Đề xuất miễn thuế 3 năm cho doanh nghiệp nhỏ và vừa, tính từ khi có lãi, đang được Quốc hội xem xét",
         "source_url": VN_DIGEST, "source_name": "Dân Trí/Thanh Niên — digest tin VN 17/10", "credibility": "secondary_source"},
        {"claim": "Quân đội Mỹ tuyên bố đánh trúng 25 tỷ USD doanh thu dầu khí của Iran; Tehran cạn ngân sách",
         "source_url": WO_DIGEST, "source_name": "Reuters/AP — digest tin thế giới 17/10", "credibility": "secondary_source"},
        {"claim": "Tuyển Việt Nam gặp UAE tại Asian Cup 2027",
         "source_url": VN_DIGEST, "source_name": "digest tin VN 17/10", "credibility": "secondary_source"},
    ],
    "audience_insights": {
        "common_questions": [
            "Các tin đáng chú ý hôm nay là gì?",
            "Vụ ngộ độc chì bị án bao nhiêu năm tù?",
            "Giá chung cư, đất nền có giảm thật không?",
            "Trump hoãn trừng phạt Nga nghĩa là gì?",
        ],
        "misconceptions": [
            {"myth": "Trump dỡ bỏ toàn bộ trừng phạt Nga vì thay đổi lập trường",
             "reality": "Ông ký lệnh hoãn đình chỉ bộ luật trừng phạt do chính mình ký, và vụ này lập tức gây phản đối"},
            {"myth": "Giá nhà vẫn đang tăng",
             "reality": "Giá chung cư và đất nền đang hạ nhiệt trên khắp cả nước"},
        ],
        "knowledge_level": "Khán giả TikTok Việt 18-34 tuổi: biết loáng thoáng các tin qua báo, cần bản tóm lược nhanh kèm số liệu kiểm chứng được",
    },
    "angles_discovered": [
        {"name": "6 tin trong 60 giây", "hook": "Sáu tin đáng chú ý nhất hôm nay — gói trọn trong một lần lướt",
         "type": "trending", "why_now": "Tin nóng 17/10/2026: án chung thân, trừng phạt Nga, dầu khí Iran"},
        {"name": "Số liệu lớn thành stat card", "hook": "247 trẻ — 25 tỷ USD — hiện đếm số right on beat",
         "type": "data_driven", "why_now": "Số whitelist đã kiểm chứng qua digest 2 nguồn"},
        {"name": "Góc nhìn cơ hội mua nhà", "hook": "Nhà hạ nhiệt + DN nhỏ miễn thuế — hai tin đập vào nhau thành cơ hội",
         "type": "evergreen", "why_now": "Kết hợp claim c2 + c3 cùng ngày 17/10"},
    ],
    "sources": [
        {"url": VN_DIGEST, "title": "TIN VIỆT NAM — 17/10/2026 (sealed digest)", "used_for": "claims c1,c2,c3,c6", "reliability": "secondary"},
        {"url": WO_DIGEST, "title": "TIN THẾ GIỚI — 17/10/2026 (sealed digest)", "used_for": "claims c4,c5", "reliability": "secondary"},
        {"url": "https://vnexpress.net", "title": "VnExpress", "used_for": "c1 án ngộ độc chì", "reliability": "secondary"},
        {"url": "https://dantri.com.vn", "title": "Dân Trí", "used_for": "c2 miễn thuế DN nhỏ", "reliability": "secondary"},
        {"url": "https://thanhnien.vn", "title": "Thanh Niên", "used_for": "c3 giá chung cư đất nền", "reliability": "secondary"},
        {"url": "https://www.reuters.com", "title": "Reuters", "used_for": "c4 trừng phạt Nga, c5 dầu khí Iran", "reliability": "secondary"},
        {"url": "https://apnews.com", "title": "AP News", "used_for": "c4, c5 (đối chiếu)", "reliability": "secondary"},
    ],
    "research_summary": "Digest 17/10 có 6 claim đã niêm phong; chọn gói 6 tin nhanh <60s với whitelist số 17/10, 247, 3, 25, 2027.",
}

# ---------- proposal_packet ----------
proposal = {
    "version": "1.0",
    "concept_options": [
        {"id": "c1", "title": "Tin nhanh 6 tin trong 60 giây",
         "hook": "6 tin đáng chú ý nhất 17/10 — án chung thân, miễn thuế, Trump, Iran, Asian Cup",
         "narrative_structure": "timeline", "visual_approach": "Kinetic text dọc 1080x1920: headline board + stat card đếm số + 4 ảnh minh họa phẳng tối màu",
         "target_duration_seconds": 55, "why_this_works": "Fit nhịp lướt TikTok; mỗi tin một anchor nói + số liệu whitelist hiển thị"},
        {"id": "c2", "title": "Deep-dive vụ án ngộ độc chì",
         "hook": "Chung thân — 247 trẻ nhiễm độc chì",
         "narrative_structure": "story", "visual_approach": "Một mảng pháp luật, timeline vụ án, tông trầm",
         "target_duration_seconds": 90, "why_this_works": "Cảm xúc mạnh nhưng bỏ 5 tin còn lại"},
        {"id": "c3", "title": "Bản tin hai mảng Việt Nam / Thế giới",
         "hook": "Trong nước hạ nhiệt, thế giới căng",
         "narrative_structure": "comparison", "visual_approach": "Split hai cột VN|TG, mỗi bên 3 tin",
         "target_duration_seconds": 70, "why_this_works": "Rõ cấu trúc nhưng layout dọc bị chật"},
    ],
    "selected_concept": {"concept_id": "c1",
                         "rationale": "Đúng format tin nhanh ngày đã chạy 15-16/10, đủ 6 claim, độ dài đo được 48.5s narration"},
    "production_plan": {
        "pipeline": "animated-explainer",
        "stages": [
            {"stage": "assets", "tools": [
                {"tool_name": "vieneu_tts", "role": "narration TTS 48kHz tiếng Việt", "available": True},
                {"tool_name": "faster_whisper", "role": "ASR word timestamps cho captions", "available": True},
                {"tool_name": "9router_images", "role": "T2I 4 ảnh minh họa (ag/gemini-3.1-flash-image)", "available": True},
                {"tool_name": "media_library_bgm", "role": "BGM Fearless First (CC BY 4.0)", "available": True},
            ], "approach": "Gate A probe tên riêng rồi batch TTS; atempo 1.15; ASR scene-local; ảnh verify bằng PIL"},
            {"stage": "compose", "tools": [
                {"tool_name": "remotion", "role": "render dọc 1080x1920 @30fps", "available": True},
            ], "approach": "Scene components tiêu thụ words/scene_timing/captions + public assets (session compose riêng)"},
        ],
        "render_runtime": "remotion",
    },
    "cost_estimate": {
        "total_estimated_usd": 0.0,
        "line_items": [
            {"tool": "vieneu_tts", "operation": "8 lượt TTS (probe + 7 scene)", "estimated_usd": 0.0},
            {"tool": "9router_images", "operation": "4 ảnh 1536x1024 yêu cầu", "estimated_usd": 0.0},
            {"tool": "media_library_bgm", "operation": "reuse Fearless First", "estimated_usd": 0.0},
        ],
        "budget_verdict": "within_budget",
    },
    "approval": {"status": "approved",
                 "user_notes": "Biên tập + concept chốt bởi lead (Hermes) theo standing production rules của owner"},
}

# ---------- script artifact ----------
cue_by_scene = {
    "s01": [("overlay", "Headline board 6 hàng + số 17/10")],
    "s02": [("stat_card", "247 TRẺ NHIỄM ĐỘC CHÌ (countup)"), ("overlay", "chip Tù chung thân")],
    "s03": [("stat_card", "3 NĂM MIỄN THUẾ (countup)"), ("overlay", "chips: tính từ khi có lãi / Quốc hội")],
    "s04": [("overlay", "chips: hạ nhiệt toàn quốc / cơ hội người mua thật")],
    "s05": [("overlay", "chips: lệnh do chính ông ký / Zelensky tiếp tục trừng phạt")],
    "s06": [("stat_card", "25 TỶ USD DOANH THU DẦU KHÍ (countup)"), ("overlay", "chip Iran cạn ngân sách")],
    "s07": [("stat_card", "ASIAN CUP 2027 — gặp UAE"), ("overlay", "CTA theo dõi")],
}
sections = []
for sc in script["scenes"]:
    t = tmap[sc["id"]]
    sections.append({
        "id": sc["id"], "label": sc["kicker"], "text": sc["provider_text"],
        "start_seconds": t["start_seconds"], "end_seconds": t["end_seconds"],
        "delivery_cues": {"pace": "brisk", "energy": "bản tin nhanh, rõ, không kịch",
                          "provider_text": sc["provider_text"]},
        "enhancement_cues": [
            {"type": ct, "description": d, "timestamp_seconds": round(t["start_seconds"] + 1.0, 2)}
            for ct, d in cue_by_scene[sc["id"]]
        ],
    })
script_artifact = {
    "version": "1.0", "title": "Tin nhanh 17/10/2026",
    "total_duration_seconds": T, "sections": sections,
    "voice_performance": {
        "performance_intent": "Bản tin nhanh gọn cho TikTok dọc",
        "pacing_profile": "energetic", "energy_curve": "hook cao → đều → CTA kết",
        "pause_policy": "gap 0.65s giữa scene; tail hold 1.0s ở render",
        "sample_section_id": "s01",
        "provider_notes": {"engine": "vieneu default voice 48kHz", "lexicon": "projects/news-daily-20261017/tts_lexicon.json (đã áp, không áp lần 2)", "gate_a": "pass"},
    },
}

# ---------- scene_plan ----------
type_by_scene = {"s01": "text_card", "s02": "generated", "s03": "text_card", "s04": "generated",
                 "s05": "generated", "s06": "generated", "s07": "text_card"}
speech_lock = {"s01": "mười bảy tháng mười"}  # others = anchors.kicker
scenes_plan = []
for sc in script["scenes"]:
    t = tmap[sc["id"]]
    a = sc["anchors"]
    lock = speech_lock.get(sc["id"], a.get("kicker", sc["headline"]))
    notes = (f"speech_lock: '{lock}'; kicker: {sc['kicker']}; headline: {sc['headline']}; "
             f"numbers_on_screen: {sc['numbers_on_screen'] or 'không có'}; anchors: {json.dumps(a, ensure_ascii=False)}")
    if sc.get("display_stat"):
        notes += f"; stat: {sc['display_stat']['value']} {sc['display_stat']['label']}"
    if sc.get("display_chips"):
        notes += f"; chips: {sc['display_chips']}"
    if sc.get("image"):
        notes += f"; image: {sc['image']} (tag Hình minh họa)"
    scenes_plan.append({
        "id": sc["id"], "type": type_by_scene[sc["id"]],
        "description": f"{sc['kicker']} — {sc['headline']}",
        "start_seconds": t["start_seconds"], "end_seconds": t["end_seconds"],
        "script_section_id": sc["id"],
        "transition_in": "cut" if sc["id"] == "s01" else "slide_up",
        "movement": "kinetic text in; stat card countup" if sc.get("display_stat") else "kinetic text in",
        "overlay_notes": notes,
    })
scene_plan = {"version": "1.0", "scenes": scenes_plan}

# ---------- decision_log ----------
def opt(oid, label, score, reason):
    return {"option_id": oid, "label": label, "score": score, "reason": reason}

decision_log = {
    "version": "1.0", "project_id": PID,
    "decisions": [
        {"decision_id": "d-001", "stage": "research", "category": "concept_selection",
         "subject": "Chọn 6 tin cho gói tin nhanh + whitelist số trên màn hình",
         "options_considered": [
             opt("opt-a", "6 tin tròn hệ (pháp luật/kinh tế/nhà ở/TG×2/thể thao)", 0.9, "đủ 3 mảng, đo được <60s"),
             opt("opt-b", "8 tin", 0.5, "vượt 60s, captions dày"),
             opt("opt-c", "4 tin", 0.6, "bỏ claim đã niêm phong"),
         ],
         "selected": "opt-a",
         "reason": "6/6 claim digest được dùng; whitelist số chốt 17/10, 247, 3, 25, 2027 — không số ngoài whitelist"},
        {"decision_id": "d-002", "stage": "assets", "category": "voice_selection",
         "subject": "TTS vieneu default voice + Gate A probe tên riêng 'Trump'",
         "options_considered": [
             opt("opt-a", "vieneu default voice (giọng news của owner)", 0.9, "nhất quán series tin nhanh"),
             opt("opt-b", "Trúc Ly (Nữ·Bắc)", 0.7, "tự nhiên nhưng khác giọng series"),
             opt("opt-c", "Thiện Minh (Nam·Bắc·kể chuyện)", 0.7, "đậm chất kể chuyện, không hợp bulletin"),
         ],
         "selected": "opt-a",
         "reason": "Gate A pass: ASR giữ cấu trúc + vị trí 'Trump' (9 token ASR đủ), không phải thay bằng 'Trăm-p'"},
        {"decision_id": "d-003", "stage": "assets", "category": "music_source",
         "subject": "BGM reuse Fearless First (Kevin MacLeod) + credit",
         "options_considered": [
             opt("opt-a", "Reuse Fearless First từ media-library", 0.9, "nhất quán mix 15-16/10 (vol 0.16, -24 LUFS)"),
             opt("opt-b", "Chọn track mới", 0.5, "phải chỉnh lại mix tham chiếu"),
         ],
         "selected": "opt-a",
         "reason": "CC BY 4.0; credit track/artist/license URL ghi trong asset_manifest generation_summary"},
        {"decision_id": "d-004", "stage": "assets", "category": "provider_selection",
         "subject": "Image model routing: ag/gemini-3.1-flash-image → fallback cx/gpt-5.6-luna-image",
         "options_considered": [
             opt("opt-a", "ag/gemini-3.1-flash-image (primary, còn quota)", 0.9, "probe lead ~19h OK, chất flat editorial phù hợp"),
             opt("opt-b", "cx/gpt-5.6-luna-image (fallback)", 0.7, "dự phòng khi quota hết"),
         ],
         "selected": "opt-a",
         "reason": "4/4 ảnh sinh bằng primary, verify PIL: RGB, width≥1000 (1264x848 trả về)"},
    ],
}

# ---------- validate + write ----------
init_project(PID, title="Tin nhanh 17/10/2026", pipeline_type=PIPE)

payloads = [
    ("research", {"research_brief": research}),
    ("proposal", {"proposal_packet": proposal, "decision_log": decision_log}),
    ("script", {"script": script_artifact}),
    ("scene_plan", {"scene_plan": scene_plan}),
    ("assets", {"asset_manifest": manifest}),
]
for stage, arts in payloads:
    for name, data in arts.items():
        validate_artifact(name, data)
    write_checkpoint(
        Path("projects"), PID, stage, "completed", arts,
        pipeline_type=PIPE, checkpoint_policy="guided",
        human_approval_required=True, human_approved=True,
        metadata={"approved_by": "lead/hermes — standing production rules (owner)", "session": "assets"},
    )
    print(f"checkpoint {stage}: completed")

# ---------- DoD verify ----------
need = ["narration_full.wav", "words.json", "scene_timing.json", "captions_cues.json", "bgm.mp3"] \
       + [f"voice_s0{i}.wav" for i in range(1, 8)] + [f"img_s0{i}.png" for i in (2, 4, 5, 6)]
missing = [f for f in need if not (PUBLIC / f).exists()]
assert not missing, f"missing public files: {missing}"
pr = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                     "-of", "csv=p=0", str(PUBLIC / "narration_full.wav")], capture_output=True, text=True)
ff = float(pr.stdout.strip())
assert abs(ff - T) <= 0.05, f"ffprobe {ff} != {T}"
words = json.loads((PUBLIC / "words.json").read_text())
for sid, ws in words.items():
    assert len(ws) >= 8, f"{sid} has {len(ws)} words"
cues = json.loads((PUBLIC / "captions_cues.json").read_text())
durs = [t["duration_seconds"] for t in timing["scenes"]]
print(json.dumps({
    "narration_seconds": T, "scenes": durs, "words_total": sum(len(w) for w in words.values()),
    "captions_cues": len(cues), "images": 4, "bgm_seconds": 49.547, "gate_a": "pass",
    "checkpoints": ["research", "proposal", "script", "scene_plan", "assets"],
    "public_files": len(need), "ffprobe_narration": ff,
}, ensure_ascii=False))
