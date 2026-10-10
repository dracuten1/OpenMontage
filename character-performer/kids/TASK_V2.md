# Task: v2 multiscene — giọng mới (chậm hơn), bụng rùa sửa, BGM rõ hơn

## Thay đổi từ TASK_MULTISCENE.md (v1 đã xong)
3 thay đổi từ user + giữ nguyên mọi thứ khác (rig, scene map, camera, reactions):

## 1. Audio ĐÃ THAY THẾ sẵn (không cần đụng TTS)
- `dialogue/d{i}_*.wav` + `d{i}_cues.json` + `timeline.json` ĐÃ regen: Thỏ = **Trúc Ly** (nữ 254Hz), Rùa = **Mỹ Duyên** (nữ đọc truyện 242Hz), tất cả đã atempo 0.87 (chậm hơn ~15%), gap 0.6s. **timeline total = 38.42s** → duration comp = 38.42 + 1.2 ≈ **39.6s = 1188 frames**. TẤT CẢ offset math trong comp phải đọc từ timeline.json mới (line.start đã đổi).
- `bgm_dialogue.wav` ĐÃ recut 45s fade. **Nâng volume BGM 0.3 → 0.42** trong comp.

## 2. Sửa bụng rùa (bản v1 nhìn sai)
Vẽ lại phần bụng/plastron của rùa trong rig: hiện tại nhìn "không đúng". Sửa theo hướng: bụng là mảng **màu be vàng nhạt (#f5e6c8) tách rõ khỏi mai vàng đậm**, viền cong liền mạch từ mai xuống, KHÔNG để khoảng hở giữa mai và bụng, chân mọc từ mép mai-bụng (không lơ lửng). Tham khảo hình rùa childsbook: mai = vòm trên, bụng = dải ngang dưới lõm nhẹ vào thân, nhìn gọn như 1 khối. Tự crop mặt+thân rùa từ render v1 (`kids/qc_multiscene/` có sẵn crops) để so trước/sau.

## 3. Verify loop như cũ
Render `character-performer/renders/kids_story_multiscene_v2.mp4`, extract frames mỗi cảnh + mid-cue frames (KHÔNG extract đầu-cue — pitfall đã biết), crop bụng rùa before/after, check lip-sync cả 2 nhân vật ≥3 câu. BGM nghe rõ hơn nhưng không lấn giọng (không cần nghe — check volume setting trong code là đủ).

## Comp: sửa trực tiếp `KidsStoryMultiScene.tsx` (comp cũ v1 giữ nguyên trong comp `KidsRabbitTurtleDuet` riêng — chỉ đổi duration + audio + bụng rùa trong multiscene comp). Output: `renders/kids_story_multiscene_v2.mp4`. Report thêm mục "v2 changes" vào `REPORT_MULTISCENE.md`.
