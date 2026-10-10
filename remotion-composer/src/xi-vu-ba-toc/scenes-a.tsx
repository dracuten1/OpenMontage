// EP.06 xi-vu-ba-toc — scenes group A (S3-A compose worker)
// 11 scenes s01→s06. Speech-lock: useA() trả về FRACTION của scene — feed vào startFrac.
// Anchors theo spec_A.json (đã verify trong window). Tọa độ 1920x1080.
import React from "react";
import { Img, useCurrentFrame, staticFile } from "remotion";
import {
  Paper,
  Reveal,
  SpringPop,
  InkDraw,
  InkPath,
  circleD,
  SourceTag,
  Chip,
  LegendFrame,
  SceneTitle,
  DossierBadge,
  plateSrc,
  InkImageScene,
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

const zhTxt = (size: number, o: { w?: number; c?: string; ls?: number } = {}) => ({
  fontFamily: FONT.hanzi,
  fontSize: size,
  fontWeight: o.w ?? 700,
  color: o.c ?? C.amber,
  letterSpacing: o.ls ?? 8,
  lineHeight: 1.1,
});

// mũi tên nhọn CSS
const Head: React.FC<{ color: string; dir: "right" | "down" }> = ({ color, dir }) => (
  <div
    style={{
      width: 0,
      height: 0,
      ...(dir === "right"
        ? { borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: `14px solid ${color}` }
        : { borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: `14px solid ${color}` }),
    }}
  />
);

// đường xoắn ốc Cổ Loa 3 vòng, từ tâm ra ngoài
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

// ════════════════════════════════════════════════════════════════════════════
// SC001 — MỞ TẬP · HERO TITLE + LÁ CỜ INK (s01)
// ════════════════════════════════════════════════════════════════════════════
export const Sc001: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aThua = A("thua trận");
  const aChia = A("chia nhau mang đi");
  const aCo = A("vẽ hình ông lên lá cờ");
  const aDep = A("dẹp loạn");
  const sway = sf(prog, aCo + FR(46), FR(6)) * Math.sin(frame / 6.5) * 2.6;

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        <Reveal startFrac={aThua} endFrac={aThua + 0.05} style={{ position: "absolute", top: 58, right: 88 }}>
          <div style={{ ...zhTxt(118, { ls: 14 }) }}>蚩尤</div>
        </Reveal>

        <div style={{ position: "absolute", top: 172, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <SceneTitle
            eyebrow="VN-MYTH · MÙA MỘT · TẬP CUỐI"
            title="Xi Vưu — vị tổ chung của ba tộc người?"
            subtitle="ba ký ức — một tấm gương đồng · soi từng lớp một"
            align="center"
            startFrac={aThua}
          />
        </div>

        {/* lá cờ chiến — nét mực vẽ theo narration (page coords) */}
        <InkDraw d="M800,546 L800,968" startFrac={aCo} endFrac={aCo + FR(14)} stroke={C.cream} strokeWidth={7} />
        <div style={{ position: "absolute", inset: 0, transform: `skewY(${sway}deg)`, transformOrigin: "800px 554px" }}>
          <InkDraw
            d="M800,554 C910,548 1000,562 1100,580 L1086,686 C990,674 900,680 800,706 Z"
            startFrac={aCo + FR(8)}
            endFrac={aCo + FR(42)}
            stroke={C.warn}
            strokeWidth={6}
          />
          <InkDraw d={circleD(876, 590, 14)} startFrac={aCo + FR(26)} endFrac={aCo + FR(38)} stroke={C.amber} strokeWidth={4} />
          <InkDraw d="M860,616 C920,612 980,620 1028,632" startFrac={aCo + FR(30)} endFrac={aCo + FR(50)} stroke={C.amber} strokeWidth={4} />
          <InkDraw d="M860,650 C920,646 980,654 1028,664" startFrac={aCo + FR(34)} endFrac={aCo + FR(54)} stroke={C.amber} strokeWidth={4} />
        </div>

        <Reveal startFrac={aChia} style={{ position: "absolute", left: 132, top: 760 }}>
          <Chip color={C.mute}>thân thể bị chia nhau — mỗi nơi một xứ</Chip>
        </Reveal>
        <Reveal startFrac={aDep} style={{ position: "absolute", right: 132, top: 760 }}>
          <Chip color={C.teal}>giương lên — để dẹp loạn</Chip>
        </Reveal>

        <SourceTag text="theo huyền sử" bottom={56} />
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC002 — GƯƠNG ĐỒNG + BA BÓNG NGƯỜI (ảnh gen BASE + overlay) (s01)
// ════════════════════════════════════════════════════════════════════════════
export const Sc002: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aHan = A("người Hán thờ làm thần chiến tranh");
  const aHm = A("vị vua tổ khai sáng");
  const aBV = A("thủy tổ của Bách Việt");
  const aGuong = A("tấm gương đồng");
  const aTen = Math.min(0.965, aBV + FR(120)); // "Tên ông: Xi Vưu" — stagger từ anchor Bách Việt

  return (
    <InkImageScene src={plateSrc("img-sc002.png")} focus={{ x: 0.5, y: 0.46 }}>
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0.012, 0.03) }}>
        <Reveal startFrac={aHan} style={{ position: "absolute", left: 96, top: 96 }}>
          <Chip color={C.amber}>HÁN — thờ làm thần chiến tranh</Chip>
        </Reveal>
        <Reveal startFrac={aHm} style={{ position: "absolute", right: 96, top: 484 }}>
          <Chip color={C.warn}>H'MÔNG — vua tổ khai sáng</Chip>
        </Reveal>
        <Reveal startFrac={aBV} style={{ position: "absolute", left: 96, bottom: 218 }}>
          <Chip color={C.teal}>VIỆT — thủy tổ Bách Việt</Chip>
        </Reveal>

        <Reveal startFrac={aBV} style={{ position: "absolute", right: 76, bottom: 54, opacity: 0.22 }}>
          <div style={{ ...zhTxt(180, { c: C.teal, ls: 16 }) }}>百越</div>
        </Reveal>

        <Reveal startFrac={aTen} style={{ position: "absolute", left: 0, right: 0, bottom: 148, textAlign: "center" }}>
          <div style={{ ...txt(108, { f: FONT.display, w: 700, ls: 22, c: C.white }) }}>XI VƯU</div>
        </Reveal>
        <Reveal startFrac={aGuong} style={{ position: "absolute", left: 0, right: 0, bottom: 96, textAlign: "center" }}>
          <div style={{ ...txt(32, { c: C.amber }) }}>ba ký ức — lên cùng một tấm gương đồng</div>
        </Reveal>
      </div>
    </InkImageScene>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC003 — VÒNG TRÒN SÁU TẬP (s02)
// ════════════════════════════════════════════════════════════════════════════
export const Sc003: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aQ = A("người Việt đến từ đâu");
  const aGene = A("chuyện gene, ta sẽ nói lại ở cuối tập");
  const aDat = A("từng lớp đất");

  const dotAt = [aQ, aQ + FR(28), aQ + FR(56), aGene, aDat, aDat + FR(42)];
  const cx = 1400;
  const cy = 545;
  const R = 265;
  const dots = dotAt.map((at, i) => {
    const ang = (-90 + i * 60) * (Math.PI / 180);
    return { at, n: i + 1, x: cx + Math.cos(ang) * R, y: cy + Math.sin(ang) * R };
  });
  const ghost = 0.32 * sf(prog, 0, 0.03) * (1 - sf(prog, aQ + 0.02, 0.09));

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        {/* sơ đồ Ep.01 mờ nền rồi tan */}
        <div style={{ position: "absolute", left: 700, top: 400, opacity: ghost, textAlign: "center" }}>
          <div style={{ ...txt(30, { c: C.mute }), border: `2px solid ${C.mute}`, borderRadius: 8, padding: "14px 34px" }}>
            Rồng Tiên
          </div>
          <div style={{ width: 2, height: 44, background: C.mute, margin: "0 auto" }} />
          <div style={{ ...txt(30, { c: C.mute }), border: `2px solid ${C.mute}`, borderRadius: 8, padding: "14px 34px" }}>
            Văn Lang
          </div>
        </div>

        <div style={{ position: "absolute", left: 110, top: 316, width: 640 }}>
          <LegendFrame label="SÁU TẬP — MỘT VÒNG TRÒN">
            <div style={{ padding: "6px 4px" }}>
              <Reveal startFrac={aQ}>
                <div style={{ ...txt(31), marginBottom: 26 }}>T1 · câu hỏi — người Việt đến từ đâu?</div>
              </Reveal>
              <Reveal startFrac={aGene}>
                <div style={{ ...txt(31), marginBottom: 26 }}>…chuyện gene — sẽ nói lại ở cuối tập</div>
              </Reveal>
              <Reveal startFrac={aDat}>
                <div style={{ ...txt(31) }}>…từng lớp đất — quốc hiệu · danh xưng · cư dân</div>
              </Reveal>
            </div>
          </LegendFrame>
        </div>

        {/* vòng tròn tự vẽ 1→6 */}
        <InkDraw d={circleD(cx, cy, R)} startFrac={aQ} endFrac={dotAt[5]} stroke={C.amber} strokeWidth={5} />
        {dots.map((d) => (
          <SpringPop
            key={d.n}
            startFrac={d.at}
            style={{
              position: "absolute",
              left: d.x - 29,
              top: d.y - 29,
              width: 58,
              height: 58,
              borderRadius: "50%",
              border: `3px solid ${C.amber}`,
              background: "rgba(18,13,9,0.88)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ ...txt(29, { f: FONT.display, w: 600 }) }}>{d.n}</span>
          </SpringPop>
        ))}
        {/* chốt vòng khép */}
        <SpringPop
          startFrac={dotAt[5]}
          style={{
            position: "absolute",
            left: dots[5].x - 40,
            top: dots[5].y - 40,
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: `3px solid ${C.teal}`,
            opacity: 0.55 + 0.45 * Math.abs(Math.sin(frame / 8)),
          }}
        />
        <Reveal startFrac={dotAt[5] + FR(8)} style={{ position: "absolute", left: 970, top: 972, width: 860, textAlign: "center" }}>
          <div style={{ ...txt(30, { c: C.teal }) }}>hôm nay — vòng tròn khép lại</div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC004 — SƠ ĐỒ MỚI, NÉT ĐẦU (s02)
// ════════════════════════════════════════════════════════════════════════════
export const Sc004: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aRT = A("sơ đồ Rồng Tiên");
  const aKMT = A("sơ đồ mang tên một kẻ thua trận");
  const aBaToc = A("ba tộc người cùng nhận ông làm tổ");

  const chain = [
    { zh: "蚩尤", vi: "Xi Vưu" },
    { zh: "九黎", vi: "Cửu Lê" },
    { zh: "三苗", vi: "Tam Miêu" },
    { zh: "百越", vi: "Bách Việt" },
  ];
  const boxAt = [aKMT, aKMT + FR(26), aKMT + FR(52), aKMT + FR(78)];
  const x0 = 140;
  const step = 435;
  const y0 = 385;
  const ghost = 0.4 * sf(prog, Math.max(0, aRT - FR(6)), 0.015) * (1 - sf(prog, aKMT + 0.04, 0.1));

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        {/* kicker hai vế */}
        <div style={{ position: "absolute", top: 172, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 }}>
          <Reveal startFrac={aRT}>
            <span style={{ ...txt(40, { c: C.mute }), textDecoration: frame >= aKMT * dur ? "line-through" : "none" }}>
              không phải sơ đồ Rồng Tiên
            </span>
          </Reveal>
          <Reveal startFrac={aKMT + FR(4)}>
            <span style={{ ...txt(40, { c: C.amber, w: 500 }) }}>— mà là sơ đồ mang tên một kẻ thua trận</span>
          </Reveal>
        </div>

        {/* sơ đồ Ep.01 mờ phía sau */}
        <div style={{ position: "absolute", left: 770, top: 250, opacity: ghost, textAlign: "center" }}>
          <div style={{ ...txt(28, { c: C.mute }), border: `2px solid ${C.mute}`, borderRadius: 8, padding: "10px 26px" }}>
            Rồng Tiên
          </div>
          <div style={{ width: 2, height: 34, background: C.mute, margin: "0 auto" }} />
          <div style={{ ...txt(28, { c: C.mute }), border: `2px solid ${C.mute}`, borderRadius: 8, padding: "10px 26px" }}>
            Văn Lang
          </div>
        </div>

        {/* chuỗi 4 ô */}
        {chain.map((n, i) => (
          <Reveal key={n.vi} startFrac={boxAt[i]} style={{ position: "absolute", left: x0 + i * step, top: y0 }}>
            <div
              style={{
                width: 330,
                height: 150,
                border: `3px solid ${C.cream}`,
                borderRadius: 10,
                background: "rgba(26,18,11,0.78)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <div style={{ ...zhTxt(58) }}>{n.zh}</div>
              <div style={{ ...txt(34) }}>{n.vi}</div>
            </div>
          </Reveal>
        ))}

        {/* 3 mũi tên nhạt */}
        {chain.slice(0, 3).map((n, i) => {
          const x1 = x0 + i * step + 330 + 14;
          const x2 = x1 + 68;
          return (
            <InkDraw
              key={n.vi}
              d={`M${x1},460 L${x2},460 M${x2 - 12},452 L${x2},460 L${x2 - 12},468`}
              startFrac={boxAt[i] + FR(16)}
              endFrac={boxAt[i] + FR(30)}
              stroke={C.mute}
              strokeWidth={4}
            />
          );
        })}
        {/* mũi tên cuối chừa dở */}
        <div
          style={{
            position: "absolute",
            left: x0 + 3 * step + 330 + 16,
            top: 452,
            width: 118,
            borderTop: `3px dashed ${C.mute}`,
            opacity: 0.72 * sf(prog, boxAt[3] + FR(34), 0.017),
          }}
        />

        <Reveal startFrac={aBaToc} style={{ position: "absolute", top: 660, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(38, { w: 500, c: C.white }) }}>Xi Vưu — ba tộc người cùng nhận ông làm tổ</div>
        </Reveal>
        <Reveal startFrac={aBaToc + FR(18)} style={{ position: "absolute", top: 730, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.warn}>sơ đồ mới — chưa hoàn chỉnh</Chip>
        </Reveal>
      </div>
      <WipeInk startFrac={0.93} color={C.bg} />
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC005 — HAI NHÁNH HUYỀN SỬ (s03)
// ════════════════════════════════════════════════════════════════════════════
export const Sc005: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const aHai = A("đặt hai nhánh huyền sử cạnh nhau");
  const aCC = A("con cháu Thần Nông");
  const aChia = A("Đế Minh chia làm hai nhánh");
  const aCuoi = A("cuối thời Thần Nông");

  const node: React.CSSProperties = {
    width: 280,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(26,18,11,0.78)",
  };

  return (
    <Paper>
      <WipeInk startFrac={0} color={C.bg} />
      <div style={{ position: "absolute", inset: 0 }}>
        <Reveal startFrac={aHai} style={{ position: "absolute", top: 104, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(46, { f: FONT.display, c: C.amber, w: 600, ls: 6 }) }}>HAI NHÁNH HUYỀN SỬ</div>
        </Reveal>

        {/* hai nhánh vẽ đồng thời, song song, KHÔNG nối nhau */}
        <InkDraw d="M960,292 C820,360 680,420 560,470" startFrac={aChia} endFrac={aChia + FR(36)} stroke={C.amber} strokeWidth={5} />
        <InkDraw d="M960,292 C1100,360 1240,420 1360,470" startFrac={aChia} endFrac={aChia + FR(36)} stroke={C.warn} strokeWidth={5} />
        <InkDraw d="M548,448 L560,470 L582,462" startFrac={aChia + FR(32)} endFrac={aChia + FR(40)} stroke={C.amber} strokeWidth={4} />
        <InkDraw d="M1372,448 L1360,470 L1338,462" startFrac={aChia + FR(32)} endFrac={aChia + FR(40)} stroke={C.warn} strokeWidth={4} />
        {/* nhánh trái nối xuống Văn Lang */}
        <InkDraw d="M560,566 L560,632 M552,622 L560,640 L568,622" startFrac={aChia + FR(42)} endFrac={aChia + FR(58)} stroke={C.amber} strokeWidth={4} />

        {/* gốc Thần Nông */}
        <div style={{ position: "absolute", left: 810, top: 200, ...node, height: 92, border: `3px solid ${C.cream}` }}>
          <SpringPop startFrac={aCC}>
            <span style={{ ...txt(38, { w: 600, ls: 4, c: C.white }) }}>THẦN NÔNG</span>
          </SpringPop>
        </div>
        <Reveal startFrac={aCuoi} style={{ position: "absolute", left: 1136, top: 208 }}>
          <div style={{ ...zhTxt(52, { c: C.mute, w: 400, ls: 6 }) }}>炎帝</div>
          <div style={{ ...txt(21, { c: C.mute }) }}>thời Viêm Đế</div>
        </Reveal>

        {/* nhánh trái — Rồng Tiên → Văn Lang (hổ phách) */}
        <Reveal startFrac={aChia + FR(28)} style={{ position: "absolute", left: 420, top: 470 }}>
          <div style={{ ...node, height: 96, border: `3px solid ${C.amber}` }}>
            <span style={{ ...txt(34, { c: C.amber, w: 500 }) }}>RỒNG TIÊN</span>
          </div>
        </Reveal>
        <Reveal startFrac={aChia + FR(56)} style={{ position: "absolute", left: 420, top: 640 }}>
          <div style={{ ...node, height: 96, border: `3px solid ${C.amber}` }}>
            <span style={{ ...txt(34, { c: C.amber, w: 500 }) }}>VĂN LANG</span>
          </div>
        </Reveal>

        {/* nhánh phải — Xi Vưu (đỏ trầm) */}
        <Reveal startFrac={aCuoi} style={{ position: "absolute", left: 1220, top: 470 }}>
          <div style={{ ...node, height: 96, border: `3px solid ${C.warn}` }}>
            <span style={{ ...txt(34, { c: C.warn, w: 600 }) }}>XI VƯU</span>
          </div>
        </Reveal>

        <Reveal startFrac={aCuoi + FR(60)} style={{ position: "absolute", bottom: 104, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(28, { c: C.mute }) }}>hai nhánh — cùng sống trong một không gian thần thoại chung</div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC006 — LUẬT CHƠI: KÝ ỨC ≠ PHẢ HỆ + LY KÍNH (s03)
// ════════════════════════════════════════════════════════════════════════════
export const Sc006: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aMau = A("không có nghĩa là cùng một dòng máu");
  const aLaw = A("Thần thoại chở ký ức — không chở phả hệ");
  const aLy = A("tôn trọng tầng ký ức, kiểm tra tầng sự kiện");

  const t1 = sf(prog, aLaw, 0.045);
  const t2 = sf(prog, aLaw + FR(24), FR(8));

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        <Reveal startFrac={aMau} style={{ position: "absolute", top: 208, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(34, { c: C.mute }) }}>cùng một bối cảnh thần thoại — không có nghĩa là cùng một dòng máu</div>
        </Reveal>

        {/* công thức hai tầng trượt đối diện */}
        <div style={{ position: "absolute", top: 400, left: 0, right: 0, textAlign: "center" }}>
          <Reveal startFrac={aLaw}>
            <div style={{ ...txt(96, { f: FONT.display, c: C.amber, w: 700, ls: 16 }), transform: `translateX(${(1 - t1) * -170}px)` }}>
              KÝ ỨC
            </div>
          </Reveal>
          <div
            style={{
              height: 2,
              width: 760,
              margin: "22px auto",
              background: C.cream,
              boxShadow: `0 0 14px 3px ${C.amber}`,
              transform: `scaleX(${t2})`,
            }}
          />
          <Reveal startFrac={aLaw}>
            <div style={{ ...txt(96, { f: FONT.display, c: C.warn, w: 700, ls: 16 }), transform: `translateX(${(1 - t1) * 170}px)` }}>
              PHẢ HỆ
            </div>
          </Reveal>
        </div>

        <Reveal startFrac={aLy} style={{ position: "absolute", top: 742, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ ...txt(36, { c: C.amber, w: 500 }) }}>tôn trọng tầng ký ức</span>
          <span style={{ ...txt(36, { c: C.mute }) }}> — </span>
          <span style={{ ...txt(36, { c: C.teal, w: 500 }) }}>kiểm tra tầng sự kiện</span>
        </Reveal>

        {/* chiếc ly kính hai tầng */}
        <InkDraw d="M1700,818 Q1700,866 1732,876 L1732,914" startFrac={aLy} endFrac={aLy + FR(22)} stroke={C.cream} strokeWidth={4} />
        <InkDraw d="M1764,818 Q1764,866 1732,876 L1732,914" startFrac={aLy} endFrac={aLy + FR(22)} stroke={C.cream} strokeWidth={4} />
        <InkDraw d="M1732,914 L1732,940" startFrac={aLy + FR(14)} endFrac={aLy + FR(24)} stroke={C.cream} strokeWidth={4} />
        <InkDraw d="M1714,948 L1750,948" startFrac={aLy + FR(18)} endFrac={aLy + FR(28)} stroke={C.cream} strokeWidth={4} />
        <InkDraw d="M1708,848 Q1732,854 1756,848" startFrac={aLy + FR(24)} endFrac={aLy + FR(38)} stroke={C.amber} strokeWidth={3} />
        <InkDraw d="M1712,865 Q1732,870 1752,865" startFrac={aLy + FR(32)} endFrac={aLy + FR(46)} stroke={C.teal} strokeWidth={3} />
        <Reveal startFrac={aLy + FR(34)} style={{ position: "absolute", right: 300, top: 862 }}>
          <div style={{ ...txt(23, { c: C.amber }) }}>← ký ức</div>
        </Reveal>
        <Reveal startFrac={aLy + FR(42)} style={{ position: "absolute", right: 300, top: 898 }}>
          <div style={{ ...txt(23, { c: C.teal }) }}>← sự kiện</div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC007 — LỚP ĐẤT BỐN TẦNG + TRỐNG ĐỒNG (s04) — BASE f11 reuse
// ════════════════════════════════════════════════════════════════════════════
export const Sc007: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aStrat = A("Phùng Nguyên, Đồng Đậu, Gò Mun, Đông Sơn");
  const aTrong = A("tiếng trống đồng");
  const aLien = A("liền mạch, chưa từng đứt");

  // trầm tích: dưới cùng = cũ nhất (Phùng Nguyên), trên cùng = Đông Sơn
  const strata = [
    { vi: "PHÙNG NGUYÊN", y: 910 },
    { vi: "ĐỒNG ĐẬU", y: 820 },
    { vi: "GÒ MUN", y: 730 },
    { vi: "ĐÔNG SƠN", y: 640 },
  ];
  const appear = (i: number) => aStrat + FR(12 + i * 13); // đọc theo thứ tự tên: Phùng Nguyên → Đông Sơn
  const pulse = 0.55 * Math.abs(Math.sin((frame - aTrong * dur) / 4.5)) * (1 - sf(prog, aTrong, FR(46)));

  return (
    <Paper variant="teal">
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        {/* mặt đất */}
        <InkDraw d="M150,600 L1150,600" startFrac={Math.max(0.01, aStrat - FR(8))} endFrac={aStrat + FR(12)} stroke={C.mute} strokeWidth={4} />
        <Reveal startFrac={Math.max(0.01, aStrat - FR(4))} style={{ position: "absolute", left: 150, top: 548 }}>
          <div style={{ ...txt(24, { c: C.mute }) }}>đồng bằng sông Hồng</div>
        </Reveal>

        {/* 4 tầng trầm tích */}
        {strata.map((s, i) => {
          const t = sf(prog, appear(i), FR(16));
          const depth = (strata.length - 1 - i) / 3; // 0 = Đông Sơn (trên) → 1 = Phùng Nguyên (sâu)
          return (
            <div
              key={s.vi}
              style={{
                position: "absolute",
                left: 150,
                top: s.y,
                width: 1000 * t,
                height: 86,
                background: `linear-gradient(180deg, rgba(32,58,54,${0.5 + depth * 0.28}), rgba(18,24,22,${0.62 + depth * 0.25}))`,
                borderLeft: `6px solid ${C.teal}`,
                borderBottom: "1px solid rgba(160,180,170,0.18)",
                opacity: Math.max(0.001, t),
                display: "flex",
                alignItems: "center",
                paddingLeft: 30,
                overflow: "hidden",
              }}
            >
              {t > 0.6 && <span style={{ ...txt(30, { w: 600, ls: 4 }), opacity: clamp01((t - 0.6) / 0.4) }}>{s.vi}</span>}
            </div>
          );
        })}

        {/* dây liền mạch xuyên suốt */}
        <InkDraw d="M1188,616 L1188,996" startFrac={aLien} endFrac={aLien + FR(26)} stroke={C.teal} strokeWidth={5} />
        <Reveal startFrac={aLien + FR(16)} style={{ position: "absolute", left: 1216, top: 606 }}>
          <Chip color={C.teal}>liền mạch — chưa từng đứt</Chip>
        </Reveal>

        {/* mặt trống đồng Đông Sơn — reuse f11, sáng lên + pulse */}
        <div
          style={{
            position: "absolute",
            left: 1400,
            top: 90,
            width: 380,
            height: 380,
            borderRadius: "50%",
            overflow: "hidden",
            border: `5px solid ${C.amber}`,
            opacity: 0.3 + 0.7 * sf(prog, aTrong, 0.02),
            filter: `brightness(${1 + pulse})`,
          }}
        >
          <Img src={staticFile("xi-vu-ba-toc/f11-dong-son.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <InkDraw d={circleD(1590, 280, 176)} startFrac={aTrong} endFrac={aTrong + FR(26)} stroke={C.amber} strokeWidth={5} />
        <Reveal startFrac={aTrong + FR(10)} style={{ position: "absolute", left: 1400, top: 496, width: 380, textAlign: "center" }}>
          <Chip color={C.amber}>trống đồng Đông Sơn</Chip>
        </Reveal>

        <SourceTag text="đồng bằng sông Hồng" bottom={56} />
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC008 — CỔ LOA XOẮN TRÔN ỐC (s04)
// ════════════════════════════════════════════════════════════════════════════
export const Sc008: React.FC<SceneProps> = () => {
  const A = useA();
  const { dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const aXoan = A("thành xoắn trôn ốc");
  const aCT = A("công trình tiền sử lớn nhất Đông Nam Á");
  const aTo = A("một vị tổ thật to");

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0 }}>
        <Reveal startFrac={aXoan} style={{ position: "absolute", top: 158, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(54, { f: FONT.display, c: C.amber, w: 600, ls: 10 }) }}>CỔ LOA</div>
        </Reveal>
        <Reveal startFrac={aCT} style={{ position: "absolute", top: 234, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(38, { w: 500, c: C.white }) }}>công trình tiền sử lớn nhất Đông Nam Á</div>
        </Reveal>

        <InkDraw
          d={CO_LOA_SPIRAL}
          viewBox="-400 -400 800 800"
          width={800}
          height={800}
          style={{ position: "absolute", left: 560, top: 250 }}
          startFrac={aXoan + FR(4)}
          endFrac={aXoan + FR(134)}
          stroke={C.amber}
          strokeWidth={7}
        />
        <SpringPop startFrac={aXoan + FR(6)} style={{ position: "absolute", left: 952, top: 642, width: 16, height: 16, borderRadius: "50%", background: C.warn }} />

        <Reveal startFrac={aTo} style={{ position: "absolute", top: 938, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(30, { c: C.mute }) }}>một khát vọng rất người — được có một vị tổ thật to</div>
        </Reveal>
        <SpringPop startFrac={aTo + FR(46)} style={{ position: "absolute", top: 992, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Chip color={C.warn}>XEM TIẾP</Chip>
        </SpringPop>
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC009 — ĐÈN BÁCH VIỆT TẮT DẦN (callback bản đồ Ep.05) (s05)
// ════════════════════════════════════════════════════════════════════════════
export const Sc009: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aDanh = A("danh xưng tập hợp ước lệ");
  const aTat = A("tắt dần — như đèn");
  const aDD = A("càng không phải một dòng dõi");

  // callback Ep.05: bản đồ cũ mờ hiện lại, đèn theo địa lý cũ; Lạc Việt là ngọn còn lại
  const keys = ["man", "dongau", "nam", "tayau", "lac"] as const;
  const lamps = keys.map((k) => ({ k, ...MAP_LAMPS[k] }));

  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        {/* BASE bản đồ Ep.05, mờ */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.42 * sf(prog, 0, 0.04) }}>
          <Img
            src={staticFile("bach-viet-bien-mat/images/img-sc002.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85) brightness(0.8)" }}
          />
        </div>

        <Reveal startFrac={aDanh} style={{ position: "absolute", top: 84, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(38, { f: FONT.display, c: C.amber, w: 600, ls: 6 }) }}>BÁCH VIỆT — một danh xưng tập hợp ước lệ</div>
        </Reveal>
        <Reveal startFrac={aDanh} style={{ position: "absolute", top: 160, right: 96, opacity: 0.4 }}>
          <div style={{ ...zhTxt(150, { c: C.mute, w: 400, ls: 12 }) }}>百越</div>
        </Reveal>

        {/* đèn tắt dần bắc → nam; ngọn Lạc Việt còn sáng */}
        <InkPath
          d="M300,780 C560,720 760,800 980,740 S1300,660 1520,720"
          startFrac={0.01}
          endFrac={0.09}
          stroke={C.mute}
          strokeWidth={3}
        />
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          {lamps.map((l, i) => {
            const isLast = i === lamps.length - 1;
            const offF = aTat + FR(18 * i);
            const lit = isLast ? 1 : 1 - sf(prog, offF, FR(12));
            return (
              <Lamp
                key={l.k}
                x={l.x}
                y={l.y}
                lit={lit}
                mode={isLast ? "red" : "lit"}
                pulse={isLast ? frame / 18 : 0}
              />
            );
          })}
        </svg>
        {lamps.map((l, i) => {
          const isLast = i === lamps.length - 1;
          const offF = aTat + FR(18 * i);
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
                opacity: dim * sf(prog, 0.03 + FR(6 * i), 0.02),
              }}
            >
              <span style={{ ...txt(24, { c: isLast ? C.amber : C.mute, w: 500 }) }}>{l.label}</span>
            </div>
          );
        })}

        <Reveal startFrac={aDD} style={{ position: "absolute", bottom: 84, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(32) }}>không phải một quốc gia — càng không phải một dòng dõi</div>
        </Reveal>
      </div>
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC010 — SƠ ĐỒ VIRAL HOÀN CHỈNH (s05)
// ════════════════════════════════════════════════════════════════════════════
export const Sc010: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const a1 = A("Xi Vưu sinh Cửu Lê");
  const a2 = A("Cửu Lê sinh Tam Miêu");
  const a3 = A("Tam Miêu hóa Bách Việt");
  const a4 = A("mỗi mũi tên trong đó dựa vào đâu");

  const nodes = [
    { zh: "蚩尤", vi: "Xi Vưu" },
    { zh: "九黎", vi: "Cửu Lê" },
    { zh: "三苗", vi: "Tam Miêu" },
    { zh: "百越", vi: "Bách Việt" },
    { zh: "", vi: "người Việt — hôm nay" },
  ];
  const nodeAt = [a1 - FR(14), a1 + FR(14), a2 + FR(14), a3 + FR(14), a3 + FR(50)];
  const arrowAt = [a1, a2, a3, a3 + FR(34)];
  const nodeY = (i: number) => 96 + i * 158;

  const Arrow: React.FC<{ at: number; i: number }> = ({ at, i }) => {
    const t = sf(prog, at, FR(12));
    const beat = 1 + 0.07 * Math.max(0, Math.sin((frame - at * dur) / 5));
    return (
      <div
        style={{
          position: "absolute",
          left: 956,
          top: nodeY(i) + 104,
          width: 8,
          opacity: t,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `scaleY(${beat})`,
        }}
      >
        <div style={{ width: 7, height: 30, background: C.warn, borderRadius: 3 }} />
        <Head color={C.warn} dir="down" />
      </div>
    );
  };

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 42, border: `1px solid ${C.mute}`, borderRadius: 6, opacity: 0.35, pointerEvents: "none" }} />
      <DossierBadge text="sơ đồ khán giả gửi — dưới video tập trước" />

      {nodes.map((n, i) => (
        <Reveal key={n.vi} startFrac={Math.max(0.01, nodeAt[i])} style={{ position: "absolute", left: 650, top: nodeY(i) }}>
          <div
            style={{
              width: 620,
              height: 104,
              borderRadius: 10,
              border: `3px solid ${i === 0 ? C.warn : C.cream}`,
              background: "rgba(26,18,11,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 30,
            }}
          >
            {n.zh && <span style={{ ...zhTxt(52) }}>{n.zh}</span>}
            <span style={{ ...txt(36, { w: i === 0 ? 600 : 400, c: C.white }) }}>{n.vi}</span>
          </div>
        </Reveal>
      ))}

      {arrowAt.map((at, i) => (
        <Arrow key={i} at={at} i={i} />
      ))}

      {/* dấu hỏi trên từng mũi tên */}
      {arrowAt.map((_, i) => (
        <SpringPop
          key={`q${i}`}
          startFrac={a4 + FR(6 * i)}
          style={{ position: "absolute", left: 1014, top: nodeY(i) + 104 }}
        >
          <span style={{ ...txt(40, { f: FONT.display, c: C.warn, w: 700 }) }}>?</span>
        </SpringPop>
      ))}

      <Reveal startFrac={a4} style={{ position: "absolute", top: 898, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ ...txt(34, { w: 500, c: C.white }) }}>sơ đồ gọn, thẳng, cảm động — mỗi mũi tên trong đó dựa vào đâu?</div>
      </Reveal>

      <SourceTag text="sơ đồ khán giả gửi" bottom={56} right />
      <WipeInk startFrac={0.93} color={C.bg} />
    </Paper>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SC011 — MỤC LỤC BA HỒI — BA CON DẤU (s06)
// ════════════════════════════════════════════════════════════════════════════
export const Sc011: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const FR = (f: number) => f / Math.max(1, dur);
  const prog = frame / Math.max(1, dur);
  const aH1 = A("Hồi một");
  const aH2 = A("Hồi hai");
  const aH3 = A("Hồi ba");
  const aPT = A("phiên tòa");
  const aLen = 0.915; // "Mời ngọn nến đầu tiên" — cuối scene (656f)

  const rows = [
    {
      at: aH1,
      y: 250,
      color: C.amber,
      numeral: "I",
      title: "Kẻ thua được thờ",
      sub: "trận Trác Lộc — kẻ thắng thờ kẻ thua",
      ink: "truyền thuyết",
    },
    {
      at: aH2,
      y: 505,
      color: C.warn,
      numeral: "II",
      title: "Ba tộc, ba ký ức",
      sub: "Hán · H'Mông · Việt — soi một tấm gương đồng",
      ink: "ký ức",
    },
    {
      at: aH3,
      y: 760,
      color: C.teal,
      numeral: "III",
      title: "Gỡ sơ đồ",
      sub: "từng mũi tên đặt lên án đài",
      ink: "khoa học",
    },
  ];

  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, opacity: sf(prog, 0, 0.03) }}>
        <Reveal startFrac={Math.max(0.01, aH1 - FR(12))} style={{ position: "absolute", top: 112, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ ...txt(34, { c: C.mute, ls: 8 }) }}>TỐI NAY — BA VIỆC</div>
        </Reveal>

        {rows.map((r) => (
          <React.Fragment key={r.numeral}>
            <div style={{ position: "absolute", left: 210, top: r.y }}>
              <SpringPop startFrac={r.at} from={1.7}>
                <div
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 12,
                    border: `6px solid ${r.color}`,
                    background: "rgba(0,0,0,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: "rotate(-5deg)",
                  }}
                >
                  <div
                    style={{
                      width: 106,
                      height: 106,
                      borderRadius: 6,
                      border: `2px solid ${r.color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ ...txt(56, { f: FONT.display, c: r.color, w: 700 }) }}>{r.numeral}</span>
                  </div>
                </div>
              </SpringPop>
            </div>
            <Reveal startFrac={r.at + FR(8)} style={{ position: "absolute", left: 450, top: r.y + 6 }}>
              <div style={{ ...txt(48, { f: FONT.display, c: r.color, w: 600, ls: 3 }) }}>{r.title}</div>
              <div style={{ ...txt(26, { c: C.mute }), marginTop: 12 }}>{r.sub}</div>
              <div style={{ ...txt(23, { c: C.mute }), marginTop: 10 }}>
                <span style={{ color: r.color }}>●</span> mực {r.ink}
              </div>
            </Reveal>
          </React.Fragment>
        ))}

        <Reveal startFrac={aPT + FR(6)} style={{ position: "absolute", left: 450, top: 928 }}>
          <div style={{ ...txt(28, { c: C.teal }) }}>phiên tòa — soi bằng văn bản cổ và kính hiển vi di truyền</div>
        </Reveal>

        {/* ngọn nến đầu tiên */}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <Lamp x={1650} y={930} lit={sf(prog, aLen, 0.015)} mode="lit" pulse={frame / 16} />
        </svg>
        <Reveal startFrac={aLen} style={{ position: "absolute", right: 330, top: 892, textAlign: "right" }}>
          <div style={{ ...txt(26, { c: C.amber }) }}>mời ngọn nến đầu tiên</div>
        </Reveal>
      </div>
    </Paper>
  );
};
