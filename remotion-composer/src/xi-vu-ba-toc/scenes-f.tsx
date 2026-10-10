// EP.06 xi-vu-ba-toc — scenes group F (S3-F compose worker)
// 11 scenes sc056→sc066 · s26→s30 (finale mùa một). Speech-lock: useA() trả về
// FRACTION của scene — feed vào startFrac. Anchors theo spec_F.json (đã verify
// trong window). Tọa độ 1920x1080. Không dùng interpolate() — toàn bộ ramp qua sf().
import React from "react";
import { Img, staticFile } from "remotion";
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
  Lamp,
  MAP_LAMPS,
  WipeInk,
  useA,
  useFrac,
} from "./common";
import { FONT, C, SceneProps } from "./theme";

// ── helpers (fraction space) ────────────────────────────────────────────────
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** prog = frame/dur; sf(prog, a, d) = ramp 0→1 sau fraction `a`, dài `d` */
const sf = (prog: number, a: number, d = 0.02) => clamp01((prog - a) / d);
/** smoothstep trên clamp01 — cho cú lật gương */
const sm = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

const txt = (
  size: number,
  o: { w?: number; c?: string; f?: string; ls?: number } = {}
) => ({
  fontFamily: o.f ?? FONT.body,
  fontSize: size,
  fontWeight: o.w ?? 400,
  color: o.c ?? C.cream,
  letterSpacing: o.ls ?? 0,
  lineHeight: 1.25,
  whiteSpace: "nowrap" as const,
});

// xoắn ốc Cổ Loa 3 vòng, từ tâm ra ngoài (viewBox -400..400)
const CO_LOA_SPIRAL = (() => {
  const parts: string[] = [];
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * 3 * 2 * Math.PI - Math.PI / 2;
    const r = 24 + t * 296;
    parts.push(`${i === 0 ? "M" : "L"}${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return parts.join(" ");
})();

// mini xoắn ốc cho vignette (viewBox cục bộ 660x330)
const MINI_SPIRAL = (() => {
  const parts: string[] = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * 2.5 * 2 * Math.PI - Math.PI / 2;
    const r = 8 + t * 92;
    parts.push(`${i === 0 ? "M" : "L"}${(330 + Math.cos(a) * r).toFixed(1)},${(196 + Math.sin(a) * r * 0.72).toFixed(1)}`);
  }
  return parts.join(" ");
})();

// bóng người soi (đầu + vai) — path trong viewBox "-160 -120 320 240"
const REFLECTION = "M-58,120 C-58,34 -30,-16 0,-16 C30,-16 58,34 58,120";

// 6 nhánh sơ đồ tổ tông trên mặt sau gương (viewBox 0 0 640 640, tâm 320,320)
const BRANCHES = (() => {
  const out: string[] = [];
  for (let i = 0; i < 6; i++) {
    const th = ((-90 + i * 60) * Math.PI) / 180;
    const sx = 320 + Math.cos(th) * 248;
    const sy = 320 + Math.sin(th) * 248;
    const ex = 320 + Math.cos(th + 0.22) * 104;
    const ey = 320 + Math.sin(th + 0.22) * 104;
    const cx = 320 + Math.cos(th + 0.5) * 190;
    const cy = 320 + Math.sin(th + 0.5) * 190;
    out.push(`M${sx.toFixed(1)},${sy.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`);
  }
  return out;
})();

// ════════════════════════════════════════════════════════════════════════════
// SC056 — GƯƠNG THÀNH SOÁN PHẮNG (s26) · animation · night
// ════════════════════════════════════════════════════════════════════════════
export const Sc056: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aVay = A("vay mượn một vị thần chiến tranh ngoại bang");
  const aSau = A("Còn ta đã nhìn — suốt sáu tập");
  const aThay = A("ta thấy gì");

  const flat = sf(prog, aVay, FR(34)); // mặt đồng dập sáng → phẳng lì
  const refl = 0.42 * (1 - sf(prog, aVay - FR(26), FR(30))); // bóng người soi biến mất
  const tallyAt = (i: number) => aSau + FR(6 + i * 7); // sáu vạch = sáu tập

  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        {/* hai câu nhấn */}
        <Reveal startFrac={aVay} endFrac={aVay + FR(26)} style={{ position: "absolute", top: 76, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(38, { c: C.cream, w: 500 }) }}>
            lòng tự tôn chưa bao giờ cần <span style={{ color: C.amber }}>vay mượn một vị thần chiến tranh ngoại bang</span>
          </div>
        </Reveal>
        <Reveal startFrac={aSau} endFrac={aSau + FR(22)} style={{ position: "absolute", top: 146, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(38, { c: C.mute }) }}>Còn ta đã nhìn — suốt sáu tập.</div>
        </Reveal>

        {/* gương đồng giữa màn — vệt sáng tắt, bóng soi lịm, mặt phẳng lì */}
        <div
          style={{
            position: "absolute",
            left: 710,
            top: 240,
            width: 500,
            height: 500,
            borderRadius: "50%",
            overflow: "hidden",
            border: `6px solid ${C.amber}`,
            background: "radial-gradient(circle at 42% 38%, #8a6d3f 0%, #5c4523 45%, #31230f 100%)",
            boxShadow: `0 24px 90px rgba(0,0,0,0.55), inset 0 0 60px rgba(0,0,0,0.35)`,
          }}
        >
          {/* vệt sáng quét — tắt dần khi lật phẳng */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `conic-gradient(from ${frame * 0.55}deg, transparent 0deg, rgba(243,217,154,0.22) 42deg, transparent 96deg)`,
              opacity: 0.9 * (1 - flat),
            }}
          />
          {/* bóng người soi */}
          <svg viewBox="-160 -120 320 240" width={320} height={240} style={{ position: "absolute", left: 90, top: 130, opacity: refl }}>
            <path d={REFLECTION} fill="none" stroke={C.cream} strokeWidth={7} strokeLinecap="round" />
          </svg>
          {/* mặt đồng thành soán phẳng */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 50% 46%, #241a0e 58%, #140d05 100%)",
              opacity: flat,
            }}
          />
          {/* diện trống — mặt trống, không còn gì phản chiếu */}
          <svg viewBox="0 0 500 500" style={{ position: "absolute", inset: 0, opacity: 0.5 * flat }}>
            <circle cx={250} cy={250} r={188} fill="none" stroke={C.mute} strokeWidth={2.5} />
            <circle cx={250} cy={250} r={13} fill="none" stroke={C.mute} strokeWidth={2.5} />
            {Array.from({ length: 8 }, (_, i) => {
              const th = (i * Math.PI) / 4;
              return (
                <line
                  key={i}
                  x1={250 + Math.cos(th) * 26}
                  y1={250 + Math.sin(th) * 26}
                  x2={250 + Math.cos(th) * 150}
                  y2={250 + Math.sin(th) * 150}
                  stroke={C.mute}
                  strokeWidth={2}
                />
              );
            })}
          </svg>
        </div>

        {/* sáu vạch mực = sáu tập đã nhìn */}
        {Array.from({ length: 6 }, (_, i) => (
          <InkDraw
            key={`t${i}`}
            d={`M${783 + i * 71},776 L${790 + i * 71},830`}
            startFrac={tallyAt(i)}
            endFrac={tallyAt(i) + FR(9)}
            stroke={C.amber}
            strokeWidth={5}
          />
        ))}

        {/* câu hỏi mở climax */}
        <Reveal startFrac={aThay} endFrac={aThay + FR(20)} style={{ position: "absolute", top: 872, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(94, { f: FONT.display, c: C.amber, w: 700, ls: 6 }) }}>Và ta thấy gì?</div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC057 — BỐN CHÂN DƯƠNG NGƯỜI THƯỜNG (s27) · generated · night · 2×2
// ════════════════════════════════════════════════════════════════════════════
export const Sc057: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const aNguoi = A("những con người");
  const aNong = A("nông dân khai phá phù sa");
  const aXoan = A("người đắp thành xoắn trôn ốc");
  const aGiu = A("người giữ tiếng nói quê cha");

  const cell: React.CSSProperties = {
    position: "absolute",
    width: 660,
    height: 330,
    border: `3px solid ${C.mute}`,
    borderRadius: 10,
    overflow: "hidden",
    background: "rgba(16,12,6,0.45)",
  };
  const chipAt = (left: number, top: number) => ({ position: "absolute" as const, left, top });

  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{ position: "absolute", top: 56, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <SceneTitle
            eyebrow="KHÔNG PHẢI HẬU DUỆ CỦA THẦN CHIẾN TRANH — MÀ LÀ"
            title="Những con người"
            subtitle="bốn chân dung trên mặt gương tối"
            align="center"
            startFrac={aNguoi}
          />
        </div>

        {/* Q1 — nông dân phù sa (gen) */}
        <Reveal startFrac={aNong} endFrac={aNong + FR(24)} style={{ ...cell, left: 280, top: 300 }}>
          <Img src={plateSrc("img-sc057a.png")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.25) brightness(0.92)" }} />
          <div style={chipAt(18, 272)}>
            <Chip color={C.amber}>nông dân — khai phá phù sa</Chip>
          </div>
        </Reveal>

        {/* Q2 — thợ đúc đồng mặt trời (gen) */}
        <Reveal startFrac={aNong + FR(30)} endFrac={aNong + FR(54)} style={{ ...cell, left: 980, top: 300 }}>
          <Img src={plateSrc("img-sc057b.png")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.25) brightness(0.92)" }} />
          <div style={chipAt(18, 272)}>
            <Chip color={C.teal}>thợ đúc — mặt trời đồng</Chip>
          </div>
        </Reveal>

        {/* Q3 — người đắp thành xoắn ốc (vignette mực) */}
        <Reveal startFrac={aXoan} endFrac={aXoan + FR(24)} style={{ ...cell, left: 280, top: 670 }}>
          <svg viewBox="0 0 660 330" style={{ position: "absolute", inset: 0 }}>
            <path d="M40,292 L620,292" stroke={C.mute} strokeWidth={3} />
            <path d={MINI_SPIRAL} fill="none" stroke={C.amber} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
            {/* người vác gùi đi trên thành */}
            <circle cx={118} cy={150} r={17} fill="none" stroke={C.cream} strokeWidth={4} />
            <path d="M118,167 L118,258 M118,192 L84,218 M118,192 L152,218 M104,258 L104,292 M132,258 L132,292" stroke={C.cream} strokeWidth={4} strokeLinecap="round" fill="none" />
            <path d="M92,140 L144,140 L134,102 L102,102 Z" fill="none" stroke={C.amber} strokeWidth={3.5} />
          </svg>
          <div style={chipAt(18, 272)}>
            <Chip color={C.amber}>người đắp thành xoắn trôn ốc</Chip>
          </div>
        </Reveal>

        {/* Q4 — người dạy chữ (vignette mực) */}
        <Reveal startFrac={aGiu} endFrac={aGiu + FR(24)} style={{ ...cell, left: 980, top: 670 }}>
          <svg viewBox="0 0 660 330" style={{ position: "absolute", inset: 0 }}>
            <rect x={168} y={38} width={304} height={186} fill="none" stroke={C.mute} strokeWidth={3} rx={6} />
            <text x={330} y={132} textAnchor="middle" fill={C.cream} fontFamily={FONT.display} fontSize={62} fontWeight={700} letterSpacing={12}>
              Ă Â Ô
            </text>
            <path d="M214,164 L266,164 M312,164 L364,164 M410,164 L462,164" stroke={C.amber} strokeWidth={3.5} />
            <circle cx={556} cy={150} r={17} fill="none" stroke={C.cream} strokeWidth={4} />
            <path d="M556,167 L556,258 M556,196 L498,170 M556,196 L596,224 M540,258 L540,292 M572,258 L572,292" stroke={C.cream} strokeWidth={4} strokeLinecap="round" fill="none" />
            <path d="M40,292 L620,292" stroke={C.mute} strokeWidth={3} />
          </svg>
          <div style={chipAt(18, 272)}>
            <Chip color={C.teal}>người giữ tiếng nói quê cha</Chip>
          </div>
        </Reveal>

        <SourceTag text="không cần phép màu nào chứng minh mình tồn tại" bottom={54} />
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC058 — ĐÔI CÂU ĐỐ: KHÔNG THẮNG / SỐNG SÓT (s27) · text_card · night
// ═══════ │══════════════════════════════════════════════════════════════════
export const Sc058: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const aThuy = A("không thắng trong thần thoại");
  const aSong = A("sống sót trong lịch sử");
  const aKho = A("còn khó hơn chiến thắng");

  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0, opacity: 1 }}>
        {/* gương tối mờ phía sau */}
        <div
          style={{
            position: "absolute",
            left: 760,
            top: 200,
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: `3px solid ${C.mute}`,
            background: "radial-gradient(circle at 45% 40%, #241a0e 0%, #120b04 75%)",
            opacity: 0.35,
          }}
        />

        {/* vế trái */}
        <Reveal startFrac={aThuy} endFrac={aThuy + FR(30)} style={{ position: "absolute", left: 150, top: 300, width: 720 }}>
          <LegendFrame label="TRONG THẦN THOẠI">
            <div style={{ padding: "34px 10px 30px", textAlign: "center" }}>
              <div style={{ ...txt(84, { f: FONT.display, c: C.mute, w: 600, ls: 8 }) }}>KHÔNG THẮNG</div>
              <div style={{ ...txt(30, { c: C.mute }), marginTop: 22 }}>Họ không thắng trong thần thoại.</div>
            </div>
          </LegendFrame>
        </Reveal>

        {/* vế phải */}
        <Reveal startFrac={aSong} endFrac={aSong + FR(30)} style={{ position: "absolute", left: 1050, top: 300, width: 720 }}>
          <LegendFrame label="TRONG LỊCH SỬ">
            <div style={{ padding: "34px 10px 30px", textAlign: "center" }}>
              <div style={{ ...txt(84, { f: FONT.display, c: C.amber, w: 700, ls: 8 }) }}>SỐNG SÓT</div>
              <div style={{ ...txt(30, { c: C.cream }), marginTop: 22 }}>Họ sống sót trong lịch sử.</div>
            </div>
          </LegendFrame>
        </Reveal>

        {/* vạch chia giữa */}
        <InkDraw d="M960,316 L960,708" startFrac={aSong} endFrac={aSong + FR(22)} stroke={C.amber} strokeWidth={4} />

        {/* bridge */}
        <Reveal startFrac={aKho} endFrac={aKho + FR(24)} style={{ position: "absolute", top: 782, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(36, { c: C.cream, w: 500 }) }}>— sống sót, nhiều khi, còn khó hơn chiến thắng —</div>
        </Reveal>

        {/* câu dịu mở landing */}
        <Reveal startFrac={aKho + FR(70)} endFrac={aKho + FR(94)} style={{ position: "absolute", top: 934, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(28, { c: C.mute }) }}>Đêm cuối cùng của mùa một — ta về nơi mọi chuyện bắt đầu.</div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC059 — LANDING MỞ ĐẦU: BỌC TRỨNG + RỒNG TIÊN (s28) · generated · giấy dó
// ════════════════════════════════════════════════════════════════════════════
export const Sc059: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aBoc = A("Bọc trăm trứng nở");
  const aRong = A("Con Rồng sâu biển, Tiên trên núi");
  const aDan = A("dân ta từ đó");

  const pan = -18 + -0.06 * frame; // pan_right chậm: khung trôi nhẹ về trái

  return (
    <Paper>
      <WipeInk startFrac={0} color={C.bg} />
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        <div style={{ position: "absolute", top: 62, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <SceneTitle
            eyebrow="VỀ ĐÚNG MÀN HÌNH MỞ ĐẦU TẬP MỘT"
            title="Trăm trứng · Rồng — Tiên"
            subtitle="lướt qua từng chặng ta đã đi cùng nhau"
            align="center"
            startFrac={aBoc}
          />
        </div>

        <div style={{ position: "absolute", inset: 0, transform: `translateX(${pan}px)` }}>
          {/* bọc trứng nở */}
          <Reveal startFrac={aBoc} endFrac={aBoc + FR(28)} style={{ position: "absolute", left: 150, top: 290, width: 740, height: 520, border: `4px solid ${C.amber}`, borderRadius: 12, overflow: "hidden" }}>
            <Img src={plateSrc("img-sc059a.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Reveal>
          <Reveal startFrac={aBoc + FR(18)} style={{ position: "absolute", left: 150, top: 826, width: 740, textAlign: "center" }}>
            <Chip color={C.amber}>bọc trăm trứng nở — trăm con, trăm nẻo người</Chip>
          </Reveal>

          {/* Rồng sâu biển — Tiên trên núi */}
          <Reveal startFrac={aRong} endFrac={aRong + FR(28)} style={{ position: "absolute", left: 1030, top: 290, width: 740, height: 520, border: `4px solid ${C.teal}`, borderRadius: 12, overflow: "hidden" }}>
            <Img src={plateSrc("img-sc059b.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Reveal>
          <Reveal startFrac={aRong + FR(18)} style={{ position: "absolute", left: 1030, top: 826, width: 740, textAlign: "center" }}>
            <Chip color={C.teal}>Con Rồng sâu biển · Tiên trên núi — hai nhánh cùng một cội</Chip>
          </Reveal>
        </div>

        {/* chốt giữa */}
        <Reveal startFrac={aDan} endFrac={aDan + FR(22)} style={{ position: "absolute", top: 946, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(42, { f: FONT.display, c: C.amber, w: 700, ls: 4 }) }}>dân ta từ đó.</div>
        </Reveal>

        <SourceTag text="theo huyền sử — Lạc Long Quân" bottom={52} />
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC060 — TRỐNG ĐỒNG · LỚP ĐẤT · CỔ LOA (s28) · animation · BASE reuse f11
// ════════════════════════════════════════════════════════════════════════════
export const Sc060: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aMua = A("mặt trời giữa mặt trống");
  const aSach = A("những trang sách viết bằng chính cuộc sống");
  const aVong = A("vòng trong tiếp vòng ngoài");

  const stratAt = (i: number) => aSach + FR(8 + i * 11);

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        <div style={{ position: "absolute", top: 54, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <SceneTitle
            eyebrow="LỚT QUA TỪNG CHẶNG"
            title="Trống đồng · lớp đất · thành"
            subtitle="mặt trời giữa mặt trống, chim muông hoa văn quay quanh"
            align="center"
            startFrac={aMua}
          />
        </div>

        {/* mặt trống quay chậm (BASE f11 reuse) */}
        <div style={{ position: "absolute", left: 770, top: 240, width: 380, height: 380 }}>
          <div
            style={{
              width: 380,
              height: 380,
              borderRadius: "50%",
              overflow: "hidden",
              border: `5px solid ${C.amber}`,
              transform: `rotate(${frame * 0.12}deg)`,
            }}
          >
            <Img src={staticFile("xi-vu-ba-toc/f11-dong-son.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        {/* vòng sáng + chim muông quay quanh */}
        <InkDraw d={circleD(960, 430, 204)} startFrac={aMua} endFrac={aMua + FR(24)} stroke={C.amber} strokeWidth={4} />
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: sf(prog, aMua - FR(20), 0.03) }}>
          <g transform={`rotate(${frame * 0.38} 960 430)`}>
            {[0, 120, 240].map((deg) => {
              const th = ((deg - 90) * Math.PI) / 180;
              const x = 960 + Math.cos(th) * 204;
              const y = 430 + Math.sin(th) * 204;
              return <path key={deg} d={`M${x - 16},${y} q8,-9 16,0 q8,-9 16,0`} fill="none" stroke={C.mute} strokeWidth={3.5} strokeLinecap="round" />;
            })}
          </g>
        </svg>

        {/* lớp đất Đồng Đậu — chồng như trang sách */}
        {[0, 1, 2, 3].map((i) => (
          <Reveal key={`s${i}`} startFrac={stratAt(i)} endFrac={stratAt(i) + FR(14)} style={{ position: "absolute", left: 160 + i * 26, top: 660 + i * 54, width: 1600 - i * 52, height: 44 }}>
            <div
              style={{
                width: "100%",
                height: 44,
                background: `repeating-linear-gradient(115deg, ${C.mute}22 0 2px, transparent 2px 11px)`,
                borderTop: `2px solid ${i === 3 ? C.amber : C.mute}66`,
                borderRadius: 3,
              }}
            />
          </Reveal>
        ))}
        <Reveal startFrac={aSach + FR(14)} style={{ position: "absolute", left: 0, right: 0, top: 892, textAlign: "center" }}>
          <Chip color={C.amber}>những lớp đất Đồng Đậu — những trang sách viết bằng chính cuộc sống</Chip>
        </Reveal>

        {/* thành Cổ Loa — xoắn ốc ba vòng tự vẽ */}
        <InkDraw
          d={CO_LOA_SPIRAL}
          viewBox="-400 -400 800 800"
          width={300}
          height={300}
          style={{ position: "absolute", left: 210, top: 250 }}
          startFrac={aVong}
          endFrac={aVong + FR(96)}
          stroke={C.amber}
          strokeWidth={7}
        />
        <Reveal startFrac={aVong + FR(10)} style={{ position: "absolute", left: 560, top: 336, width: 200, textAlign: "center" }}>
          <Chip color={C.teal}>thành Cổ Loa</Chip>
        </Reveal>

        <SourceTag text="Đông Sơn · Đồng Đậu · Cổ Loa" bottom={54} />
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC061 — BÁCH VIỆT TẮT DẦN + TIMELINE QUỐC HIỆU (s28) · diagram · night
// ════════════════════════════════════════════════════════════════════════════
export const Sc061: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aMot = A("chỉ còn một còn nguyên tên");
  const a968 = A("chín trăm sáu mươi tám");
  const a1804 = A("Một nghìn tám trăm linh bốn");
  const aTV = A("tiếng Việt");

  const a1054 = a968 + FR(44); // "Một nghìn không trăm năm mươi tư" đọc ngay sau 968
  const keys = ["man", "dongau", "nam", "tayau", "lac"] as const;
  const lamps = keys.map((k) => ({ k, ...MAP_LAMPS[k] }));

  const nodes = [
    { x: 420, at: a968, year: "968" },
    { x: 960, at: a1054, year: "1054" },
    { x: 1500, at: a1804, year: "1804" },
  ];

  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        {/* bản đồ đèn — Bách Việt tắt dần, Lạc còn nguyên tên */}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          {lamps.map((l, i) => {
            const isLast = i === lamps.length - 1;
            const offF = aMot - FR(64 - 14 * i);
            const lit = isLast ? 1 : 1 - sf(prog, offF, FR(12));
            return <Lamp key={l.k} x={l.x} y={l.y} lit={lit} mode={isLast ? "red" : "lit"} pulse={isLast ? frame / 18 : 0} />;
          })}
        </svg>
        {lamps.map((l, i) => {
          const isLast = i === lamps.length - 1;
          const offF = aMot - FR(64 - 14 * i);
          const dim = isLast ? 1 : 1 - 0.82 * sf(prog, offF, FR(12));
          return (
            <div
              key={`lb-${l.k}`}
              style={{
                position: "absolute",
                left: l.x - 60,
                top: l.y + 30,
                width: 120,
                textAlign: "center",
                opacity: dim,
              }}
            >
              <span style={{ ...txt(24, { c: isLast ? C.amber : C.mute, w: isLast ? 600 : 400 }) }}>{l.label}</span>
            </div>
          );
        })}

        <Reveal startFrac={aMot} endFrac={aMot + FR(20)} style={{ position: "absolute", top: 74, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(38, { f: FONT.display, c: C.amber, w: 600, ls: 6 }) }}>BÁCH VIỆT TẮT DẦN — CHỈ CÒN MỘT, CÒN NGUYÊN TÊN</div>
        </Reveal>

        {/* timeline quốc hiệu — 3 mốc theo đúng thứ tự đọc */}
        <InkDraw d="M240,872 L1680,872" startFrac={a968} endFrac={a968 + FR(20)} stroke={C.mute} strokeWidth={3} />
        {nodes.map((n) => (
          <React.Fragment key={n.year}>
            <InkDraw d={circleD(n.x, 872, 13)} startFrac={n.at} endFrac={n.at + FR(12)} stroke={C.amber} strokeWidth={4} />
            <Reveal startFrac={n.at} endFrac={n.at + FR(14)} style={{ position: "absolute", left: n.x - 140, top: 900, width: 280, textAlign: "center" }}>
              <div style={{ ...txt(62, { f: FONT.display, c: C.cream, w: 700, ls: 4 }) }}>{n.year}</div>
            </Reveal>
          </React.Fragment>
        ))}
        <Reveal startFrac={a968 - FR(24)} style={{ position: "absolute", left: 0, right: 0, top: 798, textAlign: "center" }}>
          <Chip color={C.mute}>quốc hiệu đổi qua từng đời</Chip>
        </Reveal>

        {/* Người ở lại → tiếng Việt */}
        <Reveal startFrac={a1804 + FR(52)} endFrac={a1804 + FR(74)} style={{ position: "absolute", top: 316, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(42, { c: C.cream, w: 600 }) }}>Người ở lại.</div>
        </Reveal>
        <Reveal startFrac={aTV} endFrac={aTV + FR(14)} style={{ position: "absolute", top: 392, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(26, { c: C.mute }) }}>thứ sống nguyên vẹn nhất từ tổ tiên đến ta —</div>
        </Reveal>
        <SpringPop startFrac={aTV + FR(8)} style={{ position: "absolute", top: 428, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(78, { f: FONT.display, c: C.amber, w: 700, ls: 10 }) }}>tiếng Việt</div>
        </SpringPop>
        <InkDraw d="M760,556 L1160,556" startFrac={aTV + FR(24)} endFrac={aTV + FR(46)} stroke={C.amber} strokeWidth={4} />
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC062 — GƯƠNG LẬT MẶT SAU + SƠ ĐỒ TỰ VẼ LẠI (s29) · animation · night
// ════════════════════════════════════════════════════════════════════════════
export const Sc062: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aLat = A("tấm gương đồng lật mặt sau");
  const aChum = A("chụm về một chữ duy nhất");
  const aSong = A("sống sót", 1); // lần 1: "chữ duy nhất: sống sót"

  const ang = 180 * sm(sf(prog, aLat, FR(52))); // lật 180°
  const ringP = sf(prog, aLat + FR(50), FR(28));
  const branchP = (i: number) => sf(prog, aChum + FR(6 * i), FR(26));

  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        <Reveal startFrac={aLat + FR(10)} endFrac={aLat + FR(30)} style={{ position: "absolute", top: 96, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(34, { c: C.mute }) }}>mặt sau — không phản chiếu ai</div>
        </Reveal>

        {/* khối lật */}
        <div style={{ position: "absolute", left: 640, top: 210, width: 640, height: 640, perspective: 1500 }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${ang}deg)` }}>
            {/* mặt trước — đồng soi */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backfaceVisibility: "hidden",
                border: `6px solid ${C.amber}`,
                background: "radial-gradient(circle at 42% 38%, #8a6d3f 0%, #5c4523 45%, #31230f 100%)",
                boxShadow: "0 24px 90px rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="-160 -120 320 240" width={320} height={240} style={{ opacity: 0.38 }}>
                <path d={REFLECTION} fill="none" stroke={C.cream} strokeWidth={7} strokeLinecap="round" />
              </svg>
            </div>
            {/* mặt sau — khắc sơ đồ tổ tông, tự vẽ lại */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                border: `6px solid ${C.mute}`,
                background: "radial-gradient(circle at 50% 46%, #241a0e 0%, #140d05 78%)",
              }}
            >
              <svg viewBox="0 0 640 640" style={{ position: "absolute", inset: 0 }}>
                <circle cx={320} cy={320} r={250} fill="none" stroke={C.cream} strokeWidth={3} opacity={0.75 * ringP} />
                <circle cx={320} cy={320} r={236} fill="none" stroke={C.mute} strokeWidth={1.5} opacity={0.5 * ringP} strokeDasharray="4 10" />
                {BRANCHES.map((d, i) => (
                  <path key={`b${i}`} d={d} fill="none" stroke={C.cream} strokeWidth={3.5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - branchP(i)} opacity={0.9} />
                ))}
                <circle cx={320} cy={320} r={92} fill="none" stroke={C.amber} strokeWidth={3} opacity={sf(prog, aChum + FR(30), FR(20))} />
              </svg>
            </div>
          </div>
        </div>

        {/* chữ giữa — SỐNG SÓT */}
        <SpringPop startFrac={aSong} style={{ position: "absolute", top: 494, left: 660, width: 600, textAlign: "center" }}>
          <div style={{ ...txt(78, { f: FONT.display, c: C.amber, w: 700, ls: 8 }) }}>SỐNG SÓT</div>
        </SpringPop>

        <Reveal startFrac={aChum + FR(8)} style={{ position: "absolute", top: 918, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.mute}>sơ đồ tổ tông — mở màn tập đầu tiên, các nhánh chụm về một chữ duy nhất</Chip>
        </Reveal>
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC063 — MANIFEST CUỐI SEASON (s29) · text_card · HERO · đen ấm
// ════════════════════════════════════════════════════════════════════════════
export const Sc063: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const a1 = A("Ta không cần tổ tiên là thần để tự hào");
  const a2 = A("tổ tiên ta là con người");
  const a3 = A("họ đã sống sót");

  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0 }}>
        <Reveal startFrac={a1} endFrac={a1 + FR(38)} style={{ position: "absolute", top: 350, left: 120, right: 120, textAlign: "center" }}>
          <div style={{ ...txt(56, { c: C.cream, w: 600 }) }}>Ta không cần tổ tiên là thần để tự hào</div>
        </Reveal>
        <Reveal startFrac={a2} endFrac={a2 + FR(34)} style={{ position: "absolute", top: 470, left: 120, right: 120, textAlign: "center" }}>
          <div style={{ ...txt(56, { c: C.cream, w: 500 }) }}>— tổ tiên ta là <span style={{ color: C.amber, fontWeight: 700 }}>con người</span>,</div>
        </Reveal>
        <Reveal startFrac={a3} endFrac={a3 + FR(34)} style={{ position: "absolute", top: 590, left: 120, right: 120, textAlign: "center" }}>
          <div style={{ ...txt(64, { c: C.cream, w: 500 }) }}>và họ đã <span style={{ color: C.amber, fontWeight: 700 }}>sống sót</span>.</div>
        </Reveal>
        {/* vạch mực khép lời */}
        <InkDraw d="M780,724 L1140,724" startFrac={a3 + FR(30)} endFrac={a3 + FR(58)} stroke={C.amber} strokeWidth={3} />
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC064 — 54 DÂN TỘC KHÉP VÒNG TRÒN (s29) · generated · night · BASE f07
// ════════════════════════════════════════════════════════════════════════════
export const Sc064: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const a54 = A("năm mươi bốn dân tộc anh em");
  const aKhep = A("khép một vòng tròn");
  const aCam = A("cảm ơn tổ tiên");
  const aVi = A("Vì đã ở lại");

  const N = 54;
  const R = 330;
  const CX = 960;
  const CY = 500;
  const dotStart = a54;
  const dotEnd = aKhep + FR(24);
  const dotAt = (i: number) => dotStart + (dotEnd - dotStart) * (i / N);
  const candleLit = 1 - sf(prog, aVi + FR(10), FR(16)); // nến cuối cùng lịm tắt

  return (
    <Paper variant="night">
      {/* silhouette hậu duệ — BASE f07 reuse, mờ */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.24 * sf(prog, 0, 0.05) }}>
        <Img
          src={staticFile("xi-vu-ba-toc/f07-hung-vuong.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(3px) brightness(0.7) saturate(0.8)" }}
        />
      </div>

      {/* vòng tròn 54 chấm — nối dần khép (không hiển thị số) */}
      {Array.from({ length: N }, (_, i) => {
        const th = (i / N) * 2 * Math.PI - Math.PI / 2;
        const x = CX + Math.cos(th) * R;
        const y = CY + Math.sin(th) * R;
        const amber = i % 9 === 4;
        return (
          <div
            key={`d${i}`}
            style={{
              position: "absolute",
              left: x - (amber ? 7 : 5),
              top: y - (amber ? 7 : 5),
              width: amber ? 14 : 10,
              height: amber ? 14 : 10,
              borderRadius: "50%",
              background: amber ? C.amber : C.cream,
              opacity: sf(prog, dotAt(i), 0.006),
            }}
          />
        );
      })}
      <InkDraw d={circleD(CX, CY, R)} startFrac={aKhep} endFrac={aKhep + FR(36)} stroke={C.amber} strokeWidth={3} />

      {/* nến cuối cùng giữa vòng */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Lamp x={CX} y={CY + 26} lit={candleLit} mode="lit" pulse={0} />
      </svg>

      {/* lời cuối */}
      <Reveal startFrac={aCam} endFrac={aCam + FR(22)} style={{ position: "absolute", top: 874, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ ...txt(34, { c: C.cream, w: 500 }) }}>cảm ơn tổ tiên — không phải vì thần thánh</div>
      </Reveal>
      <SpringPop startFrac={aVi} style={{ position: "absolute", top: 932, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ ...txt(48, { f: FONT.display, c: C.amber, w: 700, ls: 4 }) }}>Vì đã ở lại.</div>
      </SpringPop>

      {/* transition_out fade */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: sf(prog, 0.93, 0.07) }} />
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC065 — THẺ CUỐI MÙA + CREDIT (s30) · text_card · giấy dó kết
// ════════════════════════════════════════════════════════════════════════════
export const Sc065: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aDi = A("đi hết vòng tròn mùa một");
  const aSau = A("sáu tập, từ gene đến trống đồng");
  const aTang = A("không tầng nào cướp chỗ tầng nào");

  const pulse = 1 + 0.03 * Math.sin(frame / 7);

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        {/* vòng tròn sáu vạch — một vòng tròn khép */}
        <InkDraw d={circleD(960, 350, 238)} startFrac={aDi} endFrac={aDi + FR(52)} stroke={C.mute} strokeWidth={3} />
        {Array.from({ length: 6 }, (_, i) => {
          const th = ((-90 + i * 60) * Math.PI) / 180;
          const x1 = 960 + Math.cos(th) * 238;
          const y1 = 350 + Math.sin(th) * 238;
          const x2 = 960 + Math.cos(th) * 262;
          const y2 = 350 + Math.sin(th) * 262;
          return <InkDraw key={`k${i}`} d={`M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`} startFrac={aSau + FR(8 * i)} endFrac={aSau + FR(8 * i + 10)} stroke={C.amber} strokeWidth={5} />;
        })}

        <div style={{ position: "absolute", top: 252, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <SceneTitle
            eyebrow="VN-MYTH"
            title="Season 1 — khép trọn"
            subtitle="sáu tập, từ gene đến trống đồng — từ phả hệ viral đến di truyền học"
            align="center"
            startFrac={aDi}
          />
        </div>

        {/* nút đăng ký vẽ mực */}
        <SpringPop startFrac={aTang + FR(55)} style={{ position: "absolute", top: 636, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              transform: `scale(${pulse})`,
              border: `3px solid ${C.amber}`,
              borderRadius: 999,
              padding: "20px 56px",
              ...txt(32, { c: C.amber, w: 700, ls: 4 }),
            }}
          >
            NHẤN ĐĂNG KÝ — cùng sang sông Season 2
          </div>
        </SpringPop>

        {/* credit nguồn */}
        <Reveal startFrac={aTang + FR(95)} style={{ position: "absolute", top: 878, left: 310, width: 1300, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.body, fontSize: 21, color: C.mute, lineHeight: 1.7 }}>
            Nguồn: Sử ký Tư Mã Thiên · Sơn Hải Kinh · Quốc ngữ Sở ngữ · Thiên Quan Thư · Long Ngư Hà Đồ
            <br />
            nghiên cứu di truyền Hmong-Mien · trống đồng Đông Sơn · thành Cổ Loa
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC066 — TEASER SEASON 2 + TẮT NẾN (s30) · animation · night
// ════════════════════════════════════════════════════════════════════════════
export const Sc066: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aTea = A("từ huyền sử sang lịch sử có chữ");
  const aSong = A("chuyến sang sông");
  const aKep = A("khép trọn");

  const candles = [
    { x: 760, color: C.amber },
    { x: 960, color: C.teal },
    { x: 1160, color: C.warn },
  ];
  const flame = (i: number) => {
    const flick = 0.85 + 0.15 * Math.sin(frame / 3.2 + i * 2.1);
    return flick * (1 - sf(prog, aKep + FR(8 + 12 * i), FR(14)));
  };

  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        {/* teaser */}
        <Reveal startFrac={aTea} endFrac={aTea + FR(26)} style={{ position: "absolute", top: 232, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(58, { f: FONT.display, c: C.amber, w: 700, ls: 14 }) }}>SEASON 2</div>
        </Reveal>
        <Reveal startFrac={aTea + FR(8)} endFrac={aTea + FR(34)} style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(44, { c: C.cream, w: 600 }) }}>từ huyền sử sang lịch sử có chữ</div>
        </Reveal>
        <Reveal startFrac={aTea + FR(36)} endFrac={aTea + FR(58)} style={{ position: "absolute", top: 408, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(27, { c: C.mute }) }}>— và những bất ngờ không kém gì mùa này</div>
        </Reveal>

        {/* hẹn gặp lại */}
        <Reveal startFrac={aSong} endFrac={aSong + FR(22)} style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.amber}>nhấn đăng ký — không lỡ chuyến sang sông</Chip>
        </Reveal>

        {/* Season một — khép trọn */}
        <SpringPop startFrac={aKep} style={{ position: "absolute", top: 668, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(46, { f: FONT.display, c: C.cream, w: 600, ls: 6 }) }}>Season một — khép trọn.</div>
        </SpringPop>

        {/* ba ngọn nến của ba tộc — tắt lần cuối theo ba sắc mực */}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          {candles.map((cd, i) => (
            <g key={`c${i}`} opacity={0.92}>
              <line x1={cd.x} y1={930} x2={cd.x} y2={836} stroke={C.mute} strokeWidth={7} strokeLinecap="round" />
              <line x1={cd.x - 16} y1={930} x2={cd.x + 16} y2={930} stroke={C.mute} strokeWidth={5} strokeLinecap="round" />
              <ellipse
                cx={cd.x}
                cy={818}
                rx={9}
                ry={16}
                fill={cd.color}
                opacity={flame(i)}
                style={{ filter: `drop-shadow(0 0 12px ${cd.color})` }}
              />
            </g>
          ))}
        </svg>

        {/* tối dần tuyệt đối */}
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: sf(prog, 0.88, 0.1) }} />
      </div>
    </Paper>
  );
};
