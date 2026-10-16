import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import d5c from "../public/character-performer/kids/dialogue_v2/d5_cues.json";

// ---------------------------------------------------------------------------
// KidsDepthDemo — TASK_DEMO_DEPTH: one-scene "xa gần 2D" depth showcase.
// Line 5 (turtle): "Thỏ ngủ ngon nha. Mình đi chậm rãi, đều đều, hết đường
// này nữa thôi." — turtle crawls far→near on the race-track lane while the
// rabbit naps under the oak on the right. All scenery = AI-generated stills
// (cx/gpt-5.6-luna-image, style-locked), layered parallax:
//   bg_far (0.2x pan) -> strip_mid (0.6x pan, holds the road) -> tree_sleep
//   (static) -> rabbit_sleep (breathing) -> turtle (depth ramp) -> strip_fg
//   (1.3x pan; pan rates tie to the turtle's ACTUAL screen displacement, so
//   fg stays exactly 1.5x slower than the turtle at every frame).
//
// Depth ramp (the point of the demo): story-world speed is CONSTANT (u =
// frame/(N-1) linear, final frame lands exactly on the endpoint); screen y
// is linear in u; scale is EXPONENTIAL in y (family
// 0.45 * k^((y-0.72)/0.16) clamped at 1.0, base k = 1/0.45 so the ramp
// lands exactly 1.0 at y=0.88 — task's "hoặc tương đương" variant); screen
// x is tied to scale, so on-screen spacing widens purely from the ramp.
//
// Lip-sync: d5_cues.json (t=0 = start of d5 wav = composition t=0). X ->
// turtle_m0 (closed), A..G -> turtle_mO (open), gaps/idle -> turtle_walk.
// Direct sprite swap, no crossfade. Pure function of frame: no random.
// ---------------------------------------------------------------------------

const A = 1080; // square frame
const ZZZ_COLOR = "#3a2e2a"; // warm dark brown (matches series ink)
const FONT = "'Baloo 2','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif";

// ---- turtle depth ramp -----------------------------------------------------
const X0 = 0.15, X1 = 0.55; // screen-x fraction, far -> near
const Y0 = 0.72, Y1 = 0.88; // screen-y fraction, far -> near
const S0 = 0.45, S1 = 1.0; // scale far -> near
const RAMP_BASE = S1 / S0; // 2.2222 — exponential base so S(Y1) = S1 exactly

const scaleAtY = (y: number): number =>
  Math.min(S1, S0 * Math.pow(RAMP_BASE, (y - Y0) / (Y1 - Y0)));

// ---- parallax pan ----------------------------------------------------------
// Layer pans tie to the turtle's ACTUAL screen displacement d(t) = tx - X0
// (which accelerates with the ramp), so relative order holds at every frame.
// Weights: bg 0.2 / mid 0.6 of base; fg weight chosen so fg pan speed =
// turtle speed / 1.5 exactly at all times (d/1.5 = 0.667*d — approximated by
// 1.3x of the 0.513-normalized base; exact divisor used in panFg below).
const PAN_BG_W = 0.2;
const PAN_MID_W = 0.6;
const PAN_FG_DIV = 1.5; // fg is 1.5x slower than the turtle's real speed

// ---- layer display geometry (3:2 stills cover frame + full pan travel) -----
// luna ignored some requested sizes (bg_far came 1916x821 = 2.33:1,
// strip_mid 2048x768 = 2.67:1, strip_fg 2172x724 = 3:1) — display at TRUE
// aspect so scenery is not stretched; widths sized to cover full pan travel.
// LANE FIX (measured): strip_mid dirt starts at 66% of its height; displayed
// at 970px tall the road surface spans y 750..1080 so the turtle (feet
// 778..950) walks ON the road the whole ramp instead of on the bush row.
// strip_fg is shown as a low 128px bottom band (grass tops ~y952) so the
// near turtle's feet + shadow stay visible at the end of the ramp.
const BG_W = 2520, BG_H = 1080; // 2.334:1, covers 1080 + 44px pan
const MID_W = 2587, MID_H = 970; // 2.667:1, covers 1080 + 2*133px pan, road top ~y750
const FG_W = 1700, FG_H = 567; // 3:1 full-height source
const FG_BAND_H = 128; // visible bottom band (grass top ~y952)

// ---- sprite registration ---------------------------------------------------
// luna returned NON-uniform canvases per variant (walk/mO 1536x1024,
// m0 1312x1199, rabbit 1536x1024, tree 1223x1286). Each sprite registers by
// its alpha-bbox (measured post-gen with PIL): aspect ar, top/bottom/cx
// fractions. Content bottom-center pins to the stage point, and every
// turtle variant is displayed at the SAME content height so the mouth
// sprite-swap does not jump.
type SpriteReg = { ar: number; t: number; b: number; cx: number };
const TURTLE_REG: Record<"walk" | "m0" | "mO", SpriteReg> = {
  // re-measured 2026-10-11 19:2x after identity-locked img2img regen (chain
  // base->walk->m0/mO, see registration_evidence.json); all three canvases
  // are now uniform 1535x1024 so the swap geometry is near-identical.
  walk: { ar: 1.5623, t: 0.0674, b: 0.9844, cx: 0.5059 },
  m0: { ar: 1.559, t: 0.0811, b: 1.0, cx: 0.5033 },
  mO: { ar: 1.5819, t: 0.0938, b: 1.0, cx: 0.5055 },
};
const RABBIT_REG: SpriteReg = { ar: 1.5, t: 0.066, b: 0.912, cx: 0.498 };
const TREE_REG: SpriteReg = { ar: 0.951, t: 0.0, b: 0.993, cx: 0.5 };

const TREE_H0 = 620; // tree content height
const TREE_CX = 810; // trunk base x
const TREE_BOTTOM = 985; // base touches the near lane

const RABBIT_H0 = 200; // rabbit content height
const RABBIT_CX = 800; // against the trunk base
const RABBIT_BOTTOM = 975;

const TURTLE_H0 = 320; // turtle content height at scale 1.0 (near)

type Cue = { start: number; end: number; value: string };
const CUES: Cue[] = ((d5c as any).mouthCues ?? []) as Cue[];
const WAV_DUR = 6.14;

const turtleSpriteAt = (t: number): "walk" | "m0" | "mO" => {
  if (t >= WAV_DUR) return "walk"; // past the wav -> idle walk
  const cue = CUES.find((c) => t >= c.start && t < c.end);
  if (!cue) return "walk"; // idle between cues
  return cue.value === "X" ? "m0" : "mO"; // X closed, A..G open
};

const Zzz: React.FC<{ t: number }> = ({ t }) => {
  const CYCLE = 2.5;
  const glyphs = [0, 1, 2].map((i) => {
    const phase = (i * CYCLE) / 3;
    const p = ((t + phase) % CYCLE) / CYCLE; // 0..1
    return { i, p };
  });
  return (
    <>
      {glyphs.map(({ i, p }) => {
        const opacity = Math.sin(Math.PI * p);
        if (opacity <= 0.01) return null;
        const size = 26 + 20 * p;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: 762 + 26 * p,
              top: 752 - 72 * p - i * 6,
              fontSize: size,
              fontWeight: 700,
              fontFamily: FONT,
              color: ZZZ_COLOR,
              opacity,
              lineHeight: 1,
            }}
          >
            z
          </span>
        );
      })}
    </>
  );
};

export const KidsDepthDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const t = frame / fps;

  // constant story-world speed -> linear depth progress; normalized over
  // durationInFrames - 1 so the FINAL frame lands exactly on the endpoint
  // (x 55%, y 88%, scale 1.0) instead of one frame short of it.
  const u = Math.min(1, frame / (durationInFrames - 1));
  const ty = Y0 + (Y1 - Y0) * u; // screen y
  const ts = scaleAtY(ty); // scale, exponential in y, clamp 1.0
  const tx = X0 + ((X1 - X0) * (ts - S0)) / (S1 - S0); // screen x tied to scale

  // pans tie to the turtle's actual screen displacement (accelerates with ramp)
  const turtleDx = (tx - X0) * A; // px traveled so far
  const panBase = turtleDx / (PAN_FG_DIV * 1.3); // common base rate
  const panBg = -PAN_BG_W * panBase; // 0.2x
  const panMid = -PAN_MID_W * panBase; // 0.6x
  const panFg = -1.3 * panBase; // = turtleDx / 1.5: exactly 1.5x slower than turtle

  const turtleH = TURTLE_H0 * ts; // content height on screen
  const sprite = turtleSpriteAt(t);
  const reg = TURTLE_REG[sprite];
  const tImgH = turtleH / (reg.b - reg.t);
  const tImgW = tImgH * reg.ar;

  const breathe = 1 + 0.008 * Math.sin((2 * Math.PI * t) / 3); // 3s cycle

  const shadowW = 1.12 * turtleH;
  const shadowH = 0.2 * turtleH;
  const shadowOp = 0.1 + (0.15 * (ts - S0)) / (S1 - S0);

  return (
    <AbsoluteFill style={{ backgroundColor: "#cfe8f5", overflow: "hidden" }}>
      {/* far background — sky, distant hills, faint tree line */}
      <Img
        src={staticFile("character-performer/kids/depth_demo/bg_far.png")}
        style={{
          position: "absolute",
          width: BG_W,
          height: BG_H,
          left: (A - BG_W) / 2,
          top: (A - BG_H) / 2,
          transform: `translateX(${panBg}px)`,
        }}
      />
      {/* mid strip — nearer bushes + the dirt race-track lane */}
      <Img
        src={staticFile("character-performer/kids/depth_demo/strip_mid.png")}
        style={{
          position: "absolute",
          width: MID_W,
          height: MID_H,
          left: (A - MID_W) / 2,
          top: A - MID_H,
          transform: `translateX(${panMid}px)`,
        }}
      />
      {/* oak, right side, static — its base on the near lane */}
      <Img
        src={staticFile("character-performer/kids/depth_demo/tree_sleep.png")}
        style={{
          position: "absolute",
          width: (TREE_H0 / (TREE_REG.b - TREE_REG.t)) * TREE_REG.ar,
          height: TREE_H0 / (TREE_REG.b - TREE_REG.t),
          left: TREE_CX - ((TREE_H0 / (TREE_REG.b - TREE_REG.t)) * TREE_REG.ar) * TREE_REG.cx,
          top: TREE_BOTTOM - (TREE_H0 / (TREE_REG.b - TREE_REG.t)) * TREE_REG.b,
        }}
      />
      {/* napping rabbit — gentle breathing, zZz drawn by code */}
      <Img
        src={staticFile("character-performer/kids/depth_demo/rabbit_sleep.png")}
        style={{
          position: "absolute",
          width: (RABBIT_H0 / (RABBIT_REG.b - RABBIT_REG.t)) * RABBIT_REG.ar,
          height: RABBIT_H0 / (RABBIT_REG.b - RABBIT_REG.t),
          left:
            RABBIT_CX -
            ((RABBIT_H0 / (RABBIT_REG.b - RABBIT_REG.t)) * RABBIT_REG.ar) * RABBIT_REG.cx,
          top: RABBIT_BOTTOM - (RABBIT_H0 / (RABBIT_REG.b - RABBIT_REG.t)) * RABBIT_REG.b,
          transform: `scale(${breathe})`,
          transformOrigin: `${RABBIT_REG.cx * 100}% ${RABBIT_REG.b * 100}%`,
        }}
      />
      <Zzz t={t} />
      {/* turtle — depth ramp far->near, lip-sync sprite swap (registered) */}
      <div
        style={{
          position: "absolute",
          left: tx * A - tImgW * reg.cx,
          top: ty * A - tImgH * reg.b,
          width: tImgW,
          height: tImgH,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: tImgH * reg.b - shadowH * 0.55,
            width: shadowW,
            height: shadowH,
            marginLeft: -shadowW / 2,
            borderRadius: "50%",
            background: `radial-gradient(ellipse at center, rgba(58,46,42,${shadowOp.toFixed(
              3
            )}) 0%, rgba(58,46,42,0) 70%)`,
          }}
        />
        <Img
          src={staticFile(
            sprite === "m0"
              ? "character-performer/kids/depth_demo/turtle_m0.png"
              : sprite === "mO"
              ? "character-performer/kids/depth_demo/turtle_mO.png"
              : "character-performer/kids/depth_demo/turtle_walk.png"
          )}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </div>
      {/* foreground — closest grass/flowers, fastest pan, low bottom band */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: A,
          height: FG_BAND_H,
          overflow: "hidden",
          // feather the top edge so the band blends into the road instead of
          // reading as a hard composited strip (QC catch 2026-10-11)
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 45%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 45%, black 100%)",
        }}
      >
        <Img
          src={staticFile("character-performer/kids/depth_demo/strip_fg.png")}
          style={{
            position: "absolute",
            width: FG_W,
            height: FG_H,
            left: (A - FG_W) / 2,
            bottom: 0,
            transform: `translateX(${panFg}px)`,
          }}
        />
      </div>
      <Audio src={staticFile("character-performer/kids/depth_demo/d5_turtle.wav")} />
      <Audio
        src={staticFile("character-performer/kids/depth_demo/k_bgm_v2.wav")}
        volume={0.25}
      />
    </AbsoluteFill>
  );
};
