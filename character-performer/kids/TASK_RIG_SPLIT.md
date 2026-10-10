# TASK_RIG_SPLIT.md — Tách rig thành component + spec JSON (refactor thuần, 0 thay đổi visual)

## Mục tiêu
`remotion-composer/src/KidsStoryMultiScene.tsx` là god-file (~1300 dòng): rig thỏ + rig rùa + staging + timeline nằm chung. Tách rig thành module tái dùng để nhân vật mới / tập mới / format mới chỉ cần spec mới, không copy code.

## Cấu trúc đích
```
remotion-composer/src/rigs/
  types.ts                  # CharacterSpec interface: màu, tỷ lệ (headRatio), part params, accessories, visemeScale
  KawaiiRabbit.tsx          # <KawaiiRabbit frame pose spec cues.../> — toàn bộ mechanics hiện tại
  GoldenTurtle.tsx          # <GoldenTurtle .../> — rig v3.3 1-silhouette + tGrip walk-hold sách
  specs/
    rabbit.kawaii.json      # mọi hằng số thẩm mỹ (màu, rx/ry, offset) rời khỏi TSX
    turtle.kawaii.json
```
- Props API: `frame`, `pose` ('idle'|'walk'|'sleep'|'startle'|'proud'|'clap'), `spec`, `cues` (mouthCues + start offset), `t` tuỳ mechanical. Đủ để dựng comp mới chỉ từ spec + audio.
- `KidsStoryMultiScene.tsx` sau refactor: import rigs, giữ scene map/crossfade/Ken Burns/camera/audio — dài còn lại mục tiêu < 600 dòng.
- Timing/easing/hằng số animation (70ms viseme, ear lag 0.18s, hop easeOutBack, bookFall 32.80→33.08...) **giá trị giữ nguyên từng số**.

## Ràng buộc cứng
1. **Visual identical v3.3**: re-render 1188f → `renders/kids_story_multiscene_v33_refactor.mp4`, extract 6 frame neo (f045, f200, f660, f754, f1008, f1110) từ cả 2 bản, PIL pixel-diff ≤ 0.1% pixel khác (cho phép sai số encoder). FAIL → tìm chỗ đổi giá trị, không chấp nhận "nhìn giống".
2. KHÔNG đụng comp cũ (KidsRabbitCode, KidsRabbitDuet...), Root.tsx không đổi registration.
3. `tsc` 0 error.
4. KHÔNG xóa/sửa `renders/kids_story_multiscene_v33.mp4` (bản gốc để diff).

## Deliverable
- `rigs/` 5 file + specs
- Video refactor + bảng frame-diff số (% khác từng frame neo)
- Append section "rig split" vào `character-performer/kids/REPORT_MULTISCENE.md`
- Demo nhỏ (bonus nếu nhanh): `rigs/README.md` 10 dòng — cách tạo nhân vật mới từ 1 spec JSON
