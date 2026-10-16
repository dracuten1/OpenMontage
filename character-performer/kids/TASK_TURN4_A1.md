# TASK_TURN4_A1 — rig-animator: PROBE 2 sprite run3 (gate cho batch A2)

You are rig-animator. Hermes verified mọi fact dưới đây trên disk. KHÔNG re-verify, KHÔNG regenerate gì đã có. Việc: gen 2 probe sprite raw + PIL QC + A/A strip, rồi dừng chờ Hermes vision.

## HARD RULES
- TUYỆT ĐỐI KHÔNG Read .png/.jpg/.wav — verify ảnh chỉ bằng PIL script.
- Write file chia nhỏ ~25-40 dòng/tool call. ≤25 turns. ≤3 Read tổng.
- KHÔNG đụng file có sẵn nào (chỉ tạo file mới trong kids/turn4/).
- Repo: ~/project/OpenMontage. Python: repo .venv/bin/python (PIL + dotenv có sẵn).

## MỤC TIÊU (2 ảnh probe raw)
1. rabbit_back_run3.png — i2i ref = public/character-performer/kids/sprite_lib/rabbit/rabbit_back_run2.png
   Prompt: "SAME white kawaii rabbit with red vest and single yellow button seen FROM BEHIND (back view), SAME pose, scale and position in frame EXACTLY, next running stride phase, legs swapped positions, ears swept back, mid-leap. Keep character design and colors EXACTLY identical to the reference. flat kawaii children's picture-book style, thick dark-brown outlines, soft pastel colors, gentle cel shading, no text, no watermark. Do NOT mirror, do NOT change style, do NOT turn the head."
2. rabbit_front_run3.png — i2i ref = sprite_lib/rabbit/rabbit_front_run2.png
   Prompt: tương tự nhưng "seen FROM THE FRONT (front view), running toward the camera, next stride phase, legs swapped positions".

## GEN CONTRACT (đã kiểm chứng, không đổi)
- POST http://127.0.0.1:20128/v1/images/generations, key = os.environ OPENAI_API_KEY từ load_dotenv(repo/.env), model "cx/gpt-image-2.5-sunburst", header Accept: text/event-stream, dual parse (JSON → regex b64_json), body: prompt + image = data-URI của ref (downscale ref giữ tỉ lệ ≤1024px trước encode) + "background": "transparent".
- Timeout request 600s, latency 35–430s/ảnh là bình thường, KHÔNG kill. Chạy tuần tự 2 ảnh. Retry tối đa 1 lần/ảnh; fail → ghi log, tiếp ảnh còn lại.

## OUTPUT
- Script mới: character-performer/kids/turn4/gen_probe_run3.py (mở rộng pattern assets/depth_demo/gen_assets.py — chỉ đọc script đó làm mẫu contract, không sửa nó).
- Ảnh raw: character-performer/kids/turn4/probe/rabbit_back_run3.png, rabbit_front_run3.png (+ *.prompt.txt, gen_log.json: file, giây, size, transparent%).
- PIL QC mỗi ảnh: size, mode RGBA, transparent% (gate ≥50%), non-blank, palette drift vs ref (mean/std RGB diff — kỳ vọng nhỏ nhưng đây là RAW chưa canon, chỉ ghi số).
- A/A strip: turn4/probe/strip_back_run3_AA.png và strip_front_run3_AA.png — ref (run2) | probe (run3) cạnh nhau trên nền checker, cùng scale theo content height, kèm nhấn PIL vẽ text label.
- REPORT_TURN4_A1.md: bảng 2 ảnh (giây, size, transparent%, drift), paths, exit codes.

## KHÔNG làm
- Không canon, không append reg.json, không đụng TSX/Root, không render — đó là A2/B.
