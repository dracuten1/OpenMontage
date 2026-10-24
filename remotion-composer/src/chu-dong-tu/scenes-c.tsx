// S2E03 chu-dong-tu — scenes group "c" (compose worker, spec_c.json).
// Speech-lock: A("cụm") trả frac thô theo scene; mọi beat bắn đúng nhịp đọc.
import * as React from "react";
import {
  Paper,
  Reveal,
  SpringPop,
  InkDraw,
  InkPath,
  Chip,
  LegendFrame,
  SceneTitle,
  SourceTag,
  InkImageScene,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Gạch chân mực mảnh vẽ ngay sau anchor (span-level, speech-locked). */
const UL: React.FC<{ sf: number; children: React.ReactNode; color?: string }> = ({
  sf,
  children,
  color = C.amber,
}) => (
  <span style={{ position: "relative", display: "inline-block" }}>
    {children}
    <svg
      width="100%"
      height="10"
      viewBox="0 0 200 10"
      preserveAspectRatio="none"
      style={{ position: "absolute", left: 0, bottom: -10, width: "100%", height: 10, overflow: "visible" }}
    >
      <InkPath d="M 2 6 Q 100 1 198 6" startFrac={sf} endFrac={sf + 0.03} stroke={color} strokeWidth={3} />
    </svg>
  </span>
);

/** Vòng hào quang mực pulse sau anchor (speech-locked glow overlay). */
const Halo: React.FC<{ sf: number; cx: number; cy: number; r: number; color?: string }> = ({
  sf,
  cx,
  cy,
  r,
  color = C.amber,
}) => {
  const { frame, dur } = useFrac();
  const el = frame - sf * dur;
  if (el <= 0) return null;
  const o = cl(el / 8) * (0.22 + 0.12 * Math.sin(el / 7));
  const rr = r * (1 + 0.04 * Math.sin(el / 7));
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <circle cx={cx} cy={cy} r={rr} fill="none" stroke={color} strokeWidth="4" opacity={o} />
      <circle cx={cx} cy={cy} r={rr * 0.76} fill="none" stroke={color} strokeWidth="2" opacity={o * 0.6} />
    </svg>
  );
};

/** sc022 (s11) — SÔNG LẤY NHỊP KỂ: nước chảy liên tục, thuyền hai chiều, vật pop theo narration. */
export const Sc022: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const gate = (sf: number): number => cl((frame - sf * dur) / 8);
  const fTitle = A("dòng sông đưa truyện sang khúc mới:");
  const fCho = A("Chuyến thuyền ấy rời phố chợ,");
  const fPop = A("người, hàng, thuyền");
  const f2c = A("thuyền xuôi, thuyền ngược");
  const fHang = A("hàng lên, hàng xuống");
  const flow = (frame * 2.4) % 240;
  const wave = (y: number, amp: number): string => {
    let d = `M -480 ${y}`;
    for (let x = -480; x < 2440; x += 120) d += ` q 60 ${-amp} 120 0`;
    return d;
  };
  const Boat: React.FC<{ dir: 1 | -1; speed: number; y: number; phase: number }> = ({ dir, speed, y, phase }) => {
    const g = gate(f2c);
    if (g <= 0) return null;
    const travel = ((frame * speed + phase) % 2300) - 260;
    const x = dir === 1 ? travel : 2040 - travel;
    return (
      <div style={{ position: "absolute", left: x, top: y, opacity: g }}>
        <svg width="150" height="90" viewBox="0 0 150 90" style={{ transform: `scaleX(${dir})` }}>
          <path d="M 12 62 Q 75 90 138 62 L 124 48 L 26 48 Z" fill="rgba(232,220,200,0.12)" stroke={C.cream} strokeWidth="3.5" />
          <path d="M 75 48 L 75 6" stroke={C.cream} strokeWidth="3" />
          <path d="M 78 10 Q 118 24 78 44 Z" fill="rgba(217,164,65,0.30)" stroke={C.amber} strokeWidth="2.5" />
        </svg>
      </div>
    );
  };
  const pop = (id: string, x: number, cap: string, glyph: React.ReactNode) => (
    <SpringPop key={id} startFrac={fPop} style={{ position: "absolute", left: x, top: 470, width: 220, textAlign: "center" }}>
      <div data-cue={id}>
        <div style={{ width: 110, margin: "0 auto" }}>{glyph}</div>
        <div style={{ marginTop: 14, fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 2, color: C.cream }}>{cap}</div>
      </div>
    </SpringPop>
  );
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.30)" }} />
      <div data-cue="sc022-title" style={{ position: "absolute", left: 160, top: 96 }}>
        <SceneTitle
          eyebrow="HỒI HAI · BẾN SÔNG"
          title="Nhịp của nó chính là nhịp con sông"
          startFrac={fTitle}
          titleSize={72}
          maxWidth={1300}
        />
      </div>
      {/* bờ + chợ */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1="0" y1="580" x2="1920" y2="580" stroke={C.earthGlow} strokeWidth="3" opacity="0.4" />
        <Reveal startFrac={fCho}>
          <g data-cue="sc022-cho">
            <path d="M 250 540 L 310 470 L 370 540 Z" fill="rgba(232,220,200,0.16)" stroke={C.cream} strokeWidth="3" />
            <rect x="262" y="540" width="96" height="34" fill="rgba(232,220,200,0.10)" stroke={C.cream} strokeWidth="2.5" />
          </g>
        </Reveal>
      </svg>
      <Reveal startFrac={fCho}>
        <div data-cue="sc022-cho-label" style={{ position: "absolute", left: 220, top: 396, fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 2, color: C.cream }}>
          Chợ ven sông
        </div>
      </Reveal>
      {/* mặt nước chảy liên tục */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <g transform={`translate(${-flow} 0)`}>
          <path d={wave(608, 9)} fill="none" stroke={C.cream} strokeWidth="3" opacity="0.5" />
          <path d={wave(646, 13)} fill="none" stroke={C.earthGlow} strokeWidth="3.5" opacity="0.4" />
          <path d={wave(700, 17)} fill="none" stroke={C.cream} strokeWidth="4" opacity="0.26" />
        </g>
      </svg>
      {/* người, hàng, thuyền pop trên dòng nước */}
      {pop("sc022-nguoi", 660, "người",
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="26" r="14" stroke={C.cream} strokeWidth="4" />
          <path d="M 55 42 L 55 78 M 34 56 L 76 56 M 40 100 L 55 78 L 70 100" stroke={C.cream} strokeWidth="4" strokeLinecap="round" />
        </svg>)}
      {pop("sc022-hang", 900, "hàng",
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <rect x="26" y="34" width="58" height="44" stroke={C.cream} strokeWidth="4" />
          <path d="M 26 52 L 84 52 M 55 34 L 55 78" stroke={C.cream} strokeWidth="3" />
          <path d="M 38 78 L 38 96 M 72 78 L 72 96" stroke={C.earthGlow} strokeWidth="4" strokeLinecap="round" />
        </svg>)}
      {pop("sc022-thuyen", 1140, "thuyền",
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <path d="M 14 66 Q 55 88 96 66 L 86 54 L 24 54 Z" stroke={C.cream} strokeWidth="4" />
          <path d="M 55 54 L 55 16 M 58 20 Q 84 32 58 50 Z" stroke={C.amber} strokeWidth="3" fill="rgba(217,164,65,0.25)" />
        </svg>)}
      {/* thuyền hai chiều */}
      <Boat dir={1} speed={3.4} y={545} phase={0} />
      <Boat dir={-1} speed={3.0} y={632} phase={900} />
      {/* hàng lên, hàng xuống */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g data-cue="sc022-hanglen" opacity={gate(fHang)}>
          <path d="M 1650 500 L 1650 420 M 1632 438 L 1650 420 L 1668 438" stroke={C.earthGlow} strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>
        <g data-cue="sc022-hangxuong" opacity={gate(fHang)}>
          <path d="M 1650 540 L 1650 620 M 1632 602 L 1650 620 L 1668 602" stroke={C.earthGlow} strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>
      </svg>
      <Reveal startFrac={fHang}>
        <div data-cue="sc022-hang-labels" style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
          <div style={{ position: "absolute", left: 1560, top: 388, fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.cream }}>
            hàng lên
          </div>
          <div style={{ position: "absolute", left: 1540, top: 636, fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.cream }}>
            hàng xuống
          </div>
        </div>
      </Reveal>
      <SourceTag text="Hồi Hai · chợ ven sông — nhịp kể theo nhịp nước" bottom={44} />
    </Paper>
  );
};

/** sc023 (s11) — THẺ CHUYỂN HỒI BA: spring title + con dấu son; sông mực mờ chạy chân thẻ. */
export const Sc023: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame } = useFrac();
  const fThuyen = A("Hồi ba bắt đầu từ đây");
  const fHoiBa = A("Hồi ba bắt đầu từ đây");
  const flow = (frame * 1.6) % 240;
  let wd = `M -480 0`;
  for (let x = -480; x < 2440; x += 120) wd += ` q 60 -12 120 0`;
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.34)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          data-cue="sc023-card"
          style={{
            position: "relative",
            background: "rgba(20,17,13,0.86)",
            border: `3px solid ${C.border}`,
            borderRadius: 14,
            padding: "90px 150px 84px",
            textAlign: "center",
          }}
        >
          <Reveal startFrac={fThuyen}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 8, color: C.amber }}>
              HỒI BA
            </div>
          </Reveal>
          <SpringPop startFrac={fThuyen}>
            <div style={{ marginTop: 26, fontFamily: FONT.display, fontWeight: 800, fontSize: 128, lineHeight: 1.1, color: C.white }}>
              Chuyến thuyền
            </div>
          </SpringPop>
          {/* con dấu son */}
          <SpringPop startFrac={fHoiBa} from={1.8}>
            <div data-cue="sc023-seal" style={{ position: "absolute", right: 56, bottom: -46 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="rgba(232,90,79,0.14)" stroke={C.lampRed} strokeWidth="5" />
                <text x="60" y="82" textAnchor="middle" fill={C.lampRed} fontFamily='"Playfair Display", "Songti SC", serif' fontWeight={700} fontSize={58}>
                  三
                </text>
              </svg>
            </div>
          </SpringPop>
        </div>
      </div>
      {/* dòng sông mực mờ chạy qua chân thẻ */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <g transform={`translate(${-flow} 0)`} opacity="0.22">
          <path d={wd} transform="translate(0 880)" fill="none" stroke={C.cream} strokeWidth="3" />
        </g>
      </svg>
      <Reveal startFrac={fHoiBa}>
        <div data-cue="sc023-sub" style={{ position: "absolute", left: 0, right: 0, bottom: 130, textAlign: "center", fontFamily: FONT.body, fontSize: 34, letterSpacing: 2, color: C.mute }}>
          rời phố chợ, xuôi dòng — và Hồi ba bắt đầu từ đây
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc024 (s12) — QUOTE CHUYỆN BUÔN: quote hiện TOÀN BỘ từ chữ đầu; «núi Quỳnh Vi» underline mực. */
export const Sc024: React.FC<SceneProps> = () => {
  const A = useA();
  const fQ = A("cùng lái buôn đi buôn bán");
  const fUL = A("núi Quỳnh Vi", 1);
  const fNuoc = A("cùng lái buôn đi buôn bán");
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.30)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 150px" }}>
        <Reveal startFrac={fQ}>
          <div data-cue="sc024-eyebrow" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber, marginBottom: 30 }}>
            HỒI BA · VẪN NHỮNG CHỮ RẤT TỈNH
          </div>
        </Reveal>
        <LegendFrame label="TRÍCH NGUYÊN VĂN">
          <div data-cue="sc024-quote" style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, lineHeight: 1.5, color: C.white, maxWidth: 1440 }}>
            «Đồng Tử bèn cùng lái buôn đi buôn bán. Đến <UL sf={fUL}>núi Quỳnh Vi</UL>, trên núi có am
            nhỏ, bọn lái buôn thường ghé lại đó lấy uống nước.»
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.amber, marginTop: 26, letterSpacing: 1 }}>
            — Lĩnh Nam chích quái, bản dịch
          </div>
        </LegendFrame>
        <Reveal startFrac={fNuoc}>
          <div data-cue="sc024-note" style={{ marginTop: 40, fontFamily: FONT.body, fontSize: 36, color: C.cream, background: "rgba(20,17,13,0.78)", padding: "14px 30px", borderRadius: 10 }}>
            Một am nhỏ trên núi — trạm nghỉ quen thuộc của đường buôn
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc025 (s12) — AM NHỎ TRÊN NÚI: ảnh gen + đường mòn mực vẽ lên; cửa am tối; khói nhang. */
export const Sc025: React.FC<SceneProps> = () => {
  const A = useA();
  const fLabel = A("trên núi có am nhỏ", 1);
  const fMon = A("người lên lấy nước");
  const fNguoi = A("trong am có người");
  return (
    <InkImageScene
      src="img-06-nui-quynh-vi-am.png"
      label="Am nhỏ trên núi Quỳnh Vi"
      sublabel="Cửa am giữ tối — bọn lái buôn thường ghé lại đó lấy uống nước"
      labelStartFrac={fLabel}
      focus={{ x: 0.5, y: 0.42 }}
    >
      {/* đường mòn mực từ chân núi lên cửa am */}
      <InkDraw
        d="M 260 1010 C 420 940 500 880 620 780 C 720 700 780 640 856 560"
        startFrac={fMon}
        endFrac={fMon + 0.10}
        stroke={C.cream}
        strokeWidth={5}
      />
      {/* khói nhang mờ trôi */}
      {(() => {
        const { frame, dur } = useFrac();
        void dur;
        const t = frame % 90;
        const o = (t / 90) * (1 - t / 90) * 4;
        return (
          <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <g data-cue="sc025-khoi" opacity={0.5 * o}>
              <path
                d={`M 872 520 C ${872 + Math.sin(t / 12) * 16} 480 ${876 + Math.sin(t / 9) * 20} 440 ${880} 388`}
                fill="none"
                stroke={C.cream}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          </svg>
        );
      })()}
      <Halo sf={fNguoi} cx={850} cy={540} r={120} color={C.lampRed} />
      <SourceTag text="Minh họa tái tạo — am trên núi Quỳnh Vi, Hồi ba" bottom={44} />
    </InkImageScene>
  );
};

/** sc026 (s13) — QUOTE VỊ SƯ: một dòng gọn; chữ «ở lại» accent amber. */
export const Sc026: React.FC<SceneProps> = () => {
  const A = useA();
  const fQ = A("trong am có sư");
  const fOL = A("tên gọi Phu Quang");
  const fMotDong = A("trong am có sư");
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.30)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 150px" }}>
        <LegendFrame label="TRÍCH NGUYÊN VĂN">
          <div data-cue="sc026-quote" style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, lineHeight: 1.5, color: C.white, maxWidth: 1440 }}>
            «trong am có sư tên gọi Phu Quang truyền phép cho Đồng Tử, Đồng Tử{" "}
            <span style={{ color: C.amber }}>ở lại học phép</span>.»
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.amber, marginTop: 26, letterSpacing: 1 }}>
            — Lĩnh Nam chích quái, bản dịch
          </div>
        </LegendFrame>
        <Reveal startFrac={fOL}>
          <div data-cue="sc026-accent" style={{ marginTop: 38, fontFamily: FONT.body, fontWeight: 700, fontSize: 36, letterSpacing: 2, color: C.amber, background: "rgba(20,17,13,0.78)", padding: "14px 30px", borderRadius: 10 }}>
            «ở lại» — một chữ đáng nghe
          </div>
        </Reveal>
        <Reveal startFrac={fMotDong}>
          <div data-cue="sc026-oneline" style={{ marginTop: 22, fontFamily: FONT.body, fontSize: 34, color: C.mute }}>
            Chỉ một dòng — nhưng đổi hướng cả truyện
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc027 (s13) — SƯ TRAO GẬY NÓN: ảnh gen + halo mực pulse khi đọc «truyền phép». */
export const Sc027: React.FC<SceneProps> = () => {
  const A = useA();
  const fLabel = A("gặp sư");
  const fHalo = A("truyền phép", 1);
  return (
    <InkImageScene
      src="img-07-su-phu-quang.png"
      label="Trong am — người lên lấy nước, thì gặp sư"
      sublabel="Vị sư trao gậy tre và nón lá cho người đến học"
      labelStartFrac={fLabel}
      focus={{ x: 0.5, y: 0.46 }}
    >
      <Halo sf={fHalo} cx={960} cy={470} r={150} />
      <SourceTag text="Minh họa tái tạo — vị sư trong am, Hồi ba" bottom={44} />
    </InkImageScene>
  );
};

/** sc028 (s14) — QUOTE TRAO TẶNG: nguyên văn; «Linh thiêng» accent; bóng khố callback cuối. */
export const Sc028: React.FC<SceneProps> = () => {
  const A = useA();
  const fQ = A("mà tôi muốn đọc nguyên văn");
  const fKho = A("một chiếc khố");
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.30)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 150px" }}>
        <LegendFrame label="TRÍCH NGUYÊN VĂN">
          <div data-cue="sc028-quote" style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 48, lineHeight: 1.5, color: C.white, maxWidth: 1460 }}>
            «Sư bèn tặng Đồng Tử một cây trượng và một chiếc nón mà nói rằng: '
            <span style={{ color: C.amber }}>Linh thiêng</span> ở những vật này đây'. Đồng Tử trở về,
            giảng đạo lại cho Tiên Dung.»
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.amber, marginTop: 26, letterSpacing: 1 }}>
            — Lĩnh Nam chích quái, bản dịch
          </div>
        </LegendFrame>
        {/* bóng nhỏ chiếc khố mực nhạt — callback vật đầu tiên */}
        <Reveal startFrac={fKho} dy={16}>
          <div data-cue="sc028-kho" style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 26, background: "rgba(20,17,13,0.78)", padding: "16px 32px", borderRadius: 10 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" opacity="0.55">
              <path d="M 14 22 Q 32 12 50 22 L 46 44 Q 32 52 18 44 Z" stroke={C.cream} strokeWidth="3" strokeDasharray="5 4" />
              <line x1="12" y1="22" x2="52" y2="22" stroke={C.cream} strokeWidth="3" />
            </svg>
            <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream }}>
              Nhớ lại vật đầu tiên của tập — <span style={{ color: C.amber }}>một chiếc khố</span>
            </div>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc029 (s14) — GẬY NÓN TRAO TAY: ảnh gen + glow hai vật + chips «để tựa / để che». */
export const Sc029: React.FC<SceneProps> = () => {
  const A = useA();
  const fLabel = A("một cây gậy để tựa,");
  const fGay = A("một cây gậy để tựa");
  const fNon = A("một chiếc nón để che");
  return (
    <InkImageScene
      src="img-08-gay-non.png"
      label="Gậy để tựa, nón để che"
      sublabel="Không phải vàng, không phải ruộng"
      labelStartFrac={fLabel}
      focus={{ x: 0.5, y: 0.46 }}
    >
      <Halo sf={fGay} cx={820} cy={520} r={90} />
      <Halo sf={fNon} cx={1120} cy={500} r={100} />
      <Reveal startFrac={fGay}>
        <div data-cue="sc029-chip-gay" style={{ position: "absolute", left: 130, top: 700 }}>
          <Chip color={C.amber}>gậy — «để tựa»</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={fNon}>
        <div data-cue="sc029-chip-non" style={{ position: "absolute", right: 130, top: 690 }}>
          <Chip color={C.amber}>nón — «để che»</Chip>
        </div>
      </Reveal>
      <SourceTag text="Minh họa tái tạo — trao trượng và nón, núi Quỳnh Vi" bottom={44} />
    </InkImageScene>
  );
};

/** sc030 (s15) — BA TRANG — BA TÊN SƯ: ba trang giấy lệch lớp, chữ teal, staggered theo đọc. */
export const Sc030: React.FC<SceneProps> = () => {
  const A = useA();
  const fTitle = A("mở ba cuốn ra");
  const fP1 = A("gọi vị sư là Phu Quang");
  const fP2 = A("Phật-Quang", 1);
  const fP3 = A("Ngưỡng Quang");
  const page = (
    id: string,
    sf: number,
    rot: number,
    x: number,
    y: number,
    name: string,
    place: string,
    src: string,
  ) => (
    <SpringPop key={id} startFrac={sf} from={0.92} style={{ position: "absolute", left: x, top: y }}>
      <div
        data-cue={id}
        style={{
          width: 560,
          padding: "38px 44px 34px",
          background: "rgba(20,17,13,0.90)",
          border: `2px solid ${C.border}`,
          borderRadius: 8,
          transform: `rotate(${rot}deg)`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 44, color: C.teal, lineHeight: 1.2 }}>{name}</div>
        <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 12, lineHeight: 1.4 }}>{place}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 24, color: C.mute, marginTop: 16, letterSpacing: 0.5 }}>{src}</div>
      </div>
    </SpringPop>
  );
  return (
    <Paper variant="teal">
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.26)" }} />
      <div data-cue="sc030-title" style={{ position: "absolute", left: 160, top: 84 }}>
        <SceneTitle
          eyebrow="ĐỐI CHIẾU BA BẢN KỂ"
          title="Ba trang — ba câu trả lời cho một câu hỏi nhỏ"
          startFrac={fTitle}
          titleSize={64}
          maxWidth={1500}
          accent={C.teal}
        />
      </div>
      {page("sc030-p1", fP1, -3, 170, 380, "Phu Quang", "núi Quỳnh Vi", "Lĩnh Nam chích quái · bản dịch")}
      {page("sc030-p2", fP2, 1.5, 700, 440, "Phật-Quang", "núi Quình-lãng", "Phan Kế Bính · bản chép")}
      {page("sc030-p3", fP3, 4, 1210, 390, "Ngưỡng Quang", "núi Quỳnh Viên", "website bảo tàng · bài dẫn")}
      <SourceTag text="Đặt ba trang cạnh nhau — không bản nào tuyên bố mình nguyên gốc duy nhất" bottom={44} />
    </Paper>
  );
};

/** sc031 (s15) — BA TÊN MỘT SƯ: kinetic text — ba tên stroke-in theo nhịp; dòng dưới mực nhạt. */
export const Sc031: React.FC<SceneProps> = () => {
  const A = useA();
  const fNames = A("Phu Quang — Phật-Quang — Ngưỡng Quang");
  const fSub = A("Ba cái tên, ba bản kể");
  const f1 = A("Phu Quang", 2);
  const f2 = A("Phật-Quang", 3);
  const f3 = A("Ngưỡng Quang", 2);
  const name = (id: string, sf: number, text: string, color: string): React.ReactNode => (
    <div key={id} data-cue={id} style={{ position: "relative", display: "inline-block" }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 92, color, lineHeight: 1.15 }}>
        {text}
      </div>
      <svg
        width="100%"
        height="14"
        viewBox="0 0 300 14"
        preserveAspectRatio="none"
        style={{ position: "absolute", left: 0, bottom: -16, width: "100%", height: 14, overflow: "visible" }}
      >
        <InkPath d="M 4 8 Q 150 2 296 8" startFrac={sf} endFrac={sf + 0.03} stroke={color} strokeWidth={4} />
      </svg>
    </div>
  );
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.32)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 54 }}>
        <div data-cue="sc031-row" style={{ display: "flex", alignItems: "center", gap: 44, background: "rgba(20,17,13,0.80)", padding: "50px 70px", borderRadius: 14 }}>
          {name("sc031-n1", f1, "Phu Quang", C.amber)}
          <div style={{ fontFamily: FONT.display, fontSize: 72, color: C.mute }}>—</div>
          {name("sc031-n2", f2, "Phật-Quang", C.teal)}
          <div style={{ fontFamily: FONT.display, fontSize: 72, color: C.mute }}>—</div>
          {name("sc031-n3", f3, "Ngưỡng Quang", C.cream)}
        </div>
        <Reveal startFrac={fSub}>
          <div data-cue="sc031-sub" style={{ fontFamily: FONT.body, fontSize: 40, letterSpacing: 3, color: C.mute, textAlign: "center" }}>
            Ba cái tên, ba bản kể
          </div>
        </Reveal>
        <Reveal startFrac={fNames}>
          <div data-cue="sc031-note" style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, textAlign: "center", maxWidth: 1400 }}>
            Chép đi, chép lại — qua nhiều bàn tay
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc032 (s16) — DẤU TAY NGƯỜI CHÉP: trang giấy phóng to, ba dấu tay stamp theo nhịp đọc. */
export const Sc032: React.FC<SceneProps> = () => {
  const A = useA();
  const fTitle = A("tôi thấy dấu tay");
  const fS1 = A("một lần người chép");
  const fS2 = A("cách gọi một cái tên");
  const fS3 = A("cách ghi một quả núi");
  const { frame, dur } = useFrac();
  const stamp = (sf: number): number => {
    const el = frame - sf * dur;
    if (el <= 0) return 0;
    const t = cl(el / 6);
    return t * (0.62 + 0.06 * Math.sin(el / 10));
  };
  const Hand: React.FC<{ id: string; sf: number; x: number; y: number; rot: number }> = ({ id, sf, x, y, rot }) => {
    const o = stamp(sf);
    if (o <= 0) return null;
    return (
      <g data-cue={id} transform={`translate(${x} ${y}) rotate(${rot}) scale(${1.3 - 0.3 * cl((frame - sf * dur) / 6)})`} opacity={o}>
        <ellipse cx="0" cy="-34" rx="38" ry="46" fill="none" stroke={C.cream} strokeWidth="4" />
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i - 2) * 0.42;
          return (
            <line
              key={i}
              x1={Math.sin(a) * 26}
              y1={-64 - Math.cos(a) * 6}
              x2={Math.sin(a) * 26}
              y2={-108 - (2 - Math.abs(i - 2)) * 6}
              stroke={C.cream}
              strokeWidth="9"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    );
  };
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,6,0.30)" }} />
      <div data-cue="sc032-title" style={{ position: "absolute", left: 160, top: 84 }}>
        <SceneTitle
          eyebrow="HỒI BA · CÁCH ĐỌC THẬN TRỌNG"
          title="Không phải nhầm lẫn — là dấu tay người kể"
          startFrac={fTitle}
          titleSize={62}
          maxWidth={1500}
        />
      </div>
      {/* trang giấy phóng to */}
      <div
        data-cue="sc032-page"
        style={{
          position: "absolute",
          left: 300,
          top: 320,
          width: 1320,
          height: 560,
          background: "rgba(20,17,13,0.88)",
          border: `2px solid ${C.border}`,
          borderRadius: 10,
          padding: "44px 60px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: C.mute, lineHeight: 1.7 }}>
          …truyền phép cho Đồng Tử…
        </div>
        <svg width="100%" height="100%" viewBox="0 0 1200 460" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Hand id="sc032-hand1" sf={fS1} x={190} y={330} rot={-12} />
          <Hand id="sc032-hand2" sf={fS2} x={600} y={210} rot={8} />
          <Hand id="sc032-hand3" sf={fS3} x={980} y={340} rot={-4} />
        </svg>
      </div>
      <SourceTag text="Mỗi lần chép lại — một lần in dấu tay lên truyện" bottom={44} />
    </Paper>
  );
};
