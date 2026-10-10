// VN-Myth Ep.04 — scenes group C: sc021..sc030 (đào-khoét cutaway, hào thông sông,
// kết cấu tường, nhịp đầm, stat 2,2–2,3 triệu m³, khối tủ thành vòng, hai ước tính,
// ngày công = thân thể, sơ đồ nhà nước, hóa thạch). Speech-lock: A("từ", occ).
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  CountUp,
  EarthBadge,
  LabBadge,
  Paper,
  Reveal,
  SoundRipples,
  SourceTag,
  SpringPop,
  WipeInk,
  circleD,
  useA,
  useFrac,
  ease,
} from "./common";

// === sc021 === ĐÀO-KHOÉT — cutaway: đất bay từ hào lên tường
export const Sc021: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tKhuet = A("khoét", 1); // «khoét hào ngay vòng ấy»
  const tLoop = A("khoét", 2); // «đào đất đến đâu, khoét hào đến đó»
  const { frame, dur, p } = useFrac(durationInFrames);
  // mũi tên đất di chuyển từ hào lên tường, lặp theo chu kỳ
  const cyc = Math.max(0, (frame - tKhuet * dur) / (0.2 * dur));
  const ph = cyc - Math.floor(cyc);
  const carry = ease(Math.min(1, ph * 1.6)) * (1 - ease(Math.max(0, (ph - 0.6) / 0.4)));
  const wallH = 120 + ease(p(tKhuet, tLoop + 0.2)) * 200;
  return (
    <Paper variant="earth">
      <EarthBadge />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1700" height="760" viewBox="0 0 1700 760">
          {/* mặt cắt: tường (trái) + hào (phải) */}
          <path d={`M 60 620 H 700 L 640 ${620 - wallH} L 120 ${620 - wallH} Z`} fill="rgba(138,90,51,0.55)" stroke={C.earthGlow} strokeWidth={6} />
          <path d="M 760 620 Q 900 660 1040 620 L 1040 700 Q 900 740 760 700 Z" fill="rgba(47,93,107,0.5)" stroke={C.teal} strokeWidth={5} />
          <path d="M 780 660 Q 900 690 1020 660" stroke={C.teal} strokeWidth={3} opacity={0.7} fill="none" />
          {/* mũi tên đất bay lên */}
          {[0, 1, 2].map((i) => {
            const c2 = Math.max(0, (frame - (tKhuet + i * 0.06) * dur) / (0.24 * dur));
            const ph2 = c2 - Math.floor(c2);
            const cc = ease(Math.min(1, ph2 * 1.6));
            const x = 1010 - cc * 320;
            const y = 640 - cc * (300 + wallH * 0.4);
            return <path key={i} d={`M ${x} ${y} l -26 12 l 8 -12 l -8 -12 Z`} fill={C.earth} opacity={0.85} />;
          })}
          {/* người đào — silhouette đơn giản */}
          <g opacity={0.9}>
            <circle cx={1100} cy={560} r={14} fill={C.cream} />
            <path d="M 1100 574 L 1100 628 M 1100 588 L 1072 606 M 1100 588 L 1130 570" stroke={C.cream} strokeWidth={8} strokeLinecap="round" fill="none" />
          </g>
        </svg>
        <Reveal startFrac={tLoop} endFrac={tLoop + 0.1}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.white, marginTop: 10 }}>
            «đào đất đến đâu — <span style={{ color: C.earthGlow }}>khoét hào đến đó</span>»
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Đất đào lên đắp tường — chỗ trống thành hào nước" bottom={40} right />
    </Paper>
  );
};

// === sc022 === HÀO THÔNG SÔNG — mạng nước xoáy ốc + thuyền xuyên vòng
export const Sc022: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tRiver = A("sông", 1); // «nối thông với sông Hoàng, sông Thiếp»
  const tThuyen = A("thuyền", 1); // «thuyền chở người, lương thực»
  const tHeThong = A("hệ", 1); // «Một hệ thống — chứ không phải một bức tường»
  const tThuy = A("thủy", 1); // «Phòng thủ kiêm giao thông thủy»
  const { frame, dur, p } = useFrac(durationInFrames);
  // thuyền trôi theo góc quanh tâm
  const boatA = ease(p(tThuyen, tThuyen + 0.5)) * Math.PI * 1.5;
  const br = 250;
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          {/* hai con sông chảy vào */}
          {[
            "M -40 240 C 300 280 480 360 700 460",
            "M 1960 200 C 1620 260 1400 380 1220 470",
          ].map((d, i) => (
            <path key={i} d={d} fill="none" stroke={C.teal} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(tRiver + i * 0.05, tRiver + 0.2 + i * 0.05))} opacity={0.85} />
          ))}
          {/* hào vòng trong + vòng ngoài (nước) */}
          {[300, 430].map((r, i) => (
            <path key={i} d={circleD(960, 560, r)} fill="none" stroke={C.teal} strokeWidth={14 - i * 3} opacity={0.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(tRiver - 0.05 + i * 0.06, tRiver + 0.28))} />
          ))}
          {/* kênh nối hào trong ↔ ngoài */}
          <path d="M 660 560 H 1260" stroke={C.teal} strokeWidth={10} opacity={0.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(tRiver + 0.18, tRiver + 0.3))} />
          {/* thuyền trôi qua vòng */}
          <g transform={`translate(${960 + br * Math.cos(-Math.PI / 2 + boatA)} ${560 + br * Math.sin(-Math.PI / 2 + boatA)}) rotate(${-Math.PI / 2 + boatA + Math.PI / 2} )`} opacity={ease(p(tThuyen, tThuyen + 0.06))}>
            <path d="M -34 0 L 24 0 L 14 16 L -24 16 Z" fill={C.cream} />
            <path d="M 2 -30 L 2 0" stroke={C.cream} strokeWidth={4} />
            <path d="M 2 -28 L 26 -2 L 2 -2 Z" fill={C.amber} opacity={0.9} />
          </g>
        </svg>
        <div style={{ position: "absolute", top: 100, left: 0, right: 0, textAlign: "center" }}>
          <Reveal startFrac={tThuy} endFrac={tThuy + 0.08}>
            <Chip color={C.teal}>Phòng thủ kiêm giao thông thủy</Chip>
          </Reveal>
        </div>
        <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center" }}>
          <SpringPop startFrac={tHeThong} from={0.85}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white, textShadow: "0 4px 22px rgba(0,0,0,0.75)" }}>
              Một <span style={{ color: C.teal }}>hệ thống</span> — chứ không phải một bức tường
            </div>
          </SpringPop>
        </div>
      </AbsoluteFill>
      <SoundRipples cx={960} cy={560} startFrac={tRiver} count={3} maxR={540} color={C.teal} periodFrac={0.14} />
      <SourceTag text="Hào trong thông hào ngoài — kẻ tới phải đi theo đường vòng của chủ nhà" bottom={40} right />
    </Paper>
  );
};

// === sc023 === KẾT CẤU TƯỜNG — cutaway lớp đất + gốm vỡ + kè đá
export const Sc023: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tLop = A("lớp", 1); // «đất đập chặt từng lớp»
  const tGom = A("gốm", 1); // «trộn gốm vỡ»
  const tKe = A("kè", 1); // «kè đá»
  const { frame, dur, p } = useFrac(durationInFrames);
  return (
    <Paper variant="earth">
      <EarthBadge />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1500" height="700" viewBox="0 0 1500 700">
          {/* mặt cắt tường phóng đại — từng lớp đất mỏng */}
          {Array.from({ length: 9 }, (_, i) => {
            const t = ease(Math.max(0, Math.min(1, (frame - (tLop + i * 0.025) * dur) / (0.06 * dur))));
            return (
              <g key={i} opacity={t}>
                <rect x={300} y={560 - i * 52 - 46} width={900} height={46} fill={i % 2 ? "rgba(138,90,51,0.42)" : "rgba(92,61,34,0.5)"} stroke={C.earthGlow} strokeWidth={2.5} rx={3} />
                {/* mảnh gốm vỡ chèn giữa */}
                {i % 2 === 0 && (
                  <>
                    <path d={`M ${420 + (i % 3) * 130} ${560 - i * 52 - 46} l 26 18 l -18 20 l -24 -16 Z`} fill={C.amber} opacity={0.75 * ease(Math.max(0, Math.min(1, (frame - (tGom) * dur) / (0.15 * dur))))} />
                    <path d={`M ${860 + (i % 2) * 110} ${560 - i * 52 - 46} l 20 22 l -26 14 l -12 -22 Z`} fill={C.amber} opacity={0.6 * ease(Math.max(0, Math.min(1, (frame - (tGom + 0.04) * dur) / (0.15 * dur))))} />
                  </>
                )}
              </g>
            );
          })}
          {/* chân thành kè đá */}
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M ${300 + i * 60} 660 l 30 -46 l 30 46 Z`}
              fill="none"
              stroke={C.cream}
              strokeWidth={4}
              opacity={ease(Math.max(0, Math.min(1, (frame - (tKe + i * 0.02) * dur) / (0.06 * dur))))}
            />
          ))}
          <path d="M 280 560 H 1220" stroke={C.cream} strokeWidth={5} opacity={0.6} />
        </svg>
        <div style={{ display: "flex", gap: 44, marginTop: 24 }}>
          <Reveal startFrac={tLop} endFrac={tLop + 0.06}>
            <Chip color={C.earthGlow}>đất đập chặt từng lớp</Chip>
          </Reveal>
          <Reveal startFrac={tGom} endFrac={tGom + 0.06}>
            <Chip color={C.amber}>gốm vỡ làm cốt liệu</Chip>
          </Reveal>
          <Reveal startFrac={tKe} endFrac={tKe + 0.06}>
            <Chip color={C.cream}>chân thành kè đá</Chip>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Gốm vụn giúp đất khỏi lún, khỏi bở — bí mật đứng vững hai nghìn năm" bottom={40} right />
    </Paper>
  );
};

// === sc024 === NHỊP ĐẦM — hàng người chuyền giỏ + dao khảo cổ đọc lớp
export const Sc024: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tTay = A("tay", 1); // «chỉ có tay người, giỏ đất và cái đầm»
  const tChin = A("chín", 1); // «như chín lần thành sập trong truyện»
  const tDao = A("dao", 1); // «đọc được bằng dao khảo cổ»
  const tAuLac = A("Âu", 1); // «đúng vào thời Âu Lạc»
  const { frame, dur, p } = useFrac(durationInFrames);
  const tamp = Math.sin(frame / 5); // nhịp đầm nhấc-vả
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1700" height="640" viewBox="0 0 1700 640">
          {/* hàng người chuyền giỏ */}
          {[0, 1, 2, 3, 4].map((i) => {
            const lift = Math.max(0, Math.sin(frame / 5 - i * 0.9)) * 26;
            return (
              <g key={i} transform={`translate(${260 + i * 290} 520)`} opacity={ease(p(tTay + i * 0.03 - 0.12, tTay + i * 0.03 - 0.04))}>
                <circle cx={0} cy={-96} r={16} fill={C.cream} />
                <path d={`M 0 -80 L 0 -16 M 0 -66 L -26 -44 M 0 -66 L 30 ${-44 - lift}`} stroke={C.cream} strokeWidth={9} strokeLinecap="round" fill="none" />
                {/* cái đầm nhấc-vả */}
                <rect x={26} y={-44 - lift - 60} width={16} height={64} fill={C.earthGlow} rx={4} transform={`rotate(${tamp * 8} 34 ${-44 - lift})`} />
                {/* giỏ đất */}
                <path d="M -44 -52 l 34 0 l -6 26 l -22 0 Z" fill={C.earth} />
              </g>
            );
          })}
          <path d="M 60 560 H 1640" stroke={C.cream} strokeWidth={5} opacity={0.7} />
          {/* tường mọc dần theo nhịp */}
          <path d={`M 300 560 H 1400 L 1360 ${560 - ease(p(tTay, tChin)) * 180} L 340 ${560 - ease(p(tTay, tChin)) * 180} Z`} fill="rgba(138,90,51,0.5)" stroke={C.earthGlow} strokeWidth={5} />
        </svg>
        <div style={{ position: "absolute", bottom: 210, left: 0, right: 0, textAlign: "center" }}>
          <Reveal startFrac={tChin} endFrac={tChin + 0.08}>
            <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream }}>
              đắp sai một lớp, cả vòng lún — <span style={{ color: C.warn }}>như chín lần thành sập</span>
            </div>
          </Reveal>
        </div>
        {/* dao khảo cổ lướt đọc lớp đất */}
        <svg width="1700" height="300" viewBox="0 0 1700 300" style={{ position: "absolute", bottom: 40 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={330 + i * 130} y={140} width={120} height={26} fill={i % 2 ? "rgba(138,90,51,0.5)" : "rgba(92,61,34,0.6)"} stroke={C.earthGlow} strokeWidth={2} opacity={ease(p(tDao, tDao + 0.2))} />
          ))}
          <g transform={`translate(${330 + ease(p(tDao, tDao + 0.25)) * 1000} 96)`} opacity={ease(p(tDao, tDao + 0.05))}>
            <path d="M 0 0 L 64 26 L 8 40 Z" fill={C.cream} />
            <path d="M -4 6 L -34 54" stroke={C.cream} strokeWidth={7} strokeLinecap="round" />
          </g>
          <Reveal startFrac={tAuLac} endFrac={tAuLac + 0.1}>
            <div style={{ position: "absolute", right: 180, top: 30, fontFamily: FONT.mono, fontSize: 34, color: C.teal, background: "rgba(26,23,20,0.85)", border: `2px solid ${C.teal}`, borderRadius: 8, padding: "10px 22px" }}>
              niên đại: đúng vào thời Âu Lạc
            </div>
          </Reveal>
        </svg>
      </AbsoluteFill>
      <SourceTag text="Không máy ủi, không sắt thép — tay người, giỏ đất, cái đầm" bottom={40} right />
    </Paper>
  );
};

// === sc025 === STAT THỨ NHẤT — 2,2–2,3 triệu m³ (ước tính phổ biến)
export const Sc025: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tStat = A("hai", 2); // «hai phẩy hai đến hai phẩy ba triệu mét khối»
  const tPho = A("phổ", 1); // «ước tính phổ biến»
  const tTai = A("tài", 1); // «được nhiều tài liệu về Cổ Loa dẫn theo»
  return (
    <Paper variant="teal">
      <WipeInk startFrac={0.0} color="#2F5D6B" durationInFrames={durationInFrames} />
      <LabBadge text="CÂU HỎI ĐẾM ĐƯỢC" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Reveal startFrac={tPho} endFrac={tPho + 0.06}>
          <Chip color={C.teal}>ước tính phổ biến</Chip>
        </Reveal>
        <div style={{ marginTop: 40, fontFamily: FONT.mono, fontWeight: 700, fontSize: 150, color: C.white }}>
          <CountUp to={2.2} decimals={1} startFrac={tStat} endFrac={tStat + 0.08} />–
          <CountUp to={2.3} decimals={1} startFrac={tStat + 0.05} endFrac={tStat + 0.13} />
          <span style={{ fontSize: 64, color: C.teal }}> triệu m³</span>
        </div>
        <Reveal startFrac={tTai} endFrac={tTai + 0.1}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 30 }}>
            đất — được nhiều tài liệu về Cổ Loa dẫn theo
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Con số thứ nhất — thắp sáng một góc của câu chuyện" bottom={40} right />
    </Paper>
  );
};

// === sc026 === CẢM THỬ KHỐI LƯỢNG — khối tủ cuộn thành ba vòng + bàn tay
export const Sc026: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tTu = A("tủ", 1); // «to bằng một chiếc tủ»
  const tTay = A("tay", 1); // «được nâng lên bằng tay người»
  const tKhongMay = A("máy", 1); // «Không máy móc»
  const tDongCo = A("động", 1); // «Không động cơ»
  const tToChuc = A("tổ", 1); // «Chỉ có tổ chức»
  const { frame, dur, p } = useFrac(durationInFrames);
  const phrases = [
    { t: tKhongMay, text: "Không máy móc.", color: C.warn },
    { t: tDongCo, text: "Không động cơ.", color: C.warn },
    { t: tToChuc, text: "Chỉ có tổ chức.", color: C.teal },
  ];
  return (
    <Paper variant="teal">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Reveal startFrac={tTu} endFrac={tTu + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, marginBottom: 24 }}>
            Hãy cảm thử: mỗi khối đất — <b style={{ color: C.white }}>to bằng một chiếc tủ</b>
          </div>
        </Reveal>
        <svg width="1300" height="520" viewBox="0 0 1300 520">
          {/* khối tủ + người đứng cạnh so scale */}
          <g opacity={ease(p(tTu, tTu + 0.06))}>
            <rect x={140} y={300} width={130} height={170} fill="rgba(138,90,51,0.55)" stroke={C.earthGlow} strokeWidth={4} rx={4} />
            <path d="M 205 300 V 470 M 140 385 H 270" stroke={C.earthGlow} strokeWidth={2.5} opacity={0.7} />
            {/* người đứng cạnh */}
            <circle cx={340} cy={310} r={16} fill={C.cream} />
            <path d="M 340 326 V 430 M 340 344 L 318 380 M 340 344 L 362 380 M 340 430 L 322 470 M 340 430 L 358 470" stroke={C.cream} strokeWidth={8} strokeLinecap="round" fill="none" />
          </g>
          {/* các khối xếp cuộn thành ba vòng */}
          {[260, 180, 100].map((r, i) => {
            const n = 22 - i * 6;
            return (
              <g key={i} opacity={ease(p(tTay + i * 0.06 - 0.08, tTay + i * 0.06))}>
                {Array.from({ length: n }, (_, k) => {
                  const a = (k / n) * Math.PI * 2 + i * 0.3;
                  return (
                    <rect
                      key={k}
                      x={830 + r * Math.cos(a) - 16}
                      y={260 + r * Math.sin(a) - 16}
                      width={32}
                      height={32}
                      fill="rgba(138,90,51,0.5)"
                      stroke={C.earthGlow}
                      strokeWidth={2}
                      rx={2}
                    />
                  );
                })}
              </g>
            );
          })}
          {/* bàn tay nâng khối đầu tiên */}
          <g opacity={ease(p(tTay, tTay + 0.06))} transform={`translate(0 ${Math.sin(frame / 8) * 4})`}>
            <rect x={60} y={286} width={44} height={44} fill="rgba(138,90,51,0.55)" stroke={C.earthGlow} strokeWidth={3} />
            <path d="M 30 340 q 30 -22 68 -8 q 16 8 4 24 q -40 18 -72 -16 Z" fill={C.cream} />
          </g>
        </svg>
        <div style={{ display: "flex", gap: 40, marginTop: 30 }}>
          {phrases.map((ph, i) => (
            <Reveal key={i} startFrac={ph.t} endFrac={ph.t + 0.07}>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 800,
                  fontSize: 56,
                  color: ph.color,
                  textShadow: "0 3px 18px rgba(0,0,0,0.7)",
                }}
              >
                {ph.text}
              </div>
            </Reveal>
          ))}
        </div>
      </AbsoluteFill>
      <SourceTag text="Giỏ, đầm gỗ — và hàng triệu khối đất" bottom={40} right />
    </Paper>
  );
};

// === sc027 === HAI ƯỚC TÍNH — side-by-side nguồn + thanh ngày công
export const Sc027: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tTrai = A("thuộc", 1); // «Con số thứ hai thuộc về...» — nhắc lại cột trái
  const tBao = A("bảo", 1); // «tính toán bảo thủ hơn»
  const tPhai = A("không", 1); // «một phẩy không sáu triệu mét khối»
  const tNgay = A("ngày", 1); // «triệu ngày công»
  const { p } = useFrac(durationInFrames);
  return (
    <Paper variant="teal">
      <LabBadge text="HAI ƯỚC TÍNH — HAI PHƯƠNG PHÁP" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* đường biên sáng chia đôi */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 180,
            bottom: 260,
            width: 3,
            background: `linear-gradient(rgba(232,220,200,0), rgba(232,220,200,0.9), rgba(232,220,200,0))`,
            transform: "scaleX(" + ease(p(tBao - 0.06, tBao)) + ")",
          }}
        />
        <div style={{ display: "flex", gap: 120 }}>
          {/* trái — ước tính phổ biến */}
          <div style={{ width: 640, textAlign: "center" }}>
            <div style={{ height: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div
                style={{
                  width: 300,
                  height: 300 * ease(p(tTrai - 0.1, tTrai + 0.15)),
                  background: "linear-gradient(rgba(138,90,51,0.75), rgba(138,90,51,0.35))",
                  border: `3px solid ${C.earthGlow}`,
                  borderRadius: "6px 6px 0 0",
                }}
              />
            </div>
            <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 52, color: C.white, marginTop: 18 }}>
              2,2–2,3 triệu m³
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream }}>(ước tính phổ biến)</div>
          </div>
          {/* phải — Nam C. Kim bảo thủ */}
          <div style={{ width: 640, textAlign: "center" }}>
            <div style={{ height: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div
                style={{
                  width: 300,
                  height: 300 * 0.46 * ease(p(tPhai, tPhai + 0.15)),
                  background: "linear-gradient(rgba(127,209,200,0.7), rgba(127,209,200,0.3))",
                  border: `3px solid ${C.teal}`,
                  borderRadius: "6px 6px 0 0",
                }}
              />
            </div>
            <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 52, color: C.white, marginTop: 18 }}>
              ~1,06 triệu m³
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream }}>(Nam C. Kim, bảo thủ)</div>
          </div>
        </div>
        {/* thanh quy đổi ngày công — đóng dấu */}
        <SpringPop startFrac={tNgay} from={0.8} style={{ marginTop: 60 }}>
          <div
            style={{
              border: `3px dashed ${C.amber}`,
              borderRadius: 8,
              background: "rgba(36,31,26,0.94)",
              padding: "20px 56px",
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 46,
              color: C.amber,
              letterSpacing: 1,
              transform: "rotate(-1.2deg)",
            }}
          >
            3,1–5,2 triệu ngày công
          </div>
        </SpringPop>
      </AbsoluteFill>
      <SourceTag text="Học giả Nam Kim — giáo sư khảo cổ học — chỉ tính phần đo đạc chắc chắn" bottom={40} right />
    </Paper>
  );
};

// === sc028 === NGÀY CÔNG = THÂN THỂ — chấm người nhân bản trên trục năm
export const Sc028: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tMot = A("trọn", 1); // «Một người làm việc trọn một ngày»
  const tVan = A("năm", 2); // «vạn người phải làm liền nhiều năm»
  const tNoi = A("dối", 1); // «Ngày công không nói dối»
  const tLang = A("làng", 1); // «không phải là việc của một làng»
  const { frame, dur, p } = useFrac(durationInFrames);
  const spread = ease(p(tVan, tVan + 0.3));
  return (
    <Paper variant="teal">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* một người = một ngày */}
        <svg width="1500" height="620" viewBox="0 0 1500 620">
          <g opacity={ease(p(tMot - 0.08, tMot))}>
            <circle cx={190} cy={180} r={22} fill={C.cream} />
            <path d="M 190 202 V 330 M 190 226 L 152 280 M 190 226 L 228 280 M 190 330 L 160 400 M 190 330 L 220 400" stroke={C.cream} strokeWidth={11} strokeLinecap="round" fill="none" />
            <path d="M 90 440 H 290" stroke={C.teal} strokeWidth={5} />
            <text x={190} y={496} textAnchor="middle" fill={C.teal} fontFamily='"Be Vietnam Pro"' fontSize={30}>1 người = 1 ngày công</text>
          </g>
          {/* nhân bản thành hàng vạn chấm trên trục năm */}
          <path d="M 470 400 H 1460" stroke={C.cream} strokeWidth={4} opacity={0.7} />
          {Array.from({ length: 240 }, (_, i) => {
            const cx = 470 + ((i * 97) % 990);
            const cy = 340 + ((i * 53) % 90);
            const seen = Math.max(0, Math.min(1, (frame - (tVan + (i % 60) * 0.004) * dur) / (0.12 * dur)));
            return <circle key={i} cx={cx} cy={cy - spread * 60} r={3.4} fill={i % 9 === 0 ? C.amber : C.cream} opacity={0.75 * seen} />;
          })}
          {["đong gạo", "phân công", "canh gác"].map((lbl, i) => (
            <text key={i} x={640 + i * 300} y={210 - spread * 20} textAnchor="middle" fill={C.amber} fontFamily='"Be Vietnam Pro"' fontSize={28} opacity={spread}>
              {lbl}
            </text>
          ))}
          <text x={960} y={470} textAnchor="middle" fill={C.cream} fontFamily='"Be Vietnam Pro"' fontSize={28} opacity={spread * 0.85}>
            … nhiều năm liên tiếp
          </text>
        </svg>
        <SpringPop startFrac={tNoi} from={0.85} style={{ marginTop: 10 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 66, color: C.white }}>
            «Ngày công <span style={{ color: C.teal }}>không nói dối</span>»
          </div>
        </SpringPop>
        <Reveal startFrac={tLang} endFrac={tLang + 0.12}>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, marginTop: 20 }}>
            — đây không phải là việc của một làng
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Đơn vị đo bằng cơ thể con người — không thổi phồng được" bottom={40} right />
    </Paper>
  );
};

// === sc029 === MINI-REVEAL 1 — sơ đồ tổ chức, chữ NHÀ NƯỚC khắc giữa
export const Sc029: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tVach = A("vạch", 1); // «phải có ai đó vạch đường»
  const tPhan = A("phân", 1); // «phân công hàng vạn lao động»
  const tNuoi = A("nuôi", 1); // «nuôi họ qua những năm dài»
  const tBuoc = A("buộc", 1); // «buộc tất cả cùng làm một việc»
  const tNhaNuoc = A("nhà", 1); // «tên gọi: nhà nước»
  const { p } = useFrac(durationInFrames);
  const nodes = [
    { t: tVach, label: "vạch đường" },
    { t: tPhan, label: "phân công hàng vạn lao động" },
    { t: tNuoi, label: "nuôi qua những năm dài" },
    { t: tBuoc, label: "buộc cùng làm một việc" },
  ];
  return (
    <Paper variant="teal">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 1400, height: 560 }}>
          <svg width="1400" height="560" viewBox="0 0 1400 560" style={{ position: "absolute", inset: 0 }}>
            {/* bốn nút quanh tâm */}
            {nodes.map((n, i) => {
              const angle = -Math.PI / 2 + (i * Math.PI) / 2;
              const nx = 700 + 480 * Math.cos(angle);
              const ny = 300 + 190 * Math.sin(angle);
              return (
                <g key={i}>
                  <path d={`M 700 300 L ${nx} ${ny}`} stroke={C.teal} strokeWidth={3.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(n.t, n.t + 0.08))} opacity={0.75} />
                  <circle cx={nx} cy={ny} r={13} fill={C.bg} stroke={C.teal} strokeWidth={4} opacity={ease(p(n.t, n.t + 0.04))} />
                </g>
              );
            })}
            <circle cx={700} cy={300} r={190} fill="none" stroke={C.teal} strokeWidth={2.5} strokeDasharray="10 8" opacity={ease(p(tNhaNuoc, tNhaNuoc + 0.1)) * 0.7} />
          </svg>
          {nodes.map((n, i) => {
            const angle = -Math.PI / 2 + (i * Math.PI) / 2;
            const nx = 700 + 480 * Math.cos(angle);
            const ny = 300 + 190 * Math.sin(angle);
            return (
              <div key={i} style={{ position: "absolute", left: nx - 160, top: ny + 26, width: 320, textAlign: "center" }}>
                <Reveal startFrac={n.t} endFrac={n.t + 0.06}>
                  <div style={{ fontFamily: FONT.body, fontSize: 29, color: C.cream, background: "rgba(26,23,20,0.8)", borderRadius: 6, padding: "6px 10px", display: "inline-block" }}>
                    {n.label}
                  </div>
                </Reveal>
              </div>
            );
          })}
          {/* chữ NHÀ NƯỚC khắc giữa */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center" }}>
            <SpringPop startFrac={tNhaNuoc} from={0.7}>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 800,
                  fontSize: 108,
                  letterSpacing: 10,
                  color: C.white,
                  textShadow: "0 0 40px rgba(127,209,200,0.4), 0 4px 20px rgba(0,0,0,0.7)",
                }}
              >
                NHÀ NƯỚC
              </div>
            </SpringPop>
          </div>
        </div>
      </AbsoluteFill>
      <SourceTag text="Điều tiết lộ đầu tiên của tối nay" bottom={40} right />
    </Paper>
  );
};

// === sc030 === HÓA THẠCH — vòng thành hóa thạch + 'một phát — vạn mũi' mở hồi hai
export const Sc030: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tHoa = A("hóa", 1); // «hóa thạch của một nhà nước»
  const tHoi = A("tự", 1); // «một nước như thế tự vệ bằng gì?»
  const tVanMui = A("vạn", 1); // «một phát — vạn mũi»
  const { frame, dur, p } = useFrac(durationInFrames);
  const fossil = ease(p(tHoa, tHoa + 0.2));
  return (
    <Paper variant="teal">
      <WipeInk startFrac={tVanMui - 0.04} color="#D9A441" durationInFrames={durationInFrames} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ opacity: 1 - ease(p(tVanMui, tVanMui + 0.15)) }}>
          {/* ba vòng thành — khung xương hóa thạch */}
          {[430, 300, 175].map((r, i) => (
            <g key={i}>
              <circle cx={960} cy={520} r={r} fill="none" stroke={C.cream} strokeWidth={5} opacity={0.55} />
              {/* gai xương khắc trong tầng đất */}
              {Array.from({ length: 26 - i * 6 }, (_, k) => {
                const a = (k / (26 - i * 6)) * Math.PI * 2;
                const seen = Math.max(0, Math.min(1, (frame - (tHoa + (k % 8) * 0.015) * dur) / (0.1 * dur)));
                return (
                  <path
                    key={k}
                    d={`M ${960 + r * Math.cos(a)} ${520 + r * Math.sin(a)} l ${14 * Math.cos(a)} ${14 * Math.sin(a)}`}
                    stroke={C.teal}
                    strokeWidth={3.5}
                    opacity={fossil * seen * 0.8}
                  />
                );
              })}
            </g>
          ))}
          {/* tầng đất vạch ngang */}
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M -40 ${760 + i * 90} q 260 -22 520 0 t 520 0 t 520 0 t 520 0`} fill="none" stroke={C.earth} strokeWidth={3} opacity={0.4} />
          ))}
        </svg>
        <div style={{ position: "absolute", bottom: 170, left: 0, right: 0, textAlign: "center" }}>
          <Reveal startFrac={tHoi} endFrac={tHoi + 0.08}>
            <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream }}>
              «Một nước như thế — <b style={{ color: C.white }}>tự vệ bằng gì?</b>»
            </div>
          </Reveal>
          <SpringPop startFrac={tVanMui} from={0.75}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 96,
                color: C.amber,
                marginTop: 26,
                textShadow: "0 0 46px rgba(217,164,65,0.5), 0 4px 24px rgba(0,0,0,0.7)",
              }}
            >
              một phát — vạn mũi
            </div>
          </SpringPop>
        </div>
      </AbsoluteFill>
      <SourceTag text="Hồ sơ nền đất: có người, có tổ chức, có mưu — Hồi hai mở ra" bottom={40} right />
    </Paper>
  );
};
