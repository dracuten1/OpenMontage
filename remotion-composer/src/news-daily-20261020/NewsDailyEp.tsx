// NewsDailyEp — episode shell for news-daily-20261020 S1 demo (VERTICAL 1080x1920).
// Single scene S1: voice_s1.wav from global frame 0 (full length), S1Panel persists
// through end of final sentence + 0.8s tail hold. draftHud default TRUE.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT_MONO } from "./theme";
import { TOTAL_FRAMES } from "./timing";
import { S1Panel } from "./S1Panel";

// draftHud: lower-left, monospace small, EXACT format
//   S1 f{global_frame} {sec}s [f_in_scene/scene_dur]
// global_frame = useCurrentFrame() of comp; sec = floor(frame/30);
// f_in_scene = frame (single scene S1); scene_dur = 288.
// Example frame 120 -> "S1 f120 4s [120/288]".
const DraftHud: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const label = `S1 f${frame} ${Math.floor(frame / fps)}s [${frame}/${TOTAL_FRAMES}]`;
  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        bottom: 24,
        fontFamily: FONT_MONO,
        fontSize: 26,
        color: "rgba(244, 247, 252, 0.75)",
        background: "rgba(4, 9, 20, 0.55)",
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "8px 14px",
        letterSpacing: 0.5,
        zIndex: 50,
      }}
    >
      {label}
    </div>
  );
};

export type NewsDailyEpProps = {
  draftHud?: boolean;
};

export const NewsDailyEp: React.FC<NewsDailyEpProps> = ({ draftHud = true }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep, fontFamily: '"Inter", "Helvetica Neue", "Segoe UI", "SF Pro Text", -apple-system, sans-serif' }}>
      <S1Panel />
      <Audio src={staticFile("news-daily-20261020/voice_s1.wav")} />
      {draftHud ? <DraftHud /> : null}
    </AbsoluteFill>
  );
};
