# VN-MYTH S2E02 thanh-giong — SESSION S3-C: SCENES GROUP c (fresh, zero-read)

Bạn là Compose Worker cho S2E02 vn-myth (ink-genome). Repo: /Users/tuyennguyen/project/OpenMontage, đứng ở repo root. NHIỆM VỤ DUY NHẤT: viết `remotion-composer/src/thanh-giong/scenes-c.tsx` — 12 scene components thật (thay stub null; GIỮ đúng tên export có sẵn trong stub).

## INPUT (Read 1 file duy nhất)
`projects/thanh-giong/logs/parts/spec_c.json` — 12 scenes: sceneId, exportName, sectionId, startFrame, durationInFrames, type, description, framing, movement, overlay_notes, hero_moment, anchors (đã verify nằm trong window), required_assets (image names), narration_sections (text đầy đủ từng section).

## ẢNH SẴN CÓ (plateSrc tự thêm prefix folder — truyền đúng tên file)
img-01-giong-tre.png · img-02-cu-gia.png · img-03-su-gia.png · img-04-nong-com.png (SCENE TRUNG TÂM — hạt gạo nhiều nhà bay vào nong) · img-05-giong-trang-si.png · img-06-tre-dang-nga.png · img-07-co-thu-vdult.png · img-08-co-thu-lncq.png · img-09-co-thu-dvsktt.png · img-10-den-phu-dong.png · img-11-den-soc.png · img-12-bay-ve-troi.png · img-13-hoi-hom-nay.png · f07-hung-vuong.png (CHỈ silhouette callback setup, 1 scene).

## API ĐÃ EMBED (KHÔNG đọc common.tsx/theme.tsx/anchors.ts — dùng đúng signature bên dưới)
```tsx
import * as React from "react";
import { Paper, Reveal, CountUp, formatVN, SpringPop, InkPath, InkDraw, circleD, SourceTag, Chip, LegendFrame, LabBadge, DossierBadge, SceneTitle, TextCard, plateSrc, InkImageScene, Lamp, QuotePlate, WipeInk, InkArrow, MapCanvas, MapLabel, SixCell, TimelineTrack, at, ease } from "./common";
import { useA, useFrac } from "./common";
import { C, FONT } from "./theme";
import { SceneProps } from "./theme";

// useA(durationInFrames?) → A(word, occ=1) → FRACTION của scene (0.01–0.965) mà từ được nói — feed vào prop startFrac của mọi component (KHÔNG phải at: frame). Từ NGUYÊN VĂN từ anchors (dấu câu tự norm). occ = lần thứ occ trong section.
// useFrac(durationInFrames?) → { f01, f025, f05, f075, f1, p, frame, dur } — p = fraction hiện tại.
// Paper: nền giấy dó (mọi scene).
// Reveal: { startFrac?, children, y? } (ưu tiên startFrac; nếu tsc bắt lỗi signature thì grep nhanh common.tsx).
// CountUp: { from, to, startFrac?, dur?, format? }.
// SpringPop: { startFrac?, children, scale? }.
// InkDraw / InkPath: { d, startFrac?, dur?, stroke?, width? } — nét mực SVG theo fraction.
// circleD(cx, cy, r) — path tròn.
// SourceTag: { text, bottom?, right?: boolean }.
// Chip: { color?, children, style? } — children là nội dung (không có prop text/at).
// LegendFrame: { title?, children }.
// LabBadge: { text? } — badge GÓC BẰNG CHỨNG.
// DossierBadge: { text }.
// SceneTitle: { eyebrow?, title, subtitle?, align?, startFrac?, titleSize?, maxWidth?, accent? }.
// TextCard: { eyebrow?, title?, subtitle?, startFrac?, maxWidth?, children? }.
// QuotePlate: quote cổ thư amber framed (nguyên văn).
// WipeInk / InkArrow: chuyển mực / mũi tên mực.
// MapCanvas/MapLabel: bản đồ ink KHÔNG sẵn chữ — overlay text tự vẽ.
// SixCell: lưới 6 ô; TimelineTrack: thanh mốc thời gian.
// plateSrc("img-04-nong-com.png") → staticFile("thanh-giong/images/img-04-nong-com.png").
// InkImageScene: { src, label?, sublabel?, labelPos?, focus?, durationInFrames?, children } — Ken Burns.
// Lamp: { startFrac?, off? } — đèn dầu.
// C: { bg, bgMuseum, card, border, cream, white, amber (cổ thư/myth), teal (bằng chứng), warn, lampRed, lampGlow, mute, earth, earthDeep, earthGlow, bronze }; FONT.display / FONT.body / FONT.mono.
// at(startFrac, dur?) helper → frame local; ease easing curves.
```

## CÁCH VIẾT (pattern S2E01 đã approve)
- Mỗi scene 1 export: `export const ScXXX: React.FC<SceneProps> = () => { const A = useA(); ... return <Paper>...</Paper>; };`
- **Speech-lock là LUẬT (0 overflow)**: mọi reveal/pop/draw/count bắn tại `A("từ", occ)` — từ NGUYÊN VĂN từ anchors list của scene (đã verify trong window). Panel giữ qua HẾT câu chứa anchor cuối (không cắt ngay sau keyword).
- Visual theo description + framing + movement trong spec; myth amber / bằng chứng teal / trang cổ thư giấy dó sẫm.
- Image scenes: `InkImageScene src={plateSrc("img-XXX.png")}` + label/sublabel từ description. Quote nguyên văn cổ thư: TextCard + SourceTag "sách chép" — GIỮ ĐÚNG CHỮ.
- Text/diagram: SceneTitle/TextCard/Chip/InkDraw/LegendFrame — padding ≥ 60px mọi phía, chữ dài ≤ 85% width, KHÔNG chữ chạm mép.
- Scene climax 'Cả làng nuôi nó lớn.' (nếu có trong group): quote-card tối giản, hold đến hết scene, KHÔNG trang trí cạnh tranh câu chữ.
- KHÔNG sửa theme/common/anchors/timing/Episode/Root. KHÔNG tạo file khác. KHÔNG Read ảnh .png.
- Video canvas 1920x1080, FPS 30, thời lượng scene = durationInFrames từ spec.

## VERIFY (sau khi viết xong)
1. `cd remotion-composer && npx tsc --noEmit` — sạch (chỉ quan tâm error src/thanh-giong/).
2. Nếu dùng interpolate: input array strictly increasing + len match.
3. KHÔNG render — Hermes probe sau.

## RÀNG BUỘC
- Read ≤2 (spec + 1 nếu tuyệt đối cần). Không WebSearch/WebFetch. Chỉ Edit/Write scenes-c.tsx.
- Ngân sách 25 turns. Cạn turn: ưu tiên scenes theo thứ tự trong spec.

## EXIT CHECKLIST
1. scenes-c.tsx: 12 components thật, tsc sạch
2. Mọi scene dùng ≥2 speech-lock anchors A()
3. In tổng kết: số scenes, anchors dùng, bất thường trong spec
