// DRAFT-HUD (d-011) — overlay debug cho bản duyệt draft của S2E01.
// Hiển thị: S{scene} f{global_frame} {seconds}s [{frame trong scene}/{tổng frame scene}]
// Chỉ bật qua prop draftHud=true (composition SonTinhThuyTinhDraft). Bản final KHÔNG dùng.
import * as React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { TIMING } from "./timing";

export const DraftHud: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t =
    TIMING.find(
      (x) => frame >= x.startFrame && frame < x.startFrame + x.durationInFrames
    ) ?? TIMING[TIMING.length - 1];
  const n = Number(t.sceneId.replace("sc", ""));
  const inScene = frame - t.startFrame;
  const secs = (frame / fps).toFixed(1);
  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        bottom: 20,
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: 26,
        fontWeight: 600,
        color: "#FFFFFF",
        background: "rgba(0,0,0,0.55)",
        padding: "6px 14px",
        borderRadius: 8,
        zIndex: 9999,
        letterSpacing: 1,
        pointerEvents: "none",
      }}
    >
      S{n} f{frame} {secs}s [{inScene}/{t.durationInFrames}]
    </div>
  );
};
