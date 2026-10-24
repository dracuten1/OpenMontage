// S2E02 thanh-giong — scenes group "a" (compose worker, spec_a.json).
// Speech-lock: A("từ") trả frac thô theo scene; mọi beat bắn đúng nhịp đọc.
import * as React from "react";
import { Img } from "remotion";
import {
  Paper,
  Reveal,
  SpringPop,
  InkDraw,
  InkPath,
  circleD,
  SourceTag,
  Chip,
  LegendFrame,
  LabBadge,
  DossierBadge,
  SceneTitle,
  TextCard,
  plateSrc,
  InkImageScene,
  Lamp,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const cl = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
// frame cục bộ tính từ anchor (frac) — cho math tự viết (pulse, typewriter).
const af = (frame: number, dur: number, f: number): number => frame - f * dur;
const twF = (frame: number, dur: number, startFrac: number, len: number, speed = 0.5): number => {
  const elapsed = frame - startFrac * dur;
  if (elapsed <= 0) return 0;
  return Math.min(len, Math.floor(elapsed * speed));
};

/** sc001 (s01) — MỞ TẬP: câu hỏi mở + từng vật được xin. */
export const Sc001: React.FC<SceneProps> = () => {
  const A = useA();
  const fHook = A("Người cứu nước");
  const fSilent = A("chưa từng nói một lời");
  const fArms = A("Mà là vũ khí");
  const fGuom = A("Một thanh gươm");
  const fNgua = A("Một con ngựa");
  const fRoi = A("Một roi sắt");
  const obj = (id: string, sf: number, left: number, cap: string, glyph: React.ReactNode) => (
    <div key={id} data-cue={id} style={{ position: "absolute", left, top: 742, width: 300, textAlign: "center" }}>
      <Reveal startFrac={sf} dy={30}>
        <div style={{ width: 128, margin: "0 auto" }}>{glyph}</div>
        <div style={{ marginTop: 20, fontFamily: FONT.body, fontSize: 34, letterSpacing: 3, color: C.mute }}>{cap}</div>
      </Reveal>
    </div>
  );
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,12,16,0.35)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.1, background: "radial-gradient(60% 40% at 50% 36%, #d8c9a3 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", left: 160, right: 160, top: 200, textAlign: "center" }}>
        <Reveal startFrac={fHook}>
          <h1 data-cue="sc001-title" style={{ margin: "30px 0 0", fontFamily: FONT.display, fontWeight: 700, fontSize: 76, lineHeight: 1.25, color: C.cream }}>
            Thánh Gióng: vì sao người cứu nước
            <br />
            lại là <span style={{ color: C.amber }}>một đứa trẻ</span>?
          </h1>
        </Reveal>
        <Reveal startFrac={fSilent}>
          <div data-cue="sc001-silence" style={{ marginTop: 36, fontFamily: FONT.body, fontSize: 36, color: C.mute }}>chưa từng nói một lời.</div>
        </Reveal>
        <Reveal startFrac={fArms}>
          <div data-cue="sc001-arms" style={{ marginTop: 28, fontFamily: FONT.body, fontSize: 40, letterSpacing: 3, color: C.amber }}>Mà là vũ khí.</div>
        </Reveal>
      </div>
      {obj("sc001-sword", fGuom, 250, "Một thanh gươm.",
        <svg width="128" height="128" viewBox="0 0 128 128" fill="none">
          <path d="M64 8 L80 30 L66 86 L52 86 L48 30 Z" stroke={C.cream} strokeWidth="5" />
          <path d="M40 88 L86 88 M64 88 L64 116" stroke={C.amber} strokeWidth="6" strokeLinecap="round" />
          <circle cx="64" cy="120" r="5" fill={C.amber} />
        </svg>
      )}
      {obj("sc001-horse", fNgua, 810, "Một con ngựa.",
        <svg width="128" height="128" viewBox="0 0 128 128" fill="none">
          <path d="M26 108 C22 70 36 42 64 36 L74 12 L90 40 C108 54 112 82 106 108" stroke={C.cream} strokeWidth="6" strokeLinejoin="round" />
          <path d="M42 108 L42 122 M92 108 L92 122 M64 58 L76 52" stroke={C.amber} strokeWidth="5" />
        </svg>
      )}
      {obj("sc001-rod", fRoi, 1370, "Một roi sắt.",
        <svg width="128" height="128" viewBox="0 0 128 128" fill="none">
          <path d="M24 112 C44 82 68 50 106 28" stroke={C.cream} strokeWidth="7" strokeLinecap="round" />
          <path d="M106 28 C120 18 126 36 114 44" stroke={C.amber} strokeWidth="5" />
        </svg>
      )}
    </Paper>
  );
};

/** sc007 (s03) — Tiếng nói đầu + callback núi Hùng (f07, 2 giây, không chữ). */
export const Sc007: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fSuGia = A("bảo mẹ mời người sứ giả vào nhà");
  const fHung = A("bên những ngôi đền cổ trên núi Hùng");
  const el = af(frame, dur, fHung);
  const f07o = cl(el / 10) * (1 - cl((el - 55) / 12));
  const belly = 1 + 0.3 * cl((frame / dur - 0.08) / 0.35);
  const panel: React.CSSProperties = {
    position: "absolute",
    top: 265,
    width: 790,
    height: 660,
    border: `2px solid ${C.border}`,
    borderRadius: 18,
    overflow: "hidden",
  };
  return (
    <Paper>
      <SceneTitle
        startFrac={fSuGia}
        eyebrow="SÁCH GIÁO KHOA · ĐỜI HÙNG VƯƠNG 6"
        title="Tiếng nói đầu đời"
        subtitle="bảo mẹ mời người sứ giả vào nhà"
      />
      <div style={{ ...panel, left: 130, background: "rgba(42,36,28,0.6)", transform: `translateX(${(frame / dur) * 14}px)` }}>
        <svg width="790" height="660" viewBox="0 0 790 660" fill="none">
          <path d="M150 560 L560 560 M180 560 L180 610 M530 560 L530 610" stroke={C.cream} strokeWidth="6" />
          <circle cx="285" cy="432" r="27" fill={C.cream} />
          <path d="M247 560 C247 486 263 462 285 462 C307 462 323 486 323 560 Z" fill={C.cream} />
          <ellipse cx="287" cy="512" rx={26 * belly} ry={20 * belly} fill={C.cream} opacity="0.001" />
          <InkPath
            d="M330 128 C330 66 412 36 505 36 C598 36 680 66 680 128 C680 190 598 220 505 220 C412 220 330 190 330 128 M452 214 L416 262 L492 220"
            startFrac={fSuGia}
            endFrac={fSuGia + 40 / dur}
            stroke={C.cream}
            strokeWidth={5}
          />
        </svg>
        <SpringPop startFrac={fSuGia + 42 / dur} from={0.6}>
          <svg width="220" height="170" viewBox="0 0 220 170" fill="none" style={{ position: "absolute", left: 395, top: 92 }}>
            <circle cx="110" cy="38" r="16" fill={C.teal} />
            <path d="M88 58 L132 58 L140 108 L80 108 Z" fill={C.teal} opacity="0.85" />
            <path d="M58 118 L162 30" stroke={C.teal} strokeWidth="5" strokeLinecap="round" />
          </svg>
        </SpringPop>
        <Reveal startFrac={fSuGia}>
          <div
            data-cue="sc007-messenger"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 22,
              textAlign: "center",
              fontFamily: FONT.body,
              fontSize: 26,
              letterSpacing: 4,
              color: C.mute,
            }}
          >
            MỜI NGƯỜI SỨ GIẢ VÀO NHÀ
          </div>
        </Reveal>
      </div>
      <div
        style={{
          ...panel,
          left: 1000,
          background: "linear-gradient(180deg, rgba(127,154,160,0.10), rgba(58,80,84,0.30))",
          transform: `translateX(${(frame / dur) * 26}px)`,
        }}
      >
        <svg width="790" height="660" viewBox="0 0 790 660" fill="none">
          <ellipse cx={300 + 40 * Math.sin(frame * 0.01)} cy="300" rx="270" ry="70" fill="#7f9aa0" opacity="0.18" />
          <ellipse cx={480 + 55 * Math.sin(frame * 0.013 + 3)} cy="480" rx="300" ry="80" fill="#7f9aa0" opacity="0.12" />
        </svg>
        <Img
          data-cue="sc007-f07"
          src={plateSrc("f07-hung-vuong.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: f07o,
            filter: "grayscale(0.85) contrast(1.05) brightness(0.8)",
          }}
        />
      </div>
    </Paper>
  );
};

/** sc013 (s05) — Quote nguyên văn: cả tuổi thơ một câu. */
export const Sc013: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fQ = A("Hơn ba tuổi, ăn uống, to béo, không biết nói cười");
  const fIm = A("im lặng");
  const fSach = A("Sách chép nhà ông");
  const lines = [
    "„Hơn ba tuổi,",
    "ăn uống,",
    "to béo,",
    "không biết nói cười.”",
  ];
  return (
    <Paper>
      <DossierBadge text="CHÍNH SỬ · ĐẠI VIỆT SỬ KÝ TOÀN THƯ · 1479/1697" />
      <div style={{ position: "absolute", left: 160, right: 160, top: 250, textAlign: "center" }}>
        <Reveal startFrac={fQ}>
          <div data-cue="sc013-quote" style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 84, lineHeight: 1.34, color: C.cream }}>
            {lines.map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
        </Reveal>
        <div style={{ marginTop: 26, fontFamily: FONT.body, fontSize: 30, color: C.mute }}>
          toàn bộ tuổi thơ của người cứu nước — gói trong một câu
        </div>
      </div>
      <Reveal startFrac={fIm}>
        <div data-cue="sc013-silent" style={{ position: "absolute", left: 0, right: 0, top: 772, display: "flex", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: FONT.body, fontSize: 44, color: C.mute }}>ăn, to béo, và </span>
            <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.cream }}>im lặng</span>
            <InkDraw
              d="M8 10 C64 2 128 16 232 6"
              viewBox="0 0 240 20"
              width={240}
              height={20}
              startFrac={fIm}
              endFrac={fIm + 30 / dur}
              stroke={C.amber}
              strokeWidth={5}
              style={{ display: "block", margin: "2px auto 0" }}
            />
          </div>
        </div>
      </Reveal>
      <div style={{ position: "absolute", right: 230, bottom: 170, transform: "rotate(-12deg)" }}>
        <SpringPop startFrac={fSach} from={0.85}>
          <div data-cue="sc013-stamp" style={{ position: "relative", width: 132, height: 132 }}>
            <InkDraw
              d={circleD(66, 66, 54)}
              viewBox="0 0 132 132"
              width={132}
              height={132}
              startFrac={fSach}
              endFrac={fSach + 20 / dur}
              stroke={C.lampRed}
              strokeWidth={5}
              style={{ position: "absolute", inset: 0 }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: 3,
                color: C.lampRed,
                textAlign: "center",
              }}
            >
              SÁCH CHÉP
            </div>
          </div>
        </SpringPop>
      </div>
      <SourceTag text="Đại Việt sử ký toàn thư · bản Chính hiệu 1697" />
    </Paper>
  );
};

/** sc019 (s07) — Hai cách mở truyện: split trang chính sử / trang truyền kỳ. */
export const Sc019: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac(); const D = dur;
  const fPha = A("ra phá giặc cho nước");
  const fHen = A("lời hẹn của thần");
  const cap = "— lời hẹn của thần —";
  const nCap = twF(frame, D, fHen, cap.length, 0.45);
  const card: React.CSSProperties = {
    position: "absolute",
    top: 215,
    width: 800,
    height: 640,
    borderRadius: 6,
    padding: "30px 40px",
  };
  return (
    <Paper>
      <SceneTitle startFrac={4 / D} eyebrow="HỒI MỘT · BA TRANG SÁCH" title="Hai cách mở truyện" />
      <div style={{ position: "absolute", left: 958, top: 220, height: 630, borderLeft: `2px dashed ${C.border}` }} />
      <Reveal startFrac={6 / D}>
        <div style={{ ...card, left: 120, background: "#e6dbc4", border: "2px solid #5c5142" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, color: "#6b5b46" }}>
            1479<span style={{ fontSize: 34, color: "#8a7a62" }}> / 1697</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 27, letterSpacing: 3, color: "#8a7a62", marginTop: 6 }}>
            ĐẠI VIỆT SỬ KÝ TOÀN THƯ — CHÍNH SỬ
          </div>
          <svg width="700" height="330" viewBox="0 0 700 330" fill="none" style={{ marginTop: 18 }}>
            <path d="M70 288 L640 288 M110 288 L110 318 M600 288 L600 318" stroke="#5c5142" strokeWidth="6" />
            <ellipse cx="400" cy="222" rx="168" ry="66" fill="#5c5142" opacity="0.9" />
            <circle cx="192" cy="212" r="32" fill="#5c5142" />
            <path d="M176 206 Q186 200 196 206" stroke="#e6dbc4" strokeWidth="4" fill="none" />
          </svg>
          <Reveal startFrac={70 / D}>
            <div style={{ fontFamily: FONT.body, fontSize: 30, fontStyle: "italic", color: "#5c5142", marginTop: 22 }}>
              truyện bắt đầu từ một cái bụng béo nằm im
            </div>
          </Reveal>
        </div>
      </Reveal>
      <Reveal startFrac={6 / D}>
        <div style={{ ...card, left: 1000, background: "#f2e2c2", border: "2px solid #8a5a2a" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, color: "#8a5a2a" }}>1492</div>
          <div style={{ fontFamily: FONT.body, fontSize: 27, letterSpacing: 3, color: "#a0754a", marginTop: 6 }}>
            LĨNH NAM CHÍCH QUÁI — TRUYỀN KỲ
          </div>
          <svg width="700" height="330" viewBox="0 0 700 330" fill="none" style={{ marginTop: 18 }}>
            <circle cx="560" cy="70" r="30" stroke="#8a5a2a" strokeWidth="4" fill="none" />
            <circle cx="168" cy="120" r="24" fill="#8a5a2a" />
            <path d="M126 288 C126 196 150 168 180 152 C214 136 236 176 236 288" fill="#8a5a2a" opacity="0.92" />
            <path d="M120 288 C180 262 260 262 320 288" stroke="#8a5a2a" strokeWidth="6" fill="none" />
            <path d="M300 96 L420 96 M360 96 L360 30" stroke="#a0754a" strokeWidth="5" />
          </svg>
          <Reveal startFrac={fPha}>
            <div style={{ fontFamily: FONT.body, fontSize: 31, fontStyle: "italic", color: "#7a4a1e", marginTop: 16 }}>
              „khi giặc đến, cứ bảo đứa bé ấy ra phá giặc cho nước.”
            </div>
          </Reveal>
          <Reveal startFrac={fPha + 90 / D}>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: "#a0754a", marginTop: 10 }}>
              trước khi có đứa trẻ — đã có một lời tiên tri
            </div>
          </Reveal>
        </div>
      </Reveal>
      {nCap > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 912,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 62,
            color: C.warn,
          }}
        >
          {cap.slice(0, nCap)}
        </div>
      )}
    </Paper>
  );
};

/** sc025 (s09) — Ba trang: tiếng gươm nhỏ dần + 5 con dấu không đổi. */
export const Sc025: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac(); const D = dur;
  const fG = A("tiếng gươm nhỏ dần");
  const fNam = A("một đứa trẻ, một tiếng nói đầu tiên");
  const fChip = Math.max(0.02, fG - 280 / D); // ≈ câu gia phong 1313 đọc trước đó
  const pages = [
    { year: "1479", name: "ĐẠI VIỆT SỬ KÝ TOÀN THƯ", sub: "bản 1697", w: 520, h: 400, sw: 1.0, sf: 10 / D },
    { year: "1492", name: "LĨNH NAM CHÍCH QUÁI", sub: "hiệu chỉnh", w: 470, h: 360, sw: 0.6, sf: 34 / D },
    { year: "1329", name: "VIỆT ĐIỆN U LINH TẬP", sub: "biên tập", w: 420, h: 320, sw: 0.25, sf: 58 / D },
  ];
  const seals: Array<[string, number, React.ReactNode]> = [
    ["đứa trẻ", 70, <circle key="a" cx="22" cy="13" r="7" stroke={C.lampRed} strokeWidth="3.5" fill="none" />],
    ["tiếng nói", 94, <path key="b" d="M12 14 Q8 22 12 30 M22 10 Q15 22 22 34 M32 14 Q28 22 32 30" stroke={C.lampRed} strokeWidth="3.5" fill="none" />],
    ["xin vũ khí", 118, <path key="c" d="M22 4 L22 30 M13 30 L31 30 M22 30 L22 40" stroke={C.lampRed} strokeWidth="3.5" fill="none" />],
    ["bay về trời", 142, <path key="d" d="M22 40 L22 8 M10 20 L22 8 L34 20" stroke={C.lampRed} strokeWidth="3.5" fill="none" />],
    ["ngôi đền", 166, <path key="e" d="M6 26 C14 8 30 8 38 26 M13 26 L13 38 M31 26 L31 38 M22 20 L22 38" stroke={C.lampRed} strokeWidth="3.5" fill="none" />],
  ];
  return (
    <Paper>
      <LabBadge text="SO SÁNH BA BẢN CHÉP" />
      <div style={{ position: "absolute", left: 210, top: 126 }}>
        <Reveal startFrac={fChip}>
          <Chip color={C.teal}>1313 · XUNG THIÊN DŨNG LIỆT CHIÊU ỨNG UY TÍN ĐẠI VƯƠNG</Chip>
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 230,
          width: 1700,
          height: 430,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          transform: `perspective(1400px) rotateX(6deg) translateY(${26 * (1 - cl((frame / D) * 1.6))}px)`,
        }}
      >
        {pages.map((p, i) => (
          <Reveal key={p.year} startFrac={p.sf} dy={36}>
            <div
              style={{
                width: p.w,
                height: p.h,
                background: "#e6dbc4",
                border: `2px solid ${C.cream}`,
                borderRadius: 4,
                padding: "22px 26px",
              }}
            >
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 88, color: "#3d3529", lineHeight: 1.05 }}>
                {p.year}
              </div>
              <div style={{ fontFamily: FONT.body, fontSize: 24, letterSpacing: 2, color: "#6b5b46", marginTop: 4 }}>
                {p.name} · {p.sub}
              </div>
              <Reveal startFrac={fG + (i * 14) / D}>
                <div style={{ marginTop: 18, opacity: [1, 0.72, 0.45][i] }}>
                  <svg
                    width="230"
                    height="54"
                    viewBox="0 0 230 54"
                    fill="none"
                    style={{ transform: `scaleX(${p.sw})`, transformOrigin: "left center" }}
                  >
                    <path
                      d="M10 10 L160 10 M160 4 L160 16 M160 10 L200 10 M200 10 L220 10"
                      stroke="#3d3529"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </Reveal>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal startFrac={fG + 40 / D}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 702,
            textAlign: "center",
            fontFamily: FONT.body,
            fontSize: 30,
            letterSpacing: 2,
            color: C.mute,
          }}
        >
          ← đọc lùi theo năm · tiếng gươm nhỏ dần theo năm tháng
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 150, right: 150, top: 790 }}>
        <LegendFrame label="NĂM CON DẤU GIỮ NGUYÊN QUA CẢ BA TRANG">
          <svg width="1620" height="10" viewBox="0 0 1620 10" fill="none" style={{ display: "block", margin: "0 auto 10px" }}>
            <path d="M0 5 L1620 5" stroke={C.mute} strokeWidth="2" strokeDasharray="10 12" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start" }}>
            {seals.map(([label, off, glyph]) => (
              <div key={label} style={{ textAlign: "center", width: 240 }}>
                <SpringPop startFrac={fNam + off / D} from={0.7}>
                  <div
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: "50%",
                      border: `3px solid ${C.lampRed}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      background: "rgba(42,36,28,0.6)",
                    }}
                  >
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                      {glyph}
                    </svg>
                  </div>
                </SpringPop>
                <div style={{ marginTop: 10, fontFamily: FONT.body, fontSize: 27, color: C.cream }}>{label}</div>
              </div>
            ))}
          </div>
        </LegendFrame>
      </div>
    </Paper>
  );
};

/** sc031 (s12) — Xuất trận: tráng sĩ giáp xanh rêu, kiếm sắt LNCQ. */
export const Sc031: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac(); const D = dur;
  const fGiap = A("giáp sắt xanh rêu");
  const fLua = A("phun lửa đỏ từ miệng");
  const fKiem = fLua + 55 / D;
  const eGiap = af(frame, D, fGiap);
  const eLua = af(frame, D, fLua);
  const glint = cl(eGiap / 4) * (1 - cl((eGiap - 10) / 16));
  const fire = cl(eLua / 6);
  const fireS = 1 + 0.14 * Math.sin(Math.max(0, eLua) * 0.4);
  return (
    <InkImageScene
      src={plateSrc("img-05-giong-trang-si-v2.png")}
      label="XUẤT TRẬN · PHÙ ĐỔNG"
      sublabel="người tráng sĩ — ngựa sắt đen, kiếm sắt trên tay"
      focus={{ x: 0.5, y: 0.45 }}
    >
      <div
        style={{
          position: "absolute",
          left: 1120,
          top: 290,
          width: 160,
          height: 7,
          background: "#fff8dc",
          opacity: 0.95 * glint,
          transform: "rotate(-24deg)",
          filter: "blur(1px)",
        }}
      />
      <div style={{ position: "absolute", left: 90, top: 132 }}>
        <Reveal startFrac={fGiap}>
          <Chip color={C.amber}>giáp sắt xanh rêu</Chip>
        </Reveal>
      </div>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" style={{ position: "absolute", inset: 0 }}>
        <g opacity={fire}>
          <g transform={`translate(640 715) scale(${fireS})`}>
            <path d="M0 0 C-38 -34 -30 -86 6 -128 C10 -80 34 -62 30 -24 C28 -6 16 6 0 0 Z" fill="#ff5a2a" opacity="0.92" />
            <path d="M8 -10 C-14 -36 -8 -74 14 -100 C16 -64 30 -50 26 -26 Z" fill="#ffb347" opacity="0.9" />
            <path d="M12 -20 C2 -38 6 -58 18 -74 C18 -52 26 -44 22 -30 Z" fill="#ffe9a8" />
          </g>
          <g transform={`translate(560 745) scale(${0.8 * fireS})`}>
            <path d="M0 0 C-30 -26 -24 -66 4 -98 C8 -60 26 -46 22 -18 Z" fill="#ff5a2a" opacity="0.8" />
            <path d="M6 -8 C-10 -28 -6 -56 12 -76 C14 -48 24 -38 20 -20 Z" fill="#ffb347" opacity="0.85" />
          </g>
        </g>
      </svg>
      <div style={{ position: "absolute", right: 90, top: 132 }}>
        <Reveal startFrac={fKiem}>
          <Chip color={C.amber}>kiếm sắt trên tay</Chip>
        </Reveal>
      </div>
    </InkImageScene>
  );
};

/** sc037 (s14) — Không lễ mừng công: cởi áo bay về trời. */
export const Sc037: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac(); const D = dur;
  const fAo = A("cởi áo bào để lại");
  const fBay = A("cưỡi ngựa bay lên Trời");
  const eBay = af(frame, D, fBay);
  const beamO = cl(eBay / 10) * 0.55;
  const beamY = 140 * (1 - cl(eBay / 70));
  const fFold = fBay + 80 / D;
  return (
    <InkImageScene
      src={plateSrc("img-12-bay-ve-troi.png")}
      label="KẾT TRẬN · CHÂN NÚI NINH SÓC"
      sublabel="không lễ mừng công — áo để lại, người bay lên"
      focus={{ x: 0.52, y: 0.4 }}
    >
      <div style={{ position: "absolute", left: 100, top: 150, width: 640 }}>
        <TextCard
          startFrac={fAo}
          eyebrow="TRUYỀN KỲ CHÉP"
          title="áo bào để lại trên tảng đá"
          subtitle="tháo giáp · cởi áo bào — rồi bay lên trời · không cảnh tử trận · không ngôi báu"
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 1310,
          top: 110,
          width: 92,
          height: 660,
          borderRadius: 46,
          background:
            "linear-gradient(to top, transparent 5%, rgba(255,214,140,0.5) 60%, rgba(255,240,200,0.75) 100%)",
          opacity: beamO,
          transform: `translateY(${beamY}px)`,
          filter: "blur(2px)",
        }}
      />
      <Reveal startFrac={fFold}>
        <div
          style={{
            position: "absolute",
            left: 72,
            bottom: 64,
            width: 132,
            height: 172,
            background: "#e6dbc4",
            border: `2px solid ${C.cream}`,
            borderRadius: 3,
            transform: "rotate(-10deg)",
          }}
        >
          <div style={{ margin: 16, height: 8, background: C.mute, opacity: 0.5 }} />
          <div style={{ margin: "10px 16px 0", height: 4, background: C.mute, opacity: 0.4 }} />
        </div>
      </Reveal>
      <Reveal startFrac={fFold + 8 / D}>
        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 64,
            width: 132,
            height: 172,
            background: "#e6dbc4",
            border: `2px solid ${C.cream}`,
            borderRadius: 3,
            transform: "rotate(10deg)",
          }}
        >
          <div style={{ margin: 16, height: 8, background: C.mute, opacity: 0.5 }} />
          <div style={{ margin: "10px 16px 0", height: 4, background: C.mute, opacity: 0.4 }} />
        </div>
      </Reveal>
      <SourceTag text="truyền kỳ chép — cả hai trang kết thúc bằng cùng một hình ảnh" />
    </InkImageScene>
  );
};

/** sc043 (s16) — Hai mùa hai màu: đền Phù Đổng tháng Tư ↔ đền Sóc tháng Giêng. */
export const Sc043: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac(); const D = dur;
  const fDinh = A("đền Phù Đổng, đồng bằng");
  const fGu = A("giữ tiếng gươm");
  const cap = "nơi này giữ tiếng gươm, nơi kia giữ đêm cuối";
  const nCap = twF(frame, D, fGu, cap.length, 0.5);
  const half: React.CSSProperties = { position: "absolute", top: 0, width: 960, height: 1080 };
  return (
    <Paper>
      <Reveal startFrac={0.02}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 46,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 6,
            color: C.mute,
          }}
        >
          HAI NGÔI ĐỀN — CÙNG THỜ MỘT NGƯỜI
        </div>
      </Reveal>
      <div style={{ ...half, left: 0, background: "linear-gradient(180deg, rgba(217,164,65,0.16), rgba(217,164,65,0.05))" }}>
        <svg width="960" height="1080" viewBox="0 0 960 1080" fill="none">
          <circle cx="180" cy="180" r="46" fill={C.amber} opacity="0.75" />
          <path d="M60 860 L900 860" stroke={C.cream} strokeWidth="6" />
          <path d="M300 860 L300 700 M480 860 L480 700 M660 860 L660 700" stroke={C.cream} strokeWidth="8" />
          <path d="M200 712 C360 560 600 560 760 712 Z" fill={C.cream} />
          <path d="M250 560 C370 448 590 448 710 560 Z" fill={C.cream} opacity="0.88" />
          <path d="M60 860 C260 838 700 838 900 860" stroke={C.cream} strokeWidth="4" opacity="0.5" fill="none" />
        </svg>
        <Reveal startFrac={fDinh}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 916, textAlign: "center" }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.cream }}>ĐỀN PHÙ ĐỔNG</div>
            <div style={{ fontFamily: FONT.body, fontSize: 30, letterSpacing: 4, color: C.mute, marginTop: 8 }}>
              ĐỒNG BẰNG · BÃI RỘNG · THÁNG TƯ
            </div>
          </div>
        </Reveal>
      </div>
      <div style={{ ...half, left: 960, background: "linear-gradient(180deg, rgba(63,90,94,0.42), rgba(63,90,94,0.20))" }}>
        <svg width="960" height="1080" viewBox="0 0 960 1080" fill="none">
          <circle cx="760" cy="180" r="30" fill={C.cream} opacity="0.7" />
          <path d="M0 900 L470 300 L960 900 Z" fill="#3f5a5e" opacity="0.55" />
          <path d="M370 480 L470 380 L570 480" stroke={C.cream} strokeWidth="8" fill="none" />
          <path d="M396 480 L396 540 L544 540 L544 480" stroke={C.cream} strokeWidth="7" fill="none" />
          <ellipse cx={340 + 46 * Math.sin(frame * 0.009)} cy="640" rx="300" ry="52" fill="#cfe0e2" opacity="0.16" />
          <ellipse cx={560 + 60 * Math.sin(frame * 0.012 + 2)} cy="780" rx="340" ry="60" fill="#cfe0e2" opacity="0.12" />
        </svg>
        <Reveal startFrac={fDinh + 40 / D}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 916, textAlign: "center" }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.teal }}>ĐỀN SÓC</div>
            <div style={{ fontFamily: FONT.body, fontSize: 30, letterSpacing: 4, color: C.mute, marginTop: 8 }}>
              TRÊN NÚI · LÀNG VỆ LINH · THÁNG GIÊNG
            </div>
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 958, top: 120, height: 740, borderLeft: `2px dashed ${C.border}` }} />
      <div style={{ position: "absolute", left: 700, top: 108 }}>
        <Reveal startFrac={fDinh + 70 / D}>
          <Chip color={C.teal}>mở cách nhau đúng nửa vòng năm</Chip>
        </Reveal>
      </div>
      {nCap > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 40,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 58,
            color: C.cream,
          }}
        >
          {cap.slice(0, nCap)}
        </div>
      )}
    </Paper>
  );
};

/** sc049 (s18) — Hai sắc hội: trống trận tháng Tư ↔ đêm tưởng niệm tháng Giêng. */
export const Sc049: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac(); const D = dur;
  const fTrong = A("tiếng trống trận");
  const fDem = A("đêm tưởng niệm");
  const pulse = 1 + 0.07 * Math.sin(frame * 0.3);
  const flame = 1 + 0.16 * Math.sin(frame * 0.5);
  const half: React.CSSProperties = { position: "absolute", top: 0, width: 960, height: 1080 };
  return (
    <Paper>
      <div style={{ ...half, left: 0, background: "rgba(200,85,61,0.14)" }}>
        <Reveal startFrac={4 / D}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 150,
              textAlign: "center",
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 62,
              letterSpacing: 6,
              color: C.warn,
            }}
          >
            THÁNG TƯ
          </div>
          <svg width="960" height="1080" viewBox="0 0 960 1080" fill="none" style={{ position: "absolute", inset: 0 }}>
            <g transform={`translate(480 560) scale(${pulse})`}>
              <ellipse cx="0" cy="-60" rx="130" ry="48" fill={C.warn} />
              <path d="M-130 -60 L-108 80 L108 80 L130 -60" fill="#8a3a2c" />
              <ellipse cx="0" cy="80" rx="108" ry="26" fill={C.warn} />
              <path d="M-70 106 L-70 170 M70 106 L70 170" stroke="#8a3a2c" strokeWidth="14" />
              <path d="M-80 -130 Q-40 -158 -6 -138 M6 -138 Q44 -160 84 -134" stroke={C.amber} strokeWidth="7" fill="none" opacity="0.85" />
            </g>
            <path d="M240 840 Q480 812 720 840" stroke={C.cream} strokeWidth="5" fill="none" opacity="0.4" />
          </svg>
        </Reveal>
        <Reveal startFrac={fTrong}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 852,
              textAlign: "center",
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 58,
              color: C.warn,
            }}
          >
            tiếng trống trận
          </div>
        </Reveal>
      </div>
      <div style={{ ...half, left: 960, background: "rgba(63,90,94,0.30)" }}>
        <Reveal startFrac={4 / D}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 150,
              textAlign: "center",
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 62,
              letterSpacing: 6,
              color: C.teal,
            }}
          >
            THÁNG GIÊNG
          </div>
          <svg width="960" height="1080" viewBox="0 0 960 1080" fill="none" style={{ position: "absolute", inset: 0 }}>
            <g transform="translate(480 560)">
              <rect x="-14" y="-90" width="28" height="120" rx="6" fill={C.cream} />
              <g transform={`translate(0 -100) scale(${flame})`}>
                <path d="M0 -10 C-16 -34 -10 -58 0 -74 C10 -58 16 -34 0 -10 Z" fill={C.amber} />
              </g>
              <ellipse cx="0" cy="40" rx="60" ry="12" fill="#2e4247" />
              <path d="M-150 110 C-110 60 -40 60 -10 110 M10 110 C40 60 110 60 150 110" stroke={C.cream} strokeWidth="8" fill="none" />
              <circle cx="-96" cy="70" r="16" fill={C.cream} />
              <circle cx="96" cy="70" r="16" fill={C.cream} />
            </g>
          </svg>
        </Reveal>
        <Reveal startFrac={fDem}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 852,
              textAlign: "center",
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 58,
              color: C.teal,
            }}
          >
            đêm tưởng niệm
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 958, top: 220, height: 520, borderLeft: `2px dashed ${C.border}` }} />
      <div style={{ position: "absolute", left: 894, top: 452 }}>
        <Reveal startFrac={Math.max(fTrong, fDem) + 10 / D}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 64, color: C.mute }}>↔</div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc055 (s21) — Bong bóng thoại đầu đời: bên trong là vũ khí, không phải 'mẹ'. */
export const Sc055: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac(); const D = dur;
  const fChi = A("Chi tiết thứ hai");
  const fXin = A("Nó xin vũ khí");
  const eXin = af(frame, D, fXin);
  const strikeO = (i: number) => cl((eXin + 60) / 8) * (0.85 - 0.55 * cl((eXin - i * 14) / 12));
  const glyph = (cx: number, label: string, sf: number, node: React.ReactNode) => (
    <div key={label} style={{ position: "absolute", left: cx - 100, top: 388, width: 200, textAlign: "center" }}>
      <SpringPop startFrac={sf} from={0.7}>
        {node}
        <div style={{ marginTop: 10, fontFamily: FONT.body, fontSize: 30, color: C.amber }}>{label}</div>
      </SpringPop>
    </div>
  );
  return (
    <Paper>
      <SceneTitle
        startFrac={4 / D}
        eyebrow="HỒI BA · ĐỌC LẠI HAI CHI TIẾT"
        title="Chi tiết thứ hai: tiếng nói đầu đời"
      />
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" style={{ position: "absolute", inset: 0 }}>
        <InkPath
          d="M500 480 C500 318 706 220 960 220 C1214 220 1420 318 1420 480 C1420 642 1214 740 960 740 C704 740 500 642 500 480 M700 726 L636 812 L758 748"
          startFrac={fChi}
          endFrac={fChi + 45 / D}
          stroke={C.cream}
          strokeWidth={6}
        />
        <circle cx="620" cy="858" r="30" fill={C.cream} />
        <path d="M584 990 C584 910 602 892 620 892 C638 892 656 910 656 990 Z" fill={C.cream} />
      </svg>
      {glyph(
        760,
        "thanh gươm",
        fXin,
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <path d="M55 8 L55 68" stroke={C.cream} strokeWidth="7" strokeLinecap="round" />
          <path d="M36 68 L74 68 M55 68 L55 98" stroke={C.cream} strokeWidth="6" strokeLinecap="round" />
          <circle cx="55" cy="102" r="5" fill={C.amber} />
        </svg>
      )}
      {glyph(
        960,
        "con ngựa",
        fXin + 20 / D,
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <path
            d="M22 96 C20 62 32 36 56 32 L64 14 L78 36 C94 48 96 72 92 96"
            stroke={C.cream}
            strokeWidth="6"
            fill="none"
            strokeLinejoin="round"
          />
          <path d="M36 96 L36 106 M80 96 L80 106 M56 50 L64 46" stroke={C.cream} strokeWidth="5" />
        </svg>
      )}
      {glyph(
        1160,
        "roi sắt",
        fXin + 40 / D,
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <path d="M20 94 C36 68 56 42 88 24" stroke={C.cream} strokeWidth="7" strokeLinecap="round" />
          <path d="M88 24 C102 16 108 30 98 38" stroke={C.amber} strokeWidth="5" fill="none" />
        </svg>
      )}
      {([
        ["mẹ", 300, 250, 0],
        ["đòi ăn", 1480, 270, 1],
        ["khóc", 1460, 760, 2],
      ] as Array<[string, number, number, number]>).map(([t, x, y, i]) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: x,
            top: y,
            fontFamily: FONT.body,
            fontSize: 42,
            color: C.mute,
            textDecoration: "line-through",
            textDecorationColor: C.warn,
            textDecorationThickness: 3,
            opacity: strikeO(i),
          }}
        >
          {t}
        </div>
      ))}
      <Reveal startFrac={fXin + 60 / D}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 962,
            textAlign: "center",
            fontFamily: FONT.body,
            fontStyle: "italic",
            fontSize: 40,
            color: C.cream,
          }}
        >
          tiếng nói đầu đời là một lời đòi cho người khác
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc061 (s23) — HERO: quote chốt tập, giữ màn hết câu. */
export const Sc061: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac(); const D = dur;
  const f1 = A("Thánh Gióng không tự lớn");
  const f2 = A("Cả làng nuôi nó lớn");
  const w1 = ["Thánh", "Gióng", "không", "tự", "lớn."];
  const w2 = ["Cả", "làng", "nuôi", "nó", "lớn."];
  const word = (t: string, sf: number, amber: boolean) => (
    <span key={t + sf} style={{ marginRight: 26, opacity: cl(af(frame, D, sf) / 6), color: amber ? C.amber : C.cream }}>
      {t}
    </span>
  );
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,9,12,0.5)" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          background: "radial-gradient(52% 62% at 50% 50%, #e6d5ac 0%, transparent 74%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 360,
          textAlign: "center",
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 104,
          lineHeight: 1.5,
        }}
      >
        <div>{w1.map((t, i) => word(t, f1 + (i * 11) / D, false))}</div>
        <div>{w2.map((t, i) => word(t, f2 + (i * 11) / D, i < 2))}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center" }}>
        <Reveal startFrac={f2 + 50 / D}>
          <div style={{ fontFamily: FONT.body, fontSize: 26, letterSpacing: 3, color: C.mute }}>
            sách chép · Lĩnh Nam chích quái · 1492
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc067 (s26) — Đêm làng tĩnh: gạo về kho, vòng trống thu nhỏ tắt. */
export const Sc067: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac(); const D = dur;
  const fDem = A("Đêm hội tàn");
  const fGao = A("hạt gạo về kho");
  const eDem = af(frame, D, fDem);
  const eGao = af(frame, D, fGao);
  const ringDecay = cl(eDem / 300);
  const haloO = 0.45 * (1 - 0.6 * cl((eGao - 30) / 120));
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,30,34,0.35)" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${1 + 0.045 * (frame / D)})`,
          transformOrigin: "50% 58%",
        }}
      >
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" style={{ position: "absolute", inset: 0 }}>
          <path d="M1120 430 L1420 296 L1720 430 L1720 570 L1120 570 Z" fill="#1d2b2e" opacity="0.92" />
          <g opacity={0.5 * (1 - 0.3 * (frame / D))} transform={`translate(${18 * Math.sin(frame * 0.02)} ${-26 * (frame / D)})`}>
            <path d="M1420 286 C1400 246 1448 222 1428 184 C1412 150 1444 128 1432 98" stroke="#9db3b6" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
          <g opacity={0.35 * (1 - 0.3 * (frame / D))} transform={`translate(${22 * Math.sin(frame * 0.016 + 2)} ${-20 * (frame / D)})`}>
            <path d="M1452 296 C1436 264 1476 244 1460 210 C1448 184 1472 168 1464 144" stroke="#9db3b6" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
          <ellipse cx="960" cy="792" rx="248" ry="42" stroke={C.cream} strokeWidth="5" fill="#14110d" />
          <path d="M846 768 A34 22 0 0 1 914 768" stroke={C.cream} strokeWidth="5" fill="none" />
          <path d="M1006 768 A34 22 0 0 1 1074 768" stroke={C.cream} strokeWidth="5" fill="none" />
          <path d="M932 768 A28 20 0 0 1 988 768" stroke={C.cream} strokeWidth="4" fill="none" opacity="0.8" />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx="300"
              cy="260"
              r={(120 - i * 30) * (1 - 0.72 * ringDecay)}
              stroke={C.cream}
              strokeWidth="3"
              fill="none"
              opacity={0.45 * (1 - ringDecay)}
            />
          ))}
          <circle cx="880" cy="752" r="34" fill={C.amber} opacity={haloO} />
          <ellipse cx="880" cy="752" rx="10" ry="15" transform="rotate(18 880 752)" fill={C.amber} opacity={cl(eGao / 6)} />
          <Lamp x={1240} y={680} lit={0.85 + 0.12 * Math.sin(frame * 0.12)} />
        </svg>
        <div style={{ position: "absolute", left: 150, top: 116 }}>
          <Reveal startFrac={6 / D}>
            <Chip color={C.teal}>hồi kết · đêm làng tĩnh</Chip>
          </Reveal>
        </div>
        <Reveal startFrac={fGao + 80 / D}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 948,
              textAlign: "center",
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 40,
              color: C.cream,
            }}
          >
            vị thần đó chưa bao giờ lớn lên một mình
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};
