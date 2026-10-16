// ---------------------------------------------------------------------------
// rigs/mesh/DeformableEar.tsx — Spine-style 3-Bone Deformable Ear Rig
// Part 1 of Spine-style Mesh Deformation for OpenMontage / Remotion rigs.
//
// Renders an organic 2D ear driven by Linear Blend Skinning (LBS) across
// a 3-bone chain (Root, Mid, Tip). Supports:
// 1. "contour": Production kawaii vector mode (outer stroke + 3-layer pink)
// 2. "mesh": Triangulated 2D ribbon mesh with wireframe inspection
// 3. "both": Contour vector fill with mesh wireframe + bone hierarchy overlay
// ---------------------------------------------------------------------------

import React, { useMemo } from "react";
import {
  computeForwardKinematics,
  computeRestJoints,
  createEarTriangleMesh,
  createSmoothPathFromPoints,
  deformTriangleMesh,
  deformVertexLBS,
  sampleEllipseContour,
} from "./SpineMesh";
import { DeformableEarConfig, EarPinkLayer, EarRenderMode, Vec2 } from "./types";

export interface DeformableEarProps {
  baseX: number;
  baseY: number;
  height?: number;
  width?: number;
  side: "left" | "right";
  /** Bone 0 local rotation in degrees */
  baseAngle: number;
  /** Bone 1 bend relative to bone 0 in degrees */
  midBend: number;
  /** Bone 2 flop relative to bone 1 in degrees */
  tipFlop: number;
  renderMode?: EarRenderMode;
  showBones?: boolean;
  showWireframe?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  outerFill?: string;
  pinks?: EarPinkLayer[];
}

const DEFAULT_PINKS: EarPinkLayer[] = [
  { cy: 412, rx: 17, ry: 52, fill: "#ffc9d6" },
  { cy: 418, rx: 12, ry: 42, fill: "#ff9fb6" },
  { cy: 426, rx: 7, ry: 30, fill: "#ff7fa2" },
];

export const DeformableEar: React.FC<DeformableEarProps> = ({
  baseX,
  baseY,
  height = 156,
  width = 66,
  side,
  baseAngle,
  midBend,
  tipFlop,
  renderMode = "contour",
  showBones = false,
  showWireframe = false,
  outlineColor = "#3a2e2a",
  outlineWidth = 12,
  outerFill = "#ffffff",
  pinks = DEFAULT_PINKS,
}) => {
  // 3 bones divide the ear height evenly (52px each for 156px total)
  const boneLen = height / 3;
  const lengths: [number, number, number] = [boneLen, boneLen, boneLen];
  const rootPos: Vec2 = { x: baseX, y: baseY };

  // Rest joints and forward kinematics
  const restJoints = useMemo(
    () => computeRestJoints(rootPos, lengths),
    [baseX, baseY, boneLen]
  );

  const chain = useMemo(
    () => computeForwardKinematics(rootPos, lengths, [baseAngle, midBend, tipFlop]),
    [baseX, baseY, boneLen, baseAngle, midBend, tipFlop]
  );

  // Outer ear geometry in rest pose
  const outerRx = width / 2;
  const outerRy = height / 2;
  const outerCy = baseY - outerRy;

  // Sample and deform outer contour
  const deformedOuterPath = useMemo(() => {
    const samples = sampleEllipseContour(
      baseX,
      outerCy,
      outerRx,
      outerRy,
      baseY,
      height,
      48
    );
    const deformedPts = samples.map((s) =>
      deformVertexLBS(s.restPos, s.weights, chain, restJoints)
    );
    return createSmoothPathFromPoints(deformedPts);
  }, [baseX, outerCy, outerRx, outerRy, baseY, height, chain, restJoints]);

  // Sample and deform the 3 inner pink layers
  const deformedPinkPaths = useMemo(() => {
    return pinks.map((p) => {
      const samples = sampleEllipseContour(
        baseX,
        p.cy,
        p.rx,
        p.ry,
        baseY,
        height,
        36
      );
      const deformedPts = samples.map((s) =>
        deformVertexLBS(s.restPos, s.weights, chain, restJoints)
      );
      return {
        fill: p.fill,
        d: createSmoothPathFromPoints(deformedPts),
      };
    });
  }, [baseX, baseY, height, pinks, chain, restJoints]);

  // Triangulated mesh computation (for 'mesh' or 'both' or when showWireframe is true)
  const needMesh = renderMode === "mesh" || renderMode === "both" || showWireframe;
  const deformedMesh = useMemo(() => {
    if (!needMesh) return null;
    const baseMesh = createEarTriangleMesh(baseX, baseY, height, width, 13, 5);
    return deformTriangleMesh(baseMesh, chain, restJoints);
  }, [needMesh, baseX, baseY, height, width, chain, restJoints]);

  return (
    <g className={`deformable-ear deformable-ear-${side}`}>
      {/* 1. Contour Mode: smooth vector rendering */}
      {(renderMode === "contour" || renderMode === "both") && (
        <g className="ear-contour">
          {/* Outer ear body with thick kawaii stroke */}
          <path
            d={deformedOuterPath}
            fill={outerFill}
            stroke={outlineColor}
            strokeWidth={outlineWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 3 inner pink depth layers */}
          {deformedPinkPaths.map((p, i) => (
            <path key={`pink-layer-${i}`} d={p.d} fill={p.fill} />
          ))}
        </g>
      )}

      {/* 2. Mesh Mode: 2D Triangulated ribbon mesh */}
      {deformedMesh && (renderMode === "mesh" || renderMode === "both" || showWireframe) && (
        <g className="ear-mesh" opacity={renderMode === "both" || showWireframe ? 0.75 : 1}>
          {deformedMesh.triangles.map((tri, i) => {
            const v0 = deformedMesh.vertices[tri.indices[0]].deformedPos!;
            const v1 = deformedMesh.vertices[tri.indices[1]].deformedPos!;
            const v2 = deformedMesh.vertices[tri.indices[2]].deformedPos!;
            const pointsStr = `${v0.x.toFixed(1)},${v0.y.toFixed(1)} ${v1.x.toFixed(1)},${v1.y.toFixed(1)} ${v2.x.toFixed(1)},${v2.y.toFixed(1)}`;
            const isAlt = i % 2 === 0;

            return (
              <polygon
                key={`mesh-tri-${i}`}
                points={pointsStr}
                fill={
                  renderMode === "mesh"
                    ? isAlt
                      ? "rgba(255, 201, 214, 0.45)"
                      : "rgba(255, 159, 182, 0.45)"
                    : "none"
                }
                stroke={side === "left" ? "#7c3aed" : "#06b6d4"}
                strokeWidth={renderMode === "mesh" ? 1.5 : 1}
                strokeDasharray={renderMode === "both" ? "3,3" : undefined}
              />
            );
          })}

          {/* Mesh vertices */}
          {showWireframe &&
            deformedMesh.vertices.map((v, i) => {
              const p = v.deformedPos!;
              return (
                <circle
                  key={`mesh-vtx-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={2}
                  fill={side === "left" ? "#7c3aed" : "#06b6d4"}
                />
              );
            })}
        </g>
      )}

      {/* 3. Skeleton / Bones Visualization */}
      {(showBones || renderMode === "mesh") && (
        <g className="ear-skeleton">
          {chain.bones.map((bone, i) => {
            const colors = ["#f59e0b", "#10b981", "#ec4899"];
            const color = colors[i % colors.length];

            return (
              <g key={`bone-${bone.id}`}>
                {/* Bone vector line */}
                <line
                  x1={bone.worldStart.x}
                  y1={bone.worldStart.y}
                  x2={bone.worldEnd.x}
                  y2={bone.worldEnd.y}
                  stroke={color}
                  strokeWidth={4}
                  strokeLinecap="round"
                />

                {/* Joint start circle */}
                <circle
                  cx={bone.worldStart.x}
                  cy={bone.worldStart.y}
                  r={4.5}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth={2.5}
                />

                {/* Tip joint circle */}
                {i === 2 && (
                  <circle
                    cx={bone.worldEnd.x}
                    cy={bone.worldEnd.y}
                    r={3.5}
                    fill={color}
                  />
                )}
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};
