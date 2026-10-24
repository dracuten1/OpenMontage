// S2E02 thanh-giong — scenes group "b" (spec_b.json).
// Speech-lock: mọi reveal/pop/draw/count bắn tại A("...") — anchor fraction (0.01–0.965)
// được đưa thẳng vào startFrac. Ambient (dust/parallax/tremor) chạy liên tục theo frame.
import * as React from "react";
import { useCurrentFrame } from "remotion";
import {
  Paper, Reveal, CountUp, SpringPop, InkDraw, circleD, SourceTag, Chip,
  LegendFrame, LabBadge, DossierBadge, SceneTitle, TextCard, plateSrc, InkImageScene,
} from "./common";
import { useA, useFrac } from "./common";
import { C, FONT } from "./theme";
import { SceneProps } from "./theme";

// bụi sáng lơ lửng — ambient, không speech-lock (chuyển động liên tục)
const Dust: React.FC<{ n?: number }> = ({ n = 7 }) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const x = 130 + ((i * 331 + 17) % 1660);
        const y = 160 + ((i * 517 + f * (0.25 + (i % 3) * 0.13)) % 800);
        const o = 0.08 + 0.16 * (0.5 + 0.5 * Math.sin(f * 0.05 + i * 1.7));
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: 5, height: 5,
              borderRadius: 5, background: C.amber, opacity: o,
            }}
          />
        );
      })}
    </>
  );
};

/** sc002 (s01) — TRỤC VẬT THỂ CỦA TẬP: trang giấy dó + hạt gạo + mái đền neo chéo, nét mực nối, dấu hỏi. */
export const Sc002: React.FC<SceneProps> = () => {
  const A = useA();
  const f = useCurrentFrame();
  const aTrio = A("ba trang sách");
  const aDinh = A("hai ngôi đền");
  const P = { x: 360, y: 780 };
  const G = { x: 960, y: 560 };
  const D = { x: 1540, y: 330 };
  const fl = (seed: number) => Math.sin(f * 0.045 + seed) * 7;
  return (
    <Paper>
      {/* trang giấy dó sẫm — chứng cứ 1 */}
      <div style={{ position: "absolute", left: P.x - 75, top: P.y - 105, width: 150, height: 205 }}>
        <Reveal startFrac={aTrio} dy={16}>
          <div style={{ width: "100%", height: "100%", background: C.card, border: `2px solid ${C.border}`, borderRadius: 4, transform: `rotate(-2deg) translateY(${fl(0)}px)`, padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
            {[92, 70, 84, 58].map((w, i) => (
              <div key={i} style={{ width: `${w}%`, height: 9, borderRadius: 5, background: C.cream, opacity: 0.16 }} />
            ))}
          </div>
        </Reveal>
      </div>

      {/* hạt gạo vàng đồng — chứng cứ 2 */}
      <div style={{ position: "absolute", left: G.x - 30, top: G.y - 17 + fl(2), width: 60, height: 30 }}>
        <Reveal startFrac={aDinh} dy={14}>
          <div style={{ width: 60, height: 30, borderRadius: "50%", background: C.amber, transform: "rotate(-24deg)", boxShadow: `0 0 36px ${C.amber}66` }} />
        </Reveal>
      </div>

      {/* mái đền đỏ son — chứng cứ 3 */}
      <div style={{ position: "absolute", left: D.x - 95, top: D.y - 48 + fl(4) }}>
        <Reveal startFrac={aDinh} dy={14}>
          <div>
            <div style={{ width: 190, height: 84, background: C.warn, clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
            <div style={{ width: 150, height: 9, background: C.warn, opacity: 0.75, margin: "7px auto 0", borderRadius: 4 }} />
          </div>
        </Reveal>
      </div>

      {/* vệt mực nối ba vật thành đường chéo */}
      <div style={{ position: "absolute", inset: 0 }}>
        <InkDraw d={`M ${P.x} ${P.y} L ${G.x} ${G.y} L ${D.x} ${D.y}`} startFrac={aDinh} endFrac={aDinh + 0.12} stroke={C.cream} strokeWidth={3} />
      </div>

      {/* dấu hỏi mực đè trên cùng — narration hỏi vì sao */}
      <div style={{ position: "absolute", left: 960, top: 116, transform: "translateX(-50%)" }}>
        <SpringPop startFrac={aDinh} from={0.7}>
          <div style={{ fontFamily: FONT.display, fontSize: 215, lineHeight: 1, color: C.amber }}>?</div>
        </SpringPop>
      </div>

      {/* kicker + nhãn vật thể */}
      <div style={{ position: "absolute", left: 84, top: 76 }}>
        <Reveal startFrac={aTrio} dy={10}>
          <div style={{ fontFamily: FONT.body, fontSize: 28, letterSpacing: 3, color: C.mute }}>
            S2E02 · THÁNH GIÓNG — TRỤC VẬT THỂ CỦA TẬP
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: P.x - 110, top: P.y + 116 }}>
        <Reveal startFrac={aTrio}><Chip>ba trang sách</Chip></Reveal>
      </div>
      <div style={{ position: "absolute", left: G.x - 110, top: G.y + 112 }}>
        <Reveal startFrac={aDinh}><Chip>một nong gạo</Chip></Reveal>
      </div>
      <div style={{ position: "absolute", left: D.x - 110, top: D.y + 112 }}>
        <Reveal startFrac={aDinh}><Chip color={C.warn}>hai ngôi đền</Chip></Reveal>
      </div>

      <Dust n={6} />
    </Paper>
  );
};

/** sc008 (s03) — BÀI HỌC GỌN: checklist SGK tick nhanh, khung phai, câu nghịch lý nổi lên. */
export const Sc008: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aGon = A("Gọn trong một bài học");
  const aNghi = A("đứa trẻ chưa từng nói một lời");
  const items = ["xin vũ khí", "lớn nhanh như thổi", "ra trận", "thắng", "bay về trời"];
  const fade = p(Math.max(0, aNghi - 0.06), aNghi);
  const dim = 1 - 0.86 * fade;
  const rise = -34 * fade;
  return (
    <Paper>
      <SceneTitle startFrac={aGon} eyebrow="SÁCH GIÁO KHOA" title="Gọn trong một bài học" subtitle="lớp sách giáo khoa kể vắn tắt" titleSize={72} />

      {/* khung liệt kê — checklist, hiện đúng lúc đọc, rồi phai nhường chỗ câu nghịch lý */}
      <div style={{ position: "absolute", left: 460, top: 310, width: 1000, opacity: dim, transform: `translateY(${rise}px)` }}>
        <Reveal startFrac={aGon} dy={14}>
          <div style={{ background: "rgba(36,31,26,0.94)", border: `2px solid ${C.border}`, borderRadius: 10, padding: "30px 44px", display: "flex", flexDirection: "column", gap: 16 }}>
            {items.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <span style={{ fontFamily: FONT.display, fontSize: 36, color: C.amber, width: 36 }}>✓</span>
                <span style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>{t}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* câu nghịch lý — nguyên văn, giữ đến hết scene */}
      <TextCard startFrac={aNghi} title="điều kỳ lạ lớp học không giải thích" maxWidth={1500} titleSize={56}>
        <div style={{ fontFamily: FONT.body, fontSize: 36, lineHeight: 1.65, color: C.cream }}>
          trong biết bao vua chúa, thần tướng của truyện kể Việt Nam,<br />
          người cứu nước nổi tiếng nhất lại là một đứa trẻ<br />
          <span style={{ fontFamily: FONT.display, color: C.amber }}>chưa từng nói một lời.</span>
        </div>
      </TextCard>
    </Paper>
  );
};

/** sc014 (s06) — SỨ GIẢ GHÉ LÀNG: plate img-03, vòng mực rung, bong bóng thoại rỗng mở lúc "cất tiếng". */
export const Sc014: React.FC<SceneProps> = () => {
  const A = useA();
  const f = useCurrentFrame();
  const aGhe = A("ghé qua làng");
  const aNoi = A("cất tiếng");
  return (
    <Paper>
      <InkImageScene
        src={plateSrc("img-03-su-gia.png")}
        label="Sứ giả ghé làng"
        sublabel="người khách quân xanh · dừng trước nhà giàu nhất vùng"
      >
        <div style={{ position: "absolute", left: 84, bottom: 200 }}>
          <Reveal startFrac={aGhe} dy={10}>
            <div style={{ fontFamily: FONT.body, fontSize: 34, letterSpacing: 1, color: C.cream, background: "rgba(20,17,13,0.75)", padding: "12px 22px", borderRadius: 8 }}>
              sứ giả đi tìm người tài — ghé qua làng
            </div>
          </Reveal>
        </div>

        {/* vòng mực rung nhẹ: cả làng chưa tin tai */}
        <svg width={400} height={360} style={{ position: "absolute", left: 1140, top: 290, opacity: 0.55 }}>
          <ellipse
            cx={200}
            cy={180}
            rx={152 + Math.sin(f * 0.19) * 3}
            ry={124 - Math.sin(f * 0.16) * 2.5}
            fill="none"
            stroke={C.cream}
            strokeWidth={2}
            strokeDasharray="7 9"
          />
        </svg>

        {/* bong bóng thoại mực rỗng — mở ra đợi lời đầu tiên */}
        <div style={{ position: "absolute", left: 1288, top: 236 }}>
          <SpringPop startFrac={aNoi} from={0.78}>
            <div style={{ width: 236, height: 138, border: `3px solid ${C.cream}`, borderRadius: 20, background: "rgba(20,17,13,0.75)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: 8, background: C.cream, opacity: 0.32 + 0.26 * (0.5 + 0.5 * Math.sin(f * 0.12 + i)) }} />
              ))}
              <div style={{ position: "absolute", left: 42, bottom: -13, width: 15, height: 15, background: "#14110D", borderLeft: `3px solid ${C.cream}`, borderBottom: `3px solid ${C.cream}`, transform: "rotate(-45deg)" }} />
            </div>
          </SpringPop>
        </div>
      </InkImageScene>
    </Paper>
  );
};

/** sc020 (s08) — QUOTE: "Ta là thiên tướng nhà Trời đây!" — Lĩnh Nam chích quái · 1492, nền trang mờ. */
export const Sc020: React.FC<SceneProps> = () => {
  const A = useA();
  const f = useCurrentFrame();
  const aQuote = A("Ta là thiên tướng nhà Trời đây");
  const aXung = A("tự xưng là thiên tướng");
  const px = Math.sin(f * 0.013) * 11;
  return (
    <Paper>
      {/* nền trang 1492 mờ phía sau — parallax nhẹ */}
      <div style={{ position: "absolute", inset: 70, transform: `translateX(${px}px)`, opacity: 0.12, border: `2px solid ${C.border}`, borderRadius: 6, padding: 64, display: "flex", gap: 88 }}>
        {[0, 1, 2].map((c) => (
          <div key={c} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ height: 9, borderRadius: 5, background: C.cream, opacity: 0.35, width: `${62 + ((i * 13 + c * 7) % 34)}%` }} />
            ))}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", left: 240, top: 300, width: 1440, textAlign: "center" }}>
        <Reveal startFrac={aQuote} dy={12}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, letterSpacing: 2, color: C.mute }}>
            sách chép câu đáp của cậu —
          </div>
        </Reveal>
        <SpringPop startFrac={aQuote} from={0.82}>
          <div style={{ fontFamily: FONT.display, fontSize: 104, lineHeight: 1.16, color: C.amber, marginTop: 40 }}>
            «Ta là thiên tướng<br />nhà Trời đây!»
          </div>
        </SpringPop>
        <Reveal startFrac={aXung} dy={12}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 52 }}>
            một đứa trẻ 3 tuổi tự xưng là thiên tướng nhà Trời
          </div>
        </Reveal>
      </div>

      <SourceTag text="sách chép: Lĩnh Nam chích quái · 1492" bottom={64} right={true} />
    </Paper>
  );
};

/** sc026 (s10) — HỒI HAI · HẠT GẠO: act title + chiếc nong trống giữa sân (img-04), bụi sáng chờ hạt gạo. */
export const Sc026: React.FC<SceneProps> = () => {
  const A = useA();
  const aHat = A("hạt gạo");
  const aLuot = A("kể lướt");
  return (
    <Paper>
      <InkImageScene
        src={plateSrc("img-04-nong-com.png")}
        label="Chiếc nong giữa sân"
        sublabel="trống — trước khi hạt gạo bắt đầu bay"
      >
        <SceneTitle startFrac={aHat} eyebrow="HỒI HAI · TRANG 1492" title="Hạt gạo" subtitle="cậu bé lớn nhanh như thế nào?" titleSize={76} />
        <div style={{ position: "absolute", left: 84, bottom: 208 }}>
          <Reveal startFrac={aLuot}>
            <Chip style={{ background: "rgba(20,17,13,0.78)" }}>chỗ cả chính sử lẫn sách giáo khoa đều kể lướt</Chip>
          </Reveal>
        </div>
        <Dust n={9} />
      </InkImageScene>
    </Paper>
  );
};

/** sc032 (s12) — ĐỊA DANH THẬT: bản đồ sepia Phù Đổng → Võ Ninh, pin làng Cháy rực như vệt rèn. */
export const Sc032: React.FC<SceneProps> = () => {
  const A = useA();
  const f = useCurrentFrame();
  const aChay = A("làng Cháy");
  const aVo = A("Võ Ninh");
  const FD = { x: 620, y: 660 };
  const LC = { x: 810, y: 470 };
  const VN = { x: 1290, y: 380 };
  return (
    <Paper>
      {/* bảng bản đồ giấy dầu sepia */}
      <div style={{ position: "absolute", inset: 60, background: "rgba(36,31,26,0.94)", borderRadius: 8, border: `2px dashed ${C.border}` }} />
      <LabBadge text="ĐỊA DANH THẬT TRÊN TRUYỆN KỲ" />

      {/* Phù Đổng — điểm xuất phát, có từ đầu */}
      <div style={{ position: "absolute", left: FD.x, top: FD.y, transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ width: 20, height: 20, borderRadius: 12, background: C.teal }} />
        <div style={{ fontFamily: FONT.body, fontSize: 28, letterSpacing: 2, color: C.cream, opacity: 0.85 }}>PHÙ ĐỔNG</div>
      </div>

      {/* tuyến tiến quân — nét mực chạy lúc đọc Võ Ninh */}
      <div style={{ position: "absolute", inset: 0 }}>
        <InkDraw d={`M ${FD.x} ${FD.y} C 760 600, 1000 560, ${VN.x} ${VN.y}`} startFrac={aVo} endFrac={aVo + 0.18} stroke={C.teal} strokeWidth={4} />
      </div>

      {/* làng Cháy — pin rực như vệt rèn còn nóng */}
      <div style={{ position: "absolute", left: LC.x, top: LC.y, transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Reveal startFrac={aChay} dy={10}>
          <div style={{ position: "relative", width: 26, height: 26 }}>
            <div style={{ width: 26, height: 26, borderRadius: 16, background: C.amber, boxShadow: `0 0 30px ${C.amber}` }} />
            <div style={{ position: "absolute", left: -6, top: -6, width: 38, height: 38, borderRadius: 999, border: `2px solid ${C.amber}`, opacity: 0.55, transform: `scale(${1 + 0.45 * (0.5 + 0.5 * Math.sin(f * 0.09))})` }} />
          </div>
        </Reveal>
        <Reveal startFrac={aChay} dy={8}>
          <div style={{ fontFamily: FONT.display, fontSize: 32, color: C.amber }}>LÀNG CHÁY</div>
        </Reveal>
        <Reveal startFrac={aChay} dy={6}>
          <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, opacity: 0.8 }}>chỗ rèn và dọt ngựa sắt</div>
        </Reveal>
      </div>

      {/* Võ Ninh — nơi giặc Ân đóng binh */}
      <div style={{ position: "absolute", left: VN.x, top: VN.y, transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Reveal startFrac={aVo} dy={10}>
          <div style={{ width: 22, height: 22, background: C.warn, transform: "rotate(45deg)", boxShadow: `0 0 24px ${C.warn}` }} />
        </Reveal>
        <Reveal startFrac={aVo} dy={8}>
          <div style={{ fontFamily: FONT.display, fontSize: 32, color: C.cream }}>VÕ NINH</div>
        </Reveal>
        <Reveal startFrac={aVo} dy={6}>
          <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, opacity: 0.8 }}>nơi truyện kể giặc Ân đóng binh</div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc038 (s14) — 100 MẪU RUỘNG TỰ ĐIỀN: stat count-up + ba dòng định đoạt người nhận. */
export const Sc038: React.FC<SceneProps> = () => {
  const A = useA();
  const a100 = A("100 mẫu ruộng tự điền");
  const aMe = A("Không phải cho mẹ cậu");
  const strike: React.CSSProperties = {
    fontFamily: FONT.body, fontSize: 34, color: C.mute,
    textDecoration: "line-through", textDecorationColor: C.warn, textDecorationThickness: "3px",
  };
  return (
    <Paper>
      <DossierBadge text="LĨNH NAM CHÍCH QUÁI · 1492" />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <SpringPop startFrac={a100} from={0.85}>
          <CountUp
            to={100}
            from={0}
            startFrac={a100}
            endFrac={a100 + 0.12}
            style={{ fontFamily: FONT.display, fontSize: 218, lineHeight: 1, color: C.amber }}
          />
        </SpringPop>
        <Reveal startFrac={a100} dy={8}>
          <div style={{ fontFamily: FONT.display, fontSize: 54, letterSpacing: 6, color: C.cream, marginTop: 10 }}>
            mẫu ruộng tự điền
          </div>
        </Reveal>

        <Reveal startFrac={aMe} dy={10}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, fontStyle: "italic", color: C.mute, marginTop: 54 }}>
            Ban cho ai?
          </div>
        </Reveal>
        <Reveal startFrac={aMe} dy={10}>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <div style={strike}>không phải cho mẹ cậu</div>
            <div style={strike}>không phải cho họ hàng</div>
            <div style={{ fontFamily: FONT.display, fontSize: 40, color: C.amber }}>
              ban cho cả hương Phù Đổng — xóm làng đã góp gạo vải
            </div>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc044 (s17) — HỘI TRẬN PHÙ ĐỔNG: chip ngày 7–9 tháng Tư, dải cờ hội phất, hội trận khép dòng lễ. */
export const Sc044: React.FC<SceneProps> = () => {
  const A = useA();
  const f = useCurrentFrame();
  const aChinh = A("chính hội ngày 9 tháng Tư");
  const aHoi = A("hội trận");
  return (
    <Paper>
      {/* dải cờ hội mờ — phất nhẹ */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute", left: 70 + i * 268, top: 0, bottom: 0, width: 168,
            background: i % 2 === 0 ? C.warn : C.amber,
            opacity: 0.09 + 0.035 * (0.5 + 0.5 * Math.sin(f * 0.06 + i * 1.3)),
            transform: `skewX(${Math.sin(f * 0.05 + i) * 3.2}deg) translateY(${Math.sin(f * 0.08 + i * 2) * 9}px)`,
          }}
        />
      ))}

      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Reveal startFrac={aChinh} dy={12}>
          <div style={{ width: 1060 }}>
            <LegendFrame label="ĐỀN PHÙ ĐỔNG · THÁNG TƯ ÂM LỊCH">
              <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
                <div style={{ fontFamily: FONT.display, fontSize: 96, lineHeight: 1.1, color: C.cream }}>
                  7 → 9 · tháng Tư
                </div>
                <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.mute, marginTop: 12 }}>
                  âm lịch — chính hội: ngày 9 tháng Tư
                </div>
              </div>
            </LegendFrame>
          </div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 132, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <Reveal startFrac={aHoi} dy={10}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>
            rước nước → rước cờ → khám đường, duyệt tướng →{" "}
            <span style={{ fontFamily: FONT.display, color: C.warn }}>hội trận</span>
          </div>
        </Reveal>
        <Reveal startFrac={aHoi}>
          <Chip color={C.warn} style={{ background: "rgba(20,17,13,0.8)" }}>lớn bậc nhất trong các hội làng vùng đồng bằng</Chip>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc050 (s19) — UNESCO 16/11/2010 · Nairobi: fact card teal trên nền hai đền mờ, huy hiệu mực đóng góc. */
export const Sc050: React.FC<SceneProps> = () => {
  const A = useA();
  const f = useCurrentFrame();
  const aDate = A("16 tháng 11 năm 2010");
  const aTen = A("Hội Gióng đền Phù Đổng");
  const par = Math.sin(f * 0.014) * 14;
  const temple = (x: number, mir: number) => (
    <div style={{ position: "absolute", left: x, top: 300, width: 420, height: 520, opacity: 0.07, transform: `translateX(${mir * par}px)` }}>
      <div style={{ width: 420, height: 190, background: C.cream, clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
      <div style={{ width: 300, height: 330, background: C.cream, margin: "0 auto" }} />
    </div>
  );
  return (
    <Paper variant="teal">
      {temple(140, 1)}
      {temple(1360, -1)}
      <LabBadge text="GÓC BẰNG CHỨNG" />

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Reveal startFrac={aDate} dy={14}>
          <div style={{ width: 1120 }}>
            <LegendFrame label="UNESCO · NAIROBI" color={C.teal}>
              <div style={{ textAlign: "center", padding: "12px 0 6px" }}>
                <div style={{ fontFamily: FONT.display, fontSize: 94, lineHeight: 1.1, color: C.teal }}>
                  16 · 11 · 2010
                </div>
                <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.mute, marginTop: 10 }}>tại Nairobi</div>
                <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 30 }}>
                  Di sản văn hóa phi vật thể đại diện của nhân loại
                </div>
                <Reveal startFrac={aTen} dy={10}>
                  <div style={{ fontFamily: FONT.display, fontSize: 50, color: C.amber, marginTop: 28 }}>
                    Hội Gióng đền Phù Đổng và đền Sóc
                  </div>
                </Reveal>
              </div>
            </LegendFrame>
          </div>
        </Reveal>
      </div>

      {/* huy hiệu mực nhỏ đóng góc */}
      <div style={{ position: "absolute", inset: 0 }}>
        <InkDraw d={circleD(1620, 852, 70)} startFrac={aTen} endFrac={aTen + 0.06} stroke={C.teal} strokeWidth={3} />
      </div>
      <div style={{ position: "absolute", left: 1620, top: 852, transform: "translate(-50%, -50%)", textAlign: "center" }}>
        <Reveal startFrac={aTen} dy={4}>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, letterSpacing: 3, color: C.teal, lineHeight: 1.5 }}>
            UNESCO<br />2010
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/** sc056 (s21) — CALLBACK QUOTE: "…nhà vua không phải lo gì cả!" — typewriter, vệt sáng chạy một lần. */
export const Sc056: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame: f, dur, p } = useFrac();
  const aDoi = A("đòi cho người khác");
  const aLo = A("nhà vua không phải lo gì cả");
  const QUOTE = "…nhà vua không phải lo gì cả!";
  const chars = Math.max(0, Math.floor((f - aLo * dur) / 2.4));
  const shown = QUOTE.slice(0, chars);
  const sx = -620 + 3080 * p(aLo, aLo + 0.3);
  return (
    <Paper variant="night">
      <div style={{ position: "absolute", left: 0, right: 0, top: 340, textAlign: "center" }}>
        <Reveal startFrac={aDoi} dy={10}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.mute, letterSpacing: 1 }}>
            tiếng nói đầu đời — một lời đòi cho người khác
          </div>
        </Reveal>
        <div style={{ fontFamily: FONT.display, fontSize: 84, color: C.cream, marginTop: 66, minHeight: 110 }}>
          {shown}
          {chars > 0 && chars < QUOTE.length && (
            <span style={{ opacity: Math.floor(f / 8) % 2 === 0 ? 0.9 : 0.1 }}>▌</span>
          )}
        </div>
      </div>

      {/* vệt sáng chạy qua đúng một lần */}
      <div
        style={{
          position: "absolute", left: sx, top: -220, width: 420, height: 1600,
          background: "linear-gradient(105deg, rgba(232,220,200,0) 0%, rgba(232,220,200,0.15) 50%, rgba(232,220,200,0) 100%)",
          transform: "rotate(16deg)",
        }}
      />

      <SourceTag text="sách chép: Đại Việt sử ký toàn thư · 1479/1697" bottom={64} right={true} />
    </Paper>
  );
};

/** sc062 (s23) — VÒNG TRÒN KHÉP: nhà → gạo → nong → tráng sĩ → ruộng → nhà, mực khép vòng + caption cuối. */
export const Sc062: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aNong = A("gặp nhau trong một chiếc nong");
  const aLon = A("cùng lớn lên một lần");
  const Cc = { x: 960, y: 540 };
  const R = 305;
  const nodes = [
    { key: "nha", label: "mái nhà", ang: -90, fi: 0.03 },
    { key: "gao", label: "hạt gạo", ang: -18, fi: 0.215 },
    { key: "nong", label: "chiếc nong", ang: 54, fi: 0.4 },
    { key: "si", label: "tráng sĩ", ang: 126, fi: 0.585 },
    { key: "ruong", label: "ruộng", ang: 198, fi: 0.77 },
  ];
  const prog = p(aNong, aLon);
  const glyph = (k: string) => {
    switch (k) {
      case "nha":
        return <div style={{ width: 58, height: 52, background: C.cream, clipPath: "polygon(50% 0%, 100% 42%, 84% 42%, 84% 100%, 16% 100%, 16% 42%, 0% 42%)" }} />;
      case "gao":
        return <div style={{ width: 36, height: 17, borderRadius: "50%", background: C.amber, transform: "rotate(-24deg)", boxShadow: `0 0 22px ${C.amber}` }} />;
      case "nong":
        return <div style={{ width: 84, height: 26, borderRadius: "50%", border: `3px solid ${C.amber}` }} />;
      case "si":
        return <div style={{ width: 46, height: 56, background: C.warn, clipPath: "polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%)" }} />;
      default:
        return <div style={{ width: 58, height: 36, background: `repeating-linear-gradient(180deg, ${C.teal} 0 6px, transparent 6px 16px)` }} />;
    }
  };
  return (
    <Paper>
      <SceneTitle startFrac={aNong} eyebrow="VÒNG KHÉP" title="Gạo · nong · tráng sĩ · ruộng" titleSize={64} />

      {/* vòng mực khép dần từ "một chiếc nong" đến câu kết */}
      <div style={{ position: "absolute", inset: 0 }}>
        <InkDraw d={circleD(Cc.x, Cc.y, R)} startFrac={aNong} endFrac={aLon} stroke={C.amber} strokeWidth={3} />
      </div>

      {/* trung tâm: hạt gạo của nhiều nhà */}
      <div style={{ position: "absolute", left: Cc.x, top: Cc.y, transform: "translate(-50%, -50%)" }}>
        <SpringPop startFrac={aNong} from={0.75}>
          <div style={{ width: 232, height: 232, borderRadius: 999, border: `1px dashed ${C.cream}66`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ fontFamily: FONT.display, fontSize: 32, color: C.amber, lineHeight: 1.5 }}>gạo của<br />nhiều nhà</div>
          </div>
        </SpringPop>
      </div>

      {/* từng mắt xích sáng lên theo mực chạy */}
      {nodes.map((n, i) => {
        const rad = (n.ang * Math.PI) / 180;
        const x = Cc.x + R * Math.cos(rad);
        const y = Cc.y + R * Math.sin(rad);
        const o = 0.18 + 0.82 * p(n.fi - 0.05, n.fi);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", opacity: o, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {glyph(n.key)}
            <div style={{ fontFamily: FONT.body, fontSize: 28, letterSpacing: 1, color: C.cream }}>{n.label}</div>
          </div>
        );
      })}

      {/* caption kết — nguyên văn, giữ đến hết scene */}
      <div style={{ position: "absolute", left: 160, right: 160, bottom: 100, textAlign: "center" }}>
        <Reveal startFrac={aLon} dy={12}>
          <div style={{ fontFamily: FONT.display, fontSize: 44, color: C.amber }}>
            mỗi mùng 9 tháng Tư, cả làng lại cùng lớn lên một lần
          </div>
        </Reveal>
      </div>

      <Dust n={8} />
    </Paper>
  );
};

/** sc068 (s26) — HAI DÒNG KẾT: mực nhạt, khoảng trống, giữ màn thinh lặng tới hết. */
export const Sc068: React.FC<SceneProps> = () => {
  const A = useA();
  const aMinh = A("chưa bao giờ lớn lên một mình");
  const aBoQuen = A("chưa bao giờ bị bỏ quên");
  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 58, textAlign: "center" }}>
        <Reveal startFrac={aMinh} dy={14}>
          <div style={{ fontFamily: FONT.display, fontSize: 62, color: C.cream, opacity: 0.95, width: 1540 }}>
            Vị thần đó chưa bao giờ lớn lên một mình.
          </div>
        </Reveal>
        <Reveal startFrac={aBoQuen} dy={14}>
          <div style={{ fontFamily: FONT.display, fontSize: 62, fontStyle: "italic", color: C.cream, opacity: 0.78, width: 1540 }}>
            …và vì thế, chưa bao giờ bị bỏ quên.
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};
