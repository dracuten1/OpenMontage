# Nhật ký Giải đáp Bình luận Pháp lý (`qa_log`)

Thư mục này lưu toàn bộ lịch sử giải đáp bình luận khán giả TikTok do **Global Plugin `vn-legal-counsel`** (`mode="reply_comments"`) thực hiện.

## Quy ước đặt tên
- `YYYY-MM-DD_<episode_slug>_qa.md`: Bản đọc nhanh cho chủ kênh gồm `tiktok_reply` (`<= 450` ký tự sẵn sàng copy-paste), mẫu bình luận ghim đính chính nếu có (`Q3`), phân tích pháp lý chi tiết và gợi ý chủ đề mới.
- `YYYY-MM-DD_<episode_slug>_qa.json`: Dữ liệu có cấu trúc phục vụ tra cứu lại hoặc tổng hợp FAQ.

## Nguyên tắc leo thang thành tập mới (Backlog Escalation)
- Bất kỳ câu hỏi nào xuất hiện trong `backlog_topic_suggestion` hoặc lặp lại nhiều lần dưới phần bình luận sẽ được xem xét thêm vào `channels/ky-chu-phap-luat/series_backlog.yaml` (với `verify_laws` rõ ràng) để sản xuất tập chuyên đề tiếp theo.
