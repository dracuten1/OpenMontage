// VN-Myth Ep.05 scenes sc036–sc047 — HỒ SƠ BA (Dư Thiện), HERO 東越地遂虛,
// mini-reveal 138·111·110, payoff MỘT ĐÈN ĐỎ, HỒI BA: ba lá chắn (rìa đế chế,
// không im lặng, tiếng nói).
import React from "react";
import {
  Chip,
  DossierBadge,
  InkImageScene,
  LabBadge,
  Lamp,
  MAP_LAMPS,
  MapCanvas,
  MapLabel,
  Paper,
  Reveal,
  ShieldGlyph,
  SourceTag,
  SpringPop,
  TextCard,
  ease,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

// sc036 — HỒ SƠ SỐ BA: DƯ THIỆN (ảnh chân dung + overlay)
export const Sc036: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("Vua"); // «Vua Dư Thiện»
  const a2 = A("xưng"); // «xưng đế, nổi loạn»
  const a3 = A("bị"); // «bị chính thủ hạ của mình giết»
  return (
    <InkImageScene src="img-sc036.png" focus={{ x: 0.62, y: 0.4 }}>
      <DossierBadge text="HỒ SƠ SỐ BA — ĐÔNG VIỆT" />
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 130,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 62,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          Vua Dư Thiện — Đông Việt
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.06}>
        <div style={{ position: "absolute", bottom: 72, left: 84 }}>
          <Chip color={C.warn}>xưng đế, nổi loạn.</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={a3} endFrac={a3 + 0.05}>
        <div style={{ position: "absolute", bottom: 72, right: 84 }}>
          <Chip color={C.mute}>bị chính thủ hạ của mình giết.</Chip>
        </div>
      </Reveal>
    </InkImageScene>
  );
};

// sc037 — PHÁN QUYẾT CỦA THIÊN TỬ (chiếu lệnh rơi xuống bản đồ)
export const Sc037: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a1 = A("Đông", 3); // «Đông Việt hẹp và hiểm trở»
  const fall = ease(p(0.04, 0.24));
  return (
    <MapCanvas dim={0.55} zoom={{ progress: ease(p(0.05, 0.3)), cx: 1046, cy: 296, amount: 0.3 }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Lamp x={MAP_LAMPS.man.x} y={MAP_LAMPS.man.y} scale={1.1} lit={1 - ease(p(0.5, 0.7))} />
        <Lamp x={MAP_LAMPS.dongau.x} y={MAP_LAMPS.dongau.y} scale={1.1} lit={0} />
      </svg>
      {/* chiếu lệnh rơi xuống */}
      <div
        style={{
          position: "absolute",
          left: 610 + 300 * fall,
          top: -220 + 420 * fall,
          transform: `rotate(${10 - 16 * fall}deg) scale(${1.18 - 0.18 * fall})`,
          opacity: ease(p(0.02, 0.1)),
        }}
      >
        <div
          style={{
            width: 560,
            background: "rgba(48,38,26,0.95)",
            border: `3px solid ${C.amber}`,
            borderRadius: 6,
            padding: "34px 40px",
            boxShadow: "0 26px 70px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: C.amber }}>
            CHIẾU LỆNH THIÊN TỬ
          </div>
          <div style={{ fontFamily: FONT.hanzi, fontSize: 64, color: C.white, marginTop: 14 }}>東越狹多阻</div>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, marginTop: 12 }}>
            «Đông Việt hẹp và nhiều chỗ hiểm trở…»
          </div>
          {/* tri đỏ */}
          <div
            style={{
              position: "absolute",
              right: 26,
              bottom: 22,
              width: 64,
              height: 64,
              border: `4px solid ${C.warn}`,
              borderRadius: 8,
              color: C.warn,
              fontFamily: FONT.hanzi,
              fontSize: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(-8deg)",
              opacity: 0.9,
            }}
          >
            敕
          </div>
        </div>
      </div>
      <Reveal startFrac={a1 + 0.1} endFrac={a1 + 0.18}>
        <div style={{ position: "absolute", bottom: 96, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.amber}>«dời toàn bộ dân đến vùng Giang–Hoài»</Chip>
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc038 — HERO: NGUYÊN VĂN SUỬ KÝ 東越地遂虛 (ảnh giấy dó BASE + chữ khắc)
export const Sc038: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aEtch = A("được"); // «được chép lại nguyên văn»
  const aTrans = A("Đông", 4); // «Đông Việt bèn thành đất không người»
  const chars = ["東", "越", "地", "遂", "虛"];
  return (
    <InkImageScene src="img-sc038.png" focus={{ x: 0.5, y: 0.42 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
        }}
      >
        {/* 5 chữ Hán khắc từng nét */}
        <div style={{ display: "flex", gap: 34 }}>
          {chars.map((ch, i) => {
            const cStart = aEtch + i * 0.07;
            const cT = ease(p(cStart, cStart + 0.07));
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT.hanzi,
                  fontWeight: 700,
                  fontSize: 150,
                  lineHeight: 1,
                  color: C.white,
                  textShadow: "0 0 30px rgba(232,220,200,0.18)",
                  clipPath: `inset(0 ${(1 - cT) * 100}% 0 0)`,
                  opacity: cT > 0 ? 1 : 0,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        {/* bản dịch typewriter */}
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 58,
            color: C.amber,
            minHeight: 70,
            textShadow: "0 2px 10px rgba(0,0,0,0.85)",
          }}
        >
          {(() => {
            const t = [..."Đông Việt bèn thành đất không người"];
            const n = Math.floor(ease(p(aTrans, 0.95)) * t.length);
            return t.slice(0, n).join("") + (n < t.length ? "▌" : "");
          })()}
        </div>
      </div>
      <Reveal startFrac={0.93} endFrac={0.97}>
        <SourceTag
          text="Sử ký Tư Mã Thiên, quyển 114 — Đông Việt liệt truyện"
          bottom={40}
          right
        />
      </Reveal>
      <div style={{ position: "absolute", top: 60, left: 84 }}>
        <Chip color={C.amber}>東越地遂虛 — «đất Đông Việt bèn thành trống»</Chip>
      </div>
    </InkImageScene>
  );
};

// sc039 — MINI-REVEAL: BA HỒI CHUÔNG 138 · 111 · 110
export const Sc039: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("một"); // «một trăm ba mươi tám»
  const aSu = A("Sử"); // «Sử ký không chép giết hết»
  const a2 = A("không", 2); // «không xóa con người»
  const bells = [
    { n: "138", s: a1 },
    { n: "111", s: a1 + 0.14 },
    { n: "110", s: a1 + 0.28 },
  ];
  return (
    <TextCard eyebrow="BA HỒI CHUÔNG — HỒI HAI KHÉP LẠI" startFrac={0.04}>
      <div style={{ display: "flex", gap: 90, justifyContent: "center", marginTop: 20 }}>
        {bells.map((b, i) => (
          <SpringPop key={i} startFrac={b.s} from={1.25}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 130,
                color: i === 2 ? C.lampRed : C.white,
                lineHeight: 1,
              }}
            >
              {b.n}
            </div>
          </SpringPop>
        ))}
      </div>
      <Reveal startFrac={aSu} endFrac={aSu + 0.08}>
        <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream, marginTop: 44, textAlign: "center" }}>
          Sử ký không chép «giết hết» —
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.05}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.amber, marginTop: 16, textAlign: "center" }}>
          nhưng cũng không chép «cho ai sống nguyên vẹn».
        </div>
      </Reveal>
    </TextCard>
  );
};

// sc040 — PAYOFF: CHỈ CÒN MỘT ĐÈN ĐỎ (scene chủ lực e)
export const Sc040: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const aDen = A("đèn"); // «đèn còn đúng một ngọn»
  const aLac = A("Lạc"); // «Lạc Việt»
  const zoomP = ease(p(0.25, 0.85));
  return (
    <MapCanvas dim={0.82} zoom={{ progress: zoomP, cx: MAP_LAMPS.lac.x, cy: MAP_LAMPS.lac.y, amount: 0.55 }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {(["dongau", "man", "nam", "tayau"] as const).map((k) => {
          const L = MAP_LAMPS[k];
          return <Lamp key={k} x={L.x} y={L.y} scale={1} lit={0} />;
        })}
        <Lamp
          x={MAP_LAMPS.lac.x}
          y={MAP_LAMPS.lac.y}
          scale={1.6}
          lit={ease(p(0.04, 0.14))}
          mode="red"
          pulse={frame / 15}
        />
      </svg>
      <MapLabel
        x={MAP_LAMPS.lac.x}
        y={MAP_LAMPS.lac.y}
        text="Lạc Việt"
        startFrac={aLac}
        color={C.lampRed}
      />
      <Reveal startFrac={aDen} endFrac={aDen + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 110,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 76,
            color: C.white,
            textShadow: "0 2px 16px rgba(0,0,0,0.95)",
          }}
        >
          đèn còn đúng <span style={{ color: C.lampRed }}>một ngọn</span>.
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc041 — CHUYỂN HỒI BA
export const Sc041: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame } = useFrac();
  const a1 = 0.02; // «Vì sao ngọn đèn ấy không tắt» (clamped)
  const a2 = A("Ba"); // «Ba lớp trả lời — như ba lá chắn»
  return (
    <Paper variant="night">
      <svg width={300} height={300} viewBox="0 0 300 300" style={{ position: "absolute", right: 100, top: 100 }}>
        <Lamp x={150} y={170} scale={1.3} lit={1} mode="red" pulse={frame / 16} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Reveal startFrac={a1} endFrac={a1 + 0.08}>
          <div style={{ fontFamily: FONT.mono, fontSize: 30, letterSpacing: 6, color: C.amber }}>HỒI BA</div>
        </Reveal>
        <SpringPop startFrac={a1 + 0.06} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 100, color: C.white, textAlign: "center" }}>
            Vì sao ngọn đèn ấy không tắt?
          </div>
        </SpringPop>
        <Reveal startFrac={a2} endFrac={a2 + 0.08}>
          <div style={{ fontFamily: FONT.body, fontSize: 44, color: C.cream, marginTop: 34 }}>
            ba lớp trả lời — như <span style={{ color: C.teal }}>ba lá chắn</span>.
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc042 — LÁ CHẮN 1: RÌA ĐẾ CHẾ (ảnh gen + overlay teal)
export const Sc042: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = 0.02; // «rìa xa nhất của đế chế Hán» (clamped)
  const a2 = 0.08; // «đường tiếp ứng» (clamped)
  const a3 = A("đi", 2); // «đi bằng chính chặng ấy»
  return (
    <InkImageScene src="img-sc042.png" focus={{ x: 0.55, y: 0.5 }}>
      <LabBadge text="LÁ CHẮN 1 — ĐỊA LÝ" />
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 54,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            background: "rgba(14,20,20,0.78)",
            padding: "12px 28px",
            borderRadius: 10,
          }}
        >
          rìa xa nhất của đế chế Hán.
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div style={{ position: "absolute", top: 200, left: 84 }}>
          <Chip color={C.teal}>mọi đường tiếp ứng đều mỏng…</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={a3} endFrac={a3 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 110,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.body,
            fontSize: 40,
            color: C.cream,
            background: "rgba(14,20,20,0.74)",
            padding: "14px 30px",
          }}
        >
          ai muốn vào — cũng phải đi bằng chính chặng ấy.
        </div>
      </Reveal>
    </InkImageScene>
  );
};

// sc043 — NÚI ĐỂ LUI, BIỂN ĐỂ ĐI (diagram teal)
export const Sc043: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aNui = A("núi"); // «núi tầng tầng lớp lớp»
  const aRut = A("rút"); // «rút vào núi»
  const aXuong = A("xuống"); // «xuống thuyền ra biển»
  return (
    <Paper variant="teal">
      <LabBadge text="LÁ CHẮN 1 — SƠ ĐỒ ĐỊA HÌNH" />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* núi bọc tây/bắc */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M ${140 + i * 90} ${760 - i * 130} L ${340 + i * 90} ${480 - i * 130} L ${540 + i * 90} ${760 - i * 130}`}
            fill="none"
            stroke={C.teal}
            strokeWidth={6}
            opacity={0.75 - i * 0.2}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - ease(p(aNui + i * 0.04, aNui + 0.1 + i * 0.04))}
          />
        ))}
        {/* biển phía đông */}
        <path
          d="M 1500 300 Q 1560 540 1500 780"
          fill="none"
          stroke={C.teal}
          strokeWidth={6}
          opacity={0.6}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(p(aNui + 0.1, aNui + 0.2))}
        />
        {/* đồng bằng giữa */}
        <RevealWrapper t={ease(p(aNui + 0.12, aNui + 0.2))}>
          <text x={960} y={880} textAnchor="middle" fontFamily='"Be Vietnam Pro", sans-serif' fontSize={36} fill={C.cream}>
            đồng bằng sông Hồng
          </text>
        </RevealWrapper>
        {/* rút vào núi */}
        <path
          d={`M 960 700 L ${960 - 260 * ease(p(aRut, aRut + 0.1))} ${640 - 120 * ease(p(aRut, aRut + 0.1))}`}
          stroke={C.white}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.9}
        />
        {/* xuống thuyền ra biển */}
        <path
          d={`M 960 700 L ${960 + 380 * ease(p(aXuong, aXuong + 0.1))} ${640 - 40 * ease(p(aXuong, aXuong + 0.1))}`}
          stroke={C.white}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.9}
        />
      </svg>
      <Reveal startFrac={aRut + 0.1} endFrac={aRut + 0.16}>
        <div style={{ position: "absolute", top: 340, left: 300 }}>
          <Chip color={C.teal}>rút vào núi</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={aXuong + 0.08} endFrac={aXuong + 0.14}>
        <div style={{ position: "absolute", top: 480, right: 280 }}>
          <Chip color={C.teal}>xuống thuyền ra biển</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={0.95} endFrac={0.98}>
        <div style={{ position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.mute}>…điểm mỏi của mọi quân viễn chinh.</Chip>
        </div>
      </Reveal>
    </Paper>
  );
};

/** helper nội bộ: text SVG reveal theo opacity */
const RevealWrapper: React.FC<{ t: number; children: React.ReactNode }> = ({ t, children }) => (
  <g opacity={t}>{children}</g>
);

// sc044 — CHỐT LÁ CHẮN 1
export const Sc044: React.FC<SceneProps> = () => {
  const a1 = 0.02; // «Núi và biển — hai cánh cửa luôn mở» (clamped)
  return (
    <TextCard eyebrow="CHỐT LÁ CHẮN 1" startFrac={a1}>
      <div style={{ display: "flex", gap: 70, justifyContent: "center", alignItems: "center", marginTop: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.teal }}>NÚI</div>
          <div style={{ fontFamily: FONT.body, fontSize: 42, color: C.cream }}>để LUI</div>
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 80, color: C.mute }}>—</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.teal }}>BIỂN</div>
          <div style={{ fontFamily: FONT.body, fontSize: 42, color: C.cream }}>để ĐI</div>
        </div>
      </div>
      <Reveal startFrac={0.4} endFrac={0.48}>
        <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.mute, marginTop: 44, textAlign: "center" }}>
          rìa đế chế — không phải nơi dễ dọn tên mới.
        </div>
      </Reveal>
    </TextCard>
  );
};

// sc045 — LÁ CHẮN 2: KHÔNG CHỊU IM LẶNG (3 lá chắn, lá 2 sáng)
export const Sc045: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a2 = A("không"); // «không chịu im lặng»
  const a40 = 0.95; // «Hai Bà Trưng năm bốn mươi» (clamped)
  return (
    <Paper variant="teal">
      <LabBadge text="LÁ CHẮN 2 — Ý CHÍ" />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <ShieldGlyph x={480} y={560} scale={1.1} lit={0.85} label="đất" />
        <ShieldGlyph x={960} y={560} scale={1.1} lit={ease(p(a2, a2 + 0.12))} label="không im lặng" />
        <ShieldGlyph x={1440} y={560} scale={1.1} lit={0.0} label="tiếng nói" />
      </svg>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 62,
            color: C.white,
          }}
        >
          không chịu im lặng.
        </div>
      </Reveal>
      <Reveal startFrac={a40} endFrac={0.98}>
        <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.amber}>Hai Bà Trưng — năm 40 · khởi binh ngay cả khi «tên» đã đổi.</Chip>
        </div>
      </Reveal>
    </Paper>
  );
};

// sc046 — CHỐT LÁ CHẮN 2: LOGIC NGƯỢC
export const Sc046: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = 0.02; // «không bao giờ im lặng» (clamped)
  const a2 = A("không", 2); // «im được — thì mới đổi tên được»
  return (
    <TextCard eyebrow="CHỐT LÁ CHẮN 2" startFrac={a1}>
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div style={{ fontFamily: FONT.body, fontSize: 42, color: C.cream, textAlign: "center" }}>
          kẻ xâm chiếm chỉ đổi được tên —
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.1}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.white, textAlign: "center", marginTop: 30 }}>
          im được — thì mới đổi tên được.
        </div>
      </Reveal>
      <Reveal startFrac={a2 + 0.16} endFrac={a2 + 0.24}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 62, color: C.warn, textAlign: "center", marginTop: 34 }}>
          mà người Lạc — không bao giờ im.
        </div>
      </Reveal>
    </TextCard>
  );
};

// sc047 — LÁ CHẮN 3: TIẾNG NÓI (cây ngữ hệ Nam Á)
export const Sc047: React.FC<SceneProps> = () => {
  const A = useA();
  const { p, frame } = useFrac();
  const aLienTuc = A("liên"); // «liên tục lâu nhất» — nhánh sáng LIÊN TỤC
  const aNgu = A("ngữ", 2); // «ngữ hệ Nam Á»
  const glow = 0.6 + 0.4 * Math.abs(Math.sin(frame / 14));
  const branchT = ease(p(0.06, aLienTuc + 0.2)); // vẽ chậm, KHÔNG đứt
  return (
    <Paper variant="teal">
      <LabBadge text="LÁ CHẮN 3 — NGÔN NGỮ" />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* thân cây ngữ hệ Nam Á */}
        <path
          d="M 960 900 L 960 430"
          stroke={C.border}
          strokeWidth={10}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(p(0.04, 0.2))}
        />
        {/* nhánh Việt–Mường sáng LIÊN TỤC */}
        <path
          d="M 960 640 C 820 560 700 470 620 330"
          stroke={C.teal}
          strokeWidth={9}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - branchT}
          style={{ filter: `drop-shadow(0 0 ${10 * glow}px rgba(127,209,200,0.8))` }}
        />
        {/* các nhánh khác mờ */}
        {[
          "M 960 560 C 1100 480 1220 400 1300 280",
          "M 960 700 C 1120 660 1240 600 1320 520",
          "M 960 700 C 800 680 680 640 560 600",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            stroke={C.mute}
            strokeWidth={6}
            fill="none"
            opacity={0.5}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - ease(p(0.3 + i * 0.05, 0.5 + i * 0.05))}
          />
        ))}
        <circle cx={620} cy={330} r={14} fill={C.teal} opacity={glow} />
      </svg>
      <Reveal startFrac={aLienTuc} endFrac={aLienTuc + 0.08}>
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 320,
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 64,
            color: C.teal,
            textShadow: "0 0 24px rgba(127,209,200,0.4)",
          }}
        >
          Việt – Mường
        </div>
      </Reveal>
      <Reveal startFrac={aNgu} endFrac={aNgu + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.body,
            fontSize: 42,
            color: C.cream,
          }}
        >
          nhánh sáng liền mạch dài nhất của <span style={{ color: C.teal }}>ngữ hệ Nam Á</span>.
        </div>
      </Reveal>
      {/* nhãn nhánh mờ */}
      <Reveal startFrac={0.55} endFrac={0.62}>
        <div style={{ position: "absolute", top: 380, right: 340, fontFamily: FONT.body, fontSize: 32, color: C.mute }}>
          Khmer · Môn · khác…
        </div>
      </Reveal>
    </Paper>
  );
};
