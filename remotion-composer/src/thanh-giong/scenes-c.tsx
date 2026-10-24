// S2E02 vn-myth — scenes group "c" (spec_c.json) — compose worker output.
// Speech-lock: mọi reveal/pop/count bắn tại A("anchor") — anchors verbatim từ spec.
import * as React from "react";
import {
  Paper,
  Reveal,
  SourceTag,
  Chip,
  plateSrc,
  InkImageScene,
  LabBadge,
  useA,
  useFrac,
  TextCard,
  SpringPop,
  SceneTitle,
  CountUp,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const sm = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** sc003 (s02) — Hội hôm nay: mở từ hiện tại. img-13 + vòng trống mực + cờ hiệu giương. */
export const Sc003: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame, dur } = useFrac();
  const aOpening = A("Mở từ hôm nay", 1);
  const aDate = A("Mùng 9 tháng Tư âm lịch", 1);
  const aLocation = A("phía đông Hà Nội", 1);
  const aVillage = A("làng Phù Đổng", 1);
  const aDawn = A("tờ mờ sáng", 1);
  const aDrum = A("Trống hội dồn", 1);
  const aFlag = A("Cờ hiệu giương", 1);
  const drumIn = sm(p(aDrum, aDrum + 8 / dur));
  const flagIn = sm(p(aFlag, aFlag + 8 / dur));
  const pennant = flagIn;
  const pulse = 1 + 0.07 * Math.sin(frame * 0.7);
  return (
    <Paper>
      <InkImageScene
        src={plateSrc("img-13-hoi-hom-nay.png")}
        label="Hội làng Phù Đổng — tờ mờ sáng"
        sublabel="phía đông Hà Nội · người làng khoác áo lính theo lệ cổ"
        labelStartFrac={aVillage}
        sublabelStartFrac={aLocation}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", left: 70, top: 62 }}>
            <Reveal startFrac={aDate} dy={-8}>
              <Chip color={C.amber}>mùng 9 tháng Tư âm lịch</Chip>
            </Reveal>
          </div>
          <div style={{ position: "absolute", right: 70, top: 62 }}>
            <Reveal startFrac={aOpening} dy={-8}>
              <Chip color={C.cream}>mở từ hôm nay</Chip>
            </Reveal>
          </div>
          <div style={{ position: "absolute", left: 70, bottom: 62 }}>
            <Reveal startFrac={aDawn} dy={8}>
              <Chip color={C.bronze}>đổ ra đường từ tờ mờ sáng</Chip>
            </Reveal>
          </div>
          {/* vòng trống mực pulse theo nhịp */}
          <div
            style={{
              position: "absolute",
              left: 130,
              bottom: 120,
              opacity: drumIn,
              transform: `scale(${0.6 + 0.4 * drumIn * pulse})`,
            }}
          >
            <svg width={200} height={200} viewBox="0 0 200 200">
              <circle cx={100} cy={100} r={76} fill="none" stroke={C.amber} strokeWidth={5} />
              <circle cx={100} cy={100} r={56} fill="none" stroke={C.amber} strokeWidth={2} opacity={0.7} />
              <circle cx={100} cy={100} r={12} fill={C.amber} />
            </svg>
          </div>
          {/* cờ hiệu giương lên khi chữ đọc tới */}
          <div style={{ position: "absolute", right: 170, bottom: 110 }}>
            <svg width={230} height={360} viewBox="0 0 230 360">
              <line
                x1={155}
                y1={340}
                x2={155}
                y2={340 - 250 * flagIn}
                stroke={C.cream}
                strokeWidth={7}
                strokeLinecap="round"
              />
              <path
                d={`M155 ${340 - 250 * flagIn} L${155 + 118 * pennant} ${340 - 250 * flagIn + 26} L155 ${340 - 250 * flagIn + 52} Z`}
                fill={C.amber}
                opacity={pennant}
              />
            </svg>
          </div>
        </div>
      </InkImageScene>
    </Paper>
  );
};

/** sc009 (s04) — Câu hỏi mùa hai: keyword constellation "vị thần ở lại" + 4 vật quanh cụm. */
export const Sc009: React.FC<SceneProps> = () => {
  const A = useA();
  const aSeries = A("Series này mùa hai", 1);
  const aWhy = A("vì sao", 1);
  const aAnswer = A("tìm câu trả lời", 1);
  const aKey = A("vị thần ở lại", 1);
  const aGiong = A("Thánh Gióng", 1);
  const aKyla = A("kỳ lạ nhất", 1);
  const items = [
    { label: "trống hội", fx: A("trống hội", 1) },
    { label: "mâm cỗ", fx: A("mâm cỗ", 1) },
    { label: "hạt gạo", fx: A("hạt gạo", 1) },
    { label: "ngôi đền", fx: A("ngôi đền", 1) },
  ];
  const pos = [
    { left: 400, top: 265 },
    { left: 1520, top: 265 },
    { left: 1520, top: 745 },
    { left: 400, top: 745 },
  ];
  const icons: React.ReactNode[] = [
    <svg key="trong" width={110} height={110} viewBox="0 0 110 110">
      <circle cx={55} cy={52} r={42} fill="none" stroke={C.amber} strokeWidth={5} />
      <circle cx={55} cy={52} r={30} fill="none" stroke={C.amber} strokeWidth={2} opacity={0.6} />
      <line x1={28} y1={100} x2={42} y2={88} stroke={C.amber} strokeWidth={5} />
      <line x1={82} y1={100} x2={68} y2={88} stroke={C.amber} strokeWidth={5} />
    </svg>,
    <svg key="mam" width={110} height={110} viewBox="0 0 110 110">
      <ellipse cx={55} cy={56} rx={44} ry={15} fill="none" stroke={C.amber} strokeWidth={5} />
      <ellipse cx={55} cy={52} rx={28} ry={9} fill="none" stroke={C.amber} strokeWidth={2} opacity={0.6} />
      <line x1={32} y1={72} x2={36} y2={100} stroke={C.amber} strokeWidth={5} />
      <line x1={78} y1={72} x2={74} y2={100} stroke={C.amber} strokeWidth={5} />
    </svg>,
    <svg key="gao" width={110} height={110} viewBox="0 0 110 110">
      <ellipse cx={55} cy={55} rx={17} ry={30} fill={C.amber} transform="rotate(24 55 55)" />
      <path d="M46,44 Q55,55 64,66" stroke={C.cream} strokeWidth={3} fill="none" opacity={0.8} />
    </svg>,
    <svg key="den" width={110} height={110} viewBox="0 0 110 110">
      <path d="M10,58 Q55,8 100,58" fill="none" stroke={C.amber} strokeWidth={5} />
      <path d="M28,58 Q55,32 82,58" fill="none" stroke={C.amber} strokeWidth={2} opacity={0.6} />
      <line x1={32} y1={58} x2={32} y2={98} stroke={C.amber} strokeWidth={4} />
      <line x1={78} y1={58} x2={78} y2={98} stroke={C.amber} strokeWidth={4} />
      <line x1={14} y1={101} x2={96} y2={101} stroke={C.amber} strokeWidth={4} />
    </svg>,
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: C.bgMuseum, opacity: 0.94 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 920px 540px at 50% 46%, rgba(214,164,74,0.16), transparent 70%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: 86, textAlign: "center" }}>
        <Reveal startFrac={aSeries} dy={-6}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 26,
              letterSpacing: 6,
              color: C.mute,
            }}
          >
            MÙA HAI · VÌ SAO CHUYỆN XƯA VẪN SỐNG
          </div>
        </Reveal>
        <Reveal startFrac={aWhy} dy={4}>
          <div
            style={{
              marginTop: 10,
              fontFamily: FONT.body,
              fontSize: 24,
              color: C.bronze,
            }}
          >
            vì sao những chuyện tưởng như xa xưa vẫn sống?
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 390 }}>
        <Reveal startFrac={aKey} dy={12}>
          <div
            style={{
              textAlign: "center",
              fontFamily: FONT.display,
              fontSize: 116,
              color: C.cream,
              letterSpacing: 2,
              textShadow: "0 0 46px rgba(214,164,74,0.55)",
            }}
          >
            vị thần ở lại
          </div>
        </Reveal>
        <div style={{ position: "absolute", left: 0, right: 0, top: 148, textAlign: "center" }}>
          <Reveal startFrac={aAnswer} dy={8}>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 30,
                color: C.bronze,
                letterSpacing: 1,
              }}
            >
              tìm câu trả lời nơi những vị thần ở lại
            </div>
          </Reveal>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 94, textAlign: "center" }}>
        <Reveal startFrac={aGiong} dy={10}>
          <div style={{ fontFamily: FONT.display, fontSize: 44, color: C.amber }}>
            Thánh Gióng
          </div>
        </Reveal>
        <div style={{ marginTop: 8 }}>
          <Reveal startFrac={aKyla} dy={6}>
            <span style={{ fontFamily: FONT.mono, fontSize: 24, color: C.cream, opacity: 0.85 }}>
              trường hợp kỳ lạ nhất
            </span>
          </Reveal>
        </div>
      </div>
      {items.map((it, i) => (
        <div
          key={it.label}
          style={{ position: "absolute", left: pos[i].left, top: pos[i].top, transform: "translate(-50%, -50%)" }}
        >
          <Reveal startFrac={it.fx} dy={10}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              {icons[i]}
              <Chip color={C.bronze}>{it.label}</Chip>
            </div>
          </Reveal>
        </div>
      ))}
    </Paper>
  );
};

/** sc015 (s06) — Quote: lời xin đầu đời (ĐVSKTT) + 3 icon gươm–ngựa–roi pop theo ba danh từ. */
export const Sc015: React.FC<SceneProps> = () => {
  const A = useA();
  const aQ = A("Xin cho một thanh gươm");
  const aKhong = A("Không xin ngôi báu");
  const icons = [
    {
      label: "gươm",
      fx: aQ,
      svg: (
        <svg width={130} height={130} viewBox="0 0 130 130">
          <line x1={65} y1={112} x2={65} y2={26} stroke={C.cream} strokeWidth={7} strokeLinecap="round" />
          <path d="M65,10 L74,30 L56,30 Z" fill={C.cream} />
          <line x1={38} y1={92} x2={92} y2={92} stroke={C.amber} strokeWidth={7} strokeLinecap="round" />
          <circle cx={65} cy={114} r={7} fill={C.amber} />
        </svg>
      ),
    },
    {
      label: "ngựa",
      fx: aQ + 0.045,
      svg: (
        <svg width={150} height={130} viewBox="0 0 150 130">
          <path
            d="M28,112 L40,58 Q46,30 74,26 L80,10 L88,26 Q116,34 112,62 L104,112 Z"
            fill={C.cream}
            opacity={0.92}
          />
          <line x1={30} y1={40} x2={52} y2={44} stroke={C.amber} strokeWidth={4} />
          <line x1={38} y1={54} x2={58} y2={58} stroke={C.amber} strokeWidth={4} />
        </svg>
      ),
    },
    {
      label: "roi sắt",
      fx: aQ + 0.09,
      svg: (
        <svg width={130} height={130} viewBox="0 0 130 130">
          <path
            d="M28,22 Q86,26 80,72 Q76,100 48,96"
            fill="none"
            stroke={C.cream}
            strokeWidth={8}
            strokeLinecap="round"
          />
          <line x1={28} y1={22} x2={28} y2={48} stroke={C.amber} strokeWidth={7} strokeLinecap="round" />
        </svg>
      ),
    },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: C.bgMuseum, opacity: 0.95 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 760px 420px at 50% 26%, rgba(214,164,74,0.14), transparent 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 84,
          textAlign: "center",
          fontFamily: FONT.mono,
          fontSize: 26,
          letterSpacing: 6,
          color: C.mute,
        }}
      >
        LỜI NÓI ĐẦU ĐỜI
      </div>
      <TextCard
        title="«Xin cho một thanh gươm, một con ngựa và một roi sắt, nhà vua không phải lo gì cả!»"
        titleSize={72}
        startFrac={aQ}
        maxWidth={1460}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 690,
          display: "flex",
          justifyContent: "center",
          gap: 150,
        }}
      >
        {icons.map((ic) => (
          <SpringPop key={ic.label} startFrac={ic.fx} from={0.72}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {ic.svg}
              <span style={{ fontFamily: FONT.mono, fontSize: 26, color: C.cream, letterSpacing: 2 }}>{ic.label}</span>
            </div>
          </SpringPop>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center" }}>
        <Reveal startFrac={aKhong}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, opacity: 0.85 }}>
            Không xin vàng. Không xin ngôi báu.
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 92, textAlign: "center" }}>
        <Reveal startFrac={aKhong + 0.04}>
          <div style={{ fontFamily: FONT.display, fontSize: 38, color: C.amber }}>
            Tiếng nói đầu đời là một lời xin vũ khí.
          </div>
        </Reveal>
      </div>
      <SourceTag text="sách chép: Đại Việt sử ký toàn thư · 1479/1697" bottom={40} right />
    </Paper>
  );
};

/** sc021 (s08) — Bản kê khai binh khí: ngựa sắt 18 thước, thanh kiếm 7 thước, nón sắt + tỉ lệ. */
export const Sc021: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aNgua = A("ngựa sắt cao 18 thước");
  const aKiem = A("thanh kiếm dài 7 thước");
  const tNgua = sm(p(aNgua, aNgua + 0.05));
  const tKiem = sm(p(aKiem, aKiem + 0.05));
  const tNon = sm(p(aKiem + 0.05, aKiem + 0.1));
  const g = (t: number) => ({ opacity: t, transform: `translateY(${(1 - t) * 14}px)` });
  return (
    <Paper>
      <div style={{ position: "absolute", left: 110, right: 110, top: 70 }}>
        <SceneTitle
          eyebrow="trang 1492 · truyền kỳ"
          title="Bản kê khai binh khí"
          subtitle="chính sử chỉ xin gươm, ngựa, roi — truyền kỳ đúc cả kỵ binh thép"
          startFrac={0.02}
          align="left"
        />
      </div>
      <div style={{ position: "absolute", left: 150, top: 300, width: 1620 }}>
        <svg viewBox="0 0 1620 660" width="100%">
          {/* đất */}
          <line x1={120} y1={600} x2={1560} y2={600} stroke={C.earthDeep} strokeWidth={3} opacity={0.45} />
          {/* đứa trẻ — tham chiếu tỉ lệ */}
          <g style={g(tNgua)} fill={C.earthDeep} stroke={C.earthDeep}>
            <circle cx={320} cy={516} r={11} />
            <line x1={320} y1={530} x2={320} y2={600} strokeWidth={9} strokeLinecap="round" />
            <line x1={320} y1={552} x2={298} y2={576} strokeWidth={6} strokeLinecap="round" />
            <line x1={320} y1={552} x2={342} y2={576} strokeWidth={6} strokeLinecap="round" />
          </g>
          <text x={320} y={638} textAnchor="middle" fontFamily={FONT.mono} fontSize={22} fill={C.mute}>
            đứa trẻ · 3 tuổi
          </text>
          {/* thanh kiếm — 7 thước */}
          <g style={g(tKiem)}>
            <polygon points="692,600 692,410 700,386 708,410 708,600" fill={C.earthDeep} opacity={0.9} />
            <rect x={646} y={552} width={108} height={13} rx={4} fill={C.earthDeep} />
            <line x1={700} y1={565} x2={700} y2={600} stroke={C.earthDeep} strokeWidth={14} strokeLinecap="round" />
          </g>
          {/* nón sắt */}
          <g style={g(tNon)}>
            <path d="M950,600 Q1000,548 1050,600 Z" fill="none" stroke={C.earthDeep} strokeWidth={6} />
            <path d="M962,600 Q1000,624 1038,600" fill="none" stroke={C.earthDeep} strokeWidth={3} opacity={0.6} />
          </g>
          {/* ngựa sắt — 18 thước */}
          <g style={g(tNgua)}>
            <line x1={1288} y1={600} x2={1288} y2={382} stroke={C.earthDeep} strokeWidth={14} />
            <line x1={1330} y1={600} x2={1330} y2={374} stroke={C.earthDeep} strokeWidth={14} />
            <line x1={1388} y1={600} x2={1388} y2={374} stroke={C.earthDeep} strokeWidth={14} />
            <line x1={1428} y1={600} x2={1428} y2={382} stroke={C.earthDeep} strokeWidth={14} />
            <ellipse cx={1356} cy={330} rx={152} ry={70} fill={C.earthDeep} opacity={0.92} />
            <polygon points="1300,300 1330,136 1394,158 1362,318" fill={C.earthDeep} />
            <ellipse cx={1370} cy={146} rx={44} ry={24} fill={C.earthDeep} />
            <line x1={1352} y1={128} x2={1338} y2={98} stroke={C.earthDeep} strokeWidth={8} strokeLinecap="round" />
            <path d="M1504,300 Q1552,352 1530,432" fill="none" stroke={C.earthDeep} strokeWidth={8} />
          </g>
          {/* thước đo tỉ lệ */}
          <g opacity={tNgua} stroke={C.amber} strokeWidth={3} strokeDasharray="10 8">
            <line x1={1580} y1={600} x2={1580} y2={124} />
          </g>
          <g opacity={tNgua} stroke={C.amber} strokeWidth={3}>
            <line x1={1566} y1={600} x2={1594} y2={600} />
            <line x1={1566} y1={124} x2={1594} y2={124} />
          </g>
          <g opacity={tKiem} stroke={C.amber} strokeWidth={3} strokeDasharray="10 8">
            <line x1={790} y1={600} x2={790} y2={386} />
          </g>
          <g opacity={tKiem} stroke={C.amber} strokeWidth={3}>
            <line x1={776} y1={600} x2={804} y2={600} />
            <line x1={776} y1={386} x2={804} y2={386} />
          </g>
        </svg>
      </div>
      <div style={{ position: "absolute", left: 1210, top: 210 }}>
        <Reveal startFrac={aNgua}>
          <Chip color={C.amber}>
            ngựa sắt ·&nbsp;
            <CountUp to={18} startFrac={aNgua} endFrac={aNgua + 0.1} suffix=" thước" />
          </Chip>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 470, top: 330 }}>
        <Reveal startFrac={aKiem}>
          <Chip color={C.amber}>
            thanh kiếm ·&nbsp;
            <CountUp to={7} startFrac={aKiem} endFrac={aKiem + 0.1} suffix=" thước" />
          </Chip>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 900, top: 470 }}>
        <Reveal startFrac={aKiem + 0.05}>
          <Chip color={C.amber}>nón sắt</Chip>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center" }}>
        <Reveal startFrac={aKiem + 0.1}>
          <span style={{ fontFamily: FONT.mono, fontSize: 28, color: C.mute }}>
            Sách chép rõ kích thước, như một bản kê khai đồ binh khí.
          </span>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc027 (s10) — Quote: xóm làng chung góp (LNCQ 1492) — vế cuối nhận nền vàng đồng. */
export const Sc027: React.FC<SceneProps> = () => {
  const A = useA();
  const aGao = A("không đủ gạo");
  const aNhieu = A("gạo của nhiều nhà");
  const q = Math.max(0.015, aGao - 0.02);
  const aXom = aGao + 0.11;
  const lines: React.ReactNode[] = [
    <div key="l1">«Gia đình cậu tuy giàu có</div>,
    <div key="l2">
      nhưng <span style={{ color: C.amber, fontWeight: 700 }}>không đủ gạo</span> cho cậu ăn no,
    </div>,
    <div key="l3">
      <span style={{ color: C.amber, fontWeight: 700 }}>không đủ vải</span> để may áo quần.»
    </div>,
  ];
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 92,
          textAlign: "center",
          fontFamily: FONT.mono,
          fontSize: 26,
          letterSpacing: 6,
          color: C.mute,
        }}
      >
        HỒI HAI · HẠT GẠO
      </div>
      <div
        style={{
          position: "absolute",
          left: 240,
          right: 240,
          top: 250,
          fontFamily: FONT.display,
          fontSize: 58,
          lineHeight: 1.5,
          textAlign: "center",
          color: C.earth,
        }}
      >
        {lines.map((l, i) => (
          <Reveal key={i} startFrac={q + i * 0.035}>
            {l}
          </Reveal>
        ))}
      </div>
      <div style={{ position: "absolute", left: 340, right: 340, top: 600 }}>
        <SpringPop startFrac={aXom} from={0.96}>
          <div
            style={{
              background: "rgba(214,164,74,0.16)",
              border: `2px solid ${C.bronze}`,
              borderRadius: 14,
              padding: "26px 36px",
              textAlign: "center",
              fontFamily: FONT.display,
              fontSize: 44,
              color: C.earthDeep,
            }}
          >
            Xóm làng phải chung góp gạo vải với gia đình để nuôi cậu.
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center" }}>
        <Reveal startFrac={aNhieu}>
          <svg width={120} height={14} viewBox="0 0 120 14" style={{ marginBottom: 10 }}>
            <line x1={4} y1={7} x2={116} y2={7} stroke={C.bronze} strokeWidth={3} />
          </svg>
          <div style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 32, color: C.mute }}>
            bữa cơm của người cứu nước là gạo của nhiều nhà.
          </div>
        </Reveal>
      </div>
      <SourceTag text="sách chép: Lĩnh Nam chích quái · 1492" bottom={40} right />
    </Paper>
  );
};

/** sc033 (s12) — Ai đứng sau lưng cậu: bóng tráng sĩ bước ra, dãy mái làng sáng lên. */
export const Sc033: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aLang = A("Cả một làng");
  const aNong = A("đong bằng nong");
  const exit = sm(p(aLang + 0.12, 0.9)) * 660;
  const aGiap = Math.max(aLang + 0.15, aNong - 0.045);
  const houses = Array.from({ length: 8 }, (_, i) => ({
    x: 500 + i * 132,
    t: sm(p(aLang + 0.02 + i * 0.024, aLang + 0.07 + i * 0.024)),
  }));
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: C.bgMuseum, opacity: 0.94 }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 170,
          background: "linear-gradient(0deg, rgba(214,164,74,0.14), transparent)",
        }}
      />
      {/* làng sau lưng */}
      <div style={{ position: "absolute", left: 300, top: 320, width: 1320 }}>
        <svg viewBox="0 0 1320 540" width="100%">
          <line x1={0} y1={470} x2={1320} y2={470} stroke={C.earth} strokeWidth={3} opacity={0.5} />
          {houses.map((h, i) => (
            <g key={i}>
              <path
                d={`M${h.x},470 L${h.x + 60},400 L${h.x + 120},470`}
                fill="none"
                stroke={C.bronze}
                strokeWidth={4}
                opacity={0.35 + 0.5 * h.t}
              />
              <rect
                x={h.x + 18}
                y={470}
                width={84}
                height={60}
                fill="none"
                stroke={C.bronze}
                strokeWidth={3}
                opacity={0.3 + 0.4 * h.t}
              />
              <ellipse cx={h.x + 60} cy={428} rx={34} ry={20} fill={C.amber} opacity={0.28 * h.t} />
              <circle cx={h.x + 60} cy={428} r={7} fill={C.amber} opacity={h.t} />
            </g>
          ))}
        </svg>
      </div>
      {/* bóng tráng sĩ nhìn từ sau — bước ra khỏi khung */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ transform: `translateX(${-exit}px)`, width: "100%", height: "100%" }}>
          <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
            <g fill="#0d0a06" stroke={C.bronze} strokeWidth={2} strokeOpacity={0.45}>
              <circle cx={760} cy={300} r={34} />
              <circle cx={760} cy={256} r={14} />
              <path d="M700,840 L712,356 Q760,332 808,356 L820,840 Z" />
            </g>
            <line x1={798} y1={382} x2={862} y2={300} stroke="#0d0a06" strokeWidth={16} strokeLinecap="round" />
            <line x1={862} y1={300} x2={900} y2={172} stroke="#0d0a06" strokeWidth={9} strokeLinecap="round" />
            <line x1={420} y1={840} x2={1160} y2={840} stroke={C.earth} strokeWidth={3} opacity={0.5} />
          </svg>
        </div>
      </div>
      {/* caption */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 130, textAlign: "center" }}>
        <Reveal startFrac={aLang + 0.06}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, opacity: 0.85 }}>
            Sách không chép họ khóc hay reo. Sách chỉ chép cậu.
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center" }}>
        <Reveal startFrac={aGiap}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, opacity: 0.85 }}>
            Nhưng hạt gạo vẫn còn đó, dưới lớp giáp sắt.
          </div>
        </Reveal>
      </div>
      {/* nong — sức mạnh đong bằng nong */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center" }}>
        <Reveal startFrac={aNong}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <svg width={260} height={74} viewBox="0 0 260 74">
              <ellipse cx={130} cy={40} rx={116} ry={26} fill="none" stroke={C.amber} strokeWidth={5} />
              <ellipse cx={130} cy={40} rx={84} ry={18} fill="none" stroke={C.amber} strokeWidth={2} opacity={0.6} />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <ellipse
                  key={i}
                  cx={130 + (i - 3) * 24}
                  cy={40 - (i % 2 === 0 ? 0 : 6)}
                  rx={7}
                  ry={12}
                  fill={C.amber}
                  transform={`rotate(20 ${130 + (i - 3) * 24} 40)`}
                />
              ))}
            </svg>
            <div style={{ fontFamily: FONT.display, fontSize: 36, color: C.amber }}>
              sức mạnh được đong bằng nong
            </div>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc039 (s14) — Ruộng trả về làng: vùng xanh loang phủ cả hương Phù Đổng + dòng tổng kết. */
export const Sc039: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aHuong = A("cả hương Phù Đổng");
  const aTra = A("ruộng trả về làng");
  const aRuong = Math.max(0.02, aHuong - 0.03);
  const zoom = 1.07 - 0.07 * sm(p(0.04, 0.95));
  const fillT = sm(p(aHuong, aHuong + 0.16));
  const s1 = Math.max(0.02, aTra - 0.025);
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 150,
          bottom: 250,
          border: `3px solid ${C.border}`,
          borderRadius: 18,
          background: C.cream,
          overflow: "hidden",
        }}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%", width: "100%", height: "100%" }}>
          <svg viewBox="0 0 1560 600" width="100%" height="100%">
            <path
              d="M180,470 Q420,410 660,455 T1120,430 T1560,455"
              fill="none"
              stroke={C.teal}
              strokeWidth={5}
              opacity={0.45}
            />
            <path d="M240,200 Q420,120 640,190 Q760,230 700,320" fill="none" stroke={C.earth} strokeWidth={2} opacity={0.25} />
            <path d="M980,140 Q1180,90 1380,170 Q1440,220 1360,290" fill="none" stroke={C.earth} strokeWidth={2} opacity={0.25} />
            <circle cx={1240} cy={140} r={9} fill={C.earthDeep} />
            <text x={1240} y={108} textAnchor="middle" fontFamily={FONT.mono} fontSize={24} fill={C.earthDeep}>
              Sóc
            </text>
            <circle cx={560} cy={330} r={7} fill={C.earthDeep} />
            <circle cx={860} cy={390} r={6} fill={C.earthDeep} opacity={0.7} />
            <g transform={`translate(640 330) scale(${0.05 + 0.95 * fillT})`}>
              <ellipse rx={330} ry={190} fill={C.teal} opacity={0.3} />
              <ellipse rx={330} ry={190} fill="none" stroke={C.teal} strokeWidth={3} strokeDasharray="14 12" />
            </g>
            <text
              x={640}
              y={326}
              textAnchor="middle"
              fontFamily={FONT.display}
              fontSize={36}
              fill={C.earthDeep}
              opacity={fillT}
            >
              PHÙ ĐỔNG
            </text>
          </svg>
        </div>
        <div
          style={{
            position: "absolute",
            left: 34,
            top: 26,
            fontFamily: FONT.mono,
            fontSize: 24,
            letterSpacing: 4,
            color: C.mute,
          }}
        >
          VÙNG PHÙ ĐỔNG · BẢN ĐỒ GIẤY DẦU
        </div>
      </div>
      <div style={{ position: "absolute", right: 170, top: 200 }}>
        <Reveal startFrac={aRuong}>
          <Chip color={C.teal}>
            vua ban&nbsp;
            <CountUp to={100} startFrac={aRuong} endFrac={aRuong + 0.12} suffix=" mẫu ruộng tự điền" />
          </Chip>
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 130,
          textAlign: "center",
          fontFamily: FONT.display,
          fontSize: 38,
          color: C.earthDeep,
        }}
      >
        <Reveal startFrac={s1}>
          <span>áo để trên núi</span>
        </Reveal>
        <span style={{ color: C.mute, margin: "0 22px" }}>·</span>
        <Reveal startFrac={aTra}>
          <span style={{ color: C.amber }}>ruộng trả về làng</span>
        </Reveal>
        <span style={{ color: C.mute, margin: "0 22px" }}>·</span>
        <Reveal startFrac={aTra + 0.03}>
          <span>còn mình thì bay lên trời</span>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc045 (s17) — Diễn trình lễ: img-10 + chuỗi chip rước nước → rước cờ → khám đường, duyệt tướng. */
export const Sc045: React.FC<SceneProps> = () => {
  const A = useA();
  const aNuoc = A("rước nước");
  const aKham = A("khám đường, duyệt tướng");
  const steps = [
    { t: "1 · rước nước", fx: aNuoc },
    { t: "2 · rước cờ", fx: aNuoc + 0.035 },
    { t: "3 · khám đường, duyệt tướng", fx: aKham },
  ];
  return (
    <Paper>
      <InkImageScene
        src={plateSrc("img-10-den-phu-dong.png")}
        label="Đền Phù Đổng — đỏ son ngày hội"
        sublabel="dân làng rước nước về đền, lau rửa khí giới"
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <LabBadge text="hôm nay" />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 120,
              display: "flex",
              justifyContent: "center",
              gap: 26,
            }}
          >
            {steps.map((st, i) => (
              <Reveal key={st.t} startFrac={st.fx} dy={30}>
                <Chip color={i === 2 ? C.bronze : C.amber}>{st.t}</Chip>
              </Reveal>
            ))}
          </div>
        </div>
      </InkImageScene>
    </Paper>
  );
};

/** sc051 (s19) — Không ai là khán giả: sơ đồ đôi đền sinh/đền bay + vai làng sáng theo nhịp. */
export const Sc051: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame } = useFrac();
  const aThanh = A("Một vị thánh, hai loại kỷ niệm");
  const aKhan = A("không ai là khán giả");
  const aUnesco = Math.max(0.02, aThanh - 0.05);
  const tA = sm(p(aThanh, aThanh + 0.05));
  const tB = sm(p(aThanh + 0.05, aThanh + 0.1));
  const link = sm(p(aThanh + 0.09, aThanh + 0.14));
  const pulse = 1 + 0.05 * Math.sin(frame * 0.15);
  const roles = [
    { from: "nhà nông", to: "lính" },
    { from: "dân làng", to: "tướng" },
    { from: "trẻ con", to: "cờ" },
  ];
  const node = (t: number) => ({
    opacity: t,
    transform: `translateY(${(1 - t) * 16}px)`,
    border: `3px solid ${C.amber}`,
    borderRadius: 16,
    padding: "26px 30px",
    textAlign: "center" as const,
    background: "rgba(214,164,74,0.06)",
  });
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: C.bgMuseum, opacity: 0.95 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 78, textAlign: "center" }}>
        <Reveal startFrac={aUnesco}>
          <Chip color={C.teal}>16.11.2010 · UNESCO ghi danh · Nairobi</Chip>
        </Reveal>
      </div>
      {/* nhánh đôi */}
      <div style={{ position: "absolute", left: 250, top: 220, width: 400 }}>
        <div style={node(tA)}>
          <div style={{ fontFamily: FONT.display, fontSize: 52, color: C.cream }}>ĐỀN SINH</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 25, color: C.bronze, marginTop: 10 }}>tháng Tư · giữ trận đánh</div>
        </div>
      </div>
      <div style={{ position: "absolute", right: 250, top: 220, width: 400 }}>
        <div style={node(tB)}>
          <div style={{ fontFamily: FONT.display, fontSize: 52, color: C.cream }}>ĐỀN BAY</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 25, color: C.bronze, marginTop: 10 }}>tháng Giêng · giữ đêm cuối</div>
        </div>
      </div>
      {/* bóng đứa trẻ nối hai bên */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <line x1={680} y1={300} x2={1240} y2={300} stroke={C.amber} strokeWidth={3} strokeDasharray="14 12" opacity={link} />
          <g opacity={link} transform={`translate(960 300) scale(${pulse})`}>
            <circle cx={0} cy={-38} r={17} fill={C.cream} />
            <path d="M-24,44 L-16,-14 Q0,-26 16,-14 L24,44 Z" fill={C.cream} />
          </g>
        </svg>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 452, textAlign: "center" }}>
        <Reveal startFrac={aThanh + 0.02}>
          <div style={{ fontFamily: FONT.display, fontSize: 40, color: C.cream }}>
            «Một vị thánh, hai loại kỷ niệm»
          </div>
        </Reveal>
      </div>
      {/* dải vai — cả làng nhập vai */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 600,
          display: "flex",
          justifyContent: "center",
          gap: 44,
        }}
      >
        {roles.map((r, i) => (
          <Reveal key={r.to} startFrac={aThanh + 0.16 + i * 0.035} dy={22}>
            <div
              style={{
                border: `2px solid ${C.bronze}`,
                borderRadius: 14,
                background: "rgba(214,164,74,0.08)",
                padding: "22px 36px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: FONT.mono, fontSize: 27, color: C.mute }}>{r.from}</div>
              <div style={{ fontFamily: FONT.display, fontSize: 38, color: C.amber, marginTop: 6 }}>
                làm {r.to}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      {/* câu chốt — giữ đến hết scene */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 850, textAlign: "center" }}>
        <Reveal startFrac={aKhan}>
          <div style={{ fontFamily: FONT.display, fontSize: 58, color: C.cream, textShadow: "0 0 36px rgba(214,164,74,0.4)" }}>
            trong hội này — không ai là khán giả
          </div>
          <div
            style={{
              width: 520,
              height: 4,
              background: C.amber,
              margin: "18px auto 0",
              borderRadius: 2,
            }}
          />
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc057 (s22) — Chi tiết thứ ba: chuỗi nuôi nhà giàu → xóm làng → nong + câu hỏi treo. */
export const Sc057: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aBa = A("Chi tiết thứ ba");
  const aNong = A("nong của cả làng");
  const chain = [
    { k: "NHÀ GIÀU NHẤT", s: "không đủ gạo cho cậu ăn no", fx: aBa + 0.08 },
    { k: "XÓM LÀNG", s: "chung góp gạo vải", fx: aBa + 0.14 },
    { k: "NONG CỦA CẢ LÀNG", s: "cậu ăn bằng nong của cả làng", fx: aNong },
  ];
  const qT = sm(p(aNong + 0.05, aNong + 0.11));
  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 90 }}>
        <SceneTitle
          eyebrow="hồi hai · hạt gạo"
          title="Chi tiết thứ ba"
          subtitle="đứa trẻ lớn lên bằng gạo của từng nhà"
          startFrac={aBa}
          align="center"
        />
      </div>
      {/* chuỗi nuôi */}
      <div
        style={{
          position: "absolute",
          left: 150,
          right: 150,
          top: 420,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
        }}
      >
        {chain.map((cItem, i) => (
          <React.Fragment key={cItem.k}>
            {i > 0 && (
              <svg width={86} height={44} viewBox="0 0 86 44">
                <line
                  x1={4}
                  y1={22}
                  x2={68}
                  y2={22}
                  stroke={C.earthDeep}
                  strokeWidth={5}
                  strokeDasharray={70}
                  strokeDashoffset={70 * (1 - sm(p(chain[i].fx, chain[i].fx + 0.04)))}
                />
                <path
                  d="M64,12 L82,22 L64,32 Z"
                  fill={C.earthDeep}
                  opacity={sm(p(chain[i].fx + 0.02, chain[i].fx + 0.05))}
                />
              </svg>
            )}
            <SpringPop startFrac={cItem.fx} from={0.9}>
              <div
                style={{
                  width: 380,
                  border: `2px solid ${C.bronze}`,
                  borderRadius: 16,
                  background: C.card,
                  padding: "24px 26px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 700, letterSpacing: 2, color: C.earthDeep }}>
                  {cItem.k}
                </div>
                <div style={{ fontFamily: FONT.body, fontSize: 25, color: C.mute, marginTop: 10 }}>{cItem.s}</div>
              </div>
            </SpringPop>
          </React.Fragment>
        ))}
      </div>
      {/* câu hỏi treo — cán cân */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 690,
          textAlign: "center",
          opacity: qT,
          transform: `translateY(${(1 - qT) * -42}px)`,
        }}
      >
        <div style={{ fontFamily: FONT.display, fontSize: 56, color: C.earthDeep }}>
          «khi thắng trận, nó về đâu?»
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center" }}>
        <Reveal startFrac={aNong + 0.11}>
          <div style={{ fontFamily: FONT.mono, fontSize: 27, color: C.mute }}>
            Không lấy vợ. Không nối ngôi. Không nhận chức.
          </div>
        </Reveal>
      </div>
      <SourceTag text="truyện chép: Phù Đổng Thiên Vương · 100 mẫu ruộng tự điền" bottom={44} />
    </Paper>
  );
};

/** sc063 (s24) — Ca dao: hai câu mồng Chín tháng Tư, nét viết chạy theo nhịp đọc. */
export const Sc063: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a1 = A("Ai ơi mồng Chín tháng Tư");
  const a2 = A("không đi hội");
  const l2 = Math.max(a1 + 0.05, a2 - 0.13);
  const u1 = sm(p(a1, a1 + 0.07));
  const u2 = sm(p(l2, l2 + 0.07));
  const line = (t: number) => (
    <svg width={980} height={12} viewBox="0 0 980 12" style={{ marginTop: 18 }}>
      <line
        x1={4}
        y1={6}
        x2={976}
        y2={6}
        stroke={C.amber}
        strokeWidth={4}
        strokeDasharray={972}
        strokeDashoffset={972 * (1 - t)}
        strokeLinecap="round"
      />
    </svg>
  );
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 900px 600px at 50% 46%, rgba(214,164,74,0.12), transparent 72%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center" }}>
        <div style={{ opacity: u1 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 72, color: C.earthDeep }}>«Ai ơi mồng Chín tháng Tư.</div>
          {line(u1)}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 620, textAlign: "center" }}>
        <div style={{ opacity: u2 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 72, color: C.earthDeep }}>
            Không đi hội Gióng cũng hư mất đời.»
          </div>
          {line(u2)}
        </div>
      </div>
      <SourceTag text="ca dao dân gian · mồng Chín tháng Tư" bottom={44} right />
    </Paper>
  );
};

/** sc069 (s27) — Tease tập sau: bóng người mờ sau màn nước, dải vải trôi — không spoil. */
export const Sc069: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame } = useFrac();
  const aTease = A("người được thờ tiếp theo");
  const aKho = A("một chiếc khố");
  const drift = (sp: number) => ((frame * sp) % 420) - 210;
  const ribbonIn = sm(p(aKho, aKho + 0.06));
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: C.bgMuseum, opacity: 0.9 }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(58,76,96,0.5)" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 280,
          background: "linear-gradient(0deg, rgba(160,190,210,0.12), transparent)",
        }}
      />
      {/* bóng người — mờ sau màn nước, không mặt, không tên */}
      <div style={{ position: "absolute", left: 1130, top: 250, filter: "blur(6px)", opacity: 0.95 }}>
        <svg width={380} height={640} viewBox="0 0 380 640">
          <g fill="#0c131c">
            <circle cx={190} cy={96} r={48} />
            <path d="M124,620 L138,160 Q190,128 242,160 L256,620 Z" />
          </g>
        </svg>
      </div>
      {/* màn nước trôi */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: -320,
            top: 210 + i * 210,
            width: 2560,
            height: 128,
            borderRadius: 999,
            background: "rgba(210,225,235,0.05)",
            transform: `translateX(${drift(0.5 + i * 0.22)}px)`,
          }}
        />
      ))}
      {/* dải vải trôi theo nước */}
      <div
        style={{
          position: "absolute",
          left: 620,
          top: 820,
          opacity: ribbonIn,
          transform: `translateX(${Math.sin(frame * 0.05) * 26}px)`,
        }}
      >
        <svg width={250} height={90} viewBox="0 0 250 90">
          <path
            d="M10,52 Q70,20 130,46 T240,40"
            fill="none"
            stroke={C.cream}
            strokeWidth={14}
            strokeLinecap="round"
            opacity={0.85}
          />
        </svg>
      </div>
      {/* caption mực — nguyên văn, không spoil */}
      <div style={{ position: "absolute", left: 150, top: 440, width: 800 }}>
        <Reveal startFrac={aTease}>
          <div style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 44, lineHeight: 1.45, color: C.cream }}>
            «người được thờ tiếp theo còn nghèo hơn tất cả»
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 150, bottom: 96 }}>
        <Reveal startFrac={aKho + 0.04}>
          <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.mute, letterSpacing: 2 }}>
            hẹn bạn ở tập sau
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};
