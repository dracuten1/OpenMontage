import React from "react";
import { C, FONT, TYPE } from "../theme";
import { Spoken } from "../timing";

export interface HeadlineTextProps {
  text: string;
  /** scene-local frame at which it appears (use frameOf(...)) */
  at: number;
  /** max px width of the text box (default 1728) */
  maxWidth?: number;
  /** max px lines allowed before shrinking (default 2) */
  maxLines?: number;
  /** starting font size; auto-shrinks (min 48) until text fits maxLines (default 96) */
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
  weight?: 600 | 700 | 800;
  /** optional accent substring rendered in accentColor (must occur in text) */
  accent?: string;
  accentColor?: string;
  uppercase?: boolean;
}

/** Rough width estimate for Be Vietnam Pro bold: ~0.56em per char (uppercase ~0.64em). */
const estLines = (text: string, size: number, maxWidth: number, upper: boolean): number => {
  const per = size * (upper ? 0.66 : 0.56);
  const perLine = Math.max(1, Math.floor(maxWidth / per));
  const words = text.split(/\s+/);
  let lines = 1;
  let len = 0;
  for (const w of words) {
    const add = (len ? 1 : 0) + w.length;
    if (len + add > perLine) { lines++; len = w.length; } else len += add;
  }
  return lines;
};

/** Vietnamese headline with auto-fit (shrinks until it fits maxLines) and a spoken-triggered reveal. */
export const HeadlineText: React.FC<HeadlineTextProps> = ({
  text, at, maxWidth = 1728, maxLines = 2, fontSize = TYPE.headline, color = C.text, align = "left",
  weight = 800, accent, accentColor = C.amber, uppercase = false,
}) => {
  let size = fontSize;
  while (size > 48 && estLines(text, size, maxWidth, uppercase) > maxLines) size -= 4;
  const idx = accent ? text.indexOf(accent) : -1;
  const body =
    idx >= 0 ? (
      <>
        {text.slice(0, idx)}
        <span style={{ color: accentColor }}>{accent}</span>
        {text.slice(idx + accent!.length)}
      </>
    ) : (
      text
    );
  return (
    <Spoken at={at} fromY={32}>
      <div
        style={{
          fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.12, color, maxWidth, textAlign: align,
          letterSpacing: uppercase ? 0.5 : -0.5, textTransform: uppercase ? "uppercase" : undefined, textWrap: "balance" as never,
        }}
      >
        {body}
      </div>
    </Spoken>
  );
};
