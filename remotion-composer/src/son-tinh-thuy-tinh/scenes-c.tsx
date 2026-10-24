// S2E01 scenes group "c" — sc003 sc009 sc015 sc021 sc027 sc033 sc039 sc045 sc051 sc057
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
  SceneTitle,
  plateSrc,
  InkImageScene,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

/** sc003 (s02) — IMAGE PLATE: Mỵ Nương giữa hai vị thần cầu hôn. */
export const Sc003: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fMy = A("Mỵ Nương");
  const fCauHon = A("cầu hôn");
  const solid = { background: C.amber, color: "#1A1714", borderColor: C.amber, fontWeight: 700 };
  return (
    <Paper>
      <InkImageScene src={plateSrc("img-03-my-nuong.png")} focus={{ x: 0.5, y: 0.52 }}>
        <div style={{ position: "absolute", top: 70, left: 70 }}>
          <Reveal startFrac={0.02}>
            <Chip color={C.amber} style={solid}>
              TRUYỆN KỂ
            </Chip>
          </Reveal>
        </div>
        <Reveal startFrac={fMy} dy={16}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 110,
              textAlign: "center",
              textShadow: "0 2px 12px rgba(0,0,0,0.85)",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 68, color: C.white }}>
              Mỵ Nương
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 27, color: C.cream, marginTop: 10 }}>
              công chúa thời các vua Hùng
            </div>
          </div>
        </Reveal>
        <Reveal startFrac={Math.min(0.95, fCauHon + 55 / dur)} dy={12}>
          <div style={{ position: "absolute", left: 80, top: 300, width: 540 }}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: C.amber }}>
              SƠN TINH · THẦN NÚI
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.white, marginTop: 10 }}>
              «vung tay là núi non dời chuyển»
            </div>
          </div>
        </Reveal>
        <Reveal startFrac={Math.min(0.96, fCauHon + 165 / dur)} dy={12}>
          <div style={{ position: "absolute", right: 80, top: 300, width: 540, textAlign: "right" }}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: C.teal }}>
              THỦY TINH · THẦN NƯỚC
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.white, marginTop: 10 }}>
              «gọi mưa gió, sóng cuồn cuộn dâng»
            </div>
          </div>
        </Reveal>
      </InkImageScene>
    </Paper>
  );
};

/** sc009 (s04) — BỘ LUẬT ĐỌC: bốn dòng luật hiện theo số thứ tự. */
export const Sc009: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fMot = A("Một");
  const fBon = A("Bốn");
  const laws: Array<[string, string, number]> = [
    ["Một", "trích dẫn đóng khung sách chép", fMot],
    ["Hai", "sách chép không bằng nhân vật có thật", A("Hai")],
    ["Ba", "địa danh là bối cảnh, không phải bằng chứng", A("Ba")],
    ["Bốn", "con số có nguồn, đọc rõ bằng lời", fBon],
  ];
  const condense = Math.max(0, Math.min(1, (frame - (fBon + 230 / dur) * dur) / 26));
  return (
    <Paper>
      <div style={{ position: "absolute", left: 180, top: 130 }}>
        <SceneTitle
          eyebrow="S2E01"
          title="Bộ luật đọc"
          subtitle="bốn luật cho tập này"
          startFrac={Math.max(0.02, fMot - 60 / dur)}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 430,
          width: 1560,
          display: "flex",
          flexDirection: "column",
          gap: 46 - 18 * condense,
        }}
      >
        {laws.map(([num, text, st]) => (
          <Reveal key={num} startFrac={st} dy={18}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 34 }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, color: C.amber, minWidth: 120 }}>
                {num}
              </div>
              <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream }}>· {text}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal startFrac={fBon + 230 / dur} dy={0}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 920,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 900, height: 3, background: C.amber, opacity: 0.8 }} />
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc015 (s06) — QUOTE-CARD sính lễ nguyên văn. */
export const Sc015: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fVoi = A("voi chín ngà");
  const fDoi = A("mỗi thứ một đôi");
  const verses = [
    { t: "voi chín ngà", at: fVoi },
    { t: "gà chín cựa", at: fVoi + 38 / dur },
    { t: "ngựa chín hồng mao", at: fVoi + 76 / dur },
    { t: "mỗi thứ một đôi", at: fDoi, last: true },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: C.amber, opacity: 0.1 }} />
      <div style={{ position: "absolute", left: 300, right: 300, top: 250 }}>
        <LegendFrame label="TRÍCH NGUYÊN VĂN">
          <div style={{ textAlign: "center" }}>
            {verses.map((v, i) => (
              <Reveal key={i} startFrac={v.at} dy={14}>
                <div
                  style={{
                    fontFamily: FONT.display,
                    fontWeight: 700,
                    fontSize: 62,
                    color: v.last ? C.white : C.cream,
                    lineHeight: 1.5,
                  }}
                >
                  «{v.t}»{i < 3 ? "," : ""}
                </div>
              </Reveal>
            ))}
          </div>
        </LegendFrame>
      </div>
      <div style={{ position: "absolute", inset: 0, width: 1920, height: 1080, pointerEvents: "none" }}>
        <InkDraw
          d="M 745 742 L 1175 742"
          startFrac={fDoi + 42 / dur}
          endFrac={fDoi + 70 / dur}
          stroke={C.amber}
          strokeWidth={5}
        />
      </div>
      <SourceTag text="Lĩnh Nam chích quái · TRUYỆN KỂ" />
    </Paper>
  );
};

/** sc021 (s08) — IMAGE PLATE: đón vợ lên Tản Viên (KB tilt_up lưng núi). */
export const Sc021: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fDon = A("đón vợ về");
  const fTan = A("Tản Viên");
  const solid = { background: C.amber, color: "#1A1714", borderColor: C.amber, fontWeight: 700 };
  return (
    <Paper>
      <InkImageScene src={plateSrc("img-01-son-tinh.png")} focus={{ x: 0.5, y: 0.36 }}>
        <Reveal startFrac={fDon} dy={16}>
          <div
            style={{
              position: "absolute",
              left: 160,
              right: 160,
              bottom: 120,
              textAlign: "center",
              textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white, lineHeight: 1.4 }}>
              «Sơn Tinh đón vợ về ở ngọn núi cao nhất trong dãy Tản Viên»
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.amber, marginTop: 18, letterSpacing: 3 }}>
              — SÁCH CHÉP
            </div>
          </div>
        </Reveal>
        <div style={{ position: "absolute", left: 1130, top: 250 }}>
          <Reveal startFrac={Math.min(0.95, fTan + 90 / dur)}>
            <Chip color={C.amber} style={solid}>
              tức núi Ba Vì hôm nay
            </Chip>
          </Reveal>
        </div>
      </InkImageScene>
    </Paper>
  );
};

/** sc027 (s10) — MAP STAGE 1/6: địa hình tự vẽ trên bản đồ trống. */
export const Sc027: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fHong = A("sông Hồng");
  const fDay = A("sông Đáy");
  const fBa = A("Ba Vì");
  const peaks = [
    { x: 640, y: 392, at: fBa + 26 / dur },
    { x: 756, y: 366, at: fBa + 34 / dur, big: true },
    { x: 872, y: 392, at: fBa + 42 / dur },
  ];
  const solid = { background: C.amber, color: "#1A1714", borderColor: C.amber, fontWeight: 700 };
  return (
    <Paper>
      <InkImageScene src={plateSrc("img-08-ban-do.png")}>
        {/* sông Hồng — trục dọc chính, vẽ khi 'chảy từ phía bắc xuống' */}
        <InkDraw
          d="M 1150 90 C 1200 380, 1120 700, 980 1030"
          startFrac={fHong + 10 / dur}
          endFrac={fHong + 94 / dur}
          stroke={C.teal}
          strokeWidth={10}
        />
        <div style={{ position: "absolute", left: 1240, top: 520 }}>
          <Reveal startFrac={fHong + 70 / dur}>
            <Chip color={C.teal} style={{ fontWeight: 700 }}>
              SÔNG HỒNG
            </Chip>
          </Reveal>
        </div>
        {/* sông Đà + sông Đáy — tưới vùng tây nam */}
        <InkDraw
          d="M 880 500 C 800 640, 720 780, 650 960"
          startFrac={fDay - 14 / dur}
          endFrac={fDay + 50 / dur}
          stroke={C.teal}
          strokeWidth={5}
        />
        <div style={{ position: "absolute", left: 560, top: 800 }}>
          <Reveal startFrac={fDay + 50 / dur}>
            <Chip color={C.teal}>SÔNG ĐÀ</Chip>
          </Reveal>
        </div>
        <InkDraw
          d="M 1010 560 C 950 700, 900 830, 875 1000"
          startFrac={fDay + 4 / dur}
          endFrac={fDay + 68 / dur}
          stroke={C.teal}
          strokeWidth={5}
        />
        <div style={{ position: "absolute", left: 920, top: 880 }}>
          <Reveal startFrac={fDay + 66 / dur}>
            <Chip color={C.teal}>SÔNG ĐÁY</Chip>
          </Reveal>
        </div>
        {/* núi Ba Vì — ba đỉnh đội lên giữa đồng bằng */}
        {peaks.map((p, i) => (
          <div key={i} style={{ position: "absolute", left: p.x, top: p.y }}>
            <SpringPop startFrac={p.at} from={0.7}>
              <svg width={p.big ? 150 : 118} height={110} viewBox="0 0 118 110">
                <path d="M6 104 L 59 12 L 112 104 Z" fill={C.cream} opacity={p.big ? 0.88 : 0.7} />
              </svg>
            </SpringPop>
          </div>
        ))}
        <div style={{ position: "absolute", left: 790, top: 520 }}>
          <Reveal startFrac={fBa + 60 / dur}>
            <Chip color={C.amber} style={solid}>
              BA VÌ · BA ĐỈNH
            </Chip>
          </Reveal>
        </div>
        <SourceTag text="sách chép" />
      </InkImageScene>
    </Paper>
  );
};

/** sc033 (s13) — IMAGE PLATE: rào tre và nỏ, overlay mực speech-locked. */
export const Sc033: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fRao = A("đan tre làm rào");
  const fNo = A("lấy nỏ bắn xuống");
  const fTay = A("đôi bàn tay", 2);
  const ret = Math.max(0, Math.min(90, frame - (fNo + 120 / dur) * dur));
  const fish = [
    { x: 1230, y: 880, d: 0 },
    { x: 1380, y: 920, d: 14 },
    { x: 1100, y: 940, d: 26 },
  ];
  const F = (n: number) => n / dur;
  return (
    <Paper>
      <InkImageScene
        src={plateSrc("img-07-rao-tre.png")}
        label="phòng tuyến thần núi"
        sublabel="tre · nỏ"
      >
        {/* rào tre đan thành vòng quanh lưng núi */}
        <InkDraw d="M 240 760 C 620 700, 1300 700, 1680 760" startFrac={fRao} endFrac={fRao + F(70)} stroke={C.cream} strokeWidth={9} />
        <InkDraw d="M 240 812 C 620 752, 1300 752, 1680 812" startFrac={fRao + F(14)} endFrac={fRao + F(84)} stroke={C.cream} strokeWidth={5} />
        <InkDraw d="M 480 730 L 480 806" startFrac={fRao + F(34)} endFrac={fRao + F(50)} stroke={C.cream} strokeWidth={4} />
        <InkDraw d="M 960 714 L 960 790" startFrac={fRao + F(46)} endFrac={fRao + F(62)} stroke={C.cream} strokeWidth={4} />
        <InkDraw d="M 1440 730 L 1440 806" startFrac={fRao + F(58)} endFrac={fRao + F(74)} stroke={C.cream} strokeWidth={4} />
        {/* nỏ bắn xuống */}
        <InkDraw d="M 880 250 Q 960 198 1040 250" startFrac={fNo} endFrac={fNo + F(26)} stroke={C.cream} strokeWidth={6} />
        <InkDraw d="M 880 250 L 1040 250" startFrac={fNo + F(10)} endFrac={fNo + F(30)} stroke={C.cream} strokeWidth={2} />
        <InkDraw d="M 960 208 L 960 332" startFrac={fNo + F(18)} endFrac={fNo + F(36)} stroke={C.amber} strokeWidth={5} />
        <InkDraw d="M 700 260 L 656 344" startFrac={fNo + F(26)} endFrac={fNo + F(40)} stroke={C.amber} strokeWidth={4} />
        <InkDraw d="M 1220 260 L 1264 344" startFrac={fNo + F(40)} endFrac={fNo + F(54)} stroke={C.amber} strokeWidth={4} />
        {/* thủy tộc lùi theo mực nước khi 'chạy trốn cả' */}
        {fish.map((fsh, i) => {
          const r = Math.max(0, ret - fsh.d);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: fsh.x,
                top: fsh.y,
                opacity: 1 - Math.min(1, r / 80),
                transform: `translate(${-r * 1.8}px, ${r * 0.35}px)`,
              }}
            >
              <svg width="72" height="44" viewBox="0 0 72 44">
                <path
                  d="M4 22 Q 24 4 46 22 Q 24 40 4 22 Z M46 22 L 66 8 L 60 22 L 66 36 Z"
                  fill={C.teal}
                  opacity={0.85}
                />
              </svg>
            </div>
          );
        })}
        {/* dòng kết ấm */}
        <Reveal startFrac={fTay} dy={14}>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 90,
              textAlign: "center",
              textShadow: "0 2px 10px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.amber, fontStyle: "italic" }}>
              đôi bàn tay của người sống bằng tre, nỏ, lưới, và đất đắp
            </div>
          </div>
        </Reveal>
      </InkImageScene>
    </Paper>
  );
};

/** sc039 (s16) — IMAGE PLATE: một đoạn đê Cơ Xá 1108, ring khóa + chips phủ định. */
export const Sc039: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fDoan = A("một đoạn", 2);
  const fNang = A("nâng đất lên");
  const solid = { background: C.amber, color: "#1A1714", borderColor: C.amber, fontWeight: 700 };
  return (
    <Paper>
      <InkImageScene src={plateSrc("img-09-de-co-xa.png")} focus={{ x: 0.5, y: 0.58 }}>
        <div style={{ position: "absolute", left: 330, top: 300 }}>
          <Reveal startFrac={Math.max(0.02, fDoan - 55 / dur)}>
            <Chip color={C.lampRed}>chưa phải hệ thống</Chip>
          </Reveal>
        </div>
        <div style={{ position: "absolute", left: 330, top: 360 }}>
          <Reveal startFrac={Math.max(0.02, fDoan - 38 / dur)}>
            <Chip color={C.lampRed}>chưa phải hai bờ</Chip>
          </Reveal>
        </div>
        <InkDraw
          d={circleD(960, 650, 185)}
          startFrac={fDoan}
          endFrac={fDoan + 34 / dur}
          stroke={C.amber}
          strokeWidth={7}
        />
        <div style={{ position: "absolute", left: 700, top: 402 }}>
          <Reveal startFrac={fDoan + 22 / dur}>
            <Chip color={C.amber} style={solid}>
              MỘT ĐOẠN · MỘT THÀNH PHỐ
            </Chip>
          </Reveal>
        </div>
        <Reveal startFrac={fNang} dy={14}>
          <div
            style={{
              position: "absolute",
              left: 260,
              right: 260,
              bottom: 90,
              textAlign: "center",
              textShadow: "0 2px 10px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: C.amber }}>
              LẦN ĐẦU TIÊN
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.white, marginTop: 10 }}>
              chính sử ghi lại cảnh người Việt nâng đất lên chống nước
            </div>
          </div>
        </Reveal>
      </InkImageScene>
    </Paper>
  );
};

/** sc045 (s19) — DIAGRAM: bóng các thế hệ in trên sườn đê. */
export const Sc045: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  // d-012B: «đời này tiếp đời trước» (657.8s) nói ở sc044 — đổi cue mở sang intro thực của hồi ba.
  const fIntro = A("Và nếu ai hỏi thần núi ở đâu");
  const fLop = A("mỗi lớp đất được nện chặt");
  const fNgay = A("một ngày Sơn Tinh đi làm");
  const shadows = [
    { name: "nông dân", x: 540, y: 640, at: fIntro },
    { name: "lính", x: 830, y: 566, at: fIntro + 26 / dur },
    { name: "dân phu", x: 1120, y: 566, at: fIntro + 52 / dur },
    { name: "kỹ sư", x: 1410, y: 640, at: fIntro + 78 / dur },
  ];
  return (
    <Paper>
      {/* mặt cắt đê mờ làm nền (backdrop tĩnh) */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        <path d="M 260 900 L 800 470 L 1120 470 L 1660 900 Z" fill={C.cream} opacity={0.09} />
        <path
          d="M 260 900 L 800 470 L 1120 470 L 1660 900"
          fill="none"
          stroke={C.cream}
          strokeWidth={3}
          opacity={0.35}
        />
        <path d="M 120 900 L 1800 900" stroke={C.cream} strokeWidth={2} opacity={0.25} />
        <path d="M 690 700 L 1230 700" stroke={C.cream} strokeWidth={1.5} opacity={0.18} />
        <path d="M 560 800 L 1360 800" stroke={C.cream} strokeWidth={1.5} opacity={0.18} />
        <path d="M 440 880 L 1480 880" stroke={C.cream} strokeWidth={1.5} opacity={0.18} />
      </svg>
      <div style={{ position: "absolute", left: 180, top: 110 }}>
        <SceneTitle
          eyebrow="HỒI BA"
          title="Bóng các thế hệ"
          subtitle="trên sườn đê"
          startFrac={Math.max(0.02, fIntro - 170 / dur)}
        />
      </div>
      {shadows.map((s, i) => {
        const op = Math.max(0, Math.min(1, (frame - s.at * dur) / 24)) * 0.55;
        return (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, opacity: op }}>
            <svg width="110" height="170" viewBox="0 0 100 160">
              <circle cx="50" cy="26" r="19" fill={C.cream} />
              <path d="M50 52 C 20 62, 13 112, 18 158 L 82 158 C 87 112, 80 62, 50 52 Z" fill={C.cream} />
            </svg>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 21,
                color: C.mute,
                letterSpacing: 2,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {s.name}
            </div>
          </div>
        );
      })}
      <Reveal startFrac={fLop} dy={16}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 100,
            textAlign: "center",
            textShadow: "0 2px 10px rgba(0,0,0,0.9)",
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.cream }}>
            «mỗi lớp đất được nện chặt
          </div>
          <Reveal startFrac={fNgay} dy={0}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 54,
                color: C.amber,
                marginTop: 12,
              }}
            >
              là một ngày Sơn Tinh đi làm»
            </div>
          </Reveal>
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc051 (s22) — TEXT CARD: hai vị thần đổi chỗ ở. */
export const Sc051: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fDoiCho = A("từ trang cổ thư, vào đời thường");
  const fMua = A("những vị thần ở lại");
  const F = (n: number) => n / dur;
  const left = [
    { t: "nếp đê người ta nện", at: F(60) },
    { t: "cây thước người ta vạch", at: F(105) },
    { t: "mùa người ra đê", at: F(150) },
  ];
  const right = [
    { t: "mực nước đo từng giờ", at: F(215) },
    { t: "ba vạch báo động", at: F(260) },
    { t: "bản tin lũ mỗi sớm mai", at: F(305) },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", left: 220, top: 220, width: 660 }}>
        <Reveal startFrac={F(25)} dy={14}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 44, color: C.white }}>
            SƠN TINH
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 24, color: C.mute, marginTop: 6 }}>
            sống trong
          </div>
        </Reveal>
        <div style={{ marginTop: 40 }}>
          {left.map((it, i) => (
            <Reveal key={i} startFrac={it.at} dy={10}>
              <div style={{ fontFamily: FONT.body, fontSize: 33, color: C.cream, lineHeight: 2 }}>
                · {it.t}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", right: 220, top: 220, width: 660, textAlign: "right" }}>
        <Reveal startFrac={F(180)} dy={14}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 44, color: C.white }}>
            THỦY TINH
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 24, color: C.mute, marginTop: 6 }}>
            sống trong
          </div>
        </Reveal>
        <div style={{ marginTop: 40 }}>
          {right.map((it, i) => (
            <Reveal key={i} startFrac={it.at} dy={10}>
              <div style={{ fontFamily: FONT.body, fontSize: 33, color: C.cream, lineHeight: 2 }}>
                {it.t} ·
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Reveal startFrac={fDoiCho} dy={14}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 800,
            textAlign: "center",
            textShadow: "0 2px 10px rgba(0,0,0,0.9)",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream }}>
            «họ chỉ đổi chỗ ở: từ trang cổ thư, vào đời thường»
          </div>
        </div>
      </Reveal>
      <Reveal startFrac={fMua} dy={0}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 100,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 40,
              color: C.white,
              letterSpacing: 8,
            }}
          >
            NHỮNG VỊ THẦN Ở LẠI
          </div>
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: 24,
              color: C.mute,
              marginTop: 10,
              letterSpacing: 4,
            }}
          >
            — mùa hai —
          </div>
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc057 (s25) — TEXT CARD: Tứ bất tử + di sản 2018. */
export const Sc057: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const fTu = A("Tứ bất tử");
  const fDs = A("di sản văn hóa phi vật thể");
  const fMoi = A("mời nước lên trước tiên");
  const names = [
    { t: "Tản Viên", at: fTu + 75 / dur, first: true },
    { t: "Phù Đổng", at: fTu + 97 / dur },
    { t: "Chử Đồng Tử", at: fTu + 119 / dur },
    { t: "Liễu Hạnh", at: fTu + 141 / dur },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", left: 180, top: 110 }}>
        <SceneTitle
          eyebrow="ĐỀN TẢN VIÊN"
          title="Tứ bất tử"
          subtitle="bốn vị thần bất tử · Bắc Bộ"
          startFrac={Math.max(0.02, fTu - 140 / dur)}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 440,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 56,
        }}
      >
        {names.map((n, i) => (
          <SpringPop key={i} startFrac={n.at} from={0.85}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: n.first ? 52 : 44,
                color: n.first ? C.amber : C.cream,
                borderBottom: n.first ? `4px solid ${C.amber}` : "none",
                paddingBottom: n.first ? 10 : 0,
              }}
            >
              {n.t}
            </div>
          </SpringPop>
        ))}
      </div>
      <Reveal startFrac={Math.max(0.03, fDs - 100 / dur)} dy={14}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 660,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 46,
              color: C.white,
              letterSpacing: 4,
            }}
          >
            30 / 01 / 2018
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, marginTop: 12 }}>
            di sản văn hóa phi vật thể quốc gia
          </div>
        </div>
      </Reveal>
      <Reveal startFrac={Math.min(0.95, fDs + 150 / dur)} dy={10}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 200,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontSize: 27, color: C.mute, fontStyle: "italic" }}>
            đền, lễ, chỉ nói về người thờ; không chứng minh trận đánh có thật
          </div>
        </div>
      </Reveal>
      <Reveal startFrac={fMoi} dy={0}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 100,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.amber }}>
            «họ mời nước lên trước tiên»
          </div>
        </div>
      </Reveal>
    </Paper>
  );
};
