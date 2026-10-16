// ---------------------------------------------------------------------------
// MeshDeformDemo.tsx — Architectural Side-by-Side Comparison:
// Rigid Pivot Rotation vs Spine-style Mesh Deformation
//
// Demonstrates Part 1 of Spine-style Mesh Deformation (TASK_MESH_AND_TURNAROUND):
// - Left: Legacy rigid pivot rotation (useMeshEars={false})
// - Right: New 3-bone Linear Blend Skinning (useMeshEars={true})
//
// 150 frames (5.0s @ 30fps):
// - Frames 0..45   (0.0s..1.5s): Idle Sway (traveling wave vs stiff rock)
// - Frames 46..105 (1.5s..3.5s): Asleep Ear Flop (organic crescent droop vs board tilt)
// - Frames 106..150(3.5s..5.0s): Startled Jump (inertia follow-through vs rigid snap)
// ---------------------------------------------------------------------------

import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { KawaiiRabbit, rabbitAsleepAt } from "./rigs/KawaiiRabbit";
import { DeformableEar } from "./rigs/mesh/DeformableEar";
import { computeOrganicEarAngles } from "./rigs/mesh/SpineMesh";
import { RabbitSchedule } from "./rigs/KawaiiRabbit";

const DEMO_SCHEDULE: RabbitSchedule = {
  blinks: [0.6, 4.4],
  hops: [{ s: 3.55, h: 36 }],
  sleepIn: [1.4, 2.1],
  sleepOut: [3.5, 3.7],
  wakePopIn: [3.5, 3.7],
  wakePopOut: [4.0, 4.4],
  jerkIn: [3.5, 3.65],
  jerkOut: [3.75, 4.1],
  clapIn: [99, 100],
  clapOut: [100, 101],
};

export const MeshDeformDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // Reaction values for HUD readouts
  const asleep = rabbitAsleepAt(t, DEMO_SCHEDULE.sleepIn, DEMO_SCHEDULE.sleepOut);
  const isWake = t >= 3.5 && t <= 4.4;
  const isSleep = t >= 1.5 && t < 3.5;

  // Rigid ear angle for left panel readout
  const earSway = Math.sin(Math.PI * 2 * 0.55 * t) * 2;
  const rigidAngleL = earSway - 24 * asleep;

  // Mesh ear angles for right panel readout
  const meshAnglesL = computeOrganicEarAngles({
    side: "left",
    t,
    asleep,
    wakePop: isWake ? 1 : 0,
    hopDy: 0,
  });

  // Active Phase identification
  let phaseTitle = "PHASE 1/3: IDLE SWAY";
  let phaseSubtitle = "Traveling wave propagation vs. single-axis rigid sway";
  let phaseBadgeColor = "#0284c7"; // Sky blue

  if (isSleep) {
    phaseTitle = "PHASE 2/3: ASLEEP EAR FLOP";
    phaseSubtitle = "Organic 3-bone crescent droop vs. rigid stick rotation";
    phaseBadgeColor = "#7c3aed"; // Purple
  } else if (isWake) {
    phaseTitle = "PHASE 3/3: STARTLED WAKE & JUMP";
    phaseSubtitle = "Elastic follow-through & inertia vs. instant rigid snap";
    phaseBadgeColor = "#e11d48"; // Rose
  }

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Ambient Glows */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: 100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -100,
          right: 100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* SVG Canvas for Characters and Vector Overlays */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 1080 1080"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="dividerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(148, 163, 184, 0.05)" />
            <stop offset="20%" stopColor="rgba(148, 163, 184, 0.35)" />
            <stop offset="80%" stopColor="rgba(148, 163, 184, 0.35)" />
            <stop offset="100%" stopColor="rgba(148, 163, 184, 0.05)" />
          </linearGradient>
          <filter id="cardGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Center Vertical Divider */}
        <line
          x1="540"
          y1="160"
          x2="540"
          y2="980"
          stroke="url(#dividerGrad)"
          strokeWidth="2"
          strokeDasharray="6,6"
        />

        {/* Left Side: Rigid Pivot Rotation (Legacy) */}
        <g id="left-character-group">
          {/* Floor ground ring */}
          <ellipse cx="270" cy="850" rx="140" ry="24" fill="rgba(15, 23, 42, 0.6)" />
          {/* Scaled Rabbit Instance */}
          <g transform="translate(270 650) scale(0.72) translate(-540 -640)">
            <KawaiiRabbit
              frame={frame}
              fps={fps}
              pose="idle"
              cues={null}
              speakLines={[]}
              listenLines={[]}
              lookX={0}
              schedule={DEMO_SCHEDULE}
              clipSuffix="left-rigid"
              useMeshEars={false} // FORCED RIGID PIVOT
            />
          </g>
        </g>

        {/* Right Side: Spine Mesh Deformation (New) */}
        <g id="right-character-group">
          {/* Floor ground ring */}
          <ellipse cx="810" cy="850" rx="140" ry="24" fill="rgba(15, 23, 42, 0.6)" />
          {/* Scaled Rabbit Instance */}
          <g transform="translate(810 650) scale(0.72) translate(-540 -640)">
            <KawaiiRabbit
              frame={frame}
              fps={fps}
              pose="idle"
              cues={null}
              speakLines={[]}
              listenLines={[]}
              lookX={0}
              schedule={DEMO_SCHEDULE}
              clipSuffix="right-mesh"
              useMeshEars={true} // SPINE LBS MESH EARS
            />
          </g>
        </g>

        {/* Right Panel Inset: Live Triangulated Mesh Wireframe & Bone Hierarchy */}
        <g transform="translate(880 280) scale(0.68) translate(-496 -480)">
          {/* Inset background card */}
          <rect
            x="400"
            y="290"
            width="200"
            height="220"
            rx="16"
            fill="rgba(15, 23, 42, 0.85)"
            stroke="rgba(168, 85, 247, 0.5)"
            strokeWidth="1.5"
          />
          <text
            x="500"
            y="318"
            fill="#c084fc"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="1"
          >
            LBS SKELETON
          </text>
          {/* Isolated Deformable Ear with Wireframe & Bones */}
          <DeformableEar
            baseX={500}
            baseY={480}
            height={156}
            width={66}
            side="left"
            baseAngle={meshAnglesL.baseAngle}
            midBend={meshAnglesL.midBend}
            tipFlop={meshAnglesL.tipFlop}
            renderMode="both"
            showBones={true}
            showWireframe={true}
          />
        </g>
      </svg>

      {/* HTML Header Banner */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 0,
          width: "100%",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: 3,
            color: "#94a3b8",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          OpenMontage Character Rigging Architecture
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: -0.5,
            background: "linear-gradient(to right, #38bdf8, #a855f7, #f43f5e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Spine-Style Mesh Deformation (LBS)
        </div>

        {/* Active Phase Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            padding: "6px 18px",
            borderRadius: 999,
            background: "rgba(15, 23, 42, 0.8)",
            border: `1.5px solid ${phaseBadgeColor}`,
            boxShadow: `0 0 16px ${phaseBadgeColor}33`,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: phaseBadgeColor,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
            {phaseTitle}
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>— {phaseSubtitle}</span>
        </div>
      </div>

      {/* Left Panel Title & Badges */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 48,
          width: 440,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#e2e8f0",
              letterSpacing: -0.2,
            }}
          >
            Rigid Pivot Rotation
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6,
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            LEGACY
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
          Single pivot at ear base (y=480). Stiff, non-deforming stick rotation.
        </div>
      </div>

      {/* Right Panel Title & Badges */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 588,
          width: 440,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#e2e8f0",
              letterSpacing: -0.2,
            }}
          >
            Spine Mesh Deformation
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6,
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            3-BONE LBS
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
          3-Bone hierarchical FK chain + smooth C¹ partition-of-unity skinning.
        </div>
      </div>

      {/* Technical HUD Cards at Bottom */}
      {/* Left HUD */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 48,
          width: 440,
          background: "rgba(30, 41, 59, 0.75)",
          borderRadius: 12,
          padding: "12px 16px",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          backdropFilter: "blur(8px)",
          fontSize: 12,
        }}
      >
        <div style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>
          RIGID KINEMATICS
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
          <span>Pivot Angle:</span>
          <span style={{ fontFamily: "monospace", color: "#f87171", fontWeight: 700 }}>
            {rigidAngleL.toFixed(1)}°
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", marginTop: 3 }}>
          <span>Bones in Chain:</span>
          <span style={{ fontFamily: "monospace" }}>1 (Rigid Body)</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", marginTop: 3 }}>
          <span>Curvature (Bending):</span>
          <span style={{ fontFamily: "monospace", color: "#ef4444" }}>0.0 (None)</span>
        </div>
      </div>

      {/* Right HUD */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 588,
          width: 440,
          background: "rgba(30, 41, 59, 0.75)",
          borderRadius: 12,
          padding: "12px 16px",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          backdropFilter: "blur(8px)",
          fontSize: 12,
        }}
      >
        <div style={{ color: "#c084fc", fontWeight: 600, marginBottom: 6 }}>
          SPINE LBS HIERARCHY
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>Root (Bone 0)</div>
            <div style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 700 }}>
              {meshAnglesL.baseAngle.toFixed(1)}°
            </div>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>Mid (Bone 1)</div>
            <div style={{ fontFamily: "monospace", color: "#a855f7", fontWeight: 700 }}>
              {meshAnglesL.midBend.toFixed(1)}°
            </div>
          </div>
          <div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>Tip (Bone 2)</div>
            <div style={{ fontFamily: "monospace", color: "#f43f5e", fontWeight: 700 }}>
              {meshAnglesL.tipFlop.toFixed(1)}°
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#cbd5e1",
            marginTop: 6,
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            paddingTop: 6,
          }}
        >
          <span>Cumulative Tip World Angle:</span>
          <span style={{ fontFamily: "monospace", color: "#34d399", fontWeight: 700 }}>
            {(meshAnglesL.baseAngle + meshAnglesL.midBend + meshAnglesL.tipFlop).toFixed(1)}°
          </span>
        </div>
      </div>

      {/* Bottom Timeline Bar */}
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
          FRAME {String(frame).padStart(3, "0")} / 150
        </span>
        <span style={{ color: "#64748b" }}>|</span>
        <span style={{ color: "#94a3b8" }}>
          TIME {(frame / fps).toFixed(2)}s / 5.00s
        </span>
        {/* Timeline track */}
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
              width: `${(frame / 150) * 100}%`,
              background: "linear-gradient(to right, #38bdf8, #a855f7)",
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    </div>
  );
};
