import React from "react";
import { AbsoluteFill } from "remotion";
import { TurtleFigure } from "./rigs/GoldenTurtle";

// ---------------------------------------------------------------------------
// v4 SIDE-VIEW stills (design gate) — ONE turtle per comp, 1080x1080 PURE
// WHITE background, NO labels, NO ground line. v4 footprint is wider than
// tall: rig extents ≈ x391..754 (nose..tail, 363px) × y601..859 (dome..toes,
// 258px). Scale 2.70 → 980×697 px on canvas (~91% width, ~65% height), ≥40px
// margins, centered on rig (572, 730). clipSuffix "v4".
//   TurtleStillV4Idle  crawl_idle — legs planted (tCrawl 0), TALKING mouth
//                      {22,19} + tongue, book HELD (470, 816, −6), tGrip 1
//   TurtleStillV4Walk  crawl_walk — mid-stride: tCrawl 0.75 swings the
//                      near-rear + far-front pair (near-front grips the book,
//                      far-rear planted), tilt −2, body bob −4, head extend −4
//   TurtleStillV4Proud proud — head up (−8 / +8 nose-up), body −10, closed
//                      smile 42/32, NO book, tGrip 0, legs planted
// All: tEyeSy 1, tArcOp 0, tLookX 0.
// ---------------------------------------------------------------------------

const STILL_SCALE = 2.6; // rig 363px wide -> ~944px on canvas (68px margins; rim sw6 -> 15.6px rendered, gate <=16)
const RIG_CX = 572; // horizontal center of the rig: (391 + 754) / 2
const RIG_CY = 730; // vertical center of the rig: (601 + 859) / 2

type PoseStillProps = {
  tHeadX: number;
  tHeadY: number;
  tHeadTilt: number;
  tBodyDy: number;
  tCrawl: number;
  tMouth: { rx: number; ry: number };
  tMouthOp: number;
  tTongueOp: number;
  tSmileOp: number;
  tSmileW: number;
  tSmileD: number;
  book: boolean;
  tGrip: number;
};

const TurtlePoseStill: React.FC<PoseStillProps> = ({
  tHeadX,
  tHeadY,
  tHeadTilt,
  tBodyDy,
  tCrawl,
  tMouth,
  tMouthOp,
  tTongueOp,
  tSmileOp,
  tSmileW,
  tSmileD,
  book,
  tGrip,
}) => (
  <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
    <svg
      viewBox="0 0 1080 1080"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <g
        transform={`translate(540 540) scale(${STILL_SCALE.toFixed(4)}) translate(-${RIG_CX} -${RIG_CY})`}
      >
        <TurtleFigure
          tHeadX={tHeadX}
          tHeadY={tHeadY}
          tHeadTilt={tHeadTilt}
          tBodyDy={tBodyDy}
          tEyeSy={1}
          tArcOp={0}
          tLookX={0}
          tMouth={tMouth}
          tMouthOp={tMouthOp}
          tTongueOp={tTongueOp}
          tSmileOp={tSmileOp}
          tSmileW={tSmileW}
          tSmileD={tSmileD}
          // held book at home (470, 816) with a slight −6° tilt; body-local y
          // rides tBodyDy
          book={book ? { x: 470, bodyY: 816, rot: -6 } : null}
          // full grip in book poses, none in the proud (book-less) pose
          tGrip={tGrip}
          tCrawl={tCrawl}
          clipSuffix="v4"
        />
      </g>
    </svg>
  </AbsoluteFill>
);

export const TurtleStillV4Idle: React.FC = () => (
  <TurtlePoseStill
    tHeadX={0}
    tHeadY={0}
    tHeadTilt={0}
    tBodyDy={0}
    tCrawl={0}
    tMouth={{ rx: 22, ry: 19 }}
    tMouthOp={1}
    tTongueOp={0.5}
    tSmileOp={0}
    tSmileW={34}
    tSmileD={24}
    book
    tGrip={1}
  />
);

export const TurtleStillV4Walk: React.FC = () => (
  <TurtlePoseStill
    tHeadX={-4}
    tHeadY={0}
    tHeadTilt={-2}
    tBodyDy={-4}
    tCrawl={0.75}
    tMouth={{ rx: 0, ry: 0 }}
    tMouthOp={0}
    tTongueOp={0}
    tSmileOp={1}
    tSmileW={34}
    tSmileD={24}
    book
    tGrip={1}
  />
);

export const TurtleStillV4Proud: React.FC = () => (
  <TurtlePoseStill
    tHeadX={0}
    tHeadY={-8}
    tHeadTilt={8}
    tBodyDy={-10}
    tCrawl={0}
    tMouth={{ rx: 0, ry: 0 }}
    tMouthOp={0}
    tTongueOp={0}
    tSmileOp={1}
    tSmileW={42}
    tSmileD={32}
    book={false}
    tGrip={0}
  />
);
