// EP.06 xi-vu-ba-toc — scenes group D (sc034–sc044), speech-locked: A(word) -> startFrac.
// Đêm phiên tòa: phản chiếu gương — bốn phiên xử — kiểm kho.
import * as React from "react";
import {
  Paper, Reveal, SpringPop, InkDraw, InkPath, circleD, SourceTag, Chip,
  LegendFrame, DossierBadge, SceneTitle, WipeInk, Lamp, useA, useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const STAGE: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: 1920, height: 1080 };
const INKSVG: React.CSSProperties = { position: "absolute", inset: 0 };
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut3 = (p: number) => 1 - Math.pow(1 - p, 3);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const tealA = (a: number) => `rgba(127,209,200,${a})`;
const bronzeA = (a: number) => `rgba(201,143,78,${a})`;
const warnA = (a: number) => `rgba(200,85,61,${a})`;
const inkA = (a: number) => `rgba(26,23,20,${a})`;

// sc034 — PHẢN CHIẾU 3: sơ đồ viral trong gương (s17)
export const Sc034: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur, p } = useFrac();
  const F = (n: number) => n / dur;
  const aSoi = A("người Việt trên mạng xã hội");
  const aMui = A("mũi tên cuối chỉ thẳng về người Việt hôm nay");
  const aKhat = A("một cơn khát thật");
  const nodes = ["Xi Vưu", "Cửu Lê", "Tam Miêu", "Bách Việt", "người Việt hôm nay"];
  const mx = 210, my = 130, mw = 720, mh = 830, cx = mx + mw / 2;
  return (
    <Paper>
      <div style={STAGE}>
        {/* người soi lệch phải, giơ điện thoại */}
        <svg width={560} height={880} viewBox="0 0 560 880"
          style={{ position: "absolute", right: 60, top: 110 }}>
          <ellipse cx={430} cy={180} rx={72} ry={86} fill={inkA(0.85)} />
          <path d="M300 880 C300 560 360 330 430 300 C520 330 560 560 560 880 Z" fill={inkA(0.85)} />
          <rect x={316} y={430} width={88} height={152} rx={12} fill="#0e2b2b"
            stroke={tealA(0.9)} strokeWidth={4} opacity={frame >= aSoi * dur ? 1 : 0.25} />
          {frame >= aSoi * dur && (
            <circle cx={360} cy={506} r={7} fill="#7ff5e6"
              opacity={0.4 + 0.6 * Math.abs(Math.sin(frame * 0.3))} />
          )}
        </svg>
        {/* mặt gương đồng */}
        <div style={{ position: "absolute", left: mx, top: my, width: mw, height: mh, borderRadius: "50%",
          border: `10px solid ${bronzeA(0.75)}`,
          background: "linear-gradient(135deg, rgba(94,66,34,0.32), rgba(40,26,12,0.18) 60%, rgba(94,66,34,0.4))",
          boxShadow: "inset 0 0 90px rgba(60,38,16,0.55), 0 18px 50px rgba(20,12,6,0.45)" }} />
        {/* ánh điện tử lạnh hắt trên đồng */}
        <div style={{ position: "absolute", left: mx, top: my, width: mw, height: mh, borderRadius: "50%",
          background: "radial-gradient(ellipse at 70% 45%, rgba(127,209,200,0.30), rgba(127,209,200,0.06) 55%, transparent 72%)",
          mixBlendMode: "screen",
          opacity: (0.35 + 0.45 * p(0, 1)) * (0.8 + 0.2 * Math.sin(frame * 0.22)) }} />
        {/* sơ đồ viral phản chiếu — mũi tên đập nhịp heartbeat */}
        {nodes.map((n, i) => {
          const at = aSoi + F(8 + i * 9);
          const y = 235 + i * 122;
          const last = i === nodes.length - 1;
          return (
            <React.Fragment key={n}>
              {i > 0 && (
                <InkDraw d={`M ${cx} ${y - 64} L ${cx} ${y - 8}`} startFrac={at - F(3)}
                  endFrac={at + F(5)} stroke={tealA(0.85)} strokeWidth={4} style={INKSVG} />
              )}
              {i > 0 && frame > aSoi * dur + 12 + i * 9 && (
                <div style={{ position: "absolute", left: cx - 6, top: y - 44, width: 12, height: 12,
                  borderRadius: 6,
                  background: `rgba(127,245,230,${0.3 + 0.7 * Math.abs(Math.sin(frame * 0.3 - i * 0.7))})` }} />
              )}
              {last ? (
                <SpringPop startFrac={aMui} from={0.6}
                  style={{ position: "absolute", left: cx - 195, top: y, width: 390 }}>
                  <div style={{ padding: "14px 0", textAlign: "center", borderRadius: 16,
                    background: "rgba(10,42,40,0.92)", border: `3px solid ${tealA(0.95)}`, color: "#7ff5e6",
                    fontFamily: FONT.body, fontSize: 34, fontWeight: 700,
                    boxShadow: `0 0 ${26 + 14 * Math.abs(Math.sin(frame * 0.35))}px rgba(64,224,208,0.55)` }}>
                    {n}
                  </div>
                </SpringPop>
              ) : (
                <Reveal startFrac={at} dy={14} style={{ position: "absolute", left: cx - 165, top: y, width: 330 }}>
                  <div style={{ padding: "10px 0", textAlign: "center", borderRadius: 12,
                    border: `2px solid ${tealA(0.55)}`, color: C.teal, fontFamily: FONT.body, fontSize: 30,
                    background: "rgba(8,32,30,0.35)" }}>{n}</div>
                </Reveal>
              )}
            </React.Fragment>
          );
        })}
        <Reveal startFrac={aSoi} style={{ position: "absolute", left: 64, top: 48 }}>
          <Chip color={C.teal}>SOI GƯƠNG — LỚP 3</Chip>
        </Reveal>
        <Reveal startFrac={aKhat} dy={-10} style={{ position: "absolute", left: 100, top: 985, width: 1100 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 40, color: C.teal }}>
            đằng sau mỗi lượt chia sẻ — là khát khao cội nguồn
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc035 — TÌNH CẢM | PHẢ HỆ (s17)
export const Sc035: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const aDoi = A("tình cảm là tình cảm — phả hệ là phả hệ");
  const aChong = A("sử liệu và di truyền học");
  const aSoi = A("ta soi");
  const pL = easeOut3(clamp01((frame - (aDoi * dur + 4)) / 22));
  const pR = easeOut3(clamp01((frame - (aDoi * dur + 8)) / 22));
  return (
    <Paper>
      <div style={STAGE}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(24,16,10,0.82)" }} />
        {/* vế trái — tình cảm */}
        <div style={{ position: "absolute", left: 130, top: 215, width: 760, height: 545,
          border: `3px solid ${warnA(0.85)}`, borderRadius: 18, background: warnA(0.1),
          transform: `translateX(${lerp(-160, 0, pL)}px)`, opacity: pL, padding: 34, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.display, fontSize: 86, color: C.warn, letterSpacing: 6 }}>TÌNH CẢM</div>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute, marginTop: 26 }}>
            khát khao cội nguồn — ký ức tộc người
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 14, fontStyle: "italic" }}>
            đáng trọng, không ai nói dối
          </div>
        </div>
        {/* vế phải — phả hệ */}
        <div style={{ position: "absolute", left: 1030, top: 215, width: 760, height: 545,
          border: `3px solid ${tealA(0.85)}`, borderRadius: 18, background: tealA(0.08),
          transform: `translateX(${lerp(160, 0, pR)}px)`, opacity: pR, padding: 34, textAlign: "center" }}>
          <div style={{ fontFamily: FONT.display, fontSize: 86, color: C.teal, letterSpacing: 6 }}>PHẢ HỆ</div>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.mute, marginTop: 26 }}>
            muốn đứng vững — phải được chống
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.teal, marginTop: 14 }}>
            sử liệu · di truyền học
          </div>
        </div>
        {/* biên sáng mảnh ở giữa */}
        <InkDraw d="M 960 205 L 960 770" startFrac={aDoi + 8 / dur} endFrac={aDoi + 26 / dur}
          stroke="rgba(232,220,200,0.95)" strokeWidth={3} style={INKSVG} />
        <div style={{ position: "absolute", left: 958, top: 205, width: 4, height: 565,
          background: "linear-gradient(180deg, transparent, rgba(232,220,200,0.35), transparent)" }} />
        {/* câu chống */}
        <Reveal startFrac={aChong} dy={12} style={{ position: "absolute", left: 180, top: 800, width: 1560 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 38, color: C.cream }}>
            một tấm phả hệ muốn đứng vững phải được chống bằng{" "}
            <span style={{ color: C.teal, fontWeight: 700 }}>sử liệu</span> và{" "}
            <span style={{ color: C.teal, fontWeight: 700 }}>di truyền học</span>
          </div>
        </Reveal>
        {/* chốt: ta soi */}
        <SpringPop startFrac={aSoi} from={0.55} style={{ position: "absolute", left: 770, top: 878, width: 380 }}>
          <div style={{ textAlign: "center", border: `6px solid ${C.warn}`, color: C.warn,
            fontFamily: FONT.display, fontSize: 90, padding: "4px 0 14px", transform: "rotate(-4deg)",
            letterSpacing: 10, background: "rgba(20,10,8,0.6)" }}>
            TA SOI
          </div>
        </SpringPop>
      </div>
      <WipeInk startFrac={0.9} color={C.bg} />
    </Paper>
  );
};

// sc036 — BA LỚP ĐÈ NHAU trên mặt đồng (s18)
export const Sc036: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (n: number) => n / dur;
  const a1 = A("Người Hán thấy chiến thần");
  const a2 = A("Người H'Mông thấy vua tổ");
  const a3 = A("Người Việt thấy thủy tổ");
  return (
    <Paper>
      <div style={STAGE}>
        {/* gương chiếm gần toàn khung */}
        <div style={{ position: "absolute", left: 90, top: 90, width: 1740, height: 900, borderRadius: 60,
          border: `12px solid ${bronzeA(0.8)}`,
          background: "radial-gradient(ellipse at 50% 42%, rgba(120,86,46,0.34), rgba(52,34,16,0.28) 62%, rgba(94,66,34,0.44))",
          boxShadow: "inset 0 0 130px rgba(46,28,12,0.6)" }} />
        {/* lớp 1 — chiến thần (hổ phách) */}
        <Reveal startFrac={a1} dy={18} style={{ position: "absolute", left: 420, top: 190, width: 480, height: 520 }}>
          <div style={{ position: "relative", width: 480, height: 520 }}>
            <div style={{ position: "absolute", left: 60, top: 40, width: 360, height: 360, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(217,164,65,0.42), transparent 70%)", mixBlendMode: "screen" }} />
            <Reveal startFrac={a1 + F(16)} dy={10}
              style={{ position: "absolute", left: 0, top: 452, width: 480 }}>
              <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 48, color: C.amber,
                letterSpacing: 6 }}>CHIẾN THẦN</div>
            </Reveal>
            <div style={{ position: "absolute", left: 0, top: 0, padding: "6px 18px",
              border: `2px solid ${C.amber}`, borderRadius: 999, fontFamily: FONT.body, fontSize: 24,
              color: C.amber, letterSpacing: 4 }}>NGƯỜI HÁN</div>
          </div>
        </Reveal>
        <InkDraw d="M 660 286 L 660 610" startFrac={a1 + F(4)} endFrac={a1 + F(20)}
          stroke={C.amber} strokeWidth={9} style={INKSVG} />
        <InkDraw d="M 590 322 C 590 286 730 286 730 322 L 730 398 L 590 398 Z" startFrac={a1 + F(12)}
          endFrac={a1 + F(30)} stroke={C.amber} strokeWidth={9} style={INKSVG} />
        {/* lớp 2 — vua tổ (đỏ trầm) */}
        <Reveal startFrac={a2} dy={18} style={{ position: "absolute", left: 1020, top: 190, width: 480, height: 520 }}>
          <div style={{ position: "relative", width: 480, height: 520 }}>
            <div style={{ position: "absolute", left: 60, top: 40, width: 360, height: 360, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(200,85,61,0.40), transparent 70%)", mixBlendMode: "screen" }} />
            <Reveal startFrac={a2 + F(16)} dy={10}
              style={{ position: "absolute", left: 0, top: 452, width: 480 }}>
              <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 48, color: C.warn,
                letterSpacing: 6 }}>VUA TỔ</div>
            </Reveal>
            <div style={{ position: "absolute", left: 0, top: 0, padding: "6px 18px",
              border: `2px solid ${C.warn}`, borderRadius: 999, fontFamily: FONT.body, fontSize: 24,
              color: C.warn, letterSpacing: 4 }}>NGƯỜI H'MONG</div>
          </div>
        </Reveal>
        <InkDraw d="M 1170 562 L 1170 410 L 1225 482 L 1260 390 L 1295 482 L 1350 410 L 1350 562 Z"
          startFrac={a2 + F(4)} endFrac={a2 + F(24)} stroke={C.warn} strokeWidth={9} style={INKSVG} />
        {/* lớp 3 — thủy tổ (teal) */}
        <Reveal startFrac={a3} dy={18} style={{ position: "absolute", left: 720, top: 430, width: 480, height: 520 }}>
          <div style={{ position: "relative", width: 480, height: 520 }}>
            <div style={{ position: "absolute", left: 60, top: 40, width: 360, height: 360, borderRadius: "50%",
              background: `radial-gradient(circle, rgba(127,209,200,${0.3 + 0.1 * Math.sin(frame * 0.25)}), transparent 70%)`,
              mixBlendMode: "screen" }} />
            <Reveal startFrac={a3 + F(16)} dy={10}
              style={{ position: "absolute", left: 0, top: 452, width: 480 }}>
              <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 48, color: C.teal,
                letterSpacing: 6 }}>THỦY TỔ</div>
            </Reveal>
            <div style={{ position: "absolute", left: 0, top: 0, padding: "6px 18px",
              border: `2px solid ${C.teal}`, borderRadius: 999, fontFamily: FONT.body, fontSize: 24,
              color: C.teal, letterSpacing: 4 }}>NGƯỜI VIỆT</div>
          </div>
        </Reveal>
        <InkDraw d="M 960 600 L 960 810" startFrac={a3 + F(4)} endFrac={a3 + F(18)}
          stroke={C.teal} strokeWidth={9} style={INKSVG} />
        <InkDraw d="M 960 600 C 938 566 924 550 916 522 M 960 600 C 982 566 996 550 1004 522"
          startFrac={a3 + F(12)} endFrac={a3 + F(28)} stroke={C.teal} strokeWidth={8} style={INKSVG} />
        <InkDraw d="M 960 810 C 934 810 918 822 904 838 M 960 810 C 986 810 1002 822 1016 838"
          startFrac={a3 + F(18)} endFrac={a3 + F(32)} stroke={C.teal} strokeWidth={8} style={INKSVG} />
        <Reveal startFrac={a3 + F(45)} dy={-8}
          style={{ position: "absolute", left: 260, top: 975, width: 1400 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.body, fontSize: 32, fontStyle: "italic",
            color: C.mute }}>
            ba lớp phản chiếu đè lên nhau trên mặt đồng — không lớp nào xóa lớp nào
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc037 — MINI-REVEAL HỒI 2 + MỞ PHIÊN TÒA (s18)
export const Sc037: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (n: number) => n / dur;
  const a1 = A("tấm gương phản chiếu điều mỗi tộc người muốn nhớ");
  const a2 = A("không lớp nào là kẻ nói dối");
  const a3 = A("Đèn phiên tòa bật sáng");
  const dark = clamp01((frame - a3 * dur) / 20) * 0.45;
  const benchP = easeOut3(clamp01((frame - (a3 * dur + 18)) / 20));
  const cells = ["蚩尤", "九黎", "三苗", "百越"];
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: `rgba(12,8,5,${dark})` }} />
      <div style={STAGE}>
        {/* câu reveal đóng khung */}
        <Reveal startFrac={a1} dy={16} style={{ position: "absolute", left: 180, top: 96, width: 1560 }}>
          <LegendFrame label="HỒI HAI — KẾT">
            <div style={{ fontFamily: FONT.display, fontSize: 46, fontStyle: "italic", color: C.cream,
              textAlign: "center", padding: "16px 40px" }}>
              « Xi Vưu như tấm gương phản chiếu điều mỗi tộc người muốn nhớ. »
            </div>
            <Reveal startFrac={a2} dy={8}>
              <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, textAlign: "center" }}>
                ba ký ức đều đáng trọng — không lớp nào là kẻ nói dối
              </div>
            </Reveal>
          </LegendFrame>
        </Reveal>
        {/* gương + sơ đồ viral ghim như tang vật */}
        <div style={{ position: "absolute", left: 560, top: 380, width: 800, height: 470, borderRadius: 44,
          border: `10px solid ${bronzeA(0.7)}`,
          background: "radial-gradient(ellipse at 50% 40%, rgba(120,86,46,0.30), rgba(52,34,16,0.26) 65%, rgba(94,66,34,0.4))",
          boxShadow: "inset 0 0 70px rgba(46,28,12,0.55)" }} />
        {frame > a3 * dur + 2 && (
          <div style={{ position: "absolute", left: 947, top: 408, width: 26, height: 26, borderRadius: 13,
            background: C.warn, boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }} />
        )}
        {cells.map((c, i) => (
          <React.Fragment key={c}>
            {i > 0 && (
              <InkDraw d={`M 960 ${542 + 92 * (i - 1)} L 960 ${472 + 92 * i}`}
                startFrac={a3 + F(8 + i * 6)} endFrac={a3 + F(14 + i * 6)}
                stroke={C.warn} strokeWidth={4} style={INKSVG} />
            )}
            <Reveal startFrac={a3 + F(6 + i * 6)} dy={10}
              style={{ position: "absolute", left: 885, top: 480 + 92 * i, width: 150 }}>
              <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center",
                border: `2px solid ${bronzeA(0.9)}`, borderRadius: 10, background: "rgba(28,18,10,0.5)",
                fontFamily: FONT.hanzi, fontSize: 44, color: C.cream }}>{c}</div>
            </Reveal>
          </React.Fragment>
        ))}
        <Reveal startFrac={a3 + F(24)} style={{ position: "absolute", left: 64, top: 48 }}>
          <Chip color={C.warn}>TANG VẬT — PHIÊN TÒA</Chip>
        </Reveal>
        {/* án đài trượt lên */}
        <div style={{ position: "absolute", left: 260, top: 880, width: 1400, height: 130,
          background: "linear-gradient(180deg, #4a2f18, #2a1a0c)", borderTop: `4px solid ${C.amber}`,
          borderRadius: "8px 8px 0 0", opacity: benchP, transform: `translateY(${lerp(160, 0, benchP)}px)` }}>
          <Reveal startFrac={a3 + F(34)} dy={-6} style={{ position: "absolute", left: 0, top: 42, width: 1400 }}>
            <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 40, color: C.cream,
              letterSpacing: 12 }}>
              ÁN ĐÀI — HỒI BA
            </div>
          </Reveal>
        </div>
      </div>
      <WipeInk startFrac={0.9} color={C.bg} />
    </Paper>
  );
};

// sc038 — PHIÊN TÒA: MŨI TÊN 1 CHỜ XÉT (s19)
export const Sc038: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (n: number) => n / dur;
  const a1 = A("Bốn mũi tên, bốn phiên xử");
  const a2 = A("Mũi tên thứ nhất");
  const a3 = A("vua của Cửu Lê");
  const sweep = easeOut3(clamp01((frame - (a2 * dur - 16)) / 16));
  const cells: Array<{ h: string; y: number; last?: boolean }> = [
    { h: "蚩尤", y: 300 }, { h: "九黎", y: 460 }, { h: "三苗", y: 620 },
    { h: "百越", y: 780 }, { h: "người Việt", y: 920, last: true },
  ];
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(12,8,5,0.55)" }} />
      <div style={STAGE}>
        <div style={{ position: "absolute", left: 120, top: 84, width: 1560 }}>
          <SceneTitle eyebrow="HỒI BA — PHIÊN 1/4" title="MŨI TÊN THỨ NHẤT" startFrac={a1} titleSize={72} />
        </div>
        {/* đèn rọi hẹp quét tới mũi tên 1 */}
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${lerp(-300, 0, sweep)}px)` }}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={INKSVG}>
            {frame > a2 * dur - 16 && (
              <polygon points="880,-40 1040,-40 1170,470 750,470" fill="url(#sc038cone)" />
            )}
            <defs>
              <linearGradient id="sc038cone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(250,240,210,0.30)" />
                <stop offset="100%" stopColor="rgba(250,240,210,0.02)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        {/* sơ đồ dọc giữa — mũi tên 1 sáng, còn lại mờ */}
        {cells.map((c, i) => {
          const lit = i <= 1;
          const at = a1 + F(4 + i * 7);
          return (
            <React.Fragment key={c.h}>
              {i > 0 && (
                <InkDraw d={`M 960 ${cells[i - 1].y + 66} L 960 ${c.y - 8}`} startFrac={at}
                  endFrac={at + F(8)} stroke={lit && i === 1 ? C.warn : bronzeA(0.55)}
                  strokeWidth={lit && i === 1 ? 6 : 3} style={INKSVG} />
              )}
              <Reveal startFrac={at} dy={10}
                style={{ position: "absolute", left: 960 - (c.last ? 110 : 80), top: c.y, width: c.last ? 220 : 160 }}>
                <div style={{
                  height: c.last ? 52 : 64, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${lit ? C.cream : bronzeA(0.6)}`, borderRadius: 10,
                  background: lit ? "rgba(28,18,10,0.6)" : "rgba(28,18,10,0.3)",
                  fontFamily: c.last ? FONT.body : FONT.hanzi, fontSize: c.last ? 26 : 44,
                  color: c.last ? C.mute : C.cream, opacity: lit ? 1 : 0.4,
                  boxShadow: i === 1 && frame > a2 * dur
                    ? `0 0 ${20 + 10 * Math.abs(Math.sin(frame * 0.3))}px rgba(220,60,50,0.45)` : "none" }}>
                  {c.h}
                </div>
              </Reveal>
            </React.Fragment>
          );
        })}
        {/* nhãn cáo trạng */}
        <SpringPop startFrac={a3} from={0.7} style={{ position: "absolute", left: 1200, top: 330, width: 560 }}>
          <div style={{ position: "relative", padding: "22px 30px", border: `4px solid ${C.warn}`,
            borderRadius: 14, background: "rgba(26,10,8,0.85)" }}>
            <div style={{ fontFamily: FONT.body, fontSize: 24, letterSpacing: 8, color: C.warn }}>CÁO TRẠNG</div>
            <div style={{ fontFamily: FONT.display, fontSize: 44, color: C.cream, marginTop: 10 }}>
              « Xi Vưu là vua của Cửu Lê? »
            </div>
            <Reveal startFrac={a3 + F(22)} dy={8}>
              <div style={{ fontFamily: FONT.body, fontSize: 26, fontStyle: "italic", color: C.mute, marginTop: 12 }}>
                nghe rất chắc — thử đặt lên ánh nến
              </div>
            </Reveal>
          </div>
        </SpringPop>
        {/* bốn phiên xử */}
        {[1, 2, 3, 4].map((i) => (
          <Reveal key={i} startFrac={a1 + F(10 + i * 6)} dy={8}
            style={{ position: "absolute", left: 1050, top: 436 + 92 * i, width: 150 }}>
            <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 999, border: `2px solid ${i === 1 ? C.warn : bronzeA(0.7)}`,
              fontFamily: FONT.body, fontSize: 22, letterSpacing: 3,
              color: i === 1 ? C.warn : C.mute, background: "rgba(28,18,10,0.6)" }}>
              PHIÊN {i}/4
            </div>
          </Reveal>
        ))}
        {/* đèn dầu phiên tòa */}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={INKSVG}>
          <Lamp x={1790} y={910} scale={1.1} lit={0.9} pulse={frame / 30} />
        </svg>
      </div>
      <WipeInk startFrac={0} color={C.bg} />
    </Paper>
  );
};

// sc039 — QUOTE-CARD PHIÊN 1 (s19)
export const Sc039: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame } = useFrac();
  const a1 = A("Không một câu cổ thư nào chép thẳng");
  const a2 = A("diễn giải của hậu thế");
  const a3 = A("Cửu Lê chỉ noi theo Xi Vưu mà phụng thờ");
  return (
    <Paper>
      <DossierBadge text="HỒ SƠ — PHIÊN 1" />
      <div style={STAGE}>
        {/* quote-card giữa-trái */}
        <Reveal startFrac={a1} dy={16} style={{ position: "absolute", left: 140, top: 300, width: 1020 }}>
          <div style={{ position: "relative", border: `3px double ${bronzeA(0.9)}`, borderRadius: 6,
            background: "rgba(255,250,235,0.05)", padding: "44px 56px", height: 460 }}>
            <div style={{ fontFamily: FONT.body, fontSize: 24, letterSpacing: 8, color: C.amber }}>
              CỔ THƯ — KIỂM TRA GÁN NGỌN</div>
            <Reveal startFrac={a1 + 0.03} dy={10}>
              <div style={{ fontFamily: FONT.display, fontSize: 50, color: C.cream, marginTop: 24, lineHeight: 1.3 }}>
                không một câu cổ thư nào<br />chép thẳng việc đó
              </div>
            </Reveal>
            <Reveal startFrac={a2} dy={10}>
              <div style={{ fontFamily: FONT.body, fontSize: 33, color: C.mute, marginTop: 26 }}>
                đặt Xi Vưu lên ngôi vua Cửu Lê — là{" "}
                <span style={{ color: C.warn }}>diễn giải của hậu thế</span>
              </div>
            </Reveal>
            <div style={{ position: "absolute", left: 56, bottom: 26, fontFamily: FONT.body, fontSize: 24,
              color: C.mute, opacity: 0.5 + 0.3 * Math.sin(frame * 0.15) }}>— hồ sơ phiên 1</div>
          </div>
        </Reveal>
        {/* nhãn địa danh — khung phải */}
        <Reveal startFrac={a2 + 0.04} dy={14} style={{ position: "absolute", left: 1260, top: 320, width: 540 }}>
          <LegendFrame label="ĐỊA DANH">
            <div style={{ textAlign: "center", padding: "26px 20px 30px" }}>
              <div style={{ fontFamily: FONT.hanzi, fontSize: 116, color: C.cream, lineHeight: 1.1 }}>九黎</div>
              <Reveal startFrac={a2 + 0.06} dy={0}>
                <div style={{ height: 3, background: C.amber, margin: "14px 100px 0" }} />
              </Reveal>
              <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.amber, marginTop: 22 }}>
                Cửu Lê thành — Bành Thủy</div>
              <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute, marginTop: 12 }}>
                bộ tộc có thật trong sử sách</div>
            </div>
          </LegendFrame>
        </Reveal>
        {/* ghi chú học giả chép ngược */}
        <Reveal startFrac={a3} dy={12} style={{ position: "absolute", left: 140, top: 840, width: 1640 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, fontStyle: "italic", color: C.mute }}>
            ▸ ngay trong giới cổ học — có học giả còn chép ngược lại:{" "}
            <span style={{ color: C.teal }}>« Cửu Lê chỉ noi theo Xi Vưu mà phụng thờ »</span>
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc040 — PHÁN MŨI TÊN 1: "LỎNG" (s19)
export const Sc040: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (n: number) => n / dur;
  const a1 = A("noi theo một vị anh hùng");
  const a2 = A("hai chuyện khác hẳn nhau");
  const a3 = A("lỏng");
  const a3f = a3 * dur;
  const p = clamp01((frame - a3f) / 10);
  const dy = -420 * (1 - p * p);
  const sc = 1.9 - 0.9 * p;
  const dt = Math.max(0, frame - a3f - 10);
  const dx = 7 * Math.sin(dt * 2.4) * Math.exp(-dt * 0.22);
  const dim = 1 - 0.2 * clamp01((frame - a3f - 10) / 15);
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, background: "rgba(12,8,5,0.55)" }} />
      <div style={STAGE}>
        <div style={{ position: "absolute", inset: 0, opacity: dim }}>
          {/* mũi tên 1 giữa khung */}
          <div style={{ position: "absolute", left: 460, top: 430, width: 220, height: 100, display: "flex",
            alignItems: "center", justifyContent: "center", border: `3px solid ${C.cream}`,
            borderRadius: 12, fontFamily: FONT.display, fontSize: 46, color: C.cream,
            background: "rgba(28,18,10,0.6)" }}>Xi Vưu</div>
          <InkDraw d="M 700 480 L 1180 480" startFrac={a3 - F(60)} endFrac={a3 - F(46)}
            stroke={C.warn} strokeWidth={7} style={INKSVG} />
          <InkDraw d="M 1180 480 L 1128 462 M 1180 480 L 1128 498" startFrac={a3 - F(48)}
            endFrac={a3 - F(40)} stroke={C.warn} strokeWidth={7} style={INKSVG} />
          <div style={{ position: "absolute", left: 1240, top: 430, width: 220, height: 100, display: "flex",
            alignItems: "center", justifyContent: "center", border: `3px solid ${C.cream}`,
            borderRadius: 12, fontFamily: FONT.display, fontSize: 46, color: C.cream,
            background: "rgba(28,18,10,0.6)" }}>Cửu Lê</div>
          {/* hai vế đối chiếu */}
          <Reveal startFrac={a1} dy={14} style={{ position: "absolute", left: 180, top: 660, width: 640 }}>
            <div style={{ padding: "20px 26px", border: `3px solid ${tealA(0.85)}`, borderRadius: 14,
              background: tealA(0.08), fontFamily: FONT.display, fontSize: 36, color: C.teal,
              textAlign: "center" }}>
              « noi theo một vị anh hùng »
            </div>
          </Reveal>
          <Reveal startFrac={a1 + F(12)} dy={14} style={{ position: "absolute", left: 1100, top: 660, width: 640 }}>
            <div style={{ padding: "20px 26px", border: `3px solid ${warnA(0.7)}`, borderRadius: 14,
              background: warnA(0.08), fontFamily: FONT.display, fontSize: 36, color: C.warn,
              textAlign: "center", opacity: 0.85 }}>
              « do ông làm vua »
            </div>
          </Reveal>
          <SpringPop startFrac={a2} from={0.4} style={{ position: "absolute", left: 880, top: 668, width: 160 }}>
            <div style={{ fontFamily: FONT.display, fontSize: 100, color: C.warn, textAlign: "center" }}>≠</div>
          </SpringPop>
          <Reveal startFrac={a2 + F(14)} dy={8} style={{ position: "absolute", left: 360, top: 845, width: 1200 }}>
            <div style={{ textAlign: "center", fontFamily: FONT.body, fontSize: 30, fontStyle: "italic",
              color: C.mute }}>
              hai chuyện khác hẳn nhau
            </div>
          </Reveal>
        </div>
        {/* tem phán verdict rơi ép xuống mũi tên */}
        {frame >= a3f && (
          <React.Fragment>
            <div style={{ position: "absolute", left: 770, top: 395, width: 380, height: 170,
              borderRadius: "50%", background: warnA(0.22), filter: "blur(18px)",
              transform: `scale(${0.6 + 0.5 * p})` }} />
            <div style={{ position: "absolute", left: 780, top: 400, width: 360, height: 160,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `8px solid ${C.warn}`, color: C.warn, fontFamily: FONT.display,
              fontSize: 108, letterSpacing: 20, background: "rgba(26,10,8,0.72)",
              transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(-8deg)` }}>LỎNG</div>
          </React.Fragment>
        )}
      </div>
      <WipeInk startFrac={0.9} color={C.bg} />
    </Paper>
  );
};

// sc041 — QUOTE-CARD QUÝ NHẤT — PHIÊN 2 (s20)
export const Sc041: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (n: number) => n / dur;
  const a1 = A("Mũi tên thứ hai");
  const a2 = A("Tam Miêu phục Cửu Lê chi đức");
  const a3 = A("Quốc ngữ Sở ngữ");
  return (
    <Paper>
      <div style={STAGE}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(24,16,10,0.6)" }} />
        {/* mũi tên 2 chờ xét */}
        <SpringPop startFrac={a1} from={0.7} style={{ position: "absolute", left: 660, top: 110, width: 600 }}>
          <div style={{ padding: "14px 0", textAlign: "center", border: `3px solid ${C.warn}`,
            borderRadius: 999, fontFamily: FONT.body, fontSize: 28, letterSpacing: 6, color: C.warn,
            background: "rgba(26,10,8,0.75)",
            boxShadow: `0 0 ${14 + 8 * Math.abs(Math.sin(frame * 0.3))}px rgba(220,60,50,0.4)` }}>
            MŨI TÊN THỨ HAI — PHIÊN 2/4
          </div>
        </SpringPop>
        {/* chữ Hán hai bên */}
        <Reveal startFrac={a2} dy={0} style={{ position: "absolute", left: 130, top: 330, width: 180 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.hanzi, fontSize: 130, color: C.cream,
            opacity: 0.5, lineHeight: 1.25 }}>
            三<br />苗
          </div>
        </Reveal>
        <Reveal startFrac={a2 + F(6)} dy={0} style={{ position: "absolute", left: 1610, top: 330, width: 180 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.hanzi, fontSize: 130, color: C.cream,
            opacity: 0.5, lineHeight: 1.25 }}>
            九<br />黎
          </div>
        </Reveal>
        {/* trích nguyên văn — từng vế khắc theo nhịp ngắt */}
        <Reveal startFrac={a2} dy={18} style={{ position: "absolute", left: 0, top: 300, width: 1920 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 88, color: C.cream }}>
            Tam Miêu</div>
        </Reveal>
        <Reveal startFrac={a2 + F(20)} dy={18} style={{ position: "absolute", left: 0, top: 448, width: 1920 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 100, fontStyle: "italic",
            color: C.warn }}>phục</div>
        </Reveal>
        <Reveal startFrac={a2 + F(40)} dy={18} style={{ position: "absolute", left: 0, top: 620, width: 1920 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 88, color: C.cream }}>
            Cửu Lê chi đức</div>
        </Reveal>
        <InkDraw d="M 850 596 L 1070 596" startFrac={a2 + F(26)} endFrac={a2 + F(40)}
          stroke={C.warn} strokeWidth={4} style={INKSVG} />
        {/* nguồn */}
        <InkDraw d="M 810 770 L 1110 770" startFrac={a3} endFrac={a3 + F(12)}
          stroke={C.amber} strokeWidth={3} style={INKSVG} />
        <Reveal startFrac={a3} dy={10} style={{ position: "absolute", left: 0, top: 800, width: 1920 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.body, fontSize: 36, color: C.mute,
            letterSpacing: 6 }}>
            — Quốc ngữ Sở ngữ —
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc042 — GIẢI PHẪU CHỮ "PHỤC" (s20)
export const Sc042: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (n: number) => n / dur;
  const a1 = A("phục");
  const a2 = A("noi theo, tôn theo");
  const a3 = A("Cửu Lê chi đức");
  return (
    <Paper>
      <div style={STAGE}>
        <Reveal startFrac={a1} style={{ position: "absolute", left: 64, top: 48 }}>
          <Chip color={C.amber}>GIẢI PHẪU MỘT CHỮ</Chip>
        </Reveal>
        {/* nhánh đúng — noi theo (đức) */}
        <Reveal startFrac={a2} dy={12} style={{ position: "absolute", left: 420, top: 150, width: 1080 }}>
          <div style={{ position: "relative", height: 196, padding: "24px 34px",
            border: `3px solid ${tealA(0.85)}`, borderRadius: 14, background: tealA(0.07) }}>
            <div style={{ fontFamily: FONT.display, fontSize: 44, color: C.teal, letterSpacing: 4 }}>
              NOI THEO (ĐỨC)</div>
            <Reveal startFrac={a2 + F(8)} dy={8}>
              <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 14 }}>
                phục — là <span style={{ color: C.teal, fontWeight: 700 }}>noi theo, tôn theo</span>
              </div>
            </Reveal>
            <Reveal startFrac={a3} dy={8}>
              <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.mute, marginTop: 10 }}>
                Cửu Lê chi đức — cái đức của Cửu Lê · noi theo hành vi
              </div>
            </Reveal>
          </div>
        </Reveal>
        {/* chữ phục phóng lớn giữa */}
        <SpringPop startFrac={a1} from={0.5} style={{ position: "absolute", left: 610, top: 360, width: 700 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.display, fontSize: 230, fontStyle: "italic",
            color: C.cream,
            textShadow: `0 0 ${30 + 12 * Math.sin(frame * 0.2)}px rgba(127,209,200,0.45)` }}>
            phục
          </div>
        </SpringPop>
        <InkDraw d="M 960 356 L 960 348" startFrac={a2} endFrac={a2 + F(12)}
          stroke={C.teal} strokeWidth={4} style={INKSVG} />
        <InkDraw d="M 960 652 L 960 752" startFrac={a3 + F(24)} endFrac={a3 + F(36)}
          stroke={C.mute} strokeWidth={3} style={INKSVG} />
        {/* nhánh sai — sinh ra từ (huyết thống), bị gạch ngang */}
        <Reveal startFrac={a3 + F(22)} dy={12} style={{ position: "absolute", left: 420, top: 760, width: 1080 }}>
          <div style={{ position: "relative", height: 186, padding: "24px 34px",
            border: `2px solid ${bronzeA(0.6)}`, borderRadius: 14, background: "rgba(255,250,235,0.03)",
            opacity: 0.9 }}>
            <div style={{ fontFamily: FONT.display, fontSize: 40, color: C.mute, letterSpacing: 4 }}>
              SINH RA TỪ (HUYẾT THỐNG)</div>
            <Reveal startFrac={a3 + F(32)} dy={8}>
              <div style={{ fontFamily: FONT.body, fontSize: 30, fontStyle: "italic", color: C.mute,
                marginTop: 14 }}>
                không phải sinh ra từ huyết thống
              </div>
            </Reveal>
          </div>
        </Reveal>
        <InkDraw d="M 470 852 L 1450 852" startFrac={a3 + F(46)} endFrac={a3 + F(62)}
          stroke={C.warn} strokeWidth={5} style={INKSVG} />
      </div>
    </Paper>
  );
};

// sc043 — ĐÀY RA TAM NGUY + PHÁN (s20)
export const Sc043: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (n: number) => n / dur;
  const a1 = A("Thuấn đày Tam Miêu ra Tam Nguy");
  const a2 = A("Đôn Hoàng");
  const a3 = A("dịch sai một chữ");
  const a3f = a3 * dur;
  const p = clamp01((frame - a3f) / 10);
  const dy = -380 * (1 - p * p);
  const sc = 1.8 - 0.85 * p;
  const dt = Math.max(0, frame - a3f - 10);
  const dx = 6 * Math.sin(dt * 2.4) * Math.exp(-dt * 0.22);
  return (
    <Paper>
      <div style={STAGE}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(30,20,12,0.35)" }} />
        {/* bản đồ mực nâu */}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={INKSVG}>
          <InkPath d="M 180 720 C 300 540 520 450 760 420 C 980 392 1130 320 1230 200 C 1150 360 1060 540 880 660 C 700 780 380 820 180 720 Z"
            startFrac={a1 - F(60)} endFrac={a1 - F(30)} stroke={C.earth} strokeWidth={5} />
          <InkPath d="M 240 780 C 420 660 560 580 820 520" startFrac={a1 - F(50)} endFrac={a1 - F(30)}
            stroke={bronzeA(0.55)} strokeWidth={3} />
          <InkPath d="M 300 300 C 400 260 520 250 640 270" startFrac={a1 - F(45)} endFrac={a1 - F(29)}
            stroke={bronzeA(0.4)} strokeWidth={3} />
        </svg>
        {/* điểm xuất phát — Cửu Lê */}
        <div style={{ position: "absolute", left: 962, top: 738, width: 20, height: 20, borderRadius: 10,
          background: bronzeA(0.95), boxShadow: "0 0 12px rgba(201,143,78,0.6)" }} />
        <Reveal startFrac={a1 - F(20)} dy={8} style={{ position: "absolute", left: 880, top: 775, width: 200 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.body, fontSize: 32, color: C.cream }}>Cửu Lê</div>
        </Reveal>
        {/* đường đày ra tây bắc */}
        <InkDraw d="M 950 730 C 790 640 610 480 440 290" startFrac={a1} endFrac={a1 + F(40)}
          stroke={C.warn} strokeWidth={6} style={INKSVG} />
        <InkDraw d="M 440 290 L 474 300 M 440 290 L 454 320" startFrac={a1 + F(38)} endFrac={a1 + F(46)}
          stroke={C.warn} strokeWidth={6} style={INKSVG} />
        <InkDraw d={circleD(400, 250, 30)} startFrac={a2} endFrac={a2 + F(12)}
          stroke={C.amber} strokeWidth={4} style={INKSVG} />
        {frame > a2 * dur && (
          <div style={{ position: "absolute", left: 392, top: 242, width: 16, height: 16, borderRadius: 8,
            background: C.amber,
            boxShadow: `0 0 ${14 + 8 * Math.abs(Math.sin(frame * 0.3))}px rgba(217,164,65,0.8)` }} />
        )}
        <Reveal startFrac={a2} dy={8} style={{ position: "absolute", left: 470, top: 208, width: 400 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 36, color: C.amber, letterSpacing: 4 }}>TAM NGUY</div>
        </Reveal>
        <Reveal startFrac={a2 + F(10)} dy={8} style={{ position: "absolute", left: 470, top: 258, width: 500 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute }}>Đôn Hoàng — góc tây bắc</div>
        </Reveal>
        {/* dòng overlay thay cho từ bị bác */}
        <Reveal startFrac={a1 + F(52)} dy={10} style={{ position: "absolute", left: 320, top: 104, width: 1280 }}>
          <div style={{ padding: "16px 0", textAlign: "center", borderRadius: 999,
            border: `2px solid ${bronzeA(0.8)}`, background: "rgba(20,12,8,0.85)",
            fontFamily: FONT.display, fontSize: 40, color: C.cream }}>
            cổ thư chép: tán loạn — đày — dời dân
          </div>
        </Reveal>
        <Reveal startFrac={a2 + F(30)} dy={8} style={{ position: "absolute", left: 320, top: 196, width: 900 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.warn }}>
            — không cuốn nào chép:{" "}
            <span style={{ textDecoration: "line-through" }}>diệt chủng</span>
          </div>
        </Reveal>
        {/* tem phán: dịch sai một chữ */}
        {frame >= a3f && (
          <div style={{ position: "absolute", left: 1330, top: 800, width: 480, height: 120,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `7px solid ${C.warn}`, color: C.warn, fontFamily: FONT.display, fontSize: 46,
            letterSpacing: 6, background: "rgba(26,10,8,0.75)",
            transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(-6deg)` }}>
            DỊCH SAI MỘT CHỮ
          </div>
        )}
      </div>
      <SourceTag text="Cổ thư — chép tán loạn, đày ải, dời dân" bottom={64} right />
      <WipeInk startFrac={0.9} color={C.bg} />
    </Paper>
  );
};

// sc044 — LẬT TỪNG CUỐN — KIỂM KHO (s21)
export const Sc044: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const F = (n: number) => n / dur;
  const b = A("Ta lật từng cuốn");
  const e = A("Không một câu");
  const f = A("mắt xích mà hồ sơ tối nay có");
  const step = Math.max(6 / dur, (e - b) / 5);
  const books = [
    { t: "SỬ KÝ", h: 400 }, { t: "SƠN HẢI KINH", h: 430 }, { t: "QUỐC NGỮ", h: 370 },
    { t: "THIÊN VĂN", h: 410 }, { t: "ĐỊA CHÍ", h: 380 },
  ];
  return (
    <Paper>
      <div style={STAGE}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(12,8,5,0.5)" }} />
        <Reveal startFrac={b} style={{ position: "absolute", left: 64, top: 48 }}>
          <Chip color={C.amber}>KIỂM KHO — LẬT TỪNG CUỐN</Chip>
        </Reveal>
        {/* chồng cổ thư lệch trái — lật-úp tuần tự */}
        {books.map((bk, i) => {
          const pi = easeOut3(clamp01((frame - (b + i * step) * dur) / 14));
          const flipped = pi >= 0.95;
          return (
            <div key={bk.t} style={{ position: "absolute", left: 200 + i * 180, top: 830 - bk.h, width: 150,
              height: bk.h, borderRadius: "6px 6px 2px 2px", border: `2px solid ${bronzeA(0.8)}`,
              background: "linear-gradient(180deg, #3d2417, #2a180e)",
              transform: `scaleY(${1 - 0.8 * pi}) scaleX(${1 + 0.45 * pi})`, transformOrigin: "50% 100%",
              display: "flex", justifyContent: "center", paddingTop: 18 }}>
              <div style={{ writingMode: "vertical-rl", fontFamily: FONT.body, fontSize: 30, letterSpacing: 6,
                color: C.cream, opacity: 1 - 0.7 * pi,
                textDecoration: flipped ? "line-through" : "none" }}>{bk.t}</div>
              {flipped && (
                <div style={{ position: "absolute", top: 8, left: 62, width: 22, height: 22, borderRadius: 11,
                  background: C.warn, opacity: 0.85 }} />
              )}
            </div>
          );
        })}
        {/* bàn phiên tòa */}
        <div style={{ position: "absolute", left: 120, top: 830, width: 1800, height: 110,
          background: "linear-gradient(180deg, #4a2f18, #2a1a0c)", borderTop: `4px solid ${C.amber}`,
          borderRadius: "4px 4px 0 0" }} />
        <SpringPop startFrac={e} from={0.6} style={{ position: "absolute", left: 1120, top: 270, width: 700 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 66, color: C.warn, letterSpacing: 4 }}>
            KHÔNG MỘT CÂU.
          </div>
        </SpringPop>
        <Reveal startFrac={e + F(15)} dy={10} style={{ position: "absolute", left: 1120, top: 370, width: 700 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, fontStyle: "italic", color: C.mute }}>
            không một chữ nào chép Tam Miêu trở thành Bách Việt
          </div>
        </Reveal>
        {/* tờ trắng — khoảng trống của hồ sơ */}
        <SpringPop startFrac={e + F(26)} from={0.8} style={{ position: "absolute", left: 1330, top: 480, width: 360 }}>
          <div style={{ position: "relative", height: 270, background: "#f4eedd", transform: "rotate(3deg)",
            border: "1px solid rgba(120,100,70,0.4)", boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            outline: frame > f * dur
              ? `2px solid rgba(127,209,200,${0.3 + 0.5 * Math.abs(Math.sin(frame * 0.25))})` : "none" }}>
            <Reveal startFrac={f} dy={8} style={{ position: "absolute", left: 30, top: 36 }}>
              <div style={{ padding: "6px 16px", border: `2px solid ${C.teal}`, borderRadius: 999,
                fontFamily: FONT.body, fontSize: 22, letterSpacing: 4, color: "#0c5a52",
                background: "rgba(255,255,255,0.5)", display: "inline-block" }}>
                KHOẢNG TRẮNG
              </div>
            </Reveal>
          </div>
        </SpringPop>
        <Reveal startFrac={f + F(10)} dy={8} style={{ position: "absolute", left: 1120, top: 780, width: 740 }}>
          <div style={{ textAlign: "center", fontFamily: FONT.body, fontSize: 28, fontStyle: "italic",
            color: C.mute }}>
            trắng tinh — mắt xích mà hồ sơ tối nay có… tất cả
          </div>
        </Reveal>
        {/* đèn dầu trên bàn tòa */}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={INKSVG}>
          <Lamp x={1800} y={950} scale={1} lit={0.85} pulse={frame / 30} />
        </svg>
      </div>
      <WipeInk startFrac={0} color={C.bg} />
    </Paper>
  );
};
