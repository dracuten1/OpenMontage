// EP.06 xi-vu-ba-toc scenes group B (S3-B) — sc012–sc022:
// ba màu mực + nến (sc012), hồ sơ Sử ký một câu (sc013), trang trắng tro chồng (sc014),
// Ký Châu trong sương (sc015), 3 ngày + xe chỉ nam (sc016), 81 anh em (sc017),
// lá cờ dẹp loạn (sc018), Lưu Bang tế (sc019), kỳ Xi Vưu + mộ đầu (sc020),
// tang vật 01 bia Vũ Thị Từ (sc021), ngũ binh khoanh trên ảnh (sc022).
// Speech-lock: mọi reveal/pop/draw/count bắn tại A("từ") — fraction của scene.
import * as React from "react";
import { Img } from "remotion";
import {
  Chip,
  CountUp,
  DossierBadge,
  InkDraw,
  InkImageScene,
  LegendFrame,
  Paper,
  Reveal,
  SceneTitle,
  SpringPop,
  SourceTag,
  WipeInk,
  circleD,
  ease,
  plateSrc,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

// sc012 — BA MÀU MỰC + BA NGỌN NẾN (s06)
export const Sc012: React.FC<SceneProps> = () => {
  const A = useA();
  const aTT = A("truyền thuyết"); // «truyền thuyết màu hổ phách»
  const aKY = A("ký ức"); // «ký ức màu đỏ trầm»
  const aKH = A("khoa học"); // «khoa học màu xanh lục»
  const aRen = A("Tấm gương đã được rèn");
  const aNen = A("Mời ngọn nến đầu tiên");
  const rows = [
    { at: aTT, c: C.amber, t: "TRUYỀN THUYẾT", s: "màu hổ phách" },
    { at: aKY, c: C.lampRed, t: "KÝ ỨC", s: "màu đỏ trầm" },
    { at: aKH, c: C.teal, t: "KHOA HỌC", s: "màu xanh lục" },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", left: 90, top: 56 }}>
        <SceneTitle
          eyebrow="LUẬT CHƠI PHIÊN TÒA"
          title="Ba lớp mực"
          subtitle="mỗi lớp chứng cứ — một màu mực"
          startFrac={aTT}
          titleSize={60}
        />
      </div>
      {rows.map((r, i) => (
        <SpringPop key={r.t} startFrac={r.at} from={0.88}>
          <div
            style={{
              position: "absolute",
              top: 316 + i * 116,
              left: 540,
              width: 880,
              display: "flex",
              alignItems: "center",
              gap: 30,
            }}
          >
            <div style={{ width: 120, height: 24, background: r.c, borderRadius: 5 }} />
            <div>
              <div
                style={{
                  fontFamily: FONT.display,
                  fontWeight: 700,
                  fontSize: 46,
                  color: r.c,
                  letterSpacing: 3,
                }}
              >
                {r.t}
              </div>
              <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute }}>{r.s}</div>
            </div>
          </div>
        </SpringPop>
      ))}
      {/* mép gương đồng */}
      <div style={{ position: "absolute", left: 260, top: 660, width: 1400, height: 420 }}>
        <InkDraw
          d={circleD(700, 1160, 1140)}
          startFrac={aRen}
          endFrac={aRen + 0.13}
          viewBox="0 0 1400 420"
          stroke={C.bronze}
          strokeWidth={5}
        />
      </div>
      {/* tro xoáy kết tinh mặt gương */}
      <div style={{ position: "absolute", left: 820, top: 640, width: 280, height: 200 }}>
        <InkDraw
          d={circleD(140, 130, 46)}
          startFrac={aRen + 0.06}
          endFrac={aRen + 0.14}
          viewBox="0 0 280 200"
          stroke={C.amber}
          strokeWidth={4}
        />
        <InkDraw
          d={circleD(140, 130, 80)}
          startFrac={aRen + 0.1}
          endFrac={aRen + 0.2}
          viewBox="0 0 280 200"
          stroke={C.cream}
          strokeWidth={3}
        />
      </div>
      {[700, 960, 1220].map((x, i) => (
        <div key={x} style={{ position: "absolute", left: x - 22, top: 634, width: 44, height: 112 }}>
          <div
            style={{
              position: "absolute",
              left: 17,
              top: 48,
              width: 10,
              height: 62,
              background: C.cream,
              opacity: 0.82,
              borderRadius: 3,
            }}
          />
          <SpringPop startFrac={aNen + i * 0.07} from={0.2}>
            <div
              style={{
                position: "absolute",
                left: 14,
                top: 22,
                width: 16,
                height: 26,
                background: C.lampGlow,
                borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
                boxShadow: "0 0 26px rgba(242,180,92,0.95)",
              }}
            />
          </SpringPop>
        </div>
      ))}
      <Reveal startFrac={aNen + 0.2} style={{ position: "absolute", bottom: 64, left: 0, right: 0, textAlign: "center" }}>
        <Chip color={C.amber}>hồi một — kẻ thua được thờ</Chip>
      </Reveal>
      <WipeInk startFrac={0.9} color={C.bg} />
    </Paper>
  );
};

// sc013 — HỒ SƠ: SỬ KÝ MỘT CÂU (s07)
export const Sc013: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aSK = A("Sử ký Tư Mã Thiên");
  const aTL = A("trận Trác Lộc");
  const aMC = A("đúng một câu");
  return (
    <Paper>
      <DossierBadge text="HỒ SƠ — CHÍNH SỬ" />
      <div style={{ position: "absolute", left: 340, top: 210, width: 1240, height: 660 }}>
        <InkDraw
          d="M 0 0 H 1240 V 660 H 0 Z"
          startFrac={aSK}
          endFrac={aSK + 0.06}
          viewBox="0 0 1240 660"
          stroke={C.cream}
          strokeWidth={3}
        />
        <div
          style={{
            position: "absolute",
            inset: 14,
            border: `1px solid ${C.border}`,
            opacity: ease(p(aSK + 0.04, aSK + 0.08)) * 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 64,
          }}
        >
          <Reveal startFrac={aSK + 0.02} endFrac={aSK + 0.06}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 50,
                color: C.amber,
                letterSpacing: 4,
              }}
            >
              SỬ KÝ TƯ MÃ THIÊN
            </div>
          </Reveal>
          <Reveal startFrac={aSK + 0.04} endFrac={aSK + 0.08}>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 12 }}>
              cuốn sử mà tập trước ta đã nhờ soi chuyện Bách Việt
            </div>
          </Reveal>
          <Reveal startFrac={aTL} endFrac={aTL + 0.03}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 64,
                color: C.white,
                marginTop: 54,
              }}
            >
              Về trận Trác Lộc —
            </div>
          </Reveal>
          <Reveal startFrac={aTL + 0.025} endFrac={aTL + 0.055}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 64,
                color: C.white,
                marginTop: 10,
              }}
            >
              sách chép gọn
            </div>
          </Reveal>
          <Reveal startFrac={aMC} endFrac={aMC + 0.04}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 86,
                color: C.amber,
                marginTop: 20,
              }}
            >
              đúng MỘT câu.
            </div>
          </Reveal>
          <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 52 }}>
            {["không sương mù", "không phép màu", "không đấu pháp"].map((t, i) => (
              <Reveal key={t} startFrac={aMC + 0.02 + i * 0.02} endFrac={aMC + 0.04 + i * 0.02}>
                <Chip color={C.mute}>{t}</Chip>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
      <SourceTag text="nguồn: Sử ký Tư Mã Thiên — chép về trận Trác Lộc" bottom={64} right />
    </Paper>
  );
};

// sc014 — TRANG TRẮNG MỘT DÒNG + TRO CHỒNG (s07)
export const Sc014: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aTro = A("tro chồng lên tro");
  const aTT = A("Trác Lộc là truyền thuyết");
  const aKL = A("Không phải lịch sử đo được");
  const ash = [
    { at: aTro, t: "Sơn Hải Kinh" },
    { at: aTro + 0.09, t: "Long Ngư Hà Đồ" },
    { at: aTro + 0.18, t: "truyện kể dân gian" },
  ];
  const lineW = 560 * ease(p(0.02, 0.09));
  return (
    <Paper>
      <Reveal startFrac={aTT} endFrac={aTT + 0.05} style={{ position: "absolute", top: 76, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 52,
            color: C.amber,
          }}
        >
          Trác Lộc là truyền thuyết — tráng lệ, nhưng là truyền thuyết.
        </div>
      </Reveal>
      <div
        style={{
          position: "absolute",
          left: 190,
          top: 190,
          width: 1000,
          height: 700,
          background: "rgba(233,221,196,0.95)",
          borderRadius: 6,
          boxShadow: "0 12px 44px rgba(0,0,0,0.38)",
          opacity: ease(p(0, 0.05)),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 220,
            top: 330,
            width: lineW,
            height: 4,
            background: "rgba(43,34,24,0.8)",
          }}
        />
        <Reveal startFrac={aTro} endFrac={aTro + 0.04}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 372,
              textAlign: "center",
              fontFamily: FONT.body,
              fontSize: 28,
              color: "rgba(60,48,36,0.9)",
            }}
          >
            một dòng — toàn bộ chính sử chép về trận này
          </div>
        </Reveal>
        {ash.map((l, i) => (
          <Reveal key={l.t} startFrac={l.at} endFrac={l.at + 0.06} dy={-120}>
            <div
              style={{
                position: "absolute",
                left: 44 + i * 16,
                top: 46 + i * 36,
                right: 44 - i * 10,
                bottom: 44,
                background: "rgba(72,60,46,0.30)",
                borderRadius: 8,
                transform: `rotate(${i * 1.6 - 1.6}deg)`,
              }}
            />
          </Reveal>
        ))}
        <div style={{ position: "absolute", right: 26, top: 84 }}>
          {ash.map((l, i) => (
            <Reveal key={l.t} startFrac={l.at} endFrac={l.at + 0.04}>
              <div
                style={{
                  marginTop: i === 0 ? 0 : 18,
                  fontFamily: FONT.body,
                  fontSize: 28,
                  color: "rgba(52,42,30,0.95)",
                  border: "1px solid rgba(110,92,66,0.8)",
                  background: "rgba(233,221,196,0.9)",
                  padding: "6px 16px",
                  textAlign: "right",
                }}
              >
                + {l.t}
              </div>
            </Reveal>
          ))}
        </div>
        <SpringPop startFrac={aKL} from={1.5}>
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 540,
              transform: "rotate(-7deg)",
              border: `5px solid ${C.lampRed}`,
              borderRadius: 10,
              padding: "18px 36px",
              textAlign: "center",
              background: "rgba(233,221,196,0.55)",
            }}
          >
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 56,
                color: C.lampRed,
                letterSpacing: 5,
              }}
            >
              TRUYỀN THUYẾT
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.lampRed, marginTop: 8 }}>
              — không phải lịch sử đo được —
            </div>
          </div>
        </SpringPop>
      </div>
      <WipeInk startFrac={0.9} color={C.bg} />
    </Paper>
  );
};

// sc015 — KÝ CHÂU TRONG SƯƠNG (s08, ảnh gen)
export const Sc015: React.FC<SceneProps> = () => {
  const A = useA();
  const aSHK = A("Sơn Hải Kinh");
  const aKZ = A("Ký Châu");
  const aDT = A("dị tượng giữa núi rừng");
  return (
    <InkImageScene src={plateSrc("img-sc015.png")} focus={{ x: 0.5, y: 0.42 }}>
      <SpringPop startFrac={aKZ} from={0.7}>
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 88,
            fontFamily: FONT.hanzi,
            fontWeight: 700,
            fontSize: 150,
            color: C.white,
            textShadow: "0 4px 20px rgba(0,0,0,0.88)",
          }}
        >
          冀州
        </div>
      </SpringPop>
      <Reveal startFrac={aSHK} endFrac={aSHK + 0.05}>
        <div
          style={{
            position: "absolute",
            bottom: 116,
            left: 84,
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 38,
            color: C.cream,
            background: "rgba(20,17,13,0.78)",
            padding: "12px 28px",
            borderRadius: 8,
          }}
        >
          Sơn Hải Kinh — mở chiến trường ra Ký Châu
        </div>
      </Reveal>
      <Reveal startFrac={aDT} endFrac={aDT + 0.05} style={{ position: "absolute", bottom: 56, left: 0, right: 0, textAlign: "center" }}>
        <Chip color={C.amber}>một dị tượng giữa núi rừng — mờ ảo trong sương</Chip>
      </Reveal>
    </InkImageScene>
  );
};

// sc016 — STAT ĐÔI: 3 NGÀY + XE CHỈ NAM, CHỒNG TRANG (s08)
export const Sc016: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a3 = A("ba ngày không tan");
  const aXe = A("xe chỉ nam");
  const aCT = A("thêm một chi tiết");
  const aST = A("đã thành sử thi");
  const rot = -100 + 100 * ease(p(aXe + 0.05, aXe + 0.11));
  const dip: [number, number][] = [
    [70, 36],
    [128, 58],
    [186, 74],
    [244, 84],
    [304, 74],
    [356, 102],
    [414, 128],
  ];
  const layers = [
    { t: "Sơn Hải Kinh", n: "lớp 1 — dị tượng" },
    { t: "Long Ngư Hà Đồ", n: "lớp 2 — sương mù" },
    { t: "truyện kể dân gian", n: "lớp 3 — đấu pháp" },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", left: 90, top: 52 }}>
        <SceneTitle
          eyebrow="LỚP THỨ HAI — BỒI ĐẮP"
          title="Sương mù và xe chỉ nam"
          startFrac={a3}
          titleSize={56}
        />
      </div>
      <div style={{ position: "absolute", left: 180, top: 300, width: 740 }}>
        <SpringPop startFrac={a3} from={0.92}>
          <LegendFrame label="SƯƠNG MÙ CHE KÍN">
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 100,
                color: C.white,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              <CountUp to={3} startFrac={a3} endFrac={a3 + 0.05} suffix=" ngày" />
            </div>
            <Reveal startFrac={a3 + 0.03} endFrac={a3 + 0.08}>
              <div
                style={{
                  fontFamily: FONT.body,
                  fontSize: 30,
                  color: C.mute,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                ba ngày không tan — quân của Hoàng Đế chìm trong trắng
              </div>
            </Reveal>
          </LegendFrame>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 1000, top: 300, width: 740 }}>
        <SpringPop startFrac={aXe} from={0.92}>
          <LegendFrame label="XE CHỈ NAM — PHONG HẬU">
            <div style={{ position: "relative", width: 560, height: 310, margin: "10px auto 0" }}>
              <svg width={560} height={310} viewBox="0 0 560 310" style={{ position: "absolute", inset: 0 }}>
                {dip.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={5} fill={C.cream} opacity={0.55} />
                ))}
                <circle cx={280} cy={210} r={86} fill="none" stroke={C.cream} strokeWidth={4} opacity={0.9} />
                <circle cx={280} cy={210} r={10} fill={C.cream} />
                <line
                  x1={280}
                  y1={210}
                  x2={280}
                  y2={288}
                  stroke={C.amber}
                  strokeWidth={7}
                  strokeLinecap="round"
                  transform={`rotate(${rot} 280 210)`}
                />
                <text x={280} y={306} textAnchor="middle" fill={C.amber} fontSize={22} fontFamily={FONT.body}>
                  NAM
                </text>
              </svg>
              <InkDraw
                d={circleD(280, 210, 86)}
                startFrac={aXe}
                endFrac={aXe + 0.04}
                viewBox="0 0 560 310"
                stroke={C.amber}
                strokeWidth={5}
              />
            </div>
            <Reveal startFrac={aXe + 0.06} endFrac={aXe + 0.11}>
              <div
                style={{
                  fontFamily: FONT.body,
                  fontSize: 30,
                  color: C.mute,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                bánh xe luôn chỉ về nam — tìm đường xuyên sương
              </div>
            </Reveal>
          </LegendFrame>
        </SpringPop>
      </div>
      <Reveal startFrac={aCT} endFrac={aCT + 0.04}>
        <div
          style={{
            position: "absolute",
            left: 180,
            top: 720,
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: 3,
            color: C.amber,
          }}
        >
          MỖI THẾ HỆ SAO CHÉP LẠI — THÊM MỘT CHI TIẾT
        </div>
      </Reveal>
      {layers.map((l, i) => (
        <Reveal key={l.t} startFrac={aCT + 0.015 + i * 0.02} endFrac={aCT + 0.05 + i * 0.02} dy={-40}>
          <div
            style={{
              position: "absolute",
              left: 180 + i * 96,
              top: 780 + i * 24,
              width: 420,
              border: `2px solid ${C.border}`,
              borderRadius: 8,
              background: "rgba(36,31,26,0.92)",
              padding: "20px 28px",
              transform: `rotate(${i * 2 - 2}deg)`,
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: C.white }}>
              {l.t}
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 6 }}>{l.n}</div>
          </div>
        </Reveal>
      ))}
      <Reveal startFrac={aST + 0.015} endFrac={aST + 0.06}>
        <div
          style={{
            position: "absolute",
            left: 1060,
            top: 790,
            width: 700,
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 54,
            lineHeight: 1.3,
            color: C.amber,
          }}
        >
          một dòng sử năm nào — bao thế kỷ sau, đã thành SỬ THI.
        </div>
      </Reveal>
    </Paper>
  );
};

// sc017 — TÁM MƯƠI MỐT ANH EM (s09, ảnh gen)
export const Sc017: React.FC<SceneProps> = () => {
  const A = useA();
  const a81 = A("tám mươi mốt người anh em");
  const aDT = A("đầu đồng"); // «đầu đồng, trán sắt»
  const aRV = A("cùng rèn vũ khí"); // «cùng rèn vũ khí, cùng ra trận»
  return (
    <InkImageScene src={plateSrc("img-sc017.png")} focus={{ x: 0.5, y: 0.6 }}>
      <Reveal startFrac={a81} endFrac={a81 + 0.04} style={{ position: "absolute", top: 80, left: 84 }}>
        <div
          style={{
            background: "rgba(20,17,13,0.80)",
            border: `2px solid ${C.amber}`,
            borderRadius: 10,
            padding: "20px 36px",
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 104,
              color: C.amber,
              lineHeight: 1,
            }}
          >
            <CountUp to={81} startFrac={a81} endFrac={a81 + 0.09} />
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, marginTop: 10 }}>
            người anh em
          </div>
        </div>
      </Reveal>
      <Reveal startFrac={aDT + 0.01} endFrac={aDT + 0.04} style={{ position: "absolute", top: 330, left: 84 }}>
        <Chip color={C.amber}>đầu đồng · trán sắt</Chip>
      </Reveal>
      <Reveal startFrac={aRV} endFrac={aRV + 0.04} style={{ position: "absolute", bottom: 96, left: 84 }}>
        <Chip color={C.cream}>cùng rèn vũ khí — cùng ra trận</Chip>
      </Reveal>
      <SpringPop startFrac={a81 + 0.08} from={0.7}>
        <div
          style={{
            position: "absolute",
            top: 76,
            right: 84,
            background: "rgba(20,17,13,0.80)",
            border: `2px solid ${C.cream}`,
            borderRadius: 8,
            padding: "16px 18px",
            fontFamily: FONT.hanzi,
            fontWeight: 700,
            fontSize: 62,
            color: C.cream,
            letterSpacing: 8,
            writingMode: "vertical-rl",
          }}
        >
          蚩尤
        </div>
      </SpringPop>
    </InkImageScene>
  );
};

// sc018 — LÁ CỜ DẸP LOẠN (s09)
export const Sc018: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const aLoan = A("thiên hạ loạn"); // «Xi Vưu chết — và thiên hạ loạn»
  const aVe = A("vẽ hình Xi Vưu");
  const aMuon = A("mượn uy của kẻ thua");
  const aLon = A("lớn hơn cả cái chết");
  const rise = 240 * (1 - ease(p(aVe, aVe + 0.1)));
  const chaosOp = 1 - ease(p(aVe + 0.08, aVe + 0.17));
  const chaos: [number, number][] = [
    [130, 540],
    [210, 690],
    [300, 530],
    [170, 830],
    [390, 720],
    [110, 640],
    [290, 850],
    [1420, 540],
    [1500, 690],
    [1590, 530],
    [1560, 830],
    [1450, 720],
    [1690, 640],
    [1520, 850],
  ];
  return (
    <Paper>
      <Reveal startFrac={aLoan} endFrac={aLoan + 0.05} style={{ position: "absolute", top: 96, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 56,
            color: C.lampRed,
          }}
        >
          Xi Vưu chết — thiên hạ loạn.
        </div>
      </Reveal>
      <div style={{ position: "absolute", inset: 0, opacity: chaosOp }}>
        {chaos.map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 44,
              height: 78,
              borderRadius: "50%",
              background: "rgba(12,9,7,0.82)",
              transform: `translateX(${Math.sin(frame * 0.3 + i * 1.7) * 7}px) rotate(${Math.sin(frame * 0.22 + i) * 4}deg)`,
            }}
          />
        ))}
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${rise}px)` }}>
        <div
          style={{
            position: "absolute",
            left: 952,
            top: 300,
            width: 8,
            height: 620,
            background: "rgba(14,11,8,0.95)",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 320,
            width: 420,
            height: 214,
            background: "rgba(20,17,13,0.92)",
            border: `3px solid ${C.amber}`,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: FONT.hanzi, fontWeight: 800, fontSize: 78, color: C.white, marginTop: 30 }}>
            蚩尤
          </div>
          <Reveal startFrac={aMuon} endFrac={aMuon + 0.05}>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 10 }}>
              kẻ thua — trên cờ của kẻ thắng
            </div>
          </Reveal>
        </div>
      </div>
      <Reveal startFrac={aMuon} endFrac={aMuon + 0.06} style={{ position: "absolute", bottom: 156, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream }}>
          người thắng viết sử — nhưng phải mượn uy của kẻ thua để cai trị.
        </div>
      </Reveal>
      <Reveal startFrac={aLon} endFrac={aLon + 0.06} style={{ position: "absolute", bottom: 76, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 58,
            color: C.amber,
          }}
        >
          Uy của kẻ thua — lớn hơn cả cái chết.
        </div>
      </Reveal>
      <WipeInk startFrac={0.9} color={C.bg} />
    </Paper>
  );
};

// sc019 — LƯU BANG TẾ XI VƯU (s10, ảnh gen)
export const Sc019: React.FC<SceneProps> = () => {
  const A = useA();
  const aLB = A("Lưu Bang");
  const aTe = A("đích thân tế Xi Vưu");
  const aLinh = A("xin linh uy");
  return (
    <InkImageScene src={plateSrc("img-sc019.png")} focus={{ x: 0.6, y: 0.5 }}>
      <Reveal startFrac={aTe} endFrac={aTe + 0.1}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 220,
            textAlign: "center",
            fontFamily: FONT.hanzi,
            fontWeight: 800,
            fontSize: 320,
            color: C.cream,
            opacity: 0.13,
            letterSpacing: 20,
          }}
        >
          黃帝
        </div>
      </Reveal>
      <Reveal startFrac={aLB} endFrac={aLB + 0.05} style={{ position: "absolute", top: 84, left: 84 }}>
        <Chip color={C.amber}>trước đại chiến mở ra nhà Hán — Lưu Bang</Chip>
      </Reveal>
      <Reveal startFrac={aTe} endFrac={aTe + 0.06} style={{ position: "absolute", bottom: 122, left: 84 }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 52,
            color: C.white,
            maxWidth: 1240,
            textShadow: "0 2px 14px rgba(0,0,0,0.9)",
            background: "rgba(20,17,13,0.74)",
            padding: "10px 26px",
            borderRadius: 10,
            display: "inline-block",
          }}
        >
          đích thân tế Xi Vưu — trước khi ra trận
        </div>
      </Reveal>
      <Reveal startFrac={aLinh} endFrac={aLinh + 0.05} style={{ position: "absolute", bottom: 60, left: 84 }}>
        <Chip color={C.lampRed}>xin linh uy</Chip>
      </Reveal>
    </InkImageScene>
  );
};

// sc020 — KỲ XI VƯU + MỘ ĐẦU (s10)
export const Sc020: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const aTQ = A("Thiên Quan Thư");
  const aKy = A("kỳ Xi Vưu");
  const aDC = A("Dương Cốc");
  const aDau = A("đầu một xứ");
  const starOp = ease(p(0, 0.05));
  const stars: [number, number][] = [
    [180, 150],
    [420, 90],
    [700, 170],
    [980, 80],
    [1240, 190],
    [1560, 110],
    [1720, 260],
    [300, 330],
    [1480, 340],
  ];
  return (
    <Paper>
      {stars.map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: C.cream,
            opacity: 0.5 * starOp,
          }}
        />
      ))}
      <Reveal startFrac={aTQ} endFrac={aTQ + 0.05} style={{ position: "absolute", top: 76, left: 90 }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: 2,
            color: C.amber,
          }}
        >
          THIÊN QUAN THƯ — thư thiên văn của chính Tư Mã Thiên
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 200, top: 110, width: 1520, height: 340 }}>
        <InkDraw
          d="M 30 300 Q 760 40 1490 190"
          startFrac={aKy}
          endFrac={aKy + 0.065}
          viewBox="0 0 1520 340"
          stroke={C.amber}
          strokeWidth={7}
        />
      </div>
      <SpringPop startFrac={aKy + 0.06} from={0.3}>
        <div
          style={{
            position: "absolute",
            left: 1650,
            top: 168,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: C.lampGlow,
            boxShadow: "0 0 32px rgba(242,180,92,0.95)",
          }}
        />
      </SpringPop>
      <Reveal startFrac={aKy + 0.07} endFrac={aKy + 0.11}>
        <div
          style={{
            position: "absolute",
            left: 620,
            top: 468,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 56,
            color: C.white,
          }}
        >
          kỳ Xi Vưu — 蚩尤之旗
        </div>
      </Reveal>
      <Reveal startFrac={aKy + 0.09} endFrac={aKy + 0.13}>
        <div
          style={{
            position: "absolute",
            left: 622,
            top: 544,
            fontFamily: FONT.body,
            fontSize: 28,
            color: C.mute,
          }}
        >
          vệt sáng trên trời — cờ của Xi Vưu
        </div>
      </Reveal>
      <SpringPop startFrac={aKy + 0.08} from={0.85}>
        <svg width={170} height={250} viewBox="0 0 170 250" style={{ position: "absolute", left: 240, top: 600 }}>
          <g fill="none" stroke={C.cream} strokeWidth={5} strokeLinecap="round" opacity={0.85}>
            <circle cx={85} cy={38} r={20} />
            <path d="M 85 58 L 85 180 M 85 100 L 140 62 M 85 100 L 40 130" />
          </g>
        </svg>
      </SpringPop>
      <Reveal startFrac={aKy + 0.1} endFrac={aKy + 0.14} style={{ position: "absolute", left: 140, top: 878 }}>
        <Chip color={C.cream}>sử quan ghi — điềm binh lửa sắp nổi</Chip>
      </Reveal>
      <Reveal startFrac={aDC} endFrac={aDC + 0.06} dy={60}>
        <div
          style={{
            position: "absolute",
            right: 90,
            bottom: 78,
            width: 560,
            height: 410,
            background: "rgba(24,20,16,0.9)",
            border: `2px solid ${C.border}`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 16,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 2,
              color: C.amber,
            }}
          >
            NGÔI MỘ ĐẦU — DƯƠNG CỐC
          </div>
          <svg width={520} height={250} viewBox="0 0 520 250" style={{ position: "absolute", left: 20, top: 64 }}>
            <path
              d="M 60 140 Q 90 60 190 80 Q 260 40 330 90 Q 420 70 460 150 Q 430 230 320 210 Q 220 250 140 210 Q 70 200 60 140 Z"
              fill="rgba(122,94,62,0.16)"
              stroke="#A17C53"
              strokeWidth={5}
            />
            <circle cx={300} cy={120} r={16} fill="none" stroke={C.lampRed} strokeWidth={3} opacity={0.5} />
            <circle cx={300} cy={120} r={9 + 2 * Math.sin(frame * 0.22)} fill={C.lampRed} />
            <text x={300} y={162} textAnchor="middle" fill={C.cream} fontSize={26} fontFamily={FONT.hanzi}>
              阳谷 — Dương Cốc
            </text>
            <text x={300} y={192} textAnchor="middle" fill={C.mute} fontSize={22} fontFamily={FONT.body}>
              Sơn Đông
            </text>
          </svg>
        </div>
      </Reveal>
      <Reveal startFrac={aDau} endFrac={aDau + 0.06}>
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 938,
            width: 1080,
            fontFamily: FONT.body,
            fontSize: 38,
            color: C.cream,
          }}
        >
          thân một xứ · tay một xứ · đầu một xứ — thiên hạ chia nhau… nhớ.
        </div>
      </Reveal>
    </Paper>
  );
};

// sc021 — TANG VẬT 01: BIA VŨ THỊ TỪ (s11, ảnh thật PD)
export const Sc021: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aBia = A("bia Vũ Thị Từ");
  const aNgu = A("ngũ binh");
  const aAnh = A("ảnh thật của bia thật");
  const vienOp = ease(p(aBia, aBia + 0.06));
  return (
    <Paper>
      <DossierBadge text="TANG VẬT 01" />
      <div style={{ position: "absolute", left: 150, top: 170, width: 900, height: 730 }}>
        <div style={{ position: "absolute", inset: 0, border: `3px solid ${C.cream}`, borderRadius: 6, opacity: vienOp }} />
        <div
          style={{
            position: "absolute",
            inset: 12,
            border: `1px solid ${C.cream}`,
            borderRadius: 4,
            opacity: vienOp * 0.7,
          }}
        />
        <Img
          src={plateSrc("chiyou-rubbing-wu-liang-han.jpg")}
          style={{
            position: "absolute",
            inset: 20,
            width: "calc(100% - 40px)",
            height: "calc(100% - 40px)",
            objectFit: "cover",
            opacity: ease(p(0.01, 0.06)),
            filter: "contrast(1.05)",
          }}
        />
        <Reveal startFrac={aBia + 0.15} endFrac={aBia + 0.2}>
          <div
            style={{
              position: "absolute",
              right: -26,
              top: -18,
              fontFamily: FONT.body,
              fontSize: 28,
              color: C.cream,
              border: `1px solid ${C.mute}`,
              background: "rgba(24,20,16,0.9)",
              padding: "6px 14px",
              borderRadius: 6,
            }}
          >
            ≈ TK 2 SCN
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 1130, top: 170 }}>
        <Reveal startFrac={aBia + 0.02} endFrac={aBia + 0.06}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 62,
              color: C.white,
            }}
          >
            BIA VŨ THỊ TỪ
          </div>
        </Reveal>
        <Reveal startFrac={aBia + 0.04} endFrac={aBia + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.mute, marginTop: 10 }}>
            bia đá cổ — dựng khoảng thế kỷ II sau Công nguyên
          </div>
        </Reveal>
        <Reveal startFrac={aNgu} endFrac={aNgu + 0.05}>
          <div style={{ marginTop: 36 }}>
            <Chip color={C.amber}>ngũ binh — mâu · kiếm · đao · nỏ · khiên</Chip>
          </div>
        </Reveal>
        <SpringPop startFrac={aAnh} from={1.5}>
          <div
            style={{
              marginTop: 46,
              transform: "rotate(-6deg)",
              border: `5px solid ${C.lampRed}`,
              borderRadius: 10,
              padding: "16px 32px",
              textAlign: "center",
              display: "inline-block",
              background: "rgba(26,23,20,0.6)",
            }}
          >
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 60,
                color: C.lampRed,
                letterSpacing: 4,
              }}
            >
              ẢNH THẬT
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.lampRed, marginTop: 6 }}>
              của bia thật — không phải tranh vẽ
            </div>
          </div>
        </SpringPop>
      </div>
      <SourceTag text="nguồn: ảnh tư liệu công cộng (PD) — rubbing bia đá cổ" bottom={44} right />
    </Paper>
  );
};

// sc022 — NGŨ BINH KHOANH TRÊN ẢNH (s11)
export const Sc022: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aMau = A("mâu");
  const aKiem = A("kiếm");
  const aDao = A("đao");
  const aNo = A("nỏ");
  const aKhien = A("khiên");
  const aBC = A("Binh chủ");
  const aTam = A("tám vị thần cổ");
  const aTV = A("tang vật số một");
  const marks = [
    { at: aMau, t: "mâu", x: 450, y: 250, r: 66 },
    { at: aKiem, t: "kiếm", x: 690, y: 170, r: 56 },
    { at: aDao, t: "đao", x: 740, y: 520, r: 62 },
    { at: aNo, t: "nỏ", x: 350, y: 560, r: 56 },
    { at: aKhien, t: "khiên", x: 580, y: 390, r: 74 },
  ];
  return (
    <Paper>
      <DossierBadge text="TANG VẬT 01" />
      <div style={{ position: "absolute", left: 150, top: 170, width: 900, height: 730 }}>
        <div style={{ position: "absolute", inset: 0, border: `3px solid ${C.cream}`, borderRadius: 6 }} />
        <div
          style={{
            position: "absolute",
            inset: 12,
            border: `1px solid ${C.cream}`,
            borderRadius: 4,
            opacity: 0.7,
          }}
        />
        <Img
          src={plateSrc("chiyou-rubbing-wu-liang-han.jpg")}
          style={{
            position: "absolute",
            inset: 20,
            width: "calc(100% - 40px)",
            height: "calc(100% - 40px)",
            objectFit: "cover",
            opacity: ease(p(0, 0.05)),
          }}
        />
        <div style={{ position: "absolute", inset: 0 }}>
          {marks.map((m) => (
            <InkDraw
              key={m.t}
              d={circleD(m.x, m.y, m.r)}
              startFrac={m.at}
              endFrac={m.at + 0.03}
              viewBox="0 0 900 730"
              stroke={C.lampRed}
              strokeWidth={6}
            />
          ))}
          {marks.map((m) => (
            <Reveal key={`${m.t}-lb`} startFrac={m.at + 0.02} endFrac={m.at + 0.05}>
              <div
                style={{
                  position: "absolute",
                  left: m.x - 52,
                  top: m.y + m.r + 12,
                  width: 104,
                  textAlign: "center",
                  fontFamily: FONT.display,
                  fontWeight: 700,
                  fontSize: 28,
                  color: C.lampRed,
                  border: `2px solid ${C.lampRed}`,
                  background: "rgba(20,17,13,0.88)",
                  borderRadius: 8,
                  padding: "4px 0",
                }}
              >
                {m.t}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Reveal startFrac={aKhien + 0.015} endFrac={aKhien + 0.05}>
        <div
          style={{
            position: "absolute",
            left: 1130,
            top: 176,
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 72,
            color: C.amber,
          }}
        >
          NGŨ BINH
        </div>
      </Reveal>
      <Reveal startFrac={aKhien + 0.03} endFrac={aKhien + 0.07}>
        <div
          style={{
            position: "absolute",
            left: 1130,
            top: 280,
            width: 660,
            fontFamily: FONT.body,
            fontSize: 30,
            color: C.mute,
          }}
        >
          năm món binh khí — khoanh trên ảnh bia thật
        </div>
      </Reveal>
      <SpringPop startFrac={aBC} from={1.5}>
        <div
          style={{
            position: "absolute",
            left: 1150,
            top: 420,
            transform: "rotate(-5deg)",
            border: `5px solid ${C.lampRed}`,
            borderRadius: 10,
            padding: "18px 36px",
            textAlign: "center",
            background: "rgba(26,23,20,0.6)",
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 58,
              color: C.lampRed,
              letterSpacing: 4,
            }}
          >
            BINH CHỦ
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.lampRed, marginTop: 6 }}>
            vị tổ nghề binh khí thời thượng cổ
          </div>
        </div>
      </SpringPop>
      <Reveal startFrac={aTam + 0.012} endFrac={aTam + 0.05} style={{ position: "absolute", left: 1150, top: 730 }}>
        <Chip color={C.amber}>một trong tám vị thần cổ</Chip>
      </Reveal>
      <Reveal startFrac={aTV} endFrac={aTV + 0.05} style={{ position: "absolute", left: 150, right: 150, top: 944, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 46,
            color: C.cream,
          }}
        >
          ảnh thật, bia đá thật — tang vật số một của hồ sơ tối nay.
        </div>
      </Reveal>
      <WipeInk startFrac={0.92} color={C.bg} />
    </Paper>
  );
};
