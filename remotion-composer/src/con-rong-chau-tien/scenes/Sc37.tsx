import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { CountUp, Paper, Reveal, SpringPop, useFrac } from "../common";

// sc-37 — "mái nhà chung của 54 dân tộc anh em thuộc hơn 5 ngữ hệ".
// Order: 54 dân tộc anh em -> hơn 5 ngữ hệ. 54 glowing dots on an S-shaped outline (decorative constellation).

const MAP_X = 1270;
const MAP_Y = 90;
// S-shaped spine as a cubic polyline, sampled for 54 nodes.
const spine = (t: number): [number, number] => {
  // top (north) wide arc -> narrow waist -> south tip
  const pts: [number, number][] = [
    [300, 20],
    [200, 120],
    [120, 260],
    [190, 400],
    [250, 520],
    [210, 650],
    [140, 780],
    [150, 880],
    [230, 940],
  ];
  const f = t * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  const u = f - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
};

export const Sc37: React.FC<SceneProps> = ({ durationInFrames }) => {
  const { frame, p } = useFrac(durationInFrames);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 14);
  const nodes = Array.from({ length: 54 }, (_, i) => {
    const t = (i + 0.5) / 54;
    const [bx, by] = spine(t);
    const side = i % 3 - 1; // -1, 0, 1 spread across the width of the S
    const wob = Math.sin(i * 1.7) * 18;
    // width: wide in the north & south bulbs, narrow at the waist
    const widthMul = 40 + 70 * Math.abs(Math.cos(t * Math.PI * 1.1));
    return { x: bx + side * widthMul + wob, y: by + Math.cos(i * 2.3) * 10, i };
  });

  return (
    <Paper>
      <svg
        width={620}
        height={1000}
        viewBox="0 0 620 1000"
        style={{ position: "absolute", left: MAP_X, top: MAP_Y }}
      >
        {nodes.map((n) => {
          const born = ease(p(0.14 + (n.i / 54) * 0.2, 0.18 + (n.i / 54) * 0.2));
          const tw = 0.5 + 0.5 * Math.sin(frame / 9 + n.i * 1.3);
          return (
            <g key={n.i} opacity={born}>
              <circle cx={n.x + 90} cy={n.y} r={14 + 6 * tw} fill="rgba(217,164,65,0.18)" />
              <circle cx={n.x + 90} cy={n.y} r={6.5 * born + 1.2 * tw} fill={C.amber} />
            </g>
          );
        })}
      </svg>

      <div style={{ position: "absolute", left: 64, top: 120, width: 1100 }}>
        <Reveal startFrac={0.02} endFrac={0.1}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>
            VIỆT NAM HÔM NAY · MÁI NHÀ CHUNG
          </div>
        </Reveal>
        <SpringPop startFrac={0.06} from={0.8} style={{ transformOrigin: "left center", marginTop: 14 }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 330,
              lineHeight: 1,
              color: C.amber,
              textShadow: `0 0 ${30 + 30 * pulse}px rgba(217,164,65,0.35)`,
            }}
          >
            <CountUp to={54} startFrac={0.06} endFrac={0.3} />
          </div>
        </SpringPop>
        <Reveal startFrac={0.14} endFrac={0.24} style={{ marginTop: 36 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.white, lineHeight: 1.1 }}>
            dân tộc anh em
          </div>
        </Reveal>

        <Reveal startFrac={0.5} endFrac={0.62} style={{ marginTop: 56 }}>
          <div
            style={{
              display: "inline-block",
              padding: "20px 36px",
              border: `3px solid ${C.amber}`,
              borderRadius: 12,
              background: C.card,
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream }}>thuộc</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 76, color: C.white, lineHeight: 1.15 }}>
              hơn <span style={{ color: C.amber }}>5</span> ngữ hệ
            </div>
          </div>
        </Reveal>
        <Reveal startFrac={0.7} endFrac={0.82} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 38, color: C.cream, lineHeight: 1.4 }}>
            một bọc theo nghĩa rộng nhất
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};
