// S2E02 vn-myth (ink-genome) — scenes group "d".
// Pattern S2E01: mỗi scene 1 export, Paper nền giấy dó, speech-lock mọi beat qua A(word).
import * as React from "react";
import {
  Paper,
  Reveal,
  SpringPop,
  SceneTitle,
  TextCard,
  Chip,
  SourceTag,
  LegendFrame,
  LabBadge,
  circleD,
  plateSrc,
  InkImageScene,
  useA,
  useFrac,
} from "./common";
import { C, FONT } from "./theme";
import { SceneProps } from "./theme";

// ---------- helpers (module-local) ----------
const cl = (v: number) => Math.max(0, Math.min(1, v));
const sm = (t: number) => {
  const x = cl(t);
  return x * x * (3 - 2 * x);
};
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const scrim: React.CSSProperties = {
  background: "rgba(22,15,9,0.62)",
  borderRadius: 10,
  padding: "8px 20px",
};

/** Nét mực vẽ-dần theo fraction thời gian. s = frame local bắt đầu. */
const Ink: React.FC<{
  d: string;
  s: number;
  len?: number;
  w?: number;
  col?: string;
  op?: number;
  vb?: string;
}> = ({ d, s, len = 16, w = 5, col = C.earthDeep, op = 1, vb = "0 0 1920 1080" }) => {
  const { frame } = useFrac();
  const t = sm((frame - s) / len);
  if (t <= 0) return null;
  return (
    <svg
      viewBox={vb}
      preserveAspectRatio="none"
      style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: op }}
    >
      <path
        d={d}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - t}
        fill="none"
        stroke={col}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ============================================================
// sc004 (s02) — LỄ LÀ LỆ — DÒNG TRUYỀN: sơ đồ bước lễ + band lặp
// ============================================================
export const Sc004: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const steps: Array<[string, string]> = [
    ["Người làm tướng", "Người làm tướng"],
    ["người làm lính", "Người làm lính"],
    ["người cầm roi", "Người cầm roi"],
    ["người cầm cờ", "Người cầm cờ"],
    ["rước nước về làng", "Rước nước về làng lau rửa khí giới"],
    ["duyệt binh", "Duyệt binh"],
    ["tái hiện trận đánh xưa", "Tái hiện trận đánh xưa ngoài bãi"],
  ];

  const fBand = F("đời này sang đời kia");
  const bandOp = cl((frame - (fBand - 12)) / 24);
  const bandX = -((frame * 1.15) % 640);

  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 84, display: "flex", justifyContent: "center" }}>
        <SceneTitle
          eyebrow="HỘI GIÓNG · LỄ CỔ"
          title="Người làng khoác áo lính theo lệ cổ"
          startFrac={A("Người làng khoác áo lính")}
          maxWidth={1120}
        />
      </div>

      {/* rail dọc + các bước lễ, đúng thứ tự narration */}
      {steps.map((st, i) => {
        const f = F(st[0]);
        return (
          <React.Fragment key={st[0]}>
            <Ink d={`M 600 ${318 + i * 70} L 600 ${318 + (i + 1) * 70}`} s={f + 4} len={10} w={3} col={C.earth} op={0.7} />
            <div
              style={{
                position: "absolute",
                left: 470,
                top: 296 + i * 70,
                width: 90,
                textAlign: "right",
                fontFamily: FONT.mono,
                fontSize: 26,
                color: C.amber,
                opacity: cl((frame - f) / 6),
              }}
            >
              {`${i + 1}`}
            </div>
            <div style={{ position: "absolute", left: 640, top: 302 + i * 70 }}>
              <Reveal startFrac={A(st[0])} dy={14}>
                <div style={{ fontFamily: FONT.display, fontSize: 31, color: C.earthDeep }}>{st[1]}</div>
              </Reveal>
            </div>
          </React.Fragment>
        );
      })}

      {/* band mực lặp — lệ truyền đời này sang đời kia */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 918,
          width: 1800,
          height: 64,
          overflow: "hidden",
          borderTop: `1px solid ${C.earth}`,
          borderBottom: `1px solid ${C.earth}`,
          opacity: bandOp,
        }}
      >
        <div style={{ display: "flex", whiteSpace: "nowrap", transform: `translateX(${bandX}px)`, lineHeight: "64px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{ fontFamily: FONT.mono, fontSize: 25, letterSpacing: 3, color: C.earth, opacity: 0.8, paddingRight: 40 }}
            >
              LỆ ĐƯỢC GIỮ TỪ ĐỜI NÀY SANG ĐỜI KIA ·
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", right: 60, top: 88 }}>
        <SourceTag text="lệ cổ · hội Gióng" />
      </div>
    </Paper>
  );
};

// ============================================================
// sc010 (s04) — KHO THẦN CHỌN AI: dense-then-one reveal
// ============================================================
export const Sc010: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const fSink = F("người cứu nước lớn nhất");
  const sink = sm((frame - fSink) / 26);
  const fQ = F("Ai đã viết chuyện này");

  const rows: Array<[string, string, string[]]> = [
    ["thần núi", "Thần núi", ["M 56 66 L 88 26 L 120 66", "M 104 66 L 122 42 L 138 66"]],
    ["thần sông", "Thần sông", ["M 56 130 C 72 114 88 114 104 130 C 120 144 136 144 152 130"]],
    ["cưỡi voi ra trận", "Những vị tướng cưỡi voi ra trận", ["M 56 214 C 76 184 136 184 156 214", "M 150 210 C 162 224 160 238 150 244", "M 72 216 L 72 242 M 140 216 L 140 242"]],
  ];

  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 76, display: "flex", justifyContent: "center" }}>
        <SceneTitle
          eyebrow="KHO VUA CHÚA THẦN THÁNH"
          title="Người xưa có cả kho để chọn"
          startFrac={A("Người xưa có cả kho")}
          maxWidth={980}
        />
      </div>

      {/* bảng thần dày đặc — dạt xuống khi đọc "người cứu nước lớn nhất" */}
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 210,
          width: 1400,
          height: 352,
          transform: `translateY(${190 * sink}px)`,
          opacity: 1 - 0.65 * sink,
        }}
      >
        {rows.map((r, i) => {
          const f = F(r[0]);
          return (
            <React.Fragment key={r[0]}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: i * 88,
                  height: 72,
                  background: C.card,
                  borderLeft: `4px solid ${C.border}`,
                  opacity: 0.85,
                }}
              />
              {r[2].map((d, k) => (
                <Ink key={k} d={d} s={f + k * 4} len={10} w={4} col={C.earth} vb="0 0 1400 352" op={0.85} />
              ))}
              <div style={{ position: "absolute", left: 210, top: i * 88 + 18 }}>
                <Reveal startFrac={A(r[0])} dy={10}>
                  <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.mute }}>{r[1]}</div>
                </Reveal>
              </div>
            </React.Fragment>
          );
        })}
        {[0, 1, 2].map((k) => (
          <Ink key={k} d={circleD(70 + k * 26, 300, 5)} s={F("thần núi") + 10 + k * 3} len={6} w={4} col={C.border} vb="0 0 1400 352" />
        ))}
      </div>

      {/* ô vàng cô độc — đứa trẻ 3 tuổi */}
      <div style={{ position: "absolute", left: 560, top: 600, width: 800 }}>
        <SpringPop startFrac={A("đứa trẻ 3 tuổi")}>
          <div
            style={{
              height: 220,
              border: `2px solid ${C.amber}`,
              background: "rgba(191,142,38,0.14)",
              boxShadow: `0 0 60px rgba(200,154,63,0.28)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 22, letterSpacing: 5, color: C.amber }}>MỘT ĐỨA TRẺ</div>
            <div style={{ fontFamily: FONT.display, fontSize: 92, lineHeight: 1, color: C.amber }}>
              3 TUỔI
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 24, color: C.mute }}>chưa nói được một lời</div>
          </div>
        </SpringPop>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 862, display: "flex", justifyContent: "center" }}>
        <SpringPop startFrac={A("cha mẹ đã ngoài 60")}>
          <Chip color={C.amber}>
            <span style={{ fontFamily: FONT.body, fontSize: 28 }}>
              cha mẹ đã ngoài 60
            </span>
          </Chip>
        </SpringPop>
      </div>

      {/* dấu hỏi mực lớn đè phía trên */}
      <Ink d="M 1470 300 C 1466 240 1520 214 1560 224 C 1612 238 1618 292 1584 330 C 1556 362 1548 380 1546 416" s={fQ} len={18} w={13} op={0.85} />
      <Ink d={circleD(1544, 470, 14)} s={fQ + 16} len={6} w={13} op={0.85} />
    </Paper>
  );
};

// ============================================================
// sc016 (s06) — TRẬN ĐÁNH TỰ TAN: bản đồ sepia + hai câu chép
// ============================================================
export const Sc016: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const fMap = F("Giặc đến chân núi Vũ Ninh");
  const driftX = 22 - 44 * cl(frame / dur);

  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 62, display: "flex", justifyContent: "center" }}>
        <SceneTitle
          eyebrow="SỔ THƯ · CHÍNH SỬ"
          title="Giặc đến chân núi Vũ Ninh"
          startFrac={A("Giặc đến chân núi Vũ Ninh")}
          maxWidth={860}
        />
      </div>

      {/* bản đồ giấy dầu tông sepia */}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 172,
          width: 1640,
          height: 420,
          background: C.cream,
          border: `2px solid ${C.earth}`,
          borderRadius: 6,
          overflow: "hidden",
          opacity: cl((frame - (fMap - 8)) / 12),
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", transform: `translateX(${driftX}px)` }}>
          <Ink d="M 0 380 C 200 340 380 420 560 380 C 740 340 900 420 1080 380 C 1240 344 1440 404 1640 360" s={fMap} len={22} w={6} col={C.earth} vb="0 0 1640 430" op={0.45} />
          <Ink d={circleD(420, 200, 90)} s={fMap + 2} len={14} w={3} col={C.earth} vb="0 0 1640 430" op={0.3} />
          <Ink d={circleD(980, 300, 70)} s={fMap + 4} len={14} w={3} col={C.earth} vb="0 0 1640 430" op={0.3} />
          {/* núi Vũ Ninh */}
          <Ink d="M 1150 230 L 1250 100 L 1350 230" s={fMap + 4} len={14} w={8} vb="0 0 1640 430" />
          <Ink d="M 1300 230 L 1370 140 L 1440 230" s={fMap + 8} len={12} w={5} vb="0 0 1640 430" op={0.7} />
          {/* làng Phù Đổng */}
          <Ink d="M 240 330 L 260 312 L 280 330 M 300 330 L 320 312 L 340 330 M 230 332 L 350 332" s={fMap + 2} len={12} w={4} vb="0 0 1640 430" />
          {/* đường quân ra trận */}
          <Ink d="M 300 300 C 500 260 700 260 900 220 C 1050 190 1150 190 1230 160" s={fMap + 8} len={26} w={7} col={C.warn} vb="0 0 1640 430" />
          <Ink d="M 1230 160 L 1196 158 M 1230 160 L 1214 186" s={fMap + 30} len={6} w={7} col={C.warn} vb="0 0 1640 430" />
          {/* giặc edge núi */}
          <Ink d="M 1170 252 L 1190 272 M 1190 252 L 1170 272 M 1250 262 L 1270 282 M 1270 262 L 1250 282" s={fMap + 18} len={8} w={4} col={C.mute} vb="0 0 1640 430" />
          {/* tráng sĩ */}
          <Ink d="M 700 230 L 700 262 M 688 240 L 712 240 M 700 262 L 690 278 M 700 262 L 710 278" s={F("vươn vai thành tráng sĩ")} len={10} w={4} vb="0 0 1640 430" />
          <Ink d={circleD(700, 222, 6)} s={F("vươn vai thành tráng sĩ") + 6} len={5} w={4} vb="0 0 1640 430" />
          {/* đền thờ phụng */}
          <Ink d="M 450 310 L 470 292 L 490 310 M 456 310 L 456 322 M 484 310 L 484 322 M 446 322 L 494 322" s={F("lập đền thờ phụng")} len={12} w={4} col={C.warn} vb="0 0 1640 430" />

          <div style={{ position: "absolute", left: 210, top: 348, fontFamily: FONT.mono, fontSize: 22, color: C.earthDeep }}>Phù Đổng</div>
          <div style={{ position: "absolute", left: 1150, top: 52, fontFamily: FONT.mono, fontSize: 22, color: C.earthDeep }}>Núi Vũ Ninh</div>
        </div>
        <div style={{ position: "absolute", left: 24, top: 18, fontFamily: FONT.mono, fontSize: 19, letterSpacing: 3, color: C.mute }}>
          BẢN ĐỒ · GIẶC ĐẾN CHÂN NÚI VŨ NINH
        </div>
      </div>

      {/* hai câu chép nguyên văn */}
      <div style={{ position: "absolute", left: 140, top: 620, width: 800 }}>
        <Reveal startFrac={A("Giặc tự quay giáo đánh lẫn nhau")} dy={18}>
          <div style={{ background: C.card, borderLeft: `6px solid ${C.amber}`, padding: "26px 34px" }}>
            <TextCard eyebrow="CHÍNH SỬ · NGUYÊN VĂN" title="“Giặc tự quay giáo đánh lẫn nhau.”" maxWidth={700} />
            <div style={{ marginTop: 10 }}>
              <SourceTag text="chính sử · ĐVSKTT" />
            </div>
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 980, top: 620, width: 800 }}>
        <Reveal startFrac={A("Đứa trẻ nhảy ngựa lên không mà đi")} dy={18}>
          <div style={{ background: C.card, borderLeft: `6px solid ${C.amber}`, padding: "26px 34px" }}>
            <TextCard eyebrow="CHÍNH SỬ · NGUYÊN VĂN" title="“Đứa trẻ nhảy ngựa lên không mà đi.”" maxWidth={700} />
            <div style={{ marginTop: 6, opacity: cl((frame - F("rồi mất tích")) / 8), fontFamily: FONT.body, fontSize: 24, color: C.mute }}>
              …rồi mất tích.
            </div>
          </div>
        </Reveal>
      </div>

      {/* vài dòng chấm mực tóm truyện */}
      {["Một lời xin vũ khí", "Một trận đánh mà giặc tự tan", "Một ngôi đền"].map((w, i) => {
        const ph = i === 0 ? "một lời xin vũ khí" : i === 1 ? "một trận đánh mà giặc tự tan" : "một ngôi đền";
        return (
          <div
            key={w}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 960 + i * 24,
              textAlign: "center",
              fontFamily: FONT.mono,
              fontSize: 24,
              color: C.earthDeep,
              opacity: cl((frame - F(ph)) / 8),
            }}
          >
            {i === 0 ? "Vài dòng — " : "· "}
            {w}
          </div>
        );
      })}
    </Paper>
  );
};

// ============================================================
// sc022 (s08) — HAI GƯƠNG MẶT NGƯỜI CHÉP: hai trang hai tính cách
// ============================================================
export const Sc022: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const fL = F("kiệm chữ như quan chép sử");
  const fR = F("say mê như người kể đêm hội");
  const txL = -190 * (1 - sm((frame - fL) / 18));
  const txR = 190 * (1 - sm((frame - fR) / 18));
  const flourishOp = 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.09)) * cl((frame - (fR + 16)) / 20);

  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 72, display: "flex", justifyContent: "center" }}>
        <SceneTitle eyebrow="CÙNG MỘT CÂU CHUYỆN" title="Hai cách chép" startFrac={A("hai cách chép")} maxWidth={720} />
      </div>

      <Ink d="M 960 280 L 960 760" s={F("hai cách chép") + 8} len={16} w={3} col={C.earth} op={0.6} />

      {/* trái — chính sử, kiệm chữ */}
      <div style={{ position: "absolute", left: 170, top: 260, width: 720, height: 500, transform: `translateX(${txL}px)` }}>
        <div style={{ width: "100%", height: "100%", background: C.card, border: `2px solid ${C.border}`, padding: 34 }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: 4, color: C.mute }}>ĐẠI VIỆT SỬ KÝ TOÀN THƯ</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 17, color: C.mute, marginTop: 6 }}>trang kia · kiệm chữ như quan chép sử</div>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 34 }}>
            {["Xin gươm.", "Ngựa.", "Roi sắt."].map((l) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 34, height: 3, background: C.border }} />
                <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.earthDeep }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 44, fontFamily: FONT.body, fontSize: 22, color: C.mute }}>
            “Giặc tự quay giáo đánh lẫn nhau.”
          </div>
        </div>
      </div>

      {/* phải — truyền kỳ, say mê */}
      <div style={{ position: "absolute", left: 1030, top: 260, width: 720, height: 500, transform: `translateX(${txR}px)` }}>
        <div style={{ width: "100%", height: "100%", background: C.cream, border: `2px solid ${C.amber}`, padding: 34 }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: 4, color: C.amber }}>LINH NAM CHÍCH QUÁI</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 17, color: C.amber, marginTop: 6 }}>trang này · say mê như người kể đêm hội</div>
          <div style={{ marginTop: 36, fontFamily: FONT.display, fontSize: 44, color: C.earthDeep }}>“Ta là thiên tướng nhà Trời đây!”</div>
          <div style={{ marginTop: 26, fontFamily: FONT.body, fontSize: 26, color: C.earthDeep, lineHeight: 1.6 }}>
            kỵ binh thép — ngựa sắt 18 thước
            <br />
            kiếm 7 thước · nón sắt
          </div>
          <div style={{ position: "relative", marginTop: 24, height: 110, opacity: flourishOp }}>
            {[0, 1, 2, 3, 4].map((k) => (
              <Ink
                key={k}
                d={`M ${140 + k * 90} 96 L ${168 + k * 90} 22`}
                s={fR + 14 + k * 4}
                len={8}
                w={4}
                col={C.amber}
                vb="0 0 650 110"
              />
            ))}
          </div>
        </div>
      </div>

      {/* caption chốt */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 840, display: "flex", justifyContent: "center" }}>
        <Reveal startFrac={A("gương mặt của người chép")}>
          <div style={{ fontFamily: FONT.display, fontSize: 42, color: C.earthDeep }}>mỗi trang mang gương mặt của người chép</div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ============================================================
// sc028 (s11) — SCENE TRUNG TÂM — NONG RỘNG RA (img-04)
// ============================================================
export const Sc028: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const fRing = F("nong tre cứ rộng ra theo ngày");
  const fDots = F("từng gánh, từng bọc");
  const gate = cl((frame - (fRing - 30)) / 30);
  const fill = 0.06 + 0.28 * cl((frame / dur) * 1.25);

  const roofs: Array<[number, number]> = [
    [330, 320],
    [640, 240],
    [1010, 230],
    [1330, 260],
    [1620, 340],
    [1720, 640],
    [300, 660],
    [560, 780],
  ];
  const cx0 = 960;
  const cy0 = 630;

  const grains = [];
  for (let i = 0; i < 26; i++) {
    const r = roofs[i % roofs.length];
    const per = 44 + Math.floor(rnd(i + 50) * 26);
    const ph = rnd(i * 3 + 1);
    const t = ((((frame + ph * per * 4) % per) + per) % per) / per;
    const cxp = (r[0] + cx0) / 2 + (rnd(i + 9) - 0.5) * 380;
    const cyp = Math.min(r[1], cy0) - 150 - rnd(i + 17) * 130;
    const u = 1 - t;
    const x = u * u * r[0] + 2 * u * t * cxp + t * t * cx0;
    const y = u * u * r[1] + 2 * u * t * cyp + t * t * cy0;
    const dx = 2 * u * (cxp - r[0]) + 2 * t * (cx0 - cxp);
    const dy = 2 * u * (cyp - r[1]) + 2 * t * (cy0 - cyp);
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const o = Math.sin(Math.PI * t) * 0.95 * gate;
    grains.push(
      <ellipse
        key={i}
        cx={x}
        cy={y}
        rx={5.5}
        ry={2.4}
        fill={i % 3 === 0 ? "#f2d89a" : i % 3 === 1 ? C.amber : "#d9a83c"}
        opacity={o}
        transform={`rotate(${deg} ${x} ${y})`}
      />,
    );
  }

  return (
    <InkImageScene
      src={plateSrc("img-04-nong-com.png")}
      label="CHIẾC NONG GIỮA SÂN LÀNG"
      sublabel="hạt gạo từ nhà này, nhà kia — đổ về một chỗ"
      labelStartFrac={A("một chiếc nong tre")}
      sublabelStartFrac={A("đổ về một chỗ")}
      durationInFrames={dur}
    >
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none" }}>
        {/* nong đầy dần */}
        <circle cx={cx0} cy={cy0} r={148} fill={C.amber} opacity={fill} />
        {/* vòng nong rộng ra (lặp) */}
        {[0, 1].map((j) => {
          if (frame < fRing + 12 + j * 35) return null;
          const ph = (((frame - fRing - 12 - j * 35) % 70) + 70) % 70 / 70;
          return <circle key={j} cx={cx0} cy={cy0} r={150 + 230 * ph} fill="none" stroke={C.amber} strokeWidth={2.5} opacity={0.4 * (1 - ph) * gate} />;
        })}
        {/* roofline ledger — từng nhà góp gạo (không đếm số mái nhà bịa đặt) */}
        {roofs.map((r, i) => (
          <circle key={`d${i}`} cx={r[0]} cy={r[1]} r={5.5} fill="#e8c06a" opacity={0.95 * cl((frame - (fDots + i * 4)) / 8)} />
        ))}
        {grains}
      </svg>
      <Ink d={circleD(cx0, cy0, 150)} s={fRing} len={20} w={7} col={C.amber} op={0.95} />

      <div style={{ position: "absolute", left: 360, top: 958, width: 1200 }}>
        <Reveal startFrac={A("thả một lời nguyện")}>
          <div style={{ ...scrim, textAlign: "center" }}>
            <span style={{ fontFamily: FONT.body, fontSize: 27, color: C.cream, fontStyle: "italic" }}>
              bàn tay nông dân buông hạt lúa xuống như thả một lời nguyện
            </span>
          </div>
        </Reveal>
      </div>
    </InkImageScene>
  );
};

// ============================================================
// sc034 (s13) — KIẾM SẮT GÃY — VỒ TRE: nhát mực gấp
// ============================================================
export const Sc034: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const fSnap = F("Kiếm sắt gãy");
  const fGrab = F("vồ luôn bụi tre");

  const snap = sm((frame - fSnap) / 8);
  const flyB = sm((frame - fSnap) / 12);
  const grab = sm((frame - fGrab) / 7);
  const wob = frame > fGrab ? 24 * Math.sin((frame - fGrab) * 0.9) * Math.exp(-(frame - fGrab) * 0.12) : 0;

  const bamboo = [560, 625, 690, 760, 830];
  const leaves: Array<[number, number, number]> = [
    [600, 430, -30],
    [665, 380, 20],
    [730, 470, -15],
    [610, 540, 25],
    [790, 420, -25],
    [700, 580, 15],
    [820, 520, -20],
  ];

  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 62, display: "flex", justifyContent: "center" }}>
        <SceneTitle
          eyebrow="TRẬN ĐÁNH · TRUYỆN KỂ"
          title="Kiếm sắt gãy."
          startFrac={A("Kiếm sắt gãy")}
          maxWidth={820}
        />
      </div>

      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none" }}>
        <g transform={`translate(${wob} 0)`}>
          {/* bụi tre bên đường */}
          {bamboo.map((x, i) => (
            <path
              key={`s${i}`}
              d={`M ${x} 780 C ${x - 14} 620 ${x + 16} 480 ${x - 6} 320`}
              stroke={C.earthDeep}
              strokeWidth={9}
              fill="none"
              strokeLinecap="round"
              opacity={cl((frame - (fSnap + i * 2)) / 12) * 0.9}
            />
          ))}
          {leaves.map((l, i) => (
            <path
              key={`lf${i}`}
              d={`M ${l[0]} ${l[1]} q 34 ${l[2] * 0.4} 64 ${l[2]}`}
              stroke={C.earthDeep}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              opacity={cl((frame - (fSnap + 8 + i * 2)) / 10) * 0.85}
            />
          ))}

          {/* tay tráng sĩ — vồ bụi tre */}
          <g transform={`translate(${-350 * grab} 0)`}>
            <path d="M 1310 610 C 1260 560 1200 560 1150 600" stroke={C.earthDeep} strokeWidth={15} fill="none" strokeLinecap="round" />
          </g>

          {/* kiếm sắt gãy */}
          {frame < fSnap ? (
            <path d="M 1180 560 L 620 610" stroke={C.mute} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.95} />
          ) : (
            <g>
              <path
                d="M 1180 560 L 900 585"
                stroke={C.mute}
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
                transform={`rotate(${-28 * snap} 1180 560) translate(${34 * snap} ${-46 * snap})`}
              />
              <path
                d="M 900 585 L 620 610"
                stroke={C.mute}
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
                transform={`rotate(${46 * flyB} 900 585) translate(${-280 * flyB} ${-200 * flyB})`}
                opacity={1 - 0.35 * flyB}
              />
              {[0, 1, 2, 3, 4].map((k) => (
                <path
                  key={`f${k}`}
                  d={`M 900 585 L ${900 + 52 * Math.cos((k / 5) * 6.283)} ${585 + 52 * Math.sin((k / 5) * 6.283)}`}
                  stroke={C.amber}
                  strokeWidth={4}
                  opacity={1 - cl((frame - fSnap) / 10)}
                />
              ))}
            </g>
          )}
          {/* bụi mù chỗ vồ */}
          {[0, 1, 2, 3].map((k) => (
            <path
              key={`g${k}`}
              d={`M ${810 + k * 22} ${610 + (k % 2) * 26} q 18 -16 36 -2`}
              stroke={C.earth}
              strokeWidth={4}
              fill="none"
              opacity={(1 - cl((frame - (fGrab + 2)) / 12)) * 0.8}
            />
          ))}
        </g>
      </svg>

      <div style={{ position: "absolute", left: 560, top: 396 }}>
        <SpringPop startFrac={A("vồ luôn bụi tre")}>
          <Chip color={C.amber}>
            <span style={{ fontFamily: FONT.display, fontSize: 28 }}>vồ luôn bụi tre bên đường</span>
          </Chip>
        </SpringPop>
      </div>

      <div style={{ position: "absolute", left: 60, bottom: 60 }}>
        <Reveal startFrac={A("quất tiếp")}>
          <div style={{ ...scrim }}>
            <span style={{ fontFamily: FONT.body, fontSize: 25, color: C.cream, fontStyle: "italic" }}>
              kiếm sắt gãy — cậu vồ luôn bụi tre bên đường quất tiếp
            </span>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ============================================================
// sc040 (s15) — BỐN MÓN SẮT — MỘT DẤU HỎI
// ============================================================
export const Sc040: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const cells: Array<{ w: string; label: string; icon: string[]; chip?: React.ReactNode; chipWord?: string }> = [
    {
      w: "ngựa sắt",
      label: "Ngựa sắt",
      icon: ["M 70 110 L 300 100", "M 110 112 L 104 150 M 170 110 L 166 150 M 240 106 L 236 148 M 288 102 L 284 144", "M 300 100 L 332 58 L 350 64", "M 70 110 L 46 82"],
      chip: <span>ngựa cao 18 thước</span>,
      chipWord: "ngựa cao 18 thước",
    },
    {
      w: "kiếm sắt",
      label: "Kiếm sắt",
      icon: ["M 190 20 L 190 140", "M 150 118 L 230 118", "M 190 140 L 190 168"],
      chip: <span>kiếm dài 7 thước</span>,
      chipWord: "kiếm dài 7 thước",
    },
    { w: "nón sắt", label: "Nón sắt", icon: ["M 100 130 C 140 46 240 46 280 130", "M 84 130 L 296 130"] },
    { w: "roi sắt", label: "Roi sắt", icon: ["M 90 152 C 160 58 260 92 322 28"] },
  ];

  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
        <SceneTitle
          eyebrow="ĐỐI CHIẾU HAI TRANG"
          title="Bốn món sắt"
          startFrac={A("Đối chiếu hai trang")}
          maxWidth={700}
        />
      </div>

      {cells.map((c, i) => {
        const left = 125 + i * 430;
        return (
          <div key={c.w} style={{ position: "absolute", left, top: 260, width: 380, height: 340 }}>
            <SpringPop startFrac={A(c.w)}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: C.card,
                  border: `2px solid ${C.border}`,
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  paddingTop: 26,
                }}
              >
                <div style={{ position: "relative", width: 380, height: 180 }}>
                  {c.icon.map((d, k) => (
                    <Ink key={k} d={d} s={F(c.w) + 4 + k * 3} len={10} w={6} vb="0 0 380 180" />
                  ))}
                </div>
                <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.earthDeep, marginTop: 6 }}>{c.label}</div>
                {c.chip ? (
                  <div style={{ marginTop: 12 }}>
                    <Reveal startFrac={A(c.chipWord as string)}>
                      <Chip>
                        <span style={{ fontFamily: FONT.mono, fontSize: 23 }}>{c.chip}</span>
                      </Chip>
                    </Reveal>
                  </div>
                ) : null}
              </div>
            </SpringPop>
          </div>
        );
      })}

      {/* dấu hỏi mực lớn đè lên cả bốn món */}
      <Ink d="M 880 300 C 874 220 950 186 1010 200 C 1084 220 1094 296 1046 348 C 1006 392 996 416 994 464" s={F("công nghệ quen thuộc nhất")} len={20} w={16} op={0.85} />
      <Ink d={circleD(990, 530, 20)} s={F("công nghệ quen thuộc nhất") + 18} len={7} w={16} op={0.85} />

      <div style={{ position: "absolute", left: 410, top: 745, width: 1100 }}>
        <TextCard
          eyebrow="CÔNG NGHỆ QUEN THUỘC"
          title="roi sắt và kỵ binh là công nghệ quen thuộc nhất"
          startFrac={A("công nghệ quen thuộc nhất")}
          maxWidth={1100}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 962, textAlign: "center" }}>
        <Reveal startFrac={A("Roi sắt thuộc trang chính sử")}>
          <span style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute, fontStyle: "italic" }}>
            Roi sắt thuộc trang chính sử, không phải trang truyền kỳ.
          </span>
        </Reveal>
      </div>
    </Paper>
  );
};

// ============================================================
// sc046 (s17) — BÃI SOI BIA — CẢ LÀNG NHẬP VAI (img-10)
// ============================================================
export const Sc046: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  return (
    <InkImageScene
      src={plateSrc("img-10-den-phu-dong.png")}
      label="HỘI TRẬN · BÃI SOI BIA"
      sublabel="tái hiện trận đánh năm xưa ngay trên bãi Soi Bia"
      labelStartFrac={A("Cuối cùng là hội trận")}
      sublabelStartFrac={A("bãi Soi Bia")}
      durationInFrames={dur}
    >
      <div style={{ position: "absolute", left: 120, top: 210 }}>
        <SpringPop startFrac={A("bãi Soi Bia")}>
          <Chip color={C.teal}>
            <span style={{ fontFamily: FONT.mono, fontSize: 23 }}>bãi Soi Bia — nơi truyền kể là chiến trường</span>
          </Chip>
        </SpringPop>
      </div>

      <div style={{ position: "absolute", left: 120, top: 286 }}>
        <Reveal startFrac={A("Không phải diễn viên")}>
          <div style={{ ...scrim }}>
            <span style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, fontStyle: "italic" }}>Không phải diễn viên.</span>
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
        <SpringPop startFrac={A("Cả làng")}>
          <div style={{ fontFamily: FONT.display, fontSize: 116, color: C.amber, textShadow: "0 4px 26px rgba(0,0,0,0.55)" }}>
            CẢ LÀNG
          </div>
        </SpringPop>
      </div>
      <Ink d="M 700 706 L 1220 706" s={F("Cả làng") + 6} len={12} w={8} col={C.amber} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 742, display: "flex", justifyContent: "center", gap: 20 }}>
        {[
          ["Nhà nông làm lính", "Nhà nông làm lính"],
          ["dân làng làm tướng", "Dân làng làm tướng"],
          ["trẻ con cầm cờ", "Trẻ con cầm cờ"],
        ].map((r) => (
          <Reveal key={r[0]} startFrac={A(r[0])}>
            <div style={{ ...scrim }}>
              <span style={{ fontFamily: FONT.body, fontSize: 27, color: C.cream }}>{r[1]}</span>
            </div>
          </Reveal>
        ))}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 958, textAlign: "center" }}>
        <Reveal startFrac={A("chuyện này là chuyện của chúng ta")}>
          <span style={{ ...scrim, fontFamily: FONT.body, fontSize: 26, color: C.cream, fontStyle: "italic" }}>
            một làng đồng loạt nhập vai vào truyện — chuyện này là chuyện của chúng ta
          </span>
        </Reveal>
      </div>
    </InkImageScene>
  );
};

// ============================================================
// sc052 (s20) — RANH GIỚI PHÉP LỊCH SỬ: hai ô, ô bị khóa
// ============================================================
export const Sc052: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  return (
    <Paper>
      <div style={{ position: "absolute", left: 120, top: 74 }}>
        <LabBadge text="GÓC BẰNG CHỨNG" />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
        <SceneTitle
          eyebrow="RANH GIỚI"
          title="Bằng chứng tín ngưỡng chỉ nói về người thờ"
          startFrac={A("Bằng chứng tín ngưỡng chỉ nói về người thờ")}
          maxWidth={1500}
        />
      </div>

      {/* ô trái — tín ngưỡng (teal) */}
      <div style={{ position: "absolute", left: 160, top: 390, width: 620, height: 290 }}>
        <div style={{ width: "100%", height: "100%", border: `2px solid ${C.teal}`, background: "rgba(28,90,90,0.08)", padding: 24, boxSizing: "border-box" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: 4, color: C.teal }}>TÍN NGƯỠNG</div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {["hội lớn", "đền đẹp", "danh tiếng thế giới"].map((t, i) => (
              <Reveal key={t} startFrac={A(i === 0 ? "Hội lớn" : i === 1 ? "Đền đẹp" : "Danh tiếng thế giới")}>
                <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.earthDeep }}>— {t}</div>
              </Reveal>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Reveal startFrac={A("thờ vị thần này bao đời nay")}>
              <span style={{ fontFamily: FONT.body, fontSize: 20, color: C.mute, fontStyle: "italic" }}>thờ vị thần này bao đời nay</span>
            </Reveal>
          </div>
        </div>
      </div>

      {/* mũi tên — chỉ về người thờ */}
      <Ink d="M 800 520 L 1120 520" s={F("chỉ nói về người thờ")} len={16} w={8} col={C.teal} />
      <Ink d="M 1120 520 L 1084 502 M 1120 520 L 1084 538" s={F("chỉ nói về người thờ") + 14} len={5} w={8} col={C.teal} />

      {/* ô phải — cái được chứng minh */}
      <div style={{ position: "absolute", left: 1140, top: 390, width: 620, height: 290 }}>
        <div style={{ width: "100%", height: "100%", border: `2px solid ${C.teal}`, background: "rgba(28,90,90,0.05)", padding: 24, boxSizing: "border-box" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: 4, color: C.teal }}>CHỨNG MINH ĐƯỢC</div>
          <Reveal startFrac={A("điều họ chọn ghi nhớ")}>
            <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.earthDeep, marginTop: 18, lineHeight: 1.35 }}>
              người thờ
              <br />
              + điều họ chọn ghi nhớ
            </div>
          </Reveal>
        </div>
      </div>

      {/* ô bị khóa — trận đánh có thật (lock icon đặt bên cạnh, không đè chữ) */}
      <Ink d="M 470 740 L 526 740 L 526 774 L 470 774 Z" s={F("Nó không chứng minh trận đánh năm xưa có thật")} len={10} w={5} col={C.mute} />
      <Ink d="M 482 740 C 482 718 514 718 514 740" s={F("Nó không chứng minh trận đánh năm xưa có thật") + 6} len={8} w={5} col={C.mute} />
      <div style={{ position: "absolute", left: 560, top: 710, width: 800 }}>
        <Reveal startFrac={A("Nó không chứng minh trận đánh năm xưa có thật")}>
          <div
            style={{
              width: 800,
              height: 100,
              border: `2px dashed ${C.mute}`,
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute }}>trận đánh năm xưa có thật?</span>
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 884, textAlign: "center" }}>
        <Reveal startFrac={A("Bằng chứng tín ngưỡng chỉ nói về người thờ")}>
          <span style={{ fontFamily: FONT.body, fontSize: 30, color: C.earthDeep, fontStyle: "italic" }}>
            bằng chứng tín ngưỡng chỉ nói về người thờ
          </span>
        </Reveal>
      </div>
    </Paper>
  );
};

// ============================================================
// sc058 (s22) — KHÔNG VỀ ĐÂU CẢ: ba ô trống + hai hình trả về
// ============================================================
export const Sc058: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const cells: Array<[string, string]> = [
    ["Không lấy vợ", "Không lấy vợ."],
    ["Không nối ngôi", "Không nối ngôi."],
    ["Không nhận chức", "Không nhận chức."],
  ];

  return (
    <Paper>
      <div style={{ position: "absolute", left: 460, top: 84, width: 1000 }}>
        <TextCard eyebrow="SÁCH TRẢ LỜI GỌN" title="“Không về đâu cả.”" startFrac={A("không về đâu cả")} maxWidth={900} />
      </div>

      {/* bay về trời */}
      <Ink d="M 1620 250 L 1620 150" s={F("bay về trời")} len={10} w={6} />
      <Ink d="M 1620 150 L 1602 178 M 1620 150 L 1638 178" s={F("bay về trời") + 8} len={5} w={6} />
      <div style={{ position: "absolute", left: 1550, top: 258 }}>
        <Reveal startFrac={A("bay về trời")}>
          <span style={{ fontFamily: FONT.body, fontSize: 24, color: C.mute, fontStyle: "italic" }}>bay về trời</span>
        </Reveal>
      </div>

      {/* ba ô trống gạch chéo */}
      {cells.map((c, i) => {
        const x = 180 + i * 540;
        return (
          <React.Fragment key={c[0]}>
            <div style={{ position: "absolute", left: x, top: 310, width: 440 }}>
              <Reveal startFrac={A(c[0])}>
                <div style={{ height: 170, border: `2px dashed ${C.border}` }} />
              </Reveal>
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <Reveal startFrac={A(c[0])} dy={10}>
                  <span style={{ fontFamily: FONT.display, fontSize: 33, color: C.earthDeep }}>{c[1]}</span>
                </Reveal>
              </div>
            </div>
            <Ink d={`M ${x + 40} 462 L ${x + 400} 330`} s={F(c[0]) + 4} len={9} w={7} col={C.warn} op={0.85} />
          </React.Fragment>
        );
      })}

      {/* hai hình trả về */}
      <div style={{ position: "absolute", left: 180, top: 640, width: 700 }}>
        <Reveal startFrac={A("Áo bào để lại trên núi")}>
          <LegendFrame label="ÁO BÀO ĐỂ LẠI TRÊN NÚI">
            <div style={{ position: "relative", width: "100%", height: 200 }}>
              <Ink d="M 80 180 L 230 44 L 380 180" s={F("Áo bào để lại trên núi") + 4} len={14} w={7} vb="0 0 640 200" />
              <Ink d="M 320 180 L 424 70 L 520 180" s={F("Áo bào để lại trên núi") + 10} len={12} w={5} vb="0 0 640 200" op={0.6} />
              <Ink d="M 196 62 C 216 40 258 36 278 62" s={F("Áo bào để lại trên núi") + 16} len={10} w={7} col={C.amber} vb="0 0 640 200" />
              <Ink d="M 226 48 L 258 48" s={F("Áo bào để lại trên núi") + 24} len={5} w={4} col={C.amber} vb="0 0 640 200" />
            </div>
          </LegendFrame>
        </Reveal>
      </div>

      <div style={{ position: "absolute", left: 1020, top: 640, width: 700 }}>
        <Reveal startFrac={A("100 mẫu ruộng tự điền")}>
          <LegendFrame label="RUỘNG VỀ LÀNG">
            <div style={{ fontFamily: FONT.display, fontSize: 40, color: C.earthDeep, marginTop: 8 }}>
              100 mẫu ruộng tự điền
            </div>
            <div style={{ position: "relative", width: "100%", height: 130, marginTop: 6 }}>
              {[0, 1, 2, 3].map((k) => (
                <Ink key={k} d={`M 40 ${58 + k * 24} L 540 ${58 + k * 24}`} s={F("100 mẫu ruộng tự điền") + 6 + k * 3} len={10} w={4} col={C.teal} vb="0 0 640 130" />
              ))}
              <Ink d="M 560 86 L 586 62 L 612 86 M 566 86 L 566 108 M 606 86 L 606 108 M 554 110 L 616 110" s={F("100 mẫu ruộng tự điền") + 18} len={12} w={4} vb="0 0 640 130" />
            </div>
            <div style={{ marginTop: 4 }}>
              <Reveal startFrac={A("không cho một ai")}>
                <span style={{ fontFamily: FONT.mono, fontSize: 22, color: C.mute }}>ban cho cả làng — không cho một ai</span>
              </Reveal>
            </div>
          </LegendFrame>
        </Reveal>
      </div>
    </Paper>
  );
};

// ============================================================
// sc064 (s24) — HỘI HÔM NAY — CÙNG MỘT HẠT GẠO (img-13)
// ============================================================
export const Sc064: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const f2 = F("Cùng một hạt gạo");
  const pulse = 130 + 7 * Math.sin(frame * 0.15);

  return (
    <InkImageScene
      src={plateSrc("img-13-hoi-hom-nay.png")}
      label="HỘI HÔM NAY · PHÙ ĐỔNG"
      sublabel="trống vẫn dồn · mâm cỗ ngoài sân"
      labelStartFrac={A("Trẻ con làng Phù Đổng")}
      sublabelStartFrac={A("Trống vẫn dồn")}
      durationInFrames={dur}
    >
      {/* trẻ làng Phù Đổng cầm cờ */}
      <div style={{ position: "absolute", left: 120, top: 220 }}>
        <SpringPop startFrac={A("Trẻ con làng Phù Đổng")}>
          <div style={{ ...scrim }}>
            <span style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream }}>
              trẻ con làng Phù Đổng cầm cờ múa qua bãi Soi Bia
            </span>
          </div>
        </SpringPop>
      </div>

      <div style={{ position: "absolute", left: 120, top: 300 }}>
        <Reveal startFrac={A("theo lễ truyền thống bao đời")}>
          <div style={{ ...scrim }}>
            <span style={{ fontFamily: FONT.body, fontSize: 24, color: C.cream, fontStyle: "italic" }}>
              theo lễ truyền thống bao đời · trống vẫn dồn
            </span>
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", left: 120, top: 380 }}>
        <Reveal startFrac={A("trên mâm cỗ ngoài sân")}>
          <div style={{ ...scrim }}>
            <span style={{ fontFamily: FONT.body, fontSize: 24, color: C.cream }}>
              trên mâm cỗ ngoài sân, vẫn có hạt gạo
            </span>
          </div>
        </Reveal>
      </div>

      {/* khóa vàng — chén xôi hạt gạo */}
      <Ink d={circleD(1480, 800, 130)} s={f2} len={14} w={9} col="#e8c06a" />
      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, pointerEvents: "none" }}>
        {frame > f2 + 14 ? (
          <circle cx={1480} cy={800} r={pulse} fill="none" stroke="#e8c06a" strokeWidth={2.5} opacity={0.55} />
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: 1270, top: 930, width: 420, textAlign: "center" }}>
        <Reveal startFrac={A("Cùng một hạt gạo")}>
          <div style={{ ...scrim, display: "inline-block" }}>
            <span style={{ fontFamily: FONT.display, fontSize: 38, color: C.amber }}>CÙNG MỘT HẠT GẠO</span>
          </div>
        </Reveal>
        <div style={{ marginTop: 6, opacity: cl((frame - (f2 + 8)) / 8) }}>
          <span style={{ ...scrim, fontFamily: FONT.body, fontSize: 24, color: C.cream, fontStyle: "italic" }}>
            đã từng nuôi cậu bé năm nào
          </span>
        </div>
      </div>
    </InkImageScene>
  );
};

// ============================================================
// sc070 (s28) — END CARD — DÒNG KÊNH
// ============================================================
export const Sc070: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (w: string, occ = 1) => A(w, occ) * dur;

  const fBtn = F("đăng ký kênh");
  const fBell = F("bấm chuông");
  const fThanks = F("Cảm ơn bạn đã xem");
  const fDot = fThanks + 12;

  const glyphs = [
    <div key="page" style={{ width: 44, height: 56, border: `2px solid ${C.cream}` }} />,
    <div key="grain" style={{ width: 18, height: 7, borderRadius: 4, background: C.amber, transform: "rotate(-22deg)" }} />,
    <svg key="roof" width="54" height="30" viewBox="0 0 54 30">
      <path d="M 2 28 L 27 4 L 52 28 M 12 28 L 12 14 M 42 28 L 42 14" stroke={C.cream} strokeWidth={3} fill="none" />
    </svg>,
  ];

  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: "rgba(16,12,8,0.93)" }} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 152, textAlign: "center", opacity: cl((frame - (fBtn - 6)) / 10) }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 30, letterSpacing: 8, color: C.cream }}>vn-myth · mùa 2</span>
      </div>

      {/* nút đăng ký vẽ mực */}
      <Ink
        d="M 740 400 H 1220 Q 1260 400 1260 440 V 500 Q 1260 540 1220 540 H 740 Q 700 540 700 500 V 440 Q 700 400 740 400 Z"
        s={fBtn}
        len={20}
        w={6}
        col={C.amber}
      />
      <div style={{ position: "absolute", left: 700, top: 448, width: 470, textAlign: "center", opacity: cl((frame - (fBtn + 12)) / 8) }}>
        <span style={{ fontFamily: FONT.display, fontSize: 44, color: C.cream }}>ĐĂNG KÝ KÊNH</span>
      </div>

      {/* chuông */}
      <Ink d="M 1316 508 C 1310 456 1330 434 1352 434 C 1374 434 1394 456 1388 508 L 1398 522 L 1306 522 Z" s={fBell} len={12} w={5} col={C.amber} />
      <Ink d={circleD(1352, 536, 8)} s={fBell + 10} len={5} w={5} col={C.amber} />
      <Ink d="M 1402 416 C 1422 434 1422 472 1402 490" s={fBell + 12} len={6} w={4} col={C.amber} op={0.7} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 652, textAlign: "center" }}>
        <Reveal startFrac={A("Cảm ơn bạn đã xem")}>
          <span style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, fontStyle: "italic" }}>Cảm ơn bạn đã xem.</span>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 742, textAlign: "center" }}>
        <Reveal startFrac={A("Hẹn gặp lại ở tập sau")}>
          <span style={{ fontFamily: FONT.display, fontSize: 52, color: C.cream }}>Hẹn gặp lại ở tập sau</span>
        </Reveal>
      </div>

      {/* ba vật thể co thành ba chấm */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 872, display: "flex", justifyContent: "center", gap: 64 }}>
        {glyphs.map((g, i) => {
          const s = 1 - sm((frame - (fDot + i * 4)) / 24);
          return (
            <div key={i} style={{ position: "relative", width: 56, height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ opacity: s, transform: `scale(${Math.max(s, 0.05)})` }}>{g}</div>
              <div
                style={{
                  position: "absolute",
                  width: 10,
                  height: 10,
                  borderRadius: 6,
                  background: C.amber,
                  opacity: 1 - s,
                }}
              />
            </div>
          );
        })}
      </div>
    </Paper>
  );
};
