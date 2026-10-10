// VN-Myth Ep.03 — scenes group D: sc-39..sc-52 (Hồi ba DNA, ba rail hội tụ,
// chuỗi nhân quả bát cơm, chuỗi kế thừa trống đồng, ranh giới khoa học, phán quyết).
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  LabBadge,
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
import refF11 from "../../../projects/vua-hung-trong-dong/assets/reference/f11-dong-son.png";

const img = (name: string) => staticFile(`vua-hung-trong-dong/images/${name}`);

// === sc-39 === CALLBACK: 609 BỘ GEN TY THỂ
export const Sc39: React.FC<SceneProps> = () => {
  const A = useA();
  const tEyebrow = A("từng", 1);
  const tBig = A("Sáu", 1);
  const tLabel = A("linh", 1);
  const tSub = A("dòng", 1);
  return (
    <Paper variant="teal">
      <LabBadge text="HỒI BA · GEN" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <Reveal startFrac={tEyebrow} endFrac={tEyebrow + 0.05}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.teal, fontWeight: 700 }}>
            từng gặp ở tập trước — tối nay trở lại với vai trò mới
          </div>
        </Reveal>
        <SpringPop startFrac={tBig} from={0.6}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 300,
              color: C.white,
              lineHeight: 1,
              marginTop: 10,
              textShadow: `0 0 60px rgba(127,209,200,0.4)`,
            }}
          >
            609
          </div>
        </SpringPop>
        <Reveal startFrac={tLabel} endFrac={tLabel + 0.06}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.teal }}>
            bộ gen ty thể (mtDNA) — hoàn chỉnh
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, marginTop: 12 }}>
            của các dân tộc Việt Nam
          </div>
        </Reveal>
        <Reveal startFrac={tSub} endFrac={tSub + 0.07}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 30, opacity: 0.9 }}>
            hệ gen <b style={{ color: C.teal }}>truyền theo dòng mẹ</b>
          </div>
        </Reveal>
      </AbsoluteFill>
      {/* vòng xoắn mảnh quét nền */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: 0.25, pointerEvents: "none" }}>
        <path d="M-100 900 C300 700 500 1100 900 900 C1300 700 1500 1100 2000 900" fill="none" stroke={C.teal} strokeWidth="3" />
        <path d="M-100 950 C300 1150 500 750 900 950 C1300 1150 1500 750 2000 950" fill="none" stroke={C.teal} strokeWidth="3" />
      </svg>
    </Paper>
  );
};

// === sc-40 === SỢI XOẮN NỞ NHÁNH — đỉnh dòng mẹ 2.500–3.000 năm
export const Sc40: React.FC<SceneProps> = () => {
  const A = useA();
  const tBranch = A("bung", 1);
  const tStrip = A("điểm", 1);
  const tTrung = A("Trùng", 1);
  const tNoAccident = A("trùng", 2);
  const { frame, dur } = useFrac();
  return (
    <Paper variant="teal">
      <AbsoluteFill>
        <Img src={img("img-sc-40.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(26,23,20,0.94) 0%, rgba(26,23,20,0.3) 45%, rgba(26,23,20,0.05) 70%)",
        }}
      />
      {/* nhánh bung cascade */}
      <svg width="1920" height="600" viewBox="0 0 1920 600" style={{ position: "absolute", top: 220 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const t = ease(Math.max(0, Math.min(1, (frame - (tBranch + i * 0.03) * dur) / (0.1 * dur))));
          const spread = (i - 2.5) * 300;
          return (
            <path
              key={i}
              d={`M960 600 C960 400 ${960 + spread * 0.5} 320 ${960 + spread} 140`}
              fill="none"
              stroke={C.teal}
              strokeWidth="6"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - t}
              opacity={0.85}
            />
          );
        })}
        <circle cx="960" cy="600" r="16" fill={C.teal} />
      </svg>
      {/* trục thời gian dưới đáy */}
      <svg width="1620" height="80" viewBox="0 0 1620 80" style={{ position: "absolute", bottom: 150, left: 150 }}>
        <path d="M0 40 H1620" stroke={C.cream} strokeWidth="4" opacity="0.5" />
        <rect x="420" y="8" width="620" height="64" rx="8" fill="rgba(127,209,200,0.25)" stroke={C.teal} strokeWidth="3" />
        <text x="730" y="52" textAnchor="middle" fill={C.white} fontFamily={FONT.body} fontSize="32" fontWeight="700">
          2.500 – 3.000 năm trước
        </text>
      </svg>
      {/* FIX-06 — gộp hai dòng chú thích thành một khối liền kề tại bottom:330,
          không còn đè lên trục thời gian (bottom:150); giữ nguyên anchor tStrip/tTrung */}
      <div style={{ position: "absolute", bottom: 330, left: 0, right: 0, textAlign: "center" }}>
        <Reveal startFrac={tStrip} endFrac={tStrip + 0.08}>
          <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 48, color: C.white }}>
            Đỉnh mở rộng dòng mẹ: <span style={{ color: C.teal }}>2.500 – 3.000 năm trước</span>
          </span>
        </Reveal>
        <Reveal startFrac={tTrung} endFrac={tTrung + 0.06}>
          <span style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream }}>
            — trùng Gò Mun <b>→</b> Đông Sơn
          </span>
        </Reveal>
      </div>
      <SpringPop startFrac={tNoAccident} from={0.85} style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: C.teal, letterSpacing: 2 }}>
          KHÔNG PHẢI TRÙNG HỢP
        </span>
      </SpringPop>
    </Paper>
  );
};

// === sc-41 === BA RAIL CHỒNG MỘT TRỤC — HERO HỒI BA
export const Sc41: React.FC<SceneProps> = () => {
  const A = useA();
  const tR1 = A("Tầng", 1);
  const tR2 = A("Đỉnh", 1);
  const tR3 = A("cổ", 1);
  const tGlow = A("Ba", 1);
  const tNote = A("nguồn", 1);
  const { frame, dur } = useFrac();
  const glow = ease(Math.max(0, Math.min(1, (frame - tGlow * dur) / (0.12 * dur))));
  const rail = (t: number, y: number, color: string, label: string, sub: string) => {
    const lit = ease(Math.max(0, Math.min(1, (frame - t * dur) / (0.06 * dur))));
    return (
      <Reveal startFrac={t} endFrac={t + 0.06} style={{ position: "absolute", left: 140, right: 140, top: y }}>
        <div
          style={{
            border: `3px solid ${color}`,
            borderLeft: `12px solid ${color}`,
            borderRadius: 10,
            background: "rgba(36,31,26,0.92)",
            padding: "20px 34px",
            opacity: 0.35 + 0.65 * lit,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color }}>{label}</span>
          <span style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, opacity: 0.9 }}>{sub}</span>
        </div>
      </Reveal>
    );
  };
  return (
    <Paper>
      <Reveal startFrac={0.02} endFrac={0.06} style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: C.cream }}>
          SỰ TRÙNG KHỚP THEO CẢ BA LỚP
        </span>
      </Reveal>
      {rail(tR1, 200, C.earthGlow, "TẦNG ĐẤT — Gò Mun → Đông Sơn", "đồng phổ cấp · trống")}
      {rail(tR2, 330, C.teal, "ĐỈNH DÒNG MẸ", "2.500 – 3.000 năm trước")}
      {rail(tR3, 460, C.amber, "CỔ THƯ", "giai đoạn các Lạc vương")}
      {/* vùng giao sáng */}
      <div
        style={{
          position: "absolute",
          left: 140,
          right: 140,
          top: 190,
          height: 340,
          background: "radial-gradient(ellipse at center, rgba(232,220,200,0.28) 0%, rgba(232,220,200,0) 70%)",
          opacity: glow,
          pointerEvents: "none",
        }}
      />
      {/* sông Hồng mực chảy dưới */}
      <svg width="1920" height="200" viewBox="0 0 1920 200" style={{ position: "absolute", bottom: 130, opacity: 0.6 }}>
        <path
          d="M100 100 C400 20 700 180 1000 100 C1300 20 1600 160 1840 90"
          fill="none"
          stroke={C.teal}
          strokeWidth="6"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(Math.max(0, Math.min(1, frame / (0.5 * dur))))}
        />
      </svg>
      <SpringPop startFrac={tGlow} from={0.88} style={{ position: "absolute", bottom: 210, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: C.white, lineHeight: 1.25 }}>
          «Ba nguồn độc lập — <span style={{ color: C.earthGlow }}>đất</span>, <span style={{ color: C.teal }}>gen</span>,{" "}
          <span style={{ color: C.amber }}>trang sách</span> — cùng điểm về một khoảng thời gian.»
        </div>
      </SpringPop>
      <Reveal startFrac={tNote} endFrac={tNote + 0.08} style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, opacity: 0.9 }}>
          «Người làm khoa học không gọi đó là ngẫu nhiên.»
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-42 === CÂU NEO HỒI BA — thẻ tri-band
export const Sc42: React.FC<SceneProps> = () => {
  const A = useA();
  const tBands = A("đất", 2);
  const tMain = A("cùng", 1);
  const tSub = A("ngẫu", 1);
  const { frame, dur } = useFrac();
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* ba dải viền quét vào */}
        {[C.earthGlow, C.teal, C.amber].map((color, i) => {
          const t = ease(Math.max(0, Math.min(1, (frame - (tBands + i * 0.03) * dur) / (0.08 * dur))));
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 300 + i * 150,
                left: `${50 - t * 42}%`,
                right: `${50 - t * 42}%`,
                height: 14,
                background: color,
                borderRadius: 7,
                opacity: 0.9,
              }}
            />
          );
        })}
        <Reveal startFrac={tMain} endFrac={tMain + 0.08}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 88, color: C.white, textAlign: "center", lineHeight: 1.2 }}>
            Ba nguồn độc lập —<br />
            cùng chỉ về <span style={{ color: C.amber }}>một khoảng thời gian</span>
          </div>
        </Reveal>
        <Reveal startFrac={tSub} endFrac={tSub + 0.09}>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, textAlign: "center", marginTop: 44 }}>
            khi các chứng cứ độc lập hội tụ —<br />
            khoa học không gọi đó là ngẫu nhiên
          </div>
        </Reveal>
      </AbsoluteFill>
    </Paper>
  );
};

// === sc-43 === CHUỖI NHÂN QUẢ: LÚA NƯỚC → DÂN SỐ → ĐỈNH DÒNG MẸ
export const Sc43: React.FC<SceneProps> = () => {
  const A = useA();
  const tQ = A("Vì", 1);
  const tNodes = [A("Nông", 1), A("bữa", 1), A("sinh", 1), A("nhân", 1)];
  const tLoop = A("mở", 1);
  const nodes = [
    { label: "LÚA NƯỚC ĐÔNG SƠN", color: C.earthGlow },
    { label: "BỮA CƠM NO", color: C.amber },
    { label: "DÂN SỐ TĂNG", color: C.cream },
    { label: "ĐỈNH DÒNG MẸ", color: C.teal },
  ];
  return (
    <Paper>
      <Reveal startFrac={tQ} endFrac={tQ + 0.06} style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.white }}>
          «Vì sao dân số bùng nổ đúng lúc đó?»
        </span>
      </Reveal>
      <div style={{ position: "absolute", left: 0, right: 0, top: 340, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {nodes.map((n, i) => (
          <React.Fragment key={n.label}>
            <SpringPop startFrac={tNodes[i]} from={0.85}>
              <div
                style={{
                  border: `3px solid ${n.color}`,
                  background: "rgba(36,31,26,0.94)",
                  borderRadius: 12,
                  padding: "30px 36px",
                  textAlign: "center",
                  width: 330,
                }}
              >
                <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 40, color: n.color, lineHeight: 1.2 }}>{n.label}</div>
              </div>
            </SpringPop>
            {i < 3 && (
              <svg width="90" height="50" viewBox="0 0 90 50" style={{ margin: "0 6px" }}>
                <path d="M6 25 H70 M56 12 L74 25 L56 38" fill="none" stroke={C.cream} strokeWidth="6" strokeLinecap="round" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* vòng lặp no → sinh con → mở ruộng → lại no */}
      <SpringPop startFrac={tLoop} from={0.85} style={{ position: "absolute", left: 190, bottom: 150 }}>
        <svg width="420" height="240" viewBox="0 0 420 240">
          <ellipse cx="210" cy="120" rx="190" ry="92" fill="none" stroke={C.amber} strokeWidth="5" strokeDasharray="14 10" />
          {[
            { x: 210, y: 28, label: "no" },
            { x: 382, y: 120, label: "sinh con" },
            { x: 210, y: 212, label: "mở ruộng" },
            { x: 38, y: 120, label: "lại no hơn" },
          ].map((p) => (
            <g key={p.label}>
              <circle cx={p.x} cy={p.y} r="9" fill={C.amber} />
              <text
                x={p.x}
                y={p.y - 20}
                textAnchor="middle"
                fill={C.cream}
                fontFamily={FONT.body}
                fontSize="28"
                fontWeight="700"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </SpringPop>
    </Paper>
  );
};

// === sc-44 === BÁT CƠM NO — cảnh đời Đông Sơn (parallax)
export const Sc44: React.FC<SceneProps> = () => {
  const A = useA();
  const tQuote = A("Gen", 1);
  const { frame, dur } = useFrac();
  const t = Math.max(0, Math.min(1, frame / Math.max(1, dur - 1)));
  return (
    <Paper>
      <AbsoluteFill style={{ transform: `translateX(${-40 + t * 80}px) scale(1.1)` }}>
        <Img src={img("img-sc-44.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(26,23,20,0.94) 0%, rgba(26,23,20,0.4) 34%, rgba(0,0,0,0) 60%)",
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 190 }}>
        <SpringPop startFrac={tQuote} from={0.9}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 76, color: C.white, textAlign: "center", textShadow: "0 4px 22px rgba(0,0,0,0.8)" }}>
            «Gen đếm nhịp của<br />
            <span style={{ color: C.amber }}>những bữa cơm</span>.»
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, textAlign: "center", marginTop: 22 }}>
            no → sinh con → mở ruộng → lại no hơn
          </div>
        </SpringPop>
      </AbsoluteFill>
    </Paper>
  );
};

// === sc-45 === CHUỖI KẾ THỪA: LÚA → LÒ → ĐỒNG → TRỐNG
export const Sc45: React.FC<SceneProps> = () => {
  const A = useA();
  const tNodes = [A("Phùng", 1), A("Đồng", 1), A("khắp", 1), A("thừa", 1)];
  const tBranches = A("nhạc", 1);
  const tRipple = A("trống", 1);
  const nodes = [
    { label: "LÚA", sub: "Phùng Nguyên", color: C.earthGlow, icon: "M20 46 c10 6 10 26 0 32 c-10 -6 -10 -26 0 -32 z M20 78 v8" },
    { label: "LÒ", sub: "Đồng Đậu", color: C.amber, icon: "M28 30 h24 l4 30 h-32 z M40 18 v12 M24 60 q16 14 32 0" },
    { label: "ĐỒNG", sub: "Gò Mun — khắp nơi", color: C.cream, icon: "M20 50 l36 -20 M44 24 l10 18 M26 66 a12 12 0 1 0 22 0 a12 12 0 1 0 -22 0" },
    { label: "TRỐNG ĐỒNG", sub: "Đông Sơn thừa kế tất cả", color: C.amber, icon: "M20 40 a20 20 0 1 1 40 0 a20 20 0 1 1 -40 0 M40 40 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0", big: true },
  ];
  return (
    <Paper variant="earth">
      {/* FIX-08 — ghost chain mờ của sơ đồ LÚA → LÒ → ĐỒNG → TRỐNG, hiện từ frame 0;
          các node thật (nền 0.94) phủ lên khi anchor tới */}
      <Reveal startFrac={0.0} endFrac={0.03} dy={0} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ opacity: 0.22 }}>
          {[[162, 300], [560, 300], [958, 300], [1356, 420]].map(([x, w], i) => (
            <rect key={i} x={x} y={260} width={w} height={220} rx="12" fill="none" stroke={C.border} strokeWidth="2" strokeDasharray="10 12" />
          ))}
          {[468, 866, 1264].map((x, i) => (
            <g key={`a${i}`}>
              <path d={`M${x} 370 H${x + 66}`} stroke={C.mute} strokeWidth="3" />
              <path d={`M${x + 52} 360 L${x + 70} 370 L${x + 52} 380`} fill="none" stroke={C.mute} strokeWidth="3" />
            </g>
          ))}
        </svg>
      </Reveal>
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {nodes.map((n, i) => (
          <React.Fragment key={n.label}>
            <SpringPop startFrac={tNodes[i]} from={0.8}>
              <div
                style={{
                  border: `3px solid ${n.color}`,
                  background: "rgba(36,31,26,0.94)",
                  borderRadius: 12,
                  padding: "26px 30px",
                  textAlign: "center",
                  width: n.big ? 420 : 300,
                  boxShadow: n.big ? "0 0 34px rgba(217,164,65,0.25)" : undefined,
                }}
              >
                <svg width="90" height="90" viewBox="0 0 80 90">
                  <path d={n.icon} fill="none" stroke={n.color} strokeWidth="5" strokeLinecap="round" />
                </svg>
                <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: n.big ? 56 : 44, color: n.color, marginTop: 6 }}>{n.label}</div>
                <div style={{ fontFamily: FONT.body, fontSize: 27, color: C.cream, marginTop: 6 }}>{n.sub}</div>
              </div>
            </SpringPop>
            {i < 3 && (
              <svg width="80" height="50" viewBox="0 0 80 50" style={{ margin: "0 6px" }}>
                <path d="M6 25 H62 M48 12 L66 25 L48 38" fill="none" stroke={C.cream} strokeWidth="6" strokeLinecap="round" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 680, display: "flex", justifyContent: "center", gap: 60 }}>
        {["NHẠC LỄ", "BIỂU TƯỢNG QUYỀN LỰC"].map((b, i) => (
          <SpringPop key={b} startFrac={tBranches + i * 0.05} from={0.85}>
            <Chip color={C.amber}>{b}</Chip>
          </SpringPop>
        ))}
      </div>
      <SoundRipples cx={960} cy={520} startFrac={tRipple} count={3} maxR={500} color={C.amber} />
      <Reveal startFrac={tRipple} endFrac={tRipple + 0.08} style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream }}>
          «đánh lên là <b style={{ color: C.amber }}>triệu tập</b> — là tuyên bố»
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-46 === XƯỞNG ĐÚC TRỐNG ĐÔNG SƠN — workshop + f11 ripples
export const Sc46: React.FC<SceneProps> = () => {
  const A = useA();
  const tDrum = A("trống", 2);
  const tDef = A("phức", 1);
  const { frame } = useFrac();
  const sparks = Array.from({ length: 16 }, (_, i) => i);
  return (
    <Paper>
      <AbsoluteFill style={{ left: 0, width: "58%" }}>
        <Img src={img("img-sc-46.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(26,23,20,0.15) 0%, rgba(26,23,20,0.65) 52%, rgba(26,23,20,0.96) 58%, rgba(26,23,20,1) 100%)",
        }}
      />
      <svg width="1200" height="1080" viewBox="0 0 1200 1080" style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
        {sparks.map((i) => {
          const phase = (frame * (5 + (i % 4) * 3) + i * 83) % 700;
          return (
            <circle
              key={i}
              cx={330 + ((i * 211) % 560)}
              cy={640 - phase}
              r={2 + (i % 3)}
              fill={i % 2 ? C.amber : C.white}
              opacity={Math.max(0, 0.9 - phase / 700)}
            />
          );
        })}
      </svg>
      {/* trống f11 + sóng âm đồng tâm */}
      <div style={{ position: "absolute", right: 150, top: 200, width: 460, textAlign: "center" }}>
        <SpringPop startFrac={tDrum} from={0.8}>
          <Img
            src={refF11}
            style={{ width: 420, height: 420, objectFit: "cover", borderRadius: "50%", border: `6px solid ${C.amber}` }}
          />
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.amber, marginTop: 20 }}>
            TRỐNG ĐỒNG — ĐÔNG SƠN
          </div>
        </SpringPop>
      </div>
      <SoundRipples cx={1440} cy={410} startFrac={tDrum + 0.06} count={3} maxR={330} color={C.amber} />
      <Reveal startFrac={tDef} endFrac={tDef + 0.09} style={{ position: "absolute", bottom: 90, left: 120, right: 120 }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 46,
            color: C.white,
            textAlign: "center",
            background: "rgba(26,23,20,0.88)",
            padding: "22px 36px",
            borderRadius: 12,
            lineHeight: 1.35,
          }}
        >
          «Đủ đông, đủ no, đủ tổ chức để đúc trống
          <br />= <span style={{ color: C.amber }}>XÃ HỘI PHỨC TẠP</span>.»
        </div>
      </Reveal>
    </Paper>
  );
};

// === sc-47 === NGUYÊN TẮC: DNA KHÔNG CHỨNG MINH VUA HÙNG
export const Sc47: React.FC<SceneProps> = () => {
  const A = useA();
  const t1 = A("DNA", 1);
  const t2 = A("Khảo", 1);
  const tSub = A("trao", 1);
  return (
    <Paper>
      {/* FIX-08 — ghost phán quyết mờ hiện từ frame 0 (không tranh chấp nội dung anchor) */}
      <Reveal startFrac={0.0} endFrac={0.03} dy={0} style={{ position: "absolute", left: 260, top: 330, width: 1400, height: 440 }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            border: `2px dashed ${C.border}`,
            borderRadius: 14,
            background: "rgba(36,31,26,0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 34,
          }}
        >
          <span style={{ width: "56%", height: 22, borderRadius: 11, background: C.border, opacity: 0.5 }} />
          <span style={{ width: "38%", height: 22, borderRadius: 11, background: C.border, opacity: 0.5 }} />
        </div>
      </Reveal>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <SpringPop startFrac={t1} from={0.9}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 86, lineHeight: 1.3, color: C.white }}>
            DNA KHÔNG CHỨNG MINH VUA HÙNG CÓ THẬT.
          </div>
        </SpringPop>
        <SpringPop startFrac={t2} from={0.9} style={{ marginTop: 16 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 86, color: C.teal }}>
            KHẢO CỔ CŨNG KHÔNG.
          </div>
        </SpringPop>
        <Reveal startFrac={tSub} endFrac={tSub + 0.09}>
          <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream, marginTop: 50, maxWidth: 1400, lineHeight: 1.45 }}>
            «Cả cổ thư lẫn nền đất đều không trao cho ta một tên vua nào —»
            <br />
            chỉ khớp thời điểm một <b>xã hội phức tạp bật dậy</b> ở sông Hồng.
          </div>
        </Reveal>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          background: `linear-gradient(90deg, ${C.teal} 50%, ${C.earth} 50%)`,
        }}
      />
    </Paper>
  );
};

// === sc-48 === VẠCH RANH GIỚI: NÓI ĐƯỢC / KHÔNG NÓI ĐƯỢC
export const Sc48: React.FC<SceneProps> = () => {
  const A = useA();
  const tLine = A("đặt", 1);
  const chips = [A("đông", 1), A("phân", 1), A("luyện", 1), A("trống", 1)];
  const tEmpty = A("tên", 2);
  const tMeet = A("tiếng", 1);
  const { frame, dur } = useFrac();
  const line = ease(Math.max(0, Math.min(1, (frame - tLine * dur) / (0.1 * dur))));
  const meet = ease(Math.max(0, Math.min(1, (frame - tMeet * dur) / (0.08 * dur))));
  return (
    <Paper>
      <Reveal startFrac={0.02} endFrac={0.06} style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: C.cream }}>
          RANH GIỚI NGHIÊM NGẶT CỦA KHOA HỌC
        </span>
      </Reveal>
      {/* vạch mực giữa */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path
          d="M960 240 V900"
          stroke={C.white}
          strokeWidth={10}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - line}
        />
        {/* icon sóng âm trống trên ranh giới */}
        <g opacity={meet}>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx="960"
              cy="560"
              r={20 + i * 22 + meet * 26 * i}
              fill="none"
              stroke={C.teal}
              strokeWidth="4"
              opacity={0.9 - i * 0.25}
            />
          ))}
          <circle cx="960" cy="560" r="10" fill={C.teal} />
        </g>
      </svg>
      {/* vùng trái — nói được */}
      <div style={{ position: "absolute", left: 100, top: 260, width: 640 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.teal, letterSpacing: 3 }}>
          KHOA HỌC NÓI ĐƯỢC
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 30, alignItems: "flex-start" }}>
          {["xã hội đông dân", "xã hội phân tầng", "luyện kim", "có trống"].map((c, i) => (
            <SpringPop key={c} startFrac={chips[i]} from={0.85}>
              <Chip color={C.teal}>{c}</Chip>
            </SpringPop>
          ))}
        </div>
      </div>
      {/* vùng phải — không nói được */}
      <div style={{ position: "absolute", right: 100, top: 260, width: 640, textAlign: "right" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.warn, letterSpacing: 3 }}>
          KHOA HỌC KHÔNG NÓI ĐƯỢC
        </div>
        <SpringPop startFrac={tEmpty} from={0.85} style={{ marginTop: 40 }}>
          <div
            style={{
              border: `3px dashed ${C.warn}`,
              borderRadius: 12,
              padding: "34px 40px",
              display: "inline-block",
              background: "rgba(200,85,61,0.05)",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.warn }}>TÊN VUA</div>
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={tMeet} endFrac={tMeet + 0.08} style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white }}>
          «Hai bên chỉ gặp nhau ở một điểm khác: <span style={{ color: C.teal }}>ở tiếng trống</span>.»
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-49 === TỔNG LUẬN BA HỒI: ĐẤT — CỔ THƯ — GEN
export const Sc49: React.FC<SceneProps> = () => {
  const A = useA();
  const tCols = [A("Nền", 1), A("Cổ", 1), A("Gen", 1)];
  const tJoin = A("làm", 1);
  const tNote = A("biết", 1);
  const cols = [
    { label: "NỀN ĐẤT", speaks: "tầng văn hóa · kim loại", color: C.earthGlow, icon: "M30 20 v60 M30 80 h44 M30 60 h44 M30 40 h44" },
    { label: "CỔ THƯ", speaks: "chức danh · phép chia", color: C.amber, icon: "M30 20 h40 v70 h-40 z M40 36 h20 M40 50 h20 M40 64 h20" },
    { label: "GEN", speaks: "đỉnh dòng mẹ", color: C.teal, icon: "M30 90 C50 60 70 40 84 20 M30 20 C50 50 70 66 84 90 M44 44 h26 M38 58 h26" },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center", gap: 40 }}>
        {cols.map((c, i) => (
          <SpringPop key={c.label} startFrac={tCols[i]} from={0.85}>
            <div
              style={{
                width: 420,
                border: `3px solid ${c.color}`,
                background: "rgba(36,31,26,0.94)",
                borderRadius: 12,
                padding: "34px 30px",
                textAlign: "center",
              }}
            >
              <svg width="110" height="100" viewBox="0 0 110 100">
                <path d={c.icon} fill="none" stroke={c.color} strokeWidth="6" strokeLinecap="round" />
              </svg>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: c.color, marginTop: 10 }}>{c.label}</div>
              <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 10, lineHeight: 1.35 }}>
                nói bằng<br />
                <b>{c.speaks}</b>
              </div>
            </div>
          </SpringPop>
        ))}
      </div>
      <svg width="1920" height="300" viewBox="0 0 1920 300" style={{ position: "absolute", top: 540 }}>
        {[330, 960, 1590].map((x, i) => (
          <path
            key={i}
            d={`M${x} 0 C${x} 120 ${x} 140 960 210`}
            fill="none"
            stroke={C.cream}
            strokeWidth="5"
            opacity="0.7"
          />
        ))}
      </svg>
      <SpringPop startFrac={tJoin} from={0.88} style={{ position: "absolute", left: 260, right: 260, top: 730, textAlign: "center" }}>
        <div
          style={{
            border: `3px solid ${C.cream}`,
            background: "rgba(36,31,26,0.96)",
            borderRadius: 12,
            padding: "30px 40px",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 44,
            color: C.white,
            lineHeight: 1.35,
          }}
        >
          «Một xã hội sống động, liên tục, phồn vinh —<br />
          đúng vào khung thời gian của <span style={{ color: C.amber }}>Văn Lang</span>.»
        </div>
      </SpringPop>
      <Reveal startFrac={tNote} endFrac={tNote + 0.07} style={{ position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute }}>
          không nhân chứng nào biết tên vua
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-50 === LẬT CÂU HỎI
export const Sc50: React.FC<SceneProps> = () => {
  const A = useA();
  const tOld = A("câu", 2);
  const tStrike = A("đặt", 1);
  const tNew = A("đúng", 2);
  const tOut = A("Mời", 1);
  const { frame, dur } = useFrac();
  const strike = ease(Math.max(0, Math.min(1, (frame - tStrike * dur) / (0.06 * dur))));
  const rise = ease(Math.max(0, Math.min(1, (frame - tNew * dur) / (0.08 * dur))));
  return (
    <Paper>
      {/* FIX-08 — ghost câu hỏi cũ mờ hiện từ frame 0; câu hỏi thật phủ lên tại tOld */}
      <Reveal startFrac={0.0} endFrac={0.03} dy={0} style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.cream, opacity: 0.13, lineHeight: 1.2 }}>
          «Vua Hùng có thật không?»
        </div>
      </Reveal>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Reveal startFrac={tOld} endFrac={tOld + 0.06}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 84,
              color: C.cream,
              opacity: 1 - strike * 0.62,
              position: "relative",
              textAlign: "center",
            }}
          >
            «Vua Hùng có thật không?»
            {strike > 0 && <StrikeThrough startFrac={tStrike} width={1000} thickness={12} style={{ top: "50%", left: "50%" }} />}
          </div>
        </Reveal>
        <div style={{ height: 60 }} />
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 96,
            color: C.white,
            opacity: rise,
            transform: `translateY(${(1 - rise) * 70}px)`,
            textAlign: "center",
          }}
        >
          «Cái gì của thời ấy là <span style={{ color: C.amber }}>thật</span>?»
        </div>
        <Reveal startFrac={tOut} endFrac={tOut + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 70, opacity: 0.9 }}>
            Mời bạn bước vào phần cuối →
          </div>
        </Reveal>
      </AbsoluteFill>
    </Paper>
  );
};

// === sc-51 === TUYÊN NGÔN BA PHÁN QUYẾT
export const Sc51: React.FC<SceneProps> = () => {
  const A = useA();
  const t1 = A("Thần", 1);
  const t2 = A("Mán", 1);
  const t3 = A("Còn", 1);
  const tMotto = A("thấy", 2);
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
        <SpringPop startFrac={t1} from={0.9}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 74, color: C.amber, textAlign: "center" }}>
            THẦN NÔNG, ĐẾ MINH — là HUYỀN THOẠI
          </div>
        </SpringPop>
        <SpringPop startFrac={t2} from={0.9}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 74, color: C.teal, textAlign: "center" }}>
            MÁN BẠC — là NGƯỜI THẬT, bằng xương bằng thịt
          </div>
        </SpringPop>
        <SpringPop startFrac={t3} from={0.9}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 84,
              textAlign: "center",
              background: "linear-gradient(90deg, #D9A441 0%, #F5F2EA 38%, #7FD1C8 62%, #7FD1C8 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            VĂN LANG — nằm ĐÚNG GIỮA hai cực ấy
          </div>
        </SpringPop>
        <Reveal startFrac={tMotto} endFrac={tMotto + 0.08}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.white, marginTop: 30, textAlign: "center", opacity: 0.92 }}>
            «Không tìm thấy tên vua — nhưng tìm thấy tiếng trống.»
          </div>
        </Reveal>
      </AbsoluteFill>
    </Paper>
  );
};

// === sc-52 === THANG CÂN HUYỀN THOẠI — NGƯỜI THẬT + ba vế THẬT
export const Sc52: React.FC<SceneProps> = () => {
  const A = useA();
  const t1 = A("xã", 1);
  const t2 = A("văn", 1);
  const t3 = A("vang", 1);
  const tMotto = A("sông", 1);
  return (
    <Paper>
      <AbsoluteFill>
        <Img src={img("img-sc-52.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(26,23,20,0.96) 0%, rgba(26,23,20,0.72) 30%, rgba(26,23,20,0.1) 62%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 100, textAlign: "center" }}>
        {[
          { t: t1, text: "Có một XÃ HỘI — thật." },
          { t: t2, text: "Có một NỀN VĂN MINH SƠ KHAI — thật." },
          { t: t3, text: "Có TIẾNG TRỐNG vang trên sông Hồng — thật." },
        ].map((row, i) => (
          <SpringPop key={i} startFrac={row.t} from={0.9} style={{ marginTop: 18 }}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 56,
                color: C.white,
                display: "inline-block",
                background: "rgba(20,17,13,0.82)",
                padding: "10px 34px",
                borderRadius: 10,
                border: `2px solid rgba(127,209,200,0.4)`,
              }}
            >
              {row.text}
            </div>
          </SpringPop>
        ))}
        <SpringPop startFrac={tMotto} from={0.9} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.amber }}>
            «Không tìm thấy tên vua — nhưng tìm thấy tiếng trống.»
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};
