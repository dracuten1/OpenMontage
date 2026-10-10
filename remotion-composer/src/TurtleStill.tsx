import React from "react";
import { AbsoluteFill } from "remotion";
import { TurtleFigure } from "./KidsStoryMultiScene";

// ---------------------------------------------------------------------------
// v3.3 owner-review stills — ONE turtle per comp, 1080x1080 PURE WHITE
// background, NO labels, NO ground line (clean silhouette QC of the one-path
// construction). The rig spans y508 (head top) .. y858 (feet) = 350px; scale
// 750/350 makes the turtle occupy ~750px = ~70% of frame height, vertically
// centered on rig y683. Pose params are the approved v3.2 review values:
//   TurtleStill       idle  — tHeadX/Y 0, tilt 0, tBodyDy 0, smile 36/26, book HELD
//   TurtleStillWalk   walk  — tilt -2, tBodyDy -5, smile 36/26, book HELD
//   TurtleStillProud  proud — tHeadY -6, tilt +7, tBodyDy -11, smile 44/32, NO book
// All poses: tEyeSy 1, tArcOp 0, tLookX 0, closed smile (tMouth rx 0).
// ---------------------------------------------------------------------------

const STILL_SCALE = 750 / 350; // rig height 350px -> ~750px on canvas
const RIG_CY = 683; // vertical center of the rig: (508 + 858) / 2

type PoseStillProps = {
  tHeadX: number;
  tHeadY: number;
  tHeadTilt: number;
  tBodyDy: number;
  tSmileW: number;
  tSmileD: number;
  book: boolean;
};

const TurtlePoseStill: React.FC<PoseStillProps> = ({
  tHeadX,
  tHeadY,
  tHeadTilt,
  tBodyDy,
  tSmileW,
  tSmileD,
  book,
}) => (
  <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
    <svg
      viewBox="0 0 1080 1080"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <g
        transform={`translate(540 540) scale(${STILL_SCALE.toFixed(4)}) translate(-540 -${RIG_CY})`}
      >
        <TurtleFigure
          tHeadX={tHeadX}
          tHeadY={tHeadY}
          tHeadTilt={tHeadTilt}
          tBodyDy={tBodyDy}
          tEyeSy={1}
          tArcOp={0}
          tLookX={0}
          tMouth={{ rx: 0, ry: 0 }}
          tMouthOp={0}
          tTongueOp={0}
          tSmileOp={1}
          tSmileW={tSmileW}
          tSmileD={tSmileD}
          // held book: body-local y 812 — world position rides tBodyDy
          book={book ? { x: 548, bodyY: 812, rot: 0 } : null}
          // full grip in book poses, none in the proud (book-less) pose
          tGrip={book ? 1 : 0}
          clipSuffix="still"
        />
      </g>
    </svg>
  </AbsoluteFill>
);

export const TurtleStill: React.FC = () => (
  <TurtlePoseStill
    tHeadX={0}
    tHeadY={0}
    tHeadTilt={0}
    tBodyDy={0}
    tSmileW={36}
    tSmileD={26}
    book
  />
);

export const TurtleStillWalk: React.FC = () => (
  <TurtlePoseStill
    tHeadX={0}
    tHeadY={0}
    tHeadTilt={-2}
    tBodyDy={-5}
    tSmileW={36}
    tSmileD={26}
    book
  />
);

export const TurtleStillProud: React.FC = () => (
  <TurtlePoseStill
    tHeadX={0}
    tHeadY={-6}
    tHeadTilt={7}
    tBodyDy={-11}
    tSmileW={44}
    tSmileD={32}
    book={false}
  />
);
