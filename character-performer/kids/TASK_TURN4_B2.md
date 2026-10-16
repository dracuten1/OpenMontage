# TASK_TURN4_B2 — rig-animator: micro-fix S5 easing → trapz r=0.25 + re-render v4

You are rig-animator. Owner decision: pacing rule msg 2463 (peak ≤1.6×avg) thắng ease demo.
TASK_TURN4_B đã xong, chỉ 1 mục lệch gate: S5 turtle peak/avg = 1.911 (easeInOutQuad 6.15s).

## VIỆC (chỉ 1 thay đổi code + re-render + re-QC)
1. Trong src/KidsStoryEp1Remake.tsx, block S5 back-view: đổi u = easeInOutQuad(clamp01((t-22.79)/6.15))
   → u = trapz(clamp01((t-22.79)/6.15), 0.25) — dùng đúng helper trapz đã có (như S4/S7).
   KHÔNG đổi: path X/Y/H, every=8, waddle, S=H/1002, hold cuối, camera, mouth, bất cứ thứ gì khác.
2. npx tsc --noEmit → 0 errors.
3. Re-render: npx remotion render KidsStoryEp1Remake out/kids_ep1_remake_v4.mp4 --concurrency=4 --log=error
   (overwrite v4; vẫn 1230f, KHÔNG đổi duration).
4. Đo lại pace S5 bằng turn4/pace_calc.py (method y hệt): nêu avg, peak, peak/avg mới — phải ≤1.6.
5. Append kết quả vào character-performer/kids/turn4/REPORT_TURN4_B.md (mục "B2 S5 fix") + update turn4_qc.json
   (pacing entry S5 mới, giữ entry cũ làm history).
6. Sky-patch camera check lại đúng 3 shot dính S5 (NAP_S5_static, S6_wake, S6_wide) bằng turn4/qc_v4.py
   (nếu script chạy toàn bộ thì để nguyên, chỉ trích 3 shot đó vào report).

## HARD RULES
Không Read .png; PIL-only; chỉ sửa KidsStoryEp1Remake.tsx; chunk ≤40 dòng; ≤10 turns.
Report cuối: 3 dòng — S5 peak/avg mới, ffprobe (1230f/41.0s/30fps/audio), tsc errors.
