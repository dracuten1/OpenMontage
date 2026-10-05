"""Publish script for news-20261004."""
import json
import sys
from pathlib import Path

REPO_ROOT = Path("/Users/tuyennguyen/project/OpenMontage")
PROJECT_ROOT = REPO_ROOT / "projects" / "news-20261004"
sys.path.insert(0, str(REPO_ROOT))

import jsonschema
from tools.tool_registry import registry
from lib.checkpoint import write_checkpoint

def run_publish():
    # 1. SEO Metadata preparation
    title = "Chốt tuần 04/10: GDP 9,95%, Lãi suất chênh 2%, Vàng giảm sâu"
    print(f"Title: {title} (len={len(title)})")
    assert len(title) <= 60, f"Title too long: {len(title)}"

    hook = "GDP quý 3 bứt phá 9,95%, lãi suất chênh 2%, vàng hạ nhiệt. Túi tiền của bạn biến động ra sao? Điểm nhanh 5 tin kinh tế tài chính nổi bật tuần 04/10."
    print(f"Hook len={len(hook)}")
    assert len(hook) <= 150, f"Hook too long: {len(hook)}"

    description_body = """GDP quý 3 bứt phá 9,95%, lãi suất chênh 2%, vàng hạ nhiệt. Túi tiền của bạn biến động ra sao? Điểm nhanh 5 tin kinh tế tài chính nổi bật tuần 04/10.

Bản tin tài chính thực chiến tuần 04/10 tổng hợp 5 biến số kinh tế trọng yếu và tác động trực tiếp tới túi tiền của người đi làm:

1. GDP quý III/2026 bứt phá 9,95%, 9 tháng tăng 9,01% - mức cao kỷ lục nhiều năm nhờ lực đẩy từ công nghiệp chế biến chế tạo, đầu tư công và dịch vụ.
2. Giá xăng dầu biến động trái chiều: Xăng E5 tăng nhẹ 172đ/lít, dầu diesel giảm mạnh 780đ/lít giúp hạ áp lực chi phí vận tải, logistics.
3. Lãi suất tiết kiệm 12 tháng phân hóa mạnh: Khối Big4 ở mức 5,9%/năm trong khi khối ngân hàng TMCP tư nhân lên đến 7,8%/năm, chênh gần 2 triệu đồng tiền lãi mỗi năm cho khoản gửi 100 triệu.
4. Giá vàng SJC chốt tuần ở 143,5 triệu đồng/lượng sau tuần sụt giảm gần 3%, người lướt sóng mua đuổi trước đó chịu khoản lỗ 3,9 - 8,5 triệu đồng/lượng.
5. Khảo sát GenAI & việc làm: 20,8% lao động chịu tác động nhưng dưới 2% đối mặt nguy cơ thay thế; 27,9% người đi làm chủ động dùng công nghệ nâng cao hiệu suất.

📌 Gói hành động tuần này:
- Rà soát kỳ hạn gửi tiết kiệm 12 tháng để tối ưu lãi suất thực nhận.
- Tuyệt đối không mua đuổi vàng sau tuần sụt giảm, giữ vững kỷ luật đầu tư.
- Dành 30 phút mỗi tuần làm chủ thêm một công cụ AI phục vụ công việc.

👉 Đăng ký kênh để cập nhật phân tích kinh tế - tài chính thực chiến hữu ích mỗi tuần! Hãy để lại bình luận góc nhìn của bạn về thị trường tuần này.

⚠️ Lưu ý: Nội dung chỉ mang tính tham khảo, không phải lời khuyên đầu tư."""

    tags = [
        "kinh tế việt nam",
        "tài chính cá nhân",
        "gdp việt nam",
        "lãi suất tiết kiệm",
        "giá vàng sjc",
        "giá xăng dầu",
        "thị trường việc làm",
        "tin tức tài chính"
    ]

    hashtags = [
        "#taichinh",
        "#kinhtevietnam",
        "#laisuat",
        "#giavang"
    ]

    chapters = [
        {"start_seconds": 0.0, "title": "Tổng quan biến động kinh tế tuần 04/10"},
        {"start_seconds": 9.701, "title": "GDP quý III bứt phá 9,95%"},
        {"start_seconds": 23.199, "title": "Giá xăng dầu trái chiều"},
        {"start_seconds": 38.522, "title": "Lãi suất tiết kiệm chênh gần 2%"},
        {"start_seconds": 52.954, "title": "Giá vàng chốt tuần & bài toán bắt đáy"},
        {"start_seconds": 66.4, "title": "Làn sóng GenAI & thị trường việc làm"},
        {"start_seconds": 81.645, "title": "Nhận định: Vĩ mô & Đời sống"},
        {"start_seconds": 91.905, "title": "Nhận định: Công việc & Rủi ro"},
        {"start_seconds": 101.338, "title": "Gói hành động tối ưu túi tiền"}
    ]

    thumbnail_concept = {
        "concept": "Dark editorial finance desk layout. Left: prominent glowing stat badge '+9,95% GDP' on #161B22 card with emerald green accent #34D399. Right: split comparison cards showing 'Lãi suất 7,8%' in amber #FBBF24 and 'Vàng SJC' downward trend arrow in red #F87171. High-contrast typography overlay.",
        "text_overlay": "5 BIẾN SỐ TÚI TIỀN",
        "font": "Be Vietnam Pro ExtraBold",
        "palette": {
            "bg": "#0D1117",
            "bg_deep": "#070A0F",
            "surface": "#161B22",
            "surface_hi": "#1F2630",
            "border": "#30363D",
            "text": "#F0F6FC",
            "accent_green": "#34D399",
            "accent_amber": "#FBBF24",
            "accent_red": "#F87171",
            "accent_blue": "#60A5FA"
        },
        "style_notes": "Dark editorial aesthetic from clean-professional playbook (theme.ts). WCAG AA compliant contrast ratio (>4.5:1) on dark slate background."
    }

    subtitles_path = PROJECT_ROOT / "assets" / "subtitles.srt"
    video_path = PROJECT_ROOT / "renders" / "final.mp4"
    export_dir = PROJECT_ROOT / "exports"

    # 2. Execute export_bundle
    registry.discover()
    export_tool = registry.get("export_bundle")
    assert export_tool is not None, "export_bundle tool not found"

    inputs = {
        "video_path": str(video_path),
        "title": title,
        "project_name": "news-20261004",
        "export_dir": str(export_dir),
        "description": description_body,
        "tags": tags,
        "hashtags": hashtags,
        "chapters": chapters,
        "subtitles_path": str(subtitles_path),
        "thumbnail_concept": thumbnail_concept,
        "platform": "youtube"
    }

    tool_res = export_tool.execute(inputs)
    assert tool_res.success, f"export_bundle failed: {tool_res.error}"
    print("export_bundle success! Files written:", len(tool_res.data.get("files_written", [])))

    publish_log = tool_res.data["publish_log"]
    publish_log_path = PROJECT_ROOT / "artifacts" / "publish_log.json"
    with open(publish_log_path, "w", encoding="utf-8") as f:
        json.dump(publish_log, f, indent=2, ensure_ascii=False)
    print("Persisted publish_log to:", publish_log_path)

    # Validate publish_log vs schema
    publish_log_schema = json.loads((REPO_ROOT / "schemas" / "artifacts" / "publish_log.schema.json").read_text(encoding="utf-8"))
    jsonschema.validate(instance=publish_log, schema=publish_log_schema)
    print("publish_log validated successfully against schema.")

    # 3. Append to decision_log.json (both artifacts and root)
    decisions_to_append = [
        {
            "decision_id": "d-012",
            "stage": "compose",
            "category": "visual_accuracy_check",
            "subject": "Dòng miễn trừ trách nhiệm ở cảnh S14 (ngoài kịch bản)",
            "options_considered": [
                {
                    "option_id": "on-screen disclaimer \"Nội dung chỉ mang tính tham khảo, không phải lời khuyên đầu tư.\" added in S14, not in script.json",
                    "label": "Thêm dòng chữ miễn trừ trách nhiệm trên màn hình ở cảnh S14",
                    "score": 0.98,
                    "reason": "Dòng khuyến cáo tiêu chuẩn bắt buộc cho nội dung tài chính, không mâu thuẫn nội dung kịch bản."
                },
                {
                    "option_id": "strict_script_only",
                    "label": "Chỉ giữ nguyên các dòng chữ có sẵn trong script.json, không thêm disclaimer",
                    "score": 0.6,
                    "reason": "Đúng theo kịch bản gốc nhưng thiếu cảnh báo miễn trừ trách nhiệm pháp lý cần thiết.",
                    "rejected_because": "Thiếu khuyến cáo miễn trừ trách nhiệm đầu tư tiêu chuẩn cho người xem."
                }
            ],
            "selected": "on-screen disclaimer \"Nội dung chỉ mang tính tham khảo, không phải lời khuyên đầu tư.\" added in S14, not in script.json",
            "reason": "standard financial-content disclaimer, contradicts nothing (dòng miễn trừ trách nhiệm tài chính tiêu chuẩn, không mâu thuẫn nội dung kịch bản)",
            "user_visible": True,
            "user_approved": True,
            "confidence": 0.99
        },
        {
            "decision_id": "d-013",
            "stage": "compose",
            "category": "fallback_decision",
            "subject": "Ducking nhạc nền: âm lượng cố định",
            "options_considered": [
                {
                    "option_id": "BGM mixkit-new-bass-01 at constant volume 0.13 with 30-frame fade-in and 90-frame fade-out (no dynamic sidechain ducking)",
                    "label": "BGM mixkit-new-bass-01 âm lượng cố định 0.13, fade-in 30 frames, fade-out 90 frames (không dynamic sidechain ducking)",
                    "score": 0.95,
                    "reason": "Giọng đọc phủ liên tục toàn bộ 112s; mức âm lượng 0.13 nằm chuẩn trong khoảng ducking 12-15% đã duyệt."
                },
                {
                    "option_id": "dynamic_sidechain_ducking",
                    "label": "Ducking động (sidechain) theo tín hiệu giọng đọc",
                    "score": 0.6,
                    "reason": "Khoảng ngắt giữa các câu ngắn (0.3 - 0.8s), ducking động có thể gây hiện tượng bơm nhấp nhô âm lượng không mong muốn.",
                    "rejected_because": "Không cần thiết vì narration liên tục; âm lượng cố định 0.13 tạo nền êm ái hơn."
                }
            ],
            "selected": "BGM mixkit-new-bass-01 at constant volume 0.13 with 30-frame fade-in and 90-frame fade-out (no dynamic sidechain ducking)",
            "reason": "narration present continuously; within the approved 12-15% duck level (giọng đọc xuất hiện liên tục; mức âm lượng 0.13 nằm chuẩn trong ngưỡng 12-15% đã duyệt)",
            "user_visible": True,
            "user_approved": True,
            "confidence": 0.95
        }
    ]

    for d_path in [PROJECT_ROOT / "artifacts" / "decision_log.json", PROJECT_ROOT / "decision_log.json"]:
        d_data = json.loads(d_path.read_text(encoding="utf-8"))
        existing_ids = {d["decision_id"] for d in d_data["decisions"]}
        for d in decisions_to_append:
            if d["decision_id"] not in existing_ids:
                d_data["decisions"].append(d)
        d_path.write_text(json.dumps(d_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Updated {d_path} with {len(d_data['decisions'])} decisions.")

    # 4. Write checkpoint publish as awaiting_human
    cp_path = write_checkpoint(
        pipeline_dir=REPO_ROOT / "projects",
        project_id="news-20261004",
        stage="publish",
        status="awaiting_human",
        artifacts={"publish_log": publish_log},
        pipeline_type="animated-explainer",
        checkpoint_policy="guided",
        human_approval_required=True,
        human_approved=False,
    )
    print("Checkpoint written to:", cp_path)

if __name__ == "__main__":
    run_publish()
