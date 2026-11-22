import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, MOTION } from "../news/theme";

export interface FlowStep {
  id: string;
  tag: string;
  title: string;
  detail: string;
  metric?: string;
  color?: string;
  startFrame: number;
  endFrame: number;
}

export interface FlowTimelineProps {
  steps: FlowStep[];
  settleAllFrame?: number;
  width?: number;
  gap?: number;
}

export interface FlowTimelineLayout {
  width: number;
  height: number;
  stepCount: number;
  stepHeight: number;
  gap: number;
}

const DEFAULT_WIDTH = 850;
const DEFAULT_GAP = 20;
const STEP_HEIGHT = 162;

/** Pure geometry helper for consumer-side layoutGuard bounds assertions. */
export function flowTimelineLayout(
  stepCount: number,
  width = DEFAULT_WIDTH,
  gap = DEFAULT_GAP,
  stepHeight = STEP_HEIGHT,
): FlowTimelineLayout {
  const safeCount = Math.max(1, stepCount);
  return {
    width,
    height: safeCount * stepHeight + Math.max(0, safeCount - 1) * gap,
    stepCount: safeCount,
    stepHeight,
    gap,
  };
}

/**
 * Stepped vertical causal diagram with animated SVG connector spine + arrowheads.
 * Uses exclusive speech-locked states: active (1.0 + glow), settled (0.54), ghost (0.15),
 * settling to full opacity at settleAllFrame.
 */
export const FlowTimeline: React.FC<FlowTimelineProps> = ({
  steps,
  settleAllFrame,
  width = DEFAULT_WIDTH,
  gap = DEFAULT_GAP,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lastEnd = steps.reduce((acc, s) => Math.max(acc, s.endFrame), 0);
  const finalSettle = settleAllFrame ?? lastEnd + 12;
  const settleAll = frame >= finalSettle;
  const layout = flowTimelineLayout(steps.length, width, gap);

  const spineX = 34;
  const firstY = STEP_HEIGHT / 2;
  const lastY = layout.height - STEP_HEIGHT / 2;
  const spineLen = Math.max(1, lastY - firstY);
  const firstStart = steps[0]?.startFrame ?? 0;
  const lastStart = steps[steps.length - 1]?.startFrame ?? firstStart + 1;
  const spineProgress = interpolate(
    frame,
    [firstStart, Math.max(firstStart + 1, lastStart + 14)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      data-flow-timeline="true"
      style={{
        position: "relative",
        width,
        minHeight: layout.height,
        display: "flex",
        flexDirection: "column",
        gap,
      }}
    >
      {/* Animated vertical SVG connector spine */}
      {steps.length > 1 ? (
        <svg
          width={68}
          height={layout.height}
          viewBox={`0 0 68 ${layout.height}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <defs>
            <marker
              id="flow-timeline-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={COLORS.crimson} />
            </marker>
          </defs>
          <line
            x1={spineX}
            y1={firstY}
            x2={spineX}
            y2={lastY}
            stroke="rgba(20, 20, 19, 0.16)"
            strokeWidth={3}
          />
          <line
            x1={spineX}
            y1={firstY}
            x2={spineX}
            y2={lastY}
            stroke={COLORS.crimson}
            strokeWidth={3.5}
            strokeDasharray={spineLen}
            strokeDashoffset={spineLen * (1 - spineProgress)}
            markerEnd={spineProgress > 0.9 ? "url(#flow-timeline-arrow)" : undefined}
          />
        </svg>
      ) : null}

      {steps.map((step, idx) => {
        const p = spring({
          frame: Math.max(0, frame - step.startFrame),
          fps,
          config: MOTION.settle,
        });
        const active = !settleAll && frame >= step.startFrame && frame < step.endFrame;
        const past = !settleAll && frame >= step.endFrame;
        const opacity =
          frame < step.startFrame ? 0.15 : settleAll ? 1.0 : active ? 1.0 : past ? 0.54 : 0.15;
        const accent = step.color ?? COLORS.crimson;
        const ty = interpolate(p, [0, 1], [14, 0]);

        return (
          <div
            key={step.id}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 18,
              opacity,
              transform: `translateY(${ty}px)`,
              zIndex: 2,
            }}
          >
            {/* Node marker on spine */}
            <div
              style={{
                width: 68,
                flexShrink: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  backgroundColor: active ? accent : COLORS.surface,
                  border: `2.5px solid ${accent}`,
                  color: active ? COLORS.surface : accent,
                  fontFamily: FONTS.mono,
                  fontSize: 24,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {idx + 1}
              </div>
            </div>

            {/* Step body */}
            <div
              style={{
                flex: 1,
                padding: "16px 22px",
                borderRadius: 3,
                backgroundColor: active ? COLORS.surfaceAlt : COLORS.surface,
                border: `1px solid ${COLORS.line}`,
                borderLeft: active ? `5px solid ${accent}` : `2px solid ${COLORS.ink}`,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 24,
                    fontWeight: 800,
                    color: accent,
                    letterSpacing: 0.4,
                  }}
                >
                  {step.tag}
                </span>
                {step.metric ? (
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 24,
                      fontWeight: 800,
                      color: COLORS.ink,
                      backgroundColor: COLORS.highlighter,
                      padding: "2px 8px",
                    }}
                  >
                    {step.metric}
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 30,
                  fontWeight: 800,
                  color: COLORS.ink,
                  lineHeight: 1.18,
                }}
              >
                {step.title}
              </div>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 24,
                  color: COLORS.muted,
                  lineHeight: 1.32,
                }}
              >
                {step.detail}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
