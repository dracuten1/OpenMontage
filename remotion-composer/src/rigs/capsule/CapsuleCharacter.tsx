// ---------------------------------------------------------------------------
// rigs/capsule/CapsuleCharacter.tsx — 2.5D Capsule Character Component
// Part 2 of TASK_MESH_AND_TURNAROUND for OpenMontage / Remotion rigs.
//
// Features:
// 1. Procedural 2.5D projected vector anatomy with continuous yaw (0°..360°),
//    orthographic projection, and Painter's algorithm depth sorting.
// 2. Turnaround sprite mode: maps continuous yaw to 5 quantized views
//    (front 0°, three_quarter 45°, side 90°, three_quarter_back 135°, back 180°)
//    with horizontal flip (flipX) on [180°, 360°).
// 3. Hybrid & Wireframe debugging modes showing skeleton joints, axes,
//    and depth labels.
// ---------------------------------------------------------------------------

import React, { useMemo } from "react";
import {
  CapsuleRenderMode,
  ProjectedPart,
  SkeletonDef,
  TurnaroundSpriteDef,
  TurnaroundViewName,
  Vec2,
} from "./types";
import {
  TURTLE_CAPSULE_SKELETON,
  projectCapsuleSkeleton,
  quantizeTurnaroundAngle,
} from "./CapsuleSkeleton";

export interface CapsuleCharacterProps {
  skeleton?: SkeletonDef;
  /** Continuous yaw rotation in degrees (0°..360°) */
  yaw: number;
  /** Optional pitch angle (-30°..+30°) */
  pitch?: number;
  /** Optional roll angle */
  roll?: number;
  /** Scale factor (default: 1.0) */
  scale?: number;
  /** Origin X on screen (defaults to skeleton.origin.x) */
  x?: number;
  /** Origin Y on screen (defaults to skeleton.origin.y) */
  y?: number;
  /** Rendering mode: vector_projected | turnaround_sprite | hybrid | wireframe */
  renderMode?: CapsuleRenderMode;
  /** Show 3D joint axes and connections */
  showAxes?: boolean;
  /** Show numeric depth Z-labels on each capsule */
  showDepthLabels?: boolean;
  /** Show wireframe outline overlay */
  showWireframe?: boolean;
  /** Pre-loaded turnaround sprite definitions */
  turnaroundSprites?: Partial<Record<TurnaroundViewName, TurnaroundSpriteDef>>;
  /** Render soft ground contact shadow */
  groundShadow?: boolean;
  /** Clip path ID suffix for uniqueness in multi-instance compositions */
  clipSuffix?: string;
}

export const CapsuleCharacter: React.FC<CapsuleCharacterProps> = ({
  skeleton = TURTLE_CAPSULE_SKELETON,
  yaw,
  pitch = 0,
  roll = 0,
  scale = 1.0,
  x,
  y,
  renderMode = "vector_projected",
  showAxes = false,
  showDepthLabels = false,
  showWireframe = false,
  turnaroundSprites,
  groundShadow = true,
  clipSuffix = "",
}) => {
  const origin: Vec2 = useMemo(
    () => ({
      x: x !== undefined ? x : skeleton.origin.x,
      y: y !== undefined ? y : skeleton.origin.y,
    }),
    [x, y, skeleton.origin]
  );

  // 1. Compute 2.5D projected parts with Painter's depth sorting
  const projectedParts = useMemo(
    () => projectCapsuleSkeleton(skeleton, yaw, pitch, roll, origin, scale),
    [skeleton, yaw, pitch, roll, origin, scale]
  );

  // 2. Compute 5-view turnaround angle quantization
  const turnaround = useMemo(() => quantizeTurnaroundAngle(yaw), [yaw]);

  // Combined sprite dictionary (custom prop overrides skeleton built-ins)
  const activeSprites = turnaroundSprites || skeleton.turnaroundSprites;
  const currentSprite = activeSprites ? activeSprites[turnaround.view] : undefined;

  // Contact ground shadow calculation based on overall skeleton scale
  const shadowRx = 140 * scale;
  const shadowRy = 28 * scale;
  const shadowCy = origin.y + 155 * scale;

  return (
    <g id={`capsule-character-${skeleton.id}${clipSuffix ? `-${clipSuffix}` : ""}`}>
      {/* 1. Ground Contact Shadow */}
      {groundShadow && (
        <ellipse
          cx={origin.x}
          cy={shadowCy}
          rx={shadowRx}
          ry={shadowRy}
          fill="rgba(15, 23, 42, 0.45)"
          style={{ mixBlendMode: "multiply" }}
        />
      )}

      {/* 2. Turnaround Sprite Mode / Hybrid Base */}
      {(renderMode === "turnaround_sprite" || renderMode === "hybrid") && (
        <g id="turnaround-sprite-layer">
          {currentSprite?.imagePath ? (
            <g
              transform={
                turnaround.flipX
                  ? `translate(${origin.x}, ${origin.y}) scale(-1, 1) translate(${-origin.x}, ${-origin.y})`
                  : undefined
              }
            >
              <image
                href={currentSprite.imagePath}
                x={origin.x - (currentSprite.anchorX || currentSprite.width / 2) * scale}
                y={origin.y - (currentSprite.anchorY || currentSprite.height / 2) * scale}
                width={currentSprite.width * scale}
                height={currentSprite.height * scale}
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
          ) : (
            // Fallback Vector Orthographic View Card if no bitmap sprite loaded
            <g transform={`translate(${origin.x}, ${origin.y})`}>
              <rect
                x={-120 * scale}
                y={-170 * scale}
                width={240 * scale}
                height={320 * scale}
                rx={24 * scale}
                fill="rgba(30, 41, 59, 0.7)"
                stroke={skeleton.palette.accent}
                strokeWidth={2 * scale}
                strokeDasharray="6,4"
              />
              <text
                x={0}
                y={-140 * scale}
                fill="#94a344"
                fontSize={13 * scale}
                fontWeight="bold"
                textAnchor="middle"
                letterSpacing="1"
              >
                9ROUTER TURNAROUND
              </text>
              <text
                x={0}
                y={-118 * scale}
                fill="#f8fafc"
                fontSize={15 * scale}
                fontWeight="800"
                textAnchor="middle"
              >
                {turnaround.label}
              </text>
              {turnaround.flipX && (
                <text
                  x={0}
                  y={-96 * scale}
                  fill="#f59e0b"
                  fontSize={11 * scale}
                  fontWeight="600"
                  textAnchor="middle"
                >
                  [HORIZONTAL FLIP APPLIED]
                </text>
              )}
            </g>
          )}
        </g>
      )}

      {/* 3. Procedural 2.5D Projected Vector Anatomy */}
      {(renderMode === "vector_projected" ||
        renderMode === "wireframe" ||
        (renderMode === "hybrid" && !currentSprite?.imagePath)) && (
        <g id="projected-vector-anatomy">
          {projectedParts.map((part) => {
            const isWireframeOnly = renderMode === "wireframe";

            return (
              <g
                key={part.id}
                id={`part-${part.id}`}
                opacity={isWireframeOnly ? 0.85 : part.opacity}
              >
                {/* A. Base Capsule Ellipse */}
                <ellipse
                  cx={part.screenX}
                  cy={part.screenY}
                  rx={Math.max(2, part.screenRx)}
                  ry={Math.max(2, part.screenRy)}
                  fill={isWireframeOnly ? "none" : part.fill}
                  stroke={part.stroke}
                  strokeWidth={part.strokeWidth}
                  strokeDasharray={isWireframeOnly ? "5,3" : undefined}
                />

                {/* B. Directional 2.5D Highlight Rim (when not in wireframe mode) */}
                {!isWireframeOnly && part.highlightFill && (
                  <ellipse
                    cx={part.screenX - part.screenRx * 0.14}
                    cy={part.screenY - part.screenRy * 0.14}
                    rx={Math.max(1, part.screenRx * 0.72)}
                    ry={Math.max(1, part.screenRy * 0.72)}
                    fill={part.highlightFill}
                    opacity={0.32}
                  />
                )}

                {/* C. Attached Sub-Details (eyes, spots, buttons, nostrils, etc.) */}
                {!isWireframeOnly &&
                  part.details
                    .filter((d) => d.visible)
                    .map((detail) => (
                      <ellipse
                        key={detail.id}
                        cx={detail.screenX}
                        cy={detail.screenY}
                        rx={Math.max(1, detail.screenRx)}
                        ry={Math.max(1, detail.screenRy)}
                        fill={detail.fill}
                        stroke={detail.stroke}
                        strokeWidth={detail.strokeWidth}
                        opacity={detail.opacity}
                      />
                    ))}

                {/* D. Wireframe Overlay / Axes if requested */}
                {(showWireframe || isWireframeOnly) && (
                  <>
                    {/* Horizontal & Vertical Crosshair Axes */}
                    <line
                      x1={part.screenX - part.screenRx}
                      y1={part.screenY}
                      x2={part.screenX + part.screenRx}
                      y2={part.screenY}
                      stroke="rgba(56, 189, 248, 0.45)"
                      strokeWidth={1.5}
                    />
                    <line
                      x1={part.screenX}
                      y1={part.screenY - part.screenRy}
                      x2={part.screenX}
                      y2={part.screenY + part.screenRy}
                      stroke="rgba(56, 189, 248, 0.45)"
                      strokeWidth={1.5}
                    />
                    {/* Joint Pivot Point */}
                    <circle
                      cx={part.screenX}
                      cy={part.screenY}
                      r={3 * scale}
                      fill="#38bdf8"
                    />
                  </>
                )}

                {/* E. Depth (Z) readout label */}
                {showDepthLabels && (
                  <g transform={`translate(${part.screenX}, ${part.screenY})`}>
                    <rect
                      x={-28}
                      y={-9}
                      width={56}
                      height={18}
                      rx={4}
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke="#a855f7"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={4}
                      fill="#e2e8f0"
                      fontSize={10}
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      z:{Math.round(part.depth)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* 4. Global Skeleton 3D Center Axes */}
      {showAxes && (
        <g id="skeleton-origin-axes" transform={`translate(${origin.x}, ${origin.y})`}>
          {/* X Axis (Red) */}
          <line x1={0} y1={0} x2={40 * scale} y2={0} stroke="#ef4444" strokeWidth={2} />
          {/* Y Axis (Green) */}
          <line x1={0} y1={0} x2={0} y2={40 * scale} stroke="#22c55e" strokeWidth={2} />
          {/* Origin Marker */}
          <circle cx={0} cy={0} r={4 * scale} fill="#ffffff" stroke="#0f172a" strokeWidth={2} />
        </g>
      )}
    </g>
  );
};
