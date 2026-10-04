import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, LabBadge, Reveal, SceneTitle, InkPath, SourceTag, useFrac } from "../common";

// Sc22 - Di chỉ Mán Bạc & mô hình hòa huyết hai nguồn (Lipson 2018).
// Order (narration s11 tail): Mán Bạc, Ninh Bình -> cuối Đá mới, 4.100-3.600 năm trước ->
// cư dân nông nghiệp di cư từ phương Bắc -> thợ săn hái lượm bản địa -> hòa huyết.

const MAP =
  "M80,60 L130,30 L190,38 L230,70 L270,90 L300,130 L290,170 L270,205 L255,240 L275,290 L300,350 L310,420 L330,490 L360,560 L380,620 L360,690 L310,740 L270,770 L240,740 L250,690 L270,640 L240,580 L215,500 L200,420 L170,350 L150,300 L120,250 L90,200 L100,150 L70,110 Z";

const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  startFrac: number;
  color: string;
  title: string;
  sub: string;
}> = ({ x, y, w, h, startFrac, color, title, sub }) => (
  <Reveal startFrac={startFrac} endFrac={startFrac + 0.08} dy={20} style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        background: C.card,
        border: `2px solid ${color}`,
        borderRadius: 12,
        padding: "20px 30px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 48, color: C.white, lineHeight: 1.15 }}>{title}</div>
      <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 8, lineHeight: 1.35 }}>{sub}</div>
    </div>
  </Reveal>
);

export const Sc22: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  const pulse = 0.5 + 0.5 * Math.sin((frame / dur) * Math.PI * 16);
  const markerT = ease(p(0.06, 0.14));
  const flow = (frame / dur) * 14;
  const dash = (n: number) => ({ strokeDasharray: "18 14", strokeDashoffset: -(flow * 40 + n) });

  return (
    <Paper variant="lab">
      <LabBadge />
      <div style={{ position: "absolute", left: 64, top: 112 }}>
        <SceneTitle title="Di chỉ Mán Bạc, Ninh Bình" titleSize={64} accent={C.teal} startFrac={0.01} maxWidth={1200} />
      </div>

      {/* map */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform="translate(100,235) scale(0.85)">
          <path d={MAP} fill="rgba(127,209,200,0.05)" stroke="none" style={{ opacity: ease(p(0.03, 0.1)) }} />
          <InkPath d={MAP} startFrac={0.03} endFrac={0.12} stroke={C.cream} strokeWidth={4} />
          {/* marker */}
          <g style={{ opacity: markerT }}>
            <circle cx={235} cy={225} r={22 + 26 * pulse} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.7 - 0.5 * pulse} />
            <circle cx={235} cy={225} r={22} fill="rgba(127,209,200,0.22)" stroke={C.teal} strokeWidth={4} />
            <circle cx={235} cy={225} r={9} fill={C.teal} />
          </g>
        </g>
        {/* marker label */}
        <g style={{ opacity: markerT }}>
          <path d="M318,426 L420,426" stroke={C.teal} strokeWidth={3} />
        </g>
      </svg>
      <Reveal startFrac={0.08} endFrac={0.16} dy={10} style={{ position: "absolute", left: 430, top: 388 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: C.teal }}>Mán Bạc</div>
      </Reveal>

      {/* date frame */}
      <Reveal startFrac={0.16} endFrac={0.26} dy={16} style={{ position: "absolute", left: 700, top: 232 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 26,
            border: `3px solid ${C.teal}`,
            borderRadius: 12,
            padding: "14px 34px",
            background: "rgba(127,209,200,0.08)",
            boxShadow: `0 0 ${24 + 18 * pulse}px rgba(127,209,200,0.25)`,
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 72, color: C.white }}>4.100–3.600</div>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream }}>năm trước</div>
        </div>
      </Reveal>
      <Reveal startFrac={0.2} endFrac={0.3} dy={10} style={{ position: "absolute", left: 700, top: 368 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream }}>Cuối thời đại Đá mới</div>
      </Reveal>

      {/* flow diagram */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
        <InkPath d="M1230,500 C1330,500 1340,590 1440,610" startFrac={0.38} endFrac={0.5} stroke={C.cream} strokeWidth={5} />
        <InkPath d="M1230,800 C1330,800 1340,720 1440,700" startFrac={0.58} endFrac={0.7} stroke={C.teal} strokeWidth={5} />
        <path
          d="M1230,500 C1330,500 1340,590 1440,610"
          fill="none"
          stroke={C.white}
          strokeWidth={5}
          opacity={ease(p(0.5, 0.54)) * 0.5}
          {...dash(0)}
        />
        <path
          d="M1230,800 C1330,800 1340,720 1440,700"
          fill="none"
          stroke={C.white}
          strokeWidth={5}
          opacity={ease(p(0.7, 0.74)) * 0.5}
          {...dash(20)}
        />
      </svg>

      <Card
        x={700}
        y={430}
        w={530}
        h={190}
        startFrac={0.34}
        color={C.cream}
        title="Nông dân Đông Á"
        sub="cư dân nông nghiệp di cư từ phương Bắc"
      />
      <Card
        x={700}
        y={710}
        w={530}
        h={190}
        startFrac={0.54}
        color={C.teal}
        title="Thợ săn hái lượm"
        sub="cư dân bản địa sâu"
      />

      {/* result node */}
      <Reveal startFrac={0.74} endFrac={0.84} dy={20} style={{ position: "absolute", left: 1440, top: 540, width: 416 }}>
        <div
          style={{
            boxSizing: "border-box",
            textAlign: "center",
            background: "rgba(127,209,200,0.12)",
            border: `3px solid ${C.teal}`,
            borderRadius: 14,
            padding: "24px 18px",
            boxShadow: `0 0 ${30 + 30 * pulse}px rgba(127,209,200,0.3)`,
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: C.teal }}>HÒA HUYẾT</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.white, marginTop: 6 }}>Mán Bạc</div>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 6 }}>quy mô lớn</div>
        </div>
      </Reveal>
      <Reveal startFrac={0.88} endFrac={0.96} dy={10} style={{ position: "absolute", left: 1440, top: 800, width: 416 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, textAlign: "center", lineHeight: 1.35 }}>
          đặc trưng của nhóm nói tiếng Nam Á
        </div>
      </Reveal>

      <SourceTag text="Lipson et al., Science (2018)" />
    </Paper>
  );
};
