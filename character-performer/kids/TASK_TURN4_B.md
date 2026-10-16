# TASK_TURN4_B — rig-animator: wire 3 beat + S5 back-view + PACING PASS toàn comp + render full 1230f

You are rig-animator. A1/A2 đã xong: 4 frame matched mỗi chain + reg entries trong
public/character-performer/kids/remake/reg.json (khóa: rabbit_back_run3, rabbit_back_run4,
rabbit_front_run3, rabbit_front_run4 — đọc số reg từ đó, KHÔNG đo lại).
Audio/timeline/TTS/bg/shots GIỮ NGUYÊN như đã duyệt. Duration 1230f @30fps KHÔNG đổi.

## HARD RULES
- Không Read .png; verify ảnh PIL-only. Read TSX ≤2 (KidsStoryEp1Remake.tsx 1 lần + KidsS5BackDemo.tsx 1 lần). Root.tsx chỉ grep anchor.
- Write/Edit chunk 25-40 dòng mỗi call. ≤25 turns. Report viết incremental.
- Camera TĨNH TUYỆT ĐỐI trong shot (per-shot CONSTANTS như hiện có là OK; KHÔNG thêm zoom/push mới).
- File được sửa: src/KidsStoryEp1Remake.tsx (và chỉ nó). KHÔNG đụng KidsS5BackDemo.tsx, Root.tsx (comp đã đăng ký), hay comp khác.

## PACING RULE (owner standing, áp TOÀN comp)
- Gait stepping ≤12fps: mọi SwapCycle/chain index dùng every=3 (10fps) trở lên.
- KHÔNG time-compression: bỏ warp/glance-x0.35/arc-length của S5 cũ — turtle đi TRỌN window audio d5 (22.79→28.94, 6.15s) trên path S-curve, easeInOutQuad/Cubic.
- Tốc độ đỉnh ≤1.6× tốc trung bình của mỗi path (đo bằng đạo hàm polyline/Δt sau khi sửa; nêu số trong report).
- Hold ≥0.6s trước mọi cut: S0/S1 (~3.49/9.31), S2/S3 (~12.93/17.19), S4a lên vạch (17.79–18.9), S5 end (28.34–28.94), S6 (33.5–33.9), S7 moral (39.0+).
- Ghost trails S4: giảm 3 → ≤2, opacity thấp hơn (fade mềm), delay ngắn hơn.
- S0–S3 idle: hop/nod GIẢM tần suất (bỏ bớt beat), spring damping tăng (12→16+) cho mềm.
- Mouth sync giữ nguyên cues ±0.3s — KHÔNG đụng audio/cues.
- Bảng px/s thực đo mỗi character mỗi beat: TRƯỚC (git diff số cũ trong report) → SAU.

## VIỆC
1. S4 SPRINT (18.9–20.7, bg6): SwapCycle 2-frame → 4-frame cycle
   [rabbit_back_m0, rabbit_back_run2, rabbit_back_run3, rabbit_back_run4], every=3, hard-swap
   KHÔNG crossfade, f0=s2f(18.9). Ghost ≤2. Path SPX/SPY/H giữ hướng nhưng kéo dãn để peak
   ≤1.6×avg (đo; nếu cần thêm thời lượng thì lùi start về 18.6 — vẫn trong window d4).
2. S5 (22.79–28.94): THAY block S5 cũ (S5REG + warp + glance + STOP/EXIT nén) bằng method
   KidsS5BackDemo (đọc file đó 1 lần, copy geometry): turtle back-view walk 4-frame chain
   [turtle_back_m0, turtle_back_w1, turtle_back_walk2, turtle_back_w3] every=8 KHÔNG đổi
   (đã duyệt), shared-scale S=H/1002, waddle ±2.5°, path polyline X=[610,508,445,510,430,250]
   Y=[950,810,680,540,430,355] H=[290,232,185,140,98,60], u=easeInOutQuad(clamp01(t/6.15)),
   hold cuối ≥0.6s pose m0 tại (250,355,60). BG bg_d5_back ở k=1.0 đã có trong stack —
   giữ 1 shot camera TĨNH (bỏ camZ 1.22/1.05 của S5 cũ; S4-NAP và S6 segments giữ cam riêng
   như hiện có). Sleeping rabbit: sleeping_v2 + breathing như turn-3 đã wire; KIỂM TRA Zzz
   anchor (663,556) còn nằm đúng miệng/mũi thỏ sleeping_v2 với geometry mới — nếu lệch,
   dịch Zzz theo delta reg (nêu số).
   Mouth: S5 là back-view → không mouth patch (như demo đã duyệt).
3. S7 (36.5–37.9 arrival): SwapCycle 2-frame → 4-frame
   [rabbit_front_run_m0, rabbit_front_run2, rabbit_front_run3, rabbit_front_run4], every=3,
   giữ path (950,713,H90)→(640,800,H210), easeOutQuad giữ nếu peak/avg ≤1.6 — đo rồi mới giữ.
4. Pacing pass phần còn lại theo rule trên (S0–S3 idle/bob/hop, S6 wake pop damping).
5. QC + render:
   - npx tsc --noEmit (0 errors)
   - Vẫn đầu/cuối mỗi shot overlay-diff chứng minh camera đứng yên (script PIL, như race_shot)
   - Sky-patch diff <2 giữa frame đầu/cuối mỗi shot bg
   - npx remotion render KidsStoryEp1Remake out/kids_ep1_remake_v4.mp4 --concurrency=4 --log=error
   - ffprobe: 1230f, ~41.0s, 1080x1080, 30fps, audio stream
   - Bảng px/s trước/sau từng beat + số hold/camera/mouth-check trong REPORT_TURN4_B.md

## Arifacts
- Video: remotion-composer/out/kids_ep1_remake_v4.mp4
- Report: character-performer/kids/turn4/REPORT_TURN4_B.md (kèm bảng đối chiếu v3 → v4)
- QC json: character-performer/kids/turn4/turn4_qc.json
