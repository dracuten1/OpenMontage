// S2E03 chu-dong-tu — scenes group "d" (compose worker, spec_d.json).
// Speech-lock: A("từ") trả frac thô theo scene; mọi beat bắn đúng nhịp đọc.
import * as React from "react";
import { AbsoluteFill } from "remotion";
import {
  Paper,
  Reveal,
  SpringPop,
  InkDraw,
  InkPath,
  circleD,
  ease,
  Chip,
  SceneTitle,
  SourceTag,
  InkImageScene,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
// frame cục bộ tính từ anchor (frac) — cho math tự viết (pulse, dissolve).
const af = (frame: number, dur: number, f: number): number => frame - f * dur;

/** sc033 (s16) — SÁU TRANG MỘT NGUỒN: fan-in diagram teal. */
export const Sc033: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur, p } = useFrac();
  const fTitle = A("sáu trang web");
  const fSub = A("chung một nguồn cũ");
  const fPulse = A("sự đồng thuận của những trang giấy");
  const fWarn = A("không phải thang đo cho độ cổ");
  const cells = Array.from({ length: 6 }, (_, i) => ({
    cx: 300 + i * 264,
    cy: 430 - Math.sin((i / 5) * Math.PI) * 90,
  }));
  const pulse = af(frame, dur, fPulse);
  const glow =
    pulse > 0 ? 0.55 + 0.45 * Math.sin((pulse / 18) * Math.PI * 3) * Math.exp(-pulse / 70) : 0;
  return (
    <Paper variant="teal">
      <div style={{ position: "absolute", left: 160, top: 84 }}>
        <SceneTitle
          eyebrow="Kiểm chứng nguồn"
          title="Sáu trang — một nguồn?"
          startFrac={fTitle}
          titleSize={68}
          accent={C.teal}
        />
      </div>
      <Reveal startFrac={fSub} style={{ position: "absolute", left: 160, top: 268 }}>
        <div data-cue="sc033-sub" style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream }}>
          Nhiều bản kể hôm nay có thể{" "}
          <span style={{ color: C.teal, fontWeight: 700 }}>chung một nguồn cũ</span>.
        </div>
      </Reveal>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {cells.map((c, i) => (
          <path
            key={`ln${i}`}
            d={`M ${c.cx} ${c.cy + 52} Q ${c.cx} ${(c.cy + 660) / 2} 960 636`}
            fill="none"
            stroke={C.teal}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={(0.25 + 0.75 * glow) * cl(p(fSub + 0.02 + i * 0.012, fSub + 0.14 + i * 0.012))}
          />
        ))}
      </svg>
      {cells.map((c, i) => (
        <div
          key={`cell${i}`}
          data-cue={`sc033-cell${i + 1}`}
          style={{
            position: "absolute",
            left: c.cx - 110,
            top: c.cy - 48,
            width: 220,
            height: 96,
            borderRadius: 10,
            border: `2px solid ${C.teal}88`,
            background: "rgba(20,17,13,0.84)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: cl(p(fTitle + 0.02 + i * 0.012, fTitle + 0.1 + i * 0.012)),
            fontFamily: FONT.mono,
            fontSize: 30,
            letterSpacing: 2,
            color: C.cream,
          }}
        >
          TRANG {i + 1}
        </div>
      ))}
      <SpringPop startFrac={fSub + 0.1} style={{ position: "absolute", left: 850, top: 636 }}>
        <div
          data-cue="sc033-source"
          style={{
            width: 220,
            height: 130,
            borderRadius: 999,
            border: `3px solid ${C.teal}`,
            background: "rgba(20,17,13,0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${26 + 30 * glow}px rgba(127,209,200,${0.15 + 0.3 * glow})`,
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.teal }}>
            MỘT NGUỒN CŨ
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute, marginTop: 4 }}>
            (không phải 6 chứng cứ)
          </div>
        </div>
      </SpringPop>
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 812,
          background: "rgba(20,17,13,0.84)",
          border: `2px solid ${C.border}`,
          borderRadius: 12,
          padding: "22px 40px",
          opacity: cl(p(fWarn, fWarn + 0.06)),
        }}
      >
        <div data-cue="sc033-warn" style={{ fontFamily: FONT.body, fontSize: 38, color: C.white, textAlign: "center" }}>
          Sự đồng thuận của những trang giấy{" "}
          <span style={{ color: C.warn, fontWeight: 700 }}>không phải thang đo cho độ cổ</span>.
        </div>
      </div>
    </Paper>
  );
};

/** sc034 (s17) — QUÂN ĐÓNG TRẠI ĐÊM: ảnh bãi Tự Nhiên + map pin. */
export const Sc034: React.FC<SceneProps> = () => {
  const A = useA();
  const fPin = A("đóng trại ở bãi Tự Nhiên");
  const fSong = A("cách con sông lớn");
  const fChip = A("Chỉ một câu hành quân");
  const fSrc = A("Chỉ một câu hành quân");
  return (
    <InkImageScene
      src="img-09-quan-quan-bai-tu-nhien.png"
      focus={{ x: 0.55, y: 0.42 }}
      label="Đóng trại ở bãi Tự Nhiên"
      labelStartFrac={fPin}
      sublabel="chỉ còn cách con sông lớn — trời tối không kịp tiến quân"
      sublabelStartFrac={fSong}
    >
      <Reveal startFrac={fPin} dy={-20} style={{ position: "absolute", left: 1120, top: 300 }}>
        <svg width="140" height="150" viewBox="0 0 140 150">
          <circle cx="70" cy="52" r="26" fill="none" stroke={C.amber} strokeWidth={6} />
          <circle cx="70" cy="52" r="8" fill={C.amber} />
          <path d="M 70 78 L 70 132" stroke={C.amber} strokeWidth={6} strokeLinecap="round" />
          <ellipse cx="70" cy="140" rx="26" ry="7" fill="none" stroke={C.amber} strokeWidth={3} opacity={0.6} />
        </svg>
      </Reveal>
      <Reveal startFrac={fChip} style={{ position: "absolute", right: 64, top: 96, maxWidth: 760 }}>
        <div
          data-cue="sc034-chip"
          style={{
            background: "rgba(20,17,13,0.82)",
            borderLeft: `5px solid ${C.amber}`,
            borderRadius: 8,
            padding: "20px 30px",
            fontFamily: FONT.body,
            fontSize: 36,
            color: C.cream,
          }}
        >
          Chỉ <span style={{ color: C.amber, fontWeight: 700 }}>một câu hành quân</span> — không trận
          đánh, không kèn trống.
        </div>
      </Reveal>
      <Reveal startFrac={fSrc}>
        <SourceTag text="Truyện Chử Đồng Tử · bản dịch hiện đại" bottom={44} />
      </Reveal>
    </InkImageScene>
  );
};

/** sc035 (s17) — CARD «ĐỂ ĐÊM TỰ LÀM VIỆC»: text card giấy dó, accent «đêm». */
export const Sc035: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fQuote = A("để đêm ấy tự làm phần việc của nó");
  // chữ «đêm» đậm thêm chậm rãi sau khi câu hiện
  const tDem = cl(af(frame, dur, fQuote + 0.06) / 30);
  const wDem = 500 + 140 * ease(tDem);
  return (
    <Paper variant="earth">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 240px",
        }}
      >
        <Reveal startFrac={fQuote} dy={30}>
          <div
            data-cue="sc035-quote"
            style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 84,
              lineHeight: 1.35,
              color: C.cream,
              textAlign: "center",
            }}
          >
            … nó để quân lại bên bãi cát, trong{" "}
            <span
              style={{
                color: C.amber,
                textShadow: `0 0 ${wDem * 0.14}px rgba(217,164,65,${0.25 + 0.45 * tDem})`,
              }}
            >
              đêm
            </span>
            ,
            <br />
            và để đêm ấy{" "}
            <span style={{ color: C.amber }}>tự làm phần việc của nó</span>.
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc036 (s18) — NỬA ĐÊM GIÓ LỚN: ảnh bão cát + vệt gió mực. */
export const Sc036: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur, p } = useFrac();
  const fGio = A("gió lớn nổi lên");
  const fCat = A("cát bay, cây đổ");
  const fLoan = A("quan quân hỗn loạn");
  // vệt gió mực lướt ngang theo hướng gió
  const drift = af(frame, dur, fGio);
  const x1 = -300 + (drift * 26) % 700;
  const op = cl(p(fGio, fGio + 0.08)) * (1 - 0.5 * cl((af(frame, dur, fLoan + 0.3)) / 40));
  return (
    <InkImageScene
      src="img-10-gio-cat-thanh-bay.png"
      focus={{ x: 0.42, y: 0.5 }}
      label="Gió lớn"
      labelStartFrac={fGio}
      sublabel="cát bay, cây đổ, quan quân hỗn loạn"
      sublabelStartFrac={fCat}
    >
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: op }}>
        {[380, 520, 660].map((y, i) => (
          <g key={i} transform={`translate(${x1 + i * 230} ${y})`}>
            <path
              d={`M 0 ${i * 14} q 180 -46 360 0 t 360 0 t 360 ${i * -10}`}
              fill="none"
              stroke={i === 1 ? C.amber : C.cream}
              strokeWidth={5 - i}
              strokeLinecap="round"
              opacity={0.5 - i * 0.1}
            />
          </g>
        ))}
      </svg>
    </InkImageScene>
  );
};

/** sc037 (s18) — THÀNH BAY — ĐẤT SỤT: split transformation diagram. */
export const Sc037: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur, p } = useFrac();
  const fBay = A("thành quách phút chốc bay bổng lên trời");
  const fSum = A("sụt xuống thành cái đầm lớn");
  const rise = ease(cl(p(fBay, fBay + 0.08)));
  const sink = ease(cl(p(fSum, fSum + 0.08)));
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center" }}>
        <SceneTitle
          eyebrow="Trong một hơi thở"
          title="Thành bay — đất sụt"
          startFrac={fBay}
          titleSize={64}
          align="center"
        />
      </div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* mặt đất gốc */}
        <line x1={260} y1={700} x2={1660} y2={700} stroke={C.border} strokeWidth={4} />
        {/* NỬA TRÊN — thành quách nhấc lên */}
        <g transform={`translate(700 ${420 - 150 * rise})`} opacity={0.25 + 0.75 * rise}>
          <path
            d="M 0 60 L 0 0 L 40 0 L 40 -36 L 90 -36 L 90 0 L 140 0 L 140 60 L 200 60 L 200 10 L 250 10 L 250 60 L 300 60 L 300 -20 L 350 -20 L 350 60 Z"
            fill="none"
            stroke={C.amber}
            strokeWidth={5}
            strokeLinejoin="round"
          />
        </g>
        <path
          d={`M 850 380 L 850 ${380 - 240 * rise}`}
          stroke={C.amber}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={rise}
        />
        <path d={`M 850 ${380 - 240 * rise} l -20 26 l 40 0 Z`} fill={C.amber} opacity={rise} />
        {/* NỬA DƯỚI — lòng chảo + mặt nước teal */}
        <path
          d={`M 960 700 L 960 700 Q 1160 ${760 + 150 * sink} 1360 700`}
          fill="none"
          stroke={C.mute}
          strokeWidth={5}
          opacity={0.3 + 0.7 * sink}
        />
        <path
          d={`M 1000 ${706 + 26 * sink} Q 1160 ${742 + 148 * sink} 1320 ${706 + 26 * sink} Z`}
          fill={C.teal}
          opacity={0.16 + 0.5 * sink}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 210,
          top: 300,
          opacity: rise,
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 38,
          color: C.amber,
          background: "rgba(20,17,13,0.8)",
          padding: "10px 24px",
          borderRadius: 8,
        }}
        data-cue="sc037-bay"
      >
        «bay bổng lên trời»
      </div>
      <div
        style={{
          position: "absolute",
          right: 210,
          top: 856,
          opacity: sink,
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 38,
          color: C.teal,
          background: "rgba(20,17,13,0.8)",
          padding: "10px 24px",
          borderRadius: 8,
        }}
        data-cue="sc037-sum"
      >
        «sụt xuống thành cái đầm lớn»
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 920,
          textAlign: "center",
          opacity: cl(p(fSum + 0.12, fSum + 0.2)),
          fontFamily: FONT.body,
          fontSize: 34,
          color: C.cream,
        }}
        data-cue="sc037-note"
      >
        Không ai bị trừng phạt, không ai chiến thắng — chỉ còn mặt nước.
      </div>
    </Paper>
  );
};

/** sc038 (s19) — SÁNG HÔM SAU — ĐẦM LẶNG: ảnh + caption tan như sương. */
export const Sc038: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur, p } = useFrac();
  const fCap = A("không thấy thành quách đâu cả");
  const fLinh = A("đều cho là linh dị");
  // caption hiện rồi tan như sương
  const tIn = cl(af(frame, dur, fCap) / 16);
  const tOut = cl(af(frame, dur, fLinh + 0.5) / 50);
  const capOp = tIn * (1 - tOut) * (1 - 0.25 * tOut);
  const blur = 12 * tOut;
  return (
    <InkImageScene src="img-11-dam-nhat-da.png" focus={{ x: 0.5, y: 0.5 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(26,23,20,0.82) 0%, rgba(26,23,20,0.4) 30%, rgba(26,23,20,0) 55%)",
        }}
      />
      <div
        data-cue="sc038-cap"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 700,
          textAlign: "center",
          opacity: capOp,
          filter: `blur(${blur}px)`,
          transform: `translateY(${-14 * tOut}px)`,
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 64,
          lineHeight: 1.3,
          color: C.teal,
          textShadow: "0 2px 14px rgba(0,0,0,0.85)",
        }}
      >
        «không thấy thành quách đâu cả»
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream, marginTop: 16 }}>
          đều cho là linh dị
        </div>
      </div>
      <Reveal startFrac={fLinh}>
        <SourceTag text="Truyện Chử Đồng Tử · đầm Nhất Dạ" bottom={44} />
      </Reveal>
    </InkImageScene>
  );
};

/** sc039 (s19) — TÊN GỌI — ĐẦM MỘT ĐÊM: etymology split + map chip. */
export const Sc039: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const fTen = A("gọi đầm là đầm Nhất Dạ");
  const fMotDem = A("đầm một đêm");
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", left: 160, top: 84 }}>
        <SceneTitle
          eyebrow="Truyện trả về đúng việc của nó"
          title="Nhất Dạ Trạch — đầm một đêm"
          startFrac={fTen}
          titleSize={64}
        />
      </div>
      <Reveal startFrac={fTen} style={{ position: "absolute", left: 200, top: 340 }}>
        <div
          data-cue="sc039-ten"
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 110,
            color: C.white,
            letterSpacing: 2,
          }}
        >
          Nhất Dạ Trạch
        </div>
      </Reveal>
      <svg width={640} height={220} viewBox="0 0 640 220" style={{ position: "absolute", left: 200, top: 520 }}>
        <InkPath d="M 120 20 L 120 200" startFrac={fMotDem} endFrac={fMotDem + 0.08} stroke={C.amber} strokeWidth={4} />
        <InkPath d="M 380 20 L 380 200" startFrac={fMotDem} endFrac={fMotDem + 0.08} stroke={C.amber} strokeWidth={4} />
      </svg>
      <Reveal startFrac={fMotDem} style={{ position: "absolute", left: 148, top: 560 }}>
        <div
          data-cue="sc039-nhatda"
          style={{
            background: "rgba(20,17,13,0.86)",
            border: `2px solid ${C.amber}66`,
            borderRadius: 10,
            padding: "22px 26px",
            fontFamily: FONT.body,
            fontSize: 36,
            color: C.cream,
          }}
        >
          <b style={{ color: C.amber }}>Nhất Dạ</b> = một đêm
        </div>
      </Reveal>
      <Reveal startFrac={fMotDem + 0.04} style={{ position: "absolute", left: 408, top: 560 }}>
        <div
          data-cue="sc039-trach"
          style={{
            background: "rgba(20,17,13,0.86)",
            border: `2px solid ${C.amber}66`,
            borderRadius: 10,
            padding: "22px 26px",
            fontFamily: FONT.body,
            fontSize: 36,
            color: C.cream,
          }}
        >
          <b style={{ color: C.amber }}>Trạch</b> = đầm
        </div>
      </Reveal>
      {/* bản đồ giấy dầu nâu nhỏ */}
      <SpringPop startFrac={fMotDem + 0.1} style={{ position: "absolute", right: 140, top: 380 }}>
        <div
          data-cue="sc039-map"
          style={{
            width: 440,
            height: 320,
            borderRadius: 12,
            background:
              "linear-gradient(160deg, #4A341F 0%, #3A2A18 100%)",
            border: `3px solid ${C.earth}`,
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            position: "relative",
          }}
        >
          <svg width={440} height={320} viewBox="0 0 440 320">
            <path d="M 0 250 Q 120 230 210 250 T 440 240 L 440 320 L 0 320 Z" fill="#2C4438" opacity={0.8} />
            <path d="M 60 140 q 40 -20 90 0 q 30 14 0 30 q -60 20 -110 0 Z" fill="none" stroke={C.earth} strokeWidth={3} opacity={0.55} />
            <path d="M 250 120 q 60 -26 130 0" fill="none" stroke={C.earth} strokeWidth={3} opacity={0.45} />
            <circle cx={220} cy={190} r={34} fill={C.teal} opacity={0.22} />
            <circle cx={220} cy={190} r={9} fill={C.teal} />
            <text x={220} y={250} textAnchor="middle" fill={C.cream} fontFamily='"Be Vietnam Pro", sans-serif' fontWeight={600} fontSize={26}>
              đầm Nhất Dạ
            </text>
            <text x={24} y={40} fill={C.mute} fontFamily='"JetBrains Mono", monospace' fontSize={20} letterSpacing={2}>
              BẢN ĐỒ DIỄN GIẢI
            </text>
          </svg>
        </div>
      </SpringPop>
      <div
        data-cue="sc039-note"
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 880,
          textAlign: "center",
          fontFamily: FONT.body,
          fontSize: 36,
          color: C.cream,
          opacity: cl(p(fMotDem + 0.2, fMotDem + 0.3)),
        }}
      >
        Không phải báo cáo địa chất — là tên dân gian gắn cho mặt nước.
      </div>
    </Paper>
  );
};

/** sc040 (s20) — AI CHÉP — KHI NÀO: timeline truyện kể → bản dịch. */
export const Sc040: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const fTitle = A("bản dịch hiện đại");
  const fDich = A("không phải ảnh chụp thủ bản cổ");
  const f1492 = A("năm Hồng Đức hai mươi ba");
  const f1493 = A("Hồng Đức hai mươi ba chú thích");
  const fHomNay = A("lời tựa của Vũ Quỳnh");
  const track = ease(cl(p(fTitle + 0.02, f1493 + 0.25)));
  const x0 = 260;
  const x1 = 1660;
  const flag = (at: number, on: boolean, year: string, label: string, color: string) => {
    if (!on) return null;
    const mx = x0 + (x1 - x0) * at;
    return (
      <div style={{ position: "absolute", left: mx - 70, top: 430, width: 140, textAlign: "center" }}>
        <svg width={140} height={120} viewBox="0 0 140 120">
          <line x1={70} y1={0} x2={70} y2={70} stroke={color} strokeWidth={5} />
          <path d="M 70 6 L 128 22 L 70 40 Z" fill={color} />
        </svg>
        <div style={{ fontFamily: FONT.mono, fontSize: 32, color, fontWeight: 500 }}>{year}</div>
        <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute, marginTop: 4 }}>{label}</div>
      </div>
    );
  };
  return (
    <Paper>
      <div style={{ position: "absolute", left: 160, top: 84 }}>
        <SceneTitle
          eyebrow="Kiểm kê nguồn"
          title="Ai chép — chép khi nào?"
          startFrac={fTitle}
          titleSize={64}
          accent={C.teal}
        />
      </div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} y1={520} x2={x1} y2={520} stroke={C.border} strokeWidth={6} />
        <line
          x1={x0}
          y1={520}
          x2={x0 + (x1 - x0) * track}
          y2={520}
          stroke="url(#g040)"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="g040" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.amber} stopOpacity={0.35} />
            <stop offset="60%" stopColor={C.amber} stopOpacity={0.8} />
            <stop offset="100%" stopColor={C.teal} />
          </linearGradient>
        </defs>
      </svg>
      {flag(0.1, track >= 0.1 && p(f1492, f1492 + 0.05) > 0, "1492", "lời tựa", C.amber)}
      {flag(0.3, track >= 0.3 && p(f1493, f1493 + 0.05) > 0, "1493", "lời bạt", C.amber)}
      {flag(0.96, track >= 0.96, "hôm nay", "bản dịch", C.teal)}
      <Reveal startFrac={fTitle} style={{ position: "absolute", left: 260, top: 350 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 30, letterSpacing: 3, color: C.mute }}>
          TRUYỆN KỂ <span style={{ color: C.amber, opacity: 0.6 }}>· mực cũ, mờ dần</span>
        </div>
      </Reveal>
      <Reveal startFrac={fDich} style={{ position: "absolute", right: 260, top: 350, textAlign: "right" }}>
        <div data-cue="sc040-dich" style={{ fontFamily: FONT.body, fontSize: 30, letterSpacing: 3, color: C.teal }}>
          BẢN DỊCH HIỆN ĐẠI
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.warn, marginTop: 10 }}>
          không phải ảnh chụp thủ bản cổ
        </div>
      </Reveal>
      <div
        data-cue="sc040-note"
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 700,
          background: "rgba(20,17,13,0.84)",
          border: `2px solid ${C.border}`,
          borderRadius: 12,
          padding: "24px 40px",
          fontFamily: FONT.body,
          fontSize: 36,
          color: C.white,
          textAlign: "center",
          opacity: cl(p(f1492 + 0.3, f1492 + 0.4)),
        }}
      >
        1492 · 1493 — <span style={{ color: C.teal, fontWeight: 700 }}>mốc văn bản</span> (lời tựa ·
        lời bạt), <span style={{ color: C.warn, fontWeight: 700 }}>không phải tuổi của truyện</span>.
      </div>
      <Reveal startFrac={fHomNay}>
        <SourceTag text="Chú thích bản dịch · lời tựa Vũ Quỳnh, lời bạt Kiều Phú" bottom={44} />
      </Reveal>
    </Paper>
  );
};

/** sc041 (s20) — HAI MỐC — 1492 & 1493: dual milestone card teal. */
export const Sc041: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const f92 = A("quy đổi ra năm 1492");
  const f93 = A("chú thích quy đổi 1493");
  const fCare = A("mốc văn bản, không phải tuổi của truyện");
  const col = (
    id: string,
    sf: number,
    fromLeft: boolean,
    eyebrow: string,
    who: string,
    hongDuc: string,
    year: string
  ) => {
    const t = ease(cl(p(sf, sf + 0.07)));
    return (
      <div
        data-cue={id}
        style={{
          width: 640,
          background: "rgba(20,17,13,0.88)",
          border: `2px solid ${C.teal}55`,
          borderRadius: 12,
          padding: "36px 44px",
          opacity: t,
          transform: `translateX(${(1 - t) * (fromLeft ? -60 : 60)}px)`,
        }}
      >
        <div style={{ fontFamily: FONT.mono, fontSize: 28, letterSpacing: 3, color: C.teal }}>
          {eyebrow}
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.white, marginTop: 12 }}>
          {who}
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 10 }}>
          {hongDuc}
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 128,
            color: C.teal,
            marginTop: 14,
            lineHeight: 1,
            textShadow: "0 0 30px rgba(127,209,200,0.35)",
          }}
        >
          {year}
        </div>
      </div>
    );
  };
  return (
    <Paper variant="teal">
      <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center" }}>
        <SceneTitle
          eyebrow="Đây là chỗ cần cẩn thận nhất tối nay"
          title="Hai mốc — 1492 & 1493"
          startFrac={f92}
          titleSize={64}
          align="center"
          accent={C.teal}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 380,
          display: "flex",
          justifyContent: "center",
          gap: 80,
        }}
      >
        {col("sc041-c92", f92, true, "Lời tựa", "Vũ Quỳnh", "Hồng Đức 23", "1492")}
        {col("sc041-c93", f93, false, "Lời bạt", "Kiều Phú", "Hồng Đức 24", "1493")}
      </div>
      <div
        data-cue="sc041-care"
        style={{
          position: "absolute",
          left: 260,
          right: 260,
          top: 860,
          textAlign: "center",
          fontFamily: FONT.body,
          fontWeight: 500,
          fontSize: 40,
          color: C.cream,
          opacity: cl(p(fCare, fCare + 0.08)),
        }}
      >
        <span style={{ color: C.teal, fontWeight: 700 }}>mốc văn bản</span> — không phải tuổi của
        truyện.
      </div>
    </Paper>
  );
};

/** sc042 (s21) — TRỤC VẬT THỂ — XÂY LẠI (climax): axis of objects. */
export const Sc042: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const fAxis = A("lần theo từng vật thể");
  const fKho = A("Chiếc khố thứ duy nhất nhà có,");
  const fMan = A("Lựa chọn của Tiên Dung");
  const fCho = A("Cái chợ");
  const fGay = A("Chiếc gậy, chiếc nón");
  const fNuoc = A("Và mặt nước");
  const items = [
    { id: "kho", sf: fKho, cap: "Chiếc khố", note: "thứ duy nhất nhà có", glyph: (
      <g stroke={C.amber} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d="M 10 20 Q 60 4 110 20 Q 118 52 60 62 Q 2 52 10 20 Z" />
        <path d="M 60 62 L 60 74" />
      </g>
    ) },
    { id: "man", sf: fMan, cap: "Tấm màn", note: "công chúa tự chọn", glyph: (
      <g stroke={C.amber} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d="M 12 14 L 108 14" />
        <path d="M 16 14 Q 24 54 60 58 Q 96 54 104 14" />
        <path d="M 40 14 Q 44 40 60 46 Q 76 40 80 14" opacity={0.6} />
      </g>
    ) },
    { id: "cho", sf: fCho, cap: "Cái chợ", note: "người nghèo được đứng bán", glyph: (
      <g stroke={C.amber} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 14 46 L 60 18 L 106 46 Z" />
        <path d="M 24 46 L 24 74 M 96 46 L 96 74" />
        <path d="M 8 74 L 112 74" />
      </g>
    ) },
    { id: "gay", sf: fGay, cap: "Gậy + nón", note: "điều được trao tay", glyph: (
      <g stroke={C.amber} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d="M 24 84 L 52 16" />
        <path d="M 50 34 Q 50 22 64 16 Q 92 8 104 30 Q 106 44 96 48 Q 68 56 52 44 Z" />
      </g>
    ) },
    { id: "nuoc", sf: fNuoc, cap: "Mặt nước", note: "tên còn đọc được đến hôm nay", glyph: (
      <g stroke={C.teal} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d="M 10 34 Q 30 24 50 34 T 90 34 T 112 30" />
        <path d="M 16 54 Q 36 44 56 54 T 96 54" />
        <path d="M 22 74 Q 42 64 62 74 T 102 74" opacity={0.7} />
      </g>
    ) },
  ];
  const xs = items.map((_, i) => 240 + i * 360);
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", left: 160, top: 84 }}>
        <SceneTitle
          eyebrow="Xâu lại"
          title="Tối nay ta đã lần theo từng vật thể"
          startFrac={fAxis}
          titleSize={62}
        />
      </div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1={200} y1={520} x2={1720} y2={520} stroke={C.border} strokeWidth={4} />
        <line
          x1={200}
          y1={520}
          x2={200 + 1520 * ease(cl(p(fKho - 0.02, fNuoc + 0.15)))}
          y2={520}
          stroke={C.amber}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.85}
        />
        {xs.map((x, i) => (
          <g key={`dot${i}`} opacity={cl(p(items[i].sf, items[i].sf + 0.05))}>
            <circle cx={x} cy={520} r={12} fill={items[i].id === "nuoc" ? C.teal : C.amber} />
            <line x1={x} y1={520} x2={x} y2={430} stroke={C.mute} strokeWidth={3} opacity={0.5} />
          </g>
        ))}
      </svg>
      {items.map((it, i) => (
        <div
          key={it.id}
          data-cue={`sc042-${it.id}`}
          style={{
            position: "absolute",
            left: xs[i] - 150,
            top: 240,
            width: 300,
            textAlign: "center",
            opacity: cl(p(it.sf, it.sf + 0.06)),
            transform: `translateY(${(1 - cl(p(it.sf, it.sf + 0.06))) * 20}px)`,
          }}
        >
          <svg width={124} height={96} viewBox="0 0 124 96" style={{ display: "block", margin: "0 auto 16px" }}>
            {it.glyph}
          </svg>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 36,
              color: it.id === "nuoc" ? C.teal : C.white,
            }}
          >
            {it.cap}
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 27, color: C.mute, marginTop: 6 }}>{it.note}</div>
        </div>
      ))}
      <div
        data-cue="sc042-note"
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 700,
          background: "rgba(20,17,13,0.86)",
          border: `2px solid ${C.border}`,
          borderRadius: 12,
          padding: "30px 44px",
          fontFamily: FONT.body,
          fontSize: 38,
          lineHeight: 1.5,
          color: C.white,
          textAlign: "center",
          opacity: cl(p(fNuoc + 0.25, fNuoc + 0.35)),
        }}
      >
        Cộng đồng nhớ Chử Đồng Tử như một{" "}
        <span style={{ color: C.amber, fontWeight: 700 }}>khát vọng về đời sống có phẩm giá</span>,
        vượt khỏi xuất thân.
        <div style={{ fontSize: 30, color: C.mute, marginTop: 12 }}>
          «có thể đọc» — cách đọc biên tập, một đề xuất còn chờ duyệt.
        </div>
      </div>
    </Paper>
  );
};



