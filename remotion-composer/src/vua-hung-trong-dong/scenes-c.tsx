// VN-Myth Ep.03 — scenes group C: sc-25..sc-38 (Hồi hai: cổ thư đối diện khai quật,
// Giao Châu ngoại vực ký, từ nguyên chữ Lạc, ấn đồng, mộ thuyền Việt Khê, xã hội phân tầng,
// phép chia minh họa, biến hình 18 đời → 18 thế kỷ + title Hồi ba).
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  InkDraw,
  LegendFrame,
  Paper,
  PhuongDoanTag,
  Reveal,
  SourceTag,
  SpringPop,
  StrikeThrough,
  useA,
  useFrac,
  ease,
} from "./common";

const img = (name: string) => staticFile(`vua-hung-trong-dong/images/${name}`);

// === sc-25 === TITLE HỒI HAI — split screen giấy dó ↔ hố khai quật
export const Sc25: React.FC<SceneProps> = () => {
  const A = useA();
  const tSplit = A("Để", 1);
  const tBleed = A("khác", 1);
  const tTitle = A("Hồi", 1);
  const { frame, dur } = useFrac();
  const slideL = ease(Math.max(0, Math.min(1, (frame - tSplit * dur) / (0.08 * dur))));
  const slideR = ease(Math.max(0, Math.min(1, (frame - (tSplit + 0.03) * dur) / (0.08 * dur))));
  const bleed = ease(Math.max(0, Math.min(1, (frame - tBleed * dur) / (0.1 * dur))));
  // FIX-08: split template mờ — hiện từ frame 0, nhường chỗ khi hai nửa thật trượt vào
  const ghostIn = ease(Math.max(0, Math.min(1, frame / (0.03 * dur))));
  return (
    <Paper>
      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <g opacity={0.2 * ghostIn * (1 - slideL)}>
          <rect x="24" y="24" width="912" height="1032" rx="10" fill="none" stroke={C.amber} strokeWidth="2" strokeDasharray="12 14" />
          <rect x="984" y="24" width="912" height="1032" rx="10" fill="none" stroke={C.earth} strokeWidth="2" strokeDasharray="12 14" />
          <path d="M960 60 V1020" stroke={C.border} strokeWidth="2" strokeDasharray="8 14" />
        </g>
      </svg>
      {/* nửa trái — giấy dó amber, một trang thư tự lật */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "50%",
          background: `linear-gradient(180deg, rgba(217,164,65,${0.16 + 0.06 * Math.sin(frame / 40)}) , rgba(217,164,65,0.08))`,
          transform: `translateX(${(slideL - 1) * 960}px)`,
        }}
      >
        <svg width="960" height="1080" viewBox="0 0 960 1080" style={{ position: "absolute", inset: 0 }}>
          <rect x="640" y="330" width="220" height="420" fill="none" stroke={C.amber} strokeWidth="5" />
          <path d="M750 330 V750 M640 420 H860" stroke={C.amber} strokeWidth="3" opacity="0.6" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="664" y={460 + i * 44} width={120 + ((i * 37) % 80)} height="7" fill={C.cream} opacity="0.35" rx="3" />
          ))}
        </svg>
      </div>
      {/* nửa phải — hố khai quật, một tầng tự sáng */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "50%",
          background: "linear-gradient(180deg, rgba(92,61,34,0.28), rgba(92,61,34,0.1))",
          transform: `translateX(${(1 - slideR) * 960}px)`,
        }}
      >
        <svg width="960" height="1080" viewBox="0 0 960 1080" style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x="0"
              y={200 + i * 130}
              width="960"
              height="122"
              fill={i % 2 ? "#241A10" : C.earthDeep}
              opacity={0.9}
            />
          ))}
          <rect
            x="0"
            y={590}
            width={ease(Math.max(0, Math.min(1, (frame - (tBleed + 0.02) * dur) / (0.1 * dur)))) * 960}
            height="8"
            fill={C.earthGlow}
          />
        </svg>
      </div>
      {/* vệt mực loang ở ranh giới */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path
          d="M960 60 C950 300 975 500 958 700 C950 850 970 950 960 1020"
          stroke={C.cream}
          strokeWidth={10 * bleed}
          fill="none"
          opacity={0.55 * bleed}
          style={{ filter: "blur(3px)" }}
        />
      </svg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <SpringPop startFrac={tTitle} from={0.88}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 10, color: C.cream }}>
            HỒI HAI
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 100, color: C.white, marginTop: 10 }}>
            Cổ thư <span style={{ color: C.amber }}>đối diện</span> khai quật
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 24 }}>
            «cổ hơn, gần thời ấy hơn — và chép từ bên ngoài»
          </div>
        </SpringPop>
      </AbsoluteFill>
    </Paper>
  );
};

// === sc-26 === QUOTE SCROLL — Giao Châu ngoại vực ký
const QUOTE_GIAOCHAU = [
  { t: "Xưa", line: "«Xưa, khi Giao Chỉ chưa có quận huyện," },
  { t: "ruộng", line: "đất có ruộng Lạc; ruộng ấy theo nước triều lên xuống." },
  { t: "Dân", line: "Dân khai khẩn ruộng ấy để sinh sống, vì thế gọi là dân Lạc." },
  { t: "Đặt", line: "Đặt Lạc vương, Lạc hầu cai quản các quận huyện." },
  { t: "ấn", line: "Ở các huyện phần nhiều là Lạc tướng; Lạc tướng có ấn đồng, dải thao xanh.»", hot: true },
];

export const Sc26: React.FC<SceneProps> = () => {
  const A = useA();
  const tHead = A("Đoạn", 1);
  const tScroll = A("Nguyên", 1);
  const tLines = QUOTE_GIAOCHAU.map((q) => A(q.t, 1));
  const { frame, dur } = useFrac();
  const unroll = ease(Math.max(0, Math.min(1, (frame - tScroll * dur) / (0.1 * dur))));
  return (
    <Paper>
      <Reveal startFrac={tHead} endFrac={tHead + 0.06} style={{ position: "absolute", top: 100, left: 260 }}>
        <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: C.amber }}>
          NHÂN CHỨNG THỨ HAI · GIAO CHÂU NGOẠI VỰC KÝ (dẫn trong Thủy kinh chú)
        </span>
      </Reveal>
      <div
        style={{
          position: "absolute",
          left: 300,
          right: 300,
          top: 210 - (1 - unroll) * 100,
          background: "linear-gradient(180deg, rgba(217,164,65,0.16), rgba(217,164,65,0.07))",
          border: `2px solid ${C.border}`,
          borderRadius: 8,
          padding: "56px 80px",
          opacity: unroll,
        }}
      >
        {QUOTE_GIAOCHAU.map((q, i) => {
          const lit = ease(Math.max(0, Math.min(1, (frame - tLines[i] * dur) / (0.05 * dur))));
          return (
            <div
              key={i}
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 46,
                lineHeight: 1.5,
                color: q.hot && lit > 0.5 ? C.amber : C.cream,
                opacity: 0.3 + 0.7 * lit,
                borderBottom: q.hot ? `2px solid rgba(217,164,65,${lit})` : undefined,
                display: "inline-block",
                paddingBottom: 4,
              }}
            >
              {q.line}
            </div>
          );
        })}
      </div>
      <SourceTag text="Giao Châu ngoại vực ký, dẫn trong Thủy kinh chú" bottom={64} />
    </Paper>
  );
};

// === sc-27 === HAI THẺ NGUỒN HỘI TỤ — chức danh chung
export const Sc27: React.FC<SceneProps> = () => {
  const A = useA();
  const tL = A("Đây", 1);
  const tR = A("bên", 1);
  const tJoin = A("đúng", 1);
  const tNote = A("thổi", 1);
  return (
    <Paper>
      <div style={{ position: "absolute", left: 130, top: 180, width: 640 }}>
        <SpringPop startFrac={tL} from={0.9}>
          <div
            style={{
              border: `3px solid ${C.amber}`,
              background: "rgba(36,31,26,0.94)",
              borderRadius: 12,
              padding: "36px 40px",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: C.amber }}>
              TRONG NƯỚC · NGƯỜI ĐỜI SAU
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 46, color: C.white, marginTop: 12, lineHeight: 1.25 }}>
              ĐẠI VIỆT SỬ KÝ TOÀN THƯ
            </div>
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", right: 130, top: 180, width: 640 }}>
        <SpringPop startFrac={tR} from={0.9}>
          <div
            style={{
              border: `3px solid ${C.teal}`,
              background: "rgba(36,31,26,0.94)",
              borderRadius: 12,
              padding: "36px 40px",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: C.teal }}>
              BÊN KIA BIÊN GIỚI · SÁCH CŨ TRUNG HOA
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 46, color: C.white, marginTop: 12, lineHeight: 1.25 }}>
              GIAO CHÂU NGOẠI VỰC KÝ / THỦY KINH CHÚ
            </div>
          </div>
        </SpringPop>
      </div>
      <Arrows tJoin={tJoin} />
      <SpringPop startFrac={tJoin} from={0.88} style={{ position: "absolute", left: 430, right: 430, top: 560, textAlign: "center" }}>
        <div
          style={{
            border: `3px solid ${C.cream}`,
            background: "rgba(36,31,26,0.96)",
            borderRadius: 12,
            padding: "30px 40px",
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: C.white }}>
            Lạc vương · Lạc hầu · Lạc tướng
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.amber, marginTop: 10 }}>
            hai nguồn độc lập — ghi đúng nhau
          </div>
        </div>
      </SpringPop>
      <Reveal startFrac={tNote} endFrac={tNote + 0.08} style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, background: "rgba(20,17,13,0.8)", padding: "12px 28px", borderRadius: 8 }}>
          «Trang sách <b>không có lý do thổi phồng</b> cho nước Việt»
        </span>
      </Reveal>
    </Paper>
  );
};

const Arrows: React.FC<{ tJoin: number }> = ({ tJoin }) => {
  const { frame, dur } = useFrac();
  const t = ease(Math.max(0, Math.min(1, (frame - tJoin * dur) / (0.06 * dur))));
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g opacity={t}>
        <path d="M440 420 C620 480 700 520 860 560" fill="none" stroke={C.cream} strokeWidth="6" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
        <path d="M1480 420 C1300 480 1220 520 1060 560" fill="none" stroke={C.cream} strokeWidth="6" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
      </g>
    </svg>
  );
};

// === sc-28 === CHUỖI TỪ NGUYÊN CHỮ LẠC — trên nền ruộng nước
export const Sc28: React.FC<SceneProps> = () => {
  const A = useA();
  const tRuong = A("Ruộng", 1);
  const tDan = A("người", 1);
  const tVuong = A("cai", 1);
  const tCaption = A("mọc", 1);
  const nodes = [
    { t: tRuong, top: "RUỘNG LẠC", sub: "theo nước triều lên xuống", color: C.teal },
    { t: tDan, top: "DÂN LẠC", sub: "người khai khẩn ruộng ấy", color: C.cream },
    { t: tVuong, top: "LẠC VƯƠNG · LẠC HẦU · LẠC TƯỚNG", sub: "kẻ cai quản", color: C.amber },
  ];
  return (
    <Paper>
      <AbsoluteFill>
        <Img src={img("img-sc-28.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(26,23,20,0.92) 0%, rgba(26,23,20,0.55) 45%, rgba(26,23,20,0.2) 100%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: 220, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 0 }}>
        {nodes.map((n, i) => (
          <React.Fragment key={n.top}>
            <SpringPop startFrac={n.t} from={0.85} style={{ marginBottom: i * 70 }}>
              <div
                style={{
                  border: `3px solid ${n.color}`,
                  background: "rgba(36,31,26,0.94)",
                  borderRadius: 12,
                  padding: "30px 38px",
                  textAlign: "center",
                  minWidth: 430,
                }}
              >
                <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: i === 2 ? 46 : 60, color: n.color }}>{n.top}</div>
                <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 8 }}>{n.sub}</div>
              </div>
            </SpringPop>
            {i < 2 && (
              <svg width="120" height="60" viewBox="0 0 120 60" style={{ marginBottom: i * 70 + 60 }}>
                <path d="M6 30 H96 M82 16 L100 30 L82 44" fill="none" stroke={C.cream} strokeWidth="6" strokeLinecap="round" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* FIX-05: đã xóa chip «ẤN ĐỒNG · DẢI THAO XANH» — 'ấn đồng' chỉ được đọc ở sc-29 */}
      <Reveal startFrac={tCaption} endFrac={tCaption + 0.08} style={{ position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white }}>
          «Chữ Lạc không phải tên riêng đặt bừa — nó <span style={{ color: C.teal }}>mọc lên từ ruộng nước</span>.»
        </span>
      </Reveal>
      <SourceTag text="Đối chứng: Quảng Châu ký (Tư Mã Trinh dẫn lại) — vẫn Lạc vương, Lạc hầu, Lạc tướng" bottom={44} />
    </Paper>
  );
};

// === sc-29 === ẤN ĐỒNG, DẢI THAO XANH — hero prop + seal stamp
export const Sc29: React.FC<SceneProps> = () => {
  const A = useA();
  const tGlow = A("Ấn", 1);
  const tStamp = A("dấu", 1);
  const tQ = A("nổi", 1);
  const tHand = A("mộ", 1);
  const { frame, dur } = useFrac();
  const glow = ease(Math.max(0, Math.min(1, (frame - tGlow * dur) / (0.12 * dur))));
  const orbit = 1.0 + 0.06 * (frame / Math.max(1, dur - 1));
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "center", paddingRight: 120 }}>
        <div
          style={{
            width: 760,
            height: 760,
            borderRadius: "50%",
            overflow: "hidden",
            transform: `scale(${orbit})`,
            boxShadow: `0 0 ${40 + 60 * glow}px rgba(127,209,200,${0.25 + 0.3 * glow})`,
            border: `4px solid rgba(127,209,200,${0.4 + 0.4 * glow})`,
          }}
        >
          <Img src={img("img-sc-29.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </AbsoluteFill>
      {/* dấu triện mực */}
      <div
        style={{
          position: "absolute",
          right: 300,
          top: 140,
          width: 180,
          height: 180,
          border: `${6 * ease(Math.max(0, Math.min(1, (frame - tStamp * dur) / (0.05 * dur))))}px solid ${C.warn}`,
          borderRadius: 10,
          opacity: ease(Math.max(0, Math.min(1, (frame - tStamp * dur) / (0.05 * dur)))),
          transform: `rotate(-8deg) scale(${1.4 - 0.4 * ease(Math.max(0, Math.min(1, (frame - tStamp * dur) / (0.05 * dur))))})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT.display,
          fontSize: 56,
          color: C.warn,
          fontWeight: 800,
        }}
      >
        ẤN
      </div>
      <div style={{ position: "absolute", left: 110, top: 240, width: 760 }}>
        <Reveal startFrac={tGlow} endFrac={tGlow + 0.07}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 72, color: C.white, lineHeight: 1.2 }}>
            «Ấn — con dấu — vật đánh dấu <span style={{ color: C.teal }}>quyền lực trong tay</span>.»
          </div>
        </Reveal>
        <Reveal startFrac={tQ} endFrac={tQ + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 42, color: C.cream, marginTop: 44, lineHeight: 1.45 }}>
            Văn bản đòi hỏi phải có ấn đồng.<br />
            <b style={{ color: C.amber }}>Nền đất có nổi không?</b>
          </div>
        </Reveal>
        <Reveal startFrac={tHand} endFrac={tHand + 0.08}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.teal, marginTop: 44 }}>
            → «Câu trả lời nằm trong những ngôi mộ.»
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// === sc-30 === MỘ THUYỀN VIỆT KHÊ — stat card tang vật
export const Sc30: React.FC<SceneProps> = () => {
  const A = useA();
  const tPlace = A("Việt", 1);
  const tBoats = A("năm", 1);
  const tBar = A("bốn", 1);
  const { frame, dur } = useFrac();
  const bar = ease(Math.max(0, Math.min(1, (frame - tBar * dur) / (0.1 * dur))));
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", left: 340, right: 340, top: 190 }}>
        <SpringPop startFrac={tPlace} from={0.92}>
          <div
            style={{
              border: `3px solid ${C.earth}`,
              background: "rgba(32,24,16,0.94)",
              borderRadius: 12,
              padding: "46px 60px",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.earthGlow }}>
              VIỆT KHÊ · HẢI PHÒNG
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 92, color: C.white, marginTop: 6 }}>
              5 NGÔI MỘ THUYỀN
            </div>
            {/* 5 vệt thuyền nhỏ */}
            <div style={{ display: "flex", gap: 26, marginTop: 26 }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const pop = ease(Math.max(0, Math.min(1, (frame - (tBoats + i * 0.025) * dur) / (0.05 * dur))));
                return (
                  <svg key={i} width="150" height="60" viewBox="0 0 150 60" style={{ opacity: pop }}>
                    <path d="M10 36 Q75 66 140 36 Q75 50 10 36 Z" fill={C.earthGlow} />
                    <rect x="72" y="10" width="6" height="26" fill={C.cream} />
                  </svg>
                );
              })}
            </div>
            {/* thanh đo 4,8 m */}
            <div style={{ marginTop: 40 }}>
              <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream }}>
                Quan tài gỗ lim khoét rỗng — dài gần
              </div>
              <div style={{ position: "relative", height: 54, marginTop: 12 }}>
                <div style={{ position: "absolute", inset: 0, background: C.border, borderRadius: 6 }} />
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${bar * 100}%`, background: C.amber, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 18, fontFamily: FONT.mono, fontWeight: 700, fontSize: 34, color: "#1A1714" }}>
                  4,8 m
                </div>
              </div>
            </div>
          </div>
        </SpringPop>
      </div>
      <SourceTag text="Việt Khê, Hải Phòng — mộ thuyền tầng thủ lĩnh" bottom={54} right />
    </Paper>
  );
};

// === sc-31 === HERO HỒI HAI — MỘ THUYỀN CUTAWAY, wipe từng lớp
export const Sc31: React.FC<SceneProps> = () => {
  const A = useA();
  const tW1 = A("sửng", 1);
  const tW2 = A("vũ", 1);
  const tW3 = A("lượng", 1);
  const { frame, dur } = useFrac();
  const w1 = ease(Math.max(0, Math.min(1, (frame - tW1 * dur) / (0.1 * dur))));
  const w2 = ease(Math.max(0, Math.min(1, (frame - tW2 * dur) / (0.1 * dur))));
  const w3 = ease(Math.max(0, Math.min(1, (frame - tW3 * dur) / (0.1 * dur))));
  const pan = ((frame / Math.max(1, dur - 1)) - 0.5) * 60;
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ transform: `translateX(${-pan}px) scale(1.08)` }}>
        <Img src={img("img-sc-31.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {/* lớp bùn phủ — wipe mở */}
      <AbsoluteFill style={{ background: "rgba(30,22,14,0.88)", opacity: 1 - w1 }} />
      {/* ánh đồng sáng dần trong lòng mộ */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 45% 62%, rgba(217,164,65,0.35) 0%, rgba(217,164,65,0.08) 40%, rgba(0,0,0,0) 70%)",
          opacity: w2,
        }}
      />
      {/* sóng nước sầm sì viền dưới */}
      <svg width="1920" height="200" viewBox="0 0 1920 200" style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.5 }}>
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M-40 ${100 + i * 28} q80 -26 160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0 t160 0`}
            fill="none"
            stroke={C.teal}
            strokeWidth="4"
            opacity={0.5 - i * 0.12}
            transform={`translate(${(frame * (2 + i * 2)) % 320} 0)`}
          />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 100, bottom: 150, width: 900 }}>
        <SpringPop startFrac={tW2} from={0.9}>
          <div style={{ fontFamily: FONT.body, fontSize: 40, lineHeight: 1.45, color: C.cream, background: "rgba(26,23,20,0.8)", padding: "20px 30px", borderRadius: 10 }}>
            Bên trong quan tài: <b style={{ color: C.amber }}>vũ khí đồng · trang sức đồng · những vò đồng</b>
          </div>
        </SpringPop>
        <Reveal startFrac={tW3} endFrac={tW3 + 0.07}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: C.white, marginTop: 20 }}>
            — khối lượng lớn.
          </div>
        </Reveal>
      </div>
      <Reveal startFrac={tW1} endFrac={tW1 + 0.07} style={{ position: "absolute", top: 110, left: 100 }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.white, background: "rgba(26,23,20,0.8)", padding: "10px 26px", borderRadius: 8 }}>
          «Đóng như một chiếc thuyền — chuyến cuối trên sông nước.»
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-32 === TƯƠNG PHẢN TÁNG LỆ: THỦ LĨNH vs THƯỜNG DÂN
export const Sc32: React.FC<SceneProps> = () => {
  const A = useA();
  const tL = A("tầng", 1);
  const tR = A("thường", 1);
  const tTilt = A("chết", 1);
  const tCap = A("đẳng", 1);
  const { frame, dur } = useFrac();
  const tilt = ease(Math.max(0, Math.min(1, (frame - tTilt * dur) / (0.08 * dur)))) * -8;
  return (
    <Paper>
      {/* kim cân — FIX-08: sàn opacity 0.14 để beam mờ hiện ngay từ frame 0 */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: 0.14 + 0.86 * ease(Math.max(0, Math.min(1, (frame - tL * dur) / (0.08 * dur)))) }}>
        <g transform={`rotate(${tilt} 960 240)`}>
          <path d="M460 240 H1460" stroke={C.cream} strokeWidth="8" />
          <path d="M460 240 v50 M1460 240 v50" stroke={C.cream} strokeWidth="6" />
        </g>
        <circle cx="960" cy="240" r="16" fill={C.cream} />
        <path d="M960 256 V330" stroke={C.cream} strokeWidth="6" />
      </svg>
      <div style={{ position: "absolute", left: 180, top: 380, width: 620 }}>
        <SpringPop startFrac={tL} from={0.9}>
          <div
            style={{
              border: `3px solid ${C.earthGlow}`,
              background: "rgba(32,24,16,0.94)",
              borderRadius: 12,
              padding: "34px 40px",
              minHeight: 380,
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: C.earthGlow }}>MỘ THỦ LĨNH</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 24 }}>
              {["rìu", "giáo", "vò đồng", "vòng đồng", "trang sức"].map((x, i) => (
                <Chip key={x} color={C.earthGlow} style={{ opacity: ease(Math.max(0, Math.min(1, (frame - (tL + 0.04 + i * 0.03) * dur) / (0.05 * dur)))) }}>
                  {x}
                </Chip>
              ))}
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, marginTop: 26 }}>
              đồ đồng — chất đầy
            </div>
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", right: 180, top: 380, width: 620 }}>
        <SpringPop startFrac={tR} from={0.9}>
          <div
            style={{
              border: `2px dashed ${C.border}`,
              background: "rgba(36,31,26,0.9)",
              borderRadius: 12,
              padding: "34px 40px",
              minHeight: 380,
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: C.mute }}>MỘ THƯỜNG DÂN</div>
            <div style={{ display: "flex", gap: 18, marginTop: 24 }}>
              <span style={{ width: 70, height: 14, background: C.border, borderRadius: 7 }} />
              <span style={{ width: 70, height: 14, background: C.border, borderRadius: 7, opacity: 0.6 }} />
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute, marginTop: 26 }}>
              ít đồ, mộc mạc
            </div>
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={tCap} endFrac={tCap + 0.08} style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.white }}>
          «Cùng một đất nước, hai đẳng cấp — sống khác nhau, và <span style={{ color: C.warn }}>chết khác nhau</span>.»
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-33 === HAI NGUỒN ĐỘC LẬP HỘI TỤ — XÃ HỘI PHÂN TẦNG
export const Sc33: React.FC<SceneProps> = () => {
  const A = useA();
  const tL = A("Cổ", 1);
  const tR = A("Khai", 1);
  const tJoin = A("cùng", 1);
  const tNote = A("độc", 1);
  const tSub = A("ngai", 1);
  return (
    <Paper>
      {/* FIX-08 — 2 ô placeholder mờ đúng vị trí hai thẻ nguồn, hiện từ frame 0;
          thẻ thật (nền 0.94) sẽ phủ lên khi anchor tới */}
      {[{ left: 150 }, { right: 150 }].map((pos, i) => (
        <Reveal
          key={i}
          startFrac={0.0}
          endFrac={0.03}
          dy={0}
          style={{ position: "absolute", top: 160, width: 660, height: 210, ...pos }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              border: `2px dashed ${C.border}`,
              borderRadius: 12,
              background: "rgba(36,31,26,0.35)",
            }}
          />
        </Reveal>
      ))}
      <div style={{ position: "absolute", left: 150, top: 160, width: 660 }}>
        <SpringPop startFrac={tL} from={0.9}>
          <div
            style={{
              border: `3px solid ${C.amber}`,
              background: "rgba(36,31,26,0.94)",
              borderRadius: 12,
              padding: "30px 38px",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: C.amber }}>CỔ THƯ NÓI</div>
            <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 12, lineHeight: 1.4 }}>
              Lạc vương, Lạc hầu, Lạc tướng — kẻ cai quản, <b>có ấn đồng</b>
            </div>
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", right: 150, top: 160, width: 660 }}>
        <SpringPop startFrac={tR} from={0.9}>
          <div
            style={{
              border: `3px solid ${C.earth}`,
              background: "rgba(32,24,16,0.94)",
              borderRadius: 12,
              padding: "30px 38px",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 28, letterSpacing: 3, color: C.earthGlow }}>KHAI QUẬT CHO THẤY</div>
            <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 12, lineHeight: 1.4 }}>
              tầng thủ lĩnh với vũ khí, tài sản đồng khối lớn — thường dân <b>gần trống tay</b>
            </div>
          </div>
        </SpringPop>
      </div>
      <ConvergeArrows tJoin={tJoin} />
      <SpringPop startFrac={tJoin} from={0.85} style={{ position: "absolute", left: 480, right: 480, top: 600, textAlign: "center" }}>
        <div
          style={{
            border: `4px solid ${C.white}`,
            background: "rgba(36,31,26,0.97)",
            borderRadius: 14,
            padding: "34px 46px",
            boxShadow: "0 0 40px rgba(232,220,200,0.15)",
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 76, color: C.white }}>XÃ HỘI PHÂN TẦNG</div>
        </div>
      </SpringPop>
      <Reveal startFrac={tNote} endFrac={tNote + 0.07} style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream }}>
          «Hai nguồn <b style={{ color: C.amber }}>độc lập</b> — một trang chữ, một nền mộ»
        </span>
      </Reveal>
      <Reveal startFrac={tSub} endFrac={tSub + 0.07} style={{ position: "absolute", bottom: 66, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute }}>
          không thấy điện ngai — thấy <b>con người đứng đầu</b>
        </span>
      </Reveal>
    </Paper>
  );
};

const ConvergeArrows: React.FC<{ tJoin: number }> = ({ tJoin }) => {
  const { frame, dur } = useFrac();
  const t = ease(Math.max(0, Math.min(1, (frame - tJoin * dur) / (0.07 * dur))));
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g opacity={t}>
        <path d="M470 430 C650 540 780 540 880 600" fill="none" stroke={C.amber} strokeWidth="7" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
        <path d="M1450 430 C1270 540 1140 540 1040 600" fill="none" stroke={C.earth} strokeWidth="7" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
      </g>
    </svg>
  );
};

// === sc-34 === CÂU NEO HỒI HAI — chức danh bỗng CÓ NGƯỜI NGỒI
export const Sc34: React.FC<SceneProps> = () => {
  const A = useA();
  const tLine = A("cách", 1);
  const tSit = A("ngồi", 1);
  const { frame, dur } = useFrac();
  const sit = ease(Math.max(0, Math.min(1, (frame - tSit * dur) / (0.08 * dur))));
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 150 }}>
        <Reveal startFrac={tLine} endFrac={tLine + 0.07}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 90, color: C.white, textAlign: "center" }}>
            Chức danh trong cổ thư<br />bỗng <span style={{ color: C.amber }}>CÓ NGƯỜI NGỒI</span>
          </div>
        </Reveal>
      </AbsoluteFill>
      {/* ô chức danh trống — bóng silhouette hạ xuống ngồi vào */}
      <div style={{ position: "absolute", left: 810, top: 560, width: 300 }}>
        <div
          style={{
            border: `${sit > 0.4 ? 3 : 2}px ${sit > 0.4 ? "solid" : "dashed"} ${sit > 0.4 ? C.amber : C.border}`,
            borderRadius: 12,
            background: sit > 0.4 ? "rgba(217,164,65,0.08)" : "rgba(36,31,26,0.85)",
            height: 240,
            position: "relative",
            boxShadow: sit > 0.4 ? "0 0 34px rgba(217,164,65,0.25)" : undefined,
          }}
        >
          <div style={{ position: "absolute", top: 10, left: 20, fontFamily: FONT.body, fontSize: 26, color: C.mute }}>Lạc vương</div>
          <svg width="300" height="240" viewBox="0 0 300 240">
            <circle cx="150" cy={110 - sit * 30} r="26" fill="none" stroke={C.amber} strokeWidth="5" opacity={sit} />
            <path
              d={`M150 ${136 - sit * 30} C110 190 118 208 150 208 M150 ${136 - sit * 30} C190 190 182 208 150 208 M150 ${142 - sit * 30} V206`}
              fill="none"
              stroke={C.amber}
              strokeWidth="5"
              opacity={sit}
            />
          </svg>
        </div>
      </div>
    </Paper>
  );
};

// === sc-35 === KHUNG TOÀN THƯ — Hồng Bàng legend stat
export const Sc35: React.FC<SceneProps> = () => {
  const A = useA();
  const tFrame = A("phát", 1);
  const tBar = A("tám", 1);
  const tCount = A("tổng", 1);
  const tWarn = A("năm", 1);
  const { frame, dur } = useFrac();
  const bar = ease(Math.max(0, Math.min(1, (frame - tBar * dur) / (0.12 * dur))));
  return (
    <Paper>
      <div style={{ position: "absolute", left: 380, right: 380, top: 240 }}>
        <SpringPop startFrac={tFrame} from={0.92}>
          <LegendFrame label="TRUYỀN THUYẾT KỂ — TOÀN THƯ ĐẶT">
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 72, color: C.white }}>
              VƯƠNG TRIỀU HỒNG BÀNG
            </div>
            <div style={{ position: "relative", height: 62, marginTop: 30 }}>
              <div style={{ position: "absolute", inset: 0, background: C.border, borderRadius: 8 }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${bar * 100}%`, background: `linear-gradient(90deg, ${C.amber}, ${C.earthGlow})`, borderRadius: 8, opacity: 0.9 }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", fontFamily: FONT.mono, fontSize: 32, color: C.cream }}>
                <span>2879 TCN</span>
                <span>258 TCN</span>
              </div>
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.amber, marginTop: 30, textAlign: "center" }}>
              <CountUpLocal startFrac={tCount} to={2622} suffix=" năm" />
            </div>
            <Reveal startFrac={tWarn} endFrac={tWarn + 0.08}>
              <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 22, textAlign: "center", opacity: 0.85 }}>
                cả hai con số đều là khung cổ thư — không phải sử liệu khảo chứng
              </div>
            </Reveal>
          </LegendFrame>
        </SpringPop>
      </div>
    </Paper>
  );
};

const CountUpLocal: React.FC<{ startFrac: number; to: number; suffix?: string }> = ({ startFrac, to, suffix = "" }) => {
  const { p } = useFrac();
  const t = ease(p(startFrac, startFrac + 0.1));
  const v = Math.round(to * t);
  const withDots = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {withDots}
      {suffix}
    </span>
  );
};

// === sc-36 === PHÉP CHIA MINH HỌA GÂY SỐC — stamp phủ định
export const Sc36: React.FC<SceneProps> = () => {
  const A = useA();
  const tL1 = A("phép", 2);
  const tL2 = A("đời", 2);
  const tL3 = A("một", 3);
  const tTicks = A("trị", 1);
  const tStamp = A("Sinh", 1);
  const { frame, dur } = useFrac();
  const blink = 0.6 + 0.4 * Math.abs(Math.sin(frame / 6));
  const stamp = ease(Math.max(0, Math.min(1, (frame - tStamp * dur) / (0.06 * dur))));
  return (
    <Paper>
      <PhuongDoanTag />
      <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center" }}>
        <Reveal startFrac={tL1} endFrac={tL1 + 0.05}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: C.white }}>
            2.622 năm <span style={{ color: C.mute, fontSize: 64 }}>÷</span>
          </div>
        </Reveal>
        <Reveal startFrac={tL2} endFrac={tL2 + 0.05}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: C.white }}>
            18 đời <span style={{ color: C.mute, fontSize: 64 }}>—</span>
          </div>
        </Reveal>
        <Reveal startFrac={tL3} endFrac={tL3 + 0.06}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.warn, opacity: frame > tL3 * dur ? blink : 1, marginTop: 10 }}>
            ≈ 145 năm / đời
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 8, opacity: 0.85 }}>
            (phép chia minh họa — nếu tạm tin cả hai con số)
          </div>
        </Reveal>
      </div>
      {/* 18 vạch đời bằng nhau */}
      <div style={{ position: "absolute", left: 210, right: 210, bottom: 250, display: "flex", gap: 8 }}>
        {Array.from({ length: 18 }, (_, i) => {
          const lit = ease(Math.max(0, Math.min(1, (frame - (tTicks + i * 0.014) * dur) / (0.03 * dur))));
          return (
            <div key={i} style={{ flex: 1, height: 54, border: `2px solid ${C.amber}`, borderRadius: 4, opacity: 0.2 + 0.8 * lit }} />
          );
        })}
      </div>
      <Reveal startFrac={tTicks + 0.28} endFrac={tTicks + 0.36} style={{ position: "absolute", bottom: 190, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream }}>
          mỗi vị vua phải trị vì gần <b>một thế kỷ rưỡi</b>
        </span>
      </Reveal>
      {/* stamp phủ định */}
      <div
        style={{
          position: "absolute",
          right: 140,
          bottom: 90,
          border: `${8 * stamp}px solid ${C.warn}`,
          borderRadius: 12,
          padding: "20px 38px",
          transform: `rotate(-7deg) scale(${1.5 - 0.5 * stamp})`,
          opacity: stamp,
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: 52,
          color: C.warn,
          letterSpacing: 2,
          background: "rgba(26,23,20,0.6)",
        }}
      >
        SINH HỌC KHÔNG CHO PHÉP
      </div>
    </Paper>
  );
};

// === sc-37 === HAI CÁCH ĐỌC — đều đóng khung phỏng đoán
export const Sc37: React.FC<SceneProps> = () => {
  const A = useA();
  const tL = A("cách", 1);
  const tR = A("thế", 1);
  const t3 = A("liên", 1);
  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 160, display: "flex", justifyContent: "center", gap: 60 }}>
        <SpringPop startFrac={tL} from={0.9}>
          <div
            style={{
              width: 660,
              border: `3px solid ${C.amber}`,
              background: "rgba(36,31,26,0.94)",
              borderRadius: 12,
              padding: "40px 44px",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: -22, right: 30, border: `2px solid ${C.warn}`, color: C.warn, borderRadius: 6, padding: "4px 16px", fontFamily: FONT.body, fontWeight: 700, fontSize: 26, background: "rgba(26,23,20,0.9)" }}>
              PHỎNG ĐOÁN
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 88, color: C.white }}>18 ĐỜI VUA</div>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 12 }}>— truyền thuyết kể</div>
          </div>
        </SpringPop>
        <SpringPop startFrac={tR} from={0.9}>
          <div
            style={{
              width: 660,
              border: `3px solid ${C.teal}`,
              background: "rgba(36,31,26,0.94)",
              borderRadius: 12,
              padding: "40px 44px",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: -22, right: 30, border: `2px solid ${C.warn}`, color: C.warn, borderRadius: 6, padding: "4px 16px", fontFamily: FONT.body, fontWeight: 700, fontSize: 26, background: "rgba(26,23,20,0.9)" }}>
              PHỎNG ĐOÁN
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 88, color: C.white }}>
              18 <span style={{ color: C.teal }}>THẾ KỶ</span>
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 12 }}>
              — có thể: danh xưng cho cả một dòng vua
            </div>
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={t3} endFrac={t3 + 0.08} style={{ position: "absolute", bottom: 170, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, background: "rgba(20,17,13,0.8)", padding: "16px 34px", borderRadius: 10 }}>
          «Giả thuyết 18 dòng họ liên minh — cũng chỉ là phỏng đoán, không hơn.»
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-38 === BIẾN HÌNH 18 ĐỜI → 18 THẾ KỶ + TITLE HỒI BA
export const Sc38: React.FC<SceneProps> = () => {
  const A = useA();
  const tMorph = A("đóng", 1);
  const tTeal = A("dân", 1);
  const tTitle = A("gen", 1);
  const { frame, dur } = useFrac();
  const morph = ease(Math.max(0, Math.min(1, (frame - tMorph * dur) / (0.14 * dur))));
  const teal = ease(Math.max(0, Math.min(1, (frame - tTeal * dur) / (0.14 * dur))));
  const stretch = 1 + Math.sin(morph * Math.PI) * 0.35;
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ opacity: 1 - teal * 0.6 }}>
        <AbsoluteFill
          style={{
            background: `linear-gradient(to top, rgba(47,93,107,${teal * 0.5}) 0%, rgba(26,23,20,${1 - teal * 0.4}) 60%)`,
            opacity: teal,
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, top: 240, textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 120,
              color: C.white,
              transform: `scaleX(${stretch})`,
              opacity: 1 - morph,
            }}
          >
            18 ĐỜI
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 120,
              color: teal > 0.4 ? C.teal : C.white,
              transform: `scaleX(${2 - stretch})`,
              opacity: morph,
              position: morph > 0.5 ? "relative" : "absolute",
              top: morph > 0.5 ? 0 : 240,
              width: "100%",
            }}
          >
            18 THẾ KỶ
          </div>
        </div>
      </AbsoluteFill>
      <SpringPop startFrac={tTitle} from={0.88} style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 10, color: C.teal }}>
          HỒI BA
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 100, color: C.white, marginTop: 10 }}>
          DNA <span style={{ color: C.teal }}>đếm nhịp</span>
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 18 }}>
          «dân số thì đã có người đếm — bằng máu, bằng gen»
        </div>
      </SpringPop>
      {/* sợi xoắn mảnh teal quen thuộc Ep.02 */}
      <svg width="1920" height="300" viewBox="0 0 1920 300" style={{ position: "absolute", bottom: 40, opacity: teal }}>
        <path
          d="M100 150 C340 40 580 260 820 150 C1060 40 1300 260 1540 150 C1660 95 1780 95 1840 150"
          fill="none"
          stroke={C.teal}
          strokeWidth="4"
          opacity="0.7"
        />
        <path
          d="M100 150 C340 260 580 40 820 150 C1060 260 1300 40 1540 150 C1660 205 1780 205 1840 150"
          fill="none"
          stroke={C.teal}
          strokeWidth="4"
          opacity="0.4"
        />
      </svg>
    </Paper>
  );
};
