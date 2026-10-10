# Task: v3.2 — VẼ LẠI cấu trúc thân rùa (chỉ rùa, duyệt bằng still trước)

## Diagnosis (lead vision QC + user feedback)
Rùa hiện tại trông như "hộp cam úp nắp + mảnh tag trắng dán dưới": mai là dome-lid tách rời, belly là strip mỏng dán dưới rim, đầu mọc lệch từ hông mai, chân cụt lủi. KHÔNG phải 1 khối liền.

## Cấu trúc đúng (vẽ lại theo thứ tự z này)
1. **z1 — Thân nền (body core)**: oval/bean to màu be #f5e6c8 CHỨA TOÀN BỘ phần bụng + hông — đây là "khối rùa" thật, tròn mập kawaii
2. **z2 — Đầu**: mọc từ TRÊN thân nền (chủ yếu phía trước-trên, như rùa nhô đầu từ mép trên mai), không phải hông. Cổ ngắn nối liền
3. **z3 — 4 chân**: mọc từ mép dưới-thân nền, Stamp tròn mập, 2 trước + 2 sau lộ tự nhiên
4. **z4 — Đuôi** nhỏ phía sau (nếu có)
5. **z5 — MAI (dome + rim + scutes)**: vẽ CUỐI CÙNG, đè lên PHẦN TRÊN thân nền — rim mai là đường chân trời cong, bụng chỉ lộ dải dưới cùng THÂN NỀN (không phải mảnh dán riêng). Nhìn tổng thể = 1 con rùa nguyên khối: đầu nhô trên, mai che lưng, bụng + chân dưới
6. Kính tròn + sách (v3.1) giữ nguyên vị trí tương đối với đầu/bụng mới
7. Kawaii style C giữ nguyên (tỷ lệ, mắt sparkle, má hồng, viền)
8. Idle/peek/walk/proud/speak mechanics giữ nguyên — chỉ đổi construction

## Deliverable ĐỂ DUYỆT (KHÔNG render video)
Render 1 PNG 1080x1080 nền trắng: rùa đứng giữa, 3 pose cạnh nhau (idle + walk + proud) — comp tạm `TurtleStill` hoặc render frame từ comp chính t=6.6s + t=25s ghép. Output `character-performer/renders/turtle_v32_review.png`. User sẽ duyệt still NÀY trước khi re-render video.
QC tự kiểm: silhouette đọc là "con rùa 1 khối" (không phải hộp + tag), bụng liền thân dưới rim mai.
