// VN-Myth Ep.03 — scenes group A: sc-01..sc-12 (hook, recap Ep.02, hai rail đối chứng,
// quote scrolls Toàn thư, chức danh không mặt, legend stat, tục chổ mình, bản đồ, Hồi một).
// Speech-lock: mọi animation fire tại A("từ", occ) — nhịp chữ đang được ĐỌC.
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  InkDraw,
  InkImageScene,
  LabBadge,
  LegendFrame,
  Paper,
  Reveal,
  SoundRipples,
  SourceTag,
  SpringPop,
  StrikeThrough,
  useA,
  useFrac,
  ease,
} from "./common";
import refF05 from "../../../projects/vua-hung-trong-dong/assets/reference/f05-tram-trung.png";
import refF07 from "../../../projects/vua-hung-trong-dong/assets/reference/f07-hung-vuong.png";

// === sc-01 === HOOK — thẻ mở tập: Văn Lang + chữ tan thành hạt đất
export const Sc01: React.FC<SceneProps> = () => {
  const A = useA();
  const tTitle = A("Văn", 1);
  const tTagline = A("sống", 1);
  const tHan = A("chữ", 1);
  const { frame, dur } = useFrac();
  // hạt đất nâu rơi khi chữ tan
  const grains = Array.from({ length: 26 }, (_, i) => i);
  // FIX-01: triện tan từ max(tHan+0.012, tTagline-0.1) và hết TRƯỚC khi tagline
  // «Không một dòng chữ nào…» (anchor 'sống') hiện — cửa sổ tự co để kịp tắt.
  const tDissolveOut = Math.max(tHan + 0.012, tTagline - 0.1);
  const dissolve = ease(
    Math.max(
      0,
      Math.min(
        1,
        (frame - tDissolveOut * dur) /
          (Math.max(0.02, tTagline - 0.03 - tDissolveOut) * dur)
      )
    )
  );
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Reveal startFrac={0.01} endFrac={0.05}>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: 8,
              color: C.amber,
              marginBottom: 28,
            }}
          >
            VN-MYTH · TẬP 3
          </div>
        </Reveal>
        <SpringPop startFrac={tTitle} from={0.86}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 176,
              lineHeight: 1.05,
              color: C.white,
              textShadow: "0 6px 30px rgba(0,0,0,0.6)",
            }}
          >
            VĂN LANG
          </div>
        </SpringPop>
        <Reveal startFrac={tTagline} endFrac={tTagline + 0.06}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 52,
              color: C.cream,
              marginTop: 30,
              textAlign: "center",
            }}
          >
            «Không một dòng chữ nào của nó còn sống sót.»
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 38,
              color: C.cream,
              marginTop: 20,
              textAlign: "center",
            }}
          >
            Vậy sao ta tin là nó từng tồn tại?
          </div>
        </Reveal>
      </AbsoluteFill>
      {/* chữ triện mực kem trên nền amber mờ dần — tan thành hạt đất */}
      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {[
          "M300 300 h120 v26 h-120 z M330 340 v90 M390 340 v90 M310 440 h100",
          "M520 280 l80 30 v140 l-80 -30 z M540 330 h40 M540 380 h40",
          "M740 300 q60 -40 120 0 v150 q-60 40 -120 0 z M780 340 h40",
          "M960 290 h130 v22 h-130 z M985 316 v150 M1065 316 v150",
          "M1180 300 q65 -45 125 0 l-20 160 q-50 35 -90 0 z",
          "M1380 300 h120 v26 h-120 z M1410 336 v110 M1460 336 v110 M1392 452 h96",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            fill={i % 2 ? "rgba(232,220,200,0.10)" : "none"}
            stroke={C.cream}
            strokeWidth={4}
            opacity={0.1 * (1 - dissolve) * ease(Math.max(0, Math.min(1, (frame - (tHan + i * 0.012) * dur) / (0.08 * dur))))}
            transform={`translate(0, ${320 + dissolve * (30 + i * 14)}) rotate(${dissolve * (i - 2.5) * 4}, 1000, 720)`}
          />
        ))}
        {dissolve > 0 &&
          grains.map((i) => {
            const gx = 240 + (i * 143) % 1440;
            const gy = ((frame * (6 + (i % 5) * 3) + i * 97) % 1300) - 100;
            return (
              <circle
                key={`g${i}`}
                cx={gx}
                cy={gy}
                r={2 + (i % 4)}
                fill={C.earth}
                opacity={dissolve * 0.8}
              />
            );
          })}
      </svg>
      <SourceTag text="Huyền sử Việt Nam — VN-MYTH Ep.03" bottom={48} right />
    </Paper>
  );
};

// === sc-02 === ĐIỂM DANH TRỐNG RỖNG + MẶT CẮT ĐẤT + SÓNG ÂM TRỐNG
export const Sc02: React.FC<SceneProps> = () => {
  const A = useA();
  const tRoll = A("nhưng", 1);
  const tBlow = A("chép", 2);
  const tBlank = A("tên", 3);
  const tEarth = A("Đêm", 1);
  const tLabel = A("nền", 1);
  const tRipple = A("thứ", 1);
  const tQuote = A("tiếng", 1);
  const { frame, dur } = useFrac();
  const blow = ease(Math.max(0, Math.min(1, (frame - tBlow * dur) / (0.12 * dur))));
  const earth = ease(Math.max(0, Math.min(1, (frame - tEarth * dur) / (0.14 * dur))));
  const slots = Array.from({ length: 9 }, (_, i) => i);
  return (
    <Paper variant="earth">
      {/* điểm danh 18 đời — các ô tên trống */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 120 }}>
        <Reveal startFrac={tRoll} endFrac={tRoll + 0.05}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: C.amber }}>
            TRUYỀN THUYẾT KỂ: 18 ĐỜI VUA HÙNG
          </div>
        </Reveal>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            maxWidth: 1400,
            justifyContent: "center",
            gap: 14,
            marginTop: 34,
          }}
        >
          {slots.map((i) => (
            <div
              key={i}
              style={{
                width: 200,
                height: 64,
                border: `2px dashed ${C.border}`,
                borderRadius: 8,
                opacity: (1 - blow) * ease(Math.max(0, Math.min(1, (frame - (tRoll + 0.02 + i * 0.014) * dur) / (0.05 * dur)))),
                transform: `translateX(${blow * (60 + i * 30)}px) translateY(${blow * -20}px) rotate(${blow * i * 2}deg)`,
                background: "rgba(36,31,26,0.6)",
              }}
            />
          ))}
        </div>
        <Reveal startFrac={tBlank} endFrac={tBlank + 0.06}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 62, color: C.white, marginTop: 40 }}>
            «Cả một triều đại — không một cái tên.»
          </div>
        </Reveal>
      </AbsoluteFill>
      {/* mặt cắt đất sông Hồng nâng lên */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g opacity={earth}>
          <rect x="0" y={1080 - earth * 320} width="1920" height="340" fill={C.earthDeep} />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x="0"
              y={1080 - earth * 320 + 40 + i * 70}
              width="1920"
              height={5}
              fill={C.earth}
              opacity={0.8 - i * 0.15}
            />
          ))}
        </g>
      </svg>
      <Reveal startFrac={tLabel} endFrac={tLabel + 0.06} style={{ position: "absolute", bottom: 190, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.cream, background: "rgba(26,23,20,0.72)", padding: "10px 28px", borderRadius: 8 }}>
          Chứng nhân không biết nói dối: NỀN ĐẤT SÔNG HỒNG
        </span>
      </Reveal>
      <SoundRipples cx={960} cy={620} startFrac={tRipple} count={4} maxR={760} color={C.amber} />
      <SpringPop startFrac={tQuote} from={0.9} style={{ position: "absolute", bottom: 66, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, color: C.amber, background: "rgba(20,17,13,0.8)", padding: "14px 36px", borderRadius: 10 }}>
          «Không tìm thấy tên vua — tìm thấy tiếng trống.»
        </span>
      </SpringPop>
    </Paper>
  );
};

// === sc-03 === RECAP EP.02 — bọc trứng → Hùng Vương silhouette + legend stat
const RecapPlate: React.FC<{ tCross: number }> = ({ tCross }) => {
  const { frame, dur } = useFrac();
  const t = Math.max(0, Math.min(1, frame / Math.max(1, dur - 1)));
  const cross = ease(Math.max(0, Math.min(1, (frame - tCross * dur) / (0.12 * dur))));
  const style: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };
  return (
    <AbsoluteFill>
      <Img
        src={refF05}
        style={{ ...style, opacity: 1 - cross, transform: `scale(${1.05 + t * 0.04})`, filter: "brightness(0.9)" }}
      />
      <Img
        src={refF07}
        style={{ ...style, opacity: cross, transform: `scale(${1.06 + t * 0.04})`, filter: "brightness(0.9)" }}
      />
    </AbsoluteFill>
  );
};

export const Sc03: React.FC<SceneProps> = () => {
  const A = useA();
  const tCross = A("xưng", 1);
  const tStat = A("chứng", 1);
  return (
    <Paper>
      <RecapPlate tCross={tCross} />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(26,23,20,0.88) 0%, rgba(26,23,20,0.55) 46%, rgba(26,23,20,0.1) 75%)",
        }}
      />
      <div style={{ position: "absolute", left: 96, top: 210, width: 760 }}>
        <Reveal startFrac={0.03} endFrac={0.09}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>
            TẬP TRƯỚC · ĐIỂM DỪNG
          </div>
        </Reveal>
        <Reveal startFrac={0.06} endFrac={0.14}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, lineHeight: 1.25, color: C.white, marginTop: 20 }}>
            Bọc trăm trứng nở trăm người con — người con trưởng ở lại Phong Châu, lên ngôi, xưng Hùng Vương.
          </div>
        </Reveal>
      </div>
      <SpringPop startFrac={tStat} from={0.9} style={{ position: "absolute", right: 84, bottom: 150, width: 560 }}>
        <LegendFrame>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.white, lineHeight: 1.2 }}>
            18 đời Hùng Vương
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 12 }}>
            — nước <span style={{ color: C.amber }}>Văn Lang</span>
          </div>
        </LegendFrame>
      </SpringPop>
    </Paper>
  );
};

// === sc-04 === HAI RAIL ĐỐI CHỨNG: CỔ THƯ ↔ NỀN ĐẤT
export const Sc04: React.FC<SceneProps> = () => {
  const A = useA();
  const tQ = A("dựng", 1);
  const tCo = A("cổ", 1);
  const tDat = A("nền", 1);
  const tRule = A("tra", 1);
  return (
    <Paper>
      <Reveal startFrac={tQ} endFrac={tQ + 0.07} style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, color: C.white }}>
          «Vị vua mở đầu kia có thật không?»
        </span>
      </Reveal>
      {/* rail trái — CỔ THƯ */}
      <Reveal startFrac={tCo} endFrac={tCo + 0.08} dy={0} style={{ position: "absolute", left: 170, top: 300, width: 560 }}>
        <div style={{ border: `3px solid ${C.amber}`, borderRadius: 12, background: "rgba(36,31,26,0.92)", padding: "36px 40px" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: C.amber }}>CỔ THƯ</div>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, marginTop: 14, lineHeight: 1.4 }}>
            lời chép của <b>người đời sau</b>
          </div>
        </div>
      </Reveal>
      {/* rail phải — NỀN ĐẤT */}
      <Reveal startFrac={tDat} endFrac={tDat + 0.08} dy={0} style={{ position: "absolute", right: 170, top: 300, width: 560 }}>
        <div style={{ border: `3px solid ${C.earth}`, borderRadius: 12, background: "rgba(32,24,16,0.92)", padding: "36px 40px" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: C.earthGlow }}>NỀN ĐẤT</div>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, marginTop: 14, lineHeight: 1.4 }}>
            hiện vật của <b>chính thời ấy</b>
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 8, background: C.earthDeep, borderRadius: 4, marginTop: 12, opacity: 0.85 - i * 0.2 }} />
          ))}
        </div>
      </Reveal>
      <InkDraw d="M960 470 L960 610" startFrac={tRule} endFrac={tRule + 0.05} stroke={C.cream} strokeWidth={5} />
      <Reveal startFrac={tRule + 0.03} endFrac={tRule + 0.12} style={{ position: "absolute", top: 620, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.white, maxWidth: 1500, margin: "0 auto", lineHeight: 1.3 }}>
          Không tin một lời khai —<br />chỉ tin nơi các lời khai <span style={{ color: C.amber }}>độc lập</span> gặp nhau.
        </div>
      </Reveal>
    </Paper>
  );
};

// === sc-05 === QUOTE SCROLL GIẤY DÓ (Toàn thư — dựng nước)
const QUOTE_TOANTHU_1 = [
  "«Con Lạc-Long-Quân, không rõ tên húy.",
  "Đóng đô ở Phong-châu...",
  "Khi Hùng-vương lên ngôi,",
  "dựng nước gọi là nước Văn-Lang...",
  "Chia nước làm mười lăm bộ...»",
];

export const Sc05: React.FC<SceneProps> = () => {
  const A = useA();
  const tScroll = A("nguyên", 1);
  const tLines = [A("Con", 1), A("Đóng", 1), A("Khi", 1), A("dựng", 1), A("Chia", 1)];
  const { frame, dur } = useFrac();
  const unroll = ease(Math.max(0, Math.min(1, (frame - tScroll * dur) / (0.1 * dur))));
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          left: 260,
          right: 260,
          top: 200 - (1 - unroll) * 120,
          bottom: 220,
          background: "linear-gradient(180deg, rgba(217,164,65,0.20), rgba(217,164,65,0.10))",
          border: `2px solid ${C.border}`,
          borderRadius: 8,
          padding: "64px 84px",
          opacity: unroll,
          boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
        }}
      >
        {QUOTE_TOANTHU_1.map((line, i) => {
          const t = tLines[i];
          const lit = ease(Math.max(0, Math.min(1, (frame - t * dur) / (0.05 * dur))));
          return (
            <div
              key={i}
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: i === 0 ? 54 : 48,
                lineHeight: 1.5,
                color: C.cream,
                opacity: 0.3 + 0.7 * lit,
                textShadow: lit > 0.5 ? `0 0 22px rgba(217,164,65,${0.35 * lit})` : undefined,
                borderBottom: lit > 0.3 ? `2px solid rgba(217,164,65,${0.5 * lit})` : undefined,
                display: "inline-block",
                paddingBottom: 4,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
      <Reveal startFrac={0.02} endFrac={0.07} style={{ position: "absolute", top: 96, left: 260 }}>
        <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: C.amber }}>
          NHÂN CHỨNG THỨ NHẤT · ĐẠI VIỆT SỬ KÝ TOÀN THƯ, NGOẠI KỶ
        </span>
      </Reveal>
      <SourceTag text="Đại Việt sử ký toàn thư, Ngoại kỷ — bản dịch Mạc Bảo Thần" bottom={64} />
    </Paper>
  );
};

// === sc-06 === CƠ CHẾ NHÀ NƯỚC 4 Ô + GẠCH ĐỎ «KHÔNG RÕ TÊN HÚY»
export const Sc06: React.FC<SceneProps> = () => {
  const A = useA();
  const tVua = A("vua", 1);
  const tDo = A("đô", 2);
  const tQuoc = A("quốc", 1);
  const tHanh = A("hành", 1);
  const tGhost = A("chìa", 1);
  const tStrike = A("rõ", 2);
  const tBot = A("nhớ", 1);
  const cells = [
    { t: tVua, top: "VUA", sub: "Hùng Vương" },
    { t: tDo, top: "ĐÔ", sub: "Phong Châu" },
    { t: tQuoc, top: "QUỐC HIỆU", sub: "Văn Lang" },
    { t: tHanh, top: "HÀNH CHÍNH", sub: "15 bộ" },
  ];
  const { frame, dur } = useFrac();
  const strike = ease(Math.max(0, Math.min(1, (frame - tStrike * dur) / (0.06 * dur))));
  return (
    <Paper>
      <Reveal startFrac={0.03} endFrac={0.1} style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.white }}>
          Một cơ chế nhà nước — trọn vẹn
        </span>
      </Reveal>
      <div style={{ position: "absolute", left: 200, top: 300, width: 1080, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        {cells.map((c, i) => (
          <SpringPop key={i} startFrac={c.t} from={0.86}>
            <div
              style={{
                border: `2px solid ${i === 0 && strike > 0 ? C.warn : C.border}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.92)",
                padding: "34px 40px",
                position: "relative",
              }}
            >
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: C.amber }}>{c.top}</div>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white, marginTop: 10 }}>
                {c.sub}
                {i === 0 && strike > 0 && (
                  <span style={{ color: C.warn, fontSize: 40 }}> — không rõ tên húy</span>
                )}
              </div>
              {i === 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 36,
                    top: "58%",
                    width: `${strike * 82}%`,
                    height: 7,
                    background: C.warn,
                    transform: "rotate(-2deg)",
                    opacity: strike,
                  }}
                />
              )}
            </div>
          </SpringPop>
        ))}
      </div>
      {/* ô trống rỗng — khoảng vắng */}
      <SpringPop startFrac={tGhost} from={0.8} style={{ position: "absolute", right: 190, top: 240, width: 360 }}>
        <div
          style={{
            border: `3px dashed ${C.warn}`,
            borderRadius: 12,
            padding: "40px 30px",
            textAlign: "center",
            background: "rgba(200,85,61,0.06)",
            opacity: 0.95,
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 88, color: C.warn }}>?</div>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 8 }}>chìa khóa của tập này</div>
        </div>
      </SpringPop>
      <Reveal startFrac={tBot} endFrac={tBot + 0.07} style={{ position: "absolute", bottom: 96, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 48, color: C.cream }}>
          «Cổ thư nhớ chức danh — mà không nhớ tên.»
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-07 === QUOTE SCROLL 2 — guồng máy chức danh
const TITLES_S04 = [
  { key: "Lạc-hầu", sub: "tướng văn" },
  { key: "Lạc-tướng", sub: "tướng võ" },
  { key: "quan-lang", sub: "con vua" },
  { key: "mệ-nàng", sub: "con gái vua" },
  { key: "bồ-chánh", sub: "quan coi việc" },
  { key: "phục-đạo", sub: "cha truyền con nối" },
];

export const Sc07: React.FC<SceneProps> = () => {
  const A = useA();
  const tHead = A("tiếp", 1);
  const tU = [
    A("Lạc-hầu", 1),
    A("Lạc-tướng", 1),
    A("quan-lang", 1),
    A("mệ-nàng", 1),
    A("bồ-chánh", 1),
    A("phục-đạo", 1),
  ];
  const tFinal = A("Hùng-vương", 1);
  const { frame, dur } = useFrac();
  return (
    <Paper>
      <Reveal startFrac={tHead} endFrac={tHead + 0.06} style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: C.amber }}>
          TOÀN THƯ CHÉP TIẾP · NGUYÊN VĂN
        </span>
      </Reveal>
      <div style={{ position: "absolute", left: 280, right: 280, top: 260 }}>
        {TITLES_S04.map((row, i) => {
          const lit = ease(Math.max(0, Math.min(1, (frame - tU[i] * dur) / (0.04 * dur))));
          return (
            <div
              key={row.key}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 36,
                padding: "22px 10px",
                borderBottom: `1px solid ${C.border}`,
                opacity: 0.32 + 0.68 * lit,
              }}
            >
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 800,
                  fontSize: 60,
                  color: lit > 0.5 ? C.amber : C.cream,
                  position: "relative",
                  minWidth: 460,
                }}
              >
                {row.key}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: -6,
                    height: 6,
                    width: `${lit * 100}%`,
                    background: C.amber,
                    borderRadius: 3,
                  }}
                />
              </div>
              <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream }}>{row.sub}</div>
            </div>
          );
        })}
      </div>
      <SpringPop startFrac={tFinal} from={0.9} style={{ position: "absolute", bottom: 84, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 54, color: C.white, background: "rgba(36,31,26,0.85)", padding: "12px 34px", borderRadius: 10 }}>
          «Vua đời ấy đều gọi là Hùng-vương.»
        </span>
      </SpringPop>
      <SourceTag text="Đại Việt sử ký toàn thư" bottom={40} right />
    </Paper>
  );
};

// === sc-08 === CHỨC DANH KHÔNG MẶT — silhouette + cặp cân đầy/trống
export const Sc08: React.FC<SceneProps> = () => {
  const A = useA();
  const tRoll = A("tướng", 3);
  const tFog = A("tên", 1);
  const tScale = A("mặt", 2);
  const tWipe = A("lý", 1);
  const { frame, dur } = useFrac();
  const fog = ease(Math.max(0, Math.min(1, (frame - tFog * dur) / (0.1 * dur))));
  const tilt = ease(Math.max(0, Math.min(1, (frame - (tScale + 0.05) * dur) / (0.1 * dur))));
  return (
    <Paper>
      <div style={{ position: "absolute", left: 230, right: 230, top: 160, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
        {TITLES_S04.map((r, i) => (
          <SpringPop key={r.key} startFrac={tRoll + i * 0.028} from={0.85}>
            <div
              style={{
                border: `2px solid ${C.border}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.9)",
                padding: "26px 26px 18px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ opacity: 0.9 }}>
                <circle cx="60" cy="34" r="14" fill="none" stroke={C.cream} strokeWidth="4" opacity={1 - fog} />
                <path
                  d="M60 50 C36 58 34 96 38 108 M60 50 C84 58 86 96 82 108 M60 52 L60 106"
                  fill="none"
                  stroke={C.cream}
                  strokeWidth="4"
                  opacity={1 - fog}
                />
              </svg>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.white }}>{r.key}</div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(ellipse at center, rgba(232,220,200,${0.5 * fog}) 0%, rgba(232,220,200,${0.25 * fog}) 100%)`,
                  opacity: fog,
                }}
              />
            </div>
          </SpringPop>
        ))}
      </div>
      <Reveal startFrac={tFog} endFrac={tFog + 0.08} style={{ position: "absolute", top: 700, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.cream }}>
          «Tên gì, mặt ra sao — không một chữ.»
        </span>
      </Reveal>
      {/* cặp cân: chức danh ĐẦY — tên người TRỐNG */}
      <SpringPop startFrac={tScale} from={0.85} style={{ position: "absolute", bottom: 90, left: 360, right: 360 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 60 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.amber, fontWeight: 700 }}>CHỨC DANH</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 66, color: C.white }}>ĐẦY</div>
          </div>
          <svg width="260" height="120" viewBox="0 0 260 120">
            <path d="M10 30 H250" stroke={C.cream} strokeWidth="6" transform={`rotate(${-tilt * 9} 130 30)`} />
            <circle cx="130" cy="18" r="10" fill={C.cream} />
            <path d="M130 28 V104 M100 104 H160" stroke={C.cream} strokeWidth="6" />
          </svg>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.warn, fontWeight: 700 }}>TÊN NGƯỜI</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 66, color: C.warn }}>TRỐNG</div>
          </div>
        </div>
      </SpringPop>
      <Reveal startFrac={tWipe} endFrac={tWipe + 0.07} style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 34, color: C.earthGlow, fontWeight: 700 }}>
          «Đó chính là lý do ta phải đi hỏi nền đất.» →
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-09 === VĂN LANG THEO TRUYỀN THUYẾT — STAT CARD LEGEND
export const Sc09: React.FC<SceneProps> = () => {
  const A = useA();
  const t1 = A("tám", 1);
  const t2 = A("đô", 1);
  const t3 = A("lăm", 1);
  const t4 = A("Tứ", 1);
  const tFoot = A("mốc", 1);
  const rows = [
    { t: t1, big: "18 đời", small: "Hùng Vương" },
    { t: t2, big: "Phong Châu", small: "Bạch Hạc · Việt Trì · Phú Thọ" },
    { t: t3, big: "15 bộ", small: "đơn vị hành chính" },
    { t: t4, big: "Tứ bộ quân", small: "phò tá" },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", left: 310, right: 310, top: 250 }}>
        <LegendFrame>
          {rows.map((r, i) => (
            <Reveal key={i} startFrac={r.t} endFrac={r.t + 0.06}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 30, padding: "16px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 74, color: i === 0 ? C.amber : C.white, minWidth: 460 }}>
                  {r.big}
                </div>
                <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream }}>{r.small}</div>
              </div>
            </Reveal>
          ))}
        </LegendFrame>
        <Reveal startFrac={tFoot} endFrac={tFoot + 0.08}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.cream, textAlign: "center", marginTop: 40, lineHeight: 1.35 }}>
            «Dài đến mức trở thành một <span style={{ color: C.amber }}>mốc thời gian</span> —
            hơn là một triều đại.»
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// === sc-10 === TỤC CHỔ MÌNH — mực vẽ thủy quái quanh thân người
export const Sc10: React.FC<SceneProps> = () => {
  const A = useA();
  const tStart = A("xuống", 1);
  const tDraw = A("thuồng", 1);
  const tQuote = A("phán", 1);
  const tFade = A("giặm", 1);
  const { frame, dur } = useFrac();
  const fade = ease(Math.max(0, Math.min(1, (frame - tFade * dur) / (0.12 * dur))));
  return (
    <Paper>
      <svg width="900" height="1080" viewBox="0 0 900 1080" style={{ position: "absolute", left: 40, top: 0 }}>
        {/* sóng nước */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M40 ${860 + i * 46} q80 -34 160 0 t160 0 t160 0 t160 0 t160 0`}
            fill="none"
            stroke={C.amber}
            strokeWidth="4"
            opacity={0.35 - i * 0.08}
          />
        ))}
        {/* thân người silhouette */}
        <g opacity={ease(Math.max(0, Math.min(1, (frame - tStart * dur) / (0.08 * dur))))}>
          <circle cx="430" cy="300" r="46" fill="none" stroke={C.cream} strokeWidth="5" />
          <path
            d="M430 350 C350 380 330 560 350 840 M430 350 C510 380 530 560 510 840 M430 356 L430 838 M330 470 L530 470"
            fill="none"
            stroke={C.cream}
            strokeWidth="5"
          />
        </g>
        {/* thủy quái uốn quanh thân — tự vẽ */}
        <path
          d="M430 300 C640 260 700 420 560 480 C420 540 300 520 320 640 C340 760 520 760 560 860"
          fill="none"
          stroke={C.amber}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(Math.max(0, Math.min(1, (frame - tDraw * dur) / (0.22 * dur))))}
          opacity={1 - fade * 0.55}
        />
        {/* họa tiết giặm mình mờ dần thay thế */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={`t${i}`}
            cx={430 + (i % 2 === 0 ? -34 : 34)}
            cy={470 + i * 62}
            r={13}
            fill="none"
            stroke={C.amber}
            strokeWidth="3"
            opacity={fade * 0.85}
          />
        ))}
      </svg>
      <div style={{ position: "absolute", right: 100, top: 250, width: 700 }}>
        <Reveal startFrac={tDraw + 0.06} endFrac={tDraw + 0.14}>
          <div style={{ fontFamily: FONT.body, fontSize: 40, lineHeight: 1.5, color: C.cream }}>
            «Vẽ hình thủy quái lên thân thể, để khi xuống sông nước, loài thuồng luồng
            tưởng mình là <b style={{ color: C.amber }}>đồng loại</b>.»
          </div>
        </Reveal>
        <SpringPop startFrac={tQuote} from={0.92} style={{ marginTop: 48 }}>
          <div
            style={{
              border: `2px solid ${C.border}`,
              borderLeft: `6px solid ${C.amber}`,
              background: "rgba(36,31,26,0.92)",
              padding: "30px 36px",
              borderRadius: 8,
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: C.white, lineHeight: 1.35 }}>
              «Tục chổ mình của dân Bách-Việt chắc bắt đầu từ đấy.»
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.mute, marginTop: 12 }}>— Toàn thư</div>
          </div>
        </SpringPop>
        <Reveal startFrac={tFade} endFrac={tFade + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.teal, marginTop: 40, fontWeight: 700 }}>
            → sẽ trở lại ở mặt trống đồng (cuối tập)
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// === sc-11 === BẢN ĐỒ GIẤY DẦU CƯƠNG VỰC VĂN LANG
export const Sc11: React.FC<SceneProps> = () => {
  const A = useA();
  const tBorder = A("cương", 1);
  const tEast = A("đông", 1);
  const tWest = A("tây", 1);
  const tNorth = A("bắc", 1);
  const tGrid = A("Động", 1);
  const tWarn = A("ranh", 1);
  const { frame, dur } = useFrac();
  const gridT = ease(Math.max(0, Math.min(1, (frame - tGrid * dur) / (0.14 * dur))));
  const cells = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++)
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={560 + c * 76}
          y={400 + r * 66}
          width="62"
          height="52"
          fill="none"
          stroke={C.cream}
          strokeWidth="2"
          opacity={gridT * 0.5}
        />
      );
  return (
    <Paper>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* khối trung tâm VĂN LANG */}
        <path
          d="M540 370 H960 V760 H540 Z"
          fill="rgba(217,164,65,0.10)"
          stroke={C.amber}
          strokeWidth="6"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(Math.max(0, Math.min(1, (frame - tBorder * dur) / (0.12 * dur))))}
        />
        {cells}
        {/* đông — biển */}
        <path d="M1010 420 q60 -22 120 0 t120 0" fill="none" stroke={C.teal} strokeWidth="5" opacity={ease(Math.max(0, Math.min(1, (frame - tEast * dur) / (0.06 * dur)))) * 0.9} />
        <path d="M1010 480 q60 -22 120 0 t120 0" fill="none" stroke={C.teal} strokeWidth="5" opacity={ease(Math.max(0, Math.min(1, (frame - tEast * dur) / (0.06 * dur)))) * 0.6} />
        {/* tây — núi */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M300 ${560 + i * 60} l60 -70 l60 70`}
            fill="none"
            stroke={C.earth}
            strokeWidth="6"
            opacity={ease(Math.max(0, Math.min(1, (frame - tWest * dur) / (0.07 * dur))))}
          />
        ))}
        {/* bắc — vá nước */}
        <ellipse
          cx="750"
          cy="280"
          rx="120"
          ry="34"
          fill="rgba(127,209,200,0.25)"
          stroke={C.teal}
          strokeWidth="4"
          opacity={ease(Math.max(0, Math.min(1, (frame - tNorth * dur) / (0.07 * dur))))}
        />
      </svg>
      <SpringPop startFrac={tGrid} from={0.9} style={{ position: "absolute", left: 660, top: 540 }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white, background: "rgba(26,23,20,0.8)", padding: "8px 26px", borderRadius: 8 }}>
          VĂN LANG · 15 BỘ
        </span>
      </SpringPop>
      <Reveal startFrac={tEast} endFrac={tEast + 0.05} style={{ position: "absolute", right: 240, top: 400 }}>
        <Chip color={C.teal}>ĐÔNG — Biển Nam</Chip>
      </Reveal>
      <Reveal startFrac={tWest} endFrac={tWest + 0.05} style={{ position: "absolute", left: 140, top: 470 }}>
        <Chip color={C.earth}>TÂY — Ba Thục</Chip>
      </Reveal>
      <Reveal startFrac={tNorth} endFrac={tNorth + 0.05} style={{ position: "absolute", left: 830, top: 200 }}>
        <Chip color={C.teal}>BẮC — hồ Động Đình</Chip>
      </Reveal>
      <Reveal startFrac={tWarn} endFrac={tWarn + 0.09} style={{ position: "absolute", right: 90, bottom: 100, width: 660 }}>
        <div
          style={{
            border: `2px solid ${C.warn}`,
            background: "rgba(26,23,20,0.85)",
            borderRadius: 8,
            padding: "24px 30px",
            fontFamily: FONT.body,
            fontSize: 32,
            lineHeight: 1.4,
            color: C.cream,
          }}
        >
          ⚠ «Ranh giới ấy là cách nhìn của <b>người đời sau chép lại</b> — không phải tấm bản đồ vẽ tại chỗ.»
        </div>
      </Reveal>
    </Paper>
  );
};

// === sc-12 === BẢN ĐỒ RÁCH XUỐNG ĐẤT + TITLE HỒI MỘT
export const Sc12: React.FC<SceneProps> = () => {
  const A = useA();
  const tTear = A("Muốn", 1);
  const tStrata = A("tầng", 1);
  const tTitle = A("tồn", 1);
  const tName = A("Đồng", 1);
  const { frame, dur } = useFrac();
  const tear = ease(Math.max(0, Math.min(1, (frame - tTear * dur) / (0.1 * dur))));
  const strata = ease(Math.max(0, Math.min(1, (frame - tStrata * dur) / (0.14 * dur))));
  return (
    <Paper variant="earth">
      {/* tấm bản đồ rách từ tâm, cuộn mép */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g
          transform={`translate(960 540) scale(${1 - tear * 0.12}) rotate(${tear * 4}) translate(-960 -540)`}
          opacity={1 - tear * 0.9}
        >
          <path d="M540 370 H960 V760 H540 Z" fill="rgba(217,164,65,0.14)" stroke={C.amber} strokeWidth="6" />
        </g>
        {/* vết nứt mực */}
        <path
          d="M960 200 L930 420 L990 560 L920 760 L960 940"
          fill="none"
          stroke={C.cream}
          strokeWidth={5}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - tear}
          opacity={tear > 0 ? 0.9 : 0}
        />
        {/* các lớp đất sáng tuần tự */}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x="0"
            y={620 + i * 90}
            width="1920"
            height="84"
            fill={i % 2 ? C.earthDeep : "#4A341F"}
            opacity={strata * (0.55 + 0.09 * i)}
          />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={`l${i}`}
            x="0"
            y={620 + i * 90}
            width={ease(Math.max(0, Math.min(1, (frame - (tStrata + i * 0.03) * dur) / (0.08 * dur)))) * 1920}
            height="6"
            fill={C.earthGlow}
          />
        ))}
      </svg>
      <SpringPop startFrac={tTitle} from={0.85} style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 10, color: C.earthGlow }}>
          HỒI MỘT
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: C.white, marginTop: 12 }}>
          Chữ không có — nhưng <span style={{ color: C.earthGlow }}>ĐẤT</span> có chữ
        </div>
      </SpringPop>
      <Reveal startFrac={tName} endFrac={tName + 0.07} style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, color: C.amber }}>
          «Nơi ấy tồn tại thật. Nó tên là Đồng Đậu.»
        </span>
      </Reveal>
    </Paper>
  );
};
