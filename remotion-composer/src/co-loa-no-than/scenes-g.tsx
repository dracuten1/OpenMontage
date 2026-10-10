// VN-Myth Ep.04 — scenes group G: sc061..sc070 (giếng Trọng Thủy, ngọc trai,
// ba hồ sơ lên bàn, ba lớp chồng, tuyên ngôn, làng vô danh — nước có sổ,
// cái giá, phẩm giá ba hồ sơ, Cổ Loa không chết, bằng chứng cư trú).
// Speech-lock: mọi animation fire tại A("từ", occ).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  EarthBadge,
  InkImageScene,
  Paper,
  Reveal,
  SourceTag,
  SpringPop,
  WipeInk,
  circleD,
  ease,
  useA,
  useFrac,
} from "./common";

// === sc061 === GIẾNG — Trọng Thủy gieo mình, máu hóa ngọc
export const Sc061: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tGieo = A("gieo", 1); // «gieo mình xuống giếng»
  const tGiang = A("giếng", 1); // giếng hiện
  const tMau = A("Máu", 1); // «Máu Mỵ Châu chảy tới nơi ấy»
  const tHoa = A("hóa", 1); // «hóa ngọc trai»
  const tXua = A("xưa", 1); // «người xưa kể thêm»
  const tSang = A("sáng", 1); // «rửa bằng nước giếng thì càng sáng»
  const { frame, p } = useFrac(durationInFrames);
  const tilt = ease(p(0.05, 0.9)); // tilt-down mô phỏng
  const dropT = ease(p(tMau, tMau + 0.08));
  const dropY = 210 + dropT * 190;
  const pearls = Array.from({ length: 7 }, (_, i) => {
    const t0 = tHoa + i * 0.03;
    const a = ease(p(t0, t0 + 0.05));
    return { a, x: 960 + Math.sin(i * 2.2) * (120 + i * 14), y: 640 + (i % 3) * 34, r: 9 + (i % 3) * 3 };
  });
  return (
    <Paper>
      <WipeInk startFrac={0} color={C.earthDeep} durationInFrames={durationInFrames} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${tilt * 40}px)` }}>
        <svg width="1500" height="860" viewBox="0 0 1500 860">
          {/* miệng giếng tròn xây đá */}
          {[210, 176].map((r, i) => (
            <path
              key={i}
              d={circleD(960, 430, r)}
              fill="none"
              stroke={i === 0 ? C.earthGlow : C.cream}
              strokeWidth={i === 0 ? 10 : 4}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - ease(p(tGiang - 0.05 + i * 0.03, tGiang + 0.1 + i * 0.03))}
              opacity={0.95}
            />
          ))}
          {/* viên đá xây */}
          {Array.from({ length: 18 }, (_, i) => {
            const ang = (i / 18) * Math.PI * 2;
            const a = ease(p(tGiang, tGiang + 0.14));
            return (
              <rect
                key={i}
                x={960 + Math.cos(ang) * 210 - 17}
                y={430 + Math.sin(ang) * 210 * 0.36 - 11}
                width={34}
                height={22}
                rx={4}
                fill="none"
                stroke={C.earthGlow}
                strokeWidth={3}
                opacity={a * 0.8}
              />
            );
          })}
          {/* mặt nước */}
          <ellipse cx={960} cy={470} rx={130} ry={26} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.5} />
          {/* Trọng Thủy trên rìa giếng — rơi khi gieo mình */}
          <g opacity={ease(p(tGieo, tGieo + 0.05))}>
            <circle cx={700} cy={300 - dropT * 120} r={20} fill="none" stroke={C.cream} strokeWidth={4} />
            <path
              d={`M 700 ${322 - dropT * 120} Q 736 ${368 - dropT * 120} 728 ${432 - dropT * 120} L 672 ${432 - dropT * 120} Q 664 ${368 - dropT * 120} 700 ${322 - dropT * 120} Z`}
              fill="none"
              stroke={C.cream}
              strokeWidth={4}
            />
          </g>
          {/* giọt sáng rơi theo */}
          {tMau > 0 && dropT < 1 && dropT > 0 && (
            <circle cx={770 + dropT * 130} cy={dropY} r={8} fill={C.amber} opacity={0.9} />
          )}
          {/* ngọc nở trong lòng giếng */}
          {pearls.map((pr, i) => (
            <g key={i} opacity={pr.a}>
              <circle cx={pr.x} cy={pr.y} r={pr.r + 8} fill={C.amber} opacity={0.18 * pr.a} />
              <circle cx={pr.x} cy={pr.y} r={pr.r} fill="none" stroke={C.amber} strokeWidth={3.5} />
              <circle cx={pr.x - 3} cy={pr.y - 3} r={2.5} fill={C.white} opacity={0.85} />
            </g>
          ))}
          {/* ánh sáng dậy */}
          <circle cx={960} cy={640} r={230 + Math.sin(frame / 9) * 10} fill={C.amber} opacity={0.07 * ease(p(tSang, tSang + 0.1))} />
        </svg>
      </AbsoluteFill>
      <Reveal startFrac={tXua} endFrac={tXua + 0.1} style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(20,17,13,0.82)",
            borderRadius: 10,
            padding: "18px 44px",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 52,
            color: C.white,
          }}
        >
          máu Mỵ Châu <span style={{ color: C.amber }}>hóa ngọc trai</span>
        </div>
      </Reveal>
      <Reveal startFrac={tSang} endFrac={tSang + 0.1} style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream }}>
          «ngọc ấy rửa bằng nước giếng — thì <span style={{ color: C.amber }}>càng sáng</span>»
        </div>
      </Reveal>
      <SourceTag text="Phép màu cuối truyền thuyết — nghe như một lời an ủi" bottom={40} right />
    </Paper>
  );
};

// === sc062 === NGỌC TRAI TRONG VỎ — ghép xong hai hồ sơ
export const Sc062: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tPhap = A("phép", 1); // «phép màu nghe như một lời an ủi»
  const tGiang = A("giếng", 3); // «Nước giếng và giọt ngọc — hai thứ vô tri»
  const tGhep = A("ghép", 1); // «Giờ, ghép hai hồ sơ lại»
  const tHan = A("Hán", 1); // «Sử Hán: mưu kế»
  const tNan = A("nạn", 1); // «Mỵ Châu là nạn nhân»
  const tNguyen = A("nguyên", 1); // «Không phải nguyên nhân»
  const { p } = useFrac(durationInFrames);
  return (
    <InkImageScene src="img-sc062-01.png" focus={{ x: 0.5, y: 0.46 }} durationInFrames={durationInFrames} label="ngọc trong vỏ trai" sublabel="hai thứ vô tri — giữ lại chút sáng cho một bi kịch">
      {/* inset giếng khi narration nhắc nước giếng */}
      <div style={{ position: "absolute", top: 84, right: 84 }}>
        <SpringPop startFrac={tGiang} from={0.82} durationInFrames={durationInFrames}>
          <div style={{ border: `3px solid ${C.amber}`, borderRadius: 10, padding: 6, background: "rgba(26,23,20,0.9)" }}>
            <Img src={staticFile("co-loa-no-than/images/img-sc062-02.png")} style={{ width: 360, height: 240, borderRadius: 6, objectFit: "cover", display: "block" }} />
            <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.cream, textAlign: "center", padding: "8px 0 4px" }}>giếng cổ</div>
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={tPhap} endFrac={tPhap + 0.1} style={{ position: "absolute", top: 96, left: 84 }}>
        <Chip color={C.amber}>phép màu — nghe như một lời an ủi</Chip>
      </Reveal>
      {/* mini-reveal: ghép hai hồ sơ */}
      <div style={{ position: "absolute", bottom: 250, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <SpringPop startFrac={tGhep} from={0.85} durationInFrames={durationInFrames}>
          <div
            style={{
              display: "flex",
              gap: 26,
              alignItems: "center",
              background: "rgba(20,17,13,0.86)",
              border: `2px solid ${C.border}`,
              borderRadius: 12,
              padding: "18px 40px",
              opacity: ease(p(tGhep, tGhep + 0.05)),
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.cream, letterSpacing: 2 }}>SỬ HÁN</div>
              <div style={{ fontFamily: FONT.mono, fontSize: 34, color: C.white, marginTop: 6, opacity: ease(p(tHan, tHan + 0.05)) }}>mưu kế</div>
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 44, color: C.amber }}>↔</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.cream, letterSpacing: 2 }}>TRUYỀN THUYẾT VIỆT</div>
              <div style={{ fontFamily: FONT.mono, fontSize: 34, color: C.white, marginTop: 6 }}>nội gián · hôn nhân · lông ngơ</div>
            </div>
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center" }}>
        <SpringPop startFrac={tNan} from={0.8} durationInFrames={durationInFrames}>
          <div
            style={{
              display: "inline-block",
              border: `3px solid ${C.amber}`,
              borderRadius: 10,
              background: "rgba(26,23,20,0.94)",
              padding: "16px 44px",
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 56,
              color: C.white,
            }}
          >
            Mỵ Châu là <span style={{ color: C.amber }}>NẠN NHÂN</span>
          </div>
        </SpringPop>
        <Reveal startFrac={tNguyen} endFrac={tNguyen + 0.08}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream, marginTop: 14 }}>
            — của một cuộc chiến do người khác bày ra, <span style={{ color: C.warn }}>không phải nguyên nhân</span>
          </div>
        </Reveal>
      </div>
      <SourceTag text="Truyền thuyết là bản kể chi tiết của đúng một chữ trong sử" bottom={40} right />
    </InkImageScene>
  );
};

// === sc063 === BA HỒ SƠ LÊN BÀN — mở trang tuần tự theo narration
export const Sc063: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDat = A("đặt", 1); // «đặt cả ba hồ sơ lên cùng một chiếc bàn»
  const tKe = A("kể", 1); // «Truyền thuyết Việt kể:»
  const tHan = A("Hán", 1); // «Sử Hán chép:»
  const tNen = A("Nền", 1); // «Nền đất thì im lặng:»
  const t16 = A("mười", 1); // «mười sáu cây số thành»
  const tTrieu = A("triệu", 1); // «triệu ngày công»
  const tMui = A("mũi", 1); // «gần mười nghìn mũi tên»
  const { p } = useFrac(durationInFrames);
  const books = [
    {
      t: tKe,
      title: "TRUYỀN THUYẾT VIỆT",
      border: C.amber,
      lines: ["rùa vàng", "nỏ thần", "vết lông ngơ"],
      lineT: [tKe, tKe + 0.05, tKe + 0.1],
    },
    {
      t: tHan,
      title: "SỬ HÁN",
      border: C.cream,
      lines: ["mưu kế", "quà cáp", "ngoại giao"],
      lineT: [tHan, tHan + 0.05, tHan + 0.1],
    },
    {
      t: tNen,
      title: "NỀN ĐẤT",
      border: C.earthGlow,
      lines: ["thành ~16 km (tổng chu vi)", "triệu ngày công", "~10.000 mũi tên", "lẫy đồng"],
      lineT: [t16, tTrieu, tMui, tMui + 0.08],
      mono: true,
    },
  ];
  return (
    <Paper>
      <WipeInk startFrac={0} color={C.card} durationInFrames={durationInFrames} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SpringPop startFrac={tDat} from={0.86} durationInFrames={durationInFrames}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 76, color: C.white, textAlign: "center" }}>
            ba hồ sơ — <span style={{ color: C.amber }}>cùng một chiếc bàn</span>
          </div>
        </SpringPop>
        <div style={{ display: "flex", gap: 46, marginTop: 54, alignItems: "flex-start" }}>
          {books.map((b, i) => (
            <SpringPop key={i} startFrac={b.t} from={0.8} durationInFrames={durationInFrames} style={{ transformOrigin: "50% 100%" }}>
              <div
                style={{
                  width: 440,
                  minHeight: 320,
                  border: `3px solid ${b.border}`,
                  borderRadius: 8,
                  background: `linear-gradient(0deg, rgba(36,31,26,0.94), rgba(26,23,20,0.97))`,
                  padding: "34px 32px",
                  boxShadow: "0 22px 50px rgba(0,0,0,0.55)",
                }}
              >
                <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, letterSpacing: 2, color: b.border }}>{b.title}</div>
                <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
                  {b.lines.map((ln, k) => (
                    <div
                      key={k}
                      style={{
                        fontFamily: b.mono ? FONT.mono : FONT.body,
                        fontWeight: 500,
                        fontSize: 34,
                        color: C.cream,
                        opacity: Math.min(1, Math.max(0, (p(b.lineT[k], b.lineT[k] + 0.04)) * 1.2)),
                        borderBottom: `1px solid ${C.border}`,
                        paddingBottom: 10,
                      }}
                    >
                      {ln}
                    </div>
                  ))}
                </div>
              </div>
            </SpringPop>
          ))}
        </div>
        {/* mặt bàn */}
        <div style={{ width: 1420, height: 12, background: `linear-gradient(90deg, rgba(0,0,0,0), ${C.earthGlow}, rgba(0,0,0,0))`, opacity: 0.5, marginTop: 4, borderRadius: 6 }} />
      </AbsoluteFill>
      <SourceTag text="Không hồ sơ nào nhắc tên hồ sơ kia" bottom={40} right />
    </Paper>
  );
};

// === sc064 === BA LỚP CHỒNG — giao điểm sáng lên Cổ Loa
export const Sc064: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tBa = A("Ba", 1); // «Ba hồ sơ không kể cùng một câu chuyện»
  const tMau = A("mâu", 1); // «không hề mâu thuẫn»
  const tAnh = A("ánh", 1); // «chúng ánh vào nhau»
  const tNhan = A("nhân", 1); // «Ba nhân chứng độc lập»
  const tTen = A("tên", 2); // «cùng chỉ về một cái tên»
  const tManh = A("mạnh", 1); // «không có bằng chứng nào mạnh hơn thế»
  const { frame, p } = useFrac(durationInFrames);
  const l1 = ease(p(tBa, tBa + 0.1)); // truyền thuyết — vòng xoáy ốc
  const l2 = ease(p(tBa + 0.08, tBa + 0.18)); // sử Hán — trang chữ
  const l3 = ease(p(tBa + 0.16, tBa + 0.26)); // nền đất — tầng + mũi tên
  const bloom = ease(p(tAnh, tAnh + 0.08));
  const pulse = 0.5 + 0.5 * Math.sin(frame / 8);
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1500" height="760" viewBox="0 0 1500 760">
          {/* lớp 1 — truyền thuyết: ba vòng xoáy ốc amber */}
          <g opacity={l1 * 0.85}>
            {[300, 220, 140].map((r, i) => (
              <path key={i} d={circleD(750, 380, r)} fill="none" stroke={C.amber} strokeWidth={5} strokeDasharray={i === 0 ? "26 18" : "none"} opacity={0.8} />
            ))}
          </g>
          {/* lớp 2 — sử Hán: lưới trang giấy nghiêm cẩn */}
          <g opacity={l2 * 0.6}>
            <rect x={330} y={130} width={840} height={500} fill="none" stroke={C.cream} strokeWidth={4} />
            {Array.from({ length: 7 }, (_, i) => (
              <path key={i} d={`M 370 ${190 + i * 66} H 1130`} stroke={C.cream} strokeWidth={2} strokeDasharray="10 12" />
            ))}
          </g>
          {/* lớp 3 — nền đất: đường đồng mức + mũi tên */}
          <g opacity={l3 * 0.8}>
            <path d="M 340 620 Q 640 500 750 380 Q 880 250 1160 200" fill="none" stroke={C.earthGlow} strokeWidth={5} />
            <path d="M 340 540 Q 620 440 750 380 Q 900 320 1160 290" fill="none" stroke={C.earthGlow} strokeWidth={4} opacity={0.7} />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M ${560 + i * 180} ${520 - i * 60} l 14 -44 l 14 44 z`} fill={C.teal} opacity={0.85} />
            ))}
          </g>
          {/* giao điểm — Cổ Loa bừng sáng */}
          <g opacity={bloom}>
            <circle cx={750} cy={380} r={96 + pulse * 26} fill={C.amber} opacity={0.16} />
            <circle cx={750} cy={380} r={52} fill="none" stroke={C.white} strokeWidth={6} />
            <circle cx={750} cy={380} r={9} fill={C.white} />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 150, top: 210 }}>
          <Reveal startFrac={tBa} endFrac={tBa + 0.06}>
            <Chip color={C.amber}>truyền thuyết</Chip>
          </Reveal>
        </div>
        <div style={{ position: "absolute", right: 150, top: 170 }}>
          <Reveal startFrac={tBa + 0.1} endFrac={tBa + 0.16}>
            <Chip color={C.cream}>sử Hán</Chip>
          </Reveal>
        </div>
        <div style={{ position: "absolute", right: 170, bottom: 250 }}>
          <Reveal startFrac={tBa + 0.18} endFrac={tBa + 0.24}>
            <Chip color={C.earthGlow}>nền đất</Chip>
          </Reveal>
        </div>
        <Reveal startFrac={tMau} endFrac={tMau + 0.08} style={{ marginTop: 20 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.white, textAlign: "center" }}>
            không hề mâu thuẫn — <span style={{ color: C.amber }}>chúng ánh vào nhau</span>
          </div>
        </Reveal>
        <Reveal startFrac={tNhan} endFrac={tNhan + 0.08} style={{ marginTop: 16 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream, textAlign: "center" }}>
            ba nhân chứng độc lập, chưa từng gặp nhau
          </div>
        </Reveal>
        <SpringPop startFrac={tTen} from={0.82} durationInFrames={durationInFrames} style={{ marginTop: 22 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.amber, textAlign: "center", textShadow: "0 4px 26px rgba(0,0,0,0.7)" }}>
            cùng chỉ về một tên: CỔ LOA
          </div>
        </SpringPop>
        <Reveal startFrac={tManh} endFrac={tManh + 0.1} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.teal, textAlign: "center" }}>
            trong nghề xét đoán — không có bằng chứng nào mạnh hơn thế
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Tuyên ngôn phương pháp của cả tập — ba nguồn độc lập hội tụ" bottom={34} right />
    </Paper>
  );
};

// === sc065 === TUYÊN NGÔN — câu hỏi tan thành hạt mực
export const Sc065: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tCau = A("câu", 1); // «câu hỏi cũ»
  const tTan = A("tan", 1); // «tự tan đi»
  const tRong = A("Rồng", 1); // «Rồng mất nước không vì một người con gái»
  const tDu = A("đủ", 1); // «đủ lớn để kẻ khác phải tính đường thôn tính»
  const tThon = A("thôn", 1); // «thôn tính»
  const { frame, p } = useFrac(durationInFrames);
  const diss = ease(p(tTan, tTan + 0.18));
  return (
    <Paper>
      <WipeInk startFrac={0} color={C.card} durationInFrames={durationInFrames} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 48 }}>
        {/* câu hỏi — hiện rồi tan thành hạt mực */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 62,
              color: C.cream,
              opacity: ease(p(tCau, tCau + 0.06)) * (1 - diss),
              filter: `blur(${diss * 8}px)`,
            }}
          >
            «mất nước vì một người con gái ư?»
          </div>
          {ease(p(tCau, tCau + 0.06)) > 0 &&
            Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${(i * 53) % 96}%`,
                  top: `${10 + ((i * 37) % 70)}%`,
                  width: 4,
                  height: 4,
                  borderRadius: 4,
                  background: C.cream,
                  opacity: diss * 0.8 * (0.4 + ((i * 13) % 10) / 16),
                  transform: `translate(${Math.sin(i) * diss * 90}px, ${-diss * (60 + (i % 6) * 40) + (frame % 3)}px)`,
                }}
              />
            ))}
        </div>
        {/* tuyên ngôn */}
        <SpringPop startFrac={tRong} from={0.86} durationInFrames={durationInFrames}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 96,
              lineHeight: 1.16,
              color: C.white,
              textAlign: "center",
              textShadow: "0 6px 30px rgba(0,0,0,0.65)",
              maxWidth: 1620,
            }}
          >
            RỒNG MẤT NƯỚC
            <br />
            KHÔNG VÌ <span style={{ color: C.amber }}>MỘT NGƯỜI CON GÁI</span>
          </div>
        </SpringPop>
        <Reveal startFrac={tDu} endFrac={tDu + 0.12}>
          <div
            style={{
              border: `2px solid ${C.border}`,
              borderRadius: 10,
              background: "rgba(36,31,26,0.92)",
              padding: "18px 42px",
              fontFamily: FONT.body,
              fontWeight: 500,
              fontSize: 40,
              color: C.cream,
              textAlign: "center",
            }}
          >
            mà vì lần đầu tiên — một dân tộc <span style={{ color: C.white }}>đủ lớn</span>
            <br />
            để kẻ khác phải tính đường <span style={{ color: C.warn }}>thôn tính</span>
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Câu trả lời của tập — gánh đúng trọng lượng, không đổ lỗi" bottom={40} right />
    </Paper>
  );
};

// === sc066 === LÀNG VÔ DANH — NƯỚC CÓ SỔ
export const Sc066: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tLon = A("lớn", 2); // «Âu Lạc lớn hơn, rõ hơn»
  const tKho = A("kho", 1); // «có kho vũ khí»
  const tLang = A("làng", 1); // «Một làng chìm giữa rừng»
  const tSo = A("sổ", 1); // «được ghi vào sổ sách»
  const tTon = A("Tồn", 1); // «Tồn tại rõ ràng — thì bị nhìn thấy»
  const tTinh = A("tính", 3); // «thì bị tính»
  const { frame, p } = useFrac(durationInFrames);
  const dim = ease(p(tLang, tLang + 0.12));
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 60 }}>
          {/* trái — làng mờ giữa rừng */}
          <svg width="640" height="560" viewBox="0 0 640 560" style={{ opacity: 0.85 - dim * 0.55, filter: `blur(${dim * 2}px)` }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M ${60 + i * 30} ${140 + i * 84} l 60 -${120 + i * 18} l 60 ${120 + i * 18}`} fill="none" stroke={C.cream} strokeWidth={4} opacity={0.6} />
            ))}
            <path d="M 240 430 l 40 -34 l 40 34 z M 300 430 l 36 -30 l 36 30 z" fill="none" stroke={C.cream} strokeWidth={4} />
            <path d="M 120 470 H 560" stroke={C.cream} strokeWidth={4} opacity={0.6} />
            <text x={320} y={528} textAnchor="middle" fill={C.mute} fontFamily={FONT.body} fontSize={30}>
              làng nhỏ — không ai nhớ tên
            </text>
          </svg>
          {/* phải — nước có sổ */}
          <svg width="640" height="560" viewBox="0 0 640 560">
            {/* thành + kho */}
            <path d="M 140 360 h 340 v -40 h -340 z" fill="none" stroke={C.earthGlow} strokeWidth={5} opacity={ease(p(tLon, tLon + 0.08))} />
            <path d="M 140 320 q 85 -60 170 0 q 85 60 170 0" fill="none" stroke={C.earthGlow} strokeWidth={5} opacity={ease(p(tLon, tLon + 0.08))} />
            {[0, 1, 2].map((i) => (
              <g key={i} opacity={ease(p(tKho, tKho + 0.06))}>
                <rect x={190 + i * 96} y={390} width={56} height={44} fill="none" stroke={C.warn} strokeWidth={3.5} />
                <path d={`M ${198 + i * 96} 402 h 40 M ${198 + i * 96} 416 h 40`} stroke={C.warn} strokeWidth={2.5} />
              </g>
            ))}
            {/* cuốn sổ mở */}
            <g opacity={ease(p(tSo, tSo + 0.08))}>
              <path d="M 300 180 h 160 v 120 h -160 z M 380 180 v 120" fill="none" stroke={C.cream} strokeWidth={4} />
              {[0, 1, 2].map((i) => (
                <path key={i} d={`M 316 ${210 + i * 30} h 44 M 398 ${210 + i * 30} h 44`} stroke={C.cream} strokeWidth={3} opacity={0.8} />
              ))}
              {/* nét bút ghi dòng mới */}
              <path
                d={`M 398 ${300} h ${ease(p(tSo + 0.06, tSo + 0.12)) * 44}`}
                stroke={C.amber}
                strokeWidth={4}
              />
              <circle cx={300} cy={180} r={7 + (frame % 6)} fill={C.amber} opacity={0.25} />
            </g>
            <text x={320} y={500} textAnchor="middle" fill={C.cream} fontFamily={FONT.body} fontSize={30}>
              nước có thành, kho, triều đình — có sổ
            </text>
          </svg>
        </div>
        {/* hai vế khắc */}
        <div style={{ marginTop: 60, textAlign: "center" }}>
          <Reveal startFrac={tTon} endFrac={tTon + 0.08}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.white }}>
              Tồn tại rõ ràng — thì <span style={{ color: C.amber }}>bị nhìn thấy</span>
            </div>
          </Reveal>
          <Reveal startFrac={tTinh - 0.06} endFrac={tTinh + 0.04}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.white, marginTop: 18 }}>
              Bị nhìn thấy — thì <span style={{ color: C.warn }}>bị tính</span>
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Được ghi vào sổ sách của kẻ muốn đoạt" bottom={36} right />
    </Paper>
  );
};

// === sc067 === CÁI GIÁ — tuyên ngôn thứ hai, ba vế không-cần
export const Sc067: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tMat = A("Mất", 1); // «Mất nước là cái giá...»
  const tGia = A("giá", 1); // «cái giá»
  const tK1 = A("Không", 1); // «Không cần biến Mỵ Châu thành tội đồ»
  const tK2 = A("Không", 2); // «Không cần biến An Dương Vương thành kẻ dại»
  const tK3 = A("Không", 3); // «Không cần phủ nhận chiếc nỏ»
  const { p } = useFrac(durationInFrames);
  const ves = [
    { t: tK1, text: "không biến Mỵ Châu thành tội đồ" },
    { t: tK2, text: "không biến An Dương Vương thành kẻ dại" },
    { t: tK3, text: "không phủ nhận chiếc nỏ" },
  ];
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 52 }}>
        <SpringPop startFrac={tMat} from={0.88} durationInFrames={durationInFrames}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 88,
              lineHeight: 1.18,
              color: C.white,
              textAlign: "center",
              maxWidth: 1660,
              textShadow: "0 6px 30px rgba(0,0,0,0.65)",
            }}
          >
            MẤT NƯỚC LÀ <span style={{ color: C.amber }}>CÁI GIÁ</span>
            <br />
            CỦA SỰ TỒN TẠI RÕ RÀNG
          </div>
        </SpringPop>
        <div style={{ display: "flex", gap: 34 }}>
          {ves.map((v, i) => (
            <div
              key={i}
              style={{
                border: `2px solid ${C.border}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.92)",
                padding: "22px 30px",
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 34,
                color: C.cream,
                opacity: Math.max(0.28, ease(p(v.t, v.t + 0.06))),
                transform: `translateY(${(1 - ease(p(v.t, v.t + 0.06))) * 14}px)`,
                maxWidth: 480,
                textAlign: "center",
              }}
            >
              {v.text}
            </div>
          ))}
        </div>
        <Reveal startFrac={tGia} endFrac={tGia + 0.1}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.mute, letterSpacing: 1 }}>
            câu ấy nghe lạnh — nhưng là cách duy nhất để nhìn thẳng vào Cổ Loa
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Nhìn thẳng mà không cần bóp méo một ai" bottom={40} right />
    </Paper>
  );
};

// === sc068 === PHẨM GIÁ BA HỒ SƠ — ba tập dựng đứng
export const Sc068: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tGiu = A("giữ", 2); // «truyền thuyết giữ nỗi bi tráng»
  const tMuu = A("mưu", 1); // «sử Hán giữ chữ mưu»
  const tSo = A("số", 1); // «nền đất giữ con số»
  const tThach = A("thạch", 1); // «hóa thạch của một thời khắc»
  const tDung = A("đứng", 1); // «từng đứng thẳng»
  const tGuc = A("gục", 2); // «mới có thể gục»
  const { p } = useFrac(durationInFrames);
  const rise = ease(p(tGiu - 0.06, tGiu + 0.1));
  const books = [
    { t: tGiu, title: "TRUYỀN THUYẾT", sub: "giữ nỗi bi tráng", border: C.amber },
    { t: tMuu, title: "SỬ HÁN", sub: "giữ chữ mưu", border: C.cream },
    { t: tSo, title: "NỀN ĐẤT", sub: "giữ con số", border: C.earthGlow },
  ];
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${(1 - rise) * 40}px)` }}>
          <Reveal startFrac={tThach} endFrac={tThach + 0.08} style={{ textAlign: "center", marginBottom: 26 }}>
            <Chip color={C.cream}>Cổ Loa — hóa thạch của một thời khắc</Chip>
          </Reveal>
          <div style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
            {books.map((b, i) => {
              const up = ease(p(b.t - 0.06, b.t + 0.08));
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 340,
                      height: 360,
                      border: `3px solid ${b.border}`,
                      borderTop: `10px solid ${b.border}`,
                      borderRadius: "8px 8px 4px 4px",
                      background: "linear-gradient(0deg, rgba(36,31,26,0.96), rgba(26,23,20,0.98))",
                      transform: `translateY(${(1 - up) * 60}px)`,
                      opacity: 0.3 + up * 0.7,
                      boxShadow: "0 26px 56px rgba(0,0,0,0.6)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 18,
                      padding: 24,
                    }}
                  >
                    <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, letterSpacing: 2, color: b.border }}>{b.title}</div>
                    <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 32, color: C.cream }}>{b.sub}</div>
                  </div>
                  {/* chân dun */}
                  <div style={{ width: 90, height: 16, background: C.earthDeep, margin: "0 auto", borderRadius: "0 0 6px 6px", opacity: up }} />
                </div>
              );
            })}
          </div>
        </div>
        <Reveal startFrac={tDung} endFrac={tDung + 0.12} style={{ marginTop: 60, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.white }}>
            không một hồ sơ nào phải cúi đầu trước hồ sơ nào
          </div>
        </Reveal>
        <Reveal startFrac={tGuc - 0.14} endFrac={tGuc - 0.06} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: C.amber }}>
            «chỉ những nước từng đứng thẳng — mới có thể gục»
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Lần đầu tiên một nước Việt hiện hình đầy đủ — lịch sử không thể bỏ qua" bottom={34} right />
    </Paper>
  );
};

// === sc069 === CỔ LOA KHÔNG CHẾT — làng sống lại giữa vòng thành
export const Sc069: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tKet = A("kết", 1); // «không kết thúc ở đó»
  const tPhong = A("Phong", 1); // «vẫn là huyện lỵ Phong Khê»
  const tCu = A("Cư", 1); // «Cư dân vẫn ở lại»
  const tVong = A("vòng", 1); // «giữa những vòng thành cũ»
  const { frame, p } = useFrac(durationInFrames);
  const pan = ease(p(0.1, 0.9)) * -120; // slow pan_right
  const warm = ease(p(tCu, tCu + 0.15));
  return (
    <Paper variant="earth">
      <WipeInk startFrac={0} color={C.earthDeep} durationInFrames={durationInFrames} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1700" height="820" viewBox="0 0 1700 820" style={{ transform: `translateX(${pan}px)` }}>
          {/* ba vòng thành cũ */}
          {[640, 460, 290].map((r, i) => (
            <path
              key={i}
              d={circleD(850, 430, r)}
              fill="none"
              stroke={C.earthGlow}
              strokeWidth={i === 2 ? 9 : 6}
              opacity={0.55}
              strokeDasharray={i === 0 ? "34 20" : "none"}
            />
          ))}
          {/* làng giữa vòng — nhà mái cong */}
          {[
            { x: 770, y: 420 },
            { x: 900, y: 380 },
            { x: 1000, y: 460 },
            { x: 760, y: 500 },
          ].map((h, i) => {
            const a = ease(p(tCu + i * 0.04, tCu + 0.06 + i * 0.04));
            return (
              <g key={i} opacity={a}>
                <path d={`M ${h.x - 44} ${h.y} h 88 v -30 h -88 z`} fill="rgba(36,31,26,0.9)" stroke={C.cream} strokeWidth={3.5} />
                <path d={`M ${h.x - 54} ${h.y - 30} q 54 -34 108 0`} fill="none" stroke={C.cream} strokeWidth={3.5} />
                <circle cx={h.x} cy={h.y - 56} r={6} fill={C.amber} opacity={warm * (0.5 + 0.5 * Math.sin(frame / 12 + i))} />
              </g>
            );
          })}
          {/* khói bếp */}
          {[810, 950].map((sx, i) => (
            <path
              key={i}
              d={`M ${sx} 330 q ${14 + (frame % 7)} -40 ${-10 + (frame % 5)} -76 q ${-16 + (frame % 4)} -36 6 -70`}
              fill="none"
              stroke={C.cream}
              strokeWidth={3}
              opacity={warm * 0.4}
            />
          ))}
          {/* luống rau */}
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${1080 + i * 26} 540 q 16 -14 32 0 q 16 14 32 0 q 16 -14 32 0`} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.5 * warm} />
          ))}
          {/* đường mòn chạy trên thân thành */}
          <path d="M 380 620 Q 620 560 850 600 Q 1120 650 1360 560" fill="none" stroke={C.cream} strokeWidth={3} strokeDasharray="12 14" opacity={0.45} />
        </svg>
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 100, left: 0, right: 0, textAlign: "center" }}>
        <Reveal startFrac={tKet} endFrac={tKet + 0.08}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 62, color: C.white }}>
            Cổ Loa <span style={{ color: C.earthGlow }}>không kết thúc</span> ở đó
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", bottom: 170, left: 0, right: 0, textAlign: "center" }}>
        <SpringPop startFrac={tPhong} from={0.85} durationInFrames={durationInFrames}>
          <div
            style={{
              display: "inline-block",
              border: `2px solid ${C.earthGlow}`,
              borderRadius: 8,
              background: "rgba(26,23,20,0.9)",
              padding: "12px 32px",
              fontFamily: FONT.mono,
              fontSize: 38,
              color: C.earthGlow,
              letterSpacing: 2,
            }}
          >
            huyện lỵ PHONG KHÊ
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={tVong} endFrac={tVong + 0.1} style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream }}>
          cư dân vẫn ở lại — đời này qua đời khác, giữa những vòng thành cũ
        </div>
      </Reveal>
      <SourceTag text="Đất này không bỏ hoang — nó chỉ đổi chủ" bottom={40} right />
    </Paper>
  );
};

// === sc070 === BẰNG CHỨNG CƯ TRÚ — tầng đất cắt ngang
export const Sc070: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tMo = A("mộ", 1); // «những ngôi mộ gạch thời Hán»
  const tHan = A("Hán", 1); // «thời Hán»
  const t10 = A("mười", 1); // «gia cố ... thế kỷ thứ mười»
  const tXuong = A("xương", 1); // «chiếc xương sống nằm dưới làng xã»
  const tDoi = A("đổi", 1); // «nó chỉ đổi chủ»
  const { p } = useFrac(durationInFrames);
  const strata = [
    { y: 380, h: 110, fill: "#2A2118" },
    { y: 490, h: 130, fill: "#241B12" },
    { y: 620, h: 150, fill: "#1D150E" },
  ];
  return (
    <Paper variant="earth">
      <EarthBadge />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1720" height="700" viewBox="0 0 1720 700">
          {/* mặt làng phía trên */}
          <path d="M 100 330 H 1620" stroke={C.cream} strokeWidth={4} opacity={0.7} />
          {[300, 620, 980, 1300].map((x, i) => (
            <g key={i} opacity={0.75}>
              <path d={`M ${x} 330 h 70 v -22 h -70 z`} fill="none" stroke={C.cream} strokeWidth={3} />
              <path d={`M ${x - 8} 308 q 43 -22 86 0`} fill="none" stroke={C.cream} strokeWidth={3} />
            </g>
          ))}
          {/* các tầng đất mở dần */}
          {strata.map((s, i) => {
            const a = ease(p(0.06 + i * 0.05, 0.14 + i * 0.05));
            return (
              <g key={i} opacity={a}>
                <rect x={100} y={s.y} width={1520} height={s.h} fill={s.fill} stroke={C.earth} strokeWidth={2.5} />
                <path d={`M 100 ${s.y + s.h / 2} H 1620`} stroke={C.earth} strokeWidth={1.6} strokeDasharray="20 26" opacity={0.7} />
              </g>
            );
          })}
          {/* mộ gạch thế kỷ I–III SCN */}
          <g opacity={ease(p(tMo, tMo + 0.06))}>
            <path d="M 480 430 v 84 M 640 430 v 84 M 480 514 H 640" stroke={C.cream} strokeWidth={5} fill="none" />
            <path d="M 470 430 h 180" stroke={C.cream} strokeWidth={8} />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M ${500 + i * 36} 430 v ${26 + (i % 2) * 20}`} stroke={C.cream} strokeWidth={4} opacity={0.7} />
            ))}
          </g>
          {/* tiền cổ */}
          {[820, 886, 952].map((x, i) => (
            <g key={i} opacity={ease(p(tHan + 0.04 + i * 0.03, tHan + 0.1 + i * 0.03))}>
              <circle cx={x} cy={560} r={17} fill="none" stroke={C.bronze} strokeWidth={4} />
              <rect x={x - 7} y={553} width={14} height={14} fill="none" stroke={C.bronze} strokeWidth={3} />
            </g>
          ))}
          {/* giếng */}
          <g opacity={ease(p(tHan + 0.12, tHan + 0.2))}>
            <path d="M 1180 380 v 190 M 1240 380 v 190 M 1180 380 h 60 M 1180 570 h 60" stroke={C.teal} strokeWidth={5} fill="none" />
            <path d="M 1200 380 q 10 -30 26 -40" stroke={C.teal} strokeWidth={3} fill="none" opacity={0.6} />
          </g>
          {/* vạch gia cố thế kỷ X trên thành nội */}
          <g opacity={ease(p(t10, t10 + 0.08))}>
            <path d="M 1480 320 v 110" stroke={C.warn} strokeWidth={6} />
            <path d="M 1470 430 h 20 M 1462 396 h 36" stroke={C.warn} strokeWidth={4} />
          </g>
        </svg>
        {/* mốc chú thích */}
        <div style={{ position: "absolute", left: 240, top: 250, width: 620 }}>
          <SpringPop startFrac={tMo} from={0.85} durationInFrames={durationInFrames}>
            <div
              style={{
                border: `2px solid ${C.cream}`,
                borderRadius: 8,
                background: "rgba(26,23,20,0.92)",
                padding: "12px 26px",
                fontFamily: FONT.mono,
                fontSize: 32,
                color: C.cream,
              }}
            >
              mộ gạch — thế kỷ I–III SCN
            </div>
          </SpringPop>
        </div>
        <div style={{ position: "absolute", right: 150, top: 190, width: 560, textAlign: "right" }}>
          <SpringPop startFrac={t10} from={0.85} durationInFrames={durationInFrames}>
            <div
              style={{
                border: `2px solid ${C.warn}`,
                borderRadius: 8,
                background: "rgba(26,23,20,0.92)",
                padding: "12px 26px",
                fontFamily: FONT.mono,
                fontSize: 30,
                color: C.cream,
                display: "inline-block",
              }}
            >
              thành nội gia cố thêm ~ thế kỷ X
              <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 6 }}>(giả thuyết nhiều nhà nghiên cứu)</div>
            </div>
          </SpringPop>
        </div>
      </AbsoluteFill>
      <Reveal startFrac={tDoi} endFrac={tDoi + 0.08} style={{ position: "absolute", bottom: 96, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream }}>
          người ở lại không xóa thành đi — họ sống giữa nó, dùng nó
        </div>
      </Reveal>
      <Reveal startFrac={tXuong} endFrac={tXuong + 0.1} style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 48, color: C.white }}>
          «xương sống nằm dưới làng xã» — đỡ lấy đời sống người Việt mười mấy thế kỷ
        </div>
      </Reveal>
    </Paper>
  );
};
