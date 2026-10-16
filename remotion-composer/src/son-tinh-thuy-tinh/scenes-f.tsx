// S2E01 vn-myth scenes group "f" — sc006 · sc012 · sc018 · sc024 · sc030 · sc036 · sc042 · sc048 · sc054 · sc060
// Speech-lock: A("từ") trả về FRACTION của scene (common.tsx useA) — feed vào startFrac/endFrac.
import * as React from "react";
import { Img } from "remotion";
import {
  Paper,
  Reveal,
  CountUp,
  SpringPop,
  InkPath,
  circleD,
  SourceTag,
  Chip,
  SceneTitle,
  LegendFrame,
  plateSrc,
  InkImageScene,
  useA,
  useFrac,
  ease,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const FULL: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: 1920,
  height: 1080,
};

// ---------------------------------------------------------------- sc006 (s03)
// Tên mùa hai — SceneTitle spring-down + hai dòng câu hỏi fade lệch dưới hai bên.
export const Sc006: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const fTitle = A("Những vị thần ở lại");
  const fMua = A("mùa mới");

  return (
    <Paper>
      <div style={FULL}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 280, textAlign: "center" }}>
          <Reveal startFrac={fMua} dy={10}>
            <div
              style={{
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 34,
                letterSpacing: 14,
                color: C.amber,
                textTransform: "uppercase",
              }}
            >
              mùa hai
            </div>
            <div
              style={{
                width: 130,
                height: 2,
                background: C.amber,
                opacity: 0.8,
                margin: "22px auto 0",
              }}
            />
          </Reveal>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 400, textAlign: "center" }}>
          <SceneTitle
            title="NHỮNG VỊ THẦN Ở LẠI"
            align="center"
            startFrac={fTitle}
            titleSize={104}
          />
        </div>

        <Reveal startFrac={fp(fTitle, 110)} dy={16}>
          <div
            style={{
              position: "absolute",
              left: 120,
              bottom: 210,
              maxWidth: 660,
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 33,
              lineHeight: 1.5,
              color: C.mute,
              textAlign: "left",
            }}
          >
            Ta không hỏi thần thoại có thật không.
          </div>
        </Reveal>

        <Reveal startFrac={fp(fTitle, 230)} dy={16}>
          <div
            style={{
              position: "absolute",
              right: 120,
              bottom: 120,
              maxWidth: 760,
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 33,
              lineHeight: 1.5,
              color: C.mute,
              textAlign: "right",
            }}
          >
            Ta hỏi: vì sao những chuyện tưởng đã khép từ ngàn năm
            <br />
            vẫn sống trong đời thường hôm nay?
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ---------------------------------------------------------------- sc012 (s05)
// Trang thứ nhất — LNCQ 1492: KB zoom_in + quote-card nguyên văn sáng từng vế.
export const Sc012: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const fBook = A("Lĩnh Nam chích quái");
  const fHo = A("họ Nguyễn");

  const ve = (f: number, color = C.white, size = 40): React.CSSProperties => ({
    fontFamily: FONT.display,
    fontStyle: "italic",
    fontWeight: 700,
    fontSize: size,
    lineHeight: 1.55,
    color,
  });

  return (
    <InkImageScene
      src={plateSrc("img-05-co-thu-lncq.png")}
      focus={{ x: 0.5, y: 0.45 }}
      label="Lĩnh Nam chích quái"
      sublabel="hiệu chính 1492 · Vũ Quỳnh – Kiều Phú biên lại từ bản đời Trần"
    >
      <div style={FULL}>
        <Reveal startFrac={fBook} dy={20}>
          <div style={{ position: "absolute", left: 360, top: 320, width: 1200 }}>
            <LegendFrame label="TRÍCH NGUYÊN VĂN" color={C.amber}>
              <Reveal startFrac={fHo} dy={14}>
                <div style={ve(fHo)}>
                  «Sơn Tinh vốn <span style={{ color: C.amber }}>họ Nguyễn</span>,
                </div>
              </Reveal>
              <Reveal startFrac={fp(fHo, 55)} dy={14}>
                <div style={ve(fp(fHo, 55))}>ở động Gia Ninh, huyện Phong Châu.»</div>
              </Reveal>
              <Reveal startFrac={fp(fHo, 140)} dy={14}>
                <div style={{ ...ve(fp(fHo, 140), C.cream, 38), marginTop: 24 }}>
                  «… có tài cầu mưa lụt hoặc nắng hạn đều ứng nghiệm.»
                </div>
              </Reveal>
            </LegendFrame>
          </div>
        </Reveal>
      </div>
    </InkImageScene>
  );
};

// ---------------------------------------------------------------- sc018 (s07)
// Quote-card chính sử ĐVSKTT 1697 — nền img-06 ép mờ, tông chuyển teal.
export const Sc018: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur, p } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const fMy = A("tên là Mỵ Nương");
  const fRe = A("hai rể hiền");
  const cold = 0.1 + 0.2 * ease(p(0, 0.35)); // nền hơi lạnh dần về teal

  const quote: React.CSSProperties = {
    fontFamily: FONT.display,
    fontStyle: "italic",
    fontWeight: 700,
    fontSize: 42,
    lineHeight: 1.5,
    color: C.cream,
  };

  return (
    <InkImageScene src={plateSrc("img-06-co-thu-dvsktt.png")} focus={{ x: 0.5, y: 0.5 }}>
      <div style={FULL}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(6,20,24,0.62)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: C.teal,
            opacity: cold,
            pointerEvents: "none",
          }}
        />

        <Reveal startFrac={fp(fMy, -150)} dy={10}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 108, textAlign: "center" }}>
            <Chip
              color={C.teal}
              style={{ background: C.teal, color: "#0F1A1A", fontWeight: 700, letterSpacing: 3 }}
            >
              ĐẠI VIỆT SỬ KÝ TOÀN THƯ · 1697 · CHÍNH SỬ
            </Chip>
          </div>
        </Reveal>

        <div style={{ position: "absolute", left: 260, top: 300, width: 1400 }}>
          <Reveal startFrac={fMy} dy={16}>
            <div style={{ ...quote, paddingBottom: 40 }}>
              «Hùng vương có người con gái đẹp tuyệt trần,{" "}
              <span style={{ color: C.amber }}>tên là Mỵ Nương</span>»
            </div>
          </Reveal>
          <Reveal startFrac={fp(fMy, 150)} dy={16}>
            <div style={{ ...quote, paddingBottom: 40, opacity: 0.92 }}>
              «Sơn Tinh và Thủy Tinh… đánh bạo đến xin lĩnh mệnh»
            </div>
          </Reveal>
          <Reveal startFrac={fp(fRe, -30)} dy={16}>
            <div style={quote}>
              «lẽ nào lại được cả <span style={{ color: C.amber }}>hai rể hiền</span>?»
            </div>
          </Reveal>
        </div>

        <SourceTag text="Đại Việt sử ký toàn thư · hiệu chỉnh 1697 · trên phần soạn Ngô Sĩ Liên 1479" bottom={64} right />
      </div>
    </InkImageScene>
  );
};

// ---------------------------------------------------------------- sc024 (s09)
// Hai trang trao đổi chữ — cụm trôi chéo giữa hai trang + chuỗi thế hệ kể tick tuần tự.
export const Sc024: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur, p } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const atF = (f: number) => f * dur;
  const fKe = A("mỗi lần kể lại");
  const fThe = A("năm thế kỷ");

  // «voi chín ngà» trang trái → phải, mượt hóa nét câu đố vẽ tay
  const tVoi = ease(p(fKe, fp(fKe, 110)));
  const xVoi = 560 + 750 * tVoi;
  const opVoi = 1 - ease(p(fp(fKe, 70), fp(fKe, 110)));
  const opVoiHand = ease(p(fp(fKe, 70), fp(fKe, 110)));
  // «châu báu vàng bạc» trang phải → trái, hóa phép màu
  const tBau = ease(p(fp(fKe, 70), fp(fKe, 180)));
  const xBau = 1310 - 750 * tBau;
  const opBau = 1 - ease(p(fp(fKe, 140), fp(fKe, 180)));
  const opPhep = ease(p(fp(fKe, 140), fp(fKe, 180)));

  const page: React.CSSProperties = {
    position: "absolute",
    top: 170,
    width: 620,
    height: 700,
    borderRadius: 6,
  };

  const chain: Array<[string, number]> = [
    ["1492", fp(fThe, 15)],
    ["1697", fp(fThe, 55)],
    ["sách giáo khoa", fp(fThe, 100)],
    ["lời bà", fp(fThe, 145)],
    ["mạng", fp(fThe, 190)],
  ];

  return (
    <Paper>
      <div style={FULL}>
        <Reveal startFrac={fp(fKe, -120)}>
          <div
            style={{
              ...page,
              left: 250,
              background: "rgba(232,180,90,0.08)",
              border: `1.5px solid ${C.amber}`,
            }}
          >
            <div style={{ padding: 26, fontFamily: FONT.body, fontSize: 26, letterSpacing: 4, color: C.amber }}>
              LĨNH NAM CHÍCH QUÁI · 1492
            </div>
          </div>
          <div
            style={{
              ...page,
              left: 1050,
              background: "rgba(40,120,120,0.08)",
              border: `1.5px solid ${C.teal}`,
            }}
          >
            <div style={{ padding: 26, fontFamily: FONT.body, fontSize: 26, letterSpacing: 4, color: C.teal }}>
              ĐẠI VIỆT SỬ KÝ TOÀN THƯ · 1697
            </div>
          </div>
        </Reveal>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* vòng sáng teal nối hai trang */}
          <InkPath d="M872,500 C960,400 1080,400 1050,500" startFrac={fp(fKe, 40)} endFrac={fp(fKe, 120)} stroke={C.teal} strokeWidth={3} />
          <InkPath d="M1048,640 C960,760 872,760 872,640" startFrac={fp(fKe, 110)} endFrac={fp(fKe, 190)} stroke={C.teal} strokeWidth={3} />
          {/* cụm trôi 1: voi chín ngà → câu đố vẽ tay */}
          <g transform={`translate(${xVoi},455)`} opacity={opVoi}>
            <text textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize={46} fill={C.cream}>
              voi chín ngà
            </text>
          </g>
          <g transform="translate(1310,455)" opacity={opVoiHand}>
            <text textAnchor="middle" fontFamily={FONT.display} fontStyle="italic" letterSpacing={4} fontSize={44} fill={C.teal}>
              voi chín ngà…?
            </text>
          </g>
          <InkPath
            d="M1190,505 q22,-14 44,0 t44,0 t44,0 t44,0 t44,0"
            startFrac={fp(fKe, 115)}
            endFrac={fp(fKe, 140)}
            stroke={C.teal}
            strokeWidth={2.5}
          />
          {/* cụm trôi 2: châu báu vàng bạc → phép màu */}
          <g transform={`translate(${xBau},660)`} opacity={opBau}>
            <text textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize={46} fill={C.cream}>
              châu báu vàng bạc
            </text>
          </g>
          <g transform="translate(560,660)" opacity={opPhep}>
            <text textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize={46} fill={C.amber}>
              → phép màu
            </text>
          </g>
          <InkPath d={circleD(700, 742, 24)} startFrac={fp(fKe, 190)} endFrac={fp(fKe, 210)} stroke={C.amber} strokeWidth={2} />
        </svg>

        {/* chuỗi thế hệ kể — tick đúng thứ tự narration */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 92,
            textAlign: "center",
            fontFamily: FONT.body,
            fontSize: 34,
            color: C.mute,
          }}
        >
          {chain.map(([t, f], i) => (
            <React.Fragment key={t}>
              {i > 0 && <span style={{ opacity: frame >= atF(f) ? 0.5 : 0 }}> → </span>}
              <span
                style={{
                  opacity: frame >= atF(f) ? 1 : 0,
                  color: i < 2 ? C.amber : C.cream,
                  fontWeight: 700,
                }}
              >
                {t}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </Paper>
  );
};

// ---------------------------------------------------------------- sc030 (s12)
// Map stage 3/6 — dải quote vế-sáng-theo-nhịp + hai chặng đầu lộ trình nước teal.
export const Sc030: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const atF = (f: number) => f * dur;
  const fLy = A("Lý Nhân");
  const fQO = A("Quảng Oai");
  const fTenCo = A("tên cổ");

  // vế trích: [text, fraction-sáng, hot?]
  const parts: Array<[string, number, boolean]> = [
    ["«Thủy Tinh theo lối sông khác, ", 0.02, false],
    ["từ Lý Nhân", fLy, true],
    [" vào chân núi ", fp(fQO, -60), false],
    ["Quảng Oai", fQO, true],
    [", rồi theo dọc bờ lên ", fp(fQO, 30), false],
    ["cửa sông Hát", fp(fQO, 65), true],
    [", ra sông lớn mà rẽ vào ", fp(fQO, 100), false],
    ["sông Đà", fp(fQO, 130), true],
    [" để đánh ", fp(fQO, 160), false],
    ["Tản Viên", fp(fQO, 190), true],
    ["» — sách chép", fp(fQO, 220), false],
  ];

  return (
    <Paper>
      <div style={FULL}>
        {/* dải quote 1/4 trên */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 28,
            height: 212,
            background: "rgba(20,17,13,0.86)",
            borderBottom: `2px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 90px",
          }}
        >
          <div
            style={{
              maxWidth: 1680,
              textAlign: "center",
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1.55,
            }}
          >
            {parts.map(([t, f, hot]) => (
              <span
                key={t}
                style={{
                  color: hot && frame >= atF(f) ? C.teal : "rgba(232,220,200,0.55)",
                  fontWeight: hot && frame >= atF(f) ? 700 : 500,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* bản đồ 3/4 dưới (img-08 không chữ — mọi địa danh là overlay) */}
        <Img
          src={plateSrc("img-08-ban-do.png")}
          style={{ position: "absolute", left: 0, top: 240, width: 1920, height: 840, objectFit: "cover", opacity: 0.96 }}
        />

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* chặng sau: mờ, chấm sẵn làm định hướng */}
          <path
            d="M778,540 C860,470 980,430 1090,400 C1180,380 1250,390 1320,430 C1380,470 1400,520 1395,560"
            fill="none"
            stroke={C.mute}
            strokeWidth={2}
            strokeDasharray="2 10"
            opacity={0.5}
          />
          <text x={1085} y={372} fill={C.mute} opacity={0.6} fontFamily={FONT.body} fontSize={24}>
            cửa sông Hát
          </text>
          <text x={1330} y={462} fill={C.mute} opacity={0.6} fontFamily={FONT.body} fontSize={24}>
            sông Đà
          </text>
          <text x={1330} y={600} fill={C.mute} opacity={0.6} fontFamily={FONT.body} fontSize={24}>
            Tản Viên
          </text>
          {/* chặng đầu: nét nước teal chạy Lý Nhân → chân núi Quảng Oai */}
          <InkPath
            d="M992,928 C930,850 850,720 800,610 C788,578 782,560 778,542"
            startFrac={fp(fLy, 25)}
            endFrac={fp(fLy, 95)}
            stroke={C.teal}
            strokeWidth={5}
          />
          {/* chân núi Quảng Oai */}
          <path d="M748,545 L778,505 L808,545 Z" fill="none" stroke={C.cream} strokeWidth={2.5} />
        </svg>

        {/* xuất phát: Lý Nhân */}
        <SpringPop startFrac={fLy}>
          <div
            style={{
              position: "absolute",
              left: 978,
              top: 928,
              width: 16,
              height: 16,
              borderRadius: 999,
              background: C.teal,
              boxShadow: `0 0 0 8px rgba(40,120,120,0.25)`,
            }}
          />
        </SpringPop>
        <Reveal startFrac={fLy} dy={10}>
          <div
            style={{
              position: "absolute",
              left: 1010,
              top: 918,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 2,
              color: C.teal,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            LÝ NHÂN
            <div style={{ fontSize: 22, fontWeight: 400, color: C.mute }}>xuất phát · ven sông, phía nam</div>
          </div>
        </Reveal>

        {/* nhãn Quảng Oai + chú thích bắt buộc ngay lần đầu */}
        <SpringPop startFrac={fQO} from={0.9}>
          <div
            style={{
              position: "absolute",
              left: 620,
              top: 415,
              padding: "10px 22px",
              background: "rgba(20,17,13,0.78)",
              border: `1.5px solid ${C.cream}`,
              borderRadius: 8,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 3,
              color: C.cream,
            }}
          >
            QUẢNG OAI
          </div>
        </SpringPop>
        <Reveal startFrac={fTenCo} dy={12}>
          <div
            style={{
              position: "absolute",
              left: 560,
              top: 505,
              padding: "8px 18px",
              background: "rgba(20,17,13,0.7)",
              border: `1px solid ${C.amber}`,
              borderRadius: 8,
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 24,
              color: C.cream,
            }}
          >
            tên cổ của vùng Sơn Tây – Ba Vì hôm nay
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ---------------------------------------------------------------- sc036 (s15)
// Hai lớp tách – khớp: lớp cổ thư amber + lớp thủy văn teal đè khớp khi trí nhớ ngấm vào truyện kể.
export const Sc036: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur, p } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const fNgam = A("ngấm vào truyện kể");
  const fKet = A("bản đồ tri thức sống sót");

  const fT0 = fp(fNgam, -180); // bắt đầu tách khi narration nói nhu cầu sống sót
  const fT1 = fp(fNgam, -40);
  const sep = ease(p(fT0, fT1));
  const snap = ease(p(fNgam, fp(fNgam, 55)));
  const k = frame < fNgam * dur ? sep : snap; // 0 = khớp, 1 = tách hết cỡ
  const offA = { x: -270 * k, y: -130 * k, rot: -4 * k };
  const offB = { x: 270 * k, y: 130 * k, rot: 3 * k };
  const labelDim = frame >= fNgam * dur ? 0.5 : 1;

  return (
    <Paper>
      <div style={FULL}>
        {/* khung bản đồ mờ */}
        <div
          style={{
            position: "absolute",
            left: 460,
            top: 160,
            width: 1000,
            height: 760,
            border: `1px solid ${C.border}`,
            opacity: 0.7,
          }}
        />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.22 }}>
          <path d="M520,420 C640,390 760,410 880,380 C1000,350 1120,380 1240,360" fill="none" stroke={C.cream} strokeWidth={2} />
          <path d="M540,620 C680,580 820,610 960,570 C1100,530 1240,560 1380,520" fill="none" stroke={C.cream} strokeWidth={2} />
          <path d="M560,840 C700,800 840,830 980,790 C1120,750 1260,780 1400,740" fill="none" stroke={C.cream} strokeWidth={2} />
        </svg>

        {/* hai lớp giấy trong suốt */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(960,540) rotate(${offA.rot}) translate(${offA.x},${offA.y}) translate(-960,-540)`}>
            <path
              d="M700,780 C760,700 830,620 900,560 C950,515 1010,490 1080,480"
              fill="none"
              stroke={C.amber}
              strokeWidth={4}
            />
            <path d={circleD(1080, 480, 7)} fill={C.amber} />
          </g>
          <g transform={`translate(960,540) rotate(${offB.rot}) translate(${offB.x},${offB.y}) translate(-960,-540)`}>
            <path
              d="M640,700 C760,660 900,640 1060,600 C1150,578 1240,570 1300,575 L1300,700 C1200,690 1100,700 1000,720 C880,742 760,750 640,760 Z"
              fill={C.teal}
              fillOpacity={0.18}
              stroke={C.teal}
              strokeWidth={2}
              strokeOpacity={0.6}
            />
          </g>
          {/* vòng khớp khi hai lớp đè lên nhau */}
          <InkPath d="M500,200 H1420 V880 H500 Z" startFrac={fNgam} endFrac={fp(fNgam, 40)} stroke={C.teal} strokeWidth={2} />
        </svg>

        {/* nhãn hai lớp (mờ đi khi đã khớp) */}
        <div style={{ position: "absolute", left: 90, top: 200, opacity: labelDim }}>
          <Reveal startFrac={fp(fT0, 60)} dy={10}>
            <Chip color={C.amber}>lớp cổ thư · đường hành quân</Chip>
          </Reveal>
        </div>
        <div style={{ position: "absolute", right: 90, bottom: 200, opacity: labelDim }}>
          <Reveal startFrac={fp(fT0, 80)} dy={10}>
            <Chip color={C.teal}>lớp thủy văn · dải mùa lũ</Chip>
          </Reveal>
        </div>

        {/* nhãn kết — hiện trọn khi cụm được đọc */}
        <Reveal startFrac={fKet} dy={14}>
          <div
            style={{
              position: "absolute",
              left: 180,
              right: 180,
              bottom: 78,
              textAlign: "center",
              padding: "20px 40px",
              background: "rgba(20,17,13,0.86)",
              border: `1px solid ${C.teal}`,
              borderRadius: 10,
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 34,
              color: C.cream,
            }}
          >
            đường hành quân của Thủy Tinh chính là bản đồ tri thức sống sót của cư dân châu thổ
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ---------------------------------------------------------------- sc042 (s18)
// Stat-card lũ 1945 — bốn cụm số CountUp theo nhịp, «Năm ấy, nước thắng.» rơi dry, gạch dưới vế sửa.
export const Sc042: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const fLuu = A("Lũ năm 1945");
  const f11 = A("11,45 mét");
  const f52 = A("52 chỗ đê vỡ");
  const f2tr = A("2 triệu người");

  const numStyle: React.CSSProperties = {
    fontFamily: FONT.display,
    fontWeight: 800,
    fontSize: 84,
    lineHeight: 1.1,
    color: C.white,
  };

  const cell = (f: number, node: React.ReactNode, label: string) => (
    <div style={{ textAlign: "center", padding: "26px 10px" }}>
      <Reveal startFrac={f} dy={12}>
        <div style={numStyle}>{node}</div>
        <div
          style={{
            marginTop: 10,
            fontFamily: FONT.body,
            fontSize: 27,
            letterSpacing: 2,
            color: "rgba(232,220,200,0.75)",
          }}
        >
          {label}
        </div>
      </Reveal>
    </div>
  );

  return (
    <Paper>
      <div style={FULL}>
        <div
          style={{
            position: "absolute",
            left: 520,
            top: 130,
            width: 880,
            height: 800,
            background: "rgba(8,38,42,0.94)",
            border: `2px solid ${C.teal}`,
            borderRadius: 14,
            boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
          }}
        >
          <Reveal startFrac={fLuu} dy={10}>
            <div
              style={{
                marginTop: 44,
                textAlign: "center",
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 58,
                letterSpacing: 6,
                color: C.teal,
              }}
            >
              LŨ 1945
            </div>
            <div
              style={{
                marginTop: 8,
                textAlign: "center",
                fontFamily: FONT.body,
                fontSize: 25,
                letterSpacing: 3,
                color: "rgba(232,220,200,0.65)",
              }}
            >
              MỰC NƯỚC HÀ NỘI
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginTop: 26 }}>
            {cell(
              f11,
              <CountUp to={11.45} startFrac={f11} endFrac={fp(f11, 40)} decimals={2} suffix=" m" />,
              "mực nước"
            )}
            {cell(f52, <CountUp to={52} startFrac={f52} endFrac={fp(f52, 35)} />, "chỗ đê vỡ")}
            {cell(
              fp(f52, 70),
              <CountUp to={11} startFrac={fp(f52, 70)} endFrac={fp(f52, 100)} />,
              "tỉnh chìm trong nước"
            )}
            {cell(
              f2tr,
              <CountUp to={2} startFrac={f2tr} endFrac={fp(f2tr, 30)} prefix="~" suffix=" triệu" />,
              "người chịu lụt"
            )}
          </div>

          <Reveal startFrac={fp(f2tr, 65)} dy={10}>
            <div
              style={{
                marginTop: 30,
                textAlign: "center",
                fontFamily: FONT.display,
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: 40,
                letterSpacing: 3,
                color: C.cream,
              }}
            >
              Năm ấy, nước thắng.
            </div>
          </Reveal>

          <Reveal startFrac={fp(f2tr, 150)} dy={8}>
            <div
              style={{
                marginTop: 22,
                textAlign: "center",
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 31,
                color: C.amber,
              }}
            >
              nhưng nước thắng — trong một năm
            </div>
          </Reveal>
        </div>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* gạch dưới mực vế sửa «trong một năm» */}
          <InkPath
            d="M850,818 q22,-12 44,0 t44,0 t44,0 t44,0 t44,0"
            startFrac={fp(f2tr, 170)}
            endFrac={fp(f2tr, 195)}
            stroke={C.amber}
            strokeWidth={3}
          />
        </svg>

        <SourceTag text="lũ 1945 · mực nước Hà Nội · 11 tỉnh · ~2 triệu người" bottom={56} right />
      </div>
    </Paper>
  );
};

// ---------------------------------------------------------------- sc048 (s21)
// Thủy Tinh quay lại — KB zoom_in đỉnh sóng → gương mặt + vòng năm quay chậm dần, Ba Vì đứng yên.
export const Sc048: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur, p } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const fQ = A("vì sao Thủy Tinh vẫn quay lại");
  const fLui = A("tạm lùi về biển");
  const fLen = A("lại lên theo mùa");

  // vòng năm quay chậm dần về cuối section
  const f1 = Math.min(1, frame / Math.max(1, dur - 1));
  const deg = (140 * Math.log(1 + 3 * f1)) / Math.log(4);
  // cung nước phía đông: rút khi «tạm lùi về biển», dâng khi «lại lên theo mùa»
  const recede = ease(p(fp(fLui, -30), fLui));
  const rise = ease(p(fLen, fp(fLen, 35)));
  const arcOp = Math.max(0.05, Math.min(1, 0.55 - 0.4 * recede + 0.85 * rise));

  return (
    <InkImageScene src={plateSrc("img-02-thuy-tinh.png")} focus={{ x: 0.5, y: 0.38 }}>
      <div style={FULL}>
        <Reveal startFrac={fQ} dy={12}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 96,
              textAlign: "center",
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 54,
              color: C.cream,
              textShadow: "0 4px 24px rgba(0,0,0,0.7)",
            }}
          >
            vì sao Thủy Tinh vẫn quay lại?
          </div>
        </Reveal>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* vòng năm quay chậm dần */}
          <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: "960px 560px" }}>
            <circle
              cx={960}
              cy={560}
              r={300}
              fill="none"
              stroke={C.cream}
              strokeOpacity={0.45}
              strokeWidth={2}
              strokeDasharray="3 9"
            />
          </g>
          {/* cung nước phía đông — rút về biển rồi lại lên theo mùa */}
          <path
            d="M1189,367 A300,300 0 0 1 1189,753"
            fill="none"
            stroke={C.teal}
            strokeWidth={6}
            opacity={arcOp}
            strokeLinecap="round"
          />
          {/* Ba Vì ba đỉnh — bất động tuyệt đối */}
          <InkPath d="M848,712 L880,658 L912,712" startFrac={fp(fQ, 80)} endFrac={fp(fQ, 104)} stroke={C.cream} strokeWidth={3} />
          <InkPath d="M928,700 L960,648 L992,700" startFrac={fp(fQ, 92)} endFrac={fp(fQ, 116)} stroke={C.cream} strokeWidth={3} />
          <InkPath d="M1008,716 L1045,664 L1082,716" startFrac={fp(fQ, 104)} endFrac={fp(fQ, 128)} stroke={C.cream} strokeWidth={3} />
        </svg>

        <Reveal startFrac={fp(fQ, 130)} dy={8}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 748,
              textAlign: "center",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 25,
              letterSpacing: 4,
              color: C.cream,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            BA VÌ
          </div>
        </Reveal>
        <Reveal startFrac={fp(fLui, 10)} dy={8}>
          <div
            style={{
              position: "absolute",
              left: 1270,
              top: 790,
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 27,
              color: C.teal,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            tạm lùi về biển
          </div>
        </Reveal>
        <Reveal startFrac={fp(fLen, 10)} dy={8}>
          <div
            style={{
              position: "absolute",
              left: 1270,
              top: 330,
              fontFamily: FONT.body,
              fontStyle: "italic",
              fontSize: 27,
              color: C.teal,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            lại lên theo mùa
          </div>
        </Reveal>
      </div>
    </InkImageScene>
  );
};

// ---------------------------------------------------------------- sc054 (s24)
// Cụm đền Ba Vì ba tầng — KB tilt_up, hai nhãn hai đầu trục nước–mây, tông Landing ấm amber.
export const Sc054: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const f3tang = A("ba tầng theo độ cao");
  const fThuong = A("Đền Thượng");
  const f1227 = A("1.227 mét");
  const fHa = A("Đền Hạ");

  const labelStyle: React.CSSProperties = {
    padding: "10px 24px",
    background: "rgba(20,17,13,0.74)",
    border: `1.5px solid ${C.amber}`,
    borderRadius: 8,
    fontFamily: FONT.body,
    fontWeight: 700,
    fontSize: 30,
    letterSpacing: 2,
    color: C.cream,
    whiteSpace: "nowrap",
  };

  return (
    <InkImageScene src={plateSrc("img-12-den-ba-vi.png")} focus={{ x: 0.5, y: 0.58 }}>
      <div style={FULL}>
        {/* tông Landing ấm amber */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: C.amber,
            opacity: 0.08,
            pointerEvents: "none",
          }}
        />

        <Reveal startFrac={f3tang} dy={10}>
          <div style={{ position: "absolute", left: 90, top: 88 }}>
            <Chip color={C.amber}>cụm đền Tản Viên · ba tầng theo độ cao</Chip>
          </div>
        </Reveal>

        {/* đỉnh trục: Đền Thượng */}
        <SpringPop startFrac={fThuong}>
          <div
            style={{
              position: "absolute",
              left: 968,
              top: 322,
              width: 18,
              height: 18,
              borderRadius: 999,
              background: C.amber,
              boxShadow: `0 0 0 8px rgba(232,180,90,0.25)`,
            }}
          />
        </SpringPop>
        <SpringPop startFrac={f1227} from={0.9}>
          <div style={{ position: "absolute", left: 1150, top: 170, ...labelStyle }}>
            Đền Thượng · 1.227 m
          </div>
        </SpringPop>
        <Reveal startFrac={fp(f1227, 12)} dy={6}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <path d="M1150,242 L995,330" stroke={C.amber} strokeWidth={2} />
          </svg>
        </Reveal>

        {/* chân trục: Đền Hạ */}
        <SpringPop startFrac={fHa} from={0.9}>
          <div style={{ position: "absolute", left: 400, top: 852, ...labelStyle }}>
            Đền Hạ · sát sông Đà
          </div>
        </SpringPop>
        <Reveal startFrac={fp(fHa, 12)} dy={6}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <path d="M640,880 L760,952" stroke={C.amber} strokeWidth={2} />
          </svg>
        </Reveal>

        {/* trục nước – mây nối hai đầu */}
        <Reveal startFrac={fp(fHa, 25)} dy={0}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <path
              d="M1012,905 C1004,760 1000,600 996,262"
              stroke={C.amber}
              strokeWidth={1.5}
              strokeDasharray="4 12"
              opacity={0.65}
              fill="none"
            />
          </svg>
        </Reveal>
      </div>
    </InkImageScene>
  );
};

// ---------------------------------------------------------------- sc060 (s27)
// Tease S2E02 — silhouette đứa trẻ chưa từng nói một lời + chớp sấm mờ xa + dòng tease.
export const Sc060: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur, p } = useFrac();
  const fp = (f: number, fr: number) => Math.max(0.01, Math.min(0.97, (f * dur + fr) / dur));
  const fTre = A("một đứa trẻ");
  const fChua = A("chưa từng nói một lời");
  const fSam = A("thiếu một tiếng sấm");

  // chớp sấm mờ xa: sáng lên rồi tắt
  const flashUp = ease(p(fSam, fp(fSam, 6)));
  const flashDown = ease(p(fp(fSam, 6), fp(fSam, 22)));
  const flash = 0.22 * flashUp * (1 - flashDown);
  // độ đặc của bóng đen sau khi nét vẽ xong
  const fillOp = 0.92 * ease(p(fp(fTre, 80), fp(fTre, 105)));

  return (
    <Paper>
      <div style={FULL}>
        {/* đồng sẫm giông */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(8,10,16,0.30) 0%, rgba(8,10,16,0.52) 58%, rgba(8,10,16,0.66) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: C.cream,
            opacity: flash,
            pointerEvents: "none",
          }}
        />

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* đường chân trời phía đồng */}
          <path d="M120,742 H1800" stroke={C.mute} strokeWidth={1.5} opacity={0.6} />
          {/* bậc cửa làng */}
          <InkPath d="M250,880 L560,880 M272,880 L272,840 L538,840" startFrac={fTre} endFrac={fp(fTre, 22)} stroke={C.cream} strokeWidth={3} />
          {/* silhouette đứa trẻ ngồi lặng — không mặt, không tên */}
          <InkPath d={circleD(352, 762, 21)} startFrac={fp(fTre, 10)} endFrac={fp(fTre, 35)} stroke={C.cream} strokeWidth={3} />
          <InkPath
            d="M352,783 C322,790 310,818 314,852 L314,876 L406,876 L402,846 C398,814 382,792 366,784"
            startFrac={fp(fTre, 25)}
            endFrac={fp(fTre, 95)}
            stroke={C.cream}
            strokeWidth={3}
          />
          <g opacity={fillOp}>
            <circle cx={352} cy={762} r={20} fill="#060504" />
            <path
              d="M352,783 C322,790 310,818 314,852 L314,876 L406,876 L402,846 C398,814 382,792 366,784 Z"
              fill="#060504"
            />
          </g>
          {/* chớp sấm mờ xa chân trời — chỉ ánh, không chữ */}
          <InkPath
            d="M1520,560 L1472,648 L1506,640 L1452,742"
            startFrac={fSam}
            endFrac={fp(fSam, 7)}
            stroke={C.cream}
            strokeWidth={4}
          />
        </svg>

        <Reveal startFrac={fChua} dy={14}>
          <div
            style={{
              position: "absolute",
              left: 180,
              right: 180,
              bottom: 92,
              textAlign: "center",
              padding: "22px 40px",
              background: "rgba(20,17,13,0.78)",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 40,
              color: C.cream,
            }}
          >
            tập sau — người cứu nước tiếp theo là một đứa trẻ chưa từng nói một lời
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};
