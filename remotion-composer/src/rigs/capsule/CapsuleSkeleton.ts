// ---------------------------------------------------------------------------
// rigs/capsule/CapsuleSkeleton.ts — 2.5D Capsule Skeleton Math & Presets
// Part 2 of TASK_MESH_AND_TURNAROUND for OpenMontage / Remotion rigs.
//
// Mathematical Foundations:
// 1. 3D Yaw Rotation Matrix:
//      x' =  x * cos(θ) + z * sin(θ)
//      y' =  y
//      z' = -x * sin(θ) + z * cos(θ)
// 2. Projected Ellipsoid Horizontal Radius:
//      rx' = sqrt((rx * cos(θ))^2 + (rz * sin(θ))^2)
// 3. Painter's Algorithm Depth Sorting:
//      Order parts by ascending z' (furthest back rendered first, closest last).
// 4. Orthographic Turnaround View Quantizer:
//      Maps continuous yaw θ in [0, 360)° to 5 canonical views:
//      front (0°), three_quarter (45°), side (90°), three_quarter_back (135°), back (180°)
//      with horizontal flip (flipX: boolean) for right hemisphere [180°, 360°).
// ---------------------------------------------------------------------------

import {
  CapsulePart3D,
  ProjectedDetail,
  ProjectedPart,
  SkeletonDef,
  TurnaroundQuantization,
  TurnaroundViewName,
  Vec2,
  Vec3,
} from "./types";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Normalizes an angle into [0, 360) degrees.
 */
export function normalizeAngle360(deg: number): number {
  const mod = deg % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Rotates a 3D point by Yaw (Y-axis), Pitch (X-axis), and Roll (Z-axis).
 */
export function rotateEuler3D(
  p: Vec3,
  yawDeg: number,
  pitchDeg: number = 0,
  rollDeg: number = 0
): Vec3 {
  const yawRad = yawDeg * DEG_TO_RAD;
  const pitchRad = pitchDeg * DEG_TO_RAD;
  const rollRad = rollDeg * DEG_TO_RAD;

  const cy = Math.cos(yawRad);
  const sy = Math.sin(yawRad);
  const cp = Math.cos(pitchRad);
  const sp = Math.sin(pitchRad);
  const cr = Math.cos(rollRad);
  const sr = Math.sin(rollRad);

  // 1. Yaw around Y axis
  const x1 = p.x * cy + p.z * sy;
  const y1 = p.y;
  const z1 = -p.x * sy + p.z * cy;

  // 2. Pitch around X axis
  const x2 = x1;
  const y2 = y1 * cp - z1 * sp;
  const z2 = y1 * sp + z1 * cp;

  // 3. Roll around Z axis
  const x3 = x2 * cr - y2 * sr;
  const y3 = x2 * sr + y2 * cr;
  const z3 = z2;

  return { x: x3, y: y3, z: z3 };
}

/**
 * Calculates projected silhouette radii for an ellipsoid under 3D yaw and pitch.
 */
export function calculateProjectedRadii(
  rx: number,
  ry: number,
  rz: number,
  yawDeg: number,
  pitchDeg: number = 0
): { screenRx: number; screenRy: number; screenRz: number } {
  const yawRad = yawDeg * DEG_TO_RAD;
  const pitchRad = pitchDeg * DEG_TO_RAD;

  const cy = Math.cos(yawRad);
  const sy = Math.sin(yawRad);
  const cp = Math.cos(pitchRad);
  const sp = Math.sin(pitchRad);

  // Apparent horizontal silhouette radius on camera plane
  const screenRx = Math.sqrt((rx * cy) ** 2 + (rz * sy) ** 2);

  // Apparent vertical silhouette radius on camera plane
  const screenRy = Math.sqrt((ry * cp) ** 2 + (rz * sp) ** 2);

  // Apparent depth dimension
  const screenRz = Math.sqrt((rx * sy) ** 2 + (rz * cy) ** 2);

  return { screenRx, screenRy, screenRz };
}

/**
 * Categorical anatomical draw priority for breaking ties when z-depth is nearly equal.
 * Higher number = drawn later / on top.
 */
const CATEGORY_TIE_BREAKER: Record<string, number> = {
  tail: 1,
  shell: 2,
  torso: 3,
  limb: 4,
  head: 5,
  ear: 6,
  snout: 7,
  accessory: 8,
  eye: 9,
  detail: 10,
};

/**
 * Projects a 3D Capsule Skeleton to 2.5D screen space, applying continuous yaw
 * rotation and Painter's algorithm depth sorting.
 */
export function projectCapsuleSkeleton(
  skeleton: SkeletonDef,
  yawDeg: number,
  pitchDeg: number = 0,
  rollDeg: number = 0,
  customOrigin?: Vec2,
  scale: number = 1.0
): ProjectedPart[] {
  const originX = customOrigin ? customOrigin.x : skeleton.origin.x;
  const originY = customOrigin ? customOrigin.y : skeleton.origin.y;

  const projectedParts: ProjectedPart[] = skeleton.parts.map((part) => {
    // 1. Transform 3D position
    const partYaw = yawDeg + (part.yawDeg || 0);
    const partPitch = pitchDeg + (part.pitchDeg || 0);
    const partRoll = rollDeg + (part.rollDeg || 0);

    const rotatedPos = rotateEuler3D(part.center, partYaw, partPitch, partRoll);

    // 2. Compute screen 2D coordinates (orthographic projection)
    const screenX = originX + rotatedPos.x * scale;
    const screenY = originY + rotatedPos.y * scale;

    // 3. Compute projected radii
    const { screenRx, screenRy, screenRz } = calculateProjectedRadii(
      part.rx * scale,
      part.ry * scale,
      part.rz * scale,
      partYaw,
      partPitch
    );

    // 4. Compute outward normal in rotated space (rest normal is (0, 0, 1))
    const restNormal: Vec3 = { x: 0, y: 0, z: 1 };
    const rotatedNormal = rotateEuler3D(restNormal, partYaw, partPitch, partRoll);
    // facingCamera: +1 is looking directly at camera, 0 is profile, -1 is facing directly away
    const facingCamera = rotatedNormal.z;

    // 5. Project sub-details attached to this capsule
    const projectedDetails: ProjectedDetail[] = (part.details || []).map((detail) => {
      // Local detail position rotated with part
      const detailRotatedOffset = rotateEuler3D(detail.offset, partYaw, partPitch, partRoll);
      const detailWorld3D: Vec3 = {
        x: rotatedPos.x + detailRotatedOffset.x,
        y: rotatedPos.y + detailRotatedOffset.y,
        z: rotatedPos.z + detailRotatedOffset.z,
      };

      const detailScreenX = originX + detailWorld3D.x * scale;
      const detailScreenY = originY + detailWorld3D.y * scale;
      const detailScreenRx = detail.rx * scale;
      const detailScreenRy = detail.ry * scale;

      // Facing check: if cullBackFace is true and detail is on back hemisphere relative to part
      const detailFacing = detailRotatedOffset.z;
      const isVisible = detail.cullBackFace ? detailFacing > -0.1 : true;

      return {
        id: detail.id,
        name: detail.name,
        screenX: detailScreenX,
        screenY: detailScreenY,
        screenRx: detailScreenRx,
        screenRy: detailScreenRy,
        depth: detailWorld3D.z,
        fill: detail.fill,
        stroke: detail.stroke,
        strokeWidth: detail.strokeWidth ? detail.strokeWidth * scale : undefined,
        opacity: detail.opacity !== undefined ? detail.opacity : 1.0,
        visible: isVisible,
      };
    });

    return {
      id: part.id,
      name: part.name,
      category: part.category,
      pos3D: rotatedPos,
      screenX,
      screenY,
      screenRx,
      screenRy,
      screenRz,
      depth: rotatedPos.z,
      normal: rotatedNormal,
      facingCamera,
      fill: part.fill,
      stroke: part.stroke || skeleton.palette.outline,
      strokeWidth: (part.strokeWidth || 10) * scale,
      highlightFill: part.highlightFill,
      shadowFill: part.shadowFill,
      opacity: part.opacity !== undefined ? part.opacity : 1.0,
      side: part.side,
      details: projectedDetails,
    };
  });

  // Painter's Algorithm: Sort from furthest away (most negative z') to closest (most positive z')
  projectedParts.sort((a, b) => {
    const depthDiff = a.depth - b.depth;
    if (Math.abs(depthDiff) > 1.5) {
      return depthDiff;
    }
    // Tie-breaker based on anatomical layering
    const prioA = CATEGORY_TIE_BREAKER[a.category] || 5;
    const prioB = CATEGORY_TIE_BREAKER[b.category] || 5;
    return prioA - prioB;
  });

  return projectedParts;
}

/**
 * Maps continuous yaw angle θ in [0, 360) degrees to the 5 canonical orthographic
 * turnaround views:
 *   - front (0°)
 *   - three_quarter (45°)
 *   - side (90°)
 *   - three_quarter_back (135°)
 *   - back (180°)
 *
 * For right hemisphere yaw in [180°, 360°), flipX is set to true and mirrored.
 */
export function quantizeTurnaroundAngle(rawYawDeg: number): TurnaroundQuantization {
  const normYaw = normalizeAngle360(rawYawDeg);

  // Determine hemisphere:
  // [0..180]: Left hemisphere (normal)
  // (180..360): Right hemisphere (flipped horizontally)
  const flipX = normYaw > 180 && normYaw < 360;
  // Reflected angle into [0, 180]
  const angleInHemisphere = flipX ? 360 - normYaw : normYaw;

  let view: TurnaroundViewName = "front";
  let nominalAngleDeg = 0;
  let nextView: TurnaroundViewName | undefined;
  let label = "Front View (0°)";

  if (angleInHemisphere <= 22.5) {
    view = "front";
    nominalAngleDeg = 0;
    nextView = "three_quarter";
    label = flipX ? "Front View (0°)" : "Front View (0°)";
  } else if (angleInHemisphere <= 67.5) {
    view = "three_quarter";
    nominalAngleDeg = 45;
    nextView = angleInHemisphere < 45 ? "front" : "side";
    label = flipX ? "3/4 View (Right 315°)" : "3/4 View (Left 45°)";
  } else if (angleInHemisphere <= 112.5) {
    view = "side";
    nominalAngleDeg = 90;
    nextView = angleInHemisphere < 90 ? "three_quarter" : "three_quarter_back";
    label = flipX ? "Side Profile (Right 270°)" : "Side Profile (Left 90°)";
  } else if (angleInHemisphere <= 157.5) {
    view = "three_quarter_back";
    nominalAngleDeg = 135;
    nextView = angleInHemisphere < 135 ? "side" : "back";
    label = flipX ? "3/4 Back View (Right 225°)" : "3/4 Back View (Left 135°)";
  } else {
    view = "back";
    nominalAngleDeg = 180;
    nextView = "three_quarter_back";
    label = "Back View (180°)";
  }

  const angleDeviationDeg = angleInHemisphere - nominalAngleDeg;
  // Blend factor to adjacent view for smooth transition
  const blendFactor = Math.min(1.0, Math.abs(angleDeviationDeg) / 22.5);

  return {
    rawYawDeg: normYaw,
    view,
    nominalAngleDeg,
    flipX,
    angleDeviationDeg,
    blendFactor,
    nextView,
    label,
  };
}

/**
 * Calculates 3D Orbit Compass Gizmo vectors for HUD overlay.
 */
export function calculate3DOrbitGizmo(
  yawDeg: number,
  radius: number = 44
): {
  ringPath: string;
  pointerPos: Vec2;
  pointerZ: number;
  camFacingAngleRad: number;
} {
  const yawRad = yawDeg * DEG_TO_RAD;

  // Ellipse ring representing the horizontal ground/orbit plane
  const rx = radius;
  const ry = radius * 0.38; // 2.5D perspective tilt

  // Pointer position along the perimeter
  // Camera is at (0, 0, +1), pointing towards origin
  const px = rx * Math.sin(yawRad);
  const py = ry * Math.cos(yawRad);
  const pointerZ = Math.cos(yawRad);

  // SVG Ellipse path centered at (0, 0)
  const ringPath = `M ${-rx} 0 A ${rx} ${ry} 0 1 0 ${rx} 0 A ${rx} ${ry} 0 1 0 ${-rx} 0`;

  return {
    ringPath,
    pointerPos: { x: px, y: py },
    pointerZ,
    camFacingAngleRad: yawRad,
  };
}

// ---------------------------------------------------------------------------
// PRESET 1: GOLDEN TURTLE (Rùa Vàng) 2.5D CAPSULE SKELETON
// ---------------------------------------------------------------------------
export const TURTLE_CAPSULE_SKELETON: SkeletonDef = {
  id: "turtle.kawaii.capsule",
  name: "Golden Turtle (Rùa Vàng)",
  origin: { x: 540, y: 700, z: 0 },
  palette: {
    outline: "#3a2e2a",
    primary: "#f2b53c",   // Golden Mai
    secondary: "#94a344", // Turtle Skin Green
    accent: "#e8724a",    // Scute Spot Orange
    highlight: "#fff1cc",
    shadow: "#c9821e",
  },
  parts: [
    // 1. Back Tail (small green cone behind shell)
    {
      id: "tail",
      name: "Turtle Tail",
      category: "tail",
      center: { x: 0, y: 75, z: -135 },
      rx: 22,
      ry: 18,
      rz: 28,
      fill: "#94a344",
      stroke: "#3a2e2a",
      strokeWidth: 8,
    },
    // 2. Hind Flippers / Feet (left & right)
    {
      id: "flipper_back_left",
      name: "Back Left Flipper",
      category: "limb",
      side: "left",
      center: { x: -85, y: 110, z: -75 },
      rx: 34,
      ry: 26,
      rz: 42,
      yawDeg: -25,
      pitchDeg: 10,
      fill: "#94a344",
      stroke: "#3a2e2a",
      strokeWidth: 9,
    },
    {
      id: "flipper_back_right",
      name: "Back Right Flipper",
      category: "limb",
      side: "right",
      center: { x: 85, y: 110, z: -75 },
      rx: 34,
      ry: 26,
      rz: 42,
      yawDeg: 25,
      pitchDeg: 10,
      fill: "#94a344",
      stroke: "#3a2e2a",
      strokeWidth: 9,
    },
    // 3. Shell (Mai Rùa) — Massive golden domed ellipsoid
    {
      id: "shell",
      name: "Golden Carapace (Mai)",
      category: "shell",
      center: { x: 0, y: 15, z: 0 },
      rx: 140,
      ry: 122,
      rz: 130,
      fill: "#f2b53c",
      stroke: "#3a2e2a",
      strokeWidth: 12,
      highlightFill: "#fbe49d",
      shadowFill: "#c9821e",
      details: [
        // Shell Scute hexagonal spots
        { id: "scute_top", name: "Top Scute", offset: { x: 0, y: -45, z: 100 }, rx: 24, ry: 20, fill: "#e8724a", stroke: "#3a2e2a", strokeWidth: 5, cullBackFace: true },
        { id: "scute_left", name: "Left Scute", offset: { x: -62, y: 0, z: 85 }, rx: 20, ry: 17, fill: "#e8724a", stroke: "#3a2e2a", strokeWidth: 5, cullBackFace: true },
        { id: "scute_right", name: "Right Scute", offset: { x: 62, y: 0, z: 85 }, rx: 20, ry: 17, fill: "#e8724a", stroke: "#3a2e2a", strokeWidth: 5, cullBackFace: true },
        { id: "scute_back_l", name: "Back L Scute", offset: { x: -55, y: -15, z: -85 }, rx: 22, ry: 18, fill: "#e8724a", stroke: "#3a2e2a", strokeWidth: 5, cullBackFace: true },
        { id: "scute_back_r", name: "Back R Scute", offset: { x: 55, y: -15, z: -85 }, rx: 22, ry: 18, fill: "#e8724a", stroke: "#3a2e2a", strokeWidth: 5, cullBackFace: true },
      ],
    },
    // 4. Belly / Plastron (Yếm bụng) — lower ventral plate
    {
      id: "plastron",
      name: "Ventral Plastron (Yếm)",
      category: "torso",
      center: { x: 0, y: 85, z: 25 },
      rx: 110,
      ry: 48,
      rz: 95,
      fill: "#f5e6c8",
      stroke: "#3a2e2a",
      strokeWidth: 9,
    },
    // 5. Fore Flippers / Arms (left & right)
    {
      id: "flipper_front_left",
      name: "Front Left Flipper",
      category: "limb",
      side: "left",
      center: { x: -115, y: 55, z: 50 },
      rx: 36,
      ry: 52,
      rz: 28,
      yawDeg: -35,
      rollDeg: -15,
      fill: "#94a344",
      stroke: "#3a2e2a",
      strokeWidth: 10,
    },
    {
      id: "flipper_front_right",
      name: "Front Right Flipper",
      category: "limb",
      side: "right",
      center: { x: 115, y: 55, z: 50 },
      rx: 36,
      ry: 52,
      rz: 28,
      yawDeg: 35,
      rollDeg: 15,
      fill: "#94a344",
      stroke: "#3a2e2a",
      strokeWidth: 10,
    },
    // 6. Neck joint connecting body to head
    {
      id: "neck",
      name: "Turtle Neck",
      category: "head",
      center: { x: 0, y: -55, z: 75 },
      rx: 48,
      ry: 42,
      rz: 45,
      fill: "#94a344",
      stroke: "#3a2e2a",
      strokeWidth: 9,
    },
    // 7. Head (Round green kawaii head)
    {
      id: "head",
      name: "Turtle Head",
      category: "head",
      center: { x: 0, y: -130, z: 120 },
      rx: 96,
      ry: 82,
      rz: 90,
      fill: "#94a344",
      stroke: "#3a2e2a",
      strokeWidth: 12,
      highlightFill: "#a8b755",
      shadowFill: "#7c8936",
      details: [
        // Big kawaii eyes
        { id: "eye_left", name: "Left Eye", offset: { x: -44, y: -15, z: 80 }, rx: 18, ry: 22, fill: "#3a2e2a", stroke: "#ffffff", strokeWidth: 3, cullBackFace: true },
        { id: "eye_right", name: "Right Eye", offset: { x: 44, y: -15, z: 80 }, rx: 18, ry: 22, fill: "#3a2e2a", stroke: "#ffffff", strokeWidth: 3, cullBackFace: true },
        // Pink blushing cheeks
        { id: "blush_left", name: "Left Blush", offset: { x: -58, y: 15, z: 72 }, rx: 22, ry: 13, fill: "#ff9db4", opacity: 0.85, cullBackFace: true },
        { id: "blush_right", name: "Right Blush", offset: { x: 58, y: 15, z: 72 }, rx: 22, ry: 13, fill: "#ff9db4", opacity: 0.85, cullBackFace: true },
        // Scholarly round glasses frame
        { id: "glasses_left", name: "Left Glasses", offset: { x: -44, y: -15, z: 88 }, rx: 26, ry: 28, fill: "none", stroke: "#5b3a2f", strokeWidth: 6, cullBackFace: true },
        { id: "glasses_right", name: "Right Glasses", offset: { x: 44, y: -15, z: 88 }, rx: 26, ry: 28, fill: "none", stroke: "#5b3a2f", strokeWidth: 6, cullBackFace: true },
        { id: "glasses_bridge", name: "Glasses Bridge", offset: { x: 0, y: -15, z: 88 }, rx: 16, ry: 4, fill: "#5b3a2f", cullBackFace: true },
      ],
    },
    // 8. Snout / Nose bump (pointing forward)
    {
      id: "snout",
      name: "Turtle Snout",
      category: "snout",
      center: { x: 0, y: -108, z: 200 },
      rx: 22,
      ry: 16,
      rz: 20,
      fill: "#a8b755",
      stroke: "#3a2e2a",
      strokeWidth: 6,
      details: [
        { id: "nostril_l", name: "Left Nostril", offset: { x: -6, y: -2, z: 18 }, rx: 3, ry: 3, fill: "#5b3a2f", cullBackFace: true },
        { id: "nostril_r", name: "Right Nostril", offset: { x: 6, y: -2, z: 18 }, rx: 3, ry: 3, fill: "#5b3a2f", cullBackFace: true },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// PRESET 2: KAWAII RABBIT (Thỏ Trắng) 2.5D CAPSULE SKELETON
// ---------------------------------------------------------------------------
export const RABBIT_CAPSULE_SKELETON: SkeletonDef = {
  id: "rabbit.kawaii.capsule",
  name: "Kawaii Rabbit (Thỏ Trắng)",
  origin: { x: 540, y: 720, z: 0 },
  palette: {
    outline: "#3a2e2a",
    primary: "#f3ebe4",   // Soft cream white fur
    secondary: "#e8503a", // Red vest
    accent: "#ff9db4",    // Soft blush & inner ear pink
    highlight: "#ffffff",
    shadow: "#dfd2c6",
  },
  parts: [
    // 1. Fluffy tail puff at back
    {
      id: "tail",
      name: "Rabbit Fluffy Tail",
      category: "tail",
      center: { x: 0, y: 65, z: -115 },
      rx: 34,
      ry: 32,
      rz: 34,
      fill: "#ffffff",
      stroke: "#3a2e2a",
      strokeWidth: 8,
    },
    // 2. Feet (left & right)
    {
      id: "foot_left",
      name: "Left Foot",
      category: "limb",
      side: "left",
      center: { x: -55, y: 135, z: 15 },
      rx: 44,
      ry: 24,
      rz: 58,
      fill: "#ffffff",
      stroke: "#3a2e2a",
      strokeWidth: 9,
    },
    {
      id: "foot_right",
      name: "Right Foot",
      category: "limb",
      side: "right",
      center: { x: 55, y: 135, z: 15 },
      rx: 44,
      ry: 24,
      rz: 58,
      fill: "#ffffff",
      stroke: "#3a2e2a",
      strokeWidth: 9,
    },
    // 3. Body Torso
    {
      id: "body",
      name: "Rabbit Body",
      category: "torso",
      center: { x: 0, y: 55, z: 0 },
      rx: 110,
      ry: 95,
      rz: 100,
      fill: "#f3ebe4",
      stroke: "#3a2e2a",
      strokeWidth: 12,
      highlightFill: "#ffffff",
      shadowFill: "#ded3c6",
    },
    // 4. Red Vest Jacket Layer
    {
      id: "vest",
      name: "Red Waistcoat",
      category: "accessory",
      center: { x: 0, y: 48, z: 8 },
      rx: 114,
      ry: 64,
      rz: 102,
      fill: "#e8503a",
      stroke: "#3a2e2a",
      strokeWidth: 10,
      details: [
        // Golden/white vest buttons
        { id: "button_top", name: "Top Button", offset: { x: 0, y: -16, z: 104 }, rx: 9, ry: 9, fill: "#ffffff", stroke: "#3a2e2a", strokeWidth: 4, cullBackFace: true },
        { id: "button_bot", name: "Bottom Button", offset: { x: 0, y: 22, z: 104 }, rx: 9, ry: 9, fill: "#ffffff", stroke: "#3a2e2a", strokeWidth: 4, cullBackFace: true },
      ],
    },
    // 5. Fore Paws / Arms (left & right)
    {
      id: "arm_left",
      name: "Left Arm",
      category: "limb",
      side: "left",
      center: { x: -108, y: 35, z: 35 },
      rx: 24,
      ry: 42,
      rz: 24,
      rollDeg: -12,
      fill: "#ffffff",
      stroke: "#3a2e2a",
      strokeWidth: 9,
    },
    {
      id: "arm_right",
      name: "Right Arm",
      category: "limb",
      side: "right",
      center: { x: 108, y: 35, z: 35 },
      rx: 24,
      ry: 42,
      rz: 24,
      rollDeg: 12,
      fill: "#ffffff",
      stroke: "#3a2e2a",
      strokeWidth: 9,
    },
    // 6. Head (Large kawaii white head)
    {
      id: "head",
      name: "Rabbit Head",
      category: "head",
      center: { x: 0, y: -130, z: 25 },
      rx: 165,
      ry: 140,
      rz: 145,
      fill: "#f3ebe4",
      stroke: "#3a2e2a",
      strokeWidth: 14,
      highlightFill: "#ffffff",
      shadowFill: "#ded3c6",
      details: [
        // Large sparkle eyes
        { id: "eye_left", name: "Left Eye", offset: { x: -68, y: -5, z: 140 }, rx: 20, ry: 26, fill: "#3a2e2a", stroke: "#ffffff", strokeWidth: 4, cullBackFace: true },
        { id: "eye_right", name: "Right Eye", offset: { x: 68, y: -5, z: 140 }, rx: 20, ry: 26, fill: "#3a2e2a", stroke: "#ffffff", strokeWidth: 4, cullBackFace: true },
        // Pink nose
        { id: "nose", name: "Pink Nose", offset: { x: 0, y: 32, z: 146 }, rx: 15, ry: 10, fill: "#ff8fa3", stroke: "#3a2e2a", strokeWidth: 4, cullBackFace: true },
        // Blushing cheeks
        { id: "blush_left", name: "Left Blush", offset: { x: -110, y: 38, z: 120 }, rx: 28, ry: 16, fill: "#ff9db4", opacity: 0.85, cullBackFace: true },
        { id: "blush_right", name: "Right Blush", offset: { x: 110, y: 38, z: 120 }, rx: 28, ry: 16, fill: "#ff9db4", opacity: 0.85, cullBackFace: true },
      ],
    },
    // 7. Ears (Left & Right tall vertical capsules)
    {
      id: "ear_left",
      name: "Left Long Ear",
      category: "ear",
      side: "left",
      center: { x: -45, y: -285, z: 10 },
      rx: 34,
      ry: 82,
      rz: 28,
      rollDeg: -8,
      fill: "#ffffff",
      stroke: "#3a2e2a",
      strokeWidth: 11,
      details: [
        { id: "ear_pink_l", name: "Inner Pink Left", offset: { x: 0, y: 6, z: 16 }, rx: 17, ry: 54, fill: "#ffc9d6", cullBackFace: true },
      ],
    },
    {
      id: "ear_right",
      name: "Right Long Ear",
      category: "ear",
      side: "right",
      center: { x: 45, y: -285, z: 10 },
      rx: 34,
      ry: 82,
      rz: 28,
      rollDeg: 8,
      fill: "#ffffff",
      stroke: "#3a2e2a",
      strokeWidth: 11,
      details: [
        { id: "ear_pink_r", name: "Inner Pink Right", offset: { x: 0, y: 6, z: 16 }, rx: 17, ry: 54, fill: "#ffc9d6", cullBackFace: true },
      ],
    },
  ],
};
