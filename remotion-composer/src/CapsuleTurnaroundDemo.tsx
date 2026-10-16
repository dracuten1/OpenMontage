// ---------------------------------------------------------------------------
// CapsuleTurnaroundDemo.tsx — 2.5D Capsule Skeleton Auto-Rotation & Turnaround
// Part 2 of TASK_MESH_AND_TURNAROUND for OpenMontage / Remotion rigs.
//
// Demonstrates:
// 1. Continuous 360° Yaw auto-rotation of Kawaii Turtle (switchable to Rabbit)
// 2. 2.5D Ellipsoid perspective projection & Painter's algorithm depth-sorting
// 3. 3D Orbit Compass/Gizmo showing orientation vector & camera sightline
// 4. Real-time Depth-Sorted Layer Stack display (back-to-front rendering order)
// 5. 5-View Orthographic Turnaround selector & 9router sprite asset mapping
//
// Spec: 1080x1080, 180 frames (6.0s @ 30fps), 2°/frame = 360° total rotation.
// ---------------------------------------------------------------------------

import React, { useMemo } from "react";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CapsuleRenderMode,
  SkeletonDef,
  TurnaroundSpriteDef,
  TurnaroundViewName,
} from "./rigs/capsule/types";
import {
  RABBIT_CAPSULE_SKELETON,
  TURTLE_CAPSULE_SKELETON,
  calculate3DOrbitGizmo,
  projectCapsuleSkeleton,
  quantizeTurnaroundAngle,
} from "./rigs/capsule/CapsuleSkeleton";
import { CapsuleCharacter } from "./rigs/capsule/CapsuleCharacter";

export interface CapsuleTurnaroundDemoProps {
  /** Character skeleton: "turtle" (Golden Turtle) or "rabbit" (Kawaii Rabbit) */
  character?: "turtle" | "rabbit";
  /** Rendering mode: vector_projected | turnaround_sprite | hybrid | wireframe */
  renderMode?: CapsuleRenderMode;
  /** Show 3D joint coordinate axes */
  showAxes?: boolean;
  /** Show depth Z-labels on each capsule */
  showDepthLabels?: boolean;
  /** Show wireframe overlay */
  showWireframe?: boolean;
}

const CANONICAL_VIEWS: Array<{
  id: TurnaroundViewName;
  nominalAngle: number;
  label: string;
  rangeText: string;
  shortLabel: string;
}> = [
  { id: "front", nominalAngle: 0, label: "Front (0°)", rangeText: "337.5°..22.5°", shortLabel: "FRONT" },
  { id: "three_quarter", nominalAngle: 45, label: "3/4 Front (45°)", rangeText: "22.5°..67.5°", shortLabel: "3/4 FRONT" },
  { id: "side", nominalAngle: 90, label: "Side Profile (90°)", rangeText: "67.5°..112.5°", shortLabel: "SIDE" },
  { id: "three_quarter_back", nominalAngle: 135, label: "3/4 Back (135°)", rangeText: "112.5°..157.5°", shortLabel: "3/4 BACK" },
  { id: "back", nominalAngle: 180, label: "Back (180°)", rangeText: "157.5°..202.5°", shortLabel: "BACK" },
];

export const CapsuleTurnaroundDemo: React.FC<CapsuleTurnaroundDemoProps> = ({
  character = "turtle",
  renderMode = "vector_projected",
  showAxes = false,
  showDepthLabels = false,
  showWireframe = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Continuous 360° yaw: 180 frames = 360°, exactly 2.0°/frame
  const rawYaw = (frame / durationInFrames) * 360;
  const yaw = rawYaw % 360;

  // Active Skeleton definition
  const skeleton: SkeletonDef = useMemo(
    () => (character === "rabbit" ? RABBIT_CAPSULE_SKELETON : TURTLE_CAPSULE_SKELETON),
    [character]
  );

  // 1. Quantized 5-view turnaround information
  const turnaround = useMemo(() => quantizeTurnaroundAngle(yaw), [yaw]);

  // 2. 3D Orbit Compass Gizmo vectors
  const gizmo = useMemo(() => calculate3DOrbitGizmo(yaw, 44), [yaw]);

  // 3. 2.5D Projected Parts sorted by Painter's algorithm (back to front)
  const projectedParts = useMemo(
    () => projectCapsuleSkeleton(skeleton, yaw, 0, 0, { x: 540, y: 505 }, 1.08),
    [skeleton, yaw]
  );

  // 4. Turnaround sprite asset map using staticFile
  const turnaroundSprites: Partial<Record<TurnaroundViewName, TurnaroundSpriteDef>> = useMemo(() => {
    const prefix = character === "rabbit" ? "rabbit" : "turtle";
    return {
      front: {
        view: "front",
        imagePath: staticFile(`character-performer/kids/turnaround/${prefix}_front_000.png`),
        width: 512,
        height: 512,
      },
      three_quarter: {
        view: "three_quarter",
        imagePath: staticFile(`character-performer/kids/turnaround/${prefix}_three_quarter_045.png`),
        width: 512,
        height: 512,
      },
      side: {
        view: "side",
        imagePath: staticFile(`character-performer/kids/turnaround/${prefix}_side_090.png`),
        width: 512,
        height: 512,
      },
      three_quarter_back: {
        view: "three_quarter_back",
        imagePath: staticFile(`character-performer/kids/turnaround/${prefix}_three_quarter_back_135.png`),
        width: 512,
        height: 512,
      },
      back: {
        view: "back",
        imagePath: staticFile(`character-performer/kids/turnaround/${prefix}_back_180.png`),
        width: 512,
        height: 512,
      },
    };
  }, [character]);

  const currentSprite = turnaroundSprites[turnaround.view];

  // Colors based on character
  const primaryAccent = character === "rabbit" ? "#f43f5e" : "#f59e0b"; // Rose for rabbit, Amber for turtle
  const secondaryAccent = character === "rabbit" ? "#ec4899" : "#10b981"; // Pink for rabbit, Emerald for turtle

  // Reverse parts for top-to-bottom stack display (Front on top, Back on bottom of visual card)
  const displayStack = useMemo(() => [...projectedParts].reverse(), [projectedParts]);

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#0b1120",
        color: "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ------------------------------------------------------------------- */}
      {/* Background Decorative Grid & Ambient Glows */}
      {/* ------------------------------------------------------------------- */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: 200,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryAccent}18 0%, transparent 70%)`,
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 300,
          right: -100,
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* SVG Canvas for Character & Vector HUD Gizmos */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 1080 1080"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {/* Subtle Grid Pattern for 3D Ground Plane */}
          <pattern id="groundGrid" width="40" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="40" y2="0" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1" />
          </pattern>
          {/* Circular Ground Target Gradients */}
          <radialGradient id="orbitTargetGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.22)" />
            <stop offset="60%" stopColor="rgba(56, 189, 248, 0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* ----------------------------------------------------------------- */}
        {/* Ground Orientation Pedestal / Ring */}
        {/* ----------------------------------------------------------------- */}
        <g id="ground-pedestal" transform="translate(540 680)">
          {/* Ground Grid Disk */}
          <ellipse cx="0" cy="0" rx="260" ry="70" fill="url(#orbitTargetGlow)" />
          <ellipse
            cx="0"
            cy="0"
            rx="240"
            ry="64"
            fill="none"
            stroke="rgba(56, 189, 248, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="170"
            ry="45"
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth="1"
          />
          {/* Cardinal Direction Crosshairs on Ground */}
          <line x1="-240" y1="0" x2="240" y2="0" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="1" />
          <line x1="0" y1="-64" x2="0" y2="64" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="1" />

          {/* Dynamic Ground Orientation Pointer (Points in direction character faces) */}
          <line
            x1="0"
            y1="0"
            x2={190 * Math.sin((yaw * Math.PI) / 180)}
            y2={50 * Math.cos((yaw * Math.PI) / 180)}
            stroke={primaryAccent}
            strokeWidth="2.5"
          />
          <circle
            cx={190 * Math.sin((yaw * Math.PI) / 180)}
            cy={50 * Math.cos((yaw * Math.PI) / 180)}
            r="5"
            fill={primaryAccent}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </g>

        {/* ----------------------------------------------------------------- */}
        {/* Main Hero Character: 2.5D Capsule Skeleton */}
        {/* ----------------------------------------------------------------- */}
        <CapsuleCharacter
          skeleton={skeleton}
          yaw={yaw}
          pitch={0}
          roll={0}
          scale={1.12}
          x={540}
          y={505}
          renderMode={renderMode}
          showAxes={showAxes}
          showDepthLabels={showDepthLabels}
          showWireframe={showWireframe}
          groundShadow={true}
          clipSuffix="hero"
        />
      </svg>

      {/* ------------------------------------------------------------------- */}
      {/* Top Header Banner */}
      {/* ------------------------------------------------------------------- */}
      <div
        style={{
          position: "absolute",
          top: 22,
          left: 0,
          width: "100%",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: "#94a3b8",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 3,
          }}
        >
          OpenMontage Character Rigging Architecture • Part 2
        </div>
        <div
          style={{
            fontSize: 27,
            fontWeight: 800,
            letterSpacing: -0.5,
            background: `linear-gradient(to right, #38bdf8, ${primaryAccent}, #ec4899)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Auto-Rotate Capsule Skeleton & 9router Turnaround
        </div>

        {/* Global Status Pill Bar */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            marginTop: 10,
            padding: "5px 16px",
            borderRadius: 999,
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.4)",
            fontSize: 12,
          }}
        >
          {/* Active Yaw Angle Readout */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#38bdf8",
                boxShadow: "0 0 8px #38bdf8",
              }}
            />
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>YAW:</span>
            <span
              style={{
                fontFamily: "monospace",
                color: "#38bdf8",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {yaw.toFixed(1)}°
            </span>
          </div>

          <span style={{ color: "#475569" }}>|</span>

          {/* Active Canonical View Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>ACTIVE VIEW:</span>
            <span
              style={{
                background: `${primaryAccent}26`,
                color: primaryAccent,
                border: `1px solid ${primaryAccent}66`,
                padding: "2px 8px",
                borderRadius: 6,
                fontWeight: 800,
                letterSpacing: 0.5,
              }}
            >
              {turnaround.view.toUpperCase()} ({turnaround.nominalAngleDeg}°)
            </span>
          </div>

          <span style={{ color: "#475569" }}>|</span>

          {/* Hemisphere / FlipX Indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>HEMISPHERE:</span>
            <span
              style={{
                color: turnaround.flipX ? "#f59e0b" : "#10b981",
                fontWeight: 700,
              }}
            >
              {turnaround.flipX ? "RIGHT [FLIP-X ↔]" : "LEFT [STANDARD]"}
            </span>
          </div>

          <span style={{ color: "#475569" }}>|</span>

          {/* Active Character Chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: "#94a3b8", fontWeight: 600 }}>RIG:</span>
            <span style={{ color: "#f8fafc", fontWeight: 700 }}>
              {character === "rabbit" ? "Kawaii Rabbit" : "Golden Turtle (Rùa Vàng)"}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Top Left: 3D Orbit Compass / Orientation Gizmo */}
      {/* ------------------------------------------------------------------- */}
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 36,
          width: 250,
          background: "rgba(15, 23, 42, 0.82)",
          borderRadius: 14,
          padding: "14px",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", letterSpacing: 1 }}>
            3D ORBIT COMPASS
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: "#94a3b8",
              background: "rgba(30, 41, 59, 0.6)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            GIZMO
          </span>
        </div>

        {/* SVG Compass Display */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width="190" height="110" viewBox="-95 -55 190 110">
            {/* Ground Ring from calculate3DOrbitGizmo */}
            <path
              d={gizmo.ringPath}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth="1.5"
            />
            {/* Perspective Cross Axes */}
            <line x1="-50" y1="0" x2="50" y2="0" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1" />
            <line x1="0" y1="-22" x2="0" y2="22" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1" />

            {/* Cardinal Direction Markers */}
            <text x="0" y="32" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
              FRONT (0°)
            </text>
            <text x="0" y="-26" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">
              BACK (180°)
            </text>
            <text x="-64" y="3" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="end">
              L (90°)
            </text>
            <text x="64" y="3" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="start">
              R (270°)
            </text>

            {/* Camera Eye Vector (Fixed at bottom facing origin) */}
            <circle cx="0" cy="42" r="3.5" fill="#f59e0b" />
            <line x1="0" y1="42" x2="0" y2="26" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2" />

            {/* Rotating Pointer Needle */}
            <line
              x1="0"
              y1="0"
              x2={gizmo.pointerPos.x}
              y2={gizmo.pointerPos.y}
              stroke={primaryAccent}
              strokeWidth="2.5"
            />
            <circle
              cx={gizmo.pointerPos.x}
              cy={gizmo.pointerPos.y}
              r="4.5"
              fill={primaryAccent}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            {/* Center Pivot Joint */}
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
          </svg>
        </div>

        {/* Orientation Vector Data Readouts */}
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            fontSize: 11,
            color: "#cbd5e1",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#94a3b8" }}>Heading Vector:</span>
            <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 700 }}>
              [{Math.sin((yaw * Math.PI) / 180).toFixed(2)}, {Math.cos((yaw * Math.PI) / 180).toFixed(2)}]
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ color: "#94a3b8" }}>Facing Depth (Z):</span>
            <span style={{ fontFamily: "monospace", color: gizmo.pointerZ >= 0 ? "#10b981" : "#f43f5e" }}>
              {gizmo.pointerZ >= 0 ? "+Facing Cam" : "-Facing Away"}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Top Right: 9router Turnaround Sprite Inset */}
      {/* ------------------------------------------------------------------- */}
      <div
        style={{
          position: "absolute",
          top: 120,
          right: 36,
          width: 250,
          background: "rgba(15, 23, 42, 0.82)",
          borderRadius: 14,
          padding: "14px",
          border: "1px solid rgba(168, 85, 247, 0.28)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: "#c084fc", letterSpacing: 1 }}>
            9ROUTER SPRITE INSET
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "1px 6px",
              borderRadius: 4,
            }}
          >
            DISCRETE
          </span>
        </div>

        {/* Thumbnail Preview of Selected Turnaround Sprite */}
        <div
          style={{
            width: "100%",
            height: 120,
            background: "rgba(11, 17, 32, 0.9)",
            borderRadius: 10,
            border: `1.5px solid ${turnaround.flipX ? "#f59e0b" : "#c084fc"}`,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {currentSprite?.imagePath && (
            <img
              src={currentSprite.imagePath}
              alt={turnaround.label}
              style={{
                maxHeight: "105px",
                maxWidth: "180px",
                objectFit: "contain",
                transform: turnaround.flipX ? "scaleX(-1)" : "none",
                transition: "transform 0.1s ease",
              }}
            />
          )}

          {/* Active View Overlay Tag */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: 8,
              right: 8,
              background: "rgba(15, 23, 42, 0.85)",
              padding: "2px 8px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#e2e8f0" }}>{turnaround.label}</span>
            <span style={{ color: turnaround.flipX ? "#f59e0b" : "#38bdf8", fontFamily: "monospace" }}>
              {turnaround.flipX ? "[FLIPPED]" : "[BASE]"}
            </span>
          </div>
        </div>

        {/* Agent Mapping Explanation */}
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            fontSize: 11,
            color: "#cbd5e1",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#94a3b8" }}>Nominal View:</span>
            <span style={{ fontFamily: "monospace", color: "#c084fc", fontWeight: 700 }}>
              {turnaround.nominalAngleDeg}° (dev: {turnaround.angleDeviationDeg > 0 ? "+" : ""}
              {turnaround.angleDeviationDeg.toFixed(1)}°)
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ color: "#94a3b8" }}>Sprite Asset:</span>
            <span style={{ fontFamily: "monospace", color: "#94a3b8", fontSize: 10 }}>
              {character}_{turnaround.view}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Bottom Left: Depth-Sorted Layer Stack (Painter's Algorithm) */}
      {/* ------------------------------------------------------------------- */}
      <div
        style={{
          position: "absolute",
          bottom: 74,
          left: 36,
          width: 320,
          background: "rgba(15, 23, 42, 0.88)",
          borderRadius: 14,
          padding: "14px",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 28px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", letterSpacing: 1 }}>
            PAINTER'S LAYER STACK
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#94a3b8",
              fontFamily: "monospace",
              background: "rgba(30, 41, 59, 0.6)",
              padding: "1px 6px",
              borderRadius: 4,
            }}
          >
            DEPTH-SORTED
          </span>
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>
          Ordered back-to-front (Z: -∞ → +∞). Reorders continuously during yaw rotation.
        </div>

        {/* Dynamic Part Layers Display */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {displayStack.slice(0, 7).map((part, idx) => {
            const isTopLayer = idx === 0; // Closest to camera
            const isBackLayer = idx === displayStack.slice(0, 7).length - 1;
            const depthNorm = Math.max(0, Math.min(1, (part.depth + 140) / 280));

            return (
              <div
                key={part.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: isTopLayer
                    ? "rgba(16, 185, 129, 0.15)"
                    : isBackLayer
                    ? "rgba(148, 163, 184, 0.08)"
                    : "rgba(30, 41, 59, 0.5)",
                  border: isTopLayer
                    ? "1px solid rgba(16, 185, 129, 0.35)"
                    : "1px solid rgba(148, 163, 184, 0.1)",
                  fontSize: 11,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Category Chip */}
                  <span
                    style={{
                      fontSize: 9,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: "rgba(15, 23, 42, 0.8)",
                      color:
                        part.category === "head"
                          ? "#38bdf8"
                          : part.category === "shell"
                          ? "#f59e0b"
                          : part.category === "tail"
                          ? "#a855f7"
                          : "#cbd5e1",
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}
                  >
                    {part.category.toUpperCase().slice(0, 4)}
                  </span>
                  <span
                    style={{
                      color: isTopLayer ? "#34d399" : "#e2e8f0",
                      fontWeight: isTopLayer ? 700 : 500,
                      maxWidth: 130,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {part.name}
                  </span>
                </div>

                {/* Z-Depth Readout & Mini Depth Indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 4,
                      backgroundColor: "rgba(51, 65, 85, 0.8)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${depthNorm * 100}%`,
                        height: "100%",
                        backgroundColor: part.depth >= 0 ? "#10b981" : "#f43f5e",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: part.depth >= 0 ? "#34d399" : "#f87171",
                      minWidth: 42,
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    z:{Math.round(part.depth)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Bottom Right: 5 Canonical Orthographic Views Strip */}
      {/* ------------------------------------------------------------------- */}
      <div
        style={{
          position: "absolute",
          bottom: 74,
          right: 36,
          width: 440,
          background: "rgba(15, 23, 42, 0.88)",
          borderRadius: 14,
          padding: "14px",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 28px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: "#c084fc", letterSpacing: 1 }}>
            CANONICAL 5-VIEW TURNAROUND SELECTOR
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#38bdf8",
              fontFamily: "monospace",
              background: "rgba(56, 189, 248, 0.12)",
              padding: "1px 6px",
              borderRadius: 4,
            }}
          >
            9ROUTER SPEC
          </span>
        </div>

        {/* 5 View Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {CANONICAL_VIEWS.map((v) => {
            const isActive = turnaround.view === v.id;
            const spriteDef = turnaroundSprites[v.id];

            return (
              <div
                key={v.id}
                style={{
                  background: isActive ? "rgba(168, 85, 247, 0.22)" : "rgba(30, 41, 59, 0.6)",
                  border: isActive
                    ? `1.5px solid ${primaryAccent}`
                    : "1px solid rgba(148, 163, 184, 0.15)",
                  borderRadius: 8,
                  padding: "6px 4px",
                  textAlign: "center",
                  boxShadow: isActive ? `0 0 14px ${primaryAccent}40` : "none",
                  transform: isActive ? "translateY(-2px)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Mini View Thumbnail */}
                <div
                  style={{
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(11, 17, 32, 0.6)",
                    borderRadius: 5,
                    marginBottom: 5,
                    overflow: "hidden",
                  }}
                >
                  {spriteDef?.imagePath ? (
                    <img
                      src={spriteDef.imagePath}
                      alt={v.label}
                      style={{
                        maxHeight: "44px",
                        maxWidth: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 8, color: "#64748b" }}>{v.nominalAngle}°</span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: isActive ? "#ffffff" : "#94a3b8",
                    lineHeight: 1.1,
                  }}
                >
                  {v.shortLabel}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    color: isActive ? primaryAccent : "#64748b",
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                >
                  {v.nominalAngle}°
                </div>

                {isActive && (
                  <div
                    style={{
                      marginTop: 3,
                      background: primaryAccent,
                      color: "#0f172a",
                      fontSize: 8,
                      fontWeight: 900,
                      borderRadius: 3,
                      padding: "1px 0",
                      letterSpacing: 0.5,
                    }}
                  >
                    ACTIVE
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quantizer Workflow Note */}
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            color: "#94a3b8",
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            paddingTop: 6,
          }}
        >
          <span>Quantizer: Continuous θ → 5 Orthographic Views</span>
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>
            Window: ±22.5° Per Sector
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Bottom Timeline Bar */}
      {/* ------------------------------------------------------------------- */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 38,
          background: "rgba(15, 23, 42, 0.95)",
          borderTop: "1px solid rgba(148, 163, 184, 0.15)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 16,
          fontSize: 12,
          fontFamily: "monospace",
        }}
      >
        <span style={{ color: "#38bdf8", fontWeight: 700 }}>
          FRAME {String(frame).padStart(3, "0")} / 180
        </span>
        <span style={{ color: "#64748b" }}>|</span>
        <span style={{ color: "#94a3b8" }}>
          TIME {(frame / fps).toFixed(2)}s / 6.00s
        </span>
        <span style={{ color: "#64748b" }}>|</span>
        <span style={{ color: primaryAccent, fontWeight: 700 }}>
          VELOCITY: 60°/s (2.0°/F)
        </span>

        {/* Progress Track */}
        <div
          style={{
            flex: 1,
            height: 6,
            backgroundColor: "rgba(51, 65, 85, 0.6)",
            borderRadius: 3,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(frame / durationInFrames) * 100}%`,
              background: `linear-gradient(to right, #38bdf8, ${primaryAccent}, #ec4899)`,
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    </div>
  );
};
