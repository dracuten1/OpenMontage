# Task: v3 — redesign rigs theo Style C kawaii (user ĐÃ DUYỆT design sheet)

## Reference ĐÃ DUYỆT
`character-performer/kids/design/design_C_kawaii.png` — design sheet kawaii sticker: chibi head-to-body ratio cực lớn, mắt to sparkle bóng (glossy highlights), má hồng đậm, mọi thứ bo tròn, candy colors, năng lượng sticker/emoji. Đọc kỹ sheet này và rig 2 nhân vật KHỚP phong cách nó (thỏ trắng + vest đỏ, rùa mai vàng đầu olive bụng cream).

## Giữ nguyên từ v2 (KHÔNG đụng)
- Toàn bộ audio: 8 wav + cues + timeline.json 38.42s + BGM 0.42
- Scene map 5 background, crossfade 0.5s, Ken Burns, staging per-scene (thỏ ngủ dưới cây phải...), reaction beats (ngủ zZz/giật mình/clap+confetti), title card
- Bụng rùa v2 đã đúng (belly be #f5e6c8 tách mai, chân gắn rim) — giữ cấu trúc đó, chỉ restyle

## Yêu cầu redraw (kawaii upgrade)
1. **Tỷ lệ chibi**: đầu/eros = ~55-60% tổng chiều cao (v2 ~45%), thân ngắn mập tròn, tay chân stub ngắn
2. **Mắt sparkle**: to hơn 30-40%, gradient shine (2 highlight: chấm lớn trên-trái + chấm nhỏ dưới-phải), lấp lánh — kiểu sticker bóng
3. **Má hồng**: to rõ hơn, hơi oval nghiêng, màu hồng candy đậm hơn
4. **Viền**: dày hơn ~15%, bo tròn mềm (round joins), màu nâu ấm giữ #3a2e2a
5. **Chi tiết kawaii**: tai thỏ thêm gradient hồng đậm ở lòng trong; rùa thêm má hồng + mắt to kiểu sparkle nhẹ hơn thỏ (không bằng — rùa hiền hơn); miệng idle = smile arc to có má lún nhẹ
6. **Bảo toàn rig mechanics**: mọi pivot/param/idle/viseme/blink/peek/tai flop... giữ nguyên cấu trúc — chỉ đổi hình dạng + kích thước tương đối + màu. Điều chỉnh bbox nếu chibi to đầu bị tràn viewBox (pitfall tai bị cắt v1)
7. Comp: sửa `KidsStoryMultiScene.tsx` trực tiếp. Output: `character-performer/renders/kids_story_multiscene_v3.mp4` (1188 frames). QC: ≥6 frames (mỗi cảnh 1 + mid-cue lip-sync 2 + ngủ + clap), CROP MẶT cả 2 nhân vật so sánh với design sheet — mục tiêu "nhận ra 2 nhân vật từ sheet". FAIL → fix → re-render.
8. Report: append "v3 kawaii redesign" vào `REPORT_MULTISCENE.md` (thay đổi tỷ lệ, tham số mắt/má, before/after thoughts).
