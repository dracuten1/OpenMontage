// S2E03 chu-dong-tu — scenes group "e" (compose worker, spec_e.json).
// Speech-lock: A("cụm từ") trả frac theo scene; mọi beat bắn đúng nhịp đọc.
import * as React from "react";
import {
  Paper,
  Reveal,
  SpringPop,
  Chip,
  InkImageScene,
  QuotePlate,
  SourceTag,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Đường sóng mực: chuỗi qSegments — period = 2*seg. */
const waveD = (width: number, amp: number, seg = 80): string => {
  const n = Math.ceil(width / seg);
  let d = "M 0 0";
  for (let i = 0; i < n; i++) d += ` q ${seg / 2} ${i % 2 === 0 ? -amp : amp} ${seg} 0`;
  return d;
};

/** sc043 (s21) — CÁCH ĐỌC BIÊN TẬP: claim card + disclaimer chip. */
export const Sc043: React.FC<SceneProps> = () => {
  const A = useA();
  const fEyebrow = A("có thể đọc là");
  const fClaim = A("khát vọng về đời sống có phẩm giá");
  const fDisc = A("đề xuất còn chờ duyệt");
  return (
    <Paper variant="myth">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 160px",
        }}
      >
        <div
          data-cue="sc043-panel"
          style={{
            maxWidth: 1560,
            background: "rgba(20,17,13,0.82)",
            border: `2px solid ${C.border}`,
            borderRadius: 14,
            padding: "72px 88px",
            textAlign: "center",
          }}
        >
          <Reveal startFrac={fEyebrow}>
            <div
              style={{
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: 6,
                color: C.amber,
                textTransform: "uppercase",
              }}
            >
              cách đọc biên tập
            </div>
          </Reveal>
          <Reveal startFrac={fClaim}>
            <div
              data-cue="sc043-claim"
              style={{
                marginTop: 34,
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 68,
                lineHeight: 1.3,
                color: C.white,
              }}
            >
              Cộng đồng nhớ Chử Đồng Tử như một
              <br />
              <span style={{ color: C.amber }}>khát vọng về đời sống có phẩm giá</span>,
              <br />
              vượt khỏi xuất thân.
            </div>
          </Reveal>
          <Reveal startFrac={fDisc} dy={16}>
            <div data-cue="sc043-disclaimer" style={{ marginTop: 44 }}>
              <Chip color={C.amber}>cách đọc biên tập — một đề xuất còn chờ duyệt</Chip>
            </div>
          </Reveal>
        </div>
      </div>
    </Paper>
  );
};

/** sc044 (s22) — ĐỀN ĐA HÒA HÔM NAY: ảnh + thẻ teal 153/QĐ + chip UNESCO. */
export const Sc044: React.FC<SceneProps> = () => {
  const A = useA();
  const fLabel = A("tôi dẫn theo bài công bố");
  const fStat = A("Quyết định 153/QĐ-BVHTTDL");
  const fChip = A("không phải ghi danh UNESCO");
  return (
    <InkImageScene
      src="img-13-dinh-da-hoa.png"
      focus={{ x: 0.5, y: 0.42 }}
      label="Đền Đa Hòa hôm nay"
      sublabel="mái đền lớp lớp trong nắng"
      labelStartFrac={fLabel}
    >
      <Reveal startFrac={fStat} style={{ position: "absolute", top: 110, left: 64 }}>
        <div
          data-cue="sc044-stat"
          style={{
            border: `3px solid ${C.teal}`,
            borderRadius: 10,
            background: "rgba(16,24,23,0.88)",
            padding: "26px 36px",
          }}
        >
          <div style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 44, color: C.teal, letterSpacing: 1 }}>
            153/QĐ-BVHTTDL · 02/02/2023
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, marginTop: 10 }}>
            ghi danh «Lễ hội đền Đa Hòa» — di sản phi vật thể quốc gia
          </div>
        </div>
      </Reveal>
      <Reveal startFrac={fChip} style={{ position: "absolute", top: 330, left: 64 }}>
        <Chip color={C.teal}>ghi danh quốc gia — không phải UNESCO</Chip>
      </Reveal>
    </InkImageScene>
  );
};

/** sc045 (s22) — NHỊP HỘI: rhythm ring 3 năm / 9 làng, pulse «vẫn đang chạy». */
export const Sc045: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fTitle = A("nhịp ấy vẫn đang chạy");
  const fRing = A("Tổng Mễ xưa");
  const fNine = A("Chín làng, ba năm một lần");
  const fPulse = A("vẫn đang chạy");
  const fNoMir = A("chứng minh thần kỳ");
  // vòng quay rất chậm: 12 độ/giây nghe trong suốt; nhịp pulse khi đọc «vẫn đang chạy»
  const rot = (frame / (dur * 0.9)) * 60; // quay 60 độ trong ~scene
  const pulsePhase = cl((frame - fPulse * dur) / (dur * 0.14));
  const pulseGlow = pulsePhase > 0 ? Math.sin(Math.min(1, pulsePhase) * Math.PI) : 0;
  const beats = [0, 1, 2];
  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", left: 160, top: 190, maxWidth: 760 }}>
          <Reveal startFrac={fTitle}>
            <div data-cue="sc045-eyebrow" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.teal, textTransform: "uppercase" }}>
              nhịp hội đền đa hòa
            </div>
          </Reveal>
          <Reveal startFrac={fRing}>
            <div data-cue="sc045-title" style={{ marginTop: 22, fontFamily: FONT.display, fontWeight: 800, fontSize: 84, lineHeight: 1.12, color: C.white }}>
              3 năm một lần
            </div>
          </Reveal>
          <Reveal startFrac={fNine}>
            <div data-cue="sc045-sub" style={{ marginTop: 26, fontFamily: FONT.body, fontSize: 38, lineHeight: 1.45, color: C.cream }}>
              9 làng · Tổng Mễ xưa
            </div>
            <div style={{ marginTop: 16, fontFamily: FONT.body, fontSize: 30, color: C.mute }}>
              quy mô hàng tổng — theo bài tin năm 2023
            </div>
          </Reveal>
          <Reveal startFrac={fNoMir}>
            <div data-cue="sc045-note" style={{ marginTop: 40 }}>
              <Chip color={C.teal}>nhịp ấy vẫn đang chạy — không cần chứng minh thần kỳ</Chip>
            </div>
          </Reveal>
        </div>
        {/* rhythm ring */}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(1380 540) rotate(${rot})`}>
            <circle r={190} fill={`rgba(16,24,23,${0.82 + 0.1 * pulseGlow})`} stroke={C.teal} strokeWidth={4} opacity={0.95} />
            {pulseGlow > 0 && <circle r={190 + 26 * pulseGlow} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.5 * pulseGlow} />}
            {beats.map((i) => {
              const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
              const bx = Math.cos(a) * 190;
              const by = Math.sin(a) * 190;
              return (
                <g key={i} opacity={0.9}>
                  <circle cx={bx} cy={by} r={17} fill={C.teal} opacity={0.25 + 0.75 * (i === 0 ? Math.max(0, 0.3 + 0.7 * pulseGlow) : 0.3)} />
                </g>
              );
            })}
            <text x={0} y={18} textAnchor="middle" fill={C.white} fontFamily='"Be Vietnam Pro", sans-serif' fontWeight={700} fontSize={64}>
              3
            </text>
            <text x={0} y={78} textAnchor="middle" fill={C.cream} fontFamily='"Be Vietnam Pro", sans-serif' fontWeight={400} fontSize={32}>
              năm / nhịp
            </text>
          </g>
          <g transform="translate(1380 540)">
            <text x={0} y={268} textAnchor="middle" fill={C.teal} fontFamily='"Be Vietnam Pro", sans-serif' fontWeight={700} fontSize={38} letterSpacing={2}>
              9 LÀNG
            </text>
            <text x={0} y={312} textAnchor="middle" fill={C.mute} fontFamily='"Be Vietnam Pro", sans-serif' fontWeight={400} fontSize={30}>
              Tổng Mễ xưa
            </text>
          </g>
        </svg>
      </div>
    </Paper>
  );
};

/** sc046 (s23) — SỐ PHẬN CÂU CHUYỆN: ba dòng mực chảy, hội tụ về chữ «kể». */
export const Sc046: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fTitle = A("Câu chuyện sống được tới hôm nay,");
  const fRow1 = A("rước nước");
  const fRow2 = A("chín làng");
  const fRow3 = A("đầm một đêm");
  const fConverge = A("cần kể nó");
  const fStill = A("vẫn có người cần kể nó. Tối");
  // tia: mọi dòng trôi liên tục về phải
  const drift = (f: number, speed: number): string => {
    const e = frame - f * dur;
    if (e <= 0) return "0";
    return `${((e * speed) % 220).toFixed(0)}`;
  };
  const rows = [
    { id: "sc046-r1", text: "rước nước mỗi kỳ hội", f: fRow1, y: 386 },
    { id: "sc046-r2", text: "chín làng hẹn nhau — ba năm một lần", f: fRow2, y: 530 },
    { id: "sc046-r3", text: "«đầm một đêm» còn đọc được trên bản đồ", f: fRow3, y: 674 },
  ];
  const conv = cl((frame - fConverge * dur) / (dur * 0.12));
  return (
    <Paper variant="night">
      <div style={{ position: "absolute", left: 160, top: 118, maxWidth: 1560 }}>
        <Reveal startFrac={fTitle}>
          <div data-cue="sc046-eyebrow" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.teal, textTransform: "uppercase" }}>
            số phận của câu chuyện
          </div>
          <div data-cue="sc046-title" style={{ marginTop: 18, fontFamily: FONT.display, fontWeight: 800, fontSize: 72, lineHeight: 1.14, color: C.white }}>
            Không nằm ở chứng minh — nằm ở chỗ vẫn còn <span style={{ color: C.teal }}>được duy trì</span>
          </div>
        </Reveal>
      </div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="sc046-flow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.amber} stopOpacity={0.85} />
            <stop offset="100%" stopColor={C.teal} stopOpacity={0.95} />
          </linearGradient>
        </defs>
        {rows.map((r, i) => {
          const y2 = r.y + (560 - r.y) * 0.9 * conv;
          return (
            <path
              key={r.id}
              d={`M 160 ${r.y} C 900 ${r.y}, 1100 ${y2}, 1420 ${560}`}
              stroke="url(#sc046-flow)"
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              opacity={frame >= r.f * dur ? 0.9 : 0}
              strokeDasharray="14 12"
              strokeDashoffset={-parseInt(drift(r.f, 2.2 + i * 0.6), 10)}
            />
          );
        })}
      </svg>
      {rows.map((r) => (
        <Reveal key={r.id} startFrac={r.f} dy={18} style={{ position: "absolute", left: 190, top: r.y - 92, maxWidth: 900 }}>
          <div data-cue={r.id} style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream, background: "rgba(26,23,20,0.82)", padding: "12px 26px", borderRadius: 10, border: `2px solid ${C.border}` }}>
            {r.text}
          </div>
        </Reveal>
      ))}
      <SpringPop startFrac={fConverge} style={{ position: "absolute", left: 1420, top: 480 }}>
        <div data-cue="sc046-kể" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.white, textShadow: "0 0 40px rgba(127,209,200,0.5)" }}>
          kể
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.teal, marginTop: 8 }}>
          vẫn có người cần kể nó
        </div>
      </SpringPop>
      <Reveal startFrac={fStill} style={{ position: "absolute", left: 190, bottom: 96, maxWidth: 1500 }}>
        <div data-cue="sc046-still" style={{ fontFamily: FONT.body, fontSize: 34, color: C.mute }}>
          Đêm còn dài, và dòng sông thì vẫn chảy.
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc047 (s23) — CARD CHỐT: «dòng sông thì vẫn chảy» + sóng mực lăn nhẹ. */
export const Sc047: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fCard = A("dòng sông thì vẫn chảy");
  const roll = (frame / dur) * 260; // sóng lăn nhẹ liên tục
  return (
    <Paper variant="myth">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Reveal startFrac={fCard} dy={20}>
          <div data-cue="sc047-card" style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 92,
                lineHeight: 1.3,
                color: C.white,
                textShadow: "0 2px 20px rgba(0,0,0,0.7)",
              }}
            >
              Đêm còn dài,
              <br />
              và dòng sông thì <span style={{ color: C.amber }}>vẫn chảy</span>.
            </div>
            <svg width={880} height={90} viewBox="0 0 880 90" style={{ marginTop: 26, overflow: "visible" }}>
              <g transform={`translate(${-70} 30)`}>
                <path d={waveD(1020, 16, 90)} stroke={C.amber} strokeWidth={5} fill="none" opacity={0.85} strokeLinecap="round" transform={`translate(${roll % 90}, 0)`} />
              </g>
              <g transform={`translate(${-70} 62)`} opacity={0.4}>
                <path d={waveD(1020, 12, 90)} stroke={C.cream} strokeWidth={4} fill="none" strokeLinecap="round" transform={`translate(${(roll * 0.7) % 90}, 0)`} />
              </g>
            </svg>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc048 (s24) — CÂU HỎI BÀI TẬP ĐỌC: worksheet + đáp án viết tay mực teal. */
export const Sc048: React.FC<SceneProps> = () => {
  const A = useA();
  const fQ = A("không nằm trên trang sách");
  const fBlank = A("không nằm trên trang sách");
  const fAns = A("Nó nằm trên sông");
  return (
    <Paper variant="museum">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          data-cue="sc048-worksheet"
          style={{
            width: 1280,
            background: "#F2EAD8",
            borderRadius: 8,
            padding: "60px 76px 64px",
            boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
            position: "relative",
            color: "#3A322A",
          }}
        >
          {/* lề đỏ nhạt */}
          <div style={{ position: "absolute", left: 64, top: 0, bottom: 0, width: 3, background: "rgba(200,85,61,0.35)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, height: 2, background: "rgba(58,50,42,0.12)" }} />
          <Reveal startFrac={fQ}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: "rgba(58,50,42,0.55)", textTransform: "uppercase", marginBottom: 28 }}>
              bài tập đọc — lớp ba
            </div>
            <div
              data-cue="sc048-question"
              style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, lineHeight: 1.4, color: "#2E2620" }}
            >
              Nhân dân làm gì để tưởng nhớ ông?
            </div>
          </Reveal>
          <Reveal startFrac={fBlank} dy={12}>
            <div style={{ marginTop: 52, fontFamily: FONT.body, fontSize: 30, color: "rgba(58,50,42,0.55)" }}>
              Đáp án:
            </div>
            <div
              data-cue="sc048-blank"
              style={{
                marginTop: 10,
                borderBottom: "3px dashed rgba(58,50,42,0.35)",
                minHeight: 86,
                paddingBottom: 12,
              }}
            />
          </Reveal>
          <Reveal startFrac={fAns} dy={0}>
            <div
              data-cue="sc048-answer"
              style={{
                marginTop: -86,
                fontFamily: FONT.hanzi,
              fontStyle: "italic",
                fontWeight: 700,
                fontSize: 54,
                color: "#3E8379",
                transform: "rotate(-1.5deg)",
                textShadow: "0 1px 0 rgba(58,50,42,0.15)",
              }}
            >
              Nó nằm trên sông
            </div>
          </Reveal>
        </div>
      </div>
      <SourceTag text="trang bài tập đọc lớp ba" bottom={44} />
    </Paper>
  );
};

/** sc049 (s24) — LỊCH HỘI — THUYỀN RƯỚC NƯỚC: ảnh + thẻ lịch + nhịp 11/2. */
export const Sc049: React.FC<SceneProps> = () => {
  const A = useA();
  const fLabel = A("Câu trả lời cho câu hỏi");
  const fCal = A("10–12 tháng Hai âm lịch");
  const fBeat = A("sáng ngày 11/2");
  const fSrc = A("được ghi nhận");
  return (
    <InkImageScene
      src="img-01-thuyen-ruc-nuoc.png"
      focus={{ x: 0.5, y: 0.5 }}
      label="Thuyền rước nước — sương sớm sông Hồng"
      sublabel="câu trả lời của bài tập đọc nằm ngoài trang sách"
      labelStartFrac={fLabel}
    >
      <Reveal startFrac={fCal} style={{ position: "absolute", top: 110, right: 64 }}>
        <div
          data-cue="sc049-cal"
          style={{
            border: `3px solid ${C.teal}`,
            borderRadius: 10,
            background: "rgba(16,24,23,0.88)",
            padding: "26px 36px",
            textAlign: "right",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.cream, letterSpacing: 2 }}>
            LỊCH HỘI
          </div>
          <div style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 46, color: C.teal, marginTop: 8 }}>
            10–12 tháng Hai âm lịch
          </div>
        </div>
      </Reveal>
      <Reveal startFrac={fBeat} style={{ position: "absolute", top: 340, right: 64 }}>
        <div
          data-cue="sc049-beat"
          style={{
            border: `2px solid ${C.teal}`,
            borderRadius: 8,
            background: "rgba(16,24,23,0.86)",
            padding: "20px 32px",
            textAlign: "right",
            fontFamily: FONT.body,
            fontSize: 34,
            color: C.white,
          }}
        >
          sáng 11/2 · 9 làng du thuyền rước nước
        </div>
      </Reveal>
      <Reveal startFrac={fSrc} style={{ position: "absolute", bottom: 44, right: 64 }}>
        <Chip color={C.teal}>lịch cổng du lịch Hưng Yên đăng</Chip>
      </Reveal>
    </InkImageScene>
  );
};

/** sc050 (s25) — MONTAGE CALLBACK: 5 cặp xưa → nay flip theo nhịp đọc. */
export const Sc050: React.FC<SceneProps> = () => {
  const A = useA();
  const fIntro = A("Xin nhìn lại");
  const pairs = [
    { id: "sc050-p1", then: "nước được rước", now: "rước về hôm nay", f: A("rước về hôm nay") },
    { id: "sc050-p2", then: "đầm một đêm", now: "một địa danh", f: A("như một địa danh") },
    { id: "sc050-p3", then: "thuyền buôn", now: "du thuyền rước nước", f: A("du thuyền rước nước") },
    { id: "sc050-p4", then: "phố chợ quanh lụa", now: "hội", f: A("nay là hội") },
    { id: "sc050-p5", then: "màn che bãi cát", now: "lễ", f: A("thành lễ") },
  ];
  const fKho = A("một chiếc khố nhỏ đến thế");
  const fWater = A("nước. Phố chợ từng nhộn nhịp quanh");
  return (
    <Paper variant="myth">
      <div style={{ position: "absolute", left: 160, top: 96, maxWidth: 1560 }}>
        <Reveal startFrac={fIntro}>
          <div data-cue="sc050-eyebrow" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber, textTransform: "uppercase" }}>
            nhìn lại các vật thể
          </div>
          <div data-cue="sc050-title" style={{ marginTop: 16, fontFamily: FONT.display, fontWeight: 800, fontSize: 66, lineHeight: 1.12, color: C.white }}>
            Xưa → nay: mỗi vật một lượt chuyển
          </div>
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 300,
          bottom: 250,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
        }}
      >
        {pairs.map((pr) => (
          <Reveal key={pr.id} startFrac={pr.f} dy={14} style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div
              data-cue={pr.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                background: "rgba(20,17,13,0.82)",
                border: `2px solid ${C.border}`,
                borderRadius: 10,
                padding: "14px 30px",
                maxWidth: 1240,
              }}
            >
              <span style={{ fontFamily: FONT.body, fontSize: 36, color: C.amber, minWidth: 380, display: "inline-block" }}>{pr.then}</span>
              <svg width="44" height="24" viewBox="0 0 44 24" fill="none">
                <path d="M2 12 H34 M28 4 L38 12 L28 20" stroke={C.teal} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.teal }}>{pr.now}</span>
            </div>
          </Reveal>
        ))}
        <Reveal startFrac={fKho} dy={14}>
          <div data-cue="sc050-kho" style={{ display: "flex", alignItems: "center", gap: 28, background: "rgba(20,17,13,0.82)", border: `2px solid ${C.border}`, borderRadius: 10, padding: "14px 30px", maxWidth: 1240 }}>
            <span style={{ fontFamily: FONT.body, fontSize: 36, color: C.amber, minWidth: 380, display: "inline-block" }}>một chiếc khố</span>
            <svg width="44" height="24" viewBox="0 0 44 24" fill="none">
              <path d="M2 12 H34 M28 4 L38 12 L28 20" stroke={C.teal} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.teal }}>mở ra cả câu chuyện</span>
          </div>
        </Reveal>
      </div>
      <Reveal startFrac={fWater} style={{ position: "absolute", left: 160, bottom: 92, maxWidth: 1560 }}>
        <div data-cue="sc050-water" style={{ fontFamily: FONT.body, fontSize: 36, color: C.white, background: "rgba(26,23,20,0.85)", padding: "16px 32px", borderRadius: 10, border: `2px solid ${C.teal}` }}>
          Trong tất cả, chỉ có <span style={{ color: C.teal, fontWeight: 700 }}>nước</span> là chảy liên tục — từ truyện tới hôm nay.
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc051 (s25) — CHỈ CÓ NƯỚC CHẢY LIÊN TỤC: vật tĩnh nhạt dần, một dòng teal xuyên suốt. */
export const Sc051: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fIntro = A("Nhưng nhìn theo cách ấy, thì truyện");
  const objs = [
    { id: "sc051-kho", label: "khố", f: A("gặp nhau ở đúng một dòng nước") },
    { id: "sc051-man", label: "màn che", f: A("không phải một bằng chứng lịch sử") },
    { id: "sc051-cho", label: "phố chợ", f: A("một câu biên tập của tôi") },
    { id: "sc051-thuyen", label: "thuyền", f: A("từ truyện tới hôm nay") },
    { id: "sc051-dam", label: "đầm một đêm", f: A("gặp nhau ở đúng một dòng nước.") },
  ];
  const fWater = A("chỉ có nước là chảy liên tục");
  const fFrom = A("từ truyện tới hôm nay");
  const fEdit = A("câu biên tập");
  const meet = A("gặp nhau");
  const flowX = ((frame / dur) * 640) % 160; // dòng nước chảy không dừng
  return (
    <Paper variant="myth">
      <div style={{ position: "absolute", left: 160, top: 118, maxWidth: 1560 }}>
        <Reveal startFrac={fIntro}>
          <div data-cue="sc051-eyebrow" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.teal, textTransform: "uppercase" }}>
            dòng liên tục
          </div>
          <div data-cue="sc051-title" style={{ marginTop: 16, fontFamily: FONT.display, fontWeight: 800, fontSize: 70, lineHeight: 1.12, color: C.white }}>
            Chỉ có <span style={{ color: C.teal }}>nước</span> là chảy liên tục
          </div>
        </Reveal>
      </div>
      {/* dòng nước teal xuyên suốt, chảy ra mép phải */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path
          d="M 60 620 C 380 560, 620 660, 900 620 S 1420 560, 1940 610"
          stroke={C.teal}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          opacity={frame >= fWater * dur ? 0.95 : 0}
          strokeDasharray="26 18"
          strokeDashoffset={-flowX}
          style={{ filter: "drop-shadow(0 0 14px rgba(127,209,200,0.55))" }}
        />
        <path
          d="M 60 620 C 380 560, 620 660, 900 620 S 1420 560, 1940 610"
          stroke={C.teal}
          strokeWidth={3}
          fill="none"
          opacity={frame >= fWater * dur ? 0.35 : 0}
          strokeDasharray="8 26"
          strokeDashoffset={-flowX * 0.6}
        />
      </svg>
      {/* các vật thể mực tĩnh, đậm rồi nhạt dần */}
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 380,
          display: "flex",
          gap: 36,
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        {objs.map((o, i) => {
          const lit = cl((frame - o.f * dur) / (dur * 0.08));
          const fade = lit * (1 - 0.55 * cl((frame - fWater * dur) / (dur * 0.3)));
          return (
            <Reveal key={o.id} startFrac={o.f} dy={16}>
              <div
                data-cue={o.id}
                style={{
                  fontFamily: FONT.body,
                  fontWeight: 500,
                  fontSize: 36,
                  color: C.cream,
                  opacity: 0.45 + 0.55 * fade,
                  background: "rgba(26,23,20,0.82)",
                  border: `2px solid ${fade > 0.3 ? C.border : "rgba(58,50,42,0.4)"}`,
                  borderRadius: 10,
                  padding: "20px 34px",
                  transform: `translateY(${(i % 2 === 0 ? -30 : 30) * (1 - fade * 0.2)}px)`,
                }}
              >
                {o.label}
              </div>
            </Reveal>
          );
        })}
      </div>
      <Reveal startFrac={fFrom} style={{ position: "absolute", left: 160, bottom: 260, maxWidth: 1600 }}>
        <div data-cue="sc051-from" style={{ fontFamily: FONT.body, fontSize: 36, color: C.white, background: "rgba(26,23,20,0.85)", padding: "16px 32px", borderRadius: 10, display: "inline-block" }}>
          từ truyện tới hôm nay
        </div>
      </Reveal>
      <Reveal startFrac={fEdit} style={{ position: "absolute", left: 160, bottom: 120, maxWidth: 1600 }}>
        <div data-cue="sc051-edit" style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Chip color={C.amber}>đó là một câu biên tập — không phải một bằng chứng lịch sử</Chip>
          <span style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute }}>
            nhưng nhìn theo cách ấy, truyện kể và đời sống gặp nhau ở đúng một dòng nước
          </span>
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc052 (s26) — QUOTE C13: lớp kể giáo dục, quote bài tập đọc, mực teal. */
export const Sc052: React.FC<SceneProps> = () => {
  const A = useA();
  const fBadge = A("lớp kể lại thêm điều nó muốn");
  const fQuote = A("giúp dân làm nhiều việc lợi ích");
  return (
    <Paper variant="museum">
      <Reveal startFrac={fBadge} style={{ position: "absolute", top: 48, left: 64 }}>
        <div
          data-cue="sc052-badge"
          style={{
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
          LỚP KỂ GIÁO DỤC
        </div>
      </Reveal>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 160px",
        }}
      >
        <QuotePlate
          text="giúp dân làm nhiều việc lợi ích như dạy cách trồng lúa, nuôi tằm, dệt vải"
          startFrac={fQuote}
          endFrac={fQuote + 0.42}
          source="trang bài tập đọc"
          label="TRÍCH BÀI TẬP ĐỌC"
          accent={C.teal}
          size={60}
          maxWidth={1440}
        />
      </div>
    </Paper>
  );
};
