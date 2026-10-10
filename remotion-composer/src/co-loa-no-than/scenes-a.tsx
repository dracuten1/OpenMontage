// VN-Myth Ep.04 — scenes group A: sc001..sc010 (hook, flyover tease, ba hồ sơ,
// recap Ep.03, hợp nhất Âu Lạc, An Dương Vương, chọn kinh đô, Đông Sơn, câu hỏi dẫn,
// chín lần lún). Speech-lock: mọi animation fire tại A("từ", occ).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  CrossbowGlyph,
  InkImageScene,
  Paper,
  Reveal,
  SoundRipples,
  SourceTag,
  SpringPop,
  circleD,
  useA,
  useFrac,
  ease,
} from "./common";

// === sc001 === MỞ TẬP — hero title + cây nỏ ink vẽ theo stroke
export const Sc001: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tBow = A("nỏ", 1); // «Chiếc nỏ một phát bắn vạn mũi tên»
  const tTag = A("thần", 1); // «Nghe như thần thoại»
  const { frame, dur } = useFrac(durationInFrames);
  const bowT = Math.max(0, Math.min(1, (frame - tBow * dur) / (0.24 * dur)));
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Reveal startFrac={0.005} endFrac={0.04}>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: 8,
              color: C.amber,
              marginBottom: 26,
            }}
          >
            VN-MYTH · TẬP 4
          </div>
        </Reveal>
        <SpringPop startFrac={0.01} from={0.9}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 148,
              lineHeight: 1.04,
              color: C.white,
              textAlign: "center",
              textShadow: "0 6px 30px rgba(0,0,0,0.6)",
            }}
          >
            CỔ LOA
          </div>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 78,
              lineHeight: 1.1,
              color: C.amber,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            VÀ CÁI NỎ THẦN
          </div>
        </SpringPop>
        <Reveal startFrac={tTag} endFrac={tTag + 0.06}>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: 500,
              fontSize: 40,
              color: C.cream,
              marginTop: 34,
              letterSpacing: 2,
            }}
          >
            khi Rồng mất nước
          </div>
        </Reveal>
      </AbsoluteFill>
      {/* cây nỏ ink — dây cung căng phóng nhẹ rồi giữ */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <CrossbowGlyph x={960} y={812} scale={0.92} progress={ease(bowT)} />
      </svg>
      <SourceTag text="Huyền sử Việt Nam — VN-MYTH Ep.04" bottom={48} right />
    </Paper>
  );
};

// === sc002 === FLYOVER TEASE — camera cúi xuống ba vòng xoáy ốc, nhãn 17 km
export const Sc002: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tRings = A("còn", 1); // «vẫn còn nguyên»
  const tKm = A("mười", 1); // «cách Hà Nội mười bảy cây số»
  const tSpiral = A("xoáy", 1); // «ba vòng đất xoáy trôn ốc»
  const { frame, dur } = useFrac(durationInFrames);
  // crane_down: từ trên cao (scale to) về gần (scale 1)
  const crane = ease(Math.max(0, Math.min(1, frame / Math.max(1, dur))));
  const scale = 1.42 - 0.42 * crane;
  return (
    <Paper variant="earth">
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${scale})`,
        }}
      >
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          {[520, 380, 240].map((r, i) => (
            <path
              key={i}
              d={circleD(960, 560, r)}
              fill="none"
              stroke={i === 2 ? C.cream : C.earthGlow}
              strokeWidth={i === 2 ? 7 : 5}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - ease(Math.max(0, Math.min(1, (frame - (tRings + i * 0.05) * dur) / (0.3 * dur))))}
              opacity={0.9}
            />
          ))}
          <path
            d={`M 960 560 m -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0`}
            fill={C.amber}
            opacity={ease(Math.max(0, Math.min(1, (frame - tSpiral * dur) / (0.1 * dur))))}
          />
        </svg>
      </AbsoluteFill>
      {/* hạt bụi lơ lửng */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 18 }, (_, i) => (
          <circle
            key={i}
            cx={((i * 211 + frame * (1 + (i % 3))) % 1920)}
            cy={120 + ((i * 173 + frame * (0.5 + (i % 4) * 0.4)) % 840)}
            r={1.6 + (i % 3)}
            fill={C.cream}
            opacity={0.14}
          />
        ))}
      </svg>
      <SpringPop startFrac={tKm} from={0.86} style={{ position: "absolute", top: 96, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Chip color={C.amber} style={{ fontSize: 40, padding: "12px 34px", fontFamily: FONT.mono }}>
          17 km (Cổ Loa – Hà Nội)
        </Chip>
      </SpringPop>
      <SourceTag text="Ba vòng đất đã nằm im hơn hai nghìn năm" bottom={48} right />
    </Paper>
  );
};

// === sc003 === BA HỒ SƠ — ba tập rơi xuống theo thứ tự narration xướng tên
export const Sc003: React.FC<SceneProps> = () => {
  const A = useA();
  const t1 = A("nhất", 1); // «Hồ sơ thứ nhất: truyền thuyết Việt»
  const t2 = A("hai", 2); // «Hồ sơ thứ hai: sử Hán»
  const t3 = A("ba", 3); // «Hồ sơ thứ ba: nền đất»
  const tName = A("tên", 1); // «cùng chỉ về một cái tên: Cổ Loa»
  const dossiers = [
    { t: t1, icon: "🐢", title: "TRUYỀN THUYẾT VIỆT", sub: "rùa vàng · nỏ thần · vết lông ngơ", border: C.amber, bg: "rgba(217,164,65,0.10)" },
    { t: t2, icon: "🖌", title: "SỬ HÁN", sub: "vài dòng lạnh lùng của bên thôn tính", border: C.cream, bg: "rgba(232,220,200,0.07)" },
    { t: t3, icon: "⌂", title: "NỀN ĐẤT", sub: "thứ không biết nói dối", border: C.earthGlow, bg: "rgba(138,90,51,0.16)" },
  ];
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ display: "flex", gap: 56, alignItems: "flex-end" }}>
          {dossiers.map((d, i) => (
            <SpringPop key={i} startFrac={d.t} from={0.82} style={{ transformOrigin: "50% 100%" }}>
              <div
                style={{
                  width: 430,
                  minHeight: 330,
                  border: `3px solid ${d.border}`,
                  borderRadius: 8,
                  background: `linear-gradient(0deg, ${d.bg}, rgba(36,31,26,0.94))`,
                  padding: "38px 34px",
                  boxShadow: "0 22px 50px rgba(0,0,0,0.55)",
                }}
              >
                <div style={{ fontSize: 66, marginBottom: 18 }}>{d.icon}</div>
                <div
                  style={{
                    fontFamily: FONT.body,
                    fontWeight: 700,
                    fontSize: 38,
                    letterSpacing: 2,
                    color: d.border,
                    lineHeight: 1.2,
                  }}
                >
                  {d.title}
                </div>
                <div
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 30,
                    color: C.cream,
                    marginTop: 16,
                    lineHeight: 1.45,
                  }}
                >
                  {d.sub}
                </div>
              </div>
            </SpringPop>
          ))}
        </div>
        <Reveal startFrac={tName} endFrac={tName + 0.1}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 66,
              color: C.white,
              letterSpacing: 4,
              marginTop: 26,
            }}
          >
            Ba hồ sơ — một <span style={{ color: C.amber }}>CỔ LOA</span>
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Ba giọng kể — không bên nào biết bên kia viết gì" bottom={44} right />
    </Paper>
  );
};

// === sc004 === RECAP — f07 Hùng Vương silhouette trôi vào quá khứ
export const Sc004: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tFade = A("quá", 1); // «Văn Lang ... trôi vào quá khứ»
  const tPair = A("thay", 1); // «thay triều đại — không phải thay dân»
  const { frame, dur, p } = useFrac(durationInFrames);
  const drift = ease(p(tFade, tFade + 0.3));
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            transform: `translateY(${-drift * 60}px) scale(${1 + drift * 0.06})`,
            opacity: 0.92 - drift * 0.55,
            filter: `blur(${drift * 5}px)`,
          }}
        >
          <Img
            src={staticFile("co-loa-no-than/images/f07-hung-vuong.png")}
            style={{ height: 640, objectFit: "contain" }}
          />
        </div>
        {/* hạt mực bay lên khi tranh mờ dần */}
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: 22 }, (_, i) => {
            const gy = 900 - ((frame * (2 + (i % 4)) + i * 131) % 900);
            return (
              <circle key={i} cx={330 + ((i * 167) % 1260)} cy={gy} r={2 + (i % 3)} fill={C.cream} opacity={drift * 0.5} />
            );
          })}
        </svg>
        <Reveal startFrac={tPair} endFrac={tPair + 0.12}>
          <div style={{ display: "flex", gap: 40, marginTop: 20 }}>
            <div
              style={{
                border: `2px solid ${C.amber}`,
                borderRadius: 8,
                padding: "20px 36px",
                background: "rgba(36,31,26,0.9)",
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 44,
                color: C.white,
              }}
            >
              thay <span style={{ color: C.amber }}>triều đại</span>
            </div>
            <div
              style={{
                border: `2px solid ${C.cream}`,
                borderRadius: 8,
                padding: "20px 36px",
                background: "rgba(36,31,26,0.9)",
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 44,
                color: C.white,
              }}
            >
              không phải thay <span style={{ color: C.cream }}>dân</span>
            </div>
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Tập trước — Vua Hùng trong đồng (Ep.03)" bottom={44} right />
    </Paper>
  );
};

// === sc005 === BẢN ĐỒ NHẬP NHẤT — hai mảng đất合 thành Âu Lạc
export const Sc005: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tLac = A("Lạc", 1); // «Lạc Việt ở đồng bằng lúa nước»
  const tThuc = A("Thục", 1); // «Thục Phán»
  const tMerge = A("Âu", 1); // «dựng nên nước Âu Lạc»
  const { p } = useFrac(durationInFrames);
  const slide = ease(p(tMerge - 0.06, tMerge + 0.1));
  return (
    <Paper variant="earth">
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* Lạc Việt — đồng bằng lúa nước bên trái */}
        <g transform={`translate(${-slide * 300} 0)`} opacity={ease(p(tLac - 0.05, tLac + 0.05))}>
          <path
            d="M 220 420 Q 420 300 640 380 Q 760 430 720 620 Q 660 760 440 740 Q 260 720 220 420 Z"
            fill="rgba(201,143,78,0.14)"
            stroke={C.earthGlow}
            strokeWidth={5}
          />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M 280 ${470 + i * 60} q 40 -18 80 0 q 40 18 80 0 q 40 -18 80 0`} fill="none" stroke={C.cream} strokeWidth={2.5} opacity={0.5} />
          ))}
        </g>
        {/* Tây Âu — núi rậm nét mực dày bên phải */}
        <g transform={`translate(${slide * 300} 0)`} opacity={ease(p(tLac - 0.02, tLac + 0.08))}>
          <path
            d="M 1240 400 Q 1440 280 1660 380 Q 1760 440 1700 630 Q 1630 770 1420 750 Q 1260 730 1240 400 Z"
            fill="rgba(232,220,200,0.06)"
            stroke={C.cream}
            strokeWidth={6}
          />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${1300 + i * 120} 700 l 60 -${170 + i * 20} l 60 ${170 + i * 20}`} fill="none" stroke={C.cream} strokeWidth={5} opacity={0.75} />
          ))}
        </g>
        {/* khối hợp nhất */}
        <path
          d={circleD(960, 560, 250)}
          fill="none"
          stroke={C.amber}
          strokeWidth={8}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - slide}
          opacity={slide > 0 ? 1 : 0}
        />
      </svg>
      <div style={{ position: "absolute", top: 200, left: 130 }}>
        <Reveal startFrac={tLac} endFrac={tLac + 0.06}>
          <Chip color={C.earthGlow}>LẠC VIỆT — đồng bằng lúa nước</Chip>
        </Reveal>
      </div>
      <div style={{ position: "absolute", top: 200, right: 130 }}>
        <Reveal startFrac={tLac + 0.03} endFrac={tLac + 0.09}>
          <Chip color={C.cream}>TÂY ÂU — miền núi</Chip>
        </Reveal>
      </div>
      <SpringPop startFrac={tMerge + 0.06} from={0.8} style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 110,
            color: C.white,
            textShadow: "0 4px 24px rgba(0,0,0,0.7)",
          }}
        >
          ÂU LẠC
        </div>
        <Reveal startFrac={tThuc} endFrac={tThuc + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 12 }}>
            Thục Phán / An Dương Vương
          </div>
        </Reveal>
      </SpringPop>
      <SourceTag text="Hai mảng đất — một mái nhà (207 TCN theo truyền thuyết)" bottom={44} right />
    </Paper>
  );
};

// === sc006 === AN DƯƠNG VƯƠNG — chân dung + thẻ mốc thế kỷ III TCN
export const Sc006: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tName = A("hiệu", 1); // «lấy hiệu An Dương Vương»
  const tMoc = A("ba", 1); // «thế kỷ thứ ba trước Công nguyên»
  const { p } = useFrac(durationInFrames);
  return (
    <InkImageScene src="img-sc006.png" focus={{ x: 0.5, y: 0.42 }} label="AN DƯƠNG VƯƠNG" sublabel="Thục Phán — vị vua chọn nơi trống trải nhất để dựng kinh đô">
      <div style={{ position: "absolute", top: 84, right: 84 }}>
        <SpringPop startFrac={tMoc} from={0.84}>
          <div
            style={{
              border: `2px solid ${C.amber}`,
              borderRadius: 8,
              background: "rgba(26,23,20,0.85)",
              padding: "14px 30px",
              fontFamily: FONT.mono,
              fontSize: 38,
              color: C.amber,
              letterSpacing: 2,
            }}
          >
            thế kỷ III TCN
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", top: 84, left: 84 }}>
        <Reveal startFrac={tName} endFrac={tName + 0.08}>
          <Chip color={C.cream}>Thục Phán / An Dương Vương</Chip>
        </Reveal>
      </div>
      {/* vệt mực ngang gợi gió đồng bằng */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: ease(p(0.1, 0.3)) * 0.35 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M -40 ${880 + i * 34} q 240 -22 520 0 t 520 0 t 520 0 t 520 0`} fill="none" stroke={C.cream} strokeWidth={2} />
        ))}
      </svg>
    </InkImageScene>
  );
};

// === sc007 === CHỌN KINH ĐÔ — bản đồ sông Hồng, điểm sáng Đông Anh
export const Sc007: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tRiver = A("bản", 1); // «đọc được trên bản đồ Hà Nội»
  const tDot = A("Cổ", 1); // «Cổ Loa, huyện Đông Anh»
  const tClose = A("thành", 1); // «cần một tòa thành»
  const { frame, dur, p } = useFrac(durationInFrames);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 7);
  return (
    <Paper variant="earth">
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* sông Hồng uốn lượn */}
        <path
          d="M 240 980 C 420 820 520 700 640 640 C 800 560 860 520 920 460 C 1000 380 1120 320 1300 260 C 1460 208 1600 150 1780 90"
          fill="none"
          stroke={C.teal}
          strokeWidth={9}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(p(tRiver - 0.08, tRiver + 0.18))}
          opacity={0.85}
        />
        {/* đồng bằng nét mực */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M 320 ${240 + i * 110} q 200 -26 420 0 q 200 26 420 0 q 200 -26 420 0`} fill="none" stroke={C.cream} strokeWidth={2} opacity={0.18} />
        ))}
        {/* điểm sáng Đông Anh */}
        <g>
          <circle cx={1030} cy={500} r={26 + pulse * 16} fill={C.amber} opacity={0.22 * ease(p(tDot, tDot + 0.05))} />
          <circle cx={1030} cy={500} r={13} fill={C.amber} opacity={ease(p(tDot, tDot + 0.04))} />
          <path d={`M 1030 500 l ${160 + pulse * 26} 0`} stroke={C.amber} strokeWidth={3} opacity={0.6} />
        </g>
      </svg>
      <SpringPop startFrac={tDot} from={0.85} style={{ position: "absolute", left: 1210, top: 420 }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 64,
            color: C.white,
            textShadow: "0 3px 16px rgba(0,0,0,0.8)",
          }}
        >
          CỔ LOA
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.cream, marginTop: 4 }}>huyện Đông Anh</div>
      </SpringPop>
      <Reveal startFrac={tClose} endFrac={tClose + 0.12} style={{ position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 56,
            color: C.amber,
            textShadow: "0 3px 16px rgba(0,0,0,0.8)",
          }}
        >
          «Để sống sót nơi trống trải — cần một tòa thành.»
        </div>
      </Reveal>
      <SourceTag text="Nơi bằng phẳng, trống trải nhất của đồng bằng" bottom={40} right />
    </Paper>
  );
};

// === sc008 === DÒNG THỜI GIAN ĐÔNG SƠN + backdrop f11
export const Sc008: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const marks = [
    { t: A("Nguyên", 1), label: "Phùng Nguyên" },
    { t: A("Đậu", 1), label: "Đồng Đậu" },
    { t: A("Mun", 1), label: "Gò Mun" },
    { t: A("Sơn", 1), label: "Đông Sơn" },
  ];
  const tDuc = A("đúc", 1); // «truyền thống đúc đồng»
  const { frame, dur } = useFrac(durationInFrames);
  const lineT = ease(Math.max(0, Math.min(1, (frame - 0.02 * dur) / (0.16 * dur))));
  return (
    <Paper variant="teal">
      <AbsoluteFill style={{ opacity: 0.16, filter: "blur(2px)" }}>
        <Img src={staticFile("co-loa-no-than/images/f11-dong-son.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Reveal startFrac={0.02} endFrac={0.08}>
          <Chip color={C.teal}>làng nghề kim khí — hàng nghìn năm liên tục</Chip>
        </Reveal>
        <svg width="1500" height="360" viewBox="0 0 1500 360" style={{ marginTop: 40 }}>
          <path d="M 60 180 H 1440" stroke={C.teal} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lineT} opacity={0.9} />
          {marks.map((m, i) => (
            <g key={i}>
              <circle cx={170 + i * 380} cy={180} r={16} fill={C.bg} stroke={C.teal} strokeWidth={5} />
              <circle cx={170 + i * 380} cy={180} r={7} fill={C.teal} opacity={ease(Math.max(0, Math.min(1, (frame - m.t * dur) / (0.04 * dur))))} />
            </g>
          ))}
        </svg>
        <div style={{ display: "flex", gap: 60, marginTop: 8 }}>
          {marks.map((m, i) => (
            <SpringPop key={i} startFrac={m.t} from={0.7}>
              <div style={{ width: 300, textAlign: "center" }}>
                <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: i === 3 ? C.white : C.cream }}>{m.label}</div>
                {i === 3 && (
                  <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.teal, marginTop: 8 }}>truyền thống đúc đồng chín muồi</div>
                )}
              </div>
            </SpringPop>
          ))}
        </div>
        <Reveal startFrac={tDuc} endFrac={tDuc + 0.1}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.white, marginTop: 46 }}>
            Đến thời Âu Lạc — <span style={{ color: C.teal }}>đúc đồng đã chín muồi</span>
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Từ Phùng Nguyên → Đồng Đậu → Gò Mun → Đông Sơn" bottom={40} right />
    </Paper>
  );
};

// === sc009 === CÂU HỎI DẪN — 'Tự vệ bằng gì?'
export const Sc009: React.FC<SceneProps> = () => {
  const A = useA();
  const tQ = A("tự", 1); // «một nước non trẻ tự vệ bằng gì?»
  const tTruyen = A("truyền", 1); // «trước trong truyền thuyết»
  const tNen = A("nền", 1); // «sau trong nền đất»
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SpringPop startFrac={tQ} from={0.72}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 150,
              color: C.white,
              textShadow: "0 6px 30px rgba(0,0,0,0.6)",
            }}
          >
            Tự vệ bằng gì?
          </div>
        </SpringPop>
        <div style={{ display: "flex", gap: 48, marginTop: 70 }}>
          <Reveal startFrac={tTruyen} endFrac={tTruyen + 0.08}>
            <div
              style={{
                border: `2px solid ${C.amber}`,
                borderRadius: 10,
                padding: "22px 44px",
                background: "rgba(36,31,26,0.92)",
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 40,
                color: C.cream,
              }}
            >
              trước — trong <span style={{ color: C.amber }}>truyền thuyết</span>
            </div>
          </Reveal>
          <Reveal startFrac={tNen} endFrac={tNen + 0.08}>
            <div
              style={{
                border: `2px solid ${C.earthGlow}`,
                borderRadius: 10,
                padding: "22px 44px",
                background: "rgba(36,31,26,0.92)",
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 40,
                color: C.cream,
              }}
            >
              sau — trong <span style={{ color: C.earthGlow }}>nền đất</span>
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Câu trả lời chi phối toàn bộ phần còn lại của tập này" bottom={44} right />
    </Paper>
  );
};

// === sc010 === CHÍN LẦN LÚN — tường đắp lên rồi sụp, lặp nhịp ba
export const Sc010: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tLun = A("lún", 1); // «thành lại lún»
  const tChu = A("Chín", 1); // «Chín lần đắp, chín lần lún»
  const { frame, dur } = useFrac(durationInFrames);
  // nhịp đắp→sụp: 3 chu kỳ tính từ tLun
  const cyc = Math.max(0, (frame - tLun * dur) / (0.24 * dur));
  const phase = cyc - Math.floor(cyc);
  const build = Math.min(1, phase * 2); // 0→1 nửa đầu chu kỳ
  const wallH = 60 + build * 300;
  const collapse = cyc > 0 ? (phase > 0.5 ? (phase - 0.5) * 2 : 0) : 0;
  const hEff = wallH * (1 - collapse);
  const debris = collapse;
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1400" height="620" viewBox="0 0 1400 620">
          {/* mặt đất */}
          <path d="M 80 560 H 1320" stroke={C.cream} strokeWidth={5} opacity={0.7} />
          {/* tường thành đắp lên */}
          <path
            d={`M 320 ${560 - hEff} H 1080 L 1040 560 H 360 Z`}
            fill="rgba(138,90,51,0.5)"
            stroke={C.earthGlow}
            strokeWidth={6}
          />
          {/* vệt lớp đắp */}
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M 350 ${540 - i * (hEff / 5)} H 1050`} stroke={C.cream} strokeWidth={2} opacity={0.25 * build} />
          ))}
          {/* đất rơi khi sụp */}
          {debris > 0 &&
            Array.from({ length: 14 }, (_, i) => (
              <circle key={i} cx={380 + i * 52} cy={540 - debris * (40 + (i % 5) * 60)} r={4 + (i % 3) * 2} fill={C.earth} opacity={debris * 0.9} />
            ))}
        </svg>
        <Reveal startFrac={tChu} endFrac={tChu + 0.14}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 84,
              color: C.white,
              marginTop: 30,
              textShadow: "0 4px 24px rgba(0,0,0,0.7)",
            }}
          >
            chín lần đắp — <span style={{ color: C.warn }}>chín lần lún</span>
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.cream, marginTop: 16, textAlign: "center" }}>
            Sách cũ chép: thành xây chín lần đều sập
          </div>
        </Reveal>
      </AbsoluteFill>
      <SoundRipples cx={700} cy={560} startFrac={tLun + 0.1} count={2} maxR={380} color={C.warn} />
      <SourceTag text="Truyền thuyết bắt đầu bằng một chuỗi thất bại" bottom={44} right />
    </Paper>
  );
};
