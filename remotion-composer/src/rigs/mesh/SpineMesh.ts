// ---------------------------------------------------------------------------
// rigs/mesh/SpineMesh.ts — 2D Spine-style Mesh Deformation Engine
// Part 1 of Spine-style Mesh Deformation for OpenMontage / Remotion rigs.
//
// Implements:
// 1. Forward Kinematics (FK) for a 3-bone hierarchical chain (root, mid, tip)
// 2. Linear Blend Skinning (LBS) with smooth partition-of-unity weight blending
// 3. 2D Ribbon Triangulation & mesh deformation
// 4. Closed-loop smooth contour deformation (Catmull-Rom spline curves)
// 5. Secondary physics / organic wave propagation for ear sway, droop & snap
// ---------------------------------------------------------------------------

import { Bone2D, BoneChain, SkinVertex, Triangle, TriangleMesh, Vec2 } from "./types";

/** Clamp a number between 0 and 1 */
export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

// ---------------------------------------------------------------------------
// 1. Forward Kinematics (FK)
// ---------------------------------------------------------------------------

/**
 * Computes rest positions of the 4 joints in a 3-bone chain.
 * In rest pose, all bones point straight up along -Y.
 */
export function computeRestJoints(
  rootPos: Vec2,
  lengths: [number, number, number]
): [Vec2, Vec2, Vec2, Vec2] {
  const [l0, l1, l2] = lengths;
  const j0: Vec2 = { x: rootPos.x, y: rootPos.y };
  const j1: Vec2 = { x: rootPos.x, y: rootPos.y - l0 };
  const j2: Vec2 = { x: rootPos.x, y: rootPos.y - l0 - l1 };
  const j3: Vec2 = { x: rootPos.x, y: rootPos.y - l0 - l1 - l2 };
  return [j0, j1, j2, j3];
}

/**
 * Computes 3-bone chain world joint positions and cumulative world angles.
 * Angles are in degrees:
 *   - localAngles[0]: root rotation (relative to rest straight-up vector)
 *   - localAngles[1]: mid bend (relative to root bone)
 *   - localAngles[2]: tip flop (relative to mid bone)
 * Positive angle rotates clockwise in screen coordinates.
 */
export function computeForwardKinematics(
  rootPos: Vec2,
  lengths: [number, number, number],
  localAngles: [number, number, number]
): BoneChain {
  const [l0, l1, l2] = lengths;
  const [th0, th1, th2] = localAngles;

  // Cumulative world angles in degrees
  const wAng0 = th0;
  const wAng1 = wAng0 + th1;
  const wAng2 = wAng1 + th2;

  // Radians
  const rad0 = (wAng0 * Math.PI) / 180;
  const rad1 = (wAng1 * Math.PI) / 180;
  const rad2 = (wAng2 * Math.PI) / 180;

  // Joint 0 (root)
  const j0: Vec2 = { x: rootPos.x, y: rootPos.y };

  // Joint 1 (mid start): rotated from straight-up (0, -l0)
  const j1: Vec2 = {
    x: j0.x + l0 * Math.sin(rad0),
    y: j0.y - l0 * Math.cos(rad0),
  };

  // Joint 2 (tip start): rotated from j1
  const j2: Vec2 = {
    x: j1.x + l1 * Math.sin(rad1),
    y: j1.y - l1 * Math.cos(rad1),
  };

  // Joint 3 (tip end): rotated from j2
  const j3: Vec2 = {
    x: j2.x + l2 * Math.sin(rad2),
    y: j2.y - l2 * Math.cos(rad2),
  };

  const bone0: Bone2D = {
    id: "bone-root",
    name: "Root",
    length: l0,
    localAngle: th0,
    worldAngle: wAng0,
    worldStart: j0,
    worldEnd: j1,
  };

  const bone1: Bone2D = {
    id: "bone-mid",
    name: "Mid",
    length: l1,
    localAngle: th1,
    worldAngle: wAng1,
    worldStart: j1,
    worldEnd: j2,
  };

  const bone2: Bone2D = {
    id: "bone-tip",
    name: "Tip",
    length: l2,
    localAngle: th2,
    worldAngle: wAng2,
    worldStart: j2,
    worldEnd: j3,
  };

  return {
    rootPosition: rootPos,
    bones: [bone0, bone1, bone2],
  };
}

// ---------------------------------------------------------------------------
// 2. Linear Blend Skinning (LBS)
// ---------------------------------------------------------------------------

/**
 * Computes smooth C1 partition-of-unity skinning weights for u in [0, 1].
 *   u = 0 (base): [1, 0, 0]
 *   u = 0.5 (mid): [0.08, 0.84, 0.08]
 *   u = 1.0 (tip): [0, 0, 1]
 */
export function computeSkinningWeights(u: number): [number, number, number] {
  const cu = clamp01(u);

  // Quadratic bell curves for smooth C1 blending
  const c0 = Math.max(0, 1 - cu / 0.52);
  const w0 = c0 * c0;

  const c2 = Math.max(0, (cu - 0.48) / 0.52);
  const w2 = c2 * c2;

  const d1 = Math.abs(cu - 0.5);
  const c1 = Math.max(0, 1 - d1 / 0.48);
  const w1 = c1 * c1;

  const sum = w0 + w1 + w2 || 1;
  return [w0 / sum, w1 / sum, w2 / sum];
}

/**
 * Deforms a rest vertex using Linear Blend Skinning (LBS) across the 3 bones.
 * V' = sum_{i=0..2} w_i * (J_i + R(alpha_i) * (V - J_i^rest))
 */
export function deformVertexLBS(
  restPos: Vec2,
  weights: [number, number, number],
  chain: BoneChain,
  restJoints: [Vec2, Vec2, Vec2, Vec2]
): Vec2 {
  let defX = 0;
  let defY = 0;

  for (let i = 0; i < 3; i++) {
    const w = weights[i];
    if (w <= 0.0001) continue;

    const bone = chain.bones[i];
    const restJ = restJoints[i];
    const worldJ = bone.worldStart;
    const rad = (bone.worldAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    // Vector from bone's rest joint to the rest vertex
    const dx = restPos.x - restJ.x;
    const dy = restPos.y - restJ.y;

    // Transformed position under bone i
    const transX = worldJ.x + (dx * cosA - dy * sinA);
    const transY = worldJ.y + (dx * sinA + dy * cosA);

    defX += w * transX;
    defY += w * transY;
  }

  return { x: defX, y: defY };
}

// ---------------------------------------------------------------------------
// 3. Ribbon Triangulation for 2D Triangle Mesh Skinning
// ---------------------------------------------------------------------------

/**
 * Generates a 2D ribbon triangle mesh covering an elliptical ear shape.
 */
export function createEarTriangleMesh(
  baseX: number,
  baseY: number,
  height: number,
  width: number,
  rows = 14,
  cols = 5
): TriangleMesh {
  const vertices: SkinVertex[] = [];
  const triangles: Triangle[] = [];

  const rx = width / 2;
  const ry = height / 2;
  const cy = baseY - ry;

  for (let r = 0; r < rows; r++) {
    const u = r / (rows - 1);
    const yRest = baseY - u * height;

    // Ellipse half-width at height yRest
    const dyNorm = (yRest - cy) / ry;
    const clampedDy = Math.min(1, Math.max(-1, dyNorm));
    const halfW = rx * Math.sqrt(Math.max(0, 1 - clampedDy * clampedDy));

    for (let c = 0; c < cols; c++) {
      const v = -1 + 2 * (c / (cols - 1));
      const xRest = baseX + v * halfW;
      const weights = computeSkinningWeights(u);

      vertices.push({
        restPos: { x: xRest, y: yRest },
        u,
        v,
        weights,
      });
    }
  }

  // Generate triangle strip indices
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const i0 = r * cols + c;
      const i1 = r * cols + (c + 1);
      const i2 = (r + 1) * cols + (c + 1);
      const i3 = (r + 1) * cols + c;

      // 2 triangles per quad cell
      triangles.push({ indices: [i0, i1, i3] });
      triangles.push({ indices: [i1, i2, i3] });
    }
  }

  return { vertices, triangles };
}

/**
 * Deforms all vertices in a triangle mesh using forward kinematics and LBS.
 */
export function deformTriangleMesh(
  mesh: TriangleMesh,
  chain: BoneChain,
  restJoints: [Vec2, Vec2, Vec2, Vec2]
): TriangleMesh {
  const deformedVertices: SkinVertex[] = mesh.vertices.map((v) => ({
    ...v,
    deformedPos: deformVertexLBS(v.restPos, v.weights, chain, restJoints),
  }));

  return {
    vertices: deformedVertices,
    triangles: mesh.triangles,
  };
}

// ---------------------------------------------------------------------------
// 4. Smooth Contour Sampling & Catmull-Rom Closed Spline Deformation
// ---------------------------------------------------------------------------

/**
 * Samples perimeter points from an ellipse representing an ear layer,
 * assigning normalized u along the ear length and skinning weights.
 */
export function sampleEllipseContour(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  baseY: number,
  totalHeight: number,
  numSamples = 48
): SkinVertex[] {
  const points: SkinVertex[] = [];

  for (let i = 0; i < numSamples; i++) {
    // Traverse perimeter clockwise starting from bottom (theta = PI/2)
    const theta = Math.PI / 2 + (2 * Math.PI * i) / numSamples;
    const xRest = cx + rx * Math.cos(theta);
    const yRest = cy + ry * Math.sin(theta);

    const u = clamp01((baseY - yRest) / totalHeight);
    const v = rx > 0 ? (xRest - cx) / rx : 0;
    const weights = computeSkinningWeights(u);

    points.push({
      restPos: { x: xRest, y: yRest },
      u,
      v,
      weights,
    });
  }

  return points;
}

/**
 * Converts a sequence of deformed 2D points into a smooth Catmull-Rom cubic Bézier closed SVG path.
 */
export function createSmoothPathFromPoints(points: Vec2[]): string {
  const n = points.length;
  if (n < 3) return "";

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    // Catmull-Rom to cubic Bézier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  d += " Z";
  return d;
}

// ---------------------------------------------------------------------------
// 5. Organic Ear Physics & Animation Mapping
// ---------------------------------------------------------------------------

export interface OrganicEarParams {
  side: "left" | "right";
  /** Current time in seconds */
  t: number;
  /** Asleep envelope in [0, 1] */
  asleep?: number;
  /** Wake-up startled envelope in [0, 1] */
  wakePop?: number;
  /** Whole-body vertical hop displacement */
  hopDy?: number;
}

/**
 * Computes organic bone angles (baseAngle, midBend, tipFlop) based on character state.
 *
 * - Idle: traveling wave propagation from base to tip (secondary lag)
 * - Asleep: base flares out, mid droops, tip flops heavily into an organic downward arc
 * - Startled wake: snaps upright with elastic follow-through
 * - Hop: inertia drag while airborne
 */
export function computeOrganicEarAngles(params: OrganicEarParams): {
  baseAngle: number;
  midBend: number;
  tipFlop: number;
} {
  const { side, t, asleep = 0, wakePop = 0, hopDy = 0 } = params;
  const sign = side === "left" ? -1 : 1;

  // 1. Idle wave sway: traveling wave propagation with natural phase lag
  const swayBase = Math.sin(Math.PI * 2 * 0.55 * t) * 1.8 * sign;
  const swayMid = Math.sin(Math.PI * 2 * 0.55 * t - 0.45) * 2.8 * sign;
  const swayTip = Math.sin(Math.PI * 2 * 0.55 * t - 0.9) * 4.4 * sign;

  // 2. Asleep ear droop: progressive bending creates a graceful downward crescent
  // Base flares slightly outward (8°), mid bends out/down (26°), tip flops down (34°)
  const sleepBase = 8 * asleep * sign;
  const sleepMid = 26 * asleep * sign;
  const sleepTip = 34 * asleep * sign;

  // 3. Startled wake snap: sharp upward whip with elastic tension
  const wakeBase = -14 * wakePop * sign;
  const wakeMid = -10 * wakePop * sign;
  const wakeTip = -6 * wakePop * sign;

  // 4. Hop drag (inertia drag when moving upward, bounce on landing)
  const hopDragMid = (hopDy < 0 ? -hopDy * 0.12 : -hopDy * 0.05) * sign;
  const hopDragTip = (hopDy < 0 ? -hopDy * 0.22 : -hopDy * 0.08) * sign;

  return {
    baseAngle: swayBase + sleepBase + wakeBase,
    midBend: swayMid + sleepMid + wakeMid + hopDragMid,
    tipFlop: swayTip + sleepTip + wakeTip + hopDragTip,
  };
}
