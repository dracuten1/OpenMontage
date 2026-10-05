import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Spoken } from "../timing";

export interface TimerClockProps {
  at: number;
  size?: number;
}

export const TimerClock: React.FC<TimerClockProps> = ({ at, size = 320 }) => {
  const frame = useCurrentFrame();
  const active = frame >= at;
  const elapsed = Math.max(0, frame - at);

  // Rotation: 1 full cycle every 45 frames (1.5s) to give a swift sense of continuous ticking
  const angle = active ? (elapsed * 8) % 360 : 0;
  const pulse = active ? 0.5 + 0.5 * Math.sin(elapsed / 6) : 0;

  const center = size / 2;
  const radius = center - 24;

  return (
    <Spoken at={at} fromScale={0.85}>
      <div
        style={{
          width: size,
          height: size,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outer ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={C.borderHi}
            strokeWidth={4}
          />
          {/* Glowing pulse ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={C.cyan}
            strokeWidth={4}
            strokeDasharray="16 8"
            opacity={0.4 + 0.4 * pulse}
            style={{
              filter: `drop-shadow(0 0 12px ${C.cyan})`,
            }}
          />
          {/* Minute tick marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const tickAngle = (i * 30 * Math.PI) / 180;
            const x1 = center + Math.sin(tickAngle) * (radius - 14);
            const y1 = center - Math.cos(tickAngle) * (radius - 14);
            const x2 = center + Math.sin(tickAngle) * radius;
            const y2 = center - Math.cos(tickAngle) * radius;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 3 === 0 ? C.cyan : C.muted}
                strokeWidth={i % 3 === 0 ? 3 : 1.5}
              />
            );
          })}
          {/* Sweeping radar hand */}
          {active ? (
            <line
              x1={center}
              y1={center}
              x2={center + Math.sin((angle * Math.PI) / 180) * (radius - 20)}
              y2={center - Math.cos((angle * Math.PI) / 180) * (radius - 20)}
              stroke={C.cyan}
              strokeWidth={4}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${C.cyan})` }}
            />
          ) : null}
          {/* Center node */}
          <circle
            cx={center}
            cy={center}
            r={8}
            fill={C.cyan}
            style={{ filter: `drop-shadow(0 0 10px ${C.cyan})` }}
          />
        </svg>

        {/* Center label */}
        <div
          style={{
            position: "absolute",
            textAlign: "center",
            fontFamily: FONT,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: C.cyan,
              lineHeight: 1,
              textShadow: `0 0 20px ${C.cyan}88`,
            }}
          >
            7&apos;
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: C.textSoft,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            Chu kỳ
          </div>
        </div>
      </div>
    </Spoken>
  );
};
