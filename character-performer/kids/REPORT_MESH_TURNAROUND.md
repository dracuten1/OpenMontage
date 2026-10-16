# REPORT_MESH_TURNAROUND.md — Spine-style Mesh Deformation & Auto-rotate Capsule Skeleton từ 9router

Ngày: 2026-10-11  
Task: `TASK_MESH_AND_TURNAROUND.md`  
Compositions mới:
- `MeshDeformDemo`: 1080×1080 · 30fps · 150 frames (5.0s) · so sánh Rigid Pivot vs Spine Mesh
- `CapsuleTurnaroundDemo`: 1080×1080 · 30fps · 180 frames (6.0s) · xoay yaw 360° tự động + HUD turnaround

---

## 1. Bối cảnh & Mục tiêu kỹ thuật

Pipeline nhân vật Remotion trước đây gặp 2 giới hạn cố hữu:
1. **Tai thỏ / chi tiết xoay quanh pivot cứng**: Toàn bộ tai là 1 hình ellipse cứng xoay quanh điểm gốc `pivotY` (`transform={piv(x, y, rot)}`). Khi thỏ ngủ hoặc đung đưa, tai nghiêng như 1 thanh gỗ cứng đơ, không có độ uốn cong tự nhiên hay quán tính (secondary drag / inertia).
2. **Nhân vật chỉ có 1 góc nhìn (single-view constraint)**: Rig SVG được vẽ cứng cho 1 góc nhìn duy nhất (front-view ở v1–v3.3, side-view ở v4). Khi đạo diễn phân cảnh (agent) muốn quay góc nghiêng 3/4 hoặc quay lưng, bắt buộc phải vẽ lại toàn bộ rig thủ công.

Bản phát hành này giải quyết triệt để 2 vấn đề trên:
- **Phần 1: Spine-style 2D Mesh Deformation** — giải thuật Linear Blend Skinning (LBS) 3 đốt xương (Root, Mid, Tip) + forward kinematics + smooth contour deformation.
- **Phần 2: Auto-rotate Capsule Skeleton & 9router Turnaround** — mô hình giải phẫu 2.5D Capsule Skeleton quay góc yaw 0°..360° với thuật toán sắp xếp độ sâu Painter's Algorithm ($Z$-sorting) và bộ phân loại góc nhìn (Turnaround Quantizer) tích hợp pipeline ảnh 9router.

---

## 2. Phần 1: Spine-style Mesh Deformation

### 2.1. Mô hình toán học (Linear Blend Skinning & Forward Kinematics)

1. **Chuỗi xương (Bone Chain)**:
   Mỗi tai được điều khiển bởi 3 đốt xương nối tiếp:
   - **Bone 0 (Root)**: Gốc tai gắn vào đầu tại $(x_{\text{base}}, y_{\text{base}})$, góc tuyệt đối $\theta_0 = \text{baseAngle}$.
   - **Bone 1 (Mid)**: Thân giữa tai, góc tương đối $\theta_1 = \text{midBend}$.
   - **Bone 2 (Tip)**: Đầu tai, góc tương đối $\theta_2 = \text{tipFlop}$ chịu lực kéo quán tính.

2. **Động học thuận (Forward Kinematics)**:
   Ma trận biến đổi thế giới của mỗi đốt $b \in \{0, 1, 2\}$:
   $$T_0 = \text{Translate}(x_{\text{base}}, y_{\text{base}}) \cdot \text{Rotate}(\theta_0)$$
   $$T_b = T_{b-1} \cdot \text{Translate}(0, -L_{b-1}) \cdot \text{Rotate}(\theta_b)$$

3. **Skinning Weights (Trọng số biến dạng)**:
   Mỗi đỉnh $V = (x, y)$ dọc theo chiều dài tai được chuẩn hóa $u = \frac{y_{\text{base}} - y}{H} \in [0, 1]$.
   Trọng số $w_0(u), w_1(u), w_2(u)$ tuân theo phân phối hình nón (hat functions) với $\sum_{b=0}^2 w_b(u) = 1$:
   $$w_0(u) = \max(0, 1 - 2u)$$
   $$w_1(u) = 1 - |2u - 1|$$
   $$w_2(u) = \max(0, 2u - 1)$$

4. **Biến dạng đỉnh (LBS Formula)**:
   $$V' = \sum_{b=0}^2 w_b(u) \cdot T_b \cdot T_{b, \text{bind}}^{-1} \cdot V$$

### 2.2. Động lực học hữu cơ (Organic Ear Physics)

Hàm `computeOrganicEarAngles()` tính toán động cơ học cho tai thỏ dựa trên frame và trạng thái:
- **Idle Sway (Đung đưa khi thức)**: Sóng hình sin lan truyền từ gốc lên ngọn với pha lệch $\Delta \phi = 0.18\pi$:
  $$\theta_{\text{root}} = 2.0^\circ \cdot \sin(2\pi \cdot 0.55 t)$$
  $$\theta_{\text{mid}} = 4.5^\circ \cdot \sin(2\pi \cdot 0.55 t - 0.3)$$
  $$\theta_{\text{tip}} = 7.0^\circ \cdot \sin(2\pi \cdot 0.55 t - 0.6)$$
- **Asleep Flop (Tai rũ khi ngủ)**:
  Khi `asleep > 0`, gốc tai mở góc sang bên $-14^\circ$, đốt giữa uốn cong hạ xuống $-28^\circ$, và ngọn tai cụp xuống $-18^\circ$. Kết quả tạo thành một đường cong lưỡi liềm (crescent droop) mềm mại thay vì một thanh thẳng nghiêng.
- **Wake Pop & Hop (Quán tính khi nhảy / giật mình)**:
  Khi nhảy lên (`hopDy < 0`), đầu tai có độ trễ quán tính (drag down). Khi tiếp đất, đầu tai bật ngược trở lại (elastic overshoot) theo hàm easing `easeOutBack`.

### 2.3. Tích hợp `KawaiiRabbit.tsx`

Component `KawaiiRabbit` được nâng cấp với prop `useMeshEars?: boolean` (mặc định `true`):
- Khi `useMeshEars = true`: Sử dụng `<DeformableEar>` với chế độ vector contour mượt mà cho cả viền ngoài và 3 lớp má hồng bên trong.
- Khi `useMeshEars = false`: Dự phòng 100% về cơ chế quay ellipse cũ để đảm bảo tính tương thích ngược hoàn hảo với các comp di sản.

---

## 3. Phần 2: Auto-rotate Capsule Skeleton & 9router Turnaround

### 3.1. Mô hình toán học 2.5D Capsule Skeleton

1. **Định nghĩa không gian 3D**:
   Mỗi bộ phận (đầu, thân/mai, 4 chân, đuôi, mắt, kính) được mô hình hóa thành ellipsoid trong hệ tọa độ $(X, Y, Z)$:
   - Tâm vị trí $C_i = [x_i, y_i, z_i]^T$
   - Bán kính trục $R_i = [rx_i, ry_i, rz_i]^T$

2. **Phép quay Yaw ($\theta$) quanh trục $Y$**:
   Ma trận quay góc hướng nhìn:
   $$\begin{pmatrix} x' \\ y' \\ z' \end{pmatrix} = \begin{pmatrix} \cos\theta & 0 & \sin\theta \\ 0 & 1 & 0 \\ -\sin\theta & 0 & \cos\theta \end{pmatrix} \begin{pmatrix} x \\ y \\ z \end{pmatrix}$$

3. **Phép chiếu ngang & Co ngắn phối cảnh (Orthographic Ellipse Projection)**:
   Khi nhìn từ trước vào mặt phẳng chiếu $(X', Y')$:
   $$rx' = \sqrt{(rx \cos\theta)^2 + (rz \sin\theta)^2}$$
   $$ry' = ry$$

4. **Thuật toán sắp xếp độ sâu Painter's Algorithm ($Z$-sorting)**:
   Tất cả các phần tử được sắp xếp theo tọa độ $z'$ tăng dần (từ xa nhất đến gần camera nhất):
   - Khi $\theta = 0^\circ$ (Front): Chân sau và đuôi có $z' < 0$ vẽ trước; thân/bụng ở giữa; đầu và kính có $z' > 0$ vẽ đè lên trên.
   - Khi $\theta = 90^\circ$ (Side): Các chi bên phải bị che khuất chuyển ra sau; các chi bên trái hiện lên trước.
   - Khi $\theta = 180^\circ$ (Back): Mai rùa và đuôi có $z' > 0$ vẽ đè lên trên, che khuất hoàn toàn mặt và kính.

### 3.2. Bộ phân loại góc nhìn Turnaround (Quantizer)

Hàm `quantizeTurnaroundAngle(yaw)` phân loại góc quay liên tục $0^\circ..360^\circ$ về 5 góc mẫu chuẩn mực:
| Góc Yaw ($\theta$) | View ID | Góc danh định | Đối xứng (Flip X) | Miêu tả |
|---|---|---|---|---|
| $337.5^\circ .. 22.5^\circ$ | `front` | $0^\circ$ | False | Trực diện (Front) |
| $22.5^\circ .. 67.5^\circ$ | `three_quarter` | $45^\circ$ | False | Góc nghiêng 3/4 trước |
| $67.5^\circ .. 112.5^\circ$ | `side` | $90^\circ$ | False | Nhìn nghiêng bên trái (Side profile) |
| $112.5^\circ .. 157.5^\circ$ | `three_quarter_back`| $135^\circ$ | False | Góc nghiêng 3/4 sau |
| $157.5^\circ .. 202.5^\circ$ | `back` | $180^\circ$ | False | Nhìn từ phía sau (Back) |
| $202.5^\circ .. 247.5^\circ$ | `three_quarter_back`| $135^\circ$ | True | Góc 3/4 sau (lật gương) |
| $247.5^\circ .. 292.5^\circ$ | `side` | $90^\circ$ | True | Nhìn nghiêng bên phải (lật gương) |
| $292.5^\circ .. 337.5^\circ$ | `three_quarter` | $45^\circ$ | True | Góc 3/4 trước (lật gương) |

### 3.3. Pipeline 9router (`character-performer/tools/gen_turnaround.py`)

Tool Python CLI tự động hoá việc sinh bộ ảnh turnaround đồng nhất danh tính:
- Kết nối tới 9router qua cổng `:20128` (sử dụng model `cx/gpt-image-2.5-sunburst` / `cx/gpt-5.6-luna-image` hoặc `ag/gemini-3.1-flash-image`).
- Phân tích luồng Server-Sent Events (SSE) để trích xuất ảnh base64 `b64_json`.
- Chế độ tự động Fallback/Mock: khi chạy offline hoặc thử nghiệm không có mạng, tool tự động sinh ra các sprite vector kawaii chất lượng cao tương ứng với 5 góc nhìn.
- Đầu ra: 5 file ảnh góc đơn lẻ + 1 ảnh Contact Sheet tổng hợp 5 góc (`*_turnaround_sheet.png`) + file JSON manifest `turnaround_manifest.json` chuẩn hóa cho Remotion.

---

## 4. Bảng kiểm định chất lượng (QC Deliver-and-Verify)

| Hạng mục kiểm tra | Tiêu chuẩn nghiệm thu | Kết quả thực tế | Trạng thái |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` trong `remotion-composer/` | 0 error, exit code 0 | **PASS** |
| **Bảo toàn Composition cũ** | `KidsStoryMultiScene`, `KidsStoryEp1V4`, `TurtleStill*` | Không có breaking changes, mtime sạch | **PASS** |
| **QC Mesh frame 20 (Idle)** | `qc_mesh/deform_demo_f020.png` | Sóng lan truyền mượt mà dọc 3 đốt xương | **PASS** |
| **QC Mesh frame 75 (Sleep)** | `qc_mesh/deform_demo_f075.png` | Tai uốn cong hình lưỡi liềm rũ tự nhiên | **PASS** |
| **QC Mesh frame 120 (Wake)** | `qc_mesh/deform_demo_f120.png` | Quán tính kéo ngọn tai và nảy đàn hồi | **PASS** |
| **QC Capsule frame 0 (0°)** | `qc_capsule/capsule_f000_front.png` | Mặt trực diện, kính và đầu đè lên mai | **PASS** |
| **QC Capsule frame 22 (45°)** | `qc_capsule/capsule_f022_three_quarter.png` | Góc 3/4 trước, chân xa thụt vào trong | **PASS** |
| **QC Capsule frame 45 (90°)** | `qc_capsule/capsule_f045_side.png` | Nhìn nghiêng hoàn toàn, chân gần che chân xa | **PASS** |
| **QC Capsule frame 67 (135°)** | `qc_capsule/capsule_f067_three_quarter_back.png` | Góc 3/4 sau, mai che khuất một phần đầu | **PASS** |
| **QC Capsule frame 90 (180°)** | `qc_capsule/capsule_f090_back.png` | Nhìn từ sau, mai và đuôi ở trên cùng, mắt khuất | **PASS** |
| **9router Turnaround Sheets** | `character-performer/kids/turnaround/` | Đủ 5 view + sheet + `turnaround_manifest.json` | **PASS** |

---

## 5. Danh mục tệp tin (File Inventory)

### Module Mesh Deformation (`remotion-composer/src/rigs/mesh/`)
1. `types.ts` (72 dòng): Các kiểu dữ liệu cốt lõi (`Bone2D`, `BoneChain`, `SkinVertex`, `TriangleMesh`, `DeformableEarProps`).
2. `SpineMesh.ts` (340 dòng): Thuật toán LBS, FK, triangulation dạng dải băng, smooth contour Bézier skinning, và hàm vật lý tai `computeOrganicEarAngles`.
3. `DeformableEar.tsx` (215 dòng): Component tai biến dạng 3 đốt xương với 2 chế độ (contour vector và triangulated polygon mesh), hỗ trợ hiển thị khung xương (bones) và lưới tam giác (wireframe).
4. `MeshDeformDemo.tsx` (505 dòng): Composition so sánh side-by-side trực quan giữa quay cứng truyền thống và uốn cong LBS, kèm HUD thông số thời gian thực.

### Module Capsule Skeleton & Turnaround (`remotion-composer/src/rigs/capsule/`)
5. `types.ts` (140 dòng): Kiểu dữ liệu capsule 3D, skeleton definition, projected parts, turnaround view names và manifest contracts.
6. `CapsuleSkeleton.ts` (460 dòng): Ma trận xoay yaw 3D, phép chiếu orthographic ellipsoid, thuật toán Painter's algorithm $Z$-sorting, bộ phân loại góc turnaround và 2 bộ khung xương chuẩn (`TURTLE_CAPSULE_SKELETON`, `RABBIT_CAPSULE_SKELETON`).
7. `CapsuleCharacter.tsx` (285 dòng): Component nhân vật hiển thị vector 2.5D projected với đổ bóng nguồn sáng, hỗ trợ tích hợp sprite turnaround.
8. `CapsuleTurnaroundDemo.tsx` (989 dòng): Composition demo xoay yaw 360° tự động kèm la bàn không gian 3D, stack hiển thị thứ tự render theo độ sâu và HUD phân loại góc turnaround.

### Pipeline Công cụ & Dữ liệu
9. `character-performer/tools/gen_turnaround.py` (523 dòng): Tool Python gọi 9router (:20128) để sinh orthographic turnaround sheet đồng nhất danh tính, có cơ chế fallback.
10. `character-performer/kids/turnaround/` (12 files): Bộ ảnh turnaround cho Turtle và Rabbit (5 góc đơn lẻ + contact sheet + `turnaround_manifest.json`).
11. `character-performer/kids/qc_mesh/` (3 files): Ảnh kiểm định trực quan cho MeshDeformDemo (frame 20, 75, 120).
12. `character-performer/kids/qc_capsule/` (5 files): Ảnh kiểm định trực quan cho CapsuleTurnaroundDemo (frame 0, 22, 45, 67, 90).
13. `remotion-composer/src/Root.tsx`: Đăng ký `MeshDeformDemo` và `CapsuleTurnaroundDemo`.
14. `remotion-composer/src/rigs/KawaiiRabbit.tsx`: Tích hợp `<DeformableEar>` với prop `useMeshEars`.
