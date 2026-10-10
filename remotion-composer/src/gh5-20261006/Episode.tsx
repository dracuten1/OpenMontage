// gh5-20261006 — "5 Repo GitHub Nổ Nhất Tuần" (atelier composition, VERTICAL 1080x1920).
// One <Sequence> per scene from MEASURED scene_timing.json (122.159s). Every reveal /
// count-up / tick is speech-locked (frameOf) to SPOKEN word times in
// public/gh5-20261006/words.json (52/52 anchors audited at compose time).
// Layout per scene_plan: content x 80-1000, core y 400-1250; captions own y > 1500.
// Display forms only on screen (★ 4.354, designer, SDK token, REX…) — no respellings.
import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, spring,
} from "remotion";
import { C, FONT, MONO, SAFE, SPRING, fmtVi } from "./theme";
import { SCENE_TIMING, TOTAL_FRAMES, frameOf, frameOfEnd, getSceneTiming, type SceneId } from "./timing";
import captionsJson from "../../public/gh5-20261006/captions.json";

export const GH5_20261006_TOTAL_FRAMES = TOTAL_FRAMES; // 3695
const SF = (id: SceneId): number => getSceneTiming(id).scene_frames;
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const lit = (f: number, at: number, k = 8): number => interpolate(f - at, [0, k], [0, 1], clamp);
const dim = (f: number, at: number): number => interpolate(f - at, [0, 12], [1, 0.42], clamp);

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 22, ...style }}>{children}</div>
);

const Chip: React.FC<{
  color: string; children?: React.ReactNode; dashed?: boolean; fill?: string; style?: React.CSSProperties;
}> = ({ color, children, dashed, fill = "rgba(255,255,255,0.04)", style }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 10,
    background: fill, color, border: `1.5px ${dashed ? "dashed" : "solid"} ${color}`,
    borderRadius: 12, padding: "10px 20px", fontSize: 28, fontWeight: 700, ...style,
  }}>{children}</div>
);

const slam = (at: number, frame: number, fps: number, fromScale = 1.45) => {
  const p = spring({ frame: frame - at, fps, config: { ...SPRING, damping: 18 } });
  const op = interpolate(frame - at, [0, 6], [0, 1], clamp);
  return { opacity: op, transform: `scale(${fromScale + (1 - fromScale) * p})` };
};

const glow = (color: string, strength: number): React.CSSProperties => ({ boxShadow: `0 0 ${strength}px ${color}` });

/** Number count-up, speech-locked. `at` = scene-local trigger frame. */
const CountUp: React.FC<{
  at: number; to: number; frames?: number; decimals?: number; style?: React.CSSProperties;
}> = ({ at, to, frames = 36, decimals = 0, style }) => {
  const f = useCurrentFrame();
  const eased = to * (f < at ? 0 : Math.pow(interpolate(f - at, [0, frames], [0, 1], clamp), 0.6));
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{f < at ? "" : fmtVi(eased, decimals)}</span>;
};

/** Amber caveat banner — recurring element across s03/s05/s07/s09/s11. */
const Banner: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: 330, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", ...slam(at, f, fps, 1.3), zIndex: 5 }}>
      <div style={{
        background: C.amberFill, border: `2.5px solid ${C.amber}`, color: C.amber,
        borderRadius: 14, padding: "14px 36px", fontSize: 44, fontWeight: 900, letterSpacing: 3,
        ...(f >= at ? glow("rgba(210,153,34,0.4)", 26) : {}),
      }}>ĐIỀU README KHÔNG KHOE</div>
    </div>
  );
};

/** Blue repo chip 'github.com/…' — recurring element opening the 5 repo scenes. */
const RepoChip: React.FC<{ at: number; repo: string }> = ({ at, repo }) => {
  const f = useCurrentFrame();
  const slide = interpolate(f - at, [0, 12], [-60, 0], clamp);
  return (
    <div style={{
      position: "absolute", top: 292, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center",
      opacity: lit(f, at), transform: `translateX(${slide}px)`, zIndex: 5,
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 14, background: "rgba(88,166,255,0.10)",
        border: `1.5px solid ${C.blue}`, borderRadius: 999, padding: "12px 30px",
        color: C.blue, fontFamily: MONO, fontSize: 32, fontWeight: 600,
      }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: C.blue, display: "inline-block" }} />
        {repo}
      </div>
    </div>
  );
};

/** Star stat card + snapshot chip — every repo scene. `at` speech-locked to the number. */
const StatCard: React.FC<{ at: number; stars: number; fork: number; meta: string }> = ({ at, stars, fork, meta }) => {
  const f = useCurrentFrame();
  const drop = interpolate(f - at, [0, 12], [46, 0], clamp);
  return (
    <div style={{
      position: "absolute", left: SAFE.x, right: SAFE.x,
      opacity: lit(f, at, 10), transform: `translateY(${drop}px)`, zIndex: 4,
    }}>
      <Card style={{ padding: "26px 34px", display: "flex", alignItems: "center", gap: 26, ...(f >= at ? glow("rgba(63,185,80,0.25)", 22) : {}) }}>
        <div style={{ color: C.green, fontSize: 84, fontWeight: 900, lineHeight: 1, fontFamily: FONT }}>
          ★ <CountUp at={at} to={stars} frames={40} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <div style={{ color: C.textSoft, fontSize: 32, fontWeight: 700 }}>
            fork <span style={{ color: C.text, fontWeight: 800 }}>{fmtVi(fork)}</span>
          </div>
          <div style={{ color: C.muted, fontSize: 28, fontWeight: 600, fontFamily: MONO }}>{meta}</div>
        </div>
        <Chip color={C.amber} dashed fill="rgba(210,153,34,0.08)" style={{ fontSize: 26 }}>tính đến 06/10</Chip>
      </Card>
    </div>
  );
};

const Padlock: React.FC<{ color: string; size?: number; closed?: boolean }> = ({ color, size = 44, closed = true }) => (
  <svg width={size} height={size} viewBox="0 0 44 44">
    <rect x={9} y={19} width={26} height={20} rx={5} fill="none" stroke={color} strokeWidth={4} />
    <path d={closed ? "M 14 19 V 13 a 8 8 0 0 1 16 0 V 19" : "M 14 19 V 13 a 8 8 0 0 1 16 0"} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
    <circle cx={22} cy={29} r={3.4} fill={color} />
  </svg>
);

// ---------------------------------------------------------------------------
// S01 — HOOK: Minecraft × GTA V split-screen + kinetic title card
// ---------------------------------------------------------------------------
const S01: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aPrompt = frameOf("s01", "một dòng prompt");
  const aVoxel = frameOf("s01", "Mai-cráp thật");
  const aCity = frameOf("s01", "Gi ti ây Phi");
  const aTitle = frameOf("s01", "năm ri-po");
  const aSub = frameOf("s01", "Rít-mi không khoe");
  const shrink = interpolate(f - aTitle, [0, 14], [1, 0.82], clamp);
  const panel: React.CSSProperties = {
    position: "absolute", left: SAFE.x, right: SAFE.x, height: 285, overflow: "hidden",
    borderRadius: 18, border: `1.5px solid ${C.border}`,
  };
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill style={{
        backgroundImage: `repeating-linear-gradient(0deg, ${C.grid} 0 1px, transparent 1px 96px), repeating-linear-gradient(90deg, ${C.grid} 0 1px, transparent 1px 96px)`,
      }} />
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, height: 600, transform: `scale(${shrink})`, transformOrigin: "top center" }}>
        {/* voxel panel — slams at 'Minecraft thật' */}
        <div style={{ ...panel, top: 0, ...slam(aVoxel, f, fps, 1.28) }}>
          <Img src={staticFile("gh5-20261006/img_s01a.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "linear-gradient(180deg, transparent, rgba(1,4,9,0.85))" }} />
          <div style={{ position: "absolute", left: 20, bottom: 14 }}><Chip color={C.green} fill="rgba(1,4,9,0.7)" style={{ fontSize: 26 }}>Minecraft trong GTA V</Chip></div>
        </div>
        {/* divider lights with the city slam */}
        <div style={{
          position: "absolute", top: 285, left: SAFE.x, right: SAFE.x, height: 5, background: C.blue,
          opacity: lit(f, aCity), boxShadow: `0 0 18px ${C.blue}`,
        }} />
        {/* city panel — slams at 'GTA V' */}
        <div style={{ ...panel, top: 300, ...slam(aCity, f, fps, 1.28) }}>
          <Img src={staticFile("gh5-20261006/img_s01b.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "linear-gradient(180deg, transparent, rgba(1,4,9,0.85))" }} />
          <div style={{ position: "absolute", right: 20, bottom: 14 }}><Chip color={C.red} fill="rgba(1,4,9,0.7)" style={{ fontSize: 26 }}>GTA V story mode</Chip></div>
        </div>
        {/* fixed label over the split */}
        <div style={{ position: "absolute", top: -58, right: SAFE.x, opacity: lit(f, aVoxel) }}>
          <Chip color={C.muted} fill="rgba(1,4,9,0.72)" style={{ fontSize: 24 }}>prompt mẫu trong README — chưa có build</Chip>
        </div>
      </div>
      {/* 'một dòng prompt' kinetic hit — pixel-shatters as the panels land */}
      <div style={{
        position: "absolute", top: 640, left: SAFE.x, right: SAFE.x, textAlign: "center", zIndex: 6,
        ...slam(aPrompt + 4, f, fps, 1.6),
        opacity: interpolate(f - aVoxel, [0, 8], [1, 0], clamp) * lit(f, aPrompt + 4, 5),
      }}>
        <span style={{
          fontFamily: MONO, fontSize: 54, fontWeight: 800, color: C.text,
          textShadow: `0 0 26px rgba(88,166,255,0.55)`,
        }}>&gt; một dòng prompt_</span>
      </div>
      {/* title card — '5' counts up on 'năm repo' */}
      <div style={{ position: "absolute", top: 1030, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <div style={{
          color: C.text, fontSize: 74, fontWeight: 900, letterSpacing: 1, lineHeight: 1.05,
          ...slam(aTitle, f, fps, 1.5), ...(f >= aTitle ? { textShadow: `0 0 34px rgba(88,166,255,0.4)` } : {}),
        }}>
          <span style={{ color: C.blue, fontSize: 118 }}><CountUp at={aTitle} to={5} frames={20} /></span>{" "}
          REPO GITHUB<br />NỔ NHẤT TUẦN
        </div>
        <div style={{
          marginTop: 26, color: C.textSoft, fontSize: 40, fontWeight: 700,
          opacity: lit(f, aSub, 10), transform: `translateY(${interpolate(f - aSub, [0, 10], [24, 0], clamp)}px)`,
        }}>mỗi repo một điều README không khoe</div>
        <div style={{ marginTop: 22, display: "flex", justifyContent: "center", opacity: lit(f, aSub, 12) }}>
          <Chip color={C.amber} dashed fill="rgba(210,153,34,0.08)">mỗi số là snapshot 06/10</Chip>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S02 — REPO 1 universal-modder: terminal mock + typing prompt
// ---------------------------------------------------------------------------
const TERMINAL_TEXT = "Put real Minecraft inside GTA V story mode";
const S02: React.FC = () => {
  const f = useCurrentFrame();
  const aChip = frameOf("s02", "du-ni-vơ-sồ mô-đờ");
  const aType = frameOf("s02", "a-gent lập trình ây-ai");
  const aNote = frameOf("s02", "game Pi Xí bạn sở hữu");
  const aStat = frameOf("s02", "bốn nghìn ba trăm năm mươi tư");
  const typed = Math.floor(interpolate(f, [aType, aType + 78], [0, TERMINAL_TEXT.length], clamp));
  const caret = f % 30 < 15 ? 1 : 0.15;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <RepoChip at={aChip} repo="github.com/rehan-remade/universal-modder" />
      <div style={{ position: "absolute", top: 420, left: SAFE.x, right: SAFE.x, opacity: lit(f, aType, 8) }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, opacity: 0.9 }}>
          <Chip color={C.muted} fill="rgba(1,4,9,0.7)" style={{ fontSize: 24 }}>prompt mẫu trong README</Chip>
        </div>
        <div style={{
          background: C.bgDeep, border: `1.5px solid ${C.border}`, borderRadius: 18, overflow: "hidden",
          ...(f >= aType ? glow("rgba(63,185,80,0.16)", 26) : {}),
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
            {["#F85149", "#D29922", "#3FB950"].map((c) => (
              <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, display: "inline-block" }} />
            ))}
            <span style={{ color: C.muted, fontFamily: MONO, fontSize: 24, marginLeft: 12 }}>README — prompt</span>
          </div>
          <div style={{ padding: "44px 34px", fontFamily: MONO, fontSize: 44, fontWeight: 600, lineHeight: 1.45, minHeight: 210 }}>
            <span style={{ color: C.green }}>$ </span>
            <span style={{ color: C.text }}>{TERMINAL_TEXT.slice(0, typed)}</span>
            <span style={{ display: "inline-block", width: 22, height: 46, background: C.green, verticalAlign: "text-bottom", opacity: caret }} />
          </div>
        </div>
      </div>
      <div style={{
        position: "absolute", top: 900, left: SAFE.x, right: SAFE.x, textAlign: "center",
        color: C.textSoft, fontSize: 36, fontWeight: 700,
        opacity: lit(f, aNote, 10), transform: `translateY(${interpolate(f - aNote, [0, 10], [22, 0], clamp)}px)`,
      }}>
        skills + công cụ cho <span style={{ color: C.blue }}>agent lập trình AI</span> mod game PC bạn sở hữu
      </div>
      <div style={{ position: "absolute", top: 1040 }}><StatCard at={aStat} stars={4354} fork={385} meta="MIT · tạo 30/09" /></div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S03 — REPO 1 caveat: 10-step agent loop + FAL key lock + rules
// ---------------------------------------------------------------------------
const S03: React.FC = () => {
  const f = useCurrentFrame();
  const aLock = frameOf("s03", "Ây-Pi-Ai key");
  const aLoop = frameOf("s03", "mười bước");
  const aField = frameOf("s03", "phiu nốt");
  const aRule = frameOf("s03", "chỉ game bạn sở hữu");
  const prog = interpolate(f - aLoop, [0, 96], [0, 10], clamp); // steps lit around the circle
  const cx = 400, cy = 280, R = 175;
  const nodeAt = (i: number) => {
    const ang = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    return [cx + R * Math.cos(ang), cy + R * Math.sin(ang)] as const;
  };
  const [fx, fy] = nodeAt(9); // node 10 sits top-left; callout flies to the right
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Banner at={2} />
      {/* FAL API key lock chip */}
      <div style={{ position: "absolute", top: 462, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: lit(f, aLock), ...(f >= aLock ? glow("rgba(248,81,73,0.35)", 26) : {}), borderRadius: 16 }}>
        <Chip color={C.red} fill={C.redFill} style={{ fontSize: 36, fontWeight: 800, gap: 14 }}>
          <Padlock color={C.red} size={40} /> cần FAL API key <span style={{ color: C.muted, fontWeight: 600 }}>(sinh ảnh / âm thanh)</span>
        </Chip>
      </div>
      {/* 10-step loop */}
      <svg width={920} height={560} viewBox="0 0 920 560" style={{ position: "absolute", left: SAFE.x, top: 520 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.border} strokeWidth={4}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, prog / 10)}
          opacity={lit(f, aLoop)} />
        {Array.from({ length: 10 }, (_, i) => {
          const [x, y] = nodeAt(i); const on = prog >= i + 1;
          const isField = i === 9;
          const pulse = isField && f >= aField ? 1 + 0.1 * Math.abs(Math.sin(((f - aField) / 26) * Math.PI)) : 1;
          return (
            <g key={i} transform={`translate(${x},${y}) scale(${pulse})`} opacity={on ? 1 : 0.22}>
              <circle r={34} fill={isField && on ? C.greenFill : C.surface} stroke={isField ? C.green : on ? C.blue : C.border} strokeWidth={isField ? 4 : 3} />
              <text y={10} textAnchor="middle" fill={isField ? C.green : on ? C.text : C.muted} fontSize={30} fontWeight={800} fontFamily={FONT}>{i + 1}</text>
            </g>
          );
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" fill={C.text} fontSize={38} fontWeight={900} fontFamily={FONT} opacity={lit(f, aLoop)}>
          vòng lặp agent
        </text>
        <text x={cx} y={cy + 42} textAnchor="middle" fill={C.muted} fontSize={30} fontWeight={700} fontFamily={FONT} opacity={lit(f, aLoop)}>
          10 bước
        </text>
        {/* field note callout */}
        <g opacity={lit(f, aField)}>
          <line x1={fx} y1={fy} x2={640} y2={86} stroke={C.green} strokeWidth={3} strokeDasharray="8 6" />
          <rect x={560} y={40} width={330} height={100} rx={14} fill={C.greenFill} stroke={C.green} strokeWidth={2.5} />
          <text x={725} y={82} textAnchor="middle" fill={C.green} fontSize={28} fontWeight={800} fontFamily={FONT}>10. field note</text>
          <text x={725} y={120} textAnchor="middle" fill={C.textSoft} fontSize={24} fontWeight={600} fontFamily={FONT}>cho agent kế tiếp</text>
        </g>
      </svg>
      {/* rules row */}
      <div style={{ position: "absolute", top: 1108, left: SAFE.x, right: SAFE.x, display: "flex", gap: 18, justifyContent: "center" }}>
        {[{ t: "chỉ game bạn sở hữu", c: C.green, at: aRule }, { t: "không file game, không gian lận", c: C.red, at: aRule + 7 }].map((r, i) => (
          <div key={i} style={{ opacity: lit(f, r.at), transform: `translateY(${interpolate(f - r.at, [0, 10], [20, 0], clamp)}px)` }}>
            <Chip color={r.c} fill={r.c === C.green ? C.greenFill : C.redFill} style={{ fontSize: 27 }}>
              <span style={{ fontSize: 32, fontWeight: 900 }}>✓</span> {r.t}
            </Chip>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S04 — REPO 2 AIHOT: vertical pipeline + heat cluster
// ---------------------------------------------------------------------------
const S04: React.FC = () => {
  const f = useCurrentFrame();
  const aChip = frameOf("s04", "Ri-po hai");
  const aLLM = frameOf("s04", "eo eo em sàng lọc tin");
  const aScore = frameOf("s04", "chấm điểm độc lập");
  const aHeat = frameOf("s04", "cụm theo độ nóng");
  const aStat = frameOf("s04", "sáu nghìn một trăm bốn mươi lăm");
  const nodes = [
    { label: "nguồn tin", at: aLLM, icon: "◉" },
    { label: "LLM sàng lọc", at: aLLM, icon: "▽" },
    { label: "chấm điểm độc lập", at: aScore, icon: "★" },
    { label: "gom theo độ nóng", at: aHeat, icon: "▲" },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <RepoChip at={aChip} repo="github.com/KKKKhazix/AIHOT" />
      <div style={{ position: "absolute", top: 410, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {nodes.map((n, i) => {
          const on = f >= n.at;
          const isHeat = i === 3;
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <div style={{
                  width: 5, height: 34, background: f >= nodes[i].at ? C.blue : C.border,
                  boxShadow: f >= nodes[i].at ? `0 0 12px ${C.blue}` : "none",
                }} />
              ) : null}
              <div style={{
                width: 640, padding: "20px 30px", borderRadius: 16,
                background: on ? (isHeat ? "linear-gradient(90deg, rgba(248,81,73,0.20), rgba(210,153,34,0.20))" : C.blueFill) : C.surface,
                border: `2px solid ${on ? (isHeat ? C.red : C.blue) : C.border}`,
                display: "flex", alignItems: "center", gap: 20, justifyContent: "center",
                opacity: on ? 1 : 0.35, transform: `scale(${on ? 1 : 0.94})`,
                transition: "none",
                ...(on && !isHeat ? glow("rgba(88,166,255,0.25)", 20) : {}), ...(on && isHeat ? glow("rgba(248,81,73,0.3)", 24) : {}),
              }}>
                <span style={{ color: on ? (isHeat ? C.red : C.blue) : C.muted, fontSize: 34, fontWeight: 900 }}>{n.icon}</span>
                <span style={{ color: C.text, fontSize: 38, fontWeight: 800 }}>{n.label}</span>
                {isHeat && on ? (
                  <span style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                    {[0, 1, 2].map((k) => (
                      <span key={k} style={{ width: 30, height: 40, borderRadius: 6, background: `rgba(248,81,73,${0.5 + 0.16 * k})`, border: `1.5px solid ${C.red}`, opacity: lit(f, aHeat + k * 5) }} />
                    ))}
                  </span>
                ) : null}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1060 }}><StatCard at={aStat} stars={6145} fork={1542} meta="MIT · tạo 28/09" /></div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S05 — REPO 2 caveat: designer quote + 18 nguồn mẫu + opposing blocks
// ---------------------------------------------------------------------------
const S05: React.FC = () => {
  const f = useCurrentFrame();
  const aQuote = frameOf("s05", "di-dai-nơ");
  const aUnder = frameOf("s05", "không đọc được code");
  const a18 = frameOf("s05", "mười tám nguồn");
  const aReal = frameOf("s05", "nguồn tin thật");
  const uw = interpolate(f - aUnder, [0, 14], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Banner at={2} />
      {/* designer quote card */}
      <div style={{ position: "absolute", top: 452, left: SAFE.x, right: SAFE.x, opacity: lit(f, aQuote, 10), transform: `translateY(${interpolate(f - aQuote, [0, 10], [26, 0], clamp)}px)` }}>
        <Card style={{ padding: "34px 40px", position: "relative" }}>
          <span style={{ position: "absolute", top: 6, left: 26, color: C.blue, fontSize: 110, fontWeight: 900, lineHeight: 1, opacity: 0.5 }}>“</span>
          <div style={{ marginLeft: 70, marginTop: 30 }}>
            <div style={{ position: "relative", display: "inline-block", color: C.text, fontSize: 52, fontWeight: 800, lineHeight: 1.25 }}>
              gần như không đọc được code
              <div style={{ position: "absolute", left: 0, right: 0, bottom: -6, height: 8, background: C.blue, borderRadius: 4, transformOrigin: "left", transform: `scaleX(${uw})` }} />
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 14, alignItems: "center" }}>
              <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 28 }}>designer + AI</Chip>
              <span style={{ color: C.muted, fontSize: 27, fontWeight: 600 }}>viết lại cả codebase cùng AI</span>
            </div>
          </div>
        </Card>
      </div>
      {/* 18 nguồn mẫu + red strike */}
      <div style={{ position: "absolute", top: 860, left: SAFE.x, right: SAFE.x, opacity: lit(f, a18, 10) }}>
        <Card style={{ padding: "24px 34px", display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ color: C.amber, fontSize: 72, fontWeight: 900, lineHeight: 1 }}>
            <CountUp at={a18} to={18} frames={26} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <div style={{ color: C.text, fontSize: 36, fontWeight: 800 }}>nguồn mẫu</div>
            <div style={{ position: "relative", display: "inline-block", color: C.muted, fontSize: 30, fontWeight: 700, alignSelf: "flex-start" }}>
              không kèm nguồn tin thật
              <div style={{ position: "absolute", left: -6, right: -6, top: "50%", height: 5, background: C.red, borderRadius: 3, transform: `scaleX(${interpolate(f - aReal, [0, 10], [0, 1], clamp)})` }} />
            </div>
          </div>
        </Card>
      </div>
      {/* opposing blocks */}
      <div style={{ position: "absolute", top: 1042, left: SAFE.x, right: SAFE.x, display: "flex", gap: 20, opacity: lit(f, aReal, 12), transform: `translateX(${interpolate(f - aReal, [0, 12], [-40, 0], clamp)}px)` }}>
        <Card style={{ flex: 1, padding: "22px 20px", textAlign: "center", border: `2px solid ${C.green}`, color: C.green, fontSize: 31, fontWeight: 800, ...(f >= aReal ? glow("rgba(63,185,80,0.25)", 18) : {}) }}>
          framework<br />mã nguồn mở
        </Card>
        <Card style={{ flex: 1, padding: "22px 20px", textAlign: "center", border: `2px dashed ${C.border}`, color: C.muted, fontSize: 31, fontWeight: 700 }}>
          trang tin<br />đang chạy
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S06 — REPO 3 Jeff: gate diagram + watermark + 94,6/86,6 bars
// ---------------------------------------------------------------------------
const S06: React.FC = () => {
  const f = useCurrentFrame();
  const aChip = frameOf("s06", "Dép");
  const aJeff = frameOf("s06", "không phẩy tám tỷ");
  const aGate = frameOf("s06", "ra quyết định nhanh");
  const aWm = frameOf("s06", "benchmark của chính tác giả");
  const a94 = frameOf("s06", "chín mươi tư phẩy sáu");
  const a86 = frameOf("s06", "tám mươi sáu phẩy sáu");
  const aStat = frameOfEnd("s06", "mô hình lớn tự quyết", 1, 9);
  const bar94 = interpolate(f - a94, [0, 40], [0, 94.6], clamp);
  const bar86 = interpolate(f - a86, [0, 40], [0, 86.6], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <RepoChip at={aChip} repo="github.com/firelex/jeff" />
      {/* gate diagram */}
      <div style={{ position: "absolute", top: 400, left: SAFE.x, right: SAFE.x, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
        <div style={{
          width: 300, padding: "22px 18px", borderRadius: 16, textAlign: "center",
          background: C.surface, border: `2px solid ${f >= aJeff ? C.green : C.border}`,
          opacity: f >= aJeff ? 1 : 0.3, ...(f >= aJeff ? glow("rgba(63,185,80,0.3)", 22) : {}),
        }}>
          <div style={{ color: C.green, fontSize: 40, fontWeight: 900 }}>Jeff</div>
          <div style={{ color: C.textSoft, fontSize: 28, fontWeight: 700 }}>0,8 tỷ tham số</div>
        </div>
        <div style={{
          width: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          opacity: f >= aGate ? 1 : 0.3, ...(f >= aGate ? glow("rgba(88,166,255,0.35)", 20) : {}), borderRadius: 14,
        }}>
          <svg width={64} height={64} viewBox="0 0 64 64">
            <path d="M 32 6 L 58 20 V 46 L 32 60 L 6 46 V 20 Z" fill={f >= aGate ? C.blueFill : "none"} stroke={f >= aGate ? C.blue : C.border} strokeWidth={4} />
            <text x={32} y={40} textAnchor="middle" fontSize={26} fill={f >= aGate ? C.blue : C.muted} fontWeight={900} fontFamily={FONT}>⇄</text>
          </svg>
          <div style={{ color: f >= aGate ? C.blue : C.muted, fontSize: 23, fontWeight: 800, textAlign: "center", lineHeight: 1.2 }}>ra quyết định nhanh</div>
        </div>
        <div style={{
          width: 320, padding: "22px 18px", borderRadius: 16, textAlign: "center",
          background: C.surface, border: `2px dashed ${C.border}`, color: C.muted, opacity: 0.8,
        }}>
          <div style={{ fontSize: 34, fontWeight: 800 }}>mô hình lớn</div>
          <div style={{ fontSize: 26, fontWeight: 600 }}>chậm · đặt sau cổng</div>
        </div>
      </div>
      <div style={{
        position: "absolute", top: 596, left: SAFE.x, right: SAFE.x, textAlign: "center",
        color: C.textSoft, fontSize: 30, fontWeight: 700, opacity: lit(f, aGate, 10),
      }}>Jeff đặt <span style={{ color: C.blue, fontWeight: 900 }}>trước</span> mô hình lớn</div>
      {/* bars + watermark */}
      <Card style={{ position: "absolute", left: SAFE.x, right: SAFE.x, top: 680, height: 400, padding: 30 }}>
        <div style={{ position: "relative" }}>
          <div style={{ color: C.muted, fontSize: 28, fontWeight: 800, letterSpacing: 1, marginBottom: 6 }}>CHÍNH XÁC THEO BENCHMARK</div>
          {[
            { name: "Jeff", target: 94.6, w: bar94, at: a94, color: C.green, fill: "rgba(63,185,80,0.55)" },
            { name: "mô hình lớn tự quyết", target: 86.6, w: bar86, at: a86, color: C.blue, fill: "rgba(88,166,255,0.45)" },
          ].map((b, i) => (
            <div key={i} style={{ marginBottom: 26 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: C.textSoft, fontSize: 29, fontWeight: 700, marginBottom: 8 }}>
                <span>{b.name}</span>
                <span style={{ color: b.color, fontWeight: 900 }}>
                  <CountUp at={b.at} to={b.target} frames={40} decimals={1} />%
                </span>
              </div>
              <div style={{ position: "relative", height: 52, background: "rgba(139,148,158,0.08)", borderRadius: 10 }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${b.w}%`, background: b.fill, border: `2px solid ${b.color}`, borderRadius: 10 }} />
              </div>
            </div>
          ))}
          {/* self-published watermark — BEFORE any number shows */}
          <div style={{
            position: "absolute", top: 118, left: 0, right: 0, textAlign: "center", pointerEvents: "none",
            opacity: 0.9 * lit(f, aWm, 8), transform: `rotate(-6deg)`,
          }}>
            <span style={{
              display: "inline-block", border: `3px solid ${C.red}`, color: C.red,
              padding: "10px 30px", borderRadius: 12, fontSize: 40, fontWeight: 900, letterSpacing: 2,
              background: "rgba(1,4,9,0.55)", boxShadow: `0 0 26px rgba(248,81,73,0.35)`,
            }}>benchmark của chính tác giả</span>
          </div>
        </div>
      </Card>
      <div style={{ position: "absolute", top: 1116 }}><StatCard at={aStat} stars={1405} fork={68} meta="MIT · tạo 28/09" /></div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S07 — REPO 3 caveat: clock pair ×35 + 47%↔14% double underline (HERO)
// ---------------------------------------------------------------------------
const Clock: React.FC<{ size: number; color: string; label: string; at: number; speed: number; running: boolean }> = ({ size, color, label, at, speed, running }) => {
  const f = useCurrentFrame();
  const ang = running ? (f / 30) * speed : 0;
  const R = size / 2 - 16;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="rgba(1,4,9,0.6)" stroke={color} strokeWidth={5} opacity={running ? 1 : 0.35} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={size / 2 + (R - 12) * Math.cos(a)} y1={size / 2 + (R - 12) * Math.sin(a)} x2={size / 2 + (R - 3) * Math.cos(a)} y2={size / 2 + (R - 3) * Math.sin(a)} stroke={color} strokeWidth={3} opacity={running ? 0.8 : 0.25} />;
        })}
        <line
          x1={size / 2} y1={size / 2} x2={size / 2} y2={size / 2 - (R - 26)}
          stroke={color} strokeWidth={6} strokeLinecap="round"
          transform={`rotate(${ang} ${size / 2} ${size / 2})`}
        />
        <circle cx={size / 2} cy={size / 2} r={7} fill={color} />
      </svg>
      <div style={{ color, fontSize: 40, fontWeight: 900, fontFamily: FONT }}>{label}</div>
    </div>
  );
};

const S07: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a25 = frameOf("s07", "không phẩy hai lăm giây");
  const a35 = frameOf("s07", "ba mươi lăm lần");
  const a81 = frameOf("s07", "tám phẩy một giây");
  const a47 = frameOf("s07", "bốn mươi bảy phần trăm");
  const aBut = frameOf("s07", "nhưng");
  const a14 = frameOf("s07", "mười bốn phần trăm");
  const ring = (at: number): React.CSSProperties => ({
    position: "relative", display: "inline-block", padding: "6px 22px",
    borderRadius: 999, border: `4px solid ${C.red}`,
    opacity: lit(f, at, 6), ...(f >= at ? glow("rgba(248,81,73,0.4)", 22) : {}),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Banner at={2} />
      {/* clock pair */}
      <div style={{ position: "absolute", top: 452, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", alignItems: "center", gap: 34 }}>
        <div style={{ opacity: lit(f, a25, 8) }}>
          <Clock size={210} color={C.green} label="0,25 giây" at={a25} speed={2160} running={f >= a25} />
        </div>
        <div style={{ ...slam(a35, f, fps, 1.7), ...(f >= a35 ? glow("rgba(210,153,34,0.45)", 26) : {}), borderRadius: 16 }}>
          <div style={{ background: C.amberFill, border: `3px solid ${C.amber}`, color: C.amber, borderRadius: 16, padding: "14px 22px", fontSize: 52, fontWeight: 900 }}>×35</div>
        </div>
        <div style={{ opacity: lit(f, a81, 8) }}>
          <Clock size={280} color={C.red} label="8,1 giây" at={a81} speed={40} running={f >= a81} />
        </div>
      </div>
      {/* 47% ↔ nhưng ↔ 14% double underline */}
      <div style={{ position: "absolute", top: 1000, left: SAFE.x, right: SAFE.x }}>
        <Card style={{ padding: "36px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: lit(f, a47, 8) }}>
            <div style={{ ...ring(a47), color: C.green, fontSize: 64, fontWeight: 900 }}>47%</div>
            <div style={{ color: C.textSoft, fontSize: 28, fontWeight: 700 }}>mỗi tác vụ</div>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: 14 }, (_, i) => (
                <span key={i} style={{ width: 5, height: 18, background: C.green, borderRadius: 2 }} />
              ))}
            </div>
          </div>
          <div style={{
            color: f >= aBut ? C.amber : C.muted, fontSize: 46, fontWeight: 900,
            textShadow: f >= aBut ? `0 0 22px rgba(210,153,34,0.55)` : "none",
          }}>nhưng</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: lit(f, a14, 8) }}>
            <div style={{ ...ring(a14), color: C.red, fontSize: 64, fontWeight: 900 }}>14%</div>
            <div style={{ color: C.textSoft, fontSize: 28, fontWeight: 700 }}>tổng thời gian</div>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} style={{ width: 5, height: 18, background: C.red, borderRadius: 2 }} />
              ))}
            </div>
          </div>
        </Card>
        <div style={{ marginTop: 18, textAlign: "center", opacity: lit(f, a47, 14) }}>
          <span style={{ color: C.muted, fontSize: 26, fontWeight: 700, border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: "8px 18px", display: "inline-block" }}>Jeff-Code · benchmark của chính tác giả</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S08 — REPO 4 Muse gadget SDK: concept board + stat
// ---------------------------------------------------------------------------
const S08: React.FC = () => {
  const f = useCurrentFrame();
  const aImg = frameOf("s08", "Miu-dơ");
  const aFw = frameOf("s08", "ét đi cây kèm firmware");
  const aTag = frameOf("s08", "gadget tự chế");
  const aStat = frameOf("s08", "một nghìn năm trăm mười");
  const zoom = interpolate(f, [aImg, SF("s08")], [1.0, 1.03], clamp);
  const tagPulse = f >= aTag ? 1 + 0.06 * Math.abs(Math.sin(((f - aTag) / 24) * Math.PI)) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <RepoChip at={aImg} repo="github.com/facebookincubator/muse-gadget-sdk" />
      <div style={{
        position: "absolute", top: 400, left: SAFE.x, right: SAFE.x, height: 620,
        borderRadius: 20, overflow: "hidden", border: `1.5px solid ${C.border}`,
        opacity: lit(f, aImg, 10),
      }}>
        <Img src={staticFile("gh5-20261006/img_s08.png")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, background: "linear-gradient(180deg, transparent, rgba(1,4,9,0.9))" }} />
        <div style={{ position: "absolute", top: 18, right: 18 }}>
          <Chip color={C.muted} fill="rgba(1,4,9,0.78)" style={{ fontSize: 24 }}>Hình minh họa — concept, không phải ảnh thật của Meta</Chip>
        </div>
        <div style={{ position: "absolute", bottom: 20, left: 20, transform: `scale(${tagPulse})` }}>
          <Chip color={C.amber} fill="rgba(210,153,34,0.16)" style={{ fontSize: 30, fontWeight: 800, ...(f >= aTag ? glow("rgba(210,153,34,0.4)", 20) : {}) }}>
            thiết bị tự chế
          </Chip>
        </div>
      </div>
      <div style={{
        position: "absolute", top: 1058, left: SAFE.x, right: SAFE.x, textAlign: "center",
        color: C.textSoft, fontSize: 34, fontWeight: 700,
        opacity: lit(f, aFw, 10), transform: `translateY(${interpolate(f - aFw, [0, 10], [22, 0], clamp)}px)`,
      }}>
        <span style={{ color: C.blue }}>SDK kèm firmware</span> — lập trình trên board như Raspberry Pi
      </div>
      <div style={{ position: "absolute", top: 1150 }}><StatCard at={aStat} stars={1510} fork={292} meta="Apache-2.0 · tạo 02/10" /></div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S09 — REPO 4 caveat: SDK token gate + hacker risk ticks
// ---------------------------------------------------------------------------
const S09: React.FC = () => {
  const f = useCurrentFrame();
  const aToken = frameOf("s09", "ét đi cây tốc cần");
  const aEach = frameOf("s09", "từng gadget");
  const aQuote = frameOf("s09", "hách cơ làm cho hách cơ");
  const aT1 = frameOf("s09", "board hỏng");
  const aT2 = frameOf("s09", "mất bảo hành");
  const aT3 = frameOf("s09", "sụt nguồn");
  const aT4 = frameOf("s09", "phá sản");
  const gateOn = f >= aToken;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Banner at={2} />
      {/* pairing diagram */}
      <div style={{ position: "absolute", top: 440, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 90, alignItems: "flex-end" }}>
          <div style={{ textAlign: "center" }}>
            <Card style={{ width: 240, padding: "18px 14px", color: C.text, fontSize: 32, fontWeight: 800, textAlign: "center" }}>board</Card>
            <div style={{ marginTop: 6, opacity: lit(f, aEach, 8), display: "flex", justifyContent: "center", gap: 8 }}>
              {[0, 1, 2].map((k) => (
                <span key={k} style={{ width: 26, height: 34, borderRadius: 5, border: `2px solid ${C.red}`, background: C.redFill, opacity: 0.4 + 0.6 * Math.abs(Math.sin(((f - aEach - k * 4) / 18) * Math.PI)) }} />
              ))}
            </div>
          </div>
          <Card style={{ width: 260, padding: "18px 14px", color: C.text, fontSize: 30, fontWeight: 800, textAlign: "center" }}>app Muse<br /><span style={{ fontSize: 24, color: C.muted }}>iOS / Android</span></Card>
        </div>
        <svg width={920} height={96} viewBox="0 0 920 96" style={{ marginTop: 4 }}>
          <path d="M 200 6 C 200 66, 380 66, 440 66" fill="none" stroke={gateOn ? C.red : C.border} strokeWidth={5} opacity={gateOn ? 1 : 0.4} />
          <path d="M 720 6 C 720 66, 540 66, 480 66" fill="none" stroke={gateOn ? C.red : C.border} strokeWidth={5} opacity={gateOn ? 1 : 0.4} />
          <circle cx={460} cy={66} r={8} fill={gateOn ? C.red : C.border} />
        </svg>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 16, marginTop: 2,
          border: `2.5px solid ${gateOn ? C.red : C.border}`, background: gateOn ? C.redFill : C.surface,
          borderRadius: 16, padding: "14px 28px",
          color: gateOn ? C.red : C.muted, fontSize: 34, fontWeight: 900,
          ...(gateOn ? glow("rgba(248,81,73,0.4)", 26) : {}),
          opacity: lit(f, aToken, 6),
        }}>
          <Padlock color={gateOn ? C.red : C.muted} size={42} /> SDK token từng gadget
        </div>
      </div>
      {/* risk quote + 4 ticks */}
      <div style={{ position: "absolute", top: 890, left: SAFE.x, right: SAFE.x, opacity: lit(f, aQuote, 10) }}>
        <Card style={{ padding: "28px 34px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <span style={{ color: C.text, fontSize: 38, fontWeight: 900, fontStyle: "italic" }}>“do hacker làm cho hacker”</span>
            <Chip color={C.muted} fill="rgba(255,255,255,0.04)" style={{ fontSize: 24 }}>README tự cảnh báo</Chip>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { t: "board hỏng", at: aT1 }, { t: "mất bảo hành", at: aT2 },
              { t: "sụt nguồn", at: aT3 }, { t: "phá sản", at: aT4 },
            ].map((r, i) => {
              const on = f >= r.at;
              const shake = i === 3 && on && f - aT4 < 12 ? Math.sin((f - aT4) * 2.4) * 4 : 0;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  border: `2px solid ${on ? C.red : C.border}`, borderRadius: 12, padding: "12px 18px",
                  opacity: on ? 1 : 0.28, background: on ? C.redFill : "transparent",
                  transform: `translateX(${shake}px)`,
                }}>
                  <span style={{ color: on ? C.red : C.muted, fontSize: 30, fontWeight: 900 }}>✓</span>
                  <span style={{ color: on ? C.text : C.muted, fontSize: 30, fontWeight: 800 }}>{r.t}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S10 — REPO 5 RE:Dox: nested REX ⊃ RE:Dox + KHÔNG PHẢI GAME ENGINE badge
// ---------------------------------------------------------------------------
const S10: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aChip = frameOf("s10", "Ri-po năm");
  const aDox = frameOf("s10", "Rê Đốc");
  const aLib = frameOf("s10", "thư viện dữ liệu");
  const aBadge = frameOf("s10", "không phải game engine");
  const aRex = frameOf("s10", "Rếch");
  const aStat = frameOf("s10", "một nghìn một trăm mười ba");
  const uw = interpolate(f - aLib, [0, 14], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <RepoChip at={aChip} repo="github.com/CAPCOM-TD-OSS/REDox" />
      {/* outer REX frame draws at 'REX' */}
      <div style={{
        position: "absolute", top: 402, left: SAFE.x + 40, right: SAFE.x + 40, height: 470,
        border: `3px dashed ${f >= aRex ? C.blue : C.border}`, borderRadius: 26,
        opacity: f >= aRex ? 1 : 0.25, padding: 26,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: f >= aRex ? 1 : 0.25 }}>
          <span style={{ color: f >= aRex ? C.blue : C.muted, fontSize: 34, fontWeight: 900 }}>CAPCOM REX</span>
          <span style={{ color: C.muted, fontSize: 27, fontWeight: 700 }}>— công nghệ</span>
        </div>
        {/* inner RE:Dox block — visible from 'RE:Dox' */}
        <div style={{
          marginTop: 20, position: "relative",
          border: `2.5px solid ${f >= aDox ? C.green : C.border}`, borderRadius: 20,
          background: f >= aDox ? C.greenFill : C.surface, padding: "26px 28px",
          opacity: f >= aDox ? 1 : 0.3, ...(f >= aDox ? glow("rgba(63,185,80,0.28)", 22) : {}),
        }}>
          <div style={{ color: C.text, fontSize: 44, fontWeight: 900 }}>RE:Dox</div>
          <div style={{ position: "relative", display: "inline-block", color: C.textSoft, fontSize: 32, fontWeight: 800, marginTop: 4 }}>
            thư viện dữ liệu .NET
            <div style={{ position: "absolute", left: 0, right: 0, bottom: -4, height: 6, background: C.green, borderRadius: 3, transformOrigin: "left", transform: `scaleX(${uw})` }} />
          </div>
          {/* correction badge */}
          <div style={{ position: "absolute", top: -34, right: -18, ...slam(aBadge, f, fps, 1.6) }}>
            <div style={{
              border: `3.5px solid ${C.red}`, color: C.red, background: "rgba(1,4,9,0.8)",
              borderRadius: 12, padding: "10px 22px", fontSize: 33, fontWeight: 900, letterSpacing: 1,
              transform: "rotate(4deg)", ...(f >= aBadge ? glow("rgba(248,81,73,0.5)", 30) : {}),
            }}>KHÔNG PHẢI GAME ENGINE</div>
          </div>
        </div>
        {/* engine arrow */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, marginTop: 22, justifyContent: "center",
          opacity: lit(f, aRex, 10),
        }}>
          <span style={{ color: C.blue, fontSize: 40, fontWeight: 900 }}>↓</span>
          <span style={{ color: C.textSoft, fontSize: 30, fontWeight: 800 }}>game engine thế hệ mới</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 940 }}><StatCard at={aStat} stars={1113} fork={29} meta="Apache-2.0 · tạo 30/09" /></div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S11 — REPO 5 caveat: self-measured triple card + README snippet
// ---------------------------------------------------------------------------
const S11: React.FC = () => {
  const f = useCurrentFrame();
  const aWm = frameOf("s11", "mọi con số đều tự đo");
  const aSys = frameOf("s11", "Sít-tem Tếch Giây-sần");
  const a18 = frameOf("s11", "một phẩy tám lần");
  const a28 = frameOf("s11", "hai phẩy tám lần");
  const a853 = frameOf("s11", "tám phẩy năm mươi ba");
  const a256 = frameOf("s11", "hai phẩy năm mươi sáu mê-ga-bai");
  const aSnip = frameOfEnd("s11", "mê-ga-bai", 2, 6);
  const shrunk = f >= a256;
  const barW = shrunk ? interpolate(f - a256, [0, 30], [100, (2.56 / 8.53) * 100], clamp) : interpolate(f - a853, [0, 24], [0, 100], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Banner at={2} />
      {/* watermark over the whole number zone */}
      <div style={{
        position: "absolute", top: 610, left: SAFE.x, right: SAFE.x, textAlign: "center", zIndex: 6, pointerEvents: "none",
        opacity: 0.85 * lit(f, aWm, 8), transform: "rotate(-5deg)",
      }}>
        <span style={{
          display: "inline-block", border: `3px solid ${C.red}`, color: C.red,
          padding: "8px 26px", borderRadius: 12, fontSize: 36, fontWeight: 900, letterSpacing: 2,
          background: "rgba(1,4,9,0.5)", boxShadow: `0 0 22px rgba(248,81,73,0.3)`,
        }}>benchmark tự công bố</span>
      </div>
      <div style={{ position: "absolute", top: 470, left: SAFE.x, right: SAFE.x, display: "flex", justifyContent: "center", opacity: lit(f, aSys, 10), transform: `translateX(${interpolate(f - aSys, [0, 12], [-40, 0], clamp)}px)` }}>
        <Chip color={C.blue} fill={C.blueFill} style={{ fontSize: 31 }}>so với System.Text.Json</Chip>
      </div>
      {/* triple card */}
      <div style={{ position: "absolute", top: 560, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ opacity: lit(f, a18, 8), display: "flex" }}>
          <Card style={{ flex: 1, padding: "20px 30px", display: "flex", alignItems: "baseline", gap: 18, ...(f >= a18 ? glow("rgba(63,185,80,0.22)", 18) : {}) }}>
            <span style={{ color: C.green, fontSize: 62, fontWeight: 900 }}>~<CountUp at={a18} to={1.8} frames={30} decimals={1} /> lần</span>
            <span style={{ color: C.textSoft, fontSize: 32, fontWeight: 700 }}>tuần tự</span>
          </Card>
        </div>
        <div style={{ opacity: lit(f, a28, 8), display: "flex" }}>
          <Card style={{ flex: 1, padding: "20px 30px", display: "flex", alignItems: "baseline", gap: 18, ...(f >= a28 ? glow("rgba(63,185,80,0.22)", 18) : {}) }}>
            <span style={{ color: C.green, fontSize: 62, fontWeight: 900 }}>~<CountUp at={a28} to={2.8} frames={30} decimals={1} /> lần</span>
            <span style={{ color: C.textSoft, fontSize: 32, fontWeight: 700 }}>song song</span>
          </Card>
        </div>
        {/* allocation bar 8,53 MB → 2,56 MB */}
        <div style={{ opacity: lit(f, a853, 8) }}>
          <Card style={{ padding: "20px 30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: C.textSoft, fontSize: 30, fontWeight: 700 }}>cấp phát</span>
              <span style={{ fontSize: 34, fontWeight: 900, color: shrunk ? C.green : C.red }}>
                {shrunk ? (
                  <><CountUp at={a853} to={8.53} frames={24} decimals={2} /> MB <span style={{ color: C.textSoft }}>→</span> <CountUp at={a256} to={2.56} frames={26} decimals={2} /> MB</>
                ) : (
                  <><CountUp at={a853} to={8.53} frames={24} decimals={2} /> MB</>
                )}
              </span>
            </div>
            <div style={{ position: "relative", height: 46, background: "rgba(139,148,158,0.08)", borderRadius: 10 }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: `${barW}%`,
                background: shrunk ? "rgba(63,185,80,0.5)" : "rgba(248,81,73,0.5)",
                border: `2px solid ${shrunk ? C.green : C.red}`, borderRadius: 10,
                ...(f >= a256 ? glow("rgba(63,185,80,0.3)", 16) : {}),
              }} />
            </div>
          </Card>
        </div>
      </div>
      {/* README snippet — flashes at the end */}
      <div style={{
        position: "absolute", top: 1090, left: SAFE.x, right: SAFE.x,
        opacity: lit(f, aSnip, 5), transform: `translateY(${interpolate(f - aSnip, [0, 8], [26, 0], clamp)}px)`,
      }}>
        <Card style={{ padding: "20px 28px", position: "relative", background: C.bgDeep }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ color: C.muted, fontFamily: MONO, fontSize: 24 }}>README · ví dụ</span>
            <Chip color={C.muted} fill="rgba(255,255,255,0.04)" style={{ fontSize: 22 }}>ví dụ trong README</Chip>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 33, color: C.text, fontWeight: 600 }}>
            <span style={{ color: C.blue }}>Name</span> = <span style={{ color: C.amber }}>"Leon"</span> + <span style={{ color: C.green }}>Handgun</span> + <span style={{ color: C.green }}>Green Herb</span>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S12 — SO WHAT: 5-row summary table
// ---------------------------------------------------------------------------
const S12: React.FC = () => {
  const f = useCurrentFrame();
  const aTitle = frameOf("s12", "demo rất sáng");
  const rows = [
    { n: "1", repo: "universal-modder", caveat: "cần FAL API key · chỉ game bạn sở hữu", at: frameOf("s12", "Ây-Pi-Ai key") },
    { n: "2", repo: "AIHOT", caveat: "18 nguồn mẫu, không nguồn tin thật", at: frameOf("s12", "nguồn tin mẫu") },
    { n: "3", repo: "Jeff", caveat: "benchmark tự đo", at: frameOf("s12", "benchmark tự đo") },
    { n: "4", repo: "Muse gadget SDK", caveat: "SDK token từng gadget", at: frameOf("s12", "tốc cần từng gadget") },
    { n: "5", repo: "RE:Dox", caveat: "thư viện .NET, không phải game engine", at: frameOf("s12", "game engine") },
  ];
  const aUnder = frameOf("s12", "game engine", 1, 14);
  const underline = interpolate(f - aUnder, [0, 16], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", top: 320, left: SAFE.x, right: SAFE.x, opacity: lit(f, aTitle, 10) }}>
        <div style={{ color: C.text, fontSize: 52, fontWeight: 900, textAlign: "center", lineHeight: 1.15 }}>
          DEMO RẤT SÁNG —<br />ĐIỀU KIỆN NẰM <span style={{ color: C.amber }}>DÒNG CUỐI</span>
        </div>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <Chip color={C.amber} dashed fill="rgba(210,153,34,0.08)" style={{ fontSize: 27 }}>vừa nổ sao ≠ dùng ngay</Chip>
        </div>
      </div>
      <div style={{ position: "absolute", top: 570, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", gap: 14 }}>
        {rows.map((r, i) => {
          const on = f >= r.at;
          return (
            <Card key={i} style={{
              display: "flex", alignItems: "center", gap: 20, padding: "18px 24px",
              opacity: f >= aTitle + 8 ? (on ? 1 : 0.38) : 0.15,
              border: on ? "1.5px solid rgba(63,185,80,0.5)" : `1px solid ${C.border}`,
              transform: `translateX(${interpolate(f - r.at, [0, 10], [-26, 0], clamp)}px)`,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 26, flexShrink: 0,
                border: `2.5px solid ${on ? C.green : C.border}`, color: on ? C.green : C.muted,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900,
              }}>{r.n}</div>
              <div style={{ color: C.text, fontSize: 31, fontWeight: 800, width: 300, flexShrink: 0, fontFamily: MONO }}>{r.repo}</div>
              <div style={{ position: "relative", color: on ? C.red : C.muted, fontSize: 29, fontWeight: 700, flex: 1, lineHeight: 1.2 }}>
                {r.caveat}
                {i === 4 ? (
                  <div style={{ position: "absolute", left: -8, right: -8, bottom: -8, height: 5, background: C.red, borderRadius: 3, transformOrigin: "left", transform: `scaleX(${underline})` }} />
                ) : null}
              </div>
            </Card>
          );
        })}
        {/* red strike across the caveat column */}
        <div style={{ position: "relative", height: 8 }}>
          <div style={{
            position: "absolute", left: 428, right: 10, top: 0, height: 6, background: C.red, borderRadius: 3,
            transformOrigin: "left", transform: `scaleX(${underline})`, boxShadow: `0 0 14px rgba(248,81,73,0.5)`,
          }} />
          <div style={{
            position: "absolute", right: 0, top: -38, color: C.red, fontSize: 26, fontWeight: 900,
            opacity: lit(f, aUnder, 8),
          }}>dòng cuối</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// S13 — OUTRO: soft CTA question
// ---------------------------------------------------------------------------
const S13: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a5 = frameOf("s13", "năm ri-po");
  const aShot = frameOf("s13", "ảnh chụp");
  const aChips = frameOf("s13", "mùng sáu tháng mười");
  const aTry = frameOf("s13", "bạn sẽ thử");
  const repos = ["universal-modder", "AIHOT", "Jeff", "Muse gadget SDK", "RE:Dox"];
  const blink = f >= aShot ? 0.65 + 0.35 * Math.abs(Math.sin(((f - aShot) / 36) * Math.PI)) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", top: 380, left: SAFE.x, right: SAFE.x, textAlign: "center", opacity: lit(f, a5, 10) }}>
        <span style={{ color: C.text, fontSize: 48, fontWeight: 900 }}>
          <span style={{ color: C.blue }}><CountUp at={a5} to={5} frames={18} /></span> repo ·{" "}
          <span style={{ color: C.blue }}>5</span> điều README không khoe
        </span>
      </div>
      {/* big question */}
      <div style={{ position: "absolute", top: 640, left: SAFE.x, right: SAFE.x, textAlign: "center" }}>
        <div style={{
          color: C.text, fontSize: 92, fontWeight: 900, lineHeight: 1.08, letterSpacing: 1,
          ...slam(aTry, f, fps, 1.55), ...(f >= aTry ? { textShadow: "0 0 44px rgba(88,166,255,0.45)" } : {}),
        }}>
          REPO NÀO<br />BẠN SẼ THỬ?
        </div>
        <div style={{
          marginTop: 30, opacity: lit(f, aTry, 14), transform: `translateY(${interpolate(f - aTry, [0, 14], [24, 0], clamp)}px)`,
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 16,
            border: `2px solid ${C.border}`, borderRadius: 999, padding: "16px 30px",
            background: C.surface, color: C.muted, fontSize: 32, fontWeight: 700,
          }}>
            <span style={{ width: 30, height: 30, borderRadius: 15, background: C.blue, display: "inline-block" }} />
            bình luận repo bạn sẽ thử
          </div>
        </div>
      </div>
      {/* footer chips */}
      <div style={{ position: "absolute", top: 1090, left: SAFE.x, right: SAFE.x, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ opacity: lit(f, aShot, 10) }}>
          <Chip color={C.amber} dashed fill="rgba(210,153,34,0.08)" style={{ fontSize: 28, opacity: blink }}>số sao &amp; fork: snapshot 06/10</Chip>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 900 }}>
          {repos.map((r, i) => (
            <div key={r} style={{ opacity: lit(f, aChips + i * 5, 8), transform: `translateY(${interpolate(f - aChips - i * 5, [0, 8], [18, 0], clamp)}px)` }}>
              <Chip color={C.blue} fill="rgba(88,166,255,0.08)" style={{ fontSize: 26, fontFamily: MONO }}>{r}</Chip>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Captions — SRT cues (57, verified), burned at the bottom safe band
// ---------------------------------------------------------------------------
interface Cue { start: number; end: number; text: string }
const CUES = captionsJson as unknown as Cue[];

const Captions: React.FC = () => (
  <>
    {CUES.map((c, i) => {
      const from = Math.round(c.start * 30);
      const dur = Math.max(9, Math.round((c.end - c.start) * 30));
      return (
        <Sequence key={i} from={from} durationInFrames={dur} name={`cap-${i + 1}`}>
          <CaptionCue text={c.text} />
        </Sequence>
      );
    })}
  </>
);

const CaptionCue: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [0, 4, 100000], [0, 1, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1556, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{
        background: "rgba(1,4,9,0.84)", border: "1px solid rgba(240,246,252,0.16)", borderRadius: 18,
        padding: "16px 30px", color: C.text, fontSize: 42, fontWeight: 600, textAlign: "center",
        lineHeight: 1.3, maxWidth: 940, fontFamily: FONT,
      }}>{text}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root composition
// ---------------------------------------------------------------------------
const SCENES: Record<SceneId, React.FC> = {
  s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06, s07: S07,
  s08: S08, s09: S09, s10: S10, s11: S11, s12: S12, s13: S13,
};

const BGM_VOLUME = 0.16;
const BGM_FADE_IN = 30; // 1s
const BGM_FADE_OUT = 60; // 2s

export const Gh520261006: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT }}>
    {SCENE_TIMING.map((t, i) => {
      const Scene = SCENES[t.scene_id];
      const frames = i === SCENE_TIMING.length - 1 ? TOTAL_FRAMES - t.start_frame : t.scene_frames;
      return (
        <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={frames} name={t.scene_id}>
          <Scene />
        </Sequence>
      );
    })}
    <Captions />
    <Audio src={staticFile("gh5-20261006/narration_full.wav")} volume={1} />
    <Audio
      src={staticFile("gh5-20261006/bgm.mp3")}
      volume={(fr) =>
        BGM_VOLUME *
        Math.min(1, fr / BGM_FADE_IN) *
        Math.min(1, Math.max(0, (TOTAL_FRAMES - fr) / BGM_FADE_OUT))
      }
    />
  </AbsoluteFill>
);
