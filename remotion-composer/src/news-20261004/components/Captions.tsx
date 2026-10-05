import React from "react";
import { useCurrentFrame } from "remotion";
import { C, FONT, FPS } from "../theme";
import { getWords, norm, type SceneId } from "../timing";

export interface CaptionsProps {
  sceneId: SceneId;
  /** words per caption page (default 7) */
  wordsPerPage?: number;
  fontSize?: number;
  /** bottom offset px (default 56) */
  bottom?: number;
}

/**
 * Word-level highlighted captions from words.json (canonical script text, speech-locked).
 * Current word is amber on near-black plate (>= 11:1); other words near-white (>= 15:1).
 */
export const Captions: React.FC<CaptionsProps> = ({ sceneId, wordsPerPage = 7, fontSize = 44, bottom = 56 }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ws = getWords(sceneId);
  if (!ws.length) return null;
  // current word = last word whose start <= t
  let cur = -1;
  for (let i = 0; i < ws.length; i++) if (ws[i].start <= t) cur = i;
  if (cur < 0) return null;
  // hide once the page's last word finished + 0.5s hold
  const page = Math.floor(cur / wordsPerPage);
  const first = page * wordsPerPage;
  const slice = ws.slice(first, first + wordsPerPage);
  const lastEnd = slice[slice.length - 1].end;
  if (t > lastEnd + 0.5 && cur >= first + slice.length - 1 && page === Math.floor((ws.length - 1) / wordsPerPage)) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: 1560,
          padding: "14px 32px",
          borderRadius: 16,
          background: "rgba(7,10,15,0.86)",
          border: `1px solid ${C.border}`,
          fontFamily: FONT,
          fontWeight: 600,
          fontSize,
          lineHeight: 1.3,
          textAlign: "center",
          color: C.text,
        }}
      >
        {slice.map((w, k) => {
          const i = first + k;
          const active = i === cur;
          return (
            <span key={i} style={{ color: active ? C.amber : i < cur ? C.text : C.textSoft, marginRight: 12, display: "inline-block" }}>
              {w.word.normalize("NFC")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export { norm };
