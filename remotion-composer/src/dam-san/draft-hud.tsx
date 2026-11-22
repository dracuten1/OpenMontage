import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "./theme";

export const DraftHUD: React.FC<{
  sceneId: string;
  sectionId: string;
  durationInFrames: number;
  label?: string;
  layerTag?: "son" | "amber" | "teal" | "dual";
}> = ({ sceneId, sectionId, durationInFrames, label, layerTag = "amber" }) => {
  const frame = useCurrentFrame();
  const sec = (frame / 30).toFixed(1);
  const totalSec = (durationInFrames / 30).toFixed(1);
  const progress = Math.min(100, Math.round((frame / Math.max(1, durationInFrames)) * 100));

  const tagColor =
    layerTag === "son" ? C.redLight : layerTag === "amber" ? C.gold : layerTag === "teal" ? C.tealLight : C.cream;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 999 }}>
      <div
        style={{
          position: "absolute",
          top: 22,
          left: 40,
          right: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: FONT.mono,
          fontSize: 18,
          color: C.cream,
          background: "rgba(20, 15, 12, 0.88)",
          padding: "8px 20px",
          borderBottom: `2px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ color: tagColor, fontWeight: "bold" }}>[{sceneId.toUpperCase()}]</span>
          <span style={{ color: C.mute }}>{sectionId}</span>
          {label && (
            <span style={{ color: C.cream, maxWidth: 560, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {label}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span>
            {sec}s / {totalSec}s ({progress}%)
          </span>
          <span style={{ color: C.gold }}>F:{frame}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
