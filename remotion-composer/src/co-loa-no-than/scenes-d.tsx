// VN-Myth Ep.04 — scenes group D: sc031..sc040 (Hồi hai — mở cổ thư, chiếc vuốt
// làm lẫy, tên nguyên văn Linh Quang Kim Quá thần cơ, Cao Lỗ, một phát vạn mũi,
// trận thắng cổ thư, kho Cầu Vực, kho có chủ ý, ảnh thật hiện vật, bảng 7 cỡ).
// Speech-lock: mọi animation fire tại A("từ", occ).
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  ArrowGlyph,
  Chip,
  CountUp,
  CrossbowGlyph,
  EarthBadge,
  InkImageScene,
  LabBadge,
  LegendFrame,
  Paper,
  PhotoCredit,
  QuotePlate,
  Reveal,
  SourceTag,
  SpringPop,
  ease,
  useA,
  useFrac
} from "./common";

// === sc031 === MỞ CỔ THƯ — Hồi hai + quyển LNCQ mở trang
export const Sc031: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tHoi = A("Hồi", 1); // «Hồi hai — Nỏ thần»
  const tTrich = A("trích", 1); // «xin được trích nguyên văn»
  const tSource = A("quái", 1); // «Lĩnh Nam chích quái, Truyện Rùa Vàng»
  const { frame, dur, p } = useFrac(durationInFrames);
  const openBook = ease(p(0.04, 0.2));
  return (
    <Paper variant="museum">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SpringPop startFrac={tHoi} from={0.85}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 110,
              color: C.white,
              letterSpacing: 4,
              textShadow: "0 4px 26px rgba(0,0,0,0.7)",
            }}
          >
            HỒI HAI
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 60, color: C.amber, textAlign: "center", marginTop: 8 }}>
            Nỏ thần
          </div>
        </SpringPop>
        {/* quyển sách mở trang */}
        <svg width="900" height="330" viewBox="0 0 900 330" style={{ marginTop: 44 }}>
          <path d={`M 450 40 C 300 10 140 18 40 52 L 40 290 C 140 256 300 250 450 280 Z`} fill="rgba(232,220,200,0.10)" stroke={C.cream} strokeWidth={4} opacity={0.8} />
          <path d={`M 450 40 C 600 10 760 18 860 52 L 860 290 C 760 256 600 250 450 280 Z`} fill="rgba(232,220,200,0.10)" stroke={C.cream} strokeWidth={4} opacity={0.8} transform={`rotate(${-openBook * 40} 450 40)`} style={{ transformOrigin: "450px 40px" }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M 110 ${110 + i * 34} H 390`} stroke={C.cream} strokeWidth={2} opacity={0.35} />
          ))}
        </svg>
        <Reveal startFrac={tTrich} endFrac={tTrich + 0.08}>
          <Chip color={C.amber} style={{ marginTop: 20 }}>trích nguyên văn</Chip>
        </Reveal>
        <Reveal startFrac={tSource} endFrac={tSource + 0.1}>
          <div style={{ fontFamily: FONT.mono, fontSize: 32, color: C.cream, marginTop: 20 }}>
            Lĩnh Nam chích quái — Truyện Rùa Vàng
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Lần này — xin được trích đúng từng chữ cổ thư" bottom={40} right />
    </Paper>
  );
};

// === sc032 === CHIẾC VUỐT LÀM LẪY — quote + inset kỹ thuật vuốt→lẫy
export const Sc032: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tClaw = A("vuốt", 1); // «tháo một chiếc vuốt trao cho vua»
  const tQuote = A("Đem", 1); // «Đem vật này làm lẫy nỏ...»
  const tGiu = A("giữ", 1); // «nơi giữ lực, nơi nhả tên»
  const { frame, dur, p } = useFrac(durationInFrames);
  const snap = ease(p(tQuote + 0.12, tQuote + 0.2)); // vuốt snap vào lẫy
  return (
    <Paper variant="museum">
      <AbsoluteFill style={{ padding: "120px 140px", justifyContent: "center" }}>
        <QuotePlate
          text="«Đem vật này làm lẫy nỏ, nhằm quân giặc mà bắn thì sẽ không lo gì nữa»"
          startFrac={tQuote}
          endFrac={tQuote + 0.4}
          size={58}
        />
      </AbsoluteFill>
      {/* inset kỹ thuật: vuốt → lẫy của cây nỏ schema */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 96,
          width: 560,
          border: `2px solid ${C.amber}`,
          borderRadius: 10,
          background: "rgba(20,17,13,0.92)",
          padding: "26px 30px",
        }}
      >
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: C.amber, marginBottom: 8 }}>
          MỘT CHIẾC VUỐT — LÀM CHIẾC LẪY
        </div>
        <svg width="500" height="300" viewBox="0 0 500 300">
          {/* vuốt rùa */}
          <g transform={`translate(${180 - snap * 110} ${120 - snap * 40}) rotate(${snap * 24})`} opacity={ease(p(tClaw, tClaw + 0.06))}>
            <path d="M 0 0 Q 56 -18 96 22 Q 60 60 6 40 Q -14 20 0 0 Z" fill="rgba(217,164,65,0.25)" stroke={C.amber} strokeWidth={5} />
            <path d="M 10 8 Q 40 2 62 18" stroke={C.amber} strokeWidth={2.5} fill="none" opacity={0.6} />
          </g>
          {/* schema lẫy */}
          <g transform="translate(300 190)">
            <rect x={-60} y={-46} width={120} height={70} fill="none" stroke={C.cream} strokeWidth={4} rx={6} />
            <path d="M -18 24 Q -18 66 22 66 Q 58 66 58 24" fill="none" stroke={C.cream} strokeWidth={4} />
            <circle cx={0} cy={-14} r={11} fill="none" stroke={C.cream} strokeWidth={4} />
            {/* vòng sáng khi khớp */}
            <circle cx={0} cy={-14} r={11 + snap * 26} fill="none" stroke={C.amber} strokeWidth={3} opacity={(1 - snap) * 0 + snap * (0.5 + 0.3 * Math.sin(frame / 5))} />
          </g>
          <path d={`M 240 96 Q 290 100 320 150`} stroke={C.amber} strokeWidth={3} strokeDasharray="8 8" fill="none" opacity={snap} />
        </svg>
        <Reveal startFrac={tGiu} endFrac={tGiu + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 27, color: C.cream, marginTop: 6, lineHeight: 1.5 }}>
            bộ phận nhỏ nhất, tinh vi nhất —<br />
            <b style={{ color: C.amber }}>nơi giữ lực, nơi nhả tên</b>
          </div>
        </Reveal>
      </div>
      <SourceTag text="Không phải 'ta ban cây nỏ thần' — chỉ có một chiếc vuốt" bottom={40} right />
    </Paper>
  );
};

// === sc033 === TÊN NGUYÊN VĂN — Linh Quang Kim Quá thần cơ
export const Sc033: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tQuote = A("Vua", 1); // «Vua sai bề tôi là Cao Lỗ làm nỏ...»
  const tName = A("Linh", 1); // «gọi là Linh Quang Kim Quá thần cơ»
  const tCo = A("máy", 1); // «nghĩa là máy móc, là cơ khí»
  const tLien = A("Liên", 1); // «nỏ Liên Hoa, nỏ Liên Châu»
  const { p } = useFrac(durationInFrames);
  return (
    <Paper variant="museum">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 160px" }}>
        <div style={{ transform: `translateY(${ease(p(0.0, tName)) * -60}px)` }}>
          <QuotePlate
            text="«Vua sai bề tôi là Cao Lỗ làm nỏ, lấy vuốt làm lẫy, gọi là Linh Quang Kim Quá thần cơ»"
            startFrac={tQuote}
            endFrac={tQuote + 0.42}
            size={48}
            maxWidth={1440}
          />
        </div>
        {/* tên tách dòng khắc lớn */}
        <SpringPop startFrac={tName} from={0.8} style={{ marginTop: 50 }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 92,
              color: C.amber,
              letterSpacing: 3,
              textShadow: "0 0 40px rgba(217,164,65,0.35), 0 4px 20px rgba(0,0,0,0.7)",
              textAlign: "center",
            }}
          >
            LINH QUANG KIM QUÁ THẦN CƠ
          </div>
        </SpringPop>
        <div style={{ display: "flex", gap: 40, marginTop: 36 }}>
          <Reveal startFrac={tCo} endFrac={tCo + 0.08}>
            <div
              style={{
                border: `2px solid ${C.amber}`,
                borderRadius: 8,
                padding: "16px 30px",
                background: "rgba(36,31,26,0.94)",
                fontFamily: FONT.body,
                fontSize: 32,
                color: C.cream,
              }}
            >
              chữ <b style={{ color: C.amber }}>'cơ'</b> = máy móc, cơ khí
            </div>
          </Reveal>
          <Reveal startFrac={tLien} endFrac={tLien + 0.08}>
            <div
              style={{
                border: `2px solid ${C.mute}`,
                borderRadius: 8,
                padding: "16px 30px",
                background: "rgba(36,31,26,0.94)",
                fontFamily: FONT.body,
                fontSize: 32,
                color: C.mute,
              }}
            >
              Liên Hoa / Liên Châu — danh xưng dân gian muộn hơn
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Nguyên văn cổ thư chỉ có một tên" bottom={40} right />
    </Paper>
  );
};

// === sc034 === CAO LỖ — người kỹ sư được cổ thư đặt tên
export const Sc034: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tName = A("Cao", 1); // «bề tôi là Cao Lỗ»
  const tKy = A("kỹ", 1); // «một con người kỹ sư»
  const tLay = A("lẫy", 2); // «chiếc lẫy — cổ thư đặt tên...»
  const { frame, p } = useFrac(durationInFrames);
  const glow = 0.5 + 0.5 * Math.sin(frame / 6);
  return (
    <InkImageScene src="img-sc034.png" focus={{ x: 0.5, y: 0.45 }} label="CAO LỖ" sublabel="bề tôi kỹ sư — tay nâng niu chiếc lẫy đồng">
      <div style={{ position: "absolute", top: 84, left: 84 }}>
        <Reveal startFrac={tName} endFrac={tName + 0.07}>
          <Chip color={C.amber}>Cao Lỗ — có tên, có chức danh</Chip>
        </Reveal>
      </div>
      {/* vòng sáng chi tiết lẫy trên bàn tay */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <circle cx={1230} cy={640} r={40 + glow * 20} fill="none" stroke={C.amber} strokeWidth={3} opacity={0.5 * ease(p(tLay, tLay + 0.08))} />
        <circle cx={1230} cy={640} r={70 + glow * 30} fill="none" stroke={C.amber} strokeWidth={2} opacity={0.25 * ease(p(tLay, tLay + 0.08))} />
      </svg>
      <div style={{ position: "absolute", bottom: 250, left: 110, maxWidth: 900 }}>
        <Reveal startFrac={tKy} endFrac={tKy + 0.12}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 44,
              lineHeight: 1.35,
              color: C.white,
              background: "rgba(20,17,13,0.74)",
              padding: "22px 30px",
              borderRadius: 10,
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            Trong truyện đầy rùa thần nước thánh — đúng ở bộ phận sinh tử nhất, cổ thư đặt tên <span style={{ color: C.amber }}>một con người kỹ sư</span>.
          </div>
        </Reveal>
      </div>
      <SourceTag text="Chữ 'cơ' = máy móc — và người chế tạo có tên" bottom={44} right />
    </InkImageScene>
  );
};

// === sc035 === MỘT PHÁT VẠN MŨI — dây cung buông, chùm tên tỏa như vũ trụ nở
export const Sc035: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tBurst = A("vạn", 1); // «một phát, vạn mũi»
  const tNgon = A("Ngôn", 1); // «Ngôn ngữ của thần thoại»
  const { frame, dur, p } = useFrac(durationInFrames);
  const burst = ease(p(tBurst, tBurst + 0.16));
  const settle = 1 - ease(p(tBurst + 0.25, tBurst + 0.45));
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          {/* tâm phát */}
          <circle cx={960} cy={560} r={16} fill={C.amber} opacity={burst} />
          {/* chùm mũi tên tỏa toả — stylized, không đếm số */}
          {Array.from({ length: 42 }, (_, i) => {
            const a = (i / 42) * Math.PI * 2 + 0.35;
            const len = (300 + ((i * 173) % 420)) * burst;
            const x1 = 960 + 30 * Math.cos(a);
            const y1 = 560 + 30 * Math.sin(a);
            const x2 = 960 + len * Math.cos(a);
            const y2 = 560 + len * Math.sin(a);
            const seen = Math.max(0, Math.min(1, (frame - (tBurst + (i % 7) * 0.008) * dur) / (0.14 * dur)));
            return (
              <g key={i} opacity={seen * settle}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 5 === 0 ? C.amber : C.cream} strokeWidth={4} strokeLinecap="round" />
                <path d={`M ${x2} ${y2} l ${-16 * Math.cos(a - 0.4)} ${-16 * Math.sin(a - 0.4)} l ${-16 * Math.cos(a + 0.4)} ${-16 * Math.sin(a + 0.4)} Z`} fill={i % 5 === 0 ? C.amber : C.cream} />
              </g>
            );
          })}
          {/* vòng sáng rực một nhịp */}
          <circle cx={960} cy={560} r={burst * 760} fill="none" stroke={C.amber} strokeWidth={5 * settle} opacity={0.55 * (burst - 0.1) * settle} />
        </svg>
        <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center" }}>
          <SpringPop startFrac={tBurst} from={0.75}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 100, color: C.white, textShadow: "0 4px 30px rgba(0,0,0,0.8)" }}>
              một phát, <span style={{ color: C.amber }}>vạn mũi</span>
            </div>
          </SpringPop>
          <Reveal startFrac={tNgon} endFrac={tNgon + 0.1}>
            <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, marginTop: 18 }}>
              — ngôn ngữ của thần thoại
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Truyền thuyết dùng đúng bốn chữ" bottom={40} right />
    </Paper>
  );
};

// === sc036 === TRẬN THẮNG THEO CỔ THƯ — quote + ba cụm phát sáng tuần tự
export const Sc036: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tQuote = A("Vua", 1); // «Vua lấy nỏ thần ra bắn...»
  const tThua = A("Thua", 1); // «Thua lớn.»
  const tDoi = A("đối", 1); // «Không dám đối chiến.»
  const tXin = A("xin", 1); // «bèn xin hòa»
  const { frame, p } = useFrac(durationInFrames);
  const pulse = (t: number) => 0.5 + 0.5 * Math.sin(frame / 5 + t * 8);
  const phrases = [
    { t: tThua, text: "Thua lớn", w: "quân Đà thua lớn" },
    { t: tDoi, text: "Không dám đối chiến", w: "không dám đối chiến" },
    { t: tXin, text: "Xin hòa", w: "bèn xin hòa" },
  ];
  return (
    <Paper variant="museum">
      <AbsoluteFill style={{ padding: "110px 140px" }}>
        <QuotePlate
          text="«Vua lấy nỏ thần ra bắn, quân Đà thua lớn, chạy về Trâu Sơn cầm cự với nhà vua, không dám đối chiến, bèn xin hòa»"
          startFrac={tQuote}
          endFrac={tQuote + 0.45}
          size={46}
          maxWidth={1560}
        />
        <div style={{ display: "flex", gap: 44, marginTop: 66, justifyContent: "center" }}>
          {phrases.map((ph, i) => (
            <div
              key={i}
              style={{
                border: `2px solid ${C.amber}`,
                borderRadius: 10,
                background: `rgba(217,164,65,${0.10 + 0.22 * ease(p(ph.t, ph.t + 0.06)) * (0.6 + 0.4 * pulse(ph.t))})`,
                padding: "26px 44px",
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 52,
                color: C.white,
                opacity: ease(p(ph.t, ph.t + 0.05)),
                boxShadow: `0 0 ${30 * ease(p(ph.t, ph.t + 0.06)) * pulse(ph.t)}px rgba(217,164,65,0.4)`,
              }}
            >
              {ph.text}
            </div>
          ))}
        </div>
      </AbsoluteFill>
      <SourceTag text="Ba cụm chữ đọc cạnh nhau — tự kể mức độ của trận thua" bottom={40} right />
    </Paper>
  );
};

// === sc037 === KHO CẦU VỰC — mốc 9/1959 + hố chôn giấu + đếm
export const Sc037: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDate = A("chín", 1); // «Tháng chín năm một nghìn chín trăm năm mươi chín»
  const tMap = A("Cầu", 1); // «vùng Cầu Vực sát chân thành»
  const tKg = A("chín", 2); // «chín mươi ba ký mũi tên đồng»
  const tSo = A("mười", 1); // «gần mười nghìn chiếc»
  const { frame, p } = useFrac(durationInFrames);
  return (
    <Paper variant="earth">
      <EarthBadge text="HỒ SƠ NỀN ĐẤT — KHO CẦU VỰC" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
          {/* bản đồ mini vị trí sát chân thành */}
          <svg width="620" height="560" viewBox="0 0 620 560">
            {[210, 150, 90].map((r, i) => (
              <circle key={i} cx={280} cy={280} r={r} fill="none" stroke={i === 2 ? C.cream : C.earthGlow} strokeWidth={7 - i * 1.5} opacity={0.8} />
            ))}
            <g opacity={ease(p(tMap, tMap + 0.08))}>
              <circle cx={402} cy={322} r={22 + 8 * Math.sin(frame / 6)} fill={C.warn} opacity={0.3} />
              <circle cx={402} cy={322} r={9} fill={C.warn} />
              <path d="M 402 322 L 500 420" stroke={C.warn} strokeWidth={3} />
            </g>
            <text x={508} y={452} fill={C.warn} fontFamily='"Be Vietnam Pro"' fontSize={30}>hố chôn giấu</text>
            {/* zoom rings */}
            <circle cx={402} cy={322} r={60 * ease(p(tMap, tMap + 0.2))} fill="none" stroke={C.warn} strokeWidth={2.5} opacity={0.6} />
          </svg>
          {/* mặt cắt hố + mũi tên đồng */}
          <svg width="640" height="560" viewBox="0 0 640 560">
            {/* hố vuông vắn */}
            <path d="M 170 120 H 470 V 440 H 170 Z" fill="rgba(92,61,34,0.55)" stroke={C.earth} strokeWidth={6} />
            <path d="M 130 120 H 510" stroke={C.cream} strokeWidth={5} opacity={0.7} />
            {/* các mũi tên đồng chụm đầu */}
            {Array.from({ length: 9 }, (_, i) => (
              <g key={i} transform={`translate(${210 + (i % 3) * 90} ${180 + Math.floor(i / 3) * 60}) rotate(${(i % 3) * 14 - 14}) scale(0.16)`}>
                <path d="M 0 0 L 90 220 L -90 220 Z M 0 220 L 34 700 L -34 700 Z" fill={C.bronze} opacity={0.9} />
              </g>
            ))}
          </svg>
        </div>
        <div style={{ display: "flex", gap: 60, marginTop: 50 }}>
          <SpringPop startFrac={tDate} from={0.82}>
            <div
              style={{
                fontFamily: FONT.mono,
                fontWeight: 700,
                fontSize: 44,
                color: C.white,
                border: `2px solid ${C.earthGlow}`,
                borderRadius: 8,
                padding: "16px 30px",
                background: "rgba(36,31,26,0.94)",
              }}
            >
              9/1959 (kho mũi tên Cầu Vực)
            </div>
          </SpringPop>
          <SpringPop startFrac={tKg} from={0.82}>
            <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 44, color: C.bronze }}>
              ~<CountUp to={93} startFrac={tKg} endFrac={tKg + 0.08} /> kg
            </div>
          </SpringPop>
          <SpringPop startFrac={tSo} from={0.82}>
            <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 44, color: C.white }}>
              ~<CountUp to={10000} startFrac={tSo} endFrac={tSo + 0.1} /> mũi tên
            </div>
          </SpringPop>
        </div>
      </AbsoluteFill>
      <SourceTag text="Hố nhỏ vuông vắn chừng một mét — nằm gọn một kho vũ khí" bottom={40} right />
    </Paper>
  );
};

// === sc038 === KHO CÓ CHỦ Ý — hố niêm cát như cửa hàng vũ khí
export const Sc038: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tKho = A("kho", 1); // «Đây là một kho»
  const tChu = A("chủ", 1); // «được chôn có chủ ý»
  const tSeal = A("niêm", 1); // «được niêm cất»
  const { frame, p } = useFrac(durationInFrames);
  const sealT = ease(p(tSeal, tSeal + 0.1));
  return (
    <Paper variant="earth">
      <EarthBadge text="KHO — KHÔNG PHẢI VƯƠNG VÃI" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1400" height="640" viewBox="0 0 1400 640">
          {/* hố cắt ngang */}
          <path d="M 240 140 H 1160 V 520 H 240 Z" fill="rgba(92,61,34,0.6)" stroke={C.earth} strokeWidth={6} />
          <path d="M 180 140 H 1220" stroke={C.cream} strokeWidth={6} opacity={0.8} />
          {/* lớp đất bịt kín — như ấn niêm phong */}
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${240 + i * 6} ${190 + i * 34} q 230 ${-26 + i * 10} 460 0 q 230 ${26 - i * 10} 460 0`} fill="none" stroke={C.earthGlow} strokeWidth={5} opacity={0.5} />
          ))}
          {/* mũi tên nằm chờ bên trong */}
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i} transform={`translate(${300 + (i % 6) * 140} ${340 + Math.floor(i / 6) * 90}) scale(0.14)`}>
              <path d="M 0 0 L 90 220 L -90 220 Z M 0 220 L 34 700 L -34 700 Z" fill={C.bronze} opacity={0.85} />
            </g>
          ))}
          {/* con dấu đỏ đóng xuống */}
          <g transform={`translate(700 120) scale(${1 + (1 - sealT) * 1.6})`} opacity={sealT}>
            <circle cx={0} cy={0} r={86} fill="rgba(200,85,61,0.22)" stroke={C.warn} strokeWidth={6} />
            <circle cx={0} cy={0} r={62} fill="none" stroke={C.warn} strokeWidth={3} />
            <text x={0} y={12} textAnchor="middle" fill={C.warn} fontFamily='"Be Vietnam Pro"' fontWeight={700} fontSize={34} letterSpacing={4}>NIÊM</text>
          </g>
        </svg>
        <SpringPop startFrac={tKho} from={0.85}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 70, color: C.white, marginTop: 20 }}>
            KHÔNG phải vương vãi — <span style={{ color: C.warn }}>một kho</span>
          </div>
        </SpringPop>
        <Reveal startFrac={tChu} endFrac={tChu + 0.12}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 18 }}>
            được chôn có chủ ý, được niêm cất như một <i>cửa hàng vũ khí</i>
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Vị trí — sát chân thành Cổ Loa" bottom={40} right />
    </Paper>
  );
};

// === sc039 === ẢNH THẬT HIỆN VẬT — mũi tên đồng bảo tàng (credit Wikimedia)
export const Sc039: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tBaoTang = A("Bảo", 1); // «Bảo tàng Lịch sử quốc gia»
  const tXanh = A("xanh", 1); // «đồng ngả màu xanh cổ»
  const tSac = A("nguy", 1); // «cạnh sắc vẫn còn nguy hiểm»
  const { frame, p } = useFrac(durationInFrames);
  const sheen = ease(p(tSac, tSac + 0.2)); // vệt sáng lướt
  return (
    <InkImageScene src="mui-ten-dong-coloa.jpg" focus={{ x: 0.5, y: 0.5 }} label="MŨI TÊN ĐỒNG CỔ LOA" sublabel="hai nghìn năm dưới đất — cạnh sắc vẫn còn nguy hiểm">
      {/* vệt sáng lướt khi nói 'cạnh sắc vẫn còn nguy hiểm' */}
      <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden", opacity: sheen * 0.5 }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: `${-30 + sheen * 130}%`,
            width: "34%",
            height: "120%",
            background: "linear-gradient(105deg, rgba(245,242,234,0) 0%, rgba(245,242,234,0.5) 50%, rgba(245,242,234,0) 100%)",
            transform: "skewX(-12deg)",
          }}
        />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 84, left: 84 }}>
        <Reveal startFrac={tBaoTang} endFrac={tBaoTang + 0.07}>
          <Chip color={C.cream}>Bảo tàng Lịch sử quốc gia</Chip>
        </Reveal>
      </div>
      <div style={{ position: "absolute", top: 180, left: 84 }}>
        <Reveal startFrac={tXanh} endFrac={tXanh + 0.07}>
          <Chip color={C.teal}>đồng ngả màu xanh cổ — patina</Chip>
        </Reveal>
      </div>
      <PhotoCredit />
      <SourceTag text="Hiện vật thật — không vẽ lại" bottom={44} right />
    </InkImageScene>
  );
};

// === sc040 === BẢNG QUY CÁCH — 7 cỡ chuẩn hóa
export const Sc040: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tBay = A("bảy", 1); // «chia thành bảy cỡ»
  const tRuler = A("sáu", 1); // «dài từ sáu đến mười một xăng-ti-mét»
  const tBaCanh = A("ba", 1); // «mũi ba cạnh sắc nhọn»
  const tKg = A("trăm", 1); // «mỗi ký gần một trăm chiếc»
  const { frame, dur, p } = useFrac(durationInFrames);
  const sizes = [6, 6.8, 7.6, 8.4, 9.2, 10, 11];
  return (
    <Paper variant="earth">
      <EarthBadge text="BẢNG QUY CÁCH — KHÔNG AI NẤY LÀM" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SpringPop startFrac={tBay} from={0.85}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 74, color: C.white }}>
            <span style={{ color: C.earthGlow, fontFamily: FONT.mono }}>7 cỡ</span> — gần 10.000 mũi tên đều khớp chuẩn chung
          </div>
        </SpringPop>
        <svg width="1500" height="520" viewBox="0 0 1500 520" style={{ marginTop: 30 }}>
          {/* thước đo */}
          <path d="M 180 70 H 1320" stroke={C.cream} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(tRuler, tRuler + 0.14))} />
          {[6, 7, 8, 9, 10, 11].map((v, i) => (
            <g key={i} opacity={ease(p(tRuler + 0.05, tRuler + 0.18))}>
              <path d={`M ${180 + i * 228} 70 V 96`} stroke={C.cream} strokeWidth={3} />
              <text x={180 + i * 228} y={130} textAnchor="middle" fill={C.cream} fontFamily='"JetBrains Mono"' fontSize={27}>{v}</text>
            </g>
          ))}
          <text x={750} y={44} textAnchor="middle" fill={C.cream} fontFamily='"JetBrains Mono"' fontSize={26} opacity={ease(p(tRuler + 0.1, tRuler + 0.2))}>6–11 cm (chiều dài mũi)</text>
          {/* bảy cỡ mũi tên pop tuần tự ngắn→dài */}
          {sizes.map((sz, i) => {
            const h = (sz / 11) * 300;
            const seen = ease(Math.max(0, Math.min(1, (frame - (tRuler + 0.06 + i * 0.03) * dur) / (0.05 * dur))));
            return (
              <g key={i} transform={`translate(${250 + i * 175} 420)`} opacity={seen}>
                <path d={`M 0 ${-h} L 22 ${-h + 46} L -22 ${-h + 46} Z`} fill={C.bronze} />
                <path d={`M 0 ${-h + 46} L 12 0 L -12 0 Z`} fill="rgba(201,143,78,0.8)" />
                {i === 3 && ease(p(tBaCanh, tBaCanh + 0.06)) > 0 && (
                  <path d={`M 0 ${-h} L 22 ${-h + 46} L -22 ${-h + 46} Z`} fill={C.white} opacity={0.4 * (0.6 + 0.4 * Math.sin(frame / 5))} />
                )}
              </g>
            );
          })}
        </svg>
        <div style={{ display: "flex", gap: 44, marginTop: 8 }}>
          <Reveal startFrac={tBaCanh} endFrac={tBaCanh + 0.07}>
            <Chip color={C.cream}>3 cạnh sắc nhọn</Chip>
          </Reveal>
          <Reveal startFrac={tKg} endFrac={tKg + 0.07}>
            <Chip color={C.earthGlow}>~97 chiếc/kg</Chip>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Mỗi mũi ra lò đều khớp một chuẩn chung — một bảng quy cách" bottom={40} right />
    </Paper>
  );
};
