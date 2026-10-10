// VN-Myth Ep.05 scenes sc024–sc035 — HỒI HAI: bản đồ tắt đèn, ba hồ sơ
// 138 (Đông Âu) · 111 (Nam Việt) · setup 110, dời dân Giang–Hoài, chín quận.
import React from "react";
import {
  Chip,
  CountUp,
  DossierBadge,
  InkArrow,
  InkImageScene,
  Lamp,
  MAP_LAMPS,
  MapCanvas,
  MapLabel,
  Paper,
  Reveal,
  SourceTag,
  SpringPop,
  TextCard,
  ease,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

// sc024 — BẢN ĐỒ THẮP ĐỦ ĐIỂM DANH
export const Sc024: React.FC<SceneProps> = () => {
  const A = useA();
  const aMan = A("Mân");
  const aDong = A("Đông");
  const aNam = A("Nam");
  const rows = [
    { k: "man", s: aMan, t: "Mân Việt — Phúc Kiến" },
    { k: "dongau", s: aDong, t: "Đông Âu — Chiết Giang" },
    { k: "nam", s: aNam, t: "Nam Việt — Quảng Đông · kinh đô Phiên Ngung" },
    { k: "tayau", s: aNam + 0.08, t: "Tây Âu — Quảng Tây" },
    { k: "lac", s: aNam + 0.16, t: "Lạc Việt — đồng bằng sông Hồng" },
  ];
  const { p } = useFrac();
  return (
    <MapCanvas dim={0.22}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {rows.map((r) => {
          const L = MAP_LAMPS[r.k as keyof typeof MAP_LAMPS];
          return <Lamp key={r.k} x={L.x} y={L.y} scale={1.15} lit={ease(p(r.s, r.s + 0.05))} />;
        })}
      </svg>
      {rows.map((r) => {
        const L = MAP_LAMPS[r.k as keyof typeof MAP_LAMPS];
        return <MapLabel key={r.k} x={L.x} y={L.y} text={r.t} startFrac={r.s + 0.03} />;
      })}
      <Reveal startFrac={0.93} endFrac={0.96}>
        <div style={{ position: "absolute", bottom: 96, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.amber}>không phải một nước — nguyên một thế giới.</Chip>
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc025 — CHUYỂN HỒI HAI
export const Sc025: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const a1 = A("Bây"); // «Bây giờ — tắt đèn»
  const flick = 0.5 + 0.5 * Math.abs(Math.sin(frame / 9)) * ease(p(a1, a1 + 0.1));
  return (
    <Paper variant="night">
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
        <Reveal startFrac={0.04} endFrac={0.12}>
          <div style={{ fontFamily: FONT.mono, fontSize: 30, letterSpacing: 6, color: C.amber }}>HỒI HAI</div>
        </Reveal>
        <SpringPop startFrac={0.1} style={{ marginTop: 24 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 120, color: C.white }}>
            Bản đồ tắt đèn
          </div>
        </SpringPop>
      </div>
      <svg width={400} height={400} viewBox="0 0 400 400" style={{ position: "absolute", right: 140, top: 120 }}>
        <Lamp x={200} y={220} scale={1.8} lit={flick} mode="red" pulse={frame / 16} />
      </svg>
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 110,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 64,
            color: C.lampRed,
          }}
        >
          «Bây giờ — tắt đèn.»
        </div>
      </Reveal>
    </Paper>
  );
};

// sc026 — ĐỆM EPI.04: ĐÈN ÂU LẠC LỊM TẮT
export const Sc026: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aLac = A("Lạc", 2); // «Lạc Việt và Tây Âu dưới một mái nhà»
  const aThanh = A("thành"); // «thành Cổ Loa và chiếc nỏ thần»
  const dimOut = ease(p(0.5, 0.72)); // «lịm tắt lặng lẽ» (clamped)
  return (
    <MapCanvas dim={0.3 + 0.2 * dimOut}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {(["man", "dongau", "nam", "tayau"] as const).map((k) => {
          const L = MAP_LAMPS[k];
          return <Lamp key={k} x={L.x} y={L.y} scale={1.1} lit={1 - dimOut} />;
        })}
        <Lamp x={MAP_LAMPS.lac.x} y={MAP_LAMPS.lac.y} scale={1.25} lit={1 - ease(p(aLac + 0.3, 0.75))} />
      </svg>
      <MapLabel x={MAP_LAMPS.lac.x} y={MAP_LAMPS.lac.y} text="Âu Lạc" startFrac={aLac + 0.04} color={C.cream} />
      <Reveal startFrac={aLac + 0.1} endFrac={aLac + 0.18}>
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 84,
            fontFamily: FONT.body,
            fontSize: 36,
            color: C.cream,
            background: "rgba(20,17,13,0.74)",
            padding: "12px 26px",
            borderRadius: 10,
            maxWidth: 900,
          }}
        >
          (tập trước) Lạc Việt + Tây Âu về một mái nhà — <span style={{ color: C.amber }}>Âu Lạc</span>.
        </div>
      </Reveal>
      <Reveal startFrac={aThanh} endFrac={aThanh + 0.08}>
        <div style={{ position: "absolute", top: 190, left: 84 }}>
          <Chip color={C.bronze}>thành Cổ Loa · chiếc nỏ thần</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={0.88} endFrac={0.94}>
        <div style={{ position: "absolute", top: 280, left: 84 }}>
          <Chip color={C.mute}>rồi thành «quận Giao Chỉ»…</Chip>
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc027 — MỐC ~179 TCN (stat card, nhãn ước lượng LUÔN kèm)
export const Sc027: React.FC<SceneProps> = () => {
  const { p } = useFrac();
  return (
    <Paper>
      <DossierBadge text="MỞ ĐẦU — HỒ SƠ ÂU LẠC" />
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
        <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.mute, letterSpacing: 3 }}>
          NĂM MẤT NƯỚC (TẬP TRƯỚC)
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 200, color: C.white, lineHeight: 1.1 }}>
          <CountUp to={179} from={140} startFrac={0.06} endFrac={0.24} prefix="~ " suffix="" style={{ fontSize: 200, fontWeight: 800, fontFamily: FONT.display, color: C.white }} />
          <span style={{ fontSize: 84, color: C.cream }}> TCN</span>
        </div>
        <Reveal startFrac={0.2} endFrac={0.28}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 62, color: C.cream }}>
            Âu Lạc thất thủ
          </div>
        </Reveal>
        {/* nhãn ước lượng LUÔN hiển thị cùng con số */}
        <Reveal startFrac={0.1} endFrac={0.18}>
          <div
            style={{
              marginTop: 36,
              padding: "10px 26px",
              border: `2px dashed ${C.warn}`,
              borderRadius: 8,
              color: C.warn,
              fontFamily: FONT.mono,
              fontSize: 30,
              letterSpacing: 2,
            }}
          >
            ước lượng — không phải mốc chính thống
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc028 — PAN TOÀN CẢNH LẦN CUỐI (đông→mân→lạc)
export const Sc028: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aDong = A("Đông"); // «Đông Âu ở Chiết Giang»
  const aMan = A("Mân"); // «Mân Việt ở Phúc Kiến»
  const aLac = A("Lạc"); // «Lạc Việt trên đồng bằng sông Hồng»
  const panY = -70 + 130 * ease(p(0.2, 0.9));
  return (
    <MapCanvas dim={0.3} panY={panY}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {(["dongau", "man", "nam", "tayau", "lac"] as const).map((k) => {
          const L = MAP_LAMPS[k];
          return <Lamp key={k} x={L.x} y={L.y} scale={1.1} lit={1} />;
        })}
      </svg>
      <MapLabel x={MAP_LAMPS.dongau.x} y={MAP_LAMPS.dongau.y} text="Đông Âu — Chiết Giang" startFrac={aDong} />
      <MapLabel x={MAP_LAMPS.man.x} y={MAP_LAMPS.man.y} text="Mân Việt — Phúc Kiến" startFrac={aMan} />
      <MapLabel
        x={MAP_LAMPS.lac.x}
        y={MAP_LAMPS.lac.y}
        text="Lạc Việt — đồng bằng sông Hồng"
        startFrac={aLac}
        color={C.lampRed}
      />
      <Reveal startFrac={0.04} endFrac={0.1}>
        <div style={{ position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center" }}>
          <Chip>điểm danh lần cuối — trước khi tắt đèn.</Chip>
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc029 — HỒ SƠ SỐ MỘT: 138 TCN — Đông Âu
export const Sc029: React.FC<SceneProps> = () => {
  const A = useA();
  const aNum = A("một", 4); // «một trăm ba mươi tám trước Công nguyên»
  const aHoSo = A("hồ"); // «Hồ sơ số một»
  return (
    <Paper>
      <DossierBadge text="HỒ SƠ SỐ MỘT" />
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
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 220, color: C.white, lineHeight: 1 }}>
          <CountUp
            to={138}
            startFrac={aNum - 0.04}
            endFrac={aNum + 0.14}
            style={{ fontSize: 220, fontWeight: 800, fontFamily: FONT.display, color: C.white }}
          />
          <span style={{ fontSize: 90, color: C.cream }}> TCN</span>
        </div>
        <Reveal startFrac={aNum + 0.06} endFrac={aNum + 0.14}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 72, color: C.lampGlow }}>
            Đông Âu — lần đầu tên nước Việt «tắt».
          </div>
        </Reveal>
        <Reveal startFrac={aHoSo} endFrac={aHoSo + 0.06}>
          <div style={{ marginTop: 40 }}>
            <Chip color={C.amber}>Sử ký — mốc chính thống (không nhãn ước lượng)</Chip>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc030 — HỒ SƠ 138: ĐÁNH · CỨU · DỜI (zoom Chiết Giang)
export const Sc030: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aAtk = A("Mân"); // «Mân Việt mang quân đánh Đông Âu»
  const aClash = A("người"); // «người Việt đánh người Việt»
  const z = ease(p(0.04, 0.3));
  return (
    <MapCanvas dim={0.34} zoom={{ progress: z, cx: 1104, cy: 200, amount: 0.5 }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* mũi tên Mân Việt đánh Đông Âu (mực đỏ) */}
        <InkArrow x={1046} y={296} dx={70} dy={-100} progress={ease(p(aAtk, aAtk + 0.14))} color={C.warn} strokeWidth={9} />
        {/* quân Hán xuống cứu (mực kem) */}
        <InkArrow x={1180} y={40} dx={-120} dy={150} progress={ease(p(aAtk + 0.12, aAtk + 0.26))} color={C.cream} strokeWidth={7} />
        {/* dời dân lên Giang–Hoài (mũi tên lên bắc) */}
        <InkArrow x={1104} y={150} dx={30} dy={-120} progress={ease(p(0.88, 0.97))} color={C.amber} strokeWidth={8} />
        <Lamp x={1104} y={172} scale={1.1} lit={1 - ease(p(0.86, 0.96))} />
        <Lamp x={1046} y={296} scale={1.1} lit={1} />
      </svg>
      <Reveal startFrac={aClash} endFrac={aClash + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 100,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 56,
            color: C.warn,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          người Việt đánh người Việt.
        </div>
      </Reveal>
      <Reveal startFrac={0.9} endFrac={0.96}>
        <div style={{ position: "absolute", top: 90, left: 84 }}>
          <Chip color={C.amber}>dời toàn bộ dân Đông Âu lên vùng Giang–Hoài</Chip>
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc031 — TRANH DỜI DÂN GIANG–HOÀI (ảnh gen + overlay)
export const Sc031: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = 0.02; // «Không đày, không giết — chỉ dời» (clamped)
  const a2 = A("người", 6); // «Người vẫn còn»
  const a3 = A("Họ", 3); // «Họ chỉ không còn ở đó»
  return (
    <InkImageScene src="img-sc031.png" focus={{ x: 0.5, y: 0.48 }}>
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            top: 88,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 54,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            background: "rgba(20,17,13,0.74)",
            padding: "12px 28px",
            borderRadius: 10,
          }}
        >
          Không đày, không giết — <span style={{ color: C.amber }}>chỉ dời</span>.
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.07}>
        <div
          style={{
            position: "absolute",
            bottom: 130,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 56,
            color: C.cream,
          }}
        >
          Người vẫn còn.
        </div>
      </Reveal>
      <Reveal startFrac={a3} endFrac={a3 + 0.05}>
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 56,
            color: C.warn,
          }}
        >
          Họ chỉ — không còn ở đó.
        </div>
      </Reveal>
    </InkImageScene>
  );
};

// sc032 — HỒ SƠ SỐ HAI: NAM VIỆT (nước lớn nhất)
export const Sc032: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("nước"); // «nước lớn nhất thế giới Bách Việt»
  const a2 = A("năm"); // «năm đời vua»
  const a3 = A("từ", 2); // «từ hai trăm lẻ bốn đến một trăm mười một»
  return (
    <Paper>
      <DossierBadge text="HỒ SƠ SỐ HAI — NAM VIỆT" />
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
        <Reveal startFrac={0.06} endFrac={0.14}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 130, color: C.white }}>
            NAM VIỆT
          </div>
        </Reveal>
        <Reveal startFrac={a3 - 0.02} endFrac={a3 + 0.08}>
          <div style={{ fontFamily: FONT.mono, fontSize: 44, color: C.amber, marginTop: 8 }}>
            204 – 111 TCN
          </div>
        </Reveal>
        <Reveal startFrac={a1} endFrac={a1 + 0.08}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 44, color: C.cream, marginTop: 34 }}>
            nước lớn nhất thế giới Bách Việt.
          </div>
        </Reveal>
        <Reveal startFrac={a2} endFrac={a2 + 0.08}>
          <div style={{ display: "flex", gap: 28, marginTop: 36, alignItems: "baseline" }}>
            <CountUp to={5} startFrac={a2} endFrac={a2 + 0.08} style={{ fontFamily: FONT.display, fontSize: 110, fontWeight: 800, color: C.white }} />
            <span style={{ fontFamily: FONT.body, fontSize: 42, color: C.cream }}>
              đời vua họ Triệu · kinh đô <span style={{ color: C.lampGlow }}>Phiên Ngung</span>
            </span>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc033 — PHIÊN NGUNG THẤT THỦ — LỮ GIA (ảnh chân dung + overlay mũi tên)
export const Sc033: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a1 = A("Lộ"); // «Lộ Bác Đức và Dương Bộc»
  const a2 = A("Thừa"); // «Thừa tướng Lữ Gia cùng vua Triệu Kiến Đức bị giết»
  const a3 = A("Nam", 4); // «Nam Việt diệt vong»
  return (
    <InkImageScene src="img-sc033.png" focus={{ x: 0.38, y: 0.42 }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <InkArrow x={660} y={820} dx={180} dy={-220} progress={ease(p(a1, a1 + 0.14))} color={C.warn} strokeWidth={8} />
        <InkArrow x={1180} y={860} dx={-160} dy={-240} progress={ease(p(a1 + 0.08, a1 + 0.22))} color={C.warn} strokeWidth={8} />
      </svg>
      <Reveal startFrac={a1} endFrac={a1 + 0.1}>
        <div
          style={{
            position: "absolute",
            top: 84,
            left: 84,
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 38,
            color: C.cream,
            background: "rgba(20,17,13,0.74)",
            padding: "12px 26px",
            borderRadius: 10,
          }}
        >
          hai mũi quân Hán — <span style={{ color: C.warn }}>Lộ Bác Đức · Dương Bộc</span>
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 84,
            maxWidth: 1150,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 50,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          Thừa tướng Lữ Gia cùng vua Triệu Kiến Đức — bị giết.
        </div>
      </Reveal>
      <Reveal startFrac={a3} endFrac={a3 + 0.05}>
        <div style={{ position: "absolute", bottom: 52, left: 84 }}>
          <Chip color={C.warn}>111 TCN — Nam Việt diệt vong.</Chip>
        </div>
      </Reveal>
    </InkImageScene>
  );
};

// sc034 — MỘT NƯỚC → CHÍN QUẬN
export const Sc034: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aSplit = A("chín"); // «chín quận»
  const labels = [
    { t: "Giao Chỉ", s: A("giao") },
    { t: "Cửu Chân", s: A("cửu") },
    { t: "Nhật Nam", s: A("nhật") },
  ];
  const split = ease(p(aSplit, aSplit + 0.12));
  const shardNames = ["Nam Hải", "Thương Ngô", "Uất Lâm", "Hợp Phố", "Chu Ngõa", "Đạm Nhĩ"];
  const shards = [
    ...labels.map((l) => ({ t: l.t, s: l.s, main: true })),
    ...shardNames.map((t, i) => ({ t, s: aSplit + 0.2 + i * 0.012, main: false })),
  ];
  return (
    <MapCanvas dim={0.5} zoom={{ progress: ease(p(0.05, 0.3)), cx: 1018, cy: 456, amount: 0.35 }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Lamp x={MAP_LAMPS.nam.x} y={MAP_LAMPS.nam.y} scale={1.2} lit={1 - split} />
        {shards.map((sh, i) => {
          const ang = (i / shards.length) * Math.PI * 2;
          const rr = 150 + 240 * split;
          const sx = MAP_LAMPS.nam.x + Math.cos(ang) * rr;
          const sy = MAP_LAMPS.nam.y + Math.sin(ang) * rr * 0.7;
          const vis = ease(p(sh.s, sh.s + 0.05));
          return (
            <g key={i} opacity={vis}>
              <rect
                x={sx - 62}
                y={sy - 26}
                width={124}
                height={52}
                rx={8}
                fill="rgba(36,31,26,0.92)"
                stroke={sh.main ? C.amber : C.border}
                strokeWidth={sh.main ? 3 : 2}
                transform={`rotate(${ang * 20} ${sx} ${sy})`}
              />
              <text
                x={sx}
                y={sy + 9}
                textAnchor="middle"
                fontFamily='"Be Vietnam Pro", sans-serif'
                fontWeight={sh.main ? 700 : 400}
                fontSize={sh.main ? 30 : 26}
                fill={sh.main ? C.white : C.mute}
              >
                {sh.t}
              </text>
            </g>
          );
        })}
      </svg>
      <Reveal startFrac={aSplit} endFrac={aSplit + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 96,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 60,
            color: C.white,
          }}
        >
          một nước — <span style={{ color: C.amber }}>chín quận</span>.
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc035 — CHỐT HỒ SƠ 2
export const Sc035: React.FC<SceneProps> = () => {
  const A = useA();
  const aChin = A("chín", 2); // «chín dòng chữ quận»
  const aMot = A("một", 2); // «Một nước, biến thành chín cái tên mới»
  return (
    <TextCard eyebrow="CHỐT HỒ SỐ HAI" startFrac={0.04}>
      <div style={{ display: "flex", alignItems: "center", gap: 60, justifyContent: "center", marginTop: 20 }}>
        <SpringPop startFrac={0.1}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 100, color: C.white }}>MỘT NƯỚC</div>
        </SpringPop>
        <Reveal startFrac={aChin} endFrac={aChin + 0.06}>
          <div style={{ fontFamily: FONT.display, fontSize: 90, color: C.amber }}>→</div>
        </Reveal>
        <SpringPop startFrac={aChin + 0.04}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 100, color: C.amber }}>
            CHÍN TÊN MỚI
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={aMot} endFrac={aMot + 0.1}>
        <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, marginTop: 44, textAlign: "center" }}>
          chín dòng chữ quận — thay cho một quốc gia từng tồn tại 93 năm.
        </div>
      </Reveal>
      <Reveal startFrac={aMot + 0.2} endFrac={aMot + 0.28}>
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Chip color={C.lampRed}>còn lại đúng một hồ sơ cuối.</Chip>
        </div>
      </Reveal>
    </TextCard>
  );
};
