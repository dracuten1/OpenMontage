// S2E01 scenes group "d" — composed from spec_d.json (sc004, sc010, sc016, sc022, sc028, sc034, sc040, sc046, sc052, sc058)
// Speech-lock: useA() returns scene fraction (0..1) at which the anchor word is spoken.
import * as React from "react";
import { useCurrentFrame } from "remotion";
import {
  Paper,
  Reveal,
  CountUp,
  SpringPop,
  InkDraw,
  circleD,
  SourceTag,
  Chip,
  LegendFrame,
  plateSrc,
  InkImageScene,
  useA,
  useFrac,
} from "./common";
import { FONT, C, SceneProps } from "./theme";

const ROOT: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: 1920,
  height: 1080,
};
const INKS: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
};
const CHIP_SPOT: React.CSSProperties = { position: "absolute", left: 64, top: 48 };

/* sc004 (s02) — IMAGE PLATE — SÍNH LỄ TRUYỆN KỂ (img-04) */
export const Sc004: React.FC<SceneProps> = () => {
  const A = useA();
  const v1 = A("voi chín ngà");
  const v2 = v1 + 0.15;
  const v3 = v1 + 0.3;
  const cond = A("đến trước thì được cưới");
  const rows: Array<[string, number]> = [
    ["voi chín ngà", v1],
    ["gà chín cựa", v2],
    ["ngựa chín hồng mao", v3],
  ];
  return (
    <Paper>
      <InkImageScene
        src={plateSrc("img-04-sinh-le.png")}
        label="SÍNH LỄ"
        sublabel="ba lễ vật của truyện kể"
        focus={{ x: 0.4, y: 0.5 }}
      >
        <div style={ROOT}>
          <div style={CHIP_SPOT}>
            <Reveal startFrac={0.02}>
              <Chip color={C.amber}>TRUYỆN KỂ</Chip>
            </Reveal>
          </div>
          <div
            style={{
              position: "absolute",
              right: 88,
              top: 176,
              width: 640,
              background: "rgba(20,17,14,0.82)",
              border: `2px solid ${C.border}`,
              borderRadius: 8,
              padding: "34px 40px",
            }}
          >
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 24,
                letterSpacing: 6,
                color: C.mute,
                marginBottom: 18,
              }}
            >
              VUA RA ĐIỀU KIỆN
            </div>
            {rows.map(([t, at]) => (
              <Reveal key={t} startFrac={at} dy={18}>
                <div
                  style={{
                    fontFamily: FONT.display,
                    fontSize: 52,
                    lineHeight: 1.34,
                    color: C.cream,
                  }}
                >
                  {t}
                </div>
              </Reveal>
            ))}
            <Reveal startFrac={cond} dy={14}>
              <div
                style={{
                  marginTop: 26,
                  paddingTop: 20,
                  borderTop: `1.5px dashed ${C.border}`,
                  fontFamily: FONT.body,
                  fontSize: 31,
                  color: C.amber,
                  fontStyle: "italic",
                }}
              >
                «Ai đem sính lễ đến trước thì được cưới»
              </div>
            </Reveal>
          </div>
          <SourceTag text="Truyện Sơn Tinh, Thủy Tinh — kể từ ghế nhà trường" right />
        </div>
      </InkImageScene>
    </Paper>
  );
};

/* sc010 (s04) — BỐN LỚP THỜI GIAN (diagram, layered paper) */
export const Sc010: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a1 = A("hai trang cổ thư");
  const a2 = A("tấm bản đồ");
  const a3 = A("đắp đê");
  const a4 = A("lễ hội");
  const t = p(a4 + 0.19, a4 + 0.27);
  const hl = p(a4 + 0.09, a4 + 0.13);
  const layers = [
    {
      name: "TRANG CỔ THƯ",
      sub: "kể hai trận đánh khác nhau",
      at: a1,
      c: C.amber,
      ox: -190,
      oy: -130,
      rot: -8,
    },
    {
      name: "TẤM BẢN ĐỒ",
      sub: "vẽ bằng trí nhớ",
      at: a2,
      c: C.bronze,
      ox: -64,
      oy: -44,
      rot: -3,
    },
    {
      name: "ĐẮP ĐÊ",
      sub: "chín thế kỷ",
      at: a3,
      c: C.earthGlow,
      ox: 64,
      oy: 44,
      rot: 3,
    },
    {
      name: "LỄ HỘI",
      sub: "vẫn đang sống",
      at: a4,
      c: C.lampGlow,
      ox: 190,
      oy: 130,
      rot: 8,
    },
  ];
  return (
    <Paper>
      <div style={ROOT}>
        <Reveal startFrac={0.03} style={{ position: "absolute", left: 120, top: 88 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 44, color: C.cream }}>
            BỐN LỚP CỦA MỘT TẬP
          </div>
        </Reveal>
        <Reveal startFrac={0.05} style={{ position: "absolute", left: 122, top: 150 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute }}>
            Bốn lớp, một câu hỏi: chuyện này, đến cùng, ai đang thắng?
          </div>
        </Reveal>
        {layers.map((L, i) => {
          const isHot = i === 3 ? hl : 0;
          return (
            <div
              key={L.name}
              style={{
                position: "absolute",
                left: 960 - 440 + L.ox * (1 - t),
                top: 360 + L.oy * (1 - t),
                width: 880,
                height: 500,
                transform: `rotate(${L.rot * (1 - t)}deg)`,
                zIndex: i + 1,
              }}
            >
              <Reveal startFrac={L.at} dy={0}>
                <div
                  style={{
                    width: "100%",
                    height: 500,
                    background: "rgba(20,17,14,0.66)",
                    border: `${2.5 + isHot * 2.5}px solid ${L.c}`,
                    borderRadius: 10,
                    boxShadow: `0 ${14 + isHot * 6}px ${36 + isHot * 10}px rgba(0,0,0,${0.28 + isHot * 0.2})`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: 28,
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ fontFamily: FONT.display, fontSize: 38, color: L.c }}>{L.name}</div>
                  <div style={{ fontFamily: FONT.body, fontSize: 24, color: C.mute }}>{L.sub}</div>
                </div>
              </Reveal>
            </div>
          );
        })}
        <Reveal startFrac={a4 + 0.09} style={{ position: "absolute", left: 0, right: 0, top: 920, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.body, fontSize: 28, fontStyle: "italic", color: C.lampGlow }}>
            nơi kẻ thua được mời đến trước tiên
          </div>
        </Reveal>
        <div style={{ position: "absolute", left: 0, right: 0, top: 996, textAlign: "center" }}>
          <SpringPop startFrac={a4 + 0.27} from={0.9}>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 28,
                letterSpacing: 4,
                color: C.cream,
                display: "inline-block",
                border: `2px solid ${C.border}`,
                padding: "8px 26px",
                borderRadius: 6,
              }}
            >
              BỐN LỚP · MỘT CÂU HỎI
            </div>
          </SpringPop>
        </div>
      </div>
    </Paper>
  );
};

/* sc016 (s06) — CÂU ĐỐ BẤT KHẢ (diagram, ink animals → dấu hỏi) */
export const Sc016: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aDo = A("câu đố");
  const aKe = A("Truyện kể thế");
  const figOp = 1 - p(aDo - 0.07, aDo + 0.03) * 0.84;
  const qOp = p(aDo - 0.03, aDo + 0.05);
  const bases: Array<{ d: string; at: number }> = [
    // voi
    {
      d: "M 400 420 C 390 330 455 275 520 278 C 585 282 615 340 608 402 C 605 418 596 426 584 428 M 400 420 C 396 438 394 452 396 466 M 400 420 C 382 430 368 450 374 472 C 377 483 372 492 364 496 M 448 424 L 444 486 M 500 428 L 498 488 M 556 424 L 558 486",
      at: 0.02,
    },
    // gà
    {
      d: "M 880 400 C 892 340 950 320 1000 334 C 1040 346 1054 376 1044 400 C 1026 424 952 430 912 418 M 1000 334 C 1008 314 1028 308 1040 318 L 1066 310 L 1044 330 M 1010 316 C 1014 304 1024 302 1028 310 M 892 356 C 862 322 828 314 810 324 C 832 336 850 354 862 372 M 952 428 L 952 470 M 984 426 L 984 470",
      at: 0.06,
    },
    // ngựa
    {
      d: "M 1330 416 C 1332 348 1385 310 1445 312 C 1505 314 1540 356 1536 410 C 1534 420 1526 426 1516 428 M 1445 312 C 1452 278 1478 260 1506 264 L 1548 276 L 1512 294 C 1504 296 1496 296 1490 300 M 1372 424 L 1368 486 M 1420 428 L 1418 488 M 1476 426 L 1478 488 M 1516 424 L 1520 486 M 1330 416 C 1310 430 1300 452 1304 474",
      at: 0.1,
    },
  ];
  // chi tiết bất khả — mọc theo ba vế phủ định
  const extras: Array<{ d: string; at: number; c: string }> = [
    { d: "M 430 404 L 396 380 M 432 408 L 392 402 M 434 412 L 396 424 M 436 416 L 404 442", at: 0.16, c: C.amber }, // voi mọc thêm ngà
    { d: "M 952 462 L 936 476 M 952 462 L 968 476 M 984 460 L 968 474 M 984 460 L 1000 474", at: 0.31, c: C.amber }, // gà mọc thêm cựa
    {
      d: "M 1458 286 C 1444 292 1434 302 1428 314 M 1470 276 C 1456 282 1444 292 1436 306 M 1484 270 C 1470 276 1458 288 1450 302",
      at: 0.45,
      c: C.warn,
    }, // ngựa mọc thêm hồng mao
  ];
  return (
    <Paper>
      <div style={ROOT}>
        <div style={CHIP_SPOT}>
          <Reveal startFrac={0.02}>
            <Chip color={C.amber}>TRUYỆN KỂ</Chip>
          </Reveal>
        </div>
        <div style={{ ...INKS, opacity: figOp }}>
          {bases.map((b, i) => (
            <InkDraw key={`b${i}`} d={b.d} startFrac={b.at} endFrac={b.at + 0.09} stroke={C.cream} strokeWidth={5} style={INKS} />
          ))}
          {extras.map((e, i) => (
            <InkDraw key={`e${i}`} d={e.d} startFrac={e.at} endFrac={e.at + 0.05} stroke={e.c} strokeWidth={5} style={INKS} />
          ))}
        </div>
        <div style={{ ...INKS, opacity: qOp }}>
          <InkDraw
            d="M 900 430 C 900 340 1020 330 1030 420 C 1036 480 970 490 966 550"
            startFrac={aDo}
            endFrac={aDo + 0.09}
            stroke={C.cream}
            strokeWidth={14}
            style={INKS}
          />
          <InkDraw d={circleD(964, 616, 15)} startFrac={aDo + 0.07} endFrac={aDo + 0.1} stroke={C.cream} strokeWidth={13} style={INKS} />
        </div>
        <Reveal startFrac={aDo - 0.2} style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.mute }}>
            «đó không còn là lễ vật để người thường dâng vua»
          </div>
        </Reveal>
        <Reveal startFrac={aDo + 0.05} style={{ position: "absolute", left: 0, right: 0, top: 764, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.display, fontSize: 46, color: C.cream }}>
            câu đố người thường không giải nổi
          </div>
        </Reveal>
        <div style={{ position: "absolute", left: 0, right: 0, top: 884, textAlign: "center" }}>
          <SpringPop startFrac={aKe} from={0.85}>
            <div
              style={{
                display: "inline-block",
                fontFamily: FONT.display,
                fontSize: 40,
                color: C.amber,
                border: `3px solid ${C.amber}`,
                borderRadius: 6,
                padding: "10px 30px",
                transform: "rotate(-3deg)",
              }}
            >
              Truyện kể thế.
            </div>
          </SpringPop>
        </div>
        <SourceTag text="Truyện Sơn Tinh, Thủy Tinh — nguyên văn sính lễ" right />
      </div>
    </Paper>
  );
};

/* sc022 (s08) — IMAGE PLATE — THỦY TINH ĐUỔI THEO (img-02) */
export const Sc022: React.FC<SceneProps> = () => {
  const A = useA();
  const frame = useCurrentFrame();
  const aMua = A("rấy mưa");
  const aNuoc = aMua + 0.18; // "dồn nước tràn rẫy"
  const aTe = A("thủy tộc");
  const cloudXs = [500, 930, 1360];
  const rain: Array<{ d: string; at: number }> = [];
  cloudXs.forEach((cx) => {
    for (let i = 0; i < 5; i++) {
      const x = cx + (i - 2) * 46;
      rain.push({ d: `M ${x} 258 L ${x - 26} 330`, at: aMua + i * 0.008 });
    }
  });
  const fishXs = [430, 780, 1140];
  const sprites = [
    ...fishXs.map((x) => ({ x, kind: "fish" as const })),
    { x: 1500, kind: "turtle" as const },
  ];
  return (
    <Paper>
      <InkImageScene src={plateSrc("img-02-thuy-tinh.png")} label="THỦY TINH ĐUỔI THEO" sublabel="«bèn nổi mây, rấy mưa, dồn nước tràn rẫy»">
        <div style={ROOT}>
          {cloudXs.map((cx, i) => (
            <InkDraw
              key={`cl${i}`}
              d={`M ${cx - 76} 212 C ${cx - 76} 172 ${cx - 38} 152 ${cx} 166 C ${cx + 12} 128 ${cx + 68} 124 ${cx + 90} 158 C ${cx + 128} 146 ${cx + 160} 176 ${cx + 152} 210`}
              startFrac={aMua - 0.08 + i * 0.012}
              endFrac={aMua - 0.02 + i * 0.012}
              stroke={C.mute}
              strokeWidth={6}
              style={INKS}
            />
          ))}
          {rain.map((r, i) => (
            <InkDraw key={`rn${i}`} d={r.d} startFrac={r.at} endFrac={r.at + 0.025} stroke={C.teal} strokeWidth={4} style={INKS} />
          ))}
          <Reveal startFrac={aNuoc} dy={-24} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 210 }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(to top, rgba(56,120,116,0.62), rgba(56,120,116,0))",
              }}
            />
          </Reveal>
          <InkDraw
            d="M 300 940 C 500 915 760 965 960 940 C 1160 915 1420 965 1620 940"
            startFrac={aNuoc + 0.02}
            endFrac={aNuoc + 0.1}
            stroke={C.teal}
            strokeWidth={5}
            style={INKS}
          />
          <InkDraw
            d="M 340 988 C 540 963 780 1010 980 988 C 1180 963 1400 1010 1600 988"
            startFrac={aNuoc + 0.05}
            endFrac={aNuoc + 0.13}
            stroke={C.teal}
            strokeWidth={4}
            style={INKS}
          />
          {sprites.map((sp, i) => {
            const at = aTe + i * 0.026;
            const bob = Math.sin(Math.max(0, frame - at * 344) * 0.12) * 6;
            return (
              <div
                key={`sp${i}`}
                style={{ position: "absolute", left: sp.x, top: 916 + bob, width: 130, height: 80 }}
              >
                <SpringPop startFrac={at} from={0.75}>
                  {sp.kind === "fish" ? (
                    <svg width="130" height="80" viewBox="0 0 130 80">
                      <path
                        d="M10 40 C32 14 86 14 104 40 C86 66 32 66 10 40 M104 40 L126 22 L126 58 Z"
                        fill="none"
                        stroke={C.cream}
                        strokeWidth="4"
                        strokeLinejoin="round"
                      />
                      <circle cx="34" cy="34" r="4" fill={C.cream} />
                    </svg>
                  ) : (
                    <svg width="130" height="80" viewBox="0 0 130 80">
                      <path d="M28 46 a26 17 0 1 1 52 0 a26 17 0 1 1 -52 0" fill="none" stroke={C.cream} strokeWidth="4" />
                      <circle cx="96" cy="50" r="9" fill="none" stroke={C.cream} strokeWidth="4" />
                      <path
                        d="M34 62 L26 76 M56 64 L52 78 M80 62 L86 76"
                        fill="none"
                        stroke={C.cream}
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </SpringPop>
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 88,
              top: 796,
              width: 640,
              background: "rgba(20,17,14,0.8)",
              border: `2px solid ${C.border}`,
              borderRadius: 8,
              padding: "24px 30px",
            }}
          >
            {([
              ["«bèn nổi mây, rấy mưa,", aMua - 0.08],
              ["dồn nước tràn rẫy,", aNuoc],
              ["đem các thủy tộc đuổi theo»", aTe],
            ] as Array<[string, number]>).map(([txt, at], i) => (
              <Reveal key={`q${i}`} startFrac={at} dy={12}>
                <div style={{ fontFamily: FONT.body, fontSize: 30, lineHeight: 1.4, color: C.cream }}>
                  {txt}
                </div>
              </Reveal>
            ))}
          </div>
          <SourceTag text="Đại Việt sử ký toàn thư — nguyên văn" right />
        </div>
      </InkImageScene>
    </Paper>
  );
};

/* sc028 (s11) — BỊ CHẶN → ĐI VÒNG (diagram, sơ đồ tối giản) */
export const Sc028: React.FC<SceneProps> = () => {
  const A = useA();
  const aTL = A("Từ Liêm");
  const aDV = A("đi vòng");
  const hit = aTL + 0.12; // "cửa ngõ … đã bị đóng"
  const aLabels = aDV + 0.32; // "có xuất phát, có hướng, có mục tiêu"
  const netV = [1272, 1291, 1310, 1329, 1348, 1364];
  const netH = [440, 495, 550, 605, 655];
  const labels: Array<[string, number, number, number]> = [
    ["CÓ XUẤT PHÁT", 1128, 640, 0],
    ["CÓ HƯỚNG", 918, 812, 1],
    ["CÓ MỤC TIÊU", 520, 952, 2],
  ];
  return (
    <Paper>
      <div style={ROOT}>
        <Reveal startFrac={0.03} style={{ position: "absolute", left: 120, top: 88 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 44, color: C.cream }}>BỊ CHẶN → ĐI VÒNG</div>
        </Reveal>
        <Reveal startFrac={0.05} style={{ position: "absolute", left: 122, top: 150 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute }}>
            Lưới sắt chắn ngang thượng nguồn — nhìn bằng hình học, chưa dùng bản đồ
          </div>
        </Reveal>
        {/* mũi tên nước tiến thẳng */}
        <InkDraw d="M 480 540 H 1240" startFrac={0.05} endFrac={0.14} stroke={C.cream} strokeWidth={7} style={INKS} />
        <InkDraw d="M 1214 522 L 1246 540 L 1214 558" startFrac={0.13} endFrac={0.16} stroke={C.cream} strokeWidth={7} style={INKS} />
        {/* cổng lưới */}
        <InkDraw
          d={`M 1266 414 H 1366 V 666 H 1266${netV.map((x) => ` M ${x} 420 V 660`).join("")}${netH
            .map((y) => ` M 1268 ${y} H 1362`)
            .join("")}`}
          startFrac={0.07}
          endFrac={0.17}
          stroke={C.cream}
          strokeWidth={4}
          style={INKS}
        />
        <InkDraw d="M 1268 470 L 1362 610 M 1362 470 L 1268 610" startFrac={hit} endFrac={hit + 0.02} stroke={C.warn} strokeWidth={6} style={INKS} />
        <InkDraw d="M 1246 540 C 1226 540 1216 552 1218 566" startFrac={hit + 0.02} endFrac={hit + 0.05} stroke={C.warn} strokeWidth={6} style={INKS} />
        <div style={{ position: "absolute", left: 1258, top: 336 }}>
          <SpringPop startFrac={aTL} from={0.85}>
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 34,
                color: C.amber,
                background: "rgba(20,17,14,0.85)",
                border: `2.5px solid ${C.amber}`,
                borderRadius: 6,
                padding: "8px 22px",
                whiteSpace: "nowrap",
              }}
            >
              TỪ LIÊM
            </div>
          </SpringPop>
        </div>
        <Reveal startFrac={0.16} style={{ position: "absolute", left: 1408, top: 516 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute, whiteSpace: "nowrap" }}>
            → KINH ĐÔ (cửa ngõ bị đóng)
          </div>
        </Reveal>
        {/* đường lượn vòng về tây nam */}
        <InkDraw
          d="M 1226 566 C 1150 640 1080 720 990 780 C 860 862 720 892 560 900"
          startFrac={aDV}
          endFrac={aDV + 0.11}
          stroke={C.teal}
          strokeWidth={7}
          style={INKS}
        />
        <InkDraw d="M 596 884 L 552 900 L 594 924" startFrac={aDV + 0.1} endFrac={aDV + 0.13} stroke={C.teal} strokeWidth={7} style={INKS} />
        {labels.map(([txt, x, y, i]) => (
          <div key={`lb${i}`} style={{ position: "absolute", left: x, top: y }}>
            <SpringPop startFrac={aLabels + i * 0.04} from={0.85}>
              <Chip color={C.teal}>
                <span style={{ fontSize: 25 }}>{txt}</span>
              </Chip>
            </SpringPop>
          </div>
        ))}
        <Reveal startFrac={aDV + 0.1} style={{ position: "absolute", left: 1560, top: 944 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 28, color: C.teal, whiteSpace: "nowrap" }}>↙ TÂY NAM</div>
        </Reveal>
        <SourceTag text="Đại Việt sử ký toàn thư — lưới sắt Từ Liêm" right />
      </div>
    </Paper>
  );
};

/* sc034 (s14) — MAP STAGE — LỚP THỦY VĂN (img-08, mọi chữ là overlay) */
export const Sc034: React.FC<SceneProps> = () => {
  const A = useA();
  const frame = useCurrentFrame();
  const { p } = useFrac();
  const aLu = A("từ tháng 6 đến tháng 10");
  const aAm = A("tháng 7, tháng 8");
  const wash = p(Math.max(0.04, aLu - 0.3), Math.max(0.1, aLu - 0.18)) * 0.16;
  const routeOp = p(0.02, 0.08);
  const bandOp = p(aLu - 0.06, aLu + 0.04) * 0.5;
  const river = "M 1500 300 C 1380 380 1240 430 1120 500 C 980 580 900 640 760 720 C 660 780 560 820 440 840";
  const dashOff = `${-((frame * 2.2) % 60)}`;
  return (
    <Paper>
      <InkImageScene src={plateSrc("img-08-ban-do.png")} label="LỚP THỦY VĂN HÔM NAY" sublabel="trên đúng tấm bản đồ ấy">
        <div style={ROOT}>
          <div style={{ position: "absolute", inset: 0, background: C.teal, opacity: wash }} />
          <svg
            width={1920}
            height={1080}
            viewBox="0 0 1920 1080"
            style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
          >
            <g opacity={routeOp}>
              <path d={river} fill="none" stroke={C.amber} strokeWidth={5} strokeDasharray="14 10" opacity={0.8} />
            </g>
            <g opacity={bandOp}>
              <path d={river} fill="none" stroke={C.teal} strokeWidth={26} strokeLinecap="round" />
            </g>
            <path
              d={river}
              fill="none"
              stroke={C.white}
              strokeWidth={8}
              strokeDasharray="26 34"
              strokeDashoffset={dashOff}
              opacity={bandOp}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: "absolute", right: 88, bottom: 96, width: 800 }}>
            <LegendFrame label="MÙA LŨ CHÂU THỔ">
              <Reveal startFrac={aLu + 0.02} dy={12}>
                <div style={{ fontFamily: FONT.body, fontSize: 27, color: C.cream, margin: "4px 0" }}>
                  mùa lũ: tháng 6 – 10 · đỉnh ~tháng 8
                </div>
              </Reveal>
              <Reveal startFrac={aAm} dy={12}>
                <div
                  style={{
                    fontFamily: FONT.body,
                    fontSize: 27,
                    color: C.amber,
                    borderTop: `1.5px dashed ${C.border}`,
                    paddingTop: 10,
                    marginTop: 6,
                  }}
                >
                  ≈ tháng 7 – 8 âm lịch (khung sách chép)
                </div>
              </Reveal>
            </LegendFrame>
          </div>
          <div style={{ position: "absolute", left: 96, bottom: 96 }}>
            <Reveal startFrac={aLu}>
              <Chip color={C.teal}>ĐỈNH ~THÁNG 8</Chip>
            </Reveal>
          </div>
          <SourceTag text="Thủy văn châu thổ — lớp phủ hôm nay" right />
        </div>
      </InkImageScene>
    </Paper>
  );
};

/* sc040 (s17) — IMAGE PLATE — ĐÊ HAI BỜ 1248 (img-10) */
export const Sc040: React.FC<SceneProps> = () => {
  const A = useA();
  const aN = A("từ đầu nguồn");
  const aB = A("cửa biển");
  const drawEnd = aB + 0.02;
  const hatches: Array<[number, number, number]> = [
    [500, 436, 1],
    [760, 472, 2],
    [1010, 536, 3],
    [1240, 624, 4],
    [1450, 718, 5],
  ];
  return (
    <Paper>
      <InkImageScene src={plateSrc("img-10-de-1248.png")} label="NĂM 1248 — ĐÊ HAI BỜ" sublabel="quan đê trông đoàn dân phu" focus={{ x: 0.58, y: 0.52 }}>
        <div style={ROOT}>
          <InkDraw d="M 240 150 H 1560" startFrac={0.04} endFrac={0.12} stroke={C.mute} strokeWidth={3} style={INKS} />
          <InkDraw d="M 1300 128 V 172" startFrac={0.12} endFrac={0.16} stroke={C.cream} strokeWidth={5} style={INKS} />
          <div style={{ position: "absolute", left: 1180, top: 176 }}>
            <SpringPop startFrac={0.13} from={0.85}>
              <div style={{ fontFamily: FONT.display, fontSize: 58, color: C.cream, whiteSpace: "nowrap" }}>
                <CountUp to={1248} startFrac={0.13} endFrac={0.21} />
              </div>
            </SpringPop>
            <Reveal startFrac={0.19} dy={10}>
              <div style={{ fontFamily: FONT.mono, fontSize: 23, letterSpacing: 2, color: C.mute, whiteSpace: "nowrap" }}>
                ĐẮP ĐÊ HAI BỜ — TỪ ĐẦU NGUỒN RA CỬA BIỂN
              </div>
            </Reveal>
          </div>
          {/* nét đê kéo dài từ nguồn ra biển, đúng nhịp chiếu */}
          <InkDraw d="M 330 420 C 720 450 1020 570 1560 780" startFrac={aN} endFrac={drawEnd} stroke={C.earthGlow} strokeWidth={9} style={INKS} />
          <div style={{ ...INKS, opacity: 0.85 }}>
            <InkDraw d="M 350 452 C 740 486 1030 606 1548 812" startFrac={aN + 0.02} endFrac={drawEnd} stroke={C.earthGlow} strokeWidth={6} style={INKS} />
          </div>
          {hatches.map(([x, y, i]) => (
            <InkDraw
              key={`h${i}`}
              d={`M ${x} ${y} L ${x + 20} ${y + 28}`}
              startFrac={aN + ((drawEnd - aN) * i) / 6}
              endFrac={aN + ((drawEnd - aN) * i) / 6 + 0.012}
              stroke={C.mute}
              strokeWidth={4}
              style={INKS}
            />
          ))}
          <div style={{ position: "absolute", left: 236, top: 380 }}>
            <Reveal startFrac={aN + 0.02} dy={10}>
              <Chip color={C.amber}>ĐẦU NGUỒN</Chip>
            </Reveal>
          </div>
          <div style={{ position: "absolute", left: 1408, top: 848 }}>
            <Reveal startFrac={aB} dy={10}>
              <Chip color={C.teal}>CỬA BIỂN</Chip>
            </Reveal>
          </div>
          <InkDraw
            d="M 1560 856 C 1600 846 1640 866 1680 856 M 1540 884 C 1580 874 1620 894 1660 884"
            startFrac={aB + 0.02}
            endFrac={aB + 0.07}
            stroke={C.teal}
            strokeWidth={5}
            style={INKS}
          />
          <SourceTag text="Đại Việt sử ký toàn thư — chiếu đắp đê 1248" right />
        </div>
      </InkImageScene>
    </Paper>
  );
};

/* sc046 (s20) — TRANG GIẤY ĐÔI — NÚI NÂNG / ĐÊ NỐI (diagram) */
export const Sc046: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aSd = A("Sử chép đê");
  const aNui = A("Núi nâng lên");
  const aDe = A("Đê nối liền");
  const aHai = A("hai lớp của một trang giấy");
  const t = p(aHai - 0.005, aHai + 0.06);
  const suLines: Array<[string, number]> = [
    ["Sử chép đê.", aSd],
    ["Sử chép quan đê.", aSd + 0.028],
    ["Sử chép chỗ vỡ, năm đói, lệnh đắp.", aSd + 0.059],
  ];
  return (
    <Paper>
      <div style={ROOT}>
        <Reveal startFrac={0.03} style={{ position: "absolute", left: 0, right: 0, top: 88, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute }}>
            suốt chín thế kỷ, sử không chép chữ nào nói thần núi thắng
          </div>
        </Reveal>
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center" }}>
          {suLines.map(([txt, at]) => (
            <Reveal key={txt} startFrac={at} dy={14}>
              <div style={{ fontFamily: FONT.display, fontSize: 38, color: C.cream, lineHeight: 1.45 }}>{txt}</div>
            </Reveal>
          ))}
        </div>
        {/* trang trái — truyện (amber) */}
        <div
          style={{
            position: "absolute",
            left: 380 + t * 250,
            top: 400,
            width: 520,
            height: 520,
            transform: `rotate(${-3 * (1 - t)}deg)`,
          }}
        >
          <Reveal startFrac={aNui} dy={20}>
            <div
              style={{
                width: 520,
                height: 520,
                background: "rgba(217,164,65,0.12)",
                border: `2.5px solid ${C.amber}`,
                borderRadius: 8,
                padding: 30,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <InkDraw
                d="M 120 330 L 190 210 L 260 330 M 190 210 C 186 192 198 180 210 196 M 260 330 L 315 235 L 370 330"
                startFrac={aNui + 0.02}
                endFrac={aNui + 0.1}
                viewBox="0 0 520 400"
                stroke={C.amber}
                strokeWidth={6}
                style={{ width: 520, height: 400 }}
              />
              <div style={{ flex: 1 }} />
              <Chip color={C.amber}>TRUYỆN KỂ</Chip>
              <div style={{ fontFamily: FONT.display, fontSize: 32, color: C.cream, marginTop: 14, whiteSpace: "nowrap" }}>
                Núi nâng lên, trong truyện
              </div>
            </div>
          </Reveal>
        </div>
        {/* trang phải — sử (teal) */}
        <div
          style={{
            position: "absolute",
            left: 1020 - t * 250,
            top: 400,
            width: 520,
            height: 520,
            transform: `rotate(${3 * (1 - t)}deg)`,
          }}
        >
          <Reveal startFrac={aDe} dy={20}>
            <div
              style={{
                width: 520,
                height: 520,
                background: "rgba(127,209,200,0.1)",
                border: `2.5px solid ${C.teal}`,
                borderRadius: 8,
                padding: 30,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <InkDraw
                d="M 130 330 L 160 230 L 290 230 L 320 330 Z M 160 290 L 290 290 M 148 312 L 302 312 M 110 348 C 130 338 150 358 170 348 C 190 338 210 358 230 348"
                startFrac={aDe + 0.02}
                endFrac={aDe + 0.1}
                viewBox="0 0 520 400"
                stroke={C.teal}
                strokeWidth={6}
                style={{ width: 520, height: 400 }}
              />
              <div style={{ flex: 1 }} />
              <Chip color={C.teal}>CHÍNH SỬ</Chip>
              <div style={{ fontFamily: FONT.display, fontSize: 32, color: C.cream, marginTop: 14, whiteSpace: "nowrap" }}>
                Đê nối liền, ngoài đời
              </div>
            </div>
          </Reveal>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 972, textAlign: "center" }}>
          <SpringPop startFrac={aHai + 0.06} from={0.9}>
            <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.amber, whiteSpace: "nowrap" }}>
              «Chúng là hai lớp của một trang giấy.»
            </div>
          </SpringPop>
        </div>
        <SourceTag text="Truyện kể và chính sử — hai lớp một trang giấy" right />
      </div>
    </Paper>
  );
};

/* sc052 (s23) — QUOTE-CARD S2-C1 NGUYÊN VĂN — HERO TOÀN TẬP */
export const Sc052: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aLead = A("câu chốt của tối nay");
  const aQ1 = A("Sơn Tinh thắng mỗi năm một lần");
  const aQ3 = A("cùng một công việc");
  const c2 = aQ1 + 0.17;
  const c3 = Math.max(aQ3 - 0.29, c2 + 0.06);
  const leadOp = 1 - p(aQ1 - 0.016, aQ1 + 0.03) * 0.7;
  const cl = (at: number) => 0.22 + p(at - 0.012, at + 0.03) * 0.78;
  return (
    <Paper variant="night">
      <div style={ROOT}>
        <div style={CHIP_SPOT}>
          <Reveal startFrac={aLead}>
            <Chip color={C.amber}>CÂU CHỐT CỦA TỐI NAY</Chip>
          </Reveal>
        </div>
        <div style={{ ...INKS, opacity: leadOp }}>
          <Reveal startFrac={aLead} style={{ position: "absolute", left: 0, right: 0, top: 208, textAlign: "center" }}>
            <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute }}>
              Nếu chỉ giữ lại được một câu sau tập này,
            </div>
          </Reveal>
          <Reveal startFrac={aLead + 0.06} style={{ position: "absolute", left: 0, right: 0, top: 262, textAlign: "center" }}>
            <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute }}>hãy giữ câu này:</div>
          </Reveal>
        </div>
        <div style={{ position: "absolute", left: 260, right: 260, top: 400, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.display, fontSize: 58, lineHeight: 1.4, color: C.cream, opacity: cl(aQ1) }}>
            «Sơn Tinh thắng mỗi năm một lần —
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 48, lineHeight: 1.45, color: C.cream, opacity: cl(c2) }}>
            trận đánh không có hồi kết vì nước không đầu hàng;
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 44, lineHeight: 1.45, color: C.cream, opacity: cl(c3) }}>
            từ đê Cơ Xá 1108 đến ba mốc báo động hôm nay
            <br />
            là cùng một công việc.»
          </div>
        </div>
        <InkDraw d="M 660 880 H 1260" startFrac={aQ3} endFrac={aQ3 + 0.04} stroke={C.amber} strokeWidth={3} style={INKS} />
        <SourceTag text="S2-C1 · nguyên văn — đọc một lần" right />
      </div>
    </Paper>
  );
};

/* sc058 (s26) — VÒNG TRÒN KHÉP CỦA CẢ TẬP (diagram, nền tối) */
export const Sc058: React.FC<SceneProps> = () => {
  const A = useA();
  const aHN = A("hằng năm vẫn đến");
  const aGiu = A("giữ Thủy Tinh ở lại");
  const aM1 = A("Mùa một đi tìm tổ tiên");
  const aM2 = aM1 + 0.13;
  const icons: Array<{
    key: string;
    label: string;
    x: number;
    y: number;
    at: number;
    svg: React.ReactNode;
  }> = [
    {
      key: "de",
      label: "THÂN ĐÊ",
      x: 660,
      y: 470,
      at: aHN + 0.01,
      svg: (
        <svg width="96" height="96" viewBox="0 0 96 96">
          <path d="M14 74 L34 28 L62 28 L82 74" fill="none" stroke={C.cream} strokeWidth="4" strokeLinejoin="round" />
          <path d="M34 54 L62 54 M26 66 L70 66 M8 74 H88" fill="none" stroke={C.cream} strokeWidth="3" />
        </svg>
      ),
    },
    {
      key: "thu",
      label: "TRANG CỔ THƯ",
      x: 960,
      y: 170,
      at: aGiu + 0.03,
      svg: (
        <svg width="96" height="96" viewBox="0 0 96 96">
          <rect x="20" y="20" width="56" height="56" rx="4" fill="none" stroke={C.cream} strokeWidth="4" />
          <path
            d="M20 20 C10 20 10 34 20 34 M76 76 C86 76 86 62 76 62 M32 38 H64 M32 50 H64 M32 62 H48"
            fill="none"
            stroke={C.cream}
            strokeWidth="3"
          />
        </svg>
      ),
    },
    {
      key: "thuoc",
      label: "VẠCH THƯỚC NƯỚC",
      x: 1260,
      y: 470,
      at: aGiu + 0.09,
      svg: (
        <svg width="96" height="96" viewBox="0 0 96 96">
          <rect x="40" y="8" width="16" height="80" fill="none" stroke={C.cream} strokeWidth="4" />
          <path d="M40 26 H56 M40 46 H56 M40 66 H56" fill="none" stroke={C.cream} strokeWidth="3" />
          <circle cx="48" cy="66" r="4" fill={C.lampRed} />
        </svg>
      ),
    },
    {
      key: "thuyen",
      label: "THUYỀN ĐUỐC",
      x: 960,
      y: 770,
      at: aGiu + 0.15,
      svg: (
        <svg width="96" height="96" viewBox="0 0 96 96">
          <path d="M12 62 C26 78 70 78 84 62" fill="none" stroke={C.cream} strokeWidth="4" strokeLinecap="round" />
          <path d="M48 62 V22" fill="none" stroke={C.cream} strokeWidth="3" />
          <circle cx="48" cy="16" r="4" fill={C.lampGlow} />
          <path d="M48 6 V2 M38 10 L34 4 M58 10 L62 4" fill="none" stroke={C.lampGlow} strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
    },
  ];
  return (
    <Paper variant="night">
      <div style={ROOT}>
        <Reveal startFrac={0.03} style={{ position: "absolute", left: 0, right: 0, top: 84, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 34, letterSpacing: 5, color: C.cream }}>
            VÒNG TRÒN KHÉP CỦA CẢ TẬP
          </div>
        </Reveal>
        {/* nét tròn khép kín đúng nhịp «giữ Thủy Tinh ở lại» */}
        <InkDraw d={circleD(960, 470, 300)} startFrac={aGiu} endFrac={aGiu + 0.18} stroke={C.mute} strokeWidth={3} style={INKS} />
        {icons.map((ic) => (
          <div
            key={ic.key}
            style={{
              position: "absolute",
              left: ic.x - 100,
              top: ic.y - 70,
              width: 200,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <SpringPop startFrac={ic.at} from={0.8}>
              {ic.svg}
            </SpringPop>
            <Reveal startFrac={ic.at + 0.03} dy={8}>
              <div style={{ fontFamily: FONT.body, fontSize: 21, letterSpacing: 2, color: C.mute, marginTop: 8, whiteSpace: "nowrap" }}>
                {ic.label}
              </div>
            </Reveal>
          </div>
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 946, textAlign: "center" }}>
          <Reveal startFrac={aM1} dy={16}>
            <div style={{ fontFamily: FONT.display, fontSize: 38, color: C.cream }}>Mùa một đi tìm tổ tiên.</div>
          </Reveal>
          <Reveal startFrac={aM2} dy={16}>
            <div style={{ fontFamily: FONT.display, fontSize: 38, color: C.cream, marginTop: 10 }}>
              Mùa hai ở lại với các vị thần.
            </div>
          </Reveal>
        </div>
        <SourceTag text="Đền Hùng — thuyền rước sông Đà · hai mùa" right />
      </div>
    </Paper>
  );
};
