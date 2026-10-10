// VN-Myth Ep.05 scenes sc001–sc011 — mở tập: hero title, device bản đồ đèn
// (BASE img-sc002 + đèn TSX), tease tắt đèn, câu hỏi ngược, bách=trăm, DNA,
// ba cái tên, giới thiệu device + legend.
// Anchors speech-lock từ narration_words (check_anchors.py đã verify).
import React from "react";
import { useCurrentFrame } from "remotion";
import {
  Chip,
  InkDraw,
  InkImageScene,
  Lamp,
  MAP_LAMPS,
  MAP_LAMP_ROLLCALL,
  MapCanvas,
  MapLabel,
  Paper,
  Reveal,
  SourceTag,
  SpringPop,
  TextCard,
  circleD,
  useA,
  useFrac,
  ease,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

// sc001 — MỞ TẬP HERO TITLE
export const Sc001: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("Ngày");
  const a2 = A("toàn");
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Reveal startFrac={0.01} endFrac={0.1}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 8, color: C.amber }}>
            VN-MYTH · CHUYỆN KỂ VIỆT NAM · TẬP 05
          </div>
        </Reveal>
        <SpringPop startFrac={0.04} style={{ marginTop: 30 }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 190,
              lineHeight: 1,
              color: C.white,
              textShadow: "0 0 60px rgba(217,164,65,0.25)",
            }}
          >
            BÁCH VIỆT
          </div>
        </SpringPop>
        <Reveal startFrac={0.12} endFrac={0.2}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 60, color: C.cream, marginTop: 26 }}>
            một trăm nước đã biến mất đâu?
          </div>
        </Reveal>
        <Reveal startFrac={a1 + 0.06} endFrac={a1 + 0.14}>
          <div
            style={{
              marginTop: 48,
              width: 900,
              height: 2,
              background: `linear-gradient(90deg, rgba(217,164,65,0), ${C.amber}, rgba(217,164,65,0))`,
            }}
          />
        </Reveal>
        <Reveal startFrac={a2} endFrac={a2 + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.mute, marginTop: 26 }}>
            Ngày xưa — nửa dưới trời Nam, toàn là nước Việt.
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc002 — BẢN ĐỒ GIẤY DẦU ĐÈN SÁNG: 5 đèn điểm danh theo narration + 百越 etch
export const Sc002: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const etch = A("chỉ"); // «chỉ thấy một chữ ấy»
  // 5 tên được đọc TRƯỚC cửa scene (provisional S2 split) → cascade clamped tại start
  const lightAt: Record<string, number> = {
    man: 0.03,
    dongau: 0.065,
    nam: 0.1,
    tayau: 0.135,
    lac: 0.17,
  };
  return (
    <MapCanvas dim={0.18}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {MAP_LAMP_ROLLCALL.map((k) => {
          const L = MAP_LAMPS[k];
          const lit = ease(p(lightAt[k], lightAt[k] + 0.05));
          return <Lamp key={k} x={L.x} y={L.y} scale={1.15} lit={lit} />;
        })}
      </svg>
      {MAP_LAMP_ROLLCALL.map((k) => {
        const L = MAP_LAMPS[k];
        return <MapLabel key={k} x={L.x} y={L.y} text={L.label} startFrac={lightAt[k] + 0.03} />;
      })}
      {/* 百越 góc trên — etch khi «chỉ thấy một chữ ấy» */}
      <div style={{ position: "absolute", top: 52, right: 88, textAlign: "right" }}>
        <InkDraw
          d="M 40 180 L 300 180"
          startFrac={etch}
          endFrac={etch + 0.06}
          viewBox="0 0 340 200"
          width={340}
          height={200}
          stroke={C.amber}
          strokeWidth={5}
          style={{ position: "absolute", top: 96, right: 0 }}
        />
        <SpringPop startFrac={etch + 0.02}>
          <div style={{ fontFamily: FONT.hanzi, fontWeight: 700, fontSize: 120, color: C.amber, lineHeight: 1 }}>
            百越
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.cream, marginTop: 8 }}>
            Bách Việt — «trăm Việt»
          </div>
        </SpringPop>
      </div>
      <SourceTag text="Bản đồ tư thế: người Hán đứng phía bắc Trường Giang, nhìn xuống phương Nam" bottom={42} />
    </MapCanvas>
  );
};

// sc003 — TẮT NHƯ ĐÈN (tease payoff): đèn tắt dần, chỉ còn MỘT đèn đỏ
export const Sc003: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame } = useFrac();
  const su = A("Sử");
  const offAt: Record<string, number> = { dongau: 0.1, man: 0.2, nam: 0.3, tayau: 0.4 };
  const redAt = 0.48;
  const dim = ease(p(0.06, 0.5));
  return (
    <MapCanvas dim={dim}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {(["dongau", "man", "nam", "tayau"] as const).map((k) => {
          const L = MAP_LAMPS[k];
          const out = ease(p(offAt[k], offAt[k] + 0.07));
          return <Lamp key={k} x={L.x} y={L.y} scale={1.15} lit={1 - out} />;
        })}
        <Lamp
          x={MAP_LAMPS.lac.x}
          y={MAP_LAMPS.lac.y}
          scale={1.3}
          lit={ease(p(redAt, redAt + 0.06))}
          mode="red"
          pulse={frame / 18}
        />
      </svg>
      <MapLabel x={MAP_LAMPS.lac.x} y={MAP_LAMPS.lac.y} text="Lạc Việt" startFrac={redAt + 0.05} color={C.lampRed} />
      <Reveal startFrac={su} endFrac={su + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 96,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 52,
            color: C.cream,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          Mọi thứ bạn sắp xem — nằm trong <span style={{ color: C.amber }}>Sử ký Tư Mã Thiên</span>.
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc004 — SƠ ĐỒ VIRAL CALLBACK (ảnh gen BASE + overlay đỏ)
export const Sc004: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a1 = A("sơ"); // «sơ đồ tô đỏ khổng lồ»
  const a2 = A("tổ"); // «tổ tiên khổng lồ»
  const ring = ease(p(a1, a1 + 0.12));
  return (
    <InkImageScene src="img-sc004.png" focus={{ x: 0.62, y: 0.44 }}>
      {/* vòng đỏ khoanh vùng tô đỏ khổng lồ trong ảnh (focal overlay) */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path
          d={circleD(1190, 480, 300)}
          fill="none"
          stroke={C.warn}
          strokeWidth={8}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ring}
          opacity={0.9}
          transform="rotate(-6 1190 480)"
        />
      </svg>
      <Reveal startFrac={a1 + 0.06} endFrac={a1 + 0.14}>
        <div
          style={{
            position: "absolute",
            top: 88,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 54,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            background: "rgba(20,17,13,0.74)",
            padding: "14px 30px",
            borderRadius: 10,
          }}
        >
          tấm sơ đồ từng «viral»: <span style={{ color: C.warn }}>vùng tô đỏ khổng lồ</span>
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div style={{ position: "absolute", bottom: 104, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.warn}>«tổ tiên khổng lồ» — thật ra là gì?</Chip>
        </div>
      </Reveal>
    </InkImageScene>
  );
};

// sc005 — CÂU HỎI NGƯỢC
export const Sc005: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("gỡ");
  const a2 = A("trăm");
  return (
    <TextCard eyebrow="CÂU HỎI NGƯỢC" title="" startFrac={0.05}>
      <Reveal startFrac={0.06} endFrac={0.16}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 88, lineHeight: 1.2, color: C.white }}>
          Nếu Bách Việt thật sự là một dân tộc…
        </div>
      </Reveal>
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 36,
            color: C.mute,
            marginTop: 30,
            textAlign: "center",
          }}
        >
          thì đêm nay, ta gỡ được mắt xích đầu tiên.
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 66,
            color: C.amber,
            marginTop: 36,
            textAlign: "center",
          }}
        >
          …thì trăm nước Việt trong sử Hán là gì?
        </div>
      </Reveal>
    </TextCard>
  );
};

// sc006 — BẢN ĐỒ MINI ĐÁNH NHAU: chấm Việt + mũi tên đan xen
export const Sc006: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a1 = A("đánh");
  const a2 = A("nhờ");
  const pts = [
    { x: 560, y: 300 },
    { x: 880, y: 250 },
    { x: 1180, y: 380 },
    { x: 760, y: 560 },
    { x: 1080, y: 700 },
    { x: 620, y: 760 },
  ];
  return (
    <Paper>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path
          d="M 300 120 Q 700 60 1100 160 Q 1500 260 1440 480 Q 1400 700 1000 860 Q 640 980 420 820"
          fill="none"
          stroke={C.border}
          strokeWidth={4}
          opacity={0.7}
        />
        {pts.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r={10} fill={C.cream} opacity={ease(p(0.04 + i * 0.02, 0.1 + i * 0.02))} />
          </g>
        ))}
        {/* mũi tên đan xen A đánh B */}
        {[
          { x: 560, y: 300, dx: 320, dy: -50, s: a1 },
          { x: 880, y: 250, dx: 300, dy: 130, s: a1 + 0.05 },
          { x: 1180, y: 380, dx: -420, dy: 180, s: a1 + 0.1 },
          { x: 760, y: 560, dx: 320, dy: 140, s: a1 + 0.15 },
          { x: 1080, y: 700, dx: -460, dy: 60, s: a1 + 0.2 },
        ].map((ar, i) => (
          <g key={i}>
            <line
              x1={ar.x}
              y1={ar.y}
              x2={ar.x + ar.dx * ease(p(ar.s, ar.s + 0.1))}
              y2={ar.y + ar.dy * ease(p(ar.s, ar.s + 0.1))}
              stroke={C.warn}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={0.85}
            />
          </g>
        ))}
      </svg>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 90,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 42,
            color: C.cream,
            background: "rgba(20,17,13,0.74)",
            padding: "18px 40px",
          }}
        >
          Người Việt đánh người Việt — <span style={{ color: C.amber }}>nhờ cả quân Hán</span> xuống diệt lẫn nhau.
        </div>
      </Reveal>
    </Paper>
  );
};

// sc007 — BÁCH = TRĂM (ƯỚC LỆ)
export const Sc007: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("Bách", 3);
  const a2 = A("như", 2);
  return (
    <TextCard eyebrow="ƯỚC LỆ NGÔN NGỮ" title="" startFrac={0.04}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 36, justifyContent: "center", marginTop: 20 }}>
        <SpringPop startFrac={a1}>
          <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 150, color: C.amber }}>bách</span>
        </SpringPop>
        <SpringPop startFrac={a1 + 0.04}>
          <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 96, color: C.mute }}>=</span>
        </SpringPop>
        <SpringPop startFrac={a1 + 0.08}>
          <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 150, color: C.white }}>trăm</span>
        </SpringPop>
      </div>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, marginTop: 36, textAlign: "center" }}>
          ước lệ nghĩa là <span style={{ color: C.amber }}>«nhiều»</span> — như trăm họ, trăm nghề.
        </div>
      </Reveal>
      <Reveal startFrac={a2 + 0.18} endFrac={a2 + 0.26}>
        <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.mute, marginTop: 24, textAlign: "center" }}>
          không ai đếm đúng từng nước.
        </div>
      </Reveal>
    </TextCard>
  );
};

// sc008 — C1 CALLBACK: DNA (quote teal)
export const Sc008: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("không");
  return (
    <Paper variant="teal">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "rgba(16,20,20,0.9)",
            border: `3px solid ${C.teal}`,
            borderRadius: 10,
            padding: "60px 76px",
            maxWidth: 1520,
          }}
        >
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 4,
              color: C.teal,
              marginBottom: 24,
            }}
          >
            CALLBACK TẬP 01 — GÓC KHOA HỌC
          </div>
          <Reveal startFrac={0.08} endFrac={0.2}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 72, color: C.white, lineHeight: 1.3 }}>
              DNA khẳng định:
            </div>
          </Reveal>
          <Reveal startFrac={a1} endFrac={a1 + 0.1}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.teal, marginTop: 18 }}>
              không hề có một mã gene nào tên là «Bách Việt».
            </div>
          </Reveal>
        </div>
      </div>
    </Paper>
  );
};

// sc009 — BA CÁI TÊN CÓ THẬT: Mân · Nam · Đông sáng theo narration
export const Sc009: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a1 = A("Mân"); // «Mân Việt có thật…»
  const aEnd = 0.9; // «trên bản đồ — và trong sách» (clamped)
  const names = [
    { k: "man", s: a1, t: "Mân Việt — có thật" },
    { k: "nam", s: a1 + 0.12, t: "Nam Việt — có thật" },
    { k: "dongau", s: a1 + 0.24, t: "Đông Việt — có thật" },
  ];
  return (
    <MapCanvas dim={0.5}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {names.map((n) => {
          const L = MAP_LAMPS[n.k as keyof typeof MAP_LAMPS];
          return <Lamp key={n.k} x={L.x} y={L.y} scale={1.1} lit={ease(p(n.s, n.s + 0.06))} />;
        })}
      </svg>
      {names.map((n) => {
        const L = MAP_LAMPS[n.k as keyof typeof MAP_LAMPS];
        return <MapLabel key={n.k} x={L.x} y={L.y} text={n.t} startFrac={n.s + 0.04} />;
      })}
      <Reveal startFrac={aEnd} endFrac={aEnd + 0.06}>
        <div
          style={{
            position: "absolute",
            bottom: 90,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <Chip color={C.amber}>trên bản đồ — và trong sách.</Chip>
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc010 — GIỚI THIỆU DEVICE: tờ giấy dầu + đèn dọc bờ biển + 1 đèn hụt
export const Sc010: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aPaper = A("tờ"); // «tờ giấy dầu nâu»
  const aLamp = A("mỗi"); // «mỗi nước Việt là một ngọn đèn»
  const aSlow = A("Chậm"); // «Chậm rãi. Đúng niên đại.»
  const spread = ease(p(0.04, 0.16));
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 1300 + 300 * spread,
            height: 520 + 160 * spread,
            background: "rgba(48,38,26,0.92)",
            border: `2px solid ${C.earth}`,
            borderRadius: 8,
            transform: `scale(${0.9 + 0.1 * spread})`,
            boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
            padding: "40px 60px",
            opacity: 0.5 + 0.5 * spread,
          }}
        >
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.earthGlow }}>
            quy tắc đêm nay —
          </div>
          <Reveal startFrac={aPaper} endFrac={aPaper + 0.08}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 62, color: C.white, marginTop: 18 }}>
              một tờ giấy dầu nâu, trải dọc bờ biển phương Nam.
            </div>
          </Reveal>
          <div style={{ display: "flex", gap: 60, marginTop: 44, alignItems: "center" }}>
            <svg width={220} height={140} viewBox="0 0 220 140">
              <Lamp x={110} y={80} scale={1} lit={ease(p(aLamp, aLamp + 0.08))} />
            </svg>
            <Reveal startFrac={aLamp} endFrac={aLamp + 0.08}>
              <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream }}>
                mỗi nước Việt là <span style={{ color: C.lampGlow }}>một ngọn đèn</span>.
              </div>
            </Reveal>
          </div>
          <Reveal startFrac={aSlow} endFrac={aSlow + 0.06}>
            <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.amber, marginTop: 30 }}>
              Chậm rãi. Đúng niên đại.
            </div>
          </Reveal>
        </div>
      </div>
    </Paper>
  );
};

// sc011 — CHÚ GIẢI DEVICE (legend card)
export const Sc011: React.FC<SceneProps> = () => {
  useA();
  const a2 = 0.5;
  return (
    <TextCard eyebrow="CHÚ GIẢI" title="" startFrac={0.03}>
      <div style={{ display: "flex", gap: 80, marginTop: 20 }}>
        <div style={{ textAlign: "center" }}>
          <svg width={200} height={150} viewBox="0 0 200 150">
            <Lamp x={100} y={90} scale={1.1} lit={1} />
          </svg>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.lampGlow }}>đèn = tên nước</div>
        </div>
        <div style={{ alignSelf: "center", fontFamily: FONT.display, fontSize: 60, color: C.mute }}>·</div>
        <div style={{ textAlign: "center" }}>
          <svg width={200} height={150} viewBox="0 0 200 150">
            <Lamp x={100} y={90} scale={1.1} lit={0.12} />
          </svg>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.mute }}>
            tắt = tên biến mất khỏi bản đồ
          </div>
        </div>
      </div>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Chip color={C.lampRed}>Ba mốc — ba hồ sơ: 138 · 111 · 110 TCN</Chip>
        </div>
      </Reveal>
    </TextCard>
  );
};
