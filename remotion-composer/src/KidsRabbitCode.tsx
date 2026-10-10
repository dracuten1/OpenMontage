import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import cues from "../public/character-performer/kids/k_mouthcues_v2.json";

// ---------------------------------------------------------------------------
// KidsRabbitCode — 100% code-drawn (parametric SVG) white rabbit mascot.
// Pure function of frame: no Math.random / Date.now / CSS animation / rAF.
// Playful personality: easeOutBack pops, eased blinks + lip-sync blending.
// ---------------------------------------------------------------------------

type MouthCue = { start: number; end: number; value: string };
const mouthCues = (cues as any).mouthCues as MouthCue[];
const NARRATION_END = mouthCues[mouthCues.length - 1].end; // 15.28s

const OUT = "#3a2e2a"; // warm dark brown outline
const EASE_OUT_BACK = Easing.bezier(0.34, 1.56, 0.64, 1);
const EOC = Easing.out(Easing.cubic);
const EIC = Easing.in(Easing.cubic);

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// pivot-wrap transform helper
const piv = (cx: number, cy: number, deg: number, sx = 1, sy = 1) =>
  `translate(${cx} ${cy}) rotate(${deg}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`;

// ---- viseme targets: mouth ellipse rx/ry (X = closed -> smile arc) ----
const VISEMES: Record<string, { rx: number; ry: number }> = {
  X: { rx: 0, ry: 0 },
  B: { rx: 9, ry: 3 },
  C: { rx: 13, ry: 7 },
  D: { rx: 20, ry: 15 },
  E: { rx: 26, ry: 9 },
  F: { rx: 10, ry: 6 },
  G: { rx: 8, ry: 8 },
  H: { rx: 28, ry: 22 },
  A: { rx: 30, ry: 26 },
};

// ~70ms smooth viseme interpolation (easeOutCubic), relaxed-closed after speech
const mouthAt = (tt: number): { rx: number; ry: number } => {
  let i = -1;
  for (let j = mouthCues.length - 1; j >= 0; j--) {
    if (mouthCues[j].start <= tt) {
      i = j;
      break;
    }
  }
  if (i < 0) return VISEMES.X;
  if (tt >= NARRATION_END) {
    const last = VISEMES[mouthCues[mouthCues.length - 1].value] ?? VISEMES.X;
    const p = EOC(Math.min(1, (tt - NARRATION_END) / 0.07));
    return { rx: lerp(last.rx, 0, p), ry: lerp(last.ry, 0, p) };
  }
  const cur = VISEMES[mouthCues[i].value] ?? VISEMES.X;
  const since = tt - mouthCues[i].start;
  if (since < 0.07 && i > 0) {
    const prev = VISEMES[mouthCues[i - 1].value] ?? VISEMES.X;
    const p = EOC(clamp01(since / 0.07));
    return { rx: lerp(prev.rx, cur.rx, p), ry: lerp(prev.ry, cur.ry, p) };
  }
  return cur;
};

const isSpeakingAt = (tt: number): boolean => {
  if (tt >= NARRATION_END || tt < mouthCues[0].start) return false;
  let i = -1;
  for (let j = mouthCues.length - 1; j >= 0; j--) {
    if (mouthCues[j].start <= tt) {
      i = j;
      break;
    }
  }
  return i >= 0 && mouthCues[i].value !== "X";
};

// ---- blink schedule: close 80ms easeInCubic, open 120ms easeOutCubic ----
const BLINK_STARTS = [1.05, 4.6, 4.82, 7.4, 10.6, 10.82, 13.0, 15.9, 16.12];
const blinkAt = (tt: number): number => {
  let b = 0;
  for (const s of BLINK_STARTS) {
    const dt = tt - s;
    if (dt < 0 || dt >= 0.2) continue;
    const v =
      dt < 0.08 ? EIC(dt / 0.08) : 1 - EOC(clamp01((dt - 0.08) / 0.12));
    b = Math.max(b, v);
  }
  return b;
};

// ---- hops: squash-stretch at sentence ends + celebratory outro double-hop ----
// p: 0-0.09 anticipation squash | 0.09-0.31 air (out-cubic up, in-cubic down)
//     0.31 land squash | 0.45 settled (easeOutBack jelly)
const HOPS: { s: number; h: number }[] = [
  { s: 2.3, h: 46 },
  { s: 3.56, h: 46 },
  { s: 9.49, h: 46 },
  { s: 11.95, h: 46 },
  { s: 14.15, h: 46 },
  { s: 15.6, h: 60 }, // outro double-hop (bigger)
  { s: 16.15, h: 60 },
];

const hopState = (tt: number): { dy: number; sx: number; sy: number; arm: number } => {
  let dy = 0;
  let sx = 1;
  let sy = 1;
  let arm = 0;
  for (const { s, h } of HOPS) {
    const p = tt - s;
    if (p < 0 || p > 0.45) continue;
    dy += interpolate(p, [0.09, 0.2, 0.31], [0, -h, 0], {
      easing: [EOC, EIC],
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    sx *= interpolate(p, [0, 0.09, 0.15, 0.31, 0.45], [1, 1.07, 0.94, 1.05, 1], {
      easing: [EIC, EOC, EIC, EASE_OUT_BACK],
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    sy *= interpolate(p, [0, 0.09, 0.15, 0.31, 0.45], [1, 0.93, 1.08, 0.95, 1], {
      easing: [EIC, EOC, EIC, EASE_OUT_BACK],
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    arm = Math.max(
      arm,
      interpolate(p, [0.09, 0.16, 0.24, 0.36], [0, 14, 14, 0], {
        easing: [EOC, Easing.linear, EIC], // linear holds two EQUAL values (constant)
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  }
  return { dy, sx, sy, arm };
};

// ---- geometry constants (1080x1080 canvas) ----
const FEET_Y = 856;
const BODY = { cx: 540, cy: 742, rx: 120, ry: 126 };
const HEAD = { cx: 540, cy: 565, rx: 150, ry: 125 };
const NECK = { x: 540, y: 668 };
const MOUTH_Y = 632;
const EYE_Y = 548;
const EYES_X = [474, 606];

const VEST_PATH =
  "M 468 668 Q 540 646 612 668 Q 634 712 630 764 Q 540 806 450 764 Q 446 712 468 668 Z";

export const KidsRabbitCode: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // ---- mouth ----
  const mouth = mouthAt(t);
  const tongueOp = clamp01((mouth.ry - 12) / 8);

  // ---- speech nod: tiny 1.5px bob at 2.2Hz while a non-closed cue is active ----
  const nodY = isSpeakingAt(t) ? Math.sin(t * Math.PI * 2 * 2.2) * 1.5 : 0;

  // ---- blink + cheeks ----
  const blink = blinkAt(t);

  // ---- breathing (pivot at feet, 3.6s period) ----
  const breathe = Math.sin((Math.PI * 2 * t) / 3.6);

  // ---- head tilt: slow +/-2.5deg sway at 0.13Hz ----
  const headTilt = 2.5 * Math.sin(Math.PI * 2 * 0.13 * t);

  // ---- hop state + ear lag (evaluate hop 0.18s in the past) ----
  const hop = hopState(t);
  const hopLag = hopState(t - 0.18);
  const tiltLag = 2.5 * Math.sin(Math.PI * 2 * 0.13 * (t - 0.18));

  // ear wiggle during outro celebration (decaying by 16.75s)
  const wiggle =
    t > 15.6 && t < 16.75
      ? Math.sin(Math.PI * 2 * 5 * (t - 15.6)) *
        4 *
        clamp01((16.75 - t) / 1.15)
      : 0;

  const earSway = Math.sin(Math.PI * 2 * 0.55 * t) * 2;
  const earRot = clamp(earSway - 0.8 * (tiltLag + (hopLag.dy / 46) * 8), -8, 8);
  const earRotL = earRot + wiggle;
  const earRotR = earRot - wiggle;

  // ---- outro happy hold (settled by ~16.7s, holds to end) ----
  const happy = interpolate(t, [16.55, 16.75], [0, 1], {
    easing: EOC,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- ground shadow tracks hop height ----
  const airFrac = clamp01(-hop.dy / 40);
  const shScale = 1 - 0.18 * airFrac;
  const shOp = 0.25 - 0.09 * airFrac;

  // ---- composed body transforms ----
  const bodySx = hop.sx * (1 - 0.004 * breathe);
  const bodySy = hop.sy * (1 + 0.012 * breathe);
  const headY = 1.5 * breathe + nodY;
  const cheekLift = 2 * blink + 3 * happy;

  // ---- mouth <-> smile crossfade ----
  const openness = clamp01(mouth.ry / 12) * (1 - happy);
  const smileOp = clamp01(1 - openness);
  const mouthOp = clamp01(openness * 1.15);
  const smileW = lerp(28, 37, happy);
  const smileD = lerp(22, 33, happy);

  // ---- eyes ----
  const eyeSy = 1 - 0.95 * blink;
  const arcOp = clamp01((blink - 0.55) / 0.3);

  // ---- title: drop-in over 0.6s easeOutBack, then holds still ----
  const titleP = interpolate(frame, [0, 18], [0, 1], {
    easing: EASE_OUT_BACK,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = -60 * (1 - titleP);
  const titleOp = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const TITLE_TEXT = "Rùa và Thỏ 🐰🐢";
  const TITLE_FONT =
    "'Baloo 2','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif";

  return (
    <AbsoluteFill style={{ backgroundColor: "#bfe6f5" }}>
      <Img
        src={staticFile("character-performer/kids/k_bg_clean.png")}
        style={{ width, height, objectFit: "cover" }}
      />

      <svg
        viewBox="0 0 1080 1080"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <clipPath id="krc-body-clip">
            <ellipse cx={BODY.cx} cy={BODY.cy} rx={BODY.rx} ry={BODY.ry} />
          </clipPath>
          <clipPath id="krc-head-clip">
            <ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} />
          </clipPath>
          <clipPath id="krc-mouth-clip">
            <ellipse
              cx={540}
              cy={MOUTH_Y}
              rx={Math.max(mouth.rx, 0.01)}
              ry={Math.max(mouth.ry, 0.01)}
            />
          </clipPath>
        </defs>

        {/* ground shadow (stays on ground, shrinks + fades when airborne) */}
        <ellipse
          cx={540}
          cy={858}
          rx={150 * shScale}
          ry={30 * shScale}
          fill="#2e5d34"
          opacity={shOp}
        />

        {/* whole-rabbit hop translation */}
        <g transform={`translate(0 ${hop.dy})`}>
          {/* squash-stretch + breathing, pivot at feet */}
          <g transform={piv(540, FEET_Y, 0, bodySx, bodySy)}>
            {/* tail puff (behind body) */}
            <ellipse
              cx={413}
              cy={764}
              rx={36}
              ry={33}
              fill="#ffffff"
              stroke={OUT}
              strokeWidth={9}
            />

            {/* ears — behind head, pivot at base, lag behind head tilt + hops */}
            <g transform={piv(NECK.x, NECK.y, headTilt)}>
              <g transform={piv(492, 468, earRotL)}>
                <ellipse
                  cx={492}
                  cy={380}
                  rx={27}
                  ry={92}
                  fill="#ffffff"
                  stroke={OUT}
                  strokeWidth={10}
                />
                <ellipse cx={492} cy={392} rx={14} ry={64} fill="#ffb7c9" />
                <ellipse cx={492} cy={400} rx={8} ry={42} fill="#ff93ad" />
              </g>
              <g transform={piv(588, 468, earRotR)}>
                <ellipse
                  cx={588}
                  cy={380}
                  rx={27}
                  ry={92}
                  fill="#ffffff"
                  stroke={OUT}
                  strokeWidth={10}
                />
                <ellipse cx={588} cy={392} rx={14} ry={64} fill="#ffb7c9" />
                <ellipse cx={588} cy={400} rx={8} ry={42} fill="#ff93ad" />
              </g>
            </g>

            {/* body with warm rim shading */}
            <ellipse
              cx={BODY.cx}
              cy={BODY.cy}
              rx={BODY.rx}
              ry={BODY.ry}
              fill="#f3ebe4"
            />
            <g clipPath="url(#krc-body-clip)">
              <ellipse
                cx={BODY.cx - 8}
                cy={BODY.cy - 5}
                rx={BODY.rx - 1}
                ry={BODY.ry - 1}
                fill="#ffffff"
              />
            </g>
            <ellipse
              cx={BODY.cx}
              cy={BODY.cy}
              rx={BODY.rx}
              ry={BODY.ry}
              fill="none"
              stroke={OUT}
              strokeWidth={12}
            />

            {/* red vest with darker rim + buttons */}
            <path
              d={VEST_PATH}
              fill="#e8503a"
              stroke={OUT}
              strokeWidth={9}
              strokeLinejoin="round"
            />
            <path
              d="M 456 754 Q 540 798 624 754"
              fill="none"
              stroke="#c23a28"
              strokeWidth={8}
              strokeLinecap="round"
            />
            <path
              d="M 540 658 Q 543 730 540 798"
              fill="none"
              stroke="#c23a28"
              strokeWidth={5}
              strokeLinecap="round"
            />
            <circle cx={540} cy={714} r={9} fill="#ffffff" stroke="#c23a28" strokeWidth={4} />
            <circle cx={540} cy={758} r={9} fill="#ffffff" stroke="#c23a28" strokeWidth={4} />

            {/* feet */}
            {[497, 583].map((fx) => (
              <g key={fx}>
                <ellipse
                  cx={fx}
                  cy={853}
                  rx={52}
                  ry={27}
                  fill="#ffffff"
                  stroke={OUT}
                  strokeWidth={9}
                />
                <line
                  x1={fx - 13}
                  y1={842}
                  x2={fx - 13}
                  y2={856}
                  stroke={OUT}
                  strokeWidth={5}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                <line
                  x1={fx + 13}
                  y1={842}
                  x2={fx + 13}
                  y2={856}
                  stroke={OUT}
                  strokeWidth={5}
                  strokeLinecap="round"
                  opacity={0.85}
                />
              </g>
            ))}

            {/* arms — rounded stubs, swing outward ~14deg while airborne */}
            <g transform={piv(466, 706, -(13 + hop.arm))}>
              <ellipse
                cx={450}
                cy={742}
                rx={21}
                ry={44}
                fill="#ffffff"
                stroke={OUT}
                strokeWidth={9}
              />
            </g>
            <g transform={piv(614, 706, 13 + hop.arm)}>
              <ellipse
                cx={630}
                cy={742}
                rx={21}
                ry={44}
                fill="#ffffff"
                stroke={OUT}
                strokeWidth={9}
              />
            </g>

            {/* head group: bob (breathing + speech nod) then tilt about neck */}
            <g transform={`translate(0 ${headY}) ${piv(NECK.x, NECK.y, headTilt)}`}>
              <ellipse
                cx={HEAD.cx}
                cy={HEAD.cy}
                rx={HEAD.rx}
                ry={HEAD.ry}
                fill="#f3ebe4"
              />
              <g clipPath="url(#krc-head-clip)">
                <ellipse
                  cx={HEAD.cx - 9}
                  cy={HEAD.cy - 6}
                  rx={HEAD.rx - 1}
                  ry={HEAD.ry - 1}
                  fill="#ffffff"
                />
              </g>
              <ellipse
                cx={HEAD.cx}
                cy={HEAD.cy}
                rx={HEAD.rx}
                ry={HEAD.ry}
                fill="none"
                stroke={OUT}
                strokeWidth={12}
              />

              {/* cheeks (blush, lift on blink + outro hold) */}
              <ellipse
                cx={438}
                cy={598 - cheekLift}
                rx={24}
                ry={15}
                fill="#ffb3c0"
                opacity={0.75}
              />
              <ellipse
                cx={642}
                cy={598 - cheekLift}
                rx={24}
                ry={15}
                fill="#ffb3c0"
                opacity={0.75}
              />

              {/* eyes: big dark with highlight; blink crossfades to happy arc */}
              {EYES_X.map((ex) => (
                <g key={ex}>
                  <g transform={piv(ex, EYE_Y, 0, 1, eyeSy * (1 - 0.1 * happy))}>
                    <ellipse cx={ex} cy={EYE_Y} rx={16.5} ry={21} fill={OUT} />
                    <circle cx={ex - 5} cy={EYE_Y - 7} r={5.5} fill="#ffffff" />
                  </g>
                  <path
                    d={`M ${ex - 15} ${EYE_Y + 2} Q ${ex} ${EYE_Y - 9} ${ex + 15} ${EYE_Y + 2}`}
                    fill="none"
                    stroke={OUT}
                    strokeWidth={8}
                    strokeLinecap="round"
                    opacity={arcOp}
                  />
                </g>
              ))}

              {/* nose: small rounded pink */}
              <path
                d="M 526 592 Q 540 585 554 592 Q 549 606 540 611 Q 531 606 526 592 Z"
                fill="#ff8fa3"
                stroke={OUT}
                strokeWidth={4.5}
                strokeLinejoin="round"
              />

              {/* mouth: open viseme ellipse crossfaded with closed smile arc */}
              {mouth.rx > 0.5 ? (
                <g opacity={mouthOp}>
                  <ellipse
                    cx={540}
                    cy={MOUTH_Y}
                    rx={mouth.rx}
                    ry={mouth.ry}
                    fill="#5b3a3f"
                    stroke={OUT}
                    strokeWidth={5}
                  />
                  {tongueOp > 0.01 ? (
                    <g clipPath="url(#krc-mouth-clip)" opacity={tongueOp}>
                      <ellipse
                        cx={540}
                        cy={MOUTH_Y + mouth.ry * 0.38}
                        rx={mouth.rx * 0.62}
                        ry={mouth.ry * 0.5}
                        fill="#ff8fa3"
                      />
                    </g>
                  ) : null}
                </g>
              ) : null}
              <path
                d={`M ${540 - smileW} 626 Q 540 ${626 + smileD} ${540 + smileW} 626`}
                fill="none"
                stroke={OUT}
                strokeWidth={7}
                strokeLinecap="round"
                opacity={smileOp}
              />
            </g>
          </g>
        </g>
      </svg>

      {/* title — white halo layer under dark fill layer, drop-in easeOutBack */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: 70,
          display: "flex",
          justifyContent: "center",
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            fontFamily: TITLE_FONT,
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              color: "transparent",
              WebkitTextStroke: "10px #ffffff",
              paintOrder: "stroke fill",
            }}
          >
            {TITLE_TEXT}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              color: "#3a2e2a",
              textShadow: "0 3px 10px rgba(58,46,42,0.22)",
            }}
          >
            {TITLE_TEXT}
          </div>
        </div>
      </div>

      <Audio src={staticFile("character-performer/kids/k_narration_v2.wav")} />
      <Audio
        src={staticFile("character-performer/kids/k_bgm_v2.wav")}
        volume={(f) =>
          interpolate(f, [495, 510], [0.32, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
