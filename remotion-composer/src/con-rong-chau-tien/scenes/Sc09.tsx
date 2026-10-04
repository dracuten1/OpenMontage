// sc-09 — Bất đối xứng thần phả. Order (narration): nhánh Rồng có thần phả biển (Động Đình Quân -> mẫu hệ -> Lạc Long Quân)
// -> phía Tiên không có gia phả tương tự -> Âu Cơ chỉ là con gái thủ lĩnh phương Bắc -> chữ "Tiên" là nhãn gán sau.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { InkPath, InterpretFlag, Paper, Reveal, SpringPop, useFrac } from "../common";

const ColCard: React.FC<{
  x: number;
  w: number;
  top: number;
  h: number;
  border: string;
  tint: string;
  children: React.ReactNode;
  opacity: number;
}> = ({ x, w, top, h, border, tint, children, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top,
      width: w,
      height: h,
      boxSizing: "border-box",
      background: tint,
      border: `3px solid ${border}`,
      borderRadius: 18,
      opacity,
      padding: "28px 40px",
    }}
  >
    {children}
  </div>
);

const Link: React.FC<{ start: number; title: string; sub?: string; color: string }> = ({ start, title, sub, color }) => (
  <SpringPop startFrac={start} from={0.9}>
    <div
      style={{
        padding: "12px 22px",
        border: `2px solid ${color}`,
        borderRadius: 12,
        background: "rgba(26,23,20,0.8)",
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.white, lineHeight: 1.15 }}>{title}</div>
      {sub && <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 30, color: C.cream, marginTop: 2 }}>{sub}</div>}
    </div>
  </SpringPop>
);

export const Sc09: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const glow = 0.5 + 0.5 * Math.sin(frame * 0.08);
  const flicker = 0.5 + 0.5 * Math.sin(frame * 0.21) * Math.sin(frame * 0.07);

  const LX = 100;
  const W = 790;
  const RX = 1920 - 100 - W;
  const TOP = 220;
  const H = 700;
  const dividerGlow = ease(p(0.04, 0.12));

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 28% 50%, rgba(47,93,107,0.2), rgba(0,0,0,0) 55%)" }} />

      <Reveal startFrac={0.02} endFrac={0.09} style={{ position: "absolute", top: 52, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white }}>Hai nhánh, hai dạng thần phả</div>
      </Reveal>

      {/* column headers */}
      <Reveal startFrac={0.06} endFrac={0.13} style={{ position: "absolute", left: LX, top: 150, width: W, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: "#8FC0CE" }}>NHÁNH RỒNG</div>
      </Reveal>
      <Reveal startFrac={0.5} endFrac={0.57} style={{ position: "absolute", left: RX, top: 150, width: W, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: C.amber }}>NHÁNH TIÊN</div>
      </Reveal>

      {/* divider */}
      <div
        style={{
          position: "absolute",
          left: 958,
          top: TOP + 10,
          width: 4,
          height: (H - 20) * dividerGlow,
          background: `linear-gradient(to bottom, rgba(217,164,65,0), ${C.amber}, rgba(217,164,65,0))`,
          boxShadow: `0 0 ${14 + 10 * glow}px rgba(217,164,65,0.6)`,
        }}
      />

      {/* LEFT: bright, solid chain */}
      <ColCard x={LX} w={W} top={TOP} h={H} border={C.sea} tint="rgba(47,93,107,0.2)" opacity={ease(p(0.06, 0.14))}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 8 }}>
          <Link start={0.14} title="Thần Long Động Đình Quân" sub="dòng mẫu hệ phương Nam" color="#6FA8B8" />
          <Arrow start={0.22} color="#6FA8B8" />
          <Link start={0.26} title="Long Nữ" sub="mẫu hệ, con gái vua Thủy phủ" color="#6FA8B8" />
          <Arrow start={0.34} color="#6FA8B8" />
          <Link start={0.38} title="Lạc Long Quân" sub="nòi rồng, đứng đầu thủy tộc" color={C.amber} />
        </div>
        <Reveal startFrac={0.44} endFrac={0.5} style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: "#8FC0CE" }}>Một thần phả biển rất rõ ràng</div>
        </Reveal>
      </ColCard>

      {/* RIGHT: dimmer, hollow */}
      <ColCard x={RX} w={W} top={TOP} h={H} border={C.amber} tint="rgba(217,164,65,0.06)" opacity={0.78 * ease(p(0.5, 0.58))}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 8 }}>
          <Reveal startFrac={0.58} endFrac={0.64}>
            <div
              style={{
                padding: "22px 28px",
                border: `3px dashed ${C.mute}`,
                borderRadius: 12,
                textAlign: "center",
                width: 640,
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.cream }}>Tiên phả</div>
              <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 32, color: C.cream, marginTop: 4 }}>không có gia phả tiên giới tương tự</div>
              <div
                style={{
                  position: "absolute",
                  right: 26,
                  top: -10,
                  fontFamily: FONT.display,
                  fontWeight: 800,
                  fontSize: 70,
                  color: C.amber,
                  opacity: 0.55 + 0.45 * flicker,
                }}
              >
                ?
              </div>
            </div>
          </Reveal>
          <Reveal startFrac={0.68} endFrac={0.75}>
            <div style={{ width: 640, boxSizing: "border-box", padding: "18px 28px", border: `2px solid ${C.mute}`, borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.white }}>Âu Cơ</div>
              <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 32, color: C.cream, marginTop: 4 }}>con gái thủ lĩnh phương Bắc</div>
            </div>
          </Reveal>
        </div>

        {/* label tag bật lên */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center" }}>
          <SpringPop startFrac={0.8} from={0.8}>
            <div
              style={{
                padding: "12px 30px",
                background: "rgba(217,164,65,0.16)",
                border: `2px solid ${C.amber}`,
                borderRadius: 40,
                boxShadow: `0 0 ${12 + 14 * flicker}px rgba(217,164,65,0.5)`,
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 34,
                color: C.white,
              }}
            >
              «Tiên» = nhãn biểu tượng gán sau
            </div>
          </SpringPop>
        </div>
      </ColCard>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <InkPath d={`M ${LX + 30} ${TOP + H + 30} L ${LX + W - 30} ${TOP + H + 30}`} startFrac={0.44} endFrac={0.52} stroke="#6FA8B8" strokeWidth={3} />
        <InkPath d={`M ${RX + 30} ${TOP + H + 30} L ${RX + W - 30} ${TOP + H + 30}`} startFrac={0.84} endFrac={0.94} stroke={C.amber} strokeWidth={3} style={{ strokeDasharray: "10 12" }} />
      </svg>
      <InterpretFlag />
    </Paper>
  );
};

const Arrow: React.FC<{ start: number; color: string }> = ({ start, color }) => {
  const { p } = useFrac();
  const t = ease(p(start, start + 0.04));
  return (
    <svg width={40} height={44} viewBox="0 0 40 44" style={{ opacity: t }}>
      <path d={`M20 2 L20 ${2 + 30 * t}`} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <path d="M8 28 L20 42 L32 28" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
