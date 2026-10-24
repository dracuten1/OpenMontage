// S2E02 vn-myth "thanh-giong" — scenes group "e" (spec_e.json).
// Speech-lock: từng nội dung dùng lời đọc nguyên văn; ledger ở qc/cues-e.json.
// Fraction thô từ useA(); cửa sổ vào tính bằng frame trên duration thực.
// Panel giữ tới hết scene, không suy diễn nội dung của trang sách khác.
import * as React from "react";
import {
  Paper,
  Reveal,
  SpringPop,
  InkDraw,
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
  CountUp,
  ease,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const absFill: React.CSSProperties = { position: "absolute", inset: 0 };
/** InkDraw full-frame: tọa độ path theo viewBox 1920x1080, phủ toàn màn. */
const inkFull: React.CSSProperties = { position: "absolute", inset: 0 };

/** Hạt gạo vàng đồng — vật chứng lặp lại xuyên suốt tập. */
const Grain: React.FC<{ size: number; glow?: number; rot?: number }> = ({
  size,
  glow = 0.5,
  rot = -16,
}) => {
  const h = Math.round(size * 0.46);
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: h,
        transform: `rotate(${rot}deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -Math.round(size * 0.45),
          borderRadius: "50%",
          background: C.amber,
          opacity: glow * 0.35,
          filter: "blur(16px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: C.amber,
          border: `2px solid ${C.earthDeep}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "38%",
          top: "22%",
          width: 3,
          height: Math.round(h * 0.56),
          background: C.earthDeep,
          opacity: 0.5,
          borderRadius: 3,
        }}
      />
    </div>
  );
};

/** Mái nhà mực — dùng cho dòng gạo về nhà (sc059). */
const HouseIcon: React.FC<{ size: number; opacity: number }> = ({
  size,
  opacity,
}) => (
  <div
    style={{
      width: size,
      height: size * 0.78,
      clipPath:
        "polygon(50% 0, 100% 42%, 82% 42%, 82% 100%, 18% 100%, 18% 42%, 0 42%)",
      background: C.earthDeep,
      opacity,
    }}
  />
);

/* --------------------------------------------------------------- sc005 (s02)
 * VẬT THỂ THỨ NHẤT HIỆN — mâm cỗ / HẠT GẠO phóng to / đền đỏ son + đứa trẻ;
 * trang sách gập lại, dòng người mực bước ra khỏi trang về phía làng.
 * anchors: «Trên mâm cỗ» «hạt gạo» «ngôi đền đỏ son» «Câu chuyện này không nằm trong sách» «về lại làng»
 */
export const Sc005: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, dur } = useFrac();
  const aBowl = A("Trên mâm cỗ");
  const aGrain = A("hạt gạo");
  const aDen = A("ngôi đền đỏ son");
  const aBook = A("Câu chuyện này không nằm trong sách");
  const aWalk = A("về lại làng");
  const pr = p(0, 1);
  const f8 = dur > 0 ? 8 / dur : 0.03;

  const fold = 1 - 0.95 * ease(p(aBook, aBook + 0.16));
  const walkers = [0, 1, 2, 3].map((i) => {
    const at = Math.min(aWalk + i * 0.02, 0.96);
    const end = Math.min(aWalk + 0.35, 0.98);
    return { at, x: 1100 - i * 40 - (1100 - 700 + i * 15) * ease(p(at, end)) };
  });

  return (
    <Paper>
      <div style={{ position: "absolute", top: 70, left: 90, width: 1040 }}>
        <SceneTitle
          eyebrow="HỒI MỞ · LÀNG PHÙ ĐỔNG"
          title="Vật thể thứ nhất hiện"
          subtitle="trên mâm cỗ, trong khói đền, giữa làng"
          startFrac={aBowl}
        />
      </div>

      {/* Mâm cỗ — chén xôi khói */}
      <Reveal startFrac={aBowl}>
        <InkDraw d="M 270 700 L 560 700" startFrac={aBowl} endFrac={aBowl + f8} strokeWidth={4} style={inkFull} />
        <InkDraw d="M 270 700 Q 415 795 560 700" startFrac={aBowl} endFrac={aBowl + f8} strokeWidth={4} style={inkFull} />
        <InkDraw d="M 340 700 Q 415 660 490 700" startFrac={aBowl} endFrac={aBowl + f8} strokeWidth={3} style={inkFull} />
        <InkDraw d="M 370 652 C 360 626 382 608 372 580" startFrac={aBowl + 0.01} endFrac={aBowl + f8} strokeWidth={2.5} style={inkFull} />
        <InkDraw d="M 460 652 C 450 626 472 608 462 580" startFrac={aBowl + 0.01} endFrac={aBowl + f8} strokeWidth={2.5} style={inkFull} />
        <div
          style={{
            position: "absolute",
            left: 250,
            top: 830,
            fontFamily: FONT.mono,
            fontSize: 22,
            color: C.mute,
          }}
        >
          mâm cỗ ngoài sân
        </div>
      </Reveal>

      {/* HẠT GẠO — trung tâm, sáng nhất */}
      <div style={{ position: "absolute", left: 860, top: 600 }}>
        <SpringPop startFrac={aGrain} from={0.55}>
          <Grain size={190} glow={0.9} />
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 830, top: 770 }}>
        <Reveal startFrac={aGrain}>
          <Chip color={C.amber}>
            <span>hạt gạo — vật chứng đầu tiên</span>
          </Chip>
        </Reveal>
      </div>

      {/* Ngôi đền đỏ son + đứa trẻ ngồi im */}
      <Reveal startFrac={aDen}>
        <InkDraw d="M 1430 660 L 1570 562 L 1710 660" startFrac={aDen} endFrac={aDen + f8} strokeWidth={5} stroke={C.amber} style={inkFull} />
        <InkDraw d="M 1476 624 L 1664 624" startFrac={aDen + 0.01} endFrac={aDen + f8} strokeWidth={2.5} stroke={C.amber} style={inkFull} />
        <InkDraw d="M 1480 660 L 1480 736" startFrac={aDen + 0.01} endFrac={aDen + f8} strokeWidth={3} style={inkFull} />
        <InkDraw d="M 1660 660 L 1660 736" startFrac={aDen + 0.01} endFrac={aDen + f8} strokeWidth={3} style={inkFull} />
        <InkDraw d="M 1448 736 L 1692 736" startFrac={aDen + 0.02} endFrac={aDen + f8} strokeWidth={3} style={inkFull} />
        <div
          style={{
            position: "absolute",
            left: 1552,
            top: 742,
            width: 30,
            height: 42,
            borderRadius: "14px 14px 5px 5px",
            background: C.earthDeep,
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 1408,
            top: 800,
            fontFamily: FONT.body,
            fontSize: 24,
            color: C.cream,
            width: 340,
          }}
        >
          ngôi đền đỏ son thờ một đứa trẻ
        </div>
      </Reveal>

      {/* Trang sách gập lại — câu chuyện này không nằm trong sách */}
      <Reveal startFrac={aBook}>
        <div style={{ position: "absolute", left: 850, top: 850, width: 380, height: 140 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 185,
              height: 140,
              background: C.cream,
              border: `2px solid ${C.border}`,
              borderRight: "none",
              transformOrigin: "right center",
              transform: `scaleX(${fold})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 185,
              height: 140,
              background: C.cream,
              border: `2px solid ${C.border}`,
              borderLeft: "none",
              transformOrigin: "left center",
              transform: `scaleX(${fold})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 186,
              top: -8,
              width: 8,
              height: 156,
              background: C.earthDeep,
              opacity: 0.9,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 850,
            top: 1002,
            fontFamily: FONT.mono,
            fontSize: 20,
            color: C.mute,
          }}
        >
          Câu chuyện này không nằm trong sách
        </div>
      </Reveal>

      {pr >= aWalk
        ? walkers.map((w, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: w.x,
                top: 905 - i * 6,
                width: 18,
                height: 46,
                opacity: pr >= w.at ? 1 : 0,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: C.earthDeep,
                  margin: "0 auto",
                }}
              />
              <div
                style={{
                  width: 16,
                  height: 28,
                  borderRadius: "8px 8px 3px 3px",
                  background: C.earthDeep,
                  margin: "2px auto 0",
                }}
              />
            </div>
          ))
        : null}
      <Reveal startFrac={aWalk}>
        <InkDraw d="M 550 895 L 590 861 L 630 895" startFrac={aWalk} endFrac={aWalk + f8} strokeWidth={3.5} style={inkFull} />
        <InkDraw d="M 566 895 L 566 937" startFrac={aWalk + 0.01} endFrac={aWalk + f8} strokeWidth={3} style={inkFull} />
        <InkDraw d="M 614 895 L 614 937" startFrac={aWalk + 0.01} endFrac={aWalk + f8} strokeWidth={3} style={inkFull} />
        <InkDraw d="M 544 937 L 636 937" startFrac={aWalk + 0.01} endFrac={aWalk + f8} strokeWidth={3} style={inkFull} />
        <div
          style={{
            position: "absolute",
            left: 470,
            top: 958,
            fontFamily: FONT.body,
            fontSize: 26,
            color: C.cream,
          }}
        >
          nó ra khỏi sách, về lại làng
        </div>
      </Reveal>

      <SourceTag text="hội Gióng · mùng 9 tháng Tư · làng Phù Đổng" bottom={60} />
    </Paper>
  );
};

/* --------------------------------------------------------------- sc011 (s04)
 * CÁCH ĐỌC MỚI — trục thời gian chạy NGƯỢC từ phải (hôm nay) sang trái
 * (ba ô giấy dó mờ dần); caption lời hẹn «gần như không có trận đánh nào».
 * anchors: «đọc ngược» «không có trận đánh nào»
 */
export const Sc011: React.FC<SceneProps> = () => {
  const A = useA();
  const aRev = A("đọc ngược");
  const aNo = A("không có trận đánh nào");
  const cells = [
    { cx: 1380, year: "1697", note: "trang chính sử", op: 0.95, at: Math.min(aRev + 0.14, 0.94) },
    { cx: 1000, year: "1492", note: "trang truyền kỳ", op: 0.62, at: Math.min(aRev + 0.28, 0.95) },
    { cx: 620, year: "1329", note: "trang cổ nhất", op: 0.38, at: Math.min(aRev + 0.42, 0.96) },
  ];

  return (
    <Paper>
      <div style={{ position: "absolute", top: 80, left: 90, width: 1100 }}>
        <SceneTitle
          eyebrow="CÁCH ĐỌC MỚI"
          title="Không đọc xuôi — đọc ngược"
          subtitle="lùi từ trang sách mới nhất về trang cổ nhất còn lại"
          startFrac={aRev}
        />
      </div>

      {/* Mái đền — hôm nay, đầu phải trục */}
      <Reveal startFrac={aRev}>
        <InkDraw d="M 1680 696 L 1750 630 L 1820 696" startFrac={aRev} endFrac={aRev + 0.07} strokeWidth={4} stroke={C.amber} style={inkFull} />
        <InkDraw d="M 1706 670 L 1794 670" startFrac={aRev + 0.03} endFrac={aRev + 0.08} strokeWidth={2} stroke={C.amber} style={inkFull} />
        <InkDraw d="M 1704 696 L 1704 738" startFrac={aRev + 0.04} endFrac={aRev + 0.09} strokeWidth={2.5} style={inkFull} />
        <InkDraw d="M 1796 696 L 1796 738" startFrac={aRev + 0.05} endFrac={aRev + 0.1} strokeWidth={2.5} style={inkFull} />
        <div
          style={{
            position: "absolute",
            left: 1712,
            top: 752,
            fontFamily: FONT.mono,
            fontSize: 22,
            color: C.mute,
          }}
        >
          hôm nay
        </div>
      </Reveal>

      {/* Trục ngang + mốc */}
      <InkDraw d="M 200 780 L 1740 780" startFrac={aRev} endFrac={aRev + 0.35} strokeWidth={3} style={inkFull} />
      {cells.map((c, i) => (
        <InkDraw
          key={i}
          d={`M ${c.cx} 762 L ${c.cx} 798`}
          startFrac={c.at}
          endFrac={c.at + 0.03}
          strokeWidth={3}
          style={inkFull}
        />
      ))}

      {/* Mũi tên mực chạy ngược (phải → trái) */}
      <InkDraw d="M 1660 700 L 380 700" startFrac={aRev} endFrac={aRev + 0.5} strokeWidth={4} stroke={C.amber} style={inkFull} />
      <InkDraw d="M 380 700 L 436 672" startFrac={aRev + 0.4} endFrac={aRev + 0.5} strokeWidth={4} stroke={C.amber} style={inkFull} />
      <InkDraw d="M 380 700 L 436 728" startFrac={aRev + 0.42} endFrac={aRev + 0.52} strokeWidth={4} stroke={C.amber} style={inkFull} />

      {/* Ba ô giấy dó mờ dần về phía trước */}
      {cells.map((c, i) => (
        <Reveal key={i} startFrac={c.at}>
          <div
            style={{
              position: "absolute",
              left: c.cx - 160,
              top: 500,
              width: 320,
              height: 210,
              background: C.card,
              border: `2px solid ${C.border}`,
              opacity: c.op,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 44, color: C.cream }}>{c.year}</div>
            <div style={{ fontFamily: FONT.body, fontSize: 24, color: C.mute }}>{c.note}</div>
          </div>
        </Reveal>
      ))}

      {/* Lời hẹn mở Hồi một */}
      <div style={{ position: "absolute", left: 460, top: 848, width: 1000 }}>
        <Reveal startFrac={aNo}>
          <LegendFrame label="lời hẹn mở Hồi một">
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 42,
                color: C.amber,
                padding: "8px 12px",
              }}
            >
              «gần như không có trận đánh nào»
            </div>
          </LegendFrame>
        </Reveal>
      </div>

      <SourceTag text="đọc lùi · 1697 → 1492 → 1329" bottom={60} />
    </Paper>
  );
};

/* --------------------------------------------------------------- sc017 (s07)
 * TRANG THỨ HAI — Lĩnh Nam chích quái · 1492: trang cổ thư tông ấm rực lật
 * vào; chip gáy hiện đúng lúc đọc năm hiệu chính.
 * anchors: «Năm 1492» «Lĩnh Nam chích quái»
 */
export const Sc017: React.FC<SceneProps> = () => {
  const A = useA();
  const aYear = A("Năm 1492");
  const aTitle = A("Lĩnh Nam chích quái");

  return (
    <InkImageScene
      src={plateSrc("img-08-co-thu-lncq.png")}
      label="Lĩnh Nam chích quái · 1492"
      sublabel="trang thứ hai — truyền kỳ rực rỡ"
      durationInFrames={470}
    >
      <div style={absFill}>
        <DossierBadge text="TRANG THỨ HAI · TRUYỀN KỲ" />

        {/* Chip gáy trái */}
        <div style={{ position: "absolute", left: 70, top: 260 }}>
          <SpringPop startFrac={aYear} from={0.7}>
            <div
              style={{
                width: 88,
                height: 560,
                border: `3px solid ${C.amber}`,
                background: C.card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  writingMode: "vertical-rl",
                  textOrientation: "upright",
                  fontFamily: FONT.mono,
                  fontSize: 24,
                  letterSpacing: 6,
                  color: C.amber,
                }}
              >
                LĨNH NAM CHÍCH QUÁI · 1492
              </span>
            </div>
          </SpringPop>
        </div>

        <div style={{ position: "absolute", top: 90, right: 90 }}>
          <Reveal startFrac={aTitle}>
            <Chip color={C.teal}>
              <span>VŨ QUỲNH · KIỀU PHÚ HIỆU CHÍNH</span>
            </Chip>
          </Reveal>
        </div>

        <div style={{ position: "absolute", left: 230, bottom: 150, width: 900 }}>
          <TextCard
            eyebrow="cùng một câu chuyện — trang giấy rực rỡ hẳn"
            title="trước khi có đứa trẻ, đã có một lời tiên tri"
            startFrac={aTitle}
            maxWidth={880}
          />
        </div>

        <SourceTag text="hiệu chính cuốn Lĩnh Nam chích quái · 1492" bottom={60} />
      </div>
    </InkImageScene>
  );
};

/* --------------------------------------------------------------- sc023 (s09)
 * TRANG CỔ NHẤT — Việt Điện U Linh Tập · 1329: trang amber nhạt cổ nhất,
 * nét mực mờ, hạt bụi giấy lơ lửng; chip nguồn hiện khi giới thiệu.
 * anchors: «trang cổ nhất» «Việt Điện U Linh Tập»
 */
export const Sc023: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame } = useFrac();
  const aOld = A("trang cổ nhất");
  const aVD = A("Việt Điện U Linh Tập", 1);

  const motes: Array<[number, number, number]> = [
    [320, 250, 0.0],
    [540, 430, 1.3],
    [780, 210, 2.1],
    [1030, 370, 0.7],
    [1250, 250, 1.8],
    [1490, 470, 0.4],
    [430, 650, 2.6],
    [1630, 350, 1.1],
  ];

  return (
    <InkImageScene
      src={plateSrc("img-07-co-thu-vdult.png")}
      label="Việt Điện U Linh Tập · 1329"
      sublabel="trang cổ nhất còn lại"
      durationInFrames={381}
    >
      <div style={absFill}>
        {/* Hạt bụi giấy */}
        {motes.map((m, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: m[0],
              top: m[1] + 8 * Math.sin(frame * 0.02 + m[2]),
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.cream,
              opacity: 0.16 + 0.2 * (0.5 + 0.5 * Math.sin(frame * 0.045 + m[2])),
            }}
          />
        ))}

        <div style={{ position: "absolute", top: 80, left: 90 }}>
          <SpringPop startFrac={aOld} from={0.7}>
            <Chip color={C.amber}>
              <span>TRANG CỔ NHẤT</span>
            </Chip>
          </SpringPop>
        </div>

        <div style={{ position: "absolute", left: 90, bottom: 140, width: 680 }}>
          <TextCard
            eyebrow="1329 · Lý Tế Xuyên biên tập"
            title="Việt Điện U Linh Tập"
            subtitle="tuyển truyện về các vị thần của người Việt"
            startFrac={aVD}
            maxWidth={660}
          />
        </div>

        <SourceTag text="Việt Điện U Linh Tập · 1329" bottom={60} />
      </div>
    </InkImageScene>
  );
};

/* --------------------------------------------------------------- sc029 (s11)
 * VƯƠN VAI — TRÁNG SĨ XUẤT HIỆN: nong gạo sân làng, bóng phình to, nhà mọc
 * lên; quote nguyên văn «cao hơn hai trượng» pop đúng chữ.
 * anchors: «cất nhà to hơn» «cao hơn hai trượng»
 */
export const Sc029: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aHouse = A("cất nhà to hơn");
  const aTall = A("cao hơn hai trượng");

  const grow = 0.55 + 1.2 * ease(p(aHouse, aTall));
  const armored = p(0, 1) >= aTall;

  return (
    <InkImageScene
      src={plateSrc("img-04-nong-com.png")}
      label="sân làng · nong gạo"
      sublabel="cậu bé ăn, và lớn"
      durationInFrames={370}
    >
      <div style={absFill}>
        {/* Nhà to hơn mọc lên */}
        <Reveal startFrac={aHouse}>
          <InkDraw d="M 230 590 L 380 500 L 530 590" startFrac={aHouse} endFrac={aHouse + 0.08} strokeWidth={4} style={inkFull} />
          <InkDraw d="M 270 560 L 490 560" startFrac={aHouse + 0.04} endFrac={aHouse + 0.1} strokeWidth={2} style={inkFull} />
          <InkDraw d="M 266 590 L 266 648" startFrac={aHouse + 0.05} endFrac={aHouse + 0.11} strokeWidth={3} style={inkFull} />
          <InkDraw d="M 494 590 L 494 648" startFrac={aHouse + 0.06} endFrac={aHouse + 0.12} strokeWidth={3} style={inkFull} />
          <InkDraw d="M 226 648 L 534 648" startFrac={aHouse + 0.07} endFrac={aHouse + 0.13} strokeWidth={3} style={inkFull} />
          <div style={{ position: "absolute", left: 210, top: 670 }}>
            <Chip color={C.amber}>
              <span>phải cất nhà to hơn</span>
            </Chip>
          </div>
        </Reveal>

        {/* Bóng phình to → tráng sĩ giáp sắt xanh rêu */}
        <div
          style={{
            position: "absolute",
            left: 1300,
            top: 560,
            width: 170,
            height: 400,
            transformOrigin: "50% 100%",
            transform: `scale(${grow})`,
          }}
        >
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: "50%",
              background: armored ? C.teal : C.earthDeep,
              margin: "0 auto",
            }}
          />
          <div
            style={{
              width: 132,
              height: 320,
              borderRadius: "66px 66px 14px 14px",
              background: armored ? C.teal : C.earthDeep,
              margin: "10px auto 0",
              boxShadow: armored ? `0 0 46px 4px ${C.teal}` : "none",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 1240,
            top: 975,
            width: 300,
            height: 16,
            borderRadius: "50%",
            background: C.earthDeep,
            opacity: 0.28,
          }}
        />
        <div style={{ position: "absolute", left: 1150, top: 420 }}>
          <Reveal startFrac={aTall}>
            <Chip>
              <span>giáp sắt xanh rêu — làng khiêng hộ</span>
            </Chip>
          </Reveal>
        </div>

        {/* Quote nguyên văn */}
        <div style={{ position: "absolute", left: 90, top: 90, width: 760 }}>
          <TextCard
            eyebrow="sách chép · Lĩnh Nam chích quái 1492"
            title="«cao hơn hai trượng»"
            subtitle="bộ giáp và thanh roi mà người làng phải khiêng hộ"
            startFrac={aTall}
            maxWidth={740}
          />
        </div>

        <SourceTag text="sân làng · nong gạo của cả làng" bottom={60} />
      </div>
    </InkImageScene>
  );
};

/* --------------------------------------------------------------- sc035 (s13)
 * TRE ĐẰNG NGÀ CÒN ĐÓ: bụi tre vàng óng sau trận, dolly dọc vệ đường;
 * nhãn địa danh hiện đúng lúc đọc tên.
 * anchors: «tre Đằng Ngà» «Gia Bình»
 */
export const Sc035: React.FC<SceneProps> = () => {
  const A = useA();
  const aTre = A("tre Đằng Ngà");
  const aDia = A("Gia Bình");

  return (
    <InkImageScene
      src={plateSrc("img-06-tre-dang-nga.png")}
      label="tre Đằng Ngà"
      sublabel="vệt roi năm ấy — vàng óng đến nay"
      durationInFrames={206}
    >
      <div style={absFill}>
        <div style={{ position: "absolute", right: 100, top: 660, textAlign: "right" }}>
          <SpringPop startFrac={aTre} from={0.75}>
            <div
              style={{
                fontFamily: FONT.display,
                fontSize: 52,
                color: C.amber,
                textShadow: `0 0 26px ${C.amber}`,
              }}
            >
              tre Đằng Ngà
            </div>
          </SpringPop>
          <div style={{ marginTop: 14 }}>
            <Reveal startFrac={aDia}>
              <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream }}>
                đất Gia Bình · thứ tre vàng óng
              </div>
            </Reveal>
          </div>
        </div>

        <SourceTag text="tre ngả vàng theo vết roi — mọc lại sau trận" bottom={60} />
      </div>
    </InkImageScene>
  );
};

/* --------------------------------------------------------------- sc041 (s15)
 * HAI Ô — KHÔNG TICK: «thời được kể» vs «trí nhớ người chép», dấu hỏi ở
 * giữa (không chọn ô nào); cuối cùng hai ô mờ đi, hạt gạo vàng chốt giữa.
 * anchors: «thời được kể» «trí nhớ của người chép» «câu hỏi» «Gạo đến từ xóm làng»
 */
export const Sc041: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame } = useFrac();
  const aKe = A("Đây là câu hỏi");
  const aChep = A("trí nhớ của người chép");
  const aQ = A("không phải kết luận");
  const aGao = A("Gạo đến từ xóm làng");

  const fade = 1 - 0.86 * ease(p(aGao - 0.04, aGao + 0.06));
  const qScale = 1 + 0.05 * Math.sin(frame * 0.12);

  return (
    <Paper>
      <div style={{ position: "absolute", top: 70, left: 90, width: 1200 }}>
        <SceneTitle
          eyebrow="TRANG 1492 · MỘT CÂU HỎI VỀ VŨ KHÍ SẮT"
          title="Sắt thuộc về ai?"
          subtitle="đây là câu hỏi, không phải kết luận"
          startFrac={aKe}
        />
      </div>

      {/* Ô trái — thời được kể */}
      <div style={{ position: "absolute", left: 150, top: 400, opacity: fade }}>
        <Reveal startFrac={aKe}>
          <div
            style={{
              position: "relative",
              width: 560,
              height: 360,
              background: C.card,
              border: `2px solid ${C.border}`,
              padding: 36,
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontSize: 38, color: C.cream }}>
              thời được kể
            </div>
            <svg
              width={488}
              height={200}
              viewBox="0 0 488 200"
              style={{ position: "absolute", left: 36, top: 120, opacity: 0.75 }}
            >
              <path
                d="M 74 152 L 110 76 L 150 130 L 196 56 L 242 130 L 282 76 L 318 152 Z"
                fill="none"
                stroke={C.mute}
                strokeWidth={3}
                strokeLinejoin="round"
              />
              <path d="M 48 152 L 440 152" fill="none" stroke={C.mute} strokeWidth={2.5} />
            </svg>
            <div
              style={{
                position: "absolute",
                left: 36,
                bottom: 28,
                fontFamily: FONT.body,
                fontSize: 24,
                color: C.mute,
              }}
            >
              thời vua Hùng rất xa
            </div>
          </div>
        </Reveal>
      </div>

      {/* Ô phải — trí nhớ người chép */}
      <div style={{ position: "absolute", left: 1210, top: 400, opacity: fade }}>
        <Reveal startFrac={aChep}>
          <div
            style={{
              position: "relative",
              width: 560,
              height: 360,
              background: C.card,
              border: `2px solid ${C.border}`,
              padding: 36,
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontSize: 38, color: C.cream }}>
              trí nhớ của người chép
            </div>
            <svg
              width={488}
              height={200}
              viewBox="0 0 488 200"
              style={{ position: "absolute", left: 36, top: 120, opacity: 0.85 }}
            >
              <path d="M 74 30 L 194 150" fill="none" stroke={C.earthDeep} strokeWidth={8} strokeLinecap="round" />
              <path d="M 194 150 L 218 174 L 172 174 Z" fill={C.earthDeep} />
              <path d="M 264 56 L 420 56" fill="none" stroke={C.mute} strokeWidth={3} strokeLinecap="round" />
              <path d="M 264 96 L 392 96" fill="none" stroke={C.mute} strokeWidth={3} strokeLinecap="round" />
              <path d="M 264 136 L 348 136" fill="none" stroke={C.mute} strokeWidth={3} strokeLinecap="round" />
            </svg>
            <div
              style={{
                position: "absolute",
                left: 36,
                bottom: 28,
                fontFamily: FONT.mono,
                fontSize: 24,
                color: C.mute,
              }}
            >
              thời Trần → 1492 · roi sắt, kỵ binh
            </div>
          </div>
        </Reveal>
      </div>

      {/* Dấu hỏi pulse — KHÔNG tick */}
      <div style={{ position: "absolute", left: 880, top: 470 }}>
        <SpringPop startFrac={aQ}>
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 170,
              color: C.amber,
              transform: `scale(${qScale})`,
              opacity: fade,
            }}
          >
            ?
          </div>
        </SpringPop>
      </div>

      {/* Hạt gạo chốt — sắt nghi vấn, gạo chắc chắn */}
      <div style={{ position: "absolute", left: 885, top: 545 }}>
        <SpringPop startFrac={aGao} from={0.5}>
          <Grain size={160} glow={1} />
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 360, top: 840, width: 1200 }}>
        <TextCard
          eyebrow="sắt nghi vấn — gạo chắc chắn"
          title="Gạo đến từ xóm làng. Không một trang nào chép khác đi."
          startFrac={aGao}
          maxWidth={1180}
        />
      </div>

      <SourceTag text="kiếm 7 thước · ngựa 18 thước · đọc cho đúng hướng" bottom={60} />
    </Paper>
  );
};

/* --------------------------------------------------------------- sc047 (s18)
 * ĐỀN SÓC THÁNG GIÊNG — LỄ MỘC DỤC: đêm nến, tắm tượng thần bằng nước sạch;
 * chip ngày hiện đúng lúc đọc.
 * anchors: «mùng 6 đến mùng 8» «lễ Mộc Dục»
 */
export const Sc047: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame } = useFrac();
  const aNgay = A("mùng 6 đến mùng 8");
  const aLe = A("lễ Mộc Dục");

  return (
    <InkImageScene
      src={plateSrc("img-11-den-soc.png")}
      label="đền Sóc · tháng Giêng"
      sublabel="đêm Mộc Dục — trầm và gần như tôn giáo hơn"
      durationInFrames={237}
    >
      <div style={absFill}>
        {/* Ánh nến nhấp nháy chậm */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 64%, ${C.lampGlow}, transparent 62%)`,
            opacity: 0.22 + 0.08 * Math.sin(frame * 0.16),
          }}
        />
        <Lamp x={240} y={905} scale={0.85} lit={1} pulse={frame * 0.035} />

        <LabBadge text="DÂN LÀNG TẮM RỬA TƯỢNG THẦN BẰNG NƯỚC SẠCH" />

        <div style={{ position: "absolute", left: 90, bottom: 220, width: 900 }}>
          <TextCard
            eyebrow="tháng Tư là tiếng trống trận"
            title="tháng Giêng là đêm tưởng niệm"
            startFrac={aLe}
            maxWidth={880}
          />
        </div>

        <div style={{ position: "absolute", left: 90, bottom: 140 }}>
          <SpringPop startFrac={aNgay} from={0.75}>
            <Chip color={C.amber}>
              <span>mùng 6–8 tháng Giêng · Mộc Dục đêm mùng 5</span>
            </Chip>
          </SpringPop>
        </div>

        <SourceTag text="hội Gióng · phần đền Sóc" bottom={60} />
      </div>
    </InkImageScene>
  );
};

/* --------------------------------------------------------------- sc053 (s20)
 * BA LỜI CHỌN GHI NHỚ: đứa trẻ im lặng → lời xin vũ khí → hạt gạo vàng
 * (sáng nhất, giữ sáng); caption mời «đọc chậm».
 * anchors: «đứa trẻ im lặng» «lời xin vũ khí đầu đời» «Chọn ghi nhớ gạo của cả làng» «đọc chậm»
 */
export const Sc053: React.FC<SceneProps> = () => {
  const A = useA();
  const aTre = A("câu hỏi mở đầu");
  const aGuom = A("Để trả lời");
  const aGao = A("Chọn ghi nhớ gạo của cả làng");
  const aCham = A("đọc chậm");

  return (
    <Paper>
      <div style={{ position: "absolute", top: 70, left: 90, width: 1200 }}>
        <SceneTitle
          eyebrow="VẬT THỂ CỦA TRÍ NHỚ"
          title="Ba lần chọn ghi nhớ"
          subtitle="bằng chứng tín ngưỡng nói về người thờ, và điều họ chọn ghi nhớ"
          startFrac={aTre}
        />
      </div>

      {/* 1 — đứa trẻ im lặng */}
      <Reveal startFrac={aTre}>
        <div style={{ position: "absolute", left: 170, top: 330, width: 120, height: 150 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: C.earthDeep,
              margin: "0 auto",
            }}
          />
          <div
            style={{
              width: 86,
              height: 96,
              borderRadius: "43px 43px 8px 8px",
              background: C.earthDeep,
              margin: "6px auto 0",
            }}
          />
        </div>
        <div style={{ position: "absolute", left: 360, top: 350, width: 900 }}>
          <TextCard
            eyebrow="chọn ghi nhớ · một"
            title="một đứa trẻ im lặng"
            startFrac={aTre}
            maxWidth={880}
          />
        </div>
      </Reveal>

      {/* 2 — lời xin vũ khí đầu đời */}
      <InkDraw d="M 245 560 L 245 690" startFrac={aGuom} endFrac={aGuom + 0.14} strokeWidth={5} style={inkFull} />
      <InkDraw d="M 209 690 L 281 690" startFrac={aGuom + 0.08} endFrac={aGuom + 0.16} strokeWidth={4} style={inkFull} />
      <InkDraw d="M 245 690 L 245 730" startFrac={aGuom + 0.12} endFrac={aGuom + 0.18} strokeWidth={4} style={inkFull} />
      <InkDraw d={circleD(245, 740, 8)} startFrac={aGuom + 0.16} endFrac={aGuom + 0.22} strokeWidth={3} style={inkFull} />
      <div style={{ position: "absolute", left: 360, top: 580, width: 900 }}>
        <TextCard
          eyebrow="chọn ghi nhớ · hai"
          title="lời xin vũ khí đầu đời"
          startFrac={aGuom}
          maxWidth={880}
        />
      </div>

      {/* 3 — gạo của cả làng (sáng nhất, giữ sáng) */}
      <div style={{ position: "absolute", left: 160, top: 800 }}>
        <SpringPop startFrac={aGao} from={0.5}>
          <Grain size={150} glow={1} />
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 360, top: 810, width: 900 }}>
        <TextCard
          eyebrow="chọn ghi nhớ · ba"
          title="gạo của cả làng"
          startFrac={aGao}
          maxWidth={880}
        />
      </div>

      {/* Mời đọc chậm */}
      <div style={{ position: "absolute", left: 1240, top: 900, width: 600 }}>
        <TextCard
          eyebrow="ba chi tiết nhỏ nhất của truyện"
          title="đọc chậm"
          startFrac={aCham}
          maxWidth={580}
        />
      </div>

      <SourceTag text="vì sao chọn một đứa trẻ 3 tuổi chưa từng nói?" bottom={60} />
    </Paper>
  );
};

/* --------------------------------------------------------------- sc059 (s22)
 * DÒNG GẠO ĐẢO CHIỀU: hạt gạo tách khỏi nong bay ngược về từng mái nhà;
 * đế số nhà nhận lại; caption chốt «Không một chữ nào chép ngược lại».
 * anchors: «trả về mọi nhà» «Không một chữ nào»
 */
export const Sc059: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aTra = A("trả về mọi nhà");
  const aKhong = A("Đó là cách đọc từ trang truyền kỳ");

  const targets: Array<[number, number]> = [
    [300, 420],
    [520, 300],
    [1480, 380],
    [1620, 560],
    [420, 760],
    [1540, 800],
  ];
  const t0 = aTra;
  const t1 = Math.min(aTra + 0.22, 0.97);

  return (
    <InkImageScene
      src={plateSrc("img-04-nong-com.png")}
      label="nong gạo · đảo chiều"
      sublabel="hạt gạo bay về từng mái nhà"
      durationInFrames={148}
    >
      <div style={absFill}>
        {/* Caption chốt — đóng khung cách đọc */}
        <div style={{ position: "absolute", left: 360, top: 90, width: 1200 }}>
          <TextCard
            eyebrow="cách đọc"
            title="«Sức mạnh nuôi bằng mọi nhà, thì phải được trả về mọi nhà.»"
            startFrac={aKhong}
            maxWidth={1180}
          />
        </div>

        {/* Đế số mái nhà nhận lại gạo */}
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 250,
            fontFamily: FONT.mono,
            fontSize: 42,
            color: C.amber,
            textShadow: `0 0 22px ${C.amber}`,
          }}
        >
          <CountUp to={6} startFrac={t0} endFrac={t1} suffix=" mái nhà nhận lại gạo" />
        </div>

        {/* Mái nhà sáng lại từng cái + hạt gạo bay ngược cung — nong → nhà */}
        {targets.map((t, i) => {
          const w = p(t0, t1);
          const lit = 0.2 + 0.8 * w;
          const x = 940 + (t[0] - 940) * ease(w);
          const y = 540 + (t[1] - 540) * ease(w);
          const op = Math.min(1, w * 8) * Math.min(1, (1 - w) * 8);
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: t[0], top: t[1] }}>
                <HouseIcon size={64} opacity={lit} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: 18,
                  height: 9,
                  borderRadius: "50%",
                  background: C.amber,
                  boxShadow: `0 0 16px ${C.amber}`,
                  opacity: op,
                  transform: "rotate(-24deg)",
                }}
              />
            </div>
          );
        })}

        <SourceTag text="100 mẫu ruộng tự điền ban cho cả làng" bottom={60} />
      </div>
    </InkImageScene>
  );
};

/* --------------------------------------------------------------- sc065 (s25)
 * TỨ BẤT TỬ — BỐN TẤM THẺ: Tản Viên · Phù Đổng (sáng vàng, «thứ hai») ·
 * Chử Đồng Tử · Liễu Hạnh; thẻ lật theo nhịp đếm narration.
 * anchors: «Tứ bất tử» «Tản Viên Sơn Thánh» «Phù Đổng Thiên Vương»
 *          «Chử Đồng Tử» «Liễu Hạnh» «Phù Đổng đứng thứ hai»
 */
export const Sc065: React.FC<SceneProps> = () => {
  const A = useA();
  const aTu = A("Tứ bất tử");
  const aTV = A("Tản Viên Sơn Thánh");
  const aPD = A("Phù Đổng Thiên Vương");
  const aCDT = A("Chử Đồng Tử");
  const aLH = A("Liễu Hạnh");
  const aRank = A("và Liễu Hạnh");

  const cards = [
    { left: 140, name: "Tản Viên\nSơn Thánh", tag: "vị thần núi", at: aTV, gold: false },
    { left: 560, name: "Phù Đổng\nThiên Vương", tag: "thần làng", at: aPD, gold: true },
    { left: 980, name: "Chử\nĐồng Tử", tag: "", at: aCDT, gold: false },
    { left: 1400, name: "Liễu\nHạnh", tag: "", at: aLH, gold: false },
  ];

  return (
    <Paper>
      <div style={{ position: "absolute", top: 80, left: 90, width: 1500 }}>
        <SceneTitle
          eyebrow="TÍN NGƯỠNG DÂN GIAN"
          title="Tứ bất tử"
          subtitle="bốn vị thánh bất tử của người Việt đồng bằng"
          startFrac={aTu}
        />
      </div>

      {cards.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.left, top: 420 }}>
          <SpringPop startFrac={c.at} from={0.7}>
            <div
              style={{
                width: 380,
                height: 280,
                background: c.gold ? C.amber : C.card,
                border: `3px solid ${c.gold ? C.earthDeep : C.border}`,
                boxShadow: c.gold ? `0 0 60px 6px ${C.amber}` : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 20,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontFamily: FONT.display,
                  fontSize: 38,
                  lineHeight: 1.2,
                  color: c.gold ? C.earthDeep : C.cream,
                  textAlign: "center",
                  whiteSpace: "pre-line",
                }}
              >
                {c.name}
              </div>
              {c.tag ? (
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 22,
                    color: c.gold ? C.earthDeep : C.mute,
                  }}
                >
                  {c.tag}
                </div>
              ) : null}
              {c.gold ? (
                <Reveal startFrac={aRank}>
                  <div
                    style={{
                      fontFamily: FONT.body,
                      fontSize: 24,
                      color: C.earthDeep,
                      borderTop: `2px solid ${C.earthDeep}`,
                      paddingTop: 8,
                    }}
                  >
                    thứ hai — ngay sau Tản Viên
                  </div>
                </Reveal>
              ) : null}
            </div>
          </SpringPop>
        </div>
      ))}

      <div style={{ position: "absolute", left: 250, top: 800, width: 1420 }}>
        <TextCard
          eyebrow="mỗi vị là một cách trả lời"
          title="trong thời khó, ai sẽ đứng ra, và bằng sức mạnh nào?"
          startFrac={aRank}
          maxWidth={1400}
        />
      </div>

      <SourceTag text="Tản Viên Sơn Thánh · Phù Đổng · Chử Đồng Tử · Liễu Hạnh" bottom={60} />
    </Paper>
  );
};
