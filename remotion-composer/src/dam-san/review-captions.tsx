// CAPTION-PATH PREVENT: derive caption path strictly from EPISODE_SLUG variable; NEVER hardcode another project slug.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { EPISODE_SLUG, FONT } from "./theme";

export type ReviewCue = { start: number; end: number; text: string };
export const CAPTION_SRT_PATH = `${EPISODE_SLUG}/captions.srt`;

export function parseReviewSrt(srt: string, duration: number): ReviewCue[] {
  const time = (s: string) => {
    const m = /^(\d+):(\d{2}):(\d{2}),(\d{3})$/.exec(s);
    if (!m || +m[2] > 59 || +m[3] > 59) throw new Error(`Invalid SRT timestamp: ${s}`);
    return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
  };
  let previousEnd = 0;
  return srt
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .map((block) => {
      const lines = block.split(/\r?\n/);
      const match = /^(\S+)\s+-->\s+(\S+)$/.exec(lines[1] || "");
      if (!/^\d+$/.test(lines[0]) || !match || lines.length < 3) throw new Error("Invalid SRT cue");
      const start = time(match[1]);
      const end = time(match[2]);
      const text = lines.slice(2).join("\n").trim();
      if (!text || start < previousEnd || end <= start || end > duration + 0.001) {
        throw new Error("Invalid, overlapping, or out-of-bounds SRT cue");
      }
      previousEnd = end;
      return { start, end: Math.min(end, duration), text };
    });
}

export const ReviewCaptionLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const [cues, setCues] = useState<ReviewCue[]>([]);
  const [handle] = useState(() => delayRender("Load review captions from EPISODE_SLUG"));
  useEffect(() => {
    let active = true;
    fetch(staticFile(CAPTION_SRT_PATH))
      .then((res) => {
        if (!res.ok) throw new Error(`Caption fetch failed: ${res.status}`);
        return res.text();
      })
      .then((srt) => {
        if (active) {
          setCues(parseReviewSrt(srt, durationInFrames / fps));
          continueRender(handle);
        }
      })
      .catch((err) => {
        if (active) cancelRender(err);
      });
    return () => {
      active = false;
    };
  }, [durationInFrames, fps, handle]);

  const sec = frame / fps;
  const cue = cues.find((c) => sec >= c.start && sec < c.end);
  if (!cue) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 8% 4.5%", pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: "100%",
          whiteSpace: "pre-line",
          textAlign: "center",
          color: "#FAF5EB",
          background: "rgba(16,12,10,0.82)",
          padding: "8px 20px",
          fontFamily: FONT.body,
          fontSize: 31,
          lineHeight: 1.28,
          textShadow: "0 2px 4px black",
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};
