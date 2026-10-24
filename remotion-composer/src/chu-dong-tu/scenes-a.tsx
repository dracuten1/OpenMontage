// S2E03 chu-dong-tu — scenes group "a" (compose worker, spec_a.json).
// Speech-lock: A("cụm từ") trả frac theo scene; mọi beat bắn đúng nhịp đọc.
import * as React from "react";
import {
  Paper,
  Reveal,
  InkPath,
  InkDraw,
  QuotePlate,
  InkImageScene,
  useA,
  useFrac,
  ease,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

/** sc001 (s01) — MỞ TẬP: đoàn thuyền rước nước sương sớm trên sông Hồng. */
export const Sc001: React.FC<SceneProps> = () => {
  const A = useA();
  const fChip = A("giữa tháng Hai");
  const fLabel = A("thuyền rước nước.");
  const fSub = A("nước. Theo lịch được");
  return (
    <InkImageScene
      src="img-01-thuyen-ruc-nuoc.png"
      focus={{ x: 0.42, y: 0.5 }}
      label="Du thuyền rước nước trên sông Hồng"
      sublabel="Không chở gạo, không chở khách — nó chở nước, như rước một vị khách."
      labelStartFrac={fLabel}
      sublabelStartFrac={fSub}
    >
      <Reveal startFrac={fChip} style={{ position: "absolute", top: 84, left: 64 }}>
        <div
          data-cue="sc001-chip"
          style={{
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: 4,
            color: C.amber,
            background: "rgba(20,17,13,0.8)",
            border: `2px solid ${C.amber}66`,
            borderRadius: 8,
            padding: "10px 24px",
          }}
        >
          THÁNG HAI ÂM LỊCH · SÔNG HỒNG
        </div>
      </Reveal>
    </InkImageScene>
  );
};

/** sc002 (s01) — BẢN ĐỒ GIẤY DẦU NÂU: sông mực + 9 chấm làng thắp tuần tự. */
export const Sc002: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const fRiver = A("du thuyền rước nước trên sông Hồng");
  const fLan = A("các làng lại tổ chức");
  const fMui = A("múc lên từ sông");
  const RIVER =
    "M -20 620 C 300 560, 480 706, 760 646 S 1240 524, 1500 620 S 1800 706, 1940 648";
  const villages: Array<[number, number]> = [
    [150, 556], [326, 676], [502, 588], [678, 676], [856, 604],
    [1034, 544], [1214, 624], [1392, 556], [1572, 664],
  ];
  return (
    <Paper variant="earth">
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <InkPath d={RIVER} startFrac={fRiver} endFrac={fRiver + 0.1} stroke="#2E2013" strokeWidth={30} />
        {villages.map(([vx, vy], i) => {
          const f0 = fLan + 0.012 * i;
          const t = ease(p(f0, f0 + 0.02));
          return (
            <g key={i} opacity={t}>
              {t > 0.05 && <circle cx={vx} cy={vy} r={30} fill={C.amber} opacity={0.16 * t} />}
              <circle cx={vx} cy={vy} r={6 + 8 * t} fill={t > 0.05 ? C.amber : "#4A3A28"} />
            </g>
          );
        })}
        <InkPath d={RIVER} startFrac={fMui} endFrac={fMui + 0.14} stroke={C.amber} strokeWidth={7} />
      </svg>
      <Reveal startFrac={fLan} style={{ position: "absolute", top: 84, left: 64 }}>
        <div
          data-cue="sc002-9lang"
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 56,
            color: C.white,
            background: "rgba(20,17,13,0.82)",
            border: `3px solid ${C.amber}`,
            borderRadius: 10,
            padding: "14px 30px",
          }}
        >
          9 làng
        </div>
      </Reveal>
      <Reveal startFrac={fMui} style={{ position: "absolute", left: 64, bottom: 96, maxWidth: 1200 }}>
        <div
          data-cue="sc002-caption"
          style={{
            fontFamily: FONT.body,
            fontSize: 36,
            lineHeight: 1.45,
            color: C.cream,
            background: "rgba(20,17,13,0.8)",
            borderRadius: 8,
            padding: "16px 26px",
          }}
        >
          Nước được múc lên từ sông — đưa vào đình, vào đền.
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc003 (s02) — CÂU HỎI TRUNG TÂM: nghịch lý chiếc khố trên giấy dó. */
export const Sc003: React.FC<SceneProps> = () => {
  const A = useA();
  const fTitle = A("một người từng");
  const fKho = A("không có nổi một chiếc khố.");
  const fThanh = A("thờ một người từng");
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 120px",
        }}
      >
        <div
          style={{
            background: "rgba(20,17,13,0.82)",
            border: `2px solid ${C.border}`,
            borderRadius: 14,
            padding: "64px 88px",
            maxWidth: 1560,
            textAlign: "center",
          }}
        >
          <Reveal startFrac={fTitle}>
            <div
              data-cue="sc003-title"
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 76,
                lineHeight: 1.3,
                color: C.white,
              }}
            >
              Vì sao một người
              <br />
              <span data-cue="sc003-kho" style={{ color: C.amber }}>
                không có cả chiếc khố
              </span>
              <br />
              <span data-cue="sc003-thanh" style={{ color: C.cream }}>
                lại được thờ làm thánh?
              </span>
            </div>
          </Reveal>
          <Reveal startFrac={fThanh + 0.06} dy={-10}>
            <svg width={220} height={20} viewBox="0 0 220 20" style={{ marginTop: 40 }}>
              <InkPath d="M 10 10 H 210" startFrac={fThanh + 0.06} endFrac={fThanh + 0.14} stroke={C.amber} strokeWidth={4} />
            </svg>
          </Reveal>
        </div>
      </div>
    </Paper>
  );
};

/** sc004 (s02) — CHIẾC KHỐ VẼ MỰC LẶNG IM: nét chạy một lượt rồi giữ tĩnh. */
export const Sc004: React.FC<SceneProps> = () => {
  const A = useA();
  const fKho = A("không có cả chiếc khố");
  const fDraw = A("thờ đã lâu lắm rồi");
  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 84, textAlign: "center" }}>
        <Reveal startFrac={fKho}>
          <div
            data-cue="sc004-cap"
            style={{
              display: "inline-block",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: 4,
              color: C.mute,
              background: "rgba(20,17,13,0.8)",
              padding: "10px 28px",
              borderRadius: 8,
            }}
          >
            VẬT THỂ ĐẦU TIÊN CỦA TẬP
          </div>
        </Reveal>
      </div>
      {/* Chiếc khố: mảnh vải buộc dây lưng — nét mực một lượt */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <InkDraw
          d="M 700 400 Q 960 360 1220 400 L 1220 470 Q 960 440 700 470 Z"
          startFrac={fDraw}
          endFrac={fDraw + 0.3}
          stroke={C.cream}
          strokeWidth={5}
        />
        <InkDraw
          d="M 700 400 Q 640 380 580 392 M 1220 400 Q 1280 380 1340 392"
          startFrac={fDraw + 0.1}
          endFrac={fDraw + 0.34}
          stroke={C.cream}
          strokeWidth={5}
        />
        <InkDraw
          d="M 760 470 Q 780 560 800 620 M 1160 470 Q 1140 560 1120 620"
          startFrac={fDraw + 0.18}
          endFrac={fDraw + 0.4}
          stroke={C.cream}
          strokeWidth={5}
        />
        {/* vệt mực nhỏ dưới chân khố — dấu thời gian quanting */}
        <InkDraw
          d="M 900 700 q 20 26 46 30 M 990 706 q 14 20 34 24"
          startFrac={fDraw + 0.34}
          endFrac={fDraw + 0.48}
          stroke={C.mute}
          strokeWidth={4}
        />
      </svg>
    </Paper>
  );
};

/** sc005 (s03) — QUOTE CARD: bản kể gia cảnh, trích nguyên văn. */
export const Sc005: React.FC<SceneProps> = () => {
  const A = useA();
  const fQuote = A("một khố vải duy nhất");
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 120px",
        }}
      >
        <QuotePlate
          startFrac={fQuote}
          endFrac={fQuote + 0.5}
          size={54}
          maxWidth={1480}
          label="BẢN KỂ GHI LẠI"
          source="Linhting Nam chí quái — bản kể dân gian"
          text="Cha từ, con hiếu, nhà gặp hỏa hoạn, của cải sạch không, chỉ còn lại một khố vải duy nhất, cha con ra vào thay nhau mà mặc."
        />
      </div>
    </Paper>
  );
};

/** sc006 (s03) — FOCAL S03: ảnh demo, hai bóng cha con + khố swap. */
export const Sc006: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const fCha = A("Cha và con,");
  const fChay = A("Cha và con, hai người, thay");
  const fSwap = A("thay nhau mà mặc");
  // khố đổi vị trí: với con (giữa) → với cha (phải) theo nhịp kể
  const swapT = ease(p(fSwap, fSwap + 0.25));
  const kx = 880 + swapT * 220;
  const kalpha = 0.25 + 0.75 * ease(p(fChay, fChay + 0.2));
  return (
    <InkImageScene src="demo_s03_kho.jpg" focus={{ x: 0.5, y: 0.45 }}>
      {/* hai bóng người mực — cha và con */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g opacity={ease(p(fCha, fCha + 0.15))}>
          <path
            d="M 1180 470 a 34 34 0 1 1 0.1 0 Z M 1178 510 L 1150 700 L 1176 700 L 1182 610 L 1190 700 L 1214 700 L 1204 510 Z"
            fill="#0F0C09"
            opacity={0.8}
          />
        </g>
        <g opacity={ease(p(fCha, fCha + 0.15))}>
          <path
            d="M 700 480 a 30 30 0 1 1 0.1 0 Z M 698 516 L 674 700 L 698 700 L 704 614 L 710 700 L 732 700 L 724 516 Z"
            fill="#0F0C09"
            opacity={0.8}
          />
        </g>
        {/* mảnh khố amber — điểm sáng duy nhất, di chuyển giữa hai bóng */}
        <g opacity={kalpha}>
          <path d={`M ${kx} 560 L ${kx + 90} 552 L ${kx + 84} 660 L ${kx + 6} 668 Z`} fill={C.amber} opacity={0.92} />
          <path d={`M ${kx} 560 Q ${kx + 45} 576 ${kx + 90} 552`} stroke="#0F0C09" strokeWidth={4} fill="none" />
        </g>
      </svg>
      <Reveal startFrac={fChay} style={{ position: "absolute", left: 64, bottom: 96, maxWidth: 1240 }}>
        <div
          data-cue="sc006-cap"
          style={{
            fontFamily: FONT.body,
            fontSize: 36,
            lineHeight: 1.45,
            color: C.cream,
            background: "rgba(20,17,13,0.8)",
            borderRadius: 8,
            padding: "16px 26px",
          }}
        >
          Hai người — một khố: cha con ra vào thay nhau mà mặc.
        </div>
      </Reveal>
    </InkImageScene>
  );
};

/** sc007 (s03) — QUOTE LỜI DẶN CỦA CHA: variant tối, bookmark mực. */
export const Sc007: React.FC<SceneProps> = () => {
  const A = useA();
  const fQuote = A("để trần mà chôn", 1);
  const fMark = A("khỏi xấu hổ");
  return (
    <Paper variant="night">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 120px",
        }}
      >
        <div style={{ position: "relative", maxWidth: 1420 }}>
          <QuotePlate
            startFrac={fQuote}
            endFrac={fQuote + 0.42}
            size={48}
            maxWidth={1280}
            label="LỜI DẶN CỦA CHA"
            source="Linhting Nam chí quái — bản kể dân gian"
            text="Cha chết cứ để trần mà chôn, giữ khố lại cho con, để khỏi xấu hổ."
          />
          {/* bookmark mực ngắn dưới quote */}
          <svg width={160} height={14} viewBox="0 0 160 14" style={{ position: "absolute", right: 8, bottom: -34 }}>
            <InkPath d="M 4 7 H 156" startFrac={fMark} endFrac={fMark + 0.1} stroke={C.amber} strokeWidth={6} />
          </svg>
        </div>
      </div>
    </Paper>
  );
};

/** sc008 (s04) — SƠ ĐỒ HAI LỚP: cột amber 'truyện kể' vs cột teal 'kiểm chứng'. */
export const Sc008: React.FC<SceneProps> = () => {
  const A = useA();
  const fTitle = A("nhỏ mà cả hai lớp cùng giữ.");
  const fLeft = A("truyện kể");
  const fRight = A("thứ kiểm chứng được");
  const col = (
    sf: number,
    accent: string,
    head: string,
    sub: string,
    items: string[],
    key: string,
  ) => (
    <Reveal startFrac={sf} dy={30}>
      <div
        data-cue={key}
        style={{
          width: 740,
          background: "rgba(20,17,13,0.84)",
          border: `3px solid ${accent}`,
          borderRadius: 14,
          padding: "44px 48px",
        }}
      >
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 3, color: accent }}>
          {sub}
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 72, color: C.white, marginTop: 10 }}>
          {head}
        </div>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((it, i) => (
            <div key={i} style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>
              — {it}
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 84, textAlign: "center" }}>
        <Reveal startFrac={fTitle}>
          <div
            data-cue="sc008-title"
            style={{
              display: "inline-block",
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 64,
              color: C.white,
              background: "rgba(20,17,13,0.82)",
              borderRadius: 10,
              padding: "12px 40px",
            }}
          >
            Câu chuyện có <span style={{ color: C.amber }}>hai lớp</span>
          </div>
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 300,
          display: "flex",
          justifyContent: "center",
          gap: 56,
        }}
      >
        {col(fLeft, C.amber, "Truyện kể", "LỚP THỨ NHẤT", ["Thứ bản kể giữ lại bằng lời", "Thế giới màu hổ phách", "của truyền khẩu"], "sc008-left")}
        {col(fRight, C.teal, "Kiểm chứng được", "LỚP THỨ HAI", ["Bản sách chép", "Bài đăng", "Lễ hội có hồ sơ"], "sc008-right")}
      </div>
    </Paper>
  );
};

/** sc009 (s04) — TRỤC VẬT THỂ DỌC DÒNG SÔNG: 6 vật neo dọc sông mực. */
export const Sc009: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const fTitle = A("Tôi chỉ lần theo các vật");
  const fKho = A("Chiếc khố, rồi tấm màn");
  const fMan = A("tấm màn");
  const fThuyen = A("Chuyến thuyền, rồi cây gậy");
  const fNon = A("chiếc nón");
  const fDam = A("Cái đầm, và cuối cùng");
  const fNuoc = A("nước rước");
  const fRiver = A("dòng sông dẫn ta tới đâu");
  const RIVER =
    "M 60 760 C 400 716, 700 800, 1020 748 S 1560 690, 1860 742";
  const objs: Array<{ id: string; x: number; cap: string; s: number }> = [
    { id: "sc009-kho", x: 210, cap: "Khố", s: fKho },
    { id: "sc009-man", x: 490, cap: "Màn", s: fMan },
    { id: "sc009-thuyen", x: 780, cap: "Thuyền", s: fThuyen },
    { id: "sc009-gay-non", x: 1060, cap: "Gậy · Nón", s: fNon },
    { id: "sc009-dam", x: 1360, cap: "Đầm", s: fDam },
    { id: "sc009-nuoc", x: 1640, cap: "Nước rước", s: fNuoc },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 84, textAlign: "center" }}>
        <Reveal startFrac={fTitle}>
          <div
            data-cue="sc009-title"
            style={{
              display: "inline-block",
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 64,
              color: C.white,
              background: "rgba(20,17,13,0.82)",
              borderRadius: 10,
              padding: "12px 40px",
            }}
          >
            Lần theo <span style={{ color: C.amber }}>các vật</span> — như một người kiểm kê
          </div>
        </Reveal>
      </div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* sông mực ấm luôn chảy mờ */}
        <path d={RIVER} fill="none" stroke={C.border} strokeWidth={16} strokeLinecap="round" opacity={0.5} />
        <InkPath d={RIVER} startFrac={fRiver} endFrac={fRiver + 0.2} stroke={C.amber} strokeWidth={6} />
        {objs.map((o) => {
          const t = ease(p(o.s, o.s + 0.04));
          return (
            <g key={o.id} opacity={t}>
              {t > 0.05 && <circle cx={o.x} cy={748} r={26} fill={C.amber} opacity={0.18 * t} />}
              <circle cx={o.x} cy={748} r={7 + 7 * t} fill={t > 0.05 ? C.amber : C.border} />
            </g>
          );
        })}
      </svg>
      {objs.map((o) => (
        <div key={o.id} style={{ position: "absolute", left: o.x - 120, top: 620, width: 240, textAlign: "center" }}>
          <Reveal startFrac={o.s} dy={18}>
            <div
              data-cue={o.id}
              style={{
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 34,
                color: C.cream,
                background: "rgba(20,17,13,0.8)",
                borderRadius: 8,
                padding: "8px 16px",
                display: "inline-block",
              }}
            >
              {o.cap}
            </div>
          </Reveal>
        </div>
      ))}
    </Paper>
  );
};

/** sc010 (s05) — THUYỀN TIÊN DUNG: màn che hạ xuống khi đọc "hạ màn xuống". */
export const Sc010: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const fLabel = A("Tiên Dung, công chúa");
  const fMan = A("hạ màn xuống");
  const dropT = ease(p(fMan, fMan + 0.3));
  return (
    <InkImageScene
      src="img-03-thuyen-tien-dung.png"
      focus={{ x: 0.55, y: 0.45 }}
      label="Tiên Dung, công chúa"
      sublabel="Muốn tắm nơi vắng người — chọn một bãi cát, hạ màn xuống."
      labelStartFrac={fLabel}
      sublabelStartFrac={fMan}
    >
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g opacity={ease(p(fMan, fMan + 0.08))}>
          {/* dây treo màn */}
          <path d="M 1180 300 Q 1300 260 1420 300" stroke={C.cream} strokeWidth={4} fill="none" opacity={0.7} />
          {/* tấm màn rủ hạ xuống dần */}
          <path
            d={`M 1196 296 Q 1210 ${400 + 240 * dropT} 1200 ${560 + 300 * dropT} Q 1300 ${600 + 300 * dropT} 1404 ${560 + 300 * dropT} Q 1394 ${400 + 240 * dropT} 1404 296 Z`}
            fill={C.cream}
            opacity={0.22}
          />
          <InkDraw
            d={`M 1196 296 Q 1210 ${400 + 240 * dropT} 1200 ${560 + 300 * dropT} Q 1300 ${600 + 300 * dropT} 1404 ${560 + 300 * dropT} Q 1394 ${400 + 240 * dropT} 1404 296`}
            startFrac={fMan}
            endFrac={fMan + 0.32}
            stroke={C.cream}
            strokeWidth={5}
          />
        </g>
      </svg>
    </InkImageScene>
  );
};

/** sc011 (s05) — BA CHỮ VẬT THỂ: màn — cát — nước, triptych word+glyph. */
export const Sc011: React.FC<SceneProps> = () => {
  const A = useA();
  const fMan = A("Chỉ có màn");
  const fCat = A("cát", 2);
  const fNuoc = A("nước", 2);
  const cell = (
    sf: number,
    x: number,
    word: string,
    glyph: React.ReactNode,
    key: string,
  ) => (
    <div key={key} style={{ position: "absolute", left: x, top: 380, width: 420, textAlign: "center" }}>
      <Reveal startFrac={sf} dy={26}>
        <div style={{ width: 160, margin: "0 auto" }}>{glyph}</div>
        <div
          data-cue={key}
          style={{
            marginTop: 28,
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 84,
            color: C.white,
          }}
        >
          {word}
        </div>
      </Reveal>
    </div>
  );
  return (
    <Paper>
      {cell(fMan, 180, "MÀN",
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
          <path d="M 40 24 H 120" stroke={C.cream} strokeWidth="5" strokeLinecap="round" />
          <path d="M 48 24 Q 58 96 46 140 M 76 24 Q 86 100 74 144 M 104 24 Q 114 96 102 140" stroke={C.cream} strokeWidth="4" strokeLinecap="round" />
        </svg>, "sc011-man")}
      {cell(fCat, 750, "CÁT",
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
          <path d="M 16 128 Q 52 76 80 96 Q 108 60 144 128 Z" stroke={C.cream} strokeWidth="5" strokeLinejoin="round" />
          <path d="M 30 132 Q 80 118 130 132" stroke={C.mute} strokeWidth="4" strokeLinecap="round" />
        </svg>, "sc011-cat")}
      {cell(fNuoc, 1320, "NƯỚC",
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
          <path d="M 20 60 Q 45 40 70 60 T 120 60 T 150 60" stroke={C.cream} strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M 20 96 Q 45 76 70 96 T 120 96 T 150 96" stroke={C.teal} strokeWidth="5" strokeLinecap="round" fill="none" opacity={0.8} />
          <path d="M 20 132 Q 45 112 70 132 T 120 132 T 150 132" stroke={C.cream} strokeWidth="5" strokeLinecap="round" fill="none" opacity={0.6} />
        </svg>, "sc011-nuoc")}
    </Paper>
  );
};
