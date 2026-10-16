// S2E01 son-tinh-thuy-tinh — scenes group "b" (compose worker, spec_b.json)
// Speech-lock: useA() trả FRACTION (0..1) của scene — mọi Reveal/SpringPop/
// InkPath/QuotePlate bắn tại startFrac = A("từ", occ) từ anchors đã verify.
import * as React from "react";
import { Img } from "remotion";
import {
  Paper,
  Reveal,
  SpringPop,
  InkPath,
  Chip,
  SceneTitle,
  SourceTag,
  DossierBadge,
  TimelineTrack,
  QuotePlate,
  plateSrc,
  InkImageScene,
  useA,
  useFrac,
  ease,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const svgFull: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

/* ------------------------------------------------------------------ */
/* sc002 (s01) — BA MẢNH GIẤY PREVIEW (diagram)                        */
/* ------------------------------------------------------------------ */
export const Sc002: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const { frame } = useFrac(d);
  const A = useA(d);
  const atBack = A("đi ngược dòng thời gian");
  const atEnd = A("không bao giờ kết thúc");
  const of = (f: number) => f / d;

  // ba mảnh giấy mờ (preview, chưa rõ chữ) trôi nhẹ theo dòng thời gian
  const cards = [
    { at: atBack, left: 200, top: 400 },
    { at: atBack + of(70), left: 745, top: 320 },
    { at: atBack + of(140), left: 1290, top: 400 },
  ];
  const drift = (at: number) => -Math.min(70, Math.max(0, frame - at * d) * 0.06);

  const cardBox = (i: number): React.CSSProperties => ({
    position: "absolute",
    left: cards[i].left,
    top: cards[i].top,
    width: 430,
    padding: 24,
    border: `2px solid ${C.cream}55`,
    background: "rgba(16,12,7,0.45)",
    borderRadius: 6,
    transform: `translateX(${drift(cards[i].at)}px)`,
  });
  const cardLabel: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: 28,
    color: `${C.cream}cc`,
    marginBottom: 10,
  };

  return (
    <Paper variant="night">
      {/* mảnh 1 — thước nước ba vạch */}
      <div style={cardBox(0)}>
        <Reveal startFrac={cards[0].at} dy={26}>
          <div style={cardLabel}>thước nước · ba vạch</div>
          <svg width={370} height={200} viewBox="0 0 370 200">
            <line x1={60} y1={16} x2={60} y2={182} stroke={`${C.cream}99`} strokeWidth={3} />
            <line x1={60} y1={56} x2={150} y2={56} stroke={`${C.cream}99`} strokeWidth={3} />
            <line x1={60} y1={100} x2={150} y2={100} stroke={`${C.cream}99`} strokeWidth={3} />
            <line x1={60} y1={144} x2={150} y2={144} stroke={C.lampRed} strokeWidth={3} />
            <circle cx={60} cy={144} r={7} fill={C.lampRed} />
          </svg>
        </Reveal>
      </div>

      {/* mảnh 2 — tấm bản đồ giấy dầu cuộn */}
      <div style={cardBox(1)}>
        <Reveal startFrac={cards[1].at} dy={26}>
          <div style={cardLabel}>tấm bản đồ giấy dầu</div>
          <svg width={370} height={200} viewBox="0 0 370 200">
            <rect x={70} y={26} width={230} height={148} fill="none" stroke={`${C.cream}99`} strokeWidth={3} />
            <path d="M 90 58 C 150 88, 210 38, 280 98" fill="none" stroke={`${C.teal}bb`} strokeWidth={3} />
            <path d="M 120 148 q 60 -26 130 6" fill="none" stroke={`${C.cream}77`} strokeWidth={2} />
            <circle cx={62} cy={100} r={13} fill="none" stroke={`${C.cream}99`} strokeWidth={3} />
            <circle cx={308} cy={100} r={13} fill="none" stroke={`${C.cream}99`} strokeWidth={3} />
          </svg>
        </Reveal>
      </div>

      {/* mảnh 3 — hai trang cổ thư */}
      <div style={cardBox(2)}>
        <Reveal startFrac={cards[2].at} dy={26}>
          <div style={cardLabel}>hai trang cổ thư</div>
          <svg width={370} height={200} viewBox="0 0 370 200">
            <rect x={80} y={16} width={100} height={168} fill="none" stroke={`${C.cream}99`} strokeWidth={3} />
            <rect
              x={196}
              y={22}
              width={100}
              height={168}
              fill="none"
              stroke={`${C.cream}66`}
              strokeWidth={2}
              transform="rotate(2 246 106)"
            />
            {[0, 1, 2, 3, 4].map((k) => (
              <line key={`l${k}`} x1={94} y1={48 + k * 28} x2={166} y2={48 + k * 28} stroke={`${C.cream}44`} strokeWidth={2} />
            ))}
            {[0, 1, 2, 3].map((k) => (
              <line key={`r${k}`} x1={211} y1={58 + k * 28} x2={283} y2={58 + k * 28} stroke={`${C.cream}33`} strokeWidth={2} />
            ))}
          </svg>
        </Reveal>
      </div>

      {/* câu hỏi chốt — spring nhẹ rồi hold */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 850, textAlign: "center" }}>
        <Reveal startFrac={Math.max(0.01, atEnd - of(40))} dy={12}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, letterSpacing: 4, color: `${C.cream}aa` }}>
            SƠN TINH · THỦY TINH
          </div>
        </Reveal>
        <SpringPop startFrac={atEnd} from={0.94}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 60,
              color: C.amber,
              marginTop: 14,
              textShadow: "0 2px 18px rgba(0,0,0,0.55)",
            }}
          >
            vì sao cuộc chiến này không bao giờ kết thúc?
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};

/* ------------------------------------------------------------------ */
/* sc008 (s03) — KỂ VÀ ĐỐI THỦ (text_card)                             */
/* ------------------------------------------------------------------ */
export const Sc008: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const { p } = useFrac(d);
  const A = useA(d);
  const aKe = A("kẻ kể");
  const aVe = A("hai trang cổ thư");
  const of = (f: number) => f / d;

  const span = Math.max(0.08, aVe - aKe);
  const q1 = aKe + span * 0.24;
  const q2 = aKe + span * 0.5;
  const fadeOut = 1 - p(0.86, 0.985); // dòng chuyển mờ dần cuối scene

  return (
    <Paper>
      {/* dòng chính — giữ hold */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 320, textAlign: "center" }}>
        <Reveal startFrac={aKe} dy={20}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.white }}>
            kẻ kể, <span style={{ color: C.amber }}>và đối thủ</span>
          </div>
        </Reveal>
        <svg viewBox="0 0 1920 1080" style={svgFull}>
          <InkPath d="M 660 520 q 300 26 600 0" startFrac={aKe + of(18)} stroke={C.amber} strokeWidth={4} />
        </svg>
      </div>

      {/* hai câu hỏi so le */}
      <Reveal startFrac={q1} dy={22} style={{ position: "absolute", left: 300, top: 560 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 46, color: C.white }}>
          Vậy <b>ai</b> đã viết câu chuyện này?
        </div>
      </Reveal>
      <Reveal startFrac={q2} dy={22} style={{ position: "absolute", left: 640, top: 680 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 46, color: C.white }}>
          và khi họ viết, họ thực sự đang kể chuyện <b>gì</b>?
        </div>
      </Reveal>

      {/* dòng chuyển hồi một — mờ dần cuối */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 872, textAlign: "center", opacity: fadeOut }}>
        <Reveal startFrac={aVe} dy={16}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: C.teal }}>
            → về hai trang cổ thư, cách nhau hai thế kỷ
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

/* ------------------------------------------------------------------ */
/* sc014 (s05) — IMAGE PLATE: HAI TRANG ĐỐI DIỆN                       */
/* ------------------------------------------------------------------ */
export const Sc014: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const { p } = useFrac(d);
  const A = useA(d);
  const aDV = A("Đại Việt sử ký toàn thư");
  const aNSL = A("Ngô Sĩ Liên");
  const aHai = A("hai trận đánh");
  const of = (f: number) => f / d;

  // Ken Burns dolly_out nhẹ
  const kb = 1.07 - 0.07 * ease(p(0, 1));
  // hai trang khép về nhau khi đọc "hai trận đánh"
  const close = ease(p(aHai, aHai + of(34)));
  // thẻ 1697 sáng lên khi tên chính sử đọc
  const glow = 0.4 + 0.6 * ease(p(Math.max(0, aDV - of(16)), aDV));

  const panel: React.CSSProperties = {
    width: 700,
    height: 750,
    border: `3px solid ${C.border}`,
    background: C.cream,
    boxShadow: "0 18px 44px rgba(0,0,0,0.30)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          transform: `scale(${kb})`,
        }}
      >
        {/* trang trái — Lĩnh Nam chích quái 1492 */}
        <Reveal startFrac={0.02} dy={26}>
          <div style={{ ...panel, transform: `translateX(${close * 26}px)` }}>
            <Img src={plateSrc("img-05-co-thu-lncq.png")} style={{ width: "100%", height: 634, objectFit: "cover" }} />
            <div style={{ padding: "20px 26px" }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: C.bg }}>
                1492 · Lĩnh Nam chích quái
              </div>
              <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.earthDeep, marginTop: 6 }}>
                Vũ Quỳnh · Kiều Phú biên lại từ bản đời Trần
              </div>
            </div>
          </div>
        </Reveal>

        {/* trang phải — Đại Việt sử ký toàn thư 1697 */}
        <Reveal startFrac={0.02} dy={26}>
          <div
            style={{
              ...panel,
              transform: `translateX(${-close * 26}px)`,
              boxShadow:
                glow > 0.85
                  ? `0 0 ${40 * glow}px rgba(217,164,65,${0.35 * glow}), 0 18px 44px rgba(0,0,0,0.30)`
                  : "0 18px 44px rgba(0,0,0,0.30)",
              borderColor: glow > 0.85 ? C.amber : C.border,
            }}
          >
            <Img src={plateSrc("img-06-co-thu-dvsktt.png")} style={{ width: "100%", height: 634, objectFit: "cover" }} />
            <div style={{ padding: "16px 26px 12px", opacity: glow }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 34, color: C.bg }}>
                1697 · Đại Việt sử ký toàn thư
              </div>
              <Reveal startFrac={aNSL} dy={10}>
                <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.earthDeep, marginTop: 4 }}>
                  bản nội ngoại hiệu chỉnh — Ngô Sĩ Liên soạn gốc 1479
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>

      <DossierBadge text="HAI TRANG CỔ THƯ · ĐỐI DIỆN" />
      <SourceTag text="Lĩnh Nam chích quái 1492 · Đại Việt sử ký toàn thư 1697" right />
    </Paper>
  );
};

/* ------------------------------------------------------------------ */
/* sc020 (s07) — IMAGE PLATE: MÂM LỄ CHÍNH SỬ                          */
/* ------------------------------------------------------------------ */
export const Sc020: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const A = useA(d);
  const aSP = A("chim núi thú rừng"); // "châu báu vàng bạc, chim núi thú rừng"
  const aChot = A("sản vật của rừng núi");
  const of = (f: number) => f / d;
  const cb = Math.max(0.01, aSP - of(34)); // châu báu
  const vb = Math.max(0.01, aSP - of(17)); // vàng bạc
  const cn = aSP; // chim núi
  const tr = aSP + of(17); // thú rừng

  const itemLabel = (text: string, at: number, left: number, top: number) => (
    <SpringPop startFrac={at + of(14)} from={0.75} style={{ position: "absolute", left, top }}>
      <div
        style={{
          fontFamily: FONT.body,
          fontWeight: 500,
          fontSize: 28,
          color: C.cream,
          background: "rgba(12,9,5,0.74)",
          border: `1.5px solid ${C.cream}66`,
          borderRadius: 5,
          padding: "5px 12px",
        }}
      >
        {text}
      </div>
    </SpringPop>
  );

  return (
    <InkImageScene src={plateSrc("img-01-son-tinh.png")} focus={{ x: 0.42, y: 0.5 }}>
      {/* mâm lễ vẽ mực — 4 món theo 4 nhịp đọc */}
      <svg viewBox="0 0 1920 1080" style={svgFull}>
        {/* khay mâm */}
        <InkPath
          d="M 1255 660 a 205 50 0 1 0 410 0 a 205 50 0 1 0 -410 0"
          startFrac={Math.max(0.01, cb - of(24))}
          endFrac={cb + of(18)}
          stroke={C.cream}
          strokeWidth={3}
        />
        {/* châu báu */}
        <InkPath
          d="M 1332 588 l 30 22 l -30 22 l -30 -22 Z M 1332 576 l 0 -12"
          startFrac={cb}
          endFrac={cb + of(18)}
          stroke={C.amber}
          strokeWidth={3}
        />
        {/* thoi vàng bạc */}
        <InkPath
          d="M 1436 574 l 46 22 l -46 22 l -46 -22 Z"
          startFrac={vb}
          endFrac={vb + of(18)}
          stroke={C.amber}
          strokeWidth={3}
        />
        {/* chim núi */}
        <InkPath
          d="M 1530 590 q 16 -32 50 -20 q -12 26 -50 20 Z M 1552 570 l 10 -14"
          startFrac={cn}
          endFrac={cn + of(18)}
          stroke={C.cream}
          strokeWidth={3}
        />
        {/* thú rừng */}
        <InkPath
          d="M 1620 596 l -10 -36 M 1632 592 l 2 -38 M 1620 596 q 28 -8 34 6"
          startFrac={tr}
          endFrac={tr + of(18)}
          stroke={C.cream}
          strokeWidth={3}
        />
      </svg>

      {itemLabel("châu báu", cb, 1266, 668)}
      {itemLabel("vàng bạc", vb, 1396, 636)}
      {itemLabel("chim núi", cn, 1512, 610)}
      {itemLabel("thú rừng", tr, 1612, 624)}

      {/* dòng chốt */}
      <Reveal startFrac={aChot} dy={18} style={{ position: "absolute", left: 0, right: 0, bottom: 84, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 46,
            color: C.white,
            textShadow: "0 2px 16px rgba(0,0,0,0.65)",
          }}
        >
          lễ vật của thần núi là <span style={{ color: C.amber }}>sản vật của rừng núi</span>
        </div>
      </Reveal>

      <SourceTag text="Đại Việt sử ký toàn thư — 'đem các đồ châu báu vàng bạc, chim núi thú rừng đến dâng'" right />
    </InkImageScene>
  );
};

/* ------------------------------------------------------------------ */
/* sc026 (s10) — NHÃN HỒI HAI · MỞ BẢN ĐỒ (text_card)                  */
/* ------------------------------------------------------------------ */
export const Sc026: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const { p } = useFrac(d);
  const A = useA(d);
  const aTitle = A("bản đồ trận địa");
  const aTri = A("trí nhớ");
  const of = (f: number) => f / d;

  // parchment unroll — mép giấy cuộn mở ngang
  const u = ease(p(Math.max(0.01, aTitle - of(30)), aTitle + of(50)));
  const w = 240 + 1360 * u;
  const cx = 960;
  const left = cx - w / 2;

  return (
    <Paper>
      <SceneTitle
        eyebrow="HỒI HAI"
        title="BẢN ĐỒ TRẬN ĐỊA"
        startFrac={aTitle}
        align="center"
        style={{ position: "absolute", left: 0, right: 0, top: 130 }}
      />

      {/* dải giấy cuộn mở ngang */}
      <div
        style={{
          position: "absolute",
          left,
          top: 430,
          width: w,
          height: 320,
          background: "rgba(36,31,26,0.92)",
          border: `3px solid ${C.cream}88`,
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        }}
      />
      <svg viewBox="0 0 1920 1080" style={svgFull}>
        <circle cx={left} cy={590} r={42} fill={C.card} stroke={C.cream} strokeWidth={3} />
        <circle cx={left + w} cy={590} r={42} fill={C.card} stroke={C.cream} strokeWidth={3} />
        {/* nét sông gợi ý — vẽ sau khi mở */}
        <InkPath
          d="M 420 700 C 700 640, 1000 780, 1500 690"
          startFrac={aTitle + of(55)}
          endFrac={aTitle + of(115)}
          stroke={C.teal}
          strokeWidth={3}
        />
        <InkPath
          d="M 560 540 q 300 -30 560 24"
          startFrac={aTitle + of(70)}
          endFrac={aTitle + of(120)}
          stroke={C.mute}
          strokeWidth={2}
        />
      </svg>

      {/* dòng phụ */}
      <Reveal startFrac={aTri} dy={14} style={{ position: "absolute", left: 0, right: 0, top: 840, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 38, color: C.cream }}>
          tấm bản đồ người xưa vẽ bằng trí nhớ — sống sót qua từng mùa nước
        </div>
      </Reveal>
    </Paper>
  );
};

/* ------------------------------------------------------------------ */
/* sc032 (s13) — QUOTE-CARD ĐÁO VỰC                                    */
/* ------------------------------------------------------------------ */
export const Sc032: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const A = useA(d);
  const aV1 = A("đào sâu thành vực thành chằm");
  const aU = A("đánh úp"); // occ 1 — trong trích dẫn
  const aU2 = A("đánh úp", 2); // occ 2 — câu tóm tắt chiến thuật
  const of = (f: number) => f / d;

  // các hố vực/chằm bật dọc dải đúng nhịp vế trích
  const holes = [
    { at: aV1, cx: 430, cy: 742 },
    { at: aV1 + of(13), cx: 760, cy: 765 },
    { at: aV1 + of(26), cx: 1080, cy: 742 },
    { at: aV1 + of(39), cx: 1400, cy: 732 },
  ];

  return (
    <Paper>
      {/* quote nguyên văn — chữ hiện dần như đang đọc */}
      <div style={{ position: "absolute", left: 170, top: 130, width: 1060 }}>
        <QuotePlate
          text="nơi nơi đào sâu thành vực thành chằm, chứa nước để mưu đánh úp"
          startFrac={aV1}
          endFrac={aU + of(25)}
          source="Đại Việt sử ký toàn thư — sách chép"
          size={50}
          maxWidth={960}
        />
      </div>

      {/* dải lộ trình mini + hố vực bật pop */}
      <svg viewBox="0 0 1920 1080" style={svgFull}>
        <InkPath
          d="M 300 750 C 560 720, 760 780, 1020 745 S 1420 730, 1620 755"
          startFrac={Math.max(0.01, aV1 - of(25))}
          endFrac={aV1 + of(30)}
          stroke={C.teal}
          strokeWidth={4}
        />
      </svg>
      {holes.map((h, i) => (
        <SpringPop key={i} startFrac={h.at} from={0.6} style={{ position: "absolute", left: h.cx - 32, top: h.cy - 19 }}>
          <svg width={64} height={38}>
            <ellipse cx={32} cy={19} rx={27} ry={12} fill={`${C.teal}33`} stroke={C.teal} strokeWidth={2.5} />
          </svg>
        </SpringPop>
      ))}
      <Reveal startFrac={aV1 + of(20)} dy={10} style={{ position: "absolute", left: 1580, top: 640, width: 300 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.teal }}>lộ trình · đạo quân nước</div>
      </Reveal>

      {/* ba chip chiến thuật */}
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
        <SpringPop startFrac={Math.max(0.01, aU2 - of(36))} from={0.7}>
          <Chip color={C.teal}>đào vực</Chip>
        </SpringPop>
        <SpringPop startFrac={Math.max(0.01, aU2 - of(18))} from={0.7}>
          <Chip color={C.teal}>tích nước</Chip>
        </SpringPop>
        <SpringPop startFrac={aU2} from={0.7}>
          <Chip color={C.amber} style={{ background: C.amber, color: "#1A1714" }}>
            chờ thời đánh úp
          </Chip>
        </SpringPop>
      </div>

      <SourceTag text="Đại Việt sử ký toàn thư" />
    </Paper>
  );
};

/* ------------------------------------------------------------------ */
/* sc038 (s16) — NHÃN HỒI BA + MỐC 1108 (text_card)                    */
/* ------------------------------------------------------------------ */
export const Sc038: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const { p } = useFrac(d);
  const A = useA(d);
  const aH = A("Sơn Tinh đi làm mỗi ngày");
  const aDe = A("đê Cơ Xá");
  const of = (f: number) => f / d;

  const subAt = aH + (aDe - aH) * 0.45;

  // timeline chạy từ trái, chạm mốc 1108 đúng nhịp đọc
  const run1 = ease(p(aH + of(25), aDe));
  const run2 = ease(p(aDe, aDe + of(30)));
  const progress = 0.62 * run1 + 0.38 * run2;

  return (
    <Paper>
      <SceneTitle
        eyebrow="HỒI BA"
        title="SƠN TINH ĐI LÀM MỖI NGÀY"
        startFrac={aH}
        align="center"
        style={{ position: "absolute", left: 0, right: 0, top: 150 }}
      />

      {/* sub nhỏ — đổi loại văn bản */}
      <Reveal startFrac={subAt} dy={12} style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 36, color: C.mute }}>
          rời cổ thư — sang một loại văn bản khác hẳn:{" "}
          <b style={{ color: C.cream }}>chính sử về đê</b>
        </div>
      </Reveal>

      {/* timeline mảnh */}
      <TimelineTrack progress={progress} y={872} marks={[{ at: 0.62, year: "1108", lit: true }]} />

      {/* mốc 1108 · đê Cơ Xá */}
      <SpringPop startFrac={aDe} from={0.7} style={{ position: "absolute", left: 953, top: 792, width: 360, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 46, color: C.white }}>
          1108 · đê Cơ Xá
        </div>
      </SpringPop>
      <Reveal startFrac={aDe + of(35)} dy={10} style={{ position: "absolute", left: 0, right: 0, top: 962, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute }}>
          một đoạn đê, đắp để che chắn cho kinh thành Thăng Long — chưa phải hệ thống, chưa phải hai bờ
        </div>
      </Reveal>
    </Paper>
  );
};

/* ------------------------------------------------------------------ */
/* sc044 (s19) — MẶT CẮT ĐÊ: CHỮ KÝ CHỒNG CHỮ KÝ (diagram)            */
/* ------------------------------------------------------------------ */
export const Sc044: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const A = useA(d);
  const aMC = A("mặt cắt");
  const aCK = A("chữ ký chồng chữ ký");
  const aCT = A("như cấy lúa, như đón Tết");
  const of = (f: number) => f / d;

  // ba vế mở rộng chia đều giữa "mặt cắt" và "chữ ký chồng chữ ký"
  const span = Math.max(0.08, aCK - aMC);
  const v1 = aMC + span * 0.3; // một đoạn đất quanh một kinh thành
  const v2 = aMC + span * 0.5; // hai bờ sông nối từ đầu nguồn ra cửa biển
  const v3 = aMC + span * 0.7; // mỗi thế hệ đắp thêm, nâng thêm, nối thêm

  return (
    <Paper>
      <svg viewBox="0 0 1920 1080" style={svgFull}>
        {/* khung mặt cắt đê */}
        <InkPath d="M 470 800 L 740 470 L 1180 470 L 1450 800" startFrac={aMC} endFrac={aMC + of(55)} stroke={C.cream} strokeWidth={4} />
        {/* ba lớp đất nện chồng theo ba vế */}
        <InkPath d="M 545 705 q 210 -34 370 -10" startFrac={v1} endFrac={v1 + of(30)} stroke={C.cream} strokeWidth={2.5} />
        <InkPath d="M 620 615 q 250 -28 440 -8" startFrac={v2} endFrac={v2 + of(30)} stroke={C.teal} strokeWidth={2.5} />
        <InkPath d="M 700 532 q 210 -26 350 -6" startFrac={v3} endFrac={v3 + of(30)} stroke={C.cream} strokeWidth={2.5} />
        {/* bút tích son đè lên từng lớp */}
        <InkPath d="M 600 690 l 16 -10 l 14 10 l 16 -10 l 14 10 l 12 -7" startFrac={aCK} endFrac={aCK + of(14)} stroke={C.lampRed} strokeWidth={2.5} />
        <InkPath d="M 680 600 l 14 -10 l 12 10 l 16 -10 l 12 10" startFrac={aCK + of(14)} endFrac={aCK + of(28)} stroke={C.lampRed} strokeWidth={2.5} />
        <InkPath d="M 750 518 l 14 -10 l 12 10 l 16 -10 l 12 10" startFrac={aCK + of(28)} endFrac={aCK + of(42)} stroke={C.lampRed} strokeWidth={2.5} />
      </svg>

      {/* nhãn khối */}
      <Reveal startFrac={aMC + of(10)} dy={12} style={{ position: "absolute", left: 1560, top: 430, width: 300 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, lineHeight: 1.5 }}>
          mặt cắt đê —<br />
          chiều cao = tờ giấy<br />
          chữ ký chồng chữ ký
        </div>
      </Reveal>

      {/* chip nối triều đại */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 170, display: "flex", justifyContent: "center" }}>
        <SpringPop startFrac={aCK + of(55)} from={0.75}>
          <Chip color={C.amber}>đời này tiếp đời trước · triều này nối triều kia</Chip>
        </SpringPop>
      </div>

      {/* dòng phụ khép */}
      <Reveal startFrac={aCT} dy={14} style={{ position: "absolute", left: 0, right: 0, bottom: 84, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.white }}>
          đắp đê: một nhịp sống thường —{" "}
          <span style={{ color: C.amber }}>như cấy lúa, như đón Tết</span>
        </div>
      </Reveal>
    </Paper>
  );
};

/* ------------------------------------------------------------------ */
/* sc050 (s22) — HỢP ĐỒNG MỖI MÙA KÝ LẠI (diagram)                     */
/* ------------------------------------------------------------------ */
export const Sc050: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const A = useA(d);
  const aHD = A("hợp đồng lâu dài");
  const aKy = A("mỗi mùa, hai bên ký lại");
  const aTN = A("giữ phần dâng trào");
  const of = (f: number) => f / d;

  const sealAt = [aKy + of(50), aKy + of(95), aKy + of(140), aKy + of(185)];
  const sealLabel = ["I", "II", "III", "IV"];

  return (
    <Paper>
      {/* nhãn hợp đồng */}
      <Reveal startFrac={aHD} dy={16} style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: C.white }}>
          bản hợp đồng ẩn: <span style={{ color: C.amber }}>lâu dài giữa người và sông</span>
        </div>
      </Reveal>

      {/* tờ sớ */}
      <Reveal startFrac={aHD + of(8)} dy={22} style={{ position: "absolute", left: 510, top: 300 }}>
        <div
          style={{
            width: 900,
            height: 360,
            background: C.cream,
            border: `3px solid ${C.earthDeep}`,
            boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
          }}
        />
      </Reveal>

      <svg viewBox="0 0 1920 1080" style={svgFull}>
        {/* bên nước — sóng (ngoài tờ, nền tối) */}
        <InkPath d="M 300 420 q 26 -18 52 0 q 26 18 52 0" startFrac={aHD + of(20)} stroke={C.teal} strokeWidth={3} />
        <InkPath d="M 300 452 q 26 -18 52 0 q 26 18 52 0" startFrac={aHD + of(28)} stroke={C.teal} strokeWidth={3} />
        <InkPath d="M 300 484 q 26 -18 52 0 q 26 18 52 0" startFrac={aHD + of(36)} stroke={C.teal} strokeWidth={3} />
        {/* bên người — thửa đất + thước đo (ngoài tờ phải) */}
        <InkPath
          d="M 1470 420 h 120 v 90 h -120 Z M 1510 420 v 90 M 1550 420 v 90"
          startFrac={aHD + of(28)}
          stroke={C.cream}
          strokeWidth={2.5}
        />
        <InkPath
          d="M 1450 562 h 160 M 1490 554 v 16 M 1530 554 v 16 M 1570 554 v 16"
          startFrac={aHD + of(40)}
          stroke={C.cream}
          strokeWidth={2.5}
        />
        {/* hai bàn tay mực ký trên tờ */}
        <InkPath
          d="M 380 566 l 18 -12 l 16 12 l 18 -12 l 16 12 l 14 -8 M 356 552 q 26 -22 54 -6"
          startFrac={aKy}
          stroke={C.earthDeep}
          strokeWidth={3}
        />
        <InkPath
          d="M 1300 566 l 18 -12 l 16 12 l 18 -12 l 16 12 l 14 -8 M 1276 552 q 26 -22 54 -6"
          startFrac={aKy + of(18)}
          stroke={C.earthDeep}
          strokeWidth={3}
        />
      </svg>

      {/* hai vế đối xứng */}
      <Reveal startFrac={aTN} dy={16} style={{ position: "absolute", left: 220, top: 758 }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 40,
            color: C.teal,
            borderLeft: `5px solid ${C.teal}`,
            paddingLeft: 20,
          }}
        >
          bên nước giữ phần dâng trào
        </div>
      </Reveal>
      <Reveal startFrac={aTN + of(75)} dy={16} style={{ position: "absolute", left: 1180, top: 838 }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 40,
            color: C.white,
            borderLeft: `5px solid ${C.amber}`,
            paddingLeft: 20,
          }}
        >
          bên người giữ phần nâng đỡ
        </div>
      </Reveal>

      {/* chuỗi con dấu rơi theo mùa */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 742,
          display: "flex",
          justifyContent: "center",
          gap: 26,
        }}
      >
        {sealAt.map((s, i) => (
          <Reveal key={i} startFrac={s} dy={-34}>
            <div
              style={{
                width: 40,
                height: 40,
                border: `3px solid ${C.lampRed}`,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 20,
                color: C.lampRed,
                transform: "rotate(-4deg)",
              }}
            >
              {sealLabel[i]}
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal startFrac={aKy + of(65)} dy={10} style={{ position: "absolute", left: 0, right: 0, top: 986, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute }}>
          con dấu ký lại — mỗi mùa một lần
        </div>
      </Reveal>
    </Paper>
  );
};

/* ------------------------------------------------------------------ */
/* sc056 (s25) — IMAGE PLATE: ĐÊM 13, THUYỀN ĐUỐC RƯỚC NƯỚC THIÊNG     */
/* ------------------------------------------------------------------ */
export const Sc056: React.FC<SceneProps> = ({ durationInFrames: d }) => {
  const A = useA(d);
  const aNgay = A("13 đến ngày 15 tháng Giêng");
  const aThuyen = A("rước thuyền ra giữa sông Đà");
  const aNuoc = A("lấy nước thiêng");
  const of = (f: number) => f / d;
  const aKe = aNuoc + of(290); // "Kẻ thua trong truyện trở thành khách mời đầu tiên…"

  return (
    <InkImageScene src={plateSrc("img-13-le-hoi.png")} focus={{ x: 0.62, y: 0.45 }}>
      {/* nhãn lễ hội — pop đúng nhịp câu mở */}
      <SpringPop startFrac={aNgay} from={0.92} style={{ position: "absolute", left: 0, right: 0, top: 104, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 52,
            color: C.white,
            letterSpacing: 2,
            textShadow: "0 2px 22px rgba(0,0,0,0.75)",
          }}
        >
          13 – 15 tháng Giêng · lễ hội đền Tản Viên
        </div>
      </SpringPop>

      {/* nghi thức đêm 13 */}
      <Reveal startFrac={aThuyen} dy={14} style={{ position: "absolute", left: 130, top: 260 }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 32,
            color: C.cream,
            background: "rgba(12,9,5,0.74)",
            border: `1.5px solid ${C.cream}66`,
            borderRadius: 6,
            padding: "10px 18px",
          }}
        >
          ĐÊM 13 · thuyền đuốc ra giữa sông Đà
        </div>
      </Reveal>
      <Reveal startFrac={aNuoc} dy={14} style={{ position: "absolute", right: 130, top: 820 }}>
        <div
          style={{
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 32,
            color: C.cream,
            background: "rgba(12,9,5,0.74)",
            border: `1.5px solid ${C.amber}88`,
            borderRadius: 6,
            padding: "10px 18px",
          }}
        >
          lấy nước thiêng — mộc dục về đền
        </div>
      </Reveal>

      {/* dòng chú — khách mời đầu tiên */}
      <Reveal startFrac={aKe} dy={18} style={{ position: "absolute", left: 0, right: 0, bottom: 96, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 46,
            color: C.amber,
            textShadow: "0 2px 18px rgba(0,0,0,0.7)",
          }}
        >
          Kẻ thua trở thành khách mời đầu tiên — của lễ hội kẻ thắng
        </div>
      </Reveal>

      <SourceTag text="lễ hội đền Tản Viên · sông Đà" right />
    </InkImageScene>
  );
};
