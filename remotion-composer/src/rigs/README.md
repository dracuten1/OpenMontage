# rigs/ — character rig tái dùng từ spec JSON (rig-split từ KidsStoryMultiScene v3.3)

- `types.ts` — `CharacterSpec` (contract chung: outline/white/headRatio/visemes/visemeScale) + `Pose`, `CharacterCues`, primitives (`piv`, `blinkFrom`, `envAt`, `mouthAtCues` 70ms, easings).
- `KawaiiRabbit.tsx` / `GoldenTurtle.tsx` — rig components: `<KawaiiRabbit frame pose spec cues .../>`; `pose ∈ idle|walk|sleep|startle|proud|clap`; schedule (blinks/hops/walk-window/book...) truyền qua props.
- `specs/*.kawaii.json` — NGUỒN DUY NHẤT hằng số thẩm mỹ (màu, part geometry, accessories, viseme table); TSX không hardcode lại.

## Tạo nhân vật mới từ 1 spec JSON
1. Copy `specs/turtle.kawaii.json` → `specs/<ten>.json`; sửa màu + geometry các nhóm part (giữ nguyên schema key).
2. Tạo `<TenRig>.tsx`: `type Spec = typeof specJson` + `const _specCheck: CharacterSpec = SPEC` (compile-time check), dựng SVG parts đọc từ `spec`, mượn primitives của `types.ts`.
3. Trong comp: import spec + rig, truyền `frame`, `pose`, `cues = {mouthCues, start}` (JSON cue + offset timeline) + schedule props — không cần copy code rig.

Ví dụ tham chiếu: `KidsStoryMultiScene.tsx` (465 dòng, dùng cả 2 rig + 8 câu audio cues).
