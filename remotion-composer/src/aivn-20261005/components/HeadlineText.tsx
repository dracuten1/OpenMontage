import React from "react";
import { C, FONT, TYPE } from "../theme";
import { Spoken } from "../timing";

export interface HeadlineTextProps {
  text: string;
  at: number;
  maxWidth?: number;
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
  weight?: 600 | 700 | 800;
  accent?: string;
  accentColor?: string;
  uppercase?: boolean;
  style?: React.CSSProperties;
}

export const HeadlineText: React.FC<HeadlineTextProps> = ({
  text,
  at,
  maxWidth = 1728,
  fontSize = TYPE.headline,
  color = C.text,
  align = "left",
  weight = 800,
  accent,
  accentColor = C.cyan,
  uppercase = false,
  style,
}) => {
  const idx = accent ? text.indexOf(accent) : -1;
  const body =
    idx >= 0 ? (
      <>
        {text.slice(0, idx)}
        <span
          style={{
            color: accentColor,
            textShadow: `0 0 28px ${accentColor}55`,
          }}
        >
          {accent}
        </span>
        {text.slice(idx + accent!.length)}
      </>
    ) : (
      text
    );

  return (
    <Spoken at={at} fromY={28} fromScale={0.97}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: weight,
          fontSize,
          lineHeight: 1.15,
          color,
          maxWidth,
          textAlign: align,
          letterSpacing: uppercase ? 1 : -0.5,
          textTransform: uppercase ? "uppercase" : undefined,
          ...style,
        }}
      >
        {body}
      </div>
    </Spoken>
  );
};
