import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT, FPS } from "../theme";
import { getWords, type SceneId } from "../timing";

export interface CaptionsProps {
  sceneId: SceneId;
  wordsPerPage?: number;
  fontSize?: number;
  bottom?: number;
  highlightColor?: string;
}

/**
 * Word-level highlighted captions from narration_words.json (speech-locked).
 * Highlighted active word, dark frosted glass container, high WCAG contrast.
 */
export const Captions: React.FC<CaptionsProps> = ({
  sceneId,
  wordsPerPage = 7,
  fontSize = 38,
  bottom = 44,
  highlightColor = C.blue,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ws = getWords(sceneId);
  if (!ws.length) return null;

  // Current active word is the last word whose start <= t
  let cur = -1;
  for (let i = 0; i < ws.length; i++) {
    if (ws[i].start <= t) cur = i;
  }
  if (cur < 0) return null;

  const page = Math.floor(cur / wordsPerPage);
  const first = page * wordsPerPage;
  const slice = ws.slice(first, first + wordsPerPage);
  const lastEnd = slice[slice.length - 1].end;

  // Hide 0.6s after the last word in the scene finishes
  if (
    t > lastEnd + 0.6 &&
    cur >= first + slice.length - 1 &&
    page === Math.floor((ws.length - 1) / wordsPerPage)
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1560,
          padding: "12px 32px",
          borderRadius: 16,
          background: "rgba(11, 15, 25, 0.90)",
          border: `1px solid ${C.borderHi}`,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(12px)",
          fontFamily: FONT,
          fontWeight: 600,
          fontSize,
          lineHeight: 1.35,
          textAlign: "center",
          color: C.text,
        }}
      >
        {slice.map((w, k) => {
          const i = first + k;
          const active = i === cur;
          return (
            <span
              key={i}
              style={{
                color: active ? highlightColor : i < cur ? C.text : C.muted,
                fontWeight: active ? 700 : 600,
                textShadow: active ? `0 0 18px ${highlightColor}77` : undefined,
                marginRight: 10,
                display: "inline-block",
                transition: "color 0.1s ease",
              }}
            >
              {w.word.normalize("NFC")}
            </span>
          );
        })}
      </div>
    </div>
  );
};
