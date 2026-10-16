# TASK_TURN7B — rig-animator: MECHANICAL ONLY (code đã xong, không sửa code)

Session A đã edit xong `remotion-composer/src/KidsStoryEp1Remake.tsx` (diff đã Hermes duyệt:
camAt 1.22@430,800 chỉ [10.9,12.4), [15.3,17.79) identity, counter-scale wrapper rùa S2).
File KHÔNG được sửa nữa. Nếu tsc lỗi → ghi lỗi vào report rồi DỪNG, không tự fix.
 KHÔNG Read .png. Reads ≤2 (REPORT_TURN7.md của chính mình nếu cần). ≤10 turns.
Không đụng git (không reset/stash/commit). Không đụng Root.tsx, public/, audio.

Chạy từ `~/project/OpenMontage/remotion-composer/`. Ghi mọi RC + thời lượng + bytes vào
`character-performer/kids/turn7/REPORT_TURN7.md` (append thêm mục mới "## TURN7B mechanical").

## Bước 1 — tsc
`npx tsc --noEmit` → RC phải 0 (ghi RC).

## Bước 2 — render v7 mp4
`time npx remotion render KidsStoryEp1Remake out/kids_ep1_remake_v7.mp4 --concurrency=4 --log=error`
→ RC 0; ghi bytes `out/kids_ep1_remake_v7.mp4`.

## Bước 3 — ffprobe
`ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height,r_frame_rate -show_entries format=duration -of json out/kids_ep1_remake_v7.mp4` + audio line
(`ffprobe -v error -select_streams a -show_entries stream=codec_type,codec_name,sample_rate,channels -of csv=p=0`).
Kỳ vọng 1230f / 1080x1080 / 30/1 / ~41.045s / aac 48000 2.

## Bước 4 — lossless sequences 1230 frame × 2 (evidence diff ngoài window)
4a. `npx remotion render --help | head -60` để xác định cờ image-sequence chính xác của bản đã cài
    (tìm "sequence" / "image-format"). Dùng phương án CLI nếu có.
4b. v7: render sequence toàn 1230 frame vào THƯ MỤC TUYỆT ĐỐI
    `/Users/tuyennguyen/project/OpenMontage/character-performer/kids/turn7/lossless/v7/`
    (ví dụ `npx remotion render KidsStoryEp1Remake <thư mục đó> --sequence --image-format=png --concurrency=4 --log=error` — dùng cờ thực tế từ help).
4c. v6 snapshot: tạo 2 file tạm TRONG src/ (sẽ xóa ở bước 6):
    - copy `../character-performer/kids/turn7/KidsStoryEp1Remake.v6.tsx` → `src/__turn7_v6snap.tsx` (nguyên văn, imports ../public/ giữ nguyên vì cùng cấp src/).
    - tạo `src/__turn7_v6entry.tsx`:
      ```tsx
      import React from "react";
      import { Composition } from "remotion";
      import { KidsStoryEp1Remake as V6 } from "./__turn7_v6snap";
      registerRoot(() => (
        <Composition id="Turn7V6Seq" component={V6} durationInFrames={1230} fps={30} width={1080} height={1080} />
      ));
      ```
    - render: `npx remotion render src/__turn7_v6entry.tsx Turn7V6Seq /Users/.../turn7/lossless/v6/ <cờ sequence như 4b>`.
    (nếu comp cần thêm defaultProps/defaultProps gì theo src/Root.tsx thì copy đúng khối Composition của KidsStoryEp1Remake từ Root.tsx — đọc tối đa 1 lần phần đó.)
4d. Verify đếm: mỗi thư mục có đúng 1230 file png (ls | wc -l), ghi số liệu.

## Bước 5 — stills 37 frame (từ lossless v7, không cần CLI still)
Copy (cp, giữ nguyên pixel) từ `lossless/v7/element-<N>.png` (tên thật theo output) với N ∈
100,190,326,327,331,339,355,361,367,370,371,372,390,448,458,459,463,469,478,486,499,502,508,515,527,533,534,567,585,600,615,780,886,920,1017,1150,1229
→ `../character-performer/kids/turn7/v7_stills/f<N padding 4 chữ số>.png` (vd f0331.png).

## Bước 6 — dọn temp
`rm src/__turn7_v6snap.tsx src/__turn7_v6entry.tsx` (chỉ 2 file này, KHÔNG xóa gì khác).
Ghi `git status --short -- src/ | head` vào report để chứng minh sạch.

## Bước 7 — append report
Mục "## TURN7B mechanical": mọi RC, thời lượng từng bước, bytes mp4, ffprobe nguyên văn,
số frame mỗi sequence, tên pattern file sequence, danh sách stills đã copy, xác nhận đã rm temp.
KHÔNG claim QC thẩm mỹ — Hermes làm. XONG = mọi số liệu nằm trên disk.
