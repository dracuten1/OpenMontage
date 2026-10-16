# REPORT SPLIT TURTLE (rig_turtle) — 2026-10-14

## Kết quả (VERIFY PASS)
- 7 lớp: tail / leg_far_hind / leg_far_front / shell / head / leg_near_hind / leg_near_front
  + mouth_open patch (bbox [1274,523,1366,596], 3481px — diff mO−m0 GIỚI HẠN vùng miệng,
  comp lớn nhất; matched-pair drift cục bộ, không tràn sprite như v1)
  + eyelid PIL-drawn (mắt gần [1074,380,1239,550]; mắt xa ở ría silhouette — bỏ, scale cuối ~25px)
- Phân vùng: coverage recon 822198 vs alpha 822183 (+15px shell repair) — SPLIT_LỆCH 0.44% toàn mép feather
- 0 chồng lấn mask giữa các part; z-order lắp = ảnh gốc (asm_test.py)
- Vision xác nhận: shell chỉ mai+vành; head đủ 2 mắt + mõm + viền; 4 chân + đuôi riêng

## Method (split_parts.py — 4 bug đã trả giá)
1. Palette: skin = |R−G|<18 ∧ G−B>50; shellish = R−G>25 ∧ R+G+B>150
   - KHÔNG dùng binary_fill_holes cho shell: vành dome+underside khép kín → fill nuốt cả con rùa (820k px)
   - Viền nâu ĐẬM (50,20,3, R−G=30) cũng là "shellish" nếu thiếu điều kiện sáng → nối iris→cổ→dome
     thành 1 comp khổng lồ → MẮT XA lọt vào shell. Sáng >150 cắt nối này.
2. 6 skin comps khớp PART_RECTS (inter + centroid±60) → nhãn 1..6
3. Comp da nhỏ (<400px, bị viền cô lập) kế thừa nhãn part da gần nhất (bán kính 150px) TRƯỚC EDT
4. Shell = MOI comp shellish ≥3000px có (centroid x<1000 ∨ y>640) — dome tách thành nhiều scute
   comp; cằm/blush (1123,576 / 1174,516) bị loại nhờ rule vị trí
5. EDT (scipy distance_transform_edt return_indices) gán MỌI pixel alpha còn lại về part gần nhất
   → mắt/viền/nám/scute-lines về đúng part (v1 chỉ để pixel "màu da" → part rỗng như cheese)
6. Shell repair: closing 25px − các part khác → 15px (không repair phần bị đuôi/chan xa che —
   closing 41 đã từng phủ mất đuôi 5144px → đuôi tàng hình)
7. Alpha layer = alpha GỐC × mask (giữ feather; alpha nhị phân làm mất mép → diff 1.4%)
8. Eyelid: blob tối/nâu trong head erode 4, w/h≤250, fill≥0.25, y0≤500 (loại vạch miệng y530),
   lấy blob lớn nhất; vẽ ellipse skin + arc viền
9. KHÔNG gán shellish nhỏ trực tiếp (=7): iris nâu sẽ kéo cả vùng mắt sang shell qua EDT

## Bài học số
- bbox giao ≠ mask giao — luôn đo overlap bằng mask AND, không nhìn bbox
- Vision contact sheet panel "shell chứa cả con rùa" 2 lần = thật (fill_holes rồi viền-nâu-nối);
  lần 3 sai (panel crop bbox lớn làm mai nhìn như thân) → phải chấm số + zoom 3-panel để phán
- 1 dòng `mshell = lab_shell == 0` (toàn ảnh) biến mọi pixel thành shell — khởi tạo mask rỗng

## Files
- cc/split_parts.py (SSOT), cc/check_parts.py, cc/asm_test.py, cc/dbg_*.py
- out/parts/*.png (7 + mouth_open + eyelid), out/parts_meta.json, out/split_sheet.jpg, out/asm_test.png
- Nguồn: assets/depth_demo/turtle_m0.png, turtle_mO.png
