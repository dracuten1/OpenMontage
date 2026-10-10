// VN-Myth Ep.05 scenes sc048–sc058 — tên vs tiếng, trục dân cư, hai lớp đúng/sai,
// ba lá chắn khép lại, công thức series, thư viện, TUYÊN NGÔN + TIMELINE quốc hiệu
// 968 → 1054 → 1804 (climax Hồi bốn).
import React from "react";
import {
  Chip,
  CountUp,
  InkImageScene,
  Lamp,
  Reveal,
  ShieldGlyph,
  SpringPop,
  TextCard,
  TimelineTrack,
  ease,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";
import { Paper } from "./common";

// sc048 — CHỐT TÊN/TIẾNG
export const Sc048: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("tiếng", 3); // «tiếng mẹ đẻ của họ lịm dần rồi mất»
  const a2 = A("tiếng", 4); // «Tiếng thì phải tự tắt»
  return (
    <TextCard eyebrow="TÊN — VÀ TIẾNG" startFrac={0.03}>
      <Reveal startFrac={a1 - 0.14} endFrac={a1 - 0.06}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 70, color: C.cream, textAlign: "center" }}>
          tên — có thể bị đổi bằng <span style={{ color: C.amber }}>một chiếu lệnh</span>.
        </div>
      </Reveal>
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.mute, textAlign: "center", marginTop: 30 }}>
          ở những nơi tên đã tắt, tiếng mẹ đẻ cũng lịm dần rồi mất…
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 78, color: C.white, textAlign: "center", marginTop: 36 }}>
          tiếng — thì phải <span style={{ color: C.warn }}>tự tắt</span>.
        </div>
      </Reveal>
      <Reveal startFrac={a2 + 0.12} endFrac={a2 + 0.2}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.teal, textAlign: "center", marginTop: 30 }}>
          và tiếng ấy — không bao giờ tắt.
        </div>
      </Reveal>
    </TextCard>
  );
};

// sc049 — TRỤC DÂN CƯ LIÊN TỤC (teal)
export const Sc049: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame } = useFrac();
  const aTruc = A("trục"); // «trục dân cư liên tục»
  const aLien = A("liền"); // «liền một mạch»
  const aHang = 0.95; // «hàng nghìn năm» (clamped)
  const glow = 0.5 + 0.5 * Math.abs(Math.sin(frame / 12));
  return (
    <Paper variant="teal">
      <LabBadgeSilent />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* dải bờ biển nam Trung Quốc → bắc Việt Nam, sáng LIỀN MỘT MẠCH */}
        <path
          d="M 1180 120 C 1050 320 900 480 800 640 C 740 760 660 860 560 950"
          fill="none"
          stroke={C.teal}
          strokeWidth={26}
          strokeLinecap="round"
          opacity={0.16}
        />
        <path
          d="M 1180 120 C 1050 320 900 480 800 640 C 740 760 660 860 560 950"
          fill="none"
          stroke={C.teal}
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(p(0.06, aTruc + 0.3))}
          style={{ filter: `drop-shadow(0 0 ${14 * glow}px rgba(127,209,200,0.75))` }}
        />
        <circle cx={1180} cy={120} r={10} fill={C.teal} />
        <circle cx={560} cy={950} r={12} fill={C.teal} opacity={glow} />
      </svg>
      <Reveal startFrac={aTruc} endFrac={aTruc + 0.08}>
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 60,
            color: C.white,
          }}
        >
          trục dân cư liên tục —
        </div>
      </Reveal>
      <Reveal startFrac={aLien} endFrac={aLien + 0.05}>
        <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.teal}>liền một mạch, không đứt đoạn.</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={aHang} endFrac={0.98}>
        <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center", fontFamily: FONT.mono, fontSize: 28, color: C.mute }}>
          suốt hàng nghìn năm.
        </div>
      </Reveal>
    </Paper>
  );
};

/** nhãn teal tĩnh (không phụ thuộc anchor) */
const LabBadgeSilent: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 48,
      left: 64,
      padding: "8px 22px",
      border: `2px solid ${C.teal}`,
      borderRadius: 6,
      color: C.teal,
      background: "rgba(26,23,20,0.78)",
      fontFamily: FONT.body,
      fontWeight: 700,
      fontSize: 28,
      letterSpacing: 3,
    }}
  >
    LỚP KHOA HỌC — DÂN CƯ
  </div>
);

// sc050 — HAI LỚP ĐÚNG/SAI
export const Sc050: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("có"); // «có thật — về dân cư»
  const a2 = A("không", 3); // «Không một dân tộc»
  return (
    <Paper>
      <div style={{ position: "absolute", top: 96, left: 0, right: 0, textAlign: "center" }}>
        <Chip color={C.amber}>ĐỪNG NHẦM HAI LỚP</Chip>
      </div>
      <div
        style={{
          position: "absolute",
          top: 260,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 120,
        }}
      >
        <SpringPop startFrac={a1}>
          <div
            style={{
              width: 700,
              border: `3px solid ${C.teal}`,
              borderRadius: 14,
              background: "rgba(14,20,20,0.88)",
              padding: "48px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.teal, letterSpacing: 3 }}>DÂN CƯ</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.teal, marginTop: 16 }}>
              CÓ THẬT
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 18 }}>
              người Việt cổ sống thật trên đất ấy.
            </div>
          </div>
        </SpringPop>
        <SpringPop startFrac={a2}>
          <div
            style={{
              width: 700,
              border: `3px solid ${C.warn}`,
              borderRadius: 14,
              background: "rgba(28,16,12,0.88)",
              padding: "48px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.warn, letterSpacing: 3 }}>DÂN TỘC THUẦN NHẤT</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.warn, marginTop: 16 }}>
              KHÔNG
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 18 }}>
              «Bách Việt» là cái ô — không phải một dân tộc.
            </div>
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};

// sc051 — BA LÁ CHẮN KHÉP LẠI quanh ngọn đèn đỏ
export const Sc051: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame } = useFrac();
  const a1 = A("vị"); // «vị trí, vì tiếng nói, và vì không chịu im lặng»
  const close = ease(p(a1 + 0.2, 0.85));
  return (
    <Paper variant="night">
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Lamp x={960} y={620} scale={1.6} lit={ease(p(0.02, 0.1))} mode="red" pulse={frame / 15} />
        <ShieldGlyph x={960 - 420 + 200 * close} y={560} scale={0.9} lit={0.9} label="đất" />
        <ShieldGlyph x={960} y={560 - 160 * close} scale={0.9} lit={0.9} label="tiếng nói" />
        <ShieldGlyph x={960 + 420 - 200 * close} y={560} scale={0.9} lit={0.9} label="không im lặng" />
      </svg>
      <div style={{ position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center", display: "flex", gap: 28, justifyContent: "center" }}>
        {[
          { t: "vì vị trí", s: a1 },
          { t: "vì tiếng nói", s: a1 + 0.1 },
          { t: "vì không chịu im lặng", s: a1 + 0.2 },
        ].map((c, i) => (
          <Reveal key={i} startFrac={c.s} endFrac={c.s + 0.05}>
            <Chip color={C.teal}>{c.t}</Chip>
          </Reveal>
        ))}
      </div>
    </Paper>
  );
};

// sc052 — CÔNG THỨC CHUẨN SERIES
export const Sc052: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = 0.02; // «một bộ phận của cộng đồng Bách Việt» (clamped)
  const a2 = A("người", 3); // «người giữ ngọn đèn cuối cùng»
  return (
    <TextCard eyebrow="CÔNG THỨC — CHUẨN SERIES" startFrac={a1}>
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 72, color: C.white, textAlign: "center", lineHeight: 1.3 }}>
          người Việt cổ
          <br />
          <span style={{ color: C.amber }}>= một bộ phận</span> của cộng đồng Bách Việt
        </div>
      </Reveal>
      <Reveal startFrac={a2 - 0.06} endFrac={a2 + 0.02}>
        <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream, textAlign: "center", marginTop: 36 }}>
          bộ phận sống sót —
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 76, color: C.lampRed, textAlign: "center", marginTop: 14 }}>
          người giữ ngọn đèn cuối cùng.
        </div>
      </Reveal>
    </TextCard>
  );
};

// sc053 — TRONG THƯ VIỆN (ảnh gen + 3 bìa sách phát sáng)
export const Sc053: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a1 = A("chỉ"); // «chỉ còn trong thư viện»
  const a2 = 0.95; // «trong quốc hiệu» (clamped tease)
  return (
    <InkImageScene src="img-sc053.png" focus={{ x: 0.5, y: 0.45 }}>
      {/* 3 bìa sách phát sáng nhẹ — overlay focal */}
      {[0, 1, 2].map((i) => {
        const t = ease(p(a1 + i * 0.08, a1 + 0.1 + i * 0.08));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 640 + i * 210,
              top: 470 - i * 24,
              width: 120,
              height: 300,
              border: `3px solid ${C.amber}`,
              borderRadius: 8,
              background: "rgba(48,38,26,0.9)",
              boxShadow: `0 0 ${40 * t}px rgba(217,164,65,${0.45 * t})`,
              opacity: t,
              transform: `rotate(${(i - 1) * 5}deg)`,
            }}
          />
        );
      })}
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 62,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          «Bách Việt» giờ chỉ còn trong thư viện…
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={0.98}>
        <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.lampRed}>…và trong quốc hiệu.</Chip>
        </div>
      </Reveal>
    </InkImageScene>
  );
};

// sc054 — TUYÊN NGÔN CLIMAX
export const Sc054: React.FC<SceneProps> = () => {
  const A = useA();
  const a0 = A("lời", 2); // «lời mẹ ru con»
  const a1 = A("một", 4); // «một chữ Việt còn sống qua hai nghìn năm»
  const a2 = A("chạy"); // «chạy xuyên một nghìn năm Bắc thuộc để trở về»
  return (
    <Paper variant="night">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 160px",
        }}
      >
        <Reveal startFrac={a0} endFrac={a0 + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.mute, letterSpacing: 2 }}>
            như một lời mẹ ru con —
          </div>
        </Reveal>
        <Reveal startFrac={a1} endFrac={a1 + 0.14}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 96,
              color: C.white,
              textAlign: "center",
              lineHeight: 1.25,
              marginTop: 36,
              textShadow: "0 0 50px rgba(217,164,65,0.22)",
            }}
          >
            một chữ Việt —<br />
            còn sống qua <span style={{ color: C.amber }}>hai nghìn năm</span>.
          </div>
        </Reveal>
        <Reveal startFrac={a2} endFrac={a2 + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream, marginTop: 40, textAlign: "center" }}>
            chạy xuyên một nghìn năm Bắc thuộc — để trở về.
          </div>
        </Reveal>
      </div>
      {/* vệt đèn đỏ mờ dưới nền */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, rgba(0,0,0,0), ${C.lampRed}66, rgba(0,0,0,0))`,
        }}
      />
    </Paper>
  );
};

// sc055 — TIMELINE 968: Đinh Bộ Lĩnh — Đại Cồ Việt (scene chủ lực d)
export const Sc055: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame } = useFrac();
  const aNum = A("chín"); // «chín trăm sáu mươi tám»
  const aDinh = A("Đinh"); // «Đinh Bộ Lĩnh»
  const aDai = A("Đại"); // «Đại Cồ Việt»
  return (
    <Paper variant="night">
      <TimelineTrack
        progress={ease(p(aNum, aNum + 0.2))}
        marks={[
          { at: 0.05, year: "968", lit: true },
          { at: 0.38, year: "1054", lit: false },
          { at: 0.92, year: "1804", lit: false },
        ]}
      />
      <svg width={300} height={300} viewBox="0 0 300 300" style={{ position: "absolute", right: 110, top: 90 }}>
        <Lamp x={150} y={170} scale={1.2} lit={ease(p(aNum, aNum + 0.06))} mode="red" pulse={frame / 14} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 190, color: C.white, lineHeight: 1 }}>
          <CountUp to={968} startFrac={aNum} endFrac={aNum + 0.16} style={{ fontSize: 190, fontWeight: 800, fontFamily: FONT.display, color: C.white }} />
        </div>
        <Reveal startFrac={aDinh} endFrac={aDinh + 0.07}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 48, color: C.cream, marginTop: 16 }}>
            Đinh Bộ Lĩnh — <span style={{ color: C.amber }}>Đại Cồ Việt</span>
          </div>
        </Reveal>
        <Reveal startFrac={aDai + 0.05} endFrac={aDai + 0.12}>
          <div style={{ marginTop: 26 }}>
            <Chip color={C.amber}>quốc hiệu đầu tiên — sau hơn 1.000 năm Bắc thuộc</Chip>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc056 — TIMELINE 1054: Lý Thánh Tông — Đại Việt
export const Sc056: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aNum = A("một", 4); // «một nghìn không trăm năm mươi tư»
  const aDai = A("Đại", 2); // «Đại Việt»
  const aCung = A("Cùng", 2); // «Cùng một chữ Việt»
  return (
    <Paper variant="night">
      <TimelineTrack
        progress={ease(p(aNum, aNum + 0.2))}
        marks={[
          { at: 0.05, year: "968", lit: true },
          { at: 0.38, year: "1054", lit: true, accent: C.amber },
          { at: 0.92, year: "1804", lit: false },
        ]}
      />
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 190, color: C.white, lineHeight: 1 }}>
          <CountUp to={1054} startFrac={aNum} endFrac={aNum + 0.16} style={{ fontSize: 190, fontWeight: 800, fontFamily: FONT.display, color: C.white }} />
        </div>
        <Reveal startFrac={aDai - 0.04} endFrac={aDai + 0.04}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 48, color: C.cream, marginTop: 16 }}>
            Lý Thánh Tông — <span style={{ color: C.amber }}>Đại Việt</span>
          </div>
        </Reveal>
        <Reveal startFrac={aCung} endFrac={aCung + 0.08}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, color: C.white, marginTop: 30 }}>
            cùng một chữ Việt — <span style={{ fontFamily: FONT.hanzi, color: C.amber }}>越</span>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc057 — NHẬN RA CHƯA? BA ĐÈN HIỆN LẠI (ghost lamps)
export const Sc057: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame } = useFrac();
  const a1 = 0.02; // «Giống hệt chữ Việt» (clamped)
  const a2 = A("không", 3); // «không chết»
  const ghosts = [
    { x: 560, y: 430, t: "Mân Việt · 閩越" },
    { x: 960, y: 430, t: "Đông Việt · 東越" },
    { x: 1360, y: 430, t: "Nam Việt · 南越" },
  ];
  return (
    <Paper variant="night">
      <TimelineTrack
        progress={1}
        marks={[
          { at: 0.05, year: "968", lit: true },
          { at: 0.38, year: "1054", lit: true },
          { at: 0.92, year: "1804", lit: false },
        ]}
        y={760}
      />
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            top: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 62,
            color: C.cream,
          }}
        >
          nhận ra chưa? — tên cũ nằm im trong quốc hiệu mới,
        </div>
      </Reveal>
      <div style={{ position: "absolute", top: 240, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 120 }}>
        {ghosts.map((g, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <svg width={220} height={220} viewBox="0 0 220 220">
              <Lamp x={110} y={130} scale={1.2} lit={ease(p(a1 + 0.06 + i * 0.1, a1 + 0.14 + i * 0.1))} mode="ghost" />
            </svg>
            <Reveal startFrac={a1 + 0.1 + i * 0.1} endFrac={a1 + 0.18 + i * 0.1}>
              <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute, marginTop: 8 }}>{g.t}</div>
            </Reveal>
          </div>
        ))}
      </div>
      <Reveal startFrac={a2} endFrac={a2 + 0.06}>
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 58,
            color: C.teal,
          }}
        >
          cố xóa — không chết. nằm im trong tiếng nói — chờ đúng lúc trở lại.
        </div>
      </Reveal>
      <svg width={220} height={220} viewBox="0 0 220 220" style={{ position: "absolute", right: 120, bottom: 60 }}>
        <Lamp x={110} y={130} scale={1} lit={ease(p(a2, a2 + 0.1))} mode="red" pulse={frame / 13} />
      </svg>
    </Paper>
  );
};

// sc058 — TIMELINE KHÉP: 1804 — VIỆT NAM (dual-tone syllables)
export const Sc058: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aNum = A("một", 2); // «một nghìn tám trăm lẻ bốn»
  const aVN = A("Việt"); // «Việt Nam»
  const aHai = A("hai"); // «hai tiếng chỉ một hành trình dài»
  return (
    <Paper variant="night">
      <TimelineTrack
        progress={ease(p(aNum, aNum + 0.24))}
        marks={[
          { at: 0.05, year: "968", lit: true },
          { at: 0.38, year: "1054", lit: true },
          { at: 0.92, year: "1804", lit: true, accent: C.lampRed },
        ]}
      />
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 190, color: C.white, lineHeight: 1 }}>
          <CountUp to={1804} startFrac={aNum} endFrac={aNum + 0.16} style={{ fontSize: 190, fontWeight: 800, fontFamily: FONT.display, color: C.white }} />
        </div>
        <Reveal startFrac={aVN - 0.02} endFrac={aVN + 0.06}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 48, color: C.cream, marginTop: 16 }}>
            Gia Long —
          </div>
        </Reveal>
        <Reveal startFrac={aVN} endFrac={aVN + 0.08}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 120, marginTop: 10 }}>
            <span style={{ color: C.amber }}>Việt</span>
            <span style={{ color: C.white }}> Nam</span>
          </div>
        </Reveal>
        <Reveal startFrac={aHai} endFrac={aHai + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream, marginTop: 24 }}>
            hai tiếng — chỉ một hành trình dài.
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};
