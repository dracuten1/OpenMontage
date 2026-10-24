// S2E01 vn-myth — scenes group "e" (sc005–sc059), composed per spec_e.json.
// Speech-lock: A(word, occ) trả về FRACTION của scene — nạp thẳng vào startFrac.
import * as React from "react";
import { AbsoluteFill, Img } from "remotion";
import {
  Paper,
  Reveal,
  SpringPop,
  InkPath,
  InkDraw,
  circleD,
  Chip,
  plateSrc,
  InkImageScene,
  useA,
  useFrac,
  ease,
} from "./common";
import { C, FONT } from "./theme";
import { SceneProps } from "./theme";

const svgLayer: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  overflow: "visible",
};

// sc005 (s02) — MONTAGE: cuộc chạy đua (mực vẽ) + callback silhouette đền Hùng (f07).
export const Sc005: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const DUR = 720;
  const f = (n: number) => n / DUR;
  const ndd = A("Nước dâng đến đâu");
  const dH = A("đền Hùng");
  const raceOp = 1 - ease(p(dH - f(18), dH + f(14)));
  const silIn = ease(p(dH - f(14), dH + f(18)));
  const breath = 0.9 + 0.1 * Math.sin(frame / 26);
  const waterD = ["M190,980 L640,706", "M260,932 L716,646", "M330,884 L792,586"];
  const mtnD = ["M1730,980 L1280,706", "M1660,932 L1204,646", "M1590,884 L1128,586"];
  return (
    <Paper>
      {/* nửa đầu — cuộc chạy đua vẽ bằng mực: nước dâng chéo ↔ núi nâng đối xứng */}
      <AbsoluteFill style={{ opacity: raceOp }}>
        <InkDraw
          d="M60,1004 L1860,1004"
          startFrac={f(6)}
          endFrac={f(26)}
          style={svgLayer}
          stroke={C.mute}
          strokeWidth={5}
        />
        {waterD.map((d, i) => (
          <InkDraw
            key={"w" + i}
            d={d}
            startFrac={ndd - f(66) + f(30) * i}
            endFrac={ndd - f(66) + f(30) * i + f(26)}
            style={svgLayer}
            stroke={C.teal}
            strokeWidth={17 - i * 2}
          />
        ))}
        {mtnD.map((d, i) => (
          <InkDraw
            key={"m" + i}
            d={d}
            startFrac={ndd + f(15) + f(30) * i}
            endFrac={ndd + f(15) + f(30) * i + f(26)}
            style={svgLayer}
            stroke={C.amber}
            strokeWidth={17 - i * 2}
          />
        ))}
        <div style={{ position: "absolute", left: 300, top: 396, width: 1320, textAlign: "center" }}>
          <Reveal startFrac={ndd + f(120)} endFrac={ndd + f(145)}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.amber }}>
              Thần núi thắng.
            </div>
          </Reveal>
        </div>
        <div style={{ position: "absolute", left: 300, top: 468, width: 1320, textAlign: "center" }}>
          <Reveal startFrac={ndd + f(150)} endFrac={ndd + f(175)}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.teal }}>
              Thần nước rút lui.
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      {/* nửa sau — silhouette đền Hùng (callback S1 duy nhất, opacity thấp, "thở") */}
      <AbsoluteFill style={{ opacity: silIn * breath * 0.62 }}>
        <InkImageScene src={plateSrc("f07-hung-vuong.png")} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 210, top: 928, width: 1500, textAlign: "center" }}>
        <Reveal startFrac={dH + f(160)} endFrac={dH + f(195)}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, opacity: 0.92 }}>
            «trận đánh ấy, đến giờ vẫn chưa xong»
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc011 (s04) — MỘT CÂU HỎI: "Bốn lớp, một câu hỏi" + "ai đang thắng?" hold lặng.
export const Sc011: React.FC<SceneProps> = () => {
  const A = useA();
  const tBon = A("Bốn lớp", 2);
  const tAi = A("ai đang thắng");
  return (
    <Paper variant="museum">
      <div style={{ position: "absolute", left: 160, top: 402, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={tBon} endFrac={tBon + 0.05}>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: 8,
              color: C.mute,
              textTransform: "uppercase",
            }}
          >
            Bốn lớp — một câu hỏi
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 520, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={tAi - 0.16} endFrac={tAi - 0.05}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 78,
              color: C.cream,
              lineHeight: 1.2,
            }}
          >
            chuyện này, đến cùng,
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 636, width: 1600, textAlign: "center" }}>
        <SpringPop startFrac={tAi} from={0.75}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 92, color: C.amber }}>
            ai đang thắng?
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};

// sc017 (s06) — QUOTE-CARD ETIOLOGY: quote "hàng năm" + ba câu chốt rơi, nền tối dần.
export const Sc017: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const DUR = 259;
  const f = (n: number) => n / DUR;
  const hn1 = A("hàng năm", 1);
  const hn2 = A("hàng năm", 2);
  const mo = A("mở mãi");
  const dark = 0.3 + 0.42 * ease(p(0, 1));
  const hot = ease(p(hn2, hn2 + f(8)));
  const fallLine: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: 34,
    color: C.cream,
    opacity: 0.85,
    lineHeight: 1.7,
  };
  return (
    <Paper>
      <AbsoluteFill style={{ background: "rgba(8,6,4," + dark + ")", pointerEvents: "none" }} />
      {/* quote chiếm nửa trên — từng vế sáng theo nhịp */}
      <div style={{ position: "absolute", left: 210, top: 150, width: 1500, textAlign: "center" }}>
        <Reveal startFrac={hn1 - f(55)} endFrac={hn1 - f(30)}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 44, color: C.cream, lineHeight: 1.5 }}>
            «cứ đến tháng 7, tháng 8 âm lịch
          </div>
        </Reveal>
        <Reveal startFrac={hn1} endFrac={hn1 + f(20)}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 44, color: C.cream, lineHeight: 1.5 }}>
            <span
              style={{
                color: hot > 0.5 ? C.amber : C.cream,
                fontWeight: hot > 0.5 ? 700 : 500,
              }}
            >
              hàng năm
            </span>{" "}
            là Thủy Tinh lại nổi giận
          </div>
        </Reveal>
        <Reveal startFrac={hn1 + f(28)} endFrac={hn1 + f(48)}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 44, color: C.cream, lineHeight: 1.5 }}>
            dâng nước lụt đánh Sơn Tinh»
          </div>
        </Reveal>
        <Reveal startFrac={hn1 + f(60)} endFrac={hn1 + f(80)}>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.mute, marginTop: 18 }}>
            — sách chép
          </div>
        </Reveal>
      </div>
      {/* ba câu chốt rơi lệch từng dòng */}
      <div style={{ position: "absolute", left: 240, top: 646, width: 1440 }}>
        <Reveal startFrac={mo - f(60)} endFrac={mo - f(40)}>
          <div style={fallLine}>người chép không cho trận đánh một hồi kết</div>
        </Reveal>
        <Reveal startFrac={mo - f(30)} endFrac={mo - f(14)}>
          <div style={{ ...fallLine, paddingLeft: 90 }}>họ để nó mở</div>
        </Reveal>
        <Reveal startFrac={mo} endFrac={mo + f(18)}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 42,
              color: C.amber,
              paddingLeft: 180,
              marginTop: 8,
            }}
          >
            Và mở mãi
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc023 (s08) — LƯỚI SẮT TỪ LIÊM (InkPath) + bảng so sánh hai trận đánh hai cột.
export const Sc023: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const DUR = 229;
  const f = (n: number) => n / DUR;
  const ls = A("lưới sắt");
  const tl = A("Từ Liêm");
  const tTab = tl + f(64);
  const op1 = 1 - ease(p(tTab - f(8), tTab + f(22)));
  const op2 = ease(p(tTab - f(3), tTab + f(27)));
  const row: React.CSSProperties = {
    fontFamily: FONT.body,
    fontWeight: 500,
    fontSize: 40,
    color: C.cream,
  };
  return (
    <Paper>
      {/* nửa đầu — lưới sắt chắn ngang dòng thượng nguồn */}
      <AbsoluteFill style={{ opacity: op1 }}>
        <svg viewBox="0 0 1920 1080" style={svgLayer}>
          <InkPath
            d="M140,560 C480,528 820,572 1150,546"
            startFrac={ls - f(24)}
            endFrac={ls - f(2)}
            stroke={C.teal}
            strokeWidth={11}
          />
          <InkPath
            d="M140,606 C480,574 820,618 1150,592"
            startFrac={ls - f(18)}
            endFrac={ls + f(4)}
            stroke={C.teal}
            strokeWidth={11}
          />
          <InkPath
            d="M420,556 L1098,550"
            startFrac={ls - f(8)}
            endFrac={ls + f(8)}
            stroke={C.teal}
            strokeWidth={6}
          />
          <InkPath
            d="M400,600 L1094,596"
            startFrac={ls - f(2)}
            endFrac={ls + f(14)}
            stroke={C.teal}
            strokeWidth={6}
          />
          {[1146, 1172, 1198].map((x, i) => (
            <InkPath
              key={"v" + x}
              d={"M" + x + ",452 L" + x + ",690"}
              startFrac={ls + f(i * 5)}
              endFrac={ls + f(i * 5 + 13)}
              stroke={C.cream}
              strokeWidth={5}
            />
          ))}
          {[500, 560, 620].map((y, i) => (
            <InkPath
              key={"h" + y}
              d={"M1136," + y + " L1210," + y}
              startFrac={ls + f(16 + i * 5)}
              endFrac={ls + f(26 + i * 5)}
              stroke={C.cream}
              strokeWidth={5}
            />
          ))}
        </svg>
        <div style={{ position: "absolute", left: 1010, top: 388, width: 420, textAlign: "center" }}>
          <SpringPop startFrac={tl} from={0.7}>
            <Chip
              color={C.amber}
              style={{ background: C.amber, color: "#1A1714", borderColor: C.amber, fontWeight: 700 }}
            >
              Từ Liêm
            </Chip>
          </SpringPop>
        </div>
        <div style={{ position: "absolute", left: 140, top: 700, width: 700 }}>
          <Reveal startFrac={ls + f(42)} endFrac={ls + f(62)}>
            <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.mute }}>
              chắn ngang thượng nguồn
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      {/* nửa sau — bảng hai cột đối xứng */}
      <AbsoluteFill style={{ opacity: op2 }}>
        <div style={{ position: "absolute", left: 160, top: 108, width: 1600, textAlign: "center" }}>
          <Reveal startFrac={tTab + f(2)} endFrac={tTab + f(18)}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.white }}>
              Hai trang cổ thư — hai trận đánh
            </div>
          </Reveal>
        </div>
        <svg viewBox="0 0 1920 1080" style={svgLayer}>
          <InkPath
            d="M960,290 L960,600"
            startFrac={tTab + f(18)}
            endFrac={tTab + f(34)}
            stroke={C.border}
            strokeWidth={4}
          />
        </svg>
        <div style={{ position: "absolute", left: 260, top: 252, width: 600, textAlign: "center" }}>
          <SpringPop startFrac={tTab + f(14)} from={0.75}>
            <Chip color={C.amber}>bên này</Chip>
          </SpringPop>
        </div>
        <div style={{ position: "absolute", left: 1060, top: 252, width: 600, textAlign: "center" }}>
          <SpringPop startFrac={tTab + f(14)} from={0.75}>
            <Chip color={C.teal}>bên kia</Chip>
          </SpringPop>
        </div>
        <div style={{ position: "absolute", left: 260, top: 380, width: 600, textAlign: "center" }}>
          <Reveal startFrac={tTab + f(34)} endFrac={tTab + f(48)}>
            <div style={row}>sính lễ là câu đố</div>
          </Reveal>
        </div>
        <div style={{ position: "absolute", left: 1060, top: 380, width: 600, textAlign: "center" }}>
          <Reveal startFrac={tTab + f(48)} endFrac={tTab + f(62)}>
            <div style={row}>cuộc chạy đua</div>
          </Reveal>
        </div>
        <div style={{ position: "absolute", left: 260, top: 490, width: 600, textAlign: "center" }}>
          <Reveal startFrac={tTab + f(70)} endFrac={tTab + f(84)}>
            <div style={row}>thần đánh bằng phép</div>
          </Reveal>
        </div>
        <div style={{ position: "absolute", left: 1060, top: 490, width: 600, textAlign: "center" }}>
          <Reveal startFrac={tTab + f(84)} endFrac={tTab + f(98)}>
            <div style={row}>chống nước bằng công trình</div>
          </Reveal>
        </div>
      </AbsoluteFill>
    </Paper>
  );
};

// sc029 (s11) — MAP STAGE 2/6: cửa ngõ đóng, nước đi vòng tây nam + bảng "nguyên văn".
export const Sc029: React.FC<SceneProps> = () => {
  const A = useA();
  const DUR = 354;
  const f = (n: number) => n / DUR;
  const ml = A("mệnh lệnh hành quân");
  const nv = A("nguyên văn");
  return (
    <Paper>
      <AbsoluteFill>
        <Img
          src={plateSrc("img-08-ban-do.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(10,8,6,0.52)", pointerEvents: "none" }} />
      <svg viewBox="0 0 1920 1080" style={svgLayer}>
        {/* lưới sắt Từ Liêm sáng lên chắn thượng nguồn (góc bắc-đông) */}
        {[0, 1, 2].map((i) => (
          <InkPath
            key={"nv" + i}
            d={"M" + (1268 + i * 26) + ",296 L" + (1268 + i * 26) + ",452"}
            startFrac={f(10 + i * 4)}
            endFrac={f(22 + i * 4)}
            stroke={C.amber}
            strokeWidth={5}
          />
        ))}
        {[0, 1].map((i) => (
          <InkPath
            key={"nh" + i}
            d={"M1256," + (340 + i * 56) + " L1352," + (340 + i * 56)}
            startFrac={f(22 + i * 4)}
            endFrac={f(32 + i * 4)}
            stroke={C.amber}
            strokeWidth={5}
          />
        ))}
        {/* mũi tên nước tới bị đẩy bật rồi lượn về tây nam */}
        <InkPath d="M820,236 L1262,368" startFrac={f(58)} endFrac={f(84)} stroke={C.teal} strokeWidth={10} />
        <InkPath d="M1262,368 L1234,354" startFrac={f(84)} endFrac={f(92)} stroke={C.teal} strokeWidth={9} />
        <InkPath d="M1262,368 L1246,342" startFrac={f(88)} endFrac={f(96)} stroke={C.teal} strokeWidth={9} />
        <InkPath
          d="M1336,398 C1478,540 1170,776 664,858"
          startFrac={f(100)}
          endFrac={f(156)}
          stroke={C.teal}
          strokeWidth={10}
        />
        <InkPath d="M664,858 L694,844" startFrac={f(158)} endFrac={f(166)} stroke={C.teal} strokeWidth={9} />
        <InkPath d="M664,858 L696,872" startFrac={f(162)} endFrac={f(170)} stroke={C.teal} strokeWidth={9} />
      </svg>
      <div style={{ position: "absolute", left: 1150, top: 220, width: 320, textAlign: "center" }}>
        <SpringPop startFrac={f(18)} from={0.7}>
          <Chip
            color={C.amber}
            style={{ background: C.amber, color: "#1A1714", borderColor: C.amber, fontWeight: 700 }}
          >
            Từ Liêm
          </Chip>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 250, top: 888, width: 640 }}>
        <Reveal startFrac={f(132)} endFrac={f(152)}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, opacity: 0.85 }}>
            nhánh sông phía tây nam châu thổ
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 560, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={ml} endFrac={ml + f(20)}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, opacity: 0.92 }}>
            câu văn của chính sử — nghe như một mệnh lệnh hành quân
          </div>
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 948,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Reveal startFrac={nv} endFrac={nv + f(16)}>
          <div
            style={{
              border: "2px solid " + C.cream,
              background: "rgba(20,17,13,0.82)",
              padding: "12px 40px",
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 34,
              color: C.cream,
            }}
          >
            Sách chép nguyên văn như sau
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc035 (s14) — MAP STAGE 6/6: thước ba mốc báo động Long Biên + hai lớp blink + chốt.
export const Sc035: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const DUR = 659;
  const f = (n: number) => n / DUR;
  const lb = A("Long Biên");
  const m95 = A("9,5 mét");
  const m115 = A("11,5 mét");
  const m105 = m115 - f(38);
  const kl = A("chưa phải lời giải");
  const kbF = (m115 + f(120)) * DUR;
  const panelIn = ease(p(lb - f(8), lb + f(12)));
  const water = 70 + 240 * ease(p(m95, 0.965));
  const blink = frame < kbF ? 0 : 0.55 + 0.45 * Math.abs(Math.sin((frame - kbF) / 9));
  const tickLabel: React.CSSProperties = {
    fontFamily: FONT.display,
    fontWeight: 700,
    fontSize: 30,
    color: C.amber,
  };
  return (
    <Paper>
      <AbsoluteFill>
        <Img
          src={plateSrc("img-08-ban-do.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(10,8,6,0.55)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 130, top: 126 }}>
        <SpringPop startFrac={f(35)} from={0.75}>
          <Chip color={C.teal}>mùa lũ: tháng 6 → tháng 10 · đỉnh: tháng 8</Chip>
        </SpringPop>
      </div>
      {/* thước mực nước bên phải khung */}
      <div
        style={{
          position: "absolute",
          left: 1460,
          top: 200,
          width: 360,
          textAlign: "center",
          opacity: panelIn,
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 36, color: C.white }}>
          ba mốc báo động
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 6 }}>
          trạm Long Biên — Hà Nội
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1512,
          top: 292,
          width: 248,
          height: 628,
          border: "3px solid " + C.cream,
          borderRadius: 10,
          overflow: "hidden",
          opacity: panelIn,
          transform: "translateY(" + (1 - panelIn) * 24 + "px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: water,
            background: C.teal,
            opacity: 0.32,
          }}
        />
      </div>
      <svg viewBox="0 0 1920 1080" style={svgLayer}>
        <InkPath d="M1502,700 L1770,700" startFrac={m95} endFrac={m95 + f(8)} stroke={C.amber} strokeWidth={5} />
        <InkPath d="M1502,580 L1770,580" startFrac={m105} endFrac={m105 + f(8)} stroke={C.amber} strokeWidth={5} />
        <InkPath d="M1502,460 L1770,460" startFrac={m115} endFrac={m115 + f(8)} stroke={C.amber} strokeWidth={5} />
      </svg>
      <div style={{ position: "absolute", left: 1530, top: 652 }}>
        <SpringPop startFrac={m95} from={0.7}>
          <div style={tickLabel}>9,5 m</div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 1530, top: 532 }}>
        <SpringPop startFrac={m105} from={0.7}>
          <div style={tickLabel}>10,5 m</div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 1530, top: 412 }}>
        <SpringPop startFrac={m115} from={0.7}>
          <div style={tickLabel}>11,5 m</div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 1400, top: 940, width: 440, textAlign: "center" }}>
        <Reveal startFrac={m115 + f(45)} endFrac={m115 + f(65)}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, opacity: 0.85 }}>
            cả một thành phố nhìn lên nó
          </div>
        </Reveal>
      </div>
      {/* hai lớp nhấp sáng khớp nhau */}
      <div
        style={{
          position: "absolute",
          left: 130,
          top: 898,
          display: "flex",
          gap: 18,
          opacity: blink,
        }}
      >
        <Chip color={C.amber}>địa danh năm xưa</Chip>
        <Chip color={C.teal}>số liệu hôm nay</Chip>
      </div>
      <div style={{ position: "absolute", left: 210, top: 796, width: 1030, textAlign: "center" }}>
        <Reveal startFrac={kl} endFrac={kl + f(22)}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.white }}>
            Kỳ lạ, nhưng chưa phải lời giải
          </div>
        </Reveal>
        <Reveal startFrac={kl + f(90)} endFrac={kl + f(115)}>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute, marginTop: 12 }}>
            người chép truyện thuộc lòng con nước của sông nhà mình
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc041 (s17) — QUAN NƯỚC: Hà Đê chánh phó sứ + hàng chip quan, chip "quan nước" sáng.
export const Sc041: React.FC<SceneProps> = () => {
  const A = useA();
  const DUR = 432;
  const f = (n: number) => n / DUR;
  const hd = A("Hà Đê chánh phó sứ");
  const qn = A("quan nước");
  return (
    <Paper>
      <div style={{ position: "absolute", left: 160, top: 168, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={hd - f(30)} endFrac={hd - f(12)}>
          <div
            style={{
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 6,
              color: C.mute,
              textTransform: "uppercase",
            }}
          >
            triều đình đặt chức
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 252, width: 1600, textAlign: "center" }}>
        <SpringPop startFrac={hd} from={0.82}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.white }}>
            Hà Đê chánh phó sứ
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 160, top: 388, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={hd + f(24)} endFrac={hd + f(44)}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.mute }}>— quan trông đê —</div>
        </Reveal>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 560,
          display: "flex",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <SpringPop startFrac={hd + f(116)} from={0.7}>
          <Chip>quan thuế</Chip>
        </SpringPop>
        <SpringPop startFrac={hd + f(133)} from={0.7}>
          <Chip>quan binh</Chip>
        </SpringPop>
        <SpringPop startFrac={hd + f(150)} from={0.7}>
          <Chip>quan hình</Chip>
        </SpringPop>
        <SpringPop startFrac={qn} from={0.6}>
          <Chip
            color={C.amber}
            style={{ background: C.amber, color: "#1A1714", borderColor: C.amber, fontWeight: 700 }}
          >
            quan nước
          </Chip>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 160, top: 726, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={qn + f(55)} endFrac={qn + f(75)}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream }}>
            một cơ quan kế thừa công việc của thần núi
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 806, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={qn + f(135)} endFrac={qn + f(155)}>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute }}>
            một đoạn đê mở màn · một chức quan nối tiếp
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc047 (s20) — ĐỔI CHỦ THỂ: dòng chính + hai câu đối lệch nhịp + khép dry.
export const Sc047: React.FC<SceneProps> = () => {
  const A = useA();
  const DUR = 443;
  const f = (n: number) => n / DUR;
  const dc = A("đổi chủ thể");
  const nc = A("người cùng sống với nước");
  // d-012B: câu kết «hai lớp của một trang giấy» kế thừa TỪ sc046 — nhịp đọc thật 707.757s, giữ tới hết câu.
  const aHai = A("hai lớp của một trang giấy");
  return (
    <Paper>
      <div style={{ position: "absolute", left: 160, top: 360, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={dc - f(26)} endFrac={dc - f(6)}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.cream, lineHeight: 1.35 }}>
            cùng một công việc — đổi chủ thể,{" "}
            <span style={{ color: C.amber }}>từ thần</span>{" "}
            <span style={{ color: C.mute }}>sang</span>{" "}
            <span style={{ color: C.teal }}>người</span>
          </div>
        </Reveal>
      </div>
      <InkDraw
        d="M700,520 L1220,520"
        startFrac={dc + f(18)}
        endFrac={dc + f(32)}
        style={svgLayer}
        stroke={C.border}
        strokeWidth={3}
      />
      <div style={{ position: "absolute", left: 300, top: 580, width: 1000 }}>
        <Reveal startFrac={nc - f(60)} endFrac={nc - f(40)}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 42, color: C.cream, opacity: 0.92 }}>
            Chuyện kể bảo rằng <span style={{ color: C.amber }}>thần thắng nước</span>.
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", right: 300, top: 668, width: 1080, textAlign: "right" }}>
        <Reveal startFrac={nc} endFrac={nc + f(20)}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 42, color: C.cream, opacity: 0.92 }}>
            Sách sử ghi lại rằng <span style={{ color: C.teal }}>người cùng sống với nước</span>.
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 816, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={nc + f(110)} endFrac={nc + f(130)}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.mute }}>
            Hai câu ấy không trái nhau.
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 884, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={aHai}>
          <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.amber }}>
            «Chúng là hai lớp của một trang giấy.»
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc053 (s23) — HAI VÒNG, MỘT CÔNG VIỆC: bản đồ mờ dần để lại hai nét sáng + hai vòng khép.
export const Sc053: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const DUR = 387;
  const f = (n: number) => n / DUR;
  const mv = A("Một công việc", 2);
  const dm = A("Đều đặn như mùa");
  const km = A("kể mãi không hết");
  const mapOp = 0.34 - 0.28 * ease(p(0, f(150)));
  const mvF = mv * DUR;
  const spin = Math.max(0, (frame - mvF) * 1.4);
  const close = 96 - 66 * ease(p(mv, mv + f(30)));
  return (
    <Paper>
      <AbsoluteFill style={{ opacity: mapOp }}>
        <Img
          src={plateSrc("img-08-ban-do.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(10,8,6,0.4)", pointerEvents: "none" }} />
      <svg viewBox="0 0 1920 1080" style={svgLayer}>
        {/* hai nét sáng còn lại: đường đê (amber) + ba vạch thước nước (teal) */}
        <InkPath
          d="M170,770 C620,706 1180,566 1750,426"
          startFrac={f(12)}
          endFrac={f(52)}
          stroke={C.amber}
          strokeWidth={7}
        />
        {[0, 1, 2].map((i) => (
          <InkPath
            key={"t" + i}
            d={
              "M" + (1436 + i * 22) + "," + (846 + i * 34) + " L" + (1512 + i * 22) + "," + (846 + i * 34)
            }
            startFrac={f(40 + i * 10)}
            endFrac={f(50 + i * 10)}
            stroke={C.teal}
            strokeWidth={7}
          />
        ))}
        {/* hai vòng tròn xoay khép nhau */}
        <g transform={"rotate(" + spin + " 960 520)"}>
          <g transform={"translate(" + -close + " 0)"}>
            <InkPath
              d={circleD(960, 520, 116)}
              startFrac={mv}
              endFrac={mv + f(34)}
              stroke={C.amber}
              strokeWidth={6}
            />
          </g>
          <g transform={"translate(" + close + " 0)"}>
            <InkPath
              d={circleD(960, 520, 116)}
              startFrac={dm}
              endFrac={dm + f(34)}
              stroke={C.teal}
              strokeWidth={6}
            />
          </g>
        </g>
      </svg>
      {/* hai vế vòng mờ quanh hai vòng tròn */}
      <div style={{ position: "absolute", left: 170, top: 300, width: 640, textAlign: "right" }}>
        <Reveal startFrac={dm + f(100)} endFrac={dm + f(120)}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.amber, opacity: 0.85 }}>
            truyện kể — kết thúc mỗi năm bằng một trận thắng
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 1110, top: 700, width: 640 }}>
        <Reveal startFrac={dm + f(130)} endFrac={dm + f(150)}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.teal, opacity: 0.85 }}>
            đời thật — kết thúc mỗi mùa bằng một mùa lụt lại qua
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 160, top: 872, width: 1600, textAlign: "center" }}>
        <Reveal startFrac={km} endFrac={km + f(20)}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 60, color: C.white }}>
            kể mãi không hết
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc059 (s26) — CÂU KHÉP NGUYÊN VĂN: hold + dòng cuối rơi trầm + fade-to-dark.
export const Sc059: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const DUR = 370;
  const f = (n: number) => n / DUR;
  // d-012B: hai dòng «không bao giờ…» đã chuyển sang sc058 (881.0s/883.6s); sc059 mở bằng câu
  // khép cuối đúng nhịp thực 899.644s+; fade-to-black giữ nguyên, chỉ sau hết câu 903.430s.
  const qk = A("quá khứ không nằm phía sau lưng");
  const nc = A("Nó nằm ngay dưới chân");
  const t3 = A("trong từng mùa nước lên");
  const veilOp = 0.18 + 0.2 * ease(p(0, 1));
  const shut = 0.6 * ease(p(f(260), f(358)));
  return (
    <Paper>
      <AbsoluteFill style={{ background: "rgba(8,6,4," + veilOp + ")", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 260, top: 716, width: 1400, textAlign: "center" }}>
        <Reveal startFrac={qk} endFrac={t3 - f(20)}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, opacity: 0.82 }}>
            quá khứ không nằm phía sau lưng.
          </div>
        </Reveal>
        <Reveal startFrac={nc}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.mute, marginTop: 14 }}>
            Nó nằm ngay dưới chân, <span style={{ color: C.amber }}>trong từng mùa nước lên</span>.
          </div>
        </Reveal>
      </div>
      <AbsoluteFill
        style={{ background: "rgba(6,4,3,1)", opacity: shut, pointerEvents: "none" }}
      />
    </Paper>
  );
};
