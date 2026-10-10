// VN-Myth Ep.04 — scenes group F: sc051..sc060 (trang sử thiếu tên, làm rể,
// nội gián, áo lông ngơ, vệt lông, dừng một nhịp, callback chiếc nỏ, cậy nỏ,
// bi kịch, bi kịch không phải bản án). Speech-lock: mọi animation fire tại A("từ", occ).
import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  CrossbowGlyph,
  InkImageScene,
  Paper,
  QuotePlate,
  Reveal,
  SourceTag,
  SoundRipples,
  SpringPop,
  StrikeThrough,
  WipeInk,
  circleD,
  ease,
  useA,
  useFrac,
} from "./common";

// === sc051 === TRANG SỬ THIẾU TÊN — ba ô tìm trống, chữ «mưu» duy nhất
export const Sc051: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tMy = A("Mỵ", 1); // «không có Mỵ Châu»
  const tTrong = A("Trọng", 1); // «Không có Trọng Thủy»
  const tNo = A("nỏ", 1); // «Không có nỏ thần»
  const tRua = A("rùa", 1); // «không hề biết câu chuyện rùa vàng»
  const tMuu = A("mưu", 3); // «chỉ chép gọn một chữ — mưu»
  const tHoi = A("truyền", 1); // «truyền thuyết Việt chính là bản kể chi tiết...»
  const { frame, p } = useFrac(durationInFrames);
  const slots = [
    { t: tMy, q: "Mỵ Châu" },
    { t: tTrong, q: "Trọng Thủy" },
    { t: tNo, q: "nỏ thần" },
  ];
  return (
    <Paper>
      {/* trang Sử ký — cột chữ lướt chậm phía sau */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: 0.16 }}>
        <rect x={420} y={70} width={1080} height={940} fill="none" stroke={C.cream} strokeWidth={3} />
        {Array.from({ length: 11 }, (_, c) => (
          <g key={c}>
            <path
              d={`M ${480 + c * 96} 110 V 970`}
              stroke={C.cream}
              strokeWidth={1.5}
              opacity={0.5}
              strokeDasharray="7 11"
              strokeDashoffset={-((frame * 0.6 + c * 37) % 300)}
            />
          </g>
        ))}
      </svg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Reveal startFrac={0.02} endFrac={0.07}>
          <Chip color={C.cream}>tra trong toàn bộ trang sử ấy</Chip>
        </Reveal>
        <div style={{ display: "flex", gap: 44 }}>
          {slots.map((s, i) => {
            const t = ease(p(s.t, s.t + 0.05));
            return (
              <div
                key={i}
                style={{
                  width: 380,
                  border: `3px solid ${t >= 1 ? C.warn : C.border}`,
                  borderRadius: 10,
                  background: "rgba(36,31,26,0.94)",
                  padding: "34px 30px 30px",
                  textAlign: "center",
                  opacity: t > 0 ? 1 : 0.25,
                  transform: `translateY(${(1 - t) * 26}px)`,
                }}
              >
                <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.mute, letterSpacing: 2 }}>tìm:</div>
                <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white, marginTop: 10 }}>
                  {s.q}
                </div>
                <div
                  style={{
                    marginTop: 20,
                    display: "inline-block",
                    padding: "6px 22px",
                    border: `3px solid ${C.warn}`,
                    borderRadius: 6,
                    transform: `rotate(${i % 2 === 0 ? -4 : 3}deg) scale(${t >= 1 ? 1 : 0.4})`,
                    opacity: t >= 1 ? 1 : 0,
                    fontFamily: FONT.body,
                    fontWeight: 800,
                    fontSize: 40,
                    letterSpacing: 4,
                    color: C.warn,
                  }}
                >
                  KHÔNG CÓ
                </div>
              </div>
            );
          })}
        </div>
        {/* ô cuối — chữ «mưu» khắc */}
        <div style={{ position: "relative", marginTop: 14 }}>
          <div
            style={{
              border: `3px solid ${C.amber}`,
              borderRadius: 10,
              background: "rgba(26,23,20,0.96)",
              padding: "18px 66px 22px",
              opacity: ease(p(tMuu - 0.03, tMuu + 0.04)),
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: C.amber }}>mưu</div>
          </div>
          <div
            style={{
              position: "absolute",
              top: -22,
              left: 40,
              padding: "4px 18px",
              background: C.amber,
              color: "#1A1714",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 3,
              borderRadius: 4,
              opacity: ease(p(tMuu, tMuu + 0.04)),
            }}
          >
            CHỈ MỘT CHỮ
          </div>
        </div>
      </AbsoluteFill>
      <Reveal startFrac={tHoi} endFrac={tHoi + 0.1} style={{ position: "absolute", bottom: 96, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream }}>
          truyền thuyết Việt — phải chăng là <span style={{ color: C.amber }}>bản kể chi tiết của chữ đó</span>?
        </div>
      </Reveal>
      <SourceTag text="Sử ký — mực của bên thắng cuộc, không hề biết chuyện rùa vàng" bottom={40} right />
    </Paper>
  );
};

// === sc052 === LÀM RỂ — Trọng Thủy sang Âu Lạc
export const Sc052: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tThuy = A("Thủy", 1); // «Trọng Thủy sang Âu Lạc làm rể»
  const tRe = A("rể", 1); // «làm rể»
  const tHon = A("hôn", 1); // «hôn nhân hòa hiếu»
  const tDep = A("đẹp", 1); // «nghe rất đẹp»
  const { frame, dur, p } = useFrac(durationInFrames);
  const scan = (frame % Math.round(dur * 0.5)) / (dur * 0.5);
  return (
    <Paper>
      <WipeInk startFrac={0} color={C.earthDeep} durationInFrames={durationInFrames} />
      <InkImageScene src="img-sc052.png" focus={{ x: 0.56, y: 0.4 }} durationInFrames={durationInFrames}>
        <div style={{ position: "absolute", top: 84, left: 84 }}>
          <SpringPop startFrac={tThuy} from={0.84} durationInFrames={durationInFrames}>
            <Chip color={C.amber}>TRỌNG THỦY — con trai Triệu Đà</Chip>
          </SpringPop>
        </div>
        <div style={{ position: "absolute", top: 84, right: 84, textAlign: "right" }}>
          <SpringPop startFrac={tRe} from={0.84} durationInFrames={durationInFrames}>
            <div
              style={{
                border: `2px solid ${C.cream}`,
                borderRadius: 8,
                background: "rgba(26,23,20,0.86)",
                padding: "12px 28px",
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 38,
                color: C.white,
              }}
            >
              sang Âu Lạc <span style={{ color: C.amber }}>làm rể</span>
            </div>
          </SpringPop>
        </div>
        {/* tia dò xét — không nói ra nhưng có thật */}
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <path
            d={`M ${360 + scan * 640} 300 L ${360 + scan * 640} 860`}
            stroke={C.teal}
            strokeWidth={2}
            opacity={0.22 * ease(p(tRe, tRe + 0.1))}
          />
        </svg>
        <Reveal startFrac={tHon} endFrac={tHon + 0.08} style={{ position: "absolute", bottom: 250, left: 0, right: 0, textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(20,17,13,0.8)",
              borderRadius: 10,
              padding: "18px 40px",
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 54,
              color: C.white,
            }}
          >
            «một cuộc hôn nhân hòa hiếu — <span style={{ color: C.amber }}>nghe rất đẹp</span>»
          </div>
        </Reveal>
        <SourceTag text="Bề ngoài: hòa hiếu — bên trong: thăm dò" bottom={44} right />
      </InkImageScene>
    </Paper>
  );
};

// === sc053 === SƠ ĐỒ NỘI GIÁN — tin tức chảy từ trong thành ra ngoài
export const Sc053: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tGian = A("nội", 1); // «nội gián»
  const tBao = A("báo", 1); // «người trong thành báo cho người ngoài thành»
  const tMy = A("Mỵ", 1); // «Và Mỵ Châu — đứng chính giữa câu chuyện»
  const tChien = A("chiến", 1); // «chiến tranh tình báo qua hôn nhân chính trị»
  const tVo = A("vợ", 1); // «người vợ trẻ bao giờ cũng là người gặp nguy nhất»
  const { frame, dur, p } = useFrac(durationInFrames);
  // mũi tên chảy: dash-offset chạy liên tục từ tBao
  const flow = Math.max(0, (frame - tBao * dur) / 1);
  return (
    <Paper variant="teal">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SpringPop startFrac={tGian} from={0.82} durationInFrames={durationInFrames}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 92,
              color: C.white,
              letterSpacing: 6,
              textShadow: "0 4px 24px rgba(0,0,0,0.7)",
            }}
          >
            NỘI <span style={{ color: C.teal }}>GIÁN</span>
          </div>
        </SpringPop>
        <svg width="1500" height="560" viewBox="0 0 1500 560" style={{ marginTop: 30 }}>
          {/* vòng thành trong */}
          <path d={circleD(430, 280, 190)} fill="none" stroke={C.cream} strokeWidth={4} opacity={0.55} />
          <path d={circleD(430, 280, 150)} fill="none" stroke={C.cream} strokeWidth={2} opacity={0.3} />
          {/* Mỵ Châu silhouette giữa thành */}
          <g opacity={ease(p(tMy, tMy + 0.06))}>
            <circle cx={430} cy={210} r={22} fill="none" stroke={C.white} strokeWidth={4} />
            <path d="M 430 236 Q 468 300 448 392 Q 430 372 412 392 Q 392 300 430 236 Z" fill="none" stroke={C.white} strokeWidth={4} />
            <path d="M 420 250 Q 372 292 380 360" fill="none" stroke={C.cream} strokeWidth={3} opacity={0.7} />
          </g>
          {/* hai luồng tin chạy ra ngoài */}
          {[0, 1].map((k) => (
            <path
              key={k}
              d={
                k === 0
                  ? "M 560 220 Q 760 120 1010 190 Q 1110 220 1140 262"
                  : "M 560 340 Q 780 420 1000 350 Q 1100 322 1140 292"
              }
              fill="none"
              stroke={C.teal}
              strokeWidth={5}
              pathLength={1}
              strokeDasharray="0.06 0.05"
              strokeDashoffset={-((flow * 0.11 + k * 0.5) % 1)}
              opacity={0.9 * ease(p(tBao, tBao + 0.08))}
            />
          ))}
          {/* Triệu Đà nhận tin — nút ngoài thành */}
          <g opacity={ease(p(tBao + 0.12, tBao + 0.2))}>
            <circle cx={1220} cy={276} r={64} fill="rgba(200,85,61,0.16)" stroke={C.warn} strokeWidth={5} />
            <path d="M 1196 258 h 48 M 1196 276 h 48 M 1196 294 h 48" stroke={C.warn} strokeWidth={4} />
            <path d="M 1190 244 l 12 -14 l 12 14 M 1190 308 l 12 14 l 12 -14" fill="none" stroke={C.warn} strokeWidth={4} />
          </g>
          <text x={430} y={500} textAnchor="middle" fill={C.cream} fontFamily={FONT.body} fontSize={32} opacity={0.85}>
            người trong thành
          </text>
          <text x={1220} y={500} textAnchor="middle" fill={C.cream} fontFamily={FONT.body} fontSize={32} opacity={0.85}>
            Triệu Đà — bên ngoài
          </text>
        </svg>
        <Reveal startFrac={tChien} endFrac={tChien + 0.08}>
          <div
            style={{
              border: `2px solid ${C.teal}`,
              borderRadius: 10,
              background: "rgba(26,23,20,0.9)",
              padding: "16px 38px",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 42,
              color: C.white,
            }}
          >
            chiến tranh <span style={{ color: C.teal }}>tình báo</span> qua hôn nhân chính trị
          </div>
        </Reveal>
      </AbsoluteFill>
      <Reveal startFrac={tVo} endFrac={tVo + 0.1} style={{ position: "absolute", bottom: 78, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.warn }}>
          người vợ trẻ — bao giờ cũng là người gặp nguy nhất
        </div>
      </Reveal>
      <SourceTag text="Không vung kiếm, không vây thành — chỉ một đám cưới và những tin tức" bottom={36} right />
    </Paper>
  );
};

// === sc054 === TẤM ÁO LÔNG NGƠ — hero cảm xúc
export const Sc054: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tAo = A("áo", 1); // «một tấm áo lông ngơ»
  const tRoi = A("rơi", 1); // «lông ngơ rơi xuống từng sợi»
  const { frame, p } = useFrac(durationInFrames);
  const drift = ease(p(tRoi, tRoi + 0.3));
  return (
    <Paper>
      <WipeInk startFrac={0} color={C.earthDeep} durationInFrames={durationInFrames} />
      <InkImageScene src="img-sc054.png" focus={{ x: 0.46, y: 0.38 }} durationInFrames={durationInFrames}>
        <div style={{ position: "absolute", top: 84, left: 84 }}>
          <SpringPop startFrac={tAo} from={0.84} durationInFrames={durationInFrames}>
            <Chip color={C.amber}>Mỵ Châu — tấm áo lông ngơ</Chip>
          </SpringPop>
        </div>
        {/* lông ngơ trôi chậm toàn khung */}
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: 16 }, (_, i) => {
            const t0 = tRoi + 0.02 + (i % 6) * 0.05;
            const alive = ease(p(t0, t0 + 0.08));
            const y = -60 + ((frame * (0.9 + (i % 4) * 0.35) + i * 233) % 1240);
            const x = 140 + ((i * 331 + Math.round(frame * 0.35 * ((i % 3) + 1))) % 1680);
            const rot = Math.sin((frame + i * 40) / 26) * 24;
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={alive * 0.85 * (0.4 + drift * 0.6)}>
                <path d="M 0 0 q 7 -16 22 -18 q -3 16 -22 18 z" fill="none" stroke={C.white} strokeWidth={2.4} />
                <path d="M 2 -1 q 6 -6 14 -9" fill="none" stroke={C.cream} strokeWidth={1.4} opacity={0.8} />
              </g>
            );
          })}
        </svg>
        <Reveal startFrac={tRoi} endFrac={tRoi + 0.12} style={{ position: "absolute", bottom: 250, left: 0, right: 0, textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(20,17,13,0.8)",
              borderRadius: 10,
              padding: "16px 40px",
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 52,
              color: C.white,
            }}
          >
            lông ngơ rơi xuống <span style={{ color: C.amber }}>từng sợi</span>
          </div>
        </Reveal>
        <SourceTag text="Biểu tượng của lòng tin — không dìm nhân vật" bottom={44} right />
      </InkImageScene>
    </Paper>
  );
};

// === sc055 === LÔNG RƠI THÀNH ĐƯỜNG — vệt chỉ đường trên bản đồ
export const Sc055: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDanh = A("đánh", 1); // «đánh dấu con đường nàng đi»
  const tQuan = A("Quân", 1); // «Quân địch lần theo vết lông»
  const tAm = A("âm", 1); // «âm thầm như tuyết rơi»
  const { p } = useFrac(durationInFrames);
  // đường chạy từ thành (trái-trên) xuống đồng bằng (phải-dưới)
  const pathD = "M 300 300 Q 560 360 700 520 Q 840 680 1080 720 Q 1320 760 1520 640";
  const enemyT = ease(p(tQuan, tQuan + 0.45));
  const ex = 300 + enemyT * 1220;
  const ey = 300 + enemyT * 340 + Math.sin(enemyT * Math.PI) * 120;
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Chip color={C.amber}>bản đồ — từ thành Cổ Loa ra biển Đông</Chip>
        <svg width="1700" height="760" viewBox="0 0 1700 760" style={{ marginTop: 26 }}>
          {/* mực đồng bằng */}
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M 120 ${180 + i * 150} q 220 -26 440 0 q 220 26 440 0 q 220 -26 440 0`} fill="none" stroke={C.cream} strokeWidth={2} opacity={0.16} />
          ))}
          {/* thành Cổ Loa — ba vòng nhỏ */}
          {[86, 60, 34].map((r, i) => (
            <path
              key={i}
              d={circleD(300, 300, r)}
              fill="none"
              stroke={i === 2 ? C.amber : C.earthGlow}
              strokeWidth={i === 2 ? 6 : 4}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - ease(p(0.03 + i * 0.02, 0.12 + i * 0.02))}
            />
          ))}
          {/* vệt lông: chấm nối thành đường lung linh */}
          {Array.from({ length: 9 }, (_, i) => {
            const t0 = tDanh + i * 0.045;
            const a = ease(p(t0, t0 + 0.04));
            const u = (i + 0.5) / 9;
            const px = 300 + u * u * 260 + u * 960 * (1 - 0.18 * Math.sin(u * 6.3));
            const py = 300 + Math.sin(u * 3.1) * 130 + u * 360;
            return (
              <g key={i} opacity={a}>
                <circle cx={px} cy={py} r={13} fill={C.amber} opacity={0.22 * a} />
                <circle cx={px} cy={py} r={5} fill={C.amber} opacity={0.95} />
                {/* sợi lông rơi tới chấm */}
                <path
                  d={`M ${px - 4} ${py - 120 + a * 110} q 6 -14 20 -16 q -3 14 -20 16 z`}
                  fill="none"
                  stroke={C.white}
                  strokeWidth={2}
                  opacity={a}
                />
              </g>
            );
          })}
          {/* đường mờ nối các chấm */}
          <path
            d={pathD}
            fill="none"
            stroke={C.amber}
            strokeWidth={3}
            pathLength={1}
            strokeDasharray="0.012 0.99"
            strokeDashoffset={-ease(p(tDanh, tDanh + 0.4)) * 0.9}
            opacity={0.7}
          />
          {/* bóng quân địch lần theo */}
          <g opacity={ease(p(tQuan, tQuan + 0.08))}>
            <circle cx={ex} cy={ey} r={44} fill="rgba(20,17,13,0.9)" stroke={C.warn} strokeWidth={4} />
            <path d={`M ${ex - 20} ${ey - 10} l 14 -18 l 14 18 M ${ex - 8} ${ey - 4} l 8 16 l 8 -16`} fill="none" stroke={C.warn} strokeWidth={3.5} />
          </g>
        </svg>
        <Reveal startFrac={tQuan + 0.1} endFrac={tQuan + 0.2}>
          <div
            style={{
              border: `2px solid ${C.warn}`,
              borderRadius: 10,
              background: "rgba(26,23,20,0.9)",
              padding: "14px 36px",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 42,
              color: C.white,
            }}
          >
            quân địch <span style={{ color: C.warn }}>lần theo vết lông</span> — tìm tới tận thành
          </div>
        </Reveal>
      </AbsoluteFill>
      <Reveal startFrac={tAm} endFrac={tAm + 0.1} style={{ position: "absolute", bottom: 74, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.cream }}>
          không ai nhận ra — <span style={{ color: C.white }}>âm thầm như tuyết rơi</span>
        </div>
      </Reveal>
      <SourceTag text="Máy định vị đầu tiên trong ký ức Việt — dấu vết kỹ thuật, vết thương" bottom={34} right />
    </Paper>
  );
};

// === sc056 === DỪNG MỘT NHỊP — card lặng
export const Sc056: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDung = A("dừng", 1); // «Hãy dừng lại một nhịp»
  const tBieu = A("biểu", 1); // «biểu tượng của lòng tin»
  const tTin = A("tin", 3); // «không có lỗi trong việc tin»
  const tMay = A("máy", 1); // «máy định vị đầu tiên trong ký ức Việt»
  const tKy = A("kỹ", 1); // «một dấu vết kỹ thuật»
  const tVet = A("vết", 3); // «một vết thương»
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Reveal startFrac={tDung} endFrac={tDung + 0.1}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.mute, letterSpacing: 3 }}>
            dừng lại một nhịp — trước khi vội phán xét
          </div>
        </Reveal>
        <Reveal startFrac={tBieu} endFrac={tBieu + 0.1}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, color: C.cream }}>
            chiếc áo ấy là <span style={{ color: C.amber }}>biểu tượng của lòng tin</span>
          </div>
        </Reveal>
        <SpringPop startFrac={tMay} from={0.86} durationInFrames={durationInFrames}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 104,
              color: C.white,
              textAlign: "center",
              textShadow: "0 6px 30px rgba(0,0,0,0.65)",
              lineHeight: 1.15,
            }}
          >
            «máy định vị đầu tiên
            <br />
            trong <span style={{ color: C.amber }}>ký ức Việt</span>»
          </div>
        </SpringPop>
        <div style={{ display: "flex", gap: 44 }}>
          <Reveal startFrac={tKy} endFrac={tKy + 0.08}>
            <div
              style={{
                border: `2px solid ${C.teal}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.92)",
                padding: "18px 36px",
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 38,
                color: C.cream,
              }}
            >
              vừa là một <span style={{ color: C.teal }}>dấu vết kỹ thuật</span>
            </div>
          </Reveal>
          <Reveal startFrac={tVet} endFrac={tVet + 0.08}>
            <div
              style={{
                border: `2px solid ${C.warn}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.92)",
                padding: "18px 36px",
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 38,
                color: C.cream,
              }}
            >
              vừa là một <span style={{ color: C.warn }}>vết thương</span>
            </div>
          </Reveal>
        </div>
        <Reveal startFrac={tTin} endFrac={tTin + 0.1}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.white, letterSpacing: 1 }}>
            người vợ tin chồng — và <span style={{ color: C.amber }}>không có lỗi trong việc tin</span>
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Tôn trọng nhân vật — đúng tông bi tráng của tập" bottom={40} right />
    </Paper>
  );
};

// === sc057 === CHIẾC NỎ ĐÂU RỒI — callback quote hồi Hai
export const Sc057: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tNo = A("nỏ", 1); // «chiếc nỏ đâu rồi?»
  const tThang = A("thắng", 1); // «nó vẫn đó — và nó vừa thắng»
  const tBan = A("bắn", 1); // «vua lấy nỏ thần ra bắn»
  const tThua = A("thua", 1); // «quân Đà thua lớn»
  const tHoa = A("hòa", 1); // «phải xin hòa»
  const { p } = useFrac(durationInFrames);
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
        <Reveal startFrac={tNo} endFrac={tNo + 0.08}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 88, color: C.white }}>
            chiếc nỏ <span style={{ color: C.amber }}>đâu rồi?</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream, textAlign: "center", marginTop: 14 }}>
            nó vẫn đó — và nó <span style={{ color: C.amber }}>vừa thắng</span>
          </div>
        </Reveal>
        {/* reprise khung mờ từ hồi Hai */}
        <div style={{ opacity: 0.94 }}>
          <QuotePlate
            text="quân Đà thua lớn, chạy về Trâu Sơn cầm cự, không dám đối chiến, phải xin hòa"
            startFrac={tThua}
            endFrac={tHoa + 0.1}
            size={50}
            durationInFrames={durationInFrames}
            source="Truyện Rùa Vàng — reprise từ hồi Hai"
          />
        </div>
        {/* glyph nỏ mờ phía dưới */}
        <svg width="900" height="300" viewBox="0 0 900 300" style={{ opacity: 0.5 }}>
          <CrossbowGlyph x={450} y={140} scale={0.78} progress={ease(p(tBan, tBan + 0.2))} />
        </svg>
      </AbsoluteFill>
      <SourceTag text="Thắng lớn đến thế — và chính ở đó, hạt giống thất bại nảy" bottom={44} right />
    </Paper>
  );
};

// === sc058 === CẬY NỎ — vua + nỏ trên bục, bụi thời gian, lửa xa
export const Sc058: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tNo = A("nỏ", 3); // «cậy vào nỏ thần»
  const tTuong = A("tường", 1); // «như một bức tường thành vĩnh viễn»
  const tNguyen = A("Nguyên", 1); // «Nguyên nhân thất thủ nằm ở đó»
  const tAo = A("áo", 1); // «Chứ không nằm ở tấm áo lông ngơ»
  const { frame, p } = useFrac(durationInFrames);
  const dust = ease(p(tTuong, 0.9));
  const flick = 0.5 + 0.5 * Math.sin(frame / 5);
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 120 }}>
        <svg width="1400" height="640" viewBox="0 0 1400 640">
          {/* vua silhouette ngồi bên trái */}
          <g opacity={ease(p(0.02, 0.12))}>
            <circle cx={330} cy={300} r={34} fill="none" stroke={C.cream} strokeWidth={5} />
            <path d="M 330 334 Q 380 380 372 470 L 290 470 Q 282 380 330 334 Z" fill="none" stroke={C.cream} strokeWidth={5} />
            <path d="M 300 380 Q 260 420 268 466 M 360 380 Q 400 420 392 466" fill="none" stroke={C.cream} strokeWidth={4} opacity={0.8} />
          </g>
          {/* bục + nỏ như tượng */}
          <path d="M 700 520 h 420 l -30 60 h -360 z" fill="rgba(138,90,51,0.4)" stroke={C.earthGlow} strokeWidth={4} opacity={ease(p(tNo - 0.04, tNo + 0.05))} />
          <g opacity={ease(p(tNo - 0.02, tNo + 0.06))}>
            <CrossbowGlyph x={910} y={430} scale={0.94} progress={ease(p(tNo, tNo + 0.12))} stroke={C.amber} />
          </g>
          {/* bụi thời gian phủ mờ */}
          {Array.from({ length: 20 }, (_, i) => (
            <circle
              key={i}
              cx={((i * 197 + frame * (0.4 + (i % 3) * 0.3)) % 1400)}
              cy={120 + ((i * 149 + frame * 0.5) % 480)}
              r={1.5 + (i % 3)}
              fill={C.cream}
              opacity={dust * 0.3}
            />
          ))}
          {/* lửa xa bên phải dưới */}
          <g opacity={ease(p(tTuong - 0.1, tTuong))}>
            <circle cx={1290} cy={560} r={54 + flick * 22} fill={C.warn} opacity={0.2} />
            <path d="M 1262 560 q 28 -46 56 0 q -28 26 -56 0 z" fill={C.warn} opacity={0.55} />
          </g>
          {/* vạch chân */}
          <path d="M 120 586 H 1330" stroke={C.cream} strokeWidth={4} opacity={0.6} />
        </svg>
      </AbsoluteFill>
      <Reveal startFrac={tTuong} endFrac={tTuong + 0.1} style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.white }}>
          «cậy vào nỏ thần như một <span style={{ color: C.amber }}>bức tường vĩnh viễn</span>»
        </div>
      </Reveal>
      <div style={{ position: "absolute", bottom: 190, left: 0, right: 0, textAlign: "center" }}>
        <Reveal startFrac={tNguyen} endFrac={tNguyen + 0.08}>
          <div
            style={{
              display: "inline-block",
              border: `3px solid ${C.warn}`,
              borderRadius: 10,
              background: "rgba(26,23,20,0.94)",
              padding: "16px 40px",
              fontFamily: FONT.body,
              fontWeight: 800,
              fontSize: 46,
              color: C.white,
            }}
          >
            NGUYÊN NHÂN THẤT THỦ NẰM Ở ĐÓ
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
        <Reveal startFrac={tAo} endFrac={tAo + 0.08}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream, position: "relative", display: "inline-block", padding: "0 24px" }}>
            chứ không nằm ở tấm áo lông ngơ
            <StrikeThrough startFrac={tAo + 0.05} width={640} thickness={7} />
          </div>
        </Reveal>
      </div>
      <SourceTag text="Vũ khí mạnh nhất chỉ mạnh chừng nào người giữ nó còn biết nó còn hiệu lực" bottom={36} right />
    </Paper>
  );
};

// === sc059 === BI KỊCH — bốn nhịp tableau, 179 TCN
export const Sc059: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tNam = A("Năm", 1); // «Năm một nghìn bảy trăm chín mươi trước Công nguyên»
  const tBao = A("báo", 1); // «Kim Quy báo với vua»
  const tSau = A("sau", 1); // «kẻ thù ở ngay sau lưng»
  const tVe = A("vết", 1); // «in vết lông ngơ»
  const tLay = A("lẫy", 1); // «chiếc lẫy vuốt mất chủ»
  const tChem = A("chém", 1); // «vua chém con gái»
  const tRua = A("rùa", 2); // «theo rùa vàng xuống biển»
  const { p } = useFrac(durationInFrames);
  const panels = [
    { t: tBao, label: "Kim Quy báo", sub: "«kẻ thù ở ngay sau lưng»" },
    { t: tVe, label: "đường vừa đi", sub: "in vết lông ngơ" },
    { t: tLay, label: "nỏ thôi thiêng", sub: "rùa rời đi — lẫy mất chủ" },
    { t: tChem, label: "phút cuối", sub: "theo rùa vàng xuống biển" },
  ];
  return (
    <Paper>
      {/* thẻ năm */}
      <div style={{ position: "absolute", top: 70, left: 84 }}>
        <SpringPop startFrac={tNam} from={0.85} durationInFrames={durationInFrames}>
          <div
            style={{
              border: `2px solid ${C.amber}`,
              borderRadius: 8,
              background: "rgba(26,23,20,0.9)",
              padding: "12px 30px",
              fontFamily: FONT.mono,
              fontSize: 36,
              color: C.amber,
              letterSpacing: 2,
            }}
          >
            179 TCN — Âu Lạc thất thủ
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, marginTop: 6, letterSpacing: 0 }}>
              mốc do sử Hán truyền lại
            </div>
          </div>
        </SpringPop>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1500" height="700" viewBox="0 0 1500 700">
          {/* cuộn tranh — bốn nhịp ngang */}
          {panels.map((pl, i) => {
            const a = ease(p(pl.t, pl.t + 0.06));
            const x = 130 + i * 330;
            return (
              <g key={i} opacity={a}>
                <rect x={x} y={150} width={280} height={360} rx={10} fill="rgba(36,31,26,0.92)" stroke={i === 3 ? C.warn : C.border} strokeWidth={3} />
                {i === 0 && (
                  <g stroke={C.amber} strokeWidth={4} fill="none">
                    <ellipse cx={x + 140} cy={280} rx={62} ry={40} />
                    <circle cx={x + 140} cy={230} r={18} />
                    <path d={`M ${x + 92} 300 l -26 26 M ${x + 188} 300 l 26 26`} />
                  </g>
                )}
                {i === 1 && (
                  <g>
                    <path d={`M ${x + 50} 340 Q ${x + 120} 300 ${x + 190} 340 Q ${x + 240} 370 ${x + 250} 340`} fill="none" stroke={C.amber} strokeWidth={3} />
                    {Array.from({ length: 6 }, (_, k) => (
                      <circle key={k} cx={x + 52 + k * 36} cy={336 + Math.sin(k) * 12} r={4.5} fill={C.amber} />
                    ))}
                    <circle cx={x + 140} cy={260} r={16} fill="none" stroke={C.cream} strokeWidth={4} />
                  </g>
                )}
                {i === 2 && (
                  <g stroke={C.mute} strokeWidth={4} fill="none" opacity={0.9}>
                    <path d={`M ${x + 70} 320 h 140 M ${x + 90} 300 q 50 -40 100 0`} />
                    <path d={`M ${x + 140} 260 l 0 -30 M ${x + 128} 256 l 12 -22 l 12 22`} stroke={C.warn} />
                  </g>
                )}
                {i === 3 && (
                  <g stroke={C.cream} strokeWidth={4} fill="none">
                    <path d={`M ${x + 90} 260 q 30 40 20 90 M ${x + 190} 260 q -30 40 -20 90`} />
                    <path d={`M ${x + 60} 380 q 40 26 80 0 q 40 26 80 0`} stroke={C.teal} />
                    <path d={`M ${x + 200} 300 q 30 -20 54 -6`} stroke={C.amber} />
                  </g>
                )}
                <text x={x + 140} y={452} textAnchor="middle" fill={C.white} fontFamily={FONT.body} fontWeight={700} fontSize={32}>
                  {pl.label}
                </text>
                <text x={x + 140} y={488} textAnchor="middle" fill={C.cream} fontFamily={FONT.body} fontSize={27} opacity={0.9}>
                  {pl.sub}
                </text>
              </g>
            );
          })}
          {/* sóng biển cuối — vua theo rùa xuống */}
          <g opacity={ease(p(tRua, tRua + 0.12))}>
            <path d="M 180 600 q 60 -30 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0" fill="none" stroke={C.teal} strokeWidth={5} opacity={0.7} />
            <path d="M 220 646 q 60 -26 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0" fill="none" stroke={C.teal} strokeWidth={3.5} opacity={0.45} />
          </g>
        </svg>
        <SoundRipples cx={1080} cy={310} startFrac={tBao + 0.05} count={2} maxR={300} color={C.amber} durationInFrames={durationInFrames} />
      </AbsoluteFill>
      <SourceTag text="Không máu me — bi tráng, tôn trọng nhân vật" bottom={40} right />
    </Paper>
  );
};

// === sc060 === BI KỊCH, KHÔNG PHẢI BẢN ÁN — card lặng chốt đạo đức
export const Sc060: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tTu = A("tự", 1); // «Không ai ... tự chọn được số phận của mình»
  const tVu = A("Vua", 1); // «Vua thì tin nhầm vào vũ khí»
  const tYeu = A("yêu", 1); // «con gái thì tin nhầm vào người mình yêu»
  const tBi = A("kịch", 1); // «một bi kịch»
  const tAn = A("án", 1); // «chứ không phải một bản án»
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
        <Reveal startFrac={tTu} endFrac={tTu + 0.1}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.mute, letterSpacing: 2 }}>
            không ai trong số họ — tự chọn được số phận của mình
          </div>
        </Reveal>
        <div style={{ display: "flex", gap: 48 }}>
          <Reveal startFrac={tVu} endFrac={tVu + 0.08}>
            <div
              style={{
                border: `2px solid ${C.amber}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.92)",
                padding: "20px 40px",
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 38,
                color: C.cream,
              }}
            >
              vua thì tin nhầm vào <span style={{ color: C.amber }}>vũ khí</span>
            </div>
          </Reveal>
          <Reveal startFrac={tYeu} endFrac={tYeu + 0.08}>
            <div
              style={{
                border: `2px solid ${C.amber}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.92)",
                padding: "20px 40px",
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 38,
                color: C.cream,
              }}
            >
              con gái thì tin nhầm vào <span style={{ color: C.amber }}>người mình yêu</span>
            </div>
          </Reveal>
        </div>
        <SpringPop startFrac={tBi} from={0.88} durationInFrames={durationInFrames}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 110,
              color: C.white,
              textAlign: "center",
              lineHeight: 1.14,
              textShadow: "0 6px 30px rgba(0,0,0,0.6)",
            }}
          >
            một <span style={{ color: C.amber }}>BI KỊCH</span>
          </div>
        </SpringPop>
        <Reveal startFrac={tAn} endFrac={tAn + 0.1}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 62, color: C.cream, position: "relative", display: "inline-block", padding: "0 30px" }}>
            chứ không phải một bản án
            <StrikeThrough startFrac={tAn + 0.06} width={720} thickness={8} />
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Chốt đạo đức của hồi ba — không phán xét người trong truyện" bottom={40} right />
    </Paper>
  );
};
