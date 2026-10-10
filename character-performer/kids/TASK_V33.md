# Task: v3.3 — SỬA CỐT LÕI: 1 silhouette = 1 path (bỏ hẳn "mai đè lên thân")

## Vì sao v3.2 vẫn sai (lead vision: "stacked lid + tag")
Vẽ mai như OBJECT đè lên thân (dù z-order đúng) thì outline mai + outline thân vẫn tách thành 2 khối nhìn như nắp + hộp. Cách vẽ này KHÔNG THỂ ra "1 khối" được.

## Nguyên tắc mới (bắt buộc)
**Silhouette rùa = MỘT path kín duy nhất.** Không còn "shell object overlapping body":
1. Vẽ 1 shape "bánh mì" bo tròn (rounded loaf / half-oval mập) làm TOÀN BỘ thân rùa — outline duy nhất bao ngoài
2. **Mai = CLIP REGION bên trong path đó**: fill vùng PHÍA TRÊN đường cong ngang (đường "equator" cong nhẹ) bằng màu mai vàng + hoa văn scutes — dùng clipPath vào path thân, KHÔNG vẽ ellipse mai riêng có outline riêng
3. **Bụng = phần dưới equator** của cùng path: fill be #f5e6c8, có thể vài đường ngang mảnh gợi plastron (KHÔNG outline tách rời — chỉ là màu nền + kẻ mảnh cùng bị clip)
4. Chỉ có 3 outline ngoài: (a) path thân, (b) đầu tròn (nổi lên trên mép trước của path thân, cổ = phần đầu chồng lên thân không viền cắt), (c) chân tròn (nửa dưới thân)
5. Rim mai = đường kẻ MỎNG dọc equator (nét đơn, không phải viền dày 2 lớp) — chỉ để gợi ranh giới mai/bụng
6. Kính + sách giữ. Kawaii giữ. Mechanics giữ. Face vẫn param 1 điểm TURT.head

## Deliverable BẮT BUỘC theo đúng thứ tự
1. **Trước tiên**: comp `TurtleStill` (1080x1080 nền TRẮNG, rùa scale to chiếm ~70% chiều cao, 3 pose: idle / walk+book / proud — 3 comp id TurtleStill/TurtleStillWalk/TurtleStillProud hoặc 1 comp 3 khung). Render 3 PNG vào `character-performer/renders/turtle_v33_*.png`
2. Tự QC từng PNG (crop bụng + silhouette) theo tiêu chí: "đóng outline, KHÔNG thấy 2 khối nắp/hộp, bụng là dải dưới của CÙNG 1 khối"
3. Nếu PASS mới báo lead — lead duyệt xong rồi mới tính đến re-render video. KHÔNG render video trong task này.
