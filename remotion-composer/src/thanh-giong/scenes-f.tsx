// S2E02 vn-myth "thanh-giong" — scenes group "f" (spec_f.json).
// Speech-lock: mọi reveal/pop/draw/count khóa vào A("<anchor>") — từ nguyên văn trong anchors list.
import * as React from "react";
import { Img, interpolate } from "remotion";
import {
  Paper,
  Reveal,
  SpringPop,
  InkDraw,
  circleD,
  Chip,
  CountUp,
  SourceTag,
  SceneTitle,
  TextCard,
  plateSrc,
  InkImageScene,
  useA,
  useFrac,
} from "./common";
import { C, FONT } from "./theme";
import { SceneProps } from "./theme";

const clamp = (v: number) => Math.max(0.01, Math.min(0.965, v));
const typed = (text: string, prog: number, start: number, span: number) => {
  const t = Math.max(0, Math.min(1, (prog - start) / span));
  return text.slice(0, Math.ceil(text.length * t));
};

/** sc006 (s03) — Trang SGK gặp truyện lần đầu: chip triều đại + vòng mực bụng phồng. */
export const Sc006: React.FC<SceneProps> = () => {
  const A = useA(611);
  const fEra = A("Đời Hùng Vương thứ 6");
  const fStill = A("chưa biết nói, chưa biết cười");
  return (
    <InkImageScene
      src={plateSrc("img-01-giong-tre.png")}
      label="Trang sách giáo khoa"
      sublabel="Một mẹ một con · làng Phù Đổng"
      durationInFrames={611}
    >
      <Reveal startFrac={fEra}>
        <div style={{ position: "absolute", top: 70, left: 70 }}>
          <Chip color={C.amber}>Đời Hùng Vương thứ 6</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={fStill}>
        <div
          style={{
            position: "absolute",
            left: 70,
            bottom: 120,
            fontFamily: FONT.body,
            fontSize: 30,
            color: C.earthDeep,
          }}
        >
          chưa biết nói, chưa biết cười — chỉ nằm một chỗ
        </div>
      </Reveal>
      <InkDraw d={circleD(960, 690, 78)} startFrac={fStill} endFrac={clamp(fStill + 0.22)} stroke={C.amber} width={3} />
      <InkDraw d={circleD(960, 690, 96)} startFrac={clamp(fStill + 0.09)} endFrac={clamp(fStill + 0.31)} stroke={C.amber} width={2} />
      <SourceTag text="Sách giáo khoa · truyện Thánh Gióng" bottom={64} />
    </InkImageScene>
  );
};

/** sc012 (s05) — Hồi một, trang mới nhất 1479: bộ ba trang + chip nguồn + vài dòng khô. */
export const Sc012: React.FC<SceneProps> = () => {
  const A = useA(622);
  const fPages = A("ba trang sách");
  const fDry = A("vắn vọn vài dòng khô");
  const years = [
    { y: "1479", tag: "mới nhất" },
    { y: "1492", tag: "" },
    { y: "1329", tag: "cổ nhất" },
  ];
  return (
    <InkImageScene
      src={plateSrc("img-09-co-thu-dvsktt.png")}
      label="Đại Việt sử ký toàn thư"
      sublabel="Chính sử · trang mới nhất trước"
      durationInFrames={622}
    >
      <SpringPop startFrac={fPages}>
        <div style={{ position: "absolute", top: 70, right: 70, display: "flex", gap: 18 }}>
          {years.map((it, i) => (
            <div
              key={it.y}
              style={{
                width: 122,
                height: 152,
                border: `2px solid ${i === 0 ? C.amber : C.border}`,
                borderRadius: 6,
                background: C.card,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT.mono,
                color: C.earthDeep,
              }}
            >
              <div style={{ fontSize: 30 }}>{it.y}</div>
              <div style={{ fontSize: 15, color: C.mute, marginTop: 8 }}>{it.tag}</div>
            </div>
          ))}
        </div>
      </SpringPop>
      <div style={{ position: "absolute", right: 90, bottom: 150, width: 560 }}>
        <TextCard startFrac={fDry} eyebrow="Chính sử · sự kiệm chữ" title="vắn vọn vài dòng khô">
          {[0, 1, 2, 3].map((i) => (
            <Reveal key={i} startFrac={clamp(fDry + 0.03 + i * 0.02)}>
              <div style={{ height: 3, background: C.amber, opacity: 0.65, marginTop: 14, width: `${100 - i * 18}%` }} />
            </Reveal>
          ))}
        </TextCard>
      </div>
      <SourceTag text="ĐVSKTT · 1479 / bản Chính hiệu 1697" bottom={64} />
    </InkImageScene>
  );
};

/** sc018 (s07) — Lời tiên tri nơi ngã ba đường: nét đường chia + chip tuổi. */
export const Sc018: React.FC<SceneProps> = () => {
  const A = useA(312);
  const fFork = A("ngã ba đường");
  const fAge = A("ngoài 60");
  return (
    <InkImageScene
      src={plateSrc("img-02-cu-gia.png")}
      label="Cụ già nơi ngã ba đường"
      sublabel="Truyền kỳ · lời tiên tri"
      durationInFrames={312}
    >
      <InkDraw
        d="M 420 940 L 960 850 L 1500 940 M 960 850 L 960 690"
        startFrac={fFork}
        endFrac={clamp(fFork + 0.25)}
        stroke={C.earthDeep}
        width={3}
      />
      <SpringPop startFrac={fAge}>
        <div style={{ position: "absolute", top: 70, right: 70 }}>
          <Chip color={C.amber}>cha mẹ đã ngoài 60 · đi chùa cầu tự</Chip>
        </div>
      </SpringPop>
      <SourceTag text="Lĩnh Nam chích quái · hiệu chính 1492" bottom={64} />
    </InkImageScene>
  );
};

/** sc024 (s09) — Quote cổ nhất: thần Thổ địa bên chùa làng + verdict "Không có trận đánh." */
export const Sc024: React.FC<SceneProps> = () => {
  const A = useA(701);
  const { frame, dur } = useFrac(701);
  const prog = frame / dur;
  const fQuote = A("vị thần Thổ địa");
  const fVerdict = A("Không có trận đánh");
  const quote =
    "Theo truyện Báo Cực chép trong Việt Điện U Linh Tập, thần vốn là vị thần Thổ địa bên chùa Kiến Sơ, hương Phù Đổng, huyện Tiên Du.";
  const topos: Array<[string, string]> = [
    ["Phù Đổng", "hương"],
    ["Tiên Du", "huyện"],
  ];
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          top: 84,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.mono,
          fontSize: 24,
          letterSpacing: 4,
          color: C.mute,
        }}
      >
        TRANG CỔ NHẤT · 1329 · VIỆT ĐIỆN U LINH TẬP
      </div>
      <Reveal startFrac={fQuote}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: 200,
            width: 1360,
            border: `3px solid ${C.amber}`,
            background: C.card,
            padding: "56px 64px",
            fontFamily: FONT.display,
            fontSize: 42,
            lineHeight: 1.6,
            color: C.earthDeep,
          }}
        >
          {typed(quote, prog, fQuote, 0.3)}
          <span style={{ opacity: prog > fQuote && prog < fQuote + 0.3 ? 1 : 0 }}>|</span>
        </div>
      </Reveal>
      <div style={{ position: "absolute", top: 700, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 80 }}>
        {topos.map(([name, kind], i) => {
          const s0 = clamp(fQuote + 0.34 + i * 0.05);
          const s1 = Math.min(0.965, s0 + 0.08);
          return (
            <Reveal key={name} startFrac={s0}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.earthDeep }}>
                  {name} <span style={{ color: C.mute }}>· {kind}</span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: C.teal,
                    width: 220,
                    margin: "10px auto 0",
                    transform: `scaleX(${interpolate(prog, [s0, s1], [0, 1])})`,
                    transformOrigin: "left center",
                  }}
                />
              </div>
            </Reveal>
          );
        })}
      </div>
      <SpringPop startFrac={fVerdict}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 830,
            textAlign: "center",
            fontFamily: FONT.display,
            fontSize: 84,
            color: C.amber,
          }}
        >
          Không có trận đánh.
        </div>
      </SpringPop>
      <SourceTag text="sách chép · Việt Điện U Linh Tập · 1329" bottom={64} />
    </Paper>
  );
};

/** sc030 (s11) — Không câu thần chú: vòng mực khoanh nong + bàn tay góp gạo. */
export const Sc030: React.FC<SceneProps> = () => {
  const A = useA(388);
  const fNot = A("Thánh Gióng không tự lớn");
  const fHands = A("những bàn tay góp vào nong");
  const hands: Array<[number, number]> = [
    [1168, 780],
    [960, 900],
    [752, 780],
    [752, 540],
    [960, 420],
    [1168, 540],
  ];
  return (
    <InkImageScene
      src={plateSrc("img-04-nong-com.png")}
      label="Chiếc nong"
      sublabel="Hạt gạo từ nhà này, nhà kia"
      durationInFrames={388}
    >
      <InkDraw d={circleD(960, 640, 250)} startFrac={fNot} endFrac={clamp(fNot + 0.3)} stroke={C.amber} width={5} />
      <SpringPop startFrac={clamp(fNot + 0.08)}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
          <Chip color={C.amber}>cả làng góp — không một câu thần chú</Chip>
        </div>
      </SpringPop>
      {hands.map(([x, y], i) => (
        <InkDraw
          key={i}
          d={`M ${x - 18} ${y + 12} Q ${x} ${y - 20} ${x + 18} ${y + 12}`}
          startFrac={clamp(fHands + i * 0.018)}
          endFrac={clamp(fHands + i * 0.018 + 0.1)}
          stroke={C.earthDeep}
          width={3}
        />
      ))}
      <SourceTag text="Truyền kỳ Phù Đổng · 1492" bottom={64} />
    </InkImageScene>
  );
};

/** sc036 (s13) — Hai cái nhìn về cùng một trận: SGK hỗn chiến vs tráng sĩ giữa bãi tre. */
export const Sc036: React.FC<SceneProps> = () => {
  const A = useA(715);
  const { frame, dur } = useFrac(715);
  const prog = frame / dur;
  const fLeft = A("quay giáo đánh lẫn nhau");
  const fRight = A("tre vệ đường");
  const fCap = clamp(fRight + 0.05);
  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 940, background: C.warn, opacity: 0.1 }} />
      <InkDraw d="M 960 80 V 1000" startFrac={fLeft} endFrac={clamp(fLeft + 0.2)} stroke={C.border} width={2} />
      {/* Trái: trận đánh như SGK dựng */}
      <Reveal startFrac={fLeft}>
        <div style={{ position: "absolute", top: 90, left: 80, right: 80, textAlign: "center" }}>
          <Chip color={C.warn}>SGK: trận đánh</Chip>
        </div>
      </Reveal>
      <InkDraw d="M 480 380 L 780 660" startFrac={fLeft} endFrac={clamp(fLeft + 0.12)} stroke={C.warn} width={4} />
      <InkDraw
        d="M 780 380 L 480 660"
        startFrac={clamp(fLeft + 0.03)}
        endFrac={clamp(fLeft + 0.15)}
        stroke={C.warn}
        width={4}
      />
      <InkDraw
        d="M 420 540 L 840 480"
        startFrac={clamp(fLeft + 0.06)}
        endFrac={clamp(fLeft + 0.16)}
        stroke={C.warn}
        width={3}
      />
      <InkDraw
        d="M 640 340 L 650 700"
        startFrac={clamp(fLeft + 0.09)}
        endFrac={clamp(fLeft + 0.19)}
        stroke={C.warn}
        width={3}
      />
      <Reveal startFrac={clamp(fLeft + 0.12)}>
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 150,
            textAlign: "center",
            fontFamily: FONT.body,
            fontSize: 30,
            fontStyle: "italic",
            color: C.earthDeep,
          }}
        >
          “giặc tự quay giáo đánh lẫn nhau”
        </div>
      </Reveal>
      {/* Phải: trang truyền kỳ 1492 */}
      <Reveal startFrac={fRight}>
        <div style={{ position: "absolute", top: 90, left: 1000, right: 60, textAlign: "center" }}>
          <Chip color={C.amber}>người chép 1492 đọc kỹ</Chip>
        </div>
      </Reveal>
      {[1260, 1345, 1430, 1515].map((x, i) => (
        <InkDraw
          key={x}
          d={`M ${x} 400 V 780 M ${x - 14} 500 h 28 M ${x - 14} 640 h 28`}
          startFrac={clamp(fRight + i * 0.04)}
          endFrac={clamp(fRight + i * 0.04 + 0.12)}
          stroke={C.earth}
          width={i === 1 ? 5 : 3}
        />
      ))}
      <InkDraw d={circleD(1130, 470, 24)} startFrac={fRight} endFrac={clamp(fRight + 0.08)} stroke={C.earthDeep} width={4} />
      <InkDraw
        d="M 1130 494 q -16 130 0 250 M 1130 560 q 70 14 128 -8"
        startFrac={clamp(fRight + 0.05)}
        endFrac={clamp(fRight + 0.2)}
        stroke={C.earthDeep}
        width={4}
      />
      <Reveal startFrac={clamp(fRight + 0.08)}>
        <div
          style={{
            position: "absolute",
            left: 1000,
            right: 60,
            bottom: 150,
            textAlign: "center",
            fontFamily: FONT.body,
            fontSize: 30,
            color: C.earthDeep,
          }}
        >
          tay không còn roi sắt — chỉ còn tre vệ đường
        </div>
      </Reveal>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 48,
          textAlign: "center",
          fontFamily: FONT.display,
          fontSize: 42,
          color: C.amber,
        }}
      >
        {typed("hiện diện thay vì chém giết", prog, fCap, 0.1)}
      </div>
      <SourceTag text="trận đánh · hai cách đọc" bottom={64} right />
    </Paper>
  );
};

/** sc042 (s16) — Hồi ba: bản đồ hai đền + cung bay Phù Đổng → núi Sóc. */
export const Sc042: React.FC<SceneProps> = () => {
  const A = useA(207);
  const { frame, dur } = useFrac(207);
  const prog = frame / dur;
  const fSplit = A("tách làm hai nơi");
  const fTwo = A("Hai ngôi đền");
  const fCap = clamp(fTwo + 0.06);
  return (
    <Paper>
      <SceneTitle startFrac={fSplit} eyebrow="HỒI BA" title="Một người — hai ngôi đền" align="center" />
      <InkDraw
        d="M 260 780 C 620 700 940 880 1440 700 S 1700 640 1780 680"
        startFrac={fSplit}
        endFrac={clamp(fSplit + 0.25)}
        stroke={C.earth}
        width={3}
      />
      <InkDraw
        d="M 1190 470 l 45 -70 l 45 70 M 1285 470 l 38 -58 l 38 58"
        startFrac={clamp(fSplit + 0.03)}
        endFrac={clamp(fSplit + 0.18)}
        stroke={C.earth}
        width={3}
      />
      <InkDraw d={circleD(700, 640, 16)} startFrac={fSplit} endFrac={clamp(fSplit + 0.08)} stroke={C.teal} width={4} />
      <InkDraw d={circleD(700, 640, 4)} startFrac={fSplit} endFrac={clamp(fSplit + 0.05)} stroke={C.teal} width={3} />
      <InkDraw
        d={circleD(1330, 420, 16)}
        startFrac={clamp(fSplit + 0.05)}
        endFrac={clamp(fSplit + 0.13)}
        stroke={C.teal}
        width={4}
      />
      <InkDraw
        d={circleD(1330, 420, 4)}
        startFrac={clamp(fSplit + 0.05)}
        endFrac={clamp(fSplit + 0.1)}
        stroke={C.teal}
        width={3}
      />
      <InkDraw d="M 700 640 Q 990 210 1330 420" startFrac={fTwo} endFrac={clamp(fTwo + 0.22)} stroke={C.amber} width={4} />
      <Reveal startFrac={clamp(fSplit + 0.04)}>
        <div style={{ position: "absolute", left: 470, top: 660, width: 460 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.earthDeep }}>đền Phù Đổng</div>
          <div style={{ fontFamily: FONT.body, fontSize: 24, color: C.mute }}>đồng bằng · nơi sinh ra và ra trận</div>
        </div>
      </Reveal>
      <Reveal startFrac={clamp(fSplit + 0.09)}>
        <div style={{ position: "absolute", left: 1160, top: 270, width: 420 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.earthDeep }}>đền Sóc</div>
          <div style={{ fontFamily: FONT.body, fontSize: 24, color: C.mute }}>núi Sóc · nơi cởi áo bay về</div>
        </div>
      </Reveal>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 110,
          textAlign: "center",
          fontFamily: FONT.display,
          fontSize: 46,
          color: C.amber,
        }}
      >
        {typed("cùng thờ một người", prog, fCap, 0.1)}
      </div>
      <SourceTag text="Phù Đổng · Bắc Ninh — Sóc Sơn · Hà Nội" bottom={64} />
    </Paper>
  );
};

/** sc048 (s18) — Tám lễ vật: 7 món trượt theo nhịp, giò hoa tre sáng vàng giữ sáng. */
const OFFERINGS = [
  "Trầu cau",
  "Cầu húc",
  "Ngà voi",
  "Cỏ voi",
  "Ngựa sắt thần mã",
  "Voi chiến",
  "Kiệu nữ tướng trẻ",
  "Giò hoa tre",
];
export const Sc048: React.FC<SceneProps> = () => {
  const A = useA(586);
  const f8 = A("8 lễ vật truyền thống");
  const fTre = A("giò hoa tre");
  const cellStyle = (i: number): React.CSSProperties => ({
    position: "absolute",
    left: 140 + (i % 4) * 420,
    top: 400 + Math.floor(i / 4) * 250,
    width: 380,
    height: 210,
    borderRadius: 10,
    border: `2px solid ${i === 7 ? C.amber : C.border}`,
    background: C.card,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  });
  return (
    <Paper>
      <SceneTitle eyebrow="ĐỀN SÓC · MÙNG 6 THÁNG GIÊNG" title="Tám lễ vật lên đền Thượng" align="center" />
      <div style={{ position: "absolute", top: 88, right: 90, fontFamily: FONT.mono, fontSize: 64, color: C.amber }}>
        <CountUp from={0} to={8} startFrac={f8} endFrac={clamp(f8 + 0.25)} decimals={0} />
      </div>
      {OFFERINGS.slice(0, 7).map((name, i) => (
        <Reveal key={name} startFrac={clamp(f8 + i * 0.035)} dy={30}>
          <div style={cellStyle(i)}>
            <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.mute }}>0{i + 1}</div>
            <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.earthDeep }}>{name}</div>
          </div>
        </Reveal>
      ))}
      <Reveal startFrac={fTre} dy={30}>
        <div style={cellStyle(7)}>
          <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.amber }}>08</div>
          <div style={{ fontFamily: FONT.display, fontSize: 36, color: C.amber }}>Giò hoa tre</div>
          <Chip color={C.amber}>làng Vệ Linh cung tiến</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={clamp(fTre + 0.06)}>
        <div
          style={{
            position: "absolute",
            left: 1388,
            top: 638,
            width: 404,
            height: 234,
            borderRadius: 16,
            boxShadow: `0 0 44px 6px ${C.amber}`,
          }}
        />
      </Reveal>
      <Reveal startFrac={clamp(fTre + 0.1)}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 120,
            textAlign: "center",
            fontFamily: FONT.body,
            fontSize: 28,
            color: C.earthDeep,
          }}
        >
          một lễ vật không nơi nào có — tre, vũ khí mộc mạc nhất, thành lễ vật
        </div>
      </Reveal>
      <SourceTag text="Hội đền Sóc · lệ rước 8 lễ vật" bottom={64} />
    </Paper>
  );
};

/** sc054 (s21) — Im lặng của cộng đồng: vòng mực loang từ đứa trẻ ra cả làng. */
export const Sc054: React.FC<SceneProps> = () => {
  const A = useA(539);
  const fChild = A("đứa trẻ im lặng");
  const fHold = A("nín thở chờ đợi");
  const figs: Array<[number, number]> = [
    [1400, 760],
    [1180, 920],
    [900, 940],
    [620, 900],
    [420, 720],
    [500, 480],
    [760, 380],
    [1120, 400],
  ];
  return (
    <Paper>
      <Reveal startFrac={fChild}>
        <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.teal}>CHI TIẾT THỨ NHẤT · SỰ IM LẶNG</Chip>
        </div>
      </Reveal>
      <InkDraw d={circleD(960, 560, 34)} startFrac={fChild} endFrac={clamp(fChild + 0.1)} stroke={C.earthDeep} width={4} />
      <InkDraw
        d="M 960 594 q -18 130 0 260"
        startFrac={clamp(fChild + 0.04)}
        endFrac={clamp(fChild + 0.16)}
        stroke={C.earthDeep}
        width={4}
      />
      {[210, 350, 490].map((r, i) => (
        <InkDraw
          key={r}
          d={circleD(960, 630, r)}
          startFrac={clamp(fChild + 0.08 + i * 0.08)}
          endFrac={clamp(fChild + 0.28 + i * 0.08)}
          stroke={C.earth}
          width={2}
        />
      ))}
      {figs.map(([x, y], i) => (
        <Reveal key={i} startFrac={clamp(fHold + i * 0.012)} dy={14}>
          <div style={{ position: "absolute", left: x, top: y, width: 44, height: 110 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.earthDeep, margin: "0 auto" }} />
            <div style={{ width: 4, height: 76, background: C.earthDeep, margin: "6px auto 0", borderRadius: 2 }} />
          </div>
        </Reveal>
      ))}
      <Reveal startFrac={clamp(fHold + 0.1)}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 120,
            textAlign: "center",
            fontFamily: FONT.display,
            fontSize: 44,
            color: C.earthDeep,
          }}
        >
          im lặng của cả một cộng đồng đang chờ đợi
        </div>
      </Reveal>
      <SourceTag text="truyện kể · chi tiết đọc lại" bottom={64} />
    </Paper>
  );
};

/** sc060 (s23) — Câu trả lời: "nó không phải là một cá nhân" + hai vế gạch mờ. */
export const Sc060: React.FC<SceneProps> = () => {
  const A = useA(322);
  const { frame, dur } = useFrac(322);
  const prog = frame / dur;
  const fAns = A("câu trả lời của tối nay");
  const fThesis = A("không phải là một cá nhân");
  const strike = (s: number) => {
    const s1 = Math.min(0.965, s + 0.06);
    return interpolate(prog, [s, s1], [0, 1]);
  };
  const neg1 = clamp(fThesis + 0.06);
  const neg2 = clamp(fThesis + 0.11);
  return (
    <Paper>
      <SceneTitle
        startFrac={fAns}
        eyebrow="CÂU TRẢ LỜI"
        title="Vì sao người cứu nước là một đứa trẻ im lặng?"
        align="center"
        maxWidth={1400}
      />
      <Reveal startFrac={fThesis}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 430,
            textAlign: "center",
            fontFamily: FONT.display,
            fontSize: 92,
            color: C.amber,
          }}
        >
          nó không phải là một cá nhân
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 0, right: 0, top: 650, textAlign: "center" }}>
        <Reveal startFrac={neg1}>
          <div style={{ position: "relative", display: "inline-block", padding: "0 30px" }}>
            <span style={{ fontFamily: FONT.body, fontSize: 40, color: C.mute }}>không sinh ra đã thần thánh</span>
            <div
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                top: "50%",
                height: 3,
                background: C.earthDeep,
                transform: `scaleX(${strike(clamp(fThesis + 0.11))})`,
                transformOrigin: "left center",
              }}
            />
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 780, textAlign: "center" }}>
        <Reveal startFrac={neg2}>
          <div style={{ position: "relative", display: "inline-block", padding: "0 30px" }}>
            <span style={{ fontFamily: FONT.body, fontSize: 40, color: C.mute }}>không một mình to lớn</span>
            <div
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                top: "50%",
                height: 3,
                background: C.earthDeep,
                transform: `scaleX(${strike(clamp(fThesis + 0.16))})`,
                transformOrigin: "left center",
              }}
            />
          </div>
        </Reveal>
      </div>
      <SourceTag text="hồi kết · cách đọc của hôm nay" bottom={64} />
    </Paper>
  );
};

/** sc066 (s25) — Tứ bất tử: callback silhouette Tản Viên một nhịp, rồi bốn vệt sáng + câu hỏi. */
export const Sc066: React.FC<SceneProps> = () => {
  const A = useA(474);
  const { frame, dur } = useFrac(474);
  const prog = frame / dur;
  const fTV = A("ngay sau Tản Viên");
  const fQ = A("ai sẽ đứng ra");
  const a0 = clamp(fTV);
  const a1 = clamp(fTV + 0.04);
  const a2 = Math.min(0.9, clamp(fTV + 0.11));
  const a3 = a2 + 0.05;
  const silO = interpolate(prog, [a0, a1, a2, a3], [0, 0.8, 0.8, 0]);
  const q0 = clamp(fQ);
  const q1 = Math.max(q0 + 0.04, Math.min(0.965, q0 + 0.08));
  const sCol = interpolate(prog, [q0, q1], [1, 0.08]);
  const names = ["Tản Viên Sơn Thánh", "Phù Đổng Thiên Vương", "Chử Đồng Tử", "Liễu Hạnh"];
  return (
    <Paper>
      <SceneTitle eyebrow="TỨ BẤT TỬ" title="Bốn vị thánh bất tử của người Việt đồng bằng" align="center" maxWidth={1500} />
      <Img
        src={plateSrc("f07-hung-vuong.png")}
        style={{
          position: "absolute",
          left: 130,
          top: 260,
          width: 400,
          height: 540,
          objectFit: "cover",
          opacity: silO,
          filter: "grayscale(1) brightness(0.32) contrast(1.3)",
        }}
      />
      {names.map((name, i) => (
        <div
          key={name}
          style={{
            position: "absolute",
            left: 150 + i * 420,
            top: 460,
            width: 360,
            height: 150,
            borderRadius: 10,
            background: C.card,
            border: `2px solid ${i === 1 ? C.amber : C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT.display,
            fontSize: 30,
            color: i === 1 ? C.amber : C.earthDeep,
            transform: `scaleY(${sCol})`,
            boxShadow: `0 0 ${Math.round((1 - sCol) * 44)}px ${i === 1 ? C.amber : C.border}`,
          }}
        >
          {name}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 140,
          textAlign: "center",
          fontFamily: FONT.display,
          fontSize: 48,
          color: C.amber,
        }}
      >
        {typed("trong thời khó, ai đứng ra, bằng sức mạnh nào?", prog, clamp(fQ + 0.02), 0.14)}
      </div>
      <SourceTag text="Tứ bất tử · tín ngưỡng dân gian" bottom={64} />
    </Paper>
  );
};
