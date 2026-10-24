// S2E03 chu-dong-tu — scenes group "f" (compose worker, spec_f.json).
// Speech-lock: A("cụm") trả frac thô theo scene; mọi beat bắn đúng nhịp đọc.
import * as React from "react";
import { AbsoluteFill } from "remotion";
import {
  Paper,
  Reveal,
  SpringPop,
  InkPath,
  InkDraw,
  circleD,
  SceneTitle,
  TextCard,
  InkImageScene,
  Lamp,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

/** sc053 (s26) — SƠ ĐỒ LỚP KỂ CHỒNG GIẤY: giáo dục → biên soạn → chức sắc → du lịch. */
export const Sc053: React.FC<SceneProps> = () => {
  const A = useA();
  const fTitle = A("lớp nào là lịch sử");
  const fGd = A("không lớp nào là lịch sử kỹ");
  const fBien = A("lớp biên soạn ghi tư liệu");
  const fChuc = A("lớp chức sắc ghi nghi thức");
  const fDuLich = A("lớp du lịch ghi lịch hội");
  const fQuy = A("Lớp nào cũng đáng quý");
  const fFoot = A("không lớp nào là lịch sử kỹ thuật");
  const layer = (
    id: string,
    sf: number,
    top: number,
    left: number,
    w: number,
    rot: number,
    name: string,
    rec: string,
    tone: string
  ) => (
    <div
      key={id}
      data-cue={id}
      style={{ position: "absolute", left, top, width: w, transform: `rotate(${rot}deg)` }}
    >
      <Reveal startFrac={sf} dy={26}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            background: "rgba(232,220,200,0.93)",
            border: `2px solid ${tone}`,
            borderRadius: 6,
            padding: "20px 34px",
            boxShadow: "0 14px 34px rgba(0,0,0,0.55)",
          }}
        >
          <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: "#2A241C" }}>{name}</span>
          <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 30, color: "#4A3F30" }}>ghi {rec}</span>
        </div>
      </Reveal>
    </div>
  );
  return (
    <Paper variant="myth">
      <div style={{ position: "absolute", left: 160, top: 84, height: 160 }}>
        <SceneTitle
          eyebrow="HỒ KỂ CHỒNG GIẤY"
          title="Mỗi lớp kể ghi một điều nó muốn nhớ"
          titleSize={64}
          maxWidth={1600}
          startFrac={fTitle}
        />
      </div>
      {layer("sc053-giao-duc", fGd, 330, 460, 1000, -2, "giáo dục", "bài học", C.teal)}
      {layer("sc053-bien-soan", fBien, 460, 400, 1080, 1.5, "biên soạn", "tư liệu", C.amber)}
      {layer("sc053-chuc-sac", fChuc, 590, 470, 1010, -1, "chức sắc", "nghi thức", C.bronze)}
      {layer("sc053-du-lich", fDuLich, 720, 430, 1060, 2, "du lịch", "lịch hội", C.earthGlow)}
      <Reveal startFrac={fQuy} style={{ position: "absolute", left: 0, right: 0, top: 852, textAlign: "center" }}>
        <div data-cue="sc053-quy" style={{ display: "inline-block", fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 2, color: C.cream, background: "rgba(20,17,13,0.78)", padding: "10px 28px", borderRadius: 999, border: `2px solid ${C.amber}` }}>
          Lớp nào cũng đáng quý.
        </div>
      </Reveal>
      <Reveal startFrac={fFoot} style={{ position: "absolute", left: 0, right: 0, top: 936, textAlign: "center" }}>
        <div data-cue="sc053-foot" style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: C.teal, background: "rgba(20,17,13,0.8)", display: "inline-block", padding: "8px 24px", borderRadius: 8 }}>
          nhưng không lớp nào là lịch sử kỹ thuật
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc054 (s27) — BA VÒNG SÓNG «VẪN»: thuyền — đền — người kể, ripple theo nhịp đọc. */
export const Sc054: React.FC<SceneProps> = () => {
  const A = useA();
  const fTitle = A("người Việt vẫn rước nước");
  const fR1 = A("vẫn rước nước");
  const fR2 = A("Vẫn ghé đền");
  const fR3 = A("kể lại");
  const ring = (id: string, sf: number, cx: number, icon: React.ReactNode, cap: string) => (
    <div key={id} data-cue={id} style={{ position: "absolute", left: cx - 260, top: 380, width: 520, textAlign: "center" }}>
      <svg width="520" height="330" viewBox="0 0 520 330" fill="none" style={{ overflow: "visible" }}>
        <InkPath d={circleD(260, 165, 120)} startFrac={sf} endFrac={sf + 0.1} stroke={C.amber} strokeWidth={5} />
        <InkPath d={circleD(260, 165, 170)} startFrac={sf + 0.02} endFrac={sf + 0.14} stroke={C.amber} strokeWidth={3} style={{ opacity: 0.6 }} />
        <InkPath d={circleD(260, 165, 215)} startFrac={sf + 0.04} endFrac={sf + 0.18} stroke={C.amber} strokeWidth={2} style={{ opacity: 0.35 }} />
        <g opacity={0.9}>{icon}</g>
      </svg>
      <Reveal startFrac={sf + 0.02}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.cream, background: "rgba(20,17,13,0.78)", display: "inline-block", padding: "8px 22px", borderRadius: 8, marginTop: 6 }}>
          {cap}
        </div>
      </Reveal>
    </div>
  );
  return (
    <Paper variant="myth">
      <div style={{ position: "absolute", inset: 0, opacity: 0.16, background: "linear-gradient(to bottom, rgba(232,220,200,0) 55%, rgba(232,220,200,0.5) 100%)" }} />
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: 0.28 }}>
        <path d="M 0 620 Q 240 600 480 620 T 960 620 T 1440 620 T 1920 620" stroke={C.cream} strokeWidth="3" fill="none" />
        <path d="M 0 760 Q 240 740 480 760 T 960 760 T 1440 760 T 1920 760" stroke={C.cream} strokeWidth="2" fill="none" />
        <path d="M 0 880 Q 240 862 480 880 T 960 880 T 1440 880 T 1920 880" stroke={C.cream} strokeWidth="2" fill="none" opacity="0.6" />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 84, height: 160, textAlign: "center" }}>
        <SceneTitle eyebrow="NHỮNG ĐIỀU TA BIẾT RÕ LẮM" title="Vẫn — đều đặn, mỗi kỳ hội" titleSize={64} align="center" startFrac={fTitle} />
      </div>
      {ring("sc054-r1", fR1, 480, (
        <g transform="translate(260 165)">
          <path d="M -74 28 L 74 28 L 52 54 L -52 54 Z" stroke={C.cream} strokeWidth="4" fill="rgba(36,31,26,0.8)" />
          <path d="M 0 24 L 0 -44 L 58 -12 L 0 12" stroke={C.amber} strokeWidth="4" fill="rgba(217,164,65,0.14)" />
          <path d="M -96 24 Q -78 8 -60 24 M 60 24 Q 78 8 96 24" stroke={C.cream} strokeWidth="3" fill="none" opacity="0.7" />
        </g>
      ), "vẫn rước nước")}
      {ring("sc054-r2", fR2, 960, (
        <g transform="translate(260 168)">
          <path d="M -80 40 L 80 40 L 80 8 L 40 8 L 40 -18 L -40 -18 L -40 8 L -80 8 Z" stroke={C.cream} strokeWidth="4" fill="rgba(36,31,26,0.8)" />
          <path d="M -96 -18 L 0 -66 L 96 -18" stroke={C.amber} strokeWidth="4" fill="rgba(217,164,65,0.14)" />
          <path d="M -40 40 L -40 8 M 40 40 L 40 8" stroke={C.cream} strokeWidth="3" opacity="0.7" />
        </g>
      ), "vẫn ghé đền")}
      {ring("sc054-r3", fR3, 1440, (
        <g transform="translate(260 165)">
          <circle cx="0" cy="-34" r="18" stroke={C.cream} strokeWidth="4" fill="rgba(36,31,26,0.8)" />
          <path d="M -20 -14 Q -26 22 -16 52 M 20 -14 Q 26 22 16 52 M -22 6 Q 0 16 22 6" stroke={C.cream} strokeWidth="4" fill="none" />
          <path d="M 44 -58 Q 70 -70 92 -52" stroke={C.amber} strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="98" cy="-50" r="4" fill={C.amber} /><circle cx="110" cy="-44" r="3" fill={C.amber} opacity="0.7" />
        </g>
      ), "vẫn kể lại")}
      <Reveal startFrac={fR3 + 0.06} style={{ position: "absolute", left: 0, right: 0, top: 950, textAlign: "center" }}>
        <div data-cue="sc054-note" style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute, background: "rgba(20,17,13,0.78)", display: "inline-block", padding: "8px 24px", borderRadius: 8 }}>
          dù chỉ thành tiếng thì thầm
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc055 (s27) — CHỖ THỜ KẺ NGHÈO NHẤT XÓM BÃI: góc đền + ô thờ nhỏ, dòng teal. */
export const Sc055: React.FC<SceneProps> = () => {
  const A = useA();
  const fNiche = A("dành một chỗ thờ cho kẻ nghèo nhất xóm bãi");
  const fTeal = A("cách truyện ấy nhìn người nghèo");
  return (
    <Paper variant="night">
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="sc055-corner" cx="0.68" cy="0.55" r="0.55">
            <stop offset="0%" stopColor="rgba(242,180,92,0.16)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#sc055-corner)" />
        <InkPath d="M 1100 980 L 1120 520 Q 1400 380 1680 520 L 1700 980" startFrac={A("cho kẻ nghèo nhất xóm bãi")} endFrac={fNiche} stroke={C.cream} strokeWidth={5} style={{ opacity: 0.55 }} />
        <InkPath d="M 1180 980 L 1196 560 Q 1400 452 1604 560 L 1620 980" startFrac={A("vẫn dành một chỗ thờ")} endFrac={fNiche} stroke={C.cream} strokeWidth={4} style={{ opacity: 0.35 }} />
        <InkPath d="M 1236 640 Q 1400 560 1564 640" startFrac={A("cách truyện ấy nhìn người nghèo")} endFrac={fNiche} stroke={C.amber} strokeWidth={4} style={{ opacity: 0.6 }} />
        <InkDraw d="M 1180 700 Q 1400 600 1620 700" startFrac={fNiche} endFrac={fNiche + 0.1} stroke={C.amber} strokeWidth={6} />
      </svg>
      <div data-cue="sc055-niche" style={{ position: "absolute", left: 1300, top: 720, width: 420 }}>
        <SpringPop startFrac={fNiche} from={0.85}>
          <div style={{ background: "rgba(20,17,13,0.9)", border: `3px solid ${C.amber}`, borderRadius: 10, padding: "30px 34px", boxShadow: "0 0 56px rgba(217,164,65,0.22)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <svg width="150" height="110" viewBox="0 0 150 110" fill="none">
                <path d="M 20 100 L 130 100 L 130 88 L 110 88 L 110 34 Q 75 14 40 34 L 40 88 L 20 88 Z" stroke={C.amber} strokeWidth="4" fill="rgba(217,164,65,0.1)" />
                <path d="M 75 46 Q 66 62 75 74 Q 84 62 75 46 Z" fill={C.lampGlow} opacity={0.9} />
              </svg>
            </div>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, lineHeight: 1.35, color: C.cream, textAlign: "center" }}>
              chỗ thờ cho kẻ nghèo nhất xóm bãi
            </div>
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={fTeal} style={{ position: "absolute", left: 0, right: 0, top: 940, textAlign: "center" }}>
        <div data-cue="sc055-teal" style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, color: C.teal, background: "rgba(20,17,13,0.82)", display: "inline-block", padding: "10px 28px", borderRadius: 8, border: `2px solid ${C.teal}66` }}>
          không phải vì thần tích — mà vì cách truyện ấy nhìn người nghèo
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc056 (s27) — CHỮ TAN VÀO MẶT NƯỚC: «còn người kể, và còn người nghe» dissolve. */
export const Sc056: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fSure = A("Chắc chắn, không phải vì phép màu");
  const fLine = A("còn người kể, và còn người nghe");
  const s0 = fLine * dur;
  const fadeT = Math.max(0, Math.min(1, (frame - (s0 + 74)) / 100));
  const blur = fadeT * 26;
  const dy = fadeT * 90;
  return (
    <Paper variant="night">
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
        <path d="M 0 520 Q 160 500 320 520 T 640 520 T 960 520 T 1280 520 T 1600 520 T 1920 520" stroke={C.cream} strokeWidth="3" fill="none" />
        <path d="M 0 660 Q 160 640 320 660 T 640 660 T 960 660 T 1280 660 T 1600 660 T 1920 660" stroke={C.cream} strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M 0 800 Q 160 782 320 800 T 640 800 T 960 800 T 1280 800 T 1600 800 T 1920 800" stroke={C.cream} strokeWidth="2" fill="none" opacity="0.45" />
        <path d="M 0 920 Q 160 904 320 920 T 640 920 T 960 920 T 1280 920 T 1600 920 T 1920 920" stroke={C.cream} strokeWidth="2" fill="none" opacity="0.3" />
      </svg>
      <div style={{ position: "absolute", inset: 0, opacity: 0.12, background: "linear-gradient(to bottom, rgba(232,220,200,0) 45%, rgba(232,220,200,0.55) 100%)" }} />
      <Reveal startFrac={fSure} style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center" }}>
        <div data-cue="sc056-sure" style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, letterSpacing: 1, color: C.mute, background: "rgba(20,17,13,0.78)", display: "inline-block", padding: "8px 24px", borderRadius: 8 }}>
          không phải vì phép màu
        </div>
      </Reveal>
      <div
        data-cue="sc056-line"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 580,
          textAlign: "center",
          opacity: frame < s0 ? 0 : 1 - fadeT,
          filter: `blur(${blur}px)`,
          transform: `translateY(${dy}px)`,
        }}
      >
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, lineHeight: 1.2, color: C.cream, textShadow: "0 2px 16px rgba(0,0,0,0.8)" }}>
          còn người kể,
          <br />
          và còn người nghe
        </div>
      </div>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: fadeT * 0.5 }}>
        <circle cx="960" cy="640" r={30 + fadeT * 260} stroke={C.amber} strokeWidth="3" fill="none" opacity={0.5} />
        <circle cx="960" cy="640" r={20 + fadeT * 170} stroke={C.cream} strokeWidth="2" fill="none" opacity={0.4} />
        <circle cx="960" cy="640" r={12 + fadeT * 90} stroke={C.cream} strokeWidth="2" fill="none" opacity={0.3} />
      </svg>
    </Paper>
  );
};

/** sc057 (s28) — TỨ BẤT TỬ — BỐN CHÂN ĐÈN: ba sáng tuần tự, chân tư giữ tối. */
export const Sc057: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fTu = A("Tứ bất tử");
  const fDaKe = A("tôi đã kể ba");
  const fCon = A("còn ở lại với đất nước này");
  const litF = (sf: number): number => Math.max(0, Math.min(1, (frame - sf * dur) / 18));
  const positions = [
    { x: 360, y: 700, label: "Tản Viên", occ: 1 },
    { x: 800, y: 700, label: "Phù Đổng", occ: 2 },
    { x: 1240, y: 700, label: "Chử Đồng Tử", occ: 3 },
  ];
  return (
    <Paper variant="night">
      <div style={{ position: "absolute", left: 0, right: 0, top: 84, height: 160, textAlign: "center" }}>
        <SceneTitle eyebrow="TRƯỚC KHI BẠN ĐI" title="Tứ bất tử — tối nay đã kể ba" titleSize={64} accent={C.amber} align="center" startFrac={fTu} />
      </div>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1="160" y1="700" x2="1760" y2="700" stroke={C.border} strokeWidth="5" opacity={0.7} />
        {positions.map((p) => (
          <Lamp key={p.label} x={p.x} y={p.y} scale={1.5} lit={p.occ === 1 ? litF(fDaKe) : p.occ === 2 ? litF(fDaKe + 0.04) : litF(fDaKe + 0.08)} pulse={frame * 0.04 + p.occ} />
        ))}
        <Lamp x={1680} y={700} scale={1.5} lit={0} />
      </svg>
      <div style={{ position: "absolute", left: 360 - 160, top: 750, width: 320, textAlign: "center" }}>
        <Reveal startFrac={fDaKe + 0.02}><div data-cue="sc057-l1" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.cream }}>Tản Viên</div></Reveal>
      </div>
      <div style={{ position: "absolute", left: 800 - 160, top: 750, width: 320, textAlign: "center" }}>
        <Reveal startFrac={fDaKe + 0.06}><div data-cue="sc057-l2" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.cream }}>Phù Đổng</div></Reveal>
      </div>
      <div style={{ position: "absolute", left: 1240 - 160, top: 750, width: 320, textAlign: "center" }}>
        <Reveal startFrac={fDaKe + 0.1}><div data-cue="sc057-l3" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.cream }}>Chử Đồng Tử</div></Reveal>
      </div>
      <div style={{ position: "absolute", left: 1680 - 160, top: 750, width: 320, textAlign: "center", opacity: 0.55 }}>
        <div data-cue="sc057-l4" style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.mute }}>— chưa kể —</div>
      </div>
      <Reveal startFrac={fCon} style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center" }}>
        <div data-cue="sc057-con" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 48, color: C.lampGlow, background: "rgba(20,17,13,0.8)", display: "inline-block", padding: "10px 32px", borderRadius: 8, border: `2px solid ${C.amber}55` }}>
          Còn một người.
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc058 (s28) — MỘT NGƯỜI PHỤ NỮ — BÓNG MỰC: ảnh img-14 tái dùng + caption «còn một người». */
export const Sc058: React.FC<SceneProps> = () => {
  const A = useA();
  const fCap = A("Còn một người");
  const fSub = A("Còn một người");
  return (
    <InkImageScene
      src="img-14-bon-chan-den.png"
      focus={{ x: 0.62, y: 0.42 }}
      label="còn một người"
      sublabel="một người phụ nữ — không tên, chưa kể"
      labelStartFrac={fCap}
      sublabelStartFrac={fSub}
      labelPos="bottom-right"
    />
  );
};

/** sc059 (s28) — HẸN TẬP SAU — KHÔNG TÊN: tease card, KHÔNG tên nhân vật. */
export const Sc059: React.FC<SceneProps> = () => {
  const A = useA();
  const fQ = A("Vì sao");
  const fHen = A("Hẹn bạn ở tập sau");
  const fTease = A("tự mình viết lại nhân dạng của truyện");
  return (
    <TextCard accent={C.amber} startFrac={fQ} titleSize={76} maxWidth={1560}>
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <Reveal startFrac={fQ}>
          <div data-cue="sc059-q" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.white }}>Vì sao?</div>
        </Reveal>
        <Reveal startFrac={fHen} endFrac={fHen + 0.08}>
          <div data-cue="sc059-hen" style={{ marginTop: 44, fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.cream }}>
            Hẹn bạn ở tập sau
          </div>
        </Reveal>
        <Reveal startFrac={fTease}>
          <div data-cue="sc059-tease" style={{ marginTop: 30, fontFamily: FONT.body, fontWeight: 500, fontSize: 36, lineHeight: 1.5, color: C.teal }}>
            nơi một người phụ nữ bị viết là giáng trần,
            <br />
            rồi tự mình viết lại nhân dạng của truyện
          </div>
        </Reveal>
      </div>
    </TextCard>
  );
};

/** sc060 (s29) — THẺ SERIES: «Những vị thần ở lại» + mark mực ấm. */
export const Sc060: React.FC<SceneProps> = () => {
  const A = useA();
  const fSeries = A("mỗi tập, một truyền thuyết");
  const fFmt = A("một truyền thuyết, một bằng chứng thật");
  return (
    <TextCard accent={C.amber} startFrac={fSeries} titleSize={72} maxWidth={1500}>
      <div style={{ textAlign: "center" }}>
        <Reveal startFrac={fSeries}>
          <div data-cue="sc060-mark" style={{ margin: "0 auto 26px", width: 96 }}>
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
              <path d="M 48 8 L 56 38 L 86 30 L 64 52 L 86 74 L 56 66 L 48 96 L 40 66 L 10 74 L 32 52 L 10 30 L 40 38 Z" stroke={C.lampGlow} strokeWidth="3.5" fill="rgba(242,180,92,0.14)" />
              <circle cx="48" cy="52" r="10" fill={C.lampGlow} />
            </svg>
          </div>
        </Reveal>
        <Reveal startFrac={fSeries + 0.03} endFrac={fSeries + 0.1}>
          <div data-cue="sc060-series" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 76, color: C.white }}>
            Những vị thần ở lại
          </div>
        </Reveal>
        <Reveal startFrac={fFmt}>
          <div data-cue="sc060-fmt" style={{ marginTop: 32, fontFamily: FONT.body, fontWeight: 500, fontSize: 38, letterSpacing: 1, color: C.cream }}>
            mỗi tập, một truyền thuyết · một bằng chứng thật
          </div>
        </Reveal>
      </div>
    </TextCard>
  );
};

/** sc061 (s30) — CARD NGUỒN: liệt kê tĩnh, chỉ fade-in đầu scene. */
export const Sc061: React.FC<SceneProps> = () => {
  const A = useA();
  const fIn = A("Tất cả những gì tôi kể tối nay đều có nguồn");
  const rows = [
    "Lĩnh Nam chích quái (bản dịch)",
    "Phan Kế Bính — Việt Nam phong tục (Wikisource)",
    "Bảo tàng Lịch sử quốc gia",
    "Cổng du lịch & Cổng hành chính Hưng Yên",
    "VnDoc",
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "rgba(20,17,13,0.82)", border: `2px solid ${C.border}`, borderRadius: 14, padding: "56px 88px", maxWidth: 1440 }}>
          <Reveal startFrac={fIn} endFrac={fIn + 0.06}>
            <div style={{ fontFamily: FONT.mono, fontSize: 30, letterSpacing: 4, color: C.amber, textTransform: "uppercase", marginBottom: 30 }}>Nguồn</div>
          </Reveal>
          {rows.map((r, i) => (
            <Reveal key={r} startFrac={fIn + 0.02 + i * 0.012} endFrac={fIn + 0.08 + i * 0.012} dy={12}>
              <div data-cue={`sc061-src-${i + 1}`} style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 34, lineHeight: 1.75, color: C.cream }}>
                {r}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Paper>
  );
};

/** sc062 (s31) — DÒNG NƯỚC KHÉP TẬP: vệt vật thể của tập tan dần, nước chảy ra mép phải. */
export const Sc062: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const fStart = A("cưới nó chảy tiếp, như dòng nước");
  const fChay = A("nó chảy tiếp, như dòng nước được rước mỗi năm");
  const flow = (Math.sin(frame * 0.05) * 8).toFixed(1);
  const items = [
    { name: "khố", dx: 200 },
    { name: "màn che", dx: 420 },
    { name: "chợ", dx: 640 },
    { name: "gậy", dx: 860 },
    { name: "nón", dx: 1080 },
    { name: "đầm", dx: 1300 },
    { name: "đền", dx: 1520 },
  ];
  const drift = ((frame - fChay * dur) / Math.max(1, dur * (1 - fChay))) * 380;
  return (
    <Paper variant="myth">
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="sc062-water" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(232,220,200,0)" />
            <stop offset="22%" stopColor="rgba(232,220,200,0.55)" />
            <stop offset="100%" stopColor="rgba(232,220,200,0.8)" />
          </linearGradient>
        </defs>
        <path d={`M 0 540 Q 480 ${500 + Number(flow)} 960 540 T 1920 540`} stroke="url(#sc062-water)" strokeWidth="90" fill="none" opacity={0.16 + 0.08 * Math.sin(frame * 0.03)} strokeLinecap="round" />
        <path d={`M 0 540 Q 480 ${500 + Number(flow)} 960 540 T 1920 540`} stroke="rgba(217,164,65,0.35)" strokeWidth="4" fill="none" />
        <path d={`M 0 660 Q 480 630 960 660 T 1920 660`} stroke="rgba(232,220,200,0.25)" strokeWidth="2" fill="none" />
        <path d={`M 0 420 Q 480 396 960 420 T 1920 420`} stroke="rgba(232,220,200,0.18)" strokeWidth="2" fill="none" />
      </svg>
      {items.map((it, i) => {
        const t = Math.max(0, Math.min(1, (frame - (fStart + 0.02 + i * 0.03) * dur) / 20));
        const dissolve = Math.max(0, Math.min(1, (frame - (fChay + 0.02 + i * 0.024) * dur) / 60));
        return (
          <div
            key={it.name}
            data-cue={`sc062-it-${i + 1}`}
            style={{
              position: "absolute",
              left: it.dx + drift,
              top: 468,
              width: 150,
              textAlign: "center",
              opacity: t * (1 - dissolve),
              filter: `blur(${dissolve * 10}px)`,
              transform: `translateY(${dissolve * 26}px)`,
            }}
          >
            <svg width="86" height="86" viewBox="0 0 86 86" fill="none" style={{ margin: "0 auto", display: "block" }}>
              <circle cx="43" cy="43" r="34" stroke={C.mute} strokeWidth="3" fill="rgba(232,220,200,0.06)" />
              <circle cx="43" cy="43" r="10" stroke={C.mute} strokeWidth="3" />
            </svg>
            <div style={{ marginTop: 10, fontFamily: FONT.body, fontWeight: 500, fontSize: 30, color: C.cream, background: "rgba(20,17,13,0.78)", display: "inline-block", padding: "4px 14px", borderRadius: 6 }}>
              {it.name}
            </div>
          </div>
        );
      })}
      <Reveal startFrac={fChay + 0.12} style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center" }}>
        <div data-cue="sc062-close" style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.cream, background: "rgba(20,17,13,0.8)", display: "inline-block", padding: "10px 32px", borderRadius: 8 }}>
          dòng sông còn chảy
        </div>
      </Reveal>
    </Paper>
  );
};

/** sc063 (s32) — CREDITS — CẢM ƠN: khung tĩnh kết tập. */
export const Sc063: React.FC<SceneProps> = () => {
  const A = useA();
  const fCam = A("Cảm ơn bạn đã xem");
  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Reveal startFrac={fCam}>
          <div data-cue="sc063-mark" style={{ width: 110, margin: "0 auto 30px" }}>
            <svg width="110" height="110" viewBox="0 0 96 96" fill="none" style={{ display: "block" }}>
              <path d="M 48 8 L 56 38 L 86 30 L 64 52 L 86 74 L 56 66 L 48 96 L 40 66 L 10 74 L 32 52 L 10 30 L 40 38 Z" stroke={C.lampGlow} strokeWidth="3.5" fill="rgba(242,180,92,0.14)" />
              <circle cx="48" cy="52" r="10" fill={C.lampGlow} />
            </svg>
          </div>
        </Reveal>
        <Reveal startFrac={fCam + 0.02} endFrac={fCam + 0.1}>
          <div data-cue="sc063-title" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 72, lineHeight: 1.2, color: C.white, textAlign: "center" }}>
            Những vị thần ở lại
          </div>
        </Reveal>
        <Reveal startFrac={fCam + 0.06}>
          <div data-cue="sc063-ep" style={{ marginTop: 22, fontFamily: FONT.mono, fontSize: 34, letterSpacing: 5, color: C.amber, textAlign: "center" }}>
            S2E03 — CHỬ ĐỒNG TỬ
          </div>
        </Reveal>
        <Reveal startFrac={fCam + 0.12}>
          <div data-cue="sc063-thanks" style={{ marginTop: 48, fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.cream, textAlign: "center" }}>
            Cảm ơn bạn đã xem.
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};
