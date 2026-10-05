import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { Spoken } from "../timing";

export type IllustrationName = "img_gdp" | "img_fuel" | "img_savings" | "img_gold" | "img_ai_jobs";

export interface IllustrationFrameProps {
  name: IllustrationName;
  /** appear frame (scene-local) */
  at: number;
  width?: number;
  height?: number;
  /** Ken-Burns end scale (default 1.12) and drift px */
  zoom?: number;
  driftX?: number;
  driftY?: number;
  rounded?: number;
  /** badge text (default "Hình minh họa") -- keep it: images are concept illustrations, not data */
  badge?: string;
  /** dark scrim over the image for text legibility 0..1 (default 0) */
  scrim?: number;
  style?: React.CSSProperties;
}

/** Concept illustration with slow Ken-Burns drift + always-visible small badge "Hình minh họa". */
export const IllustrationFrame: React.FC<IllustrationFrameProps> = ({
  name, at, width = 760, height = 520, zoom = 1.12, driftX = -24, driftY = -16, rounded = 24, badge = "Hình minh họa", scrim = 0, style,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Spoken at={at} fromY={20} fromScale={0.97} style={style}>
      <div style={{ position: "relative", width, height, borderRadius: rounded, overflow: "hidden", border: `1px solid ${C.border}`, background: C.surface }}>
        <Img
          src={staticFile(`news-20261004/${name}.png`)}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1 + (zoom - 1) * k}) translate(${driftX * k}px, ${driftY * k}px)` }}
        />
        {scrim > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(13,17,23,${scrim})` }} /> : null}
        <div
          style={{
            position: "absolute", right: 14, bottom: 14, padding: "6px 14px", borderRadius: 999, fontFamily: FONT,
            fontSize: 22, fontWeight: 600, color: C.text, background: "rgba(7,10,15,0.82)", border: `1px solid ${C.border}`,
          }}
        >
          {badge}
        </div>
      </div>
    </Spoken>
  );
};
