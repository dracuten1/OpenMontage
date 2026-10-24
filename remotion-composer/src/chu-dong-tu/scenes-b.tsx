// S2E03 chu-dong-tu — scenes group "b" (compose worker, spec_b.json).
// Speech-lock: A("cụm từ") trả frac theo scene; mọi beat bắn đúng nhịp đọc.
// Panel giữ đến hết câu nói cuối; quote hiện đầy từ chữ đầu (không typewriter).
import * as React from "react";
import {
  Paper,
  Reveal,
  SpringPop,
  InkDraw,
  InkPath,
  circleD,
  InkImageScene,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** sc012 (s06) — NGƯỜI TRONG CÁT: ảnh bãi cát + viền mực quanh chỗ vùi. */
export const Sc012: React.FC<SceneProps> = () => {
  const A = useA();
  const fVui = A("vùi mình vào cát");
  const fNap = A("nấp sau bụi lau");
  return (
    <InkImageScene
      src="img-04-bai-cat-nguoi-vui.png"
      focus={{ x: 0.56, y: 0.6 }}
      label="Người trong cát"
      sublabel="người nghèo nhất của truyện kể — trốn sau vụ cháy"
      labelStartFrac={fVui}
      sublabelStartFrac={fNap}
    >
      {/* viền mực quét nhẹ quanh chỗ vùi — pulse một nhịp khi đọc anchor */}
      <InkDraw
        viewBox="0 0 1920 1080"
        d={circleD(1130, 620, 170)}
        startFrac={fVui}
        endFrac={fVui + 0.08}
        stroke={C.amber}
        strokeWidth={4}
        style={{ opacity: 0.85 }}
      />
      <InkDraw
        viewBox="0 0 1920 1080"
        d={circleD(1130, 620, 200)}
        startFrac={fNap}
        endFrac={fNap + 0.08}
        stroke={C.cream}
        strokeWidth={2.5}
        style={{ opacity: 0.5 }}
      />
    </InkImageScene>
  );
};

/** sc013 (s06) — MÀN CHIA HAI THẾ GIỚI: đường mực dọc chia đôi màn hình. */
export const Sc013: React.FC<SceneProps> = () => {
  const A = useA();
  const fMan = A("tấm màn, chạm nhau trên");
  const fVaipro = A("hai thế giới cách nhau bởi một tấm màn");
  const fChot = A("hai thế giới cách nhau bởi một tấm màn");
  return (
    <Paper>
      {/* nửa trái — thế giới thuyền sang, nét vàng đồng */}
      <Reveal startFrac={fMan} dy={16} style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 930, height: 1080, opacity: 0.14, background: "linear-gradient(160deg, #D9A441 0%, rgba(217,164,65,0) 70%)" }} />
        <svg width="930" height="1080" viewBox="0 0 930 1080" style={{ position: "absolute", left: 0, top: 0, opacity: 0.75 }}>
          <path d="M 180 430 L 560 430 L 620 500 L 130 500 Z" fill="none" stroke={C.amber} strokeWidth={5} />
          <path d="M 360 430 L 360 300" stroke={C.amber} strokeWidth={4} />
          <path d="M 366 310 L 480 420 L 366 420 Z" fill={C.amber} opacity={0.25} />
          <path d="M 240 560 L 500 560" stroke={C.amber} strokeWidth={3} opacity={0.5} />
        </svg>
      </Reveal>
      {/* nửa phải — bãi cát trần, nét mực nhạt */}
      <Reveal startFrac={fVaipro} dy={16} style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", left: 990, top: 0, width: 930, height: 1080, opacity: 0.10, background: "linear-gradient(200deg, #E8DCC8 0%, rgba(232,220,200,0) 70%)" }} />
        <svg width="930" height="1080" viewBox="0 0 930 1080" style={{ position: "absolute", left: 990, top: 0, opacity: 0.6 }}>
          <path d="M 130 700 Q 400 650 800 700" fill="none" stroke={C.mute} strokeWidth={4} />
          <path d="M 200 780 Q 480 740 760 780" fill="none" stroke={C.mute} strokeWidth={3} opacity={0.6} />
          <path d="M 430 640 L 410 560 M 470 640 L 486 566" stroke={C.mute} strokeWidth={3} opacity={0.7} />
        </svg>
      </Reveal>
      {/* đường mực chính giữa = tấm màn, vẽ dọc theo câu chốt */}
      <InkDraw
        viewBox="0 0 1920 1080"
        d="M 960 140 C 940 380 980 700 958 940"
        startFrac={fChot}
        endFrac={fChot + 0.09}
        stroke={C.cream}
        strokeWidth={7}
        style={{ opacity: 0.92 }}
      />
      <Reveal startFrac={fChot + 0.04} style={{ position: "absolute", left: 0, right: 0, top: 956, textAlign: "center" }}>
        <div data-cue="sc013-caption" style={{ display: "inline-block", fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream, background: "rgba(20,17,13,0.78)", padding: "10px 28px", borderRadius: 8 }}>
          hai thế giới — <span style={{ color: C.amber }}>một tấm màn</span>
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc014 (s07) — MÀN MỞ — KẾT DUYÊN: hai bóng mực hai bên màn, màn kéo mở, hai bóng hội. */
export const Sc014: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fVe = A("không về cung");
  const fDuyen = A("kết duyên");
  const fO_lai = A("ở lại bãi cát, kết duyên");
  // màn kéo sang phải khi "kết duyên"; hai bóng tiến lại gần nhau
  const openT = cl((frame - fDuyen * dur) / (0.22 * dur));
  const gap = 1 - openT * 0.62; // hai bóng hội
  const lx = 700 - 150 * (1 - gap);
  const rx = 1220 + 150 * (1 - gap);
  return (
    <Paper>
      {/* tấm màn — vệt dọc giữa, kéo sang phải theo openT */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 900 + openT * 560, top: 0, width: 120, height: 1080, background: "linear-gradient(90deg, rgba(232,220,200,0.22), rgba(232,220,200,0.10))", borderRight: "3px solid rgba(232,220,200,0.5)", opacity: 0.9 * (1 - openT * 0.55) }} />
      </div>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* bóng trái — công chúa */}
        <g opacity={0.92}>
          <InkPath d={`M ${lx} 470 C ${lx - 26} 560 ${lx - 34} 660 ${lx - 24} 780`} startFrac={fVe} endFrac={fVe + 0.08} stroke={C.amber} strokeWidth={6} />
          <circle cx={lx} cy={430} r={30} fill="none" stroke={C.amber} strokeWidth={5} style={{ opacity: 0.9 }} />
        </g>
        {/* bóng phải — người nghèo */}
        <g opacity={0.9}>
          <InkPath d={`M ${rx} 470 C ${rx + 26} 560 ${rx + 30} 660 ${rx + 20} 780`} startFrac={fVe} endFrac={fVe + 0.08} stroke={C.cream} strokeWidth={6} />
          <circle cx={rx} cy={430} r={28} fill="none" stroke={C.cream} strokeWidth={5} />
        </g>
      </svg>
      <Reveal startFrac={fDuyen + 0.03} style={{ position: "absolute", left: 0, right: 0, top: 856, textAlign: "center" }}>
        <div data-cue="sc014-caption" style={{ display: "inline-block", fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream, background: "rgba(20,17,13,0.78)", padding: "10px 28px", borderRadius: 8 }}>
          ở lại bãi cát — <span style={{ color: C.amber }}>kết duyên</span> dưới màn
        </div>
      </Reveal>
      <Reveal startFrac={fO_lai} style={{ position: "absolute", left: 0, right: 0, top: 950, textAlign: "center" }}>
        <div data-cue="sc014-chot" style={{ display: "inline-block", fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.white, background: "rgba(20,17,13,0.78)", padding: "10px 28px", borderRadius: 8 }}>
          trước cửa màn, bà đã chọn ở lại
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc015 (s07) — QUOTE CARD TEAL: câu hỏi sách bài tập đọc lớp ba. */
export const Sc015: React.FC<SceneProps> = () => {
  const A = useA();
  const fBook = A("in sẵn trong sách bài tập đọc lớp ba");
  const fQuote = A("Vì sao công chúa Tiên Dung kết duyên cùng Chử Đồng Tử");
  return (
    <Paper variant="teal">
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 120px" }}>
        <Reveal startFrac={fBook} dy={26} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div data-cue="sc015-eyebrow" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.teal, textTransform: "uppercase", marginBottom: 26 }}>
            bài tập đọc — lớp ba
          </div>
        </Reveal>
        <Reveal startFrac={fQuote} dy={22} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div data-cue="sc015-quote" style={{ background: "rgba(20,17,13,0.86)", border: `3px solid ${C.teal}`, borderRadius: 10, padding: "52px 68px", maxWidth: 1480 }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 60, lineHeight: 1.45, color: C.white }}>
              «Vì sao công chúa Tiên Dung
              <br />
              kết duyên cùng Chử Đồng Tử?»
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.teal, marginTop: 30, letterSpacing: 1 }}>
              — sách bài tập đọc lớp ba
            </div>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc016 (s08) — TRỤC VẬT THỂ MỞ RỘNG: khố→màn→thuyền sáng; chợ, gậy/nón, đầm hé mở; sông chảy về phải. */
export const Sc016: React.FC<SceneProps> = () => {
  const A = useA();
  const fKho = A("Chiếc khố đã dẫn ta tới tấm màn");
  const fThuyen = A("tấm màn tới chuyến thuyền");
  const fGaY = A("giờ tới lượt gậy, nón, và nước");
  const fHoi = A("tới lượt gậy, nón, và nước");
  // trục nằm ngang y=560; 6 ngăn
  const cell = (id: string, x: number, name: string, glyph: React.ReactNode, sf: number, dim: boolean) => (
    <div key={id} data-cue={id} style={{ position: "absolute", left: x, top: 440, width: 240, textAlign: "center" }}>
      <Reveal startFrac={sf} dy={20}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ opacity: dim ? 0.55 : 1 }}>
          {glyph}
        </svg>
        <div style={{ marginTop: 14, fontFamily: FONT.body, fontWeight: dim ? 400 : 700, fontSize: 30, color: dim ? C.mute : C.cream, letterSpacing: 1 }}>
          {name}
        </div>
      </Reveal>
    </div>
  );
  return (
    <Paper>
      {/* dòng sông mực chảy về phải */}
      <InkDraw
        viewBox="0 0 1920 1080"
        d="M 120 660 C 500 620 1100 700 1800 640"
        startFrac={fKho}
        endFrac={fGaY + 0.1}
        stroke={C.earth}
        strokeWidth={5}
        style={{ opacity: 0.55 }}
      />
      {/* trục ngang */}
      <InkDraw
        viewBox="0 0 1920 1080"
        d="M 180 500 L 1760 500"
        startFrac={fKho}
        endFrac={fKho + 0.14}
        stroke={C.border}
        strokeWidth={4}
      />
      {/* ba vật đã sáng */}
      {cell("sc016-kho", 200, "khố", <><path d="M 30 40 L 90 40 L 84 62 L 36 62 Z" stroke={C.amber} strokeWidth={5} /><path d="M 60 62 L 60 96" stroke={C.amber} strokeWidth={4} /></>, fKho, false)}
      {cell("sc016-man", 480, "màn", <><path d="M 60 18 L 60 96" stroke={C.amber} strokeWidth={4} /><path d="M 48 18 L 48 96 M 72 18 L 72 96" stroke={C.cream} strokeWidth={2.5} opacity={0.6} /></>, fThuyen, false)}
      {cell("sc016-thuyen", 760, "thuyền", <><path d="M 22 66 L 98 66 L 84 88 L 36 88 Z" stroke={C.amber} strokeWidth={5} /><path d="M 60 66 L 60 24" stroke={C.amber} strokeWidth={4} /><path d="M 64 30 L 92 62 L 64 62 Z" fill={C.amber} opacity={0.25} /></>, fThuyen, false)}
      {/* ba ngăn hé mở mờ dần */}
      {cell("sc016-cho", 1080, "chợ", <><path d="M 24 62 L 96 62 L 96 44 L 60 26 L 24 44 Z" stroke={C.mute} strokeWidth={4} /><path d="M 36 62 L 36 92 M 84 62 L 84 92" stroke={C.mute} strokeWidth={3.5} /></>, fGaY, true)}
      {cell("sc016-gay-non", 1350, "gậy · nón", <><path d="M 40 96 L 40 24" stroke={C.mute} strokeWidth={4} /><path d="M 84 26 L 84 84" stroke={C.mute} strokeWidth={3.5} /><path d="M 62 84 Q 84 60 106 84" fill="none" stroke={C.mute} strokeWidth={3.5} /></>, fGaY, true)}
      {cell("sc016-dam", 1640, "đầm", <><path d="M 20 58 Q 50 42 78 58 T 100 54" fill="none" stroke={C.teal} strokeWidth={4} opacity={0.7} /><path d="M 30 78 Q 60 64 92 78" fill="none" stroke={C.teal} strokeWidth={3} opacity={0.5} /></>, fGaY, true)}
      <Reveal startFrac={fHoi} style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center" }}>
        <div data-cue="sc016-caption" style={{ display: "inline-block", fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: C.cream, background: "rgba(20,17,13,0.78)", padding: "10px 28px", borderRadius: 8 }}>
          trục vật thể còn dài — <span style={{ color: C.amber }}>gậy, nón, nước</span>
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc017 (s08) — THẺ CHUYỂN HỒI: «Hồi hai — Phố chợ» + vệt son con dấu. */
export const Sc017: React.FC<SceneProps> = () => {
  const A = useA();
  const fHoi = A("Hồi hai bắt đầu ở phố chợ");
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SpringPop startFrac={fHoi} from={0.92}>
          <div data-cue="sc017-title" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 128, lineHeight: 1.1, color: C.white, textAlign: "center" }}>
            Hồi hai
          </div>
          <div data-cue="sc017-sub" style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 72, color: C.amber, textAlign: "center", marginTop: 18 }}>
            Phố chợ
          </div>
        </SpringPop>
      </div>
      {/* vệt son — con dấu hồi */}
      <Reveal startFrac={fHoi + 0.06} dy={-10} style={{ position: "absolute", left: 0, right: 0, top: 742, textAlign: "center" }}>
        <div data-cue="sc017-seal" style={{ width: 120, height: 14, margin: "0 auto", background: C.warn, borderRadius: 7, opacity: 0.85, boxShadow: "0 0 24px rgba(200,85,61,0.45)" }} />
      </Reveal>
    </Paper>
  );
};

/** sc018 (s09) — QUOTE MỞ CHỢ: trích bản kể, «nghe sợ» accent. */
export const Sc018: React.FC<SceneProps> = () => {
  const A = useA();
  const fQuote = A("mở chợ búa, lập phố xá");
  const fDan = A("cùng dân buôn bán");
  const fSo = A("nghe sợ. Công chúa");
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 120px" }}>
        <Reveal startFrac={fQuote} dy={20} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div data-cue="sc018-quote" style={{ background: "rgba(36,31,26,0.94)", border: `3px solid ${C.amber}`, borderRadius: 10, padding: "56px 72px", maxWidth: 1560, position: "relative" }}>
            <div style={{ position: "absolute", top: -26, left: 48, padding: "8px 24px", background: C.amber, color: "#1A1714", fontFamily: FONT.body, fontWeight: 700, fontSize: 28, letterSpacing: 3, borderRadius: 4 }}>
              TRÍCH NGUYÊN VĂN
            </div>
            {/* hiện đầy từ chữ đầu quote — không typewriter */}
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, lineHeight: 1.5, color: C.white, marginTop: 16 }}>
              «Tiên Dung <span style={{ color: C.amber }}>nghe sợ</span> không dám về,
              <br />
              bèn cùng Đồng Tử mở chợ búa, lập phố xá,
              <br />
              cùng dân buôn bán.»
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.amber, marginTop: 30, letterSpacing: 1 }}>
              — Truyền kỳ mạn lục
            </div>
          </div>
        </Reveal>
      </div>
      {/* chip accent «nghe sợ» nhấn lại khi đọc chậm hai chữ */}
      <Reveal startFrac={fSo + 0.02} dy={14} style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center" }}>
        <div data-cue="sc018-chip" style={{ display: "inline-block", padding: "8px 26px", border: `2px solid ${C.amber}`, borderRadius: 999, color: C.amber, fontFamily: FONT.body, fontWeight: 500, fontSize: 32, letterSpacing: 2, background: "rgba(26,23,20,0.82)" }}>
          truyện gói nỗi sợ trong hai chữ
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc019 (s09) — CHỢ MỌC TỪ HAI BÀN TAY TRỐNG: ảnh chợ ven sông + nét gian hàng mọc lan. */
export const Sc019: React.FC<SceneProps> = () => {
  const A = useA();
  const fTay = A("hai bàn tay trống");
  const fXay = A("đời sống lặng lẽ xây lại từ đầu");
  return (
    <InkImageScene
      src="img-05-cho-pho-ven-song.png"
      focus={{ x: 0.5, y: 0.62 }}
      label="Chợ mọc từ hai bàn tay trống"
      sublabel="không mưa vàng, không phép màu — chỉ chợ búa, phố xá, người dân buôn bán"
      labelStartFrac={fTay}
      sublabelStartFrac={fXay}
    >
      {/* nét gian hàng mực mọc lan từ dưới lên theo nhịp đọc */}
      <InkDraw
        viewBox="0 0 1920 1080"
        d="M 560 900 L 560 838 L 660 838 L 660 900 M 700 910 L 700 852 L 800 852 L 800 910"
        startFrac={fTay}
        endFrac={fTay + 0.1}
        stroke={C.amber}
        strokeWidth={4}
        style={{ opacity: 0.85 }}
      />
      <InkDraw
        viewBox="0 0 1920 1080"
        d="M 1120 906 L 1120 848 L 1220 848 L 1220 906 M 1260 912 L 1260 860 L 1340 860 L 1340 912 M 860 896 L 860 842 L 940 842 L 940 896"
        startFrac={fTay + 0.06}
        endFrac={fXay + 0.06}
        stroke={C.cream}
        strokeWidth={3.5}
        style={{ opacity: 0.6 }}
      />
      <InkDraw
        viewBox="0 0 1920 1080"
        d="M 1430 880 L 1430 820 L 1520 820 L 1520 880 M 1560 886 L 1560 832 L 1640 832 L 1640 886"
        startFrac={fXay}
        endFrac={fXay + 0.1}
        stroke={C.amber}
        strokeWidth={3.5}
        style={{ opacity: 0.7 }}
      />
    </InkImageScene>
  );
};

/** sc020 (s10) — QUOTE PHỐ CHỢ LỚN: trích + chip ghi chú «chợ Thám». */
export const Sc020: React.FC<SceneProps> = () => {
  const A = useA();
  const fQuote = A("trở thành phố chợ lớn");
  const fThuong = A("thương nhân nước ngoài tới lui");
  const fTham = A("chợ Thám");
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 120px" }}>
        <Reveal startFrac={fQuote} dy={20} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div data-cue="sc020-quote" style={{ background: "rgba(36,31,26,0.94)", border: `3px solid ${C.amber}`, borderRadius: 10, padding: "56px 72px", maxWidth: 1560, position: "relative" }}>
            <div style={{ position: "absolute", top: -26, left: 48, padding: "8px 24px", background: C.amber, color: "#1A1714", fontFamily: FONT.body, fontWeight: 700, fontSize: 28, letterSpacing: 3, borderRadius: 4 }}>
              TRÍCH NGUYÊN VĂN
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, lineHeight: 1.5, color: C.white, marginTop: 16 }}>
              «dần dần trở thành phố chợ lớn
              <br />
              <span style={{ color: C.cream }}>(nay là chợ Thám)</span>. Thương nhân
              <br />
              nước ngoài tới lui buôn bán, kính nể
              <br />
              tôn Tiên Dung và Chử Đồng Tử làm chủ.»
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.amber, marginTop: 30, letterSpacing: 1 }}>
              — Truyền kỳ mạn lục
            </div>
          </div>
        </Reveal>
      </div>
      {/* chip ghi chú bản dịch — pop sau quote */}
      <Reveal startFrac={fThuong + 0.04} dy={14} style={{ position: "absolute", left: 0, right: 0, bottom: 118, textAlign: "center" }}>
        <div data-cue="sc020-chip" style={{ display: "inline-block", padding: "8px 26px", border: `2px solid ${C.amber}`, borderRadius: 999, color: C.amber, fontFamily: FONT.body, fontWeight: 500, fontSize: 32, letterSpacing: 2, background: "rgba(26,23,20,0.82)" }}>
          ghi chú bản dịch — «nay là chợ Thám»
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc021 (s10) — NHỊP TEAL CẢNH TỈNH: neo mức kể, không suy diễn. */
export const Sc021: React.FC<SceneProps> = () => {
  const A = useA();
  const fDung = A("phần kể chỉ dừng ở đó");
  const fGiu = A("giữ cho đúng mức của bản kể");
  return (
    <Paper variant="teal">
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 120px" }}>
        <Reveal startFrac={fDung} dy={22} style={{ textAlign: "center" }}>
          <div data-cue="sc021-eyebrow" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.teal, textTransform: "uppercase", marginBottom: 30 }}>
            mức của bản kể
          </div>
        </Reveal>
        <Reveal startFrac={fDung + 0.04} dy={20} style={{ textAlign: "center" }}>
          <div data-cue="sc021-title" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, lineHeight: 1.25, color: C.white, background: "rgba(20,17,13,0.84)", padding: "44px 64px", borderRadius: 14, border: `2px solid ${C.teal}66`, maxWidth: 1480 }}>
            Phần kể chỉ dừng ở đó.
          </div>
        </Reveal>
        <Reveal startFrac={fGiu} dy={18} style={{ textAlign: "center", marginTop: 36 }}>
          <div data-cue="sc021-sub" style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 38, lineHeight: 1.45, color: C.cream, background: "rgba(20,17,13,0.78)", padding: "20px 36px", borderRadius: 10, maxWidth: 1400 }}>
            một phố chợ lớn ven sông — <span style={{ color: C.teal }}>không suy diễn danh xưng lớn hơn</span>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};
