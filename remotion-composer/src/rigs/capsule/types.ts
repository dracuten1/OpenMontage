// ---------------------------------------------------------------------------
// rigs/capsule/types.ts — 2.5D Capsule Skeleton & Turnaround Types
// Part 2 of TASK_MESH_AND_TURNAROUND for OpenMontage / Remotion rigs.
// Defines 3D/2.5D Capsule geometry, continuous yaw projection,
// Painter's algorithm depth-sorting, and 5-view turnaround quantization.
// ---------------------------------------------------------------------------

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type CapsuleCategory =
  | "head"
  | "torso"
  | "shell"
  | "limb"
  | "ear"
  | "tail"
  | "snout"
  | "eye"
  | "accessory"
  | "detail";

export interface CapsuleDetail {
  id: string;
  name: string;
  /** Relative offset from parent capsule center */
  offset: Vec3;
  /** Radius or dimensions */
  rx: number;
  ry: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  /** If true, only visible when facing camera (facing Z > 0) */
  cullBackFace?: boolean;
}

export interface CapsulePart3D {
  id: string;
  name: string;
  category: CapsuleCategory;
  /** Center in rest frame relative to skeleton origin (x: right, y: down, z: forward towards camera) */
  center: Vec3;
  /** Radii in local principal axes */
  rx: number;
  ry: number;
  rz: number;
  /** Optional rest rotations (degrees) */
  pitchDeg?: number;
  rollDeg?: number;
  yawDeg?: number;
  /** Styling */
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  /** Shading */
  highlightFill?: string;
  shadowFill?: string;
  opacity?: number;
  side?: "left" | "right" | "center";
  /** Optional sub-details attached to this capsule (e.g. spots, buttons, nostrils) */
  details?: CapsuleDetail[];
}

export interface ProjectedDetail {
  id: string;
  name: string;
  screenX: number;
  screenY: number;
  screenRx: number;
  screenRy: number;
  depth: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity: number;
  visible: boolean;
}

export interface ProjectedPart {
  id: string;
  name: string;
  category: CapsuleCategory;
  /** Transformed 3D position after yaw/pitch rotation */
  pos3D: Vec3;
  /** Screen 2D projected center */
  screenX: number;
  screenY: number;
  /** Projected screen radii */
  screenRx: number;
  screenRy: number;
  screenRz: number;
  /** Z-depth for Painter's algorithm (higher = closer to camera, drawn on top) */
  depth: number;
  /** Normal vector pointing out from front of part */
  normal: Vec3;
  /** Direction facing relative to camera (-1: away, 0: profile, 1: directly facing) */
  facingCamera: number;
  /** Visual styling */
  fill: string;
  stroke: string;
  strokeWidth: number;
  highlightFill?: string;
  shadowFill?: string;
  opacity: number;
  side?: "left" | "right" | "center";
  details: ProjectedDetail[];
}

/** 5 canonical orthographic turnaround views */
export type TurnaroundViewName =
  | "front"              // 0°
  | "three_quarter"      // 45°
  | "side"               // 90°
  | "three_quarter_back" // 135°
  | "back";              // 180°

export interface TurnaroundQuantization {
  /** Continuous input yaw in [0, 360) degrees */
  rawYawDeg: number;
  /** Quantized canonical turnaround view */
  view: TurnaroundViewName;
  /** Nominal angle of the view (0, 45, 90, 135, or 180) */
  nominalAngleDeg: number;
  /** Whether the character is in the right hemisphere [180°, 360°) and mirrored horizontally */
  flipX: boolean;
  /** Angular deviation from nominal view (-22.5° .. +22.5°) */
  angleDeviationDeg: number;
  /** Normalized transition weight [0..1] to adjacent view for sprite blending */
  blendFactor: number;
  /** Adjacent view for cross-fading */
  nextView?: TurnaroundViewName;
  /** Human-readable view label for HUD */
  label: string;
}

export interface TurnaroundSpriteDef {
  view: TurnaroundViewName;
  /** Relative asset path or base64 data URL */
  imagePath: string;
  width: number;
  height: number;
  anchorX?: number;
  anchorY?: number;
  scale?: number;
}

export interface SkeletonDef {
  id: string;
  name: string;
  /** Rest root origin in screen coordinates (e.g. [540, 680, 0]) */
  origin: Vec3;
  /** Capsule parts forming the character */
  parts: CapsulePart3D[];
  /** Palette & styling specs */
  palette: {
    outline: string;
    primary: string;
    secondary: string;
    accent: string;
    highlight: string;
    shadow: string;
  };
  /** Optional pre-generated turnaround sprite views */
  turnaroundSprites?: Partial<Record<TurnaroundViewName, TurnaroundSpriteDef>>;
}

export type CapsuleRenderMode =
  | "vector_projected"   // Pure 2.5D projected vector anatomy with Painter's depth sorting
  | "turnaround_sprite"  // Quantized 5-view orthographic sprite from 9router
  | "hybrid"             // Turnaround sprite base + projected vector facial details
  | "wireframe";         // 3D skeleton joints, axes, and capsule bounding envelopes
