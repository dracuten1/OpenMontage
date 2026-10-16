# TASK DEMO ASSETS — REMAKE Ep.01 (cảnh d5 "Rùa vượt Thỏ ngủ")

Repo/workdir: /Users/tuyennguyen/project/OpenMontage (path ĐÃ verify đúng case — copy nguyên văn)
Python: .venv/bin/python (từ repo root). KHÔNG dùng python3 hệ thống.

## MỤC TIÊU
Gen 4 ảnh cho demo remake (budget $0, chỉ 9router free). TẤT CẢ qua script Python gọi
http API trực tiếp (không dùng tool OpenMontage). Probe quota đã xong bởi lead.

## QUY TẮC CHẾT
- KHÔNG BAO GIỜ Read file .png (chết context). Verify ảnh CHỈ bằng script PIL in ra
  size/mode/alpha%/bbox. Vision QC là việc của lead.
- ≤18 turns. Không re-verify file đã tồn tại (lead đã đo: xem STATE).
- Script gen: resumable qua `--only bg|tree|walk2|walkmO`, mỗi ảnh timeout 600s
  KHÔNG kill khi chậm (luna 35–430s/ảnh là BÌNH THƯỜNG).

## ENV
Đọc từ /Users/tuyennguyen/project/OpenMontage/.env: OPENAI_API_KEY, OPENAI_BASE_URL
(http://127.0.0.1:20128/v1). Headers: Authorization Bearer, Content-Type json,
Accept: text/event-stream. Body POST /images/generations:
{"model": M, "prompt": P, "size": "1536x1024", "n": 1, "image": "data:image/png;base64,..."}
- Ref ảnh (i2i) PHẢI xuống ≤1024px cạnh dài (~JPEG quality 85 hoặc PNG resize) trước khi
  base64 — full-size >1024 làm SSE stream abort `event: error`.
- Response parse CẢ HAI dạng: (a) SSE — tìm dòng `event: done` chứa data:image/png;base64,...;
  (b) JSON thuần — regex `"data"\s*:\s*"(data:image/png;base64,[^"]+)"` hoặc b64_json.
- Retry 1 lần/ảnh nếu error/timeout. Ghi latency từng ảnh vào report.

## STATE (lead đã đo, ĐỪNG đo lại)
- remake/schematic_d5_back.png 1536x1024 ĐÃ CÓ (schematic + swatch bg5_nap mép phải).
- depth_demo/turtle_walk.png: 1535x1024 RGBA transp 0.48, bbox (43,69,1510,1008),
  rùa hướng PHẢI, miệng đóng tại fraction (x 0.822–0.901, y 0.514–0.545).
- depth_demo/tree_sleep.png: 1223x1286 RGBA transp 0.37, có thỏ bake-in x41–58% y80–90%.
- Out dir: public/character-performer/kids/remake/

## GEN 4 ẢNH

### 1) bg (model cx/gpt-5.6-luna-image) → remake/bg_d5_back.png
Ref = schematic_d5_back.png (resize 1024 wide). Prompt (nguyên văn):
"Repaint this rough schematic into a finished children's storybook illustration. A gentle
S-curved dirt road winding from a small red finish-line banner on two wooden posts far away
in the upper left, sweeping right, curving back left, then widening toward the bottom of the
frame. Rolling green meadows with wildflowers, soft hills fading to blue, blue sky with puffy
white clouds, warm midday light, soft painterly texture. The vertical strip at the far right
edge is a STYLE REFERENCE swatch — match its exact palette, brush texture and lighting; do
not render the strip itself. Keep the road exactly along the dashed arrow line and the red
banner exactly at the arrow start. NO characters, NO animals, NO people, NO text, NO
watermark."
Sau gen: PIL — nếu RGB: cover-crop về ĐÚNG 1536x1024 (scale phủ đầy, center-crop), save.
In ra size + mean hue 3 vùng (trên/giữa/dưới).

### 2) tree (model cx/gpt-image-2.5-sunburst) → remake/tree_clean.png
Ref = depth_demo/tree_sleep.png (resize ≤1024). Prompt:
"Remove the small cream-colored sleeping rabbit completely from under the tree. Keep the
tree, trunk, roots, grass, bushes, flowers and everything else EXACTLY the same — same
style, same colors, same position and scale. FULL transparent background preserved."
Verify: RGBA, transparent ≥ 30%, bbox in ra.

### 3) walk2 (model cx/gpt-image-2.5-sunburst) → remake/turtle_walk2.png
Ref = depth_demo/turtle_walk.png (resize ≤1024). Prompt:
"ONLY change: swap the walking legs to the opposite half-stride — the front-right leg now
lifted forward mid-air and the back-left leg pushed back, other legs mirrored. SAME turtle,
SAME pose, head, shell, scale, position and style. Full transparent background preserved."
Verify: RGBA ≥40% transp.

### 4) walkmO (model cx/gpt-image-2.5-sunburst) → remake/turtle_walk_mO.png
Ref = depth_demo/turtle_walk.png (resize ≤1024). Prompt:
"ONLY change: the mouth opens wide in a friendly talking expression, showing open beak-mouth.
SAME turtle, SAME walking pose, SAME head angle, legs, shell, scale, position and style.
Full transparent background preserved."
Verify: RGBA; DRIFT CHECK so turtle_walk.png: alpha-bbox (t,b,l,r) của 2 ảnh, chênh
|Δleft|,|Δtop|,|Δright|,|Δbottom| ≤ 0.5% canvas. Nếu lệch → regen 1 lần với prompt thêm
"CRITICAL: keep the exact same framing, canvas position and scale — only the mouth moves."
Vẫn lệch → ghi số liệu vào report, vẫn giữ ảnh (lead sẽ quyết).

## MOUTH PATCH (sau khi walkmO OK)
Script PIL: crop turtle_walk_mO.png vùng fraction x 0.79–0.93, y 0.46–0.62; áp feather
ellipse (mask radial gradient, mềm ~12% kích thước vùng) → RGBA
ep1_v2/mouths/turtle_walk_mouthO.png. Append vào ep1_v2/mouth_reg.json key "turtle_walk":
{"file":"ep1_v2/mouths/turtle_walk_mouthO.png","x0f":0.79,"y0f":0.46,"x1f":0.93,"y1f":0.62,
"src":"walk matched pair (remake demo)"} — giữ nguyên các key cũ.

## REG
remake/reg.json: {"turtle_walk2": {...}, "turtle_walk_mO": {...}, "tree_clean": {...}}
mỗi entry đo PIL: {w,h,t,b,cx,chf,cwf} — px TUYỆT ĐỐI của alpha-bbox, content bottom-center
pin (x0=left, x1=right: cx=(x0+x1)/2/w, chf=(b-t)/h, cwf=(x1-x0)/w). Thêm entry "turtle_walk"
đo lại từ depth_demo/turtle_walk.png.

## REPORT
remake/ASSETS_REPORT.md: bảng 4 ảnh (model, latency s, size, mode, transp%, drift nếu có),
số lần retry, mọi con số đo được. KHÔNG nhúng ảnh base64 vào report.
