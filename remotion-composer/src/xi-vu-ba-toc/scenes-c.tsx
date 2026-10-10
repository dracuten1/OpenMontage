// EP.06 xi-vu-ba-toc — scenes group C (sc023–sc033, sections s12–s16).
// Speech-lock: A(anchor) trả FRACTION của scene (common.tsx useA) — feed thẳng vào startFrac.
import * as React from "react";
import { useCurrentFrame } from "remotion";
import {
  Paper,
  Reveal,
  SpringPop,
  InkDraw,
  circleD,
  SourceTag,
  Chip,
  SceneTitle,
  InkImageScene,
  LegendFrame,
  WipeInk,
  useA,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

/* ---------- helpers (cục bộ, không đụng common) ---------- */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (p: number) => p * p * (3 - 2 * p);
const prog = (frame: number, at: number, dur: number) => smooth(clamp01((frame - at) / dur));

const ROOT: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  fontFamily: FONT.body,
  color: C.cream,
  overflow: "hidden",
};

const DARK: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(ellipse 1200px 800px at 50% 42%, rgba(64,48,28,0.34), rgba(16,11,7,0.93) 78%)",
};

// Bóng người ink đơn giản
const Fig: React.FC<{ color: string; h?: number }> = ({ color, h = 260 }) => (
  <svg width={(120 * h) / 260} height={h} viewBox="0 0 120 260" style={{ overflow: "visible" }}>
    <circle cx={60} cy={36} r={25} fill={color} />
    <path d="M60 64 C 32 80 28 148 38 254 L82 254 C 92 148 88 80 60 64 Z" fill={color} />
  </svg>
);

// Xi Vưu giáp mũ sừng — lớp phản chiếu
const Warrior: React.FC<{ color: string }> = ({ color }) => (
  <svg width={280} height={440} viewBox="0 0 280 440" style={{ overflow: "visible" }}>
    <path d="M96 86 C 62 52 46 20 60 6" stroke={color} strokeWidth={11} fill="none" strokeLinecap="round" />
    <path d="M184 86 C 218 52 234 20 220 6" stroke={color} strokeWidth={11} fill="none" strokeLinecap="round" />
    <ellipse cx={140} cy={104} rx={58} ry={46} fill={color} />
    <path d="M140 104 L140 162" stroke="rgba(18,11,6,0.8)" strokeWidth={7} />
    <circle cx={116} cy={138} r={7} fill="rgba(18,11,6,0.85)" />
    <circle cx={164} cy={138} r={7} fill="rgba(18,11,6,0.85)" />
    <path d="M140 170 C 88 190 70 258 66 352 L214 352 C 210 258 192 190 140 170 Z" fill={color} opacity={0.92} />
    <path d="M74 240 C 110 264 170 264 206 240" stroke="rgba(18,11,6,0.45)" strokeWidth={6} fill="none" />
    <path d="M66 352 L214 352 L224 398 L56 398 Z" fill={color} opacity={0.75} />
  </svg>
);

/** nền tối + fade in/out + wipe ink theo transitions của spec */
const Stage: React.FC<{
  dur: number;
  wipeIn?: boolean;
  wipeOut?: boolean;
  children: React.ReactNode;
}> = ({ dur, wipeIn, wipeOut, children }) => {
  const frame = useCurrentFrame();
  const op = clamp01(frame / 10) * clamp01((dur - 8 - frame) / 8);
  return (
    <Paper>
      <div style={ROOT}>
        <div style={DARK} />
        <div style={{ ...ROOT, opacity: op }}>{children}</div>
        {wipeIn && <WipeInk startFrac={0} color={C.bg} durationInFrames={dur} />}
        {wipeOut && <WipeInk startFrac={0.74} color={C.bg} durationInFrames={dur} />}
      </div>
    </Paper>
  );
};

/* ================================================================
   sc023 — TAM TỔ ĐƯỜNG (gen image + overlay ba án thờ, s12)
   ================================================================ */
export const Sc023: React.FC<SceneProps> = () => {
  const A = useA(556);
  const a1 = A("Tam Tổ Đường");
  const a2 = A("Hoàng Đế — kẻ thắng");
  const a3 = A("Viêm Đế — bậc trưởng thượng");
  const a4 = A("Xi Vưu — kẻ thua");

  const plaques = [
    { han: "黃帝", name: "Hoàng Đế", role: "kẻ thắng", a: a2 },
    { han: "炎帝", name: "Viêm Đế", role: "bậc trưởng thượng", a: a3 },
    { han: "蚩尤", name: "Xi Vưu", role: "kẻ thua", a: a4 },
  ];

  return (
    <Paper>
      <InkImageScene
        src="img-sc023.png"
        label="TAM TỔ ĐƯỜNG · TRÁC LỘC"
        sublabel="đền hôm nay — ngay trên chiến trường xưa"
      >
        <div style={ROOT}>
          <Reveal
            startFrac={a1}
            endFrac={a1 + 0.05}
            style={{ position: "absolute", left: 0, right: 0, top: 96, display: "flex", justifyContent: "center" }}
          >
            <Chip color={C.amber} style={{ background: C.amber, color: "#1A1714", borderColor: C.amber }}>
              ba vị tổ — một gian điện
            </Chip>
          </Reveal>

          {/* ba án thờ — plaque sáng theo nhịp đọc tên */}
          <div style={{ position: "absolute", left: 420, top: 566, width: 1080, display: "flex", gap: 30 }}>
            {plaques.map((p) => (
              <Reveal key={p.han} startFrac={p.a} endFrac={p.a + 0.06} dy={22} style={{ flex: 1 }}>
                <div
                  style={{
                    padding: "24px 0 20px",
                    textAlign: "center",
                    background: "rgba(16,10,6,0.66)",
                    border: `2px solid ${C.amber}66`,
                    borderRadius: 14,
                  }}
                >
                  <div style={{ fontFamily: FONT.hanzi, fontWeight: 700, fontSize: 92, lineHeight: 1.05, color: C.cream }}>
                    {p.han}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 26, color: C.amber, letterSpacing: 2 }}>{p.name}</div>
                  <div style={{ marginTop: 6, fontSize: 22, color: C.mute }}>{p.role}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <SourceTag text="ảnh phác họa — không phải ảnh tư liệu" right />
        </div>
      </InkImageScene>
      <WipeInk startFrac={0} color={C.bg} durationInFrames={556} />
    </Paper>
  );
};

/* ================================================================
   sc024 — MINI-REVEAL HỒI 1 + tro kết tinh thành gương (s12)
   ================================================================ */
export const Sc024: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const DUR = 367;
  const A = useA(DUR);
  const a1 = A("người thắng viết sử");
  const a2 = A("kẻ thua ở lại trong tín ngưỡng");
  const a3 = A("rèn thành một tấm gương đồng");
  const a3f = a3 * DUR;

  // tro xoáy về tâm gương
  const conv = prog(frame, a3f, 55);

  return (
    <Stage dur={DUR}>
      <div style={{ position: "absolute", left: 340, right: 340, top: 116 }}>
        <LegendFrame label="HỒI MỘT — NHẬN RA">
          <div style={{ textAlign: "center", padding: "30px 26px 26px" }}>
            <Reveal startFrac={a1} endFrac={a1 + 0.06}>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.white }}>
                Người thắng viết sử —
              </div>
            </Reveal>
            <Reveal startFrac={a2} endFrac={a2 + 0.06}>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 700,
                  fontSize: 54,
                  color: C.white,
                  marginTop: 20,
                }}
              >
                nhưng kẻ thua ở lại trong tín ngưỡng,
              </div>
            </Reveal>
            <Reveal startFrac={a2 + 45 / DUR} endFrac={a2 + 75 / DUR}>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 700,
                  fontSize: 54,
                  color: C.amber,
                  marginTop: 20,
                }}
              >
                lâu hơn mọi triều đại.
              </div>
            </Reveal>
          </div>
        </LegendFrame>
      </div>

      {/* hạt tro xoáy → kết tinh */}
      {new Array(14).fill(0).map((_, i) => {
        const ang = i * 2.399 + frame * 0.11;
        const r = 430 * (1 - conv) + 34;
        const px = 960 + r * Math.cos(ang) * 1.12;
        const py = 776 + r * Math.sin(ang) * 0.66;
        const size = 4 + (i % 3) * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px - size / 2,
              top: py - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: i % 2 === 0 ? C.amber : C.cream,
              opacity: (1 - conv) * 0.9,
            }}
          />
        );
      })}

      <InkDraw
        d={circleD(960, 776, 190)}
        startFrac={a3}
        endFrac={a3 + 42 / DUR}
        stroke={C.amber}
        strokeWidth={5}
        style={{ position: "absolute", inset: 0 }}
      />
      <InkDraw
        d={circleD(960, 776, 158)}
        startFrac={a3 + 14 / DUR}
        endFrac={a3 + 56 / DUR}
        stroke={C.mute}
        strokeWidth={2}
        style={{ position: "absolute", inset: 0 }}
      />

      <Reveal
        startFrac={a3 + 48 / DUR}
        endFrac={a3 + 62 / DUR}
        style={{
          position: "absolute",
          left: 810,
          top: 731,
          width: 300,
          height: 90,
          transform: "rotate(-18deg)",
          background: `linear-gradient(105deg, transparent 42%, ${C.cream}2e 50%, transparent 58%)`,
          borderRadius: "50%",
        }}
      >
        <div style={{ width: "100%", height: "100%" }} />
      </Reveal>

      <Reveal
        startFrac={a3 + 90 / DUR}
        endFrac={a3 + 104 / DUR}
        style={{ position: "absolute", left: 0, right: 0, top: 996, display: "flex", justifyContent: "center" }}
      >
        <Chip color={C.amber} style={{ background: C.amber, color: "#1A1714", borderColor: C.amber }}>
          Hồi hai bắt đầu
        </Chip>
      </Reveal>
    </Stage>
  );
};

/* ================================================================
   sc025 — GƯƠNG ĐẶT GIỮA + NẾN BÉN LỬA (s13)
   ================================================================ */
export const Sc025: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const DUR = 527;
  const A = useA(DUR);
  const a1 = A("Tấm gương đồng được đặt giữa");
  const a2 = A("một ngọn nến");
  const a3 = A("một ký ức khác nhau");

  const flick = 0.85 + 0.15 * Math.sin(frame * 0.9) + 0.08 * Math.sin(frame * 2.3 + 1);
  const shine = 0.22 + 0.14 * Math.sin(frame * 0.05);

  return (
    <Stage dur={DUR} wipeIn>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center" }}>
        <SceneTitle eyebrow="HỒI HAI" title="Ba tộc — ba ký ức" align="center" startFrac={a1} />
      </div>

      {/* gương đồng */}
      <Reveal startFrac={a1} endFrac={a1 + 0.07} dy={26}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <circle cx={880} cy={560} r={232} fill="rgba(150,104,44,0.10)" stroke={C.amber} strokeWidth={6} />
          <circle cx={880} cy={560} r={206} fill="none" stroke={C.mute} strokeWidth={2} opacity={0.7} />
          <path
            d="M740 430 C 790 400 850 390 900 396"
            stroke={C.cream}
            strokeWidth={8}
            fill="none"
            opacity={shine}
            strokeLinecap="round"
          />
        </svg>
      </Reveal>

      {/* ngọn nến */}
      <div style={{ position: "absolute", left: 1290, top: 470, width: 60, height: 260 }}>
        <Reveal startFrac={a2} endFrac={a2 + 0.05} dy={14} style={{ width: 60, height: 260 }}>
          <svg width={60} height={260} viewBox="0 0 60 260" style={{ overflow: "visible" }}>
            <rect x={17} y={92} width={26} height={150} rx={5} fill="rgba(226,208,172,0.75)" />
            <line x1={30} y1={92} x2={30} y2={80} stroke={C.mute} strokeWidth={3} />
            <circle cx={30} cy={58} r={54} fill={C.amber} opacity={0.12 * flick} />
            <ellipse cx={30} cy={58} rx={9} ry={20 * flick} fill={C.amber} opacity={0.95} />
            <ellipse cx={30} cy={64} rx={4} ry={9 * flick} fill={C.cream} opacity={0.9} />
          </svg>
        </Reveal>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 912, textAlign: "center" }}>
        <Reveal startFrac={a3} endFrac={a3 + 0.06}>
          <div style={{ fontSize: 34, color: C.cream }}>mỗi tộc soi vào — thấy một hình khác nhau</div>
        </Reveal>
        <Reveal startFrac={a3 + 180 / DUR} endFrac={a3 + 190 / DUR}>
          <div style={{ fontSize: 25, color: C.mute, marginTop: 18 }}>
            vấn đề nằm ở điều mỗi người đặt xuống trước gương
          </div>
        </Reveal>
      </div>
    </Stage>
  );
};

/* ================================================================
   sc026 — BA BÓNG NGƯỜI BƯỚC VÀO (s13, cảnh ngắn 122f)
   ================================================================ */
export const Sc026: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const DUR = 122;
  const A = useA(DUR);
  const a1 = A("Ba bóng người xuất hiện từ ba phía");
  const a2 = A("từ phương Bắc");
  const a3 = A("từ miền núi");
  const a1f = a1 * DUR;

  const walkers = [
    {
      color: C.amber,
      from: { x: 140, y: 100 },
      to: { x: 540, y: 430 },
      d0: 0,
      label: "phương Bắc — cờ xí, thư thiên văn",
      la: a2,
      lx: 300,
      ly: 316,
    },
    {
      color: C.warn,
      from: { x: 1760, y: 940 },
      to: { x: 810, y: 720 },
      d0: 7,
      label: "miền núi — khúc kể bếp lửa",
      la: a3,
      lx: 600,
      ly: 852,
    },
    {
      color: C.teal,
      from: { x: 1840, y: 60 },
      to: { x: 1310, y: 540 },
      d0: 14,
      label: "gần ta nhất — điện thoại, sơ đồ",
      la: a3 + 22 / DUR,
      lx: 1330,
      ly: 440,
    },
  ];

  return (
    <Stage dur={DUR}>
      {/* gương giữa — điểm tụ */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={960}
          cy={500}
          r={122}
          fill="rgba(150,104,44,0.08)"
          stroke={C.mute}
          strokeWidth={4}
          opacity={0.55}
        />
      </svg>

      {walkers.map((w, i) => {
        const p = prog(frame, a1f + w.d0, 56);
        const x = w.from.x + (w.to.x - w.from.x) * p;
        const y = w.from.y + (w.to.y - w.from.y) * p + (p > 0 && p < 1 ? 6 * Math.sin(frame * 0.5 + i) : 0);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: "translate(-50%, -100%)",
                opacity: clamp01(p * 4),
              }}
            >
              <Fig color={w.color} h={250} />
            </div>
            <Reveal
              startFrac={w.la}
              endFrac={w.la + 0.06}
              style={{ position: "absolute", left: w.lx, top: w.ly, fontSize: 24, color: w.color, whiteSpace: "nowrap" }}
            >
              <span style={{ background: "rgba(20,17,13,0.74)", padding: "4px 14px", borderRadius: 8 }}>{w.label}</span>
            </Reveal>
          </React.Fragment>
        );
      })}
    </Stage>
  );
};

/* ================================================================
   sc027 — BA VẬT ĐẶT XUỐNG + "Mời người thứ nhất" (s13)
   ================================================================ */
export const Sc027: React.FC<SceneProps> = () => {
  const DUR = 382;
  const A = useA(DUR);
  const a1 = A("cờ xí và thư thiên văn");
  const a2 = A("khúc kể quanh bếp lửa");
  const a3 = A("điện thoại và một tấm sơ đồ");
  const a4 = A("Mời người thứ nhất");

  return (
    <Stage dur={DUR} wipeOut>
      {/* gương mờ phía trên */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={960}
          cy={240}
          r={102}
          fill="rgba(150,104,44,0.06)"
          stroke={C.mute}
          strokeWidth={3}
          opacity={0.4}
        />
      </svg>

      {/* ô 1 — cờ + thư thiên văn (người Hán) */}
      <div style={{ position: "absolute", left: 210, top: 520, width: 460, height: 330 }}>
        <SpringPop startFrac={a1} style={{ width: "100%", height: "100%" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "rgba(18,12,8,0.68)",
              border: `3px solid ${C.amber}88`,
              borderRadius: 22,
            }}
          >
            <svg width={460} height={230} viewBox="0 0 460 230">
              <line x1={120} y1={26} x2={120} y2={196} stroke={C.amber} strokeWidth={6} strokeLinecap="round" />
              <path d="M120 32 C 168 20 208 40 252 28 L246 70 C 208 80 168 62 120 74 Z" fill={`${C.amber}cc`} />
              <rect x={250} y={120} width={120} height={46} rx={8} fill="none" stroke={C.amber} strokeWidth={4} />
              <circle cx={250} cy={143} r={9} fill="none" stroke={C.amber} strokeWidth={4} />
              <circle cx={370} cy={143} r={9} fill="none" stroke={C.amber} strokeWidth={4} />
              <line x1={272} y1={136} x2={348} y2={136} stroke={`${C.amber}77`} strokeWidth={3} />
              <line x1={272} y1={150} x2={332} y2={150} stroke={`${C.amber}55`} strokeWidth={3} />
              <circle cx={330} cy={56} r={4} fill={`${C.cream}99`} />
              <circle cx={368} cy={84} r={3} fill={`${C.cream}77`} />
              <circle cx={300} cy={90} r={3} fill={`${C.cream}66`} />
            </svg>
            <div style={{ textAlign: "center", fontSize: 26, color: C.amber }}>cờ xí · thư thiên văn</div>
          </div>
        </SpringPop>
      </div>

      {/* ô 2 — khúc kể bếp lửa (người H'Mông) */}
      <div style={{ position: "absolute", left: 730, top: 520, width: 460, height: 330 }}>
        <SpringPop startFrac={a2} style={{ width: "100%", height: "100%" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "rgba(18,12,8,0.68)",
              border: `3px solid ${C.warn}88`,
              borderRadius: 22,
            }}
          >
            <svg width={460} height={230} viewBox="0 0 460 230">
              <path d="M150 56 C 172 88 184 104 150 134 C 116 104 128 88 150 56 Z" fill={`${C.warn}dd`} />
              <ellipse cx={150} cy={126} rx={16} ry={26} fill={`${C.amber}cc`} />
              <line x1={104} y1={166} x2={196} y2={154} stroke={C.warn} strokeWidth={7} strokeLinecap="round" />
              <line x1={110} y1={152} x2={192} y2={168} stroke={C.warn} strokeWidth={7} strokeLinecap="round" />
              <path d="M246 78 C 296 60 296 132 246 118" fill="none" stroke={`${C.warn}aa`} strokeWidth={4} />
              <path d="M266 56 C 336 32 336 152 266 134" fill="none" stroke={`${C.warn}88`} strokeWidth={4} />
              <path d="M286 34 C 376 4 376 172 286 150" fill="none" stroke={`${C.warn}66`} strokeWidth={4} />
            </svg>
            <div style={{ textAlign: "center", fontSize: 26, color: C.warn }}>khúc kể quanh bếp lửa</div>
          </div>
        </SpringPop>
      </div>

      {/* ô 3 — điện thoại + sơ đồ (người Việt) */}
      <div style={{ position: "absolute", left: 1250, top: 520, width: 460, height: 330 }}>
        <SpringPop startFrac={a3} style={{ width: "100%", height: "100%" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "rgba(18,12,8,0.68)",
              border: `3px solid ${C.teal}88`,
              borderRadius: 22,
            }}
          >
            <svg width={460} height={230} viewBox="0 0 460 230">
              <rect x={80} y={26} width={92} height={168} rx={16} fill="none" stroke={C.teal} strokeWidth={5} />
              <rect x={94} y={44} width={64} height={120} rx={4} fill={`${C.teal}33`} />
              <line x1={172} y1={80} x2={252} y2={62} stroke={`${C.teal}aa`} strokeWidth={3} />
              <line x1={172} y1={110} x2={252} y2={118} stroke={`${C.teal}aa`} strokeWidth={3} />
              <line x1={172} y1={140} x2={252} y2={172} stroke={`${C.teal}aa`} strokeWidth={3} />
              <line x1={252} y1={62} x2={322} y2={118} stroke={`${C.teal}66`} strokeWidth={3} />
              <line x1={252} y1={172} x2={322} y2={118} stroke={`${C.teal}66`} strokeWidth={3} />
              <circle cx={252} cy={62} r={11} fill="none" stroke={C.teal} strokeWidth={4} />
              <circle cx={252} cy={118} r={11} fill="none" stroke={C.teal} strokeWidth={4} />
              <circle cx={252} cy={172} r={11} fill="none" stroke={C.teal} strokeWidth={4} />
              <circle cx={322} cy={118} r={13} fill="none" stroke={C.teal} strokeWidth={4} />
            </svg>
            <div style={{ textAlign: "center", fontSize: 26, color: C.teal }}>điện thoại · tấm sơ đồ</div>
          </div>
        </SpringPop>
      </div>

      {/* mời người thứ nhất — ô 1 sáng lên */}
      <Reveal
        startFrac={a4}
        endFrac={a4 + 0.05}
        style={{
          position: "absolute",
          left: 210,
          top: 520,
          width: 460,
          height: 330,
          borderRadius: 22,
          boxShadow: `0 0 64px ${C.amber}55, inset 0 0 40px ${C.amber}22`,
          border: `3px solid ${C.amber}`,
        }}
      >
        <div style={{ width: "100%", height: "100%" }} />
      </Reveal>
      <InkDraw
        d="M440 878 C 560 916 720 916 856 884 M856 884 l-30 -14 M856 884 l-34 12"
        startFrac={a4 + 6 / DUR}
        endFrac={a4 + 32 / DUR}
        stroke={C.amber}
        strokeWidth={4}
        style={{ position: "absolute", inset: 0 }}
      />
      <Reveal
        startFrac={a4}
        endFrac={a4 + 0.05}
        style={{ position: "absolute", left: 0, right: 0, top: 930, textAlign: "center" }}
      >
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: C.amber }}>
          Mời người thứ nhất →
        </span>
      </Reveal>
    </Stage>
  );
};

/* ================================================================
   sc028 — PHẢN CHIẾU 1: NGƯỜI HÁN SOI — BINH CHỦ (s14)
   ================================================================ */
export const Sc028: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const DUR = 500;
  const A = useA(DUR);
  const a1 = A("Người Hán bước tới");
  const a2 = A("Binh chủ");
  const a3 = A("một trong tám vị thần cổ");
  const a1f = a1 * DUR;

  const walkP = prog(frame, a1f, 60);
  const wx = 210 + walkP * 300;
  const bob = walkP > 0 && walkP < 1 ? 7 * Math.sin(frame * 0.55) : 0;
  const refl = prog(frame, a1f + 45, 60) * (0.66 + 0.1 * Math.sin(frame * 0.07));

  return (
    <Stage dur={DUR} wipeIn>
      <div
        style={{
          position: "absolute",
          left: 640,
          top: 0,
          width: 1100,
          height: 900,
          background: `radial-gradient(ellipse at 55% 50%, ${C.amber}17, transparent 70%)`,
        }}
      />

      {/* người Hán bước tới (lệch trái) */}
      <div style={{ position: "absolute", left: wx, top: 700 + bob, transform: "translate(-50%, -100%)" }}>
        <Fig color={C.amber} h={300} />
      </div>

      {/* mặt gương giữa-phải */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <ellipse
          cx={1160}
          cy={540}
          rx={306}
          ry={398}
          fill="rgba(150,104,44,0.10)"
          stroke={C.amber}
          strokeWidth={6}
        />
        <ellipse cx={1160} cy={540} rx={282} ry={372} fill="none" stroke={C.mute} strokeWidth={2} opacity={0.6} />
      </svg>

      {/* lớp phản chiếu: Xi Vưu giáp mũ sừng trong khói hương */}
      <div style={{ position: "absolute", left: 1020, top: 320, opacity: refl }}>
        <Warrior color={C.amber} />
      </div>

      <InkDraw
        d="M1092 716 C 1124 652 1082 608 1122 548"
        startFrac={a2}
        endFrac={a2 + 38 / DUR}
        stroke={`${C.amber}aa`}
        strokeWidth={3}
        style={{ position: "absolute", inset: 0 }}
      />
      <InkDraw
        d="M1196 730 C 1228 664 1186 620 1224 560"
        startFrac={a2 + 8 / DUR}
        endFrac={a2 + 46 / DUR}
        stroke={`${C.amber}88`}
        strokeWidth={3}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* nhãn BINH CHỦ */}
      <Reveal
        startFrac={a2}
        endFrac={a2 + 0.05}
        style={{ position: "absolute", left: 1160, top: 96, transform: "translateX(-50%)" }}
      >
        <Chip color={C.amber} style={{ background: C.amber, color: "#1A1714", borderColor: C.amber }}>
          BINH CHỦ — chúa của binh gia
        </Chip>
      </Reveal>

      <div style={{ position: "absolute", left: 0, right: 0, top: 958, textAlign: "center" }}>
        <Reveal startFrac={a3} endFrac={a3 + 0.05}>
          <div style={{ fontSize: 34, color: C.cream }}>1 trong 8 vị thần cổ được lập thờ</div>
        </Reveal>
        <Reveal startFrac={a3 + 120 / DUR} endFrac={a3 + 130 / DUR}>
          <div style={{ fontSize: 24, color: C.mute, marginTop: 16 }}>
            không phải quỷ dữ — đỉnh cao của nghệ thuật chiến tranh
          </div>
        </Reveal>
      </div>
    </Stage>
  );
};

/* ================================================================
   sc029 — NGHỊCH LÝ ĐẦU TIÊN: sao chổi + chuỗi đền thờ (s14)
   ================================================================ */
export const Sc029: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const DUR = 445;
  const A = useA(DUR);
  const a1 = A("kỳ Xi Vưu");
  const a2 = A("nghịch lý đầu tiên");
  const a3 = A("Người ta thờ kẻ đáng sợ");
  const a1f = a1 * DUR;

  // comet quét ngang mặt gương
  const cp = clamp01((frame - (a1f + 6)) / 55);
  const cx = 150 + cp * 830;
  const cy = 250 + 24 * Math.sin(frame * 0.18);
  const cvis = Math.sin(clamp01(cp) * Math.PI);

  const temples = [0, 1, 2, 3, 4, 5];

  return (
    <Stage dur={DUR}>
      {/* gương nghiêng nửa trên */}
      <div
        style={{
          position: "absolute",
          left: 410,
          top: 50,
          width: 1100,
          height: 420,
          transform: "rotate(-7deg)",
        }}
      >
        <svg width={1100} height={420} style={{ overflow: "visible" }}>
          <ellipse
            cx={550}
            cy={230}
            rx={480}
            ry={178}
            fill="rgba(150,104,44,0.08)"
            stroke={C.amber}
            strokeWidth={5}
          />
          <circle cx={330} cy={190} r={3} fill={`${C.cream}88`} />
          <circle cx={720} cy={150} r={2.5} fill={`${C.cream}77`} />
          <circle cx={820} cy={290} r={3} fill={`${C.cream}66`} />
          <g opacity={cvis}>
            <path d={`M${cx} ${cy} L${cx - 250} ${cy - 16} L${cx - 238} ${cy + 18} Z`} fill={`${C.amber}66`} />
            <path d={`M${cx} ${cy} L${cx - 130} ${cy - 9} L${cx - 124} ${cy + 10} Z`} fill={`${C.amber}aa`} />
            <circle cx={cx} cy={cy} r={13} fill={C.cream} />
          </g>
        </svg>
      </div>

      <Reveal
        startFrac={a1 + 20 / DUR}
        endFrac={a1 + 26 / DUR}
        style={{ position: "absolute", left: 0, right: 0, top: 128, display: "flex", justifyContent: "center" }}
      >
        <Chip color={C.amber}>vệt sao chổi — kỳ Xi Vưu · điềm binh lửa</Chip>
      </Reveal>

      {/* câu nghịch lý */}
      <Reveal
        startFrac={a2}
        endFrac={a2 + 0.06}
        style={{ position: "absolute", left: 160, right: 160, top: 548, textAlign: "center" }}
      >
        <span style={{ fontSize: 31, color: C.cream, fontStyle: "italic" }}>
          dân tộc tự nhận hậu duệ của kẻ thắng — lại nâng kẻ thua của tổ tiên lên hàng chiến thần
        </span>
      </Reveal>

      {/* chuỗi đền thờ sáng đèn */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {temples.map((i) => {
          const x = 330 + i * 250;
          const y = 742;
          const lit = clamp01((frame - (a1f + 90 + i * 12)) / 10);
          return (
            <g key={i} opacity={0.9}>
              <path
                d={`M${x - 66} ${y} L${x} ${y - 62} L${x + 66} ${y} Z`}
                fill="none"
                stroke={C.amber}
                strokeWidth={4}
              />
              <rect x={x - 42} y={y} width={84} height={64} fill="none" stroke={C.amber} strokeWidth={4} />
              <rect x={x - 11} y={y + 26} width={22} height={38} fill="none" stroke={`${C.amber}aa`} strokeWidth={3} />
              <circle cx={x} cy={y + 14} r={16} fill={C.amber} opacity={0.22 * lit} />
              <circle cx={x} cy={y + 14} r={6} fill={C.amber} opacity={lit} />
            </g>
          );
        })}
      </svg>

      {/* chốt khắc */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 858, textAlign: "center" }}>
        <Reveal startFrac={a3 - 60 / DUR} endFrac={a3 - 50 / DUR}>
          <div style={{ fontSize: 29, color: C.mute }}>nơi chiến trận — người ta không thờ kẻ dễ thắng</div>
        </Reveal>
        <SpringPop startFrac={a3}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 66,
              color: C.white,
              marginTop: 22,
            }}
          >
            Người ta thờ kẻ đáng sợ.
          </div>
        </SpringPop>
      </div>
    </Stage>
  );
};

/* ================================================================
   sc030 — PHẢN CHIẾU 2: TXIV YAWG (gen image + overlay, s15)
   ================================================================ */
export const Sc030: React.FC<SceneProps> = () => {
  const DUR = 690;
  const A = useA(DUR);
  const a1 = A("keev kwm");
  const a2 = A("Txiv Yawg");
  const a3 = A("Cuab Cuaj Lig");
  const a4 = A("dạy luyện kim");

  return (
    <Paper>
      <InkImageScene
        src="img-sc030.png"
        label="PHẢN CHIẾU 2 — NGƯỜI H'MÔNG SOI GƯƠNG"
        sublabel="lớp mực đỏ trầm"
      >
        <div style={ROOT}>
          <Reveal startFrac={a1} endFrac={a1 + 0.05} style={{ position: "absolute", left: 90, top: 108 }}>
            <Chip color={C.warn}>keev kwm — khúc kể tổ tiên</Chip>
          </Reveal>

          <Reveal
            startFrac={a2}
            endFrac={a2 + 0.07}
            dy={24}
            style={{ position: "absolute", left: 90, top: 196 }}
          >
            <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 86, color: C.warn }}>
              Txiv Yawg
            </span>
          </Reveal>
          <Reveal startFrac={a2 + 30 / DUR} endFrac={a2 + 36 / DUR} style={{ position: "absolute", left: 94, top: 322 }}>
            <span style={{ fontSize: 26, color: C.cream, background: "rgba(20,17,13,0.66)", padding: "4px 14px", borderRadius: 8 }}>
              vị vua tổ — khai sáng luật pháp
            </span>
          </Reveal>

          <Reveal
            startFrac={a3}
            endFrac={a3 + 0.06}
            dy={18}
            style={{ position: "absolute", left: 90, top: 404 }}
          >
            <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 48, color: `${C.warn}cc` }}>
              Cuab Cuaj Lig
            </span>
          </Reveal>
          <Reveal startFrac={a3 + 26 / DUR} endFrac={a3 + 32 / DUR} style={{ position: "absolute", left: 94, top: 478 }}>
            <span style={{ fontSize: 23, color: C.mute, background: "rgba(20,17,13,0.66)", padding: "4px 14px", borderRadius: 8 }}>
              những cái tên sống trong lời kể quanh lửa
            </span>
          </Reveal>

          <div style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center" }}>
            <Reveal startFrac={a4} endFrac={a4 + 0.05}>
              <span style={{ fontSize: 30, color: C.cream, background: "rgba(20,17,13,0.7)", padding: "8px 22px", borderRadius: 10 }}>
                vua tổ: luật pháp · luyện kim · nếp sống định canh
              </span>
            </Reveal>
            <Reveal startFrac={a4 + 135 / DUR} endFrac={a4 + 141 / DUR}>
              <span style={{ fontSize: 24, color: C.mute, background: "rgba(20,17,13,0.7)", padding: "6px 18px", borderRadius: 10, marginTop: 14, display: "inline-block" }}>
                không phải thần thoại để thưởng thức — ông là tổ
              </span>
            </Reveal>
          </div>

          <SourceTag text="ảnh phác họa — không phải ảnh tư liệu" right />
        </div>
      </InkImageScene>
    </Paper>
  );
};

/* ================================================================
   sc031 — THIÊN DI XUỐNG PHƯƠNG NAM + cảnh báo biên tập (s15)
   ================================================================ */
export const Sc031: React.FC<SceneProps> = () => {
  const DUR = 620;
  const A = useA(DUR);
  const a1 = A("thiên di");
  const a2 = A("ký ức mất nước");
  const a3 = A("chữ Miêu trong cổ thư");
  const a4 = A("không được lẫn vào nhau");

  return (
    <Paper>
      <InkImageScene
        src="img-sc031.png"
        label="THIÊN DI XUỐNG PHƯƠNG NAM"
        sublabel="thế hệ dẫn thế hệ — rời quê cũ"
        focus={{ x: 0.62, y: 0.5 }}
      >
        <div style={ROOT}>
          {/* đường mòn đỏ vẽ dọc đoàn người */}
          <InkDraw
            d="M110 730 C 470 660 850 790 1230 700 S 1660 640 1800 590"
            startFrac={a1}
            endFrac={a1 + 110 / DUR}
            stroke={`${C.warn}dd`}
            strokeWidth={7}
            style={{ position: "absolute", inset: 0 }}
          />

          <Reveal
            startFrac={a2}
            endFrac={a2 + 0.05}
            style={{ position: "absolute", left: 90, top: 560 }}
          >
            <span
              style={{
                fontSize: 26,
                color: C.cream,
                background: "rgba(20,17,13,0.72)",
                borderLeft: `5px solid ${C.warn}`,
                padding: "8px 18px",
                borderRadius: 8,
              }}
            >
              kể lại cho con cháu như ký ức mất nước
            </span>
          </Reveal>

          {/* dòng chú thích biên tập đóng khung */}
          <Reveal
            startFrac={a3}
            endFrac={a3 + 0.06}
            dy={20}
            style={{ position: "absolute", left: 400, top: 700, width: 1120 }}
          >
            <div
              style={{
                background: "rgba(14,9,6,0.86)",
                border: `3px solid ${C.warn}`,
                borderRadius: 14,
                padding: "24px 36px",
              }}
            >
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 30, color: C.lampRed, letterSpacing: 3 }}>
                CHÚ Ý — DÒNG TO
              </div>
              <div style={{ fontSize: 28, color: C.cream, marginTop: 12, lineHeight: 1.45 }}>
                chữ Miêu trong cổ thư là danh xưng cổ —{" "}
                <span style={{ color: C.lampRed, fontWeight: 700 }}>≠ dân tộc H'Mông hôm nay (nhân chủng)</span>
              </div>
              <Reveal startFrac={a4} endFrac={a4 + 0.04}>
                <div
                  style={{
                    fontSize: 27,
                    color: C.warn,
                    fontWeight: 700,
                    marginTop: 14,
                    borderTop: `2px solid ${C.warn}66`,
                    paddingTop: 12,
                  }}
                >
                  hai tầng ký ức và nhân chủng — không được lẫn vào nhau
                </div>
              </Reveal>
            </div>
          </Reveal>

          <SourceTag text="ảnh phác họa — không phải ảnh tư liệu" right />
        </div>
      </InkImageScene>
      <WipeInk startFrac={0.74} color={C.bg} durationInFrames={DUR} />
    </Paper>
  );
};

/* ================================================================
   sc032 — HAI TẦNG TÁCH BẠCH: ký ức sống / di truyền đo đạc (s16)
   ================================================================ */
export const Sc032: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const DUR = 427;
  const A = useA(DUR);
  const a1 = A("Tầng một — ký ức sống");
  const a2 = A("Tầng hai — di truyền đo đạc");
  const a3 = A("Không ai có quyền cầm kính hiển vi");
  const a1f = a1 * DUR;
  const a2f = a2 * DUR;

  const slideTop = (1 - prog(frame, a1f, 45)) * -110;
  const slideBot = (1 - prog(frame, a2f, 45)) * 110;

  return (
    <Stage dur={DUR} wipeIn>
      {/* tầng một — ký ức sống */}
      <div style={{ position: "absolute", left: 260 + slideTop, top: 170, width: 1400 }}>
        <Reveal startFrac={a1} endFrac={a1 + 0.08} dy={18}>
          <div
            style={{
              background: "rgba(112,32,26,0.30)",
              border: `2.5px solid ${C.warn}99`,
              borderRadius: 20,
              padding: "30px 44px",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.lampRed, letterSpacing: 2 }}>
              TẦNG MỘT — KÝ ỨC SỐNG
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 22 }}>
              <svg width={110} height={110} viewBox="0 0 110 110">
                <path d="M55 14 C 74 42 86 56 55 84 C 24 56 36 42 55 14 Z" fill={`${C.warn}dd`} />
                <ellipse cx={55} cy={74} rx={13} ry={22} fill={`${C.amber}cc`} />
                <line x1={26} y1={98} x2={84} y2={92} stroke={C.warn} strokeWidth={6} strokeLinecap="round" />
              </svg>
              <svg width={110} height={110} viewBox="0 0 110 110">
                <path d="M18 76 C 44 62 44 44 18 50" fill="none" stroke={`${C.warn}aa`} strokeWidth={4} />
                <path d="M30 92 C 70 72 70 34 30 46" fill="none" stroke={`${C.warn}88`} strokeWidth={4} />
              </svg>
              <div style={{ fontSize: 27, color: C.cream, lineHeight: 1.6 }}>
                thật trong luật lệ ông dạy · chặng thiên di tổ tiên đã đi ·
                <br />
                mỗi lần kể lại quanh lửa
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* tầng hai — di truyền đo đạc */}
      <div style={{ position: "absolute", left: 260 + slideBot, top: 592, width: 1400 }}>
        <Reveal startFrac={a2} endFrac={a2 + 0.08} dy={18}>
          <div
            style={{
              background: "rgba(18,84,78,0.28)",
              border: `2.5px solid ${C.teal}99`,
              borderRadius: 20,
              padding: "30px 44px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.teal, letterSpacing: 2 }}>
                TẦNG HAI — DI TRUYỀN ĐO ĐẠC
              </div>
              <Chip color={C.teal}>GÓC KHOA HỌC</Chip>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 34, marginTop: 22 }}>
              <svg width={520} height={110} viewBox="0 0 560 110">
                <path
                  d="M0 55 C 35 12 70 12 105 55 C 140 98 175 98 210 55 C 245 12 280 12 315 55 C 350 98 385 98 420 55 C 455 12 490 12 525 55"
                  fill="none"
                  stroke={C.teal}
                  strokeWidth={5}
                />
                <path
                  d="M0 55 C 35 98 70 98 105 55 C 140 12 175 12 210 55 C 245 98 280 98 315 55 C 350 12 385 12 420 55 C 455 98 490 98 525 55"
                  fill="none"
                  stroke={`${C.teal}aa`}
                  strokeWidth={5}
                />
                <line x1={52} y1={30} x2={52} y2={80} stroke={`${C.teal}88`} strokeWidth={3.5} />
                <line x1={157} y1={30} x2={157} y2={80} stroke={`${C.teal}88`} strokeWidth={3.5} />
                <line x1={262} y1={30} x2={262} y2={80} stroke={`${C.teal}88`} strokeWidth={3.5} />
                <line x1={367} y1={30} x2={367} y2={80} stroke={`${C.teal}88`} strokeWidth={3.5} />
                <line x1={472} y1={30} x2={472} y2={80} stroke={`${C.teal}88`} strokeWidth={3.5} />
              </svg>
              <div style={{ fontSize: 27, color: C.cream, lineHeight: 1.6 }}>
                cư dân sống ở đâu · di chuyển thế nào ·
                <br />
                gần ai, xa ai — nó đo con người, không phán xét vua tổ
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ranh giới sáng mảnh */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={300} y1={540} x2={1620} y2={540} stroke={`${C.mute}44`} strokeWidth={2} />
      </svg>
      <InkDraw
        d="M300 540 L1620 540"
        startFrac={a3}
        endFrac={a3 + 32 / DUR}
        stroke={C.amber}
        strokeWidth={3}
        style={{ position: "absolute", inset: 0 }}
      />

      <Reveal
        startFrac={a3 + 24 / DUR}
        endFrac={a3 + 30 / DUR}
        style={{ position: "absolute", left: 0, right: 0, top: 944, textAlign: "center" }}
      >
        <span style={{ fontSize: 28, color: C.cream, fontStyle: "italic" }}>
          không ai có quyền cầm kính hiển vi đi xóa một tầng ký ức ấy
        </span>
      </Reveal>
    </Stage>
  );
};

/* ================================================================
   sc033 — DI SẢN | LỚP ĐẤT: hai câu chốt đối xứng (s16)
   ================================================================ */
export const Sc033: React.FC<SceneProps> = () => {
  const DUR = 534;
  const A = useA(DUR);
  const a1 = A("Ký ức là di sản");
  const a2 = A("Di truyền là lớp đất");
  const a3 = A("không được trộn hai tầng");

  const half = (
    side: "L" | "R",
    color: string,
    kicker: string,
    line: string,
    a: number
  ) => (
    <div
      style={{
        position: "absolute",
        left: side === "L" ? 0 : 960,
        top: 0,
        width: 960,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          side === "L"
            ? "linear-gradient(180deg, rgba(112,32,26,0.14), rgba(112,32,26,0.30))"
            : "linear-gradient(180deg, rgba(18,84,78,0.14), rgba(18,84,78,0.30))",
      }}
    >
      <Reveal startFrac={Math.max(0.01, a - 12 / DUR)} endFrac={a - 6 / DUR}>
        <div style={{ fontSize: 24, color: C.mute, letterSpacing: 6 }}>{kicker}</div>
      </Reveal>
      <SpringPop startFrac={a}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 84,
            color,
            marginTop: 26,
            textAlign: "center",
            maxWidth: 820,
            lineHeight: 1.18,
          }}
        >
          {line}
        </div>
      </SpringPop>
    </div>
  );

  return (
    <Stage dur={DUR}>
      {half("L", C.lampRed, "TẦNG MỘT", "Ký ức là di sản.", a1)}
      {half("R", C.teal, "TẦNG HAI", "Di truyền là lớp đất.", a2)}

      {/* đường chia mảnh — sáng lên khi chốt "không trộn" */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={960} y1={140} x2={960} y2={940} stroke={`${C.mute}55`} strokeWidth={2} />
      </svg>
      <InkDraw
        d="M960 140 L960 940"
        startFrac={a3}
        endFrac={a3 + 30 / DUR}
        stroke={C.amber}
        strokeWidth={3}
        style={{ position: "absolute", inset: 0 }}
      />

      <Reveal
        startFrac={a3 + 10 / DUR}
        endFrac={a3 + 16 / DUR}
        style={{ position: "absolute", left: 0, right: 0, top: 972, textAlign: "center" }}
      >
        <span style={{ fontSize: 28, color: C.cream }}>
          đêm nay ta cần cả hai — không được trộn hai tầng thành một hỗn hợp
        </span>
      </Reveal>
    </Stage>
  );
};
