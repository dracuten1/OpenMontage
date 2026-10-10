// VN-Myth Ep.04 — scenes group B: sc011..sc020 (Kim Quy, rùa vẽ xoáy ốc, Loa Thành,
// phương pháp ba hồ sơ, ba câu hỏi, hồ sơ nền đất 9→3 vòng, phải bay lên, flyover
// hero + annotate, sóng đóng băng). Speech-lock: mọi animation fire tại A("từ", occ).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  CountUp,
  EarthBadge,
  InkImageScene,
  LabBadge,
  LegendFrame,
  Paper,
  Reveal,
  SourceTag,
  SpringPop,
  WipeInk,
  circleD,
  useA,
  useFrac,
  ease,
} from "./common";

// === sc011 === KIM QUY XUẤT HIỆN — ảnh + gợn nước lan
export const Sc011: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tRipple = A("bơi", 1); // «một vị khách lạ bơi từ dưới nước lên»
  const tKim = A("Kim", 1); // «Kim Quy — Rùa Vàng»
  const tSource = A("chích", 1); // «Lĩnh Nam chích quái»
  return (
    <InkImageScene
      src="img-sc011.png"
      focus={{ x: 0.5, y: 0.46 }}
      label="KIM QUY — RÙA VÀNG"
      sublabel="Vị khách lạ trồi lên từ dưới nước, giữa đêm thành sụp"
    >
      <div style={{ position: "absolute", top: 84, left: 84 }}>
        <Reveal startFrac={tKim} endFrac={tKim + 0.07}>
          <Chip color={C.amber}>Kim Quy — Rùa Vàng</Chip>
        </Reveal>
      </div>
      <div style={{ position: "absolute", top: 180, left: 84 }}>
        <Reveal startFrac={tSource} endFrac={tSource + 0.07}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 28,
              color: C.cream,
              background: "rgba(20,17,13,0.66)",
              padding: "6px 16px",
              borderRadius: 6,
            }}
          >
            Lĩnh Nam chích quái — Truyện Rùa Vàng
          </div>
        </Reveal>
      </div>
      {/* gợn nước xoáy ốc quanh thân rùa */}
      <WaterRipples startFrac={tRipple} cx={620} cy={760} />
      <SourceTag text="Truyện Rùa Vàng bắt đầu từ đây" bottom={44} right />
    </InkImageScene>
  );
};

/** gợn nước đồng tâm — module-local cho nhóm B */
const WaterRipples: React.FC<{ startFrac: number; cx: number; cy: number }> = ({ startFrac, cx, cy }) => {
  const { frame, dur } = useFrac();
  const rings = [];
  for (let i = 0; i < 4; i++) {
    const t = Math.max(0, Math.min(1, (frame - (startFrac + i * 0.08) * dur) / (0.55 * dur)));
    if (t <= 0) continue;
    const e = ease(t);
    rings.push(
      <ellipse key={i} cx={cx} cy={cy} rx={e * 420} ry={e * 120} fill="none" stroke={C.amber} strokeWidth={4 * (1 - 0.5 * e)} opacity={0.6 * (1 - e)} />
    );
  }
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {rings}
    </svg>
  );
};

// === sc012 === RÙA VẼ ĐƯỜNG — vệt mực cuộn thành xoáy ốc + đếm vòng
export const Sc012: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tRule = A("đường", 1); // «đường thành phải làm theo đất»
  const tSwim = A("vòng", 1); // «bơi quanh đất nhiều vòng»
  const tCount = A("chín", 1); // «Dân gian kể chín vòng»
  const { frame, dur } = useFrac(durationInFrames);
  // vệt rùa: một spiral path vẽ dần theo tiến trình
  const spiralT = ease(Math.max(0, Math.min(1, (frame - tSwim * dur) / (0.5 * dur))));
  const spiralD = (() => {
    let d = "M 960 560";
    for (let a = 0; a <= Math.PI * 2 * 2.6 * spiralT; a += 0.12) {
      const r = 40 + a * 62;
      d += ` L ${960 + r * Math.cos(a)} ${560 + r * Math.sin(a)}`;
    }
    return d;
  })();
  // vị trí rùa trên đường xoáy
  const turtleAngle = Math.PI * 2 * 2.6 * spiralT;
  const tr = 40 + turtleAngle * 62;
  const tx = 960 + tr * Math.cos(turtleAngle);
  const ty = 560 + tr * Math.sin(turtleAngle);
  return (
    <Paper>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path d={spiralD} fill="none" stroke={C.cream} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
        {/* rùa nhỏ trên vệt */}
        <g transform={`translate(${tx} ${ty})`} opacity={spiralT > 0 && spiralT < 1 ? 1 : 0.35}>
          <ellipse cx={0} cy={0} rx={34} ry={26} fill={C.bg} stroke={C.amber} strokeWidth={5} />
          <circle cx={30} cy={-4} r={9} fill={C.amber} />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={-14 + (i % 3) * 14} cy={-10 + Math.floor(i / 3) * 16} r={4} fill={C.amber} opacity={0.7} />
          ))}
        </g>
      </svg>
      <Reveal startFrac={tRule} endFrac={tRule + 0.1} style={{ position: "absolute", top: 100, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.white }}>
          «Đường thành phải làm theo đất»
        </div>
      </Reveal>
      <SpringPop startFrac={tCount} from={0.8} style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center" }}>
        <Chip color={C.amber} style={{ fontSize: 44, padding: "14px 40px", fontFamily: FONT.mono, fontWeight: 700 }}>
          9 vòng (truyền thuyết)
        </Chip>
        <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, marginTop: 16 }}>
          lớp này ôm lớp kia — như vỏ ốc
        </div>
      </SpringPop>
      <SourceTag text="Vòng xoáy trôn ốc — hình dáng không lẫn vào đâu được" bottom={40} right />
    </Paper>
  );
};

// === sc013 === LOA THÀNH — zoom ra: ốc khổng lồ giữa đồng bằng
export const Sc013: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tZoom = A("ốc", 3); // «một con ốc khổng lồ nằm giữa đồng bằng»
  const tName = A("Loa", 1); // «Loa Thành — thành Óc»
  const tTen = A("xã", 1); // «còn trong tên xã, tên đền»
  const { frame, dur, p } = useFrac(durationInFrames);
  const z = 1.5 - 0.5 * ease(p(tZoom - 0.06, tZoom + 0.2)); // zoom-out
  const breathe = 1 + 0.012 * Math.sin(frame / 26);
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${z * breathe})` }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          {/* thân ốc khổng lồ */}
          <path d="M 960 560 m -40 0 a 40 40 0 1 1 80 0 a 40 40 0 1 1 -80 0" fill={C.amber} opacity={0.9} />
          {(() => {
            let d = "M 1000 560";
            const paths = [];
            for (let k = 0; k < 3; k++) {
              let seg = "";
              for (let a = 0; a <= Math.PI * 2 * 1.15; a += 0.1) {
                const r = 40 + (a + k * Math.PI * 2 * 1.15) * 66;
                seg += ` L ${960 + r * Math.cos(a)} ${560 + r * Math.sin(a)}`;
              }
              paths.push(
                <path key={k} d={`M 960 560 ${seg}`} fill="none" stroke={k === 2 ? C.cream : C.earthGlow} strokeWidth={k === 2 ? 10 : 7} opacity={0.85} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(0.02 + k * 0.06, 0.3 + k * 0.1))} />
              );
            }
            return paths;
          })()}
          {/* đồng bằng lúa quanh ốc */}
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M -60 ${300 + i * 260} q 260 -30 520 0 t 520 0 t 520 0 t 520 0`} fill="none" stroke={C.cream} strokeWidth={2} opacity={0.2} />
          ))}
        </svg>
      </AbsoluteFill>
      <SpringPop startFrac={tName} from={0.82} style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 110,
            color: C.white,
            letterSpacing: 6,
            textShadow: "0 4px 26px rgba(0,0,0,0.75)",
          }}
        >
          LOA THÀNH
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.amber, marginTop: 6, letterSpacing: 3 }}>
          — thành Óc —
        </div>
      </SpringPop>
      <Reveal startFrac={tTen} endFrac={tTen + 0.1} style={{ position: "absolute", bottom: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.cream }}>
          tên ấy sống sót tới hôm nay — trên bản đồ, trong tên xã, tên đền
        </div>
      </Reveal>
      <SourceTag text="Kinh đô mới có một hình dáng không lẫn vào đâu được" bottom={40} right />
    </Paper>
  );
};

// === sc014 === PHƯƠNG PHÁP — ba tập hồ sơ đặt cạnh, hai tập lật vào
export const Sc014: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tCenter = A("truyền", 1); // «Đó là hồ sơ truyền thuyết»
  const tHan = A("Hán", 1); // «Hồ sơ sử Hán»
  const tNen = A("nền", 1); // «hồ sơ nền đất»
  const tClose = A("đáng", 1); // «điều đáng nghe nhất»
  const { p } = useFrac(durationInFrames);
  const flipHan = ease(p(tHan, tHan + 0.14));
  const flipNen = ease(p(tNen, tNen + 0.14));
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 1500, height: 620 }}>
          {/* hồ sơ giữa — truyền thuyết */}
          <SpringPop startFrac={tCenter} from={0.85} style={{ position: "absolute", left: 560, top: 60 }}>
            <div
              style={{
                width: 380,
                height: 480,
                border: `3px solid ${C.amber}`,
                borderRadius: 10,
                background: "linear-gradient(0deg, rgba(217,164,65,0.12), rgba(36,31,26,0.96))",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 40,
                boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontSize: 84, marginBottom: 20 }}>🐢</div>
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.amber, letterSpacing: 2 }}>TRUYỀN THUYẾT</div>
              <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, marginTop: 16, textAlign: "center", lineHeight: 1.5, padding: "0 24px" }}>
                rùa vàng · nỏ thần · vết lông ngơ
              </div>
            </div>
          </SpringPop>
          {/* sử Hán lật vào trái */}
          <div
            style={{
              position: "absolute",
              left: 560 - flipHan * 470,
              top: 90,
              width: 360,
              height: 420,
              border: `3px solid ${C.cream}`,
              borderRadius: 10,
              background: "rgba(36,31,26,0.96)",
              padding: "36px 28px",
              opacity: flipHan,
              transform: `rotate(${(1 - flipHan) * -14}deg)`,
              boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>🖌</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, color: C.cream, letterSpacing: 2 }}>SỬ HÁN</div>
            <div style={{ fontFamily: FONT.body, fontSize: 27, color: C.cream, marginTop: 14, lineHeight: 1.5, opacity: 0.85 }}>
              lời chép của chính bên tính kế
            </div>
          </div>
          {/* nền đất lật vào phải */}
          <div
            style={{
              position: "absolute",
              left: 560 + flipNen * 470,
              top: 90,
              width: 360,
              height: 420,
              border: `3px solid ${C.earthGlow}`,
              borderRadius: 10,
              background: "linear-gradient(0deg, rgba(138,90,51,0.22), rgba(36,31,26,0.96))",
              padding: "36px 28px",
              opacity: flipNen,
              transform: `rotate(${(1 - flipNen) * 14}deg)`,
              boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>⛰</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, color: C.earthGlow, letterSpacing: 2 }}>NỀN ĐẤT</div>
            <div style={{ fontFamily: FONT.body, fontSize: 27, color: C.cream, marginTop: 14, lineHeight: 1.5, opacity: 0.85 }}>
              trung lập — không biết nói dối
            </div>
          </div>
          {/* ba đường chỉ hội tụ */}
          <svg width="1500" height="620" viewBox="0 0 1500 620" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {[
              { d: "M 280 300 Q 560 320 700 320", t: flipNen },
              { d: "M 1220 300 Q 940 320 800 320", t: flipHan },
              { d: "M 750 560 Q 750 420 750 380", t: 1 },
            ].map((l, i) => (
              <path key={i} d={l.d} stroke={C.amber} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(tClose, tClose + 0.12)) * l.t} opacity={0.8} />
            ))}
          </svg>
        </div>
        <Reveal startFrac={tClose} endFrac={tClose + 0.14}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.white, marginTop: 24, textAlign: "center" }}>
            «Nơi ba lời khai cùng chỉ về —<br />
            đó mới là điều đáng nghe nhất.»
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Ta không phán đúng hay sai — ta đặt ba lời khai cạnh nhau" bottom={40} right />
    </Paper>
  );
};

// === sc015 === BA CÂU HỎI — thẻ slide-in tuần tự + khung ba lớp
export const Sc015: React.FC<SceneProps> = () => {
  const A = useA();
  const tQ1 = A("ai", 1); // «Một: ai và cái gì đã dựng nổi...»
  const tQ2 = A("thần", 1); // «là thần, hay là người?»
  const tQ3 = A("Rồng", 1); // «vì sao Rồng lại mất nước?»
  const tFrame = A("ba", 3); // «bức chân dung ba lớp» — 3rd exact-lowercase "ba" (169.5/170.5/187.6); "Ba:"/"Ba" capitalized do not match
  const { frame, dur } = useFrac();
  const questions = [
    { t: tQ1, num: "MỘT", text: "ai và cái gì đã dựng nổi một thành đất khổng lồ?", color: C.earthGlow },
    { t: tQ2, num: "HAI", text: "chiếc nỏ 'một phát, vạn mũi' — là thần, hay là người?", color: C.amber },
    { t: tQ3, num: "BA", text: "vì sao Rồng lại mất nước?", color: C.teal },
  ];
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        {questions.map((q, i) => (
          <Reveal key={i} startFrac={q.t} endFrac={q.t + 0.1} dy={40}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 34,
                width: 1420,
                border: `2px solid ${q.color}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.93)",
                padding: "26px 40px",
              }}
            >
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontWeight: 700,
                  fontSize: 40,
                  color: q.color,
                  letterSpacing: 4,
                  minWidth: 130,
                }}
              >
                {q.num}
              </div>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.white, lineHeight: 1.3 }}>
                {q.text}
              </div>
            </div>
          </Reveal>
        ))}
        {/* khung ba lớp giấy mờ chồng nhau — payoff climax */}
        <div style={{ position: "relative", height: 150, width: 900, marginTop: 20 }}>
          {["rgba(217,164,65,0.5)", "rgba(232,220,200,0.4)", "rgba(138,90,51,0.6)"].map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 250 + i * 130,
                top: 10 + Math.abs(1 - i) * 16,
                width: 420,
                height: 118,
                border: `2px solid ${C.cream}`,
                background: c,
                borderRadius: 6,
                transform: `rotate(${(i - 1) * 5}deg)`,
                opacity: ease(Math.max(0, Math.min(1, (frame - (tFrame + i * 0.03) * dur) / (0.08 * dur)))),
              }}
            />
          ))}
          <Reveal startFrac={tFrame} endFrac={tFrame + 0.14}>
            <div
              style={{
                position: "absolute",
                left: 130,
                top: 36,
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 44,
                color: C.amber,
                letterSpacing: 2,
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              }}
            >
              → bức chân dung ba lớp
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Ba phần ghép lại — chưa câu chuyện Cổ Loa nào đưa trọn" bottom={40} right />
    </Paper>
  );
};

// === sc016 === MỞ HỒ SƠ NỀN ĐẤT — 9 vòng dân gian tan thành 3 vòng khảo cổ
export const Sc016: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDanGian = A("chín", 1); // «Không phải chín vòng như dân gian kể»
  const tDem = A("đếm", 1); // «khảo cổ đếm được ba vòng»
  const tChuVi = A("mười", 1); // «khoảng mười sáu cây số»
  const { frame, dur, p } = useFrac(durationInFrames);
  const morph = ease(p(tDem, tDem + 0.18));
  // 9 vòng dân gian mờ đi; 3 vòng khảo cổ đậm dần
  return (
    <Paper variant="earth">
      <EarthBadge />
      <WipeInk startFrac={0.0} color="#5C3D22" durationInFrames={durationInFrames} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          {/* 9 vòng dân gian — tan dần */}
          {Array.from({ length: 9 }, (_, i) => {
            const r = 110 + i * 52;
            const fade = ease(p(0.03 + i * 0.012, tDanGian + i * 0.02)) * (1 - morph * (0.55 + i * 0.05));
            return (
              <circle key={i} cx={960} cy={540} r={r} fill="none" stroke={C.amber} strokeWidth={3} opacity={0.5 * fade} />
            );
          })}
          {/* 3 vòng khảo cổ — đậm dần */}
          {[500, 370, 230].map((r, i) => (
            <path
              key={`k${i}`}
              d={circleD(960, 540, r)}
              fill="none"
              stroke={i === 2 ? C.cream : C.earthGlow}
              strokeWidth={9 - i * 2}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - ease(p(tDanGian + i * 0.05, tDem + i * 0.05 + 0.14))}
              opacity={0.95}
            />
          ))}
        </svg>
        <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center" }}>
          <Reveal startFrac={tDanGian} endFrac={tDanGian + 0.06}>
            <Chip color={C.amber} style={{ fontSize: 34 }}>9 vòng (truyền thuyết)</Chip>
          </Reveal>
          <div style={{ height: 18 }} />
          <SpringPop startFrac={tDem} from={0.8}>
            <Chip color={C.earthGlow} style={{ fontSize: 40, fontWeight: 700, fontFamily: FONT.mono }}>3 vòng (khảo cổ)</Chip>
          </SpringPop>
        </div>
        <SpringPop startFrac={tChuVi} from={0.85} style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 60, color: C.white }}>
            ~<CountUp to={16} startFrac={tChuVi} endFrac={tChuVi + 0.12} /> km
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, marginTop: 8 }}>(tổng chu vi)</div>
        </SpringPop>
      </AbsoluteFill>
      <SourceTag text="Một con số đã được đo đạc — không phải đếm trong truyện" bottom={40} right />
    </Paper>
  );
};

// === sc017 === PHẢI BAY LÊN — crane_up thoát khỏi vòng thành
export const Sc017: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tIn = A("đứng", 1); // «đứng trong nó không nhìn ra hình dạng»
  const tFly = A("bay", 1); // «Phải bay lên trên»
  const tAi = A("ai", 1); // «ai đắp?»
  const { frame, dur, p } = useFrac(durationInFrames);
  const lift = ease(p(tFly, tFly + 0.3));
  // tường vây cao nhìn từ trong; camera nâng dần
  const wallY = 0 + lift * 640;
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ transform: `translateY(${lift * -120}px) scale(${1 + lift * 0.18})` }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          {/* mặt đất + ba vòng nhìn từ trên cao dần lộ */}
          {[430, 300, 170].map((r, i) => (
            <path
              key={i}
              d={circleD(960, 620, r)}
              fill="none"
              stroke={i === 2 ? C.cream : C.earthGlow}
              strokeWidth={8 - i * 2}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - ease(Math.max(0, Math.min(1, (lift - i * 0.15) / 0.5)))}
              opacity={0.9}
            />
          ))}
          {/* tường thành vây kín — hạ xuống khi bay lên */}
          <rect x={140} y={wallY - 420} width={1640} height={420} fill="url(#wallGrad)" opacity={1 - lift} />
          <defs>
            <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(138,90,51,0)" />
              <stop offset="30%" stopColor="rgba(138,90,51,0.85)" />
              <stop offset="100%" stopColor="rgba(92,61,34,0.95)" />
            </linearGradient>
          </defs>
          {/* người nhỏ đứng giữa lòng thành */}
          <g opacity={1 - lift * 0.7}>
            <circle cx={960} cy={586} r={12} fill={C.cream} />
            <path d={`M 960 598 L 960 648 M 960 610 L 938 634 M 960 610 L 982 634 M 960 648 L 940 686 M 960 648 L 980 686`} stroke={C.cream} strokeWidth={7} strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </AbsoluteFill>
      <Reveal startFrac={tIn} endFrac={tIn + 0.1} style={{ position: "absolute", top: 110, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream }}>
          Đứng trong nó — không nhìn ra hình dạng
        </div>
      </Reveal>
      <SpringPop startFrac={tAi} from={0.8} style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 120, color: C.white, textShadow: "0 4px 26px rgba(0,0,0,0.8)" }}>
          ai đắp?
        </div>
      </SpringPop>
      <SourceTag text="Phải bay lên trên — mới thấy trọn con vật khổng lồ" bottom={40} right />
    </Paper>
  );
};

// === sc018 === FLYOVER HERO — ảnh 3 vòng đồng tâm, quỹ đạo chậm
export const Sc018: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tBay = A("Bay", 1); // «Bay lên trên, ta thấy hình dạng ấy»
  const tNgoai = A("ngoài", 1); // «Vòng ngoài cùng — thành ngoại»
  const { frame, dur } = useFrac(durationInFrames);
  // quỹ đạo: xoay nhẹ + trôi ngang
  const t = Math.max(0, Math.min(1, frame / Math.max(1, dur - 1)));
  const orbit = Math.sin(t * Math.PI) * 26;
  const rot = -1.2 + t * 2.4;
  return (
    <InkImageScene src="img-sc018.png" focus={{ x: 0.5, y: 0.5 }} durationInFrames={durationInFrames}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `rotate(${rot}deg) translate(${orbit}px, ${-orbit * 0.4}px)`,
          pointerEvents: "none",
        }}
      />
      <Reveal startFrac={tBay} endFrac={tBay + 0.1} style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.white, textShadow: "0 3px 16px rgba(0,0,0,0.85)" }}>
          Bay lên trên — ta thấy hình dạng ấy
        </div>
      </Reveal>
      <SpringPop startFrac={tNgoai} from={0.85} style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center" }}>
        <Chip color={C.earthGlow} style={{ fontSize: 38, padding: "12px 32px" }}>
          Vòng ngoài cùng — <b>thành ngoại</b>
        </Chip>
      </SpringPop>
      <SourceTag text="Ba vòng đất đồng tâm xoáy ốc — giữa đồng bằng sông Hồng" bottom={40} right />
    </InkImageScene>
  );
};

// === sc019 === FLYOVER ANNOTATE — ba thước đo chu vi + cung điện
export const Sc019: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tNgoai = A("tám", 1); // «tám cây số» — thành ngoại
  const tTrung = A("sáu", 1); // «sáu phẩy năm cây số» — thành trung
  const tNoi = A("một", 1); // «một phẩy sáu cây số» — thành nội
  const tCung = A("cung", 1); // «nơi đặt cung điện»
  const { frame, dur } = useFrac(durationInFrames);
  const rings = [
    { r: 430, t: tNgoai, label: "~8 km (thành ngoại)", val: 8, dec: 0, color: C.earthGlow },
    { r: 305, t: tTrung, label: "~6,5 km (thành trung)", val: 6.5, dec: 1, color: C.cream },
    { r: 180, t: tNoi, label: "~1,6 km (thành nội)", val: 1.6, dec: 1, color: C.amber },
  ];
  const pulse = 0.5 + 0.5 * Math.sin(frame / 7);
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          {rings.map((rg, i) => {
            const drawT = ease(Math.max(0, Math.min(1, (frame - (rg.t - 0.03) * dur) / (0.16 * dur))));
            return (
              <g key={i}>
                <circle cx={960} cy={540} r={rg.r} fill="none" stroke={rg.color} strokeWidth={8 - i * 1.5} opacity={0.85} />
                <path
                  d={`M ${960 - rg.r * 0.72} ${540 + rg.r * 0.72} A ${rg.r} ${rg.r} 0 0 1 ${960 + rg.r * 0.72} ${540 + rg.r * 0.72}`}
                  fill="none"
                  stroke={C.white}
                  strokeWidth={5}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - drawT}
                  opacity={0.9}
                />
              </g>
            );
          })}
          {/* chấm cung điện ở vòng nội */}
          <circle cx={960} cy={540} r={20 + pulse * 12} fill={C.amber} opacity={0.25 * ease(Math.max(0, Math.min(1, (frame - tCung * dur) / (0.05 * dur))))} />
          <circle cx={960} cy={540} r={11} fill={C.amber} opacity={ease(Math.max(0, Math.min(1, (frame - tCung * dur) / (0.05 * dur))))} />
        </svg>
        {/* nhãn thước đo — tuần tự theo speech-lock */}
        {rings.map((rg, i) => (
          <div key={i} style={{ position: "absolute", left: 960 + rg.r * 0.62, top: 300 + i * 170 }}>
            <SpringPop startFrac={rg.t} from={0.8}>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontWeight: 700,
                  fontSize: 38,
                  color: rg.color,
                  background: "rgba(26,23,20,0.85)",
                  border: `2px solid ${rg.color}`,
                  borderRadius: 8,
                  padding: "10px 24px",
                  whiteSpace: "nowrap",
                }}
              >
                ~<CountUp to={rg.val} decimals={rg.dec} startFrac={rg.t} endFrac={rg.t + 0.1} /> km
                <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 30, color: C.cream }}> — {rg.label.match(/\((.*)\)/)?.[1]}</span>
              </div>
            </SpringPop>
          </div>
        ))}
        <SpringPop startFrac={tCung} from={0.8} style={{ position: "absolute", left: 1010, top: 480 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.amber, whiteSpace: "nowrap" }}>
            ● nơi đặt cung điện
          </div>
        </SpringPop>
      </AbsoluteFill>
      <SourceTag text="Chiều cao thành chỉ NÓI, không lên màn — screen chỉ chu vi đo được" bottom={40} right />
    </Paper>
  );
};

// === sc020 === SÓNG ĐÓNG BĂNG — 3 vòng sóng + 'được biết đến' phát sáng
export const Sc020: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tOc = A("vân", 1); // «như vân ốc»
  const tSong = A("sóng", 1); // «ba vòng sóng đóng băng»
  const tLon = A("biết", 1); // «lớn nhất Đông Nam Á được biết đến»
  const tQuote = A("biết", 2); // «'Được biết đến' — bốn chữ khiêm tốn»
  const { frame, dur, p } = useFrac(durationInFrames);
  const freeze = ease(p(tSong, tSong + 0.2));
  const glow = ease(p(tLon, tLon + 0.08)) * (0.6 + 0.4 * Math.sin(frame / 6));
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          {[430, 300, 175].map((r, i) => {
            // sóng gợn trên vòng
            let d = `M ${960 - r} 540`;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 26) {
              const rr = r + Math.sin(a * 9 + i * 2) * (10 * (1 - freeze) + 2);
              d += ` L ${960 + rr * Math.cos(a - Math.PI)} ${540 + rr * Math.sin(a - Math.PI)}`;
            }
            d += " Z";
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={i === 2 ? C.cream : C.earthGlow}
                strokeWidth={8 - i * 1.5}
                opacity={ease(p(tOc + i * 0.04 - 0.06, tOc + i * 0.04 + 0.1))}
              />
            );
          })}
        </svg>
        <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center", padding: "0 160px" }}>
          <Reveal startFrac={tLon - 0.06} endFrac={tLon}>
            <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 42, color: C.cream, lineHeight: 1.4 }}>
              công trình phòng thủ tiền sử lớn nhất Đông Nam Á{" "}
              <span style={{ color: C.teal, textShadow: `0 0 ${14 * glow}px rgba(127,209,200,0.9)` }}>
                được biết đến
              </span>
            </div>
          </Reveal>
          <Reveal startFrac={tQuote} endFrac={tQuote + 0.08}>
            <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.teal, marginTop: 18 }}>
              'được biết đến' — bốn chữ khiêm tốn của khoa học
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Một kỳ quan làm bằng đất — không bằng đá" bottom={40} right />
    </Paper>
  );
};
