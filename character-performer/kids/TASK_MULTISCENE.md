# Task: Multi-scene storytelling — 6 cảnh, camera moves + scene transitions (nâng cấp từ KidsRabbitDuet)

## Context
Đã có `remotion-composer/src/KidsRabbitDuet.tsx` — thỏ+rùa đối thoại 8 câu trên 1 background tĩnh. User muốn **đổi cảnh theo truyện** vì ảnh tĩnh không thu hút. Task: dựng thành video kể chuyện đa cảnh với 6 background.

## REQUIRED READING
1. `remotion-composer/src/KidsRabbitDuet.tsx` + `.tsx` rig thỏ/rùa — tái dùng tối đa, KHÔNG viết lại rig
2. `.agents/skills/motion-art-direction/SKILL.md` — camera + transition craft
3. `character-performer/kids/REPORT_DUET.md` — offset math + params đã QC

## Assets (mới, trong `remotion-composer/public/character-performer/kids/scenes/`)
| File | Cảnh | Dùng cho câu |
|---|---|---|
| `sc2_race.png` | rừng quang + vạch xuất phát | i2 (thách đấu) |
| `sc3_tree.png` | cây sồi to BÊN PHẢI + bãi cỏ | i4 (ngủ) + i5 |
| `sc4_path.png` | đường mòn dài quanh co | i5 (rùa đi) — tùy chọn, có thể dùng sc3 xuyên |
| `sc5_sunset.png` | hoàng hôn cam-hồng | i6 (giật mình) |
| `sc6_finish.png` | vạch đích caro + hoa giấy | i7 (kết) |
| `../k_bg_clean.png` | đồng cỏ (cũ) | i0, i1, i3 |

## Scene map (theo timeline.json đã có)
- **S1 intro** (0 → i2.start): đồng cỏ — thỏ+rùa chào
- **S2 challenge** (i2 → i3.end): vạch xuất phát — thỏ challenge
- **S3 nap** (i4.start → i5.end): cây sồi — thỏ ngủ zZz, rùa đi
- **S4 sunset** (i6): hoàng hôn — thỏ giật mình
- **S5 finish** (i7 → end): vạch đích — rùa thắng, ăn mừng
(sc4_path dùng nếu thấy cần; nếu không dùng thì note trong report)

## Yêu cầu
1. **Transitions giữa cảnh**: crossfade 0.5s + camera move LIÊN TỤC trong mỗi cảnh (Ken Burns: scale 1.03→1.08 + drift nhẹ hướng khác nhau mỗi cảnh) — không cắt cứng
2. **Staging thay đổi theo cảnh**: S3 thỏ dịch phải đứng DƯỚI CÂY (bg cây bên phải), rùa đi chậm sang trái (translateX animated trong suốt câu i5 — thể hiện "bền bỉ đi đều"); S4/S5 staging tự chọn hợp lý. Camera move + character move phải KHÔNG giao nhau lộn xộn — một thứ chuyển động chính mỗi thời điểm
3. **zZz ngủ**: giữ từ bản cũ (xuyên i4-i5)
4. **S5 celebration**: rùa nhún nhẹ tự hào, thỏ vỗ tay (2 tay chạm nhau trước ngực), confetti từ bg sc6
5. **Comp mới** `KidsStoryMultiScene` (file `KidsStoryMultiScene.tsx`), 30s = 900 frames, register Root.tsx, không đụng comp cũ. Audio giữ nguyên 8 câu + BGM
6. **Title card intro** (0-2.5s): "Rùa và Thỏ 🐰🐢" to giữa màn hình + fade out khi bắt đầu chuyện (trên đầu nhân vật như cũ nhưng fade out sớm để không che cảnh 2)
7. **Render + deliver-and-verify loop**: extract frames tại mỗi cảnh (≥1 frame giữa mỗi cảnh + transition frames + reaction beats), verify staging đúng bg, không cắt đầu nhân vật, camera move mượt. FAIL → fix → re-render
8. Output: `character-performer/renders/kids_story_multiscene.mp4`. Report: `character-performer/kids/REPORT_MULTISCENE.md` (scene map + times, transition params, QC từng frame)
