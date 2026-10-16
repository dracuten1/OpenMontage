# TASK_MESH_AND_TURNAROUND.md — Spine-style Mesh Deformation & Auto-rotate Capsule Skeleton từ 9router

## Mục tiêu
Triển khai 2 cải tiến kiến trúc cốt lõi cho pipeline nhân vật OpenMontage / Remotion:
1. **Spine-style Mesh Deformation**:
   Thay thế tai thỏ / appendages xoay quanh pivot cứng bằng hệ thống 2D Bone Chain + Linear Blend Skinning (LBS) và smooth curve deformation. Khi tai flop (ngủ, ngúng nguẩy, startle), tai uốn cong mềm mại thật sự theo 3 đốt xương (root, mid, tip) với secondary inertia / drag, thay vì xoay như thanh gỗ cứng.
2. **Auto-rotate Capsule Skeleton từ 9router**:
   Xây dựng mô hình khung xương capsule 2.5D (Capsule Skeleton) với phép chiếu xoay yaw 0°..360°, tự động sort Z-depth cho các bộ phận và map góc xoay liên tục về các góc orthographic turnaround (Front 0°, 3/4 Front 45°, Side 90°, 3/4 Back 135°, Back 180°). Kèm tool script sinh ảnh turnaround đồng nhất danh tính từ 9router.

---

## Cấu trúc module cần tạo

```
remotion-composer/src/rigs/
  mesh/
    types.ts                # Bone2D, BoneChain, SkinVertex, TriangleMesh, DeformableEarConfig
    SpineMesh.ts            # Linear Blend Skinning (LBS), forward kinematics (FK), ribbon triangulation & smooth contour deformation
    DeformableEar.tsx       # Component tai uốn cong 3-bone với 2 chế độ (smooth contour vector & triangulated mesh)
  capsule/
    types.ts                # CapsulePart3D, SkeletonDef, TurnaroundAngle, ProjectedPart
    CapsuleSkeleton.ts      # 2.5D yaw rotation, orthographic projection, Z-sorting, angle quantizer
    CapsuleCharacter.tsx    # Component nhân vật xoay liên tục theo yaw góc nhìn 360° + turnaround sprite switcher
  KawaiiRabbit.tsx          # Tích hợp DeformableEar (hỗ trợ useMeshEars: boolean, mặc định bật mượt mà)
remotion-composer/src/
  MeshDeformDemo.tsx        # Composition demo so sánh trực tiếp Side-by-Side: Rigid Pivot vs. Spine Mesh Deformation
  CapsuleTurnaroundDemo.tsx # Composition demo nhân vật xoay 360° tự động theo yaw
character-performer/tools/
  gen_turnaround.py         # Pipeline script gọi 9router (:20128) để sinh orthographic turnaround sheet / poses
character-performer/kids/
  REPORT_MESH_TURNAROUND.md # Báo cáo nghiệm thu kỹ thuật, công thức toán, kết quả QC và hướng dẫn tích hợp
```

---

## Chi tiết kỹ thuật

### Phần 1: Spine-style Mesh Deformation
1. **LBS (Linear Blend Skinning) & FK**:
   - Chain gồm 3 bone: Root (đáy tai tại đầu), Mid (giữa tai), Tip (đầu tai nhọn).
   - FK tính toán vị trí thế giới và góc tích lũy của từng bone dựa trên `baseAngle`, `midBend`, `tipFlop`.
   - Lưới tam giác hoặc đường cong contour được gán trọng số skinning $w_0, w_1, w_2$ tương ứng theo vị trí dọc chiều dài tai ($u \in [0, 1]$).
2. **Organic Physics**:
   - Lúc ngủ (`asleep > 0`): base xòe nhẹ sang bên, mid uốn cong võng xuống, tip cụp xuống tự nhiên (true ear droop).
   - Lúc giật mình / nhảy (`hop`, `wakePop`): mid duỗi thẳng, tip có độ trễ (secondary follow-through).
   - Lúc đung đưa (`earSway`): chuyển động uốn cong dạng sóng (wave propagation) thay vì xoay cứng.
3. **Hiển thị & Tương thích**:
   - `DeformableEar` vẽ cả lớp outer stroke + 3 lớp pink bên trong theo đúng bảng màu kawaii spec.
   - Giữ nguyên pixel palette và outline style của `KawaiiRabbit`.

### Phần 2: Auto-rotate Capsule Skeleton & 9router
1. **Mô hình Capsule Skeleton 2.5D**:
   - Định nghĩa các khối capsule trong không gian $(x, y, z)$: Head, Shell/Body, 4 Limbs, Tail, Ears.
   - Khi quay góc yaw $\theta$:
     - Tọa độ $x' = x \cos\theta + z \sin\theta$, $z' = -x \sin\theta + z \cos\theta$.
     - Bán kính chiếu ngang $rx' = \sqrt{(rx \cos\theta)^2 + (rz \sin\theta)^2}$.
     - Sắp xếp thứ tự vẽ (painter's algorithm) theo $z'$ để các phần ở sau tự động bị che, các phần ở trước vẽ đè lên.
2. **Turnaround Quantizer & 9router Script**:
   - Hàm `getTurnaroundView(yaw: number)` tự động phân loại góc nhìn thành:
     `front` ($0^\circ$), `quarter_front` ($45^\circ$), `side` ($90^\circ$), `quarter_back` ($135^\circ$), `back` ($180^\circ$).
   - `character-performer/tools/gen_turnaround.py`:
     Đọc `.env`, gọi endpoint `/images/generations` của 9router (dùng `cx/gpt-5.6-luna-image` / `cx/gpt-image-2.5-sunburst` / `ag/gemini-3.1-flash-image`) với prompt thiết kế cho turnaround giữ nguyên danh tính nhân vật từ ảnh tham chiếu có sẵn.

---

## Ràng buộc cứng
1. `npx tsc --noEmit` trong `remotion-composer/` phải trả về **0 lỗi** (exit code 0).
2. Toàn bộ comp hiện có (`KidsStoryMultiScene`, `KidsStoryEp1V4`, `TurtleStill`, `KidsRabbitDuet`...) phải hoạt động bình thường, không được làm vỡ bất kỳ comp nào.
3. Đăng ký các comp mới vào `Root.tsx`:
   - `MeshDeformDemo`: 1080x1080, 150 frames (5s), 30fps.
   - `CapsuleTurnaroundDemo`: 1080x1080, 180 frames (6s), 30fps.
4. Render ít nhất 2 frame still QC từ mỗi comp demo để làm bằng chứng nghiệm thu trực quan.
5. Tạo báo cáo chi tiết tại `character-performer/kids/REPORT_MESH_TURNAROUND.md`.
