// ---------------------------------------------------------------------------
// rigs/mesh/types.ts — 2D Mesh Deformation & Bone Skinning Types
// Part 1 of Spine-style Mesh Deformation for OpenMontage / Remotion rigs.
// Defines 3-bone chain Forward Kinematics, Linear Blend Skinning (LBS),
// Ribbon Triangulation, and DeformableEar configuration contracts.
// ---------------------------------------------------------------------------

export interface Vec2 {
  x: number;
  y: number;
}

export interface Bone2D {
  id: string;
  name: string;
  length: number;
  /** Local rotation in degrees relative to parent */
  localAngle: number;
  /** Cumulative world angle in degrees (0 = along rest direction, clockwise positive) */
  worldAngle: number;
  /** Joint origin world coordinates */
  worldStart: Vec2;
  /** Joint end / tip world coordinates */
  worldEnd: Vec2;
}

export interface BoneChain {
  rootPosition: Vec2;
  /** 3-bone chain: [root (0), mid (1), tip (2)] */
  bones: [Bone2D, Bone2D, Bone2D];
}

export interface SkinWeight {
  boneIndex: number;
  weight: number;
}

export interface SkinVertex {
  /** Rest position in local/world coordinate space */
  restPos: Vec2;
  /** Normalized position along spine length: u in [0, 1] (0 = base, 1 = tip) */
  u: number;
  /** Normalized span across width: v in [-1, 1] (-1 = left, +1 = right) */
  v: number;
  /** Skinning weights for the 3 bones [w_root, w_mid, w_tip], sum to 1.0 */
  weights: [number, number, number];
  /** Deformed world coordinate computed via Linear Blend Skinning */
  deformedPos?: Vec2;
}

export interface Triangle {
  /** Indices into the SkinVertex array */
  indices: [number, number, number];
}

export interface TriangleMesh {
  vertices: SkinVertex[];
  triangles: Triangle[];
}

export interface EarPinkLayer {
  cy: number;
  rx: number;
  ry: number;
  fill: string;
}

export type EarRenderMode = "contour" | "mesh" | "both";

export interface DeformableEarConfig {
  baseX: number;
  baseY: number;
  height: number;
  width: number;
  side: "left" | "right";
  /** Bone 0 (root) angle in degrees */
  baseAngle: number;
  /** Bone 1 (mid) bend relative to bone 0 in degrees */
  midBend: number;
  /** Bone 2 (tip) flop relative to bone 1 in degrees */
  tipFlop: number;
  renderMode?: EarRenderMode;
  showBones?: boolean;
  showWireframe?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  outerFill?: string;
  pinks?: EarPinkLayer[];
}
