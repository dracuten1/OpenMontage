import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { spring, interpolate } from "remotion";
import { staticFile } from "remotion";
import cues from "../public/character-performer/kids/k_mouthcues_v2.json";

type MouthCue = { start: number; end: number; value: string };
const mouthCues = (cues as any).mouthCues as MouthCue[];

// ---- viseme → parametric mouth (rx, ry, tongue) ----
const VISEMES: Record<string, { rx: number; ry: number; tongue?: boolean }> = {
  X: { rx: 0, ry: 0 },            // closed → smile arc drawn instead
  A: { rx: 30, ry: 40 },
  B: { rx: 20, ry: 13 },
  C: { rx: 13, ry: 7 },
  D: { rx: 24, ry: 19 },
  E: { rx: 32, ry: 11 },
  F: { rx: 11, ry: 15 },
  G: { rx: 8, ry: 9 },
  H: { rx: 34, ry: 30, tongue: true },
};

const cueAt = (t: number): MouthCue | null => {
  for (let i = mouthCues.length - 1; i >= 0; i--) {
    if (mouthCues[i].start <= t) return mouthCues[i];
  }
  return null;
};

// sentence-gap hops: cue gaps > 0.35s
const GAPS = mouthCues
  .map((c, i) => (i > 0 && c.start - mouthCues[i - 1].end > 0.35 ? c.start : 0))
  .filter((g) => g > 0);

const OUTLINE = "#3a2e2a";

// pivot-wrap transform helper
const piv = (cx: number, cy: number, deg: number, sx = 1, sy = 1) =>
  `translate(${cx} ${cy}) rotate(${deg}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`;

export const KidsRiggedRabbit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  // ---- entrance: hop-walk in from left ----
  const inSpring = spring({ frame, fps, config: { damping: 12, mass: 0.9 } });
  const charX = interpolate(inSpring, [0, 1], [-560, 0], { extrapolateRight: "clamp" });

  // ---- hop on sentence gaps + entrance landing squash ----
  let hopY = 0;
  let squash = 0;
  const hopMoments = [0.35, ...GAPS];
  for (const g of hopMoments) {
    if (t >= g && t < g + 0.6) {
      const p = (t - g) / 0.6;
      const arc = Math.sin(p * Math.PI); // 0→1→0
      hopY -= arc * 46;
      squash = Math.max(squash, arc * (p < 0.5 ? -0.1 : 0.08)); // stretch up, squash down
    }
  }
  const breathe = 1 + Math.sin(t * 2.1) * 0.008;
  const bodySy = (1 + squash) * breathe;
  const bodySx = (1 - squash * 0.7) * breathe;

  // ---- head: slow tilt + nod on A cues + laugh tilt ----
  const cue = cueAt(t);
  const isA = cue?.value === "A";
  const isH = cue?.value === "H" || cue?.value === "G";
  const nod = isA ? Math.sin((t * Math.PI * 2) % 1 * Math.PI) * 4 : 0;
  const headDeg = Math.sin(t * 1.1) * 3 + nod + (isH ? 7 : 0);
  const earLag = Math.sin((t - 0.22) * 1.1) * 3 + (isH ? 5 : 0); // follow-through

  // ---- blink clock (2.8s cycle) ----
  const bt = t % 2.8;
  const blink = bt < 0.13 ? Math.abs(Math.sin((bt / 0.13) * Math.PI)) : 0;
  const eyeSy = 1 - blink * 0.94;

  // ---- pupils: deterministic drift ----
  const px = Math.sin(t * 1.7) * 5 + Math.sin(t * 0.43) * 3;
  const py = Math.cos(t * 1.3) * 3;

  // ---- wave arm ----
  const wave = Math.sin(t * 6.2) * 26 * interpolate(t, [0, 1.2, 15.5, 16.6], [0, 1, 1, 0]);

  // ---- mouth ----
  const v = cue ? VISEMES[cue.value] ?? VISEMES.X : VISEMES.X;
  const mouthOpen = v.rx > 0;

  // ---- bg camera ----
  const bgScale = interpolate(t, [0, 17], [1.04, 1.09]);

  // title fade
  const titleOp = interpolate(t, [0.3, 1.2], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#bfe6f5" }}>
      <Img
        src={staticFile("character-performer/kids/k_bg_clean.png")}
        style={{ width, height, objectFit: "cover", transform: `scale(${bgScale})` }}
      />

      {/* rabbit rig */}
      <div
        style={{
          position: "absolute",
          left: width * 0.5,
          top: height * 0.9,
          width: 620,
          height: 660,
          marginLeft: -310,
          marginTop: -620,
          transform: `translateX(${charX}px) translateY(${hopY}px) scale(0.86)`,
        }}
      >
        <svg viewBox="0 0 620 660" width={620} height={660}>
          {/* ground shadow (shrinks when airborne) */}
          <ellipse cx={310} cy={632} rx={150 - (-hopY) * 0.6} ry={26 - (-hopY) * 0.12} fill="#204a1e" opacity={0.22} />

          {/* squash-stretch wrapper */}
          <g transform={piv(310, 632, 0, bodySx, bodySy)}>
            {/* feet */}
            <ellipse cx={245} cy={600} rx={58} ry={30} fill="#fff" stroke={OUTLINE} strokeWidth={7} />
            <ellipse cx={375} cy={600} rx={58} ry={30} fill="#fff" stroke={OUTLINE} strokeWidth={7} />

            {/* body */}
            <ellipse cx={310} cy={470} rx={122} ry={128} fill="#fff" stroke={OUTLINE} strokeWidth={8} />
            {/* belly */}
            <ellipse cx={310} cy={500} rx={70} ry={78} fill="#fdf3ee" />

            {/* left arm (down) */}
            <g transform={piv(200, 415, 38)}>
              <ellipse cx={168} cy={448} rx={52} ry={26} fill="#fff" stroke={OUTLINE} strokeWidth={7} />
            </g>

            {/* vest */}
            <path d="M 218 372 L 402 372 L 388 528 Q 310 552 232 528 Z" fill="#e74c3c" stroke={OUTLINE} strokeWidth={7} />
            <circle cx={310} cy={420} r={9} fill="#ffd9a0" stroke={OUTLINE} strokeWidth={4} />
            <circle cx={310} cy={478} r={9} fill="#ffd9a0" stroke={OUTLINE} strokeWidth={4} />

            {/* right arm (waving) */}
            <g transform={piv(420, 415, -64 + wave)}>
              <ellipse cx={452} cy={382} rx={52} ry={26} fill="#fff" stroke={OUTLINE} strokeWidth={7} />
            </g>

            {/* ears (behind head, flop with lag) */}
            <g transform={piv(258, 150, -10 - earLag)}>
              <ellipse cx={238} cy={95} rx={34} ry={72} fill="#fff" stroke={OUTLINE} strokeWidth={8} />
              <ellipse cx={238} cy={103} rx={17} ry={48} fill="#ffc9d4" />
            </g>
            <g transform={piv(362, 150, 10 + earLag)}>
              <ellipse cx={382} cy={95} rx={34} ry={72} fill="#fff" stroke={OUTLINE} strokeWidth={8} />
              <ellipse cx={382} cy={103} rx={17} ry={48} fill="#ffc9d4" />
            </g>

            {/* head group (tilt pivot at neck) */}
            <g transform={piv(310, 350, headDeg)}>
              <circle cx={310} cy={215} r={152} fill="#fff" stroke={OUTLINE} strokeWidth={8} />

              {/* cheeks */}
              <ellipse cx={222} cy={272} rx={30} ry={20} fill="#ffc9d4" opacity={0.8} />
              <ellipse cx={398} cy={272} rx={30} ry={20} fill="#ffc9d4" opacity={0.8} />

              {/* eyes (blink = scaleY) */}
              <g transform={piv(255, 205, 0, 1, eyeSy)}>
                <ellipse cx={255} cy={205} rx={34} ry={42} fill="#fff" stroke={OUTLINE} strokeWidth={6} />
                <circle cx={255 + px} cy={208 + py} r={17} fill={OUTLINE} />
                <circle cx={261 + px} cy={200 + py} r={5.5} fill="#fff" />
              </g>
              <g transform={piv(365, 205, 0, 1, eyeSy)}>
                <ellipse cx={365} cy={205} rx={34} ry={42} fill="#fff" stroke={OUTLINE} strokeWidth={6} />
                <circle cx={365 + px} cy={208 + py} r={17} fill={OUTLINE} />
                <circle cx={371 + px} cy={200 + py} r={5.5} fill="#fff" />
              </g>

              {/* nose + whiskers */}
              <path d="M 300 262 L 320 262 L 310 276 Z" fill="#ff8fa3" stroke={OUTLINE} strokeWidth={4} />
              <line x1={150} y1={258} x2={210} y2={266} stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" opacity={0.55} />
              <line x1={152} y1={286} x2={212} y2={282} stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" opacity={0.55} />
              <line x1={410} y1={266} x2={470} y2={258} stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" opacity={0.55} />
              <line x1={408} y1={282} x2={468} y2={286} stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" opacity={0.55} />

              {/* mouth: parametric viseme ellipse or closed smile */}
              {mouthOpen ? (
                <g>
                  <ellipse cx={310} cy={312} rx={v.rx} ry={v.ry} fill="#7a2e3a" stroke={OUTLINE} strokeWidth={5} />
                  {v.tongue ? (
                    <ellipse cx={310} cy={312 + v.ry * 0.45} rx={v.rx * 0.6} ry={v.ry * 0.4} fill="#ff8fa3" />
                  ) : null}
                </g>
              ) : (
                <path d="M 282 306 Q 310 328 338 306" fill="none" stroke={OUTLINE} strokeWidth={6} strokeLinecap="round" />
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* title */}
      <div
        style={{
          position: "absolute",
          bottom: 34,
          width: "100%",
          textAlign: "center",
          opacity: titleOp,
          fontFamily: "'Arial Rounded MT Bold', 'Segoe UI', sans-serif",
          fontSize: 62,
          fontWeight: 800,
          color: "#fff",
          WebkitTextStroke: "3px #3a2e2a",
          textShadow: "0 6px 18px rgba(0,0,0,0.35)",
        }}
      >
        Rùa và Thỏ 🐰🐢
      </div>

      <Audio src={staticFile("character-performer/kids/k_narration_v2.wav")} />
      <Audio src={staticFile("character-performer/kids/k_bgm_v2.wav")} volume={0.32} />
    </AbsoluteFill>
  );
};
